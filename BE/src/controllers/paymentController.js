/**
 * FILE: paymentController.js
 * MÔ TẢ: Controller trung tâm xử lý Thanh toán phí đỗ xe và Phụ trội (Payment Processing) tích hợp Cổng thanh toán PayOS & Tiền mặt.
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Phía Tài xế (Driver): Tra cứu các phiên đang gửi active, tạo liên kết và mã VietQR thanh toán PayOS trả trước, hủy giao dịch, xem lịch sử thanh toán.
 * 2. Phía Bảo vệ (Staff): Xác nhận xe ra (Check-out) thu tiền mặt/chuyển khoản, xác nhận thu khoản tiền phụ trội (Surcharge) nếu gửi quá giờ, tạo mã VietQR hộ tài xế tại cổng ra.
 * 3. Kênh Webhook PayOS (Public Callback): Nhận thông báo kết quả chuyển khoản ngân hàng thời gian thực từ cổng PayOS để tự động kích hoạt trạng thái trả trước.
 */

// Import enum `StatusCodes` chuẩn quốc tế từ thư viện `http-status-codes` (200 OK, 400 Bad Request, 500 Server Error,...)
import { StatusCodes } from 'http-status-codes';
// Import các hàm xử lý logic từ tầng Service `paymentService.js`
// LIÊN KẾT FILE: `BE/src/services/paymentService.js` - Chứa logic gọi API PayOS SDK, gọi Stored Procedure `sp_CalcParkingFeeV2`, `sp_CreatePrepayment`, `sp_CheckOutWithSurcharge`, `sp_ConfirmSurcharge`.
import {
    createPaymentService,
    createPaymentServiceByStaff,
    getPaymentStatusService,
    handleWebhookService,
    cancelPaymentService,
    getActiveSessionsService,
    getPaymentHistoryService,
    staffCheckoutService,
    confirmSurchargeService,
    getSessionPaymentInfoService
} from '../services/paymentService.js';

/**
 * HÀM 1: getActiveSessions
 * TÁC DỤNG: Lấy danh sách các phiên đỗ xe đang hoạt động (Active) của tài xế đang đăng nhập.
 * 
 * @route GET /api/driver/active-sessions
 * @access Driver Only
 */
export async function getActiveSessions(req, res, next) {
    try {
        const driverId = req.user?.UserID; // Lấy UserID từ Token JWT
        const data = await getActiveSessionsService(driverId);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 2: createPayment
 * TÁC DỤNG: Tài xế tạo link và mã VietQR thanh toán trả trước qua PayOS cho phiên đỗ xe của mình.
 * 
 * @route POST /api/driver/payment/create
 * @access Driver Only
 */
export async function createPayment(req, res, next) {
    try {
        const driverId = req.user?.UserID;
        const sessionId = parseInt(req.body.sessionId); // Ép kiểu mã phiên thành Số nguyên (Integer)
        
        // VALIDATION: Kiểm tra sessionId có tồn tại và là số hợp lệ không
        if (!sessionId || isNaN(sessionId))
            return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' });

        // Gọi Service tạo thanh toán (tính tạm phí đỗ và gửi lệnh tới PayOS SDK)
        const data = await createPaymentService(sessionId, driverId);
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Tạo link thanh toán thành công',
            data, // Chứa QR code string, orderCode và link checkout URL
        });
    } catch (err) { next(err); }
}

/**
 * HÀM 3: getPaymentStatus
 * TÁC DỤNG: Kiểm tra trạng thái hóa đơn thanh toán theo mã đơn `orderCode` (Phục vụ Client gọi Polling).
 * 
 * @route GET /api/driver/payment/status/:orderCode
 * @access Driver Only
 */
