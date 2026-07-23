/**
 * FILE: walletService.js
 * MÔ TẢ: Service xử lý nghiệp vụ Ví điện tử (Wallet) của người dùng.
 * Chức năng: Nạp tiền (Topup) qua PayOS, xử lý Webhook Topup, thanh toán phiên gửi xe
 * và mua gói hội viên bằng số dư ví.
 */
/*
Hieu
*/

import crypto from 'crypto'; // Thư viện mã hóa mật mã chuẩn của Node.js (tạo chữ ký HMAC-SHA256)
import axios from 'axios'; // Thư viện gửi HTTP Request tới cổng thanh toán PayOS
import { getPool, sql } from '../config/db.js'; // Cấu hình kết nối SQL Server

// Lấy các thông số cấu hình tích hợp PayOS từ biến môi trường (.env)
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID; // Client ID do PayOS cấp
const PAYOS_API_KEY = process.env.PAYOS_API_KEY; // API Key bảo mật do PayOS cấp
const PAYOS_CHECKSUM = process.env.PAYOS_CHECKSUM_KEY; // Mã Checksum dùng để tạo chữ ký an toàn
const PAYOS_BASE_URL = 'https://api-merchant.payos.vn'; // Đường dẫn Server chính thức của PayOS

/**
 * HÀM HELPER: Tạo chữ ký điện tử (Signature) gửi sang PayOS để xác thực dữ liệu không bị can thiệp
 */
function makeSignature({ amount, cancelUrl, description, orderCode, returnUrl }) {
    // Ghép các tham số giao dịch thành một chuỗi văn bản theo quy định bắt buộc của PayOS
    const raw = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    // Dùng thuật toán HMAC-SHA256 mã hóa chuỗi raw với khóa bí mật PAYOS_CHECKSUM và xuất ra định dạng Hex
    return crypto.createHmac('sha256', PAYOS_CHECKSUM).update(raw).digest('hex');
}

// Bộ nhớ đệm tạm thời (In-memory Map) lưu trữ các đơn nạp tiền đang chờ khách quét QR
const pendingTopups = new Map();
// Đặt lịch tự động dọn dẹp mỗi 60 giây (60.000 ms)
setInterval(() => {
    const now = Date.now(); // Lấy mốc thời gian hiện tại
    // Duyệt qua từng đơn nạp tiền trong Map, nếu đơn nào quá hạn (expiredAt < now) thì xóa khỏi bộ nhớ
    for (const [code, o] of pendingTopups.entries())
        if (o.expiredAt < now) pendingTopups.delete(code);
}, 60_000);

/**
 * HÀM HELPER: Sinh mã đơn nạp tiền duy nhất (OrderCode) không bị trùng lặp
 */
function makeTopupOrderCode(userId) {
    // Lấy 6 số cuối của mốc thời gian milisecond hiện tại
    const suffix = Date.now() % 1_000_000;
    // Ghép số 9 + UserID + 6 số suffix và ép kiểu thành Số nguyên BigInt (VD: 912345678)
    return parseInt(`9${userId}${String(suffix).padStart(6, '0')}`, 10);
}

