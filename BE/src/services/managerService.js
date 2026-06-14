// src/services/managerService.js
import { getPool, sql } from "../config/db.js";

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────

export async function getDashboardStats() {
    const pool = await getPool();

    // Tổng slots, slot trạng thái
    const slotStats = await pool.request().query(`
    SELECT
      COUNT(*) AS TotalSlots,
      SUM(CASE WHEN SlotStatus = 'Available'    THEN 1 ELSE 0 END) AS Available,
      SUM(CASE WHEN SlotStatus = 'Occupied'     THEN 1 ELSE 0 END) AS Occupied,
      SUM(CASE WHEN SlotStatus = 'Reserved'     THEN 1 ELSE 0 END) AS Reserved,
      SUM(CASE WHEN SlotStatus = 'Maintenance'  THEN 1 ELSE 0 END) AS Maintenance,
      SUM(CASE WHEN SlotStatus = 'Blocked'      THEN 1 ELSE 0 END) AS Blocked
    FROM ParkingSlots
  `);

    // Sessions hôm nay
    const sessionStats = await pool.request().query(`
    SELECT
      COUNT(*) AS TodaySessions,
      SUM(CASE WHEN SessionStatus = 'Active' THEN 1 ELSE 0 END) AS ActiveSessions
    FROM ParkingSessions
    WHERE CAST(EntryTime AS DATE) = CAST(GETDATE() AS DATE)
  `);

    // Doanh thu hôm nay
    const revenueToday = await pool.request().query(`
    SELECT ISNULL(SUM(p.Amount), 0) AS RevenueToday
    FROM Payments p
    JOIN ParkingSessions s ON p.SessionID = s.SessionID
    WHERE p.PaymentStatus IN ('Completed', 'Prepaid')
      AND CAST(p.PaymentTime AS DATE) = CAST(GETDATE() AS DATE)
  `);

    // Doanh thu 7 ngày (theo ngày)
    const revenue7Days = await pool.request().query(`
    SELECT
      CAST(p.PaymentTime AS DATE) AS RevenueDate,
      ISNULL(SUM(p.Amount), 0)   AS TotalRevenue
    FROM Payments p
    WHERE p.PaymentStatus IN ('Completed', 'Prepaid')
      AND p.PaymentTime >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
    GROUP BY CAST(p.PaymentTime AS DATE)
    ORDER BY RevenueDate
  `);

    // Lấp đầy theo tầng
    const floorOccupancy = await pool.request().query(`
    SELECT
      f.FloorID,
      f.FloorName,
      COUNT(ps.SlotID)                                                    AS TotalSlots,
      SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END)        AS OccupiedSlots,
      CASE WHEN COUNT(ps.SlotID) = 0 THEN 0
           ELSE ROUND(
             100.0 * SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END)
             / COUNT(ps.SlotID), 1)
      END AS OccupancyPct
    FROM Floors f
    JOIN Zones z    ON z.FloorID  = f.FloorID
    JOIN ParkingSlots ps ON ps.ZoneID = z.ZoneID
    WHERE f.IsActive = 1
    GROUP BY f.FloorID, f.FloorName
    ORDER BY f.FloorID
  `);

    // Cơ cấu loại xe (active sessions)
    const vehicleBreakdown = await pool.request().query(`
    SELECT
      vt.VehicleName,
      vt.VehicleCode,
      COUNT(*) AS Count
    FROM ParkingSessions s
    JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
    WHERE s.SessionStatus = 'Active'
    GROUP BY vt.VehicleTypeID, vt.VehicleName, vt.VehicleCode
  `);

    // Check-in gần nhất
    const recentCheckIns = await pool.request().query(`
    SELECT TOP 10
      s.SessionID,
      CONCAT('SES-', RIGHT('0000' + CAST(s.SessionID AS VARCHAR), 4)) AS SessionCode,
      s.PlateNumber,
      ps.SlotCode,
      s.EntryTime,
      vt.VehicleName,
      u.FullName AS StaffName
    FROM ParkingSessions s
    JOIN ParkingSlots ps  ON s.SlotID = ps.SlotID
    JOIN VehicleTypes vt  ON s.VehicleTypeID = vt.VehicleTypeID
    LEFT JOIN Users u     ON u.RoleID IN (2,3)
                          AND u.UserID = (
                            SELECT TOP 1 AssignedStaffID FROM Incidents
                            WHERE SessionID = s.SessionID
                          )
    ORDER BY s.EntryTime DESC
  `);

    // Thanh toán gần nhất
    const recentPayments = await pool.request().query(`
    SELECT TOP 10
      p.PaymentID,
      CONCAT('SES-', RIGHT('0000' + CAST(s.SessionID AS VARCHAR), 4)) AS SessionCode,
      s.PlateNumber,
      p.Amount,
      p.PaymentStatus,
      p.PaymentTime,
      p.PaymentMethod
    FROM Payments p
    JOIN ParkingSessions s ON p.SessionID = s.SessionID
    ORDER BY p.PaymentTime DESC
  `);

    const slot = slotStats.recordset[0];
    const sess = sessionStats.recordset[0];

    return {
        kpis: {
            totalSlots: slot.TotalSlots,
            available: slot.Available,
            occupied: slot.Occupied,
            reserved: slot.Reserved,
            maintenance: slot.Maintenance,
            revenueToday: revenueToday.recordset[0].RevenueToday,
            todaySessions: sess.TodaySessions,
            activeSessions: sess.ActiveSessions,
        },
        revenue7Days: revenue7Days.recordset,
        floorOccupancy: floorOccupancy.recordset,
        vehicleBreakdown: vehicleBreakdown.recordset,
        recentCheckIns: recentCheckIns.recordset,
        recentPayments: recentPayments.recordset,
    };
}

