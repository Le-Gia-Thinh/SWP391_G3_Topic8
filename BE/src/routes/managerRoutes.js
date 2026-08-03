/**
 * FILE: managerRoutes.js
 * MÔ TẢ: Định nghĩa các đường dẫn API dành riêng cho quyền Quản lý (Manager).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Tất cả các route được bảo vệ bởi middleware `isAuthorized` + `isManager` ở file `src/routes/index.js` (gắn namespace `/manager/*`).
 * 2. Phục vụ quản lý hoạt động tổng thể bãi đỗ xe: Cấu hình cơ sở hạ tầng (Tòa nhà, Tầng, Khu vực, Ô đỗ), Thiết lập bảng giá đỗ xe (ngày & đêm), Xem báo cáo biểu đồ doanh thu/tỷ lệ lấp đầy, Quản lý sự cố và Danh sách Bảo vệ (Staff).
 * 3. Kiểm tra phân quyền RBAC linh hoạt qua middleware `hasPermission('PERM_NAME')`:
 *    - BƯỚC 1: Kiểm tra quyền nhóm vai trò (RolePermissions). Nếu vai trò bị TẮT quyền -> Từ chối 403 ngay.
 *    - BƯỚC 2: Kiểm tra quyền cá nhân (UserPermissions). Nếu cá nhân bị THU HỒI (IsGranted=0) -> Từ chối 403.
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
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager`
 * QUYỀN YÊU CẦU: Không yêu cầu (Bảng điều khiển mặc định cho Manager)
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
 * ROUTE: GET /manager/buildings, POST, PATCH, DELETE
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_BUILDINGS')`
 * QUYỀN YÊU CẦU: `MANAGE_BUILDINGS` (Cấu hình tòa nhà & cơ sở hạ tầng)
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getBuildings()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getBuildings()` | Page `/manager/config`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { BuildingID, BuildingName, Address, TotalFloors } ] }`
 */
router.get("/buildings", hasPermission('MANAGE_BUILDINGS'), mc.getBuildings);
router.post("/buildings", hasPermission('MANAGE_BUILDINGS'), mc.createBuilding);
router.patch("/buildings/:id", hasPermission('MANAGE_BUILDINGS'), mc.updateBuilding);
router.delete("/buildings/:id", hasPermission('MANAGE_BUILDINGS'), mc.deleteBuilding);

// ─────────────────────────────────────────────────────────────
// 2.5 CẤU HÌNH CỔNG TÒA NHÀ (GATES)
// ─────────────────────────────────────────────────────────────
// MIDDLEWARE BẢO VỆ: `hasPermission('MANAGE_BUILDINGS')` (Quản lý cổng vào/ra thuộc cấu hình tòa nhà)
router.get("/gates", hasPermission('MANAGE_BUILDINGS'), mc.getGates);
router.get("/gates/:id", hasPermission('MANAGE_BUILDINGS'), mc.getGateById);
router.post("/gates", hasPermission('MANAGE_BUILDINGS'), mc.createGate);
router.patch("/gates/:id", hasPermission('MANAGE_BUILDINGS'), mc.updateGate);
router.delete("/gates/:id", hasPermission('MANAGE_BUILDINGS'), mc.deleteGate);

/**
 * ROUTE: GET /manager/floors
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_BUILDINGS')`
 * QUYỀN YÊU CẦU: `MANAGE_BUILDINGS` (Quản lý tầng trong tòa nhà)
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getFloors()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getFloors(params)`
 * DỮ LIỆU FE GỬI: Query params `?buildingId=1`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { FloorID, FloorName, BuildingName, Capacity } ] }`
 */
router.get("/floors", hasPermission('MANAGE_BUILDINGS'), mc.getFloors);

/**
 * ROUTE: PATCH /manager/floors/:id
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_BUILDINGS')`
 * QUYỀN YÊU CẦU: `MANAGE_BUILDINGS`
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `updateFloor()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `updateFloor(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ floorName, capacity }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật thông tin tầng thành công' }`
 */
router.patch("/floors/:id", hasPermission('MANAGE_BUILDINGS'), mc.updateFloor);

/**
 * ROUTE: GET /manager/zones
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_BUILDINGS')`
 * QUYỀN YÊU CẦU: `MANAGE_BUILDINGS`
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getZones()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getZones(params)`
 * DỮ LIỆU FE GỬI: Query params `?floorId=2`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { ZoneID, ZoneName, FloorName, VehicleTypeID } ] }`
 */
router.get("/zones", hasPermission('MANAGE_BUILDINGS'), mc.getZones);

/**
 * ROUTE: PATCH /manager/zones/:id
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_BUILDINGS')`
 * QUYỀN YÊU CẦU: `MANAGE_BUILDINGS`
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `updateZone()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `updateZone(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ zoneName, vehicleTypeId }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật khu vực thành công' }`
 */
router.patch("/zones/:id", hasPermission('MANAGE_BUILDINGS'), mc.updateZone);

