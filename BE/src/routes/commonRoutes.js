/**
 * FILE: commonRoutes.js
 * MÔ TẢ: Định nghĩa các đường dẫn API tra cứu dữ liệu dùng chung (Reference Data Namespace /common/*).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Đăng ký namespace `/common` trong file `src/routes/index.js`.
 * 2. Phục vụ lấy dữ liệu danh mục tĩnh (Loại xe, Tòa nhà, Tầng, Khu vực, Vị trí ô đỗ) cho tất cả các Form nhập liệu trên ứng dụng Frontend (Tài xế, Bảo vệ, Quản lý).
 */

import express from "express";
import { isAuthorized } from "../middlewares/authMiddleware.js";
import * as cc from "../controllers/commonController.js";

const router = express.Router();

/**
 * ROUTE: GET /common/roles
 * CONTROLLER BE: `BE/src/controllers/commonController.js` -> `getRoles()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `getRoles()`
 * DỮ LIỆU FE GỬI: Không bắt buộc đăng nhập (Công khai cho Form Đăng ký/Phân quyền)
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { RoleID, RoleName } ] }`
 */
router.get("/roles", cc.getRoles);

/**
 * ROUTE: GET /common/vehicle-types
 * CONTROLLER BE: `BE/src/controllers/commonController.js` -> `getVehicleTypes()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getVehicleTypes()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { VehicleTypeID, VehicleName, VehicleCode } ] }`
 */
router.get("/vehicle-types", isAuthorized, cc.getVehicleTypes);

/**
 * ROUTE: GET /common/buildings
 * CONTROLLER BE: `BE/src/controllers/commonController.js` -> `getBuildings()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` -> `getBuildings()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { BuildingID, BuildingName, Address } ] }`
 */
router.get("/buildings", isAuthorized, cc.getBuildings);

/**
 * ROUTE: GET /common/floors
 * CONTROLLER BE: `BE/src/controllers/commonController.js` -> `getFloors()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` / `staffApi.js` -> `getFloors(buildingId)`
 * DỮ LIỆU FE GỬI: Query param `?buildingId=1`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { FloorID, FloorName, BuildingID } ] }`
 */
router.get("/floors", isAuthorized, cc.getFloors);

/**
 * ROUTE: GET /common/zones
 * CONTROLLER BE: `BE/src/controllers/commonController.js` -> `getZones()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` / `staffApi.js` -> `getZones(floorId)`
 * DỮ LIỆU FE GỬI: Query param `?floorId=2`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { ZoneID, ZoneName, FloorID } ] }`
 */
router.get("/zones", isAuthorized, cc.getZones);

/**
 * ROUTE: GET /common/slots
 * CONTROLLER BE: `BE/src/controllers/commonController.js` -> `getSlots()`
 * FE FILE GỌI: `FE/src/apis/driverApi.js` / `staffApi.js` -> `getSlots(zoneId)`
 * DỮ LIỆU FE GỬI: Query param `?zoneId=3`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { SlotID, SlotCode, SlotStatus } ] }`
 */
router.get("/slots", isAuthorized, cc.getSlots);

export default router;