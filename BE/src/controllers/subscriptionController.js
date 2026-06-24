import { StatusCodes } from "http-status-codes";
import { subscriptionService } from "../services/subscriptionService.js";

export const subscriptionController = {
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
