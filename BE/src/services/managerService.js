/**
 * FILE: managerService.js
 * MÔ TẢ: Service cung cấp toàn bộ các nghiệp vụ dành cho Quản lý bãi xe (Manager Operational Engine).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. THỐNG KÊ DASHBOARD QUẢN LÝ (`getDashboardStats`): Tổng hợp công suất bãi đỗ (TotalSlots, Occupied, Available), doanh thu trong ngày, doanh thu 7 ngày gần nhất, tỷ lệ lấp đầy theo từng tầng (OccupancyPct), phân bổ loại xe đỗ thực tế.
 * 2. CẤU HÌNH CƠ SỞ VẬT CHẤT (Infrastructure Management): Quản lý Tòa nhà, Tầng, Khu vực và Vị trí đỗ xe.
 * 3. QUẢN LÝ BẢNG GIÁ VÀ ƯU ĐÃI (Pricing Policies): Xem và cập nhật chính sách giá niêm yết theo khung giờ ngày/đêm và từng loại phương tiện.
 * 4. XỬ LÝ SỰ CỐ VÀ HỖ TRỢ (Incidents & Support Tickets): Tiếp nhận báo cáo sự cố từ Nhân viên bảo vệ, phê duyệt / xử lý vé phạt hoặc bồi thường.
 * 
 * @module managerService
 */

import { getPool, sql } from "../config/db.js";

/**
 * HÀM 1: getDashboardStats
 * MỤC ĐÍCH: Thống kê số liệu tổng quan thời gian thực dành cho màn hình Dashboard Quản lý.
 * NGUỒN ĐẦU VÀO TỪ FE: Không truyền tham số (gọi từ `GET /api/manager/dashboard-stats`).
 * DỮ LIỆU TRẢ VỀ CHO FE: Object `kpis` (chỉ số tổng quan), `revenue7Days` (biểu đồ doanh thu), `floorOccupancy` (tỷ lệ lấp đầy), `vehicleBreakdown` (phân bổ xe), `recentCheckIns` (10 xe mới vào), `recentPayments` (10 hóa đơn mới nhất).
 */
export async function getDashboardStats(buildingId = null, managerUserId = null) {
  const pool = await getPool();

  const makeReq = () => pool.request()
    .input('buildingId', sql.Int, buildingId || null)
    .input('managerUserId', sql.Int, managerUserId || null);

  // 1. QUERY SLOT STATS: Đếm tổng số ô đỗ và phân loại trạng thái theo Tòa nhà
  const slotStats = await makeReq().query(`
    SELECT
      COUNT(ps.SlotID) AS TotalSlots,
      SUM(CASE WHEN ps.SlotStatus = 'Available'   THEN 1 ELSE 0 END) AS Available,
      SUM(CASE WHEN ps.SlotStatus = 'Occupied'    THEN 1 ELSE 0 END) AS Occupied,
      SUM(CASE WHEN ps.SlotStatus = 'Reserved'    THEN 1 ELSE 0 END) AS Reserved,
      SUM(CASE WHEN ps.SlotStatus = 'Maintenance' THEN 1 ELSE 0 END) AS Maintenance,
      SUM(CASE WHEN ps.SlotStatus = 'Blocked'     THEN 1 ELSE 0 END) AS Blocked
    FROM ParkingSlots ps
    JOIN Zones z ON ps.ZoneID = z.ZoneID
    JOIN Floors f ON z.FloorID = f.FloorID
    JOIN Buildings b ON f.BuildingID = b.BuildingID
    WHERE (@buildingId IS NULL OR b.BuildingID = @buildingId)
      AND (@managerUserId IS NULL OR b.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @managerUserId))
  `);

  // 2. QUERY SESSION STATS
  const sessionStats = await makeReq().query(`
    SELECT
      COUNT(*) AS TodaySessions,
      SUM(CASE WHEN s.SessionStatus = 'Active' THEN 1 ELSE 0 END) AS ActiveSessions
    FROM ParkingSessions s
    JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
    JOIN Zones z ON ps.ZoneID = z.ZoneID
    JOIN Floors f ON z.FloorID = f.FloorID
    WHERE CAST(s.EntryTime AS DATE) = CAST(GETDATE() AS DATE)
      AND (@buildingId IS NULL OR f.BuildingID = @buildingId)
      AND (@managerUserId IS NULL OR f.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @managerUserId))
  `);

  // 3. QUERY REVENUE TODAY
  const revenueToday = await makeReq().query(`
    SELECT ISNULL(SUM(ISNULL(p.FinalAmount, ISNULL(NULLIF(p.Amount, 0), ISNULL(p.PrepaidAmount, 0)))), 0) AS RevenueToday
    FROM Payments p
    JOIN ParkingSessions s ON p.SessionID = s.SessionID
    JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
    JOIN Zones z ON ps.ZoneID = z.ZoneID
    JOIN Floors f ON z.FloorID = f.FloorID
    WHERE p.PaymentStatus IN ('Completed', 'Prepaid')
      AND CAST(ISNULL(p.PaymentTime, p.PrepaidAt) AS DATE) = CAST(GETDATE() AS DATE)
      AND (@buildingId IS NULL OR f.BuildingID = @buildingId)
      AND (@managerUserId IS NULL OR f.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @managerUserId))
  `);

  // 4. QUERY REVENUE 7 DAYS
  const revenue7Days = await makeReq().query(`
    SELECT
      CAST(ISNULL(p.PaymentTime, p.SurchargePaidAt) AS DATE) AS Period,
      ISNULL(SUM(ISNULL(p.FinalAmount, p.Amount)), 0)        AS TotalRevenue
    FROM Payments p
    JOIN ParkingSessions s ON p.SessionID = s.SessionID
    JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
    JOIN Zones z ON ps.ZoneID = z.ZoneID
    JOIN Floors f ON z.FloorID = f.FloorID
    WHERE p.PaymentStatus IN ('Completed', 'Prepaid')
      AND ISNULL(p.PaymentTime, p.SurchargePaidAt) >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
      AND (@buildingId IS NULL OR f.BuildingID = @buildingId)
      AND (@managerUserId IS NULL OR f.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @managerUserId))
    GROUP BY CAST(ISNULL(p.PaymentTime, p.SurchargePaidAt) AS DATE)
    ORDER BY Period
  `);

  // 5. QUERY FLOOR OCCUPANCY
  const floorOccupancy = await makeReq().query(`
    SELECT
      f.FloorID,
      f.FloorName,
      COUNT(ps.SlotID) AS TotalSlots,
      SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END) AS OccupiedSlots,
      CASE WHEN COUNT(ps.SlotID) = 0 THEN 0
           ELSE ROUND(
             100.0 * SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END)
             / COUNT(ps.SlotID), 1)
      END AS OccupancyPct
    FROM Floors f
    JOIN Zones z         ON z.FloorID  = f.FloorID
    JOIN ParkingSlots ps ON ps.ZoneID  = z.ZoneID
    WHERE f.IsActive = 1
      AND (@buildingId IS NULL OR f.BuildingID = @buildingId)
      AND (@managerUserId IS NULL OR f.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @managerUserId))
    GROUP BY f.FloorID, f.FloorName
    ORDER BY f.FloorID
  `);

  // 6. QUERY VEHICLE BREAKDOWN
  const vehicleBreakdown = await makeReq().query(`
    SELECT
      vt.VehicleName,
      vt.VehicleCode,
      COUNT(*) AS Count
    FROM ParkingSessions s
    JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
    JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
    JOIN Zones z ON ps.ZoneID = z.ZoneID
    JOIN Floors f ON z.FloorID = f.FloorID
    WHERE s.SessionStatus = 'Active'
      AND (@buildingId IS NULL OR f.BuildingID = @buildingId)
      AND (@managerUserId IS NULL OR f.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @managerUserId))
    GROUP BY vt.VehicleTypeID, vt.VehicleName, vt.VehicleCode
  `);

  // 7. QUERY RECENT CHECK-INS
  const recentCheckIns = await makeReq().query(`
    SELECT TOP 10
      s.SessionID,
      CONCAT('SES-', RIGHT('0000' + CAST(s.SessionID AS VARCHAR), 4)) AS SessionCode,
      s.PlateNumber,
      ps.SlotCode,
      s.EntryTime,
      vt.VehicleName
    FROM ParkingSessions s
    JOIN ParkingSlots ps ON s.SlotID        = ps.SlotID
    JOIN Zones z ON ps.ZoneID = z.ZoneID
    JOIN Floors f ON z.FloorID = f.FloorID
    JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
    WHERE (@buildingId IS NULL OR f.BuildingID = @buildingId)
      AND (@managerUserId IS NULL OR f.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @managerUserId))
    ORDER BY s.EntryTime DESC
  `);

  // 8. QUERY RECENT PAYMENTS
  const recentPayments = await makeReq().query(`
    SELECT TOP 10
      p.PaymentID,
      CONCAT('SES-', RIGHT('0000' + CAST(s.SessionID AS VARCHAR), 4)) AS SessionCode,
      s.PlateNumber,
      ISNULL(p.FinalAmount, p.Amount) AS Amount,
      p.PaymentStatus,
      ISNULL(p.PaymentTime, p.SurchargePaidAt) AS PaymentTime,
      p.PaymentMethod
    FROM Payments p
    JOIN ParkingSessions s ON p.SessionID = s.SessionID
    JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
    JOIN Zones z ON ps.ZoneID = z.ZoneID
    JOIN Floors f ON z.FloorID = f.FloorID
    WHERE (@buildingId IS NULL OR f.BuildingID = @buildingId)
      AND (@managerUserId IS NULL OR f.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @managerUserId))
    ORDER BY ISNULL(p.PaymentTime, p.SurchargePaidAt) DESC
  `);

  const slot = slotStats.recordset[0];
  const sess = sessionStats.recordset[0];

  return {
    kpis: {
      totalSlots: slot?.TotalSlots || 0,
      available: slot?.Available || 0,
      occupied: slot?.Occupied || 0,
      reserved: slot?.Reserved || 0,
      maintenance: slot?.Maintenance || 0,
      revenueToday: revenueToday.recordset[0]?.RevenueToday || 0,
      todaySessions: sess?.TodaySessions || 0,
      activeSessions: sess?.ActiveSessions || 0,
    },
    revenue7Days: revenue7Days.recordset,
    floorOccupancy: floorOccupancy.recordset,
    vehicleBreakdown: vehicleBreakdown.recordset,
    recentCheckIns: recentCheckIns.recordset,
    recentPayments: recentPayments.recordset,
  };
}
function parseAttachments(raw) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
// ─────────────────────────────────────────────────────────────
// CONFIG – BUILDINGS
// ─────────────────────────────────────────────────────────────
export async function getBuildings(managerUserId = null) {
  const pool = await getPool();
  const request = pool.request();
  request.input("managerUserId", sql.Int, managerUserId || null);
  const result = await request.query(`
    SELECT
      b.BuildingID,
      b.BuildingName,
      b.Address,
      b.OperatingHours,
      b.OpenTime,
      b.CloseTime,
      b.Is247,
      b.TotalFloors,
      b.CreatedAt,
      b.UpdatedAt,
      COUNT(DISTINCT f.FloorID)  AS FloorCount,
      COUNT(DISTINCT ps.SlotID)  AS SlotCount
    FROM Buildings b
    LEFT JOIN BuildingAssignments ba ON b.BuildingID = ba.BuildingID
    LEFT JOIN Floors f        ON f.BuildingID = b.BuildingID AND f.IsActive = 1
    LEFT JOIN Zones z         ON z.FloorID    = f.FloorID
    LEFT JOIN ParkingSlots ps ON ps.ZoneID    = z.ZoneID
    WHERE (@managerUserId IS NULL OR ba.UserID = @managerUserId)
    GROUP BY b.BuildingID, b.BuildingName, b.Address, b.OperatingHours, b.OpenTime, b.CloseTime, b.Is247, b.TotalFloors, b.CreatedAt, b.UpdatedAt
    ORDER BY b.BuildingID
  `);
  return result.recordset;
}

