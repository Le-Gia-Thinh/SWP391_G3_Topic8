/**
 * FILE: paymentRoutes.js
 * MÔ TẢ: Định nghĩa các đường dẫn API liên quan đến thanh toán.
 * Bao gồm: Webhook PayOS, thanh toán qua cổng điện tử, và xác nhận thu tiền mặt.
 */

// ── Thêm import và sử dụng trong src/routes/index.js ─────────────
// import paymentRoutes from './paymentRoutes.js'
// router.use('/', paymentRoutes)

import express from 'express'
import { isAuthorized, isDriver, isStaffOrManager } from '../middlewares/authMiddleware.js'
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
} from '../controllers/paymentController.js'

const router = express.Router()

// ── PUBLIC: PayOS webhook (không cần auth) ───────────────────────
router.post('/webhook/payment', handleWebhook)

// ── DRIVER routes ────────────────────────────────────────────────
router.get('/driver/active-sessions', isAuthorized, isDriver, getActiveSessions)
router.post('/driver/payment/create', isAuthorized, isDriver, createPayment)
router.get('/driver/payment/status/:orderCode', isAuthorized, isDriver, getPaymentStatus)
router.post('/driver/payment/cancel', isAuthorized, isDriver, cancelPayment)
router.get('/driver/payment/history', isAuthorized, isDriver, getPaymentHistory)
router.get('/driver/payment/session-info/:sessionId', isAuthorized, isDriver, getSessionPaymentInfo)
// ── STAFF / MANAGER routes ───────────────────────────────────────
router.post('/staff/checkout', isAuthorized, isStaffOrManager, staffCheckout)
router.post('/staff/confirm-surcharge', isAuthorized, isStaffOrManager, confirmSurcharge)

export default router


// ================================================================
// THÊM VÀO App.jsx trong <Route path="/driver" element={<DriverLayout/>}>
// ================================================================


// ================================================================
// ĐĂNG KÝ WEBHOOK URL TRÊN PAYOS DASHBOARD
// ================================================================
// URL: https://your-domain.com/api/webhook/payment
// Để test local: dùng ngrok
//   npx ngrok http 5000
//   → https://xxxx.ngrok.io/api/webhook/payment