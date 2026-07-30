/**
 * FILE: managerController.js
 * MÔ TẢ: Controller xử lý các nghiệp vụ Quản lý Vận hành bãi đỗ xe (Manager Operations).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Báo cáo & Thống kê (Reports & Analytics): Doanh thu (`getRevenueReport`), Tỷ lệ lấp đầy (`getOccupancyReport`), Khung giờ cao điểm (`getPeakHoursReport`), Lưu lượng xe vào/ra (`getVehicleFlowReport`).
 * 2. Bảng giá & Chính sách giá (Pricing Policies): Thiết lập bảng giá theo block giờ, phí ban đêm (`NightPricingPolicies`), phí quá giờ.
 * 3. Quản lý Loại xe (Vehicle Types): Định cấu hình loại xe (Xe máy, Ô tô 4 chỗ, Ô tô SUV, Xe điện).
 * 4. Quản lý Sự cố & Xe nợ tiền (Incidents & Unpaid Sessions): Theo dõi tiến độ sự cố và danh sách các xe chưa hoàn tất nghĩa vụ thanh toán.
 * 5. Phát thông báo Bảo trì Toàn hệ thống (`broadcastSystemMaintenance`).
 */

// Import enum StatusCodes chuẩn quốc tế (200 OK, 201 CREATED,...) từ thư viện 'http-status-codes'
import { StatusCodes } from "http-status-codes";
// Import tất cả hàm dịch vụ nghiệp vụ từ 'BE/src/services/managerService.js'
// LIÊN KẾT FILE: `BE/src/services/managerService.js` - Chứa logic gọi SQL các báo cáo doanh thu, sơ đồ bãi và cấu hình chính sách giá đỗ.
import * as managerService from "../services/managerService.js";

/* ── BÁO CÁO DASHBOARD TRANG CHỦ QUẢN LÝ ────────────────────────────── */

/**
 * HÀM 1: getDashboard
 * TÁC DỤNG: Lấy dữ liệu báo cáo tổng quan dành cho Quản lý bãi (Doanh thu hôm nay, tỷ lệ đỗ, số xe active, số sự cố chưa đóng).
 * 
 * @route GET /api/manager/dashboard
 * @access Manager Only (Chỉ Quản lý)
 */
export async function getDashboard(req, res, next) {
    try {
        const data = await managerService.getDashboardStats();
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/* ── QUẢN LÝ TÒA NHÀ (BUILDINGS) ────────────────────────────────────── */

/**
 * HÀM 2: getBuildings
 * TÁC DỤNG: Lấy danh sách các Tòa nhà trong hệ thống.
 * 
 * @route GET /api/manager/buildings
 * @access Manager Only
 */
export async function getBuildings(req, res, next) {
    try {
        const managerUserId = req.user?.RoleName === 'Manager' ? req.user.UserID : null;
        const data = await managerService.getBuildings(managerUserId);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 3: updateBuilding
 * TÁC DỤNG: Cập nhật giờ hoạt động hoặc thông tin Tòa nhà.
 * 
 * @route PUT /api/manager/buildings/:id
 * @access Manager Only
 */
export async function updateBuilding(req, res, next) {
    try {
        const data = await managerService.updateBuilding(
            Number(req.params.id),
            req.body
        );
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Cập nhật thông tin tòa nhà thành công",
            data,
        });
    } catch (err) { next(err); }
}

export async function createBuilding(req, res, next) {
    try {
        const data = await managerService.createBuilding(req.body);
        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Tạo tòa nhà mới thành công",
            data,
        });
    } catch (err) { next(err); }
}

export async function deleteBuilding(req, res, next) {
    try {
        const data = await managerService.deleteBuilding(Number(req.params.id));
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Xóa tòa nhà thành công",
            data,
        });
    } catch (err) { next(err); }
}

/* ── QUẢN LÝ CỔNG TÒA NHÀ (GATES) ────────────────────────────────────── */

