/**
 * FILE: authController.js
 * MÔ TẢ: Controller xử lý Toàn bộ nghiệp vụ Xác thực người dùng (Authentication & Authorization).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Đăng ký & Xác minh Email (Register & Verify Email): Tạo tài khoản mới, ném token verify sang email và kích hoạt `IsEmailVerified = 1`.
 * 2. Đăng nhập (Local Login & Google OAuth): Xác thực thông tin, cấp cặp đôi Token (Access Token 1h & Refresh Token 14d) bảo mật bằng HttpOnly Cookies.
 * 3. Ghi Nhật ký Hệ thống (Audit Logging): Tự động ghi vết hoạt động đăng nhập/đăng xuất/đăng ký vào cơ sở dữ liệu qua hàm `auditAuth`.
 * 4. Cơ chế Cấp mới Token (Refresh Token Rotation): Tự động cấp Access Token mới từ Cookie Refresh Token mà không yêu cầu người dùng phải nhập lại mật khẩu.
 * 5. Khôi phục & Đổi mật khẩu (Forgot/Reset/Change Password).
 */

// Import enum StatusCodes từ thư viện 'http-status-codes' (200 OK, 201 CREATED, 401 UNAUTHORIZED, 403 FORBIDDEN,...)
import { StatusCodes } from "http-status-codes";
// Import toàn bộ service xử lý xác thực từ 'BE/src/services/authService.js'
// LIÊN KẾT FILE: `BE/src/services/authService.js` - Chứa logic gọi Stored Procedure `sp_LoginUser`, `sp_RegisterUser`, `sp_VerifyEmail`, `sp_ResetPassword`.
import * as authService from "../services/authService.js";
// Import Provider quản lý sinh & mã hóa JWT Tokens
// LIÊN KẾT FILE: `BE/src/providers/JwtProvider.js`
import JwtProvider from "../providers/JwtProvider.js";
// Import hàm lấy kết nối SQL Server
import { getPool } from "../config/db.js";
// Import hàm ghi nhật ký audit log
import { logAudit } from "../utils/auditLogger.js";

// ========================= CẤU HÌNH BẢO MẬT & COOKIES =========================

/** Thời gian hết hạn Access Token (ví dụ: '1h') trích xuất từ biến môi trường .env */
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES;

/** Thời gian hết hạn Refresh Token (ví dụ: '14d') trích xuất từ biến môi trường .env */
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES;

/** Cờ kiểm tra môi trường Production (Nếu đang chạy thật trên Server thì bật cờ secure) */
const IS_PROD = process.env.NODE_ENV === "production";

/** Cấu hình mặc định cho Cookie HttpOnly (Ngăn chặn tấn công XSS đọc Token từ JavaScript `document.cookie`) */
const baseCookieOptions = {
  httpOnly: true, // Chỉ có Server mới đọc được Cookie này, ngăn chặn Hacker lấy Token qua XSS
  secure: IS_PROD, // Chỉ gửi Cookie qua giao thức HTTPS nếu là môi trường Production
  sameSite: IS_PROD ? "strict" : "lax", // Ngăn chặn tấn công CSRF (Cross-Site Request Forgery)
};

/**
 * HÀM HELPER 1: setTokenCookies
 * TÁC DỤNG: Gán cặp Token (AccessToken & RefreshToken) vào Header HTTP Response dưới dạng HttpOnly Cookie.
 */
function setTokenCookies(res, accessToken, refreshToken) {
  // Gán AccessToken vào Cookie
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: JwtProvider.toMs(REFRESH_TOKEN_EXPIRES), // Thời gian sống của Cookie theo mili-giây
  });

  // Gán RefreshToken vào Cookie (giới hạn đường dẫn chỉ gửi lên API `/api/auth`)
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: JwtProvider.toMs(REFRESH_TOKEN_EXPIRES),
    path: "/api/auth",
  });
}

/**
 * HÀM HELPER 2: clearTokenCookies
 * TÁC DỤNG: Xóa sạch Cookies chứa Token trên Trình duyệt khi người dùng Đăng xuất (Logout) hoặc Token bị thu hồi.
 */
