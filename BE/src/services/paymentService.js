/**
 * FILE: paymentService.js
 * MÔ TẢ: Service quản lý toàn bộ các giao dịch Thanh toán cước phí gửi xe (Payment & Billing Engine).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. TÍNH PHÍ ĐỖ XE REAL-TIME (`calcFeeV2`): Đóng gói dữ liệu gọi Stored Procedure `sp_CalcParkingFeeV2` tính cước lũy tiến theo các khung giờ (ngày, đêm, loại xe).
 * 2. THUẬT TOÁN ÁP DỤNG ƯU ĐÃI GÓI HỘI VIÊN (`applySubscriptionDiscount`):
 *    - Kiểm tra xem xe checkout có phải là xe MẶC ĐỊNH (`DriverVehicles.IsDefault = 1`) của Tài xế không.
 *    - Tính tổng số block 4 tiếng đã sử dụng trong tháng hiện tại (`PastBlocks`).
 *    - Đối chiếu hạn mức tối đa của gói (Basic: 5 blocks ~20h, Pro: 15 blocks ~60h, Premium: 300 blocks ~1200h).
 *    - Miễn phí các block còn trong hạn mức và giảm giá phần vượt mức theo cấu hình gói.
 * 3. THANH TOÁN QUA CỔNG PAYOS (`createPaymentService`): Sinh chữ ký HMAC SHA256 và khởi tạo mã VietQR thanh toán 24/7.
 * 4. WEBHOOK & POLLING XÁC NHẬN (`handleWebhookService`, `markPrepaid`): Xác thực chữ ký số Webhook từ PayOS gửi sang và kích hoạt Stored Procedure `sp_MarkPaymentPrepaid` ghi nhận hoàn tất giao dịch.
 * 5. CHECK-OUT BẢO VỆ (`staffCheckoutService`): Thực thi check-out tại cổng bãi qua Stored Proc `sp_CheckOutWithSurcharge`, tự động bù cấn trừ khoản trả trước (PrepaidAmount) hoặc phụ phí phát sinh.
 * 
 * @module paymentService
 */

import crypto from 'crypto';
import axios from 'axios';
import { getPool, sql } from '../config/db.js';

// Cấu hình chìa khóa bảo mật cổng thanh toán PayOS
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
const PAYOS_CHECKSUM = process.env.PAYOS_CHECKSUM_KEY;
const PAYOS_BASE_URL = 'https://api-merchant.payos.vn';

// BỘ NHỚ LƯU TRỮ ĐƠN HÀNG THANH TOÁN CHỜ TRONG RAM (Map OrderCode -> Metadata)
const pendingOrders = new Map();
// Tự động dọn dẹp các đơn thanh toán đỗ xe quá hạn (Expired > 15 phút) mỗi 60 giây
setInterval(() => {
    const now = Date.now();
    for (const [code, o] of pendingOrders.entries())
        if (o.expiredAt < now) pendingOrders.delete(code);
}, 60_000);

/**
 * HÀM PHỤ: makeSignature
 * TÁC DỤNG: Sinh chữ ký số HMAC-SHA256 gửi sang PayOS để xác thực dữ liệu giao dịch thanh toán đỗ xe.
 */
function makeSignature({ amount, cancelUrl, description, orderCode, returnUrl }) {
    const raw = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    return crypto.createHmac('sha256', PAYOS_CHECKSUM).update(raw).digest('hex');
}

/**
 * HÀM 1: verifyWebhookSignature
 * TÁC DỤNG: Xác minh tính chính thống của dữ liệu Webhook do Server PayOS bắn về ứng dụng Backend.
 * 
 * @param {Object} body - Dữ liệu JSON payload nhận từ Webhook
 * @returns {boolean} True nếu chữ ký hợp lệ
 */
export function verifyWebhookSignature(body) {
    try {
        const d = body?.data;
        if (!d) return false;
        // Ghép các tham số phản hồi theo thứ tự alphabet bắt buộc của PayOS
        const raw = [
            `accountNumber=${d.accountNumber ?? ''}`,
            `amount=${d.amount ?? ''}`,
            `description=${d.description ?? ''}`,
            `orderCode=${d.orderCode ?? ''}`,
            `reference=${d.reference ?? ''}`,
            `transactionDateTime=${d.transactionDateTime ?? ''}`,
        ].join('&');
        const expected = crypto.createHmac('sha256', PAYOS_CHECKSUM).update(raw).digest('hex');
        return expected === body.signature;
    } catch { return false; }
}

/**
 * HÀM PHỤ: makeOrderCode
 * TÁC DỤNG: Sinh mã đơn hàng thanh toán dạng số nguyên BigInt duy nhất dựa trên SessionID.
 */
