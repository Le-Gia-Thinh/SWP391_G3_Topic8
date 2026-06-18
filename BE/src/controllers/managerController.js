// src/controllers/managerController.js
import { StatusCodes } from "http-status-codes";
import * as managerService from "../services/managerService.js";

// ── Dashboard ─────────────────────────────────────────────────
export async function getDashboard(req, res, next) {
    try {
        const data = await managerService.getDashboardStats();
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

// ── Buildings ─────────────────────────────────────────────────
export async function getBuildings(req, res, next) {
    try {
        const data = await managerService.getBuildings();
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

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

// ── Floors ────────────────────────────────────────────────────
export async function getFloors(req, res, next) {
    try {
        const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null;
        const data = await managerService.getFloors(buildingId);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

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

// ── Zones ─────────────────────────────────────────────────────
export async function getZones(req, res, next) {
    try {
        const floorId = req.query.floorId ? Number(req.query.floorId) : null;
        const data = await managerService.getZones(floorId);
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

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

// ── Parking Slots ─────────────────────────────────────────────
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

export async function getSlotById(req, res, next) {
    try {
        const data = await managerService.getSlotById(Number(req.params.id));
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

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

// ── Pricing ───────────────────────────────────────────────────
export async function getPricingPolicies(req, res, next) {
    try {
        const data = await managerService.getPricingPolicies({
            vehicleTypeId: req.query.vehicleTypeId ? Number(req.query.vehicleTypeId) : undefined,
            isActive: req.query.isActive !== undefined ? Number(req.query.isActive) : undefined,
        });
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

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

// ── Vehicle Types ─────────────────────────────────────────────
export async function getVehicleTypes(req, res, next) {
    try {
        const data = await managerService.getVehicleTypes();
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

// ── Incidents ─────────────────────────────────────────────────
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

export async function getIncidentById(req, res, next) {
    try {
        const data = await managerService.getIncidentById(Number(req.params.id));
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

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

// ── Reports ───────────────────────────────────────────────────
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

export async function getOccupancyReport(req, res, next) {
    try {
        const data = await managerService.getOccupancyReport();
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

export async function getSessionsReport(req, res, next) {
    try {
        const data = await managerService.getSessionsReport({
            startDate: req.query.startDate || undefined,
            endDate: req.query.endDate || undefined,
        });
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}

// ── Staff List ────────────────────────────────────────────────
export async function getStaffList(req, res, next) {
    try {
        const data = await managerService.getStaffList();
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}


// ── GET /api/manager/reports/peak-hours ──────────────────────
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

// ── GET /api/manager/reports/vehicle-flow ────────────────────
export async function getVehicleFlowReport(req, res, next) {
    try {
        const data = await managerService.getVehicleFlowReport({
            startDate: req.query.startDate || undefined,
            endDate: req.query.endDate || undefined,
        });
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}
// ── Vehicle Types CRUD ────────────────────────────────────────
// (getVehicleTypes đã có sẵn — controller này dùng getAllVehicleTypes cho trang quản lý)
export async function getAllVehicleTypes(req, res, next) {
    try {
        const data = await managerService.getAllVehicleTypes();
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}
 
export async function createVehicleType(req, res, next) {
    try {
        const data = await managerService.createVehicleType(req.body);
        return res.status(StatusCodes.CREATED).json({
            success: true, message: "Tạo loại xe thành công", data,
        });
    } catch (err) { next(err); }
}
 
export async function updateVehicleType(req, res, next) {
    try {
        const data = await managerService.updateVehicleType(Number(req.params.id), req.body);
        return res.status(StatusCodes.OK).json({
            success: true, message: "Cập nhật loại xe thành công", data,
        });
    } catch (err) { next(err); }
}
 
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
 
// ── Unpaid sessions ───────────────────────────────────────────
export async function getUnpaidSessions(req, res, next) {
    try {
        const data = await managerService.getUnpaidSessions({
            search: req.query.search || undefined,
        });
        return res.status(StatusCodes.OK).json({ success: true, data });
    } catch (err) { next(err); }
}
 