export async function updateBuilding(buildingId, data) {
  const pool = await getPool();
  const lat = data.latitude !== undefined ? data.latitude : data.Latitude;
  const lng = data.longitude !== undefined ? data.longitude : data.Longitude;
  const totalFloorsVal = data.totalFloors !== undefined ? data.totalFloors : data.TotalFloors;

  if (totalFloorsVal !== undefined && totalFloorsVal !== null) {
    const newTotal = Number(totalFloorsVal);
    if (!Number.isInteger(newTotal) || newTotal < 1) {
      throw badRequest("Số tầng (TotalFloors) phải là số nguyên dương >= 1.", "INVALID_TOTAL_FLOORS");
    }

    const currentFloorsRes = await pool.request()
      .input("BuildingID", sql.Int, Number(buildingId))
      .query("SELECT FloorID, FloorName FROM Floors WHERE BuildingID = @BuildingID ORDER BY FloorID ASC");
    const existingFloors = currentFloorsRes.recordset;
    const currentCount = existingFloors.length;

    if (newTotal < currentCount) {
      const excessFloors = existingFloors.slice(newTotal);
      for (const f of excessFloors) {
        const activeRes = await pool.request()
          .input("FloorID", sql.Int, f.FloorID)
          .query(`
            SELECT TOP 1 ps.SlotID
            FROM ParkingSlots ps
            JOIN Zones z ON ps.ZoneID = z.ZoneID
            LEFT JOIN ParkingSessions psess ON ps.SlotID = psess.SlotID AND psess.SessionStatus = 'Active'
            LEFT JOIN Reservations r ON ps.SlotID = r.SlotID AND r.ReservationStatus = 'Reserved'
            WHERE z.FloorID = @FloorID AND (psess.SessionID IS NOT NULL OR r.ReservationID IS NOT NULL)
          `);
        if (activeRes.recordset.length > 0) {
          throw conflict(`Không thể giảm số tầng xuống ${newTotal} vì ${f.FloorName} đang có xe đỗ hoặc có đơn đặt chỗ trước.`, "FLOOR_HAS_ACTIVE_SESSIONS");
        }

        const zoneRes = await pool.request()
          .input("FloorID", sql.Int, f.FloorID)
          .query(`SELECT COUNT(*) AS zoneCount FROM Zones WHERE FloorID = @FloorID`);
        if (zoneRes.recordset[0].zoneCount > 0) {
          throw conflict(`Không thể giảm số tầng xuống ${newTotal} vì ${f.FloorName} vẫn còn chứa ${zoneRes.recordset[0].zoneCount} khu vực đỗ xe (Zone). Vui lòng di dời hoặc xóa các khu vực ở tầng này trước.`, "FLOOR_HAS_ZONES");
        }
      }

      for (const f of excessFloors) {
        await pool.request()
          .input("FloorID", sql.Int, f.FloorID)
          .query("DELETE FROM Floors WHERE FloorID = @FloorID");
      }
    } else if (newTotal > currentCount) {
      for (let i = currentCount + 1; i <= newTotal; i++) {
        await pool.request()
          .input("BuildingID", sql.Int, Number(buildingId))
          .input("FloorName", sql.NVarChar(50), `Tang ${i}`)
          .query("INSERT INTO Floors (BuildingID, FloorName, IsActive) VALUES (@BuildingID, @FloorName, 1)");
      }
    }
  }

  // UPDATE TÒA NHÀ & TỰ ĐỘNG CẬP NHẬT MỐC THỜI GIAN UpdatedAt = GETDATE()
  await pool.request()
    .input("BuildingID", sql.Int, buildingId)
    .input("BuildingName", sql.NVarChar(100), data.buildingName || data.BuildingName)
    .input("Address", sql.NVarChar(200), data.address || data.Address || null)
    .input("OperatingHours", sql.NVarChar(50), data.operatingHours || data.OperatingHours || null)
    .input("TotalFloors", sql.Int, totalFloorsVal != null ? Number(totalFloorsVal) : null)
    .input("Latitude", sql.Decimal(9, 6), lat != null ? parseFloat(lat) : null)
    .input("Longitude", sql.Decimal(9, 6), lng != null ? parseFloat(lng) : null)
    .query(`
      UPDATE Buildings
      SET BuildingName   = ISNULL(@BuildingName, BuildingName),
          Address        = ISNULL(@Address, Address),
          OperatingHours = ISNULL(@OperatingHours, OperatingHours),
          TotalFloors    = ISNULL(@TotalFloors, TotalFloors),
          Latitude       = @Latitude,
          Longitude      = @Longitude,
          UpdatedAt      = GETDATE()
      WHERE BuildingID = @BuildingID
    `);

  const r = await pool.request()
    .input("BuildingID", sql.Int, buildingId)
    .query(`SELECT * FROM Buildings WHERE BuildingID = @BuildingID`);
  return r.recordset[0];
}

export async function createBuilding(data) {
  const pool = await getPool();
  const result = await pool.request()
    .input("BuildingName", sql.NVarChar(100), data.buildingName)
    .input("Address", sql.NVarChar(200), data.address || null)
    .input("OperatingHours", sql.NVarChar(50), data.operatingHours || '06:00 - 22:00')
    .input("OpenTime", sql.VarChar(8), data.openTime || '06:00:00')
    .input("CloseTime", sql.VarChar(8), data.closeTime || '22:00:00')
    .input("Is247", sql.Bit, data.is247 ? 1 : 0)
    .input("TotalFloors", sql.Int, data.totalFloors || 1)
    .query(`
      INSERT INTO Buildings (BuildingName, Address, OperatingHours, OpenTime, CloseTime, Is247, TotalFloors)
      OUTPUT INSERTED.*
      VALUES (@BuildingName, @Address, @OperatingHours, @OpenTime, @CloseTime, @Is247, @TotalFloors)
    `);
  const newBuilding = result.recordset[0];

  const floorCount = Number(data.totalFloors || 0);
  if (floorCount > 0) {
    for (let i = 1; i <= floorCount; i++) {
      await pool.request()
        .input('BuildingID', sql.Int, newBuilding.BuildingID)
        .input('FloorName', sql.NVarChar(50), `Tang ${i}`)
        .query(`INSERT INTO Floors (BuildingID, FloorName, IsActive) VALUES (@BuildingID, @FloorName, 1)`);
    }
  }

  return newBuilding;
}

export async function deleteBuilding(buildingId) {
  const pool = await getPool();
  await pool.request()
    .input("BuildingID", sql.Int, buildingId)
    .query(`DELETE FROM Buildings WHERE BuildingID = @BuildingID`);
  return { success: true, buildingId };
}

// ─────────────────────────────────────────────────────────────
// MANAGER STAFF MANAGEMENT (QUẢN LÝ NHÂN SỰ TÒA NHÀ)
// ─────────────────────────────────────────────────────────────
export async function getBuildingStaff(buildingId, managerUserId = null) {
  const pool = await getPool();
  const request = pool.request();
  request.input("BuildingID", sql.Int, buildingId);
  request.input("ManagerUserID", sql.Int, managerUserId || null);
  const result = await request.query(`
    SELECT ba.AssignmentID, ba.BuildingID, b.BuildingName, ba.UserID, u.FullName, u.Email, u.PhoneNumber, u.HireDate, u.IsActive, ba.IsPrimary, ba.AssignedDate
    FROM BuildingAssignments ba
    JOIN Users u ON ba.UserID = u.UserID
    JOIN Buildings b ON ba.BuildingID = b.BuildingID
    JOIN Roles r ON u.RoleID = r.RoleID
    WHERE ba.BuildingID = @BuildingID AND r.RoleName = 'Staff'
    ORDER BY ba.IsPrimary DESC, ba.AssignedDate DESC
  `);
  return result.recordset;
}

