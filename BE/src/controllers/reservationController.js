import { getPool, sql } from "../config/db.js";

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

function buildDateTime(date, time) {
  if (!date || !time) return null;
  if (String(time).includes("T")) return new Date(time);
  return new Date(`${date}T${time}:00`);
}

function getDurationHours(duration) {
  if (!duration) return null;
  if (typeof duration === "number") return duration;

  const text = String(duration).trim().toLowerCase();

  if (text === "4h") return 4;
  if (text === "8h") return 8;
  if (text === "24h") return 24;
  if (text === "cả ngày" || text === "ca ngay" || text === "full-day") return 24;

  const matched = text.match(/\d+/);
  return matched ? Number(matched[0]) : null;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function buildBookingCode(reservationId) {
  return `BK-${String(reservationId).padStart(4, "0")}`;
}

export async function getReservations(req, res, next) {
  try {
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

    return res.json({
      success: true,
      data: result.recordset,
    });
  } catch (err) {
    next(err);
  }
}

export async function getReservationById(req, res, next) {
  try {
    const reservationId = Number(req.params.id);

    if (!Number.isInteger(reservationId) || reservationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "reservationId không hợp lệ.",
      });
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
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt chỗ.",
      });
    }

    return res.json({
      success: true,
      data: reservation,
    });
  } catch (err) {
    next(err);
  }
}

export async function createReservation(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
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
      return res.status(400).json({
        success: false,
        message: "Loại phương tiện không hợp lệ.",
      });
    }

    if (!reservationDate) {
      return res.status(400).json({
        success: false,
        message: "Ngày đặt chỗ là bắt buộc.",
      });
    }

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Thời gian đặt chỗ không hợp lệ.",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "Thời gian kết thúc phải lớn hơn thời gian bắt đầu.",
      });
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
      return res.status(409).json({
        success: false,
        message: "Không còn chỗ trống phù hợp trong khoảng thời gian này.",
      });
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

    return res.status(201).json({
      success: true,
      message: "Đặt chỗ thành công.",
      data: {
        reservation: {
          ...reservation,
          BookingCode: buildBookingCode(reservation.ReservationID),
          SlotCode: slot.SlotCode,
          ZoneName: slot.ZoneName,
          FloorName: slot.FloorName,
          BuildingID: slot.BuildingID,
          BuildingName: slot.BuildingName,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}