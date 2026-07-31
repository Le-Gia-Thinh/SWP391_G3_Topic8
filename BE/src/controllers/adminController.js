/**
 * FILE: adminController.js
 * MÔ TẢ: Controller xử lý toàn bộ các tính năng Quản trị Hệ thống cao cấp nhất dành riêng cho Admin (Toàn quyền / SuperAdmin).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Quản lý Cơ sở Hạ tầng đỗ xe (Parking Infrastructure): Tạo, Sửa, Xóa Tòa nhà (Buildings), Tầng (Floors), Khu vực đỗ (Zones) và Vị trí đỗ (Slots - hỗ trợ tạo hàng loạt Bulk Slots).
 * 2. Quản lý Tài khoản & Phân quyền (Users & Roles & Permissions): Tạo tài khoản nhân viên/quản lý, Khóa/Mở khóa tài khoản (`toggleUserStatus`), Đặt lại mật khẩu (`resetUserPassword`), và ma trận phân quyền chi tiết.
 * 3. Nhật ký Hoạt động (Audit Logs): Tự động ghi lại từng hành động can thiệp dữ liệu của Admin vào bảng `AuditLogs` qua hàm helper `audit`.
 * 4. Gửi Thông báo Hệ thống (System Notifications) tới nhóm Quản lý (Managers).
 */

// Import enum StatusCodes chuẩn quốc tế (200 OK, 201 CREATED,...) từ thư viện 'http-status-codes'
import { StatusCodes } from 'http-status-codes'
// Import hàm lấy kết nối SQL Server
import { getPool } from '../config/db.js'
// Import hàm ghi nhật ký audit log
import { logAudit } from '../utils/auditLogger.js'
// Import tất cả hàm xử lý từ tầng service 'BE/src/services/adminService.js'
// LIÊN KẾT FILE: `BE/src/services/adminService.js` - Thực thi các câu lệnh SQL quản trị hạ tầng bãi và người dùng.
import * as infra from '../services/adminService.js'

/**
 * HÀM HELPER: audit
 * TÁC DỤNG: Tự động ghi vết nhật ký tác động hệ thống (Create, Update, Delete, Lock, Unlock) vào bảng AuditLogs.
 * Cơ chế "best-effort" (try/catch nuốt lỗi), đảm bảo không ảnh hưởng tới phản hồi API nếu SQL Server ghi log gặp sự cố.
 */
async function audit(req, action, target, description) {
  try {
    const pool = await getPool()
    await logAudit(pool, req.user, action, target, description, req.ip)
  } catch { /* Đã nuốt lỗi trong logAudit */ }
}

/* ── QUẢN LÝ TẦNG BÃI ĐỖ XE (FLOORS) ─────────────────────────────────── */

/**
 * HÀM 1: getFloors
 * TÁC DỤNG: Lấy danh sách các tầng trong bãi đỗ xe (có thể lọc theo buildingId).
 * 
 * @route GET /api/admin/floors?buildingId=1
 * @access Admin Only
 */
