// src/services/paymentService.js
import crypto from 'crypto'
import axios from 'axios'
import { getPool, sql } from '../config/db.js'

const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID
const PAYOS_API_KEY = process.env.PAYOS_API_KEY
const PAYOS_CHECKSUM = process.env.PAYOS_CHECKSUM_KEY
const PAYOS_BASE_URL = 'https://api-merchant.payos.vn'

// ── In-memory: orderCode → { sessionId, amount, status, expiredAt } ─
const pendingOrders = new Map()
setInterval(() => {
    const now = Date.now()
    for (const [code, o] of pendingOrders.entries())
        if (o.expiredAt < now) pendingOrders.delete(code)
}, 60_000)

// ── Tạo signature HMAC_SHA256 (sort alphabet theo docs PayOS) ────
function makeSignature({ amount, cancelUrl, description, orderCode, returnUrl }) {
    const raw = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`
    return crypto.createHmac('sha256', PAYOS_CHECKSUM).update(raw).digest('hex')
}

// ── Verify webhook signature ─────────────────────────────────────
export function verifyWebhookSignature(body) {
    try {
        const d = body?.data
        if (!d) return false
        const raw = [
            `accountNumber=${d.accountNumber ?? ''}`,
            `amount=${d.amount ?? ''}`,
            `description=${d.description ?? ''}`,
            `orderCode=${d.orderCode ?? ''}`,
            `reference=${d.reference ?? ''}`,
            `transactionDateTime=${d.transactionDateTime ?? ''}`,
        ].join('&')
        const expected = crypto.createHmac('sha256', PAYOS_CHECKSUM).update(raw).digest('hex')
        return expected === body.signature
    } catch { return false }
}

// ── Tạo orderCode BIGINT an toàn (sessionId + ms suffix) ─────────
function makeOrderCode(sessionId) {
    const suffix = Date.now() % 1_000_000
    return parseInt(`${sessionId}${String(suffix).padStart(6, '0')}`, 10)
}

// ── Tính phí theo bảng PricingPolicies ───────────────────────────
async function calcFee(pool, vehicleTypeId, entryTime) {
    const diffH = Math.max(0.017, (Date.now() - new Date(entryTime).getTime()) / 3_600_000)

    const r = await pool.request()
        .input('VehicleTypeID', sql.Int, vehicleTypeId)
        .input('DurationH', sql.Decimal(10, 2), parseFloat(diffH.toFixed(2)))
        .query(`
      SELECT TOP 1 Fee, MinHours, MaxHours, IsOvernight
      FROM PricingPolicies
      WHERE VehicleTypeID = @VehicleTypeID
        AND IsActive = 1
        AND (
              (IsOvernight = 1 AND @DurationH > 8)
              OR (@DurationH BETWEEN MinHours AND MaxHours)
            )
      ORDER BY IsOvernight DESC, MaxHours
    `)

    const fee = Math.round(Number(r.recordset[0]?.Fee || 2000))
    return { fee: Math.max(2000, fee), durationH: parseFloat(diffH.toFixed(2)) }
}

// ── Lấy toàn bộ bảng phí của 1 loại xe ──────────────────────────
async function getPricingTable(pool, vehicleTypeId) {
    const r = await pool.request()
        .input('VehicleTypeID', sql.Int, vehicleTypeId)
        .query(`
      SELECT MinHours, MaxHours, Fee, IsOvernight
      FROM PricingPolicies
      WHERE VehicleTypeID = @VehicleTypeID AND IsActive = 1
      ORDER BY IsOvernight, MinHours
    `)
    return r.recordset
}

// =================================================================
// SERVICE 1: Lấy danh sách session Active của driver (hiển thị ở trang chọn xe)
// =================================================================
export async function getActiveSessionsService(driverId) {
    const pool = await getPool()
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
    `)
    return recordset
}

