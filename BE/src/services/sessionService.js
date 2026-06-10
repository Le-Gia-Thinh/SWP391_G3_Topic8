import { getPool, sql } from "../config/db.js";
import { getUserIdFromToken } from "../utils/requestUser.js";
import {
  buildSessionCode,
  getReservationIdFromBookingCode,
} from "../utils/codeUtils.js";

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getDefaultFee(transaction, vehicleTypeId) {
  const result = await new sql.Request(transaction)
    .input("VehicleTypeID", sql.Int, vehicleTypeId)
    .query(`
      SELECT TOP 1 Fee
      FROM PricingPolicies
      WHERE VehicleTypeID = @VehicleTypeID
        AND IsActive = 1
      ORDER BY MinHours ASC, MaxHours ASC
    `);

  return result.recordset[0]?.Fee || 0;
}

async function getCheckoutFee(transaction, sessionId) {
  const result = await new sql.Request(transaction)
    .input("SessionID", sql.Int, sessionId)
    .query(`
      SELECT 
        s.EntryTime,
        s.VehicleTypeID
      FROM ParkingSessions s
      WHERE s.SessionID = @SessionID
        AND s.SessionStatus = 'Active'
    `);

  const session = result.recordset[0];

  if (!session) {
    return {
      fee: 0,
      durationHours: 0,
    };
  }

  const entryTime = new Date(session.EntryTime);
  const now = new Date();

  const durationHours = Math.max(
    0,
    (now.getTime() - entryTime.getTime()) / 1000 / 60 / 60
  );

  const feeResult = await new sql.Request(transaction)
    .input("VehicleTypeID", sql.Int, session.VehicleTypeID)
    .input("DurationHours", sql.Decimal(10, 2), durationHours)
    .query(`
      SELECT TOP 1 Fee
      FROM PricingPolicies
      WHERE VehicleTypeID = @VehicleTypeID
        AND IsActive = 1
        AND (
          @DurationHours BETWEEN MinHours AND MaxHours
          OR (IsOvernight = 1 AND @DurationHours > 8)
        )
      ORDER BY IsOvernight DESC, MaxHours ASC
    `);

  return {
    fee: feeResult.recordset[0]?.Fee || 0,
    durationHours,
  };
}

