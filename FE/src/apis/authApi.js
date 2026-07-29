/**
 * FILE: authApi.js
 * MÔ TẢ: Tập hợp các API liên quan đến xác thực người dùng (Authentication).
 * Bao gồm: Đăng nhập (Local/Google/Facebook), Đăng ký, Quên mật khẩu, Refresh token.
 */

import authorizeAxios from '../utils/authorizeAxios'

// 🚀 LUỒNG ĐĂNG NHẬP [BƯỚC 3/8]: Gọi Axios gửi request
// ➡️ BƯỚC TIẾP THEO: Tự động qua FE/src/utils/authorizeAxios.js (gắn withCredentials: true) ➔ Nhảy sang Backend BE/src/routes/index.js (khớp endpoint /api/auth/login)
export const loginAPI = (data) => authorizeAxios.post('/auth/login', data, { _noToast: true })

export const logoutAPI = () => authorizeAxios.post('/auth/logout')

export const refreshTokenAPI = () => authorizeAxios.post('/auth/refresh')

export const getMeAPI = () => authorizeAxios.get('/auth/me')

export const registerAPI = (data) => authorizeAxios.post('/auth/register', data)

export const forgotPasswordAPI = (email) => {
  return authorizeAxios.post('/auth/forgot-password', { email })
}

export const resetPasswordAPI = (data) => authorizeAxios.post('/auth/reset-password', data)

export const googleLoginAPI = (idToken) => {
  return authorizeAxios.post('/auth/google', { idToken })
}
export const checkEmailVerifiedAPI = (email) => {
  return authorizeAxios.post('/auth/check-email-verified', { email })
}

export const changePasswordAPI = (data) => authorizeAxios.post('/auth/change-password', data)