/**
 * FILE: walletService.js
 * MÔ TẢ: Service xử lý nghiệp vụ Ví điện tử (Wallet) của người dùng.
 * Chức năng: Nạp tiền (Topup) qua PayOS, xử lý Webhook Topup, thanh toán phiên gửi xe
 * và mua gói hội viên bằng số dư ví.
 */
/*
Hieu
*/

import crypto from 'crypto';
import axios from 'axios';
import { getPool, sql } from '../config/db.js';

const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
const PAYOS_CHECKSUM = process.env.PAYOS_CHECKSUM_KEY;
const PAYOS_BASE_URL = 'https://api-merchant.payos.vn';

function makeSignature({ amount, cancelUrl, description, orderCode, returnUrl }) {
    const raw = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    return crypto.createHmac('sha256', PAYOS_CHECKSUM).update(raw).digest('hex');
}

// In-memory pending topup orders
const pendingTopups = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [code, o] of pendingTopups.entries())
        if (o.expiredAt < now) pendingTopups.delete(code);
}, 60_000);

function makeTopupOrderCode(userId) {
    const suffix = Date.now() % 1_000_000;
    return parseInt(`9${userId}${String(suffix).padStart(6, '0')}`, 10);
}

// ── Tạo link nạp tiền PayOS ──────────────────────────────────────
export async function createTopupService(userId, amount) {
    if (!amount || amount < 10000) {
        throw Object.assign(new Error('Số tiền nạp tối thiểu là 10,000 VNĐ'), { statusCode: 400 });
    }

    const pool = await getPool();
    const userRes = await pool.request()
        .input('UserID', sql.Int, userId)
        .query('SELECT FullName, Email FROM Users WHERE UserID = @UserID');
    const user = userRes.recordset[0];
    if (!user) throw Object.assign(new Error('User không tồn tại'), { statusCode: 404 });

    const orderCode = makeTopupOrderCode(userId);
    const description = `TOPUP${userId}T${Date.now() % 10000}`;

    const FE = process.env.FE_ORIGIN || 'http://localhost:5173';
    const returnUrl = `${FE}/driver/topup-payment?status=success`;
    const cancelUrl = `${FE}/driver/topup-payment?status=cancel`;
    const expiredAt = Math.floor((Date.now() + 15 * 60 * 1000) / 1000);

    const payload = {
        orderCode,
        amount,
        description,
        buyerName: user.FullName || 'Driver',
        buyerEmail: user.Email || undefined,
        items: [{ name: `Nap tien vi - ${amount} VND`, quantity: 1, price: amount }],
        cancelUrl,
        returnUrl,
        expiredAt,
        signature: makeSignature({ amount, cancelUrl, description, orderCode, returnUrl }),
    };

    let pd;
    try {
        const res = await axios.post(`${PAYOS_BASE_URL}/v2/payment-requests`, payload, {
            headers: {
                'x-client-id': PAYOS_CLIENT_ID,
                'x-api-key': PAYOS_API_KEY,
                'Content-Type': 'application/json',
            },
            timeout: 15_000,
        });
        if (res.data.code !== '00') {
            throw Object.assign(new Error(`PayOS lỗi: ${res.data.desc || res.data.code}`), { statusCode: 400 });
        }
        pd = res.data.data;
    } catch (e) {
        if (e.statusCode) throw e;
        const msg = e.response?.data?.desc || e.message;
        throw Object.assign(new Error(`Lỗi kết nối PayOS: ${msg}`), { statusCode: 502 });
    }

    const expiredMs = expiredAt * 1000;
    pendingTopups.set(orderCode, {
        userId, amount, description,
        status: 'PENDING',
        expiredAt: expiredMs,
    });

    return {
        orderCode,
        amount,
        description,
        qrCode: pd.qrCode,
        checkoutUrl: pd.checkoutUrl,
        accountNumber: pd.accountNumber,
        accountName: pd.accountName,
        bankBin: pd.bin,
        currency: 'VND',
        expiredAt: new Date(expiredMs).toISOString(),
        status: 'PENDING',
    };
}

// ── Polling check trạng thái nạp tiền ─────────────────────────────
export async function checkTopupStatusService(orderCode) {
    let payosStatus = 'PENDING';
    try {
        const res = await axios.get(`${PAYOS_BASE_URL}/v2/payment-requests/${orderCode}`, {
            headers: { 'x-client-id': PAYOS_CLIENT_ID, 'x-api-key': PAYOS_API_KEY },
            timeout: 8_000,
        });
        payosStatus = res.data?.data?.status || 'PENDING';
    } catch { /* mạng lỗi → dùng cache */ }

    if (payosStatus === 'PAID') {
        // Cộng tiền vào ví
        const order = pendingTopups.get(Number(orderCode));
        if (order && order.status !== 'PAID') {
            order.status = 'PAID';
            const pool = await getPool();
            await pool.request()
                .input('UserID', sql.Int, order.userId)
                .input('Amount', sql.Decimal(10, 2), order.amount)
                .input('ReferenceID', sql.NVarChar(100), String(orderCode))
                .input('Description', sql.NVarChar(200), `Nạp tiền ví - ${order.amount.toLocaleString('vi-VN')} VNĐ`)
                .execute('sp_TopUpWallet');
            pendingTopups.delete(Number(orderCode));
        }
        return { status: 'PAID', orderCode };
    }

    if (payosStatus === 'CANCELLED' || payosStatus === 'EXPIRED') {
        pendingTopups.delete(Number(orderCode));
        return { status: payosStatus, orderCode };
    }

    return { status: 'PENDING', orderCode };
}

