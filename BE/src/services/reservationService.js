/**
 * FILE: reservationService.js
 * MÔ TẢ: Service xử lý nghiệp vụ đặt chỗ (Reservation).
 * Chức năng: Tìm vị trí trống (tích hợp AI gợi ý), Tạo/Hủy đặt chỗ, Lấy danh sách đặt chỗ của tài xế.
 */
/*
hieu
*/

import { getPool, sql } from "../config/db.js";
import { syncParkingSlotStatuses } from "./slotSyncService.js";
import { sendBookingConfirmation } from "./mailService.js";
import {
  buildDateTime,
  getDurationHours,
  addHours,
  getMinimumReservationStartTime,
} from "../utils/dateTimeUtils.js";
import { recommendOptimalSlot } from "./aiAllocationService.js";

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.statusCode = status;
  return error;
}

function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

function getRoleNameFromToken(req) {
  return req.user?.RoleName || req.user?.roleName;
}

function normalizeVehicleTypeId(value) {
  if (value === undefined || value === null || value === "") return null;

  const numberValue = Number(value);
  if (!Number.isNaN(numberValue) && numberValue > 0) return numberValue;

  const text = String(value).trim().toLowerCase();

  if (["moto", "motorbike", "bike", "xe máy", "xe may"].includes(text)) return 1;
  if (["car", "oto", "ô tô", "o to"].includes(text)) return 2;
  if (["truck", "xe tải", "xe tai"].includes(text)) return 3;

  return null;
}

async function expireOverdueReservations(pool) {
  await syncParkingSlotStatuses(pool);
}

function reservationBaseSelect() {
  return `
    SELECT
      r.ReservationID,
      CONCAT('BK-', RIGHT('0000' + CAST(r.ReservationID AS VARCHAR(10)), 4)) AS BookingCode,

      r.DriverID,
      u.FullName AS DriverName,
      u.Email AS DriverEmail,
      u.PhoneNumber AS DriverPhone,

      r.VehicleTypeID,
      vt.VehicleCode,
      vt.VehicleName,

      r.SlotID,
      ps.SlotCode,
      ps.SlotStatus,

      z.ZoneID,
      z.ZoneName,

      f.FloorID,
      f.FloorName,

      b.BuildingID,
      b.BuildingName,
      b.Address,

      r.ReservationDate,
      r.StartTime,
      r.EndTime,

      CONVERT(VARCHAR(16), r.StartTime, 120) AS StartTimeText,
      CONVERT(VARCHAR(16), r.EndTime, 120) AS EndTimeText,
      CONVERT(VARCHAR(10), r.StartTime, 120) AS StartDateText,
      CONVERT(VARCHAR(10), r.EndTime, 120) AS EndDateText,
      CONVERT(VARCHAR(5), r.StartTime, 108) AS StartClockText,
      CONVERT(VARCHAR(5), r.EndTime, 108) AS EndClockText,

      r.ReservationStatus,
      r.CreatedAt,

      latestSession.SessionID,
      latestSession.PlateNumber,

      CASE
        WHEN r.ReservationStatus = 'Cancelled' THEN 'cancelled'
        WHEN r.ReservationStatus = 'Completed' THEN 'used'
        WHEN r.ReservationStatus = 'Reserved' AND r.EndTime < GETDATE() THEN 'expired'
        WHEN r.ReservationStatus = 'Expired' AND r.EndTime < GETDATE() THEN 'expired'
        WHEN r.ReservationStatus IN ('Reserved', 'Expired') AND r.EndTime >= GETDATE() THEN 'active'
        ELSE 'used'
      END AS StatusValue,

      CASE
        WHEN r.ReservationStatus = 'Cancelled' THEN N'Đã hủy'
        WHEN r.ReservationStatus = 'Completed' THEN N'Đã sử dụng'
        WHEN r.ReservationStatus = 'Reserved' AND r.EndTime < GETDATE() THEN N'Hết hạn'
        WHEN r.ReservationStatus = 'Expired' AND r.EndTime < GETDATE() THEN N'Hết hạn'
        WHEN r.ReservationStatus IN ('Reserved', 'Expired') AND r.EndTime >= GETDATE() THEN N'Đang hoạt động'
        ELSE N'Đã sử dụng'
      END AS StatusLabel

    FROM Reservations r
    JOIN Users u ON r.DriverID = u.UserID
    JOIN VehicleTypes vt ON r.VehicleTypeID = vt.VehicleTypeID
    LEFT JOIN ParkingSlots ps ON r.SlotID = ps.SlotID
    LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
    LEFT JOIN Floors f ON z.FloorID = f.FloorID
    LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID

    OUTER APPLY (
      SELECT TOP 1
        s.SessionID,
        s.PlateNumber
      FROM ParkingSessions s
      WHERE s.DriverID = r.DriverID
        AND s.SlotID = r.SlotID
      ORDER BY s.EntryTime DESC
    ) latestSession
  `;
}