function makeOrderCode(sessionId) {
    const suffix = Date.now() % 1_000_000;
    return parseInt(`${sessionId}${String(suffix).padStart(6, '0')}`, 10);
}

/**
 * HÀM PHỤ: calcFeeV2
 * TÁC DỤNG: Gọi Stored Procedure `sp_CalcParkingFeeV2` để tính mức phí cước gửi xe theo thời gian thực tế.
 */
async function calcFeeV2(pool, vehicleTypeId, entryTime) {
    const exitTime = new Date();
    const request = pool.request();
    request.input('VehicleTypeID', sql.Int, Number(vehicleTypeId));
    request.input('EntryTime', sql.DateTime, new Date(entryTime));
    request.input('ExitTime', sql.DateTime, exitTime);
    request.output('Fee', sql.Decimal(10, 2));
    request.output('Breakdown', sql.NVarChar(sql.MAX));
    const result = await request.execute('sp_CalcParkingFeeV2');
    const fee = Number(result.output.Fee || 0);
    // Tính tổng số giờ đỗ (tối thiểu 0.017h ~ 1 phút)
    const durationH = Math.max(0.017, (exitTime.getTime() - new Date(entryTime).getTime()) / 3_600_000);
    return { fee: Math.max(2000, fee), durationH: parseFloat(durationH.toFixed(2)) };
}

/**
 * HÀM 2: applySubscriptionDiscount
 * TÁC DỤNG: Thuật toán tính toán chiết khấu tiền gửi xe dựa trên Gói hội viên của Tài xế.
 * 
 * @param {Object} pool - Connection Pool kết nối SQL
 * @param {number} driverId - ID tài xế
 * @param {number} baseFee - Số tiền cước phí gốc chưa giảm giá
 * @param {number} sessionId - ID phiên gửi xe đang tính
 * @returns {Promise<Object>} Mức phí cuối cùng (`finalFee`), % giảm giá (`discountPercent`) và tên gói (`planId`)
 */
export async function applySubscriptionDiscount(arg1, arg2, arg3, arg4) {
    let pool, driverId, baseFee, sessionId;
    if (typeof arg1 === 'number') {
        driverId = arg1;
        baseFee = arg2;
        sessionId = arg3;
        pool = await getPool();
    } else {
        pool = arg1 || (await getPool());
        driverId = arg2;
        baseFee = arg3;
        sessionId = arg4;
    }

    // 1. Kiểm tra gói hội viên đang Active của Tài xế
    const subRes = await pool.request()
        .input('UserID', sql.Int, driverId)
        .query(`
            SELECT top 1 PlanID, StartDate, EndDate 
            FROM UserSubscriptions 
            WHERE UserID = @UserID AND Status = 'Active' 
              AND EndDate > GETDATE()
            ORDER BY EndDate DESC
        `);
        
    if (subRes.recordset.length === 0) {
        return { finalFee: baseFee, discountPercent: 0, planId: null };
    }

    const sub = subRes.recordset[0];

    // 2. KIỂM TRA XE MẶC ĐỊNH: Quyền lợi vé tháng CHỈ áp dụng cho Xe Mặc Định của Tài xế
    if (sessionId) {
        const vehicleRes = await pool.request()
            .input('SessionID', sql.Int, sessionId)
            .query(`
                SELECT dv.IsDefault 
                FROM ParkingSessions ps
                JOIN DriverVehicles dv ON UPPER(REPLACE(REPLACE(ps.PlateNumber, ' ', ''), '-', '')) = UPPER(REPLACE(REPLACE(dv.PlateNumber, ' ', ''), '-', ''))
                    AND ps.DriverID = dv.DriverID
                WHERE ps.SessionID = @SessionID
            `);
        const isDefault = vehicleRes.recordset[0]?.IsDefault || false;

        if (!isDefault) {
            // Xe không phải xe mặc định ➔ Phải trả 100% tiền phí gửi xe gốc
            return { finalFee: baseFee, discountPercent: 0, planId: sub.PlanID, sessionCount: 0 };
        }
    }
    
    // 3. Tính tổng số block 4 tiếng đã sử dụng trong tháng hiện tại từ các phiên đỗ đã hoàn thành
    const pastCountRes = await pool.request()
        .input('DriverID', sql.Int, driverId)
        .query(`
            SELECT ISNULL(SUM(CEILING(DATEDIFF(MINUTE, EntryTime, ExitTime) / 240.0)), 0) as PastBlocks
            FROM ParkingSessions
            WHERE DriverID = @DriverID 
              AND SessionStatus = 'Completed'
              AND MONTH(EntryTime) = MONTH(GETDATE())
              AND YEAR(EntryTime) = YEAR(GETDATE())
        `);
        
    const pastBlocksUsed = pastCountRes.recordset[0].PastBlocks || 0;

    // 4. Tính số block 4 tiếng của phiên hiện tại đang đỗ
    const currentCountRes = await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .query(`
            SELECT ISNULL(CEILING(DATEDIFF(MINUTE, EntryTime, GETDATE()) / 240.0), 0) as CurrentBlocks
            FROM ParkingSessions
            WHERE SessionID = @SessionID
        `);
        
    const currentBlocks = Math.max(1, currentCountRes.recordset[0]?.CurrentBlocks || 1);

    // 5. Cấu hình hạn mức tối đa block miễn phí theo từng hạng gói
    let limitBlocks = 0;
    let fallbackDiscount = 0;

    if (sub.PlanID === 'basic') {
        limitBlocks = 5;         // Gói Basic: Miễn phí 5 blocks (20 giờ)
        fallbackDiscount = 10;   // Vượt hạn mức ➔ Giảm 10%
    } else if (sub.PlanID === 'pro') {
        limitBlocks = 15;        // Gói Pro: Miễn phí 15 blocks (60 giờ)
        fallbackDiscount = 25;   // Vượt hạn mức ➔ Giảm 25%
    } else if (sub.PlanID === 'premium') {
        limitBlocks = 300;       // Gói VIP Premium: Miễn phí 300 blocks (1200 giờ)
        fallbackDiscount = 0;
    }

    // 6. Phân bổ tính toán phần được miễn phí và phần vượt hạn mức phải trả tiền
    const remainingFreeBlocks = Math.max(0, limitBlocks - pastBlocksUsed);
    const freeBlocksApplicable = Math.min(currentBlocks, remainingFreeBlocks);
    const paidBlocks = Math.max(0, currentBlocks - freeBlocksApplicable);

    let freePortionFee = baseFee * (freeBlocksApplicable / currentBlocks);
    let paidPortionFee = baseFee * (paidBlocks / currentBlocks);
    
    // Áp dụng mức giảm giá ưu đãi cho phần block phải trả tiền
    let finalFee = paidPortionFee * (1 - fallbackDiscount / 100);

    if (finalFee > 0 && finalFee < 2000) finalFee = 2000;
    else if (finalFee < 0) finalFee = 0;

    // Tính % giảm giá tổng thể của phiên đỗ để hiển thị lên UI
    let discountPercent = 0;
    if (baseFee > 0) {
        discountPercent = Math.round(((baseFee - finalFee) / baseFee) * 100);
    }

    return { 
        finalFee: Math.round(finalFee), 
        discountPercent, 
        planId: sub.PlanID,
        sessionCount: currentBlocks
    };
}