// ── 1. TẠO LINK VÀ MÃ QR NẠP TIỀN QUA PAYOS ──────────────────────
export async function createTopupService(userId, amount) {
    // Kiểm tra số tiền nạp: Nếu không nhập hoặc nhỏ hơn 10.000 VNĐ -> Ném lỗi HTTP 400
    if (!amount || amount < 10000) {
        throw Object.assign(new Error('Số tiền nạp tối thiểu là 10,000 VNĐ'), { statusCode: 400 });
    }

    // Lấy kết nối Database từ Pool
    const pool = await getPool();
    // Query lấy tên và email của người dùng từ bảng Users
    const userRes = await pool.request()
        .input('UserID', sql.Int, userId) // Truyền tham số UserID dạng số
        .query('SELECT FullName, Email FROM Users WHERE UserID = @UserID');
    // Lấy bản ghi người dùng đầu tiên
    const user = userRes.recordset[0];
    // Nếu người dùng không tồn tại -> Ném lỗi HTTP 404
    if (!user) throw Object.assign(new Error('User không tồn tại'), { statusCode: 404 });

    // Gọi helper sinh mã giao dịch duy nhất cho đơn nạp này
    const orderCode = makeTopupOrderCode(userId);
    // Tạo nội dung chuyển khoản (VD: TOPUP12T3456)
    const description = `TOPUP${userId}T${Date.now() % 10000}`;

    // Lấy tên miền Frontend (mặc định http://localhost:5173)
    const FE = process.env.FE_ORIGIN || 'http://localhost:5173';
    // Đường dẫn chuyển hướng khi thanh toán thành công
    const returnUrl = `${FE}/driver/topup-payment?status=success`;
    // Đường dẫn chuyển hướng khi bấm hủy thanh toán
    const cancelUrl = `${FE}/driver/topup-payment?status=cancel`;
    // Thời hạn hết hiệu lực của mã QR (15 phút = 15 * 60 giây)
    const expiredAt = Math.floor((Date.now() + 15 * 60 * 1000) / 1000);

    // Đóng gói Payload dữ liệu đúng chuẩn quy định API của PayOS
    const payload = {
        orderCode, // Mã đơn hàng
        amount, // Số tiền nạp
        description, // Nội dung chuyển khoản
        buyerName: user.FullName || 'Driver', // Tên người mua
        buyerEmail: user.Email || undefined, // Email người mua
        items: [{ name: `Nap tien vi - ${amount} VND`, quantity: 1, price: amount }], // Danh mục sản phẩm
        cancelUrl, // URL hủy
        returnUrl, // URL thành công
        expiredAt, // Giờ hết hạn
        signature: makeSignature({ amount, cancelUrl, description, orderCode, returnUrl }), // Chữ ký HMAC-SHA256
    };

    let pd; // Biến chứa dữ liệu phản hồi từ PayOS
    try {
        // Bắn request HTTP POST tới API của PayOS để yêu cầu khởi tạo VietQR
        const res = await axios.post(`${PAYOS_BASE_URL}/v2/payment-requests`, payload, {
            headers: {
                'x-client-id': PAYOS_CLIENT_ID, // Gửi Client ID
                'x-api-key': PAYOS_API_KEY, // Gửi API Key
                'Content-Type': 'application/json',
            },
            timeout: 15_000, // Timeout sau 15 giây
        });
        // Nếu PayOS trả mã phản hồi khác '00' -> Báo lỗi
        if (res.data.code !== '00') {
            throw Object.assign(new Error(`PayOS lỗi: ${res.data.desc || res.data.code}`), { statusCode: 400 });
        }
        // Gán dữ liệu thành công từ PayOS vào biến pd
        pd = res.data.data;
    } catch (e) {
        if (e.statusCode) throw e;
        const msg = e.response?.data?.desc || e.message;
        throw Object.assign(new Error(`Lỗi kết nối PayOS: ${msg}`), { statusCode: 502 });
    }

    // Đổi mốc giờ hết hạn sang milisecond
    const expiredMs = expiredAt * 1000;
    // Lưu thông tin đơn nạp tiền này vào bộ nhớ tạm pendingTopups
    pendingTopups.set(orderCode, {
        userId, amount, description,
        status: 'PENDING', // Trạng thái ban đầu: Đang chờ
        expiredAt: expiredMs,
    });

    // Trả về cho Controller (và Frontend) mã orderCode, ảnh QR Code, link thanh toán
    return {
        orderCode,
        amount,
        description,
        qrCode: pd.qrCode, // Chuỗi Base64 / URL của mã QR VietQR
        checkoutUrl: pd.checkoutUrl, // Link trang thanh toán PayOS
        accountNumber: pd.accountNumber, // Số tài khoản ngân hàng nhận tiền
        accountName: pd.accountName, // Tên chủ tài khoản nhận tiền
        bankBin: pd.bin, // Mã BIN ngân hàng
        currency: 'VND',
        expiredAt: new Date(expiredMs).toISOString(),
        status: 'PENDING',
    };
}

