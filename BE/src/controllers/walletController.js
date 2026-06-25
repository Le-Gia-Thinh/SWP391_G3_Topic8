/**
 * FILE: walletController.js
 * MÔ TẢ: Controller xử lý ví điện tử (Wallet) cho Driver.
 * 
 * Chức năng:
 * - createTopup: Tạo link nạp tiền qua PayOS
 * - checkTopupStatus: Kiểm tra trạng thái nạp tiền
 * - getBalance: Lấy số dư ví hiện tại
 * - getHistory: Lấy lịch sử giao dịch ví
 * - payParkingByWallet: Thanh toán phí đỗ xe bằng ví
 * - paySubscriptionByWallet: Mua gói hội viên bằng ví
 * 
 * @access Driver only
 */

import { StatusCodes } from 'http-status-codes'; // Mã HTTP status chuẩn
import {
    createTopupService,
    checkTopupStatusService,
    getBalanceService,
    getWalletHistoryService,
    payParkingByWalletService,
    paySubscriptionByWalletService,
} from '../services/walletService.js'; // Service xử lý logic ví

/** @route POST /api/driver/wallet/create-topup - Tạo link nạp tiền vào ví */
export async function createTopup(req, res, next) {
    try {
        const userId = req.user?.UserID;
        const amount = parseInt(req.body.amount);
        if (!amount || isNaN(amount))
            return res.status(400).json({ success: false, message: 'Số tiền không hợp lệ' });

        const data = await createTopupService(userId, amount);
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Tạo link nạp tiền thành công',
            data,
        });
    } catch (err) { next(err); }
}

// GET /api/driver/wallet/status/:orderCode
export async function checkTopupStatus(req, res, next) {
    try {
        const orderCode = parseInt(req.params.orderCode);
        if (!orderCode || isNaN(orderCode))
            return res.status(400).json({ success: false, message: 'orderCode không hợp lệ' });

        const data = await checkTopupStatusService(orderCode);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

// GET /api/driver/wallet/balance
export async function getBalance(req, res, next) {
    try {
        const userId = req.user?.UserID;
        const balance = await getBalanceService(userId);
        return res.status(StatusCodes.OK).json({ success: true, data: { balance } });
    } catch (err) { next(err); }
}

// GET /api/driver/wallet/history
export async function getHistory(req, res, next) {
    try {
        const userId = req.user?.UserID;
        const limit = parseInt(req.query.limit) || 20;
        const data = await getWalletHistoryService(userId, limit);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

// POST /api/driver/wallet/pay-parking
export async function payParkingByWallet(req, res, next) {
    try {
        const driverId = req.user?.UserID;
        const sessionId = parseInt(req.body.sessionId);
        if (!sessionId || isNaN(sessionId))
            return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' });

        const data = await payParkingByWalletService(sessionId, driverId);
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Thanh toán bằng ví thành công',
            data,
        });
    } catch (err) { next(err); }
}

// POST /api/driver/wallet/pay-subscription
export async function paySubscriptionByWallet(req, res, next) {
    try {
        const userId = req.user?.UserID;
        const { planId, durationMonths } = req.body;
        if (!planId || !durationMonths)
            return res.status(400).json({ success: false, message: 'Thiếu thông tin gói' });

        const data = await paySubscriptionByWalletService(userId, planId, parseInt(durationMonths));
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Mua gói bằng ví thành công',
            data,
        });
    } catch (err) { next(err); }
}
