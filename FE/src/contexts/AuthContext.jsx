/**
 * FILE: AuthContext.jsx
 * MÔ TẢ: Cung cấp Context để quản lý trạng thái xác thực (Authentication State) toàn cục.
 * Xử lý các logic: Đăng nhập (Local/Google/Facebook), Đăng xuất, Khởi tạo xác thực khi tải trang,
 * và điều hướng theo vai trò (Role-based redirect).
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { loginAPI, googleLoginAPI, getMeAPI, logoutAPI } from '../apis/authApi'

const AuthContext = createContext(null)

function getRedirectPath(roleName) {
  switch (roleName) {
  case 'Admin': return '/admin'
  case 'Manager': return '/manager'
  case 'Staff': return '/staff/dashboard'
  case 'Driver': return '/driver'
  default: return '/'
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const handleLoadingDone = () => setLoading(false)
    window.addEventListener('auth:loading-done', handleLoadingDone)
    return () => window.removeEventListener('auth:loading-done', handleLoadingDone)
  }, [])
  // AuthContext.jsx
  useEffect(() => {
    let cancelled = false

    async function initAuth() {
      try {
        const res = await getMeAPI()
        if (!cancelled) {
          setUser(res.data.data)
          setLoading(false)
        }
      } catch (err) {
        if (cancelled) return
        const code = err?.response?.data?.code
        // TOKEN_EXPIRED: interceptor đã tự refresh + retry getMeAPI bên trong
        // promise đã resolve ở trên rồi nếu thành công
        // nếu vào catch này với TOKEN_EXPIRED = refresh thất bại
        setUser(null)
        setLoading(false)
      }
    }

    initAuth()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const handleForceLogout = () => setUser(null)
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [])

  async function login({ email, password }) {
    const res = await loginAPI({ email, password })
    const loggedUser = res.data.data.user
    setUser(loggedUser)
    return loggedUser
  }

  // ✅ Bug 3 fix — trả { user, message }
  async function loginWithGoogle(idToken) {
    const res = await googleLoginAPI(idToken)
    const { user: loggedUser, message } = res.data.data
    setUser(loggedUser)
    return { user: loggedUser, message }
  }

  async function logout() {
    try {
      await logoutAPI()
    } catch {
      //
    } finally {
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    logout,
    getRedirectPath
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải dùng bên trong <AuthProvider>')
  return ctx
}