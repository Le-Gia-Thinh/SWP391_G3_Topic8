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

import { StatusCodes } from "http-status-codes"; // Mã HTTP status chuẩn
import { subscriptionService } from "../services/subscriptionService.js"; // Service xử lý logic subscription

export const subscriptionController = {
  /** @route GET /api/driver/subscriptions/plans - Lấy danh sách gói hội viên */
  getPlans: async (req, res, next) => {
    try {
      const plans = await subscriptionService.getPlans();
      return res.status(StatusCodes.OK).json({
        success: true,
        data: plans
      });
    } catch (err) {
      next(err);
    }
  },

  getMyStatus: async (req, res, next) => {
    try {
      const userId = req.user.UserID;
      const status = await subscriptionService.getMyStatus(userId);
      return res.status(StatusCodes.OK).json({
        success: true,
        data: status
      });
    } catch (err) {
      next(err);
    }
  },

  // Polling check status from PayOS
  checkStatus: async (req, res, next) => {
    try {
      const { orderCode } = req.params;
      const result = await subscriptionService.checkStatus(orderCode);
      return res.status(StatusCodes.OK).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  // Create PayOS payment link
  createPayment: async (req, res, next) => {
    try {
      const userId = req.user.UserID;
      const { planId, durationMonths } = req.body;
      
      if (!planId || !durationMonths) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Vui lòng cung cấp gói và thời hạn"
        });
      }

      const result = await subscriptionService.createPayment(userId, planId, durationMonths);
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  // Confirm subscription (after payment verified)
  subscribe: async (req, res, next) => {
    try {
      const userId = req.user.UserID;
      const { orderCode } = req.body;
      
      if (!orderCode) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Vui lòng cung cấp mã giao dịch (orderCode)"
        });
      }

      const result = await subscriptionService.subscribe(userId, orderCode);
      
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
