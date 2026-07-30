/**
 * FILE: index.js (Routes)
 * MÔ TẢ: Thư mục chính tập trung toàn bộ các tuyến đường API (API Routing Hub) của ứng dụng Backend.
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Nhận các Request từ ứng dụng Frontend gửi lên (thông qua Axios Instance tại `FE/src/utils/authorizeAxios.js`).
 * 2. Đi qua các Middleware kiểm tra đăng nhập (`isAuthorized`), xác thực quyền (`isDriver`, `isStaffOrManager`, `isManager`, `isAdmin`) và Middleware validate dữ liệu (`validationUtils.js`).
 * 3. Định tuyến chính xác request đến đúng hàm Handler trong file Controller tương ứng trong thư mục `BE/src/controllers/`.
 */

import express from "express";

// Import các Controllers (nơi xử lý logic nghiệp vụ và truy vấn Database SQL Server)
import * as authController from "../controllers/authController.js";
import * as commonController from "../controllers/commonController.js";
import * as sessionController from "../controllers/sessionController.js";
import * as reservationController from "../controllers/reservationController.js";
import * as reportController from "../controllers/reportController.js";
import * as driverController from "../controllers/driverController.js";
import * as notificationController from "../controllers/notificationController.js";
import * as vehicleController from "../controllers/vehicleController.js";
import * as feedbackController from "../controllers/feedbackController.js";
import * as supportController from "../controllers/supportController.js";
import * as guestController from "../controllers/guestController.js";
import * as aiChatController from "../controllers/aiChatController.js";

// Import các sub-routers (Routing phân hệ chức năng chia nhỏ)
import paymentRoutes from "./paymentRoutes.js";
import staffRoutes from "./staffRoutes.js";
import managerRoutes from './managerRoutes.js';
import commonRoutes from './commonRoutes.js';
import adminRoutes from './adminRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import walletRoutes from './walletRoutes.js';

// Import Middlewares dùng để kiểm tra quyền (Authorization)
import {
  isAuthorized,        // Kiểm tra xem đã đăng nhập chưa
  isManager,           // Kiểm tra xem có quyền Quản lý không
  isStaffOrManager,    // Kiểm tra xem có quyền Nhân viên hoặc Quản lý không
  isDriver,            // Kiểm tra xem có phải là Tài xế (người dùng cuối) không
} from "../middlewares/authMiddleware.js";

// Import Middlewares để xác thực dữ liệu đầu vào (Validation)
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateSocialLogin,
  validateCreateReservation,
  validateCheckIn,
  validateCheckOut,
} from "../utils/validationUtils.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// 1. HEALTH CHECK & GUEST PUBLIC (Không cần đăng nhập)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /health
 * CONTROLLER BE: (Inline Function)
 * FE FILE GỌI: Hệ thống Monitoring / Health Check
 * DỮ LIỆU FE GỬI: Không có
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'API is working' }`
 */
router.get("/health", (req, res) =>
  res.json({
    success: true,
    message: "API is working",
  })
);

/**
 * ROUTE: GET /guest/track-session
 * CONTROLLER BE: `BE/src/controllers/guestController.js` -> `trackSession()`
 * FE FILE GỌI: `FE/src/apis/guestApi.js` -> `trackSession(plateNumber)`
 * DỮ LIỆU FE GỬI: Query param `?plateNumber=51H-12345`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { SessionID, PlateNumber, EntryTime, SlotCode, Status } }`
 */
router.get("/guest/track-session", guestController.trackSession);

/**
 * ROUTE: GET /guest/home-stats
 * CONTROLLER BE: `BE/src/controllers/guestController.js` -> `getHomeStats()`
 * FE FILE GỌI: `FE/src/apis/guestApi.js` -> `getHomeStats()`
 * DỮ LIỆU FE GỬI: Không có
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { availableSlots, totalBuildings, occupancyRate } }`
 */
router.get("/guest/home-stats", guestController.getHomeStats);

