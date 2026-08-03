/**
 * FILE: feedbackController.js
 * MÔ TẢ: Controller quản lý các đánh giá dịch vụ (Rating & Feedback) từ Tài xế sau khi hoàn thành phiên gửi xe.
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Đảm bảo tính chính chủ: Kiểm tra phiên đỗ xe có đúng là của tài xế đang đăng nhập và đã ở trạng thái 'Completed'.
 * 2. Đảm bảo tính duy nhất: Kiểm tra phiên gửi xe đó chưa từng được đánh giá (Chống đánh giá lặp lại - Status 409 Conflict).
 * 3. Chèn đánh giá mới (1-5 sao, bình luận, thẻ tags) và trả về thông tin bằng cú pháp `OUTPUT inserted.*`.
 * 4. Cung cấp API liệt kê lịch sử đánh giá của tài xế (có phân trang) và các phiên chưa đánh giá.
 */

// Import đối tượng kết nối `getPool` và kiểu dữ liệu `sql` từ cấu hình 'BE/src/config/db.js'
import { getPool, sql } from "../config/db.js";

/**
 * HÀM HELPER: getUserIdFromToken
 * TÁC DỤNG: Trích xuất an toàn UserID từ đối tượng `req.user` (Do Middleware xác thực JWT gán vào).
 * CÚ PHÁP OPTIONAL CHAINING (`?.`): Ngăn ngừa lỗi crash ứng dụng `TypeError: Cannot read property of undefined` nếu `req.user` bị null.
 */
function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

/**
 * HÀM 1: createServiceRating
 * TÁC DỤNG: Tạo đánh giá mới (1-5 sao) cho phiên gửi xe đã hoàn thành.
 * 
 * THUẬT NGỮ & CÚ PHÁP:
 * - `OUTPUT inserted.*`: Cú pháp T-SQL trả về ngay lập tức dòng vừa được chèn vào DB mà không cần làm thêm lệnh SELECT phụ.
 * - `sql.NVarChar(500)`: Khai báo kiểu dữ liệu chuỗi Unicode trong SQL Server để hỗ trợ tiếng Việt có dấu.
 * 
 * @route POST /api/driver/ratings
 * @access Driver Only (Chỉ dành cho Tài xế)
 */
