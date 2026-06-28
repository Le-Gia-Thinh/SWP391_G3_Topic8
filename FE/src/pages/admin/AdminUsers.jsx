/**
 * FILE: AdminUsers.jsx
 * MÔ TẢ: Trang Quản lý Người dùng dành cho Admin.
 * Hỗ trợ CRUD người dùng, cấp phát tài khoản nội bộ (Manager/Staff) và kiểm tra ràng buộc độ tuổi (>18).
 */

// src/pages/admin/AdminUsers.jsx
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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

// Các vai trò bắt buộc phải có Ngày sinh + Ngày vào làm (theo ràng buộc CK_Users_MinAge ở DB)
const ROLES_REQUIRE_DATES = ['Staff', 'Manager']

// Tài khoản hệ thống walk-in guest — không cho sửa/khóa/đổi vai trò
const SYSTEM_WALKIN_EMAIL = 'walkin.guest@system.local'

// Tính tuổi tại một mốc thời gian (năm tròn)
const ageAt = (dob, at) => Math.floor((new Date(at) - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25))

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—'

const AdminUsers = () => {
  const { t } = useTranslation()
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
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm()

  const selectedRoleId = watch('RoleID')
  const selectedRoleName = roles.find(r => String(r.RoleID) === String(selectedRoleId))?.RoleName
  const needsDates = ROLES_REQUIRE_DATES.includes(selectedRoleName)

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
      toast.error(t('admin.users.loadFail'))
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 80)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    getRolesAPI().then(res => setRoles(res.data.data || [])).catch(() => { })
  }, [])

  const applyFilters = () => setTrigger(tt => tt + 1)

  // Có phải tài khoản hệ thống không
  const isSystemAccount = (u) => u?.Email === SYSTEM_WALKIN_EMAIL

  // ── Modal handlers ───────────────────────────────────────────
  const openCreate = () => {
    setEditing(null)
    reset({ FullName: '', Email: '', Password: '', PhoneNumber: '', RoleID: '', DateOfBirth: '', HireDate: '' })
    setModalOpen(true)
  }
  const openEdit = (u) => {
    if (isSystemAccount(u)) {
      toast.info(t('admin.users.systemAccountNotice'))
      return
    }
    setEditing(u)
    reset({
      FullName: u.FullName,
      Email: u.Email,
      PhoneNumber: u.PhoneNumber || '',
      RoleID: String(u.RoleID),
      DateOfBirth: u.DateOfBirth ? u.DateOfBirth.slice(0, 10) : '',
      HireDate: u.HireDate ? u.HireDate.slice(0, 10) : ''
    })
    setModalOpen(true)
  }

  const onSubmit = async (form) => {
    // ── Validate đủ 18 tuổi NGAY tại FE khi là Staff/Manager (Trường hợp A) ──
    if (needsDates) {
      if (!form.DateOfBirth || !form.HireDate) {
        toast.error(t('admin.users.dateMissingError'))
        return
      }
      if (ageAt(form.DateOfBirth, form.HireDate) < 18) {
        toast.error(t('admin.users.ageError'))
        return
      }
    }

    try {
      if (editing) {
        // Cập nhật: không gửi email/password (backend không cho đổi email qua route này)
        await updateUserAPI(editing.UserID, {
          fullName: form.FullName,
          phoneNumber: form.PhoneNumber || null,
          roleId: Number(form.RoleID),
          dateOfBirth: form.DateOfBirth || null,
          hireDate: form.HireDate || null
        })
        toast.success(t('admin.users.updateSuccess'))
      } else {
        await createUserAPI({
          fullName: form.FullName,
          email: form.Email,
          password: form.Password,
          phoneNumber: form.PhoneNumber || null,
          roleId: Number(form.RoleID),
          dateOfBirth: form.DateOfBirth || null,
          hireDate: form.HireDate || null
        })
        toast.success(t('admin.users.createSuccess'))
      }
      setModalOpen(false)
      applyFilters()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.users.saveFail'))
    }
  }

  const toggleStatus = async (u) => {
    if (isSystemAccount(u)) {
      toast.info(t('admin.users.systemAccountLockNotice'))
      return
    }
    try {
      await toggleUserStatusAPI(u.UserID, u.IsActive ? 0 : 1)
      toast.success(u.IsActive ? t('admin.users.lockSuccess') : t('admin.users.unlockSuccess'))
      applyFilters()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.users.toggleStatusFail'))
    }
  }

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">{t('admin.users.eyebrow')}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{t('admin.users.title')}</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={applyFilters}
            className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 font-bold hover:bg-slate-50 transition">
            <RefreshCcw size={16} /> {t('admin.users.refresh')}
          </button>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-3xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:scale-95 transition-all">
            <UserPlus size={16} /> {t('admin.users.addNew')}
          </button>
        </div>
      </div>

      {USE_MOCK && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm font-semibold text-amber-700 flex items-center gap-2">
          <ShieldCheck size={18} />
          {t('admin.users.mockNotice')}
        </div>
      )}

      {/* Filters + Table */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center mb-5">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()}
              placeholder={t('admin.users.searchPlaceholder')}
              className="w-full rounded-3xl bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white dark:focus:bg-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setTrigger(tt => tt + 1) }}
            className="rounded-3xl bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 font-bold outline-none border border-slate-200 hover:border-slate-300 focus:border-blue-500 transition">
            <option value="">{t('admin.users.allRoles')}</option>
            {roles.map(r => <option key={r.RoleID} value={r.RoleID}>{t(`roles.${r.RoleName}`, r.RoleName)}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setTrigger(tt => tt + 1) }}
            className="rounded-3xl bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 font-bold outline-none border border-slate-200 hover:border-slate-300 focus:border-blue-500 transition">
            <option value="">{t('admin.users.allStatuses')}</option>
            <option value="1">{t('admin.users.statusActive')}</option>
            <option value="0">{t('admin.users.statusLocked')}</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <div className="overflow-x-auto overflow-y-auto max-h-130">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : rows.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center text-slate-500 font-medium">
                <Search size={44} className="text-slate-300 mb-3" />
                <p className="font-bold text-slate-700 font-bold">{t('admin.users.emptyTitle')}</p>
                <p className="text-sm mt-1 text-slate-500 font-medium">{t('admin.users.emptyHint')}</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-sm text-slate-700 font-bold">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('admin.users.col.user')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('admin.users.col.contact')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('admin.users.col.role')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('admin.users.col.email')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('admin.users.col.status')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('admin.users.col.createdAt')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50 text-right">{t('admin.users.col.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(u => {
                    const system = isSystemAccount(u)
                    return (
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
                          <p className="font-medium text-slate-700 font-bold">{u.Email}</p>
                          <p className="text-xs text-slate-400">{u.PhoneNumber || '—'}</p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={roleBadge[u.RoleName] || 'default'}>{t(`roles.${u.RoleName}`, u.RoleName)}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          {u.IsEmailVerified ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><MailCheck size={14} /> {t('admin.users.emailVerified')}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400"><MailX size={14} /> {t('admin.users.emailUnverified')}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {u.IsActive ? (
                            <Badge variant="success">{t('admin.users.statusActive')}</Badge>
                          ) : (
                            <Badge variant="danger">{t('admin.users.statusLocked')}</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-500 font-medium text-xs">{fmtDate(u.CreatedAt)}</td>
                        <td className="px-5 py-4">
                          {system ? (
                            <div className="flex items-center justify-end">
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 font-medium">
                                <ShieldCheck size={13} /> {t('admin.users.systemAccountBadge')}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEdit(u)} title={t('admin.users.editTitle')}
                                className="rounded-xl p-2 text-slate-500 font-medium hover:bg-blue-50 hover:text-blue-600 transition">
                                <Pencil size={16} />
                              </button>
                              <button onClick={() => toggleStatus(u)} title={u.IsActive ? t('admin.users.lockTitle') : t('admin.users.unlockTitle')}
                                className={`rounded-xl p-2 transition ${u.IsActive ? 'text-slate-500 font-medium hover:bg-rose-50 hover:text-rose-600' : 'text-slate-500 font-medium hover:bg-emerald-50 hover:text-emerald-600'}`}>
                                {u.IsActive ? <Lock size={16} /> : <Unlock size={16} />}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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
        title={editing ? t('admin.users.modal.titleEdit') : t('admin.users.modal.titleCreate')}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('admin.users.modal.cancel')}</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? t('admin.users.modal.saving') : editing ? t('admin.users.modal.saveChanges') : t('admin.users.modal.create')}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 font-bold dark:text-slate-200 mb-1.5">{t('admin.users.modal.fullNameLabel')}</label>
            <input {...register('FullName', { required: t('admin.users.modal.fullNameRequired') })}
              className="w-full rounded-3xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            {errors.FullName && <p className="text-xs text-red-500 mt-1">{errors.FullName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 font-bold dark:text-slate-200 mb-1.5">{t('admin.users.modal.emailLabel')}</label>
            <input disabled={!!editing} {...register('Email', {
              required: t('admin.users.modal.emailRequired'),
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('admin.users.modal.emailInvalid') }
            })}
            className="w-full rounded-3xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition disabled:bg-slate-100 disabled:text-slate-400" />
            {errors.Email && <p className="text-xs text-red-500 mt-1">{errors.Email.message}</p>}
            {editing && <p className="text-xs text-slate-400 mt-1">{t('admin.users.modal.emailEditHint')}</p>}
          </div>
          {!editing && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 font-bold dark:text-slate-200 mb-1.5">{t('admin.users.modal.passwordLabel')}</label>
              <input type="password" {...register('Password', {
                required: t('admin.users.modal.passwordRequired'),
                minLength: { value: 6, message: t('admin.users.modal.passwordMinLength') }
              })}
              className="w-full rounded-3xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
              {errors.Password && <p className="text-xs text-red-500 mt-1">{errors.Password.message}</p>}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 font-bold dark:text-slate-200 mb-1.5">{t('admin.users.modal.phoneLabel')}</label>
            <input {...register('PhoneNumber', {
              pattern: {
                value: /^(0|84)(3|5|7|8|9)[0-9]{8}$/,
                message: t('admin.users.modal.phoneInvalid')
              }
            })}
            className="w-full rounded-3xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            {errors.PhoneNumber && <p className="text-xs text-red-500 mt-1">{errors.PhoneNumber.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 font-bold dark:text-slate-200 mb-1.5">{t('admin.users.modal.roleLabel')}</label>
            <select {...register('RoleID', { required: t('admin.users.modal.roleRequired') })}
              className="w-full rounded-3xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition">
              <option value="">{t('admin.users.modal.rolePlaceholder')}</option>
              {roles.map(r => <option key={r.RoleID} value={r.RoleID}>{t(`roles.${r.RoleName}`, r.RoleName)}</option>)}
            </select>
            {errors.RoleID && <p className="text-xs text-red-500 mt-1">{errors.RoleID.message}</p>}
          </div>

          {/* Ngày sinh / Ngày vào làm: bắt buộc với Staff/Manager (ràng buộc CK_Users_MinAge ở DB) */}
          {needsDates && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 font-bold dark:text-slate-200 mb-1.5">{t('admin.users.modal.dobLabel')}</label>
                  <input type="date" {...register('DateOfBirth', {
                    required: needsDates ? t('admin.users.modal.dateRequired') : false
                  })}
                  className="w-full rounded-3xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                  {errors.DateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.DateOfBirth.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 font-bold dark:text-slate-200 mb-1.5">{t('admin.users.modal.hireDateLabel')}</label>
                  <input type="date" {...register('HireDate', {
                    required: needsDates ? t('admin.users.modal.dateRequired') : false
                  })}
                  className="w-full rounded-3xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                  {errors.HireDate && <p className="text-xs text-red-500 mt-1">{errors.HireDate.message}</p>}
                </div>
              </div>
              <p className="text-[12px] text-slate-500 font-medium bg-slate-50 rounded-xl px-3 py-2">
                {t('admin.users.modal.dateHint')}
              </p>
            </>
          )}
        </form>
      </Modal>
    </div>
  )
}

export default AdminUsers