/**
 * ROUTE: GET /manager/slots
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('VIEW_SLOTS')`
 * QUYỀN YÊU CẦU: `VIEW_SLOTS` (Xem danh sách/sơ đồ ô đỗ)
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getParkingSlots()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getSlots(params)`
 * DỮ LIỆU FE GỬI: Query params `?zoneId=3&status=Available`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { SlotID, SlotCode, SlotStatus, ZoneName } ] }`
 */
router.get("/slots", hasPermission('VIEW_SLOTS'), mc.getParkingSlots);

/**
 * ROUTE: GET /manager/slots/:id
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('VIEW_SLOTS')`
 * QUYỀN YÊU CẦU: `VIEW_SLOTS`
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getSlotById()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getSlotById(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { SlotID, SlotCode, SlotStatus, CurrentSession } }`
 */
router.get("/slots/:id", hasPermission('VIEW_SLOTS'), mc.getSlotById);

/**
 * ROUTE: PATCH /manager/slots/:id/status
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('VIEW_SLOTS')`
 * QUYỀN YÊU CẦU: `VIEW_SLOTS`
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `updateSlotStatus()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `updateSlotStatus(id, status)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ status: 'Maintenance' / 'Available' / 'Blocked' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật trạng thái ô đỗ thành công' }`
 */
router.patch("/slots/:id/status", hasPermission('VIEW_SLOTS'), mc.updateSlotStatus);

// ─────────────────────────────────────────────────────────────
// 3. THIẾT LẬP BẢNG GIÁ DỊCH VỤ ĐỖ XE (PRICING POLICIES)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /manager/pricing
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_PRICING')`
 * QUYỀN YÊU CẦU: `MANAGE_PRICING` (Quản lý bảng giá đỗ xe ngày/đêm & loại xe)
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getPricingPolicies()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getPricing()` | Page `/manager/pricing`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { PricePolicyID, VehicleTypeName, BasePrice, FirstBlockHours } ] }`
 */
router.get("/pricing", hasPermission('MANAGE_PRICING'), mc.getPricingPolicies);

/**
 * ROUTE: POST /manager/pricing
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_PRICING')`
 * QUYỀN YÊU CẦU: `MANAGE_PRICING`
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `createPricingPolicy()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `createPricing(payload)`
 * DỮ LIỆU FE GỬI: Body `{ vehicleTypeId, basePrice, firstBlockHours, overtimePrice }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Tạo chính sách giá thành công', data }`
 */
router.post("/pricing", hasPermission('MANAGE_PRICING'), mc.createPricingPolicy);

/**
 * ROUTE: PATCH /manager/pricing/:id
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_PRICING')`
 * QUYỀN YÊU CẦU: `MANAGE_PRICING`
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `updatePricingPolicy()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `updatePricing(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ basePrice, overtimePrice }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật bảng giá thành công' }`
 */
router.patch("/pricing/:id", hasPermission('MANAGE_PRICING'), mc.updatePricingPolicy);

/**
 * ROUTE: DELETE /manager/pricing/:id
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_PRICING')`
 * QUYỀN YÊU CẦU: `MANAGE_PRICING`
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `deletePricingPolicy()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `deletePricing(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã xóa chính sách giá' }`
 */
router.delete('/pricing/:id', hasPermission('MANAGE_PRICING'), mc.deletePricingPolicy);

/**
 * ROUTE: GET /manager/night-pricing
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_PRICING')`
 * QUYỀN YÊU CẦU: `MANAGE_PRICING`
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getNightPricingPolicies()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getNightPricing()`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { NightPolicyID, NightPrice, StartTime, EndTime } ] }`
 */
router.get('/night-pricing', hasPermission('MANAGE_PRICING'), mc.getNightPricingPolicies);

/**
 * ROUTE: PATCH /manager/night-pricing/:id
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_PRICING')`
 * QUYỀN YÊU CẦU: `MANAGE_PRICING`
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `updateNightPricingPolicy()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `updateNightPricing(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ nightPrice, startTime, endTime }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật bảng giá đêm thành công' }`
 */
router.patch('/night-pricing/:id', hasPermission('MANAGE_PRICING'), mc.updateNightPricingPolicy);

/**
 * ROUTE: GET /manager/vehicle-types
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_PRICING')`
 * QUYỀN YÊU CẦU: `MANAGE_PRICING`
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getVehicleTypes()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getVehicleTypes()`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { VehicleTypeID, VehicleName } ] }`
 */
router.get("/vehicle-types", hasPermission('MANAGE_PRICING'), mc.getVehicleTypes);

// ─────────────────────────────────────────────────────────────
// 4. QUẢN LÝ SỰ CỐ BÃI ĐỖ (INCIDENTS)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /manager/incidents
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_INCIDENTS')`
 * QUYỀN YÊU CẦU: `MANAGE_INCIDENTS` (Quản lý và xử lý báo cáo sự cố)
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getIncidents()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getIncidents(params)` | Page `/manager/incidents`
 * DỮ LIỆU FE GỬI: Query params `?status=Open`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { IncidentID, ReporterName, IncidentType, Priority, Status } ] }`
 */
router.get("/incidents", hasPermission('MANAGE_INCIDENTS'), mc.getIncidents);

