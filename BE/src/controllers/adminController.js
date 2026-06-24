import { StatusCodes } from 'http-status-codes'
import { getPool } from '../config/db.js'
import { logAudit } from '../utils/auditLogger.js'
import * as infra from '../services/adminService.js'

// Ghi audit log "best-effort" (không chặn response nếu lỗi)
async function audit(req, action, target, description) {
  try {
    const pool = await getPool()
    await logAudit(pool, req.user, action, target, description, req.ip)
  } catch { /* đã nuốt lỗi trong logAudit */ }
}

/* ── FLOORS ─────────────────────────────────────────────────── */

export async function getFloors(req, res, next) {
  try {
    const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null
    const data = await infra.getFloors(buildingId)
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

export async function createFloor(req, res, next) {
  try {
    const data = await infra.createFloor({
      buildingId: req.body.buildingId,
      floorName: req.body.floorName,
      isActive: req.body.isActive,
    })
    await audit(req, 'Create', 'Tầng', `Thêm tầng "${data.FloorName}" (Building ${data.BuildingID})`)
    return res.status(StatusCodes.CREATED).json({ success: true, message: 'Tạo tầng thành công', data })
  } catch (err) { next(err) }
}

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

export async function deleteFloor(req, res, next) {
  try {
    const data = await infra.deleteFloor(Number(req.params.id))
    await audit(req, 'Delete', 'Tầng', `Xóa tầng ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Xóa tầng thành công', data })
  } catch (err) { next(err) }
}

/* ── ZONES ──────────────────────────────────────────────────── */

export async function getZones(req, res, next) {
  try {
    const floorId = req.query.floorId ? Number(req.query.floorId) : null
    const data = await infra.getZones(floorId)
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

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

export async function deleteZone(req, res, next) {
  try {
    const data = await infra.deleteZone(Number(req.params.id))
    await audit(req, 'Delete', 'Khu vực', `Xóa khu vực ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Xóa khu vực thành công', data })
  } catch (err) { next(err) }
}

/* ── SLOTS ──────────────────────────────────────────────────── */

export async function getSlotsByZone(req, res, next) {
  try {
    const data = await infra.getSlotsByZone(Number(req.params.zoneId))
    return res.status(StatusCodes.OK).json({ success: true, ...data })
  } catch (err) { next(err) }
}

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

export async function deleteSlot(req, res, next) {
  try {
    const data = await infra.deleteSlot(Number(req.params.id))
    await audit(req, 'Delete', 'Slot', `Xóa slot ID ${req.params.id} (${data.slotCode})`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Xóa slot thành công', data })
  } catch (err) { next(err) }
}



/* ── STATS ──────────────────────────────────────────────────── */

export async function getStats(req, res, next) {
  try {
    const data = await infra.getStats()
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

/* ── ROLES ──────────────────────────────────────────────────── */

export async function getRoles(req, res, next) {
  try {
    const data = await infra.getRoles()
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

/* ── USERS ──────────────────────────────────────────────────── */

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

export async function toggleUserStatus(req, res, next) {
  try {
    const data = await infra.toggleUserStatus(Number(req.params.id), req.body.isActive)
    await audit(req, data.IsActive ? 'Unlock' : 'Lock', 'Người dùng', `${data.IsActive ? 'Mở khóa' : 'Khóa'} người dùng ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Cập nhật trạng thái thành công', data })
  } catch (err) { next(err) }
}

export async function resetUserPassword(req, res, next) {
  try {
    const data = await infra.resetUserPassword(Number(req.params.id), req.body.newPassword)
    await audit(req, 'Update', 'Người dùng', `Đặt lại mật khẩu cho người dùng ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Đặt lại mật khẩu thành công', data })
  } catch (err) { next(err) }
}

/* ── PERMISSIONS ────────────────────────────────────────────── */

export async function getPermissions(req, res, next) {
  try {
    const data = await infra.getPermissions()
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

export async function getRolePermissions(req, res, next) {
  try {
    const data = await infra.getRolePermissions()
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

export async function updateRolePermissions(req, res, next) {
  try {
    const data = await infra.updateRolePermissions(Number(req.params.id), req.body.permissionIds)
    await audit(req, 'Update', 'Phân quyền', `Cập nhật quyền cho Role ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Cập nhật phân quyền thành công', data })
  } catch (err) { next(err) }
}

/* ── BUILDINGS ──────────────────────────────────────────────── */

export async function getBuildings(req, res, next) {
  try {
    const data = await infra.getBuildings()
    return res.status(StatusCodes.OK).json({ success: true, data })
  } catch (err) { next(err) }
}

export async function createBuilding(req, res, next) {
  try {
    const data = await infra.createBuilding({
      buildingName: req.body.buildingName,
      address: req.body.address,
      operatingHours: req.body.operatingHours,
      totalFloors: req.body.totalFloors,
    })
    await audit(req, 'Create', 'Tòa nhà', `Thêm tòa nhà "${data.BuildingName}"`)
    return res.status(StatusCodes.CREATED).json({ success: true, message: 'Tạo tòa nhà thành công', data })
  } catch (err) { next(err) }
}

export async function updateBuilding(req, res, next) {
  try {
    const data = await infra.updateBuilding(Number(req.params.id), {
      buildingName: req.body.buildingName,
      address: req.body.address,
      operatingHours: req.body.operatingHours,
      totalFloors: req.body.totalFloors,
    })
    await audit(req, 'Update', 'Tòa nhà', `Cập nhật tòa nhà ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Cập nhật tòa nhà thành công', data })
  } catch (err) { next(err) }
}

export async function deleteBuilding(req, res, next) {
  try {
    const data = await infra.deleteBuilding(Number(req.params.id))
    await audit(req, 'Delete', 'Tòa nhà', `Xóa tòa nhà ID ${req.params.id}`)
    return res.status(StatusCodes.OK).json({ success: true, message: 'Xóa tòa nhà thành công', data })
  } catch (err) { next(err) }
}

/* ── AUDIT LOGS ─────────────────────────────────────────────── */



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

/* ── SYSTEM NOTIFICATIONS ───────────────────────────────────────── */
export async function notifyManagers(req, res, next) {
  try {
    await infra.notifyManagers(req.body.title, req.body.message);
    return res.status(StatusCodes.OK).json({ success: true, message: "Đã gửi thông báo đến Manager" });
  } catch (err) { next(err); }
}