// ─────────────────────────────────────────────────────────────
// CONFIG – BUILDINGS
// ─────────────────────────────────────────────────────────────

export async function getBuildings() {
    const pool = await getPool();
    const result = await pool.request().query(`
    SELECT
      b.BuildingID,
      b.BuildingName,
      b.Address,
      b.OperatingHours,
      b.TotalFloors,
      b.CreatedAt,
      b.UpdatedAt,
      COUNT(DISTINCT f.FloorID) AS FloorCount,
      COUNT(DISTINCT ps.SlotID) AS SlotCount
    FROM Buildings b
    LEFT JOIN Floors f       ON f.BuildingID = b.BuildingID AND f.IsActive = 1
    LEFT JOIN Zones z        ON z.FloorID = f.FloorID
    LEFT JOIN ParkingSlots ps ON ps.ZoneID = z.ZoneID
    GROUP BY b.BuildingID, b.BuildingName, b.Address,
             b.OperatingHours, b.TotalFloors, b.CreatedAt, b.UpdatedAt
    ORDER BY b.BuildingID
  `);
    return result.recordset;
}

export async function updateBuilding(buildingId, data) {
    const pool = await getPool();
    await pool.request()
        .input("BuildingID", sql.Int, buildingId)
        .input("BuildingName", sql.NVarChar(100), data.buildingName)
        .input("Address", sql.NVarChar(200), data.address || null)
        .input("OperatingHours", sql.NVarChar(50), data.operatingHours || null)
        .input("TotalFloors", sql.Int, data.totalFloors || null)
        .query(`
      UPDATE Buildings
      SET BuildingName   = @BuildingName,
          Address        = @Address,
          OperatingHours = @OperatingHours,
          TotalFloors    = @TotalFloors,
          UpdatedAt      = GETDATE()
      WHERE BuildingID = @BuildingID
    `);

    const result = await pool.request()
        .input("BuildingID", sql.Int, buildingId)
        .query(`SELECT * FROM Buildings WHERE BuildingID = @BuildingID`);
    return result.recordset[0];
}

// ─────────────────────────────────────────────────────────────
// CONFIG – FLOORS
// ─────────────────────────────────────────────────────────────