// =========================================================================
// CHỨC NĂNG 1: LẤY DANH SÁCH TẤT CẢ ĐƠN ĐẶT CHỖ (CÓ PHÂN QUYỀN VAI TRÒ)
// =========================================================================
export async function getReservations(req) {
  const pool = await getPool();

  // Tự động dọn dẹp các đơn đặt chỗ đã quá hạn
  await expireOverdueReservations(pool);

  const userId = getUserIdFromToken(req);
  const roleName = getRoleNameFromToken(req);

  const request = pool.request();
  let whereSql = "";

  // Phân quyền dữ liệu: Nếu là Tài xế (Driver), chỉ lọc ra danh sách đặt chỗ của chính tài xế đó
  if (roleName === "Driver") {
    request.input("DriverID", sql.Int, userId);
    whereSql = "WHERE r.DriverID = @DriverID";
  }

  // Chạy câu SQL lấy danh sách (kèm JOIN thông tin Tòa nhà, Tầng, Vị trí đỗ và Phiên đỗ mới nhất)
  const result = await request.query(`
    ${reservationBaseSelect()}
    ${whereSql}
    ORDER BY r.ReservationID DESC
  `);

  return result.recordset;
}

// =========================================================================
// CHỨC NĂNG 2: XEM CHI TIẾT 1 ĐƠN ĐẶT CHỖ THEO ID
// =========================================================================
export async function getReservationById(req) {
  const pool = await getPool();

  // Tự động dọn dẹp các đơn đặt chỗ đã quá hạn
  await expireOverdueReservations(pool);

  const reservationId = Number(req.params.id);
  const userId = getUserIdFromToken(req);
  const roleName = getRoleNameFromToken(req);

  if (!Number.isInteger(reservationId) || reservationId <= 0) {
    throw createHttpError(400, "reservationId không hợp lệ.");
  }

  const request = pool.request().input("ReservationID", sql.Int, reservationId);
  let driverFilterSql = "";

  // Bảo mật: Nếu là Driver, chỉ cho phép xem chi tiết đơn của CHÍNH MÌNH
  if (roleName === "Driver") {
    request.input("DriverID", sql.Int, userId);
    driverFilterSql = "AND r.DriverID = @DriverID";
  }

  const result = await request.query(`
    ${reservationBaseSelect()}
    WHERE r.ReservationID = @ReservationID
      ${driverFilterSql}
  `);

  const reservation = result.recordset[0];

  if (!reservation) {
    throw createHttpError(404, "Không tìm thấy đặt chỗ.");
  }

  return reservation;
}