/**
 * HÀM PHỤ: getPricingTable
 * TÁC DỤNG: Tra cứu toàn bộ bảng cấu hình giá đỗ xe của 1 loại xe từ bảng `PricingPolicies`.
 */
async function getPricingTable(pool, vehicleTypeId) {
    const r = await pool.request()
        .input('VehicleTypeID', sql.Int, vehicleTypeId)
        .query(`
      SELECT MinHours, MaxHours, Fee, IsOvernight
      FROM PricingPolicies
      WHERE VehicleTypeID = @VehicleTypeID AND IsActive = 1
      ORDER BY IsOvernight, MinHours
    `);
    return r.recordset;
}

/**
 * HÀM 3: getActiveSessionsService
 * TÁC DỤNG: Lấy danh sách toàn bộ các phiên đỗ xe đang hoạt động (`Active`) của Tài xế.
 */
export async function getActiveSessionsService(driverId) {
    const pool = await getPool();
    const { recordset } = await pool.request()
        .input('DriverID', sql.Int, driverId)
        .query(`
      SELECT
        ps.SessionID,
        ps.PlateNumber,
        ps.EntryTime,
        ps.SessionStatus,
        vt.VehicleName,
        vt.VehicleCode,
        vt.VehicleTypeID,
        sl.SlotCode,
        z.ZoneName,
        f.FloorName,
        b.BuildingName,
        p.Amount          AS CurrentAmount,
        p.PrepaidAmount,
        p.PaymentStatus,
        p.SurchargeAmount,
        p.SurchargeStatus,
        p.PrepaidAt,
        DATEDIFF(MINUTE, ps.EntryTime, GETDATE()) AS ParkingMinutes
      FROM ParkingSessions ps
      JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
      JOIN ParkingSlots sl ON ps.SlotID        = sl.SlotID
      JOIN Zones        z  ON sl.ZoneID        = z.ZoneID
      JOIN Floors       f  ON z.FloorID        = f.FloorID
      JOIN Buildings    b  ON f.BuildingID     = b.BuildingID
      LEFT JOIN Payments p ON ps.SessionID     = p.SessionID
      WHERE ps.DriverID      = @DriverID
        AND ps.SessionStatus = 'Active'
      ORDER BY ps.EntryTime DESC
    `);
    
    const sessions = recordset;
    for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i];
        try {
            // Lấy phí cước tạm tính thời gian thực cho từng phiên đỗ
            const feeRes = await pool.request()
                .input('VehicleTypeID', sql.Int, s.VehicleTypeID)
                .input('EntryTime', sql.DateTime, s.EntryTime)
                .input('ExitTime', sql.DateTime, new Date())
                .output('Fee', sql.Decimal(10, 2))
                .output('Breakdown', sql.NVarChar(sql.MAX))
                .execute('sp_CalcParkingFeeV2');
                
            const baseFee = feeRes.output.Fee || 0;
            
            // Tính tỷ lệ giảm giá ưu đãi
            const { discountPercent } = await applySubscriptionDiscount(pool, driverId, baseFee, s.SessionID);
            s.DiscountPercent = discountPercent;
            const finalRealTimeFee = Math.round(baseFee * (1 - (discountPercent || 0) / 100));
            s.RealTimeFee = finalRealTimeFee;
            s.ParkingFee = finalRealTimeFee;
            if (s.PrepaidAmount > 0 && finalRealTimeFee > s.PrepaidAmount) {
              s.SurchargeAmount = finalRealTimeFee - s.PrepaidAmount;
              s.HasSurcharge = true;
            } else {
              s.SurchargeAmount = 0;
              s.HasSurcharge = false;
            }
            s.Amount = finalRealTimeFee > 0 ? finalRealTimeFee : (s.CurrentAmount || 0);
            
        } catch (e) {
            console.error('Error calculating discount for session:', s.SessionID, e);
            s.DiscountPercent = 0;
        }
    }
    
    return sessions;
}

