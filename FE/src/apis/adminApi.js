// src/apis/adminApi.js
//
// Lớp API cho khu vực Admin.
// ⚠️ Backend Admin CHƯA tồn tại (DB hiện chỉ có Driver/Staff/Manager).
// Tạm thời chạy bằng MOCK DATA để dựng & demo giao diện trước.
//
// 👉 KHI BACKEND SẴN SÀNG:
//    1. Đặt USE_MOCK = false
//    2. Bỏ phần mock, các hàm bên dưới đã gọi đúng endpoint thật theo
//       chuẩn authorizeAxios (baseURL đã có /api → chỉ cần /admin/...).
//
import authorizeAxios from '../utils/authorizeAxios'

const BASE = '/admin'

// Bật/tắt chế độ giả lập dữ liệu.
export const USE_MOCK = true

// ──────────────────────────────────────────────────────────────
// MOCK DATA (chỉ dùng khi USE_MOCK = true)
// ──────────────────────────────────────────────────────────────
const ROLES = [
  { RoleID: 1, RoleName: 'Driver', Description: 'Khách gửi xe' },
  { RoleID: 2, RoleName: 'Staff', Description: 'Nhân viên bãi đỗ' },
  { RoleID: 3, RoleName: 'Manager', Description: 'Quản lý bãi đỗ' },
  { RoleID: 4, RoleName: 'Admin', Description: 'Quản trị hệ thống' }
]

// Permissions (khớp seed SQLQuery1.sql)
const PERMISSIONS = [
  { PermissionID: 1, PermissionName: 'VIEW_SLOTS', Description: 'Xem vị trí đỗ' },
  { PermissionID: 2, PermissionName: 'MANAGE_SESSIONS', Description: 'Quản lý phiên đỗ' },
  { PermissionID: 3, PermissionName: 'MANAGE_USERS', Description: 'Quản lý người dùng' },
  { PermissionID: 4, PermissionName: 'VIEW_REPORTS', Description: 'Xem báo cáo' },
  { PermissionID: 5, PermissionName: 'MANAGE_PAYMENTS', Description: 'Quản lý thanh toán' }
]

// RolePermissions (khớp seed) — Admin (4) mặc định full quyền
let ROLE_PERMISSIONS = [
  { RoleID: 1, PermissionID: 1 },
  { RoleID: 2, PermissionID: 1 }, { RoleID: 2, PermissionID: 2 }, { RoleID: 2, PermissionID: 5 },
  { RoleID: 3, PermissionID: 1 }, { RoleID: 3, PermissionID: 2 }, { RoleID: 3, PermissionID: 3 }, { RoleID: 3, PermissionID: 4 }, { RoleID: 3, PermissionID: 5 },
  { RoleID: 4, PermissionID: 1 }, { RoleID: 4, PermissionID: 2 }, { RoleID: 4, PermissionID: 3 }, { RoleID: 4, PermissionID: 4 }, { RoleID: 4, PermissionID: 5 }
]

// Buildings (khớp seed)
let MOCK_BUILDINGS = [
  { BuildingID: 1, BuildingName: 'Toa A', Address: '123 Nguyen Van Linh, Q7', OperatingHours: '06:00-22:00', TotalFloors: 3, CreatedAt: '2024-12-01T07:00:00' },
  { BuildingID: 2, BuildingName: 'Toa B', Address: '456 Le Van Viet, Q9', OperatingHours: '00:00-23:59', TotalFloors: 2, CreatedAt: '2024-12-01T07:00:00' }
]