export async function assignStaffToBuilding({ buildingId, staffUserId, isPrimary = true }) {
  const pool = await getPool();
  await pool.request()
    .input("buildingId", sql.Int, buildingId)
    .input("staffUserId", sql.Int, staffUserId)
    .input("isPrimary", sql.Bit, isPrimary ? 1 : 0)
    .query(`
      MERGE BuildingAssignments AS target
      USING (SELECT @buildingId AS BuildingID, @staffUserId AS UserID) AS source
      ON (target.BuildingID = source.BuildingID AND target.UserID = source.UserID)
      WHEN MATCHED THEN UPDATE SET IsPrimary = @isPrimary, AssignedDate = GETDATE()
      WHEN NOT MATCHED THEN INSERT (BuildingID, UserID, IsPrimary) VALUES (@buildingId, @staffUserId, @isPrimary);
    `);
  return { success: true, message: 'Phân công nhân viên vào tòa nhà thành công' };
}

export async function removeStaffFromBuilding(assignmentId) {
  const pool = await getPool();
  await pool.request()
    .input("assignmentId", sql.Int, assignmentId)
    .query(`DELETE FROM BuildingAssignments WHERE AssignmentID = @assignmentId`);
  return { success: true, message: 'Gỡ nhân viên khỏi tòa nhà thành công' };
}

/**
 * Lấy danh sách Staff chưa được phân công vào bất kỳ Tòa nhà nào
 */
export async function getUnassignedStaff() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT u.UserID, u.FullName, u.Email, u.PhoneNumber, u.IsActive, u.HireDate, r.RoleName
    FROM Users u
    JOIN Roles r ON u.RoleID = r.RoleID
    WHERE r.RoleName = 'Staff'
      AND u.IsActive = 1
      AND u.UserID NOT IN (
        SELECT DISTINCT ba.UserID FROM BuildingAssignments ba
      )
    ORDER BY u.FullName
  `);
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────
// CONFIG – GATES (FULL CRUD FOR GATES)
// ─────────────────────────────────────────────────────────────
export async function getGates(buildingId = null) {
  const pool = await getPool();
  const result = await pool.request()
    .input("BuildingID", sql.Int, buildingId || null)
    .query(`
      SELECT g.GateID, g.BuildingID, b.BuildingName, g.GateName, g.GateType, g.IsActive
      FROM Gates g
      JOIN Buildings b ON g.BuildingID = b.BuildingID
      WHERE (@BuildingID IS NULL OR g.BuildingID = @BuildingID)
      ORDER BY g.BuildingID, g.GateID
    `);
  return result.recordset;
}

export async function getGateById(gateId) {
  const pool = await getPool();
  const result = await pool.request()
    .input("GateID", sql.Int, gateId)
    .query(`
      SELECT g.GateID, g.BuildingID, b.BuildingName, g.GateName, g.GateType, g.IsActive
      FROM Gates g
      JOIN Buildings b ON g.BuildingID = b.BuildingID
      WHERE g.GateID = @GateID
    `);
  return result.recordset[0] || null;
}

export async function createGate(data) {
  const pool = await getPool();
  const result = await pool.request()
    .input("BuildingID", sql.Int, data.buildingId)
    .input("GateName", sql.NVarChar(50), data.gateName)
    .input("GateType", sql.NVarChar(20), data.gateType || 'In')
    .input("IsActive", sql.Bit, data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1)
    .query(`
      INSERT INTO Gates (BuildingID, GateName, GateType, IsActive)
      VALUES (@BuildingID, @GateName, @GateType, @IsActive);
      SELECT * FROM Gates WHERE GateID = SCOPE_IDENTITY();
    `);
  return result.recordset[0];
}

export async function updateGate(gateId, data) {
  const pool = await getPool();
  const req = pool.request().input("GateID", sql.Int, gateId);
  const sets = [];
  if (data.buildingId !== undefined) { req.input("BuildingID", sql.Int, data.buildingId); sets.push("BuildingID = @BuildingID"); }
  if (data.gateName !== undefined) { req.input("GateName", sql.NVarChar(50), data.gateName); sets.push("GateName = @GateName"); }
  if (data.gateType !== undefined) { req.input("GateType", sql.NVarChar(20), data.gateType); sets.push("GateType = @GateType"); }
  if (data.isActive !== undefined) { req.input("IsActive", sql.Bit, data.isActive ? 1 : 0); sets.push("IsActive = @IsActive"); }

  if (sets.length > 0) {
    await req.query(`UPDATE Gates SET ${sets.join(", ")} WHERE GateID = @GateID`);
  }
  return await getGateById(gateId);
}

export async function deleteGate(gateId) {
  const pool = await getPool();
  await pool.request()
    .input("GateID", sql.Int, gateId)
    .query(`DELETE FROM Gates WHERE GateID = @GateID`);
  return { success: true, gateId };
}

// ─────────────────────────────────────────────────────────────
// CONFIG – FLOORS
// ─────────────────────────────────────────────────────────────
export async function getFloors(buildingId = null, managerUserId = null) {
  const pool = await getPool();
  const result = await pool.request()
    .input("BuildingID", sql.Int, buildingId || null)
    .input("ManagerUserID", sql.Int, managerUserId || null)
    .query(`
      SELECT
        f.FloorID,
        f.BuildingID,
        b.BuildingName,
        f.FloorName,
        f.IsActive,
        COUNT(DISTINCT z.ZoneID)   AS ZoneCount,
        COUNT(DISTINCT ps.SlotID)  AS SlotCount
      FROM Floors f
      JOIN Buildings b          ON b.BuildingID = f.BuildingID
      LEFT JOIN Zones z         ON z.FloorID    = f.FloorID
      LEFT JOIN ParkingSlots ps ON ps.ZoneID    = z.ZoneID
      WHERE (@BuildingID IS NULL OR f.BuildingID = @BuildingID)
        AND (@ManagerUserID IS NULL OR f.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @ManagerUserID))
      GROUP BY f.FloorID, f.BuildingID, b.BuildingName, f.FloorName, f.IsActive
      ORDER BY f.BuildingID, f.FloorID
    `);
  return result.recordset;
}

export async function updateFloor(floorId, data) {
  const pool = await getPool();
  await pool.request()
    .input("FloorID", sql.Int, floorId)
    .input("FloorName", sql.NVarChar(50), data.floorName)
    .input("IsActive", sql.Bit, data.isActive !== undefined ? data.isActive : 1)
    .query(`
      UPDATE Floors
      SET FloorName = @FloorName, IsActive = @IsActive
      WHERE FloorID = @FloorID
    `);
  const r = await pool.request()
    .input("FloorID", sql.Int, floorId)
    .query(`SELECT * FROM Floors WHERE FloorID = @FloorID`);
  return r.recordset[0];
}

// ─────────────────────────────────────────────────────────────
// CONFIG – ZONES
// ─────────────────────────────────────────────────────────────
export async function getZones(floorId = null, managerUserId = null) {
  const pool = await getPool();
  const result = await pool.request()
    .input("FloorID", sql.Int, floorId || null)
    .input("ManagerUserID", sql.Int, managerUserId || null)
    .query(`
      SELECT
        z.ZoneID,
        z.FloorID,
        f.FloorName,
        b.BuildingID,
        b.BuildingName,
        z.ZoneName,
        z.AllowedVehicleTypeID,
        vt.VehicleName  AS AllowedVehicleName,
        vt.VehicleCode  AS AllowedVehicleCode,
        z.TotalSlots,
        COUNT(ps.SlotID) AS ActualSlots
      FROM Zones z
      JOIN Floors f        ON f.FloorID        = z.FloorID
      JOIN Buildings b     ON b.BuildingID     = f.BuildingID
      JOIN VehicleTypes vt ON vt.VehicleTypeID = z.AllowedVehicleTypeID
      LEFT JOIN ParkingSlots ps ON ps.ZoneID  = z.ZoneID
      WHERE (@FloorID IS NULL OR z.FloorID = @FloorID)
        AND f.IsActive = 1
        AND (@ManagerUserID IS NULL OR f.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @ManagerUserID))
      GROUP BY z.ZoneID, z.FloorID, f.FloorName, b.BuildingID, b.BuildingName,
               z.ZoneName, z.AllowedVehicleTypeID, vt.VehicleName, vt.VehicleCode,
               z.TotalSlots
      ORDER BY z.FloorID, z.ZoneID
    `);
  return result.recordset;
}

export async function updateZone(zoneId, data) {
  const pool = await getPool();
  await pool.request()
    .input("ZoneID", sql.Int, zoneId)
    .input("ZoneName", sql.NVarChar(50), data.zoneName)
    .input("AllowedVehicleTypeID", sql.Int, data.allowedVehicleTypeId)
    .input("TotalSlots", sql.Int, data.totalSlots || 0)
    .query(`
      UPDATE Zones
      SET ZoneName              = @ZoneName,
          AllowedVehicleTypeID  = @AllowedVehicleTypeID,
          TotalSlots            = @TotalSlots
      WHERE ZoneID = @ZoneID
    `);
  const r = await pool.request()
    .input("ZoneID", sql.Int, zoneId)
    .query(`SELECT * FROM Zones WHERE ZoneID = @ZoneID`);
  return r.recordset[0];
}

// ─────────────────────────────────────────────────────────────
// VEHICLE TYPES
// ─────────────────────────────────────────────────────────────
export async function getVehicleTypes() {
  const pool = await getPool();
  const result = await pool.request().query("SELECT * FROM VehicleTypes ORDER BY VehicleTypeID");
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────
// SLOTS / POSITIONS
// ─────────────────────────────────────────────────────────────
export async function getParkingSlots({
  buildingId, floorId, zoneId, status, vehicleTypeId, search, page = 1, limit = 50
} = {}, managerUserId = null) {
  const pool = await getPool();
  const offset = (page - 1) * limit;

  const result = await pool.request()
    .input("BuildingID", sql.Int, buildingId || null)
    .input("FloorID", sql.Int, floorId || null)
    .input("ZoneID", sql.Int, zoneId || null)
    .input("Status", sql.NVarChar(20), status || null)
    .input("VehicleTypeID", sql.Int, vehicleTypeId || null)
    .input("Search", sql.NVarChar(50), search || null)
    .input("ManagerUserID", sql.Int, managerUserId || null)
    .input("Offset", sql.Int, offset)
    .input("Limit", sql.Int, limit)
    .query(`
      SELECT
        ps.SlotID,
        ps.SlotCode,
        ps.SlotStatus,
        ps.VehicleTypeID,
        vt.VehicleName,
        vt.VehicleCode,
        ps.ZoneID,
        z.ZoneName,
        f.FloorID,
        f.FloorName,
        b.BuildingID,
        b.BuildingName,
        sess.SessionID,
        sess.PlateNumber,
        sess.EntryTime,
        DATEDIFF(MINUTE, sess.EntryTime, GETDATE()) AS ParkedMinutes,
        sess.DriverName
      FROM ParkingSlots ps
      JOIN VehicleTypes vt  ON vt.VehicleTypeID = ps.VehicleTypeID
      JOIN Zones z           ON z.ZoneID         = ps.ZoneID
      JOIN Floors f          ON f.FloorID         = z.FloorID
      JOIN Buildings b       ON b.BuildingID      = f.BuildingID
      LEFT JOIN (
        SELECT s.SlotID, s.SessionID, s.PlateNumber, s.EntryTime,
               ISNULL(u.FullName, N'Khách vãng lai') AS DriverName
        FROM ParkingSessions s
        LEFT JOIN Users u ON u.UserID = s.DriverID
        WHERE s.SessionStatus = 'Active'
      ) sess ON sess.SlotID = ps.SlotID
      WHERE f.IsActive = 1
        AND (@BuildingID    IS NULL OR b.BuildingID     = @BuildingID)
        AND (@FloorID       IS NULL OR f.FloorID        = @FloorID)
        AND (@ZoneID        IS NULL OR z.ZoneID         = @ZoneID)
        AND (@Status        IS NULL OR ps.SlotStatus    = @Status)
        AND (@VehicleTypeID IS NULL OR ps.VehicleTypeID = @VehicleTypeID)
        AND (@Search        IS NULL OR ps.SlotCode LIKE '%' + @Search + '%'
                                    OR sess.PlateNumber LIKE '%' + @Search + '%')
        AND (@ManagerUserID IS NULL OR b.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @ManagerUserID))
      ORDER BY b.BuildingID, f.FloorID, z.ZoneID, ps.SlotCode
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

  const countResult = await pool.request()
    .input("BuildingID", sql.Int, buildingId || null)
    .input("FloorID", sql.Int, floorId || null)
    .input("ZoneID", sql.Int, zoneId || null)
    .input("Status", sql.NVarChar(20), status || null)
    .input("VehicleTypeID", sql.Int, vehicleTypeId || null)
    .input("Search", sql.NVarChar(50), search || null)
    .input("ManagerUserID", sql.Int, managerUserId || null)
    .query(`
      SELECT COUNT(*) AS Total
      FROM ParkingSlots ps
      JOIN VehicleTypes vt  ON vt.VehicleTypeID = ps.VehicleTypeID
      JOIN Zones z          ON z.ZoneID          = ps.ZoneID
      JOIN Floors f         ON f.FloorID          = z.FloorID
      JOIN Buildings b      ON b.BuildingID       = f.BuildingID
      LEFT JOIN ParkingSessions sess
        ON sess.SlotID = ps.SlotID AND sess.SessionStatus = 'Active'
      WHERE f.IsActive = 1
        AND (@BuildingID    IS NULL OR b.BuildingID     = @BuildingID)
        AND (@FloorID       IS NULL OR f.FloorID        = @FloorID)
        AND (@ZoneID        IS NULL OR z.ZoneID         = @ZoneID)
        AND (@Status        IS NULL OR ps.SlotStatus    = @Status)
        AND (@VehicleTypeID IS NULL OR ps.VehicleTypeID = @VehicleTypeID)
        AND (@Search        IS NULL OR ps.SlotCode LIKE '%' + @Search + '%'
                                    OR sess.PlateNumber LIKE '%' + @Search + '%')
        AND (@ManagerUserID IS NULL OR b.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @ManagerUserID))
    `);

  return {
    data: result.recordset,
    total: countResult.recordset[0].Total,
    page,
    limit,
  };
}