/**
 * HÀM 4: createPaymentService
 * TÁC DỤNG: Khởi tạo mã VietQR thanh toán cước đỗ xe qua cổng PayOS cho Tài xế.
 */
export async function createPaymentService(sessionId, driverId) {
    const pool = await getPool();

    // 1. Kiểm tra phiên đỗ xe đang Active
    const { recordset } = await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .input('DriverID', sql.Int, driverId)
        .query(`
      SELECT
        ps.SessionID, ps.PlateNumber, ps.EntryTime,
        ps.VehicleTypeID, ps.SessionStatus,
        p.PaymentStatus, p.PrepaidAmount,
        vt.VehicleName,
        sl.SlotCode,
        b.BuildingName,
        f.FloorName,
        z.ZoneName,
        u.FullName  AS DriverName,
        u.Email     AS DriverEmail
      FROM ParkingSessions ps
      JOIN Payments     p  ON ps.SessionID     = p.SessionID
      JOIN VehicleTypes vt ON ps.VehicleTypeID  = vt.VehicleTypeID
      JOIN ParkingSlots sl ON ps.SlotID         = sl.SlotID
      JOIN Zones        z  ON sl.ZoneID         = z.ZoneID
      JOIN Floors       f  ON z.FloorID         = f.FloorID
      JOIN Buildings    b  ON f.BuildingID      = b.BuildingID
      JOIN Users        u  ON ps.DriverID       = u.UserID
      WHERE ps.SessionID = @SessionID
        AND ps.DriverID  = @DriverID
        AND ps.SessionStatus = 'Active'
    `);

    const session = recordset[0];
    if (!session) {
        const err = new Error('Không tìm thấy phiên đỗ xe đang hoạt động');
        err.statusCode = 404; throw err;
    }
    if (session.PaymentStatus === 'Completed') {
        const err = new Error('Phiên này đã được thanh toán đầy đủ rồi');
        err.statusCode = 400; throw err;
    }

    // 2. Tính phí đỗ xe gốc & bảng giá
    const { fee: baseFee, durationH } = await calcFeeV2(pool, session.VehicleTypeID, session.EntryTime);
    const pricingTable = await getPricingTable(pool, session.VehicleTypeID);

    // 3. Áp dụng ưu đãi gói hội viên
    const { finalFee: totalFee, discountPercent, planId, sessionCount } = await applySubscriptionDiscount(pool, driverId, baseFee, sessionId);

    // Tính số tiền phụ trội cần tạo mã QR thanh toán (trừ tiền đã trả trước nếu có)
    let amount = totalFee;
    const existingPrepaid = Number(session.PrepaidAmount || 0);
    if (session.PaymentStatus === 'Prepaid' && existingPrepaid > 0) {
        if (totalFee <= existingPrepaid) {
            const err = new Error('Phiên này đã được thanh toán đầy đủ rồi');
            err.statusCode = 400; throw err;
        }
        amount = totalFee - existingPrepaid;
    }

    // 4. Nếu số tiền sau giảm giá = 0 (Được miễn phí hoàn toàn) ➔ Tự động đánh dấu Prepaid 0đ không cần gọi PayOS
    if (amount === 0) {
        await pool.request()
            .input('SessionID', sql.Int, sessionId)
            .query(`
                UPDATE Payments
                SET Amount = 0,
                    FinalAmount = 0,
                    PrepaidAmount = 0,
                    SurchargeAmount = 0,
                    PaymentStatus = 'Prepaid',
                    PrepaidAt = GETDATE(),
                    PaymentMethod = 'Subscription',
                    CheckoutUrl = 'FREE',
                    OrderCode = 0,
                    PaymentNote = N'Miễn phí hội viên'
                WHERE SessionID = @SessionID
            `);
            
        return {
            qrCode: '',
            checkoutUrl: 'FREE',
            accountNumber: '',
            accountName: '',
            amount: 0,
            baseFee,
            description: 'MIỄN PHÍ HỘI VIÊN',
            orderCode: 0,
            fee: baseFee,
            durationH,
            pricingTable,
            discountPercent,
            planId,
            sessionCount
        };
    }

    const orderCode = makeOrderCode(sessionId);
    const description = `PARK${sessionId}T${Date.now() % 10000}`;

    const FE = process.env.FE_ORIGIN || 'http://localhost:5173';
    const returnUrl = `${FE}/driver/payment-result?sessionId=${sessionId}&status=success`;
    const cancelUrl = `${FE}/driver/payment-result?sessionId=${sessionId}&status=cancel`;
    const expiredAt = Math.floor((Date.now() + 15 * 60 * 1000) / 1000); // 15 phút hết hạn

    const payload = {
        orderCode,
        amount,
        description,
        buyerName: session.DriverName || 'Driver',
        buyerEmail: session.DriverEmail || undefined,
        items: [{
            name: `Phi gui xe - Slot ${session.SlotCode}`,
            quantity: 1,
            price: amount,
        }],
        cancelUrl,
        returnUrl,
        expiredAt,
        signature: makeSignature({ amount, cancelUrl, description, orderCode, returnUrl }),
    };

    // 5. Gọi API của PayOS tạo liên kết thanh toán
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
            const err = new Error(`PayOS lỗi: ${res.data.desc || res.data.code}`);
            err.statusCode = 400; throw err;
        }
        pd = res.data.data;
    } catch (e) {
        if (e.statusCode) throw e;
        const msg = e.response?.data?.desc || e.message;
        throw Object.assign(new Error(`Lỗi kết nối PayOS: ${msg}`), { statusCode: 502 });
    }

    // 6. Lưu vào DB qua Stored Procedure `sp_CreatePrepayment`
    await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .input('OrderCode', sql.BigInt, orderCode)
        .input('Amount', sql.Decimal(10, 2), amount)
        .input('SnapshotH', sql.Decimal(10, 2), durationH)
        .input('QrCode', sql.NVarChar(sql.MAX), pd.qrCode || null)
        .input('CheckoutUrl', sql.NVarChar(500), pd.checkoutUrl || null)
        .execute('sp_CreatePrepayment');

    // 7. Lưu đơn chờ vào RAM Map để Polling
    const expiredMs = expiredAt * 1000;
    pendingOrders.set(orderCode, {
        sessionId, amount, description,
        qrCode: pd.qrCode,
        checkoutUrl: pd.checkoutUrl,
        accountNumber: pd.accountNumber,
        accountName: pd.accountName,
        bankBin: pd.bin,
        status: 'PENDING',
        expiredAt: expiredMs,
    });

    return {
        orderCode,
        amount,
        totalFee,
        prepaidAmount: existingPrepaid,
        baseFee,
        description,
        qrCode: pd.qrCode,
        checkoutUrl: pd.checkoutUrl,
        accountNumber: pd.accountNumber,
        accountName: pd.accountName,
        bankBin: pd.bin,
        currency: 'VND',
        expiredAt: new Date(expiredMs).toISOString(),
        discountPercent,
        planId,
        sessionCount,
        status: 'PENDING',
        pricingTable,
        durationH,
        sessionInfo: {
            sessionId: session.SessionID,
            plateNumber: session.PlateNumber,
            vehicleName: session.VehicleName,
            slotCode: session.SlotCode,
            buildingName: session.BuildingName,
            floorName: session.FloorName,
            zoneName: session.ZoneName,
            entryTime: session.EntryTime,
        },
    };
}

