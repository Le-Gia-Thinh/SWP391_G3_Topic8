/**
 * FILE: adminService.js
 * MÔ TẢ: Service cung cấp toàn bộ các chức năng quản trị hệ thống cao cấp dành riêng cho Quản trị viên (System Administrator Engine).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. QUẢN LÝ CƠ SỞ HẠ TẦNG BÃI ĐỖ (Infrastructure Management):
 *    - Quản lý Tầng (`Floors`): Thêm/Sửa/Xóa tầng, kiểm tra giới hạn `TotalFloors` của Tòa nhà (`createFloor`, `updateFloor`, `deleteFloor`).
 *    - Quản lý Khu vực (`Zones`): Quản lý zone đỗ xe theo tầng (`createZone`, `updateZone`, `deleteZone`).
 *    - Quản lý Vị trí ô đỗ (`ParkingSlots`): Thêm/Sửa/Bảo trì ô đỗ xe, tự động sinh mã ô đỗ theo format (`createSlot`, `batchCreateSlots`, `updateSlot`).
 * 2. THỐNG KÊ DASHBOARD BÁO CÁO (System Analytics & Metrics):
 *    - Tổng quan số lượng Tài xế, Nhân viên, Doanh thu, Tỷ lệ lấp đầy bãi xe (`getDashboardStats`).
 *    - Biểu đồ doanh thu theo thời gian, theo phương thức thanh toán PayOS/Cash (`getRevenueAnalytics`).
 * 3. QUẢN LÝ TÀI KHOẢN VÀ PHÂN QUYỀN TÀI NGUYÊN (User & Role Management):
 *    - Tạo tài khoản Nhân viên / Quản lý (`createUser`), Mã hóa mật khẩu bằng `bcryptjs`.
 *    - Khóa / Mở khóa tài khoản (`toggleUserActive`), Phân lại vai trò hệ thống (`changeUserRole`).
 *    - Quản lý bảng giá niêm yết gửi xe lũy tiến (`updatePricingPolicy`).
 * 
 * @module adminService
 */

import { getPool, sql } from '../config/db.js'
import bcrypt from 'bcryptjs'

/**
 * HÀM PHỤ: httpError
 * TÁC DỤNG: Khởi tạo đối tượng Error kèm HTTP status code và mã lỗi hệ thống.
 */
function httpError(statusCode, message, code) {
  const e = new Error(message)
  e.statusCode = statusCode
  e.code = code
  return e
}
const badRequest = (m, c = 'BAD_REQUEST') => httpError(400, m, c)
const notFound = (m, c = 'NOT_FOUND') => httpError(404, m, c)
const conflict = (m, c = 'CONFLICT') => httpError(409, m, c)

// Các trạng thái khả thi của 1 ô đỗ xe trong hệ thống
const SLOT_STATUSES = ['Available', 'Occupied', 'Reserved', 'Maintenance', 'Blocked']


/* =====================================================================
   FLOORS (QUẢN LÝ TẦNG ĐỖ XE)
   ===================================================================== */

/**
 * HÀM: getFloors
 * MỤC ĐÍCH: Lấy danh sách các tầng gửi xe (có thể lọc theo Tòa nhà `buildingId`).
 * NGUỒN ĐẦU VÀO TỪ FE: `buildingId` (từ query string FE `req.query.buildingId`).
 * DỮ LIỆU TRẢ VỀ CHO FE: Mảng chứa thông tin Tầng (`FloorID`, `FloorName`), Tòa nhà (`BuildingName`), 
 *                        số lượng Zone (`ZoneCount`) và số ô đỗ (`SlotCount`) để hiển thị bảng quản lý tầng.
 */
export async function getFloors(buildingId) {
  const pool = await getPool()
  const result = await pool.request()
    // Gán tham số BuildingID dạng số nguyên (SQL Int), nếu không truyền thì nhận value NULL
    .input('BuildingID', sql.Int, buildingId || null)
    .query(`
      SELECT
        -- 1. Lấy các thuộc tính tầng và tòa nhà để FE hiển thị bảng thông tin
        f.FloorID, 
        f.BuildingID, 
        b.BuildingName, -- Lấy tên tòa nhà bằng phép JOIN bảng Buildings
        f.FloorName, 
        f.IsActive,     -- Trạng thái kích hoạt (1: Đang hoạt động, 0: Khóa)
        
        -- 2. Đếm tổng số Khu vực (Zone) thuộc Tầng này (dùng DISTINCT để đếm không bị trùng lắp khi JOIN nhiều bảng)
        COUNT(DISTINCT z.ZoneID)  AS ZoneCount,
        
        -- 3. Đếm tổng số vị trí ô đỗ (ParkingSlots) thực tế nằm trong các Zone của Tầng này
        COUNT(DISTINCT ps.SlotID) AS SlotCount

      -- 4. BẢNG CHÍNH: Bảng Floors (chứa danh sách tầng đỗ xe)
      FROM Floors f

      -- 5. INNER JOIN: Kết nối bảng Buildings theo khóa ngoại BuildingID để lấy tên Tòa nhà (BuildingName)
      JOIN Buildings b          ON b.BuildingID = f.BuildingID

      -- 6. LEFT JOIN: Kết nối bảng Zones theo FloorID. Dùng LEFT JOIN để nếu Tầng mới chưa có Zone nào thì vẫn xuất hiện trong kết quả với ZoneCount = 0
      LEFT JOIN Zones z         ON z.FloorID    = f.FloorID

      -- 7. LEFT JOIN: Kết nối bảng ParkingSlots theo ZoneID để đếm số ô đỗ
      LEFT JOIN ParkingSlots ps ON ps.ZoneID    = z.ZoneID

      -- 8. ĐIỀU KIỆN LỌC WHERE: Nếu @BuildingID truyền vào là NULL ➔ Lấy tất cả tầng; Nếu có @BuildingID ➔ Chỉ lấy các tầng thuộc tòa nhà đó
      WHERE (@BuildingID IS NULL OR f.BuildingID = @BuildingID)

      -- 9. GOM NHÓM GROUP BY: Gom nhóm theo ID tầng và tòa nhà bắt buộc khi sử dụng các hàm đếm aggregate (COUNT)
      GROUP BY f.FloorID, f.BuildingID, b.BuildingName, f.FloorName, f.IsActive

      -- 10. SẮP XẾP ORDER BY: Sắp xếp theo Tòa nhà trước, sau đó sắp xếp theo ID tầng tăng dần
      ORDER BY f.BuildingID, f.FloorID
    `)
  return result.recordset
}

