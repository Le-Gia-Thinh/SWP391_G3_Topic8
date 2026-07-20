/**
 * FILE: authController.js
 * MÔ TẢ: Controller xử lý xác thực người dùng (Authentication).
 * 
 * Chức năng:
 * - register: Đăng ký tài khoản mới
 * - login: Đăng nhập bằng email/password
 * - googleLogin / facebookLogin: Đăng nhập bằng mạng xã hội
 * - verifyEmail: Xác minh email
 * - resendVerifyEmail: Gửi lại email xác minh
 * - refreshToken: Làm mới access token
 * - logout: Đăng xuất
 * - forgotPassword / resetPassword: Khôi phục mật khẩu
 * - changePassword: Đổi mật khẩu
 * - getMe: Lấy thông tin user hiện tại
 * - checkEmailVerifyStatus: Kiểm tra trạng thái xác minh email
 */
/*
Thinh
*/

import { StatusCodes } from "http-status-codes"; // Mã HTTP status chuẩn
import * as authService from "../services/authService.js"; // Service xử lý logic xác thực
import JwtProvider from "../providers/JwtProvider.js"; // Module quản lý JWT
import { getPool } from "../config/db.js"; // Kết nối database (để ghi audit log)
import { logAudit } from "../utils/auditLogger.js"; // Hàm ghi nhật ký hệ thống

// ========================= BIẾN CẤU HÌNH =========================

/** Thời gian hết hạn Access Token (từ .env) */
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES;

/** Thời gian hết hạn Refresh Token (từ .env) */
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES;

/** Kiểm tra môi trường production để bật secure cookie */
const IS_PROD = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? "strict" : "lax",
};

function setTokenCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: JwtProvider.toMs(REFRESH_TOKEN_EXPIRES),
  });

  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: JwtProvider.toMs(REFRESH_TOKEN_EXPIRES),
    path: "/api/auth",
  });
}

function clearTokenCookies(res) {
  res.clearCookie("accessToken", { ...baseCookieOptions });
  res.clearCookie("refreshToken", { ...baseCookieOptions, path: "/api/auth" });
}

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || null;
}

// Ghi audit log cho sự kiện xác thực (best-effort — không bao giờ chặn response).
// `actor` có thể là user của authService ({ userId, fullName, roleName, email })
// hoặc payload đã giải mã từ access token ({ userId, email, roleName }).
async function auditAuth(actor, action, target, description, ip) {
  if (!actor) return;
  try {
    const pool = await getPool();
    await logAudit(
      pool,
      {
        UserID: actor.userId ?? null,
        // Token không chứa fullName → fallback sang email / "User #id" để cột Người thực hiện luôn có dữ liệu
        FullName: actor.fullName || actor.email || (actor.userId ? `User #${actor.userId}` : null),
        RoleName: actor.roleName || null,
      },
      action, target, description, ip
    );
  } catch { /* logAudit đã tự nuốt lỗi */ }
}

// ── Bắt lỗi EMAIL_NOT_VERIFIED từ SP hoặc service ────────────────
// mssql ném lỗi dạng: err.message = "EMAIL_NOT_VERIFIED"
// hoặc service set err.code = "EMAIL_NOT_VERIFIED"
function isEmailNotVerifiedError(err) {
  return (
    err.code === "EMAIL_NOT_VERIFIED" ||
    err.message?.includes("EMAIL_NOT_VERIFIED")
  );
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const user = await authService.registerService(req.body);
    await auditAuth(user, "Register", "Tài khoản", `Đăng ký tài khoản mới (${user.email})`, getClientIp(req));
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.",
      data: { user },
    });
  } catch (err) { next(err); }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { accessToken, refreshToken, user } =
      await authService.loginService(req.body, getClientIp(req));
    setTokenCookies(res, accessToken, refreshToken);
    await auditAuth(user, "Login", "Xác thực", "Đăng nhập bằng email/mật khẩu", getClientIp(req));
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Đăng nhập thành công",
      data: { user },
    });
  } catch (err) {
    // ✅ Trả code riêng để FE có thể hiển thị nút "Gửi lại email"
    if (isEmailNotVerifiedError(err)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: err.message,
        code: "EMAIL_NOT_VERIFIED",
      });
    }
    next(err);
  }
}

// POST /api/auth/google
export async function googleLogin(req, res, next) {
  try {
    const { accessToken, refreshToken, user, message } =
      await authService.googleLoginService(req.body.idToken, getClientIp(req));
    setTokenCookies(res, accessToken, refreshToken);
    await auditAuth(user, "Login", "Xác thực", "Đăng nhập bằng Google", getClientIp(req));
    return res.status(StatusCodes.OK).json({
      success: true,
      message: message || "Đăng nhập Google thành công",
      data: { user },
    });
  } catch (err) {
    // ✅ Email trùng nhưng chưa verify → hướng dẫn user verify trước
    if (isEmailNotVerifiedError(err)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Email này đã được đăng ký nhưng chưa xác minh. Vui lòng kiểm tra hộp thư và xác minh email trước khi đăng nhập bằng Google.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }
    next(err);
  }
}