// ── 2. POLLING CHECK TRẠNG THÁI NẠP TIỀN QUA PAYOS ─────────────────
export async function checkTopupStatusService(orderCode) {
    let payosStatus = 'PENDING'; // Khởi tạo trạng thái mặc định là PENDING
    try {
        // Gọi API GET tới PayOS hỏi thông tin chi tiết của đơn nạp orderCode này
        const res = await axios.get(`${PAYOS_BASE_URL}/v2/payment-requests/${orderCode}`, {
            headers: { 'x-client-id': PAYOS_CLIENT_ID, 'x-api-key': PAYOS_API_KEY },
            timeout: 8_000, // Timeout sau 8 giây
        });
        // Lấy trạng thái từ PayOS trả về (PAID, PENDING, CANCELLED, EXPIRED)
        payosStatus = res.data?.data?.status || 'PENDING';
    } catch { /* Nếu mạng lag -> dùng thông tin đang lưu tạm */ }

    // NẾU PAYOS XÁC NHẬN TIỀN ĐÃ VÀO TÀI KHOẢN (PAID):
    if (payosStatus === 'PAID') {
        // Lấy đơn nạp tương ứng từ bộ nhớ đệm
        const order = pendingTopups.get(Number(orderCode));
        // Đảm bảo đơn này chưa từng được cộng tiền trước đó (tránh cộng 2 lần)
        if (order && order.status !== 'PAID') {
            // Đánh dấu trạng thái đơn là đã cộng tiền thành công
            order.status = 'PAID';
            // Lấy kết nối Database
            const pool = await getPool();
            // Thực thi Stored Procedure sp_TopUpWallet để cộng tiền vào SQL Server
            await pool.request()
                .input('UserID', sql.Int, order.userId) // Truyền ID tài xế
                .input('Amount', sql.Decimal(10, 2), order.amount) // Truyền số tiền cộng
                .input('ReferenceID', sql.NVarChar(100), String(orderCode)) // Mã đơn
                .input('Description', sql.NVarChar(200), `Nạp tiền ví - ${order.amount.toLocaleString('vi-VN')} VNĐ`) // Mô tả
                .execute('sp_TopUpWallet'); // Chạy thủ tục trong DB
            // Xóa đơn nạp khỏi bộ nhớ đệm tạm thời
            pendingTopups.delete(Number(orderCode));
        }
        // Trả về trạng thái PAID cho Frontend
        return { status: 'PAID', orderCode };
    }

    // NẾU PAYOS BÁO HỦY HOẶC HẾT HẠN:
    if (payosStatus === 'CANCELLED' || payosStatus === 'EXPIRED') {
        // Xóa đơn nạp khỏi bộ nhớ đệm
        pendingTopups.delete(Number(orderCode));
        // Trả về trạng thái hủy/hết hạn
        return { status: payosStatus, orderCode };
    }

    // Trả về PENDING nếu khách vẫn chưa quét tiền
    return { status: 'PENDING', orderCode };
}

// ── 3. XỬ LÝ WEBHOOK TỰ ĐỘNG KHI PAYOS ĐẨY SỰ CỐ VỀ SERVER ──────────
export async function handleTopupWebhook(orderCode, amount) {
    // Tìm đơn nạp từ bộ nhớ đệm
    const order = pendingTopups.get(Number(orderCode));
    // Nếu đơn chưa được xử lý cộng tiền
    if (order && order.status !== 'PAID') {
        order.status = 'PAID'; // Đánh dấu đã trả tiền
        const pool = await getPool(); // Lấy pool kết nối DB
        // Kích hoạt Stored Procedure cộng tiền ví trong SQL
        await pool.request()
            .input('UserID', sql.Int, order.userId)
            .input('Amount', sql.Decimal(10, 2), order.amount)
            .input('ReferenceID', sql.NVarChar(100), String(orderCode))
            .input('Description', sql.NVarChar(200), `Nạp tiền ví - ${order.amount.toLocaleString('vi-VN')} VNĐ`)
            .execute('sp_TopUpWallet');
        // Xóa đơn khỏi bộ nhớ tạm
        pendingTopups.delete(Number(orderCode));
    }
}

// ── 4. LẤY SỐ DƯ VÍ HẠN HIỆN TẠI ─────────────────────────────────
export async function getBalanceService(userId) {
    // Lấy kết nối Database từ pool
    const pool = await getPool();
    // Query lấy cột AccountBalance từ bảng Users
    const res = await pool.request()
        .input('UserID', sql.Int, userId) // Truyền ID tài xế
        .query('SELECT ISNULL(AccountBalance, 0) AS balance FROM Users WHERE UserID = @UserID'); // Dùng ISNULL tránh bị null
    // Trả về con số số dư balance (mặc định trả về 0 nếu chưa có)
    return res.recordset[0]?.balance || 0;
}