/**
 * HÀM: createFloor
 * MỤC ĐÍCH: Tạo một tầng mới thuộc tòa nhà cụ thể.
 * NGUỒN ĐẦU VÀO TỪ FE: Body gửi lên gồm `{ buildingId, floorName, isActive }`.
 * GIẢI THÍCH SQL:
 * - Query 1 (`SELECT TotalFloors`): Kiểm tra xem tòa nhà có vượt quá số tầng quy định tối đa hay chưa.
 * - Query 2 (`SELECT FloorCount`): Đếm số tầng hiện có trong bảng Floors của tòa nhà đó.
 * - Query 3 (`SELECT FloorID`): Kiểm tra trùng tên tầng (`FloorName`) trong cùng tòa nhà.
 * - Query 4 (`INSERT INTO Floors ... OUTPUT INSERTED.*`): Chèn tầng mới và trả về bản ghi vừa tạo.
 */
export async function createFloor({ buildingId, floorName, isActive = 1 }) {
  if (!buildingId) throw badRequest('Thiếu BuildingID.', 'BUILDING_ID_REQUIRED')
  const name = String(floorName || '').trim()
  if (!name) throw badRequest('Thiếu tên tầng (FloorName).', 'FLOOR_NAME_REQUIRED')
  if (name.length > 50) throw badRequest('Tên tầng tối đa 50 ký tự.', 'FLOOR_NAME_TOO_LONG')

  const pool = await getPool()

  // 1. QUERY TRUY VẤN TÒA NHÀ: Kiểm tra tòa nhà có tồn tại và lấy cột TotalFloors (Giới hạn tổng số tầng)
  const b = await pool.request()
    .input('BuildingID', sql.Int, Number(buildingId))
    .query('SELECT BuildingID, TotalFloors FROM Buildings WHERE BuildingID = @BuildingID')
  if (!b.recordset.length) throw notFound('Không tìm thấy tòa nhà.', 'BUILDING_NOT_FOUND')

  // 2. CHECK GIỚI HẠN SỐ TẦNG: Đếm số lượng tầng đã tạo dưới DB
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

  // 3. CHECK TRÙNG TÊN TẦNG: Quét bảng Floors xem tên tầng này đã có trong tòa nhà chưa
  const dup = await pool.request()
    .input('BuildingID', sql.Int, Number(buildingId))
    .input('FloorName', sql.NVarChar(50), name)
    .query('SELECT FloorID FROM Floors WHERE BuildingID = @BuildingID AND FloorName = @FloorName')
  if (dup.recordset.length) throw conflict(`Tầng "${name}" đã tồn tại trong tòa nhà này.`, 'FLOOR_NAME_EXISTS')

  // 4. INSERT TẦNG MỚI
  const ins = await pool.request()
    .input('BuildingID', sql.Int, Number(buildingId))
    .input('FloorName', sql.NVarChar(50), name)
    .input('IsActive', sql.Bit, isActive ? 1 : 0)
    .query(`
      INSERT INTO Floors (BuildingID, FloorName, IsActive)
      VALUES (@BuildingID, @FloorName, @IsActive);
      SELECT * FROM Floors WHERE FloorID = SCOPE_IDENTITY();
    `)

  // 5. ĐỒNG BỘ LẠI TỔNG SỐ TẦNG TRONG BẢNG BUILDINGS
  await pool.request()
    .input('BuildingID', sql.Int, Number(buildingId))
    .query(`
      UPDATE Buildings
      SET TotalFloors = (SELECT COUNT(*) FROM Floors WHERE BuildingID = @BuildingID)
      WHERE BuildingID = @BuildingID
    `)

  return ins.recordset[0]
}

/**
 * HÀM: updateFloor
 * MỤC ĐÍCH: Cập nhật tên tầng hoặc trạng thái kích hoạt của tầng.
 */
export async function updateFloor(floorId, { floorName, isActive }) {
  if (!floorId) throw badRequest('Thiếu FloorID.', 'FLOOR_ID_REQUIRED')

  const pool = await getPool()
  // 1. SELECT kiểm tra sự tồn tại của Tầng
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
      // 2. CHECK TRÙNG TÊN: Đảm bảo tên tầng mới không trùng với các tầng KHÁC trong cùng tòa nhà (FloorID <> @FloorID)
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

  // 3. UPDATE DYNAMIC: Ghép nối danh sách các cột thay đổi và trả về dữ liệu mới qua OUTPUT INSERTED.*
  const upd = await req.query(`
    UPDATE Floors SET ${sets.join(', ')}
    OUTPUT INSERTED.*
    WHERE FloorID = @FloorID
  `)
  return upd.recordset[0]
}

/**
 * HÀM: deleteFloor
 * MỤC ĐÍCH: Xóa tầng đỗ xe (Chỉ cho phép xóa khi tầng không chứa Zone nào).
 */
export async function deleteFloor(floorId) {
  if (!floorId) throw badRequest('Thiếu FloorID.', 'FLOOR_ID_REQUIRED')

  const pool = await getPool()
  // 1. SELECT kiểm tra xem Tầng có tồn tại không
  const cur = await pool.request()
    .input('FloorID', sql.Int, Number(floorId))
    .query('SELECT * FROM Floors WHERE FloorID = @FloorID')
  const targetFloor = cur.recordset[0]
  const buildingId = targetFloor.BuildingID

  // Kiểm tra xe đang đỗ hoặc đơn đặt chỗ trước trên tầng này
  const activeRes = await pool.request()
    .input('FloorID', sql.Int, Number(floorId))
    .query(`
      SELECT TOP 1 ps.SlotID
      FROM ParkingSlots ps
      JOIN Zones z ON ps.ZoneID = z.ZoneID
      LEFT JOIN ParkingSessions psess ON ps.SlotID = psess.SlotID AND psess.SessionStatus = 'Active'
      LEFT JOIN Reservations r ON ps.SlotID = r.SlotID AND r.ReservationStatus = 'Reserved'
      WHERE z.FloorID = @FloorID AND (psess.SessionID IS NOT NULL OR r.ReservationID IS NOT NULL)
    `)
  if (activeRes.recordset.length > 0) {
    throw conflict(`Không thể xóa tầng "${targetFloor.FloorName}" vì đang có xe đỗ hoặc có đơn đặt chỗ trước.`, 'FLOOR_HAS_ACTIVE_SESSIONS')
  }

  // 2. CHECK RÀNG BUỘC KHÓA NGOẠI: Kiểm tra xem có Zone nào đang nằm trên Tầng này không
  const z = await pool.request()
    .input('FloorID', sql.Int, Number(floorId))
    .query('SELECT TOP 1 ZoneID FROM Zones WHERE FloorID = @FloorID')
  if (z.recordset.length) {
    throw conflict(`Không thể xóa tầng "${targetFloor.FloorName}" vì còn khu vực (zone) bên trong.`, 'FLOOR_HAS_ZONES')
  }

  // 3. EXECUTE DELETE: Thực thi xóa dòng khỏi bảng Floors
  await pool.request()
    .input('FloorID', sql.Int, Number(floorId))
    .query('DELETE FROM Floors WHERE FloorID = @FloorID')

  // 4. ĐỒNG BỘ LẠI TỔNG SỐ TẦNG TRONG BẢNG BUILDINGS
  await pool.request()
    .input('BuildingID', sql.Int, buildingId)
    .query(`
      UPDATE Buildings
      SET TotalFloors = (SELECT COUNT(*) FROM Floors WHERE BuildingID = @BuildingID)
      WHERE BuildingID = @BuildingID
    `)

  return { floorId: Number(floorId), deleted: true }
}

