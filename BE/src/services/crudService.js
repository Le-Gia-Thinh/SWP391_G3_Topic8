/**
 * FILE: crudService.js
 * MÔ TẢ: Service tiện ích CRUD generic (Generic Create/Read/Update/Delete Helper).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. WHITELIST PROTECTION (Bảo vệ danh mục Bảng): Định nghĩa danh sách bảng SQL hợp lệ (`allowed`) nhằm phòng chống lỗi bảo mật SQL Injection khi ghép tên bảng động vào câu truy vấn `SELECT * FROM ${tableName(key)}`.
 * 2. Cung cấp các hàm lấy dữ liệu dùng chung (`list`, `getById`) rút gọn cho các controller tra cứu nhanh.
 * 3. Sử dụng `mssql` Parameterized Query (`.input("id", sql.Int, id)`) để đảm bảo an toàn truy vấn SQL.
 * 
 * @module crudService
 */

import { getPool, sql } from "../config/db.js";

// BẢNG WHITELIST: Danh sách tên bảng SQL được phép truy vấn linh hoạt trong hệ thống
const allowed = {
  roles: "Roles",
  permissions: "Permissions",
  rolePermissions: "RolePermissions",
  users: "Users",
  vehicleTypes: "VehicleTypes",
  pricingPolicies: "PricingPolicies",
  buildings: "Buildings",
  floors: "Floors",
  zones: "Zones",
  parkingSlots: "ParkingSlots",
  parkingSessions: "ParkingSessions",
  payments: "Payments",
  reservations: "Reservations",
  incidents: "Incidents",
  feedbacks: "Feedbacks",
};

/**
 * HÀM 1: tableName
 * TÁC DỤNG: Kiểm tra và ánh xạ từ khóa `key` thành tên Bảng SQL thực tế trong Database.
 * KỸ THUẬT: Nếu key không nằm trong danh sách Whitelist `allowed` ➔ Ném lỗi HTTP 400 lập tức để ngăn chặn SQL Injection.
 * 
 * @param {string} key - Từ khóa rút gọn (vd: 'users', 'buildings')
 * @returns {string} Tên bảng SQL nguyên bản (vd: 'Users', 'Buildings')
 */
export function tableName(key) {
  const name = allowed[key];
  if (!name) throw Object.assign(new Error("Invalid table"), { status: 400 });
  return name;
}

/**
 * HÀM 2: list
 * TÁC DỤNG: Lấy toàn bộ danh sách bản ghi từ 1 bảng SQL, sắp xếp giảm dần theo Cột đầu tiên (ID).
 * 
 * @param {string} key - Từ khóa bảng cần lấy
 * @returns {Promise<Array<Object>>} Mảng các bản ghi trả về từ SQL `recordset`
 */
export async function list(key) {
  const pool = await getPool(); // Lấy kết nối CSDL từ Connection Pool
  const result = await pool.request()
    .query(`SELECT * FROM ${tableName(key)} ORDER BY 1 DESC`); // ORDER BY 1 DESC: Sắp xếp theo cột đầu tiên (ID mới nhất lên đầu)
  return result.recordset;
}

/**
 * HÀM 3: getById
 * TÁC DỤNG: Truy vấn chi tiết 1 bản ghi từ Bảng SQL theo Cột khóa chính và ID truyền vào.
 * 
 * @param {string} key - Từ khóa tên bảng
 * @param {string} idColumn - Tên cột ID khóa chính (vd: 'UserID', 'BuildingID')
 * @param {number} id - Giá trị ID cần tìm
 * @returns {Promise<Object|undefined>} Đối tượng bản ghi duy nhất hoặc `undefined` nếu không tìm thấy
 */
export async function getById(key, idColumn, id) {
  const pool = await getPool();
  const result = await pool.request()
    .input("id", sql.Int, id) // Bind tham số an toàn chống SQL Injection
    .query(`SELECT * FROM ${tableName(key)} WHERE ${idColumn}=@id`);
  return result.recordset[0]; // Trả về phần tử đầu tiên trong mảng kết quả
}