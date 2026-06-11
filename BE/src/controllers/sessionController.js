import { getPool, sql } from "../config/db.js";
import * as sessionService from "../services/sessionService.js";

function getErrorStatus(err) {
  return err.status || err.statusCode || 500;
}

function sendClientError(res, err) {
  const status = getErrorStatus(err);

  if (status < 500) {
    return res.status(status).json({
      success: false,
      message: err.message,
    });
  }

  return null;
}

function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

export async function getSessions(req, res, next) {
  try {
    const data = await sessionService.getSessions();
    res.status(StatusCodes.OK).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function checkInVehicle(req, res, next) {
  try {
    const data = await sessionService.checkInVehicle(req);

    return res.status(201).json({
      success: true,
      message: "Check-in thành công.",
      data,
    });
  } catch (err) {
    const handled = sendClientError(res, err);

    if (handled) return handled;

    next(err);
  }
}

export async function checkOutVehicle(req, res, next) {
  try {
    const data = await sessionService.checkOutVehicle(req);

    return res.json({
      success: true,
      message: "Check-out thành công.",
      data,
    });
  } catch (err) {
    const handled = sendClientError(res, err);

    if (handled) return handled;

    next(err);
  }
}

export async function getCurrentDriverSession(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế.",
      });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 1
          s.SessionID,
          CONCAT(
            'SESS-',
            CONVERT(CHAR(8), s.EntryTime, 112),
            '-',
            RIGHT('0000' + CAST(s.SessionID AS VARCHAR(10)), 4)
          ) AS SessionCode,

          s.DriverID,
          s.PlateNumber,
          s.VehicleTypeID,
          vt.VehicleCode,
          vt.VehicleName,

          s.SlotID,
          ps.SlotCode,
          ps.SlotStatus,

          z.ZoneID,
          z.ZoneName,

          f.FloorID,
          f.FloorName,

          b.BuildingID,
          b.BuildingName,
          b.Address,

          s.EntryTime,
          s.ExitTime,
          s.SessionStatus,

          DATEDIFF(MINUTE, s.EntryTime, GETDATE()) AS ParkedMinutes,

          p.PaymentID,
          p.Amount,
          p.PaymentMethod,
          p.PaymentStatus,
          p.PaymentTime,

          booking.ReservationID,
          CASE 
            WHEN booking.ReservationID IS NOT NULL
            THEN CONCAT('BK-', RIGHT('0000' + CAST(booking.ReservationID AS VARCHAR(10)), 4))
            ELSE NULL
          END AS BookingCode

        FROM ParkingSessions s
        JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
        JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
        JOIN Zones z ON ps.ZoneID = z.ZoneID
        JOIN Floors f ON z.FloorID = f.FloorID
        JOIN Buildings b ON f.BuildingID = b.BuildingID

        LEFT JOIN Payments p ON p.SessionID = s.SessionID

        OUTER APPLY (
          SELECT TOP 1
            r.ReservationID
          FROM Reservations r
          WHERE r.DriverID = s.DriverID
            AND r.SlotID = s.SlotID
            AND r.ReservationStatus IN ('Reserved', 'Completed')
          ORDER BY ABS(DATEDIFF(MINUTE, r.StartTime, s.EntryTime))
        ) booking

        WHERE s.DriverID = @DriverID
          AND s.SessionStatus = 'Active'
          AND s.ExitTime IS NULL

        ORDER BY s.EntryTime DESC;
      `);

    const session = result.recordset[0] || null;

    if (!session) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const minutes = Number(session.ParkedMinutes || 0);

    return res.json({
      success: true,
      data: {
        ...session,
        ParkedDuration: `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getCurrentDriverSessions(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế.",
      });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT
          s.SessionID,
          CONCAT(
            'SESS-',
            CONVERT(CHAR(8), s.EntryTime, 112),
            '-',
            RIGHT('0000' + CAST(s.SessionID AS VARCHAR(10)), 4)
          ) AS SessionCode,

          s.DriverID,
          s.PlateNumber,
          s.VehicleTypeID,
          vt.VehicleCode,
          vt.VehicleName,

          s.SlotID,
          ps.SlotCode,
          ps.SlotStatus,

          z.ZoneID,
          z.ZoneName,

          f.FloorID,
          f.FloorName,

          b.BuildingID,
          b.BuildingName,
          b.Address,

          s.EntryTime,
          s.ExitTime,
          s.SessionStatus,

          DATEDIFF(MINUTE, s.EntryTime, GETDATE()) AS ParkedMinutes,

          p.PaymentID,
          p.Amount,
          p.PaymentMethod,
          p.PaymentStatus,
          p.PaymentTime,

          booking.ReservationID,
          CASE 
            WHEN booking.ReservationID IS NOT NULL
            THEN CONCAT('BK-', RIGHT('0000' + CAST(booking.ReservationID AS VARCHAR(10)), 4))
            ELSE NULL
          END AS BookingCode

        FROM ParkingSessions s
        JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
        JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
        JOIN Zones z ON ps.ZoneID = z.ZoneID
        JOIN Floors f ON z.FloorID = f.FloorID
        JOIN Buildings b ON f.BuildingID = b.BuildingID

        LEFT JOIN Payments p ON p.SessionID = s.SessionID

        OUTER APPLY (
          SELECT TOP 1
            r.ReservationID
          FROM Reservations r
          WHERE r.DriverID = s.DriverID
            AND r.SlotID = s.SlotID
            AND r.ReservationStatus IN ('Reserved', 'Completed')
          ORDER BY ABS(DATEDIFF(MINUTE, r.StartTime, s.EntryTime))
        ) booking

        WHERE s.DriverID = @DriverID
          AND s.SessionStatus = 'Active'
          AND s.ExitTime IS NULL

        ORDER BY s.EntryTime DESC;
      `);

    const sessions = result.recordset.map((session) => {
      const minutes = Number(session.ParkedMinutes || 0);

      return {
        ...session,
        ParkedDuration: `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`,
      };
    });

    return res.json({
      success: true,
      data: sessions,
      total: sessions.length,
    });
  } catch (err) {
    next(err);
  }
}