export async function getSlotById(slotId) {
  const pool = await getPool();

  const slotResult = await pool.request()
    .input("SlotID", sql.Int, slotId)
    .query(`
      SELECT
        ps.SlotID, ps.SlotCode, ps.SlotStatus,
        ps.VehicleTypeID, vt.VehicleName, vt.VehicleCode,
        ps.ZoneID, z.ZoneName,
        f.FloorID, f.FloorName,
        b.BuildingID, b.BuildingName, b.Address, b.OperatingHours
      FROM ParkingSlots ps
      JOIN VehicleTypes vt ON vt.VehicleTypeID = ps.VehicleTypeID
      JOIN Zones z          ON z.ZoneID         = ps.ZoneID
      JOIN Floors f         ON f.FloorID         = z.FloorID
      JOIN Buildings b      ON b.BuildingID      = f.BuildingID
      WHERE ps.SlotID = @SlotID
    `);

  if (!slotResult.recordset[0]) {
    const err = new Error("Slot không tồn tại");
    err.statusCode = 404; throw err;
  }

  const sessResult = await pool.request()
    .input("SlotID", sql.Int, slotId)
    .query(`
      SELECT TOP 1
        s.SessionID,
        CONCAT('SES-', RIGHT('0000' + CAST(s.SessionID AS VARCHAR), 4)) AS SessionCode,
        s.PlateNumber,
        s.EntryTime,
        s.SessionStatus,
        s.VehicleTypeID,
        DATEDIFF(MINUTE, s.EntryTime, GETDATE()) AS ParkedMinutes,
        ISNULL(u.FullName, N'Khách vãng lai') AS DriverName,
        u.PhoneNumber AS DriverPhone
      FROM ParkingSessions s
      LEFT JOIN Users u ON u.UserID = s.DriverID
      WHERE s.SlotID = @SlotID AND s.SessionStatus = 'Active'
      ORDER BY s.EntryTime DESC
    `);

  const histResult = await pool.request()
    .input("SlotID", sql.Int, slotId)
    .query(`
      SELECT TOP 20
        s.SessionID,
        CONCAT('SES-', RIGHT('0000' + CAST(s.SessionID AS VARCHAR), 4)) AS SessionCode,
        s.PlateNumber,
        s.EntryTime,
        s.ExitTime,
        s.SessionStatus,
        DATEDIFF(MINUTE, s.EntryTime, ISNULL(s.ExitTime, GETDATE())) AS DurationMinutes,
        ISNULL(u.FullName, N'Khách vãng lai') AS DriverName,
        p.Amount,
        p.PaymentStatus,
        p.PaymentMethod
      FROM ParkingSessions s
      LEFT JOIN Users u    ON u.UserID    = s.DriverID
      LEFT JOIN Payments p ON p.SessionID = s.SessionID
      WHERE s.SlotID = @SlotID
      ORDER BY s.EntryTime DESC
    `);

  return {
    ...slotResult.recordset[0],
    slot: slotResult.recordset[0],
    currentSession: sessResult.recordset[0] || null,
    history: histResult.recordset,
  };
}

export async function updateSlotStatus(slotId, { status, notes }) {
  const validStatuses = ['Available', 'Maintenance', 'Blocked'];
  if (!validStatuses.includes(status)) {
    const err = new Error(`Trạng thái không hợp lệ. Cho phép: ${validStatuses.join(', ')}`);
    err.statusCode = 400; throw err;
  }

  const pool = await getPool();
  await pool.request()
    .input("SlotID", sql.Int, slotId)
    .input("Status", sql.NVarChar(20), status)
    .query(`
      UPDATE ParkingSlots
      SET SlotStatus = @Status
      WHERE SlotID = @SlotID
    `);

  const r = await pool.request()
    .input("SlotID", sql.Int, slotId)
    .query(`SELECT * FROM ParkingSlots WHERE SlotID = @SlotID`);
  return r.recordset[0];
}

