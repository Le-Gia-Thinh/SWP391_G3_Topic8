/**
 * FILE: driverController.js
 * MÔ TẢ: Controller trung tâm quản lý toàn bộ các tính năng dành cho Tài xế (Driver Application Features).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Trang chủ Tài xế (`getDriverHome`): Tải đồng thời 5 truy vấn SQL (`Promise.all`) gồm thông tin hồ sơ, thống kê ô đỗ rảnh, tổng quan các lịch đặt chỗ, phiên xe đang đỗ hiện tại và lịch đặt sắp tới.
 * 2. Hồ sơ cá nhân (`getDriverProfile` / `updateDriverProfile`): Xem và cập nhật thông tin cá nhân (FullName, Phone, Avatar, DateOfBirth). Nếu đổi Email ➔ Bắt buộc xác minh mật khẩu hiện tại và tự động gửi Email chứa Token xác nhận mới (`sendVerifyEmail`).
 * 3. Ngữ cảnh báo cáo sự cố (`getDriverReportContext`): Tự động gom các phiên xe và đơn đặt chỗ mới nhất làm dữ liệu gợi ý cho Form gửi sự cố.
 * 4. Gửi báo cáo sự cố (`createDriverReport`): Sử dụng SQL Transaction để tạo đồng thời bản ghi trong bảng `Incidents`, `Feedbacks` và phát `Notifications` thời gian thực tới tất cả Bảo vệ và Quản lý.
 */

// Import hàm `getPool` kết nối SQL Server và đối tượng kiểu dữ liệu `sql` từ cấu hình 'BE/src/config/db.js'
import { getPool, sql } from "../config/db.js";
// Import dịch vụ gửi Email xác minh
import { sendVerifyEmail } from "../services/authService.js";
// Import thư viện tạo chuỗi Token ngẫu nhiên (crypto)
import crypto from "crypto";
// Import thư viện mã hóa và đối soát mật khẩu (bcryptjs)
import bcryptjs from "bcryptjs";

/**
 * HÀM HELPER 1: getUserIdFromToken
 * TÁC DỤNG: Lấy an toàn UserID của tài xế từ đối tượng Token JWT trong `req.user`.
 */
function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

/**
 * HÀM HELPER 2: buildBookingCode
 * TÁC DỤNG: Định dạng mã Đặt chỗ hiển thị đẹp mắt (ví dụ: BookingID = 5 -> 'BK-0005').
 */
function buildBookingCode(reservationId) {
  return `BK-${String(reservationId).padStart(4, "0")}`;
}

/**
 * HÀM HELPER 3: buildReportCode
 * TÁC DỤNG: Định dạng mã Báo cáo sự cố (ví dụ: IncidentID = 12 -> 'RP-0012').
 */
function buildReportCode(incidentId) {
  return `RP-${String(incidentId).padStart(4, "0")}`;
}

/**
 * HÀM HELPER 4: formatSessionCode
 * TÁC DỤNG: Định dạng mã Phiên đỗ xe (ví dụ: SessionID = 123 -> 'SS-00123').
 */
function formatSessionCode(sessionId, entryTime) {
  return `SS-${String(sessionId).padStart(5, "0")}`;
}

/**
 * HÀM HELPER 5: normalizeReportPriority
 * TÁC DỤNG: Tự động phân loại độ ưu tiên cho báo cáo sự cố (High, Normal, Low) dựa vào loại vấn đề.
 */
function normalizeReportPriority(issueType) {
  const highPriorityTypes = new Set(["no_session", "occupied", "payment"]); // Ưu tiên cao: không tạo được phiên, bị chiếm ô, lỗi tiền
  const lowPriorityTypes = new Set(["other"]);
  if (highPriorityTypes.has(issueType)) return "High";
  if (lowPriorityTypes.has(issueType)) return "Low";
  return "Normal";
}

/**
 * HÀM HELPER 6: buildAttachmentText
 * TÁC DỤNG: Đóng gói danh sách tên các tệp ảnh đính kèm thành chuỗi văn bản.
 */
function buildAttachmentText(attachments) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;

  return attachments
    .map((item) => {
      if (typeof item === "string") return item;
      return item.name || item.fileName || item.originalname || "";
    })
    .filter(Boolean)
    .join(", ")
    .slice(0, 200);
}

