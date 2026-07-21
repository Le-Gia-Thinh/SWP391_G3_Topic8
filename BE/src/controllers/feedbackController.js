/**
 * FILE: feedbackController.js
 * MÔ TẢ: Controller xử lý đánh giá dịch vụ (Feedback/Rating) từ tài xế.
 * 
 * Chức năng:
 * - createServiceRating: Tài xế tạo đánh giá cho một phiên đỗ xe đã hoàn thành.
 * - getDriverRatings: Lấy danh sách đánh giá của tài xế.
 * - getUnratedSessions: Lấy danh sách phiên đỗ xe đã hoàn thành nhưng chưa được đánh giá.
 * 
 * @access Driver only
 */
/*
Hieu
*/

import { getPool, sql } from "../config/db.js"; // Kết nối database

/**
 * Hàm helper: Lấy UserID từ request.
 */
function getUserIdFromToken(req) {
  return req.user?.UserID || req.user?.userId || req.user?.id;
}

// ─────────────────────────────────────────────────────────────
// POST /driver/ratings
// ─────────────────────────────────────────────────────────────
export async function createServiceRating(req, res, next) {
  try {
    const driverId = getUserIdFromToken(req);

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin tài xế. Vui lòng đăng nhập lại.",
      });
    }

    const sessionId = Number(req.body.sessionId);
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim().slice(0, 500) || null;
    const tags = Array.isArray(req.body.tags)
      ? req.body.tags.join(", ").slice(0, 500)
      : null;

    if (!sessionId || Number.isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn phiên gửi xe cần đánh giá.",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Đánh giá phải từ 1 đến 5 sao.",
      });
    }

    const pool = await getPool();

    // Verify session belongs to driver and is completed
    const sessionCheck = await pool
      .request()
      .input("SessionID", sql.Int, sessionId)
      .input("DriverID", sql.Int, driverId)
      .query(`
        SELECT TOP 1 SessionID, SessionStatus
        FROM ParkingSessions
        WHERE SessionID = @SessionID AND DriverID = @DriverID
      `);

    if (sessionCheck.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phiên gửi xe thuộc tài khoản của bạn.",
      });
    }

    if (sessionCheck.recordset[0].SessionStatus !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể đánh giá phiên gửi xe đã hoàn thành.",
      });
    }

    // Check if already rated
    const dupCheck = await pool
      .request()
      .input("SessionID", sql.Int, sessionId)
      .query(`
        SELECT RatingID FROM ServiceRatings
        WHERE SessionID = @SessionID
      `);

    if (dupCheck.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Phiên gửi xe này đã được đánh giá.",
      });
    }

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

    return res.status(201).json({
      success: true,
      message: "Cảm ơn bạn đã đánh giá dịch vụ!",
      data: insertResult.recordset[0],
    });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// GET /driver/ratings
// ─────────────────────────────────────────────────────────────
export async function getDriverRatings(req, res, next) {
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

// ─────────────────────────────────────────────────────────────
// GET /driver/completed-sessions (unrated)
// ─────────────────────────────────────────────────────────────
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
