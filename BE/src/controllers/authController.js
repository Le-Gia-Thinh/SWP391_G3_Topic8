import { StatusCodes } from "http-status-codes";
import * as authService from "../services/authService.js";
import JwtProvider from "../providers/JwtProvider.js";

const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "7d";
const IS_PROD = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? "strict" : "lax",
};

function setTokenCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: JwtProvider.toMs(ACCESS_TOKEN_EXPIRES),
  });

  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: JwtProvider.toMs(REFRESH_TOKEN_EXPIRES),
    path: "/api/auth",
  });
}

function clearTokenCookies(res) {
  res.clearCookie("accessToken", {
    ...baseCookieOptions,
  });

  res.clearCookie("refreshToken", {
    ...baseCookieOptions,
    path: "/api/auth",
  });
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    null
  );
}

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const user = await authService.registerService(req.body);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Đăng ký thành công, vui lòng đăng nhập",
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
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
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/google
export async function googleLogin(req, res, next) {
  try {
    const { idToken } = req.body;

    const { accessToken, refreshToken, user } =
      await authService.googleLoginService(idToken, getClientIp(req));

    setTokenCookies(res, accessToken, refreshToken);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Đăng nhập Google thành công",
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/facebook
export async function facebookLogin(req, res, next) {
  try {
    const { accessToken: facebookAccessToken } = req.body;

    const { accessToken, refreshToken, user } =
      await authService.facebookLoginService(
        facebookAccessToken,
        getClientIp(req)
      );

    setTokenCookies(res, accessToken, refreshToken);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Đăng nhập Facebook thành công",
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh
export async function refreshToken(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;

    if (!rawRefreshToken) {
      clearTokenCookies(res);

      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Refresh token không tồn tại hoặc đã hết hạn",
        code: "REFRESH_TOKEN_EXPIRED",
      });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshTokenService(rawRefreshToken, getClientIp(req));

    setTokenCookies(res, accessToken, newRefreshToken);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Refresh token thành công",
    });
  } catch (err) {
    clearTokenCookies(res);
    next(err);
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
  } catch (err) {
    next(err);
  }
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
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
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

    return res.status(StatusCodes.OK).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}