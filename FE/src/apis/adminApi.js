/**
 * FILE: adminApi.js
 * MÔ TẢ: Tập hợp các API dành cho quyền Admin.
 * Bao gồm: Quản lý người dùng, vai trò, quyền, cấu hình cơ sở hạ tầng bãi đỗ xe
 * (Tòa nhà, Tầng, Khu vực, Vị trí đỗ) và Xem nhật ký hệ thống (Audit Logs).
 */
/*
Thinh , Hieu , Hưng , Duy
*/

import authorizeAxios from '../utils/authorizeAxios'

// authorizeAxios đã có baseURL kết thúc bằng /api → KHÔNG thêm /api ở đây.
const BASE = '/admin'

/* ── Stats ───────────────────────────────────────────────────── */
export const getAdminStatsAPI = () =>
  authorizeAxios.get(`${BASE}/stats`)

/* ── Roles ───────────────────────────────────────────────────── */
export const getRolesAPI = () =>
  authorizeAxios.get(`${BASE}/roles`)

/* ── Users ───────────────────────────────────────────────────── */
// params: { roleId?, isActive?, search?, page?, pageSize? }
export const getUsersAPI = (params = {}) =>
  authorizeAxios.get(`${BASE}/users`, { params })

// data: { fullName, email, password, phoneNumber?, roleId, dateOfBirth?, hireDate? }
export const createUserAPI = (data) =>
  authorizeAxios.post(`${BASE}/users`, data)

// data: { fullName?, phoneNumber?, roleId?, dateOfBirth?, hireDate?, avatarUrl? }
export const updateUserAPI = (id, data) =>
  authorizeAxios.patch(`${BASE}/users/${id}`, data)

export const toggleUserStatusAPI = (id, isActive) =>
  authorizeAxios.patch(`${BASE}/users/${id}/status`, { isActive: !!Number(isActive) })

// newPassword: string (Admin tự đặt mật khẩu mới)
export const resetUserPasswordAPI = (id, newPassword) =>
  authorizeAxios.post(`${BASE}/users/${id}/reset-password`, { newPassword })

/* ── Permissions ─────────────────────────────────────────────── */
export const getPermissionsAPI = () =>
  authorizeAxios.get(`${BASE}/permissions`)

export const getRolePermissionsAPI = () =>
  authorizeAxios.get(`${BASE}/role-permissions`)

// permissionIds: number[]
export const updateRolePermissionsAPI = (roleId, permissionIds) =>
  authorizeAxios.put(`${BASE}/roles/${roleId}/permissions`, { permissionIds })

/* ── Buildings ───────────────────────────────────────────────── */
export const getBuildingsAPI = (params = {}) =>
  authorizeAxios.get(`${BASE}/buildings`, { params })

// data: { buildingName, address?, operatingHours?, totalFloors? }
export const createBuildingAPI = (data) =>
  authorizeAxios.post(`${BASE}/buildings`, data)

export const updateBuildingAPI = (id, data) =>
  authorizeAxios.patch(`${BASE}/buildings/${id}`, data)

export const deleteBuildingAPI = (id) =>
  authorizeAxios.delete(`${BASE}/buildings/${id}`)

/* ── Floors ──────────────────────────────────────────────────── */
export const getFloorsAPI = (buildingId) =>
  authorizeAxios.get(`${BASE}/floors`, { params: buildingId ? { buildingId } : {} })

export const createFloorAPI = (data) => // { buildingId, floorName, isActive? }
  authorizeAxios.post(`${BASE}/floors`, data)

export const updateFloorAPI = (id, data) => // { floorName?, isActive? }
  authorizeAxios.patch(`${BASE}/floors/${id}`, data)

export const deleteFloorAPI = (id) =>
  authorizeAxios.delete(`${BASE}/floors/${id}`)

/* ── Zones ───────────────────────────────────────────────────── */
export const getZonesAPI = (floorId) =>
  authorizeAxios.get(`${BASE}/zones`, { params: floorId ? { floorId } : {} })

export const createZoneAPI = (data) => // { floorId, zoneName, allowedVehicleTypeId, totalSlots }
  authorizeAxios.post(`${BASE}/zones`, data)

export const updateZoneAPI = (id, data) => // { zoneName?, allowedVehicleTypeId?, totalSlots? }
  authorizeAxios.patch(`${BASE}/zones/${id}`, data)

export const deleteZoneAPI = (id) =>
  authorizeAxios.delete(`${BASE}/zones/${id}`)

/* ── Slots ───────────────────────────────────────────────────── */
// Danh sách slot trong 1 zone + thông tin sức chứa (actual/total/remaining)
export const getSlotsByZoneAPI = (zoneId) =>
  authorizeAxios.get(`${BASE}/zones/${zoneId}/slots`)

export const createSlotAPI = (data) => // { zoneId, slotCode, vehicleTypeId? }
  authorizeAxios.post(`${BASE}/slots`, data)

// Thêm nhiều slot theo dải số: { zoneId, prefix, start, end, pad?, vehicleTypeId? }
// vd: { zoneId: 1, prefix: 'A-M-', start: 6, end: 10, pad: 2 } → A-M-06..A-M-10
export const createSlotsBulkAPI = (data) =>
  authorizeAxios.post(`${BASE}/slots/bulk`, data)

export const updateSlotAPI = (id, data) => // { slotCode?, vehicleTypeId?, slotStatus? }
  authorizeAxios.patch(`${BASE}/slots/${id}`, data)

export const deleteSlotAPI = (id) =>
  authorizeAxios.delete(`${BASE}/slots/${id}`)

/* ── Audit Logs ──────────────────────────────────────────────── */
// params: { userId?, action?, fromDate?, toDate?, page?, pageSize?, search? }
// Lưu ý: backend hiện chưa hỗ trợ lọc `search` full-text trên AuditLogs (chỉ filter theo userId/action/khoảng ngày).
// Nếu cần tìm theo UserName/Description, lọc tạm phía client (xem AdminAuditLog.jsx).
export const getAuditLogsAPI = (params = {}) =>
  authorizeAxios.get(`${BASE}/audit-logs`, { params })