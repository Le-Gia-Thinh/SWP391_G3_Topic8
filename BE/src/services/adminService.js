/**
 * FILE: adminService.js
 * MÔ TẢ: Service cung cấp các logic xử lý nghiệp vụ dành cho Admin.
 * 
 * Chức năng:
 * - Quản lý cơ sở hạ tầng bãi đỗ xe: Tầng (Floors), Khu vực (Zones), Vị trí (Slots)
 * - Lấy số liệu thống kê tổng quan (Dashboard Stats)
 * - Quản lý người dùng, vai trò (Roles)
 */
/*
Thinh
*/

import { getPool, sql } from '../config/db.js'
import bcrypt from 'bcryptjs'
function httpError(statusCode, message, code) {
  const e = new Error(message)
  e.statusCode = statusCode
  e.code = code
  return e
}
const badRequest = (m, c = 'BAD_REQUEST') => httpError(400, m, c)
const notFound = (m, c = 'NOT_FOUND') => httpError(404, m, c)
const conflict = (m, c = 'CONFLICT') => httpError(409, m, c)

const SLOT_STATUSES = ['Available', 'Occupied', 'Reserved', 'Maintenance', 'Blocked']

/* =====================================================================
   FLOORS
   ===================================================================== */

export async function getFloors(buildingId) {
  const pool = await getPool()
  const result = await pool.request()
    .input('BuildingID', sql.Int, buildingId || null)
    .query(`
      SELECT
        f.FloorID, f.BuildingID, b.BuildingName, f.FloorName, f.IsActive,
        COUNT(DISTINCT z.ZoneID)  AS ZoneCount,
        COUNT(DISTINCT ps.SlotID) AS SlotCount
      FROM Floors f
      JOIN Buildings b          ON b.BuildingID = f.BuildingID
      LEFT JOIN Zones z         ON z.FloorID    = f.FloorID
      LEFT JOIN ParkingSlots ps ON ps.ZoneID    = z.ZoneID
      WHERE (@BuildingID IS NULL OR f.BuildingID = @BuildingID)
      GROUP BY f.FloorID, f.BuildingID, b.BuildingName, f.FloorName, f.IsActive
      ORDER BY f.BuildingID, f.FloorID
    `)
  return result.recordset
}

export async function createFloor({ buildingId, floorName, isActive = 1 }) {
  if (!buildingId) throw badRequest('Thiếu BuildingID.', 'BUILDING_ID_REQUIRED')
  const name = String(floorName || '').trim()
  if (!name) throw badRequest('Thiếu tên tầng (FloorName).', 'FLOOR_NAME_REQUIRED')
  if (name.length > 50) throw badRequest('Tên tầng tối đa 50 ký tự.', 'FLOOR_NAME_TOO_LONG')

  const pool = await getPool()

  const b = await pool.request()
    .input('BuildingID', sql.Int, Number(buildingId))
    .query('SELECT BuildingID, TotalFloors FROM Buildings WHERE BuildingID = @BuildingID')
  if (!b.recordset.length) throw notFound('Không tìm thấy tòa nhà.', 'BUILDING_NOT_FOUND')

  // ── Check giới hạn số tầng ──────────────────────────────────
  const building = b.recordset[0]
  if (building.TotalFloors != null && building.TotalFloors > 0) {
    const floorCountRes = await pool.request()
      .input('BuildingID', sql.Int, Number(buildingId))
      .query('SELECT COUNT(*) AS FloorCount FROM Floors WHERE BuildingID = @BuildingID')
    const currentCount = floorCountRes.recordset[0].FloorCount
    if (currentCount >= building.TotalFloors) {
      throw conflict(
        `Tòa nhà này chỉ có tối đa ${building.TotalFloors} tầng. Hãy tăng số tầng trong trang Cơ sở trước.`,
        'FLOOR_LIMIT_REACHED'
      )
    }
  }
  const dup = await pool.request()
    .input('BuildingID', sql.Int, Number(buildingId))
    .input('FloorName', sql.NVarChar(50), name)
    .query('SELECT FloorID FROM Floors WHERE BuildingID = @BuildingID AND FloorName = @FloorName')
  if (dup.recordset.length) throw conflict(`Tầng "${name}" đã tồn tại trong tòa nhà này.`, 'FLOOR_NAME_EXISTS')

  const ins = await pool.request()
    .input('BuildingID', sql.Int, Number(buildingId))
    .input('FloorName', sql.NVarChar(50), name)
    .input('IsActive', sql.Bit, isActive ? 1 : 0)
    .query(`
      INSERT INTO Floors (BuildingID, FloorName, IsActive)
      OUTPUT INSERTED.*
      VALUES (@BuildingID, @FloorName, @IsActive)
    `)
  return ins.recordset[0]
}

export async function updateFloor(floorId, { floorName, isActive }) {
  if (!floorId) throw badRequest('Thiếu FloorID.', 'FLOOR_ID_REQUIRED')

  const pool = await getPool()
  const cur = await pool.request()
    .input('FloorID', sql.Int, Number(floorId))
    .query('SELECT * FROM Floors WHERE FloorID = @FloorID')
  if (!cur.recordset.length) throw notFound('Không tìm thấy tầng.', 'FLOOR_NOT_FOUND')
  const current = cur.recordset[0]

  const req = pool.request().input('FloorID', sql.Int, Number(floorId))
  const sets = []

  if (floorName !== undefined) {
    const name = String(floorName).trim()
    if (!name) throw badRequest('Tên tầng không được rỗng.', 'FLOOR_NAME_REQUIRED')
    if (name.length > 50) throw badRequest('Tên tầng tối đa 50 ký tự.', 'FLOOR_NAME_TOO_LONG')
    if (name !== current.FloorName) {
      const dup = await pool.request()
        .input('BuildingID', sql.Int, current.BuildingID)
        .input('FloorName', sql.NVarChar(50), name)
        .input('FloorID', sql.Int, Number(floorId))
        .query('SELECT FloorID FROM Floors WHERE BuildingID = @BuildingID AND FloorName = @FloorName AND FloorID <> @FloorID')
      if (dup.recordset.length) throw conflict(`Tầng "${name}" đã tồn tại trong tòa nhà này.`, 'FLOOR_NAME_EXISTS')
    }
    req.input('FloorName', sql.NVarChar(50), name)
    sets.push('FloorName = @FloorName')
  }

  if (isActive !== undefined) {
    req.input('IsActive', sql.Bit, isActive ? 1 : 0)
    sets.push('IsActive = @IsActive')
  }

  if (sets.length === 0) throw badRequest('Không có trường nào để cập nhật.', 'NOTHING_TO_UPDATE')

  const upd = await req.query(`
    UPDATE Floors SET ${sets.join(', ')}
    OUTPUT INSERTED.*
    WHERE FloorID = @FloorID
  `)
  return upd.recordset[0]
}

