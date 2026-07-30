/**
 * FILE: adminRoutes.js
 * MÔ TẢ: Định nghĩa các đường dẫn API dành riêng cho Quản trị viên (System Administrator).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Tất cả các route được bảo vệ bởi middleware `isAuthorized` + `isAdmin` ở file `src/routes/index.js` (gắn namespace `/admin/*`).
 * 2. Cung cấp toàn quyền quản trị hệ thống: Thống kê số lượng người dùng/tòa nhà, Quản lý tài khoản User (Tạo mới, Sửa, Khóa/Mở, Reset mật khẩu), Phân quyền Role-Permission Matrix, Quản lý toàn bộ Cơ sở hạ tầng (Tòa nhà, Tầng, Khu vực, Ô đỗ đơn lẻ & Ô đỗ hàng loạt), Tra cứu Audit Logs và Gửi thông báo hệ thống.
 */

import express from 'express';
// Import Middlewares phân quyền Admin
import { isAuthorized, isAdmin } from '../middlewares/authMiddleware.js';
// Import Controller xử lý logic Admin (`BE/src/controllers/adminController.js`)
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Bắt buộc tất cả các route trong file này phải đăng nhập (isAuthorized) và có quyền Admin (isAdmin)
router.use(isAuthorized, isAdmin);

// ─────────────────────────────────────────────────────────────
// 1. DASHBOARD & THỐNG KÊ TỔNG QUAN ADMIN
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /admin/stats
 * CONTROLLER BE: `BE/src/controllers/adminController.js` -> `getStats()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `getStats()` | Page `FE/src/pages/Admin/AdminDashboard.jsx`
 * DỮ LIỆU FE GỬI: Header Token Admin
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { totalUsers, totalBuildings, totalSlots, activeSessions } }`
 */
router.get('/stats', adminController.getStats);

/**
 * ROUTE: GET /admin/roles
 * CONTROLLER BE: `BE/src/controllers/adminController.js` -> `getRoles()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `getRoles()`
 * DỮ LIỆU FE GỬI: Header Token Admin
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { RoleID, RoleName, Description } ] }`
 */
router.get('/roles', adminController.getRoles);

// ─────────────────────────────────────────────────────────────
// 2. QUẢN LÝ NGƯỜI DÙNG (USER MANAGEMENT)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /admin/users
 * CONTROLLER BE: `BE/src/controllers/adminController.js` -> `getUsers()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `getUsers(params)` | Page `FE/src/pages/Admin/UserManagement.jsx`
 * DỮ LIỆU FE GỬI: Query params `?roleId=2&search=nguyen`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { UserID, FullName, Email, RoleName, IsActive } ] }`
 */
router.get('/users', adminController.getUsers);

/**
 * ROUTE: POST /admin/users
 * CONTROLLER BE: `BE/src/controllers/adminController.js` -> `createUser()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `createUser(payload)`
 * DỮ LIỆU FE GỬI: Body `{ fullName, email, password, roleId, phoneNumber }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Tạo tài khoản người dùng thành công', data }`
 */
router.post('/users', adminController.createUser);

/**
 * ROUTE: PATCH /admin/users/:id
 * CONTROLLER BE: `BE/src/controllers/adminController.js` -> `updateUser()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `updateUser(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ fullName, phoneNumber, roleId }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật thông tin người dùng thành công' }`
 */
router.patch('/users/:id', adminController.updateUser);

/**
 * ROUTE: PATCH /admin/users/:id/status
 * CONTROLLER BE: `BE/src/controllers/adminController.js` -> `toggleUserStatus()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `toggleUserStatus(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã đổi trạng thái tài khoản', isActive: true/false }`
 */
router.patch('/users/:id/status', adminController.toggleUserStatus);

/**
 * ROUTE: POST /admin/users/:id/reset-password
 * CONTROLLER BE: `BE/src/controllers/adminController.js` -> `resetUserPassword()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `resetPassword(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ newPassword }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đặt lại mật khẩu thành công' }`
 */
router.post('/users/:id/reset-password', adminController.resetUserPassword);

// ─────────────────────────────────────────────────────────────
// 3. MA TRẬN PHÂN QUYỀN (ROLE - PERMISSION MATRIX)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /admin/permissions
 * CONTROLLER BE: `BE/src/controllers/adminController.js` -> `getPermissions()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `getPermissions()`
 * DỮ LIỆU FE GỬI: Header Token Admin
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { PermissionID, PermissionCode, Description } ] }`
 */