// ─────────────────────────────────────────────────────────────
// 2. AUTHENTICATION (Xác thực tài khoản - Public)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: POST /auth/register
 * CONTROLLER BE: `BE/src/controllers/authController.js` -> `register()`
 * FE FILE GỌI: `FE/src/apis/authApi.js` -> `register(payload)`
 * DỮ LIỆU FE GỬI: Body `{ fullName, email, password, phoneNumber }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đăng ký thành công', data: { UserID, Email } }`
 */
router.post("/auth/register", validateRegister, authController.register);

/**
 * ROUTE: POST /auth/login
 * CONTROLLER BE: `BE/src/controllers/authController.js` -> `login()`
 * FE FILE GỌI: `FE/src/apis/authApi.js` -> `login(payload)` | Page `FE/src/pages/Auth/Login.jsx`
 * DỮ LIỆU FE GỬI: Body `{ email, password }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đăng nhập thành công', accessToken, user: { UserID, RoleName, ... } }`
 * LƯU Ý: Tự động đính kèm Cookie `refreshToken` HttpOnly vào browser.
 */
router.post("/auth/login", validateLogin, authController.login);

/**
 * ROUTE: POST /auth/logout
 * CONTROLLER BE: `BE/src/controllers/authController.js` -> `logout()`
 * FE FILE GỌI: `FE/src/apis/authApi.js` -> `logout()`
 * DỮ LIỆU FE GỬI: Cookie `refreshToken`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã đăng xuất' }` (Xóa HttpOnly Cookie)
 */
router.post("/auth/logout", authController.logout);

/**
 * ROUTE: POST /auth/refresh
 * CONTROLLER BE: `BE/src/controllers/authController.js` -> `refreshToken()`
 * FE FILE GỌI: `FE/src/utils/authorizeAxios.js` (Tự động kích hoạt khi Access Token hết hạn 401)
 * DỮ LIỆU FE GỬI: Cookie `refreshToken`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, accessToken: 'NEW_JWT_TOKEN' }`
 */
router.post("/auth/refresh", authController.refreshToken);

/**
 * ROUTE: POST /auth/forgot-password
 * CONTROLLER BE: `BE/src/controllers/authController.js` -> `forgotPassword()`
 * FE FILE GỌI: `FE/src/apis/authApi.js` -> `forgotPassword({ email })`
 * DỮ LIỆU FE GỬI: Body `{ email }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã gửi link reset mật khẩu qua email' }`
 */
router.post(
  "/auth/forgot-password",
  validateForgotPassword,
  authController.forgotPassword
);

/**
 * ROUTE: POST /auth/reset-password
 * CONTROLLER BE: `BE/src/controllers/authController.js` -> `resetPassword()`
 * FE FILE GỌI: `FE/src/apis/authApi.js` -> `resetPassword(payload)`
 * DỮ LIỆU FE GỬI: Body `{ token, newPassword }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đặt lại mật khẩu thành công' }`
 */
router.post(
  "/auth/reset-password",
  validateResetPassword,
  authController.resetPassword
);

/**
 * ROUTE: GET /auth/verify-email
 * CONTROLLER BE: `BE/src/controllers/authController.js` -> `verifyEmail()`
 * FE FILE GỌI: Trình duyệt mở trực tiếp từ Link trong Email (`?token=xxx`)
 * DỮ LIỆU FE GỬI: Query string `?token=xxx`
 * DỮ LIỆU BE TRẢ VỀ: Redirect sang trang Frontend kèm thông báo thành công.
 */
router.get("/auth/verify-email", authController.verifyEmail);

/**
 * ROUTE: POST /auth/resend-verify
 * CONTROLLER BE: `BE/src/controllers/authController.js` -> `resendVerifyEmail()`
 * FE FILE GỌI: `FE/src/apis/authApi.js` -> `resendVerify({ email })`
 * DỮ LIỆU FE GỬI: Body `{ email }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã gửi lại email xác minh' }`
 */
router.post("/auth/resend-verify", authController.resendVerifyEmail);