/* =====================================================================
   ZONES (QUẢN LÝ KHU VỰC ĐỖ XE)
   ===================================================================== */

/**
 * HÀM: getZones
 * MỤC ĐÍCH: Lấy danh sách các Khu vực (Zone) đỗ xe theo Tầng.
 * NGUỒN ĐẦU VÀO TỪ FE: `floorId` (từ `req.query.floorId`).
 * DỮ LIỆU TRẢ VỀ CHO FE: Mảng đối tượng Zone đầy đủ kèm tên Tầng, tên Tòa nhà, tên Loại xe cho phép và số lượng ô đỗ thực tế `ActualSlots`.
 */
export async function getZones(floorId) {
  const pool = await getPool()
  const result = await pool.request()
    // Gán tham số truyền từ FE vào biến SQL @FloorID (Int). Nếu FE không truyền -> Giá trị là NULL
    .input('FloorID', sql.Int, floorId || null)
    .query(`
      SELECT
        -- 1. Lấy ID khu vực và ID tầng để FE định danh và phân loại
        z.ZoneID, 
        z.FloorID, 
        
        -- 2. Lấy tên tầng (FloorName) từ bảng Floors bằng phép INNER JOIN
        f.FloorName,

        -- 3. Lấy ID tòa nhà và Tên tòa nhà (BuildingName) từ bảng Buildings bằng phép INNER JOIN
        b.BuildingID, 
        b.BuildingName,

        -- 4. Lấy tên khu vực (ZoneName) để FE hiển thị tiêu đề Zone (ví dụ: Zone A, Zone B)
        z.ZoneName, 

        -- 5. Lấy ID loại xe cho phép và Tên/Mã loại xe (Xe máy / Ô tô / Xe tải) từ bảng VehicleTypes
        z.AllowedVehicleTypeID,
        vt.VehicleName AS AllowedVehicleName, 
        vt.VehicleCode AS AllowedVehicleCode,

        -- 6. Lấy sức chứa tối đa lý thuyết của Zone được thiết lập từ trước
        z.TotalSlots,

        -- 7. Đếm tổng số ô đỗ (ParkingSlots) thực tế đã được tạo dưới CSDL thuộc Zone này
        COUNT(ps.SlotID) AS ActualSlots

      -- 8. BẢNG CHÍNH: Bảng Zones (chứa thông tin danh mục các khu vực đỗ xe)
      FROM Zones z

      -- 9. INNER JOIN BẢNG FLOORS: Nối bảng Floors qua FloorID để lấy thông tin Tầng chứa Zone này
      JOIN Floors f        ON f.FloorID        = z.FloorID

      -- 10. INNER JOIN BẢNG BUILDINGS: Nối bảng Buildings qua BuildingID từ bảng Floors để lấy thông tin Tòa nhà
      JOIN Buildings b     ON b.BuildingID     = f.BuildingID

      -- 11. INNER JOIN BẢNG VEHICLE TYPES: Nối bảng VehicleTypes qua AllowedVehicleTypeID để lấy tên và mã loại xe cho phép đỗ
      JOIN VehicleTypes vt ON vt.VehicleTypeID = z.AllowedVehicleTypeID

      -- 12. LEFT JOIN BẢNG PARKING SLOTS: Nối bảng ParkingSlots qua ZoneID. Dùng LEFT JOIN để nếu Zone chưa được tạo ô đỗ nào thì vẫn giữ nguyên dòng thông tin Zone và ActualSlots = 0
      LEFT JOIN ParkingSlots ps ON ps.ZoneID   = z.ZoneID

      -- 13. MỆNH ĐỀ WHERE (ĐIỀU KIỆN LỌC): 
      -- Nếu @FloorID truyền vào là NULL ➔ Lấy danh sách tất cả các Zone trong bãi.
      -- Nếu @FloorID có giá trị ➔ Chỉ lọc ra các Zone thuộc về Tầng đó.
      WHERE (@FloorID IS NULL OR z.FloorID = @FloorID)

      -- 14. MỆNH ĐỀ GROUP BY (GOM NHÓM DỮ LIỆU): 
      -- Bắt buộc phải liệt kê tất cả các cột không nằm trong hàm tổng hợp (COUNT) vào GROUP BY theo quy tắc chuẩn của SQL Server.
      GROUP BY z.ZoneID, z.FloorID, f.FloorName, b.BuildingID, b.BuildingName,
               z.ZoneName, z.AllowedVehicleTypeID, vt.VehicleName, vt.VehicleCode, z.TotalSlots

      -- 15. MỆNH ĐỀ ORDER BY (SẮP XẾP KẾT QUẢ): 
      -- Sắp xếp thứ tự tăng dần theo ID tầng (FloorID) trước, sau đó sắp xếp theo ID khu vực (ZoneID).
      ORDER BY z.FloorID, z.ZoneID
    `)
  return result.recordset
}

