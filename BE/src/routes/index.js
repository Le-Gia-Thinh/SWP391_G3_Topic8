import express from "express";

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

import paymentRoutes from "./paymentRoutes.js";
import staffRoutes from "./staffRoutes.js";
import managerRoutes from './managerRoutes.js'
import commonRoutes from './commonRoutes.js'
import {
  isAuthorized,
  isManager,
  isStaffOrManager,
  isDriver,
} from "../middlewares/authMiddleware.js";

import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateSocialLogin,
  validateCreateReservation,
  validateCheckIn,
  validateCheckOut,
} from "../utilities/authValidation.js";

const router = express.Router();

router.get("/health", (req, res) =>
  res.json({
    success: true,
    message: "API is working",
  })
);

// Guest public (không cần đăng nhập)
router.get("/guest/track-session", guestController.trackSession);
router.get("/guest/home-stats", guestController.getHomeStats);

// Auth public
router.post("/auth/register", validateRegister, authController.register);
router.post("/auth/login", validateLogin, authController.login);
router.post("/auth/logout", authController.logout);
router.post("/auth/refresh", authController.refreshToken);
router.post(
  "/auth/forgot-password",
  validateForgotPassword,
  authController.forgotPassword
);
router.post(
  "/auth/reset-password",
  validateResetPassword,
  authController.resetPassword
);

// Email verify
router.get("/auth/verify-email", authController.verifyEmail);
router.post("/auth/resend-verify", authController.resendVerifyEmail);
router.post("/auth/check-email-verified", authController.checkEmailVerifyStatus);

// Social login public
router.post("/auth/google", validateSocialLogin, authController.googleLogin);
router.post("/auth/facebook", validateSocialLogin, authController.facebookLogin);

// Auth protected
router.get("/auth/me", isAuthorized, authController.getMe);
router.post("/auth/change-password", isAuthorized, authController.changePassword);

// Common
router.get("/roles", isAuthorized, commonController.getRoles);
router.get("/vehicle-types", isAuthorized, commonController.getVehicleTypes);
router.get("/buildings", isAuthorized, commonController.getBuildings);
router.get("/slots", isAuthorized, commonController.getSlots);
router.get("/pricing", isAuthorized, commonController.getPricing);

// Driver
router.get(
  "/driver/home",
  isAuthorized,
  isDriver,
  driverController.getDriverHome
);

router.get(
  "/driver/current-session",
  isAuthorized,
  isDriver,
  sessionController.getCurrentDriverSession
);

router.get(
  "/driver/current-sessions",
  isAuthorized,
  isDriver,
  sessionController.getCurrentDriverSessions
);

router.get(
  "/driver/profile",
  isAuthorized,
  isDriver,
  driverController.getDriverProfile
);

router.patch(
  "/driver/profile",
  isAuthorized,
  isDriver,
  driverController.updateDriverProfile
);

router.get(
  "/driver/report-context",
  isAuthorized,
  isDriver,
  driverController.getDriverReportContext
);

router.get(
  "/driver/reports",
  isAuthorized,
  isDriver,
  driverController.getDriverReports
);

router.post(
  "/driver/reports",
  isAuthorized,
  isDriver,
  driverController.createDriverReport
);

// Driver Notifications
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

// Driver Vehicles
router.get(
  "/driver/vehicles",
  isAuthorized,
  isDriver,
  vehicleController.getDriverVehicles
);

router.post(
  "/driver/vehicles",
  isAuthorized,
  isDriver,
  vehicleController.addDriverVehicle
);

router.patch(
  "/driver/vehicles/:id",
  isAuthorized,
  isDriver,
  vehicleController.updateDriverVehicle
);

router.delete(
  "/driver/vehicles/:id",
  isAuthorized,
  isDriver,
  vehicleController.deleteDriverVehicle
);

router.patch(
  "/driver/vehicles/:id/default",
  isAuthorized,
  isDriver,
  vehicleController.setDefaultVehicle
);

// Driver Ratings
router.get(
  "/driver/ratings",
  isAuthorized,
  isDriver,
  feedbackController.getDriverRatings
);

router.post(
  "/driver/ratings",
  isAuthorized,
  isDriver,
  feedbackController.createServiceRating
);

router.get(
  "/driver/completed-sessions",
  isAuthorized,
  isDriver,
  feedbackController.getUnratedSessions
);

// Sessions
router.get(
  "/sessions",
  isAuthorized,
  isStaffOrManager,
  sessionController.getSessions
);

router.post(
  "/sessions/check-in",
  isAuthorized,
  isStaffOrManager,
  validateCheckIn,
  sessionController.checkInVehicle
);

router.post(
  "/sessions/check-out",
  isAuthorized,
  isStaffOrManager,
  validateCheckOut,
  sessionController.checkOutVehicle
);

// Reservations
router.get(
  "/reservations",
  isAuthorized,
  reservationController.getReservations
);

router.get(
  "/reservations/available-slots",
  isAuthorized,
  isDriver,
  reservationController.getAvailableSlots
);

router.get(
  "/reservations/:id",
  isAuthorized,
  reservationController.getReservationById
);

router.patch(
  "/reservations/:id/cancel",
  isAuthorized,
  isDriver,
  reservationController.cancelReservation
);

router.post(
  "/reservations",
  isAuthorized,
  isDriver,
  validateCreateReservation,
  reservationController.createReservation
);

// Reports
router.get(
  "/reports/dashboard",
  isAuthorized,
  isManager,
  reportController.dashboard
);

// Driver Support Tickets
router.post(
  "/driver/support/tickets",
  isAuthorized,
  isDriver,
  supportController.createTicket
);
router.get(
  "/driver/support/tickets",
  isAuthorized,
  isDriver,
  supportController.getDriverTickets
);
router.get(
  "/driver/support/tickets/:id",
  isAuthorized,
  isDriver,
  supportController.getTicketDetails
);
router.post(
  "/driver/support/tickets/:id/replies",
  isAuthorized,
  isDriver,
  supportController.replyTicket
);

// Payment routes
router.use("/", paymentRoutes);

// Staff routes
router.use("/staff", staffRoutes);
router.use('/manager', managerRoutes);
router.use('/common', commonRoutes)
export default router;