/**
 * ROUTE: POST /auth/check-email-verified
 * CONTROLLER BE: `BE/src/controllers/authController.js` -> `checkEmailVerifyStatus()`
 * FE FILE GỌI: `FE/src/apis/authApi.js` -> `checkEmailVerified({ email })`
 * DỮ LIỆU FE GỬI: Body `{ email }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, isVerified: true/false }`
 */
router.post("/auth/check-email-verified", authController.checkEmailVerifyStatus);

/**
 * ROUTE: POST /auth/google
 * CONTROLLER BE: `BE/src/controllers/authController.js` -> `googleLogin()`
 * FE FILE GỌI: `FE/src/apis/authApi.js` -> `googleLogin({ idToken })`
 * DỮ LIỆU FE GỬI: Body `{ idToken }` (Token từ Google Sign-In SDK)
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, accessToken, user }`
 */
router.post("/auth/google", validateSocialLogin, authController.googleLogin);

// ─────────────────────────────────────────────────────────────
// 3. AUTH PROTECTED (Yêu cầu đăng nhập - Token JWT)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /auth/me
 * CONTROLLER BE: `BE/src/controllers/authController.js` -> `getMe()`
 * FE FILE GỌI: `FE/src/apis/authApi.js` -> `getMe()`
 * DỮ LIỆU FE GỬI: Header `Authorization: Bearer <token>`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { UserID, FullName, Email, RoleName, AvatarUrl } }`
 */
router.get("/auth/me", isAuthorized, authController.getMe);

/**
 * ROUTE: POST /auth/change-password
 * CONTROLLER BE: `BE/src/controllers/authController.js` -> `changePassword()`
 * FE FILE GỌI: `FE/src/apis/authApi.js` -> `changePassword(payload)`
 * DỮ LIỆU FE GỬI: Body `{ currentPassword, newPassword }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đổi mật khẩu thành công' }`
 */
router.post("/auth/change-password", isAuthorized, authController.changePassword);

// ─────────────────────────────────────────────────────────────
// 4. COMMON DATA (Dữ liệu tra cứu dùng chung cho Form FE)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /roles
 * CONTROLLER BE: `BE/src/controllers/commonController.js` -> `getRoles()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `getRoles()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { RoleID, RoleName } ] }`
 */
router.get("/roles", isAuthorized, commonController.getRoles);

/**
 * ROUTE: GET /vehicle-types
 * CONTROLLER BE: `BE/src/controllers/commonController.js` -> `getVehicleTypes()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getVehicleTypes()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { VehicleTypeID, VehicleName, VehicleCode } ] }`
 */
router.get("/vehicle-types", isAuthorized, commonController.getVehicleTypes);

/**
 * ROUTE: GET /buildings
 * CONTROLLER BE: `BE/src/controllers/commonController.js` -> `getBuildings()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getBuildings()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { BuildingID, BuildingName, Address } ] }`
 */
router.get("/buildings", isAuthorized, commonController.getBuildings);

/**
 * ROUTE: GET /slots
 * CONTROLLER BE: `BE/src/controllers/commonController.js` -> `getSlots()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getSlots()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { SlotID, SlotCode, SlotStatus } ] }`
 */
router.get("/slots", isAuthorized, commonController.getSlots);

/**
 * ROUTE: GET /pricing
 * CONTROLLER BE: `BE/src/controllers/commonController.js` -> `getPricing()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getPricing(vehicleTypeId)`
 * DỮ LIỆU FE GỬI: Query string `?vehicleTypeId=1`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { PricePolicyID, BasePrice, OvertimePrice } ] }`
 */
router.get("/pricing", isAuthorized, commonController.getPricing);