/**
 * HÀM 1: getDriverHome
 * TÁC DỤNG: Lấy toàn bộ dữ liệu cho Trang chủ App Tài xế.
 * SỬ DỤNG CÚ PHÁP SONG SONG: `Promise.all` giúp chạy đồng thời 5 câu SQL giúp tối ưu thời gian phản hồi (Response Time) xuống thấp nhất.
 * 
 * @route GET /api/driver/home
 * @access Driver Only
 */
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

    // 0. Đồng bộ trạng thái ô đỗ thời gian thực (Occupied / Reserved / Available) từ Sessions và Reservations
    try {
      await pool.request().execute("sp_SyncParkingSlotStatuses");
    } catch (syncErr) {
      console.warn("⚠️ Lỗi đồng bộ sp_SyncParkingSlotStatuses:", syncErr.message);
    }

    // Chạy song song 5 truy vấn SQL bằng Promise.all
    const [
      userResult,
      slotResult,
      bookingSummaryResult,
      currentBookingResult,
      currentSessionResult,
    ] = await Promise.all([
      // 1. Lấy thông tin tài khoản tài xế
      pool
        .request()
        .input("DriverID", sql.Int, driverId)
        .query(`
          SELECT TOP 1
            u.UserID,
            u.FullName,
            u.Email,
            u.PhoneNumber,
            CONVERT(VARCHAR(10), u.DateOfBirth, 23) AS DateOfBirth,
            u.AvatarUrl,
            u.IsActive,
            u.IsEmailVerified,
            r.RoleName
          FROM Users u
          LEFT JOIN Roles r ON u.RoleID = r.RoleID
          WHERE u.UserID = @DriverID
        `),

      // 2. Thống kê tổng số ô đỗ trống/đang dùng theo từng bãi xe (Tòa nhà) và loại xe
      pool.request().query(`
        SELECT
          b.BuildingID,
          b.BuildingName,
          vt.VehicleTypeID,
          vt.VehicleCode,
          vt.VehicleName,
          COUNT(ps.SlotID) AS TotalSlots,
          SUM(CASE WHEN ps.SlotStatus = 'Available' THEN 1 ELSE 0 END) AS AvailableSlots,
          SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END) AS OccupiedSlots,
          SUM(CASE WHEN ps.SlotStatus = 'Reserved' THEN 1 ELSE 0 END) AS ReservedSlots
        FROM Buildings b
        JOIN Floors f ON b.BuildingID = f.BuildingID
        JOIN Zones z ON f.FloorID = z.FloorID
        JOIN ParkingSlots ps ON z.ZoneID = ps.ZoneID
        JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
        GROUP BY b.BuildingID, b.BuildingName, vt.VehicleTypeID, vt.VehicleCode, vt.VehicleName
        ORDER BY b.BuildingID, vt.VehicleTypeID
      `),

      // 3. Báo cáo tổng quan lịch sử Đặt chỗ đỗ xe
      pool
        .request()
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

      // 4. Lấy đơn Đặt chỗ đỗ xe sắp tới gần nhất (Sắp diễn ra)
      pool
        .request()
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
            b.Address,
            r.ReservationDate,
            r.StartTime,
            r.EndTime,
            r.ReservationStatus,
            r.CreatedAt
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

      // 5. Lấy phiên đỗ xe đang đỗ thực tế trong bãi (SessionStatus = 'Active')
      pool
        .request()
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
            ps.SlotID,
            ps.SlotCode,
            z.ZoneName,
            f.FloorName,
            b.BuildingID,
            b.BuildingName,
            b.Address,
            p.Amount,
            p.PaymentMethod,
            p.PaymentTime,
            p.PaymentStatus,
            booking.ReservationID,
            booking.EndTime AS BookingEndTime,
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
            SELECT TOP 1 r.ReservationID, r.EndTime
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

    // Tính toán thời gian đã đỗ thực tế tính tới thời điểm hiện tại
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

    // Đóng gói và phản hồi kết quả tổng hợp cho màn hình Home
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

/**
 * HÀM 2: getDriverProfile
 * TÁC DỤNG: Lấy chi tiết thông tin trang hồ sơ cá nhân của tài xế (kèm số dư tài khoản `AccountBalance`).
 * 
 * @route GET /api/driver/profile
 * @access Driver Only
 */
export async function getDriverProfile(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 1
          u.UserID,
          u.FullName,
          u.Email,
          u.PhoneNumber,
          CONVERT(VARCHAR(10), u.DateOfBirth, 23) AS DateOfBirth,
          u.AvatarUrl,
          u.IsActive,
          u.IsEmailVerified,
          u.AccountBalance,
          u.CreatedAt,
          u.UpdatedAt,
          r.RoleName
        FROM Users u
        LEFT JOIN Roles r ON u.RoleID = r.RoleID
        WHERE u.UserID = @DriverID
      `);

    const profile = result.recordset[0];

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hồ sơ tài xế.",
      });
    }

    return res.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * HÀM 3: updateDriverProfile
 * TÁC DỤNG: Cập nhật thông tin cá nhân tài xế.
 * LUỒNG BẢO MẬT KHI ĐỔI EMAIL:
 * 1. Bắt buộc tài xế phải cung cấp mật khẩu hiện tại (`currentPassword`).
 * 2. Xác thực mật khẩu đúng bằng `bcryptjs.compare`.
 * 3. Kiểm tra xem Email mới có bị trùng với tài khoản khác không.
 * 4. Tạo `EmailVerifyToken` ngẫu nhiên và gửi mail yêu cầu xác nhận.
 * 
 * @route PATCH /api/driver/profile
 * @access Driver Only
 */
export async function updateDriverProfile(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const fullName = String(req.body.fullName || req.body.FullName || "").trim();
    const phoneNumber = String(
      req.body.phoneNumber || req.body.PhoneNumber || ""
    ).trim();
    const avatarUrl = String(
      req.body.avatarUrl || req.body.AvatarUrl || ""
    ).trim();
    const dateOfBirth = req.body.dateOfBirth || req.body.DateOfBirth || null;
    const email = String(req.body.email || req.body.Email || "").trim().toLowerCase();
    const currentPassword = String(req.body.currentPassword || "").trim();

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: "Họ và tên không được để trống.",
      });
    }

    if (phoneNumber && !/^[0-9+\-\s.]{8,20}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không hợp lệ.",
      });
    }

    const pool = await getPool();

    // Lấy thông tin user hiện tại từ Database
    const currentUserRes = await pool.request()
      .input("DriverID", sql.Int, driverId)
      .query(`SELECT Email, FullName, PasswordHash FROM Users WHERE UserID = @DriverID`);
    const currentUser = currentUserRes.recordset[0];
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản.",
      });
    }

    const currentEmail = currentUser.Email;
    let emailChanged = false;
    let verifyToken = null;
    let expiresAt = null;

    // Xử lý nếu người dùng yêu cầu Đổi Email
    if (email && email !== currentEmail.toLowerCase()) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập mật khẩu hiện tại để xác nhận thay đổi email.",
        });
      }

      // Xác thực mật khẩu
      const isMatch = await bcryptjs.compare(currentPassword, currentUser.PasswordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Mật khẩu hiện tại không chính xác.",
        });
      }

      // Kiểm tra trùng lặp Email
      const emailCheck = await pool.request()
        .input("Email", sql.NVarChar(100), email)
        .input("DriverID", sql.Int, driverId)
        .query(`SELECT UserID FROM Users WHERE Email = @Email AND UserID <> @DriverID`);
      if (emailCheck.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email này đã được sử dụng bởi tài khoản khác.",
        });
      }

      emailChanged = true;
      verifyToken = crypto.randomUUID(); // Sinh token xác minh duy nhất
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Token hết hạn sau 24 giờ
    }

    // Cập nhật thông tin vào bảng Users
    const updateResult = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .input("FullName", sql.NVarChar(100), fullName)
      .input("PhoneNumber", sql.NVarChar(20), phoneNumber || null)
      .input("AvatarUrl", sql.NVarChar(500), avatarUrl || null)
      .input("DateOfBirth", sql.VarChar(10), dateOfBirth || null)
      .input("EmailChanged", sql.Bit, emailChanged ? 1 : 0)
      .input("TempPendingEmail", sql.NVarChar(100), emailChanged ? email : null)
      .input("EmailVerifyToken", sql.NVarChar(500), verifyToken)
      .input("EmailVerifyExpires", sql.DateTime, expiresAt)
      .query(`
        UPDATE Users
        SET
          FullName = @FullName,
          PhoneNumber = @PhoneNumber,
          AvatarUrl = @AvatarUrl,
          DateOfBirth = CASE
            WHEN @DateOfBirth IS NULL OR @DateOfBirth = '' THEN NULL
            ELSE CONVERT(date, @DateOfBirth, 23)
          END,
          TempPendingEmail = CASE WHEN @EmailChanged = 1 THEN @TempPendingEmail ELSE TempPendingEmail END,
          EmailVerifyToken = CASE WHEN @EmailChanged = 1 THEN @EmailVerifyToken ELSE EmailVerifyToken END,
          EmailVerifyExpires = CASE WHEN @EmailChanged = 1 THEN @EmailVerifyExpires ELSE EmailVerifyExpires END,
          UpdatedAt = GETDATE()
        WHERE UserID = @DriverID
      `);

    if (!updateResult.rowsAffected || updateResult.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản để cập nhật.",
      });
    }

    const updatedResult = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 1
          u.UserID,
          u.FullName,
          u.Email,
          u.PhoneNumber,
          CONVERT(VARCHAR(10), u.DateOfBirth, 23) AS DateOfBirth,
          u.AvatarUrl,
          u.IsActive,
          u.IsEmailVerified,
          u.AccountBalance,
          u.CreatedAt,
          u.UpdatedAt,
          u.TempPendingEmail,
          r.RoleName
        FROM Users u
        LEFT JOIN Roles r ON u.RoleID = r.RoleID
        WHERE u.UserID = @DriverID
      `);

    // Gửi email xác minh tới địa chỉ mới nếu có đổi email
    if (emailChanged) {
      sendVerifyEmail(email, fullName, verifyToken).catch((err) => {
        console.error("❌ Gửi verify email khi đổi email thất bại:", err.message);
      });
    }

    return res.json({
      success: true,
      message: emailChanged
        ? "Yêu cầu đổi email thành công. Vui lòng kiểm tra hộp thư của email mới để xác minh và hoàn tất thay đổi."
        : "Cập nhật hồ sơ thành công.",
      data: {
        ...updatedResult.recordset[0],
        requiresVerification: emailChanged,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * HÀM 4: getDriverReportContext
 * TÁC DỤNG: Lấy dữ liệu ngữ cảnh (các phiên đỗ xe active, lịch đỗ gần đây, danh sách sự cố mới tạo) để hỗ trợ điền nhanh Form Báo cáo sự cố.
 * 
 * @route GET /api/driver/report-context
 * @access Driver Only
 */
export async function getDriverReportContext(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

      const currentSessionResult = await pool
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
          s.EntryTime,
          s.ExitTime,
          s.SessionStatus,
          ps.SlotID,
          ps.SlotCode,
          z.ZoneName,
          f.FloorName,
          b.BuildingID,
          b.BuildingName,
          b.Address,
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
        OUTER APPLY (
          SELECT TOP 1
            r.ReservationID,
            r.StartTime,
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
        ORDER BY s.EntryTime DESC
      `);

    const reservationsResult = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 10
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
          b.BuildingID,
          b.BuildingName,
          b.Address,
          r.StartTime,
          r.EndTime,
          r.ReservationStatus,
          r.CreatedAt,
          latestSession.SessionID,
          latestSession.PlateNumber
        FROM Reservations r
        JOIN VehicleTypes vt ON r.VehicleTypeID = vt.VehicleTypeID
        LEFT JOIN ParkingSlots ps ON r.SlotID = ps.SlotID
        LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
        LEFT JOIN Floors f ON z.FloorID = f.FloorID
        LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID
        OUTER APPLY (
          SELECT TOP 1
            s.SessionID,
            s.PlateNumber,
            s.EntryTime
          FROM ParkingSessions s
          WHERE s.DriverID = r.DriverID
            AND s.SlotID = r.SlotID
          ORDER BY s.EntryTime DESC
        ) latestSession
        WHERE r.DriverID = @DriverID
        ORDER BY r.CreatedAt DESC
      `);

    const reportsResult = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 10
          i.IncidentID,
          CONCAT('RP-', RIGHT('0000' + CAST(i.IncidentID AS VARCHAR(10)), 4)) AS ReportCode,
          i.SessionID,
          i.DriverID,
          i.IncidentType,
          i.IncidentStatus,
          i.Priority,
          i.Description,
          i.CreatedAt,
          i.UpdatedAt,
          s.PlateNumber,
          s.EntryTime,
          s.ExitTime,
          ps.SlotCode,
          z.ZoneName,
          f.FloorName,
          b.BuildingName
        FROM Incidents i
        LEFT JOIN ParkingSessions s ON i.SessionID = s.SessionID
        LEFT JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
        LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
        LEFT JOIN Floors f ON z.FloorID = f.FloorID
        LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID
        WHERE i.DriverID = @DriverID
        ORDER BY i.CreatedAt DESC
      `);

    return res.json({
      success: true,
      data: {
        currentSession: currentSessionResult.recordset[0] || null,
        activeSessions: currentSessionResult.recordset,
        reservations: reservationsResult.recordset,
        recentReports: reportsResult.recordset,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * HÀM 5: createDriverReport
 * TÁC DỤNG: Tạo một bản báo cáo sự cố từ phía tài xế gửi lên ban quản lý.
 * SỬ DỤNG SQL TRANSACTION:
 * 1. Chèn dòng vào bảng `Incidents` (Bảng sự cố).
 * 2. Chèn dòng tương ứng vào bảng `Feedbacks`.
 * 3. Tự động gửi Thông báo (`Notifications`) tới toàn bộ tài khoản Nhân viên (Staff) và Quản lý (Manager).
 * 4. Nếu bất kỳ thao tác nào thất bại -> Thực thi Rollback toàn bộ transaction.
 * 
 * @route POST /api/driver/reports
 * @access Driver Only
 */
export async function createDriverReport(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const issueType = String(req.body.issueType || "other").trim();
    const issueLabel = String(req.body.issueLabel || "").trim();
    const description = String(req.body.description || "").trim();

    const sessionIdRaw = req.body.sessionId;
    const reservationIdRaw = req.body.reservationId;

    const sessionId =
      sessionIdRaw && !Number.isNaN(Number(sessionIdRaw))
        ? Number(sessionIdRaw)
        : null;

    const reservationId =
      reservationIdRaw && !Number.isNaN(Number(reservationIdRaw))
        ? Number(reservationIdRaw)
        : null;

    const bookingCode = String(req.body.bookingCode || "").trim();
    const plateNumber = String(req.body.plateNumber || "").trim();
    const attachments = Array.isArray(req.body.attachments)
      ? req.body.attachments
      : [];

    if (!issueType) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn loại sự cố.",
      });
    }

    if (!description || description.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng mô tả sự cố rõ hơn, tối thiểu 5 ký tự.",
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Mô tả sự cố không được vượt quá 1000 ký tự.",
      });
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      let verifiedSession = null;
      let verifiedReservation = null;

      if (sessionId) {
        const sessionCheck = await new sql.Request(transaction)
          .input("SessionID", sql.Int, sessionId)
          .input("DriverID", sql.Int, driverId)
          .query(`
            SELECT TOP 1
              s.SessionID,
              s.PlateNumber,
              s.EntryTime,
              s.SessionStatus,
              ps.SlotCode,
              b.BuildingName
            FROM ParkingSessions s
            LEFT JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
            LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
            LEFT JOIN Floors f ON z.FloorID = f.FloorID
            LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID
            WHERE s.SessionID = @SessionID
              AND s.DriverID = @DriverID
          `);

        verifiedSession = sessionCheck.recordset[0];

        if (!verifiedSession) {
          await transaction.rollback();

          return res.status(404).json({
            success: false,
            message: "Không tìm thấy phiên gửi xe thuộc tài khoản của bạn.",
          });
        }
      }

      if (reservationId) {
        const reservationCheck = await new sql.Request(transaction)
          .input("ReservationID", sql.Int, reservationId)
          .input("DriverID", sql.Int, driverId)
          .query(`
            SELECT TOP 1
              r.ReservationID,
              CONCAT('BK-', RIGHT('0000' + CAST(r.ReservationID AS VARCHAR(10)), 4)) AS BookingCode,
              r.StartTime,
              r.EndTime,
              r.ReservationStatus,
              ps.SlotCode,
              b.BuildingName
            FROM Reservations r
            LEFT JOIN ParkingSlots ps ON r.SlotID = ps.SlotID
            LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
            LEFT JOIN Floors f ON z.FloorID = f.FloorID
            LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID
            WHERE r.ReservationID = @ReservationID
              AND r.DriverID = @DriverID
          `);

        verifiedReservation = reservationCheck.recordset[0];

        if (!verifiedReservation) {
          await transaction.rollback();

          return res.status(404).json({
            success: false,
            message: "Không tìm thấy đặt chỗ thuộc tài khoản của bạn.",
          });
        }
      }

      const attachmentText = buildAttachmentText(attachments);

      const finalDescription = [
        issueLabel ? `[${issueLabel}]` : null,
        bookingCode ? `Mã đặt chỗ: ${bookingCode}` : null,
        plateNumber ? `Biển số: ${plateNumber}` : null,
        verifiedSession?.SlotCode ? `Vị trí: ${verifiedSession.SlotCode}` : null,
        verifiedReservation?.SlotCode
          ? `Vị trí đặt chỗ: ${verifiedReservation.SlotCode}`
          : null,
        attachmentText ? `Tệp đính kèm: ${attachmentText}` : null,
        `Nội dung: ${description}`,
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 500);

      // 1. Chèn thông tin sự cố vào bảng Incidents
      const incidentResult = await new sql.Request(transaction)
        .input("SessionID", sql.Int, sessionId)
        .input("DriverID", sql.Int, driverId)
        .input("IncidentType", sql.NVarChar(50), issueType)
        .input("Priority", sql.NVarChar(20), normalizeReportPriority(issueType))
        .input("Description", sql.NVarChar(500), finalDescription)
        .query(`
          INSERT INTO Incidents (
            SessionID,
            DriverID,
            IncidentType,
            IncidentStatus,
            Priority,
            Description,
            CreatedAt,
            UpdatedAt
          )
          VALUES (
            @SessionID,
            @DriverID,
            @IncidentType,
            'Open',
            @Priority,
            @Description,
            GETDATE(),
            GETDATE()
          );
          SELECT SCOPE_IDENTITY() AS IncidentID;
        `);

      const incident = incidentResult.recordset[0];

      // 2. Chèn thông tin phản hồi vào bảng Feedbacks
      await new sql.Request(transaction)
        .input("DriverID", sql.Int, driverId)
        .input("IncidentID", sql.Int, incident.IncidentID)
        .input("FeedbackType", sql.NVarChar(50), issueType)
        .input("Description", sql.NVarChar(500), description.slice(0, 500))
        .input("Attachment", sql.NVarChar(200), attachmentText)
        .query(`
          INSERT INTO Feedbacks (
            DriverID,
            IncidentID,
            FeedbackType,
            Description,
            Attachment,
            FeedbackStatus,
            CreatedAt,
            UpdatedAt
          )
          VALUES (
            @DriverID,
            @IncidentID,
            @FeedbackType,
            @Description,
            @Attachment,
            'Open',
            GETDATE(),
            GETDATE()
          )
        `);

      // 3. TỰ ĐỘNG GỬI THÔNG BÁO TỚI STAFF VÀ MANAGER
      await new sql.Request(transaction)
        .input("IncidentID", sql.Int, incident.IncidentID)
        .input("Title", sql.NVarChar(200), `Sự cố mới: ${buildReportCode(incident.IncidentID)}`)
        .input("Message", sql.NVarChar(500), `Có sự cố mới báo cáo từ Driver. Loại: ${issueType}`)
        .query(`
          INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType, IsRead, CreatedAt)
          SELECT u.UserID, @Title, @Message, 'Incident', @IncidentID, 'Incident', 0, GETDATE()
          FROM Users u
          JOIN Roles r ON u.RoleID = r.RoleID
          WHERE r.RoleName IN ('Staff', 'Manager') AND u.IsActive = 1
        `);

      // Commit transaction
      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "Gửi báo cáo sự cố thành công.",
        data: {
          ...incident,
          ReportCode: buildReportCode(incident.IncidentID),
        },
      });
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {}

      throw error;
    }
  } catch (err) {
    next(err);
  }
}

/**
 * HÀM 6: getDriverReports
 * TÁC DỤNG: Lấy danh sách lịch sử tất cả các báo cáo sự cố mà tài xế đã gửi (hỗ trợ phân trang OFFSET FETCH).
 * 
 * @route GET /api/driver/reports?limit=20&offset=0
 * @access Driver Only
 */
export async function getDriverReports(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const pool = await getPool();

    const result = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .input("Limit", sql.Int, limit)
      .input("Offset", sql.Int, offset)
      .query(`
        SELECT
          i.IncidentID,
          CONCAT('RP-', RIGHT('0000' + CAST(i.IncidentID AS VARCHAR(10)), 4)) AS ReportCode,
          i.SessionID,
          i.DriverID,
          i.IncidentType,
          i.IncidentStatus,
          i.Priority,
          i.Description,
          i.CreatedAt,
          i.UpdatedAt,

          s.PlateNumber,
          s.EntryTime,
          s.ExitTime,

          ps.SlotCode,
          z.ZoneName,
          f.FloorName,
          b.BuildingName

        FROM Incidents i
        LEFT JOIN ParkingSessions s ON i.SessionID = s.SessionID
        LEFT JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
        LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
        LEFT JOIN Floors f ON z.FloorID = f.FloorID
        LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID

        WHERE i.DriverID = @DriverID

        ORDER BY i.CreatedAt DESC
        OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
      `);

    return res.json({
      success: true,
      data: result.recordset,
    });
  } catch (err) {
    next(err);
  }
}