export async function deleteFloor(floorId) {
  if (!floorId) throw badRequest('Thiếu FloorID.', 'FLOOR_ID_REQUIRED')

  const pool = await getPool()
  const cur = await pool.request()
    .input('FloorID', sql.Int, Number(floorId))
    .query('SELECT * FROM Floors WHERE FloorID = @FloorID')
  if (!cur.recordset.length) throw notFound('Không tìm thấy tầng.', 'FLOOR_NOT_FOUND')

  const z = await pool.request()
    .input('FloorID', sql.Int, Number(floorId))
    .query('SELECT TOP 1 ZoneID FROM Zones WHERE FloorID = @FloorID')
  if (z.recordset.length) {
    throw conflict('Không thể xóa tầng vì còn khu vực (zone) bên trong.', 'FLOOR_HAS_ZONES')
  }

  await pool.request()
    .input('FloorID', sql.Int, Number(floorId))
    .query('DELETE FROM Floors WHERE FloorID = @FloorID')
  return { floorId: Number(floorId), deleted: true }
}

/* =====================================================================
   ZONES
   ===================================================================== */

export async function getZones(floorId) {
  const pool = await getPool()
  const result = await pool.request()
    .input('FloorID', sql.Int, floorId || null)
    .query(`
      SELECT
        z.ZoneID, z.FloorID, f.FloorName,
        b.BuildingID, b.BuildingName,
        z.ZoneName, z.AllowedVehicleTypeID,
        vt.VehicleName AS AllowedVehicleName, vt.VehicleCode AS AllowedVehicleCode,
        z.TotalSlots,
        COUNT(ps.SlotID) AS ActualSlots
      FROM Zones z
      JOIN Floors f        ON f.FloorID        = z.FloorID
      JOIN Buildings b     ON b.BuildingID     = f.BuildingID
      JOIN VehicleTypes vt ON vt.VehicleTypeID = z.AllowedVehicleTypeID
      LEFT JOIN ParkingSlots ps ON ps.ZoneID   = z.ZoneID
      WHERE (@FloorID IS NULL OR z.FloorID = @FloorID)
      GROUP BY z.ZoneID, z.FloorID, f.FloorName, b.BuildingID, b.BuildingName,
               z.ZoneName, z.AllowedVehicleTypeID, vt.VehicleName, vt.VehicleCode, z.TotalSlots
      ORDER BY z.FloorID, z.ZoneID
    `)
  return result.recordset
}

export async function createZone({ floorId, zoneName, allowedVehicleTypeId, totalSlots = 0 }) {
  if (!floorId) throw badRequest('Thiếu FloorID.', 'FLOOR_ID_REQUIRED')
  const name = String(zoneName || '').trim()
  if (!name) throw badRequest('Thiếu tên khu vực (ZoneName).', 'ZONE_NAME_REQUIRED')
  if (name.length > 50) throw badRequest('Tên khu vực tối đa 50 ký tự.', 'ZONE_NAME_TOO_LONG')
  if (!allowedVehicleTypeId) throw badRequest('Vui lòng chọn loại xe cho phép.', 'VEHICLE_TYPE_REQUIRED')
  const total = Number(totalSlots)
  if (!Number.isInteger(total) || total < 0) throw badRequest('Sức chứa (TotalSlots) không hợp lệ.', 'INVALID_TOTAL_SLOTS')

  const pool = await getPool()

  const f = await pool.request()
    .input('FloorID', sql.Int, Number(floorId))
    .query('SELECT FloorID FROM Floors WHERE FloorID = @FloorID')
  if (!f.recordset.length) throw notFound('Không tìm thấy tầng.', 'FLOOR_NOT_FOUND')

  const vt = await pool.request()
    .input('VtId', sql.Int, Number(allowedVehicleTypeId))
    .query('SELECT VehicleTypeID FROM VehicleTypes WHERE VehicleTypeID = @VtId')
  if (!vt.recordset.length) throw notFound('Không tìm thấy loại xe.', 'VEHICLE_TYPE_NOT_FOUND')

  const dup = await pool.request()
    .input('FloorID', sql.Int, Number(floorId))
    .input('ZoneName', sql.NVarChar(50), name)
    .query('SELECT ZoneID FROM Zones WHERE FloorID = @FloorID AND ZoneName = @ZoneName')
  if (dup.recordset.length) throw conflict(`Khu vực "${name}" đã tồn tại trong tầng này.`, 'ZONE_NAME_EXISTS')

  const ins = await pool.request()
    .input('FloorID', sql.Int, Number(floorId))
    .input('ZoneName', sql.NVarChar(50), name)
    .input('AllowedVehicleTypeID', sql.Int, Number(allowedVehicleTypeId))
    .input('TotalSlots', sql.Int, total)
    .query(`
      INSERT INTO Zones (FloorID, ZoneName, AllowedVehicleTypeID, TotalSlots)
      OUTPUT INSERTED.*
      VALUES (@FloorID, @ZoneName, @AllowedVehicleTypeID, @TotalSlots)
    `)
  return ins.recordset[0]
}

export async function updateZone(zoneId, { zoneName, allowedVehicleTypeId, totalSlots }) {
  if (!zoneId) throw badRequest('Thiếu ZoneID.', 'ZONE_ID_REQUIRED')

  const pool = await getPool()

  const curRes = await pool.request()
    .input('ZoneID', sql.Int, Number(zoneId))
    .query(`
      SELECT z.*, COUNT(ps.SlotID) AS ActualSlots
      FROM Zones z
      LEFT JOIN ParkingSlots ps ON ps.ZoneID = z.ZoneID
      WHERE z.ZoneID = @ZoneID
      GROUP BY z.ZoneID, z.FloorID, z.ZoneName, z.AllowedVehicleTypeID, z.TotalSlots
    `)
  if (!curRes.recordset.length) throw notFound('Không tìm thấy khu vực.', 'ZONE_NOT_FOUND')
  const current = curRes.recordset[0]

  const req = pool.request().input('ZoneID', sql.Int, Number(zoneId))
  const sets = []

  if (zoneName !== undefined) {
    const name = String(zoneName).trim()
    if (!name) throw badRequest('Tên khu vực không được rỗng.', 'ZONE_NAME_REQUIRED')
    if (name.length > 50) throw badRequest('Tên khu vực tối đa 50 ký tự.', 'ZONE_NAME_TOO_LONG')
    if (name !== current.ZoneName) {
      const dup = await pool.request()
        .input('FloorID', sql.Int, current.FloorID)
        .input('ZoneName', sql.NVarChar(50), name)
        .input('ZoneID', sql.Int, Number(zoneId))
        .query('SELECT ZoneID FROM Zones WHERE FloorID = @FloorID AND ZoneName = @ZoneName AND ZoneID <> @ZoneID')
      if (dup.recordset.length) throw conflict(`Khu vực "${name}" đã tồn tại trong tầng này.`, 'ZONE_NAME_EXISTS')
    }
    req.input('ZoneName', sql.NVarChar(50), name)
    sets.push('ZoneName = @ZoneName')
  }

  if (allowedVehicleTypeId !== undefined) {
    const vtId = Number(allowedVehicleTypeId)
    const vt = await pool.request()
      .input('VtId', sql.Int, vtId)
      .query('SELECT VehicleTypeID FROM VehicleTypes WHERE VehicleTypeID = @VtId')
    if (!vt.recordset.length) throw notFound('Không tìm thấy loại xe.', 'VEHICLE_TYPE_NOT_FOUND')

    if (vtId !== current.AllowedVehicleTypeID) {
      const mismatch = await pool.request()
        .input('ZoneID', sql.Int, Number(zoneId))
        .input('VtId', sql.Int, vtId)
        .query('SELECT TOP 1 SlotID FROM ParkingSlots WHERE ZoneID = @ZoneID AND VehicleTypeID <> @VtId')
      if (mismatch.recordset.length) {
        throw conflict(
          'Không thể đổi loại xe của khu vực vì đang có slot thuộc loại xe khác. Hãy xóa/đổi các slot trước.',
          'ZONE_HAS_OTHER_VEHICLE_SLOTS'
        )
      }
    }
    req.input('AllowedVehicleTypeID', sql.Int, vtId)
    sets.push('AllowedVehicleTypeID = @AllowedVehicleTypeID')
  }

  if (totalSlots !== undefined) {
    const total = Number(totalSlots)
    if (!Number.isInteger(total) || total < 0) throw badRequest('Sức chứa (TotalSlots) không hợp lệ.', 'INVALID_TOTAL_SLOTS')
    if (total < current.ActualSlots) {
      throw conflict(
        `Sức chứa mới (${total}) nhỏ hơn số slot thực tế đang có (${current.ActualSlots}). Hãy xóa bớt slot trước.`,
        'TOTAL_SLOTS_BELOW_ACTUAL'
      )
    }
    req.input('TotalSlots', sql.Int, total)
    sets.push('TotalSlots = @TotalSlots')
  }

  if (sets.length === 0) throw badRequest('Không có trường nào để cập nhật.', 'NOTHING_TO_UPDATE')

  const upd = await req.query(`
    UPDATE Zones SET ${sets.join(', ')}
    OUTPUT INSERTED.*
    WHERE ZoneID = @ZoneID
  `)
  return upd.recordset[0]
}