export async function getSessions() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      s.SessionID,
      CONCAT(
        'SESS-',
        FORMAT(s.EntryTime, 'yyyyMMdd'),
        '-',
        RIGHT('0000' + CAST(s.SessionID AS VARCHAR(10)), 4)
      ) AS SessionCode,

      s.DriverID,
      u.FullName AS DriverName,
      u.Email AS DriverEmail,
      u.PhoneNumber,

      s.PlateNumber,
      s.VehicleTypeID,
      vt.VehicleCode,
      vt.VehicleName,

      s.SlotID,
      ps.SlotCode,
      ps.SlotStatus,

      z.ZoneName,
      f.FloorName,
      b.BuildingID,
      b.BuildingName,
      b.Address,

      s.EntryTime,
      s.ExitTime,
      s.SessionStatus,

      p.PaymentID,
      p.Amount,
      p.PaymentMethod,
      p.PaymentTime,
      p.PaymentStatus,

      booking.ReservationID,
      CASE 
        WHEN booking.ReservationID IS NOT NULL
        THEN CONCAT('BK-', RIGHT('0000' + CAST(booking.ReservationID AS VARCHAR(10)), 4))
        ELSE NULL
      END AS BookingCode

    FROM ParkingSessions s
    JOIN Users u ON s.DriverID = u.UserID
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

    ORDER BY s.SessionID DESC
  `);

  return result.recordset;
}

export async function checkInVehicle(req) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const {
      driverId,
      plateNumber,
      vehicleTypeId,
      slotId,
      reservationId,
      bookingCode,
    } = req.body;

    let finalDriverId = Number(driverId);
    let finalPlateNumber = String(plateNumber || "").trim().toUpperCase();
    let finalVehicleTypeId = Number(vehicleTypeId);
    let finalSlotId = Number(slotId);
    let finalReservationId = reservationId ? Number(reservationId) : null;

    if (!finalReservationId && bookingCode) {
      finalReservationId = getReservationIdFromBookingCode(bookingCode);
    }

    await transaction.begin();

    if (finalReservationId) {
      const reservationResult = await new sql.Request(transaction)
        .input("ReservationID", sql.Int, finalReservationId)
        .query(`
          SELECT TOP 1
            r.ReservationID,
            r.DriverID,
            r.VehicleTypeID,
            r.SlotID,
            r.ReservationStatus,
            r.StartTime,
            r.EndTime,
            u.FullName AS DriverName,
            vt.VehicleName,
            ps.SlotCode,
            ps.SlotStatus
          FROM Reservations r
          JOIN Users u ON r.DriverID = u.UserID
          JOIN VehicleTypes vt ON r.VehicleTypeID = vt.VehicleTypeID
          LEFT JOIN ParkingSlots ps ON r.SlotID = ps.SlotID
          WHERE r.ReservationID = @ReservationID
        `);

      const reservation = reservationResult.recordset[0];

      if (!reservation) {
        throw createHttpError(404, "Không tìm thấy mã đặt chỗ.");
      }

      if (reservation.ReservationStatus !== "Reserved") {
        throw createHttpError(400, "Đặt chỗ này không còn hiệu lực.");
      }

      finalDriverId = reservation.DriverID;
      finalVehicleTypeId = reservation.VehicleTypeID;
      finalSlotId = reservation.SlotID;

      if (!finalPlateNumber) {
        finalPlateNumber = "UNKNOWN";
      }
    }

    if (!finalDriverId || !finalVehicleTypeId || !finalSlotId || !finalPlateNumber) {
      throw createHttpError(
        400,
        "Thiếu thông tin check-in. Cần có driverId, plateNumber, vehicleTypeId, slotId hoặc bookingCode."
      );
    }

    const activeDriverResult = await new sql.Request(transaction)
      .input("DriverID", sql.Int, finalDriverId)
      .query(`
        SELECT TOP 1 SessionID
        FROM ParkingSessions
        WHERE DriverID = @DriverID
          AND SessionStatus = 'Active'
          AND ExitTime IS NULL
      `);

    if (activeDriverResult.recordset.length > 0) {
      throw createHttpError(
        409,
        "Tài xế này đang có một phiên đỗ xe hoạt động."
      );
    }

    const activeSlotResult = await new sql.Request(transaction)
      .input("SlotID", sql.Int, finalSlotId)
      .query(`
        SELECT TOP 1 SessionID
        FROM ParkingSessions
        WHERE SlotID = @SlotID
          AND SessionStatus = 'Active'
          AND ExitTime IS NULL
      `);

    if (activeSlotResult.recordset.length > 0) {
      throw createHttpError(
        409,
        "Vị trí này đang có xe đỗ, không thể check-in."
      );
    }

    const slotResult = await new sql.Request(transaction)
      .input("SlotID", sql.Int, finalSlotId)
      .query(`
        SELECT 
          ps.SlotID,
          ps.SlotCode,
          ps.SlotStatus,
          ps.VehicleTypeID
        FROM ParkingSlots ps
        WHERE ps.SlotID = @SlotID
      `);

    const slot = slotResult.recordset[0];

    if (!slot) {
      throw createHttpError(404, "Không tìm thấy vị trí đỗ.");
    }

    if (Number(slot.VehicleTypeID) !== Number(finalVehicleTypeId)) {
      throw createHttpError(400, "Loại xe không phù hợp với vị trí đỗ.");
    }

    const isReservedBookingCheckIn =
      finalReservationId && slot.SlotStatus === "Reserved";

    const isWalkInCheckIn =
      !finalReservationId && slot.SlotStatus === "Available";

    if (!isReservedBookingCheckIn && !isWalkInCheckIn) {
      throw createHttpError(409, "Vị trí đỗ hiện không khả dụng.");
    }

    const insertSessionResult = await new sql.Request(transaction)
      .input("SlotID", sql.Int, finalSlotId)
      .input("DriverID", sql.Int, finalDriverId)
      .input("PlateNumber", sql.NVarChar(20), finalPlateNumber)
      .input("VehicleTypeID", sql.Int, finalVehicleTypeId)
      .query(`
        INSERT INTO ParkingSessions (
          SlotID,
          DriverID,
          PlateNumber,
          VehicleTypeID,
          EntryTime,
          SessionStatus
        )
        OUTPUT
          INSERTED.SessionID,
          INSERTED.SlotID,
          INSERTED.DriverID,
          INSERTED.PlateNumber,
          INSERTED.VehicleTypeID,
          INSERTED.EntryTime,
          INSERTED.SessionStatus
        VALUES (
          @SlotID,
          @DriverID,
          UPPER(@PlateNumber),
          @VehicleTypeID,
          GETDATE(),
          'Active'
        )
      `);

    const session = insertSessionResult.recordset[0];

    const defaultFee = await getDefaultFee(transaction, finalVehicleTypeId);

    await new sql.Request(transaction)
      .input("SessionID", sql.Int, session.SessionID)
      .input("Amount", sql.Decimal(10, 2), defaultFee)
      .query(`
        INSERT INTO Payments (
          SessionID,
          Amount,
          PaymentMethod,
          PaymentStatus
        )
        VALUES (
          @SessionID,
          @Amount,
          'Pending',
          'Pending'
        )
      `);

    if (finalReservationId) {
      await new sql.Request(transaction)
        .input("ReservationID", sql.Int, finalReservationId)
        .query(`
          UPDATE Reservations
          SET ReservationStatus = 'Completed'
          WHERE ReservationID = @ReservationID
        `);
    }

    await new sql.Request(transaction)
      .input("SlotID", sql.Int, finalSlotId)
      .query(`
        UPDATE ParkingSlots
        SET SlotStatus = 'Occupied'
        WHERE SlotID = @SlotID
      `);

    await transaction.commit();

    return {
      session: {
        ...session,
        SessionCode: buildSessionCode(session.SessionID, session.EntryTime),
      },
    };
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {}

    throw err;
  }
}

export async function checkOutVehicle(req) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const { sessionId, paymentMethod } = req.body;

    if (!sessionId) {
      throw createHttpError(400, "sessionId là bắt buộc.");
    }

    await transaction.begin();

    const sessionResult = await new sql.Request(transaction)
      .input("SessionID", sql.Int, sessionId)
      .query(`
        SELECT TOP 1
          SessionID,
          SlotID,
          EntryTime,
          VehicleTypeID,
          SessionStatus
        FROM ParkingSessions
        WHERE SessionID = @SessionID
      `);

    const session = sessionResult.recordset[0];

    if (!session) {
      throw createHttpError(404, "Không tìm thấy phiên đỗ xe.");
    }

    if (session.SessionStatus !== "Active") {
      throw createHttpError(
        400,
        "Phiên đỗ xe này đã hoàn tất hoặc không còn hoạt động."
      );
    }

    const { fee } = await getCheckoutFee(transaction, sessionId);

    await new sql.Request(transaction)
      .input("SessionID", sql.Int, sessionId)
      .query(`
        UPDATE ParkingSessions
        SET ExitTime = GETDATE(),
            SessionStatus = 'Completed'
        WHERE SessionID = @SessionID
      `);

    await new sql.Request(transaction)
      .input("SessionID", sql.Int, sessionId)
      .input("Amount", sql.Decimal(10, 2), fee)
      .input("PaymentMethod", sql.NVarChar(50), paymentMethod || "Cash")
      .query(`
        UPDATE Payments
        SET Amount = @Amount,
            PaymentMethod = @PaymentMethod,
            PaymentTime = GETDATE(),
            PaymentStatus = 'Completed'
        WHERE SessionID = @SessionID
      `);

    await new sql.Request(transaction)
      .input("SlotID", sql.Int, session.SlotID)
      .query(`
        UPDATE ParkingSlots
        SET SlotStatus =
          CASE
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
      sessionId,
      status: "Completed",
    };
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {}

    throw err;
  }
}

