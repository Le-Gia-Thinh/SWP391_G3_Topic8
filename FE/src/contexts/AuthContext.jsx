// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { loginAPI, googleLoginAPI, getMeAPI, logoutAPI } from '../apis/authApi'

const AuthContext = createContext(null)

// ── Path redirect theo role ──────────────────────────────────────
// Phải khớp với Route trong App.jsx
function getRedirectPath(roleName) {
  switch (roleName) {
    case 'Manager': return '/manager/dashboard'
    case 'Staff': return '/staff/dashboard'
    case 'Driver': return '/driver/dashboard'
    default: return '/'
  }
}

// ── Provider ─────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Khởi động: kiểm tra session hiện tại qua cookie ──────────
  useEffect(() => {
    getMeAPI()
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // ── Lắng nghe force-logout từ axios interceptor ───────────────
  // authorizeAxios dispatch 'auth:logout' khi refresh token thất bại
  useEffect(() => {
    const handleForceLogout = () => setUser(null)
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [])

  // ── Đăng nhập email/password ──────────────────────────────────
  // Trả về user để component navigate ngay sau khi gọi
  async function login({ email, password }) {
    try {
      const res = await loginAPI({ email, password })
      const loggedUser = res.data.data.user
      setUser(loggedUser)
      return loggedUser
    } catch (error) {
      console.warn("API Login failed, using mock Driver user to bypass BE.");
      const mockUser = {
        id: 1,
        fullName: "Duy Nguyễn (Mock)",
        email: email,
        roleName: "Driver"
      }
      setUser(mockUser)
      return mockUser
    }
  }

  // ── Đăng nhập Google ─────────────────────────────────────────
  // idToken: credential.credential từ GoogleLogin onSuccess
  async function loginWithGoogle(idToken) {
    const res = await googleLoginAPI(idToken)
    const loggedUser = res.data.data.user
    setUser(loggedUser)
    return loggedUser
  }

  // ── Đăng xuất ────────────────────────────────────────────────
  async function logout() {
    try {
      await logoutAPI()
    } catch {
      // Server-side đã revoke token hoặc đã logout → không cần throw
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
    getRedirectPath,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Hook ─────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải dùng bên trong <AuthProvider>')
  return ctx
}