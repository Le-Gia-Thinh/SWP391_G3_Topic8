/**
 * FILE: db.js
 * MÔ TẢ: Cấu hình và khởi tạo kết nối đến cơ sở dữ liệu SQL Server.
 */

import sql from "mssql"; // Thư viện để kết nối và thao tác với Microsoft SQL Server
import dotenv from "dotenv"; // Thư viện đọc biến môi trường
import { fileURLToPath } from "url"; // Các tiện ích xử lý đường dẫn khi dùng ES Modules
import { dirname, resolve } from "path";

// Cấu hình đường dẫn để trỏ tới file .env nằm ở thư mục root của Backend (BE)
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

/**
 * Đối tượng cấu hình cho SQL Server
 * Lấy các thông số từ biến môi trường (process.env) để bảo mật
 */
const config = {
  user: process.env.DB_USER,               // Tên đăng nhập database
  password: process.env.DB_PASSWORD,       // Mật khẩu database
  server: process.env.DB_SERVER,           // Địa chỉ máy chủ (host) database
  database: process.env.DB_DATABASE,       // Tên database cần kết nối
  port: Number(process.env.DB_PORT) || 1433, // Cổng kết nối (mặc định SQL Server là 1433)

  options: {
    encrypt: process.env.DB_ENCRYPT === "true", // Bật mã hóa kết nối (thường cần cho Azure SQL)
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERTIFICATE === "true", // Bỏ qua kiểm tra chứng chỉ SSL cục bộ

    // Đặt useUTC thành false để tránh thư viện tự động chuyển đổi Date sang giờ UTC,
    // giữ nguyên giờ Việt Nam (+07:00) như thiết lập của database
    useUTC: false,
  },

  // Cấu hình pool kết nối (quản lý số lượng kết nối đồng thời để tối ưu hiệu suất)
  pool: {
    max: 10,                 // Tối đa 10 kết nối đồng thời
    min: 0,                  // Tối thiểu 0 kết nối khi không dùng
    idleTimeoutMillis: 30000,// Giải phóng kết nối nếu không hoạt động sau 30 giây
  },
};

// Khởi tạo Pool kết nối
const pool = new sql.ConnectionPool(config);

// Thực hiện kết nối tới database
const poolConnect = pool
  .connect()
  .then(() => {
    console.log("✅ SQL Server connected"); // Báo lỗi nếu thành công
  })
  .catch((err) => {
    console.error("❌ SQL Server connection failed:", err); // In log nếu thất bại
    process.exit(1); // Dừng server nếu không thể kết nối DB
  });

/**
 * Hàm hỗ trợ lấy pool kết nối hiện tại.
 * Đảm bảo quá trình kết nối đã hoàn thành (await poolConnect) trước khi trả về pool.
 * Dùng ở các file service/model để thực thi query.
 */
export async function getPool() {
  await poolConnect;
  return pool;
}

// Export object sql gốc để tiện sử dụng các hàm của nó ở nơi khác nếu cần
export { sql };