// =========================================================================
// CHỨC NĂNG 3: TÌM VỊ TRÍ ĐỖ CÒN TRỐNG (TÍCH HỢP THUẬT TOÁN AI GỢI Ý SLOT)
// =========================================================================
export async function getAvailableSlots(req) {
  const pool = await getPool();

  await expireOverdueReservations(pool);

  // 1. Đọc & chuẩn hóa thông số tìm kiếm từ Query String (vehicleTypeId, buildingId, ngày, giờ...)
  const vehicleTypeId = normalizeVehicleTypeId(
    req.query.vehicleTypeId || req.query.vehicleType
  );

  const buildingId = Number(req.query.buildingId || 1);
  const reservationDate = req.query.reservationDate || req.query.bookingDate;
  const startTime = req.query.startTime;
  const duration = req.query.duration;
  const endTimeInput = req.query.endTime;

  if (!vehicleTypeId) {
    throw createHttpError(400, "Loại phương tiện không hợp lệ.");
  }

  if (!reservationDate || !startTime) {
    throw createHttpError(400, "Ngày và giờ bắt đầu là bắt buộc.");
  }

  // 2. Tính mốc giờ Start & End
  const start = buildDateTime(reservationDate, startTime);
  const durationHours = getDurationHours(duration);
  const end = endTimeInput
    ? buildDateTime(reservationDate, endTimeInput)
    : addHours(start, durationHours || 4);

  const minimumStart = getMinimumReservationStartTime();

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw createHttpError(400, "Thời gian không hợp lệ.");
  }

  // 3. Validation: Không cho tìm chỗ sát dưới 15 phút so với hiện tại
  if (start < minimumStart) {
    throw createHttpError(
      400,
      "Thời gian đặt chỗ phải cách thời gian hiện tại tối thiểu 15 phút."
    );
  }

  if (end <= start) {
    throw createHttpError(
      400,
      "Thời gian kết thúc phải lớn hơn thời gian bắt đầu."
    );
  }

  // 4. Query SQL quét tất cả các ô đỗ và tính toán trạng thái DisplayStatus ('occupied' hay 'available')
  const result = await pool.request()
    .input("BuildingID", sql.Int, buildingId)
    .input("VehicleTypeID", sql.Int, vehicleTypeId)
    .input("StartTime", sql.DateTime, start)
    .input("EndTime", sql.DateTime, end)
    .query(`
      SELECT
        ps.SlotID,
        ps.SlotCode,
        ps.SlotStatus,
        ps.VehicleTypeID,

        vt.VehicleCode,
        vt.VehicleName,

        z.ZoneID,
        z.ZoneName,

        f.FloorID,
        f.FloorName,

        b.BuildingID,
        b.BuildingName,
        b.Address,

        -- TÍNH TRẠNG THÁI HIỂN THỊ TRÊN SƠ ĐỒ BÃI ĐỖ:
        CASE
          WHEN ps.SlotStatus IN ('Maintenance', 'Blocked') THEN 'occupied'  -- Đang bảo trì/bị khóa

          WHEN EXISTS (  -- Có xe đang đỗ thực tế
            SELECT 1
            FROM ParkingSessions s
            WHERE s.SlotID = ps.SlotID
              AND s.SessionStatus = 'Active'
              AND s.ExitTime IS NULL
          ) THEN 'occupied'

          WHEN EXISTS (  -- Có đơn đặt chỗ trùng khung giờ
            SELECT 1
            FROM Reservations r
            WHERE r.SlotID = ps.SlotID
              AND r.ReservationStatus = 'Reserved'
              AND @StartTime < r.EndTime
              AND @EndTime > r.StartTime
          ) THEN 'occupied'

          ELSE 'available'  -- Trống hoàn toàn -> Có thể đặt
        END AS DisplayStatus

      FROM ParkingSlots ps
      JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
      JOIN Zones z ON ps.ZoneID = z.ZoneID
      JOIN Floors f ON z.FloorID = f.FloorID
      JOIN Buildings b ON f.BuildingID = b.BuildingID
      WHERE b.BuildingID = @BuildingID
        AND ps.VehicleTypeID = @VehicleTypeID
        AND vt.IsActive = 1
        AND f.IsActive = 1
      ORDER BY
        f.FloorID,
        z.ZoneID,
        ps.SlotID
    `);

  const slots = result.recordset;

  // 5. TÍCH HỢP AI GỢI Ý: Chạy thuật toán AI chọn ô đỗ tối ưu nhất và gắn cờ isAIRec = true
  const bestSlot = recommendOptimalSlot(slots);
  if (bestSlot) {
    bestSlot.isAIRec = true;
  }

  return slots;
}

