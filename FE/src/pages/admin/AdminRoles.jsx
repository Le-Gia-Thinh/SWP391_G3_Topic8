// src/pages/admin/AdminRoles.jsx
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Search, RefreshCcw, ShieldCheck, Lock, Unlock, KeyRound, Users } from 'lucide-react'
import { toast } from 'react-toastify'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import {
  getUsersAPI, getRolesAPI, updateUserAPI, toggleUserStatusAPI, resetUserPasswordAPI, USE_MOCK
} from '../../apis/adminApi'

const roleBadge = {
  Driver: 'primary',
  Staff: 'success',
  Manager: 'warning',
  Admin: 'danger'
}

// Các vai trò được quản lý trong bảng này (bỏ Admin)
const MANAGED_ROLES = ['Driver', 'Staff', 'Manager']

const AdminRoles = () => {
  const [rows, setRows] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [trigger, setTrigger] = useState(0)

  // Modal đặt lại mật khẩu
  const [resetTarget, setResetTarget] = useState(null)
  const { register, handleSubmit, reset: resetForm, formState: { errors, isSubmitting } } = useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (roleFilter) params.roleId = roleFilter
      const res = await getUsersAPI(params)
      // Chỉ giữ Driver/Staff/Manager
      setRows((res.data.data || []).filter((u) => MANAGED_ROLES.includes(u.RoleName)))
    } catch {
      toast.error('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 80)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    getRolesAPI()
      .then((res) => setRoles((res.data.data || []).filter((r) => MANAGED_ROLES.includes(r.RoleName))))
      .catch(() => { })
  }, [])

  const applyFilters = () => setTrigger((t) => t + 1)

  // ── Actions ──────────────────────────────────────────────────
  const changeRole = async (user, newRoleId) => {
    if (Number(newRoleId) === user.RoleID) return
    setBusyId(user.UserID)
    try {
      await updateUserAPI(user.UserID, { roleId: Number(newRoleId) })
      const newRole = roles.find((r) => r.RoleID === Number(newRoleId))
      setRows((prev) => prev.map((u) =>
        u.UserID === user.UserID ? { ...u, RoleID: Number(newRoleId), RoleName: newRole?.RoleName || u.RoleName } : u
      ))
      toast.success(`Đã đổi vai trò "${user.FullName}" → ${newRole?.RoleName}`)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể đổi vai trò')
    } finally {
      setBusyId(null)
    }
  }

  const toggleStatus = async (user) => {
    setBusyId(user.UserID)
    try {
      await toggleUserStatusAPI(user.UserID, user.IsActive ? 0 : 1)
      setRows((prev) => prev.map((u) =>
        u.UserID === user.UserID ? { ...u, IsActive: u.IsActive ? 0 : 1 } : u
      ))
      toast.success(user.IsActive ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể đổi trạng thái tài khoản')
    } finally {
      setBusyId(null)
    }
  }

  // Mở modal nhập mật khẩu mới
  const openResetPassword = (user) => {
    resetForm({ NewPassword: '', ConfirmPassword: '' })
    setResetTarget(user)
  }

  const submitResetPassword = async (form) => {
    try {
      await resetUserPasswordAPI(resetTarget.UserID, form.NewPassword)
      toast.success(`Đã đặt lại mật khẩu cho "${resetTarget.FullName}"`)
      setResetTarget(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể đặt lại mật khẩu')
    }
  }

  // Thống kê nhanh theo vai trò
  const counts = MANAGED_ROLES.map((rn) => ({ role: rn, count: rows.filter((u) => u.RoleName === rn).length }))

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">Quản trị / Phân quyền</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Vai trò & Phân quyền</h1>
        </div>
        <button onClick={applyFilters}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition self-start">
          <RefreshCcw size={16} /> Làm mới
        </button>
      </div>

      {USE_MOCK && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm font-semibold text-amber-700 flex items-center gap-2">
          <ShieldCheck size={18} />
          Đang dùng dữ liệu mẫu — thao tác phân quyền chỉ lưu tạm trong phiên. Sẽ lưu thật khi backend Admin kết nối.
        </div>
      )}

      {/* Thống kê nhanh */}
      <div className="grid gap-4 sm:grid-cols-3">
        {counts.map((c) => (
          <div key={c.role} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <Badge variant={roleBadge[c.role]}>{c.role}</Badge>
            </div>
            <p className="text-2xl font-black text-slate-800">{c.count}</p>
          </div>
        ))}
      </div>

      {/* Filters + Table */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/60">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center mb-5">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Tìm tên, email, số điện thoại..."
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white dark:focus:bg-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setTrigger((t) => t + 1) }}
            className="rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none border border-slate-200 hover:border-slate-300 focus:border-blue-500 transition">
            <option value="">Tất cả vai trò</option>
            {roles.map((r) => <option key={r.RoleID} value={r.RoleID}>{r.RoleName}</option>)}
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto overflow-y-auto max-h-130">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : rows.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center text-slate-500">
                <Search size={44} className="text-slate-300 mb-3" />
                <p className="font-bold text-slate-700">Không tìm thấy người dùng</p>
                <p className="text-sm mt-1 text-slate-500">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Người dùng</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Vai trò (đổi quyền)</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Trạng thái</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50 text-right">Thao tác quản trị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((u) => (
                    <tr key={u.UserID} className={`bg-white hover:bg-slate-50 transition-colors ${busyId === u.UserID ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-600">
                            {u.FullName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.FullName}</p>
                            <p className="text-xs text-slate-400">{u.Email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={roleBadge[u.RoleName] || 'default'}>{u.RoleName}</Badge>
                          <select
                            value={u.RoleID}
                            disabled={busyId === u.UserID}
                            onChange={(e) => changeRole(u, e.target.value)}
                            className="rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none border border-slate-200 hover:border-blue-300 focus:border-blue-500 transition disabled:opacity-50"
                          >
                            {roles.map((r) => <option key={r.RoleID} value={r.RoleID}>{r.RoleName}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {u.IsActive ? <Badge variant="success">Hoạt động</Badge> : <Badge variant="danger">Bị khoá</Badge>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openResetPassword(u)} disabled={busyId === u.UserID} title="Đặt lại mật khẩu"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition disabled:opacity-50">
                            <KeyRound size={14} /> Đặt lại MK
                          </button>
                          <button onClick={() => toggleStatus(u)} disabled={busyId === u.UserID}
                            title={u.IsActive ? 'Khoá tài khoản' : 'Mở khoá tài khoản'}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${u.IsActive
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}>
                            {u.IsActive ? <><Lock size={14} /> Khoá</> : <><Unlock size={14} /> Mở khoá</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal đặt lại mật khẩu */}
      <Modal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Đặt lại mật khẩu"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setResetTarget(null)} disabled={isSubmitting}>Huỷ</Button>
            <Button onClick={handleSubmit(submitResetPassword)} disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit(submitResetPassword)} className="space-y-4">
          <p className="text-sm text-slate-600">
            Đặt mật khẩu mới cho <span className="font-bold text-slate-900">{resetTarget?.FullName}</span>.
          </p>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Mật khẩu mới</label>
            <input type="password" {...register('NewPassword', {
              required: 'Vui lòng nhập mật khẩu mới',
              minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }
            })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            {errors.NewPassword && <p className="text-xs text-red-500 mt-1">{errors.NewPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Xác nhận mật khẩu</label>
            <input type="password" {...register('ConfirmPassword', {
              required: 'Vui lòng xác nhận mật khẩu',
              validate: (val, formVals) => val === formVals.NewPassword || 'Mật khẩu xác nhận không khớp'
            })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            {errors.ConfirmPassword && <p className="text-xs text-red-500 mt-1">{errors.ConfirmPassword.message}</p>}
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminRoles