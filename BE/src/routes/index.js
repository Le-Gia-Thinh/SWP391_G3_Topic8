// src/routes/index.js

import express from "express";
import * as authController from "../controllers/authController.js";
import * as commonController from "../controllers/commonController.js";
import * as sessionController from "../controllers/sessionController.js";
import * as reservationController from "../controllers/reservationController.js";
import * as reportController from "../controllers/reportController.js";

// FIX: đúng folder theo cấu trúc ảnh
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
} from "../utilities/authValidation.js";

const router = express.Router();

// ── Auth (public) ──────────────────────────────────────────────────────
router.post("/auth/register", validateRegister, authController.register);
router.post("/auth/login", validateLogin, authController.login);
router.post("/auth/logout", authController.logout);
router.post("/auth/refresh", authController.refreshToken);
router.post("/auth/forgot-password", validateForgotPassword, authController.forgotPassword);
router.post("/auth/reset-password", validateResetPassword, authController.resetPassword);
router.get("/auth/me", isAuthorized, authController.getMe);

// ── Social login (public) ──────────────────────────────────────────────
router.post("/auth/google", authController.googleLogin);
router.post("/auth/facebook", authController.facebookLogin);

// ── Common (mọi role đã đăng nhập) ────────────────────────────────────
router.get("/roles", isAuthorized, commonController.getRoles);
router.get("/vehicle-types", isAuthorized, commonController.getVehicleTypes);
router.get("/buildings", isAuthorized, commonController.getBuildings);
router.get("/slots", isAuthorized, commonController.getSlots);

// ── Sessions (Staff + Manager) ─────────────────────────────────────────
router.get("/sessions", isAuthorized, isStaffOrManager, sessionController.getSessions);
router.post("/sessions/check-in", isAuthorized, isStaffOrManager, sessionController.checkInVehicle);
router.post("/sessions/check-out", isAuthorized, isStaffOrManager, sessionController.checkOutVehicle);

// ── Reservations ───────────────────────────────────────────────────────
router.get("/reservations", isAuthorized, reservationController.getReservations);
router.post("/reservations", isAuthorized, isDriver, reservationController.createReservation);

// ── Reports (Manager only) ─────────────────────────────────────────────
router.get("/reports/dashboard", isAuthorized, isManager, reportController.dashboard);

export default router;