export async function createReservation(req) {
  // =========================================================================
  // KHÚC 1: LẤY USER ID TỪ TOKEN & CHUẨN HÓA THÔNG TIN ĐẦU VÀO
  // =========================================================================
  const driverId = getUserIdFromToken(req);

  if (!driverId) {
    throw createHttpError(
      401,
      "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại."
    );
  }

  // Đổi các tên loại xe "moto"/"car" thành ID số tương ứng (1, 2, 3)
  const vehicleTypeId = normalizeVehicleTypeId(
    req.body.vehicleTypeId || req.body.vehicleType
  );

  const buildingId = Number(req.body.buildingId || 1);
  const requestedSlotId = Number(req.body.slotId || 0);
  const reservationDate = req.body.reservationDate || req.body.bookingDate;
  const startTime = req.body.startTime;
  const durationHours = getDurationHours(req.body.duration);
  const licensePlate = req.body.licensePlate ? req.body.licensePlate.trim().toUpperCase() : null;

  // =========================================================================
  // KHÚC 2: TÍNH TOÁN NGÀY-GIỜ & KIỂM TRA THỜI GIAN HỢP LỆ (VALIDATION)
  // =========================================================================
  // Ghép ngày và giờ bắt đầu thành Date object đầy đủ
  const start = buildDateTime(reservationDate, startTime);
  // Tính giờ kết thúc: nếu không có endTime thì lấy (Start + duration)
  const end = req.body.endTime
    ? buildDateTime(reservationDate, req.body.endTime)
    : addHours(start, durationHours || 4);

  // Mốc thời gian tối thiểu được phép đặt (Thời gian hiện tại + 15 phút)
  const minimumStart = getMinimumReservationStartTime();

  if (!vehicleTypeId) {
    throw createHttpError(400, "Loại phương tiện không hợp lệ.");
  }

  if (!reservationDate) {
    throw createHttpError(400, "Ngày đặt chỗ là bắt buộc.");
  }

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw createHttpError(400, "Thời gian đặt chỗ không hợp lệ.");
  }

  // Chặn đặt lịch dưới 15 phút so với hiện tại
  if (start < minimumStart) {
    throw createHttpError(
      400,
      "Thời gian đặt chỗ phải cách thời gian hiện tại tối thiểu 15 phút."
    );
  }

  // Chặn giờ kết thúc nhỏ hơn hoặc bằng giờ bắt đầu
  if (end <= start) {
    throw createHttpError(
      400,
      "Thời gian kết thúc phải lớn hơn thời gian bắt đầu."
    );
  }

  // =========================================================================
  // KHÚC 3: QUÉT DATABASE CHECK CHỐNG TRÙNG BIỂN SỐ & CHỐNG GIAN LẬN
  // =========================================================================
  const pool = await getPool();

  // Quét dọn các đơn cũ quá hạn trong DB
  await expireOverdueReservations(pool);

  if (licensePlate) {
    // 1. CHECK TRÙNG GIỜ: Cùng biển số xem có đơn nào 'Reserved' bị chồng khung giờ không
    // (Cho phép: 2 khung giờ nối tiếp nhau không chồng đè)
    const overlapCheck = await pool.request()
      .input("PlateNumber", sql.NVarChar(20), licensePlate)
      .input("StartTime", sql.DateTime, start)
      .input("EndTime", sql.DateTime, end)
      .query(`
        SELECT TOP 1 1
        FROM Reservations
        WHERE PlateNumber = @PlateNumber
          AND ReservationStatus = 'Reserved'
          AND @StartTime < EndTime
          AND @EndTime > StartTime
      `);

    if (overlapCheck.recordset.length > 0) {
      const err = createHttpError(409, "Xe này đã có đặt chỗ trùng khung giờ.")
      err.code = 'PLATE_ALREADY_BOOKED'
      throw err
    }

    // 2. CHECK XE TRONG BÃI: Cùng biển số xem có đang có phiên đỗ (Active session) chưa ra không
    const activeSessionCheck = await pool.request()
      .input("PlateNumber", sql.NVarChar(20), licensePlate)
      .query(`
        SELECT TOP 1 1
        FROM ParkingSessions
        WHERE PlateNumber = @PlateNumber
          AND SessionStatus = 'Active'
          AND ExitTime IS NULL
      `);

    if (activeSessionCheck.recordset.length > 0) {
      const err = createHttpError(409, "Xe này đang trong bãi, không thể đặt chỗ khi đang đỗ.")
      err.code = 'PLATE_ALREADY_PARKED'
      throw err
    }
  }

  // =========================================================================
  // KHÚC 4: KIỂM TRA Ô ĐỖ (SLOT) CHỌN CÓ THỰC SỰ CÒN TRỐNG KHÔNG
  // =========================================================================
  const slotRequest = pool.request()
    .input("BuildingID", sql.Int, buildingId)
    .input("VehicleTypeID", sql.Int, vehicleTypeId)
    .input("StartTime", sql.DateTime, start)
    .input("EndTime", sql.DateTime, end);

  let requestedSlotFilter = "";

  if (Number.isInteger(requestedSlotId) && requestedSlotId > 0) {
    slotRequest.input("RequestedSlotID", sql.Int, requestedSlotId);
    requestedSlotFilter = "AND ps.SlotID = @RequestedSlotID";
  }

  // Truy vấn kiểm tra 3 điều kiện: Không bảo trì, Không có xe đỗ thực tế, Không có ai đè giờ
  const slotResult = await slotRequest.query(`
    SELECT TOP 1
      ps.SlotID,
      ps.SlotCode,
      z.ZoneName,
      f.FloorName,
      b.BuildingID,
      b.BuildingName
    FROM ParkingSlots ps
    JOIN Zones z ON ps.ZoneID = z.ZoneID
    JOIN Floors f ON z.FloorID = f.FloorID
    JOIN Buildings b ON f.BuildingID = b.BuildingID
    WHERE b.BuildingID = @BuildingID
      AND ps.VehicleTypeID = @VehicleTypeID
      ${requestedSlotFilter}
      AND ps.SlotStatus NOT IN ('Maintenance', 'Blocked')
      AND NOT EXISTS (
        SELECT 1
        FROM ParkingSessions s
        WHERE s.SlotID = ps.SlotID
          AND s.SessionStatus = 'Active'
          AND s.ExitTime IS NULL
      )
      AND NOT EXISTS (
        SELECT 1
        FROM Reservations r
        WHERE r.SlotID = ps.SlotID
          AND r.ReservationStatus = 'Reserved'
          AND @StartTime < r.EndTime
          AND @EndTime > r.StartTime
      )
    ORDER BY
      f.FloorID,
      z.ZoneID,
      ps.SlotID
  `);

  const slot = slotResult.recordset[0];

  if (!slot) {
    throw createHttpError(
      409,
      "Vị trí bạn chọn không còn trống trong khoảng thời gian này. Vui lòng chọn vị trí khác."
    );
  }

  // =========================================================================
  // KHÚC 5: GỌI STORED PROCEDURE LƯU DB & SELECT LẠI BẢN GHI VỪA TẠO
  // =========================================================================
  // Thực thi Stored Procedure để chèn bản ghi mới vào bảng Reservations
  await pool.request()
    .input("DriverID", sql.Int, driverId)
    .input("VehicleTypeID", sql.Int, vehicleTypeId)
    .input("SlotID", sql.Int, slot.SlotID)
    .input("ReservationDate", sql.Date, reservationDate)
    .input("StartTime", sql.DateTime, start)
    .input("EndTime", sql.DateTime, end)
    .input("PlateNumber", sql.NVarChar(20), licensePlate)
    .execute("sp_CreateReservation");

  // Query lấy lại chính bản ghi vừa tạo để lấy ReservationID và định dạng văn bản (BK-xxxx)
  const newestReservation = await pool.request()
    .input("DriverID", sql.Int, driverId)
    .input("SlotID", sql.Int, slot.SlotID)
    .input("StartTime", sql.DateTime, start)
    .input("EndTime", sql.DateTime, end)
    .query(`
      SELECT TOP 1
        r.ReservationID,
        CONCAT('BK-', RIGHT('0000' + CAST(r.ReservationID AS VARCHAR(10)), 4)) AS BookingCode,
        r.DriverID,
        r.VehicleTypeID,
        r.SlotID,
        r.PlateNumber,
        r.ReservationDate,
        r.StartTime,
        r.EndTime,
        CONVERT(VARCHAR(16), r.StartTime, 120) AS StartTimeText,
        CONVERT(VARCHAR(16), r.EndTime, 120) AS EndTimeText,
        CONVERT(VARCHAR(10), r.StartTime, 120) AS StartDateText,
        CONVERT(VARCHAR(10), r.EndTime, 120) AS EndDateText,
        CONVERT(VARCHAR(5), r.StartTime, 108) AS StartClockText,
        CONVERT(VARCHAR(5), r.EndTime, 108) AS EndClockText,
        r.ReservationStatus,
        r.CreatedAt
      FROM Reservations r
      WHERE r.DriverID = @DriverID
        AND r.SlotID = @SlotID
        AND r.StartTime = @StartTime
        AND r.EndTime = @EndTime
      ORDER BY r.ReservationID DESC
    `);

  // =========================================================================
  // KHÚC 6: ĐÓNG GÓI KẾT QUẢ & BẮN EMAIL XÁC NHẬN BẤT ĐỒNG BỘ (BACKGROUND)
  // =========================================================================
  const reservation = newestReservation.recordset[0];
  const fullBooking = {
    ...reservation,
    SlotCode: slot.SlotCode,
    ZoneName: slot.ZoneName,
    FloorName: slot.FloorName,
    BuildingID: slot.BuildingID,
    BuildingName: slot.BuildingName,
    StatusValue: "active",
    StatusLabel: "Đang hoạt động",
  };

  // Gửi email xác nhận đặt chỗ bất đồng bộ (không dùng await để tránh làm chậm response)
  pool.request()
    .input("DriverID", sql.Int, driverId)
    .query(`SELECT FullName, Email FROM Users WHERE UserID = @DriverID`)
    .then((userRes) => {
      const user = userRes.recordset[0];
      if (user && user.Email) {
        sendBookingConfirmation(user.Email, user.FullName, fullBooking);
      }
    })
    .catch((err) => {
      console.error("Failed to query driver for booking email confirmation:", err.message);
    });

  return {
    reservation: fullBooking,
  };
}