// ─────────────────────────────────────────────────────────────
// 5. NOTIFICATIONS (Thông báo hệ thống cho User)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /notifications
 * CONTROLLER BE: `BE/src/controllers/notificationController.js` -> `getNotifications()`
 * FE FILE GỌI: `FE/src/apis/notificationApi.js` -> `getNotifications(params)`
 * DỮ LIỆU FE GỬI: Query params `?limit=20&offset=0`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { NotificationID, Title, Message, IsRead } ] }`
 */
router.get("/notifications", isAuthorized, notificationController.getNotifications);

/**
 * ROUTE: GET /notifications/unread-count
 * CONTROLLER BE: `BE/src/controllers/notificationController.js` -> `getUnreadCount()`
 * FE FILE GỌI: `FE/src/apis/notificationApi.js` -> `getUnreadCount()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, unreadCount: 3 }`
 */
router.get("/notifications/unread-count", isAuthorized, notificationController.getUnreadCount);

/**
 * ROUTE: PATCH /notifications/read-all
 * CONTROLLER BE: `BE/src/controllers/notificationController.js` -> `markAllAsRead()`
 * FE FILE GỌI: `FE/src/apis/notificationApi.js` -> `markAllRead()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã đánh dấu tất cả là đã đọc' }`
 */
router.patch("/notifications/read-all", isAuthorized, notificationController.markAllAsRead);

/**
 * ROUTE: PATCH /notifications/:id/read
 * CONTROLLER BE: `BE/src/controllers/notificationController.js` -> `markAsRead()`
 * FE FILE GỌI: `FE/src/apis/notificationApi.js` -> `markAsRead(notificationId)`
 * DỮ LIỆU FE GỬI: URL param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã đánh dấu đã đọc' }`
 */
router.patch("/notifications/:id/read", isAuthorized, notificationController.markAsRead);

// ─────────────────────────────────────────────────────────────
// 6. AI CHAT ASSISTANT (Tư vấn đỗ xe AI)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: POST /ai/chat
 * CONTROLLER BE: `BE/src/controllers/aiChatController.js` -> `processChat()`
 * FE FILE GỌI: `FE/src/components/AiChatWidget/AiChatWidget.jsx`
 * DỮ LIỆU FE GỬI: Body `{ message, history }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, reply: 'Câu trả lời từ AI...' }`
 */
router.post("/ai/chat", aiChatController.processChat);
router.post("/ai/chat", isAuthorized, aiChatController.processChat);

// ─────────────────────────────────────────────────────────────
// 7. DRIVER ENDPOINTS (Dành riêng cho Tài xế)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /driver/home
 * CONTROLLER BE: `BE/src/controllers/driverController.js` -> `getDriverHome()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getHome()` | Page `FE/src/pages/Driver/DriverHome.jsx`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { user, slotSummary, bookingSummary, currentBooking, currentSession } }`
 */
router.get(
  "/driver/home",
  isAuthorized,
  isDriver,
  driverController.getDriverHome
);

/**
 * ROUTE: GET /driver/current-session
 * CONTROLLER BE: `BE/src/controllers/sessionController.js` -> `getCurrentDriverSession()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getCurrentSession()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { SessionID, PlateNumber, ParkedDuration, EstimatedAmount } }`
 */
router.get(
  "/driver/current-session",
  isAuthorized,
  isDriver,
  sessionController.getCurrentDriverSession
);

/**
 * ROUTE: GET /driver/current-sessions
 * CONTROLLER BE: `BE/src/controllers/sessionController.js` -> `getCurrentDriverSessions()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getCurrentSessions()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ ...danh sách các phiên xe active ] }`
 */
router.get(
  "/driver/current-sessions",
  isAuthorized,
  isDriver,
  sessionController.getCurrentDriverSessions
);

/**
 * ROUTE: GET /driver/profile
 * CONTROLLER BE: `BE/src/controllers/driverController.js` -> `getDriverProfile()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getProfile()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { UserID, FullName, Email, AccountBalance, ... } }`
 */
router.get(
  "/driver/profile",
  isAuthorized,
  isDriver,
  driverController.getDriverProfile
);

/**
 * ROUTE: PATCH /driver/profile
 * CONTROLLER BE: `BE/src/controllers/driverController.js` -> `updateDriverProfile()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `updateProfile(payload)`
 * DỮ LIỆU FE GỬI: Body `{ fullName, phoneNumber, avatarUrl, dateOfBirth, email, currentPassword }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message, data }`
 */
router.patch(
  "/driver/profile",
  isAuthorized,
  isDriver,
  driverController.updateDriverProfile
);