/**
 * HÀM 5: createPaymentServiceByStaff
 * TÁC DỤNG: Khởi tạo mã QR PayOS trực tiếp tại màn hình máy Bảo vệ cho khách gửi xe.
 */
export async function createPaymentServiceByStaff(sessionId) {
    const pool = await getPool();

    const { recordset } = await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .query(`
      SELECT
        ps.SessionID, ps.PlateNumber, ps.EntryTime,
        ps.VehicleTypeID, ps.SessionStatus,
        p.PaymentStatus, p.PrepaidAmount,
        vt.VehicleName, sl.SlotCode,
        b.BuildingName, f.FloorName, z.ZoneName,
        u.FullName AS DriverName, u.Email AS DriverEmail
      FROM ParkingSessions ps
      JOIN Payments     p  ON ps.SessionID     = p.SessionID
      JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
      JOIN ParkingSlots sl ON ps.SlotID        = sl.SlotID
      JOIN Zones        z  ON sl.ZoneID        = z.ZoneID
      JOIN Floors       f  ON z.FloorID        = f.FloorID
      JOIN Buildings    b  ON f.BuildingID     = b.BuildingID
      JOIN Users        u  ON ps.DriverID      = u.UserID
      WHERE ps.SessionID = @SessionID
        AND ps.SessionStatus = 'Active'
    `);

    const session = recordset[0];
    if (!session) {
        const err = new Error('Không tìm thấy phiên đỗ xe đang hoạt động');
        err.statusCode = 404; throw err;
    }
    if (session.PaymentStatus === 'Completed') {
        const err = new Error('Phiên này đã được thanh toán đầy đủ rồi');
        err.statusCode = 400; throw err;
    }

    const { fee: amount, durationH } = await calcFeeV2(pool, session.VehicleTypeID, session.EntryTime);
    const pricingTable = await getPricingTable(pool, session.VehicleTypeID);

    const orderCode = makeOrderCode(sessionId);
    const description = `PARK${sessionId}T${Date.now() % 10000}`;

    const FE = process.env.FE_ORIGIN || 'http://localhost:5173';
    const returnUrl = `${FE}/driver/payment-result?sessionId=${sessionId}&status=success`;
    const cancelUrl = `${FE}/driver/payment-result?sessionId=${sessionId}&status=cancel`;
    const expiredAt = Math.floor((Date.now() + 15 * 60 * 1000) / 1000);

    const payload = {
        orderCode, amount, description,
        buyerName: session.DriverName || 'Driver',
        buyerEmail: session.DriverEmail || undefined,
        items: [{ name: `Phi gui xe - Slot ${session.SlotCode}`, quantity: 1, price: amount }],
        cancelUrl, returnUrl, expiredAt,
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
            const err = new Error(`PayOS lỗi: ${res.data.desc || res.data.code}`);
            err.statusCode = 400; throw err;
        }
        pd = res.data.data;
    } catch (e) {
        if (e.statusCode) throw e;
        const msg = e.response?.data?.desc || e.message;
        throw Object.assign(new Error(`Lỗi kết nối PayOS: ${msg}`), { statusCode: 502 });
    }

    await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .input('OrderCode', sql.BigInt, orderCode)
        .input('Amount', sql.Decimal(10, 2), amount)
        .input('SnapshotH', sql.Decimal(10, 2), durationH)
        .input('QrCode', sql.NVarChar(sql.MAX), pd.qrCode || null)
        .input('CheckoutUrl', sql.NVarChar(500), pd.checkoutUrl || null)
        .execute('sp_CreatePrepayment');

    const expiredMs = expiredAt * 1000;
    pendingOrders.set(orderCode, {
        sessionId, amount, description,
        qrCode: pd.qrCode, checkoutUrl: pd.checkoutUrl,
        accountNumber: pd.accountNumber, accountName: pd.accountName,
        bankBin: pd.bin, status: 'PENDING', expiredAt: expiredMs,
    });

    return {
        orderCode, amount, description,
        qrCode: pd.qrCode, checkoutUrl: pd.checkoutUrl,
        accountNumber: pd.accountNumber, accountName: pd.accountName,
        bankBin: pd.bin, currency: 'VND',
        expiredAt: new Date(expiredMs).toISOString(),
        status: 'PENDING', pricingTable, durationH,
        sessionInfo: {
            sessionId: session.SessionID,
            plateNumber: session.PlateNumber,
            vehicleName: session.VehicleName,
            slotCode: session.SlotCode,
            buildingName: session.BuildingName,
            floorName: session.FloorName,
            zoneName: session.ZoneName,
            entryTime: session.EntryTime,
        },
    };
}

