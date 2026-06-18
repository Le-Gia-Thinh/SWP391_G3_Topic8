// src/routes/commonRoutes.js
//
// Reference data dùng chung. Chỉ cần đăng nhập (isAuthorized), không phân quyền role
// vì đây là dữ liệu tra cứu (loại xe, tòa nhà, slot...) mà mọi role đều cần cho form.
//
// Đăng ký trong src/routes/index.js:
//   import commonRoutes from './commonRoutes.js'
//   router.use('/common', commonRoutes)
//
// Lưu ý: các path public sẵn có như /vehicle-types, /buildings mà driverApi đang gọi
// (GET '/vehicle-types', '/buildings') vẫn giữ nguyên ở chỗ cũ. File này thêm namespace
// '/common/*' để gom reference data, KHÔNG thay thế route cũ.

import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import * as cc from "../controllers/commonController.js";

const router = express.Router();

// Roles: để công khai cho form đăng ký (nếu cần). Nếu muốn bảo vệ thì thêm isAuthorized.
router.get("/roles", cc.getRoles);

// Reference data: cần đăng nhập
router.get("/vehicle-types", isAuthorized, cc.getVehicleTypes);
router.get("/buildings", isAuthorized, cc.getBuildings);
router.get("/floors", isAuthorized, cc.getFloors);
router.get("/zones", isAuthorized, cc.getZones);
router.get("/slots", isAuthorized, cc.getSlots);

export default router;