/**
 * ROUTE: GET /driver/report-context
 * CONTROLLER BE: `BE/src/controllers/driverController.js` -> `getDriverReportContext()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getReportContext()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { currentSession, reservations, recentReports } }`
 */
router.get(
  "/driver/report-context",
  isAuthorized,
  isDriver,
  driverController.getDriverReportContext
);

/**
 * ROUTE: GET /driver/reports
 * CONTROLLER BE: `BE/src/controllers/driverController.js` -> `getDriverReports()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getReports(params)`
 * DỮ LIỆU FE GỬI: Query string `?limit=20&offset=0`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { IncidentID, IncidentType, Priority, Description } ] }`
 */
router.get(
  "/driver/reports",
  isAuthorized,
  isDriver,
  driverController.getDriverReports
);

/**
 * ROUTE: POST /driver/reports
 * CONTROLLER BE: `BE/src/controllers/driverController.js` -> `createDriverReport()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `createReport(payload)`
 * DỮ LIỆU FE GỬI: Body `{ issueType, issueLabel, description, sessionId, reservationId, attachments }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Gửi báo cáo sự cố thành công', data: { IncidentID, ReportCode } }`
 */
router.post(
  "/driver/reports",
  isAuthorized,
  isDriver,
  driverController.createDriverReport
);

// Driver Notifications (Namespace /driver/notifications)
router.get(
  "/driver/notifications",
  isAuthorized,
  isDriver,
  notificationController.getNotifications
);

router.get(
  "/driver/notifications/unread-count",
  isAuthorized,
  isDriver,
  notificationController.getUnreadCount
);

router.patch(
  "/driver/notifications/read-all",
  isAuthorized,
  isDriver,
  notificationController.markAllAsRead
);

router.patch(
  "/driver/notifications/:id/read",
  isAuthorized,
  isDriver,
  notificationController.markAsRead
);

// ─────────────────────────────────────────────────────────────
// 8. DRIVER VEHICLES (Quản lý Xe của Tài xế)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /driver/vehicles
 * CONTROLLER BE: `BE/src/controllers/vehicleController.js` -> `getDriverVehicles()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getVehicles()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { VehicleID, PlateNumber, IsDefault, VehicleName } ] }`
 */
router.get(
  "/driver/vehicles",
  isAuthorized,
  isDriver,
  vehicleController.getDriverVehicles
);

/**
 * ROUTE: POST /driver/vehicles
 * CONTROLLER BE: `BE/src/controllers/vehicleController.js` -> `addDriverVehicle()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `addVehicle(payload)`
 * DỮ LIỆU FE GỬI: Body `{ plateNumber, vehicleTypeId, vehicleBrand, vehicleColor }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Thêm phương tiện thành công', data: { VehicleID, ... } }`
 */
router.post(
  "/driver/vehicles",
  isAuthorized,
  isDriver,
  vehicleController.addDriverVehicle
);

/**
 * ROUTE: PATCH /driver/vehicles/:id
 * CONTROLLER BE: `BE/src/controllers/vehicleController.js` -> `updateDriverVehicle()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `updateVehicle(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ plateNumber, vehicleTypeId, vehicleBrand, vehicleColor }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật phương tiện thành công' }`
 */
router.patch(
  "/driver/vehicles/:id",
  isAuthorized,
  isDriver,
  vehicleController.updateDriverVehicle
);

/**
 * ROUTE: DELETE /driver/vehicles/:id
 * CONTROLLER BE: `BE/src/controllers/vehicleController.js` -> `deleteDriverVehicle()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `deleteVehicle(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã xóa phương tiện' }` (Soft Delete IsActive = 0)
 */
router.delete(
  "/driver/vehicles/:id",
  isAuthorized,
  isDriver,
  vehicleController.deleteDriverVehicle
);

/**
 * ROUTE: PATCH /driver/vehicles/:id/default
 * CONTROLLER BE: `BE/src/controllers/vehicleController.js` -> `setDefaultVehicle()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `setDefaultVehicle(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã đặt làm phương tiện mặc định' }`
 */
