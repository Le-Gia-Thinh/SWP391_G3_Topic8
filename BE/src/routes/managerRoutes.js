/**
 * FILE: managerRoutes.js
 * MÔ TẢ: Định nghĩa các đường dẫn API dành riêng cho quyền Quản lý (Manager).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Tất cả các route được bảo vệ bởi middleware `isAuthorized` + `isManager` ở file `src/routes/index.js` (gắn namespace `/manager/*`).
 * 2. Phục vụ quản lý hoạt động tổng thể bãi đỗ xe: Cấu hình cơ sở hạ tầng (Tòa nhà, Tầng, Khu vực, Ô đỗ), Thiết lập bảng giá đỗ xe (ngày & đêm), Xem báo cáo biểu đồ doanh thu/tỷ lệ lấp đầy, Quản lý sự cố và Danh sách Bảo vệ (Staff).
 */

import express from "express";
import { isAuthorized, isManager, hasPermission } from "../middlewares/authMiddleware.js";
// Import toàn bộ handler từ ManagerController (`BE/src/controllers/managerController.js`)
import * as mc from "../controllers/managerController.js";

const router = express.Router();

// ⚠️ Áp dụng isAuthorized + isManager cho TOÀN BỘ các route trong router này.
// Đảm bảo req.user luôn được set trước khi hasPermission kiểm tra.
router.use(isAuthorized, isManager);


// ─────────────────────────────────────────────────────────────
// 1. DASHBOARD BÁO CÁO TỔNG QUAN MANAGER
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /manager/dashboard
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getDashboard()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getDashboard()` | Page `FE/src/pages/Manager/ManagerDashboard.jsx`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { todayRevenue, activeCount, occupancyRate, totalStaff } }`
 */
router.get("/dashboard", mc.getDashboard);

// ─────────────────────────────────────────────────────────────
// 2. CẤU HÌNH CƠ SỞ HẠ TẦNG (BUILDINGS, FLOORS, ZONES, SLOTS)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /manager/buildings
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getBuildings()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getBuildings()`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { BuildingID, BuildingName, Address, TotalFloors } ] }`
 */
router.get("/buildings", mc.getBuildings);
router.post("/buildings", mc.createBuilding);
router.patch("/buildings/:id", mc.updateBuilding);
router.delete("/buildings/:id", mc.deleteBuilding);

// ─────────────────────────────────────────────────────────────
// 2.5 CẤU HÌNH CỔNG TÒA NHÀ (GATES)
// ─────────────────────────────────────────────────────────────
router.get("/gates", mc.getGates);
router.get("/gates/:id", mc.getGateById);
router.post("/gates", mc.createGate);
router.patch("/gates/:id", mc.updateGate);
router.delete("/gates/:id", mc.deleteGate);

/**
 * ROUTE: GET /manager/floors
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getFloors()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getFloors(params)`
 * DỮ LIỆU FE GỬI: Query params `?buildingId=1`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { FloorID, FloorName, BuildingName, Capacity } ] }`
 */
router.get("/floors", mc.getFloors);

/**
 * ROUTE: PATCH /manager/floors/:id
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `updateFloor()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `updateFloor(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ floorName, capacity }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật thông tin tầng thành công' }`
 */
router.patch("/floors/:id", mc.updateFloor);

/**
 * ROUTE: GET /manager/zones
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getZones()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getZones(params)`
 * DỮ LIỆU FE GỬI: Query params `?floorId=2`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { ZoneID, ZoneName, FloorName, VehicleTypeID } ] }`
 */
router.get("/zones", mc.getZones);

/**
 * ROUTE: PATCH /manager/zones/:id
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `updateZone()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `updateZone(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ zoneName, vehicleTypeId }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật khu vực thành công' }`
 */
router.patch("/zones/:id", mc.updateZone);

/**
 * ROUTE: GET /manager/slots
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getParkingSlots()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getSlots(params)`
 * DỮ LIỆU FE GỬI: Query params `?zoneId=3&status=Available`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { SlotID, SlotCode, SlotStatus, ZoneName } ] }`
 */
router.get("/slots", mc.getParkingSlots);

/**
 * ROUTE: GET /manager/slots/:id
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getSlotById()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getSlotById(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { SlotID, SlotCode, SlotStatus, CurrentSession } }`
 */
router.get("/slots/:id", mc.getSlotById);

/**
 * ROUTE: PATCH /manager/slots/:id/status
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `updateSlotStatus()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `updateSlotStatus(id, status)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ status: 'Maintenance' / 'Available' / 'Blocked' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật trạng thái ô đỗ thành công' }`
 */
router.patch("/slots/:id/status", mc.updateSlotStatus);

// ─────────────────────────────────────────────────────────────
// 3. THIẾT LẬP BẢNG GIÁ DỊCH VỤ ĐỖ XE (PRICING POLICIES)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /manager/pricing
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getPricingPolicies()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getPricing()`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { PricePolicyID, VehicleTypeName, BasePrice, FirstBlockHours } ] }`
 */
router.get("/pricing", mc.getPricingPolicies);

