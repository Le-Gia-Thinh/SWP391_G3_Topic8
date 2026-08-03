/**
 * FILE: walletController.js
 * MÔ TẢ: Controller quản lý các thao tác Giao dịch Ví điện tử (Digital Wallet) của Tài xế.
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Nạp tiền vào Ví: Gọi cổng PayOS sinh mã VietQR để chuyển khoản ngân hàng -> Sau khi nhận thông báo thì chạy Stored Procedure `sp_TopUpWallet` để cộng tiền nguyên tố.
 * 2. Rút/Trừ tiền Ví: Gọi Stored Procedure `sp_PayByWallet` để kiểm tra số dư và trừ tiền nguyên tố khi tài xế:
 *    - Thanh toán phí gửi xe đỗ theo lượt/trả trước (`payParkingByWallet`).
 *    - Mua/Gia hạn gói vé tháng hội viên (`paySubscriptionByWallet`).
 * 3. Xem số dư và biến động nhật ký Ví trong bảng `WalletTransactions`.
 */

// Import enum StatusCodes từ thư viện 'http-status-codes' (200 OK, 400 Bad Request,...)
import { StatusCodes } from 'http-status-codes';
// Import các hàm xử lý nghiệp vụ ví điện tử từ 'BE/src/services/walletService.js'
// LIÊN KẾT FILE: `BE/src/services/walletService.js` - Chứa logic gọi Stored Procedure `sp_TopUpWallet` và `sp_PayByWallet` trong SQL Server.
import {
    createTopupService,
    checkTopupStatusService,
    getBalanceService,
    getWalletHistoryService,
    payParkingByWalletService,
    paySubscriptionByWalletService,
} from '../services/walletService.js';

/**
 * HÀM 1: createTopup
 * TÁC DỤNG: Khởi tạo yêu cầu nạp tiền vào ví. Tạo mã đơn PayOS và sinh mã QR chuyển khoản VietQR.
 * 
 * @route POST /api/driver/wallet/create-topup
 * @access Driver Only
 */
export async function createTopup(req, res, next) {
    try {
        const userId = req.user?.UserID; // Lấy UserID tài xế từ Token JWT
        const amount = parseInt(req.body.amount); // Số tiền nạp (ví dụ 100000 VNĐ)

        // VALIDATION: Số tiền nạp phải lớn hơn 0 và là số hợp lệ
        if (!amount || isNaN(amount) || amount <= 0)
            return res.status(400).json({ success: false, message: 'Số tiền nạp không hợp lệ' });

        // Gọi Service tạo liên kết thanh toán PayOS và OrderCode
        const data = await createTopupService(userId, amount);

        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Tạo link nạp tiền thành công',
            data, // Trả về thông tin link nạp, QR code và mã orderCode
        });
    } catch (err) { next(err); }
}

/**
 * HÀM 2: checkTopupStatus
 * TÁC DỤNG: Kiểm tra kết quả giao dịch nạp tiền từ cổng PayOS theo mã `orderCode`. Nếu PayOS xác nhận đã chuyển tiền thành công, hệ thống tự động gọi Stored Procedure `sp_TopUpWallet` để cộng tiền vào tài khoản tài xế.
 * 
 * @route GET /api/driver/wallet/status/:orderCode
 * @access Driver Only
 */
export async function checkTopupStatus(req, res, next) {
    try {
        const orderCode = parseInt(req.params.orderCode);
        if (!orderCode || isNaN(orderCode))
            return res.status(400).json({ success: false, message: 'orderCode không hợp lệ' });

        // Gọi Service kiểm tra PayOS và cộng tiền vào DB SQL Server
        const data = await checkTopupStatusService(orderCode);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 3: getBalance
 * TÁC DỤNG: Lấy số dư tài khoản khả dụng hiện tại của tài xế (truy vấn cột AccountBalance trong bảng Users).
 * 
 * @route GET /api/driver/wallet/balance
 * @access Driver Only
 */
export async function getBalance(req, res, next) {
    try {
        const userId = req.user?.UserID;
        
        // Gọi Service lấy số dư hiện tại
        const balance = await getBalanceService(userId);
        return res.status(StatusCodes.OK).json({ success: true, data: { balance } });
    } catch (err) { next(err); }
}

/**
 * HÀM 4: getHistory
 * TÁC DỤNG: Lấy lịch sử tất cả các biến động số dư ví (Nạp tiền TOPUP, Trừ tiền đỗ xe PARKING_FEE, Mua gói SUBSCRIPTION).
 * 
 * @route GET /api/driver/wallet/history?limit=20
 * @access Driver Only
 */
export async function getHistory(req, res, next) {
    try {
        const userId = req.user?.UserID;
        const limit = parseInt(req.query.limit) || 20;

        // Gọi Service lấy danh sách giao dịch từ bảng WalletTransactions
        const data = await getWalletHistoryService(userId, limit);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 5: payParkingByWallet
 * TÁC DỤNG: Thanh toán phí đỗ xe trực tiếp bằng số dư tiền trong ví điện tử của tài xế.
 * XỬ LÝ NGUYÊN TỐ: Gọi Stored Procedure `sp_PayByWallet` để kiểm tra số dư -> nếu không đủ ném lỗi 50001 -> nếu đủ tiền thì tự động trừ số dư và chuyển hóa đơn sang 'Completed'.
 * 
 * @route POST /api/driver/wallet/pay-parking
 * @access Driver Only
 */
export async function payParkingByWallet(req, res, next) {
    try {
        const driverId = req.user?.UserID;
        const sessionId = parseInt(req.body.sessionId);

        if (!sessionId || isNaN(sessionId))
            return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' });

        // Gọi Service thực thi trừ tiền ví và hoàn tất thanh toán đỗ xe
        const data = await payParkingByWalletService(sessionId, driverId);
        return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Thanh toán bằng ví thành công',
            data,
        });
    } catch (err) { next(err); }
}

/**
 * HÀM 6: paySubscriptionByWallet
 * TÁC DỤNG: Mua hoặc gia hạn gói vé tháng đỗ xe trực tiếp bằng tiền trong ví điện tử.
 * 
 * @route POST /api/driver/wallet/pay-subscription
 * @access Driver Only
 */
export async function paySubscriptionByWallet(req, res, next) {
    try {
        const userId = req.user?.UserID;
        const { planId, durationMonths, deductionAmount, extraDays } = req.body;

        // VALIDATION: Kiểm tra xem tài xế đã truyền mã gói và thời hạn đăng ký chưa
        if (!planId || !durationMonths)
            return res.status(400).json({ success: false, message: 'Thiếu thông tin gói' });

        // Gọi Service kiểm tra số dư ví ➔ Trừ tiền ví ➔ Tạo/Gia hạn gói trong UserSubscriptions
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

