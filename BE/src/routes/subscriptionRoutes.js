/**
 * FILE: subscriptionRoutes.js
 * MÔ TẢ: Định nghĩa các đường dẫn API liên quan đến Gói hội viên (Subscriptions).
 */

import express from "express";
import { subscriptionController } from "../controllers/subscriptionController.js";
import { isAuthorized, isDriver } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/plans", isAuthorized, isDriver, subscriptionController.getPlans);
router.get("/my-status", isAuthorized, isDriver, subscriptionController.getMyStatus);
router.get("/status/:orderCode", isAuthorized, isDriver, subscriptionController.checkStatus);
router.post("/create-payment", isAuthorized, isDriver, subscriptionController.createPayment);
router.post("/pay", isAuthorized, isDriver, subscriptionController.subscribe);

export default router;
