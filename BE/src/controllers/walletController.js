/**
 * FILE: walletController.js
 * MÔ TẢ: Controller xử lý các giao dịch Ví điện tử (Wallet) của Tài xế.
 * 
 * ĐIỂM KHÁC BIỆT NỔI BẬT SO VỚI LUỒNG THÊM XE (VEHICLE):
 * 1. Tích hợp Cổng thanh toán trực tuyến PayOS:
 *    - Nạp tiền vào ví bằng mã QR Ngân hàng (Ví dụ: VietQR).
 * 2. Tự động kiểm tra số dư và trừ tiền ví khi:
 *    - Thanh toán phí đỗ xe sau khi Check-out (`payParkingByWallet`).
 *    - Mua/Gia hạn gói hội viên (`paySubscriptionByWallet`).
 * 
 * Các chức năng trong file:
 * - createTopup: Tạo link/Mã QR nạp tiền qua cổng PayOS.
 * - checkTopupStatus: Kiểm tra kết quả giao dịch nạp tiền từ PayOS.
 * - getBalance: Xem số dư ví hiện tại của tài xế.
 * - getHistory: Xem lịch sử biến động số dư (Nạp tiền, Trừ tiền đỗ xe, Mua gói).
 * - payParkingByWallet: Thanh toán tiền đỗ xe trực tiếp bằng tiền trong ví.
 * - paySubscriptionByWallet: Mua gói hội viên trực tiếp bằng tiền trong ví.
 * 
 * @access Driver only
 */
/*
Hieu
*/

import { StatusCodes } from 'http-status-codes'; // Thư viện định nghĩa mã HTTP Status
import {
    createTopupService,
    checkTopupStatusService,
    getBalanceService,
    getWalletHistoryService,
    payParkingByWalletService,
    paySubscriptionByWalletService,
} from '../services/walletService.js'; // Service xử lý nghiệp vụ Ví & PayOS

// ─────────────────────────────────────────────────────────────
// 1. TẠO LINK NẠP TIỀN QUA PAYOS (QR VIETQR)
// Method: POST /api/driver/wallet/create-topup
// ─────────────────────────────────────────────────────────────
export async function createTopup(req, res, next) {
    try {
        const userId = req.user?.UserID;
        const amount = parseInt(req.body.amount);

        if (!amount || isNaN(amount))
            return res.status(400).json({ success: false, message: 'Số tiền không hợp lệ' });

        // Gọi Service tạo link thanh toán PayOS và mã OrderCode
        const data = await createTopupService(userId, amount);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Tạo link nạp tiền thành công',
            data,
        });
    } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
// 2. KIỂM TRA TRẠNG THÁI GIAO DỊCH NẠP TIỀN PAYOS
// Method: GET /api/driver/wallet/status/:orderCode
// ─────────────────────────────────────────────────────────────
export async function checkTopupStatus(req, res, next) {
    try {
        const orderCode = parseInt(req.params.orderCode);
        if (!orderCode || isNaN(orderCode))
            return res.status(400).json({ success: false, message: 'orderCode không hợp lệ' });

        // Gọi Service kiểm tra PayOS xem tiền đã vào chưa và cộng số dư ví trong SQL Server
        const data = await checkTopupStatusService(orderCode);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
// 3. LẤY SỐ DƯ VÍ HẠN HIỆN TẠI
// Method: GET /api/driver/wallet/balance
// ─────────────────────────────────────────────────────────────
export async function getBalance(req, res, next) {
    try {
        const userId = req.user?.UserID;
        
        // Gọi Service truy vấn bảng Wallets trong SQL lấy Balance
        const balance = await getBalanceService(userId);
        return res.status(StatusCodes.OK).json({ success: true, data: { balance } });
    } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
// 4. LẤY LỊCH SỬ GIAO DỊCH VÍ
// Method: GET /api/driver/wallet/history
// ─────────────────────────────────────────────────────────────
export async function getHistory(req, res, next) {
    try {
        const userId = req.user?.UserID;
        const limit = parseInt(req.query.limit) || 20;

        // Gọi Service lấy danh sách biến động số dư từ bảng WalletTransactions
        const data = await getWalletHistoryService(userId, limit);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
// 5. THANH TOÁN PHÍ ĐỖ XE BẰNG VÍ
// Method: POST /api/driver/wallet/pay-parking
// ─────────────────────────────────────────────────────────────
export async function payParkingByWallet(req, res, next) {
    try {
        const driverId = req.user?.UserID;
        const sessionId = parseInt(req.body.sessionId);

        if (!sessionId || isNaN(sessionId))
            return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' });

        // Gọi Service kiểm tra số dư ví ➔ Trừ tiền ví ➔ Cập nhật trạng thái Payment = 'Paid'
        const data = await payParkingByWalletService(sessionId, driverId);
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Thanh toán bằng ví thành công',
            data,
        });
    } catch (err) { next(err); }
}

// ─────────────────────────────────────────────────────────────
// 6. MUA GÓI HỘI VIÊN BẰNG VÍ
// Method: POST /api/driver/wallet/pay-subscription
// ─────────────────────────────────────────────────────────────
export async function paySubscriptionByWallet(req, res, next) {
    try {
        const userId = req.user?.UserID;
        const { planId, durationMonths, deductionAmount, extraDays } = req.body;

        if (!planId || !durationMonths)
            return res.status(400).json({ success: false, message: 'Thiếu thông tin gói' });

        // Gọi Service trừ tiền ví ➔ Tạo/Gia hạn gói trong UserSubscriptions
        const data = await paySubscriptionByWalletService(
            userId, 
            planId, 
            parseInt(durationMonths),
            parseFloat(deductionAmount) || 0,
            parseInt(extraDays) || 0
        );
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Mua gói bằng ví thành công',
            data,
        });
    } catch (err) {
        console.error('Lỗi thanh toán mua gói bằng ví:', err);
        next(err); 
    }
}
