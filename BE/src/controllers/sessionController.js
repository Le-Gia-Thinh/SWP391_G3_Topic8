/**
 * FILE: sessionController.js
 * MÔ TẢ: Controller xử lý phiên đỗ xe (Parking Session).
 * 
 * Chức năng:
 * - getSessions: Lấy tất cả phiên đỗ xe
 * - checkInVehicle: Check-in xe vào bãi (tạo phiên mới)
 * - checkOutVehicle: Check-out xe ra khỏi bãi (kết thúc phiên)
 * - getCurrentDriverSession: Lấy phiên đỗ xe đang hoạt động của tài xế (1 phiên)
 * - getCurrentDriverSessions: Lấy TẤT CẢ phiên đang hoạt động của tài xế
 * 
 * @access Driver, Staff
 */

import { getPool, sql } from "../config/db.js"; // Kết nối database
import * as sessionService from "../services/sessionService.js"; // Service xử lý logic session
import { applySubscriptionDiscount } from "../services/paymentService.js";

/**
 * Hàm helper: Lấy HTTP status code từ error object.
 * @param {Error} err - Đối tượng lỗi
 * @returns {number} HTTP status code
 */
function getErrorStatus(err) {
  return err.status || err.statusCode || 500;
}

/**
 * Hàm helper: Gửi response lỗi client (4xx). Trả null nếu lỗi server (5xx).
 */
function sendClientError(res, err) {
  const status = getErrorStatus(err);
  if (status < 500) {
    return res.status(status).json({ success: false, message: err.message });
  }
  return null;
}

/**
 * Hàm helper: Lấy UserID từ request.
 */
function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

/**
 * Hàm helper: Tính phí tạm tính (real-time) cho active session.
 */
async function calculateEstimatedFee(pool, driverId, session) {
  try {
    const feeRes = await pool.request()
      .input('VehicleTypeID', sql.Int, session.VehicleTypeID)
      .input('EntryTime', sql.DateTime, session.EntryTime)
      .input('ExitTime', sql.DateTime, new Date())
      .output('Fee', sql.Decimal(10, 2))
      .output('Breakdown', sql.NVarChar(sql.MAX))
      .execute('sp_CalcParkingFeeV2');

    const baseFee = feeRes.output.Fee || 0;
    const { finalFee } = await applySubscriptionDiscount(pool, driverId, baseFee, session.SessionID);

    // 2. Tính early check-in surcharge
    const now = new Date();
    const durationMin = Math.floor((now.getTime() - new Date(session.EntryTime).getTime()) / 60000);
    const earlyFeeAmount = Number(session.EarlyFeeAmount || 0);
    const bookingStart = session.BookingStartTime ? new Date(session.BookingStartTime) : null;
    const isEarlyExit = !!(bookingStart && now < bookingStart && durationMin < 30 && earlyFeeAmount > 0);
    const effectiveEarlyFee = isEarlyExit ? 0 : earlyFeeAmount;

    // 3. Tính phí phạt đỗ quá giờ (Overtime Penalty)
    const bookingEnd = session.BookingEndTime ? new Date(session.BookingEndTime) : null;
    let overtimePenaltyAmount = 0;
    let overtimeHours = 0;
    if (bookingEnd && now > bookingEnd) {
      overtimeHours = Math.ceil((now.getTime() - bookingEnd.getTime()) / 1000 / 60 / 60);
      if (overtimeHours > 0) {
        const vType = Number(session.VehicleTypeID);
        if (vType === 1) overtimePenaltyAmount = 10000 + (overtimeHours * 5000);
        else if (vType === 2) overtimePenaltyAmount = 50000 + (overtimeHours * 20000);
        else if (vType === 3) overtimePenaltyAmount = 100000 + (overtimeHours * 40000);
      }
    }

    const totalFee = finalFee + effectiveEarlyFee + overtimePenaltyAmount;

    return {
      Amount: totalFee,
      ParkingFee: finalFee,
      OvertimeFee: overtimePenaltyAmount,
      OtherFee: effectiveEarlyFee
    };
  } catch (err) {
    console.error("Error calculating estimated fee in sessionController:", err);
    return {
      Amount: 0,
      ParkingFee: 0,
      OvertimeFee: 0,
      OtherFee: 0
    };
  }
}

/** @route GET /api/sessions - Lấy tất cả phiên đỗ xe */

export async function getSessions(req, res, next) {
  try {
    const data = await sessionService.getSessions();
    res.status(200).json({ success: true, data });
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
            'SS-',
            RIGHT('00000' + CAST(s.SessionID AS VARCHAR(10)), 5)
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
          s.EarlyFeeAmount,
          s.BookingStartTime,

          DATEDIFF(MINUTE, s.EntryTime, GETDATE()) AS ParkedMinutes,

          p.PaymentID,
          p.Amount,
          p.PaymentMethod,
          p.PaymentStatus,
          p.PaymentTime,

          booking.ReservationID,
          booking.EndTime AS BookingEndTime,
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
            r.ReservationID,
            r.EndTime
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
    let est = { Amount: session.Amount, ParkingFee: session.Amount, OvertimeFee: 0, OtherFee: 0 };
    if (session.SessionStatus === "Active" && !session.Amount) {
      est = await calculateEstimatedFee(pool, driverId, session);
    }

    return res.json({
      success: true,
      data: {
        ...session,
        Amount: est.Amount,
        ParkingFee: est.ParkingFee,
        OvertimeFee: est.OvertimeFee,
        OtherFee: est.OtherFee,
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
            'SS-',
            RIGHT('00000' + CAST(s.SessionID AS VARCHAR(10)), 5)
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
          s.EarlyFeeAmount,
          s.BookingStartTime,

          DATEDIFF(MINUTE, s.EntryTime, GETDATE()) AS ParkedMinutes,

          p.PaymentID,
          p.Amount,
          p.PaymentMethod,
          p.PaymentStatus,
          p.PaymentTime,

          booking.ReservationID,
          booking.EndTime AS BookingEndTime,
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
            r.ReservationID,
            r.EndTime
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

    const sessions = await Promise.all(
      result.recordset.map(async (session) => {
        const minutes = Number(session.ParkedMinutes || 0);
        let est = { Amount: session.Amount, ParkingFee: session.Amount, OvertimeFee: 0, OtherFee: 0 };
        if (session.SessionStatus === "Active" && !session.Amount) {
          est = await calculateEstimatedFee(pool, driverId, session);
        }

        return {
          ...session,
          Amount: est.Amount,
          ParkingFee: est.ParkingFee,
          OvertimeFee: est.OvertimeFee,
          OtherFee: est.OtherFee,
          ParkedDuration: `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`,
        };
      })
    );

    return res.json({
      success: true,
      data: sessions,
      total: sessions.length,
    });
  } catch (err) {
    next(err);
  }
}
