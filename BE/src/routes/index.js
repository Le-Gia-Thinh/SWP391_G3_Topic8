// src/routes/index.js

import express from "express";

import * as authController from "../controllers/authController.js";
import * as commonController from "../controllers/commonController.js";
import * as sessionController from "../controllers/sessionController.js";
import * as reservationController from "../controllers/reservationController.js";
import * as reportController from "../controllers/reportController.js";

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

// Health check
router.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "API is working",
    });
});

// ── Auth public ───────────────────────────────────────────────
router.post("/auth/register", validateRegister, authController.register);
router.post("/auth/login", validateLogin, authController.login);
router.post("/auth/logout", authController.logout);
router.post("/auth/refresh", authController.refreshToken);
router.post("/auth/forgot-password", validateForgotPassword, authController.forgotPassword);
router.post("/auth/reset-password", validateResetPassword, authController.resetPassword);

// ── Social login public ───────────────────────────────────────
router.post("/auth/google", validateSocialLogin, authController.googleLogin);
router.post("/auth/facebook", validateSocialLogin, authController.facebookLogin);

// ── Auth protected ────────────────────────────────────────────
router.get("/auth/me", isAuthorized, authController.getMe);

// ── Common: mọi role đã đăng nhập ─────────────────────────────
router.get("/roles", isAuthorized, commonController.getRoles);
router.get("/vehicle-types", isAuthorized, commonController.getVehicleTypes);
router.get("/buildings", isAuthorized, commonController.getBuildings);
router.get("/slots", isAuthorized, commonController.getSlots);

// ── Sessions: Staff + Manager ─────────────────────────────────
router.get("/sessions", isAuthorized, isStaffOrManager, sessionController.getSessions);
router.post("/sessions/check-in", isAuthorized, isStaffOrManager, validateCheckIn, sessionController.checkInVehicle);
router.post("/sessions/check-out", isAuthorized, isStaffOrManager, validateCheckOut, sessionController.checkOutVehicle);

// ── Reservations ──────────────────────────────────────────────
router.get("/reservations", isAuthorized, reservationController.getReservations);
router.post("/reservations", isAuthorized, isDriver, validateCreateReservation, reservationController.createReservation);

// ── Reports: Manager only ─────────────────────────────────────
router.get("/reports/dashboard", isAuthorized, isManager, reportController.dashboard);

export default router;