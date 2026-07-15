/**
 * FILE: reservationService.js
 * MÔ TẢ: Service xử lý nghiệp vụ đặt chỗ (Reservation).
 * Chức năng: Tìm vị trí trống (tích hợp AI gợi ý), Tạo/Hủy đặt chỗ, Lấy danh sách đặt chỗ của tài xế.
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

export async function getReservations(req) {
  const pool = await getPool();

  await expireOverdueReservations(pool);

  const userId = getUserIdFromToken(req);
  const roleName = getRoleNameFromToken(req);

  const request = pool.request();
  let whereSql = "";

  if (roleName === "Driver") {
    request.input("DriverID", sql.Int, userId);
    whereSql = "WHERE r.DriverID = @DriverID";
  }

  const result = await request.query(`
    ${reservationBaseSelect()}
    ${whereSql}
    ORDER BY r.ReservationID DESC
  `);

  return result.recordset;
}

export async function getReservationById(req) {
  const pool = await getPool();

  await expireOverdueReservations(pool);

  const reservationId = Number(req.params.id);
  const userId = getUserIdFromToken(req);
  const roleName = getRoleNameFromToken(req);

  if (!Number.isInteger(reservationId) || reservationId <= 0) {
    throw createHttpError(400, "reservationId không hợp lệ.");
  }

  const request = pool.request().input("ReservationID", sql.Int, reservationId);
  let driverFilterSql = "";

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

export async function getAvailableSlots(req) {
  const pool = await getPool();

  await expireOverdueReservations(pool);

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

  const start = buildDateTime(reservationDate, startTime);
  const durationHours = getDurationHours(duration);
  const end = endTimeInput
    ? buildDateTime(reservationDate, endTimeInput)
    : addHours(start, durationHours || 4);

  const minimumStart = getMinimumReservationStartTime();

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw createHttpError(400, "Thời gian không hợp lệ.");
  }

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

        CASE
          WHEN ps.SlotStatus IN ('Maintenance', 'Blocked') THEN 'occupied'

          WHEN EXISTS (
            SELECT 1
            FROM ParkingSessions s
            WHERE s.SlotID = ps.SlotID
              AND s.SessionStatus = 'Active'
              AND s.ExitTime IS NULL
          ) THEN 'occupied'

          WHEN EXISTS (
            SELECT 1
            FROM Reservations r
            WHERE r.SlotID = ps.SlotID
              AND r.ReservationStatus = 'Reserved'
              AND @StartTime < r.EndTime
              AND @EndTime > r.StartTime
          ) THEN 'occupied'

          ELSE 'available'
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

  // Áp dụng AI Allocation Service để gán AIScore cho các slot available
  const bestSlot = recommendOptimalSlot(slots);
  if (bestSlot) {
    bestSlot.isAIRec = true;
  }

  return slots;
}

export async function createReservation(req) {
  const driverId = getUserIdFromToken(req);

  if (!driverId) {
    throw createHttpError(
      401,
      "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại."
    );
  }

  const vehicleTypeId = normalizeVehicleTypeId(
    req.body.vehicleTypeId || req.body.vehicleType
  );

  const buildingId = Number(req.body.buildingId || 1);
  const requestedSlotId = Number(req.body.slotId || 0);
  const reservationDate = req.body.reservationDate || req.body.bookingDate;
  const startTime = req.body.startTime;
  const durationHours = getDurationHours(req.body.duration);
  const licensePlate = req.body.licensePlate ? req.body.licensePlate.trim().toUpperCase() : null;

  const start = buildDateTime(reservationDate, startTime);
  const end = req.body.endTime
    ? buildDateTime(reservationDate, req.body.endTime)
    : addHours(start, durationHours || 4);

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

  const pool = await getPool();

  await expireOverdueReservations(pool);

  if (licensePlate) {
    // Chặn trùng giờ: cùng biển số, cùng khoảng thời gian (overlap) → không cho đặt
    // Cho phép: cùng biển số, 2 khung giờ liên tiếp không chồng nhau (gia hạn)
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

    // Chặn nếu xe đang trong bãi (Active session) → không thể đặt thêm
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

  await pool.request()
    .input("DriverID", sql.Int, driverId)
    .input("VehicleTypeID", sql.Int, vehicleTypeId)
    .input("SlotID", sql.Int, slot.SlotID)
    .input("ReservationDate", sql.Date, reservationDate)
    .input("StartTime", sql.DateTime, start)
    .input("EndTime", sql.DateTime, end)
    .input("PlateNumber", sql.NVarChar(20), licensePlate)
    .execute("sp_CreateReservation");

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

  // Gửi email xác nhận đặt chỗ bất đồng bộ
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

export async function cancelReservation(req) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

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

    await expireOverdueReservations(pool);
    await transaction.begin();

    const request = new sql.Request(transaction)
      .input("ReservationID", sql.Int, reservationId);

    let driverFilterSql = "";

    if (roleName === "Driver") {
      request.input("DriverID", sql.Int, driverId);
      driverFilterSql = "AND r.DriverID = @DriverID";
    }

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

    if (reservation.ReservationStatus !== "Reserved") {
      throw createHttpError(
        400,
        "Chỉ có thể hủy đặt chỗ đang hoạt động/chưa check-in."
      );
    }

    if (reservation.EndTime < new Date()) {
      throw createHttpError(400, "Đặt chỗ đã hết hạn, không thể hủy.");
    }

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

    await new sql.Request(transaction)
      .input("ReservationID", sql.Int, reservationId)
      .query(`
        UPDATE Reservations
        SET ReservationStatus = 'Cancelled'
        WHERE ReservationID = @ReservationID
      `);

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

    await transaction.commit();

    return {
      reservationId,
      status: "Cancelled",
    };
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {}

    throw err;
  }
}