// ── 5. LẤY LỊCH SỬ GIAO DỊCH VÍ TIỀN ──────────────────────────────
export async function getWalletHistoryService(userId, limit = 20) {
    // Lấy kết nối Database từ pool
    const pool = await getPool();
    // Query lấy TOP N giao dịch mới nhất từ bảng WalletTransactions
    const res = await pool.request()
        .input('UserID', sql.Int, userId) // Truyền ID tài xế
        .input('Limit', sql.Int, limit) // Truyền số lượng dòng muốn lấy (mặc định 20)
        .query(`
            SELECT TOP (@Limit) TransactionID, TransactionType as Type, Amount, ReferenceID, Description, CreatedAt, Status
            FROM WalletTransactions
            WHERE UserID = @UserID
            ORDER BY CreatedAt DESC
        `);
    // Trả về mảng danh sách lịch sử biến động số dư
    return res.recordset;
}

// ── 6. THANH TOÁN PHÍ ĐỖ XE BẰNG SỐ DƯ VÍ ─────────────────────────
export async function payParkingByWalletService(sessionId, driverId) {
    // Lấy kết nối Database từ pool
    const pool = await getPool();

    // Query kiểm tra thông tin phiên đỗ xe và trạng thái hóa đơn thanh toán
    const { recordset } = await pool.request()
        .input('SessionID', sql.Int, sessionId) // Truyền ID phiên đỗ
        .input('DriverID', sql.Int, driverId) // Truyền ID tài xế
        .query(`
            SELECT ps.SessionID, ps.VehicleTypeID, ps.EntryTime, ps.SessionStatus,
                   p.PaymentStatus, p.Amount
            FROM ParkingSessions s
            JOIN Payments p ON ps.SessionID = p.SessionID
            WHERE ps.SessionID = @SessionID AND ps.DriverID = @DriverID AND ps.SessionStatus = 'Active'
        `);

    // Lấy dòng phiên đỗ xe tìm thấy
    const session = recordset[0];
    // Nếu không tìm thấy phiên đỗ xe hợp lệ -> Ném lỗi HTTP 404
    if (!session) throw Object.assign(new Error('Không tìm thấy phiên đỗ xe'), { statusCode: 404 });
    // Nếu phiên đỗ đã được thanh toán rồi -> Ném lỗi HTTP 400
    if (session.PaymentStatus === 'Completed' || session.PaymentStatus === 'Prepaid')
        throw Object.assign(new Error('Phiên đã được thanh toán'), { statusCode: 400 });

    // Nạp linh hoạt module db để chuẩn bị tính giá tiền
    const { getPool: gp, sql: s } = await import('../config/db.js');
    // Tính tổng số giờ đỗ thực tế
    const diffH = Math.max(0.017, (Date.now() - new Date(session.EntryTime).getTime()) / 3_600_000);
    // Query tra bảng giá PricingPolicies theo loại xe và số giờ đỗ
    const r = await pool.request()
        .input('VehicleTypeID', sql.Int, session.VehicleTypeID)
        .input('DurationH', sql.Decimal(10, 2), parseFloat(diffH.toFixed(2)))
        .query(`
            SELECT TOP 1 Fee FROM PricingPolicies
            WHERE VehicleTypeID = @VehicleTypeID AND IsActive = 1
            AND ((IsOvernight = 1 AND @DurationH > 8) OR (@DurationH BETWEEN MinHours AND MaxHours))
            ORDER BY IsOvernight DESC, MaxHours
        `);
    // Tính mức phí gốc (tối thiểu 2.000 VNĐ)
    const baseFee = Math.max(2000, Math.round(Number(r.recordset[0]?.Fee || 2000)));

    // Tự động kiểm tra quyền lợi giảm giá từ gói hội viên (nếu có)
    const { applySubscriptionDiscount } = await import('./paymentService.js');
    const { finalFee: amount, discountPercent, planId } = await applySubscriptionDiscount(pool, driverId, baseFee, sessionId);

    // NẾU SỐ TIỀN PHẢI TRẢ = 0 (Được miễn phí gửi xe hoàn toàn theo gói hội viên):
    if (amount === 0) {
        const durationH = parseFloat(diffH.toFixed(2));
        // Kích hoạt thủ tục tạo thanh toán 0 đồng
        await pool.request()
            .input('SessionID', sql.Int, sessionId)
            .input('OrderCode', sql.BigInt, 0)
            .input('Amount', sql.Decimal(10, 2), 0)
            .input('SnapshotH', sql.Decimal(10, 2), durationH)
            .input('QrCode', sql.NVarChar(sql.MAX), null)
            .input('CheckoutUrl', sql.NVarChar(500), 'FREE')
            .execute('sp_CreatePrepayment');
        // Đánh dấu hóa đơn đã trả tiền xong (Prepaid)
        await pool.request()
            .input('OrderCode', sql.BigInt, 0)
            .input('PaidAt', sql.DateTime, new Date())
            .execute('sp_MarkPaymentPrepaid');
        // Trả về kết quả miễn phí thành công
        return { success: true, amount: 0, newBalance: await getBalanceService(driverId) };
    }

    // Lấy số dư ví hiện tại của tài xế
    const balance = await getBalanceService(driverId);
    // Nếu số dư không đủ thanh toán -> Ném lỗi HTTP 400 báo số dư không đủ
    if (balance < amount) {
        throw Object.assign(new Error(`Số dư không đủ. Cần ${amount.toLocaleString('vi-VN')}đ, hiện có ${balance.toLocaleString('vi-VN')}đ`), { statusCode: 400 });
    }

    // THỰC THI TRỪ TIỀN VÍ TRONG SQL SERVER (sp_PayByWallet):
    await pool.request()
        .input('UserID', sql.Int, driverId) // ID tài xế
        .input('Amount', sql.Decimal(10, 2), amount) // Số tiền trừ
        .input('TransactionType', sql.NVarChar(50), 'PAY_PARKING') // Loại giao dịch
        .input('ReferenceID', sql.NVarChar(100), String(sessionId)) // Mã phiên đỗ
        .input('Description', sql.NVarChar(200), `Thanh toán đỗ xe - Session #${sessionId}`) // Mô tả
        .execute('sp_PayByWallet'); // Chạy thủ tục trừ tiền và ghi nhật ký giao dịch

    // Tự động chèn một thông báo hệ thống vào bảng Notifications cho tài xế
    await pool.request()
        .input('UserID', sql.Int, driverId)
        .input('Title', sql.NVarChar, 'Thanh toán phí đỗ xe')
        .input('Message', sql.NVarChar, `Bạn đã thanh toán ${amount.toLocaleString('vi-VN')} VNĐ phí đỗ xe qua Ví cho phiên #${sessionId}.`)
        .input('Type', sql.NVarChar, 'system')
        .input('RefID', sql.Int, sessionId)
        .query(`
            INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType)
            VALUES (@UserID, @Title, @Message, @Type, @RefID, 'PAYMENT')
        `);

    // Đánh dấu hoàn tất hóa đơn trả tiền trước trong bảng Payments
    const durationH = parseFloat(diffH.toFixed(2));
    const orderCode = Date.now(); // Sinh mã đơn thanh toán độc nhất
    await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .input('OrderCode', sql.BigInt, orderCode)
        .input('Amount', sql.Decimal(10, 2), amount)
        .input('SnapshotH', sql.Decimal(10, 2), durationH)
        .input('QrCode', sql.NVarChar(sql.MAX), null)
        .input('CheckoutUrl', sql.NVarChar(500), 'WALLET')
        .execute('sp_CreatePrepayment');

    await pool.request()
        .input('OrderCode', sql.BigInt, orderCode)
        .input('PaidAt', sql.DateTime, new Date())
        .execute('sp_MarkPaymentPrepaid');

    // Lấy số dư ví mới sau khi vừa trừ tiền
    const newBalance = await getBalanceService(driverId);
    // Trả về kết quả thanh toán ví thành công kèm số dư mới
    return { success: true, amount, newBalance };
}

