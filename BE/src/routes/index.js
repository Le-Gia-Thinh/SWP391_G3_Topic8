import express from "express";
import * as commonController from "../controllers/commonController.js";
import * as sessionController from "../controllers/sessionController.js";
import * as reservationController from "../controllers/reservationController.js";
import * as reportController from "../controllers/reportController.js";

const router = express.Router();

// Common
router.get("/roles", commonController.getRoles);
router.get("/vehicle-types", commonController.getVehicleTypes);
router.get("/buildings", commonController.getBuildings);
router.get("/slots", commonController.getSlots);

// Sessions
router.get("/sessions", sessionController.getSessions);
router.post("/sessions/check-in", sessionController.checkInVehicle);
router.post("/sessions/check-out", sessionController.checkOutVehicle);

// Reservations
router.get("/reservations", reservationController.getReservations);
router.post("/reservations", reservationController.createReservation);

// Reports
router.get("/reports/dashboard", reportController.dashboard);

export default router;