export async function deleteZone(zoneId) {
  if (!zoneId) throw badRequest('Thiếu ZoneID.', 'ZONE_ID_REQUIRED')

  const pool = await getPool()
  const cur = await pool.request()
    .input('ZoneID', sql.Int, Number(zoneId))
    .query('SELECT * FROM Zones WHERE ZoneID = @ZoneID')
  if (!cur.recordset.length) throw notFound('Không tìm thấy khu vực.', 'ZONE_NOT_FOUND')

  const s = await pool.request()
    .input('ZoneID', sql.Int, Number(zoneId))
    .query('SELECT TOP 1 SlotID FROM ParkingSlots WHERE ZoneID = @ZoneID')
  if (s.recordset.length) {
    throw conflict('Không thể xóa khu vực vì còn slot bên trong.', 'ZONE_HAS_SLOTS')
  }

  await pool.request()
    .input('ZoneID', sql.Int, Number(zoneId))
    .query('DELETE FROM Zones WHERE ZoneID = @ZoneID')
  return { zoneId: Number(zoneId), deleted: true }
}

/* =====================================================================
   SLOTS
   ===================================================================== */

async function getZoneCapacity(pool, zoneId) {
  const r = await pool.request()
    .input('ZoneID', sql.Int, zoneId)
    .query(`
      SELECT z.ZoneID, z.ZoneName, z.AllowedVehicleTypeID, z.TotalSlots,
             COUNT(ps.SlotID) AS ActualSlots
      FROM Zones z
      LEFT JOIN ParkingSlots ps ON ps.ZoneID = z.ZoneID
      WHERE z.ZoneID = @ZoneID
      GROUP BY z.ZoneID, z.ZoneName, z.AllowedVehicleTypeID, z.TotalSlots
    `)
  return r.recordset[0] || null
}

async function getSlotFull(pool, slotId) {
  const r = await pool.request()
    .input('SlotID', sql.Int, slotId)
    .query(`
      SELECT
        ps.SlotID, ps.SlotCode, ps.SlotStatus,
        ps.VehicleTypeID, vt.VehicleName, vt.VehicleCode,
        ps.ZoneID, z.ZoneName, z.AllowedVehicleTypeID, z.TotalSlots,
        f.FloorID, f.FloorName,
        b.BuildingID, b.BuildingName
      FROM ParkingSlots ps
      JOIN VehicleTypes vt ON vt.VehicleTypeID = ps.VehicleTypeID
      JOIN Zones z         ON z.ZoneID         = ps.ZoneID
      JOIN Floors f        ON f.FloorID        = z.FloorID
      JOIN Buildings b     ON b.BuildingID     = f.BuildingID
      WHERE ps.SlotID = @SlotID
    `)
  return r.recordset[0] || null
}

export async function getSlotsByZone(zoneId) {
  if (!zoneId) throw badRequest('Thiếu ZoneID.', 'ZONE_ID_REQUIRED')
  const pool = await getPool()

  const zone = await getZoneCapacity(pool, Number(zoneId))
  if (!zone) throw notFound('Không tìm thấy khu vực.', 'ZONE_NOT_FOUND')

  const r = await pool.request()
    .input('ZoneID', sql.Int, Number(zoneId))
    .query(`
      SELECT
        ps.SlotID, ps.SlotCode, ps.SlotStatus,
        ps.VehicleTypeID, vt.VehicleName, vt.VehicleCode,
        CASE WHEN EXISTS (
          SELECT 1 FROM ParkingSessions s WHERE s.SlotID = ps.SlotID AND s.SessionStatus = 'Active'
        ) THEN 1 ELSE 0 END AS HasActiveSession,
        CASE WHEN EXISTS (
          SELECT 1 FROM Reservations rv WHERE rv.SlotID = ps.SlotID AND rv.ReservationStatus = 'Reserved'
        ) THEN 1 ELSE 0 END AS HasReservation
      FROM ParkingSlots ps
      JOIN VehicleTypes vt ON vt.VehicleTypeID = ps.VehicleTypeID
      WHERE ps.ZoneID = @ZoneID
      ORDER BY ps.SlotCode
    `)

  return {
    zone: {
      zoneId: zone.ZoneID,
      zoneName: zone.ZoneName,
      allowedVehicleTypeId: zone.AllowedVehicleTypeID,
      totalSlots: zone.TotalSlots,
      actualSlots: zone.ActualSlots,
      remaining: Math.max(0, (zone.TotalSlots || 0) - zone.ActualSlots),
    },
    slots: r.recordset,
  }
}