router.get('/permissions', adminController.getPermissions);

/**
 * ROUTE: GET /admin/role-permissions
 * CONTROLLER BE: `BE/src/controllers/adminController.js` -> `getRolePermissions()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `getRolePermissions()`
 * DỮ LIỆU FE GỬI: Header Token Admin
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { RoleID, PermissionID } ] }`
 */
router.get('/role-permissions', adminController.getRolePermissions);

/**
 * ROUTE: PUT /admin/roles/:id/permissions
 * CONTROLLER BE: `BE/src/controllers/adminController.js` -> `updateRolePermissions()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `updateRolePermissions(roleId, permissionIds)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ permissionIds: [ 1, 2, 5 ] }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật quyền cho Role thành công' }`
 */
router.put('/roles/:id/permissions', adminController.updateRolePermissions);

// ─────────────────────────────────────────────────────────────
// 4. QUẢN LÝ CƠ SỞ HẠ TẦNG (BUILDINGS, FLOORS, ZONES, SLOTS)
// ─────────────────────────────────────────────────────────────

// Buildings
router.get('/buildings', adminController.getBuildings);
router.post('/buildings', adminController.createBuilding);
router.patch('/buildings/:id', adminController.updateBuilding);
router.delete('/buildings/:id', adminController.deleteBuilding);

// Floors
router.get('/floors', adminController.getFloors);
router.post('/floors', adminController.createFloor);
router.patch('/floors/:id', adminController.updateFloor);
router.delete('/floors/:id', adminController.deleteFloor);

// Zones
router.get('/zones', adminController.getZones);
router.post('/zones', adminController.createZone);
router.patch('/zones/:id', adminController.updateZone);
router.delete('/zones/:id', adminController.deleteZone);

// Slots (Đơn lẻ & Hàng loạt Bulk Insert)
router.get('/zones/:zoneId/slots', adminController.getSlotsByZone);
router.post('/slots', adminController.createSlot);

/**
 * ROUTE: POST /admin/slots/bulk
 * CONTROLLER BE: `BE/src/controllers/adminController.js` -> `createSlotsBulk()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `createSlotsBulk(payload)`
 * DỮ LIỆU FE GỬI: Body `{ zoneId, prefix: 'A', startNum: 1, count: 50, vehicleTypeId: 1 }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Tạo thành công 50 ô đỗ xe mới', data: { insertedCount: 50 } }`
 */
router.post('/slots/bulk', adminController.createSlotsBulk);
router.patch('/slots/:id', adminController.updateSlot);
router.delete('/slots/:id', adminController.deleteSlot);

// ─────────────────────────────────────────────────────────────
// 5. AUDIT LOGS & HỆ THỐNG THÔNG BÁO
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /admin/audit-logs
 * CONTROLLER BE: `BE/src/controllers/adminController.js` -> `getAuditLogs()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `getAuditLogs(params)` | Page `FE/src/pages/Admin/AuditLogs.jsx`
 * DỮ LIỆU FE GỬI: Query params `?limit=50&offset=0`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { LogID, UserID, Action, IPAddress, CreatedAt } ] }`
 */
router.get('/audit-logs', adminController.getAuditLogs);

/**
 * ROUTE: POST /admin/notify-manager
 * CONTROLLER BE: `BE/src/controllers/adminController.js` -> `notifyManagers()`
 * FE FILE GỌI: `FE/src/apis/adminApi.js` -> `notifyManagers(payload)`
 * DỮ LIỆU FE GỬI: Body `{ title, message }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Đã gửi thông báo đến tất cả Manager' }`
 */
router.post('/notify-manager', adminController.notifyManagers);

// ─────────────────────────────────────────────────────────────
// 6. PHẦN BỔ SUNG: QUẢN LÝ PHÂN CÔNG & ĐIỀU CHUYỂN NHÂN SỰ
// ─────────────────────────────────────────────────────────────
router.get('/buildings/:buildingId/assignments', adminController.getBuildingAssignments);
router.post('/assignments', adminController.assignUserToBuilding);
router.delete('/assignments/:id', adminController.removeBuildingAssignment);
router.post('/staff/transfer', adminController.transferStaff);

export default router;
