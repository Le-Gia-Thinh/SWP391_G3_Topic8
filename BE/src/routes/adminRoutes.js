/**
 * FILE: adminRoutes.js
 * MÔ TẢ: Định nghĩa các đường dẫn API dành riêng cho quyền Admin.
 * Admin có toàn quyền thao tác trên hệ thống (Quản lý User, Roles, Cơ sở hạ tầng).
 */

import express from 'express';
import { isAuthorized, isAdmin } from '../middlewares/authMiddleware.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Bắt buộc tất cả các route trong file này phải đăng nhập (isAuthorized) và có quyền Admin (isAdmin)
router.use(isAuthorized, isAdmin);

// ================= THỐNG KÊ (STATS) =================
// API lấy dữ liệu thống kê tổng quan cho Dashboard Admin
router.get('/stats', adminController.getStats);

// ================= QUẢN LÝ QUYỀN (ROLES) =================
// API lấy danh sách các Role trong hệ thống
router.get('/roles', adminController.getRoles);

// ================= QUẢN LÝ NGƯỜI DÙNG (USERS) =================
router.get('/users', adminController.getUsers); // Lấy danh sách người dùng
router.post('/users', adminController.createUser); // Tạo mới người dùng
router.patch('/users/:id', adminController.updateUser); // Cập nhật thông tin người dùng
router.patch('/users/:id/status', adminController.toggleUserStatus); // Khóa/Mở khóa người dùng
router.post('/users/:id/reset-password', adminController.resetUserPassword); // Reset mật khẩu người dùng

// ================= PHÂN QUYỀN (PERMISSIONS) =================
router.get('/permissions', adminController.getPermissions); // Lấy danh sách tất cả permission
router.get('/role-permissions', adminController.getRolePermissions); // Lấy mapping Role - Permission
router.put('/roles/:id/permissions', adminController.updateRolePermissions); // Cập nhật permission cho 1 role

// ================= CƠ SỞ HẠ TẦNG: BUILDINGS =================
router.get('/buildings', adminController.getBuildings);
router.post('/buildings', adminController.createBuilding);
router.patch('/buildings/:id', adminController.updateBuilding);
router.delete('/buildings/:id', adminController.deleteBuilding);

// ── Cơ sở hạ tầng: Floors (Tầng) ────────────────────────────────────
router.get('/floors', adminController.getFloors);            // Có thể filter theo ?buildingId=
router.post('/floors', adminController.createFloor);
router.patch('/floors/:id', adminController.updateFloor);
router.delete('/floors/:id', adminController.deleteFloor);

// ── Cơ sở hạ tầng: Zones (Khu vực) ─────────────────────────────────────
router.get('/zones', adminController.getZones);              // Có thể filter theo ?floorId=
router.post('/zones', adminController.createZone);
router.patch('/zones/:id', adminController.updateZone);
router.delete('/zones/:id', adminController.deleteZone);

// ── Cơ sở hạ tầng: Slots (Chỗ đỗ xe) ─────────────────────────────────────
router.get('/zones/:zoneId/slots', adminController.getSlotsByZone); // Lấy danh sách slot + sức chứa theo Zone
router.post('/slots', adminController.createSlot); // Tạo 1 slot
router.post('/slots/bulk', adminController.createSlotsBulk); // Tạo nhiều slot cùng lúc
router.patch('/slots/:id', adminController.updateSlot); // Cập nhật slot
router.delete('/slots/:id', adminController.deleteSlot); // Xóa slot

// ================= NHẬT KÝ HỆ THỐNG (AUDIT LOGS) =================
// API lấy lịch sử hoạt động của người dùng (chỉ Admin được xem)
router.get('/audit-logs', adminController.getAuditLogs);

export default router;