// ─────────────────────────────────────────────────────────────
// PRICING POLICIES
// ─────────────────────────────────────────────────────────────
export async function getPricingPolicies({ vehicleTypeId, isActive, buildingId } = {}, managerUserId = null) {
  const pool = await getPool();
  const result = await pool.request()
    .input("VehicleTypeID", sql.Int, vehicleTypeId || null)
    .input("IsActive", sql.Bit, isActive !== undefined ? isActive : null)
    .input("BuildingID", sql.Int, buildingId || null)
    .input("ManagerUserID", sql.Int, managerUserId || null)
    .query(`
      SELECT
        pp.PricingPolicyID,
        pp.BuildingID,
        b.BuildingName,
        pp.VehicleTypeID,
        vt.VehicleName,
        vt.VehicleCode,
        pp.MinHours,
        pp.MaxHours,
        pp.Fee,
        pp.IsOvernight,
        pp.IsActive
      FROM PricingPolicies pp
      JOIN VehicleTypes vt ON vt.VehicleTypeID = pp.VehicleTypeID
      LEFT JOIN Buildings b ON b.BuildingID = pp.BuildingID
      WHERE (@VehicleTypeID IS NULL OR pp.VehicleTypeID = @VehicleTypeID)
        AND (@IsActive      IS NULL OR pp.IsActive      = @IsActive)
        AND (@BuildingID    IS NULL OR pp.BuildingID    = @BuildingID)
        AND (@ManagerUserID IS NULL OR pp.BuildingID IS NULL OR pp.BuildingID IN (
              SELECT BuildingID FROM BuildingAssignments WHERE UserID = @ManagerUserID
            ))
      ORDER BY pp.BuildingID, pp.VehicleTypeID, pp.MinHours
    `);
  return result.recordset;
}
async function checkOverlap(vehicleTypeId, minHours, maxHours, isOvernight, excludePolicyId = null) {
  const pool = await getPool();
  if (isOvernight) {
    // Overnight không check theo range giờ cụ thể, chỉ check trùng overnight khác đã có
    const result = await pool.request()
      .input("VehicleTypeID", sql.Int, vehicleTypeId)
      .input("ExcludeID", sql.Int, excludePolicyId)
      .query(`
        SELECT PricingPolicyID FROM PricingPolicies
        WHERE VehicleTypeID = @VehicleTypeID AND IsActive = 1 AND IsOvernight = 1
          AND (@ExcludeID IS NULL OR PricingPolicyID <> @ExcludeID)
      `);
    return result.recordset;
  }

  const result = await pool.request()
    .input("VehicleTypeID", sql.Int, vehicleTypeId)
    .input("MinHours", sql.Decimal(5, 2), minHours)
    .input("MaxHours", sql.Decimal(5, 2), maxHours)
    .input("ExcludeID", sql.Int, excludePolicyId)
    .query(`
      SELECT PricingPolicyID, MinHours, MaxHours FROM PricingPolicies
      WHERE VehicleTypeID = @VehicleTypeID AND IsActive = 1 AND IsOvernight = 0
        AND (@ExcludeID IS NULL OR PricingPolicyID <> @ExcludeID)
        AND @MinHours < MaxHours AND @MaxHours > MinHours
    `);
  return result.recordset;
}

export async function createPricingPolicy(data) {
  const overlaps = await checkOverlap(data.vehicleTypeId, data.minHours, data.maxHours, data.isOvernight ? 1 : 0);
  if (overlaps.length > 0) {
    const e = new Error(`Khoảng giờ bị trùng với chính sách #${overlaps[0].PricingPolicyID}` +
      (overlaps[0].MinHours !== undefined ? ` (${overlaps[0].MinHours}h-${overlaps[0].MaxHours}h)` : ' (đã có chính sách qua đêm)'));
    e.statusCode = 409;
    throw e;
  }

  const pool = await getPool();
  const result = await pool.request()
    .input("VehicleTypeID", sql.Int, data.vehicleTypeId)
    .input("MinHours", sql.Decimal(5, 2), data.minHours)
    .input("MaxHours", sql.Decimal(5, 2), data.maxHours)
    .input("Fee", sql.Decimal(10, 2), data.fee)
    .input("IsOvernight", sql.Bit, data.isOvernight ? 1 : 0)
    .input("IsActive", sql.Bit, 1)
    .query(`
      INSERT INTO PricingPolicies (VehicleTypeID, MinHours, MaxHours, Fee, IsOvernight, IsActive)
      OUTPUT inserted.*
      VALUES (@VehicleTypeID, @MinHours, @MaxHours, @Fee, @IsOvernight, @IsActive)
    `);
  return result.recordset[0];
}

