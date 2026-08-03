/**
 * FILE: sessionController.js
 * MÔ TẢ: Controller xử lý các phiên đỗ xe thực tế (Parking Sessions) tại cổng bãi và hiển thị trạng thái xe cho Tài xế.
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Thuật toán tính phí thời gian thực (`calculateEstimatedFee`):
 *    - Tự động gọi Stored Procedure `sp_CalcParkingFeeV2` để tính tiền cơ bản theo khung giờ.
 *    - Áp dụng ưu đãi giảm giá nếu tài xế có Đăng ký gói hội viên (`applySubscriptionDiscount`).
 *    - Tự động cộng Phí vào sớm (`EarlyFeeAmount`) và Phí phạt quá giờ (`Overtime Penalty`) nếu xe gửi quá hạn Booking.
 * 2. Luồng Check-in (`checkInVehicle`): Tạo phiên đỗ xe mới (`SessionStatus = 'Active'`), gán thời gian `EntryTime = GETDATE()` và cập nhật ô đỗ thành 'Occupied'.
 * 3. Luồng Check-out (`checkOutVehicle`): Ghi nhận `ExitTime = GETDATE()`, chốt tổng tiền hóa đơn, thực hiện trừ số dư Ví/Thu tiền mặt và đổi trạng thái ô đỗ thành 'Available'.
 */

// Import hàm `getPool` kết nối SQL Server và đối tượng kiểu dữ liệu `sql` từ cấu hình 'BE/src/config/db.js'
import { getPool, sql } from "../config/db.js";
// Import các dịch vụ xử lý Check-in / Check-out từ 'BE/src/services/sessionService.js'
// LIÊN KẾT FILE: `BE/src/services/sessionService.js` - Gọi các thủ tục SQL Server `sp_CheckInVehicle` và `sp_CheckOutVehicle`.
import * as sessionService from "../services/sessionService.js";
// Import hàm tính giảm giá gói hội viên từ 'BE/src/services/paymentService.js'
import { applySubscriptionDiscount } from "../services/paymentService.js";

/**
 * HÀM HELPER 1: getErrorStatus
 * TÁC DỤNG: Lấy mã lỗi HTTP Status Code từ đối tượng Error (Mặc định 500 nếu là lỗi server không xác định).
 */
function getErrorStatus(err) {
  return err.status || err.statusCode || 500;
}

/**
 * HÀM HELPER 2: sendClientError
 * TÁC DỤNG: Phản hồi lỗi Client (4xx) trực tiếp về cho ứng dụng Frontend.
 */
function sendClientError(res, err) {
  const status = getErrorStatus(err);
  if (status < 500) {
    return res.status(status).json({ success: false, message: err.message });
  }
  return null;
}

/**
 * HÀM HELPER 3: getUserIdFromToken
 * TÁC DỤNG: Lấy an toàn ID tài xế từ đối tượng Token JWT (`req.user`).
 */
function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

/**
 * HÀM NỘI BỘ NỔI BẬT: calculateEstimatedFee
 * TÁC DỤNG: Tự động tính toán số tiền tạm tính thời gian thực (Real-time Estimated Fee) cho xe đang nằm trong bãi đỗ.
 * CÔNG THỨC TÍNH:
 *   [Tổng Phí Tạm Tính] = ([Phí Đỗ Gốc sp_CalcParkingFeeV2] - [Giảm Giá Vé Tháng]) + [Phí Vào Sớm] + [Phí Phạt Quá Giờ]
 */
async function calculateEstimatedFee(pool, driverId, session) {
  try {
    // 1. Gọi Stored Procedure `sp_CalcParkingFeeV2` trong SQL Server để tính phí đỗ xe theo block giờ
    const feeRes = await pool.request()
      .input('VehicleTypeID', sql.Int, session.VehicleTypeID)
      .input('EntryTime', sql.DateTime, session.EntryTime)
      .input('ExitTime', sql.DateTime, new Date()) // Giờ chốt giả định là Thời điểm hiện tại (GETDATE)
      .output('Fee', sql.Decimal(10, 2))
      .output('Breakdown', sql.NVarChar(sql.MAX))
      .execute('sp_CalcParkingFeeV2');

    const baseFee = feeRes.output.Fee || 0;
    
    // Áp dụng giảm giá gói hội viên (nếu tài xế sở hữu gói vé tháng active)
    const { finalFee } = await applySubscriptionDiscount(pool, driverId, baseFee, session.SessionID);

    // 2. Tính phí phụ thu nếu tài xế vào bãi quá sớm so với giờ đặt (Early Check-in Surcharge)
    const now = new Date();
    const durationMin = Math.floor((now.getTime() - new Date(session.EntryTime).getTime()) / 60000);
    const earlyFeeAmount = Number(session.EarlyFeeAmount || 0);
    const bookingStart = session.BookingStartTime ? new Date(session.BookingStartTime) : null;
    const isEarlyExit = !!(bookingStart && now < bookingStart && durationMin < 30 && earlyFeeAmount > 0);
    const effectiveEarlyFee = isEarlyExit ? 0 : earlyFeeAmount;

    // 3. Tính phí phạt đỗ quá giờ (Overtime Penalty) nếu xe đỗ vượt quá BookingEndTime
    const bookingEnd = session.BookingEndTime ? new Date(session.BookingEndTime) : null;
    let overtimePenaltyAmount = 0;
    let overtimeHours = 0;
    if (bookingEnd && now > bookingEnd) {
      // Làm tròn lên số giờ đỗ quá hạn (Math.ceil)
      overtimeHours = Math.ceil((now.getTime() - bookingEnd.getTime()) / 1000 / 60 / 60);
      if (overtimeHours > 0) {
        const vType = Number(session.VehicleTypeID);
        if (vType === 1) overtimePenaltyAmount = 10000 + (overtimeHours * 5000);       // Xe máy (Phạt 10k + 5k/h)
        else if (vType === 2) overtimePenaltyAmount = 50000 + (overtimeHours * 20000);  // Ô tô (Phạt 50k + 20k/h)
        else if (vType === 3) overtimePenaltyAmount = 100000 + (overtimeHours * 40000); // Xe tải / Xe khác (Phạt 100k + 40k/h)
      }
    }

    // Tổng số tiền tạm tính
    const totalFee = finalFee + effectiveEarlyFee + overtimePenaltyAmount;

    return {
      Amount: totalFee,
      ParkingFee: finalFee,
      OvertimeFee: overtimePenaltyAmount,
      OtherFee: effectiveEarlyFee
    };
  } catch (err) {
    console.error("Lỗi tính phí tạm tính trong sessionController:", err);
    return {
      Amount: 0,
      ParkingFee: 0,
      OvertimeFee: 0,
      OtherFee: 0
    };
  }
}

