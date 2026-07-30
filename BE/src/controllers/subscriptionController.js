/**
 * FILE: subscriptionController.js
 * MÔ TẢ: Controller quản lý Đăng ký và Thanh toán Vé tháng / Gói hội viên đỗ xe (Subscription Plans) dành cho Tài xế.
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. `getPlans`: Liệt kê các gói dịch vụ gia hạn vé tháng sẵn có (Gói Tháng, Gói Quý, Gói Năm).
 * 2. `getMyStatus`: Tra cứu thông tin gói vé tháng hiện tại đang có hiệu lực của Tài xế.
 * 3. `createPayment`: Sinh mã đơn PayOS (OrderCode) và đường dẫn thanh toán mã QR VietQR dựa trên gói dịch vụ tài xế chọn.
 * 4. `checkStatus`: Cơ chế Polling từ Client để liên tục kiểm tra xem tiền chuyển khoản đã nộp vào PayOS chưa.
 * 5. `subscribe`: Xác nhận hoàn tất và kích hoạt thời hạn gói vé tháng trong cơ sở dữ liệu (`UserSubscriptions`).
 */

// Import enum `StatusCodes` chuẩn quốc tế từ thư viện `http-status-codes`
import { StatusCodes } from "http-status-codes";
// Import đối tượng service `subscriptionService` từ 'BE/src/services/subscriptionService.js'
// LIÊN KẾT FILE: `BE/src/services/subscriptionService.js` - Xử lý tính toán ngày hết hạn, tạo QR PayOS và lưu lịch sử gói hội viên.
import { subscriptionService } from "../services/subscriptionService.js";

/**
 * ĐỐI TƯỢNG CONTROLLER: subscriptionController
 * Chứa tập hợp các phương thức (Methods) dạng Arrow Async Function.
 */
export const subscriptionController = {
  /** 
   * HÀM 1: getPlans
   * TÁC DỤNG: Lấy danh sách tất cả các gói dịch vụ vé tháng đang hoạt động.
   * 
   * @route GET /api/driver/subscriptions/plans 
   * @access Driver Only (Dành cho tài xế)
   */
  getPlans: async (req, res, next) => {
    try {
      // GỌI TẦNG SERVICE: Truy vấn mảng các gói hội viên từ bảng SubscriptionPlans
      // LIÊN KẾT: Gọi `subscriptionService.getPlans()` trong `BE/src/services/subscriptionService.js`.
      const plans = await subscriptionService.getPlans();
      
      // PHẢN HỒI HTTP 200 (OK): Đóng gói danh sách gói dịch vụ gửi về Client
      return res.status(StatusCodes.OK).json({
        success: true,
        data: plans
      });
    } catch (err) {
      // KHỐI CATCH BẮT LỖI: Chuyển lỗi sang Middleware xử lý lỗi tập trung bằng `next(err)`
      next(err);
    }
  },

  /** 
   * HÀM 2: getMyStatus
   * TÁC DỤNG: Kiểm tra trạng thái và ngày hết hạn của gói vé tháng hiện tại mà tài xế đang sở hữu.
   * 
   * @route GET /api/driver/subscriptions/my-status 
   * @access Driver Only
   */
  getMyStatus: async (req, res, next) => {
    try {
      // Lấy UserID tài xế từ Token JWT trong `req.user`
      const userId = req.user.UserID;
      // Gọi service tra cứu gói active hiện tại trong bảng UserSubscriptions
      const status = await subscriptionService.getMyStatus(userId);
      // Trả về kết quả thông tin trạng thái vé tháng
      return res.status(StatusCodes.OK).json({
        success: true,
        data: status
      });
    } catch (err) {
      next(err);
    }
  },

  /** 
   * HÀM 3: checkStatus
   * TÁC DỤNG: Kiểm tra trạng thái đơn thanh toán PayOS theo mã đơn `orderCode` (Phục vụ Client gọi Polling kiểm tra tự động).
   * 
   * THUẬT NGỮ:
   * - `Polling`: Cơ chế Client chủ động gửi request kiểm tra định kỳ (ví dụ mỗi 3 giây/lần) để xem giao dịch ngân hàng đã thành công chưa.
   * 
   * @route GET /api/driver/subscriptions/status/:orderCode 
   * @access Driver Only
   */
  checkStatus: async (req, res, next) => {
    try {
      // CÚ PHÁP DESTRUCTURING: Lấy biến `orderCode` từ tham số đường dẫn URL (`req.params`)
      const { orderCode } = req.params;
      // Gọi service kết nối tới PayOS API kiểm tra số tiền đã về tài khoản chưa
      const result = await subscriptionService.checkStatus(orderCode);
      return res.status(StatusCodes.OK).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  /** 
   * HÀM 4: createPayment
   * TÁC DỤNG: Tạo giao dịch thanh toán mua vé tháng mới. Sinh ra Mã đơn (OrderCode), Mã QR VietQR và Đường dẫn thanh toán.
   * 
   * @route POST /api/driver/subscriptions/create-payment 
   * @access Driver Only
   */
  createPayment: async (req, res, next) => {
    try {
      // Lấy UserID tài xế từ JWT Token
      const userId = req.user.UserID;
      // CÚ PHÁP DESTRUCTURING: Lấy các thông số chọn gói từ req.body
      const { planId, durationMonths, deductionAmount, excessValue, extraDays } = req.body;
      
      // VALIDATION: Kiểm tra xem tài xế đã chọn gói (planId) và số tháng muốn mua (durationMonths) chưa
      if (!planId || !durationMonths) {
        // Trả về HTTP Status Code 400 (Bad Request - Thiếu thông tin bắt buộc)
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Vui lòng cung cấp gói và thời hạn"
        });
      }

      // GỌI SERVICE TÍNH TOÁN TIỀN VÀ SINH LINK QR PAYOS:
      const result = await subscriptionService.createPayment(
          userId, planId, durationMonths, deductionAmount || 0, excessValue || 0, extraDays || 0
      );
      
      // PHẢN HỒI HTTP 200 (OK): Trả về link checkout PayOS và dữ liệu QR Code cho ứng dụng
      return res.status(StatusCodes.OK).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  /** 
   * HÀM 5: subscribe
   * TÁC DỤNG: Kích hoạt vé tháng sau khi xác nhận chuyển khoản ngân hàng thành công qua mã đơn orderCode.
   * 
   * @route POST /api/driver/subscriptions/subscribe 
   * @access Driver Only
   */
  subscribe: async (req, res, next) => {
    try {
      const userId = req.user.UserID;
      const { orderCode } = req.body;
      
      // VALIDATION: Bắt buộc phải có mã đơn giao dịch orderCode
      if (!orderCode) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Vui lòng cung cấp mã giao dịch (orderCode)"
        });
      }

      // GỌI SERVICE KÍCH HOẠT VÉ THÁNG: Cập nhật bảng UserSubscriptions và tính thời gian EndDate mới
      const result = await subscriptionService.subscribe(userId, orderCode);
      
      // TRẢ VỀ THÔNG BÁO KÍCH HOẠT THÀNH CÔNG
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Kích hoạt gói hội viên thành công",
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};