// Audit Logs — nhật ký hoạt động (DB chưa có bảng, mock trước)
// Action: Login | Logout | Create | Update | Delete | Lock | Unlock
const MOCK_AUDIT_LOGS = [
  { LogID: 1, UserName: 'Grace Admin', RoleName: 'Admin', Action: 'Login', Target: 'Hệ thống', Description: 'Đăng nhập vào trang quản trị', IpAddress: '192.168.1.10', CreatedAt: '2026-06-18T08:05:00' },
  { LogID: 2, UserName: 'Grace Admin', RoleName: 'Admin', Action: 'Create', Target: 'Người dùng', Description: 'Tạo tài khoản "Frank Driver"', IpAddress: '192.168.1.10', CreatedAt: '2026-06-18T08:12:00' },
  { LogID: 3, UserName: 'Carol Manager', RoleName: 'Manager', Action: 'Update', Target: 'Bảng giá', Description: 'Cập nhật chính sách giá ô tô', IpAddress: '192.168.1.22', CreatedAt: '2026-06-18T09:30:00' },
  { LogID: 4, UserName: 'Grace Admin', RoleName: 'Admin', Action: 'Lock', Target: 'Người dùng', Description: 'Khoá tài khoản "Emma Staff"', IpAddress: '192.168.1.10', CreatedAt: '2026-06-17T15:48:00' },
  { LogID: 5, UserName: 'Bob Staff', RoleName: 'Staff', Action: 'Login', Target: 'Hệ thống', Description: 'Đăng nhập ca làm việc', IpAddress: '192.168.1.30', CreatedAt: '2026-06-17T07:00:00' },
  { LogID: 6, UserName: 'Grace Admin', RoleName: 'Admin', Action: 'Update', Target: 'Cơ sở', Description: 'Sửa giờ hoạt động "Toa A"', IpAddress: '192.168.1.10', CreatedAt: '2026-06-16T11:20:00' },
  { LogID: 7, UserName: 'Carol Manager', RoleName: 'Manager', Action: 'Delete', Target: 'Sự cố', Description: 'Xoá báo cáo sự cố trùng lặp #12', IpAddress: '192.168.1.22', CreatedAt: '2026-06-16T14:05:00' },
  { LogID: 8, UserName: 'Grace Admin', RoleName: 'Admin', Action: 'Unlock', Target: 'Người dùng', Description: 'Mở khoá tài khoản "David Driver"', IpAddress: '192.168.1.10', CreatedAt: '2026-06-15T10:10:00' },
  { LogID: 9, UserName: 'Bob Staff', RoleName: 'Staff', Action: 'Logout', Target: 'Hệ thống', Description: 'Kết thúc ca làm việc', IpAddress: '192.168.1.30', CreatedAt: '2026-06-15T16:00:00' },
  { LogID: 10, UserName: 'Grace Admin', RoleName: 'Admin', Action: 'Create', Target: 'Cơ sở', Description: 'Thêm cơ sở mới "Toa B"', IpAddress: '192.168.1.10', CreatedAt: '2026-06-14T09:00:00' }
]

let MOCK_USERS = [
  { UserID: 1, FullName: 'Alice Driver', Email: 'alice@email.com', PhoneNumber: '0901000001', RoleID: 1, RoleName: 'Driver', IsActive: 1, IsEmailVerified: 1, CreatedAt: '2025-01-12T08:00:00' },
  { UserID: 2, FullName: 'Bob Staff', Email: 'bob@email.com', PhoneNumber: '0901000002', RoleID: 2, RoleName: 'Staff', IsActive: 1, IsEmailVerified: 1, CreatedAt: '2025-02-03T09:30:00' },
  { UserID: 3, FullName: 'Carol Manager', Email: 'carol@email.com', PhoneNumber: '0901000003', RoleID: 3, RoleName: 'Manager', IsActive: 1, IsEmailVerified: 1, CreatedAt: '2025-02-20T10:15:00' },
  { UserID: 4, FullName: 'David Driver', Email: 'david@email.com', PhoneNumber: '0901000004', RoleID: 1, RoleName: 'Driver', IsActive: 1, IsEmailVerified: 0, CreatedAt: '2025-03-08T14:45:00' },
  { UserID: 5, FullName: 'Emma Staff', Email: 'emma@email.com', PhoneNumber: '0901000005', RoleID: 2, RoleName: 'Staff', IsActive: 0, IsEmailVerified: 1, CreatedAt: '2025-03-19T11:20:00' },
  { UserID: 6, FullName: 'Frank Driver', Email: 'frank@email.com', PhoneNumber: '0901000006', RoleID: 1, RoleName: 'Driver', IsActive: 1, IsEmailVerified: 1, CreatedAt: '2025-04-01T16:05:00' },
  { UserID: 7, FullName: 'Grace Admin', Email: 'grace@parking.com', PhoneNumber: '0901000007', RoleID: 4, RoleName: 'Admin', IsActive: 1, IsEmailVerified: 1, CreatedAt: '2024-12-01T07:00:00' }
]