/**
 * ROUTE: POST /manager/pricing
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `createPricingPolicy()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `createPricing(payload)`
 * DỮ LIỆU FE GỬI: Body `{ vehicleTypeId, basePrice, firstBlockHours, overtimePrice }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Tạo chính sách giá thành công', data }`
 */
router.post("/pricing", mc.createPricingPolicy);

/**
 * ROUTE: PATCH /manager/pricing/:id
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `updatePricingPolicy()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `updatePricing(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ basePrice, overtimePrice }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật bảng giá thành công' }`
 */
router.patch("/pricing/:id", mc.updatePricingPolicy);

/**
 * ROUTE: DELETE /manager/pricing/:id
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `deletePricingPolicy()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `deletePricing(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã xóa chính sách giá' }`
 */
router.delete('/pricing/:id', mc.deletePricingPolicy);

/**
 * ROUTE: GET /manager/night-pricing
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getNightPricingPolicies()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getNightPricing()`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { NightPolicyID, NightPrice, StartTime, EndTime } ] }`
 */
router.get('/night-pricing', mc.getNightPricingPolicies);

/**
 * ROUTE: PATCH /manager/night-pricing/:id
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `updateNightPricingPolicy()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `updateNightPricing(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ nightPrice, startTime, endTime }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật bảng giá đêm thành công' }`
 */
router.patch('/night-pricing/:id', mc.updateNightPricingPolicy);

/**
 * ROUTE: GET /manager/vehicle-types
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getVehicleTypes()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getVehicleTypes()`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { VehicleTypeID, VehicleName } ] }`
 */
router.get("/vehicle-types", mc.getVehicleTypes);

// ─────────────────────────────────────────────────────────────
// 4. QUẢN LÝ SỰ CỐ BÃI ĐỖ (INCIDENTS)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /manager/incidents
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getIncidents()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getIncidents(params)`
 * DỮ LIỆU FE GỬI: Query params `?status=Open`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { IncidentID, ReporterName, IncidentType, Priority, Status } ] }`
 */
router.get("/incidents", mc.getIncidents);

/**
 * ROUTE: GET /manager/incidents/:id
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getIncidentById()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getIncidentById(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { IncidentID, Description, Photos: [] } }`
 */
router.get("/incidents/:id", mc.getIncidentById);

/**
 * ROUTE: PATCH /manager/incidents/:id/status
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `updateIncidentStatus()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `updateIncidentStatus(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ status: 'Resolved' / 'In_Progress' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật trạng thái sự cố thành công' }`
 */
router.patch("/incidents/:id/status", mc.updateIncidentStatus);

// hasPermission đã được import ở trên cùng file


// ─────────────────────────────────────────────────────────────
// 5. BÁO CÁO THỐNG KÊ & CHỈ SỐ KINH DOANH (REPORTS & ANALYTICS)
// ─────────────────────────────────────────────────────────────

router.get("/reports/revenue", hasPermission('VIEW_REPORTS'), mc.getRevenueReport);
router.get("/reports/occupancy", hasPermission('VIEW_REPORTS'), mc.getOccupancyReport);
router.get("/reports/sessions", hasPermission('VIEW_REPORTS'), mc.getSessionsReport);
router.get("/reports/peak-hours", hasPermission('VIEW_REPORTS'), mc.getPeakHoursReport);
router.get("/reports/vehicle-flow", hasPermission('VIEW_REPORTS'), mc.getVehicleFlowReport);

// ─────────────────────────────────────────────────────────────
// 6. QUẢN LÝ LOẠI XE, CHƯA THANH TOÁN & NHÂN SỰ (STAFF)
// ─────────────────────────────────────────────────────────────

router.get("/vehicle-types/all", mc.getAllVehicleTypes);   // Gồm cả loại xe ngưng hoạt động
router.post("/vehicle-types", mc.createVehicleType);
router.patch("/vehicle-types/:id", mc.updateVehicleType);
router.patch("/vehicle-types/:id/toggle", mc.toggleVehicleType);

/**
 * ROUTE: GET /manager/unpaid
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getUnpaidSessions()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getUnpaidSessions()`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { SessionID, PlateNumber, EntryTime, UnpaidAmount } ] }`
 */
router.get("/unpaid", mc.getUnpaidSessions);

/**
 * ROUTE: GET /manager/staff
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getStaffList()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getStaffList()`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { UserID, FullName, Email, PhoneNumber, IsActive } ] }`
 */
router.get("/staff", mc.getStaffList);

/**
 * ROUTE: POST /manager/system-maintenance
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `broadcastSystemMaintenance()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `broadcastMaintenance(payload)`
 * DỮ LIỆU FE GỬI: Body `{ message, startTime, endTime }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã phát thông báo bảo trì tới toàn bộ người dùng' }`
 */
router.post("/system-maintenance", mc.broadcastSystemMaintenance);

// QUẢN LÝ PHÂN CÔNG STAFF TRONG TÒA NHÀ CỦA MANAGER
router.get("/buildings/:buildingId/staff", mc.getBuildingStaff);
router.get("/staff/unassigned", mc.getUnassignedStaff);
router.post("/staff/assign", mc.assignStaffToBuilding);
router.delete("/staff/assignments/:id", mc.removeStaffFromBuilding);

export default router;