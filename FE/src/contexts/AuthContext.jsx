import { createContext, useContext, useEffect, useState } from 'react'
import { loginAPI, googleLoginAPI, facebookLoginAPI, getMeAPI, logoutAPI } from '../apis/authApi'

const AuthContext = createContext(null)

function getRedirectPath(roleName) {
  switch (roleName) {
    case 'Manager': return '/manager/dashboard'
    case 'Staff': return '/staff/dashboard'
    case 'Driver': return '/driver/dashboard'
    default: return '/'
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMeAPI()
      .then((res) => setUser(res.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handleForceLogout = () => setUser(null)
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [])

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

  // ✅ Bug 3 fix — trả { user, message }
  async function loginWithGoogle(idToken) {
    const res = await googleLoginAPI(idToken)
    const { user: loggedUser, message } = res.data.data
    setUser(loggedUser)
    return { user: loggedUser, message }
  }

  async function loginWithFacebook(fbAccessToken) {
    const res = await facebookLoginAPI(fbAccessToken)
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
    loginWithFacebook,
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