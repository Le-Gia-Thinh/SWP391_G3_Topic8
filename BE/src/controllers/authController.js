import { StatusCodes } from "http-status-codes";
import * as authService from "../services/authService.js";
import JwtProvider from "../providers/JwtProvider.js";

const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES;
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES;
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

// POST /api/auth/facebook
export async function facebookLogin(req, res, next) {
  try {
    const { accessToken, refreshToken, user, message } =
      await authService.facebookLoginService(req.body.accessToken, getClientIp(req));
    setTokenCookies(res, accessToken, refreshToken);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: message || "Đăng nhập Facebook thành công",
      data: { user },
    });
  } catch (err) {
    if (isEmailNotVerifiedError(err)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Email này đã được đăng ký nhưng chưa xác minh. Vui lòng kiểm tra hộp thư và xác minh email trước khi đăng nhập bằng Facebook.",
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
  try {
    await authService.logoutService(req.cookies?.refreshToken);
    clearTokenCookies(res);
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