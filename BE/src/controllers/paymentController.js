/**
 * FILE: paymentController.js
 * MÔ TẢ: Controller xử lý thanh toán (Payment) qua PayOS và tiền mặt.
 * 
 * Chức năng:
 * - Driver: Lấy phiên đang hoạt động, tạo link thanh toán PayOS, kiểm tra trạng thái thanh toán, hủy thanh toán, xem lịch sử.
 * - Staff: Xác nhận checkout bằng tiền mặt/chuyển khoản, xác nhận thu tiền phụ trội (surcharge), tạo link thanh toán PayOS cho tài xế.
 * - Webhook: Nhận thông báo (callback) từ PayOS khi thanh toán thành công/thất bại.
 */
/*
Thinh
*/

import { StatusCodes } from 'http-status-codes'; // Mã HTTP status chuẩn
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
} from '../services/paymentService.js'; // Các service xử lý logic thanh toán

// ── GET /api/driver/active-sessions ─────────────────────────────
export async function getActiveSessions(req, res, next) {
    try {
        const driverId = req.user?.UserID
        const data = await getActiveSessionsService(driverId)
        return res.status(StatusCodes.OK).json({ success: true, data })
    } catch (err) { next(err) }
}

// ── POST /api/driver/payment/create ─────────────────────────────
export async function createPayment(req, res, next) {
    try {
        const driverId = req.user?.UserID
        const sessionId = parseInt(req.body.sessionId)
        if (!sessionId || isNaN(sessionId))
            return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' })

        const data = await createPaymentService(sessionId, driverId)
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Tạo link thanh toán thành công',
            data,
        })
    } catch (err) { next(err) }
}

// ── GET /api/driver/payment/status/:orderCode ────────────────────
export async function getPaymentStatus(req, res, next) {
    try {
        const orderCode = parseInt(req.params.orderCode)
        if (!orderCode || isNaN(orderCode))
            return res.status(400).json({ success: false, message: 'orderCode không hợp lệ' })

        const data = await getPaymentStatusService(orderCode)
        return res.status(StatusCodes.OK).json({ success: true, data })
    } catch (err) { next(err) }
}

// ── POST /api/driver/payment/cancel ─────────────────────────────
export async function cancelPayment(req, res, next) {
    try {
        const orderCode = parseInt(req.body.orderCode)
        if (!orderCode || isNaN(orderCode))
            return res.status(400).json({ success: false, message: 'orderCode không hợp lệ' })

        const data = await cancelPaymentService(orderCode, req.body.reason)
        return res.status(StatusCodes.OK).json({ success: true, message: 'Đã huỷ đơn', data })
    } catch (err) { next(err) }
}

// ── GET /api/driver/payment/history ─────────────────────────────
export async function getPaymentHistory(req, res, next) {
    try {
        const driverId = req.user?.UserID
        const limit = parseInt(req.query.limit) || 20
        const offset = parseInt(req.query.offset) || 0
        const data = await getPaymentHistoryService(driverId, limit, offset)
        return res.status(StatusCodes.OK).json({ success: true, data })
    } catch (err) { next(err) }
}

// ── POST /api/staff/checkout ─────────────────────────────────────
// Staff xác nhận xe ra, tính phí thực tế
export async function staffCheckout(req, res, next) {
    try {
        const sessionId = parseInt(req.body.sessionId)
        const paymentMethod = req.body.paymentMethod || 'Cash'
        if (!sessionId || isNaN(sessionId))
            return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' })

        const data = await staffCheckoutService(sessionId, paymentMethod)

        const hasSurcharge = data.SurchargeAmount > 0
        return res.status(StatusCodes.OK).json({
            success: true,
            message: hasSurcharge
                ? `Xe ra thành công. Phụ trội cần thu thêm: ${data.SurchargeAmount.toLocaleString('vi-VN')} VNĐ`
                : 'Xe ra thành công. Thanh toán hoàn tất.',
            data,
        })
    } catch (err) { next(err) }
}

// ── POST /api/staff/confirm-surcharge ───────────────────────────
// Staff xác nhận đã thu tiền phụ trội
export async function confirmSurcharge(req, res, next) {
    try {
        const sessionId = parseInt(req.body.sessionId)
        const paymentMethod = req.body.paymentMethod || 'Cash'
        if (!sessionId || isNaN(sessionId))
            return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' })

        const data = await confirmSurchargeService(sessionId, paymentMethod)
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Đã xác nhận thu tiền phụ trội. Thanh toán hoàn tất.',
            data,
        })
    } catch (err) { next(err) }
}

// ── POST /api/webhook/payment (PUBLIC — không cần auth) ──────────
export async function handleWebhook(req, res, next) {
    try {
        console.log('📦 [WEBHOOK] PayOS:', JSON.stringify(req.body))
        const result = await handleWebhookService(req.body)
        // PayOS cần nhận 200 ngay
        return res.status(StatusCodes.OK).json({ success: true, ...result })
    } catch (err) {
        console.error('❌ [WEBHOOK] Error:', err.message)
        // Vẫn 200 để PayOS không retry liên tục
        return res.status(StatusCodes.OK).json({ success: false, message: err.message })
    }
}
export const getSessionPaymentInfo = async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId, 10)
        const driverId = req.user?.UserID

        if (!sessionId || !driverId) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Thiếu thông tin session'
            })
        }

        const data = await getSessionPaymentInfoService(sessionId, driverId)

        return res.status(StatusCodes.OK).json({
            success: true,
            data
        })
    } catch (e) {
        return res.status(e.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: e.message
        })
    }
}
export async function createPaymentForStaff(req, res, next) {
    try {
        const sessionId = parseInt(req.body.sessionId)
        if (!sessionId || isNaN(sessionId))
            return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' })

        const data = await createPaymentServiceByStaff(sessionId)
        return res.status(200).json({ success: true, message: 'Tạo link thanh toán thành công', data })
    } catch (err) { next(err) }
}