/**
 * HÀM 6: getPaymentStatusService
 * TÁC DỤNG: Tra cứu trạng thái giao dịch thanh toán (Frontend Polling mỗi 3 giây).
 */
export async function getPaymentStatusService(orderCode) {
    const local = pendingOrders.get(orderCode);

    // Nếu bộ nhớ RAM đã xác nhận PAID ➔ Trả về thành công luôn không cần gọi PayOS
    if (local?.status === 'PAID') return { status: 'PAID', orderCode };

    // Gọi API của PayOS tra cứu trạng thái đơn
    let payosStatus = local?.status || 'PENDING';
    try {
        const res = await axios.get(`${PAYOS_BASE_URL}/v2/payment-requests/${orderCode}`, {
            headers: { 'x-client-id': PAYOS_CLIENT_ID, 'x-api-key': PAYOS_API_KEY },
            timeout: 8_000,
        });
        payosStatus = res.data?.data?.status || 'PENDING';
    } catch { /* Mạng lỗi ➔ Dùng tạm status cache */ }

    if (payosStatus === 'PAID') {
        await markPrepaid(orderCode);
        return { status: 'PAID', orderCode };
    }
    if (payosStatus === 'CANCELLED' || payosStatus === 'EXPIRED') {
        return { status: payosStatus, orderCode };
    }

    return { status: 'PENDING', orderCode };
}

