/**
 * FILE: server.js
 * MÔ TẢ: File cấu hình và khởi chạy ứng dụng Express (Backend).
 * Nó thiết lập các middlewares, kết nối các router (API), quản lý lỗi và chạy server.
 */
/*
Thinh, Hieu
*/

import express from "express"; // Framework chính để tạo server
import cors from "cors"; // Middleware hỗ trợ Cross-Origin Resource Sharing, cho phép Frontend gọi API
import dotenv from "dotenv"; // Thư viện đọc file .env chứa các biến môi trường
import cookieParser from "cookie-parser"; // Middleware để đọc và phân tích cookies gửi từ client

// Import các cấu hình và module từ trong project
import corsOptions from "./config/corsOptions.js"; // Cấu hình CORS tùy chỉnh
import router from "./routes/index.js"; // Tập hợp tất cả các routes API
import { errorHandlingMiddleware } from "./middlewares/errorHandler.js"; // Middleware xử lý lỗi tập trung
import { startParkingSlotAutoSync } from "./services/slotSyncService.js"; // Dịch vụ đồng bộ số lượng chỗ đỗ xe tự động

// Nạp các biến từ file .env vào process.env
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();

/**
 * Route kiểm tra tình trạng hoạt động của server (Health check)
 * Method: GET
 * Đường dẫn: /
 */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Parking Building Management API is running",
  });
});

// ================= MIDDLEWARES TOÀN CỤC =================
// 💡 CORS: Mở cổng cho phép React Frontend (localhost:5173) gọi API và gửi/nhận Cookie HttpOnly
app.use(cors(corsOptions));
// 💡 BODY PARSER: Tự động giải mã dữ liệu req.body gửi lên dạng JSON
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
// 💡 COOKIE PARSER: Đọc Cookie req.cookies (accessToken, refreshToken)
app.use(cookieParser());

// ================= ROUTER CHÍNH ======================
// 💡 ROUTER: Tiền tố /api kết nối tất cả các route con (/auth, /staff, /admin, /manager)
app.use("/api", router);

// ================= XỬ LÝ LỖI TẬP TRUNG ===================
// 💡 ERROR HANDLER: Middleware đứng ở vị trí cuối cùng, bắt mọi lỗi từ next(err) trong Controller
app.use(errorHandlingMiddleware);

// ================= KHỞI CHẠY SERVER ============
// Cổng chạy server lấy từ môi trường, mặc định là 5000 nếu không có
const PORT = process.env.PORT || 5000;

// Yêu cầu app lắng nghe kết nối trên PORT đã định
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  /**
   * Khởi chạy job chạy ngầm (cron-job): 
   * Tự động kiểm tra các booking hết hạn và đồng bộ lại slot sau mỗi 60 giây (60000 ms)
   */
  startParkingSlotAutoSync(60000);
});
