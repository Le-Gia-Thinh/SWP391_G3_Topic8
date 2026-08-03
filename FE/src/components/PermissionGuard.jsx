/**
 * FILE: PermissionGuard.jsx
 * MÔ TẢ: Component bảo vệ phân quyền (Permission Guard).
 * Tự động kiểm tra quyền hạn của người dùng đang đăng nhập đối với từng trang/chức năng.
 * Tái sử dụng trên TOÀN BỘ HỆ THỐNG để tránh trùng lặp code.
 */

import { useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'

const PermissionGuard = ({ permission, children }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const toastedRef = useRef(false)

  // ⚠️ QUAN TRỌNG: Tất cả hooks PHẢI đứng trước mọi return (Rules of Hooks)
  const isAdmin = user?.roleName === 'Admin'
  const permissions = Array.isArray(user?.permissions) ? user.permissions : null
  // null = chưa nạp xong, [] = không có quyền nào, ['X','Y'] = có quyền
  const hasAccess = isAdmin || !permission || (permissions !== null && permissions.includes(permission))

  useEffect(() => {
    // Chỉ toast khi user đã nạp đầy đủ, không phải admin, và bị chặn thực sự
    if (user && !isAdmin && permissions !== null && permission && !permissions.includes(permission)) {
      if (!toastedRef.current) {
        toastedRef.current = true
        toast.error(
          `Bạn không có quyền thực hiện thao tác này (${permission}). Vui lòng liên hệ Admin.`,
          { toastId: `perm_denied_${permission}` }
        )
      }
    } else {
      toastedRef.current = false
    }
  }, [user, isAdmin, permissions, permission])

  // Nếu user chưa load xong hoặc permissions chưa nạp → không chặn nhầm
  if (!user || permissions === null) return children

  // Admin luôn có toàn bộ quyền
  if (isAdmin) return children

  // Bị chặn quyền: hiện màn hình 403
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700 my-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-500 mb-5 border border-rose-100 shadow-inner">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quyền truy cập bị từ chối (403 Forbidden)</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2 leading-relaxed">
          Tài khoản cá nhân của bạn hiện không được cấp quyền{' '}
          <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold">
            {permission}
          </code>.
        </p>
        <p className="text-xs text-slate-400 mt-1">Vui lòng liên hệ Admin hệ thống để được bật lại quyền thực hiện chức năng này.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800 dark:hover:bg-blue-700 transition cursor-pointer"
        >
          Quay lại trang trước
        </button>
      </div>
    )
  }

  return children
}

export default PermissionGuard
