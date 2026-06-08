import { getPool, sql } from "../config/db.js";
import {
  getUserIdFromToken,
  getRoleNameFromToken,
} from "../utils/requestUser.js";
import {
  buildDateTime,
  getDurationHours,
  addHours,
} from "../utils/dateTimeUtils.js";
import { buildBookingCode } from "../utils/codeUtils.js";

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeVehicleTypeId(value) {
  if (value === undefined || value === null || value === "") return null;

  const numberValue = Number(value);

  if (!Number.isNaN(numberValue) && numberValue > 0) {
    return numberValue;
  }

  const text = String(value).trim().toLowerCase();

  if (["moto", "motorbike", "bike", "xe máy", "xe may"].includes(text)) return 1;
  if (["car", "oto", "ô tô", "o to"].includes(text)) return 2;
  if (["truck", "xe tải", "xe tai"].includes(text)) return 3;

  return null;
}

export async function getReservations(req) {
  const pool = await getPool();

  const userId = getUserIdFromToken(req);
  const roleName = getRoleNameFromToken(req);

  const request = pool.request();

  let whereSql = "";

  if (roleName === "Driver") {
    request.input("DriverID", sql.Int, userId);
    whereSql = "WHERE r.DriverID = @DriverID";
  }
  
  const result = await request.query(`
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

      z.ZoneName,
      f.FloorName,
      b.BuildingID,
      b.BuildingName,
      b.Address,

      r.ReservationDate,
      r.StartTime,
      r.EndTime,
      r.ReservationStatus,
      r.CreatedAt,

      latestSession.SessionID,
      latestSession.PlateNumber,

      CASE
        WHEN r.ReservationStatus = 'Reserved' AND r.EndTime >= GETDATE() THEN 'active'
        WHEN r.ReservationStatus = 'Completed' THEN 'used'
        WHEN r.ReservationStatus = 'Cancelled' THEN 'cancelled'
        WHEN r.ReservationStatus = 'Expired' OR r.EndTime < GETDATE() THEN 'expired'
        ELSE 'used'
      END AS StatusValue,

      CASE
        WHEN r.ReservationStatus = 'Reserved' AND r.EndTime >= GETDATE() THEN N'Đang hoạt động'
        WHEN r.ReservationStatus = 'Completed' THEN N'Đã sử dụng'
        WHEN r.ReservationStatus = 'Cancelled' THEN N'Đã hủy'
        WHEN r.ReservationStatus = 'Expired' OR r.EndTime < GETDATE() THEN N'Hết hạn'
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

    ${whereSql}
    ORDER BY r.ReservationID DESC
  `);

  return result.recordset;
}