/**
 * HÀM 7: handleWebhookService
 * TÁC DỤNG: Xử lý sự kiện Webhook do PayOS tự động gọi sang Backend khi có tiền vào tài khoản.
 */
export async function handleWebhookService(body) {
    // 1. Xác thực chữ ký bảo mật Webhook
    if (!verifyWebhookSignature(body)) {
        const err = new Error('Webhook signature không hợp lệ');
        err.statusCode = 400; throw err;
    }

    const { code, data } = body;
    if (code === '00' && data?.orderCode) {
        const desc = (data.description || '').toUpperCase();

        if (desc.startsWith('TOPUP')) {
            // Nạp tiền ví
            const { handleTopupWebhook } = await import('./walletService.js');
            await handleTopupWebhook(data.orderCode, data.amount);
        } else {
            // Thanh toán đỗ xe (PARK...)
            await markPrepaid(data.orderCode);
        }
    }

    return { received: true };
}

/**
 * HÀM 8: cancelPaymentService
 * TÁC DỤNG: Hủy bỏ đơn thanh toán đỗ xe đang chờ.
 */
export async function cancelPaymentService(orderCode, reason = 'Người dùng huỷ') {
    try {
        await axios.post(
            `${PAYOS_BASE_URL}/v2/payment-requests/${orderCode}/cancel`,
            { cancellationReason: reason },
            {
                headers: {
                    'x-client-id': PAYOS_CLIENT_ID,
                    'x-api-key': PAYOS_API_KEY,
                    'Content-Type': 'application/json',
                },
                timeout: 8_000,
            }
        );
    } catch { /* Bỏ qua nếu PayOS không hủy được */ }

    const order = pendingOrders.get(orderCode);
    if (order) {
        const pool = await getPool();
        await pool.request()
            .input('SessionID', sql.Int, order.sessionId)
            .query(`
        UPDATE Payments
        SET PaymentMethod = 'Pending',
            PaymentStatus = 'Pending',
            OrderCode     = NULL,
            PrepaidAmount = 0
        WHERE SessionID = @SessionID
          AND PaymentStatus IN ('Pending')
      `);
        pendingOrders.delete(orderCode);
    }

    return { cancelled: true };
}

/**
 * HÀM 9: getPaymentHistoryService
 * TÁC DỤNG: Tra cứu lịch sử thanh toán của Tài xế qua Stored Procedure `sp_GetPaymentHistory`.
 */
export async function getPaymentHistoryService(driverId, limit = 20, offset = 0) {
    const pool = await getPool();
    const { recordset } = await pool.request()
        .input('DriverID', sql.Int, driverId)
        .input('Limit', sql.Int, limit)
        .input('Offset', sql.Int, offset)
        .execute('sp_GetPaymentHistory');
    return recordset;
}

/**
 * HÀM 10: staffCheckoutService
 * TÁC DỤNG: Thực hiện Check-out xe tại cổng bãi bởi Bảo vệ (Tính toán phụ phí nếu có).
 */
