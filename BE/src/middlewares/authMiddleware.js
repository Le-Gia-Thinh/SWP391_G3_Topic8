/**
 * FILE: authMiddleware.js
 * MÔ TẢ: Middleware xác thực (Authentication) và phân quyền (Authorization).
 * 
 * Chứa các hàm middleware được gắn vào trước controller để:
 * 1. isAuthorized: Kiểm tra người dùng đã đăng nhập chưa (có token hợp lệ không)
 * 2. isManager / isStaffOrManager / isDriver / isAdmin: Kiểm tra vai trò (role) của người dùng
 * 
 * Luồng xử lý: Request → isAuthorized → isRole → Controller
 */

import JwtProvider     from "../providers/JwtProvider.js";  // Module xử lý JWT (tạo, xác minh token)
import { getPool, sql } from "../config/db.js";             // Kết nối database

/**
 * Middleware xác thực người dùng (Authentication).
 * Kiểm tra Access Token từ cookie hoặc header Authorization.
 * Nếu hợp lệ, gắn thông tin user vào req.user và req.jwtDecoded để các middleware/controller phía sau sử dụng.
 * 
 * @param {Object} req  - Express request object
 * @param {Object} res  - Express response object
 * @param {Function} next - Hàm gọi middleware tiếp theo
 */
export async function isAuthorized(req, res, next) {
  try {
    let token = null;

    // Bước 1: Lấy token từ cookie (ưu tiên) hoặc từ header Authorization (Bearer token)
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.slice(7); // Cắt bỏ "Bearer " (7 ký tự) để lấy token thuần
    }

    // Bước 2: Nếu không tìm thấy token → chưa đăng nhập
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập.",
        code:    "NO_TOKEN",
      });
    }

    // Bước 3: Giải mã và xác minh token
    let decoded;
    try {
      decoded = JwtProvider.verifyAccessToken(token);
    } catch (err) {
      // Phân biệt lỗi: token hết hạn vs token không hợp lệ
      const isExpired = err.name === "TokenExpiredError";
      return res.status(401).json({
        success: false,
        message: isExpired
          ? "Access token hết hạn. Vui lòng gọi /api/auth/refresh."
          : "Access token không hợp lệ.",
        code: isExpired ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
      });
    }

    // Bước 4: Truy vấn DB để lấy thông tin user mới nhất (kiểm tra IsActive, RoleName, v.v.)
    const pool   = await getPool();
    const result = await pool.request()
      .input("UserID", sql.Int, decoded.userId)
      .query(`
        SELECT u.UserID, u.FullName, u.Email, u.PhoneNumber,
               u.RoleID, r.RoleName, u.IsActive, u.AvatarUrl
        FROM Users u
        JOIN Roles r ON u.RoleID = r.RoleID
        WHERE u.UserID = @UserID
      `);

    const user = result.recordset[0];

    // Bước 5: Kiểm tra tài khoản có tồn tại không
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại.",
        code:    "USER_NOT_FOUND",
      });
    }

    // Bước 6: Kiểm tra tài khoản có đang bị khóa/vô hiệu hóa không
    if (!user.IsActive) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị vô hiệu hóa.",
        code:    "ACCOUNT_DISABLED",
      });
    }

    // Bước 7: Gắn thông tin user vào request để các middleware/controller phía sau sử dụng
    // ✅ Set CẢ HAI để controller dùng được cả req.jwtDecoded lẫn req.user
    req.jwtDecoded = decoded; // Dữ liệu từ JWT: { userId, email, roleId, roleName }
    req.user       = user;    // Dữ liệu mới nhất từ DB (đảm bảo role, trạng thái luôn cập nhật)
    next();
  } catch (err) { next(err); }
}

/**
 * Middleware kiểm tra quyền Manager.
 * Chỉ cho phép user có RoleName = "Manager" đi tiếp.
 * Phải đặt SAU middleware isAuthorized (vì cần req.user).
 */
export function isManager(req, res, next) {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Chưa xác thực." });
  if (req.user.RoleName !== "Manager")
    return res.status(403).json({
      success: false,
      message: "Không có quyền. Yêu cầu: Manager.",
      code:    "FORBIDDEN",
    });
  next();
}

/**
 * Middleware kiểm tra quyền Staff hoặc Manager.
 * Cho phép cả Staff và Manager truy cập.
 * Phải đặt SAU middleware isAuthorized.
 */
export function isStaffOrManager(req, res, next) {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Chưa xác thực." });
  if (!["Staff", "Manager"].includes(req.user.RoleName))
    return res.status(403).json({
      success: false,
      message: "Không có quyền. Yêu cầu: Staff hoặc Manager.",
      code:    "FORBIDDEN",
    });
  next();
}

/**
 * Middleware kiểm tra quyền Driver (tài xế / người dùng cuối).
 * Chỉ cho phép user có RoleName = "Driver" đi tiếp.
 * Phải đặt SAU middleware isAuthorized.
 */
export function isDriver(req, res, next) {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Chưa xác thực." });
  if (req.user.RoleName !== "Driver")
    return res.status(403).json({
      success: false,
      message: "Không có quyền. Yêu cầu: Driver.",
      code:    "FORBIDDEN",
    });
  next();
}

/**
 * Middleware kiểm tra quyền Admin (quản trị viên hệ thống).
 * Chỉ cho phép user có RoleName = "Admin" đi tiếp.
 * Phải đặt SAU middleware isAuthorized.
 */
export function isAdmin(req, res, next) {
  if (!req.user)
    return res.status(401).json({ success: false, message: "Chưa xác thực." });
  if (req.user.RoleName !== "Admin")
    return res.status(403).json({
      success: false,
      message: "Không có quyền. Yêu cầu: Admin.",
      code:    "FORBIDDEN",
    });
  next();
}