export async function createSlot({ zoneId, slotCode, vehicleTypeId }) {
  if (!zoneId) throw badRequest('Thiếu ZoneID.', 'ZONE_ID_REQUIRED')
  const code = String(slotCode || '').trim().toUpperCase()
  if (!code) throw badRequest('Thiếu mã slot (SlotCode).', 'SLOT_CODE_REQUIRED')
  if (code.length > 20) throw badRequest('Mã slot tối đa 20 ký tự.', 'SLOT_CODE_TOO_LONG')

  const pool = await getPool()
  const zone = await getZoneCapacity(pool, Number(zoneId))
  if (!zone) throw notFound('Không tìm thấy khu vực.', 'ZONE_NOT_FOUND')

  if (zone.TotalSlots != null && zone.ActualSlots >= zone.TotalSlots) {
    throw conflict(
      `Khu vực đã đầy (${zone.ActualSlots}/${zone.TotalSlots}). Hãy tăng sức chứa (TotalSlots) trước khi thêm slot.`,
      'ZONE_CAPACITY_FULL'
    )
  }

  const finalVehicleTypeId = vehicleTypeId ? Number(vehicleTypeId) : zone.AllowedVehicleTypeID
  if (finalVehicleTypeId !== zone.AllowedVehicleTypeID) {
    throw badRequest('Loại xe của slot phải trùng loại xe cho phép của khu vực.', 'VEHICLE_TYPE_MISMATCH')
  }

  const dup = await pool.request()
    .input('Code', sql.NVarChar(20), code)
    .query('SELECT SlotID FROM ParkingSlots WHERE SlotCode = @Code')
  if (dup.recordset.length) throw conflict(`Mã slot "${code}" đã tồn tại.`, 'SLOT_CODE_EXISTS')

  const ins = await pool.request()
    .input('ZoneID', sql.Int, Number(zoneId))
    .input('SlotCode', sql.NVarChar(20), code)
    .input('VehicleTypeID', sql.Int, finalVehicleTypeId)
    .query(`
      INSERT INTO ParkingSlots (ZoneID, SlotCode, SlotStatus, VehicleTypeID)
      OUTPUT INSERTED.SlotID
      VALUES (@ZoneID, @SlotCode, 'Available', @VehicleTypeID)
    `)
  return await getSlotFull(pool, ins.recordset[0].SlotID)
}

export async function createSlotsBulk({ zoneId, prefix, start, end, pad = 2, vehicleTypeId }) {
  if (!zoneId) throw badRequest('Thiếu ZoneID.', 'ZONE_ID_REQUIRED')
  const pfx = String(prefix || '').trim().toUpperCase()
  if (!pfx) throw badRequest('Thiếu tiền tố mã slot (prefix).', 'PREFIX_REQUIRED')

  const s = Number(start), e = Number(end), p = Number(pad)
  if (!Number.isInteger(s) || !Number.isInteger(e) || s < 0 || e < s) {
    throw badRequest('Dải số không hợp lệ (start <= end, >= 0).', 'INVALID_RANGE')
  }
  if (e - s + 1 > 200) throw badRequest('Tối đa 200 slot mỗi lần tạo.', 'TOO_MANY_SLOTS')

  const pool = await getPool()
  const zone = await getZoneCapacity(pool, Number(zoneId))
  if (!zone) throw notFound('Không tìm thấy khu vực.', 'ZONE_NOT_FOUND')

  const finalVehicleTypeId = vehicleTypeId ? Number(vehicleTypeId) : zone.AllowedVehicleTypeID
  if (finalVehicleTypeId !== zone.AllowedVehicleTypeID) {
    throw badRequest('Loại xe của slot phải trùng loại xe cho phép của khu vực.', 'VEHICLE_TYPE_MISMATCH')
  }

  const wanted = []
  for (let i = s; i <= e; i++) wanted.push(pfx + String(i).padStart(p, '0'))

  const existing = new Set()
  const exRes = await pool.request()
    .input('Pfx', sql.NVarChar(20), pfx + '%')
    .query('SELECT SlotCode FROM ParkingSlots WHERE SlotCode LIKE @Pfx')
  exRes.recordset.forEach(r => existing.add(r.SlotCode))

  const toInsert = wanted.filter(c => !existing.has(c))
  const skipped = wanted.filter(c => existing.has(c))

  if (zone.TotalSlots != null && zone.ActualSlots + toInsert.length > zone.TotalSlots) {
    const canAdd = Math.max(0, zone.TotalSlots - zone.ActualSlots)
    throw conflict(
      `Vượt sức chứa. Hiện ${zone.ActualSlots}/${zone.TotalSlots}, chỉ thêm được tối đa ${canAdd} slot. Bạn đang định thêm ${toInsert.length}.`,
      'ZONE_CAPACITY_EXCEEDED'
    )
  }

  if (toInsert.length === 0) {
    return { created: [], createdCount: 0, skipped, skippedCount: skipped.length }
  }

  const tx = new sql.Transaction(pool)
  await tx.begin()
  try {
    for (const code of toInsert) {
      await new sql.Request(tx)
        .input('ZoneID', sql.Int, Number(zoneId))
        .input('SlotCode', sql.NVarChar(20), code)
        .input('VehicleTypeID', sql.Int, finalVehicleTypeId)
        .query(`
          INSERT INTO ParkingSlots (ZoneID, SlotCode, SlotStatus, VehicleTypeID)
          VALUES (@ZoneID, @SlotCode, 'Available', @VehicleTypeID)
        `)
    }
    await tx.commit()
  } catch (err) {
    await tx.rollback()
    throw err
  }

  return { created: toInsert, createdCount: toInsert.length, skipped, skippedCount: skipped.length }
}

export async function updateSlot(slotId, { slotCode, vehicleTypeId, slotStatus }) {
  if (!slotId) throw badRequest('Thiếu SlotID.', 'SLOT_ID_REQUIRED')

  const pool = await getPool()
  const current = await getSlotFull(pool, Number(slotId))
  if (!current) throw notFound('Không tìm thấy slot.', 'SLOT_NOT_FOUND')

  const req = pool.request().input('SlotID', sql.Int, Number(slotId))
  const sets = []

  if (slotCode !== undefined) {
    const code = String(slotCode).trim().toUpperCase()
    if (!code) throw badRequest('Mã slot không được rỗng.', 'SLOT_CODE_REQUIRED')
    if (code.length > 20) throw badRequest('Mã slot tối đa 20 ký tự.', 'SLOT_CODE_TOO_LONG')
    if (code !== current.SlotCode) {
      const dup = await pool.request()
        .input('Code', sql.NVarChar(20), code)
        .input('SlotID', sql.Int, Number(slotId))
        .query('SELECT SlotID FROM ParkingSlots WHERE SlotCode = @Code AND SlotID <> @SlotID')
      if (dup.recordset.length) throw conflict(`Mã slot "${code}" đã tồn tại.`, 'SLOT_CODE_EXISTS')
    }
    req.input('SlotCode', sql.NVarChar(20), code)
    sets.push('SlotCode = @SlotCode')
  }

  if (vehicleTypeId !== undefined) {
    const vtId = Number(vehicleTypeId)
    if (vtId !== current.AllowedVehicleTypeID) {
      throw badRequest('Loại xe của slot phải trùng loại xe cho phép của khu vực.', 'VEHICLE_TYPE_MISMATCH')
    }
    req.input('VehicleTypeID', sql.Int, vtId)
    sets.push('VehicleTypeID = @VehicleTypeID')
  }

  if (slotStatus !== undefined) {
    if (!SLOT_STATUSES.includes(slotStatus)) {
      throw badRequest(`Trạng thái không hợp lệ. Cho phép: ${SLOT_STATUSES.join(', ')}`, 'INVALID_SLOT_STATUS')
    }
    req.input('SlotStatus', sql.NVarChar(20), slotStatus)
    sets.push('SlotStatus = @SlotStatus')
  }

  if (sets.length === 0) throw badRequest('Không có trường nào để cập nhật.', 'NOTHING_TO_UPDATE')

  await req.query(`UPDATE ParkingSlots SET ${sets.join(', ')} WHERE SlotID = @SlotID`)
  return await getSlotFull(pool, Number(slotId))
}

