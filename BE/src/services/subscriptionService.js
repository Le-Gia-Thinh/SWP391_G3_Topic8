/**
 * FILE: subscriptionService.js
 * MÔ TẢ: Service quản lý Đăng ký, Gia hạn & Nâng cấp Gói hội viên (Subscriptions / Vé tháng).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Danh mục gói hội viên (`SubscriptionPlans`): Xem chi tiết các gói đỗ xe ưu đãi theo tháng (Gói Vé Tháng, Gói Ưu Đãi VIP...).
 * 2. Bảng Giảm Giá Đa Tháng (`discountMap`): Tự động giảm % cước dịch vụ theo số tháng đăng ký (1 tháng 0%, 3 tháng 5%, 6 tháng 10%, 12 tháng 20%, 24 tháng 30%).
 * 3. Tích hợp thanh toán PayOS QR (`createPayment`, `checkStatus`): Sinh mã HMAC SHA256 bảo mật và tạo đơn chờ thanh toán trong bộ nhớ Cache In-Memory `pendingSubOrders`.
 * 4. LOGIC GIA HẠN / NÂNG CẤP DÙNG SQL TRANSACTION:
 *    - GIA HẠN (Cùng Gói): Tự động cộng dồn ngày kết thúc nối tiếp từ hạn cũ (`endDate.setMonth(...)`).
 *    - NÂNG CẤP (Khác Gói): Chuyển trạng thái gói cũ thành `'Upgraded'`, kết thúc gói cũ ngay lập tức và kích hoạt gói mới từ hôm nay.
 * 5. Tự động kiểm tra xe mặc định (`DriverVehicles.IsDefault`) để gợi ý tài xế gán quyền lợi vé tháng cho biển số xe cụ thể.
 * 
 * @module subscriptionService
 */

import crypto from 'crypto';
import axios from 'axios';
import { getPool, sql } from "../config/db.js";

// Đọc cấu hình biến môi trường kết nối Cổng thanh toán PayOS
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
const PAYOS_CHECKSUM = process.env.PAYOS_CHECKSUM_KEY;
const PAYOS_BASE_URL = 'https://api-merchant.payos.vn';

// Bảng cấu hình giảm giá theo số tháng đăng ký cước (Month Duration Discount Lookup Table)
const discountMap = { 1: 0, 2: 2, 3: 5, 6: 10, 9: 15, 12: 20, 24: 30 };

/**
 * HÀM PHỤ: makeSignature
 * TÁC DỤNG: Sinh mã chữ ký số bảo mật HMAC SHA256 gửi sang PayOS để chứng minh tính toàn vẹn của dữ liệu giao dịch.
 */
