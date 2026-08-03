/**
 * FILE: reservationController.js
 * MÔ TẢ: Controller tiếp nhận và xử lý các yêu cầu Đặt chỗ đỗ xe trước (Reservation/Booking) từ giao diện Web/Mobile App.
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Áp dụng chuẩn kiến trúc 3 tầng (Layered MVC Architecture Pattern):
 *    - Tầng Controller (File này): Chỉ chịu trách nhiệm tiếp nhận HTTP Request, gọi tầng Service và phản hồi JSON về Client.
 *    - Tầng Service (`BE/src/services/reservationService.js`): Chịu trách nhiệm xử lý logic 5 lớp kiểm tra (Quy tắc 15 phút, gọi Stored Procedure `sp_CreateReservation` kiểm tra trùng lịch đỗ trong SQL, gọi AI thuật toán vị trí đỗ tối ưu `recommendOptimalSlot`, gửi Email xác nhận).
 * 2. Tích hợp hàm Helper phân loại lỗi `sendClientError`: Tự động trả về phản hồi lỗi phía Client (Mã 4xx) hoặc đẩy lỗi Server (Mã 5xx) sang Middleware trung tâm.
 */

// Import các phương thức xử lý nghiệp vụ đặt chỗ từ 'BE/src/services/reservationService.js'
// LIÊN KẾT FILE: `BE/src/services/reservationService.js` - Chứa logic tạo booking, hủy đặt chỗ, lọc ô trống và thuật toán AI gợi ý chỗ đỗ.
import * as reservationService from "../services/reservationService.js";

/**
 * HÀM HELPER 1: getErrorStatus
 * TÁC DỤNG: Trích xuất chính xác mã lỗi HTTP Status Code từ đối tượng ngoại lệ (Error object).
 * Nếu là lỗi không xác định hoặc lỗi hệ thống thì gán mặc định là 500 (Internal Server Error).
 */
function getErrorStatus(err) {
  return err.status || err.statusCode || 500;
}

/**
 * HÀM HELPER 2: sendClientError
 * TÁC DỤNG: Kiểm tra và phản hồi lỗi trực tiếp nếu là lỗi dữ liệu phía Client (Mã HTTP 4xx - Bad Request, Unauthorized, Forbidden, Conflict,...).
 * Nếu mã lỗi >= 500 (Lỗi server), hàm trả về `null` để nhường quyền xử lý lỗi cho Middleware trung tâm `errorHandlerMiddleware.js`.
 */
function sendClientError(res, err) {
  const status = getErrorStatus(err);

  // Nếu là lỗi Client (Mã HTTP 400 đến 499)
  if (status < 500) {
    return res.status(status).json({
      success: false,
      message: err.message, // Thông điệp báo lỗi nghiệp vụ
      code: err.code,       // Mã lỗi định danh (nếu có)
    });
  }

  // Nếu là lỗi Server (>= 500), trả về null
  return null;
}

/**
 * HÀM 1: getReservations
 * TÁC DỤNG: Lấy danh sách lịch sử tất cả các đơn đặt chỗ đỗ xe.
 * (Tài xế xem đơn của mình, Nhân viên/Quản lý xem được toàn bộ đơn trong hệ thống).
 * 
 * @route GET /api/reservations
 * @access Driver / Staff / Manager / Admin
 */
export async function getReservations(req, res, next) {
  try {
    // GỌI TẦNG SERVICE TRA CỨU ĐƠN ĐẶT CHỖ TỪ DATABASE:
    // LIÊN KẾT: Gọi hàm `reservationService.getReservations(req)` trong `BE/src/services/reservationService.js`.
    const data = await reservationService.getReservations(req);

    // Trả về JSON chứa mảng các đơn đặt chỗ kèm HTTP 200 (OK)
    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    // Kiểm tra xem có phải lỗi Client (4xx) không, nếu phải thì gửi phản hồi trực tiếp
    const handled = sendClientError(res, err);
    if (handled) return handled;
    // Nếu là lỗi 500 thì chuyển cho Error Handler Middleware trung tâm
    next(err);
  }
}

/**
 * HÀM 2: getReservationById
 * TÁC DỤNG: Xem thông tin chi tiết một đơn đặt chỗ cụ thể qua Mã ID.
 * 
 * @route GET /api/reservations/:id
 * @access Driver (chủ sở hữu) / Staff / Manager / Admin
 */
export async function getReservationById(req, res, next) {
  try {
    // Gọi Service lấy thông tin đặt chỗ theo req.params.id
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

/**
 * HÀM 3: getAvailableSlots
 * TÁC DỤNG: Tìm kiếm các vị trí đỗ xe (Slots) còn trống trong khoảng thời gian đỗ mong muốn.
 * TÍCH HỢP AI: Gọi thuật toán `recommendOptimalSlot` trong reservationService để gợi ý vị trí đỗ thuận tiện nhất (gần lối ra vào / dễ đỗ).
 * 
 * @route GET /api/reservations/available-slots?buildingId=1&startTime=...&endTime=...
 * @access Public / Driver
 */
export async function getAvailableSlots(req, res, next) {
  try {
    // Gọi Service quét các ô đỗ rảnh trong DB SQL Server và chạy thuật toán AI gợi ý
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

/**
 * HÀM 4: createReservation
 * TÁC DỤNG: Tạo đơn đặt chỗ đỗ xe mới.
 * LUỒNG XỬ LÝ (5 TẦNG KIỂM TRA):
 * 1. Kiểm tra tài xế phải đặt trước ít nhất 15 phút so với giờ bắt đầu.
 * 2. Gọi Stored Procedure `sp_CreateReservation` kiểm tra không bị trùng lịch đỗ trong SQL Server.
 * 3. Kiểm tra biển số xe không được trùng với xe đang gửi active trong bãi.
 * 4. Tự động gán vị trí ô đỗ AI khuyến nghị hoặc ô đỗ tài xế chỉ định.
 * 5. Lưu DB và tự động gửi Email xác nhận đặt chỗ thành công.
 * 
 * @route POST /api/reservations
 * @access Driver Only (Chỉ dành cho tài xế)
 */
export async function createReservation(req, res, next) {
  try {
    // Gọi Service thực thi toàn bộ logic 5 tầng tạo đơn đặt chỗ
    const data = await reservationService.createReservation(req);

    // Trả về HTTP Status Code 201 (Created) thành công kèm Mã Đặt Chỗ (BookingCode)
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

/**
 * HÀM 5: cancelReservation
 * TÁC DỤNG: Hủy đơn đặt chỗ trước khi thời gian đỗ bắt đầu.
 * Cập nhật trạng thái đơn đặt chỗ trong bảng `Reservations` thành 'Cancelled' và giải phóng trạng thái SlotStatus.
 * 
 * @route PATCH /api/reservations/:id/cancel
 * @access Driver (chủ đơn) / Staff / Manager / Admin
 */
export async function cancelReservation(req, res, next) {
  try {
    // Gọi Service thực hiện hủy đơn và cập nhật trạng thái trong SQL Server
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