export async function deleteSlot(slotId) {
  if (!slotId) throw badRequest('Thiếu SlotID.', 'SLOT_ID_REQUIRED')

  const pool = await getPool()
  const slot = await getSlotFull(pool, Number(slotId))
  if (!slot) throw notFound('Không tìm thấy slot.', 'SLOT_NOT_FOUND')

  if (['Occupied', 'Reserved'].includes(slot.SlotStatus)) {
    throw conflict('Không thể xóa slot đang có xe hoặc đang được đặt.', 'SLOT_IN_USE')
  }

  const refs = await pool.request()
    .input('SlotID', sql.Int, Number(slotId))
    .query(`
      SELECT
        (SELECT COUNT(*) FROM ParkingSessions WHERE SlotID = @SlotID) AS SessionCount,
        (SELECT COUNT(*) FROM ParkingSessions WHERE SlotID = @SlotID AND SessionStatus = 'Active') AS ActiveSessions,
        (SELECT COUNT(*) FROM Reservations    WHERE SlotID = @SlotID AND ReservationStatus = 'Reserved') AS ActiveReservations
    `)
  const { SessionCount, ActiveSessions, ActiveReservations } = refs.recordset[0]

  if (ActiveSessions > 0) throw conflict('Slot đang có phiên gửi xe hoạt động, không thể xóa.', 'SLOT_HAS_ACTIVE_SESSION')
  if (ActiveReservations > 0) throw conflict('Slot đang có đặt chỗ hiệu lực, không thể xóa.', 'SLOT_HAS_RESERVATION')
  if (SessionCount > 0) {
    throw conflict(
      "Slot đã có lịch sử gửi xe. Không thể xóa cứng. Hãy chuyển trạng thái sang 'Blocked' để ngừng sử dụng.",
      'SLOT_HAS_HISTORY'
    )
  }

  await pool.request()
    .input('SlotID', sql.Int, Number(slotId))
    .query('DELETE FROM ParkingSlots WHERE SlotID = @SlotID')

  return { slotId: Number(slotId), slotCode: slot.SlotCode, deleted: true }
}


/* =====================================================================
   STATS (Dashboard tổng quan)
   ===================================================================== */

