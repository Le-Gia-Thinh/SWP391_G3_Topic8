import { getPool, sql } from "../config/db.js";

function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

function buildBookingCode(reservationId) {
  return `BK-${String(reservationId).padStart(4, "0")}`;
}

function formatSessionCode(sessionId, entryTime) {
  const date = new Date(entryTime);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `SESS-${yyyy}${mm}${dd}-${String(sessionId).padStart(4, "0")}`;
}

export async function getDriverHome(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

    const [
      userResult,
      slotResult,
      bookingSummaryResult,
      currentBookingResult,
      currentSessionResult,
    ] = await Promise.all([
      pool.request()
        .input("DriverID", sql.Int, driverId)
        .query(`
          SELECT TOP 1
            u.UserID,
            u.FullName,
            u.Email,
            u.PhoneNumber,
            r.RoleName
          FROM Users u
          LEFT JOIN Roles r ON u.RoleID = r.RoleID
          WHERE u.UserID = @DriverID
        `),

      pool.request().query(`
        SELECT
          vt.VehicleTypeID,
          vt.VehicleCode,
          vt.VehicleName,
          COUNT(ps.SlotID) AS TotalSlots,
          SUM(CASE WHEN ps.SlotStatus = 'Available' THEN 1 ELSE 0 END) AS AvailableSlots,
          SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END) AS OccupiedSlots,
          SUM(CASE WHEN ps.SlotStatus = 'Reserved' THEN 1 ELSE 0 END) AS ReservedSlots
        FROM VehicleTypes vt
        LEFT JOIN ParkingSlots ps ON vt.VehicleTypeID = ps.VehicleTypeID
        GROUP BY vt.VehicleTypeID, vt.VehicleCode, vt.VehicleName
        ORDER BY vt.VehicleTypeID
      `),

      pool.request()
        .input("DriverID", sql.Int, driverId)
        .query(`
          SELECT
            COUNT(*) AS TotalBookings,
            SUM(
              CASE 
                WHEN ReservationStatus = 'Reserved' AND EndTime >= GETDATE()
                THEN 1 ELSE 0 
              END
            ) AS ActiveBookings,
            SUM(
              CASE 
                WHEN ReservationStatus = 'Completed'
                THEN 1 ELSE 0 
              END
            ) AS CompletedBookings,
            SUM(
              CASE 
                WHEN ReservationStatus = 'Cancelled'
                THEN 1 ELSE 0 
              END
            ) AS CancelledBookings,
            SUM(
              CASE 
                WHEN ReservationStatus = 'Expired'
                  OR (ReservationStatus = 'Reserved' AND EndTime < GETDATE())
                THEN 1 ELSE 0 
              END
            ) AS ExpiredBookings
          FROM Reservations
          WHERE DriverID = @DriverID
        `),

      pool.request()
        .input("DriverID", sql.Int, driverId)
        .query(`
          SELECT TOP 1
            r.ReservationID,
            CONCAT('BK-', RIGHT('0000' + CAST(r.ReservationID AS VARCHAR(10)), 4)) AS BookingCode,
            r.DriverID,
            r.VehicleTypeID,
            vt.VehicleCode,
            vt.VehicleName,
            r.SlotID,
            ps.SlotCode,
            z.ZoneName,
            f.FloorName,
            b.BuildingName,
            r.ReservationDate,
            r.StartTime,
            r.EndTime,
            r.ReservationStatus
          FROM Reservations r
          JOIN VehicleTypes vt ON r.VehicleTypeID = vt.VehicleTypeID
          LEFT JOIN ParkingSlots ps ON r.SlotID = ps.SlotID
          LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
          LEFT JOIN Floors f ON z.FloorID = f.FloorID
          LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID
          WHERE r.DriverID = @DriverID
            AND r.ReservationStatus = 'Reserved'
            AND r.EndTime >= GETDATE()
          ORDER BY r.StartTime ASC
        `),

      pool.request()
        .input("DriverID", sql.Int, driverId)
        .query(`
          SELECT TOP 1
            s.SessionID,
            s.DriverID,
            s.PlateNumber,
            s.VehicleTypeID,
            vt.VehicleCode,
            vt.VehicleName,
            s.EntryTime,
            s.ExitTime,
            s.SessionStatus,
            ps.SlotCode,
            z.ZoneName,
            f.FloorName,
            b.BuildingName,
            p.Amount,
            p.PaymentStatus,

            booking.ReservationID,
            CASE 
              WHEN booking.ReservationID IS NOT NULL
              THEN CONCAT('BK-', RIGHT('0000' + CAST(booking.ReservationID AS VARCHAR(10)), 4))
              ELSE NULL
            END AS BookingCode

          FROM ParkingSessions s
          JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
          JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
          JOIN Zones z ON ps.ZoneID = z.ZoneID
          JOIN Floors f ON z.FloorID = f.FloorID
          JOIN Buildings b ON f.BuildingID = b.BuildingID
          LEFT JOIN Payments p ON p.SessionID = s.SessionID

          OUTER APPLY (
            SELECT TOP 1 r.ReservationID
            FROM Reservations r
            WHERE r.DriverID = s.DriverID
              AND r.SlotID = s.SlotID
              AND r.ReservationStatus IN ('Reserved', 'Completed')
            ORDER BY ABS(DATEDIFF(MINUTE, r.StartTime, s.EntryTime))
          ) booking

          WHERE s.DriverID = @DriverID
            AND s.SessionStatus = 'Active'
            AND s.ExitTime IS NULL

          ORDER BY s.EntryTime DESC
        `),
    ]);

    const user = userResult.recordset[0] || null;
    const bookingSummary = bookingSummaryResult.recordset[0] || {
      TotalBookings: 0,
      ActiveBookings: 0,
      CompletedBookings: 0,
      CancelledBookings: 0,
      ExpiredBookings: 0,
    };

    const currentBooking = currentBookingResult.recordset[0] || null;
    const currentSession = currentSessionResult.recordset[0] || null;

    let mappedCurrentSession = null;

    if (currentSession) {
      const entryTime = new Date(currentSession.EntryTime);
      const now = new Date();

      const parkedMinutes = Math.max(
        0,
        Math.floor((now.getTime() - entryTime.getTime()) / 60000)
      );

      const parkedHours = Math.floor(parkedMinutes / 60);
      const parkedRemainMinutes = parkedMinutes % 60;

      mappedCurrentSession = {
        ...currentSession,
        SessionCode: formatSessionCode(
          currentSession.SessionID,
          currentSession.EntryTime
        ),
        ParkedDuration: `${parkedHours} giờ ${parkedRemainMinutes} phút`,
      };
    }

    return res.json({
      success: true,
      data: {
        user,
        slotSummary: slotResult.recordset,
        bookingSummary,
        currentBooking: currentBooking
          ? {
              ...currentBooking,
              BookingCode:
                currentBooking.BookingCode ||
                buildBookingCode(currentBooking.ReservationID),
            }
          : null,
        currentSession: mappedCurrentSession,
        serverTime: new Date(),
      },
    });
  } catch (err) {
    next(err);
  }
}