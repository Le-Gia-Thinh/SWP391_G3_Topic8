/**
 * FILE: notificationController.js
 * MÔ TẢ: Controller xử lý thông báo (Notifications) cho người dùng (đặc biệt là Driver).
 * 
 * Chức năng:
 * - getNotifications: Lấy danh sách thông báo của người dùng (có phân trang, lọc theo loại).
 * - getUnreadCount: Lấy số lượng thông báo chưa đọc.
 * - markAsRead: Đánh dấu một thông báo là đã đọc.
 * - markAllAsRead: Đánh dấu tất cả thông báo là đã đọc.
 * 
 * @access Driver, Staff, Manager
 */

import { getPool, sql } from "../config/db.js"; // Kết nối database

/**
 * Hàm helper: Lấy UserID từ request.
 */
function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

// ─────────────────────────────────────────────────────────────
// GET /driver/notifications
// ─────────────────────────────────────────────────────────────
export async function getNotifications(req, res, next) {
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
    const typeFilter = req.query.type || null;

    const pool = await getPool();
    const request = pool
      .request()
      .input("DriverID", sql.Int, driverId)
      .input("Limit", sql.Int, limit)
      .input("Offset", sql.Int, offset);

    let whereClause = "WHERE n.UserID = @DriverID";

    if (typeFilter && typeFilter !== "all") {
      request.input("TypeFilter", sql.NVarChar(50), typeFilter);
      whereClause += " AND n.NotificationType = @TypeFilter";
    }

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

    return res.json({
      success: true,
      data: result.recordset,
      total: countResult.recordset[0]?.Total || 0,
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET /driver/notifications/unread-count
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// PATCH /driver/notifications/:id/read
// ─────────────────────────────────────────────────────────────
export async function markAsRead(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);
    const notificationId = Number(req.params.id);

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

    const result = await pool
      .request()
      .input("NotificationID", sql.Int, notificationId)
      .input("DriverID", sql.Int, driverId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1
        WHERE NotificationID = @NotificationID AND UserID = @DriverID
      `);

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

// ─────────────────────────────────────────────────────────────
// PATCH /driver/notifications/read-all
// ─────────────────────────────────────────────────────────────
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