// Giả lập độ trễ mạng + bọc response theo đúng shape { data: { data } }
const mock = (data, ms = 300) =>
  new Promise((resolve) => setTimeout(() => resolve({ data: { success: true, data } }), ms))

function buildStats() {
  const byRole = ROLES.map((r) => ({
    RoleID: r.RoleID,
    RoleName: r.RoleName,
    Count: MOCK_USERS.filter((u) => u.RoleID === r.RoleID).length
  }))
  return {
    totalUsers: MOCK_USERS.length,
    activeUsers: MOCK_USERS.filter((u) => u.IsActive).length,
    inactiveUsers: MOCK_USERS.filter((u) => !u.IsActive).length,
    verifiedUsers: MOCK_USERS.filter((u) => u.IsEmailVerified).length,
    usersByRole: byRole
  }
}

// ──────────────────────────────────────────────────────────────
// API
// ──────────────────────────────────────────────────────────────

// Thống kê tổng quan hệ thống
export const getAdminStatsAPI = () =>
  USE_MOCK ? mock(buildStats()) : authorizeAxios.get(`${BASE}/stats`)

// Danh sách role
export const getRolesAPI = () =>
  USE_MOCK ? mock(ROLES) : authorizeAxios.get(`${BASE}/roles`)

// Danh sách user (hỗ trợ lọc theo search / roleId / isActive)
export const getUsersAPI = (params = {}) => {
  if (!USE_MOCK) return authorizeAxios.get(`${BASE}/users`, { params })

  let rows = [...MOCK_USERS]
  if (params.search) {
    const q = params.search.toLowerCase()
    rows = rows.filter(
      (u) =>
        u.FullName.toLowerCase().includes(q) ||
        u.Email.toLowerCase().includes(q) ||
        (u.PhoneNumber || '').includes(q)
    )
  }
  if (params.roleId) rows = rows.filter((u) => u.RoleID === Number(params.roleId))
  if (params.isActive !== undefined && params.isActive !== '')
    rows = rows.filter((u) => u.IsActive === Number(params.isActive))
  return mock(rows)
}

// Tạo user mới
export const createUserAPI = (data) => {
  if (!USE_MOCK) return authorizeAxios.post(`${BASE}/users`, data)

  const role = ROLES.find((r) => r.RoleID === Number(data.RoleID))
  const newUser = {
    UserID: Math.max(0, ...MOCK_USERS.map((u) => u.UserID)) + 1,
    FullName: data.FullName,
    Email: data.Email,
    PhoneNumber: data.PhoneNumber || null,
    RoleID: Number(data.RoleID),
    RoleName: role?.RoleName || '',
    IsActive: 1,
    IsEmailVerified: 0,
    CreatedAt: new Date().toISOString()
  }
  MOCK_USERS = [newUser, ...MOCK_USERS]
  return mock(newUser)
}

// Cập nhật user
export const updateUserAPI = (id, data) => {
  if (!USE_MOCK) return authorizeAxios.patch(`${BASE}/users/${id}`, data)

  MOCK_USERS = MOCK_USERS.map((u) => {
    if (u.UserID !== Number(id)) return u
    const role = ROLES.find((r) => r.RoleID === Number(data.RoleID ?? u.RoleID))
    return {
      ...u,
      ...data,
      RoleID: Number(data.RoleID ?? u.RoleID),
      RoleName: role?.RoleName || u.RoleName
    }
  })
  return mock(MOCK_USERS.find((u) => u.UserID === Number(id)))
}

// Khoá / mở khoá tài khoản
export const toggleUserStatusAPI = (id, isActive) => {
  if (!USE_MOCK)
    return authorizeAxios.patch(`${BASE}/users/${id}/status`, { isActive })

  MOCK_USERS = MOCK_USERS.map((u) =>
    u.UserID === Number(id) ? { ...u, IsActive: isActive ? 1 : 0 } : u
  )
  return mock(MOCK_USERS.find((u) => u.UserID === Number(id)))
}

// Admin đặt lại mật khẩu cho user (gửi mật khẩu tạm / link reset)
export const resetUserPasswordAPI = (id) => {
  if (!USE_MOCK) return authorizeAxios.post(`${BASE}/users/${id}/reset-password`)
  return mock({ UserID: Number(id) })
}

// ──────────────────────────────────────────────────────────────
// ROLES & PERMISSIONS (#2)
// ──────────────────────────────────────────────────────────────

