// src/pages/admin/AdminUsers.jsx
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Search, RefreshCcw, UserPlus, Pencil, Lock, Unlock, ShieldCheck, MailCheck, MailX } from 'lucide-react'
import { toast } from 'react-toastify'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import {
  getUsersAPI, getRolesAPI, createUserAPI, updateUserAPI, toggleUserStatusAPI, USE_MOCK
} from '../../apis/adminApi'

const roleBadge = {
  Driver: 'primary',
  Staff: 'success',
  Manager: 'warning',
  Admin: 'danger'
}

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—'

const AdminUsers = () => {
  const [rows, setRows] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [trigger, setTrigger] = useState(0)

  // Modal tạo/sửa
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (roleFilter) params.roleId = roleFilter
      if (statusFilter !== '') params.isActive = statusFilter
      const res = await getUsersAPI(params)
      setRows(res.data.data || [])
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
    getRolesAPI().then(res => setRoles(res.data.data || [])).catch(() => {})
  }, [])

  const applyFilters = () => setTrigger(t => t + 1)

  // ── Modal handlers ───────────────────────────────────────────
  const openCreate = () => {
    setEditing(null)
    reset({ FullName: '', Email: '', PhoneNumber: '', RoleID: '' })
    setModalOpen(true)
  }
  const openEdit = (u) => {
    setEditing(u)
    reset({ FullName: u.FullName, Email: u.Email, PhoneNumber: u.PhoneNumber || '', RoleID: String(u.RoleID) })
    setModalOpen(true)
  }

  const onSubmit = async (form) => {
    try {
      if (editing) {
        await updateUserAPI(editing.UserID, form)
        toast.success('Cập nhật người dùng thành công')
      } else {
        await createUserAPI(form)
        toast.success('Tạo người dùng thành công')
      }
      setModalOpen(false)
      applyFilters()
    } catch {
      toast.error('Thao tác thất bại')
    }
  }

  const toggleStatus = async (u) => {
    try {
      await toggleUserStatusAPI(u.UserID, u.IsActive ? 0 : 1)
      toast.success(u.IsActive ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản')
      applyFilters()
    } catch {
      toast.error('Không thể đổi trạng thái tài khoản')
    }
  }

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">Quản trị / Người dùng</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Quản lý người dùng</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={applyFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            <RefreshCcw size={16} /> Làm mới
          </button>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:scale-95 transition-all">
            <UserPlus size={16} /> Thêm người dùng
          </button>
        </div>
      </div>

      {USE_MOCK && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm font-semibold text-amber-700 flex items-center gap-2">
          <ShieldCheck size={18} />
          Đang dùng dữ liệu mẫu — thao tác chỉ lưu tạm trong phiên. Sẽ lưu thật khi backend Admin kết nối.
        </div>
      )}

      {/* Filters + Table */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/60">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center mb-5">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()}
              placeholder="Tìm tên, email, số điện thoại..."
              className="w-full rounded-xl bg-slate-50 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setTrigger(t => t + 1) }}
            className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none border border-slate-200 hover:border-slate-300 focus:border-blue-500 transition">
            <option value="">Tất cả vai trò</option>
            {roles.map(r => <option key={r.RoleID} value={r.RoleID}>{r.RoleName}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setTrigger(t => t + 1) }}
            className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none border border-slate-200 hover:border-slate-300 focus:border-blue-500 transition">
            <option value="">Tất cả trạng thái</option>
            <option value="1">Đang hoạt động</option>
            <option value="0">Bị khoá</option>
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
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Liên hệ</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Vai trò</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Email</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Trạng thái</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Ngày tạo</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(u => (
                    <tr key={u.UserID} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-600">
                            {u.FullName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="font-bold text-slate-900">{u.FullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-700">{u.Email}</p>
                        <p className="text-xs text-slate-400">{u.PhoneNumber || '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={roleBadge[u.RoleName] || 'default'}>{u.RoleName}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        {u.IsEmailVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><MailCheck size={14} /> Đã xác thực</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400"><MailX size={14} /> Chưa</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {u.IsActive ? (
                          <Badge variant="success">Hoạt động</Badge>
                        ) : (
                          <Badge variant="danger">Bị khoá</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">{fmtDate(u.CreatedAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(u)} title="Chỉnh sửa"
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => toggleStatus(u)} title={u.IsActive ? 'Khoá' : 'Mở khoá'}
                            className={`rounded-lg p-2 transition ${u.IsActive ? 'text-slate-500 hover:bg-rose-50 hover:text-rose-600' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                            {u.IsActive ? <Lock size={16} /> : <Unlock size={16} />}
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

      {/* Modal tạo/sửa */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Huỷ</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên</label>
            <input {...register('FullName', { required: 'Vui lòng nhập họ tên' })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            {errors.FullName && <p className="text-xs text-red-500 mt-1">{errors.FullName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <input {...register('Email', {
              required: 'Vui lòng nhập email',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' }
            })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            {errors.Email && <p className="text-xs text-red-500 mt-1">{errors.Email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số điện thoại</label>
            <input {...register('PhoneNumber')}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vai trò</label>
            <select {...register('RoleID', { required: 'Vui lòng chọn vai trò' })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition">
              <option value="">-- Chọn vai trò --</option>
              {roles.map(r => <option key={r.RoleID} value={r.RoleID}>{r.RoleName}</option>)}
            </select>
            {errors.RoleID && <p className="text-xs text-red-500 mt-1">{errors.RoleID.message}</p>}
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminUsers
