/**
 * FILE: paymentRoutes.js
 * MÔ TẢ: Định nghĩa các đường dẫn API xử lý Cổng thanh toán PayOS và Lịch sử giao dịch.
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Webhook công khai (`/webhook/payment`): PayOS gọi trực tiếp để báo trạng thái thanh toán chuyển khoản QR thành công.
 * 2. Phân hệ Tài xế (`/driver/payment/*`): Tạo link thanh toán QR, hủy mã thanh toán, xem lịch sử giao dịch và kiểm tra trạng thái thanh toán real-time.
 * 3. Phân hệ Bảo vệ (`/staff/checkout`): Xác nhận thu tiền mặt trực tiếp tại cổng bãi đỗ xe.
 */

import express from 'express';
// Import Middlewares phân quyền
import { isAuthorized, isDriver, isStaffOrManager } from '../middlewares/authMiddleware.js';
// Import các handler từ PaymentController
import {
    createPayment,
    getPaymentStatus,
    cancelPayment,
    getActiveSessions,
    getPaymentHistory,
    staffCheckout,
    confirmSurcharge,
    handleWebhook,
    getSessionPaymentInfo
} from '../controllers/paymentController.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// 1. PUBLIC WEBHOOK (PayOS Server Callback)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: POST /webhook/payment
 * CONTROLLER BE: `BE/src/controllers/paymentController.js` -> `handleWebhook()`
 * FE FILE GỌI: Cổng thanh toán PayOS gọi tự động (Server-to-Server Callback)
 * DỮ LIỆU GỬI SANG: Body từ PayOS `{ code, desc, data: { orderCode, amount, reference } }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Webhook processed' }`
 */
router.post('/webhook/payment', handleWebhook);

// ─────────────────────────────────────────────────────────────
// 2. DRIVER ROUTES (Tài xế thanh toán đỗ xe)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /driver/active-sessions
 * CONTROLLER BE: `BE/src/controllers/paymentController.js` -> `getActiveSessions()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getActiveSessions(params)`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { SessionID, PlateNumber, ParkedDuration, Amount } ] }`
 */
router.get('/driver/active-sessions', isAuthorized, isDriver, getActiveSessions);

/**
 * ROUTE: POST /driver/payment/create
 * CONTROLLER BE: `BE/src/controllers/paymentController.js` -> `createPayment()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `createPayment(sessionId)`
 * DỮ LIỆU FE GỬI: Body `{ sessionId }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, checkoutUrl: 'https://pay.payos.vn/...', orderCode: 123456 }`
 */
router.post('/driver/payment/create', isAuthorized, isDriver, createPayment);

/**
 * ROUTE: GET /driver/payment/status/:orderCode
 * CONTROLLER BE: `BE/src/controllers/paymentController.js` -> `getPaymentStatus()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getPaymentStatus(orderCode)` (FE Polling liên tục)
 * DỮ LIỆU FE GỬI: URL Param `:orderCode`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, status: 'PAID' / 'PENDING' / 'CANCELLED' }`
 */
router.get('/driver/payment/status/:orderCode', isAuthorized, isDriver, getPaymentStatus);

/**
 * ROUTE: POST /driver/payment/cancel
 * CONTROLLER BE: `BE/src/controllers/paymentController.js` -> `cancelPayment()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `cancelPayment({ orderCode, reason })`
 * DỮ LIỆU FE GỬI: Body `{ orderCode, reason }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Hủy thanh toán thành công' }`
 */
router.post('/driver/payment/cancel', isAuthorized, isDriver, cancelPayment);

/**
 * ROUTE: GET /driver/payment/history
 * CONTROLLER BE: `BE/src/controllers/paymentController.js` -> `getPaymentHistory()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getPaymentHistory(params)`
 * DỮ LIỆU FE GỬI: Query params `?limit=20&offset=0`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { PaymentID, Amount, PaymentMethod, PaymentTime } ] }`
 */
router.get('/driver/payment/history', isAuthorized, isDriver, getPaymentHistory);

/**
 * ROUTE: GET /driver/payment/session-info/:sessionId
 * CONTROLLER BE: `BE/src/controllers/paymentController.js` -> `getSessionPaymentInfo()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getSessionPaymentInfo(sessionId)`
 * DỮ LIỆU FE GỬI: URL Param `:sessionId`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { SessionID, BaseFee, OvertimeFee, Discount, FinalAmount } }`
 */
router.get('/driver/payment/session-info/:sessionId', isAuthorized, isDriver, getSessionPaymentInfo);

// ─────────────────────────────────────────────────────────────
// 3. STAFF / MANAGER ROUTES (Xác nhận thanh toán tại cổng)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: POST /staff/checkout
 * CONTROLLER BE: `BE/src/controllers/paymentController.js` -> `staffCheckout()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `staffCheckout(payload)`
 * DỮ LIỆU FE GỬI: Body `{ sessionId, paymentMethod: 'Cash' / 'PayOS' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Check-out & Thanh toán tiền mặt thành công' }`
 */
router.post('/staff/checkout', isAuthorized, isStaffOrManager, staffCheckout);

/**
 * ROUTE: POST /staff/confirm-surcharge
 * CONTROLLER BE: `BE/src/controllers/paymentController.js` -> `confirmSurcharge()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `confirmSurcharge(payload)`
 * DỮ LIỆU FE GỬI: Body `{ sessionId, surchargeAmount, reason }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Xác nhận thu phụ phí thành công' }`
 */
router.post('/staff/confirm-surcharge', isAuthorized, isStaffOrManager, confirmSurcharge);

export default router;