export async function getFloors(buildingId) {
    const pool = await getPool();
    const result = await pool.request()
        .input("BuildingID", sql.Int, buildingId || null)
        .query(`
      SELECT
        f.FloorID,
        f.BuildingID,
        b.BuildingName,
        f.FloorName,
        f.IsActive,
        COUNT(DISTINCT z.ZoneID)    AS ZoneCount,
        COUNT(DISTINCT ps.SlotID)   AS SlotCount
      FROM Floors f
      JOIN Buildings b       ON b.BuildingID = f.BuildingID
      LEFT JOIN Zones z      ON z.FloorID = f.FloorID
      LEFT JOIN ParkingSlots ps ON ps.ZoneID = z.ZoneID
      WHERE (@BuildingID IS NULL OR f.BuildingID = @BuildingID)
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
// CONFIG – ZONES (Areas)
// ─────────────────────────────────────────────────────────────

export async function getZones(floorId) {
    const pool = await getPool();
    const result = await pool.request()
        .input("FloorID", sql.Int, floorId || null)
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
      JOIN Floors f       ON f.FloorID = z.FloorID
      JOIN Buildings b    ON b.BuildingID = f.BuildingID
      JOIN VehicleTypes vt ON vt.VehicleTypeID = z.AllowedVehicleTypeID
      LEFT JOIN ParkingSlots ps ON ps.ZoneID = z.ZoneID
      WHERE (@FloorID IS NULL OR z.FloorID = @FloorID)
        AND f.IsActive = 1
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
      SET ZoneName             = @ZoneName,
          AllowedVehicleTypeID = @AllowedVehicleTypeID,
          TotalSlots           = @TotalSlots
      WHERE ZoneID = @ZoneID
    `);
    const r = await pool.request()
        .input("ZoneID", sql.Int, zoneId)
        .query(`SELECT * FROM Zones WHERE ZoneID = @ZoneID`);
    return r.recordset[0];
}

// ─────────────────────────────────────────────────────────────
// SLOTS / POSITIONS
// ─────────────────────────────────────────────────────────────