function clearTokenCookies(res) {
  res.clearCookie("accessToken", { ...baseCookieOptions });
  res.clearCookie("refreshToken", { ...baseCookieOptions, path: "/api/auth" });
}

/**
 * HÀM HELPER 3: getClientIp
 * TÁC DỤNG: Lấy địa chỉ IP thật của máy Client truy cập (xử lý trường hợp qua Nginx Proxy).
 */
function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || null;
}

/**
 * HÀM HELPER 4: auditAuth
 * TÁC DỤNG: Ghi nhật ký Audit Log ghi nhận hành vi xác thực của người dùng (Đăng ký, Đăng nhập, Đăng xuất).
 * ĐẢM BẢO AN TOÀN: Chạy theo cơ chế "best-effort" (try/catch nuốt lỗi), nếu ghi log thất bại thì vẫn cho phép người dùng đăng nhập bình thường.
 */
async function auditAuth(actor, action, target, description, ip) {
  if (!actor) return;
  try {
    const pool = await getPool();
    await logAudit(
      pool,
      {
        UserID: actor.userId ?? null,
        FullName: actor.fullName || actor.email || (actor.userId ? `User #${actor.userId}` : null),
        RoleName: actor.roleName || null,
      },
      action, target, description, ip
    );
  } catch { /* Tự động bỏ qua lỗi nếu không ghi được audit log */ }
}

/**
 * HÀM HELPER 5: isEmailNotVerifiedError
 * TÁC DỤNG: Kiểm tra xem lỗi nhận được có phải do Email Chưa Được Xác Minh hay không.
 */
function isEmailNotVerifiedError(err) {
  return (
    err.code === "EMAIL_NOT_VERIFIED" ||
    err.message?.includes("EMAIL_NOT_VERIFIED")
  );
}

/**
 * HÀM 1: register
 * TÁC DỤNG: Đăng ký tài khoản người dùng mới (Tài xế/Bảo vệ).
 * 
 * @route POST /api/auth/register
 * @access Public
 */
export async function register(req, res, next) {
  try {
    // Gọi Service thực thi mã hóa mật khẩu bcrypt và chèn dòng mới vào bảng Users
    const user = await authService.registerService(req.body);
    // Ghi nhật ký audit log
    await auditAuth(user, "Register", "Tài khoản", `Đăng ký tài khoản mới (${user.email})`, getClientIp(req));
    
    // Trả về HTTP 201 Created thành công
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.",
      data: { user },
    });
  } catch (err) { next(err); }
}

/**
 * HÀM 2: login
 * TÁC DỤNG: Đăng nhập hệ thống bằng Email và Mật khẩu.
 * LUỒNG XỬ LÝ:
 * 1. Gọi `authService.loginService` để gọi Stored Procedure `sp_LoginUser`.
 * 2. Xác thực mật khẩu Hash bằng `bcrypt.compare`.
 * 3. Sinh cặp Token JWT (Access Token & Refresh Token).
 * 4. Đặt Token vào HttpOnly Cookies bảo mật.
 * 
 * @route POST /api/auth/login
 * @access Public
 */
export async function login(req, res, next) {
  try {
    // Gọi service xác thực thông tin đăng nhập
    const { accessToken, refreshToken, user } =
      await authService.loginService(req.body, getClientIp(req));
    
    // Đặt Token vào Cookie bảo mật HttpOnly
    setTokenCookies(res, accessToken, refreshToken);
    // Ghi log sự kiện Đăng nhập
    await auditAuth(user, "Login", "Xác thực", "Đăng nhập bằng email/mật khẩu", getClientIp(req));
    
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Đăng nhập thành công",
      data: { user },
    });
  } catch (err) {
    // Trả về mã lỗi 403 Forbidden nếu email chưa được xác minh
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

/**
 * HÀM 3: googleLogin
 * TÁC DỤNG: Đăng nhập bằng tài khoản Google (OAuth 2.0).
 * 
 * @route POST /api/auth/google
 * @access Public
 */
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

/**
 * HÀM 4: verifyEmail
 * TÁC DỤNG: Kích hoạt tài khoản khi người dùng nhấp vào link xác minh gửi trong Email.
 * 
 * @route GET /api/auth/verify-email?token=...
 * @access Public
 */
export async function verifyEmail(req, res, next) {
  try {
    await authService.verifyEmailService(req.query.token);
    // Chuyển hướng người dùng về trang thông báo thành công ở Frontend
    return res.redirect(`${process.env.FE_ORIGIN}/verify-email/success`);
  } catch {
    // Chuyển hướng về trang báo lỗi xác minh
    return res.redirect(`${process.env.FE_ORIGIN}/verify-email/error`);
  }
}

/**
 * HÀM 5: resendVerifyEmail
 * TÁC DỤNG: Gửi lại link xác minh Email mới nếu link cũ bị hết hạn.
 * 
 * @route POST /api/auth/resend-verify
 * @access Public
 */
export async function resendVerifyEmail(req, res, next) {
  try {
    await authService.resendVerifyEmailService(req.body.email);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Nếu email chưa được xác minh, link mới đã được gửi. Vui lòng kiểm tra hộp thư.",
    });
  } catch (err) { next(err); }
}