export async function getStats() {
  const pool = await getPool()

  const r = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM Users) AS TotalUsers,
      (SELECT COUNT(*) FROM Users WHERE IsActive = 1) AS ActiveUsers,
      (SELECT COUNT(*) FROM Users WHERE IsActive = 0) AS InactiveUsers,
      (SELECT COUNT(*) FROM Users WHERE IsEmailVerified = 1) AS VerifiedUsers,
 
      (SELECT COUNT(*) FROM Buildings) AS TotalBuildings,
      (SELECT COUNT(*) FROM Floors WHERE IsActive = 1) AS TotalFloors,
      (SELECT COUNT(*) FROM Zones) AS TotalZones,
 
      (SELECT COUNT(*) FROM ParkingSlots) AS TotalSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Available') AS AvailableSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Occupied') AS OccupiedSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Reserved') AS ReservedSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Maintenance') AS MaintenanceSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Blocked') AS BlockedSlots,
 
      (SELECT COUNT(*) FROM ParkingSessions WHERE SessionStatus = 'Active') AS ActiveSessions,
      (SELECT COUNT(*) FROM ParkingSessions WHERE CAST(EntryTime AS DATE) = CAST(GETDATE() AS DATE)) AS TodayCheckIns,
 
      (SELECT ISNULL(SUM(ISNULL(FinalAmount, Amount)), 0)
         FROM Payments
         WHERE PaymentStatus IN ('Completed', 'Prepaid')
           AND CAST(ISNULL(PaymentTime, PrepaidAt) AS DATE) = CAST(GETDATE() AS DATE)
      ) AS TodayRevenue,
 
      (SELECT COUNT(*) FROM Incidents WHERE IncidentStatus = 'Open') AS OpenIncidents,
      (SELECT COUNT(*) FROM SupportTickets WHERE Status IN ('Open', 'Pending')) AS OpenTickets
  `)
  const row = r.recordset[0]

  const roleStats = await pool.request().query(`
    SELECT r.RoleID, r.RoleName, COUNT(u.UserID) AS Count
    FROM Roles r
    LEFT JOIN Users u ON u.RoleID = r.RoleID
    GROUP BY r.RoleID, r.RoleName
    ORDER BY r.RoleID
  `)

  return {
    // Dùng trực tiếp bởi AdminDashboard.jsx
    totalUsers: row.TotalUsers,
    activeUsers: row.ActiveUsers,
    inactiveUsers: row.InactiveUsers,
    verifiedUsers: row.VerifiedUsers,
    usersByRole: roleStats.recordset,

    // Số liệu mở rộng, dùng cho các màn khác nếu cần
    infrastructure: {
      buildings: row.TotalBuildings,
      floors: row.TotalFloors,
      zones: row.TotalZones,
    },
    slots: {
      total: row.TotalSlots,
      available: row.AvailableSlots,
      occupied: row.OccupiedSlots,
      reserved: row.ReservedSlots,
      maintenance: row.MaintenanceSlots,
      blocked: row.BlockedSlots,
      occupancyRate: row.TotalSlots > 0 ? Math.round((row.OccupiedSlots / row.TotalSlots) * 1000) / 10 : 0,
    },
    sessions: {
      active: row.ActiveSessions,
      todayCheckIns: row.TodayCheckIns,
    },
    revenue: {
      today: row.TodayRevenue,
    },
    support: {
      openIncidents: row.OpenIncidents,
      openTickets: row.OpenTickets,
    },
  }
}

/* =====================================================================
   ROLES
   ===================================================================== */

export async function getRoles() {
  const pool = await getPool()
  const r = await pool.request().query(`
    SELECT r.RoleID, r.RoleName, r.Description,
           COUNT(u.UserID) AS UserCount
    FROM Roles r
    LEFT JOIN Users u ON u.RoleID = r.RoleID
    GROUP BY r.RoleID, r.RoleName, r.Description
    ORDER BY r.RoleID
  `)
  return r.recordset
}

/* =====================================================================
   USERS
   ===================================================================== */

export async function getUsers({ roleId, isActive, search, page = 1, pageSize = 100 } = {}) {
  const pool = await getPool()
  const offset = (Number(page) - 1) * Number(pageSize)

  const req = pool.request()
    .input('RoleID', sql.Int, roleId || null)
    .input('IsActive', sql.Bit, isActive === undefined || isActive === null || isActive === '' ? null : (Number(isActive) ? 1 : 0))
    .input('Search', sql.NVarChar(150), search ? `%${search}%` : null)
    .input('Offset', sql.Int, offset)
    .input('PageSize', sql.Int, Number(pageSize))

  const result = await req.query(`
    SELECT
      u.UserID, u.FullName, u.Email, u.PhoneNumber, u.RoleID, r.RoleName,
      u.DateOfBirth, u.HireDate, u.IsActive, u.IsEmailVerified, u.AvatarUrl,
      u.CreatedAt, u.UpdatedAt,
      COUNT(*) OVER() AS TotalCount
    FROM Users u
    JOIN Roles r ON u.RoleID = r.RoleID
    WHERE (@RoleID IS NULL OR u.RoleID = @RoleID)
      AND (@IsActive IS NULL OR u.IsActive = @IsActive)
      AND (@Search IS NULL OR u.FullName LIKE @Search OR u.Email LIKE @Search OR u.PhoneNumber LIKE @Search)
    ORDER BY u.UserID DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
  `)

  const totalCount = result.recordset[0]?.TotalCount || 0
  const users = result.recordset.map(({ TotalCount, ...u }) => u)

  return {
    data: users,
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      totalCount,
      totalPages: Math.ceil(totalCount / Number(pageSize)),
    },
  }
}

export async function createUser({ fullName, email, password, phoneNumber, roleId, dateOfBirth, hireDate }) {
  const name = String(fullName || '').trim()
  if (!name) throw badRequest('Thiếu họ tên (fullName).', 'FULLNAME_REQUIRED')

  const mail = String(email || '').trim().toLowerCase()
  if (!mail) throw badRequest('Thiếu email.', 'EMAIL_REQUIRED')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw badRequest('Email không hợp lệ.', 'EMAIL_INVALID')

  const pwd = String(password || '')
  if (pwd.length < 6) throw badRequest('Mật khẩu tối thiểu 6 ký tự.', 'PASSWORD_TOO_SHORT')

  if (!roleId) throw badRequest('Thiếu RoleID.', 'ROLE_ID_REQUIRED')

  const pool = await getPool()

  const role = await pool.request()
    .input('RoleID', sql.Int, Number(roleId))
    .query('SELECT RoleID, RoleName FROM Roles WHERE RoleID = @RoleID')
  if (!role.recordset.length) throw notFound('Không tìm thấy vai trò (Role).', 'ROLE_NOT_FOUND')

  const dup = await pool.request()
    .input('Email', sql.NVarChar(100), mail)
    .query('SELECT UserID FROM Users WHERE Email = @Email')
  if (dup.recordset.length) throw conflict('Email đã được sử dụng.', 'EMAIL_EXISTS')

  // Staff/Manager (RoleID 2,3) cần DateOfBirth + HireDate, và đủ 18 tuổi tại thời điểm HireDate (theo CK_Users_MinAge)
  const roleName = role.recordset[0].RoleName
  if (['Staff', 'Manager'].includes(roleName)) {
    if (!dateOfBirth || !hireDate) {
      throw badRequest('Staff/Manager bắt buộc phải có Ngày sinh và Ngày vào làm.', 'DOB_HIREDATE_REQUIRED')
    }
  }

  const passwordHash = await bcrypt.hash(pwd, 10)

  const tx = new sql.Transaction(pool)
  await tx.begin()
  try {
    const ins = await new sql.Request(tx)
      .input('FullName', sql.NVarChar(100), name)
      .input('Email', sql.NVarChar(100), mail)
      .input('PasswordHash', sql.NVarChar(256), passwordHash)
      .input('PhoneNumber', sql.NVarChar(20), phoneNumber || null)
      .input('RoleID', sql.Int, Number(roleId))
      .input('DateOfBirth', sql.Date, dateOfBirth || null)
      .input('HireDate', sql.Date, hireDate || null)
      .query(`
        INSERT INTO Users (FullName, Email, PasswordHash, PhoneNumber, RoleID, DateOfBirth, HireDate, IsActive, IsEmailVerified)
        OUTPUT INSERTED.*
        VALUES (@FullName, @Email, @PasswordHash, @PhoneNumber, @RoleID, @DateOfBirth, @HireDate, 1, 1)
      `)

    const newUser = ins.recordset[0]

    await new sql.Request(tx)
      .input('UserID', sql.Int, newUser.UserID)
      .input('Email', sql.NVarChar(100), mail)
      .query(`
        INSERT INTO UserAuthProviders (UserID, ProviderName, ProviderUserID, ProviderEmail)
        VALUES (@UserID, 'local', CAST(@UserID AS NVARCHAR(200)), @Email)
      `)

    await tx.commit()

    delete newUser.PasswordHash
    return newUser
  } catch (err) {
    await tx.rollback()
    throw err
  }
}

const SYSTEM_WALKIN_EMAIL = 'walkin.guest@system.local'

export async function updateUser(userId, { fullName, phoneNumber, roleId, dateOfBirth, hireDate, avatarUrl }) {
  if (!userId) throw badRequest('Thiếu UserID.', 'USER_ID_REQUIRED')

  const pool = await getPool()
  const cur = await pool.request()
    .input('UserID', sql.Int, Number(userId))
    .query('SELECT * FROM Users WHERE UserID = @UserID')
  if (!cur.recordset.length) throw notFound('Không tìm thấy người dùng.', 'USER_NOT_FOUND')
  const current = cur.recordset[0]

  // *** MỚI (Trường hợp B): chặn sửa tài khoản hệ thống walk-in guest ***
  // Tài khoản này đại diện cho khách vãng lai trong các phiên không có tài xế.
  // Đổi vai trò/sửa nó sẽ làm hỏng dữ liệu phiên walk-in cũ.
  if (current.Email === SYSTEM_WALKIN_EMAIL) {
    throw badRequest(
      'Đây là tài khoản hệ thống (khách vãng lai), không thể chỉnh sửa hoặc đổi vai trò.',
      'SYSTEM_ACCOUNT_PROTECTED'
    )
  }

  // ── Kiểm tra ràng buộc tuổi tối thiểu (CK_Users_MinAge) TRƯỚC khi update ──
  if (roleId !== undefined) {
    const roleRes = await pool.request()
      .input('RoleID', sql.Int, Number(roleId))
      .query('SELECT RoleID, RoleName FROM Roles WHERE RoleID = @RoleID')
    if (!roleRes.recordset.length) throw notFound('Không tìm thấy vai trò (Role).', 'ROLE_NOT_FOUND')

    const roleName = roleRes.recordset[0].RoleName
    if (['Staff', 'Manager'].includes(roleName)) {
      // Ưu tiên giá trị mới truyền lên trong request này, nếu không có thì lấy giá trị đang có sẵn trong DB
      const finalDOB = dateOfBirth !== undefined ? dateOfBirth : current.DateOfBirth
      const finalHireDate = hireDate !== undefined ? hireDate : current.HireDate

      if (!finalDOB || !finalHireDate) {
        throw badRequest(
          `Không thể chuyển sang vai trò "${roleName}" vì người dùng chưa có Ngày sinh / Ngày vào làm. Vui lòng vào trang Sửa để cập nhật Ngày sinh/Ngày vào làm trước.`,
          'DOB_HIREDATE_REQUIRED'
        )
      }

      const age = Math.floor(
        (new Date(finalHireDate) - new Date(finalDOB)) / (1000 * 60 * 60 * 24 * 365.25)
      )
      if (age < 18) {
        throw badRequest(
          `Người dùng chưa đủ 18 tuổi tại thời điểm vào làm, không thể chuyển sang vai trò "${roleName}".`,
          'UNDER_MIN_AGE'
        )
      }
    }
  }

  const req = pool.request().input('UserID', sql.Int, Number(userId))
  const sets = ['UpdatedAt = GETDATE()']

  if (fullName !== undefined) {
    const name = String(fullName).trim()
    if (!name) throw badRequest('Họ tên không được rỗng.', 'FULLNAME_REQUIRED')
    req.input('FullName', sql.NVarChar(100), name)
    sets.push('FullName = @FullName')
  }

  if (phoneNumber !== undefined) {
    req.input('PhoneNumber', sql.NVarChar(20), phoneNumber || null)
    sets.push('PhoneNumber = @PhoneNumber')
  }

  if (roleId !== undefined) {
    req.input('RoleID', sql.Int, Number(roleId))
    sets.push('RoleID = @RoleID')
  }

  if (dateOfBirth !== undefined) {
    req.input('DateOfBirth', sql.Date, dateOfBirth || null)
    sets.push('DateOfBirth = @DateOfBirth')
  }

  if (hireDate !== undefined) {
    req.input('HireDate', sql.Date, hireDate || null)
    sets.push('HireDate = @HireDate')
  }

  if (avatarUrl !== undefined) {
    req.input('AvatarUrl', sql.NVarChar(500), avatarUrl || null)
    sets.push('AvatarUrl = @AvatarUrl')
  }

  if (sets.length === 1) throw badRequest('Không có trường nào để cập nhật.', 'NOTHING_TO_UPDATE')

  const upd = await req.query(`
    UPDATE Users SET ${sets.join(', ')}
    OUTPUT INSERTED.*
    WHERE UserID = @UserID
  `)
  const updated = upd.recordset[0]
  delete updated.PasswordHash
  return updated
}

export async function toggleUserStatus(userId, isActive) {
  if (!userId) throw badRequest('Thiếu UserID.', 'USER_ID_REQUIRED')
  if (isActive === undefined || isActive === null) {
    throw badRequest('Thiếu trạng thái isActive.', 'IS_ACTIVE_REQUIRED')
  }

  const pool = await getPool()
  const cur = await pool.request()
    .input('UserID', sql.Int, Number(userId))
    .query('SELECT UserID FROM Users WHERE UserID = @UserID')
  if (!cur.recordset.length) throw notFound('Không tìm thấy người dùng.', 'USER_NOT_FOUND')

  const upd = await pool.request()
    .input('UserID', sql.Int, Number(userId))
    .input('IsActive', sql.Bit, isActive ? 1 : 0)
    .query(`
      UPDATE Users SET IsActive = @IsActive, UpdatedAt = GETDATE()
      OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.Email, INSERTED.IsActive
      WHERE UserID = @UserID
    `)
  return upd.recordset[0]
}

export async function resetUserPassword(userId, newPassword) {
  if (!userId) throw badRequest('Thiếu UserID.', 'USER_ID_REQUIRED')
  const pwd = String(newPassword || '')
  if (pwd.length < 6) throw badRequest('Mật khẩu tối thiểu 6 ký tự.', 'PASSWORD_TOO_SHORT')

  const pool = await getPool()
  const cur = await pool.request()
    .input('UserID', sql.Int, Number(userId))
    .query('SELECT UserID, Email FROM Users WHERE UserID = @UserID')
  if (!cur.recordset.length) throw notFound('Không tìm thấy người dùng.', 'USER_NOT_FOUND')

  const passwordHash = await bcrypt.hash(pwd, 10)

  await pool.request()
    .input('UserID', sql.Int, Number(userId))
    .input('PasswordHash', sql.NVarChar(256), passwordHash)
    .query(`
      UPDATE Users SET PasswordHash = @PasswordHash, UpdatedAt = GETDATE()
      WHERE UserID = @UserID
    `)

  // Đảm bảo có liên kết 'local' để user login bằng password vừa đặt
  const email = cur.recordset[0].Email
  const hasLocal = await pool.request()
    .input('UserID', sql.Int, Number(userId))
    .query(`SELECT 1 FROM UserAuthProviders WHERE UserID = @UserID AND ProviderName = 'local'`)
  if (!hasLocal.recordset.length) {
    await pool.request()
      .input('UserID', sql.Int, Number(userId))
      .input('Email', sql.NVarChar(100), email)
      .query(`
        INSERT INTO UserAuthProviders (UserID, ProviderName, ProviderUserID, ProviderEmail)
        VALUES (@UserID, 'local', CAST(@UserID AS NVARCHAR(200)), @Email)
      `)
  }

  return { userId: Number(userId), passwordReset: true }
}

/* =====================================================================
   PERMISSIONS
   ===================================================================== */

export async function getPermissions() {
  const pool = await getPool()
  const r = await pool.request().query(`
    SELECT PermissionID, PermissionName, Description
    FROM Permissions
    ORDER BY PermissionID
  `)
  return r.recordset
}

export async function getRolePermissions() {
  const pool = await getPool()
  const r = await pool.request().query(`
    SELECT rp.RoleID, r.RoleName, rp.PermissionID, p.PermissionName
    FROM RolePermissions rp
    JOIN Roles r ON r.RoleID = rp.RoleID
    JOIN Permissions p ON p.PermissionID = rp.PermissionID
    ORDER BY rp.RoleID, rp.PermissionID
  `)
  return r.recordset
}

export async function updateRolePermissions(roleId, permissionIds) {
  if (!roleId) throw badRequest('Thiếu RoleID.', 'ROLE_ID_REQUIRED')
  if (!Array.isArray(permissionIds)) {
    throw badRequest('permissionIds phải là một mảng.', 'PERMISSION_IDS_INVALID')
  }

  const pool = await getPool()
  const role = await pool.request()
    .input('RoleID', sql.Int, Number(roleId))
    .query('SELECT RoleID FROM Roles WHERE RoleID = @RoleID')
  if (!role.recordset.length) throw notFound('Không tìm thấy vai trò.', 'ROLE_NOT_FOUND')

  const ids = [...new Set(permissionIds.map(Number))].filter(Number.isInteger)

  if (ids.length) {
    const placeholders = ids.map((_, i) => `@p${i}`).join(', ')
    const checkReq = pool.request()
    ids.forEach((id, i) => checkReq.input(`p${i}`, sql.Int, id))
    const found = await checkReq.query(`SELECT PermissionID FROM Permissions WHERE PermissionID IN (${placeholders})`)
    if (found.recordset.length !== ids.length) {
      throw badRequest('Một số PermissionID không tồn tại.', 'PERMISSION_NOT_FOUND')
    }
  }

  const tx = new sql.Transaction(pool)
  await tx.begin()
  try {
    await new sql.Request(tx)
      .input('RoleID', sql.Int, Number(roleId))
      .query('DELETE FROM RolePermissions WHERE RoleID = @RoleID')

    for (const pid of ids) {
      await new sql.Request(tx)
        .input('RoleID', sql.Int, Number(roleId))
        .input('PermissionID', sql.Int, pid)
        .query('INSERT INTO RolePermissions (RoleID, PermissionID) VALUES (@RoleID, @PermissionID)')
    }

    await tx.commit()
  } catch (err) {
    await tx.rollback()
    throw err
  }

  return { roleId: Number(roleId), permissionIds: ids }
}

/* =====================================================================
   BUILDINGS
   ===================================================================== */

export async function getBuildings() {
  const pool = await getPool()
  const r = await pool.request().query(`
    SELECT
      b.BuildingID, b.BuildingName, b.Address, b.OperatingHours, b.TotalFloors,
      b.CreatedAt, b.UpdatedAt,
      COUNT(DISTINCT f.FloorID) AS ActualFloors,
      COUNT(DISTINCT z.ZoneID) AS ZoneCount,
      COUNT(DISTINCT ps.SlotID) AS SlotCount
    FROM Buildings b
    LEFT JOIN Floors f ON f.BuildingID = b.BuildingID
    LEFT JOIN Zones z ON z.FloorID = f.FloorID
    LEFT JOIN ParkingSlots ps ON ps.ZoneID = z.ZoneID
    GROUP BY b.BuildingID, b.BuildingName, b.Address, b.OperatingHours, b.TotalFloors, b.CreatedAt, b.UpdatedAt
    ORDER BY b.BuildingID
  `)
  return r.recordset
}

export async function createBuilding({ buildingName, address, operatingHours, totalFloors }) {
  const name = String(buildingName || '').trim()
  if (!name) throw badRequest('Thiếu tên tòa nhà (buildingName).', 'BUILDING_NAME_REQUIRED')
  if (name.length > 100) throw badRequest('Tên tòa nhà tối đa 100 ký tự.', 'BUILDING_NAME_TOO_LONG')

  const pool = await getPool()

  const ins = await pool.request()
    .input('BuildingName', sql.NVarChar(100), name)
    .input('Address', sql.NVarChar(200), address || null)
    .input('OperatingHours', sql.NVarChar(50), operatingHours || null)
    .input('TotalFloors', sql.Int, totalFloors != null ? Number(totalFloors) : null)
    .query(`
      INSERT INTO Buildings (BuildingName, Address, OperatingHours, TotalFloors)
      OUTPUT INSERTED.*
      VALUES (@BuildingName, @Address, @OperatingHours, @TotalFloors)
    `)
  return ins.recordset[0]
}

export async function updateBuilding(buildingId, { buildingName, address, operatingHours, totalFloors }) {
  if (!buildingId) throw badRequest('Thiếu BuildingID.', 'BUILDING_ID_REQUIRED')

  const pool = await getPool()
  const cur = await pool.request()
    .input('BuildingID', sql.Int, Number(buildingId))
    .query('SELECT * FROM Buildings WHERE BuildingID = @BuildingID')
  if (!cur.recordset.length) throw notFound('Không tìm thấy tòa nhà.', 'BUILDING_NOT_FOUND')

  const req = pool.request().input('BuildingID', sql.Int, Number(buildingId))
  const sets = ['UpdatedAt = GETDATE()']

  if (buildingName !== undefined) {
    const name = String(buildingName).trim()
    if (!name) throw badRequest('Tên tòa nhà không được rỗng.', 'BUILDING_NAME_REQUIRED')
    if (name.length > 100) throw badRequest('Tên tòa nhà tối đa 100 ký tự.', 'BUILDING_NAME_TOO_LONG')
    req.input('BuildingName', sql.NVarChar(100), name)
    sets.push('BuildingName = @BuildingName')
  }

  if (address !== undefined) {
    req.input('Address', sql.NVarChar(200), address || null)
    sets.push('Address = @Address')
  }

  if (operatingHours !== undefined) {
    req.input('OperatingHours', sql.NVarChar(50), operatingHours || null)
    sets.push('OperatingHours = @OperatingHours')
  }

  if (totalFloors !== undefined) {
    req.input('TotalFloors', sql.Int, totalFloors != null ? Number(totalFloors) : null)
    sets.push('TotalFloors = @TotalFloors')
  }

  if (sets.length === 1) throw badRequest('Không có trường nào để cập nhật.', 'NOTHING_TO_UPDATE')

  const upd = await req.query(`
    UPDATE Buildings SET ${sets.join(', ')}
    OUTPUT INSERTED.*
    WHERE BuildingID = @BuildingID
  `)
  return upd.recordset[0]
}

export async function deleteBuilding(buildingId) {
  if (!buildingId) throw badRequest('Thiếu BuildingID.', 'BUILDING_ID_REQUIRED')

  const pool = await getPool()
  const cur = await pool.request()
    .input('BuildingID', sql.Int, Number(buildingId))
    .query('SELECT * FROM Buildings WHERE BuildingID = @BuildingID')
  if (!cur.recordset.length) throw notFound('Không tìm thấy tòa nhà.', 'BUILDING_NOT_FOUND')

  const f = await pool.request()
    .input('BuildingID', sql.Int, Number(buildingId))
    .query('SELECT TOP 1 FloorID FROM Floors WHERE BuildingID = @BuildingID')
  if (f.recordset.length) {
    throw conflict('Không thể xóa tòa nhà vì còn tầng (floor) bên trong.', 'BUILDING_HAS_FLOORS')
  }

  await pool.request()
    .input('BuildingID', sql.Int, Number(buildingId))
    .query('DELETE FROM Buildings WHERE BuildingID = @BuildingID')
  return { buildingId: Number(buildingId), deleted: true }
}

/* =====================================================================
   AUDIT LOGS
   ===================================================================== */

export async function notifyManagers(title, message) {
  const pool = await getPool();
  await pool.request()
    .input("Title", sql.NVarChar(200), title || 'Thông báo từ Admin')
    .input("Message", sql.NVarChar(500), message || 'Có thông báo mới từ Admin.')
    .query(`
      INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType, IsRead, CreatedAt)
      SELECT u.UserID, @Title, @Message, 'System', NULL, 'AdminBroadcast', 0, GETDATE()
      FROM Users u
      JOIN Roles r ON u.RoleID = r.RoleID
      WHERE r.RoleName = 'Manager' AND u.IsActive = 1
    `);
}

export async function getAuditLogs({ userId, action, search, fromDate, toDate, page = 1, pageSize = 50 } = {}) {
  const pool = await getPool()
  const offset = (Number(page) - 1) * Number(pageSize)

  const result = await pool.request()
    .input('UserID', sql.Int, userId || null)
    .input('Action', sql.NVarChar(50), action || null)
    .input('Search', sql.NVarChar(150), search ? `%${search}%` : null)
    .input('FromDate', sql.DateTime, fromDate || null)
    .input('ToDate', sql.DateTime, toDate || null)
    .input('Offset', sql.Int, offset)
    .input('PageSize', sql.Int, Number(pageSize))
    .query(`
      SELECT
        LogID, UserID, UserName, RoleName, Action, Target, Description, IpAddress, CreatedAt,
        COUNT(*) OVER() AS TotalCount
      FROM AuditLogs
      WHERE (@UserID IS NULL OR UserID = @UserID)
        AND (@Action IS NULL OR Action = @Action)
        AND (@FromDate IS NULL OR CreatedAt >= @FromDate)
        AND (@ToDate IS NULL OR CreatedAt <= @ToDate)
        AND (@Search IS NULL OR UserName LIKE @Search OR Description LIKE @Search OR Target LIKE @Search)
      ORDER BY CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
    `)

  const totalCount = result.recordset[0]?.TotalCount || 0
  const logs = result.recordset.map(({ TotalCount, ...log }) => log)

  return {
    data: logs,
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      totalCount,
      totalPages: Math.ceil(totalCount / Number(pageSize)),
    },
  }
}