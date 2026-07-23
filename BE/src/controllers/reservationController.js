/**
 * FILE: reservationController.js
 * MÔ TẢ: Controller tiếp nhận các yêu cầu Đặt chỗ đỗ xe (Reservation/Booking) từ Frontend.
 * 
 * ĐIỂM KHÁC BIỆT SO VỚI LUỒNG VEHICLE:
 * Controller này áp dụng mô hình 3 tầng (Layered MVC/Service Pattern):
 * - Controller KHÔNG tự viết câu SQL trực tiếp.
 * - Controller gọi xuống tầng `reservationService.js` để thực thi logic kiểm tra 15 phút,
 *   check trùng giờ SQL, check xe trong bãi, chạy AI gợi ý vị trí và chèn DB SQL Server.
 * 
 * Chức năng trong file:
 * - getReservations: Lấy danh sách lịch sử đặt chỗ của tài xế.
 * - getReservationById: Xem thông tin chi tiết một mã đặt chỗ.
 * - getAvailableSlots: Tìm các chỗ đỗ còn trống theo loại xe & thời gian.
 * - createReservation: Tạo đơn đặt chỗ mới.
 * - cancelReservation: Hủy đơn đặt chỗ.
 * 
 * @access Driver (đặt chỗ), Staff/Manager (xem/quản lý)
 */
/*
hieu
*/

import * as reservationService from "../services/reservationService.js"; // Service xử lý nghiệp vụ đặt chỗ

/**
 * Hàm helper: Lấy HTTP status code từ đối tượng error (Nếu lỗi client 4xx thì giữ nguyên status, 5xx thì trả 500).
 * @param {Error} err - Đối tượng lỗi
 * @returns {number} HTTP status code
 */
function getErrorStatus(err) {
  return err.status || err.statusCode || 500;
}

/**
 * Hàm helper: Xử lý phản hồi lỗi client (4xx) trực tiếp về cho Frontend.
 * Nếu là lỗi Server (5xx), trả về null để nhường cho errorHandlingMiddleware ở server.js xử lý.
 * @param {Object} res - Express response
 * @param {Error} err - Đối tượng lỗi
 * @returns {Object|null}
 */
function sendClientError(res, err) {
  const status = getErrorStatus(err);

  if (status < 500) {
    return res.status(status).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// 1. LẤY DANH SÁCH ĐẶT CHỖ
// Method: GET /api/reservations
// ─────────────────────────────────────────────────────────────
export async function getReservations(req, res, next) {
  try {
    // Gọi Service quét danh sách đơn đặt chỗ từ SQL Server
    const data = await reservationService.getReservations(req);

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    const handled = sendClientError(res, err);
    if (handled) return handled;
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// 2. XEM CHI TIẾT MỘT ĐƠN ĐẶT CHỖ
// Method: GET /api/reservations/:id
// ─────────────────────────────────────────────────────────────
export async function getReservationById(req, res, next) {
  try {
    // Gọi Service lấy thông tin đặt chỗ theo ID
    const data = await reservationService.getReservationById(req);

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    const handled = sendClientError(res, err);
    if (handled) return handled;
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. TÌM CHỖ ĐỖ CÒN TRỐNG (Tích hợp AI Gợi Ý)
// Method: GET /api/reservations/available-slots
// ─────────────────────────────────────────────────────────────
export async function getAvailableSlots(req, res, next) {
  try {
    // Gọi Service lấy danh sách chỗ trống & chạy thuật toán AI recommendOptimalSlot
    const data = await reservationService.getAvailableSlots(req);

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    const handled = sendClientError(res, err);
    if (handled) return handled;
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// 4. TẠO ĐƠN ĐẶT CHỖ MỚI
// Method: POST /api/reservations
// ─────────────────────────────────────────────────────────────
export async function createReservation(req, res, next) {
  try {
    // Gọi Service thực thi 5 tầng kiểm tra (15 phút, trùng giờ SQL, xe trong bãi, AI slot, tạo DB & gửi Email)
    const data = await reservationService.createReservation(req);

    // Trả về HTTP 201 Created thành công kèm Mã Đặt Chỗ (BookingCode)
    return res.status(201).json({
      success: true,
      message: "Đặt chỗ thành công.",
      data,
    });
  } catch (err) {
    const handled = sendClientError(res, err);
    if (handled) return handled;
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────
// 5. HỦY ĐƠN ĐẶT CHỖ
// Method: PATCH /api/reservations/:id/cancel
// ─────────────────────────────────────────────────────────────
export async function cancelReservation(req, res, next) {
  try {
    // Gọi Service cập nhật trạng thái đơn đặt chỗ thành 'Cancelled'
    const data = await reservationService.cancelReservation(req);

    return res.json({
      success: true,
      message: "Hủy đặt chỗ thành công.",
      data,
    });
  } catch (err) {
    const handled = sendClientError(res, err);
    if (handled) return handled;
    next(err);
  }
}