/**
 * HÀM 6: refreshToken
 * TÁC DỤNG: Cấp mới Access Token bằng Refresh Token (Cơ chế Refresh Token Rotation).
 * Khi Access Token hết hạn (sau 1 giờ), Frontend gửi yêu cầu tới endpoint này để lấy Access Token mới mà không bắt tài xế đăng nhập lại.
 * 
 * @route POST /api/auth/refresh
 * @access Public (Xác thực bằng Refresh Token Cookie)
 */
export async function refreshToken(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;

    if (!rawRefreshToken) {
      clearTokenCookies(res);
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Refresh token không tồn tại hoặc đã hết hạn',
        code: 'REFRESH_TOKEN_EXPIRED',
      });
    }

    // Gọi Service cấp mới cặp Token
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshTokenService(rawRefreshToken, getClientIp(req));

    // Đặt Token mới vào Cookie
    setTokenCookies(res, accessToken, newRefreshToken);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Refresh token thành công',
    });
  } catch (err) {
    clearTokenCookies(res);
    next(err);
  }
}

/**
 * HÀM 7: logout
 * TÁC DỤNG: Đăng xuất khỏi hệ thống. Vô hiệu hóa Refresh Token trong DB và xóa toàn bộ HttpOnly Cookies.
 * 
 * @route POST /api/auth/logout
 * @access Public
 */
export async function logout(req, res, next) {
  let actor = null;
  try {
    const token = req.cookies?.accessToken;
    if (token) actor = JwtProvider.verifyAccessToken(token);
  } catch { /* Bỏ qua nếu token đã hết hạn */ }
  
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

/**
 * HÀM 8: forgotPassword
 * TÁC DỤNG: Gửi email hướng dẫn khôi phục mật khẩu (Reset Password Token).
 * 
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPasswordService(req.body.email);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Nếu email tồn tại trong hệ thống, link reset đã được gửi",
    });
  } catch (err) { next(err); }
}

/**
 * HÀM 9: resetPassword
 * TÁC DỤNG: Đặt lại mật khẩu mới thông qua Token khôi phục.
 * 
 * @route POST /api/auth/reset-password
 * @access Public
 */
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

/**
 * HÀM 10: changePassword
 * TÁC DỤNG: Đổi mật khẩu cá nhân khi đã đăng nhập (Cung cấp mật khẩu cũ và mật khẩu mới).
 * 
 * @route POST /api/auth/change-password
 * @access Authenticated Users
 */
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

/**
 * HÀM 11: getMe
 * TÁC DỤNG: Lấy toàn bộ thông tin hồ sơ của người dùng đang đăng nhập (dựa trên JWT Token).
 * 
 * @route GET /api/auth/me
 * @access Authenticated Users
 */
export async function getMe(req, res, next) {
  try {
    const userId = req.jwtDecoded?.userId || req.user?.UserID;
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

/**
 * HÀM 12: checkEmailVerifyStatus
 * TÁC DỤNG: Kiểm tra xem một địa chỉ Email đã được xác minh hay chưa (`IsEmailVerified = 1`).
 * 
 * @route POST /api/auth/check-email-verified
 * @access Public
 */
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