router.patch(
  "/driver/vehicles/:id/default",
  isAuthorized,
  isDriver,
  vehicleController.setDefaultVehicle
);

// ─────────────────────────────────────────────────────────────
// 9. DRIVER RATINGS / FEEDBACK (Đánh giá chất lượng dịch vụ)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /driver/ratings
 * CONTROLLER BE: `BE/src/controllers/feedbackController.js` -> `getDriverRatings()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getDriverRatings(params)`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { FeedbackID, RatingScore, Comment } ] }`
 */
router.get(
  "/driver/ratings",
  isAuthorized,
  isDriver,
  feedbackController.getDriverRatings
);

/**
 * ROUTE: POST /driver/ratings
 * CONTROLLER BE: `BE/src/controllers/feedbackController.js` -> `createServiceRating()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `createRating(payload)`
 * DỮ LIỆU FE GỬI: Body `{ sessionId, ratingScore, comment }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đánh giá dịch vụ thành công' }`
 */
router.post(
  "/driver/ratings",
  isAuthorized,
  isDriver,
  feedbackController.createServiceRating
);

/**
 * ROUTE: GET /driver/completed-sessions
 * CONTROLLER BE: `BE/src/controllers/feedbackController.js` -> `getUnratedSessions()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getUnratedSessions()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { SessionID, ExitTime, PlateNumber } ] }`
 */
router.get(
  "/driver/completed-sessions",
  isAuthorized,
  isDriver,
  feedbackController.getUnratedSessions
);

// ─────────────────────────────────────────────────────────────
// 10. PARKING SESSIONS (Phiên đỗ xe - Staff & Manager)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /sessions
 * CONTROLLER BE: `BE/src/controllers/sessionController.js` -> `getSessions()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getSessions()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { SessionID, PlateNumber, EntryTime, SlotCode } ] }`
 */
router.get(
  "/sessions",
  isAuthorized,
  isStaffOrManager,
  sessionController.getSessions
);

/**
 * ROUTE: POST /sessions/check-in
 * CONTROLLER BE: `BE/src/controllers/sessionController.js` -> `checkInVehicle()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `checkIn(payload)`
 * DỮ LIỆU FE GỬI: Body `{ plateNumber, slotId, vehicleTypeId }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Check-in thành công', data }`
 */
router.post(
  "/sessions/check-in",
  isAuthorized,
  isStaffOrManager,
  validateCheckIn,
  sessionController.checkInVehicle
);

/**
 * ROUTE: POST /sessions/check-out
 * CONTROLLER BE: `BE/src/controllers/sessionController.js` -> `checkOutVehicle()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `checkOut(payload)`
 * DỮ LIỆU FE GỬI: Body `{ sessionId, paymentMethod }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Check-out thành công', data }`
 */
router.post(
  "/sessions/check-out",
  isAuthorized,
  isStaffOrManager,
  validateCheckOut,
  sessionController.checkOutVehicle
);

// ─────────────────────────────────────────────────────────────
// 11. RESERVATIONS (Giữ chỗ đỗ xe trực tuyến)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /reservations
 * CONTROLLER BE: `BE/src/controllers/reservationController.js` -> `getReservations()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getReservations(params)`
 * DỮ LIỆU FE GỬI: Query string `?status=Reserved`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { ReservationID, BookingCode, StartTime, EndTime } ] }`
 */
router.get(
  "/reservations",
  isAuthorized,
  reservationController.getReservations
);

/**
 * ROUTE: GET /reservations/available-slots
 * CONTROLLER BE: `BE/src/controllers/reservationController.js` -> `getAvailableSlots()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getAvailableSlots(params)`
 * DỮ LIỆU FE GỬI: Query string `?buildingId=1&vehicleTypeId=1&startTime=...&endTime=...`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { SlotID, SlotCode, ZoneName, FloorName } ] }`
 */
router.get(
  "/reservations/available-slots",
  isAuthorized,
  isDriver,
  reservationController.getAvailableSlots
);

/**
 * ROUTE: GET /reservations/:id
 * CONTROLLER BE: `BE/src/controllers/reservationController.js` -> `getReservationById()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getReservationById(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { ReservationID, SlotCode, Status, Price } }`
 */
