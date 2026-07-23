/**
 * FILE: subscriptionController.js
 * MÔ TẢ: Controller xử lý gói hội viên (Subscription/Premium) cho Driver.
 * 
 * Chức năng:
 * - getPlans: Lấy danh sách các gói có sẵn
 * - getMyStatus: Kiểm tra trạng thái gói hiện tại của user
 * - checkStatus: Polling kiểm tra trạng thái thanh toán từ PayOS
 * - createPayment: Tạo link thanh toán PayOS cho gói hội viên
 * - subscribe: Kích hoạt gói sau khi thanh toán thành công
 * 
 * @access Driver only
 */
/*
hieu
*/

import { StatusCodes } from "http-status-codes"; // Thư viện mã HTTP status chuẩn (200 OK, 400 Bad Request,...)
import { subscriptionService } from "../services/subscriptionService.js"; // Service xử lý logic subscription

export const subscriptionController = {
  /** 
   * @route GET /api/driver/subscriptions/plans 
   * CHỨC NĂNG 1: Lấy danh sách tất cả các gói hội viên đang hoạt động trong bãi
   */
  getPlans: async (req, res, next) => {
    try {
      // Gọi Service truy vấn DB lấy mảng các gói hội viên có sẵn
      const plans = await subscriptionService.getPlans();
      // Trả về phản hồi thành công HTTP 200 kèm danh sách các gói
      return res.status(StatusCodes.OK).json({
        success: true,
        data: plans
      });
    } catch (err) {
      // Chuyển lỗi cho middleware xử lý lỗi chung
      next(err);
    }
  },

  /** 
   * @route GET /api/driver/subscriptions/my-status 
   * CHỨC NĂNG 2: Kiểm tra trạng thái gói hội viên hiện tại của tài xế đang đăng nhập
   */
  getMyStatus: async (req, res, next) => {
    try {
      // Lấy UserID của tài xế từ JWT Token đăng nhập
      const userId = req.user.UserID;
      // Gọi Service kiểm tra thông tin gói Active hiện tại của tài xế
      const status = await subscriptionService.getMyStatus(userId);
      // Trả về thông tin gói hội viên của tài xế
      return res.status(StatusCodes.OK).json({
        success: true,
        data: status
      });
    } catch (err) {
      next(err);
    }
  },

  /** 
   * @route GET /api/driver/subscriptions/status/:orderCode 
   * CHỨC NĂNG 3: Polling kiểm tra trạng thái thanh toán từ cổng PayOS theo mã đơn
   */
  checkStatus: async (req, res, next) => {
    try {
      // Rút mã đơn orderCode từ đường dẫn URL params
      const { orderCode } = req.params;
      // Gọi Service kiểm tra PayOS xem tiền đã chuyển thành công chưa
      const result = await subscriptionService.checkStatus(orderCode);
      // Trả về kết quả kiểm tra trạng thái thanh toán
      return res.status(StatusCodes.OK).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  /** 
   * @route POST /api/driver/subscriptions/create-payment 
   * CHỨC NĂNG 4: Tạo link và mã QR VietQR từ cổng PayOS để mua gói hội viên
   */
  createPayment: async (req, res, next) => {
    try {
      // Lấy UserID từ JWT Token của người dùng
      const userId = req.user.UserID;
      // Rút các thông số chọn gói từ body request
      const { planId, durationMonths, deductionAmount, excessValue, extraDays } = req.body;
      
      // Kiểm tra xem có thiếu ID gói hoặc số tháng đăng ký không -> Báo lỗi HTTP 400
      if (!planId || !durationMonths) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Vui lòng cung cấp gói và thời hạn"
        });
      }

      // Gọi Service tính số tiền giảm giá và gửi yêu cầu sinh mã QR thanh toán sang PayOS
      const result = await subscriptionService.createPayment(
          userId, planId, durationMonths, deductionAmount || 0, excessValue || 0, extraDays || 0
      );
      
      // Trả về mã QR Code và đường dẫn thanh toán cho Frontend
      return res.status(StatusCodes.OK).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  /** 
   * @route POST /api/driver/subscriptions/subscribe 
   * CHỨC NĂNG 5: Xác nhận thanh toán và kích hoạt gói hội viên sau khi khách đã chuyển khoản thành công
   */
  subscribe: async (req, res, next) => {
    try {
      // Lấy UserID của tài xế từ Token
      const userId = req.user.UserID;
      // Rút mã đơn giao dịch orderCode từ body
      const { orderCode } = req.body;
      
      // Nếu thiếu mã đơn orderCode -> Báo lỗi HTTP 400
      if (!orderCode) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Vui lòng cung cấp mã giao dịch (orderCode)"
        });
      }

      // Gọi Service xác minh lần cuối và kích hoạt gói trong database (bảng UserSubscriptions)
      const result = await subscriptionService.subscribe(userId, orderCode);
      
      // Trả về kết quả kích hoạt gói hội viên thành công
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
