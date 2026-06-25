/**
 * FILE: authApi.js
 * MÔ TẢ: Tập hợp các API liên quan đến xác thực người dùng (Authentication).
 * Bao gồm: Đăng nhập (Local/Google/Facebook), Đăng ký, Quên mật khẩu, Refresh token.
 */

import authorizeAxios from '../utils/authorizeAxios'

export const loginAPI = (data) => authorizeAxios.post('/auth/login', data)

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

export const facebookLoginAPI = (token) => {
  return authorizeAxios.post('/auth/facebook', { accessToken: token })
}
export const checkEmailVerifiedAPI = (email) => {
  return authorizeAxios.post('/auth/check-email-verified', { email })
}

export const changePasswordAPI = (data) => authorizeAxios.post('/auth/change-password', data)