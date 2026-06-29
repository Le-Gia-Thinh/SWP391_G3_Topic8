/**
 * FILE: errorHandler.js
 * MÔ TẢ: Middleware xử lý lỗi tập trung (Centralized Error Handler).
 * 
 * Đây là middleware cuối cùng trong chuỗi middleware Express.
 * Khi bất kỳ controller/route nào gọi next(err), lỗi sẽ được chuyển về đây.
 * Middleware này phân loại lỗi và trả về response JSON phù hợp cho client.
 */

import { StatusCodes } from "http-status-codes"; // Thư viện chứa các mã HTTP status chuẩn

/**
 * Middleware xử lý lỗi toàn cục.
 * Express nhận biết đây là error handler nhờ có 4 tham số (err, req, res, next).
 * 
 * @param {Error} err   - Đối tượng lỗi được ném (throw) từ controller/service
 * @param {Object} req  - Express request object
 * @param {Object} res  - Express response object  
 * @param {Function} next - Hàm next (bắt buộc khai báo dù không dùng, để Express nhận biết error handler)
 */
export const errorHandlingMiddleware = (err, req, res, next) => {
  // Log lỗi ra console để debug
  console.error("❌ Error:", err.message);

  // Xử lý lỗi CORS: Origin không được phép truy cập
  if (err.message?.includes("CORS blocked")) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false, message: err.message, code: "CORS_ERROR",
    });
  }

  // Xử lý lỗi trùng email khi đăng ký
  if (err.message?.includes("Email already exists")) {
    return res.status(StatusCodes.CONFLICT).json({
      success: false, message: "Email đã được sử dụng", code: "EMAIL_EXISTS",
    });
  }

  // Xử lý lỗi mặc định: sử dụng statusCode từ lỗi hoặc trả 500 Internal Server Error
  res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: err.message || "Internal Server Error",
    code: err.code || "SERVER_ERROR",
  });
};