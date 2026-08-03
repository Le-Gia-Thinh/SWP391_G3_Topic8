/**
 * FILE: walletRoutes.js
 * MÔ TẢ: Định nghĩa các đường dẫn API Ví điện tử nội bộ của Tài xế (Wallet Namespace /driver/wallet/*).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Bắt buộc đăng nhập (`isAuthorized`) và chỉ dành cho quyền Tài xế (`isDriver`).
 * 2. Cung cấp chức năng nạp tiền qua PayOS QR, kiểm tra số dư ví (`AccountBalance`), tra cứu nhật ký lịch sử nạp/trừ tiền và sử dụng số dư ví để thanh toán cước gửi xe hoặc mua gói hội viên.
 */

import express from 'express';
import { isAuthorized, isDriver } from '../middlewares/authMiddleware.js';
import * as walletController from '../controllers/walletController.js';

const router = express.Router();

/**
 * ROUTE: POST /driver/wallet/create-topup
 * CONTROLLER BE: `BE/src/controllers/walletController.js` -> `createTopup()`
 * FE FILE GỌI: `FE/src/apis/walletApi.js` -> `createTopup({ amount })` | Page `FE/src/pages/Driver/Wallet.jsx`
 * DỮ LIỆU FE GỬI: Body `{ amount: 100000 }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, checkoutUrl: 'https://pay.payos.vn/...', orderCode: 554433 }`
 */
router.post('/create-topup', isAuthorized, isDriver, walletController.createTopup);

/**
 * ROUTE: GET /driver/wallet/status/:orderCode
 * CONTROLLER BE: `BE/src/controllers/walletController.js` -> `checkTopupStatus()`
 * FE FILE GỌI: `FE/src/apis/walletApi.js` -> `checkTopupStatus(orderCode)` (FE Polling)
 * DỮ LIỆU FE GỬI: URL Param `:orderCode`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, status: 'PAID' / 'PENDING', isCredited: true, newBalance: 500000 }`
 */
router.get('/status/:orderCode', isAuthorized, isDriver, walletController.checkTopupStatus);

/**
 * ROUTE: GET /driver/wallet/balance
 * CONTROLLER BE: `BE/src/controllers/walletController.js` -> `getBalance()`
 * FE FILE GỌI: `FE/src/apis/walletApi.js` -> `getBalance()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, balance: 250000 }`
 */
router.get('/balance', isAuthorized, isDriver, walletController.getBalance);

/**
 * ROUTE: GET /driver/wallet/history
 * CONTROLLER BE: `BE/src/controllers/walletController.js` -> `getHistory()`
 * FE FILE GỌI: `FE/src/apis/walletApi.js` -> `getHistory(params)`
 * DỮ LIỆU FE GỬI: Query params `?limit=20&offset=0`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { TransactionID, Amount, TransactionType, Description, CreatedAt } ] }`
 */
router.get('/history', isAuthorized, isDriver, walletController.getHistory);

/**
 * ROUTE: POST /driver/wallet/pay-parking
 * CONTROLLER BE: `BE/src/controllers/walletController.js` -> `payParkingByWallet()`
 * FE FILE GỌI: `FE/src/apis/walletApi.js` -> `payParkingByWallet({ sessionId })`
 * DỮ LIỆU FE GỬI: Body `{ sessionId }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Thanh toán cước đỗ xe bằng Ví thành công', remainingBalance: 200000 }`
 */
router.post('/pay-parking', isAuthorized, isDriver, walletController.payParkingByWallet);

/**
 * ROUTE: POST /driver/wallet/pay-subscription
 * CONTROLLER BE: `BE/src/controllers/walletController.js` -> `paySubscriptionByWallet()`
 * FE FILE GỌI: `FE/src/apis/walletApi.js` -> `paySubscriptionByWallet({ planId })`
 * DỮ LIỆU FE GỬI: Body `{ planId }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Thanh toán gói hội viên bằng Ví thành công', remainingBalance: 50000 }`
 */
router.post('/pay-subscription', isAuthorized, isDriver, walletController.paySubscriptionByWallet);

export default router;