export async function getPaymentStatus(req, res, next) {
    try {
        const orderCode = parseInt(req.params.orderCode); // Lấy mã đơn từ tham số đường dẫn URL
        if (!orderCode || isNaN(orderCode))
            return res.status(400).json({ success: false, message: 'orderCode không hợp lệ' });

        const data = await getPaymentStatusService(orderCode);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 4: cancelPayment
 * TÁC DỤNG: Hủy đơn thanh toán trả trước đang ở trạng thái Pending.
 * 
 * @route POST /api/driver/payment/cancel
 * @access Driver Only
 */
export async function cancelPayment(req, res, next) {
    try {
        const orderCode = parseInt(req.body.orderCode);
        if (!orderCode || isNaN(orderCode))
            return res.status(400).json({ success: false, message: 'orderCode không hợp lệ' });

        const data = await cancelPaymentService(orderCode, req.body.reason);
        return res.status(StatusCodes.OK).json({ success: true, message: 'Đã huỷ đơn', data });
    } catch (err) { next(err); }
}

/**
 * HÀM 5: getPaymentHistory
 * TÁC DỤNG: Lấy lịch sử giao dịch thanh toán của tài xế (gọi Stored Procedure `sp_GetPaymentHistory` có hỗ trợ phân trang).
 * 
 * @route GET /api/driver/payment/history?limit=20&offset=0
 * @access Driver Only
 */
export async function getPaymentHistory(req, res, next) {
    try {
        const driverId = req.user?.UserID;
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;
        const data = await getPaymentHistoryService(driverId, limit, offset);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 6: staffCheckout
 * TÁC DỤNG: Bảo vệ tại trạm kiểm soát ra xác nhận cho xe rời bãi (Check-out), gọi Stored Procedure `sp_CheckOutWithSurcharge` để tính tổng phí và số tiền phụ trội cần thu.
 * 
 * @route POST /api/staff/checkout
 * @access Staff / Manager
 */
export async function staffCheckout(req, res, next) {
    try {
        const sessionId = parseInt(req.body.sessionId);
        const paymentMethod = req.body.paymentMethod || 'Cash'; // Mặc định là Tiền mặt (Cash)
        if (!sessionId || isNaN(sessionId))
            return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' });

        // Gọi Service thực thi procedure checkout và đối soát trả trước/phụ trội
        const data = await staffCheckoutService(sessionId, paymentMethod);

        // Kiểm tra xem có tiền phụ trội (SurchargeAmount > 0) do xe gửi quá giờ không
        const hasSurcharge = data.SurchargeAmount > 0;
        return res.status(StatusCodes.OK).json({
            success: true,
            // Thông báo hiển thị cho bảo vệ biết cần thu thêm tiền phụ trội hay đã xong hẳn
            message: hasSurcharge
                ? `Xe ra thành công. Phụ trội cần thu thêm: ${data.SurchargeAmount.toLocaleString('vi-VN')} VNĐ`
                : 'Xe ra thành công. Thanh toán hoàn tất.',
            data,
        });
    } catch (err) { next(err); }
}

/**
 * HÀM 7: confirmSurcharge
 * TÁC DỤNG: Bảo vệ xác nhận ĐÃ THU TIỀN PHỤ TRỘI (Surcharge) từ tài xế tại cổng ra. Gọi Stored Procedure `sp_ConfirmSurcharge`.
 * 
 * @route POST /api/staff/confirm-surcharge
 * @access Staff / Manager
 */
export async function confirmSurcharge(req, res, next) {
    try {
        const sessionId = parseInt(req.body.sessionId);
        const paymentMethod = req.body.paymentMethod || 'Cash';
        if (!sessionId || isNaN(sessionId))
            return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' });

        const data = await confirmSurchargeService(sessionId, paymentMethod);
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Đã xác nhận thu tiền phụ trội. Thanh toán hoàn tất.',
            data,
        });
    } catch (err) { next(err); }
}

/**
 * HÀM 8: handleWebhook (WEBHOOK PAYOS)
 * TÁC DỤNG: Nhận thông báo tự động (Callback/Webhook) từ hệ thống PayOS gửi sang khi người dùng đã chuyển khoản ngân hàng thành công.
 * LƯU Ý KỸ THUẬT:
 * - Endpoint này là PUBLIC (không đi qua JWT Auth Middleware) để phía PayOS Server có thể tự động gửi dữ liệu POST.
 * - Luôn phản hồi HTTP Status Code 200 (OK) để hệ thống PayOS biết server đã tiếp nhận Webhook, tránh việc PayOS liên tục gửi lại (retry) gây quá tải.
 * 
 * @route POST /api/webhook/payment
 * @access Public (Cổng PayOS Callback)
 */
export async function handleWebhook(req, res, next) {
    try {
        console.log('📦 [WEBHOOK] PayOS Payload nhận được:', JSON.stringify(req.body));
        // Gọi Service xác minh chữ ký bảo mật (Signature Check) và gọi Stored Procedure `sp_MarkPaymentPrepaid`
        const result = await handleWebhookService(req.body);
        // Bắt buộc trả về HTTP 200 ngay lập tức cho PayOS
        return res.status(StatusCodes.OK).json({ success: true, ...result });
    } catch (err) {
        console.error('❌ [WEBHOOK] Lỗi xử lý Webhook:', err.message);
        // Vẫn phản hồi HTTP 200 để PayOS ngắt việc retry gửi lại gói tin cũ
        return res.status(StatusCodes.OK).json({ success: false, message: err.message });
    }
}

/**
 * HÀM 9: getSessionPaymentInfo
 * TÁC DỤNG: Lấy chi tiết thông tin thanh toán (Số tiền đã trả trước, số tiền phụ trội, thời lượng đỗ xe) của một phiên gửi xe.
 * 
 * @route GET /api/driver/payment/session/:sessionId
 * @access Driver Only
 */
export const getSessionPaymentInfo = async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId, 10);
        const driverId = req.user?.UserID;

        if (!sessionId || !driverId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Thiếu thông tin session'
            });
        }

        const data = await getSessionPaymentInfoService(sessionId, driverId);

        return res.status(StatusCodes.OK).json({
            success: true,
            data
        });
    } catch (e) {
        return res.status(e.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: e.message
        });
    }
};

/**
 * HÀM 10: createPaymentForStaff
 * TÁC DỤNG: Bảo vệ tạo mã VietQR và link thanh toán tại chỗ cho tài xế quét mã bằng máy POS/màn hình cổng ra.
 * 
 * @route POST /api/staff/create-payment
 * @access Staff / Manager
 */
export async function createPaymentForStaff(req, res, next) {
    try {
        const sessionId = parseInt(req.body.sessionId);
        if (!sessionId || isNaN(sessionId))
            return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' });

        const data = await createPaymentServiceByStaff(sessionId);
        return res.status(200).json({ success: true, message: 'Tạo link thanh toán thành công', data });
    } catch (err) { next(err); }
}