/**
 * ROUTE: GET /manager/incidents/:id
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_INCIDENTS')`
 * QUYỀN YÊU CẦU: `MANAGE_INCIDENTS`
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getIncidentById()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getIncidentById(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { IncidentID, Description, Photos: [] } }`
 */
router.get("/incidents/:id", hasPermission('MANAGE_INCIDENTS'), mc.getIncidentById);

/**
 * ROUTE: PATCH /manager/incidents/:id/status
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_INCIDENTS')`
 * QUYỀN YÊU CẦU: `MANAGE_INCIDENTS`
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `updateIncidentStatus()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `updateIncidentStatus(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ status: 'Resolved' / 'In_Progress' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật trạng thái sự cố thành công' }`
 */
router.patch("/incidents/:id/status", hasPermission('MANAGE_INCIDENTS'), mc.updateIncidentStatus);


// ─────────────────────────────────────────────────────────────
// 5. BÁO CÁO THỐNG KÊ & CHỈ SỐ KINH DOANH (REPORTS & ANALYTICS)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTES BÁO CÁO (REVENUE, OCCUPANCY, SESSIONS, PEAK-HOURS, VEHICLE-FLOW)
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('VIEW_REPORTS')`
 * QUYỀN YÊU CẦU: `VIEW_REPORTS` (Xem báo cáo thống kê doanh thu & lấp đầy)
 */
router.get("/reports/revenue", hasPermission('VIEW_REPORTS'), mc.getRevenueReport);
router.get("/reports/occupancy", hasPermission('VIEW_REPORTS'), mc.getOccupancyReport);
router.get("/reports/sessions", hasPermission('VIEW_REPORTS'), mc.getSessionsReport);
router.get("/reports/peak-hours", hasPermission('VIEW_REPORTS'), mc.getPeakHoursReport);
router.get("/reports/vehicle-flow", hasPermission('VIEW_REPORTS'), mc.getVehicleFlowReport);

// ─────────────────────────────────────────────────────────────
// 6. QUẢN LÝ LOẠI XE, CHƯA THANH TOÁN & NHÂN SỰ (STAFF)
// ─────────────────────────────────────────────────────────────

router.get("/vehicle-types/all", hasPermission('MANAGE_PRICING'), mc.getAllVehicleTypes);   // Gồm cả loại xe ngưng hoạt động
router.post("/vehicle-types", hasPermission('MANAGE_PRICING'), mc.createVehicleType);
router.patch("/vehicle-types/:id", hasPermission('MANAGE_PRICING'), mc.updateVehicleType);
router.patch("/vehicle-types/:id/toggle", hasPermission('MANAGE_PRICING'), mc.toggleVehicleType);

/**
 * ROUTE: GET /manager/unpaid
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_PAYMENTS')`
 * QUYỀN YÊU CẦU: `MANAGE_PAYMENTS` (Quản lý thanh toán & xe nợ đỗ)
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getUnpaidSessions()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getUnpaidSessions()` | Page `/manager/unpaid`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { SessionID, PlateNumber, EntryTime, UnpaidAmount } ] }`
 */
router.get("/unpaid", hasPermission('MANAGE_PAYMENTS'), mc.getUnpaidSessions);

/**
 * ROUTE: GET /manager/staff
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_USERS')`
 * QUYỀN YÊU CẦU: `MANAGE_USERS` (Quản lý danh sách & phân công nhân viên bảo vệ)
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `getStaffList()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `getStaffList()` | Page `/manager/staff`
 * DỮ LIỆU FE GỬI: Header Token Manager
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { UserID, FullName, Email, PhoneNumber, IsActive } ] }`
 */
router.get("/staff", hasPermission('MANAGE_USERS'), mc.getStaffList);

/**
 * ROUTE: POST /manager/system-maintenance
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isManager` + `hasPermission('MANAGE_BUILDINGS')`
 * QUYỀN YÊU CẦU: `MANAGE_BUILDINGS` (Thông báo bảo trì hệ thống tòa nhà)
 * CONTROLLER BE: `BE/src/controllers/managerController.js` -> `broadcastSystemMaintenance()`
 * FE FILE GỌI: `FE/src/apis/managerApi.js` -> `broadcastMaintenance(payload)`
 * DỮ LIỆU FE GỬI: Body `{ message, startTime, endTime }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã phát thông báo bảo trì tới toàn bộ người dùng' }`
 */
router.post("/system-maintenance", hasPermission('MANAGE_BUILDINGS'), mc.broadcastSystemMaintenance);

// QUẢN LÝ PHÂN CÔNG STAFF TRONG TÒA NHÀ CỦA MANAGER
// MIDDLEWARE BẢO VỆ: `hasPermission('MANAGE_USERS')`
router.get("/buildings/:buildingId/staff", hasPermission('MANAGE_USERS'), mc.getBuildingStaff);
router.get("/staff/unassigned", hasPermission('MANAGE_USERS'), mc.getUnassignedStaff);
router.post("/staff/assign", hasPermission('MANAGE_USERS'), mc.assignStaffToBuilding);
router.delete("/staff/assignments/:id", hasPermission('MANAGE_USERS'), mc.removeStaffFromBuilding);

export default router;