export async function staffCheckoutService(sessionId, paymentMethod) {
    const pool = await getPool();

    let subDiscountApplied = false;
    let subFinalFee = 0;
    let overrideNote = null;

    // 1. Lấy thông tin phiên đỗ
    const sessionRes = await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .query(`
            SELECT DriverID, VehicleTypeID, EntryTime 
            FROM ParkingSessions 
            WHERE SessionID = @SessionID AND SessionStatus = 'Active'
        `);
    
    if (sessionRes.recordset.length > 0) {
        const { DriverID, VehicleTypeID, EntryTime } = sessionRes.recordset[0];
        
        // 2. Tính phí đỗ xe cơ bản
        const feeRes = await pool.request()
            .input('VehicleTypeID', sql.Int, VehicleTypeID)
            .input('EntryTime', sql.DateTime, EntryTime)
            .input('ExitTime', sql.DateTime, new Date())
            .output('Fee', sql.Decimal(10, 2))
            .output('Breakdown', sql.NVarChar(sql.MAX))
            .execute('sp_CalcParkingFeeV2');
            
        const baseFee = feeRes.output.Fee || 0;
        
        // 3. Áp dụng ưu đãi gói hội viên
        if (DriverID) {
            const { finalFee, planId, discountPercent } = await applySubscriptionDiscount(pool, DriverID, baseFee, sessionId);
            if (finalFee < baseFee) {
                subDiscountApplied = true;
                subFinalFee = finalFee;
                overrideNote = JSON.stringify({
                    type: 'subscription',
                    planId,
                    originalFee: baseFee,
                    finalFee,
                    discountPercent
                });
            }
        }
    }

    // 5. Gọi Stored Procedure sp_CheckOutWithSurcharge hoàn tất check-out
    const request = pool.request();
    request.input('SessionID', sql.Int, sessionId);
    request.input('PaymentMethod', sql.NVarChar(50), subDiscountApplied ? 'Subscription' : paymentMethod);
    if (subDiscountApplied) {
        request.input('OverrideFee', sql.Decimal(10, 2), subFinalFee);
        request.input('OverrideNote', sql.NVarChar(sql.MAX), overrideNote);
    }

    const { recordset } = await request.execute('sp_CheckOutWithSurcharge');

    if (!recordset[0]) {
        const err = new Error('Checkout thất bại'); err.statusCode = 400; throw err;
    }

    if (subDiscountApplied) {
        recordset[0].FinalFee = subFinalFee;
        recordset[0].FinalAmount = subFinalFee;
        recordset[0].Amount = subFinalFee;
        recordset[0].SurchargeAmount = 0;
        recordset[0].paymentMethod = 'Subscription';
    }

    return recordset[0];
}

/**
 * HÀM 11: confirmSurchargeService
 * TÁC DỤNG: Bảo vệ xác nhận thu khoản phụ phí phát sinh (Surcharge) tại cổng.
 */
export async function confirmSurchargeService(sessionId, paymentMethod) {
    const pool = await getPool();
    const { recordset } = await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .input('PaymentMethod', sql.NVarChar(50), paymentMethod)
        .execute('sp_ConfirmSurcharge');

    if (!recordset[0]) {
        const err = new Error('Không tìm thấy khoản phụ trội'); err.statusCode = 404; throw err;
    }
    return recordset[0];
}

/**
 * HÀM PHỤ: markPrepaid
 * TÁC DỤNG: Đánh dấu hóa đơn ở trạng thái đã trả trước `Prepaid` thông qua Stored Procedure `sp_MarkPaymentPrepaid`.
 */
async function markPrepaid(orderCode) {
    try {
        const pool = await getPool();
        const r = await pool.request()
            .input('OrderCode', sql.BigInt, BigInt(orderCode))
            .input('PaidAt', sql.DateTime, new Date())
            .execute('sp_MarkPaymentPrepaid');

        const row = r.recordset[0];
        if (row?.Updated === 1) {
            const local = pendingOrders.get(Number(orderCode));
            if (local) local.status = 'PAID';
            console.log(`✅ Prepaid confirmed: sessionId=${row.SessionID}, amount=${row.PrepaidAmount}`);
        }
    } catch (e) {
        console.error('❌ markPrepaid error:', e.message);
    }
}

/**
 * HÀM 12: getSessionPaymentInfoService
 * TÁC DỤNG: Lấy chi tiết thông tin thanh toán của một phiên đỗ xe.
 */
export async function getSessionPaymentInfoService(sessionId, driverId) {
    const pool = await getPool();
    const { recordset } = await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .input('DriverID', sql.Int, driverId)
        .query(`
      SELECT
        p.PaymentID,
        p.Amount,
        p.PrepaidAmount,
        p.SurchargeAmount,
        p.FinalAmount,
        p.PaymentStatus,
        p.SurchargeStatus,
        p.PrepaidAt,
        p.PaymentTime,
        p.SnapshotDurationH,
        ps.PlateNumber,
        ps.EntryTime,
        ps.ExitTime,
        vt.VehicleName,
        sl.SlotCode,
        z.ZoneName,
        f.FloorName,
        b.BuildingName
      FROM Payments p
      JOIN ParkingSessions ps ON p.SessionID     = ps.SessionID
      JOIN VehicleTypes    vt ON ps.VehicleTypeID = vt.VehicleTypeID
      JOIN ParkingSlots    sl ON ps.SlotID        = sl.SlotID
      JOIN Zones           z  ON sl.ZoneID        = z.ZoneID
      JOIN Floors          f  ON z.FloorID        = f.FloorID
      JOIN Buildings       b  ON f.BuildingID     = b.BuildingID
      WHERE p.SessionID  = @SessionID
        AND ps.DriverID  = @DriverID
    `);
    return recordset[0] || null;
}