router.get(
  "/reservations/:id",
  isAuthorized,
  reservationController.getReservationById
);

/**
 * ROUTE: PATCH /reservations/:id/cancel
 * CONTROLLER BE: `BE/src/controllers/reservationController.js` -> `cancelReservation()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `cancelReservation(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã hủy lịch đặt chỗ' }`
 */
router.patch(
  "/reservations/:id/cancel",
  isAuthorized,
  isDriver,
  reservationController.cancelReservation
);

/**
 * ROUTE: POST /reservations
 * CONTROLLER BE: `BE/src/controllers/reservationController.js` -> `createReservation()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `createReservation(payload)`
 * DỮ LIỆU FE GỬI: Body `{ slotId, vehicleTypeId, startTime, endTime }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đặt chỗ thành công', data: { ReservationID, BookingCode } }`
 */
router.post(
  "/reservations",
  isAuthorized,
  isDriver,
  validateCreateReservation,
  reservationController.createReservation
);

// ─────────────────────────────────────────────────────────────
// 12. REPORTS (Báo cáo tổng quan Manager)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /reports/dashboard
 * CONTROLLER BE: `BE/src/controllers/reportController.js` -> `dashboard()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getDashboard()`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { totalRevenue, activeSessions, occupancyRate } }`
 */
router.get(
  "/reports/dashboard",
  isAuthorized,
  isManager,
  reportController.dashboard
);

// ─────────────────────────────────────────────────────────────
// 13. DRIVER SUPPORT TICKETS (Phiếu hỗ trợ kỹ thuật Tài xế)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: POST /driver/support/tickets
 * CONTROLLER BE: `BE/src/controllers/supportController.js` -> `createTicket()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `createTicket(payload)`
 * DỮ LIỆU FE GỬI: Body `{ title, description, category }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Tạo ticket thành công', data }`
 */
router.post(
  "/driver/support/tickets",
  isAuthorized,
  isDriver,
  supportController.createTicket
);

/**
 * ROUTE: GET /driver/support/tickets
 * CONTROLLER BE: `BE/src/controllers/supportController.js` -> `getDriverTickets()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getTickets()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { TicketID, Title, Status, CreatedAt } ] }`
 */
router.get(
  "/driver/support/tickets",
  isAuthorized,
  isDriver,
  supportController.getDriverTickets
);

/**
 * ROUTE: GET /driver/support/tickets/:id
 * CONTROLLER BE: `BE/src/controllers/supportController.js` -> `getTicketDetails()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getTicketDetails(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { TicketID, Title, Description, Replies: [] } }`
 */
router.get(
  "/driver/support/tickets/:id",
  isAuthorized,
  isDriver,
  supportController.getTicketDetails
);

/**
 * ROUTE: POST /driver/support/tickets/:id/replies
 * CONTROLLER BE: `BE/src/controllers/supportController.js` -> `replyTicket()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `replyTicket(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ message }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Gửi phản hồi thành công' }`
 */
router.post(
  "/driver/support/tickets/:id/replies",
  isAuthorized,
  isDriver,
  supportController.replyTicket
);

// ─────────────────────────────────────────────────────────────
// 14. SUB-ROUTERS (Gắn namespace cho các module phụ)
// ─────────────────────────────────────────────────────────────

// Payment routes (`/driver/payment/*`, `/staff/checkout`, `/webhook/payment`)
router.use("/", paymentRoutes);

// Staff routes (`/staff/*`)
router.use("/staff", staffRoutes);

// Manager routes (`/manager/*`)
router.use('/manager', managerRoutes);

// Common routes (`/common/*`)
router.use('/common', commonRoutes);

// Admin routes (`/admin/*`)
router.use('/admin', adminRoutes);

// Driver Subscriptions routes (`/driver/subscriptions/*`)
router.use('/driver/subscriptions', subscriptionRoutes);

// Driver Wallet routes (`/driver/wallet/*`)
router.use('/driver/wallet', walletRoutes);

export default router;