// Danh sách permission trong hệ thống
export const getPermissionsAPI = () =>
  USE_MOCK ? mock(PERMISSIONS) : authorizeAxios.get(`${BASE}/permissions`)

// Ma trận role + permission đang gán (mỗi role kèm mảng permissionIds + số user)
export const getRolePermissionsAPI = () => {
  if (!USE_MOCK) return authorizeAxios.get(`${BASE}/role-permissions`)

  const data = ROLES.map((r) => ({
    ...r,
    userCount: MOCK_USERS.filter((u) => u.RoleID === r.RoleID).length,
    permissionIds: ROLE_PERMISSIONS.filter((rp) => rp.RoleID === r.RoleID).map((rp) => rp.PermissionID)
  }))
  return mock(data)
}

// Cập nhật toàn bộ permission của 1 role
export const updateRolePermissionsAPI = (roleId, permissionIds) => {
  if (!USE_MOCK)
    return authorizeAxios.put(`${BASE}/roles/${roleId}/permissions`, { permissionIds })

  ROLE_PERMISSIONS = ROLE_PERMISSIONS.filter((rp) => rp.RoleID !== Number(roleId))
  permissionIds.forEach((pid) =>
    ROLE_PERMISSIONS.push({ RoleID: Number(roleId), PermissionID: Number(pid) })
  )
  return mock({ roleId: Number(roleId), permissionIds })
}

// ──────────────────────────────────────────────────────────────
// BUILDINGS (#3)
// ──────────────────────────────────────────────────────────────

export const getBuildingsAPI = (params = {}) => {
  if (!USE_MOCK) return authorizeAxios.get(`${BASE}/buildings`, { params })

  let rows = [...MOCK_BUILDINGS]
  if (params.search) {
    const q = params.search.toLowerCase()
    rows = rows.filter(
      (b) => b.BuildingName.toLowerCase().includes(q) || (b.Address || '').toLowerCase().includes(q)
    )
  }
  return mock(rows)
}

export const createBuildingAPI = (data) => {
  if (!USE_MOCK) return authorizeAxios.post(`${BASE}/buildings`, data)

  const newB = {
    BuildingID: Math.max(0, ...MOCK_BUILDINGS.map((b) => b.BuildingID)) + 1,
    BuildingName: data.BuildingName,
    Address: data.Address || null,
    OperatingHours: data.OperatingHours || null,
    TotalFloors: Number(data.TotalFloors) || 0,
    CreatedAt: new Date().toISOString()
  }
  MOCK_BUILDINGS = [...MOCK_BUILDINGS, newB]
  return mock(newB)
}

export const updateBuildingAPI = (id, data) => {
  if (!USE_MOCK) return authorizeAxios.patch(`${BASE}/buildings/${id}`, data)

  MOCK_BUILDINGS = MOCK_BUILDINGS.map((b) =>
    b.BuildingID === Number(id)
      ? { ...b, ...data, TotalFloors: Number(data.TotalFloors ?? b.TotalFloors) }
      : b
  )
  return mock(MOCK_BUILDINGS.find((b) => b.BuildingID === Number(id)))
}

export const deleteBuildingAPI = (id) => {
  if (!USE_MOCK) return authorizeAxios.delete(`${BASE}/buildings/${id}`)

  MOCK_BUILDINGS = MOCK_BUILDINGS.filter((b) => b.BuildingID !== Number(id))
  return mock({ BuildingID: Number(id) })
}

// ──────────────────────────────────────────────────────────────
// AUDIT LOG (#4)
// ──────────────────────────────────────────────────────────────

// Danh sách nhật ký (hỗ trợ lọc search / action)
export const getAuditLogsAPI = (params = {}) => {
  if (!USE_MOCK) return authorizeAxios.get(`${BASE}/audit-logs`, { params })

  let rows = [...MOCK_AUDIT_LOGS]
  if (params.search) {
    const q = params.search.toLowerCase()
    rows = rows.filter(
      (l) =>
        l.UserName.toLowerCase().includes(q) ||
        l.Description.toLowerCase().includes(q) ||
        (l.Target || '').toLowerCase().includes(q)
    )
  }
  if (params.action) rows = rows.filter((l) => l.Action === params.action)
  // mới nhất lên đầu
  rows.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt))
  return mock(rows)
}