/**
 * HÀM 1: getSessions
 * TÁC DỤNG: Lấy danh sách tất cả các phiên đỗ xe trong bãi (Phục vụ Quản lý/Bảo vệ).
 * 
 * @route GET /api/sessions
 * @access Staff / Manager / Admin
 */
export async function getSessions(req, res, next) {
  try {
    const data = await sessionService.getSessions();
    res.status(200).json({ success: true, data });
  } catch (err) { next(err); }
}

/**
 * HÀM 2: checkInVehicle
 * TÁC DỤNG: Bảo vệ thực hiện Check-in cho xe vào bãi đỗ.
 * Đổi trạng thái ô đỗ thành 'Occupied' và khởi tạo bản ghi trong bảng `ParkingSessions`.
 * 
 * @route POST /api/sessions/check-in
 * @access Staff Only
 */
export async function checkInVehicle(req, res, next) {
  try {
    // Gọi Service xử lý nghiệp vụ Check-in
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

/**
 * HÀM 3: checkOutVehicle
 * TÁC DỤNG: Cho xe rời khỏi bãi đỗ xe (Check-out).
 * Cập nhật giờ ra `ExitTime`, chốt hóa đơn thanh toán và giải phóng vị trí ô đỗ về trạng thái 'Available'.
 * 
 * @route POST /api/sessions/check-out
 * @access Staff Only
 */
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

/**
 * HÀM 4: getCurrentDriverSession
 * TÁC DỤNG: Lấy 1 phiên đỗ xe đang đỗ mới nhất của tài xế đang đăng nhập để hiển thị trên màn hình chính Mobile App.
 * 
 * @route GET /api/sessions/driver/current
 * @access Driver Only
 */
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

    // Truy vấn SQL lấy phiên xe đang gửi trong bãi (SessionStatus = 'Active' và ExitTime IS NULL)
    const result = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 1
          s.SessionID,
          CONCAT('SS-', RIGHT('00000' + CAST(s.SessionID AS VARCHAR(10)), 5)) AS SessionCode,
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
          SELECT TOP 1 r.ReservationID, r.EndTime
          FROM Reservations r
          WHERE r.DriverID = s.DriverID AND r.SlotID = s.SlotID AND r.ReservationStatus IN ('Reserved', 'Completed')
          ORDER BY ABS(DATEDIFF(MINUTE, r.StartTime, s.EntryTime))
        ) booking
        WHERE s.DriverID = @DriverID AND s.SessionStatus = 'Active' AND s.ExitTime IS NULL
        ORDER BY s.EntryTime DESC;
      `);

    const session = result.recordset[0] || null;

    if (!session) {
      return res.json({
        success: true,
        data: null,
      });
    }

    // Tự động tính số phút đã đỗ và gọi hàm `calculateEstimatedFee` để tính tiền tạm tính thời gian thực
    const minutes = Number(session.ParkedMinutes || 0);
    let est = { Amount: session.Amount, ParkingFee: session.Amount, OvertimeFee: 0, OtherFee: 0 };
    if (session.SessionStatus === "Active" && !session.Amount) {
      est = await calculateEstimatedFee(pool, driverId, session);
    }

    // Trả về JSON phiên đỗ xe kèm chuỗi định dạng thời lượng đỗ (ví dụ '2 giờ 15 phút')
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

/**
 * HÀM 5: getCurrentDriverSessions
 * TÁC DỤNG: Lấy danh sách TOÀN BỘ các xe mà tài xế đang gửi đồng thời trong bãi (Phù hợp trường hợp tài xế gửi nhiều xe cùng lúc).
 * 
 * @route GET /api/sessions/driver/current-all
 * @access Driver Only
 */
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

    // Truy vấn tất cả các phiên đỗ xe đang active của tài xế
    const result = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT
          s.SessionID,
          CONCAT('SS-', RIGHT('00000' + CAST(s.SessionID AS VARCHAR(10)), 5)) AS SessionCode,
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
          SELECT TOP 1 r.ReservationID, r.EndTime
          FROM Reservations r
          WHERE r.DriverID = s.DriverID AND r.SlotID = s.SlotID AND r.ReservationStatus IN ('Reserved', 'Completed')
          ORDER BY ABS(DATEDIFF(MINUTE, r.StartTime, s.EntryTime))
        ) booking
        WHERE s.DriverID = @DriverID AND s.SessionStatus = 'Active' AND s.ExitTime IS NULL
        ORDER BY s.EntryTime DESC;
      `);

    // Duyệt qua mảng phiên đỗ và tính tiền tạm tính cho từng xe bằng `Promise.all`
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

