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

// ================= MIDDLEWARES =================
// 1. Áp dụng cấu hình CORS cho tất cả các request
app.use(cors(corsOptions));
// 2. Chuyển đổi dữ liệu gửi lên (body) dạng JSON thành object
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

// ================= ROUTES ======================
// Áp dụng router chính với tiền tố "/api" cho tất cả các endpoint
app.use("/api", router);

// ================= XỬ LÝ LỖI ===================
// Middleware cuối cùng để bắt các lỗi ném ra từ controllers/routes
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