export async function updatePricingPolicy(policyId, data) {
  const pool = await getPool();

  if (data.minHours !== undefined || data.maxHours !== undefined || data.isOvernight !== undefined) {
    const current = await pool.request()
      .input("PricingPolicyID", sql.Int, policyId)
      .query(`SELECT VehicleTypeID, MinHours, MaxHours, IsOvernight FROM PricingPolicies WHERE PricingPolicyID = @PricingPolicyID`);
    const cur = current.recordset[0];
    const min = data.minHours ?? cur.MinHours;
    const max = data.maxHours ?? cur.MaxHours;
    const overnight = data.isOvernight !== undefined ? (data.isOvernight ? 1 : 0) : cur.IsOvernight;

    const overlaps = await checkOverlap(cur.VehicleTypeID, min, max, overnight, policyId);
    if (overlaps.length > 0) {
      const e = new Error(`Khoảng giờ bị trùng với chính sách #${overlaps[0].PricingPolicyID}`);
      e.statusCode = 409;
      throw e;
    }
  }

  // Build dynamic SET clause - chỉ update fields được truyền vào
  const req = pool.request().input("PricingPolicyID", sql.Int, policyId);
  const sets = [];

  if (data.minHours !== undefined) { req.input("MinHours", sql.Decimal(5, 2), data.minHours); sets.push("MinHours = @MinHours"); }
  if (data.maxHours !== undefined) { req.input("MaxHours", sql.Decimal(5, 2), data.maxHours); sets.push("MaxHours = @MaxHours"); }
  if (data.fee !== undefined) { req.input("Fee", sql.Decimal(10, 2), data.fee); sets.push("Fee = @Fee"); }
  if (data.isOvernight !== undefined) { req.input("IsOvernight", sql.Bit, data.isOvernight ? 1 : 0); sets.push("IsOvernight = @IsOvernight"); }
  if (data.isActive !== undefined) { req.input("IsActive", sql.Bit, data.isActive); sets.push("IsActive = @IsActive"); }

  if (sets.length > 0) {
    await req.query(`UPDATE PricingPolicies SET ${sets.join(", ")} WHERE PricingPolicyID = @PricingPolicyID`);
  }

  const r = await pool.request()
    .input("PricingPolicyID", sql.Int, policyId)
    .query(`
      SELECT pp.*, vt.VehicleName, vt.VehicleCode
      FROM PricingPolicies pp
      JOIN VehicleTypes vt ON vt.VehicleTypeID = pp.VehicleTypeID
      WHERE pp.PricingPolicyID = @PricingPolicyID
    `);
  return r.recordset[0];
}
export async function deletePricingPolicy(policyId) {
  const pool = await getPool();

  const check = await pool.request()
    .input("PricingPolicyID", sql.Int, policyId)
    .query(`SELECT PricingPolicyID FROM PricingPolicies WHERE PricingPolicyID = @PricingPolicyID`);

  if (!check.recordset[0]) {
    const e = new Error("Chính sách không tồn tại");
    e.statusCode = 404;
    throw e;
  }

  await pool.request()
    .input("PricingPolicyID", sql.Int, policyId)
    .query(`DELETE FROM PricingPolicies WHERE PricingPolicyID = @PricingPolicyID`);

  return { deleted: true, policyId };
}
// ─────────────────────────────────────────────────────────────
// INCIDENTS
// ─────────────────────────────────────────────────────────────
export async function getIncidents({ status, priority, page = 1, limit = 20, search, buildingId } = {}, managerUserId = null) {
  const pool = await getPool();
  const offset = (page - 1) * limit;

  const result = await pool.request()
    .input("Status", sql.NVarChar(20), status || null)
    .input("Priority", sql.NVarChar(20), priority || null)
    .input("Search", sql.NVarChar(200), search || null)
    .input("BuildingID", sql.Int, buildingId || null)
    .input("ManagerUserID", sql.Int, managerUserId || null)
    .input("Offset", sql.Int, offset)
    .input("Limit", sql.Int, limit)
    .query(`
      SELECT
        i.IncidentID,
        i.IncidentType,
        i.IncidentStatus,
        i.Priority,
        i.Description,
        i.CreatedAt,
        i.UpdatedAt,
        i.SessionID,
        s.PlateNumber,
        s.EntryTime,
        i.DriverID,
        ISNULL(d.FullName, N'Khách vãng lai') AS DriverName,
        d.Email    AS DriverEmail,
        i.AssignedStaffID,
        i.Attachments,
        st.FullName AS StaffName,
        ps.SlotCode,
        z.ZoneName,
        f.FloorName,
        b.BuildingName
      FROM Incidents i
      LEFT JOIN ParkingSessions s ON s.SessionID  = i.SessionID
      LEFT JOIN ParkingSlots ps   ON ps.SlotID    = s.SlotID
      LEFT JOIN Zones z           ON z.ZoneID     = ps.ZoneID
      LEFT JOIN Floors f          ON f.FloorID    = z.FloorID
      LEFT JOIN Buildings b       ON b.BuildingID = f.BuildingID
      LEFT JOIN Users d           ON d.UserID     = i.DriverID
      LEFT JOIN Users st          ON st.UserID    = i.AssignedStaffID
      WHERE (@Status   IS NULL OR i.IncidentStatus = @Status)
        AND (@Priority IS NULL OR i.Priority       = @Priority)
        AND (@BuildingID IS NULL OR f.BuildingID = @BuildingID)
        AND (@ManagerUserID IS NULL OR s.SessionID IS NULL OR f.BuildingID IN (
              SELECT BuildingID FROM BuildingAssignments WHERE UserID = @ManagerUserID
            ))
        AND (@Search   IS NULL OR i.IncidentType LIKE '%' + @Search + '%'
                               OR d.FullName      LIKE '%' + @Search + '%'
                               OR s.PlateNumber   LIKE '%' + @Search + '%'
                               OR CAST(i.IncidentID AS NVARCHAR) LIKE '%' + @Search + '%')
      ORDER BY i.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

  const countResult = await pool.request()
    .input("Status", sql.NVarChar(20), status || null)
    .input("Priority", sql.NVarChar(20), priority || null)
    .input("Search", sql.NVarChar(200), search || null)
    .input("BuildingID", sql.Int, buildingId || null)
    .input("ManagerUserID", sql.Int, managerUserId || null)
    .query(`
      SELECT COUNT(*) AS Total
      FROM Incidents i
      LEFT JOIN ParkingSessions s ON s.SessionID = i.SessionID
      LEFT JOIN ParkingSlots ps   ON ps.SlotID   = s.SlotID
      LEFT JOIN Zones z           ON z.ZoneID    = ps.ZoneID
      LEFT JOIN Floors f          ON f.FloorID   = z.FloorID
      LEFT JOIN Users d           ON d.UserID    = i.DriverID
      WHERE (@Status   IS NULL OR i.IncidentStatus = @Status)
        AND (@Priority IS NULL OR i.Priority       = @Priority)
        AND (@BuildingID IS NULL OR f.BuildingID = @BuildingID)
        AND (@ManagerUserID IS NULL OR s.SessionID IS NULL OR f.BuildingID IN (
              SELECT BuildingID FROM BuildingAssignments WHERE UserID = @ManagerUserID
            ))
        AND (@Search   IS NULL OR i.IncidentType LIKE '%' + @Search + '%'
                               OR d.FullName      LIKE '%' + @Search + '%'
                               OR s.PlateNumber   LIKE '%' + @Search + '%'
                               OR CAST(i.IncidentID AS NVARCHAR) LIKE '%' + @Search + '%')
    `);

  return {
    data: result.recordset.map(row => ({
      ...row,
      Attachments: parseAttachments(row.Attachments)
    })),
    total: countResult.recordset[0].Total,
    page,
    limit,
  };
}

export async function getIncidentById(incidentId) {
  const pool = await getPool();
  const result = await pool.request()
    .input("IncidentID", sql.Int, incidentId)
    .query(`
      SELECT
        i.*,
        s.PlateNumber, s.EntryTime,
        ISNULL(d.FullName, N'Khách vãng lai') AS DriverName, d.Email AS DriverEmail, d.PhoneNumber AS DriverPhone,
        st.FullName AS StaffName,
        ps.SlotCode, z.ZoneName, f.FloorName, b.BuildingName
      FROM Incidents i
      LEFT JOIN ParkingSessions s ON s.SessionID  = i.SessionID
      LEFT JOIN ParkingSlots ps   ON ps.SlotID    = s.SlotID
      LEFT JOIN Zones z           ON z.ZoneID     = ps.ZoneID
      LEFT JOIN Floors f          ON f.FloorID    = z.FloorID
      LEFT JOIN Buildings b       ON b.BuildingID = f.BuildingID
      LEFT JOIN Users d           ON d.UserID     = i.DriverID
      LEFT JOIN Users st          ON st.UserID    = i.AssignedStaffID
      WHERE i.IncidentID = @IncidentID
    `);
  if (!result.recordset[0]) {
    const err = new Error("Incident không tồn tại");
    err.statusCode = 404; throw err;
  }
  const row = result.recordset[0];
  if (!row) { const err = new Error("Incident không tồn tại"); err.statusCode = 404; throw err; }
  return { ...row, Attachments: parseAttachments(row.Attachments) };
}

export async function updateIncidentStatus(incidentId, { status, assignedStaffId, note }) {
  const valid = ['Open', 'InProgress', 'Resolved'];
  if (!valid.includes(status)) {
    const err = new Error(`Trạng thái không hợp lệ: ${valid.join(', ')}`);
    err.statusCode = 400; throw err;
  }

  const pool = await getPool();
  await pool.request()
    .input("IncidentID", sql.Int, incidentId)
    .input("IncidentStatus", sql.NVarChar(20), status)
    .input("AssignedStaffID", sql.Int, assignedStaffId || null)
    .input("Note", sql.NVarChar(500), note || null)
    .query(`
      UPDATE Incidents
      SET IncidentStatus  = @IncidentStatus,
          AssignedStaffID = ISNULL(@AssignedStaffID, AssignedStaffID),
          Description = CASE WHEN @Note IS NOT NULL
              THEN Description + CHAR(10) + '[Manager] ' + @Note
              ELSE Description END,
          UpdatedAt       = GETDATE()
      WHERE IncidentID = @IncidentID
    `);

  const updatedIncident = await getIncidentById(incidentId);

  if (status === 'Resolved' && updatedIncident.DriverID) {
    await pool.request().query(`
            INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType, IsRead, CreatedAt)
            VALUES (
                ${updatedIncident.DriverID},
                N'Sự cố đã được giải quyết',
                N'Sự cố (ID: ${updatedIncident.IncidentID}) của bạn đã được đánh dấu là giải quyết.',
                'Incident',
                ${updatedIncident.IncidentID},
                'Incident',
                0,
                GETDATE()
            )
        `);
  }

  return updatedIncident;
}

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────
export async function getRevenueReport({ startDate, endDate, groupBy = 'day', buildingId } = {}, managerUserId = null) {
  const pool = await getPool();
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const end = endDate || new Date().toISOString().slice(0, 10);

  const payTimeExpr = "ISNULL(p.PaymentTime, p.SurchargePaidAt)";
  const amountExpr = "ISNULL(p.FinalAmount, p.Amount)";

  let dateGroup;
  if (groupBy === 'hour') dateGroup = `FORMAT(t.PayTime, 'yyyy-MM-dd HH:00')`;
  else if (groupBy === 'month') dateGroup = `FORMAT(t.PayTime, 'yyyy-MM')`;
  else if (groupBy === 'year') dateGroup = `FORMAT(t.PayTime, 'yyyy')`;
  else if (groupBy === 'week') dateGroup = `CONCAT(YEAR(t.PayTime), '-W', RIGHT('0' + CAST(DATEPART(WEEK, t.PayTime) AS VARCHAR), 2))`;
  else dateGroup = `CAST(t.PayTime AS DATE)`;

  const result = await pool.request()
    .input("StartDate", sql.Date, start)
    .input("EndDate", sql.Date, end)
    .input("BuildingID", sql.Int, buildingId || null)
    .input("ManagerUserID", sql.Int, managerUserId || null)
    .query(`
      WITH AllPayments AS (
          SELECT 
              ISNULL(p.FinalAmount, p.Amount) AS Revenue, 
              ISNULL(p.PaymentTime, p.SurchargePaidAt) AS PayTime,
              p.PaymentMethod,
              f.BuildingID
          FROM Payments p
          JOIN ParkingSessions s ON p.SessionID = s.SessionID
          JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
          JOIN Zones z ON ps.ZoneID = z.ZoneID
          JOIN Floors f ON z.FloorID = f.FloorID
          WHERE p.PaymentStatus IN ('Completed', 'Prepaid') 
            AND ISNULL(p.PaymentTime, p.SurchargePaidAt) IS NOT NULL
      )
      SELECT
        ${dateGroup}          AS Period,
        COUNT(*)              AS TransactionCount,
        SUM(t.Revenue)        AS TotalRevenue,
        AVG(t.Revenue)        AS AvgRevenue
      FROM AllPayments t
      WHERE CAST(t.PayTime AS DATE) BETWEEN @StartDate AND @EndDate
        AND (@BuildingID IS NULL OR t.BuildingID = @BuildingID)
        AND (@ManagerUserID IS NULL OR t.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @ManagerUserID))
      GROUP BY ${dateGroup}
      ORDER BY Period
    `);

  const summaryResult = await pool.request()
    .input("StartDate", sql.Date, start)
    .input("EndDate", sql.Date, end)
    .input("BuildingID", sql.Int, buildingId || null)
    .input("ManagerUserID", sql.Int, managerUserId || null)
    .query(`
      WITH AllPayments AS (
          SELECT 
              ISNULL(p.FinalAmount, p.Amount) AS Revenue, 
              ISNULL(p.PaymentTime, p.SurchargePaidAt) AS PayTime,
              p.PaymentMethod,
              f.BuildingID
          FROM Payments p
          JOIN ParkingSessions s ON p.SessionID = s.SessionID
          JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
          JOIN Zones z ON ps.ZoneID = z.ZoneID
          JOIN Floors f ON z.FloorID = f.FloorID
          WHERE p.PaymentStatus IN ('Completed', 'Prepaid') 
            AND ISNULL(p.PaymentTime, p.SurchargePaidAt) IS NOT NULL
      )
      SELECT
        COUNT(*)                                                                  AS TotalTransactions,
        ISNULL(SUM(t.Revenue), 0)                                                 AS TotalRevenue,
        ISNULL(AVG(t.Revenue), 0)                                                 AS AvgPerTransaction,
        SUM(CASE WHEN t.PaymentMethod = 'Cash'    THEN t.Revenue ELSE 0 END)      AS CashRevenue,
        SUM(CASE WHEN t.PaymentMethod = 'Banking' THEN t.Revenue ELSE 0 END)      AS BankingRevenue
      FROM AllPayments t
      WHERE CAST(t.PayTime AS DATE) BETWEEN @StartDate AND @EndDate
        AND (@BuildingID IS NULL OR t.BuildingID = @BuildingID)
        AND (@ManagerUserID IS NULL OR t.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @ManagerUserID))
    `);

  // Theo loại xe
  const byVehicleResult = await pool.request()
    .input("StartDate", sql.Date, start)
    .input("EndDate", sql.Date, end)
    .input("BuildingID", sql.Int, buildingId || null)
    .input("ManagerUserID", sql.Int, managerUserId || null)
    .query(`
      SELECT
        vt.VehicleName,
        vt.VehicleCode,
        COUNT(p.PaymentID)            AS TransactionCount,
        ISNULL(SUM(${amountExpr}), 0) AS TotalRevenue
      FROM Payments p
      JOIN ParkingSessions s ON p.SessionID = s.SessionID
      JOIN VehicleTypes vt   ON s.VehicleTypeID = vt.VehicleTypeID
      JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
      JOIN Zones z ON ps.ZoneID = z.ZoneID
      JOIN Floors f ON z.FloorID = f.FloorID
      WHERE p.PaymentStatus IN ('Completed', 'Prepaid')
        AND ${payTimeExpr} IS NOT NULL
        AND CAST(${payTimeExpr} AS DATE) BETWEEN @StartDate AND @EndDate
        AND (@BuildingID IS NULL OR f.BuildingID = @BuildingID)
        AND (@ManagerUserID IS NULL OR f.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @ManagerUserID))
      GROUP BY vt.VehicleTypeID, vt.VehicleName, vt.VehicleCode
      ORDER BY TotalRevenue DESC
    `);

  return {
    period: { startDate: start, endDate: end, groupBy },
    summary: summaryResult.recordset[0],
    chart: result.recordset,
    byVehicle: byVehicleResult.recordset,
  };
}

export async function getOccupancyReport(buildingId = null, managerUserId = null) {
  const pool = await getPool();

  const byFloor = await pool.request()
    .input("BuildingID", sql.Int, buildingId || null)
    .input("ManagerUserID", sql.Int, managerUserId || null)
    .query(`
    SELECT
      b.BuildingName,
      f.FloorID,
      f.FloorName,
      COUNT(ps.SlotID)                                                 AS TotalSlots,
      SUM(CASE WHEN ps.SlotStatus = 'Available'   THEN 1 ELSE 0 END)  AS Available,
      SUM(CASE WHEN ps.SlotStatus = 'Occupied'    THEN 1 ELSE 0 END)  AS Occupied,
      SUM(CASE WHEN ps.SlotStatus = 'Reserved'    THEN 1 ELSE 0 END)  AS Reserved,
      SUM(CASE WHEN ps.SlotStatus = 'Maintenance' THEN 1 ELSE 0 END)  AS Maintenance,
      CASE WHEN COUNT(ps.SlotID) = 0 THEN 0
           ELSE ROUND(
             100.0 * SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END)
             / COUNT(ps.SlotID), 1)
      END AS OccupancyPct
    FROM ParkingSlots ps
    JOIN Zones z     ON z.ZoneID     = ps.ZoneID
    JOIN Floors f    ON f.FloorID    = z.FloorID
    JOIN Buildings b ON b.BuildingID = f.BuildingID
    WHERE f.IsActive = 1
      AND (@BuildingID IS NULL OR f.BuildingID = @BuildingID)
      AND (@ManagerUserID IS NULL OR f.BuildingID IN (SELECT BuildingID FROM BuildingAssignments WHERE UserID = @ManagerUserID))
    GROUP BY b.BuildingID, b.BuildingName, f.FloorID, f.FloorName
    ORDER BY b.BuildingID, f.FloorID
  `);

  const byVehicleType = await pool.request().query(`
    SELECT
      vt.VehicleName,
      vt.VehicleCode,
      COUNT(ps.SlotID) AS TotalSlots,
      SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END) AS Occupied,
      CASE WHEN COUNT(ps.SlotID) = 0 THEN 0
           ELSE ROUND(
             100.0 * SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END)
             / COUNT(ps.SlotID), 1)
      END AS OccupancyPct
    FROM ParkingSlots ps
    JOIN VehicleTypes vt ON vt.VehicleTypeID = ps.VehicleTypeID
    GROUP BY vt.VehicleTypeID, vt.VehicleName, vt.VehicleCode
    ORDER BY vt.VehicleTypeID
  `);

  // Thống kê giờ cao điểm hôm nay (group by hour)
  const peakHours = await pool.request().query(`
    SELECT
      DATEPART(HOUR, EntryTime) AS Hour,
      COUNT(*) AS SessionCount
    FROM ParkingSessions
    WHERE CAST(EntryTime AS DATE) = CAST(GETDATE() AS DATE)
    GROUP BY DATEPART(HOUR, EntryTime)
    ORDER BY Hour
  `);

  return {
    byFloor: byFloor.recordset,
    byVehicleType: byVehicleType.recordset,
    peakHours: peakHours.recordset,
  };
}

export async function getSessionsReport({ startDate, endDate } = {}) {
  const pool = await getPool();
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const end = endDate || new Date().toISOString().slice(0, 10);

  const summary = await pool.request()
    .input("StartDate", sql.Date, start)
    .input("EndDate", sql.Date, end)
    .query(`
      SELECT
        COUNT(*)                                                            AS TotalSessions,
        SUM(CASE WHEN s.SessionStatus = 'Active'    THEN 1 ELSE 0 END)    AS ActiveSessions,
        SUM(CASE WHEN s.SessionStatus = 'Completed' THEN 1 ELSE 0 END)    AS CompletedSessions,
        SUM(CASE WHEN s.SessionStatus = 'Lost'      THEN 1 ELSE 0 END)    AS LostSessions,
        AVG(CASE WHEN s.ExitTime IS NOT NULL
                 THEN DATEDIFF(MINUTE, s.EntryTime, s.ExitTime)
                 ELSE NULL END) AS AvgParkingMinutes
      FROM ParkingSessions s
      WHERE CAST(s.EntryTime AS DATE) BETWEEN @StartDate AND @EndDate
    `);

  // Daily trend
  const dailyTrend = await pool.request()
    .input("StartDate", sql.Date, start)
    .input("EndDate", sql.Date, end)
    .query(`
      SELECT
        CAST(s.EntryTime AS DATE)                                        AS Day,
        COUNT(*)                                                         AS TotalSessions,
        SUM(CASE WHEN s.SessionStatus = 'Completed' THEN 1 ELSE 0 END) AS Completed
      FROM ParkingSessions s
      WHERE CAST(s.EntryTime AS DATE) BETWEEN @StartDate AND @EndDate
      GROUP BY CAST(s.EntryTime AS DATE)
      ORDER BY Day
    `);

  // Theo loại xe
  const byVehicle = await pool.request()
    .input("StartDate", sql.Date, start)
    .input("EndDate", sql.Date, end)
    .query(`
      SELECT
        vt.VehicleName,
        vt.VehicleCode,
        COUNT(*) AS SessionCount,
        AVG(CASE WHEN s.ExitTime IS NOT NULL
                 THEN DATEDIFF(MINUTE, s.EntryTime, s.ExitTime)
                 ELSE NULL END) AS AvgMinutes
      FROM ParkingSessions s
      JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
      WHERE CAST(s.EntryTime AS DATE) BETWEEN @StartDate AND @EndDate
      GROUP BY vt.VehicleTypeID, vt.VehicleName, vt.VehicleCode
      ORDER BY SessionCount DESC
    `);

  return {
    period: { startDate: start, endDate: end },
    summary: summary.recordset[0],
    dailyTrend: dailyTrend.recordset,
    byVehicle: byVehicle.recordset,
  };
}

// ─────────────────────────────────────────────────────────────
// STAFF LIST
// ─────────────────────────────────────────────────────────────
export async function getStaffList() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      u.UserID, u.FullName, u.Email, u.PhoneNumber,
      u.RoleID, r.RoleName, u.IsActive,
      u.HireDate, u.CreatedAt
    FROM Users u
    JOIN Roles r ON r.RoleID = u.RoleID
    WHERE u.RoleID IN (2, 3)
    ORDER BY u.RoleID, u.FullName
  `);
  return result.recordset;
}
// ─────────────────────────────────────────────────────────────
// REPORTS — Giờ cao điểm theo loại xe (dùng sp_GetPeakHours)
// ─────────────────────────────────────────────────────────────
export async function getPeakHoursReport({ startDate, endDate, vehicleTypeId } = {}) {
  const pool = await getPool();
  const result = await pool.request()
    .input("StartDate", sql.Date, startDate || null)
    .input("EndDate", sql.Date, endDate || null)
    .input("VehicleTypeID", sql.Int, vehicleTypeId || null)
    .execute("sp_GetPeakHours");

  const rows = result.recordset;

  // Pivot thành ma trận: mỗi loại xe × 24 giờ → tiện vẽ heatmap ở FE
  const byVehicle = {};
  for (const r of rows) {
    if (!byVehicle[r.VehicleTypeID]) {
      byVehicle[r.VehicleTypeID] = {
        vehicleTypeId: r.VehicleTypeID,
        vehicleName: r.VehicleName,
        vehicleCode: r.VehicleCode,
        hours: Array(24).fill(0),
      };
    }
    byVehicle[r.VehicleTypeID].hours[r.Hour] = r.SessionCount;
  }

  return {
    raw: rows,
    byVehicle: Object.values(byVehicle),
  };
}

