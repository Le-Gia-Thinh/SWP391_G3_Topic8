import JwtProvider     from "../providers/JwtProvider.js";
import { getPool, sql } from "../config/db.js";

export async function isAuthorized(req, res, next) {
  try {
    let token = null;

    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.slice(7);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập.",
        code:    "NO_TOKEN",
      });
    }

    let decoded;
    try {
      decoded = JwtProvider.verifyAccessToken(token);
    } catch (err) {
      const isExpired = err.name === "TokenExpiredError";
      return res.status(401).json({
        success: false,
        message: isExpired
          ? "Access token hết hạn. Vui lòng gọi /api/auth/refresh."
          : "Access token không hợp lệ.",
        code: isExpired ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
      });
    }

    // Lấy user mới nhất từ DB để check IsActive
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

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại.",
        code:    "USER_NOT_FOUND",
      });
    }
    if (!user.IsActive) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị vô hiệu hóa.",
        code:    "ACCOUNT_DISABLED",
      });
    }

    // ✅ fix 5+6: set CẢ HAI để controller dùng được cả req.jwtDecoded lẫn req.user
    req.jwtDecoded = decoded; // { userId, email, roleId, roleName } từ JWT
    req.user       = user;    // data mới nhất từ DB
    next();
  } catch (err) { next(err); }
}

// Dùng req.user.RoleName (từ DB, luôn mới nhất)
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