// ── 7. MUA / GIA HẠN GÓI HỘI VIÊN BẰNG VÍ TIỀN ────────────────────
export async function paySubscriptionByWalletService(userId, planId, durationMonths, deductionAmount = 0, extraDays = 0) {
    // Lấy kết nối Database từ pool
    const pool = await getPool();

    // Query kiểm tra gói hội viên có tồn tại và đang hoạt động không
    const planResult = await pool.request()
        .input('PlanID', sql.NVarChar, planId)
        .query('SELECT * FROM SubscriptionPlans WHERE PlanID = @PlanID AND IsActive = 1');
    // Nếu không tìm thấy gói -> Ném lỗi HTTP 400
    if (planResult.recordset.length === 0)
        throw Object.assign(new Error('Gói hội viên không tồn tại'), { statusCode: 400 });

    // Lấy thông tin gói tìm thấy từ row object đầu tiên
    const plan = planResult.recordset[0];
    // Bảng tỷ lệ % giảm giá theo số tháng đăng ký (VD: 3 tháng giảm 5%, 12 tháng giảm 20%)
    const discountMap = { 1: 0, 2: 2, 3: 5, 6: 10, 9: 15, 12: 20, 24: 30 };
    const discountPercent = discountMap[durationMonths] || 0;
    // Tính tổng số tiền gốc = Giá gói * Số tháng
    const totalBase = plan.BasePrice * durationMonths;
    // Tính số tiền thực tế sau khi trừ % giảm giá
    let amount = Math.round(totalBase * (1 - discountPercent / 100));

    // Khấu trừ số dư từ gói cũ (nếu là trường hợp nâng cấp gói giữa chừng)
    if (deductionAmount > 0) {
        amount = Math.max(0, amount - deductionAmount);
    }

    // Kiểm tra số dư ví hiện tại của tài xế
    const balance = await getBalanceService(userId);
    // Nếu số dư ví không đủ mua gói -> Ném lỗi HTTP 400
    if (balance < amount) {
        throw Object.assign(new Error(`Số dư không đủ. Cần ${amount.toLocaleString('vi-VN')}đ, hiện có ${balance.toLocaleString('vi-VN')}đ`), { statusCode: 400 });
    }

    // THỰC THI TRỪ TIỀN VÍ TRONG SQL SERVER (sp_PayByWallet):
    await pool.request()
        .input('UserID', sql.Int, userId) // ID tài xế
        .input('Amount', sql.Decimal(10, 2), amount) // Số tiền trừ mua gói
        .input('TransactionType', sql.NVarChar(50), 'PAY_SUBSCRIPTION') // Loại giao dịch
        .input('ReferenceID', sql.NVarChar(100), `${planId}_${durationMonths}m`) // Mã tham chiếu
        .input('Description', sql.NVarChar(200), `Mua gói ${plan.Name} - ${durationMonths} tháng`) // Mô tả
        .execute('sp_PayByWallet'); // Chạy thủ tục trừ tiền trong DB

    // Chuẩn bị tạo gói hội viên mới (có tính toán thời gian gia hạn / nâng cấp)
    let startDate = new Date(); // Mặc định ngày bắt đầu là hôm nay
    let oldSubId = null;
    let oldPlanId = null;

    // Check xem tài xế có đang dùng gói hội viên nào active không
    const existingSub = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
            SELECT TOP 1 UserSubscriptionID, PlanID, EndDate
            FROM UserSubscriptions
            WHERE UserID = @UserID AND Status = 'Active'
            ORDER BY EndDate DESC
        `);

    // Nếu tìm thấy gói đang active cũ
    if (existingSub.recordset.length > 0) {
        const row = existingSub.recordset[0];
        oldSubId = row.UserSubscriptionID;
        oldPlanId = row.PlanID;
        const currentEnd = new Date(row.EndDate);

        // Nếu gia hạn CÙNG GÓI CŨ -> Ngày bắt đầu mới sẽ nối tiếp sau ngày hết hạn cũ
        if (oldPlanId === planId) {
            if (currentEnd > startDate) {
                startDate = currentEnd;
            }
        }
        // Nếu NÂNG CẤP KHÁC GÓI -> Ngày bắt đầu mới tính ngay từ hôm nay
    }

    // Tính ngày hết hạn gói mới = Ngày bắt đầu + Số tháng đăng ký
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    // Bổ sung thêm ngày khuyến mãi (nếu có)
    if (extraDays > 0) {
        endDate.setDate(endDate.getDate() + extraDays);
    }

    // MỞ TRANSACTION ĐỂ TẠO GÓI BẢO VỆ TOÀN VẸN DỮ LIỆU:
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        // Bước 1: Nếu là nâng cấp sang gói mới -> Đổi trạng thái gói cũ thành 'Upgraded'
        if (oldSubId && oldPlanId !== planId) {
            await new sql.Request(transaction)
                .input('OldSubID', sql.Int, oldSubId)
                .query(`
                    UPDATE UserSubscriptions
                    SET Status = 'Upgraded', EndDate = GETDATE()
                    WHERE UserSubscriptionID = @OldSubID
                `);
        }

        // Bước 2: Chèn bản ghi gói hội viên mới vào bảng UserSubscriptions
        const result = await new sql.Request(transaction)
            .input('UserID', sql.Int, userId)
            .input('PlanID', sql.NVarChar, planId)
            .input('StartDate', sql.DateTime, startDate)
            .input('EndDate', sql.DateTime, endDate)
            .input('AmountPaid', sql.Decimal(10, 2), amount)
            .query(`
                INSERT INTO UserSubscriptions (UserID, PlanID, StartDate, EndDate, AmountPaid, Status)
                OUTPUT inserted.UserSubscriptionID
                VALUES (@UserID, @PlanID, @StartDate, @EndDate, @AmountPaid, 'Active')
            `);

        // CHỐT GIAO DỊCH LƯU DB VĨNH VIỄN
        await transaction.commit();

        // Lấy ID gói vừa tạo
        const subId = result.recordset[0].UserSubscriptionID;

        // Chèn thông báo mua gói thành công vào bảng Notifications
        try {
            await pool.request()
                .input('UserID', sql.Int, userId)
                .input('Title', sql.NVarChar, 'Gia hạn/Mua gói hội viên')
                .input('Message', sql.NVarChar, `Bạn đã thanh toán ${amount.toLocaleString('vi-VN')} VNĐ qua Ví để mua/gia hạn gói ${plan.Name} (${durationMonths} tháng).`)
                .input('Type', sql.NVarChar, 'system')
                .input('RefID', sql.Int, subId)
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType)
                    VALUES (@UserID, @Title, @Message, @Type, @RefID, 'subscription')
                `);
        } catch (notifErr) {
            console.error('Wallet sub notification error:', notifErr.message);
        }

        // Kiểm tra nếu tài xế chưa có xe mặc định -> Nhắc nhở chọn xe để hưởng ưu đãi
        try {
            const defaultVehicleCheck = await pool.request()
                .input("UserID", sql.Int, userId)
                .query(`
                    SELECT TOP 1 1 FROM DriverVehicles
                    WHERE DriverID = @UserID AND IsActive = 1 AND IsDefault = 1
                `);

            if (defaultVehicleCheck.recordset.length === 0) {
                await pool.request()
                    .input("UserID", sql.Int, userId)
                    .input("Title", sql.NVarChar, "Thiết lập xe mặc định")
                    .input("Message", sql.NVarChar, "Bạn vừa đăng ký gói hội viên thành công! Hãy chọn xe mặc định để nhận quyền lợi miễn phí đỗ xe. Nhấn vào đây để thiết lập ngay.")
                    .input("Type", sql.NVarChar, "system")
                    .query(`
                        INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType, IsRead, CreatedAt)
                        VALUES (@UserID, @Title, @Message, @Type, NULL, 'SET_DEFAULT_VEHICLE', 0, GETDATE())
                    `);
            }
        } catch (notifErr) {
            console.error('Default vehicle notification error:', notifErr.message);
        }

        // Lấy số dư ví mới sau khi hoàn tất mua gói
        const newBalance = await getBalanceService(userId);
        // Trả về kết quả mua gói hội viên thành công cho Controller
        return {
            success: true,
            userSubscriptionId: subId,
            startDate,
            endDate,
            amount,
            newBalance,
        };
    } catch (error) {
        // HOÀN TÁC NẾU CÓ LỖI TẠO GÓI HỘI VIÊN
        await transaction.rollback();
        throw error;
    }
}