export async function createServiceRating(req, res, next) {
  try {
    // TRÍCH XUẤT MA USER TỪ TOKEN JWT:
    const driverId = getUserIdFromToken(req);

    // KIỂM TRA ĐĂNG NHẬP (Authentication Check):
    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    // LẤY VÀ CHUẨN HÓA DỮ LIỆU ĐẦU VÀO TỪ REQ.BODY:
    const sessionId = Number(req.body.sessionId); // Ép kiểu mã phiên đỗ thành số
    const rating = Number(req.body.rating);       // Ép kiểu số sao đánh giá (1-5)
    // Chuẩn hóa chuỗi comment: Cắt khoảng trắng đầu cuối và giới hạn tối đa 500 ký tự
    const comment = String(req.body.comment || "").trim().slice(0, 500) || null;
    // Chuyển mảng các tag thành chuỗi phân cách bằng dấu phẩy
    const tags = Array.isArray(req.body.tags)
      ? req.body.tags.join(", ").slice(0, 500)
      : null;

    // VALIDATION 1: Kiểm tra mã phiên đỗ xe
    if (!sessionId || Number.isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn phiên gửi xe cần đánh giá.",
      });
    }

    // VALIDATION 2: Kiểm tra khoảng số sao đánh giá (từ 1 đến 5 sao)
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Đánh giá phải từ 1 đến 5 sao.",
      });
    }

    // KẾT NỐI DATABASE CONNECTION POOL:
    const pool = await getPool();

    // BƯỚC 1: Kiểm tra xem phiên gửi xe có tồn tại và thuộc về tài xế này hay không
    const sessionCheck = await pool
      .request()
      .input("SessionID", sql.Int, sessionId)
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 1 SessionID, SessionStatus
        FROM ParkingSessions
        WHERE SessionID = @SessionID AND DriverID = @DriverID
      `);

    // Nếu không tìm thấy phiên gửi xe nào thuộc về tài xế
    if (sessionCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phiên gửi xe thuộc tài khoản của bạn.",
      });
    }

    // Nếu phiên gửi xe chưa hoàn thành (chưa ra khỏi bãi) thì không cho phép đánh giá
    if (sessionCheck.recordset[0].SessionStatus !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá phiên gửi xe đã hoàn thành.",
      });
    }

    // BƯỚC 2: Kiểm tra chống đánh giá trùng lặp (Duplicate Rating Check)
    const dupCheck = await pool
      .request()
      .input("SessionID", sql.Int, sessionId)
      .query(`
        SELECT RatingID FROM ServiceRatings
        WHERE SessionID = @SessionID
      `);

    // Nếu phiên đỗ xe này đã có bản ghi đánh giá từ trước
    if (dupCheck.recordset.length > 0) {
      // Trả về HTTP Status Code 409 (Conflict - Xung đột dữ liệu đã tồn tại)
      return res.status(409).json({
        success: false,
        message: "Phiên gửi xe này đã được đánh giá.",
      });
    }

    // BƯỚC 3: Chèn bản ghi đánh giá dịch vụ mới vào bảng ServiceRatings
    const insertResult = await pool
      .request()
      .input("SessionID", sql.Int, sessionId)
      .input("DriverID", sql.Int, driverId)
      .input("Rating", sql.Int, rating)
      .input("Comment", sql.NVarChar(500), comment)
      .input("Tags", sql.NVarChar(500), tags)
      .query(`
        INSERT INTO ServiceRatings (
          SessionID, DriverID, Rating, Comment, Tags
        )
        OUTPUT inserted.*
        VALUES (
          @SessionID, @DriverID, @Rating, @Comment, @Tags
        )
      `);

    // TRẢ VỀ KẾT QUẢ THÀNH CÔNG KÈM HTTP STATUS 201 (Created - Đã tạo thành công)
    return res.status(201).json({
      success: true,
      message: "Cảm ơn bạn đã đánh giá dịch vụ!",
      data: insertResult.recordset[0], // Trả về chi tiết đánh giá vừa tạo
    });
  } catch (err) {
    // CHUYỂN LỖI SANG MIDDLEWARE XỬ LÝ LỖI TRUNG TÂM
    next(err);
  }
}

/**
 * HÀM 2: getDriverRatings
 * TÁC DỤNG: Lấy danh sách tất cả các đánh giá mà tài xế đã thực hiện (có hỗ trợ Phân trang).
 * 
 * @route GET /api/driver/ratings?limit=20&offset=0
 * @access Driver Only (Chỉ dành cho Tài xế)
 */
export async function getDriverRatings(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    // PHÂN TRANG (Pagination Parameters):
    // - `limit`: Giới hạn từ 1 đến 100 bản ghi trên mỗi trang (Mặc định: 20)
    // - `offset`: Số lượng bản ghi cần bỏ qua (Mặc định: 0)
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const pool = await getPool();

    // Truy vấn dữ liệu đánh giá kết nối với chi tiết phiên gửi xe và thông tin vị trí đỗ (Slots, Zones, Floors, Buildings)
    const result = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .input("Limit", sql.Int, limit)
      .input("Offset", sql.Int, offset)
      .query(`
        SELECT
          sr.RatingID,
          sr.SessionID,
          sr.DriverID,
          sr.Rating,
          sr.Comment,
          sr.Tags,
          sr.CreatedAt,

          s.PlateNumber,
          s.EntryTime,
          s.ExitTime,
          s.SessionStatus,

          ps.SlotCode,
          z.ZoneName,
          f.FloorName,
          b.BuildingName

        FROM ServiceRatings sr
        JOIN ParkingSessions s ON sr.SessionID = s.SessionID
        LEFT JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
        LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
        LEFT JOIN Floors f ON z.FloorID = f.FloorID
        LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID

        WHERE sr.DriverID = @DriverID

        ORDER BY sr.CreatedAt DESC
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

/**
 * HÀM 3: getUnratedSessions
 * TÁC DỤNG: Lấy danh sách 20 phiên gửi xe đã hoàn thành nhưng chưa được đánh giá.
 * Giúp giao diện App nhắc nhở tài xế đánh giá dịch vụ.
 * 
 * THUẬT NGỮ & CÚ PHÁP:
 * - `NOT EXISTS (SELECT 1 FROM ServiceRatings ...)`: Kỹ thuật SQL tối ưu để lọc ra các dòng dữ liệu CHƯA từng xuất hiện trong bảng ServiceRatings.
 * 
 * @route GET /api/driver/completed-sessions
 * @access Driver Only (Chỉ dành cho Tài xế)
 */
export async function getUnratedSessions(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

    // Truy vấn danh sách TOP 20 phiên gửi xe của tài xế đã ở trạng thái Completed và CHƯA CÓ bản ghi trong ServiceRatings
    const result = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 20
          s.SessionID,
          s.PlateNumber,
          s.EntryTime,
          s.ExitTime,
          s.SessionStatus,
          s.VehicleTypeID,
          vt.VehicleCode,
          vt.VehicleName,

          ps.SlotCode,
          z.ZoneName,
          f.FloorName,
          b.BuildingName,

          p.Amount,
          p.PaymentStatus

        FROM ParkingSessions s
        JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
        LEFT JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
        LEFT JOIN Zones z ON ps.ZoneID = z.ZoneID
        LEFT JOIN Floors f ON z.FloorID = f.FloorID
        LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID
        LEFT JOIN Payments p ON p.SessionID = s.SessionID

        WHERE s.DriverID = @DriverID
          AND s.SessionStatus = 'Completed'
          AND NOT EXISTS (
            SELECT 1 FROM ServiceRatings sr
            WHERE sr.SessionID = s.SessionID
          )

        ORDER BY s.ExitTime DESC
      `);

    return res.json({
      success: true,
      data: result.recordset,
    });
  } catch (err) {
    next(err);
  }
}