// ── Xử lý webhook nạp tiền ────────────────────────────────────────
export async function handleTopupWebhook(orderCode, amount) {
    const order = pendingTopups.get(Number(orderCode));
    if (order && order.status !== 'PAID') {
        order.status = 'PAID';
        const pool = await getPool();
        await pool.request()
            .input('UserID', sql.Int, order.userId)
            .input('Amount', sql.Decimal(10, 2), order.amount)
            .input('ReferenceID', sql.NVarChar(100), String(orderCode))
            .input('Description', sql.NVarChar(200), `Nạp tiền ví - ${order.amount.toLocaleString('vi-VN')} VNĐ`)
            .execute('sp_TopUpWallet');
        pendingTopups.delete(Number(orderCode));
    }
}

// ── Lấy số dư ─────────────────────────────────────────────────────
export async function getBalanceService(userId) {
    const pool = await getPool();
    const res = await pool.request()
        .input('UserID', sql.Int, userId)
        .query('SELECT ISNULL(AccountBalance, 0) AS balance FROM Users WHERE UserID = @UserID');
    return res.recordset[0]?.balance || 0;
}

// ── Lịch sử giao dịch ─────────────────────────────────────────────
export async function getWalletHistoryService(userId, limit = 20) {
    const pool = await getPool();
    const res = await pool.request()
        .input('UserID', sql.Int, userId)
        .input('Limit', sql.Int, limit)
        .query(`
            SELECT TOP (@Limit) TransactionID, TransactionType as Type, Amount, ReferenceID, Description, CreatedAt, Status
            FROM WalletTransactions
            WHERE UserID = @UserID
            ORDER BY CreatedAt DESC
        `);
    return res.recordset;
}

// ── Thanh toán đỗ xe bằng ví ───────────────────────────────────────
export async function payParkingByWalletService(sessionId, driverId) {
    const pool = await getPool();

    // Lấy thông tin session + payment
    const { recordset } = await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .input('DriverID', sql.Int, driverId)
        .query(`
            SELECT ps.SessionID, ps.VehicleTypeID, ps.EntryTime, ps.SessionStatus,
                   p.PaymentStatus, p.Amount
            FROM ParkingSessions ps
            JOIN Payments p ON ps.SessionID = p.SessionID
            WHERE ps.SessionID = @SessionID AND ps.DriverID = @DriverID AND ps.SessionStatus = 'Active'
        `);

    const session = recordset[0];
    if (!session) throw Object.assign(new Error('Không tìm thấy phiên đỗ xe'), { statusCode: 404 });
    if (session.PaymentStatus === 'Completed' || session.PaymentStatus === 'Prepaid')
        throw Object.assign(new Error('Phiên đã được thanh toán'), { statusCode: 400 });

    // Import calcFee from paymentService to get amount
    const { getPool: gp, sql: s } = await import('../config/db.js');
    const diffH = Math.max(0.017, (Date.now() - new Date(session.EntryTime).getTime()) / 3_600_000);
    const r = await pool.request()
        .input('VehicleTypeID', sql.Int, session.VehicleTypeID)
        .input('DurationH', sql.Decimal(10, 2), parseFloat(diffH.toFixed(2)))
        .query(`
            SELECT TOP 1 Fee FROM PricingPolicies
            WHERE VehicleTypeID = @VehicleTypeID AND IsActive = 1
            AND ((IsOvernight = 1 AND @DurationH > 8) OR (@DurationH BETWEEN MinHours AND MaxHours))
            ORDER BY IsOvernight DESC, MaxHours
        `);
    const baseFee = Math.max(2000, Math.round(Number(r.recordset[0]?.Fee || 2000)));

    // Apply subscription discount
    const { applySubscriptionDiscount } = await import('./paymentService.js');
    const { finalFee: amount, discountPercent, planId } = await applySubscriptionDiscount(pool, driverId, baseFee, sessionId);


    if (amount === 0) {
        // Miễn phí → giống logic FREE hiện tại
        const durationH = parseFloat(diffH.toFixed(2));
        await pool.request()
            .input('SessionID', sql.Int, sessionId)
            .input('OrderCode', sql.BigInt, 0)
            .input('Amount', sql.Decimal(10, 2), 0)
            .input('SnapshotH', sql.Decimal(10, 2), durationH)
            .input('QrCode', sql.NVarChar(sql.MAX), null)
            .input('CheckoutUrl', sql.NVarChar(500), 'FREE')
            .execute('sp_CreatePrepayment');
        await pool.request()
            .input('OrderCode', sql.BigInt, 0)
            .input('PaidAt', sql.DateTime, new Date())
            .execute('sp_MarkPaymentPrepaid');
        return { success: true, amount: 0, newBalance: await getBalanceService(driverId) };
    }

    // Kiểm tra số dư
    const balance = await getBalanceService(driverId);
    if (balance < amount) {
        throw Object.assign(new Error(`Số dư không đủ. Cần ${amount.toLocaleString('vi-VN')}đ, hiện có ${balance.toLocaleString('vi-VN')}đ`), { statusCode: 400 });
    }

    // Trừ tiền ví
    await pool.request()
        .input('UserID', sql.Int, driverId)
        .input('Amount', sql.Decimal(10, 2), amount)
        .input('TransactionType', sql.NVarChar(50), 'PAY_PARKING')
        .input('ReferenceID', sql.NVarChar(100), String(sessionId))
        .input('Description', sql.NVarChar(200), `Thanh toán đỗ xe - Session #${sessionId}`)
        .execute('sp_PayByWallet');

    // Thêm thông báo
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

    // Mark payment as prepaid
    const durationH = parseFloat(diffH.toFixed(2));
    const orderCode = Date.now(); // unique code for wallet payment
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

    const newBalance = await getBalanceService(driverId);
    return { success: true, amount, newBalance };
}