export async function getFloors(req, res, next) {
  try {
    const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null
    const data = await infra.getFloors(buildingId)
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

/**
 * HÀM 2: createFloor
 * TÁC DỤNG: Khởi tạo thêm một Tầng mới cho Tòa nhà chỉ định.
 * 
 * @route POST /api/admin/floors
 * @access Admin Only
 */
export async function createFloor(req, res, next) {
  try {
    const data = await infra.createFloor({
      buildingId: req.body.buildingId,
      floorName: req.body.floorName,
      isActive: req.body.isActive,
    })
    // Ghi nhận vết Audit Log
    await audit(req, 'Create', 'Tầng', `Thêm tầng "${data.FloorName}" (Building ${data.BuildingID})`)
    return res.status(StatusCodes.CREATED).json({ success: true, message: 'Tạo tầng thành công', data })
  } catch (err) { next(err) }
}

/**
 * HÀM 3: updateFloor
 * TÁC DỤNG: Cập nhật tên hoặc trạng thái ẩn/hiện của Tầng.
 * 
 * @route PUT /api/admin/floors/:id
 * @access Admin Only
 */
export async function updateFloor(req, res, next) {
  try {
    const data = await infra.updateFloor(Number(req.params.id), {
      floorName: req.body.floorName,
      isActive: req.body.isActive,
    })
    await audit(req, 'Update', 'Tầng', `Cập nhật tầng ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Cập nhật tầng thành công', data })
  } catch (err) { next(err) }
}

/**
 * HÀM 4: deleteFloor
 * TÁC DỤNG: Xóa Tầng khỏi tòa nhà (Kiểm tra ràng buộc ô đỗ trước khi xóa).
 * 
 * @route DELETE /api/admin/floors/:id
 * @access Admin Only
 */
export async function deleteFloor(req, res, next) {
  try {
    const data = await infra.deleteFloor(Number(req.params.id))
    await audit(req, 'Delete', 'Tầng', `Xóa tầng ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Xóa tầng thành công', data })
  } catch (err) { next(err) }
}

/* ── QUẢN LÝ KHU VỰC ĐỖ XE (ZONES) ──────────────────────────────────── */

/**
 * HÀM 5: getZones
 * TÁC DỤNG: Lấy danh sách các Khu vực đỗ xe (Khu A, Khu B, Khu Ô tô, Khu Xe máy).
 * 
 * @route GET /api/admin/zones?floorId=1
 * @access Admin Only
 */
export async function getZones(req, res, next) {
  try {
    const floorId = req.query.floorId ? Number(req.query.floorId) : null
    const data = await infra.getZones(floorId)
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

/**
 * HÀM 6: createZone
 * TÁC DỤNG: Tạo Khu vực đỗ xe mới trong Tầng.
 * 
 * @route POST /api/admin/zones
 * @access Admin Only
 */
export async function createZone(req, res, next) {
  try {
    const data = await infra.createZone({
      floorId: req.body.floorId,
      zoneName: req.body.zoneName,
      allowedVehicleTypeId: req.body.allowedVehicleTypeId,
      totalSlots: req.body.totalSlots,
    })
    await audit(req, 'Create', 'Khu vực', `Thêm khu vực "${data.ZoneName}" (Floor ${data.FloorID})`)
    return res.status(StatusCodes.CREATED).json({ success: true, message: 'Tạo khu vực thành công', data })
  } catch (err) { next(err) }
}

/**
 * HÀM 7: updateZone
 * TÁC DỤNG: Chỉnh sửa thông tin Khu vực đỗ xe.
 * 
 * @route PUT /api/admin/zones/:id
 * @access Admin Only
 */
export async function updateZone(req, res, next) {
  try {
    const data = await infra.updateZone(Number(req.params.id), {
      zoneName: req.body.zoneName,
      allowedVehicleTypeId: req.body.allowedVehicleTypeId,
      totalSlots: req.body.totalSlots,
    })
    await audit(req, 'Update', 'Khu vực', `Cập nhật khu vực ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Cập nhật khu vực thành công', data })
  } catch (err) { next(err) }
}

/**
 * HÀM 8: deleteZone
 * TÁC DỤNG: Xóa Khu vực đỗ xe.
 * 
 * @route DELETE /api/admin/zones/:id
 * @access Admin Only
 */
export async function deleteZone(req, res, next) {
  try {
    const data = await infra.deleteZone(Number(req.params.id))
    await audit(req, 'Delete', 'Khu vực', `Xóa khu vực ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Xóa khu vực thành công', data })
  } catch (err) { next(err) }
}

/* ── QUẢN LÝ Ô ĐỖ XE (SLOTS) ──────────────────────────────────── */

/**
 * HÀM 9: getSlotsByZone
 * TÁC DỤNG: Lấy danh sách các ô đỗ xe thuộc về một Zone.
 * 
 * @route GET /api/admin/zones/:zoneId/slots
 * @access Admin Only
 */
export async function getSlotsByZone(req, res, next) {
  try {
    const data = await infra.getSlotsByZone(Number(req.params.zoneId))
    return res.status(StatusCodes.OK).json({ success: true, ...data })
  } catch (err) { next(err) }
}

/**
 * HÀM 10: createSlot
 * TÁC DỤNG: Tạo 1 ô đỗ xe đơn lẻ.
 * 
 * @route POST /api/admin/slots
 * @access Admin Only
 */
export async function createSlot(req, res, next) {
  try {
    const data = await infra.createSlot({
      zoneId: req.body.zoneId,
      slotCode: req.body.slotCode,
      vehicleTypeId: req.body.vehicleTypeId,
    })
    await audit(req, 'Create', 'Slot', `Thêm slot "${data.SlotCode}" (Zone ${data.ZoneID})`)
    return res.status(StatusCodes.CREATED).json({ success: true, message: 'Tạo slot thành công', data })
  } catch (err) { next(err) }
}

/**
 * HÀM 11: createSlotsBulk
 * TÁC DỤNG: Tạo HÀNG LOẠT ô đỗ xe tự động (Ví dụ sinh tự động từ A-01 đến A-50).
 * CÚ PHÁP & THUẬT NGỮ: `prefix: 'A-'`, `start: 1`, `end: 50`, `pad: 2` (Sinh chuỗi A-01, A-02,... A-50).
 * 
 * @route POST /api/admin/slots/bulk
 * @access Admin Only
 */
export async function createSlotsBulk(req, res, next) {
  try {
    const data = await infra.createSlotsBulk({
      zoneId: req.body.zoneId,
      prefix: req.body.prefix,
      start: req.body.start,
      end: req.body.end,
      pad: req.body.pad,
      vehicleTypeId: req.body.vehicleTypeId,
    })
    await audit(req, 'Create', 'Slot', `Tạo hàng loạt ${data.createdCount} slot (Zone ${req.body.zoneId})`)
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: `Đã tạo ${data.createdCount} slot, bỏ qua ${data.skippedCount} mã trùng`,
      data,
    })
  } catch (err) { next(err) }
}

/**
 * HÀM 12: updateSlot
 * TÁC DỤNG: Cập nhật thông tin ô đỗ xe.
 * 
 * @route PUT /api/admin/slots/:id
 * @access Admin Only
 */
export async function updateSlot(req, res, next) {
  try {
    const data = await infra.updateSlot(Number(req.params.id), {
      slotCode: req.body.slotCode,
      vehicleTypeId: req.body.vehicleTypeId,
      slotStatus: req.body.slotStatus,
    })
    await audit(req, 'Update', 'Slot', `Cập nhật slot ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Cập nhật slot thành công', data })
  } catch (err) { next(err) }
}

/**
 * HÀM 13: deleteSlot
 * TÁC DỤNG: Xóa một ô đỗ xe.
 * 
 * @route DELETE /api/admin/slots/:id
 * @access Admin Only
 */
export async function deleteSlot(req, res, next) {
  try {
    const data = await infra.deleteSlot(Number(req.params.id))
    await audit(req, 'Delete', 'Slot', `Xóa slot ID ${req.params.id} (${data.slotCode})`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Xóa slot thành công', data })
  } catch (err) { next(err) }
}

/* ── THỐNG KÊ TỔNG QUAN (STATS) ───────────────────────────────── */

/**
 * HÀM 14: getStats
 * TÁC DỤNG: Lấy dữ liệu báo cáo thống kê dành cho Admin (Tổng số người dùng, số xe trong bãi, tổng doanh thu).
 * 
 * @route GET /api/admin/stats
 * @access Admin Only
 */
export async function getStats(req, res, next) {
  try {
    const data = await infra.getStats()
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

/* ── QUẢN LÝ VAI TRÒ (ROLES) ──────────────────────────────────── */

/**
 * HÀM 15: getRoles
 * TÁC DỤNG: Lấy danh sách các vai trò (Driver, Staff, Manager, Admin).
 * 
 * @route GET /api/admin/roles
 * @access Admin Only
 */
export async function getRoles(req, res, next) {
  try {
    const data = await infra.getRoles()
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

/* ── QUẢN LÝ NGUỜI DÙNG (USERS) ───────────────────────────────── */

/**
 * HÀM 16: getUsers
 * TÁC DỤNG: Lấy danh sách người dùng hệ thống có phân trang và tìm kiếm.
 * 
 * @route GET /api/admin/users?page=1&pageSize=10&search=nguyen
 * @access Admin Only
 */
export async function getUsers(req, res, next) {
  try {
    const data = await infra.getUsers({
      roleId: req.query.roleId ? Number(req.query.roleId) : null,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : null,
      search: req.query.search,
      page: req.query.page,
      pageSize: req.query.pageSize,
    })
    return res.status(StatusCodes.OK).json({ success: true, ...data })
  } catch (err) { next(err) }
}

/**
 * HÀM 17: createUser
 * TÁC DỤNG: Admin trực tiếp khởi tạo tài khoản Nhân viên (Staff) hoặc Quản lý (Manager) mới.
 * 
 * @route POST /api/admin/users
 * @access Admin Only
 */
export async function createUser(req, res, next) {
  try {
    const data = await infra.createUser({
      fullName: req.body.fullName,
      email: req.body.email,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
      roleId: req.body.roleId,
      dateOfBirth: req.body.dateOfBirth,
      hireDate: req.body.hireDate,
    })
    await audit(req, 'Create', 'Người dùng', `Tạo tài khoản "${data.Email}" (Role ${data.RoleID})`)
    return res.status(StatusCodes.CREATED).json({ success: true, message: 'Tạo người dùng thành công', data })
  } catch (err) { next(err) }
}

/**
 * HÀM 18: updateUser
 * TÁC DỤNG: Cập nhật thông tin tài khoản người dùng.
 * 
 * @route PUT /api/admin/users/:id
 * @access Admin Only
 */
export async function updateUser(req, res, next) {
  try {
    const data = await infra.updateUser(Number(req.params.id), {
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      roleId: req.body.roleId,
      dateOfBirth: req.body.dateOfBirth,
      hireDate: req.body.hireDate,
      avatarUrl: req.body.avatarUrl,
    })
    await audit(req, 'Update', 'Người dùng', `Cập nhật người dùng ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Cập nhật người dùng thành công', data })
  } catch (err) { next(err) }
}

/**
 * HÀM 19: toggleUserStatus
 * TÁC DỤNG: Khóa hoặc Mở khóa tài khoản người dùng (`IsActive = 0 / 1`).
 * 
 * @route PATCH /api/admin/users/:id/toggle-status
 * @access Admin Only
 */
export async function toggleUserStatus(req, res, next) {
  try {
    const data = await infra.toggleUserStatus(Number(req.params.id), req.body.isActive)
    await audit(req, data.IsActive ? 'Unlock' : 'Lock', 'Người dùng', `${data.IsActive ? 'Mở khóa' : 'Khóa'} người dùng ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Cập nhật trạng thái thành công', data })
  } catch (err) { next(err) }
}

/**
 * HÀM 20: resetUserPassword
 * TÁC DỤNG: Admin cưỡng chế đặt lại mật khẩu mới cho người dùng.
 * 
 * @route PATCH /api/admin/users/:id/reset-password
 * @access Admin Only
 */
export async function resetUserPassword(req, res, next) {
  try {
    const data = await infra.resetUserPassword(Number(req.params.id), req.body.newPassword)
    await audit(req, 'Update', 'Người dùng', `Đặt lại mật khẩu cho người dùng ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Đặt lại mật khẩu thành công', data })
  } catch (err) { next(err) }
}

/* ── PHÂN QUYỀN (PERMISSIONS) ───────────────────────────────── */

/**
 * HÀM 21: getPermissions
 * TÁC DỤNG: Lấy danh sách tất cả các quyền hệ thống.
 * 
 * @route GET /api/admin/permissions
 * @access Admin Only
 */
export async function getPermissions(req, res, next) {
  try {
    const data = await infra.getPermissions()
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

/**
 * HÀM 22: getRolePermissions
 * TÁC DỤNG: Lấy ma trận quyền theo từng Vai trò.
 * 
 * @route GET /api/admin/role-permissions
 * @access Admin Only
 */
export async function getRolePermissions(req, res, next) {
  try {
    const data = await infra.getRolePermissions()
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

/**
 * HÀM 23: updateRolePermissions
 * TÁC DỤNG: Cập nhật danh sách quyền cho một Vai trò.
 * 
 * @route PUT /api/admin/roles/:id/permissions
 * @access Admin Only
 */
export async function updateRolePermissions(req, res, next) {
  try {
    const data = await infra.updateRolePermissions(Number(req.params.id), req.body.permissionIds)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Cập nhật phân quyền thành công', data })
  } catch (err) { next(err) }
}

export async function getUserPermissions(req, res, next) {
  try {
    const data = await infra.getUserPermissions(Number(req.params.id))
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

export async function updateUserPermissions(req, res, next) {
  try {
    const data = await infra.updateUserPermissions(Number(req.params.id), req.body.permissionIds)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Cập nhật quyền hạn cá nhân thành công', data })
  } catch (err) { next(err) }
}

/* ── QUẢN LÝ TÒA NHÀ (BUILDINGS) ─────────────────────────────── */

/**
 * HÀM 24: getBuildings
 * TÁC DỤNG: Lấy danh sách các Tòa nhà đỗ xe.
 * 
 * @route GET /api/admin/buildings
 * @access Admin Only
 */
export async function getBuildings(req, res, next) {
  try {
    const data = await infra.getBuildings()
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

/**
 * HÀM 25: createBuilding
 * TÁC DỤNG: Thêm Tòa nhà đỗ xe mới.
 * 
 * @route POST /api/admin/buildings
 * @access Admin Only
 */
export async function createBuilding(req, res, next) {
  try {
    const data = await infra.createBuilding({
      buildingName: req.body.buildingName || req.body.BuildingName,
      address: req.body.address || req.body.Address,
      operatingHours: req.body.operatingHours || req.body.OperatingHours,
      totalFloors: req.body.totalFloors || req.body.TotalFloors,
      latitude: req.body.latitude !== undefined ? req.body.latitude : req.body.Latitude,
      longitude: req.body.longitude !== undefined ? req.body.longitude : req.body.Longitude,
    })
    await audit(req, 'Create', 'Tòa nhà', `Thêm tòa nhà "${data.BuildingName}"`)
    return res.status(StatusCodes.CREATED).json({ success: true, message: 'Tạo tòa nhà thành công', data })
  } catch (err) { next(err) }
}

/**
 * HÀM 26: updateBuilding
 * TÁC DỤNG: Cập nhật thông tin Tòa nhà đỗ xe.
 * 
 * @route PUT /api/admin/buildings/:id
 * @access Admin Only
 */
export async function updateBuilding(req, res, next) {
  try {
    const data = await infra.updateBuilding(Number(req.params.id), {
      buildingName: req.body.buildingName || req.body.BuildingName,
      address: req.body.address || req.body.Address,
      operatingHours: req.body.operatingHours || req.body.OperatingHours,
      totalFloors: req.body.totalFloors || req.body.TotalFloors,
      latitude: req.body.latitude !== undefined ? req.body.latitude : req.body.Latitude,
      longitude: req.body.longitude !== undefined ? req.body.longitude : req.body.Longitude,
    })
    await audit(req, 'Update', 'Tòa nhà', `Cập nhật tòa nhà ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Cập nhật tòa nhà thành công', data })
  } catch (err) { next(err) }
}

/**
 * HÀM 27: deleteBuilding
 * TÁC DỤNG: Xóa Tòa nhà đỗ xe.
 * 
 * @route DELETE /api/admin/buildings/:id
 * @access Admin Only
 */
export async function deleteBuilding(req, res, next) {
  try {
    const data = await infra.deleteBuilding(Number(req.params.id))
    await audit(req, 'Delete', 'Tòa nhà', `Xóa tòa nhà ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Xóa tòa nhà thành công', data })
  } catch (err) { next(err) }
}

/* ── NHẬT KÝ HỆ THỐNG (AUDIT LOGS) ───────────────────────────── */

/**
 * HÀM 28: getAuditLogs
 * TÁC DỤNG: Tra cứu lịch sử nhật ký tác động hệ thống của Admin/Manager (Hỗ trợ phân trang, lọc theo thời gian, người thực hiện).
 * 
 * @route GET /api/admin/audit-logs?page=1&pageSize=20
 * @access Admin Only
 */
export async function getAuditLogs(req, res, next) {
  try {
    const result = await infra.getAuditLogs({
      userId: req.query.userId ? Number(req.query.userId) : null,
      action: req.query.action,
      search: req.query.search,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      page: req.query.page,
      pageSize: req.query.pageSize,
    })
    return res.status(StatusCodes.OK).json({ success: true, data: result.data, pagination: result.pagination })
  } catch (err) { next(err) }
}

/* ── THÔNG BÁO HỆ THỐNG (SYSTEM NOTIFICATIONS) ────────────────── */

/**
 * HÀM 29: notifyManagers
 * TÁC DỤNG: Gửi thông báo hệ thống trực tiếp đến toàn bộ Quản lý (Managers).
 * 
 * @route POST /api/admin/notifications/notify-managers
 * @access Admin Only
 */
export async function notifyManagers(req, res, next) {
  try {
    await infra.notifyManagers(req.body.title, req.body.message);
    return res.status(StatusCodes.OK).json({ success: true, message: "Đã gửi thông báo đến Manager" });
  } catch (err) { next(err); }
}

/* ── PHÂN CÔNG & ĐIỀU CHUYỂN NHÂN SỰ (BUILDING ASSIGNMENTS & STAFF TRANSFER) ── */

export async function assignUserToBuilding(req, res, next) {
  try {
    const result = await infra.assignUserToBuilding(req.body);
    return res.status(StatusCodes.OK).json(result);
  } catch (err) { next(err); }
}

export async function getBuildingAssignments(req, res, next) {
  try {
    const buildingId = Number(req.params.buildingId || req.query.buildingId);
    const data = await infra.getBuildingAssignments(buildingId);
    return res.status(StatusCodes.OK).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function removeBuildingAssignment(req, res, next) {
  try {
    const result = await infra.removeBuildingAssignment(Number(req.params.id));
    return res.status(StatusCodes.OK).json(result);
  } catch (err) { next(err); }
}

export async function transferStaff(req, res, next) {
  try {
    const result = await infra.transferStaff(req.body);
    return res.status(StatusCodes.OK).json(result);
  } catch (err) { next(err); }
}