// ─────────────────────────────────────────────────────────────
// REPORTS — Lượt xe vào/ra theo ngày + loại xe (dùng sp_GetVehicleFlow)
// ─────────────────────────────────────────────────────────────
export async function getVehicleFlowReport({ startDate, endDate } = {}) {
  const pool = await getPool();
  const result = await pool.request()
    .input("StartDate", sql.Date, startDate || null)
    .input("EndDate", sql.Date, endDate || null)
    .execute("sp_GetVehicleFlow");

  return { flow: result.recordset };
}

export async function createVehicleType(data) {
  const code = String(data.vehicleCode || '').trim().toUpperCase();
  const name = String(data.vehicleName || '').trim();
  if (!code) { const e = new Error('Thiếu mã loại xe (VehicleCode).'); e.statusCode = 400; throw e; }
  if (!name) { const e = new Error('Thiếu tên loại xe (VehicleName).'); e.statusCode = 400; throw e; }

  const pool = await getPool();
  const dup = await pool.request()
    .input('Code', sql.NVarChar(20), code)
    .query(`SELECT VehicleTypeID FROM VehicleTypes WHERE VehicleCode = @Code`);
  if (dup.recordset.length) {
    const e = new Error('Mã loại xe đã tồn tại.'); e.statusCode = 409; throw e;
  }

  const result = await pool.request()
    .input('VehicleCode', sql.NVarChar(20), code)
    .input('VehicleName', sql.NVarChar(50), name)
    .input('Description', sql.NVarChar(200), data.description || null)
    .query(`
      DECLARE @Inserted TABLE (
        VehicleTypeID INT, VehicleCode NVARCHAR(20),
        VehicleName NVARCHAR(50), Description NVARCHAR(200), IsActive BIT
      );

      INSERT INTO VehicleTypes (VehicleCode, VehicleName, Description, IsActive)
      OUTPUT inserted.VehicleTypeID, inserted.VehicleCode, inserted.VehicleName,
             inserted.Description, inserted.IsActive
      INTO @Inserted
      VALUES (@VehicleCode, @VehicleName, @Description, 1);

      SELECT VehicleTypeID, VehicleCode, VehicleName, Description, IsActive
      FROM @Inserted;
    `);

  return result.recordset[0];
}

