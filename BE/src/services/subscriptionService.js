import crypto from 'crypto';
import axios from 'axios';
import { getPool, sql } from "../config/db.js";

const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
const PAYOS_CHECKSUM = process.env.PAYOS_CHECKSUM_KEY;
const PAYOS_BASE_URL = 'https://api-merchant.payos.vn';

// Discount table (matching FE)
const discountMap = { 1: 0, 3: 5, 6: 10, 9: 15, 12: 20 };

function makeSignature({ amount, cancelUrl, description, orderCode, returnUrl }) {
    const raw = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    return crypto.createHmac('sha256', PAYOS_CHECKSUM).update(raw).digest('hex');
}

function makeOrderCode(userId) {
    const suffix = Date.now() % 1_000_000;
    return parseInt(`${userId}${String(suffix).padStart(6, '0')}`, 10);
}

// In-memory pending orders for subscription
const pendingSubOrders = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [code, o] of pendingSubOrders.entries())
        if (o.expiredAt < now) pendingSubOrders.delete(code);
}, 60_000);

export const subscriptionService = {
  getPlans: async () => {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT PlanID as id, Name as name, BasePrice as basePrice, Description as description
      FROM SubscriptionPlans
      WHERE IsActive = 1
    `);
    return result.recordset;
  },

  getMyStatus: async (userId) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("UserID", sql.Int, userId)
      .query(`
        SELECT top 1
          s.UserSubscriptionID,
          s.PlanID as planId,
          p.Name as planName,
          s.StartDate as startDate,
          s.EndDate as endDate,
          s.Status as active
        FROM UserSubscriptions s
        JOIN SubscriptionPlans p ON s.PlanID = p.PlanID
        WHERE s.UserID = @UserID AND s.Status = 'Active'
        ORDER BY s.EndDate DESC
      `);
    return result.recordset[0] || null;
  },

  // Create a PayOS payment link for subscription
  createPayment: async (userId, planId, durationMonths) => {
    const pool = await getPool();
    
    // Validate plan
    const planResult = await pool.request()
      .input("PlanID", sql.NVarChar, planId)
      .query("SELECT * FROM SubscriptionPlans WHERE PlanID = @PlanID AND IsActive = 1");
      
    if (planResult.recordset.length === 0) {
        const error = new Error("Gói hội viên không tồn tại hoặc đã ngừng cung cấp");
        error.statusCode = 400;
        throw error;
    }

    const plan = planResult.recordset[0];
    
    // Get user info
    const userResult = await pool.request()
      .input("UserID", sql.Int, userId)
      .query("SELECT FullName, Email FROM Users WHERE UserID = @UserID");
    const user = userResult.recordset[0];

    // Calculate amount with discount
    const discountPercent = discountMap[durationMonths] || 0;
    const totalBase = plan.BasePrice * durationMonths;
    const amount = Math.round(totalBase * (1 - discountPercent / 100));

    const orderCode = makeOrderCode(userId);
    // PayOS description: max 25 chars, English letters/numbers only, no spaces or special chars if possible (spaces are sometimes allowed, but safer without accents)
    const description = `MUA GOI ${planId.toUpperCase()} ${durationMonths} T`;

    const FE = process.env.FE_ORIGIN || 'http://localhost:5173';
    const returnUrl = `${FE}/driver/subscription?status=success`;
    const cancelUrl = `${FE}/driver/subscription?status=cancel`;
    const expiredAt = Math.floor((Date.now() + 15 * 60 * 1000) / 1000); // 15 min

    const payload = {
        orderCode,
        amount,
        description,
        buyerName: user?.FullName || 'Driver',
        buyerEmail: user?.Email || undefined,
        items: [{
            name: `Goi ${plan.Name} - ${durationMonths} thang`,
            quantity: 1,
            price: amount,
        }],
        cancelUrl,
        returnUrl,
        expiredAt,
        signature: makeSignature({ amount, cancelUrl, description, orderCode, returnUrl }),
    };

    // Call PayOS
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

    // Cache for polling
    const expiredMs = expiredAt * 1000;
    pendingSubOrders.set(orderCode, {
        userId, planId, durationMonths, amount,
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
        planName: plan.Name,
        durationMonths,
        discountPercent,
    };
  },

  // Polling helper
  checkStatus: async (orderCode) => {
    try {
        const res = await axios.get(`${PAYOS_BASE_URL}/v2/payment-requests/${orderCode}`, {
            headers: {
                'x-client-id': PAYOS_CLIENT_ID,
                'x-api-key': PAYOS_API_KEY,
                'Content-Type': 'application/json',
            },
            timeout: 5_000,
        });
        return { status: res.data?.data?.status || 'PENDING' };
    } catch (e) {
        return { status: 'PENDING' };
    }
  },

  // Confirm subscription after payment (manual verification)
  subscribe: async (userId, orderCode) => {
    // 1. Validate pending order
    const order = pendingSubOrders.get(Number(orderCode));
    if (!order || order.userId !== userId) {
        const error = new Error("Mã thanh toán không tồn tại, đã hết hạn hoặc không thuộc về bạn");
        error.statusCode = 400;
        throw error;
    }

    // 2. Check PayOS status
    try {
        const res = await axios.get(`${PAYOS_BASE_URL}/v2/payment-requests/${orderCode}`, {
            headers: {
                'x-client-id': PAYOS_CLIENT_ID,
                'x-api-key': PAYOS_API_KEY,
                'Content-Type': 'application/json',
            },
            timeout: 10_000,
        });
        
        if (res.data.code !== '00') {
             throw new Error(`PayOS error: ${res.data.desc}`);
        }
        
        const pd = res.data.data;
        if (pd.status !== 'PAID') {
            const error = new Error("Giao dịch chưa được thanh toán thành công. Vui lòng quét mã và chuyển khoản.");
            error.statusCode = 400;
            throw error;
        }
    } catch (e) {
         if (e.statusCode) throw e;
         const msg = e.response?.data?.desc || e.message;
         throw Object.assign(new Error(`Lỗi kiểm tra trạng thái PayOS: ${msg}`), { statusCode: 502 });
    }

    // 3. Success, clear pending order
    pendingSubOrders.delete(Number(orderCode));
    const { planId, durationMonths } = order;

    const pool = await getPool();
    const resultStatus = await pool.request()
      .input("UserID", sql.Int, userId)
      .query(`
        SELECT top 1 EndDate 
        FROM UserSubscriptions 
        WHERE UserID = @UserID AND Status = 'Active'
        ORDER BY EndDate DESC
      `);
      
    let startDate = new Date();
    if (resultStatus.recordset.length > 0) {
        const currentEnd = new Date(resultStatus.recordset[0].EndDate);
        if (currentEnd > startDate) {
            startDate = currentEnd;
        }
    }
    
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const result = await pool.request()
      .input("UserID", sql.Int, userId)
      .input("PlanID", sql.NVarChar, planId)
      .input("StartDate", sql.DateTime, startDate)
      .input("EndDate", sql.DateTime, endDate)
      .input("AmountPaid", sql.Decimal(10, 2), order.amount || 0)
      .query(`
        INSERT INTO UserSubscriptions (UserID, PlanID, StartDate, EndDate, AmountPaid, Status)
        OUTPUT inserted.UserSubscriptionID
        VALUES (@UserID, @PlanID, @StartDate, @EndDate, @AmountPaid, 'Active')
      `);

    return {
        success: true,
        userSubscriptionId: result.recordset[0].UserSubscriptionID,
        startDate,
        endDate
    };
  }
};