export async function getGates(req, res, next) {
    try {
        const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null;
        const data = await managerService.getGates(buildingId);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

export async function getGateById(req, res, next) {
    try {
        const data = await managerService.getGateById(Number(req.params.id));
        if (!data) {
            return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Không tìm thấy cổng" });
        }
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

export async function createGate(req, res, next) {
    try {
        const data = await managerService.createGate(req.body);
        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Tạo cổng bãi xe thành công",
            data,
        });
    } catch (err) { next(err); }
}

export async function updateGate(req, res, next) {
    try {
        const data = await managerService.updateGate(Number(req.params.id), req.body);
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Cập nhật thông tin cổng thành công",
            data,
        });
    } catch (err) { next(err); }
}

export async function deleteGate(req, res, next) {
    try {
        const data = await managerService.deleteGate(Number(req.params.id));
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Xóa cổng thành công",
            data,
        });
    } catch (err) { next(err); }
}

/* ── QUẢN LÝ TẦNG (FLOORS) ───────────────────────────────────────────── */

/**
 * HÀM 4: getFloors
 * TÁC DỤNG: Lấy danh sách Tầng thuộc tòa nhà.
 * 
 * @route GET /api/manager/floors?buildingId=1
 * @access Manager Only
 */
export async function getFloors(req, res, next) {
    try {
        const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null;
        const data = await managerService.getFloors(buildingId);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 5: updateFloor
 * TÁC DỤNG: Chỉnh sửa thông tin Tầng.
 * 
 * @route PUT /api/manager/floors/:id
 * @access Manager Only
 */
export async function updateFloor(req, res, next) {
    try {
        const data = await managerService.updateFloor(
            Number(req.params.id),
            req.body
        );
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Cập nhật tầng thành công",
            data,
        });
    } catch (err) { next(err); }
}

/* ── QUẢN LÝ KHU VỰC (ZONES) ────────────────────────────────────────── */

/**
 * HÀM 6: getZones
 * TÁC DỤNG: Lấy danh sách các Khu vực đỗ xe.
 * 
 * @route GET /api/manager/zones?floorId=1
 * @access Manager Only
 */
export async function getZones(req, res, next) {
    try {
        const floorId = req.query.floorId ? Number(req.query.floorId) : null;
        const data = await managerService.getZones(floorId);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 7: updateZone
 * TÁC DỤNG: Cập nhật cấu hình Khu vực đỗ xe.
 * 
 * @route PUT /api/manager/zones/:id
 * @access Manager Only
 */
export async function updateZone(req, res, next) {
    try {
        const data = await managerService.updateZone(
            Number(req.params.id),
            req.body
        );
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Cập nhật khu vực thành công",
            data,
        });
    } catch (err) { next(err); }
}

/* ── QUẢN LÝ VỊ TRÍ ĐỖ (PARKING SLOTS) ───────────────────────────────── */

/**
 * HÀM 8: getParkingSlots
 * TÁC DỤNG: Lấy danh sách toàn bộ ô đỗ xe kèm trạng thái thời gian thực và phân trang.
 * 
 * @route GET /api/manager/parking-slots?page=1&limit=50
 * @access Manager Only
 */
export async function getParkingSlots(req, res, next) {
    try {
        const result = await managerService.getParkingSlots({
            buildingId: req.query.buildingId ? Number(req.query.buildingId) : undefined,
            floorId: req.query.floorId ? Number(req.query.floorId) : undefined,
            zoneId: req.query.zoneId ? Number(req.query.zoneId) : undefined,
            status: req.query.status || undefined,
            vehicleTypeId: req.query.vehicleTypeId ? Number(req.query.vehicleTypeId) : undefined,
            search: req.query.search || undefined,
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 50,
        });
        return res.status(StatusCodes.OK).json({ success: true, ...result });
    } catch (err) { next(err); }
}

/**
 * HÀM 9: getSlotById
 * TÁC DỤNG: Tra cứu thông tin chi tiết một vị trí ô đỗ theo ID.
 * 
 * @route GET /api/manager/parking-slots/:id
 * @access Manager Only
 */
export async function getSlotById(req, res, next) {
    try {
        const data = await managerService.getSlotById(Number(req.params.id));
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 10: updateSlotStatus
 * TÁC DỤNG: Quản lý cập nhật trạng thái ô đỗ (Maintenance, Blocked, Available).
 * 
 * @route PUT /api/manager/parking-slots/:id/status
 * @access Manager Only
 */
export async function updateSlotStatus(req, res, next) {
    try {
        const data = await managerService.updateSlotStatus(
            Number(req.params.id),
            req.body
        );
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Cập nhật trạng thái slot thành công",
            data,
        });
    } catch (err) { next(err); }
}

