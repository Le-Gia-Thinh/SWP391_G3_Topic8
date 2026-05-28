// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// ── Chỉ cần đăng nhập ────────────────────────────────────────────
export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

// ── Chỉ dành cho guest (chưa đăng nhập) ─────────────────────────
// Đã login → redirect về đúng dashboard theo role
export const GuestRoute = () => {
  const { isAuthenticated, loading, user, getRedirectPath } = useAuth()
  if (loading) return null
  if (isAuthenticated) return <Navigate to={getRedirectPath(user?.roleName)} replace />
  return <Outlet />
}

// ── Kiểm tra role cụ thể ─────────────────────────────────────────
export const RoleRoute = ({ allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user?.roleName)) return <Navigate to="/403" replace />
  return <Outlet />
}