/**
 * FILE: corsOptions.js - THINH
 * MÔ TẢ: Cấu hình CORS (Cross-Origin Resource Sharing) cho server.
 * CORS quy định những domain nào (frontend) được phép gọi API tới backend.
 */

// Danh sách các pattern (biểu thức chính quy) chứa các nguồn (origin) được phép truy cập
// Ở đây cho phép mọi cổng (port) trên localhost hoặc 127.0.0.1
const allowedOriginPatterns = [
  /^http:\/\/localhost:\d+$/,     // Ví dụ: http://localhost:3000, http://localhost:5173
  /^http:\/\/127\.0\.0\.1:\d+$/,  // Ví dụ: http://127.0.0.1:5173
];

const corsOptions = {
  // Hàm kiểm tra origin của request đến
  origin: (origin, callback) => {
    // Cho phép các request không có origin (ví dụ: gọi từ Postman, curl, hoặc server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Kiểm tra xem origin của request có khớp với bất kỳ pattern nào được cấu hình không
    const isAllowed = allowedOriginPatterns.some((pattern) =>
      pattern.test(origin)
    );

    if (isAllowed) {
      // Nếu hợp lệ, cho phép request đi tiếp
      return callback(null, true);
    }

    // Nếu không hợp lệ, chặn request và trả về lỗi
    return callback(new Error(`CORS blocked: ${origin} not allowed`));
  },

  credentials: true, // Cho phép frontend gửi cookie, header xác thực (authorization) kèm theo request
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Các phương thức HTTP được phép sử dụng
  allowedHeaders: ["Content-Type", "Authorization"], // Các header được phép gửi lên server
};

export default corsOptions;
