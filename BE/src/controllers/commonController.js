// src/controllers/commonController.js
//
// Controller dùng chung cho dữ liệu tham chiếu (reference data): Roles, VehicleTypes,
// Buildings, Floors, Zones, Slots. Phục vụ các dropdown/form ở mọi role (Driver/Staff/Manager).
//
// dùng lại managerService cho Buildings/Floors/Zones/Slots/VehicleTypes thay vì
// Chỉ getRoles là query trực tiếp vì
// không service nào có sẵn.

import { getPool } from "../config/db.js";
import * as managerService from "../services/managerService.js";

// ── GET /api/common/roles ────────────────────────────────────────
// (Chỉ trả Driver cho form đăng ký công khai; Staff/Manager do Manager tạo)
export async function getRoles(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT RoleID, RoleName, Description
      FROM Roles
      ORDER BY RoleID
    `);
    return res.json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
}

// ── GET /api/common/vehicle-types ────────────────────────────────
export async function getVehicleTypes(req, res, next) {
  try {
    const data = await managerService.getVehicleTypes(); // chỉ IsActive = 1
    return res.json({ success: true, data });
  } catch (err) { next(err); }
}

// ── GET /api/common/buildings ────────────────────────────────────
export async function getBuildings(req, res, next) {
  try {
    const data = await managerService.getBuildings(); // kèm FloorCount/SlotCount
    return res.json({ success: true, data });
  } catch (err) { next(err); }
}

// ── GET /api/common/floors?buildingId= ───────────────────────────
export async function getFloors(req, res, next) {
  try {
    const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null;
    const data = await managerService.getFloors(buildingId);
    return res.json({ success: true, data });
  } catch (err) { next(err); }
}

// ── GET /api/common/zones?floorId= ───────────────────────────────
export async function getZones(req, res, next) {
  try {
    const floorId = req.query.floorId ? Number(req.query.floorId) : null;
    const data = await managerService.getZones(floorId);
    return res.json({ success: true, data });
  } catch (err) { next(err); }
}

// ── GET /api/common/slots ────────────────────────────────────────
// Danh sách slot phẳng cho map/dropdown. Hỗ trợ filter giống manager.
export async function getSlots(req, res, next) {
  try {
    const result = await managerService.getParkingSlots({
      buildingId: req.query.buildingId ? Number(req.query.buildingId) : undefined,
      floorId: req.query.floorId ? Number(req.query.floorId) : undefined,
      zoneId: req.query.zoneId ? Number(req.query.zoneId) : undefined,
      vehicleTypeId: req.query.vehicleTypeId ? Number(req.query.vehicleTypeId) : undefined,
      status: req.query.status || undefined,
      search: req.query.search || undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 200,
    });
    return res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

// ── GET /api/pricing?vehicleTypeId= ─────────────────────────────
// Bảng giá công khai cho Driver xem khi đặt chỗ
export async function getPricing(req, res, next) {
  try {
    const vehicleTypeId = req.query.vehicleTypeId ? Number(req.query.vehicleTypeId) : undefined;
    const data = await managerService.getPricingPolicies({ vehicleTypeId, isActive: true });
    return res.json({ success: true, data });
  } catch (err) { next(err); }
}