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

// Incidents
router.get("/incidents", mc.getIncidents);
router.get("/incidents/:id", mc.getIncidentById);
router.patch("/incidents/:id/status", mc.updateIncidentStatus);

// Reports
router.get("/reports/revenue", mc.getRevenueReport);
router.get("/reports/occupancy", mc.getOccupancyReport);
router.get("/reports/sessions", mc.getSessionsReport);

// Staff list
router.get("/staff", mc.getStaffList);

export default router;