// =================================================================
// SERVICE 2: Tạo link thanh toán PayOS (driver bấm "Tạo QR")
// =================================================================
export async function createPaymentService(sessionId, driverId) {
    const pool = await getPool()

    // Lấy thông tin session + driver
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
    `)

    const session = recordset[0]
    if (!session) {
        const err = new Error('Không tìm thấy phiên đỗ xe đang hoạt động')
        err.statusCode = 404; throw err
    }
    if (session.PaymentStatus === 'Completed') {
        const err = new Error('Phiên này đã được thanh toán đầy đủ rồi')
        err.statusCode = 400; throw err
    }

    // Tính phí hiện tại + lấy bảng giá
    const { fee: amount, durationH } = await calcFee(pool, session.VehicleTypeID, session.EntryTime)
    const pricingTable = await getPricingTable(pool, session.VehicleTypeID)

    const orderCode = makeOrderCode(sessionId)
    // description tối đa 25 ký tự, KHÔNG có ký tự đặc biệt
    const description = `PARK${sessionId}T${Date.now() % 10000}`

    const FE = process.env.FE_ORIGIN || 'http://localhost:5173'
    const returnUrl = `${FE}/driver/payment-result?sessionId=${sessionId}&status=success`
    const cancelUrl = `${FE}/driver/payment-result?sessionId=${sessionId}&status=cancel`
    const expiredAt = Math.floor((Date.now() + 15 * 60 * 1000) / 1000) // 15 phút

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
    }

    // Gọi PayOS API
    let pd
    try {
        const res = await axios.post(`${PAYOS_BASE_URL}/v2/payment-requests`, payload, {
            headers: {
                'x-client-id': PAYOS_CLIENT_ID,
                'x-api-key': PAYOS_API_KEY,
                'Content-Type': 'application/json',
            },
            timeout: 15_000,
        })
        if (res.data.code !== '00') {
            const err = new Error(`PayOS lỗi: ${res.data.desc || res.data.code}`)
            err.statusCode = 400; throw err
        }
        pd = res.data.data
    } catch (e) {
        if (e.statusCode) throw e
        const msg = e.response?.data?.desc || e.message
        throw Object.assign(new Error(`Lỗi kết nối PayOS: ${msg}`), { statusCode: 502 })
    }

    // Lưu vào DB qua SP
    await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .input('OrderCode', sql.BigInt, orderCode)
        .input('Amount', sql.Decimal(10, 2), amount)
        .input('SnapshotH', sql.Decimal(10, 2), durationH)
        .input('QrCode', sql.NVarChar(sql.MAX), pd.qrCode || null)
        .input('CheckoutUrl', sql.NVarChar(500), pd.checkoutUrl || null)
        .execute('sp_CreatePrepayment')

    // Cache in-memory cho polling
    const expiredMs = expiredAt * 1000
    pendingOrders.set(orderCode, {
        sessionId, amount, description,
        qrCode: pd.qrCode,
        checkoutUrl: pd.checkoutUrl,
        accountNumber: pd.accountNumber,
        accountName: pd.accountName,
        bankBin: pd.bin,
        status: 'PENDING',
        expiredAt: expiredMs,
    })

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
        pricingTable,          // ← bảng giá in ra FE
        durationH,             // ← số giờ snapshot
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
    }
}
export async function createPaymentServiceByStaff(sessionId) {
    const pool = await getPool()

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
    `)

    const session = recordset[0]
    if (!session) {
        const err = new Error('Không tìm thấy phiên đỗ xe đang hoạt động')
        err.statusCode = 404; throw err
    }
    if (session.PaymentStatus === 'Completed') {
        const err = new Error('Phiên này đã được thanh toán đầy đủ rồi')
        err.statusCode = 400; throw err
    }

    const { fee: amount, durationH } = await calcFee(pool, session.VehicleTypeID, session.EntryTime)
    const pricingTable = await getPricingTable(pool, session.VehicleTypeID)

    const orderCode = makeOrderCode(sessionId)
    const description = `PARK${sessionId}T${Date.now() % 10000}`

    const FE = process.env.FE_ORIGIN || 'http://localhost:5173'
    const returnUrl = `${FE}/driver/payment-result?sessionId=${sessionId}&status=success`
    const cancelUrl = `${FE}/driver/payment-result?sessionId=${sessionId}&status=cancel`
    const expiredAt = Math.floor((Date.now() + 15 * 60 * 1000) / 1000)

    const payload = {
        orderCode, amount, description,
        buyerName: session.DriverName || 'Driver',
        buyerEmail: session.DriverEmail || undefined,
        items: [{ name: `Phi gui xe - Slot ${session.SlotCode}`, quantity: 1, price: amount }],
        cancelUrl, returnUrl, expiredAt,
        signature: makeSignature({ amount, cancelUrl, description, orderCode, returnUrl }),
    }

    let pd
    try {
        const res = await axios.post(`${PAYOS_BASE_URL}/v2/payment-requests`, payload, {
            headers: {
                'x-client-id': PAYOS_CLIENT_ID,
                'x-api-key': PAYOS_API_KEY,
                'Content-Type': 'application/json',
            },
            timeout: 15_000,
        })
        if (res.data.code !== '00') {
            const err = new Error(`PayOS lỗi: ${res.data.desc || res.data.code}`)
            err.statusCode = 400; throw err
        }
        pd = res.data.data
    } catch (e) {
        if (e.statusCode) throw e
        const msg = e.response?.data?.desc || e.message
        throw Object.assign(new Error(`Lỗi kết nối PayOS: ${msg}`), { statusCode: 502 })
    }

    await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .input('OrderCode', sql.BigInt, orderCode)
        .input('Amount', sql.Decimal(10, 2), amount)
        .input('SnapshotH', sql.Decimal(10, 2), durationH)
        .input('QrCode', sql.NVarChar(sql.MAX), pd.qrCode || null)
        .input('CheckoutUrl', sql.NVarChar(500), pd.checkoutUrl || null)
        .execute('sp_CreatePrepayment')

    const expiredMs = expiredAt * 1000
    pendingOrders.set(orderCode, {
        sessionId, amount, description,
        qrCode: pd.qrCode, checkoutUrl: pd.checkoutUrl,
        accountNumber: pd.accountNumber, accountName: pd.accountName,
        bankBin: pd.bin, status: 'PENDING', expiredAt: expiredMs,
    })

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
    }
}
// =================================================================
// SERVICE 3: Poll trạng thái (FE gọi mỗi 3s)
// =================================================================
export async function getPaymentStatusService(orderCode) {
    const local = pendingOrders.get(orderCode)

    // Đã xác nhận PAID trong memory → không cần hỏi PayOS
    if (local?.status === 'PAID') return { status: 'PAID', orderCode }

    // Hỏi PayOS
    let payosStatus = local?.status || 'PENDING'
    try {
        const res = await axios.get(`${PAYOS_BASE_URL}/v2/payment-requests/${orderCode}`, {
            headers: { 'x-client-id': PAYOS_CLIENT_ID, 'x-api-key': PAYOS_API_KEY },
            timeout: 8_000,
        })
        payosStatus = res.data?.data?.status || 'PENDING'
    } catch { /* mạng lỗi → dùng cache */ }

    if (payosStatus === 'PAID') {
        await markPrepaid(orderCode)
        return { status: 'PAID', orderCode }
    }
    if (payosStatus === 'CANCELLED' || payosStatus === 'EXPIRED') {
        return { status: payosStatus, orderCode }
    }

    return { status: 'PENDING', orderCode }
}

