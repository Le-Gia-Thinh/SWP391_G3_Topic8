// src/routes/managerRoutes.js
import express from "express";
import * as mc from "../controllers/managerController.js";

const router = express.Router();
// tất cả routes trong file này đã được bọc bởi isAuthorized + isManager ở index.js

// Dashboard
router.get("/dashboard", mc.getDashboard);

// Config – Buildings
router.get("/buildings", mc.getBuildings);
router.patch("/buildings/:id", mc.updateBuilding);

// Config – Floors
router.get("/floors", mc.getFloors);
router.patch("/floors/:id", mc.updateFloor);

// Config – Zones (Areas)
router.get("/zones", mc.getZones);
router.patch("/zones/:id", mc.updateZone);

// Slots / Positions
router.get("/slots", mc.getParkingSlots);
router.get("/slots/:id", mc.getSlotById);
router.patch("/slots/:id/status", mc.updateSlotStatus);

// Pricing
router.get("/pricing", mc.getPricingPolicies);
router.post("/pricing", mc.createPricingPolicy);
router.patch("/pricing/:id", mc.updatePricingPolicy);
router.delete('/pricing/:id', mc.deletePricingPolicy);
router.get('/night-pricing', mc.getNightPricingPolicies);
router.patch('/night-pricing/:id', mc.updateNightPricingPolicy);
// Vehicle Types (readonly – dùng cho form pricing)
router.get("/vehicle-types", mc.getVehicleTypes);

// Incidents
router.get("/incidents", mc.getIncidents);
router.get("/incidents/:id", mc.getIncidentById);
router.patch("/incidents/:id/status", mc.updateIncidentStatus);

// Reports
router.get("/reports/revenue", mc.getRevenueReport);
router.get("/reports/occupancy", mc.getOccupancyReport);
router.get("/reports/sessions", mc.getSessionsReport);
router.get("/reports/peak-hours", mc.getPeakHoursReport);
router.get("/reports/vehicle-flow", mc.getVehicleFlowReport);

router.get("/vehicle-types/all", mc.getAllVehicleTypes);   // gồm cả Inactive + thống kê
router.post("/vehicle-types", mc.createVehicleType);
router.patch("/vehicle-types/:id", mc.updateVehicleType);
router.patch("/vehicle-types/:id/toggle", mc.toggleVehicleType);

// Unpaid
router.get("/unpaid", mc.getUnpaidSessions);

// Staff list
router.get("/staff", mc.getStaffList);

// System Notifications
router.post("/system-maintenance", mc.broadcastSystemMaintenance);

export default router;