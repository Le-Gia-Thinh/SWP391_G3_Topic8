// src/routes/walletRoutes.js
import express from 'express';
import { isAuthorized, isDriver } from '../middlewares/authMiddleware.js';
import * as walletController from '../controllers/walletController.js';

const router = express.Router();

// Nạp tiền (tạo link PayOS)
router.post('/create-topup', isAuthorized, isDriver, walletController.createTopup);

// Polling trạng thái nạp tiền
router.get('/status/:orderCode', isAuthorized, isDriver, walletController.checkTopupStatus);

// Lấy số dư
router.get('/balance', isAuthorized, isDriver, walletController.getBalance);

// Lịch sử giao dịch ví
router.get('/history', isAuthorized, isDriver, walletController.getHistory);

// Thanh toán đỗ xe bằng ví
router.post('/pay-parking', isAuthorized, isDriver, walletController.payParkingByWallet);

// Mua gói bằng ví
router.post('/pay-subscription', isAuthorized, isDriver, walletController.paySubscriptionByWallet);

export default router;