// GET /api/auth/verify-email?token=...
export async function verifyEmail(req, res, next) {
  try {
    await authService.verifyEmailService(req.query.token);
    // Redirect về FE trang success
    return res.redirect(`${process.env.FE_ORIGIN}/verify-email/success`);
  } catch {
    return res.redirect(`${process.env.FE_ORIGIN}/verify-email/error`);
  }
}

// POST /api/auth/resend-verify
export async function resendVerifyEmail(req, res, next) {
  try {
    await authService.resendVerifyEmailService(req.body.email);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Nếu email chưa được xác minh, link mới đã được gửi. Vui lòng kiểm tra hộp thư.",
    });
  } catch (err) { next(err); }
}
// POST /api/auth/refresh
export async function refreshToken(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.refreshToken

    console.log('====================================')
    console.log('🔄 /api/auth/refresh called')
    console.log('Time:', new Date().toISOString())
    console.log('Has refreshToken cookie:', !!rawRefreshToken)

    if (rawRefreshToken) {
      try {
        const decoded = JwtProvider.verifyRefreshToken(rawRefreshToken)
        const nowInSeconds = Math.floor(Date.now() / 1000)
        const remainingSeconds = decoded.exp - nowInSeconds

        console.log('Refresh token userId:', decoded.userId)
        console.log('Refresh token exp:', new Date(decoded.exp * 1000).toISOString())
        console.log('Refresh token remaining seconds:', remainingSeconds)
      } catch (err) {
        console.log('Refresh token verify failed:', err.name, err.message)
      }
    }

    console.log('====================================')

    if (!rawRefreshToken) {
      clearTokenCookies(res)
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Refresh token không tồn tại hoặc đã hết hạn',
        code: 'REFRESH_TOKEN_EXPIRED',
      })
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshTokenService(rawRefreshToken, getClientIp(req))

    setTokenCookies(res, accessToken, newRefreshToken)

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Refresh token thành công',
    })
  } catch (err) {
    clearTokenCookies(res)
    next(err)
  }
}
// POST /api/auth/logout
export async function logout(req, res, next) {
  // Route logout không qua isAuthorized nên không có req.user.
  // Giải mã access token (nếu còn hợp lệ) để biết AI vừa đăng xuất; token hỏng/hết hạn vẫn cho logout.
  let actor = null;
  try {
    const token = req.cookies?.accessToken;
    if (token) actor = JwtProvider.verifyAccessToken(token);
  } catch { /* token hết hạn / không hợp lệ → bỏ qua, không ghi được actor */ }
  try {
    await authService.logoutService(req.cookies?.refreshToken);
    clearTokenCookies(res);
    await auditAuth(actor, "Logout", "Xác thực", "Đăng xuất", getClientIp(req));
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (err) {
    clearTokenCookies(res);
    next(err);
  }
}

// POST /api/auth/forgot-password
export async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPasswordService(req.body.email);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Nếu email tồn tại trong hệ thống, link reset đã được gửi",
    });
  } catch (err) { next(err); }
}

// POST /api/auth/reset-password
export async function resetPassword(req, res, next) {
  try {
    await authService.resetPasswordService(req.body);
    clearTokenCookies(res);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Đặt lại mật khẩu thành công, vui lòng đăng nhập lại",
    });
  } catch (err) { next(err); }
}

// POST /api/auth/change-password
export async function changePassword(req, res, next) {
  try {
    const userId = req.jwtDecoded?.userId || req.user?.UserID;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Chưa đăng nhập",
        code: "NO_USER_CONTEXT",
      });
    }

    const { oldPassword, newPassword } = req.body;
    if (!newPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Vui lòng cung cấp mật khẩu mới",
      });
    }

    await authService.changePasswordService(userId, oldPassword, newPassword);
    
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Đổi mật khẩu thành công",
    });
  } catch (err) { next(err); }
}

// GET /api/auth/me
export async function getMe(req, res, next) {
  try {
    const userId = req.jwtDecoded?.userId || req.user?.UserID 
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Chưa đăng nhập",
        code: "NO_USER_CONTEXT",
      });
    }
    const data = await authService.getMeService(userId);
    return res.status(StatusCodes.OK).json({ success: true, data });
  } catch (err) { next(err); }
}
// POST /api/auth/check-email-verified
export async function checkEmailVerifyStatus(req, res, next) {
  try {
    const data = await authService.checkEmailVerifyStatusService(req.body.email);

    return res.status(StatusCodes.OK).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}