function makeSignature({ amount, cancelUrl, description, orderCode, returnUrl }) {
    const raw = `amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    return crypto.createHmac('sha256', PAYOS_CHECKSUM).update(raw).digest('hex');
}

/**
 * HÀM PHỤ: makeOrderCode
 * TÁC DỤNG: Sinh mã đơn hàng duy nhất dạng số nguyên dựa trên UserID + Timestamp.
 */
function makeOrderCode(userId) {
    const suffix = Date.now() % 1_000_000;
    return parseInt(`${userId}${String(suffix).padStart(6, '0')}`, 10);
}

// BỘ NHỚ LƯU TRỮ ĐƠN HÀNG CHỜ TRONG RAM (In-Memory Map for Pending Subscription Orders)
const pendingSubOrders = new Map();

// Tự động dọn dẹp các đơn hàng quá hạn (Expired > 15 phút) mỗi 60 giây một lần
setInterval(() => {
    const now = Date.now();
    for (const [code, o] of pendingSubOrders.entries())
        if (o.expiredAt < now) pendingSubOrders.delete(code);
}, 60_000);

export const subscriptionService = {
  /**
   * HÀM 1: getPlans
   * TÁC DỤNG: Lấy danh sách các gói hội viên đang hoạt động trong hệ thống.
   * 
   * @returns {Promise<Array<Object>>} Mảng thông tin các gói dịch vụ
   */
  getPlans: async () => {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT PlanID as id, Name as name, BasePrice as basePrice, Description as description
      FROM SubscriptionPlans
      WHERE IsActive = 1
    `);
    return result.recordset;
  },

  /**
   * HÀM 2: getMyStatus
   * TÁC DỤNG: Kiểm tra trạng thái gói hội viên hiện tại của Tài xế.
   * 
   * @param {number} userId - ID người dùng
   * @returns {Promise<Object|null>} Thông tin gói đang hoạt động hoặc null
   */
  getMyStatus: async (userId) => {
    const pool = await getPool();
    const result = await pool.request()
      .input("UserID", sql.Int, userId)
      .query(`
        SELECT top 1
          s.UserSubscriptionID,
          s.PlanID as planId,
          p.Name as planName,
          p.BasePrice as basePrice,
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

  /**
   * HÀM 3: createPayment
   * TÁC DỤNG: Khởi tạo liên kết thanh toán QR qua PayOS để mua/gia hạn gói hội viên.
   * 
   * @param {number} userId - ID tài xế
   * @param {string} planId - ID gói đăng ký (vd: 'monthly')
   * @param {number} durationMonths - Số tháng đăng ký (1, 3, 6, 12, 24)
   * @param {number} deductionAmount - Số tiền được trừ từ gói cũ (khi nâng cấp)
   * @param {number} excessValue - Giá trị thừa
   * @param {number} extraDays - Số ngày tặng thêm
   * @returns {Promise<Object>} Thông tin mã QR PayOS và thông tin đơn hàng
   */
  createPayment: async (userId, planId, durationMonths, deductionAmount = 0, excessValue = 0, extraDays = 0) => {
    const pool = await getPool();
    
    // 1. Kiểm tra gói hội viên có tồn tại và đang hoạt động không
    const planResult = await pool.request()
      .input("PlanID", sql.NVarChar, planId)
      .query("SELECT * FROM SubscriptionPlans WHERE PlanID = @PlanID AND IsActive = 1");
      
    if (planResult.recordset.length === 0) {
        const error = new Error("Gói hội viên không tồn tại hoặc đã ngừng cung cấp");
        error.statusCode = 400;
        throw error;
    }

    const plan = planResult.recordset[0];
    
    // 2. Lấy thông tin Tài xế
    const userResult = await pool.request()
      .input("UserID", sql.Int, userId)
      .query("SELECT FullName, Email FROM Users WHERE UserID = @UserID");
    const user = userResult.recordset[0];

    // 3. TÍNH TOÁN TỔNG TIỀN SAU GIẢM GIÁ (Discount & Deduction Calculation):
    const discountPercent = discountMap[durationMonths] || 0;
    const totalBase = plan.BasePrice * durationMonths;
    let amount = Math.round(totalBase * (1 - discountPercent / 100));
    
    // Khấu trừ tiền dư từ gói cũ nếu có
    if (deductionAmount > 0) {
        amount = Math.max(0, amount - deductionAmount);
    }

    const orderCode = makeOrderCode(userId);
    const description = `MUA GOI ${planId.toUpperCase()} ${durationMonths} T`;

    const FE = process.env.FE_ORIGIN || 'http://localhost:5173';
    const returnUrl = `${FE}/driver/subscription?status=success`;
    const cancelUrl = `${FE}/driver/subscription?status=cancel`;
    const expiredAt = Math.floor((Date.now() + 15 * 60 * 1000) / 1000); // Đơn hàng hết hạn sau 15 phút

    // Đóng gói Payload gửi sang PayOS API
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

    // 4. Gọi API của PayOS tạo liên kết thanh toán
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

    // 5. Lưu thông tin đơn chờ vào RAM Map
    const expiredMs = expiredAt * 1000;
    pendingSubOrders.set(orderCode, {
        userId, planId, durationMonths, amount,
        extraDays,
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

  /**
   * HÀM 4: checkStatus
   * TÁC DỤNG: Tra cứu trạng thái giao dịch thanh toán từ Server PayOS (Phục vụ Frontend Polling).
   */
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

  /**
   * HÀM 5: subscribe
   * TÁC DỤNG: Xác nhận kích hoạt gói hội viên sau khi chuyển khoản PayOS thành công.
   * KỸ THUẬT: Dùng SQL Transaction xử lý gia hạn nối tiếp hoặc nâng cấp gói mới.
   */
  subscribe: async (userId, orderCode) => {
    // 1. Kiểm tra đơn hàng chờ trong RAM Cache
    const order = pendingSubOrders.get(Number(orderCode));
    if (!order || order.userId !== userId) {
        const error = new Error("Mã thanh toán không tồn tại, đã hết hạn hoặc không thuộc về bạn");
        error.statusCode = 400;
        throw error;
    }

    // 2. Xác minh lại với PayOS Server xem tiền đã về thực sự chưa (`PAID`)
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

    // 3. Tiền đã về ➔ Xóa đơn hàng chờ khỏi RAM Cache
    pendingSubOrders.delete(Number(orderCode));
    const { planId, durationMonths } = order;

    const pool = await getPool();
    // Lấy gói active cũ của tài xế để tính toán gia hạn hoặc nâng cấp
    const resultStatus = await pool.request()
      .input("UserID", sql.Int, userId)
      .query(`
        SELECT top 1 UserSubscriptionID, PlanID, EndDate 
        FROM UserSubscriptions 
        WHERE UserID = @UserID AND Status = 'Active'
        ORDER BY EndDate DESC
      `);
      
    let startDate = new Date();
    let oldSubId = null;
    let oldPlanId = null;

    if (resultStatus.recordset.length > 0) {
        const row = resultStatus.recordset[0];
        oldSubId = row.UserSubscriptionID;
        oldPlanId = row.PlanID;
        const currentEnd = new Date(row.EndDate);
        
        // NẾU GIA HẠN CÙNG GÓI ➔ Ngày bắt đầu gói mới được tính nối tiếp từ EndDate của gói cũ
        if (oldPlanId === planId) {
            if (currentEnd > startDate) {
                startDate = currentEnd;
            }
        } 
        // NẾU NÂNG CẤP KHÁC GÓI ➔ Bắt đầu ngay hôm nay
    }
    
    // Tính ngày kết thúc mới
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    if (order.extraDays) {
        endDate.setDate(endDate.getDate() + order.extraDays);
    }

    // MỞ GIAO DỊCH SQL TRANSACTION:
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        // A. Nếu là NÂNG CẤP (khác gói cũ) ➔ Hủy gói cũ, đổi Status thành 'Upgraded'
        if (oldSubId && oldPlanId !== planId) {
            await new sql.Request(transaction)
              .input("OldSubID", sql.Int, oldSubId)
              .query(`
                UPDATE UserSubscriptions 
                SET Status = 'Upgraded', EndDate = GETDATE() 
                WHERE UserSubscriptionID = @OldSubID
              `);
        }

        // B. Tạo bản ghi gói hội viên mới có Status = 'Active'
        const result = await new sql.Request(transaction)
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
          
        await transaction.commit();

        // C. TỰ ĐỘNG THÔNG BÁO THIẾT LẬP XE MẶC ĐỊNH NẾU CHƯA CÓ
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

        return {
            success: true,
            userSubscriptionId: result.recordset[0].UserSubscriptionID,
            startDate,
            endDate
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
  }
};