export async function updateVehicleType(vehicleTypeId, data) {
  const pool = await getPool();
  const req = pool.request().input('VehicleTypeID', sql.Int, vehicleTypeId);
  const sets = [];

  if (data.vehicleName !== undefined) {
    req.input('VehicleName', sql.NVarChar(50), String(data.vehicleName).trim());
    sets.push('VehicleName = @VehicleName');
  }
  if (data.description !== undefined) {
    req.input('Description', sql.NVarChar(200), data.description || null);
    sets.push('Description = @Description');
  }
  if (data.isActive !== undefined) {
    req.input('IsActive', sql.Bit, data.isActive ? 1 : 0);
    sets.push('IsActive = @IsActive');
  }
  // Không cho đổi VehicleCode để tránh phá liên kết dữ liệu cũ.

  if (sets.length) {
    await req.query(`UPDATE VehicleTypes SET ${sets.join(', ')} WHERE VehicleTypeID = @VehicleTypeID`);
  }

  const r = await pool.request()
    .input('VehicleTypeID', sql.Int, vehicleTypeId)
    .query(`SELECT * FROM VehicleTypes WHERE VehicleTypeID = @VehicleTypeID`);
  if (!r.recordset[0]) { const e = new Error('Loại xe không tồn tại'); e.statusCode = 404; throw e; }
  return r.recordset[0];
}
export async function toggleVehicleType(vehicleTypeId, isActive) {
  const pool = await getPool();
  await pool.request()
    .input('VehicleTypeID', sql.Int, vehicleTypeId)
    .input('IsActive', sql.Bit, isActive ? 1 : 0)
    .query(`UPDATE VehicleTypes SET IsActive = @IsActive WHERE VehicleTypeID = @VehicleTypeID`);

  const r = await pool.request()
    .input('VehicleTypeID', sql.Int, vehicleTypeId)
    .query(`SELECT * FROM VehicleTypes WHERE VehicleTypeID = @VehicleTypeID`);
  if (!r.recordset[0]) { const e = new Error('Loại xe không tồn tại'); e.statusCode = 404; throw e; }
  return r.recordset[0];
}
export async function getAllVehicleTypes() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT vt.VehicleTypeID, vt.VehicleCode, vt.VehicleName, vt.Description, vt.IsActive,
           COUNT(DISTINCT ps.SlotID)          AS SlotCount,
           COUNT(DISTINCT pp.PricingPolicyID) AS PolicyCount
    FROM VehicleTypes vt
    LEFT JOIN ParkingSlots ps    ON ps.VehicleTypeID = vt.VehicleTypeID
    LEFT JOIN PricingPolicies pp ON pp.VehicleTypeID = vt.VehicleTypeID
    GROUP BY vt.VehicleTypeID, vt.VehicleCode, vt.VehicleName, vt.Description, vt.IsActive
    ORDER BY vt.VehicleTypeID
  `);
  return result.recordset;
}

export async function getUnpaidSessions({ search } = {}) {
  const pool = await getPool();
  const result = await pool.request()
    .input('Search', sql.NVarChar(100), search || null)
    .query(`
      SELECT
        s.SessionID,
        CONCAT('SS-', RIGHT('00000' + CAST(s.SessionID AS VARCHAR(10)), 5)) AS SessionCode,
        s.PlateNumber, s.EntryTime, s.ExitTime, s.SessionStatus,
        ISNULL(u.FullName, N'Khách vãng lai') AS DriverName, u.PhoneNumber AS DriverPhone,
        vt.VehicleName, vt.VehicleCode,
        sl.SlotCode, z.ZoneName, f.FloorName, b.BuildingName,
        p.PaymentID, p.Amount, p.FinalAmount, p.PrepaidAmount, p.SurchargeAmount,
        p.PaymentStatus, p.SurchargeStatus,
        DATEDIFF(MINUTE, s.EntryTime, ISNULL(s.ExitTime, GETDATE())) AS DurationMinutes
      FROM ParkingSessions s
      LEFT JOIN Users u    ON s.DriverID      = u.UserID
      JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
      JOIN ParkingSlots sl ON s.SlotID        = sl.SlotID
      JOIN Zones z         ON sl.ZoneID       = z.ZoneID
      JOIN Floors f        ON z.FloorID       = f.FloorID
      JOIN Buildings b     ON f.BuildingID    = b.BuildingID
      LEFT JOIN Payments p ON s.SessionID     = p.SessionID
      WHERE (
              p.PaymentStatus IN ('Pending', 'Failed')
              OR p.SurchargeStatus = 'Pending'
              OR p.PaymentID IS NULL
            )
        AND (@Search IS NULL
             OR s.PlateNumber LIKE '%' + @Search + '%'
             OR u.FullName    LIKE '%' + @Search + '%'
             OR sl.SlotCode   LIKE '%' + @Search + '%'
             OR CAST(s.SessionID AS NVARCHAR) LIKE '%' + @Search + '%')
      ORDER BY s.EntryTime DESC
    `);
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────
// SYSTEM NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
export async function broadcastSystemMaintenance(message) {
  const pool = await getPool();
  await pool.request()
    .input("Title", sql.NVarChar(200), 'Bảo trì hệ thống')
    .input("Message", sql.NVarChar(500), message || 'Hệ thống sẽ tiến hành bảo trì. Vui lòng theo dõi thông báo tiếp theo.')
    .query(`
      INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType, IsRead, CreatedAt)
      SELECT u.UserID, @Title, @Message, 'System', NULL, 'Maintenance', 0, GETDATE()
      FROM Users u
      JOIN Roles r ON u.RoleID = r.RoleID
      WHERE r.RoleName IN ('Driver', 'Staff', 'Admin') AND u.IsActive = 1
    `);
}
export async function getNightPricingPolicies() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT np.NightPolicyID, np.VehicleTypeID, vt.VehicleName, vt.VehicleCode,
           CONVERT(VARCHAR(5), np.NightStartTime, 108) AS NightStartTime,
           CONVERT(VARCHAR(5), np.NightEndTime, 108)   AS NightEndTime,
           np.NightFee, np.IsActive
    FROM NightPricingPolicies np
    JOIN VehicleTypes vt ON vt.VehicleTypeID = np.VehicleTypeID
    ORDER BY np.VehicleTypeID
  `);
  return result.recordset;
}
export async function updateNightPricingPolicy(policyId, data) {
  const pool = await getPool();
  const req = pool.request().input("NightPolicyID", sql.Int, policyId);
  const sets = [];

  if (data.nightStartTime !== undefined) { req.input("NightStartTime", sql.VarChar(8), data.nightStartTime); sets.push("NightStartTime = @NightStartTime"); }
  if (data.nightEndTime !== undefined) { req.input("NightEndTime", sql.VarChar(8), data.nightEndTime); sets.push("NightEndTime = @NightEndTime"); }
  if (data.nightFee !== undefined) { req.input("NightFee", sql.Decimal(10, 2), data.nightFee); sets.push("NightFee = @NightFee"); }
  if (data.isActive !== undefined) { req.input("IsActive", sql.Bit, data.isActive ? 1 : 0); sets.push("IsActive = @IsActive"); }

  if (sets.length) {
    await req.query(`UPDATE NightPricingPolicies SET ${sets.join(", ")} WHERE NightPolicyID = @NightPolicyID`);
  }

  const r = await pool.request()
    .input("NightPolicyID", sql.Int, policyId)
    .query(`
      SELECT np.*, vt.VehicleName, vt.VehicleCode
      FROM NightPricingPolicies np JOIN VehicleTypes vt ON vt.VehicleTypeID = np.VehicleTypeID
      WHERE np.NightPolicyID = @NightPolicyID
    `);
  return r.recordset[0];
}