export async function getParkingSlots({ buildingId, floorId, zoneId, status, vehicleTypeId, page = 1, limit = 50 }) {
    const pool = await getPool();
    const offset = (page - 1) * limit;

    const result = await pool.request()
        .input("BuildingID", sql.Int, buildingId || null)
        .input("FloorID", sql.Int, floorId || null)
        .input("ZoneID", sql.Int, zoneId || null)
        .input("Status", sql.NVarChar(20), status || null)
        .input("VehicleTypeID", sql.Int, vehicleTypeId || null)
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
        -- Session hiện tại (nếu Occupied)
        sess.SessionID,
        sess.PlateNumber,
        sess.EntryTime,
        DATEDIFF(MINUTE, sess.EntryTime, GETDATE()) AS ParkedMinutes
      FROM ParkingSlots ps
      JOIN VehicleTypes vt  ON vt.VehicleTypeID = ps.VehicleTypeID
      JOIN Zones z           ON z.ZoneID = ps.ZoneID
      JOIN Floors f          ON f.FloorID = z.FloorID
      JOIN Buildings b       ON b.BuildingID = f.BuildingID
      LEFT JOIN (
        SELECT SlotID, SessionID, PlateNumber, EntryTime
        FROM ParkingSessions
        WHERE SessionStatus = 'Active'
      ) sess ON sess.SlotID = ps.SlotID
      WHERE f.IsActive = 1
        AND (@BuildingID    IS NULL OR b.BuildingID    = @BuildingID)
        AND (@FloorID       IS NULL OR f.FloorID       = @FloorID)
        AND (@ZoneID        IS NULL OR z.ZoneID        = @ZoneID)
        AND (@Status        IS NULL OR ps.SlotStatus   = @Status)
        AND (@VehicleTypeID IS NULL OR ps.VehicleTypeID = @VehicleTypeID)
      ORDER BY b.BuildingID, f.FloorID, z.ZoneID, ps.SlotCode
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

    const countResult = await pool.request()
        .input("BuildingID", sql.Int, buildingId || null)
        .input("FloorID", sql.Int, floorId || null)
        .input("ZoneID", sql.Int, zoneId || null)
        .input("Status", sql.NVarChar(20), status || null)
        .input("VehicleTypeID", sql.Int, vehicleTypeId || null)
        .query(`
      SELECT COUNT(*) AS Total
      FROM ParkingSlots ps
      JOIN Zones z    ON z.ZoneID    = ps.ZoneID
      JOIN Floors f   ON f.FloorID   = z.FloorID
      JOIN Buildings b ON b.BuildingID = f.BuildingID
      WHERE f.IsActive = 1
        AND (@BuildingID    IS NULL OR b.BuildingID     = @BuildingID)
        AND (@FloorID       IS NULL OR f.FloorID        = @FloorID)
        AND (@ZoneID        IS NULL OR z.ZoneID         = @ZoneID)
        AND (@Status        IS NULL OR ps.SlotStatus    = @Status)
        AND (@VehicleTypeID IS NULL OR ps.VehicleTypeID = @VehicleTypeID)
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
        b.BuildingID, b.BuildingName
      FROM ParkingSlots ps
      JOIN VehicleTypes vt ON vt.VehicleTypeID = ps.VehicleTypeID
      JOIN Zones z          ON z.ZoneID = ps.ZoneID
      JOIN Floors f         ON f.FloorID = z.FloorID
      JOIN Buildings b      ON b.BuildingID = f.BuildingID
      WHERE ps.SlotID = @SlotID
    `);

    if (!slotResult.recordset[0]) {
        const err = new Error("Slot không tồn tại");
        err.statusCode = 404; throw err;
    }

    // Session hiện tại
    const sessResult = await pool.request()
        .input("SlotID", sql.Int, slotId)
        .query(`
      SELECT TOP 1
        s.SessionID, s.PlateNumber, s.EntryTime,
        s.SessionStatus, s.VehicleTypeID,
        DATEDIFF(MINUTE, s.EntryTime, GETDATE()) AS ParkedMinutes,
        u.FullName AS DriverName
      FROM ParkingSessions s
      JOIN Users u ON u.UserID = s.DriverID
      WHERE s.SlotID = @SlotID AND s.SessionStatus = 'Active'
      ORDER BY s.EntryTime DESC
    `);

    // Lịch sử 10 lần gần nhất
    const histResult = await pool.request()
        .input("SlotID", sql.Int, slotId)
        .query(`
      SELECT TOP 10
        s.SessionID,
        s.PlateNumber,
        s.EntryTime,
        s.ExitTime,
        s.SessionStatus,
        u.FullName AS DriverName,
        p.Amount,
        p.PaymentStatus
      FROM ParkingSessions s
      JOIN Users u    ON u.UserID = s.DriverID
      LEFT JOIN Payments p ON p.SessionID = s.SessionID
      WHERE s.SlotID = @SlotID
      ORDER BY s.EntryTime DESC
    `);

    return {
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

export async function getPricingPolicies({ vehicleTypeId, isActive } = {}) {
    const pool = await getPool();
    const result = await pool.request()
        .input("VehicleTypeID", sql.Int, vehicleTypeId || null)
        .input("IsActive", sql.Bit, isActive !== undefined ? isActive : null)
        .query(`
      SELECT
        pp.PricingPolicyID,
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
      WHERE (@VehicleTypeID IS NULL OR pp.VehicleTypeID = @VehicleTypeID)
        AND (@IsActive      IS NULL OR pp.IsActive      = @IsActive)
      ORDER BY pp.VehicleTypeID, pp.MinHours
    `);
    return result.recordset;
}

export async function createPricingPolicy(data) {
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
    await pool.request()
        .input("PricingPolicyID", sql.Int, policyId)
        .input("MinHours", sql.Decimal(5, 2), data.minHours)
        .input("MaxHours", sql.Decimal(5, 2), data.maxHours)
        .input("Fee", sql.Decimal(10, 2), data.fee)
        .input("IsOvernight", sql.Bit, data.isOvernight ? 1 : 0)
        .input("IsActive", sql.Bit, data.isActive !== undefined ? data.isActive : 1)
        .query(`
      UPDATE PricingPolicies
      SET MinHours    = @MinHours,
          MaxHours    = @MaxHours,
          Fee         = @Fee,
          IsOvernight = @IsOvernight,
          IsActive    = @IsActive
      WHERE PricingPolicyID = @PricingPolicyID
    `);
    const r = await pool.request()
        .input("PricingPolicyID", sql.Int, policyId)
        .query(`SELECT * FROM PricingPolicies WHERE PricingPolicyID = @PricingPolicyID`);
    return r.recordset[0];
}

// ─────────────────────────────────────────────────────────────
// INCIDENTS
// ─────────────────────────────────────────────────────────────

export async function getIncidents({ status, priority, page = 1, limit = 20, search } = {}) {
    const pool = await getPool();
    const offset = (page - 1) * limit;

    const result = await pool.request()
        .input("Status", sql.NVarChar(20), status || null)
        .input("Priority", sql.NVarChar(20), priority || null)
        .input("Search", sql.NVarChar(200), search || null)
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
        -- Session info
        i.SessionID,
        s.PlateNumber,
        s.EntryTime,
        -- Driver
        i.DriverID,
        d.FullName AS DriverName,
        d.Email    AS DriverEmail,
        -- Staff
        i.AssignedStaffID,
        st.FullName AS StaffName,
        -- Slot / Location
        ps.SlotCode,
        z.ZoneName,
        f.FloorName,
        b.BuildingName
      FROM Incidents i
      LEFT JOIN ParkingSessions s ON s.SessionID = i.SessionID
      LEFT JOIN ParkingSlots ps   ON ps.SlotID = s.SlotID
      LEFT JOIN Zones z           ON z.ZoneID = ps.ZoneID
      LEFT JOIN Floors f          ON f.FloorID = z.FloorID
      LEFT JOIN Buildings b       ON b.BuildingID = f.BuildingID
      LEFT JOIN Users d           ON d.UserID = i.DriverID
      LEFT JOIN Users st          ON st.UserID = i.AssignedStaffID
      WHERE (@Status   IS NULL OR i.IncidentStatus = @Status)
        AND (@Priority  IS NULL OR i.Priority       = @Priority)
        AND (@Search    IS NULL OR i.IncidentType LIKE '%' + @Search + '%'
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
        .query(`
      SELECT COUNT(*) AS Total
      FROM Incidents i
      LEFT JOIN ParkingSessions s ON s.SessionID = i.SessionID
      LEFT JOIN Users d           ON d.UserID = i.DriverID
      WHERE (@Status   IS NULL OR i.IncidentStatus = @Status)
        AND (@Priority  IS NULL OR i.Priority       = @Priority)
        AND (@Search    IS NULL OR i.IncidentType LIKE '%' + @Search + '%'
                               OR d.FullName      LIKE '%' + @Search + '%'
                               OR s.PlateNumber   LIKE '%' + @Search + '%'
                               OR CAST(i.IncidentID AS NVARCHAR) LIKE '%' + @Search + '%')
    `);

    return {
        data: result.recordset,
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
        d.FullName AS DriverName, d.Email AS DriverEmail, d.PhoneNumber AS DriverPhone,
        st.FullName AS StaffName,
        ps.SlotCode, z.ZoneName, f.FloorName, b.BuildingName
      FROM Incidents i
      LEFT JOIN ParkingSessions s ON s.SessionID = i.SessionID
      LEFT JOIN ParkingSlots ps   ON ps.SlotID = s.SlotID
      LEFT JOIN Zones z           ON z.ZoneID = ps.ZoneID
      LEFT JOIN Floors f          ON f.FloorID = z.FloorID
      LEFT JOIN Buildings b       ON b.BuildingID = f.BuildingID
      LEFT JOIN Users d           ON d.UserID = i.DriverID
      LEFT JOIN Users st          ON st.UserID = i.AssignedStaffID
      WHERE i.IncidentID = @IncidentID
    `);
    if (!result.recordset[0]) {
        const err = new Error("Incident không tồn tại");
        err.statusCode = 404; throw err;
    }
    return result.recordset[0];
}

export async function updateIncidentStatus(incidentId, { status, assignedStaffId }) {
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
        .query(`
      UPDATE Incidents
      SET IncidentStatus  = @IncidentStatus,
          AssignedStaffID = ISNULL(@AssignedStaffID, AssignedStaffID),
          UpdatedAt       = GETDATE()
      WHERE IncidentID = @IncidentID
    `);
    return getIncidentById(incidentId);
}

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────

export async function getRevenueReport({ startDate, endDate, groupBy = 'day' } = {}) {
    const pool = await getPool();
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);

    let dateGroup;
    if (groupBy === 'month') {
        dateGroup = "FORMAT(p.PaymentTime, 'yyyy-MM')";
    } else if (groupBy === 'week') {
        dateGroup = "CONCAT(YEAR(p.PaymentTime), '-W', RIGHT('0' + CAST(DATEPART(WEEK, p.PaymentTime) AS VARCHAR), 2))";
    } else {
        dateGroup = "CAST(p.PaymentTime AS DATE)";
    }

    const result = await pool.request()
        .input("StartDate", sql.Date, start)
        .input("EndDate", sql.Date, end)
        .query(`
      SELECT
        ${dateGroup}          AS Period,
        COUNT(*)              AS TransactionCount,
        SUM(p.Amount)         AS TotalRevenue,
        AVG(p.Amount)         AS AvgRevenue
      FROM Payments p
      WHERE p.PaymentStatus IN ('Completed', 'Prepaid')
        AND CAST(p.PaymentTime AS DATE) BETWEEN @StartDate AND @EndDate
      GROUP BY ${dateGroup}
      ORDER BY Period
    `);

    const summaryResult = await pool.request()
        .input("StartDate", sql.Date, start)
        .input("EndDate", sql.Date, end)
        .query(`
      SELECT
        COUNT(*)                                                         AS TotalTransactions,
        ISNULL(SUM(p.Amount), 0)                                         AS TotalRevenue,
        ISNULL(AVG(p.Amount), 0)                                         AS AvgPerTransaction,
        SUM(CASE WHEN p.PaymentMethod = 'Cash'    THEN p.Amount ELSE 0 END) AS CashRevenue,
        SUM(CASE WHEN p.PaymentMethod = 'Banking' THEN p.Amount ELSE 0 END) AS BankingRevenue
      FROM Payments p
      WHERE p.PaymentStatus IN ('Completed', 'Prepaid')
        AND CAST(p.PaymentTime AS DATE) BETWEEN @StartDate AND @EndDate
    `);

    return {
        period: { startDate: start, endDate: end, groupBy },
        summary: summaryResult.recordset[0],
        chart: result.recordset,
    };
}

export async function getOccupancyReport() {
    const pool = await getPool();

    const byFloor = await pool.request().query(`
    SELECT
      b.BuildingName,
      f.FloorName,
      COUNT(ps.SlotID)                                                AS TotalSlots,
      SUM(CASE WHEN ps.SlotStatus = 'Available'   THEN 1 ELSE 0 END) AS Available,
      SUM(CASE WHEN ps.SlotStatus = 'Occupied'    THEN 1 ELSE 0 END) AS Occupied,
      SUM(CASE WHEN ps.SlotStatus = 'Reserved'    THEN 1 ELSE 0 END) AS Reserved,
      SUM(CASE WHEN ps.SlotStatus = 'Maintenance' THEN 1 ELSE 0 END) AS Maintenance,
      CASE WHEN COUNT(ps.SlotID) = 0 THEN 0
           ELSE ROUND(
             100.0 * SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END)
             / COUNT(ps.SlotID), 1)
      END AS OccupancyPct
    FROM ParkingSlots ps
    JOIN Zones z    ON z.ZoneID = ps.ZoneID
    JOIN Floors f   ON f.FloorID = z.FloorID
    JOIN Buildings b ON b.BuildingID = f.BuildingID
    WHERE f.IsActive = 1
    GROUP BY b.BuildingID, b.BuildingName, f.FloorID, f.FloorName
    ORDER BY b.BuildingID, f.FloorID
  `);

    const byVehicleType = await pool.request().query(`
    SELECT
      vt.VehicleName,
      COUNT(ps.SlotID) AS TotalSlots,
      SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END) AS Occupied,
      CASE WHEN COUNT(ps.SlotID) = 0 THEN 0
           ELSE ROUND(
             100.0 * SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END)
             / COUNT(ps.SlotID), 1)
      END AS OccupancyPct
    FROM ParkingSlots ps
    JOIN VehicleTypes vt ON vt.VehicleTypeID = ps.VehicleTypeID
    GROUP BY vt.VehicleTypeID, vt.VehicleName
    ORDER BY vt.VehicleTypeID
  `);

    return { byFloor: byFloor.recordset, byVehicleType: byVehicleType.recordset };
}

export async function getSessionsReport({ startDate, endDate } = {}) {
    const pool = await getPool();
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);

    const result = await pool.request()
        .input("StartDate", sql.Date, start)
        .input("EndDate", sql.Date, end)
        .query(`
      SELECT
        COUNT(*)                                                           AS TotalSessions,
        SUM(CASE WHEN s.SessionStatus = 'Active'    THEN 1 ELSE 0 END)   AS ActiveSessions,
        SUM(CASE WHEN s.SessionStatus = 'Completed' THEN 1 ELSE 0 END)   AS CompletedSessions,
        SUM(CASE WHEN s.SessionStatus = 'Lost'      THEN 1 ELSE 0 END)   AS LostSessions,
        AVG(CASE WHEN s.ExitTime IS NOT NULL
                 THEN DATEDIFF(MINUTE, s.EntryTime, s.ExitTime)
                 ELSE NULL END) AS AvgParkingMinutes
      FROM ParkingSessions s
      WHERE CAST(s.EntryTime AS DATE) BETWEEN @StartDate AND @EndDate
    `);

    return { period: { startDate: start, endDate: end }, summary: result.recordset[0] };
}

// ─────────────────────────────────────────────────────────────
// USERS (staff management)
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