export async function getCurrentDriverSession(req) {
  const pool = await getPool();

  const driverId = getUserIdFromToken(req);

  if (!driverId) {
    throw createHttpError(
      401,
      "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại."
    );
  }

  const result = await pool.request()
    .input("DriverID", sql.Int, driverId)
    .query(`
      SELECT TOP 1
        s.SessionID,
        CONCAT(
          'SESS-',
          FORMAT(s.EntryTime, 'yyyyMMdd'),
          '-',
          RIGHT('0000' + CAST(s.SessionID AS VARCHAR(10)), 4)
        ) AS SessionCode,

        s.DriverID,
        u.FullName AS DriverName,

        s.PlateNumber,
        s.VehicleTypeID,
        vt.VehicleCode,
        vt.VehicleName,

        s.EntryTime,
        s.ExitTime,
        s.SessionStatus,

        ps.SlotID,
        ps.SlotCode,
        ps.SlotStatus,

        z.ZoneName,
        f.FloorName,
        b.BuildingID,
        b.BuildingName,
        b.Address,

        p.PaymentID,
        p.Amount,
        p.PaymentStatus,
        p.PaymentMethod,
        p.PaymentTime,

        booking.ReservationID,
        CASE 
          WHEN booking.ReservationID IS NOT NULL
          THEN CONCAT('BK-', RIGHT('0000' + CAST(booking.ReservationID AS VARCHAR(10)), 4))
          ELSE NULL
        END AS BookingCode,
        booking.StartTime AS ReservationStartTime,
        booking.EndTime AS ReservationEndTime

      FROM ParkingSessions s
      JOIN Users u ON s.DriverID = u.UserID
      JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
      JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
      JOIN Zones z ON ps.ZoneID = z.ZoneID
      JOIN Floors f ON z.FloorID = f.FloorID
      JOIN Buildings b ON f.BuildingID = b.BuildingID
      LEFT JOIN Payments p ON p.SessionID = s.SessionID

      OUTER APPLY (
        SELECT TOP 1 r.ReservationID, r.StartTime, r.EndTime
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
    `);

  const session = result.recordset[0];

  if (!session) {
    return null;
  }

  const entryTime = new Date(session.EntryTime);
  const now = new Date();

  const parkedMinutes = Math.max(
    0,
    Math.floor((now.getTime() - entryTime.getTime()) / 60000)
  );

  const parkedHours = Math.floor(parkedMinutes / 60);
  const parkedRemainMinutes = parkedMinutes % 60;

  let progress = 20;

  if (session.ReservationStartTime && session.ReservationEndTime) {
    const start = new Date(session.ReservationStartTime);
    const end = new Date(session.ReservationEndTime);

    const totalMinutes = Math.max(
      1,
      Math.floor((end.getTime() - start.getTime()) / 60000)
    );

    progress = Math.min(100, Math.round((parkedMinutes / totalMinutes) * 100));
  }

  return {
    ...session,
    statusLabel: "Đang hoạt động",
    sessionType: session.BookingCode ? "ĐẶT TRƯỚC (BOOKING)" : "VÃNG LAI",
    parkedMinutes,
    parkedDuration: `${parkedHours} giờ ${parkedRemainMinutes} phút`,
    progress,
  };
}