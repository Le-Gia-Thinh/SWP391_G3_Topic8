/**
 * FILE: commonController.js
 * MÔ TẢ: Controller chứa các API dữ liệu tham chiếu (Reference Data) dùng chung cho toàn bộ hệ thống.
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Phục vụ dữ liệu cho các ô chọn (Dropdown / Select option) trên giao diện Frontend như: Danh sách vai trò (Roles), Loại xe (VehicleTypes), Tòa nhà (Buildings), Tầng (Floors), Khu vực đỗ (Zones), Ô đỗ (Slots), và Bảng giá (Pricing).
 * 2. Tái sử dụng các phương thức truy vấn tối ưu từ `managerService.js`.
 * 3. Cho phép truy cập bởi tất cả người dùng (Driver, Staff, Manager, Guest).
 */

// Import hàm `getPool` kết nối Database từ 'BE/src/config/db.js'
import { getPool } from "../config/db.js";
// Import tất cả hàm xử lý từ 'managerService.js' dưới tên đại diện `managerService`
// LIÊN KẾT FILE: `BE/src/services/managerService.js` - Chứa các truy vấn lấy danh sách tầng, khu vực, bảng giá.
import * as managerService from "../services/managerService.js";

/**
 * HÀM 1: getRoles
 * TÁC DỤNG: Lấy danh sách các vai trò (Roles) trong hệ thống (Driver, Staff, Manager, Admin).
 * 
 * @route GET /api/common/roles
 * @access Public / Authenticated
 */
export async function getRoles(req, res, next) {
  try {
    // KẾT NỐI DATABASE CONNECTION POOL:
    const pool = await getPool();
    // TRUY VẤN SQL: Lấy danh sách Vai trò sắp xếp theo RoleID tăng dần
    const result = await pool.request().query(`
      SELECT RoleID, RoleName, Description
      FROM Roles
      ORDER BY RoleID
    `);
    // TRẢ VỀ MẢNG DỮ LIỆU ROLES KÈM HTTP STATUS 200 (OK)
    return res.json({ success: true, data: result.recordset });
  } catch (err) { 
    // CHUYỂN LỖI SANG ERROR HANDLER MIDDLEWARE
    next(err); 
  }
}

/**
 * HÀM 2: getVehicleTypes
 * TÁC DỤNG: Lấy danh sách loại phương tiện đỗ xe (Ô tô, Xe máy, Xe điện,...) đang hoạt động (`IsActive = 1`).
 * 
 * @route GET /api/common/vehicle-types
 * @access Public
 */
export async function getVehicleTypes(req, res, next) {
  try {
    // GỌI TẦNG SERVICE:
    // LIÊN KẾT: Gọi hàm `managerService.getVehicleTypes()` trong `BE/src/services/managerService.js`.
    const data = await managerService.getVehicleTypes(); // Chỉ lấy các loại xe IsActive = 1
    return res.json({ success: true, data });
  } catch (err) { next(err); }
}

/**
 * HÀM 3: getBuildings
 * TÁC DỤNG: Lấy danh sách các tòa nhà đỗ xe kèm theo số lượng tầng (FloorCount) và số ô đỗ (SlotCount).
 * 
 * @route GET /api/common/buildings
 * @access Public
 */
export async function getBuildings(req, res, next) {
  try {
    // GỌI TẦNG SERVICE LẤY TÒA NHÀ:
    const data = await managerService.getBuildings(); 
    return res.json({ success: true, data });
  } catch (err) { next(err); }
}

/**
 * HÀM 4: getFloors
 * TÁC DỤNG: Lấy danh sách các tầng đỗ xe (hỗ trợ lọc theo buildingId).
 * 
 * CÚ PHÁP TOÁN TỬ BA NGÔI (Ternary Operator):
 * `req.query.buildingId ? Number(req.query.buildingId) : null`: Nếu trên URL có truyền `?buildingId=1` thì ép kiểu sang Số, ngược lại gán `null`.
 * 
 * @route GET /api/common/floors?buildingId=1
 * @access Public
 */
export async function getFloors(req, res, next) {
  try {
    const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null;
    const data = await managerService.getFloors(buildingId);
    return res.json({ success: true, data });
  } catch (err) { next(err); }
}

/**
 * HÀM 5: getZones
 * TÁC DỤNG: Lấy danh sách khu vực đỗ xe (Zones) trong tầng (hỗ trợ lọc theo floorId).
 * 
 * @route GET /api/common/zones?floorId=2
 * @access Public
 */
export async function getZones(req, res, next) {
  try {
    const floorId = req.query.floorId ? Number(req.query.floorId) : null;
    const data = await managerService.getZones(floorId);
    return res.json({ success: true, data });
  } catch (err) { next(err); }
}

/**
 * HÀM 6: getSlots
 * TÁC DỤNG: Lấy danh sách các ô đỗ xe (Parking Slots) có hỗ trợ lọc linh hoạt theo Tòa nhà, Tầng, Khu vực, Loại xe, Trạng thái và Phân trang.
 * 
 * THUẬT NGỮ & CÚ PHÁP:
 * - `undefined`: Khi truyền `undefined` vào object tham số, hàm service sẽ bỏ qua điều kiện lọc đó trong câu lệnh SQL.
 * 
 * @route GET /api/common/slots?buildingId=1&status=Available&page=1&limit=200
 * @access Public
 */
export async function getSlots(req, res, next) {
  try {
    // Gọi phương thức `getParkingSlots` của managerService truyền vào đối tượng filter đã chuẩn hóa
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
    // SPREAD OPERATOR (`...result`): Trải tất cả thuộc tính trong đối tượng `result` (gồm slots, total, page, totalPages) ra JSON trả về.
    return res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

/**
 * HÀM 7: getPricing
 * TÁC DỤNG: Lấy bảng giá đỗ xe công khai (Pricing Policies) để hiển thị cho Tài xế trước khi đặt chỗ đỗ xe.
 * 
 * @route GET /api/pricing?vehicleTypeId=1
 * @access Public
 */
export async function getPricing(req, res, next) {
  try {
    const vehicleTypeId = req.query.vehicleTypeId ? Number(req.query.vehicleTypeId) : undefined;
    // Lấy bảng giá đang có hiệu lực (`isActive: true`)
    const data = await managerService.getPricingPolicies({ vehicleTypeId, isActive: true });
    return res.json({ success: true, data });
  } catch (err) { next(err); }
}