export async function getReservationById(req) {
  const reservationId = Number(req.params.id);

  if (!Number.isInteger(reservationId) || reservationId <= 0) {
    throw createHttpError(400, "reservationId không hợp lệ.");
  }

  const pool = await getPool();

  const userId = getUserIdFromToken(req);
  const roleName = getRoleNameFromToken(req);

  const request = pool.request()
    .input("ReservationID", sql.Int, reservationId);

  let driverFilterSql = "";

  if (roleName === "Driver") {
    request.input("DriverID", sql.Int, userId);
    driverFilterSql = "AND r.DriverID = @DriverID";
  }

  const result = await request.query(`
    SELECT TOP 1
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

      z.ZoneName,
      f.FloorName,
      b.BuildingID,
      b.BuildingName,
      b.Address,

      r.ReservationDate,
      r.StartTime,
      r.EndTime,
      r.ReservationStatus,
      r.CreatedAt,

      latestSession.SessionID,
      latestSession.PlateNumber,

      CASE
        WHEN r.ReservationStatus = 'Reserved' AND r.EndTime >= GETDATE() THEN 'active'
        WHEN r.ReservationStatus = 'Completed' THEN 'used'
        WHEN r.ReservationStatus = 'Cancelled' THEN 'cancelled'
        WHEN r.ReservationStatus = 'Expired' OR r.EndTime < GETDATE() THEN 'expired'
        ELSE 'used'
      END AS StatusValue,

      CASE
        WHEN r.ReservationStatus = 'Reserved' AND r.EndTime >= GETDATE() THEN N'Đang hoạt động'
        WHEN r.ReservationStatus = 'Completed' THEN N'Đã sử dụng'
        WHEN r.ReservationStatus = 'Cancelled' THEN N'Đã hủy'
        WHEN r.ReservationStatus = 'Expired' OR r.EndTime < GETDATE() THEN N'Hết hạn'
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

    WHERE r.ReservationID = @ReservationID
    ${driverFilterSql}
  `);

  const reservation = result.recordset[0];

  if (!reservation) {
    throw createHttpError(404, "Không tìm thấy đặt chỗ.");
  }

  return reservation;
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
  const reservationDate = req.body.reservationDate || req.body.bookingDate;

  let startTime = req.body.startTime;
  let endTime = req.body.endTime;

  if (reservationDate && startTime && !String(startTime).includes("T")) {
    const startDateTime = buildDateTime(reservationDate, startTime);
    const durationHours = getDurationHours(req.body.duration);

    startTime = startDateTime;

    if (!endTime && durationHours) {
      endTime = addHours(startDateTime, durationHours);
    }
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (!vehicleTypeId) {
    throw createHttpError(400, "Loại phương tiện không hợp lệ.");
  }

  if (!reservationDate) {
    throw createHttpError(400, "Ngày đặt chỗ là bắt buộc.");
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw createHttpError(400, "Thời gian đặt chỗ không hợp lệ.");
  }

  if (end <= start) {
    throw createHttpError(400, "Thời gian kết thúc phải lớn hơn thời gian bắt đầu.");
  }

  const pool = await getPool();

  const slotResult = await pool.request()
    .input("BuildingID", sql.Int, buildingId)
    .input("VehicleTypeID", sql.Int, vehicleTypeId)
    .input("StartTime", sql.DateTime, start)
    .input("EndTime", sql.DateTime, end)
    .query(`
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
        AND ps.SlotStatus NOT IN ('Occupied', 'Maintenance', 'Blocked')
        AND NOT EXISTS (
          SELECT 1
          FROM Reservations r
          WHERE r.SlotID = ps.SlotID
            AND r.ReservationStatus = 'Reserved'
            AND @StartTime < r.EndTime
            AND @EndTime > r.StartTime
        )
        AND NOT EXISTS (
          SELECT 1
          FROM ParkingSessions s
          WHERE s.SlotID = ps.SlotID
            AND s.SessionStatus = 'Active'
            AND s.ExitTime IS NULL
        )
      ORDER BY ps.SlotID
    `);

  const slot = slotResult.recordset[0];

  if (!slot) {
    throw createHttpError(
      409,
      "Không còn chỗ trống phù hợp trong khoảng thời gian này."
    );
  }

  await pool.request()
    .input("DriverID", sql.Int, driverId)
    .input("VehicleTypeID", sql.Int, vehicleTypeId)
    .input("SlotID", sql.Int, slot.SlotID)
    .input("ReservationDate", sql.Date, reservationDate)
    .input("StartTime", sql.DateTime, start)
    .input("EndTime", sql.DateTime, end)
    .execute("sp_CreateReservation");

  const newestReservation = await pool.request()
    .input("DriverID", sql.Int, driverId)
    .input("SlotID", sql.Int, slot.SlotID)
    .input("StartTime", sql.DateTime, start)
    .input("EndTime", sql.DateTime, end)
    .query(`
      SELECT TOP 1
        ReservationID,
        DriverID,
        VehicleTypeID,
        SlotID,
        ReservationDate,
        StartTime,
        EndTime,
        ReservationStatus,
        CreatedAt
      FROM Reservations
      WHERE DriverID = @DriverID
        AND SlotID = @SlotID
        AND StartTime = @StartTime
        AND EndTime = @EndTime
      ORDER BY ReservationID DESC
    `);

  const reservation = newestReservation.recordset[0];

  return {
    reservation: {
      ...reservation,
      BookingCode: buildBookingCode(reservation.ReservationID),
      SlotCode: slot.SlotCode,
      ZoneName: slot.ZoneName,
      FloorName: slot.FloorName,
      BuildingID: slot.BuildingID,
      BuildingName: slot.BuildingName,
    },
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
        "Chỉ có thể hủy đặt chỗ đang ở trạng thái Reserved."
      );
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
      if (transaction._aborted !== true) {
        await transaction.rollback();
      }
    } catch {}

    throw err;
  }
}