/**
 * HÀM: createZone
 * MỤC ĐÍCH: Tạo mới một Khu vực (Zone) gửi xe thuộc Tầng chỉ định.
 * NGUỒN ĐẦU VÀO TỪ FE: `{ floorId, zoneName, allowedVehicleTypeId, totalSlots }`.
 * GIẢI THÍCH SQL:
 * - Query 1 (`SELECT FloorID`): Kiểm tra tầng có tồn tại.
 * - Query 2 (`SELECT VehicleTypeID`): Kiểm tra loại xe cho phép có tồn tại trong CSDL không.
 * - Query 3 (`SELECT ZoneID`): Kiểm tra tên Zone có bị trùng trong cùng một tầng không.
 * - Query 4 (`INSERT INTO Zones`): Chèn bản ghi mới và dùng `OUTPUT INSERTED.*` trả về object vừa tạo.
 */
export async function createZone({ floorId, zoneName, allowedVehicleTypeId, totalSlots = 0 }) {
  if (!floorId) throw badRequest('Thiếu FloorID.', 'FLOOR_ID_REQUIRED')
  const name = String(zoneName || '').trim()
  if (!name) throw badRequest('Thiếu tên khu vực (ZoneName).', 'ZONE_NAME_REQUIRED')
  if (name.length > 50) throw badRequest('Tên khu vực tối đa 50 ký tự.', 'ZONE_NAME_TOO_LONG')
  if (!allowedVehicleTypeId) throw badRequest('Vui lòng chọn loại xe cho phép.', 'VEHICLE_TYPE_REQUIRED')
  const total = Number(totalSlots)
  if (!Number.isInteger(total) || total < 0) throw badRequest('Sức chứa (TotalSlots) không hợp lệ.', 'INVALID_TOTAL_SLOTS')

  const pool = await getPool()

  // 1. SELECT CHECK TẦNG: Kiểm tra FloorID tồn tại
  const f = await pool.request()
    .input('FloorID', sql.Int, Number(floorId))
    .query('SELECT FloorID FROM Floors WHERE FloorID = @FloorID')
  if (!f.recordset.length) throw notFound('Không tìm thấy tầng.', 'FLOOR_NOT_FOUND')

  // 2. SELECT CHECK LOẠI XE: Kiểm tra VehicleTypeID tồn tại
  const vt = await pool.request()
    .input('VtId', sql.Int, Number(allowedVehicleTypeId))
    .query('SELECT VehicleTypeID FROM VehicleTypes WHERE VehicleTypeID = @VtId')
  if (!vt.recordset.length) throw notFound('Không tìm thấy loại xe.', 'VEHICLE_TYPE_NOT_FOUND')

  // 3. SELECT CHECK TRÙNG TÊN: Kiểm tra tên Zone trùng lặp trong Tầng
  const dup = await pool.request()
    .input('FloorID', sql.Int, Number(floorId))
    .input('ZoneName', sql.NVarChar(50), name)
    .query('SELECT ZoneID FROM Zones WHERE FloorID = @FloorID AND ZoneName = @ZoneName')
  if (dup.recordset.length) throw conflict(`Khu vực "${name}" đã tồn tại trong tầng này.`, 'ZONE_NAME_EXISTS')

  // 4. INSERT ZONE MỚI: Thêm khu vực mới vào bảng Zones
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

/**
 * HÀM: updateZone
 * MỤC ĐÍCH: Cập nhật thông tin Khu vực đỗ xe (Tên zone, Loại xe cho phép, Tổng sức chứa).
 */
export async function updateZone(zoneId, { zoneName, allowedVehicleTypeId, totalSlots }) {
  if (!zoneId) throw badRequest('Thiếu ZoneID.', 'ZONE_ID_REQUIRED')

  const pool = await getPool()

  // 1. SELECT CHECK KHU VỰC VÀ SỐ Ô ĐỖ THỰC TẾ: Đếm xem khu vực này hiện đang chứa bao nhiêu ô đỗ (`ActualSlots`)
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
      // 2. SELECT CHECK TRÙNG TÊN MỚI trong cùng Tầng
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
      // 3. SELECT CHECK KHÔNG KHỚP LOẠI XE: Kiểm tra xem có ô đỗ nào trong Zone đang thuộc loại xe khác không
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
    // 4. CHECK GIỚI HẠN: Sức chứa mới không được bé hơn số ô đỗ thực tế đang có
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

  // 5. UPDATE DYNAMIC KHU VỰC
  const upd = await req.query(`
    UPDATE Zones SET ${sets.join(', ')}
    OUTPUT INSERTED.*
    WHERE ZoneID = @ZoneID
  `)
  return upd.recordset[0]
}

/**
 * HÀM: deleteZone
 * MỤC ĐÍCH: Xóa Khu vực đỗ xe (Chỉ xóa được khi Zone không chứa ô đỗ Slot nào).
 */
export async function deleteZone(zoneId) {
  if (!zoneId) throw badRequest('Thiếu ZoneID.', 'ZONE_ID_REQUIRED')

  const pool = await getPool()
  const cur = await pool.request()
    .input('ZoneID', sql.Int, Number(zoneId))
    .query('SELECT * FROM Zones WHERE ZoneID = @ZoneID')
  if (!cur.recordset.length) throw notFound('Không tìm thấy khu vực.', 'ZONE_NOT_FOUND')

  // SELECT CHECK RÀNG BUỘC: Kiểm tra có Slot đỗ xe nào thuộc Zone này không
  const s = await pool.request()
    .input('ZoneID', sql.Int, Number(zoneId))
    .query('SELECT TOP 1 SlotID FROM ParkingSlots WHERE ZoneID = @ZoneID')
  if (s.recordset.length) {
    throw conflict('Không thể xóa khu vực vì còn slot bên trong.', 'ZONE_HAS_SLOTS')
  }

  // DELETE KHU VỰC
  await pool.request()
    .input('ZoneID', sql.Int, Number(zoneId))
    .query('DELETE FROM Zones WHERE ZoneID = @ZoneID')
  return { zoneId: Number(zoneId), deleted: true }
}

/* =====================================================================
   SLOTS (QUẢN LÝ VỊ TRÍ Ô ĐỖ XE)
   ===================================================================== */

/**
 * HÀM PHỤ: getZoneCapacity
 * MỤC ĐÍCH: Lấy sức chứa tối đa (`TotalSlots`) và đếm số ô đỗ thực tế (`ActualSlots`) của 1 Zone.
 */
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

/**
 * HÀM PHỤ: getSlotFull
 * MỤC ĐÍCH: Lấy thông tin chi tiết đầy đủ của 1 ô đỗ xe (JOIN 4 BẢNG: ParkingSlots, VehicleTypes, Zones, Floors, Buildings).
 */
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

/**
 * HÀM: getSlotsByZone
 * MỤC ĐÍCH: Truy vấn toàn bộ các ô đỗ xe trong 1 Zone, kiểm tra cờ `HasActiveSession` (Có xe đỗ thực tế) và `HasReservation` (Có đơn đặt trước).
 * NGUỒN ĐẦU VÀO TỪ FE: `zoneId` (từ `req.params.zoneId` hoặc `req.query.zoneId`).
 * DỮ LIỆU TRẢ VỀ CHO FE: Đối tượng chứa thông tin Zone và danh sách mảng ô đỗ `slots`.
 */
export async function getSlotsByZone(zoneId) {
  if (!zoneId) throw badRequest('Thiếu ZoneID.', 'ZONE_ID_REQUIRED')
  const pool = await getPool()

  const zone = await getZoneCapacity(pool, Number(zoneId))
  if (!zone) throw notFound('Không tìm thấy khu vực.', 'ZONE_NOT_FOUND')

  // SQL SELECT LẤY DANH SÁCH Ô ĐỖ: Sử dụng subquery CASE WHEN EXISTS để xác định trạng thái thời gian thực
  const r = await pool.request()
    .input('ZoneID', sql.Int, Number(zoneId))
    .query(`
      SELECT
        ps.SlotID, 
        ps.SlotCode, 
        ps.SlotStatus,
        ps.VehicleTypeID, 
        vt.VehicleName, 
        vt.VehicleCode,

        -- Subquery 1: Kiểm tra xem ô đỗ có phiên gửi xe đang đỗ thực tế hay không
        CASE WHEN EXISTS (
          SELECT 1 FROM ParkingSessions s WHERE s.SlotID = ps.SlotID AND s.SessionStatus = 'Active'
        ) THEN 1 ELSE 0 END AS HasActiveSession,

        -- Subquery 2: Kiểm tra xem ô đỗ có đơn đặt chỗ trước đang ở trạng thái Reserved hay không
        CASE WHEN EXISTS (
          SELECT 1 FROM Reservations rv WHERE rv.SlotID = ps.SlotID AND rv.ReservationStatus = 'Reserved'
        ) ELSE 1 ELSE 0 END AS HasReservation

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

/**
 * HÀM: createSlot
 * MỤC ĐÍCH: Tạo mới 1 ô đỗ xe (Slot) đơn lẻ trong Zone.
 * NGUỒN ĐẦU VÀO TỪ FE: `{ zoneId, slotCode, vehicleTypeId }`.
 * GIẢI THÍCH SQL:
 * - Query 1 (`SELECT SlotID FROM ParkingSlots WHERE SlotCode = @Code`): Kiểm tra trùng mã slot.
 * - Query 2 (`INSERT INTO ParkingSlots ...`): Chèn slot mới và lấy ID vừa tạo bằng SCOPE_IDENTITY.
 */
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

  // 1. SELECT CHECK TRÙNG MÃ SLOT: Mã ô đỗ (SlotCode) là duy nhất trên toàn hệ thống
  const dup = await pool.request()
    .input('Code', sql.NVarChar(20), code)
    .query('SELECT SlotID FROM ParkingSlots WHERE SlotCode = @Code')
  if (dup.recordset.length) throw conflict(`Mã slot "${code}" đã tồn tại.`, 'SLOT_CODE_EXISTS')

  // 2. INSERT Ô ĐỖ MỚI: Trạng thái ban đầu mặc định là 'Available' (Sẵn sàng đỗ)
  const ins = await pool.request()
    .input('ZoneID', sql.Int, Number(zoneId))
    .input('SlotCode', sql.NVarChar(20), code)
    .input('VehicleTypeID', sql.Int, finalVehicleTypeId)
    .query(`
      INSERT INTO ParkingSlots (ZoneID, SlotCode, SlotStatus, VehicleTypeID)
      VALUES (@ZoneID, @SlotCode, 'Available', @VehicleTypeID);
      SELECT SCOPE_IDENTITY() AS SlotID;
    `)
  return await getSlotFull(pool, ins.recordset[0].SlotID)
}

/**
 * HÀM: createSlotsBulk
 * MỤC ĐÍCH: Sinh hàng loạt (tối đa 200 slot) ô đỗ xe theo dải số tự động (Ví dụ: A-01 đến A-50).
 * THAO TÁC SQL: Dùng `sql.Transaction` chạy lặp câu lệnh INSERT đảm bảo thêm thành công toàn bộ hoặc hủy bỏ nếu có lỗi.
 */
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

  // SELECT CHECK DANH SÁCH MÃ ĐÃ TỒN TẠI bằng toán tử LIKE tiền tố (Prefix%)
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

  // TRANSACTION THÊM HÀNG LOẠT:
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

/**
 * HÀM: updateSlot
 * MỤC ĐÍCH: Cập nhật thông tin ô đỗ xe (Đổi mã slot, loại xe, hoặc chuyển trạng thái Bảo trì/Khóa).
 */
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
      // CHECK TRÙNG MÃ: Mã slot mới không trùng với các ô KHÁC (SlotID <> @SlotID)
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

  // UPDATE DYNAMIC PARKING SLOTS
  await req.query(`UPDATE ParkingSlots SET ${sets.join(', ')} WHERE SlotID = @SlotID`)
  return await getSlotFull(pool, Number(slotId))
}

/**
 * HÀM: deleteSlot
 * MỤC ĐÍCH: Xóa ô đỗ xe (Chặn xóa nếu ô đỗ đang có xe đỗ, có đơn đặt chỗ hoặc có lịch sử gửi xe).
 */
export async function deleteSlot(slotId) {
  if (!slotId) throw badRequest('Thiếu SlotID.', 'SLOT_ID_REQUIRED')

  const pool = await getPool()
  const slot = await getSlotFull(pool, Number(slotId))
  if (!slot) throw notFound('Không tìm thấy slot.', 'SLOT_NOT_FOUND')

  if (['Occupied', 'Reserved'].includes(slot.SlotStatus)) {
    throw conflict('Không thể xóa slot đang có xe hoặc đang được đặt.', 'SLOT_IN_USE')
  }

  // SELECT CHECK RÀNG BUỘC PHIÊN VÀ ĐẶT CHỖ: Đếm tổng số phiên gửi xe và đơn đặt chỗ của ô đỗ này
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

  // DELETE THỰC TẾ
  await pool.request()
    .input('SlotID', sql.Int, Number(slotId))
    .query('DELETE FROM ParkingSlots WHERE SlotID = @SlotID')

  return { slotId: Number(slotId), slotCode: slot.SlotCode, deleted: true }
}

/* =====================================================================
   STATS (Dashboard tổng quan Admin)
   ===================================================================== */

/**
 * HÀM: getStats
 * MỤC ĐÍCH: Thống kê toàn bộ chỉ số vận hành hệ thống dành cho Admin (User, Hạ tầng, Slot, Revenue).
 */
export async function getStats() {
  const pool = await getPool()

  // 1. QUERY TỔNG HỢP KPI ADMIN: Dùng Subquery SELECT độc lập tính toán nhanh tất cả thông số trong 1 câu SQL
  const r = await pool.request().query(`
    SELECT
      -- Thống kê Người dùng
      (SELECT COUNT(*) FROM Users) AS TotalUsers,
      (SELECT COUNT(*) FROM Users WHERE IsActive = 1) AS ActiveUsers,
      (SELECT COUNT(*) FROM Users WHERE IsActive = 0) AS InactiveUsers,
      (SELECT COUNT(*) FROM Users WHERE IsEmailVerified = 1) AS VerifiedUsers,
 
      -- Thống kê Cơ sở vật chất
      (SELECT COUNT(*) FROM Buildings) AS TotalBuildings,
      (SELECT COUNT(*) FROM Floors WHERE IsActive = 1) AS TotalFloors,
      (SELECT COUNT(*) FROM Zones) AS TotalZones,
 
      -- Thống kê Ô đỗ theo từng trạng thái
      (SELECT COUNT(*) FROM ParkingSlots) AS TotalSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Available') AS AvailableSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Occupied') AS OccupiedSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Reserved') AS ReservedSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Maintenance') AS MaintenanceSlots,
      (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Blocked') AS BlockedSlots,
 
      -- Thống kê Phiên gửi xe
      (SELECT COUNT(*) FROM ParkingSessions WHERE SessionStatus = 'Active') AS ActiveSessions,
      (SELECT COUNT(*) FROM ParkingSessions WHERE CAST(EntryTime AS DATE) = CAST(GETDATE() AS DATE)) AS TodayCheckIns,
 
      -- Thống kê Doanh thu thu được trong hôm nay
      (SELECT ISNULL(SUM(ISNULL(FinalAmount, Amount)), 0)
         FROM Payments
         WHERE PaymentStatus IN ('Completed', 'Prepaid')
           AND CAST(ISNULL(PaymentTime, SurchargePaidAt) AS DATE) = CAST(GETDATE() AS DATE)
      ) AS TodayRevenue,
 
      -- Thống kê Sự cố và Đơn hỗ trợ đang mở
      (SELECT COUNT(*) FROM Incidents WHERE IncidentStatus = 'Open') AS OpenIncidents,
      (SELECT COUNT(*) FROM SupportTickets WHERE Status IN ('Open', 'Pending')) AS OpenTickets
  `)
  const row = r.recordset[0]

  // 2. QUERY THỐNG KÊ USER THEO VAI TRÒ (Role): LEFT JOIN bảng Roles với bảng Users và GROUP BY theo RoleID
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
      -- 1. Lấy thông tin tài khoản người dùng để FE hiển thị danh sách User
      u.UserID, 
      u.FullName, 
      u.Email, 
      u.PhoneNumber, 
      u.RoleID, 
      r.RoleName, -- Lấy tên vai trò (Admin/Manager/Staff/Driver) từ phép JOIN bảng Roles
      u.DateOfBirth, 
      u.HireDate, 
      u.IsActive, 
      u.IsEmailVerified, 
      u.AvatarUrl,
      u.CreatedAt, 
      u.UpdatedAt,

      -- 2. Đếm tổng số bản ghi khớp điều kiện bằng hàm cửa sổ COUNT(*) OVER() để tính phân trang mà không cần chạy 2 query
      COUNT(*) OVER() AS TotalCount

    -- 3. BẢNG CHÍNH: Bảng Users chứa danh sách tài khoản
    FROM Users u

    -- 4. INNER JOIN BẢNG ROLES: Nối bảng Roles qua RoleID để lấy tên vai trò người dùng (RoleName)
    JOIN Roles r ON u.RoleID = r.RoleID

    -- 5. MỆNH ĐỀ WHERE (ĐIỀU KIỆN LỌC LINH HOẠT):
    -- - @RoleID: Lọc theo vai trò nếu có
    -- - @IsActive: Lọc theo trạng thái Hoạt động/Khóa
    -- - @Search: Tìm kiếm tương đối (LIKE) theo Họ tên, Email hoặc Số điện thoại
    WHERE (@RoleID IS NULL OR u.RoleID = @RoleID)
      AND (@IsActive IS NULL OR u.IsActive = @IsActive)
      AND (@Search IS NULL OR u.FullName LIKE @Search OR u.Email LIKE @Search OR u.PhoneNumber LIKE @Search)

    -- 6. MỆNH ĐỀ ORDER BY (SẮP XẾP MỚI NHẤT TRƯỚC): Sắp xếp UserID giảm dần
    ORDER BY u.UserID DESC

    -- 7. MỆNH ĐỀ OFFSET ... FETCH NEXT ... (PHÂN TRANG CHUẨN SQL SERVER):
    -- Bỏ qua @Offset dòng đầu tiên và chỉ lấy tiếp @PageSize dòng tiếp theo
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
  const req = pool.request().input('RoleID', sql.Int, Number(roleId))

  if (ids.length === 0) {
    await req.query('DELETE FROM RolePermissions WHERE RoleID = @RoleID')
  } else {
    const insertValues = ids.map((id, i) => {
      req.input(`pid${i}`, sql.Int, id)
      return `(@RoleID, @pid${i})`
    }).join(', ')

    await req.query(`
      DELETE FROM RolePermissions WHERE RoleID = @RoleID;
      INSERT INTO RolePermissions (RoleID, PermissionID) VALUES ${insertValues};
    `)
  }

  return { roleId: Number(roleId), permissionIds: ids }
}

export async function getUserPermissions(userId) {
  if (!userId) throw badRequest('Thiếu UserID.', 'USER_ID_REQUIRED')
  const pool = await getPool()

  // 1. Kiểm tra xem user có ghi nhận quyền riêng trong UserPermissions không
  const hasUserPerms = await pool.request()
    .input('UserID', sql.Int, Number(userId))
    .query(`SELECT COUNT(*) AS total FROM UserPermissions WHERE UserID = @UserID`)

  if (hasUserPerms.recordset[0].total > 0) {
    const custom = await pool.request()
      .input('UserID', sql.Int, Number(userId))
      .query(`
        SELECT up.PermissionID
        FROM UserPermissions up
        WHERE up.UserID = @UserID AND up.IsGranted = 1
      `)
    return custom.recordset.map((r) => r.PermissionID)
  }

  // 2. Nếu chưa cài riêng, lấy quyền nhóm vai trò mặc định
  const roleReq = await pool.request()
    .input('UserID', sql.Int, Number(userId))
    .query(`
      SELECT rp.PermissionID
      FROM RolePermissions rp
      JOIN Users u ON u.RoleID = rp.RoleID
      WHERE u.UserID = @UserID
    `)

  return roleReq.recordset.map((r) => r.PermissionID)
}

export async function updateUserPermissions(userId, permissionIds) {
  if (!userId) throw badRequest('Thiếu UserID.', 'USER_ID_REQUIRED')
  if (!Array.isArray(permissionIds)) {
    throw badRequest('permissionIds phải là một mảng.', 'PERMISSION_IDS_INVALID')
  }

  const pool = await getPool()
  const user = await pool.request()
    .input('UserID', sql.Int, Number(userId))
    .query('SELECT UserID FROM Users WHERE UserID = @UserID')
  if (!user.recordset.length) throw notFound('Không tìm thấy người dùng.', 'USER_NOT_FOUND')

  const grantedSet = new Set(permissionIds.map(Number))
  const allPerms = await pool.request().query('SELECT PermissionID FROM Permissions')
  const req = pool.request().input('UserID', sql.Int, Number(userId))

  const insertValues = allPerms.recordset.map((p, i) => {
    const isGranted = grantedSet.has(p.PermissionID) ? 1 : 0
    req.input(`pid${i}`, sql.Int, p.PermissionID)
    req.input(`granted${i}`, sql.Bit, isGranted)
    return `(@UserID, @pid${i}, @granted${i})`
  }).join(', ')

  await req.query(`
    DELETE FROM UserPermissions WHERE UserID = @UserID;
    INSERT INTO UserPermissions (UserID, PermissionID, IsGranted) VALUES ${insertValues};
  `)

  return { userId: Number(userId), permissionIds: Array.from(grantedSet) }
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

export async function createBuilding({ buildingName, address, operatingHours, totalFloors, latitude, longitude }) {
  const name = String(buildingName || '').trim()
  if (!name) throw badRequest('Thiếu tên tòa nhà (buildingName).', 'BUILDING_NAME_REQUIRED')
  if (name.length > 100) throw badRequest('Tên tòa nhà tối đa 100 ký tự.', 'BUILDING_NAME_TOO_LONG')

  const pool = await getPool()

  const ins = await pool.request()
    .input('BuildingName', sql.NVarChar(100), name)
    .input('Address', sql.NVarChar(200), address || null)
    .input('OperatingHours', sql.NVarChar(50), operatingHours || null)
    .input('TotalFloors', sql.Int, totalFloors != null ? Number(totalFloors) : null)
    .input('Latitude', sql.Decimal(9, 6), latitude != null ? parseFloat(latitude) : null)
    .input('Longitude', sql.Decimal(9, 6), longitude != null ? parseFloat(longitude) : null)
    .query(`
      INSERT INTO Buildings (BuildingName, Address, OperatingHours, TotalFloors, Latitude, Longitude)
      OUTPUT INSERTED.*
      VALUES (@BuildingName, @Address, @OperatingHours, @TotalFloors, @Latitude, @Longitude)
    `)
  const newBuilding = ins.recordset[0]

  const floorCount = Number(totalFloors)
  if (floorCount > 0) {
    for (let i = 1; i <= floorCount; i++) {
      await pool.request()
        .input('BuildingID', sql.Int, newBuilding.BuildingID)
        .input('FloorName', sql.NVarChar(50), `Tang ${i}`)
        .query(`INSERT INTO Floors (BuildingID, FloorName, IsActive) VALUES (@BuildingID, @FloorName, 1)`)
    }
  }

  return newBuilding
}

export async function updateBuilding(buildingId, { buildingName, address, operatingHours, totalFloors, latitude, longitude }) {
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

  if (totalFloors !== undefined && totalFloors !== null) {
    const newTotal = Number(totalFloors)
    if (!Number.isInteger(newTotal) || newTotal < 1) {
      throw badRequest('Số tầng (TotalFloors) phải là số nguyên dương >= 1.', 'INVALID_TOTAL_FLOORS')
    }

    const currentFloorsRes = await pool.request()
      .input('BuildingID', sql.Int, Number(buildingId))
      .query('SELECT FloorID, FloorName FROM Floors WHERE BuildingID = @BuildingID ORDER BY FloorID ASC')
    const existingFloors = currentFloorsRes.recordset
    const currentCount = existingFloors.length

    if (newTotal < currentCount) {
      // Giảm số tầng -> Kiểm tra các tầng dôi dư xem có xe đỗ, đơn đặt chỗ hoặc khu vực (zone) không
      const excessFloors = existingFloors.slice(newTotal)
      for (const f of excessFloors) {
        // Kiểm tra xe đang đỗ hoặc đơn đặt chỗ trước trên tầng này
        const activeRes = await pool.request()
          .input('FloorID', sql.Int, f.FloorID)
          .query(`
            SELECT TOP 1 ps.SlotID
            FROM ParkingSlots ps
            JOIN Zones z ON ps.ZoneID = z.ZoneID
            LEFT JOIN ParkingSessions psess ON ps.SlotID = psess.SlotID AND psess.SessionStatus = 'Active'
            LEFT JOIN Reservations r ON ps.SlotID = r.SlotID AND r.ReservationStatus = 'Reserved'
            WHERE z.FloorID = @FloorID AND (psess.SessionID IS NOT NULL OR r.ReservationID IS NOT NULL)
          `)
        if (activeRes.recordset.length > 0) {
          throw conflict(`Không thể giảm số tầng xuống ${newTotal} vì ${f.FloorName} đang có xe đỗ hoặc có đơn đặt chỗ trước.`, 'FLOOR_HAS_ACTIVE_SESSIONS')
        }

        // Kiểm tra khu vực đỗ xe (zones) trên tầng này
        const zoneRes = await pool.request()
          .input('FloorID', sql.Int, f.FloorID)
          .query(`SELECT COUNT(*) AS zoneCount FROM Zones WHERE FloorID = @FloorID`)
        if (zoneRes.recordset[0].zoneCount > 0) {
          throw conflict(`Không thể giảm số tầng xuống ${newTotal} vì ${f.FloorName} vẫn còn chứa ${zoneRes.recordset[0].zoneCount} khu vực đỗ xe (Zone). Vui lòng di dời hoặc xóa các khu vực ở tầng này trước.`, 'FLOOR_HAS_ZONES')
        }
      }

      // Nếu tất cả tầng dôi dư trống hoàn toàn, thực hiện xóa các tầng này
      for (const f of excessFloors) {
        await pool.request()
          .input('FloorID', sql.Int, f.FloorID)
          .query('DELETE FROM Floors WHERE FloorID = @FloorID')
      }
    } else if (newTotal > currentCount) {
      // Tăng số tầng -> Tự động sinh thêm tầng mới (kiểm tra tránh trùng tên tầng đã có)
      let added = 0;
      let targetCount = newTotal - currentCount;
      let floorNum = currentCount + 1;

      while (added < targetCount) {
        let floorName = 'Tang ' + floorNum;
        const dupCheck = await pool.request()
          .input('BuildingID', sql.Int, Number(buildingId))
          .input('FloorName', sql.NVarChar(50), floorName)
          .query('SELECT FloorID FROM Floors WHERE BuildingID = @BuildingID AND FloorName = @FloorName');

        if (!dupCheck.recordset.length) {
          await pool.request()
            .input('BuildingID', sql.Int, Number(buildingId))
            .input('FloorName', sql.NVarChar(50), floorName)
            .query('INSERT INTO Floors (BuildingID, FloorName, IsActive) VALUES (@BuildingID, @FloorName, 1)');
          added++;
        }
        floorNum++;
      }
    }

    req.input('TotalFloors', sql.Int, newTotal)
    sets.push('TotalFloors = @TotalFloors')
  }

  if (latitude !== undefined) {
    req.input('Latitude', sql.Decimal(9, 6), latitude != null ? parseFloat(latitude) : null)
    sets.push('Latitude = @Latitude')
  }

  if (longitude !== undefined) {
    req.input('Longitude', sql.Decimal(9, 6), longitude != null ? parseFloat(longitude) : null)
    sets.push('Longitude = @Longitude')
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

/* ── QUẢN LÝ PHÂN CÔNG TÒA NHÀ (BUILDING ASSIGNMENTS) ───────── */
export async function assignUserToBuilding({ buildingId, userId, isPrimary = false }) {
  const pool = await getPool();
  await pool.request()
    .input('buildingId', sql.Int, buildingId)
    .input('userId', sql.Int, userId)
    .input('isPrimary', sql.Bit, isPrimary)
    .query(`
      MERGE BuildingAssignments AS target
      USING (SELECT @buildingId AS BuildingID, @userId AS UserID) AS source
      ON (target.BuildingID = source.BuildingID AND target.UserID = source.UserID)
      WHEN MATCHED THEN
        UPDATE SET IsPrimary = @isPrimary, AssignedDate = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (BuildingID, UserID, IsPrimary) VALUES (@buildingId, @userId, @isPrimary);
    `);
  return { success: true, message: 'Phân công nhân sự thành công' };
}

export async function getBuildingAssignments(buildingId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('buildingId', sql.Int, buildingId)
    .query(`
      SELECT ba.AssignmentID, ba.BuildingID, ba.UserID, ba.AssignedDate, ba.IsPrimary,
             u.FullName, u.Email, u.PhoneNumber, r.RoleName
      FROM BuildingAssignments ba
      JOIN Users u ON ba.UserID = u.UserID
      JOIN Roles r ON u.RoleID = r.RoleID
      WHERE ba.BuildingID = @buildingId
      ORDER BY ba.IsPrimary DESC, ba.AssignedDate DESC
    `);
  return result.recordset;
}

export async function removeBuildingAssignment(assignmentId) {
  const pool = await getPool();
  await pool.request()
    .input('assignmentId', sql.Int, assignmentId)
    .query(`DELETE FROM BuildingAssignments WHERE AssignmentID = @assignmentId`);
  return { success: true, message: 'Xóa phân công thành công' };
}

export async function transferStaff({ userId, fromBuildingId = null, toBuildingId, isPrimary = true }) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    if (fromBuildingId) {
      await new sql.Request(transaction)
        .input('userId', sql.Int, userId)
        .input('fromBuildingId', sql.Int, fromBuildingId)
        .query(`UPDATE BuildingAssignments SET IsPrimary = 0 WHERE UserID = @userId AND BuildingID = @fromBuildingId`);
    }
    await new sql.Request(transaction)
      .input('buildingId', sql.Int, toBuildingId)
      .input('userId', sql.Int, userId)
      .input('isPrimary', sql.Bit, isPrimary ? 1 : 0)
      .query(`
        MERGE BuildingAssignments AS target
        USING (SELECT @buildingId AS BuildingID, @userId AS UserID) AS source
        ON (target.BuildingID = source.BuildingID AND target.UserID = source.UserID)
        WHEN MATCHED THEN UPDATE SET IsPrimary = @isPrimary, AssignedDate = GETDATE()
        WHEN NOT MATCHED THEN INSERT (BuildingID, UserID, IsPrimary) VALUES (@buildingId, @userId, @isPrimary);
      `);
    await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .input('action', sql.NVarChar(50), 'STAFF_TRANSFER')
      .input('desc', sql.NVarChar(500), `Điều chuyển nhân sự UserID #${userId} sang Tòa nhà #${toBuildingId}`)
      .query(`INSERT INTO AuditLogs (UserID, Action, Description, CreatedAt) VALUES (@userId, @action, @desc, GETDATE())`);

    await transaction.commit();
    return { success: true, message: 'Điều chuyển nhân sự sang tòa nhà mới thành công' };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/* ── QUẢN LÝ CẤU HÌNH HỆ THỐNG (SYSTEM CONFIGS) ──────────────── */
export async function getSystemConfigs() {
  const pool = await getPool();
  const result = await pool.request().query(`SELECT * FROM SystemConfigs ORDER BY ConfigKey`);
  return result.recordset;
}

export async function updateSystemConfig(configKey, configValue) {
  const pool = await getPool();
  await pool.request()
    .input('configKey', sql.NVarChar(50), configKey)
    .input('configValue', sql.NVarChar(250), configValue)
    .query(`
      UPDATE SystemConfigs 
      SET ConfigValue = @configValue, UpdatedAt = GETDATE() 
      WHERE ConfigKey = @configKey
    `);
  return { success: true, message: 'Cập nhật cấu hình thành công' };
}