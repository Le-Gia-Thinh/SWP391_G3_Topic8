import { StatusCodes } from "http-status-codes";
import * as authService from "../services/authService.js";
// ✅ fix 7: xóa import JwtProvider không dùng

const ACCESS_TOKEN_EXPIRES  = process.env.ACCESS_TOKEN_EXPIRES  || "15m";
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "7d";
const IS_PROD = process.env.NODE_ENV === "production";

import JwtProvider from "../providers/JwtProvider.js"; // dùng cho toMs()

const baseCookieOptions = {
  httpOnly: true,
  secure:   IS_PROD,
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
    path:   "/api/auth",  // chỉ gửi khi gọi /api/auth/*
  });
}

function clearTokenCookies(res) {
  res.clearCookie("accessToken",  { ...baseCookieOptions });
  res.clearCookie("refreshToken", { ...baseCookieOptions, path: "/api/auth" });
}

function getClientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
    || req.ip
    || null;
}

export async function register(req, res, next) {
  try {
    const user = await authService.registerService(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Đăng ký thành công, vui lòng đăng nhập",
      data: { user },
    });
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const { accessToken, refreshToken, user } =
      await authService.loginService(req.body, getClientIp(req));

    setTokenCookies(res, accessToken, refreshToken);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đăng nhập thành công",
      accessToken,
      data: { user },
    });
  } catch (err) { next(err); }
}

export async function googleLogin(req, res, next) {
  try {
    const { accessToken, refreshToken, user } =
      await authService.googleLoginService(req.body.idToken, getClientIp(req));

    setTokenCookies(res, accessToken, refreshToken);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đăng nhập Google thành công",
      accessToken,
      data: { user },
    });
  } catch (err) { next(err); }
}

export async function facebookLogin(req, res, next) {
  try {
    const { accessToken, refreshToken, user } =
      await authService.facebookLoginService(req.body.accessToken, getClientIp(req));

    setTokenCookies(res, accessToken, refreshToken);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đăng nhập Facebook thành công",
      accessToken,
      data: { user },
    });
  } catch (err) { next(err); }
}

export async function refreshToken(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;

    if (!rawRefreshToken) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Unauthorized! (Refresh token not found)",
        code:    "REFRESH_TOKEN_EXPIRED",
      });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshTokenService(rawRefreshToken, getClientIp(req));

    setTokenCookies(res, accessToken, newRefreshToken);

    res.status(StatusCodes.OK).json({ success: true, accessToken });
  } catch (err) {
    clearTokenCookies(res);
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    await authService.logoutService(req.cookies?.refreshToken);
    clearTokenCookies(res);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (err) { next(err); }
}

export async function forgotPassword(req, res, next) {
  try {
    await authService.forgotPasswordService(req.body.email);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Nếu email tồn tại trong hệ thống, link reset đã được gửi",
    });
  } catch (err) { next(err); }
}

export async function resetPassword(req, res, next) {
  try {
    await authService.resetPasswordService(req.body);
    clearTokenCookies(res);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Đặt lại mật khẩu thành công, vui lòng đăng nhập lại",
    });
  } catch (err) { next(err); }
}

export async function getMe(req, res, next) {
  try {
    // ✅ fix 5: dùng req.jwtDecoded (đã được set bởi isAuthorized)
    const data = await authService.getMeService(req.jwtDecoded.userId);
    res.status(StatusCodes.OK).json({ success: true, data });
  } catch (err) { next(err); }
}