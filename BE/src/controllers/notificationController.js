/**
 * FILE: notificationController.js
 * MÔ TẢ: Controller quản lý hệ thống Thông báo (Notifications) thời gian thực dành cho người dùng (Tài xế/Bảo vệ/Quản lý).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. `getNotifications`: Truy vấn danh sách thông báo cá nhân, hỗ trợ lọc theo loại thông báo (payment, booking, incident, system) và phân trang.
 * 2. `getUnreadCount`: Đếm số lượng thông báo chưa đọc (`IsRead = 0`) để hiển thị huy hiệu đỏ (Badge counter) trên biểu tượng hình Quả chuông ở giao diện App/Web.
 * 3. `markAsRead`: Cập nhật trạng thái `IsRead = 1` cho một thông báo cụ thể khi người dùng click vào xem.
 * 4. `markAllAsRead`: Cập nhật trạng thái `IsRead = 1` cho tất cả các thông báo chưa đọc của người dùng.
 */

// Import hàm `getPool` kết nối Database và đối tượng dữ liệu `sql` từ cấu hình 'BE/src/config/db.js'
import { getPool, sql } from "../config/db.js";

/**
 * HÀM HELPER: getUserIdFromToken
 * TÁC DỤNG: Lấy an toàn UserID từ đối tượng `req.user` do Middleware JWT gán vào.
 */
function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

/**
 * HÀM 1: getNotifications
 * TÁC DỤNG: Lấy danh sách thông báo của người dùng kèm phân trang và bộ lọc loại thông báo.
 * 
 * THUẬT NGỮ & CÚ PHÁP:
 * - Dynamic SQL Building: Xây dựng câu truy vấn SQL động (nối chuỗi `whereClause`) tùy thuộc vào việc có truyền loại lọc `typeFilter` hay không.
 * 
 * @route GET /api/driver/notifications?limit=20&offset=0&type=payment
 * @access Driver / Staff / Manager (Yêu cầu đăng nhập)
 */
export async function getNotifications(req, res, next) {
  try {
    // Lấy ID tài xế từ Token JWT
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    // CHUẨN HÓA THAM SỐ PHÂN TRANG VÀ LỌC:
    // Limit: Giới hạn từ 1 đến 100 dòng dữ liệu (Mặc định 20)
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    // Offset: Bỏ qua bao nhiêu dòng dữ liệu (Mặc định 0)
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    // TypeFilter: Lọc theo loại (payment, booking, incident, system) hoặc null
    const typeFilter = req.query.type || null;

    const pool = await getPool();
    // Tạo đối tượng Request truy vấn SQL Server
    const request = pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .input("Limit", sql.Int, limit)
      .input("Offset", sql.Int, offset);

    // Chuỗi điều kiện WHERE ban đầu
    let whereClause = "WHERE n.UserID = @DriverID";

    // Nếu người dùng có lọc theo loại thông báo cụ thể (khác 'all')
    if (typeFilter && typeFilter !== "all") {
      request.input("TypeFilter", sql.NVarChar(50), typeFilter);
      whereClause += " AND n.NotificationType = @TypeFilter";
    }

    // TRUY VẤN 1: Lấy danh sách thông báo theo thứ tự mới nhất (CreatedAt DESC) kèm phân trang OFFSET...FETCH
    const result = await request.query(`
      SELECT
        n.NotificationID,
        n.UserID,
        n.Title,
        n.Message,
        n.NotificationType,
        n.ReferenceID,
        n.ReferenceType,
        n.IsRead,
        n.CreatedAt
      FROM Notifications n
      ${whereClause}
      ORDER BY n.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `);

    // TRUY VẤN 2: Đếm tổng số thông báo khớp điều kiện (phục vụ hiển thị tổng số trang ở Client)
    const countRequest = pool
      .request()
      .input("DriverID", sql.Int, driverId);

    if (typeFilter && typeFilter !== "all") {
      countRequest.input("TypeFilter", sql.NVarChar(50), typeFilter);
    }

    const countResult = await countRequest.query(`
        SELECT COUNT(*) AS Total
        FROM Notifications n
        ${whereClause}
      `);

    // TRẢ VỀ DỮ LIỆU THÔNG BÁO VÀ TỔNG SỐ BẢN GHI
    return res.json({
      success: true,
      data: result.recordset,
      total: countResult.recordset[0]?.Total || 0,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * HÀM 2: getUnreadCount
 * TÁC DỤNG: Đếm số lượng thông báo CHƯA ĐỌC (`IsRead = 0`) để hiển thị lên Huy hiệu (Badge Number) nút Quả chuông.
 * 
 * @route GET /api/driver/notifications/unread-count
 * @access Authenticated Users
 */
export async function getUnreadCount(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

    // Truy vấn COUNT tổng số thông báo có UserID trùng khớp và IsRead = 0
    const result = await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT COUNT(*) AS UnreadCount
        FROM Notifications
        WHERE UserID = @DriverID AND IsRead = 0
      `);

    return res.json({
      success: true,
      data: { unreadCount: result.recordset[0]?.UnreadCount || 0 },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * HÀM 3: markAsRead
 * TÁC DỤNG: Đánh dấu ĐÃ ĐỌC (`IsRead = 1`) cho một thông báo cụ thể theo NotificationID.
 * 
 * @route PATCH /api/driver/notifications/:id/read
 * @access Authenticated Users
 */
export async function markAsRead(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);
    const notificationId = Number(req.params.id); // Lấy mã thông báo từ tham số đường dẫn URL

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    if (!notificationId || Number.isNaN(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "ID thông báo không hợp lệ.",
      });
    }

    const pool = await getPool();

    // Cập nhật trạng thái IsRead = 1 cho thông báo thuộc về UserID này
    const result = await pool
      .request()
      .input("NotificationID", sql.Int, notificationId)
      .input("DriverID", sql.Int, driverId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1
        WHERE NotificationID = @NotificationID AND UserID = @DriverID
      `);

    // KIỂM TRA SỐ DÒNG BỊ ẢNH HƯỞNG (rowsAffected):
    // Nếu không có dòng nào được cập nhật -> Không tìm thấy thông báo hoặc thông báo thuộc người khác
    if (!result.rowsAffected || result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo.",
      });
    }

    return res.json({
      success: true,
      message: "Đã đánh dấu đã đọc.",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * HÀM 4: markAllAsRead
 * TÁC DỤNG: Đánh dấu ĐÃ ĐỌC cho TOÀN BỘ thông báo chưa đọc của người dùng hiện tại ("Đánh dấu tất cả là đã đọc").
 * 
 * @route PATCH /api/driver/notifications/read-all
 * @access Authenticated Users
 */
export async function markAllAsRead(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const pool = await getPool();

    // Cập nhật toàn bộ các bản ghi đang IsRead = 0 thành IsRead = 1 của UserID này
    await pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1
        WHERE UserID = @DriverID AND IsRead = 0
      `);

    return res.json({
      success: true,
      message: "Đã đánh dấu tất cả thông báo đã đọc.",
    });
  } catch (err) {
    next(err);
  }
}