// =================================================================
// SERVICE 4: Xử lý webhook từ PayOS
// =================================================================
export async function handleWebhookService(body) {
    if (!verifyWebhookSignature(body)) {
        const err = new Error('Webhook signature không hợp lệ')
        err.statusCode = 400; throw err
    }

    const { code, data } = body
    if (code === '00' && data?.orderCode) {
        await markPrepaid(data.orderCode)
    }

    return { received: true }
}

// =================================================================
// SERVICE 5: Huỷ đơn
// =================================================================
export async function cancelPaymentService(orderCode, reason = 'Người dùng huỷ') {
    // Gọi PayOS cancel (best-effort)
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
        )
    } catch { /* bỏ qua */ }

    const order = pendingOrders.get(orderCode)
    if (order) {
        const pool = await getPool()
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
      `)
        pendingOrders.delete(orderCode)
    }

    return { cancelled: true }
}

// =================================================================
// SERVICE 6: Lịch sử thanh toán của driver
// =================================================================
export async function getPaymentHistoryService(driverId, limit = 20, offset = 0) {
    const pool = await getPool()
    const { recordset } = await pool.request()
        .input('DriverID', sql.Int, driverId)
        .input('Limit', sql.Int, limit)
        .input('Offset', sql.Int, offset)
        .execute('sp_GetPaymentHistory')
    return recordset
}

// =================================================================
// SERVICE 7: Staff checkout (tính phí thực tế + surcharge)
// =================================================================
export async function staffCheckoutService(sessionId, paymentMethod) {
    const pool = await getPool()
    const { recordset } = await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .input('PaymentMethod', sql.NVarChar(50), paymentMethod)
        .execute('sp_CheckOutWithSurcharge')

    if (!recordset[0]) {
        const err = new Error('Checkout thất bại'); err.statusCode = 400; throw err
    }
    return recordset[0]
}

// =================================================================
// SERVICE 8: Staff xác nhận thu tiền phụ trội
// =================================================================
export async function confirmSurchargeService(sessionId, paymentMethod) {
    const pool = await getPool()
    const { recordset } = await pool.request()
        .input('SessionID', sql.Int, sessionId)
        .input('PaymentMethod', sql.NVarChar(50), paymentMethod)
        .execute('sp_ConfirmSurcharge')

    if (!recordset[0]) {
        const err = new Error('Không tìm thấy khoản phụ trội'); err.statusCode = 404; throw err
    }
    return recordset[0]
}

// =================================================================
// INTERNAL: Đánh dấu Prepaid (webhook / poll xác nhận)
// Session vẫn Active — xe chưa ra, chỉ ghi nhận đã trả tiền
// =================================================================
async function markPrepaid(orderCode) {
    try {
        const pool = await getPool()
        const r = await pool.request()
            .input('OrderCode', sql.BigInt, BigInt(orderCode))
            .input('PaidAt', sql.DateTime, new Date())
            .execute('sp_MarkPaymentPrepaid')

        const row = r.recordset[0]
        if (row?.Updated === 1) {
            // Cập nhật cache
            const local = pendingOrders.get(Number(orderCode))
            if (local) local.status = 'PAID'
            console.log(`✅ Prepaid confirmed: sessionId=${row.SessionID}, amount=${row.PrepaidAmount}`)
        }
    } catch (e) {
        console.error('❌ markPrepaid error:', e.message)
    }
}
export async function getSessionPaymentInfoService(sessionId, driverId) {
    const pool = await getPool()
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
    `)
    return recordset[0] || null
}