// =========================================================================
// CHỨC NĂNG 4: HỦY ĐƠN ĐẶT CHỖ (DÙNG SQL TRANSACTION BẢO VỆ DỮ LIỆU)
// =========================================================================
export async function cancelReservation(req) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool); // Tạo Transaction để đảm bảo tính toàn vẹn

  try {
    const reservationId = Number(req.params.id);

    if (!Number.isInteger(reservationId) || reservationId <= 0) {
      throw createHttpError(400, "reservationId không hợp lệ.");
    }

    const driverId = getUserIdFromToken(req);
    const roleName = getRoleNameFromToken(req);

    if (!driverId) {
      throw createHttpError(
        401,
        "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại."
      );
    }

    // 1. Quét dọn các đơn hết hạn
    await expireOverdueReservations(pool);
    
    // 2. Bắt đầu Transaction
    await transaction.begin();

    const request = new sql.Request(transaction)
      .input("ReservationID", sql.Int, reservationId);

    let driverFilterSql = "";

    // Phân quyền: Driver chỉ được hủy đơn của CHÍNH MÌNH
    if (roleName === "Driver") {
      request.input("DriverID", sql.Int, driverId);
      driverFilterSql = "AND r.DriverID = @DriverID";
    }

    // ─────────────────────────────────────────────────────────────────
    // 🔹 QUERY 1 / 4 TRONG TRANSACTION: ĐỌC THÔNG TIN ĐƠN ĐẶT CHỖ (SELECT)
    // ─────────────────────────────────────────────────────────────────
    const reservationResult = await request.query(`
      SELECT TOP 1
        r.ReservationID,
        r.DriverID,
        r.SlotID,
        r.ReservationStatus,
        r.StartTime,
        r.EndTime,
        ps.SlotStatus
      FROM Reservations r
      LEFT JOIN ParkingSlots ps ON r.SlotID = ps.SlotID
      WHERE r.ReservationID = @ReservationID
      ${driverFilterSql}
    `);

    const reservation = reservationResult.recordset[0];

    if (!reservation) {
      throw createHttpError(
        404,
        "Không tìm thấy đặt chỗ hoặc bạn không có quyền hủy đặt chỗ này."
      );
    }

    // 4. CHECK ĐIỀU KIỆN 1: Chỉ cho phép hủy đơn đang ở trạng thái 'Reserved'
    if (reservation.ReservationStatus !== "Reserved") {
      throw createHttpError(
        400,
        "Chỉ có thể hủy đặt chỗ đang hoạt động/chưa check-in."
      );
    }

    // 5. CHECK ĐIỀU KIỆN 2: Không thể hủy đơn đã quá hạn thời gian
    if (reservation.EndTime < new Date()) {
      throw createHttpError(400, "Đặt chỗ đã hết hạn, không thể hủy.");
    }

    // ─────────────────────────────────────────────────────────────────
    // 🔹 QUERY 2 / 4 TRONG TRANSACTION: CHECK XE ĐÃ CHECK-IN CHƯA (SELECT)
    // ─────────────────────────────────────────────────────────────────
    const activeSessionResult = await new sql.Request(transaction)
      .input("DriverID", sql.Int, reservation.DriverID)
      .input("SlotID", sql.Int, reservation.SlotID)
      .query(`
        SELECT TOP 1 SessionID
        FROM ParkingSessions
        WHERE DriverID = @DriverID
          AND SlotID = @SlotID
          AND SessionStatus = 'Active'
          AND ExitTime IS NULL
      `);

    if (activeSessionResult.recordset.length > 0) {
      throw createHttpError(
        409,
        "Không thể hủy vì xe đã được check-in và đang có phiên đỗ hoạt động."
      );
    }

    // ─────────────────────────────────────────────────────────────────
    // 🔹 QUERY 3 / 4 TRONG TRANSACTION: CẬP NHẬT TRẠNG THÁI HỦY (UPDATE 1)
    // ─────────────────────────────────────────────────────────────────
    await new sql.Request(transaction)
      .input("ReservationID", sql.Int, reservationId)
      .query(`
        UPDATE Reservations
        SET ReservationStatus = 'Cancelled'
        WHERE ReservationID = @ReservationID
      `);

    // ─────────────────────────────────────────────────────────────────
    // 🔹 QUERY 4 / 4 TRONG TRANSACTION: MỞ LẠI Ô ĐỖ XE (UPDATE 2)
    // ─────────────────────────────────────────────────────────────────
    await new sql.Request(transaction)
      .input("SlotID", sql.Int, reservation.SlotID)
      .query(`
        UPDATE ParkingSlots
        SET SlotStatus =
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM ParkingSessions s
              WHERE s.SlotID = @SlotID
                AND s.SessionStatus = 'Active'
                AND s.ExitTime IS NULL
            )
            THEN 'Occupied'

            WHEN EXISTS (
              SELECT 1
              FROM Reservations r
              WHERE r.SlotID = @SlotID
                AND r.ReservationStatus = 'Reserved'
                AND r.EndTime >= GETDATE()
            )
            THEN 'Reserved'

            ELSE 'Available'
          END
        WHERE SlotID = @SlotID
      `);

    // 9. Cam kết lưu dữ liệu Transaction thành công
    await transaction.commit();

    return {
      reservationId,
      status: "Cancelled",
    };
  } catch (err) {
    // Nếu có bất kỳ lỗi nào xảy ra -> Rollback hủy bỏ toàn bộ các câu lệnh SQL ở trên
    try {
      await transaction.rollback();
    } catch {}

    throw err;
  }
}