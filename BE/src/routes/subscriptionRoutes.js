/**
 * FILE: subscriptionRoutes.js
 * MÔ TẢ: Định nghĩa các đường dẫn API Đăng ký & Quản lý Gói hội viên (Subscriptions / Vé tháng).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Tất cả các route trong file này yêu cầu đăng nhập (`isAuthorized`) và phân quyền cho Tài xế (`isDriver`).
 * 2. Gắn namespace `/driver/subscriptions/*` trong `src/routes/index.js`.
 * 3. Hỗ trợ xem danh sách các gói vé tháng (Tiêu chuẩn, Pro, Premium), kiểm tra trạng thái kích hoạt, tạo link thanh toán PayOS QR và kích hoạt tự động sau khi thanh toán.
 */

import express from "express";
import { subscriptionController } from "../controllers/subscriptionController.js";
import { isAuthorized, isDriver } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * ROUTE: GET /driver/subscriptions/plans
 * CONTROLLER BE: `BE/src/controllers/subscriptionController.js` -> `getPlans()`
 * FE FILE GỌI: `FE/src/apis/subscriptionApi.js` -> `getPlans()` | Page `FE/src/pages/Driver/Subscriptions.jsx`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { PlanID: 'monthly', PlanName: 'Gói Vé Tháng', Price: 300000, Benefits: [] } ] }`
 */
router.get("/plans", isAuthorized, isDriver, subscriptionController.getPlans);

/**
 * ROUTE: GET /driver/subscriptions/my-status
 * CONTROLLER BE: `BE/src/controllers/subscriptionController.js` -> `getMyStatus()`
 * FE FILE GỌI: `FE/src/apis/subscriptionApi.js` -> `getMyStatus()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { Status: 'Active' / 'Inactive', PlanID, EndDate, DaysRemaining } }`
 */
router.get("/my-status", isAuthorized, isDriver, subscriptionController.getMyStatus);

/**
 * ROUTE: GET /driver/subscriptions/status/:orderCode
 * CONTROLLER BE: `BE/src/controllers/subscriptionController.js` -> `checkStatus()`
 * FE FILE GỌI: `FE/src/apis/subscriptionApi.js` -> `checkStatus(orderCode)` (FE Polling)
 * DỮ LIỆU FE GỬI: URL Param `:orderCode`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, status: 'PAID' / 'PENDING', isActivated: true }`
 */
router.get("/status/:orderCode", isAuthorized, isDriver, subscriptionController.checkStatus);

/**
 * ROUTE: POST /driver/subscriptions/create-payment
 * CONTROLLER BE: `BE/src/controllers/subscriptionController.js` -> `createPayment()`
 * FE FILE GỌI: `FE/src/apis/subscriptionApi.js` -> `createPayment({ planId })`
 * DỮ LIỆU FE GỬI: Body `{ planId: 'pro' / 'premium' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, checkoutUrl: 'https://pay.payos.vn/...', orderCode: 987654 }`
 */
router.post("/create-payment", isAuthorized, isDriver, subscriptionController.createPayment);

/**
 * ROUTE: POST /driver/subscriptions/pay
 * CONTROLLER BE: `BE/src/controllers/subscriptionController.js` -> `subscribe()`
 * FE FILE GỌI: `FE/src/apis/subscriptionApi.js` -> `subscribe(payload)`
 * DỮ LIỆU FE GỬI: Body `{ planId, paymentMethod }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đăng ký gói hội viên thành công' }`
 */
router.post("/pay", isAuthorized, isDriver, subscriptionController.subscribe);

export default router;