/* ── QUẢN LÝ BẢNG GIÁ (PRICING POLICIES) ────────────────────────────── */

/**
 * HÀM 11: getPricingPolicies
 * TÁC DỤNG: Tra cứu bảng chính sách giá đỗ xe theo lượt, theo giờ, block đầu/tiếp theo.
 * 
 * @route GET /api/manager/pricing-policies
 * @access Manager Only
 */
export async function getPricingPolicies(req, res, next) {
    try {
        const data = await managerService.getPricingPolicies({
            vehicleTypeId: req.query.vehicleTypeId ? Number(req.query.vehicleTypeId) : undefined,
            isActive: req.query.isActive !== undefined ? Number(req.query.isActive) : undefined,
        });
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 12: createPricingPolicy
 * TÁC DỤNG: Thiết lập bảng giá đỗ xe mới.
 * 
 * @route POST /api/manager/pricing-policies
 * @access Manager Only
 */
export async function createPricingPolicy(req, res, next) {
    try {
        const data = await managerService.createPricingPolicy(req.body);
        return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Tạo chính sách giá thành công",
            data,
        });
    } catch (err) { next(err); }
}

/**
 * HÀM 13: updatePricingPolicy
 * TÁC DỤNG: Điều chỉnh mức giá đỗ xe của bảng giá hiện có.
 * 
 * @route PUT /api/manager/pricing-policies/:id
 * @access Manager Only
 */
export async function updatePricingPolicy(req, res, next) {
    try {
        const data = await managerService.updatePricingPolicy(
            Number(req.params.id),
            req.body
        );
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Cập nhật chính sách giá thành công",
            data,
        });
    } catch (err) { next(err); }
}

/**
 * HÀM 14: deletePricingPolicy
 * TÁC DỤNG: Xóa chính sách giá đỗ xe.
 * 
 * @route DELETE /api/manager/pricing-policies/:id
 * @access Manager Only
 */
export async function deletePricingPolicy(req, res, next) {
    try {
        const data = await managerService.deletePricingPolicy(Number(req.params.id));
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Xóa chính sách giá thành công",
            data,
        });
    } catch (err) { next(err); }
}

/**
 * HÀM 15: getNightPricingPolicies
 * TÁC DỤNG: Lấy cấu hình khung giờ ban đêm và mức phí gửi xe qua đêm.
 * 
 * @route GET /api/manager/night-pricing-policies
 * @access Manager Only
 */