// ── Mua gói subscription bằng ví ────────────────────────────────────
export async function paySubscriptionByWalletService(userId, planId, durationMonths, deductionAmount = 0, extraDays = 0) {
    const pool = await getPool();

    // Validate plan
    const planResult = await pool.request()
        .input('PlanID', sql.NVarChar, planId)
        .query('SELECT * FROM SubscriptionPlans WHERE PlanID = @PlanID AND IsActive = 1');
    if (planResult.recordset.length === 0)
        throw Object.assign(new Error('Gói hội viên không tồn tại'), { statusCode: 400 });

    const plan = planResult.recordset[0];
    const discountMap = { 1: 0, 2: 2, 3: 5, 6: 10, 9: 15, 12: 20, 24: 30 };
    const discountPercent = discountMap[durationMonths] || 0;
    const totalBase = plan.BasePrice * durationMonths;
    let amount = Math.round(totalBase * (1 - discountPercent / 100));

    // Khấu trừ số dư từ gói cũ (nếu có)
    if (deductionAmount > 0) {
        amount = Math.max(0, amount - deductionAmount);
    }

    // Kiểm tra số dư
    const balance = await getBalanceService(userId);
    if (balance < amount) {
        throw Object.assign(new Error(`Số dư không đủ. Cần ${amount.toLocaleString('vi-VN')}đ, hiện có ${balance.toLocaleString('vi-VN')}đ`), { statusCode: 400 });
    }

    // Trừ tiền
    await pool.request()
        .input('UserID', sql.Int, userId)
        .input('Amount', sql.Decimal(10, 2), amount)
        .input('TransactionType', sql.NVarChar(50), 'PAY_SUBSCRIPTION')
        .input('ReferenceID', sql.NVarChar(100), `${planId}_${durationMonths}m`)
        .input('Description', sql.NVarChar(200), `Mua gói ${plan.Name} - ${durationMonths} tháng`)
        .execute('sp_PayByWallet');

    // Tạo subscription (có xử lý nâng cấp gói)
    let startDate = new Date();
    let oldSubId = null;
    let oldPlanId = null;

    const existingSub = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
            SELECT TOP 1 UserSubscriptionID, PlanID, EndDate
            FROM UserSubscriptions
            WHERE UserID = @UserID AND Status = 'Active'
            ORDER BY EndDate DESC
        `);

    if (existingSub.recordset.length > 0) {
        const row = existingSub.recordset[0];
        oldSubId = row.UserSubscriptionID;
        oldPlanId = row.PlanID;
        const currentEnd = new Date(row.EndDate);

        // Nếu cùng gói (Gia hạn) -> Cộng dồn thời gian nối tiếp
        if (oldPlanId === planId) {
            if (currentEnd > startDate) {
                startDate = currentEnd;
            }
        }
        // Nếu khác gói (Nâng cấp) -> Bắt đầu ngay lập tức từ hôm nay
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    if (extraDays > 0) {
        endDate.setDate(endDate.getDate() + extraDays);
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        // 1. Nếu là nâng cấp, hủy gói cũ
        if (oldSubId && oldPlanId !== planId) {
            await new sql.Request(transaction)
                .input('OldSubID', sql.Int, oldSubId)
                .query(`
                    UPDATE UserSubscriptions
                    SET Status = 'Upgraded', EndDate = GETDATE()
                    WHERE UserSubscriptionID = @OldSubID
                `);
        }

        // 2. Tạo gói mới
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

        await transaction.commit();

        const subId = result.recordset[0].UserSubscriptionID;

        // Thêm thông báo mua gói
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

        // Kiểm tra nếu user chưa có xe mặc định thì gửi thông báo
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

        const newBalance = await getBalanceService(userId);
        return {
            success: true,
            userSubscriptionId: subId,
            startDate,
            endDate,
            amount,
            newBalance,
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