export async function getNightPricingPolicies(req, res, next) {
    try {
        const data = await managerService.getNightPricingPolicies();
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 16: updateNightPricingPolicy
 * TÁC DỤNG: Cập nhật phí phụ thu gửi xe qua đêm.
 * 
 * @route PUT /api/manager/night-pricing-policies/:id
 * @access Manager Only
 */
export async function updateNightPricingPolicy(req, res, next) {
    try {
        const data = await managerService.updateNightPricingPolicy(Number(req.params.id), req.body);
        return res.status(StatusCodes.OK).json({ success: true, message: "Cập nhật giá đêm thành công", data });
    } catch (err) { next(err); }
}

/* ── QUẢN LÝ LOẠI PHƯƠNG TIỆN (VEHICLE TYPES) ────────────────────────── */

/**
 * HÀM 17: getVehicleTypes
 * TÁC DỤNG: Lấy danh sách loại phương tiện đang phục vụ kinh doanh.
 * 
 * @route GET /api/manager/vehicle-types
 * @access Manager Only
 */
export async function getVehicleTypes(req, res, next) {
    try {
        const data = await managerService.getVehicleTypes();
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/* ── QUẢN LÝ SỰ CỐ (INCIDENTS) ───────────────────────────────────────── */

/**
 * HÀM 18: getIncidents
 * TÁC DỤNG: Xem danh sách báo cáo sự cố từ bảo vệ gửi lên kèm bộ lọc ưu tiên.
 * 
 * @route GET /api/manager/incidents?page=1&limit=20
 * @access Manager Only
 */
export async function getIncidents(req, res, next) {
    try {
        const result = await managerService.getIncidents({
            status: req.query.status || undefined,
            priority: req.query.priority || undefined,
            search: req.query.search || undefined,
            page: req.query.page ? Number(req.query.page) : 1,
            limit: req.query.limit ? Number(req.query.limit) : 20,
        });
        return res.status(StatusCodes.OK).json({ success: true, ...result });
    } catch (err) { next(err); }
}

/**
 * HÀM 19: getIncidentById
 * TÁC DỤNG: Chi tiết sự cố tại bãi.
 * 
 * @route GET /api/manager/incidents/:id
 * @access Manager Only
 */
export async function getIncidentById(req, res, next) {
    try {
        const data = await managerService.getIncidentById(Number(req.params.id));
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 20: updateIncidentStatus
 * TÁC DỤNG: Phê duyệt phương án xử lý sự cố.
 * 
 * @route PUT /api/manager/incidents/:id/status
 * @access Manager Only
 */
export async function updateIncidentStatus(req, res, next) {
    try {
        const data = await managerService.updateIncidentStatus(
            Number(req.params.id),
            req.body
        );
        return res.status(StatusCodes.OK).json({
            success: true,
            message: "Cập nhật trạng thái sự cố thành công",
            data,
        });
    } catch (err) { next(err); }
}

/* ── BÁO CÁO THỐNG KÊ (REPORTS) ─────────────────────────────────────── */

/**
 * HÀM 21: getRevenueReport
 * TÁC DỤNG: Xuất báo cáo Doanh thu theo Ngày, Tuần, Tháng hoặc Năm.
 * 
 * @route GET /api/manager/reports/revenue?startDate=...&endDate=...&groupBy=day
 * @access Manager Only
 */
export async function getRevenueReport(req, res, next) {
    try {
        const data = await managerService.getRevenueReport({
            startDate: req.query.startDate || undefined,
            endDate: req.query.endDate || undefined,
            groupBy: req.query.groupBy || "day",
        });
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 22: getOccupancyReport
 * TÁC DỤNG: Xuất báo cáo Tỷ lệ đỗ đầy bãi (Occupancy Rate %).
 * 
 * @route GET /api/manager/reports/occupancy
 * @access Manager Only
 */
export async function getOccupancyReport(req, res, next) {
    try {
        const data = await managerService.getOccupancyReport();
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 23: getSessionsReport
 * TÁC DỤNG: Báo cáo tổng số lượt xe gửi theo khoảng thời gian.
 * 
 * @route GET /api/manager/reports/sessions
 * @access Manager Only
 */
export async function getSessionsReport(req, res, next) {
    try {
        const data = await managerService.getSessionsReport({
            startDate: req.query.startDate || undefined,
            endDate: req.query.endDate || undefined,
        });
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 24: getStaffList
 * TÁC DỤNG: Lấy danh sách nhân viên bảo vệ thuộc sự quản lý.
 * 
 * @route GET /api/manager/staff
 * @access Manager Only
 */
export async function getStaffList(req, res, next) {
    try {
        const data = await managerService.getStaffList();
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 25: getPeakHoursReport
 * TÁC DỤNG: Phân tích các Khung giờ Cao điểm trong ngày có số lượng xe ra vào đông nhất (giúp phân ca bảo vệ tối ưu).
 * 
 * @route GET /api/manager/reports/peak-hours
 * @access Manager Only
 */
export async function getPeakHoursReport(req, res, next) {
    try {
        const data = await managerService.getPeakHoursReport({
            startDate: req.query.startDate || undefined,
            endDate: req.query.endDate || undefined,
            vehicleTypeId: req.query.vehicleTypeId ? Number(req.query.vehicleTypeId) : undefined,
        });
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 26: getVehicleFlowReport
 * TÁC DỤNG: Phân tích Lưu lượng xe vào (Check-in) và xe ra (Check-out) theo từng khung giờ.
 * 
 * @route GET /api/manager/reports/vehicle-flow
 * @access Manager Only
 */
export async function getVehicleFlowReport(req, res, next) {
    try {
        const data = await managerService.getVehicleFlowReport({
            startDate: req.query.startDate || undefined,
            endDate: req.query.endDate || undefined,
        });
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/* ── CRUD LOẠI XE CHO MÀN HÌNH QUẢN LÝ ──────────────────────────────── */

/**
 * HÀM 27: getAllVehicleTypes
 * TÁC DỤNG: Lấy toàn bộ danh sách loại xe (bao gồm cả các loại đã ẩn).
 * 
 * @route GET /api/manager/all-vehicle-types
 * @access Manager Only
 */
export async function getAllVehicleTypes(req, res, next) {
    try {
        const data = await managerService.getAllVehicleTypes();
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/**
 * HÀM 28: createVehicleType
 * TÁC DỤNG: Thêm loại xe mới vào bãi.
 * 
 * @route POST /api/manager/vehicle-types
 * @access Manager Only
 */
export async function createVehicleType(req, res, next) {
    try {
        const data = await managerService.createVehicleType(req.body);
        return res.status(StatusCodes.CREATED).json({
            success: true, message: "Tạo loại xe thành công", data,
        });
    } catch (err) { next(err); }
}

/**
 * HÀM 29: updateVehicleType
 * TÁC DỤNG: Chỉnh sửa thông số tên loại xe.
 * 
 * @route PUT /api/manager/vehicle-types/:id
 * @access Manager Only
 */
export async function updateVehicleType(req, res, next) {
    try {
        const data = await managerService.updateVehicleType(Number(req.params.id), req.body);
        return res.status(StatusCodes.OK).json({
            success: true, message: "Cập nhật loại xe thành công", data,
        });
    } catch (err) { next(err); }
}

/**
 * HÀM 30: toggleVehicleType
 * TÁC DỤNG: Ẩn/Hiện một loại xe khỏi hệ thống đỗ.
 * 
 * @route PATCH /api/manager/vehicle-types/:id/toggle
 * @access Manager Only
 */
export async function toggleVehicleType(req, res, next) {
    try {
        const data = await managerService.toggleVehicleType(
            Number(req.params.id),
            req.body.isActive ? 1 : 0
        );
        return res.status(StatusCodes.OK).json({
            success: true, message: "Cập nhật trạng thái loại xe thành công", data,
        });
    } catch (err) { next(err); }
}

/* ── QUẢN LÝ XE NỢ TIỀN (UNPAID SESSIONS) ────────────────────────────── */

/**
 * HÀM 31: getUnpaidSessions
 * TÁC DỤNG: Tra cứu danh sách các phiên xe đã ra bãi nhưng chưa hoàn tất thanh toán tiền (Nợ tiền gửi xe).
 * 
 * @route GET /api/manager/unpaid-sessions
 * @access Manager Only
 */
export async function getUnpaidSessions(req, res, next) {
    try {
        const data = await managerService.getUnpaidSessions({
            search: req.query.search || undefined,
        });
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

/* ── THÔNG BÁO BẢO TRÌ HỆ THỐNG ─────────────────────────────────────── */

/**
 * HÀM 32: broadcastSystemMaintenance
 * TÁC DỤNG: Gửi thông báo bảo trì khẩn cấp tới toàn thể tài xế và nhân viên trong hệ thống.
 * 
 * @route POST /api/manager/notifications/broadcast-maintenance
 * @access Manager Only
 */
export async function broadcastSystemMaintenance(req, res, next) {
    try {
        await managerService.broadcastSystemMaintenance(req.body.message);
        return res.status(StatusCodes.OK).json({ success: true, message: "Đã gửi thông báo bảo trì toàn hệ thống" });
    } catch (err) { next(err); }
}

/* ── QUẢN LÝ NHÂN SỰ TÒA NHÀ DÀNH CHO MANAGER ── */

export async function getBuildingStaff(req, res, next) {
    try {
        const buildingId = Number(req.params.buildingId || req.query.buildingId);
        const data = await managerService.getBuildingStaff(buildingId, req.user?.UserID);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

export async function assignStaffToBuilding(req, res, next) {
    try {
        const result = await managerService.assignStaffToBuilding(req.body);
        return res.status(StatusCodes.OK).json(result);
    } catch (err) { next(err); }
}

export async function removeStaffFromBuilding(req, res, next) {
    try {
        const result = await managerService.removeStaffFromBuilding(Number(req.params.id));
        return res.status(StatusCodes.OK).json(result);
    } catch (err) { next(err); }
}

export async function getUnassignedStaff(req, res, next) {
    try {
        const data = await managerService.getUnassignedStaff();
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}
