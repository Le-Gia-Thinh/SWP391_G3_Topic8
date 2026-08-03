/**
 * FILE: AdminRoles.jsx
 * MÔ TẢ: Trang Quản lý Vai trò (Role) và Quyền truy cập dành cho Admin.
 * Cho phép thay đổi vai trò (Staff/Manager/Driver), khóa/mở khóa tài khoản và đặt lại mật khẩu cho nhân viên.
 */

// src/pages/admin/AdminRoles.jsx
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Search, RefreshCcw, Lock, Unlock, KeyRound, Users, ShieldAlert, ShieldCheck, ShieldOff, LayoutDashboard, Car, FileText, Wrench, DollarSign } from 'lucide-react'
import { toast } from 'react-toastify'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import {
  getUsersAPI, getRolesAPI, updateUserAPI, toggleUserStatusAPI, resetUserPasswordAPI,
  getPermissionsAPI, getRolePermissionsAPI, updateRolePermissionsAPI,
  getUserPermissionsAPI, updateUserPermissionsAPI
} from '../../apis/adminApi'

const roleBadge = {
  Driver: 'primary',
  Staff: 'success',
  Manager: 'warning',
  Admin: 'danger'
}

// Các vai trò được quản lý trong bảng người dùng bên dưới (Driver, Staff, Manager)
const MANAGED_ROLES = ['Driver', 'Staff', 'Manager']

const DEFAULT_PERMISSIONS = [
  { PermissionID: 1, PermissionName: 'VIEW_SLOTS', DescriptionKey: 'admin.roles.perms.VIEW_SLOTS' },
  { PermissionID: 2, PermissionName: 'MANAGE_SESSIONS', DescriptionKey: 'admin.roles.perms.MANAGE_SESSIONS' },
  { PermissionID: 3, PermissionName: 'MANAGE_USERS', DescriptionKey: 'admin.roles.perms.MANAGE_USERS' },
  { PermissionID: 4, PermissionName: 'VIEW_REPORTS', DescriptionKey: 'admin.roles.perms.VIEW_REPORTS' },
  { PermissionID: 5, PermissionName: 'MANAGE_PAYMENTS', DescriptionKey: 'admin.roles.perms.MANAGE_PAYMENTS' },
  { PermissionID: 6, PermissionName: 'MANAGE_PRICING', DescriptionKey: 'admin.roles.perms.MANAGE_PRICING' },
  { PermissionID: 7, PermissionName: 'MANAGE_BUILDINGS', DescriptionKey: 'admin.roles.perms.MANAGE_BUILDINGS' },
  { PermissionID: 8, PermissionName: 'MANAGE_INCIDENTS', DescriptionKey: 'admin.roles.perms.MANAGE_INCIDENTS' },
  { PermissionID: 9, PermissionName: 'MANAGE_SUPPORT', DescriptionKey: 'admin.roles.perms.MANAGE_SUPPORT' }
]

// Nhóm permissions theo trang/chức năng (theo navbar/page flow)
const PERMISSION_GROUPS = [
  {
    group: 'Bãi đỗ xe',
    icon: Car,
    color: 'blue',
    ids: [1, 2] // VIEW_SLOTS, MANAGE_SESSIONS
  },
  {
    group: 'Tài chính',
    icon: DollarSign,
    color: 'emerald',
    ids: [5, 6] // MANAGE_PAYMENTS, MANAGE_PRICING
  },
  {
    group: 'Hệ thống',
    icon: Wrench,
    color: 'purple',
    ids: [3, 7, 8, 9] // MANAGE_USERS, MANAGE_BUILDINGS, MANAGE_INCIDENTS, MANAGE_SUPPORT
  },
  {
    group: 'Báo cáo',
    icon: FileText,
    color: 'amber',
    ids: [4] // VIEW_REPORTS
  }
]

const DEFAULT_ROLE_PERMS = {
  3: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Manager: all
  2: [1, 2, 5, 8],                // Staff: operational
  1: [1]                          // Driver
}

// Permissions chia theo navbar của từng vai trò
const ROLE_NAVBAR_GROUPS = {
  // Manager Portal navbar groups
  3: [
    {
      group: 'Tổng quan (Dashboard)',
      page: '/manager',
      color: 'slate',
      ids: [] // Dashboard ko cần permission riêng
    },
    {
      group: 'Bãi xe & Phiên (Parking Slots)',
      page: '/manager/positions',
      color: 'blue',
      ids: [1, 2] // VIEW_SLOTS, MANAGE_SESSIONS
    },
    {
      group: 'Cấu hình & Tòa nhà (Parking Setup)',
      page: '/manager/config',
      color: 'indigo',
      ids: [7] // MANAGE_BUILDINGS
    },
    {
      group: 'Bảng giá (Pricing)',
      page: '/manager/pricing',
      color: 'emerald',
      ids: [5, 6] // MANAGE_PAYMENTS, MANAGE_PRICING
    },
    {
      group: 'Sự cố & Hỗ trợ (Incidents)',
      page: '/manager/incidents',
      color: 'orange',
      ids: [8, 9] // MANAGE_INCIDENTS, MANAGE_SUPPORT
    },
    {
      group: 'Báo cáo (Reports)',
      page: '/manager/reports',
      color: 'violet',
      ids: [4] // VIEW_REPORTS
    },
    {
      group: 'Quản lý nhân viên (Users)',
      page: '/manager/staff',
      color: 'rose',
      ids: [3] // MANAGE_USERS
    }
  ],
  // Staff Portal navbar groups
  2: [
    {
      group: 'Bảng điều khiển (Dashboard)',
      page: '/staff/dashboard',
      color: 'slate',
      ids: [] // no permission needed
    },
    {
      group: 'Nhận xe & Vận hành (Check-in/out)',
      page: '/staff/checkin-walkin',
      color: 'blue',
      ids: [2] // MANAGE_SESSIONS
    },
    {
      group: 'Bản đồ & Tra cứu (Parking Map)',
      page: '/staff/parking-map',
      color: 'indigo',
      ids: [1] // VIEW_SLOTS
    },
    {
      group: 'Thanh toán (Payments)',
      page: '/staff/checkout',
      color: 'emerald',
      ids: [5] // MANAGE_PAYMENTS
    },
    {
      group: 'Báo cáo sự cố (Incidents)',
      page: '/staff/create-incident',
      color: 'orange',
      ids: [8] // MANAGE_INCIDENTS
    }
  ]
}

const AdminRoles = () => {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [trigger, setTrigger] = useState(0)

  // State cho Ma trận Quyền hạn (Permissions Matrix)
  const [allPermissions, setAllPermissions] = useState(DEFAULT_PERMISSIONS)
  const [rolePermissionsMap, setRolePermissionsMap] = useState(DEFAULT_ROLE_PERMS)
  const [activeRoleForPerms, setActiveRoleForPerms] = useState(3) // Mặc định chọn Manager (ID = 3)
  const [savingPerms, setSavingPerms] = useState(false)

  // Fetch permissions & role-permissions từ Backend SQL Server
  const fetchPermissionsData = useCallback(async () => {
    try {
      const [permRes, rolePermRes] = await Promise.all([
        getPermissionsAPI(),
        getRolePermissionsAPI()
      ])
      const pList = permRes?.data?.data || permRes?.data || []
      const rpList = rolePermRes?.data?.data || rolePermRes?.data || []
      if (Array.isArray(pList) && pList.length > 0) {
        setAllPermissions(pList)
      }

      if (Array.isArray(rpList) && rpList.length > 0) {
        const map = {}
        rpList.forEach(rp => {
          if (!map[rp.RoleID]) map[rp.RoleID] = []
          if (!map[rp.RoleID].includes(rp.PermissionID)) {
            map[rp.RoleID].push(rp.PermissionID)
          }
        })
        setRolePermissionsMap(map)
      }
    } catch {
      // Keep default permissions if API call fails
    }
  }, [])

  useEffect(() => {
    fetchPermissionsData()
  }, [fetchPermissionsData])

  const togglePermission = (permId) => {
    setRolePermissionsMap(prev => {
      const currentList = prev[activeRoleForPerms] || []
      const newList = currentList.includes(permId)
        ? currentList.filter(id => id !== permId)
        : [...currentList, permId]
      return { ...prev, [activeRoleForPerms]: newList }
    })
  }

  const saveRolePermissions = async () => {
    setSavingPerms(true)
    try {
      const currentList = rolePermissionsMap[activeRoleForPerms] || []
      await updateRolePermissionsAPI(activeRoleForPerms, currentList)
      const roleKey = activeRoleForPerms === 3 ? 'Manager' : activeRoleForPerms === 2 ? 'Staff' : 'Role'
      const targetRoleName = t(`roles.${roleKey}`, roleKey)
      toast.success(t('admin.roles.savePermsSuccess', { role: targetRoleName }))
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || t('admin.roles.savePermsFail'))
    } finally {
      setSavingPerms(false)
    }
  }

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
      // Giữ Driver/Staff/Manager cho quản lý tài khoản & khóa MK
      setRows((res.data.data || []).filter((u) => MANAGED_ROLES.includes(u.RoleName)))
    } catch {
      toast.error(t('admin.roles.loadUsersFail'))
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

  const applyFilters = () => setTrigger((tt) => tt + 1)

  // ── Actions ──────────────────────────────────────────────────
  // ── Role change confirmation ─────────────────────────────────
  const [confirmRoleModal, setConfirmRoleModal] = useState(null)
  const [userPermTarget, setUserPermTarget] = useState(null)
  const [userCustomPerms, setUserCustomPerms] = useState([])

  const requestRoleChange = (user, newRoleId) => {
    if (Number(newRoleId) === user.RoleID) return
    const newRoleObj = roles.find((r) => r.RoleID === Number(newRoleId))
    setConfirmRoleModal({
      user,
      newRoleId: Number(newRoleId),
      newRoleName: newRoleObj?.RoleName || newRoleId,
      oldRoleName: user.RoleName
    })
  }

  const executeRoleChange = async () => {
    if (!confirmRoleModal) return
    const { user, newRoleId, newRoleName } = confirmRoleModal
    setBusyId(user.UserID)
    try {
      await updateUserAPI(user.UserID, { roleId: newRoleId })
      setRows((prev) => prev.map((u) => (u.UserID === user.UserID ? { ...u, RoleID: newRoleId, RoleName: newRoleName } : u)))
      toast.success(t('admin.roles.changeRoleSuccess', { name: user.FullName, role: t(`roles.${newRoleName}`, newRoleName) }))
      setConfirmRoleModal(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.roles.changeRoleFail'))
    } finally {
      setBusyId(null)
    }
  }

  // userCustomPerms: [{ PermissionID, IsGranted }, ...]
  const openUserPermissions = async (user) => {
    setUserPermTarget(user)
    try {
      const res = await getUserPermissionsAPI(user.UserID)
      const raw = res?.data?.data || []
      // raw có thể là [{PermissionID, IsGranted}] hoặc [id, id, ...] tuỳ version
      if (raw.length > 0 && typeof raw[0] === 'object' && 'IsGranted' in raw[0]) {
        setUserCustomPerms(raw)
      } else {
        // Fallback: flat array of IDs → convert to [{PermissionID, IsGranted}]
        const rolePerms = rolePermissionsMap[user.RoleID] || []
        setUserCustomPerms(rolePerms.map(id => ({ PermissionID: id, IsGranted: raw.includes(id) ? 1 : 1 })))
      }
    } catch {
      const rolePerms = rolePermissionsMap[user.RoleID] || []
      setUserCustomPerms(rolePerms.map(id => ({ PermissionID: id, IsGranted: 1 })))
    }
  }

  // Toggle IsGranted cho một permission (chỉ toggle trong phạm vi quyền role)
  const toggleUserCustomPerm = (permId) => {
    setUserCustomPerms(prev => {
      const existing = prev.find(p => p.PermissionID === permId)
      if (existing) {
        return prev.map(p => p.PermissionID === permId ? { ...p, IsGranted: p.IsGranted ? 0 : 1 } : p)
      }
      return [...prev, { PermissionID: permId, IsGranted: 1 }]
    })
  }

  const saveUserCustomPermissions = async () => {
    if (!userPermTarget) return
    try {
      // Chỉ gửi những PermissionID có IsGranted=true để backend lưu
      const grantedIds = userCustomPerms.filter(p => p.IsGranted).map(p => p.PermissionID)
      await updateUserPermissionsAPI(userPermTarget.UserID, grantedIds)
      toast.success(t('admin.roles.customPermsSuccess', { name: userPermTarget?.FullName }))
      setUserPermTarget(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Cập nhật thất bại')
    }
  }

  const toggleStatus = async (user) => {
    setBusyId(user.UserID)
    try {
      await toggleUserStatusAPI(user.UserID, user.IsActive ? 0 : 1)
      setRows((prev) => prev.map((u) => (u.UserID === user.UserID ? { ...u, IsActive: u.IsActive ? 0 : 1 } : u)))
      toast.success(user.IsActive ? t('admin.roles.lockSuccess') : t('admin.roles.unlockSuccess'))
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.roles.toggleStatusFail'))
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
      toast.success(t('admin.roles.resetPasswordModal.success', { name: resetTarget.FullName }))
      setResetTarget(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.roles.resetPasswordModal.fail'))
    }
  }

  // Thống kê nhanh theo vai trò
  const counts = MANAGED_ROLES.map((rn) => ({ role: rn, count: rows.filter((u) => u.RoleName === rn).length }))

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">{t('admin.roles.eyebrow')}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{t('admin.roles.title')}</h1>
        </div>
        <button onClick={applyFilters}
          className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 font-bold hover:bg-slate-50 transition self-start">
          <RefreshCcw size={16} /> {t('admin.roles.refresh')}
        </button>
      </div>


      {/* Thống kê nhanh vai trò */}
      <div className="grid gap-4 sm:grid-cols-3">
        {counts.map((c) => (
          <div key={c.role} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <Badge variant={roleBadge[c.role]}>{t(`roles.${c.role}`, c.role)}</Badge>
            </div>
            <p className="text-2xl font-black text-slate-800 font-black">{c.count}</p>
          </div>
        ))}
      </div>

      {/* ── BẢNG MA TRẬN PHÂN QUYỀN CHI TIẾT (PERMISSIONS MATRIX) ── */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">{t('admin.roles.matrixTitle')}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                SQL Server RBAC
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('admin.roles.matrixSub')}
            </p>
          </div>

          <Button
            onClick={saveRolePermissions}
            isLoading={savingPerms}
            className="rounded-2xl px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition"
          >
            💾 {t('admin.roles.savePerms')}
          </Button>
        </div>

        {/* Tab chọn Vai trò nội bộ (Manager & Staff) — Tách riêng toàn bộ */}
        <div className="flex flex-wrap gap-2 mt-5 mb-6">
          {[
            { id: 3, name: 'Manager', label: t('roles.Manager', 'Quản lý'), badge: 'warning', color: 'amber' },
            { id: 2, name: 'Staff', label: t('roles.Staff', 'Nhân viên'), badge: 'success', color: 'emerald' }
          ].map((r) => {
            const active = activeRoleForPerms === r.id
            const activePermsCount = (rolePermissionsMap[r.id] || []).length
            const colorActive = r.color === 'amber'
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-emerald-600 text-white border-emerald-600'
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRoleForPerms(r.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                  active ? colorActive + ' shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{r.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {activePermsCount} perms
                </span>
              </button>
            )
          })}
        </div>

        {/* Permissions chia theo navbar từng role */}
        {(() => {
          const groups = ROLE_NAVBAR_GROUPS[activeRoleForPerms] || []
          const currentRolePerms = rolePermissionsMap[activeRoleForPerms] || []
          const colorMap = {
            slate:   { card: 'border-slate-200',   header: 'bg-slate-50 text-slate-600',   badge: 'bg-slate-100 text-slate-500', checked: 'bg-slate-50 border-slate-200' },
            blue:    { card: 'border-blue-200',     header: 'bg-blue-50 text-blue-700',     badge: 'bg-blue-50 text-blue-600',   checked: 'bg-blue-50/60 border-blue-200' },
            indigo:  { card: 'border-indigo-200',   header: 'bg-indigo-50 text-indigo-700', badge: 'bg-indigo-50 text-indigo-600', checked: 'bg-indigo-50/60 border-indigo-200' },
            emerald: { card: 'border-emerald-200',  header: 'bg-emerald-50 text-emerald-700', badge: 'bg-emerald-50 text-emerald-600', checked: 'bg-emerald-50/60 border-emerald-200' },
            orange:  { card: 'border-orange-200',   header: 'bg-orange-50 text-orange-700', badge: 'bg-orange-50 text-orange-600', checked: 'bg-orange-50/60 border-orange-200' },
            violet:  { card: 'border-violet-200',   header: 'bg-violet-50 text-violet-700', badge: 'bg-violet-50 text-violet-600', checked: 'bg-violet-50/60 border-violet-200' },
            rose:    { card: 'border-rose-200',     header: 'bg-rose-50 text-rose-700',     badge: 'bg-rose-50 text-rose-600',   checked: 'bg-rose-50/60 border-rose-200' }
          }

          return (
            <div className="space-y-4">
              {groups.map((group) => {
                const c = colorMap[group.color] || colorMap.slate
                const groupPerms = allPermissions.filter(p => group.ids.includes(p.PermissionID))

                return (
                  <div key={group.group} className={`rounded-2xl border overflow-hidden ${c.card}`}>
                    {/* Group header with page path */}
                    <div className={`flex items-center justify-between px-4 py-2.5 ${c.header}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black">{group.group}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${c.badge}`}>
                        {group.page}
                      </span>
                    </div>

                    {/* Permissions trong group */}
                    {groupPerms.length === 0 ? (
                      <div className="px-4 py-3 text-[11px] text-slate-400 italic">
                        Trang này không yêu cầu quyền đặc biệt nào
                      </div>
                    ) : (
                      <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
                        {groupPerms.map((p) => {
                          const isChecked = currentRolePerms.includes(p.PermissionID)
                          const desc = p.DescriptionKey ? t(p.DescriptionKey) : p.Description
                          return (
                            <label
                              key={p.PermissionID}
                              onClick={() => togglePermission(p.PermissionID)}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                isChecked ? c.checked + ' shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 leading-snug">
                                  {p.PermissionName}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                                  {desc}
                                </p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* Filters + Table */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center mb-5">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder={t('admin.roles.searchPlaceholder')}
              className="w-full rounded-3xl bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white dark:focus:bg-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setTrigger((tt) => tt + 1) }}
            className="rounded-3xl bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 font-bold outline-none border border-slate-200 hover:border-slate-300 focus:border-blue-500 transition">
            <option value="">{t('admin.roles.allRoles')}</option>
            {roles.map((r) => <option key={r.RoleID} value={r.RoleID}>{t(`roles.${r.RoleName}`, r.RoleName)}</option>)}
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
                <p className="font-bold text-slate-700 font-bold">{t('admin.roles.emptyTitle')}</p>
                <p className="text-sm mt-1 text-slate-500 font-medium">{t('admin.roles.emptyHint')}</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-sm text-slate-700 font-bold">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('admin.roles.col.user')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('admin.roles.col.role')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('admin.roles.col.status')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50 text-right">{t('admin.roles.col.actions')}</th>
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
                          <Badge variant={roleBadge[u.RoleName] || 'default'}>{t(`roles.${u.RoleName}`, u.RoleName)}</Badge>
                          <select
                            value={u.RoleID}
                            disabled={busyId === u.UserID}
                            onChange={(e) => requestRoleChange(u, e.target.value)}
                            className="rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 px-2.5 py-1.5 text-xs font-semibold text-slate-700 font-bold outline-none border border-slate-200 hover:border-blue-300 focus:border-blue-500 transition disabled:opacity-50"
                          >
                            {roles.map((r) => <option key={r.RoleID} value={r.RoleID}>{t(`roles.${r.RoleName}`, r.RoleName)}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {u.IsActive ? <Badge variant="success">{t('admin.roles.status.active')}</Badge> : <Badge variant="danger">{t('admin.roles.status.locked')}</Badge>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {u.RoleName !== 'Driver' && (
                            <button onClick={() => openUserPermissions(u)} disabled={busyId === u.UserID} title={t('admin.roles.customPermBtn')}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50">
                              <KeyRound size={14} /> {t('admin.roles.customPermBtn')}
                            </button>
                          )}
                          <button onClick={() => openResetPassword(u)} disabled={busyId === u.UserID} title={t('admin.roles.resetPasswordTitle')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition disabled:opacity-50">
                            <KeyRound size={14} /> {t('admin.roles.resetPassword')}
                          </button>
                          <button onClick={() => toggleStatus(u)} disabled={busyId === u.UserID}
                            title={u.IsActive ? t('admin.roles.lockTitle') : t('admin.roles.unlockTitle')}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${u.IsActive
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}>
                            {u.IsActive ? <><Lock size={14} /> {t('admin.roles.lock')}</> : <><Unlock size={14} /> {t('admin.roles.unlock')}</>}
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

      {/* ── Modal xác nhận chuyển vai trò ── */}
      <Modal
        isOpen={!!confirmRoleModal}
        onClose={() => setConfirmRoleModal(null)}
        title={t('admin.roles.confirmRoleTitle')}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setConfirmRoleModal(null)} disabled={busyId === confirmRoleModal?.user?.UserID}>{t('admin.roles.resetPasswordModal.cancel')}</Button>
            <Button variant="warning" onClick={executeRoleChange} isLoading={busyId === confirmRoleModal?.user?.UserID}>{t('admin.roles.confirmRoleSubmit')}</Button>
          </>
        )}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {t('admin.roles.confirmRoleDesc', { name: confirmRoleModal?.user?.FullName })}
          </p>
          <div className="flex items-center justify-center gap-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-sm font-bold text-amber-900">
            <Badge variant={roleBadge[confirmRoleModal?.oldRoleName] || 'default'}>{t(`roles.${confirmRoleModal?.oldRoleName}`, confirmRoleModal?.oldRoleName)}</Badge>
            <span className="text-slate-400">➔</span>
            <Badge variant={roleBadge[confirmRoleModal?.newRoleName] || 'default'}>{t(`roles.${confirmRoleModal?.newRoleName}`, confirmRoleModal?.newRoleName)}</Badge>
          </div>
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {t('admin.roles.confirmRoleNotice')}
          </p>
        </div>
      </Modal>

      {/* ── Modal Phân quyền riêng cho cá nhân ── */}
      <Modal
        isOpen={!!userPermTarget}
        onClose={() => setUserPermTarget(null)}
        title={
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-indigo-500" />
            <span>{t('admin.roles.customPermsTitle', { name: userPermTarget?.FullName })}</span>
          </div>
        }
        footer={(
          <>
            <Button variant="secondary" onClick={() => setUserPermTarget(null)}>{t('admin.roles.resetPasswordModal.cancel')}</Button>
            <Button onClick={saveUserCustomPermissions}>
              <ShieldCheck size={14} className="mr-1" /> {t('admin.roles.customPermsSave')}
            </Button>
          </>
        )}
      >
        <div className="space-y-3">
          {/* Mô tả nguyên tắc phân quyền */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800 leading-relaxed">
            <strong>📋 Nguyên tắc:</strong> Quyền riêng chỉ có thể <strong>thu hẹp</strong> quyền mà vai trò đã được cấp.
            Nếu vai trò không có quyền nào đó, quyền cá nhân cũng không thể thêm vào.
          </div>

          {/* Nhóm permissions theo page/chức năng */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {PERMISSION_GROUPS.map((group) => {
              const rolePermIds = rolePermissionsMap[userPermTarget?.RoleID] || []
              // Lọc permissions trong group mà role có
              const groupPerms = allPermissions.filter(p => group.ids.includes(p.PermissionID))
              if (groupPerms.length === 0) return null

              const GroupIcon = group.icon
              const colorMap = {
                blue: { header: 'bg-blue-50 border-blue-200 text-blue-700', badge: 'bg-blue-100 text-blue-700' },
                emerald: { header: 'bg-emerald-50 border-emerald-200 text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
                purple: { header: 'bg-purple-50 border-purple-200 text-purple-700', badge: 'bg-purple-100 text-purple-700' },
                amber: { header: 'bg-amber-50 border-amber-200 text-amber-700', badge: 'bg-amber-100 text-amber-700' }
              }
              const colors = colorMap[group.color] || colorMap.blue

              return (
                <div key={group.group} className="rounded-xl border border-slate-200 overflow-hidden">
                  {/* Group header */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold border-b ${colors.header}`}>
                    <GroupIcon size={12} />
                    <span>{group.group}</span>
                  </div>
                  {/* Permission items */}
                  <div className="divide-y divide-slate-100">
                    {groupPerms.map((p) => {
                      const roleHasIt = rolePermIds.includes(p.PermissionID)
                      const customEntry = userCustomPerms.find(c => c.PermissionID === p.PermissionID)
                      // Nếu không có entry cá nhân thì dùng role-level
                      const isGranted = customEntry ? !!customEntry.IsGranted : roleHasIt
                      const desc = p.DescriptionKey ? t(p.DescriptionKey) : p.Description
                      const isRoleBlocked = !roleHasIt // Role không có quyền này

                      return (
                        <div
                          key={p.PermissionID}
                          onClick={() => !isRoleBlocked && toggleUserCustomPerm(p.PermissionID)}
                          className={`flex items-center gap-3 px-3 py-2 transition-all ${
                            isRoleBlocked
                              ? 'opacity-40 cursor-not-allowed bg-slate-50'
                              : isGranted
                                ? 'cursor-pointer hover:bg-indigo-50/50 bg-white'
                                : 'cursor-pointer hover:bg-rose-50/30 bg-slate-50/50'
                          }`}
                        >
                          {/* Checkbox / status icon */}
                          <div className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center border ${
                            isRoleBlocked
                              ? 'border-slate-300 bg-slate-100'
                              : isGranted
                                ? 'border-indigo-500 bg-indigo-500'
                                : 'border-rose-300 bg-white'
                          }`}>
                            {!isRoleBlocked && isGranted && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            {!isRoleBlocked && !isGranted && (
                              <svg className="w-2.5 h-2.5 text-rose-400" fill="none" viewBox="0 0 12 12">
                                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            )}
                          </div>

                          {/* Label */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-[11px] font-bold leading-none ${
                              isRoleBlocked ? 'text-slate-400' : isGranted ? 'text-slate-800' : 'text-slate-500 line-through'
                            }`}>{p.PermissionName}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{desc}</p>
                          </div>

                          {/* Status badge */}
                          {isRoleBlocked ? (
                            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <ShieldOff size={8} /> Vai trò tắt
                            </span>
                          ) : customEntry ? (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                              isGranted ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-500'
                            }`}>
                              {isGranted ? <ShieldCheck size={8} /> : <ShieldOff size={8} />}
                              {isGranted ? 'Cấp riêng' : 'Thu hồi'}
                            </span>
                          ) : (
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                              colors.badge
                            }`}>
                              Theo nhóm
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500"></span> Được phép</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-300"></span> Thu hồi (cá nhân)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-200"></span> Vai trò không có</span>
          </div>
        </div>
      </Modal>

      {/* Modal đặt lại mật khẩu */}
      <Modal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title={t('admin.roles.resetPasswordModal.title')}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setResetTarget(null)} disabled={isSubmitting}>{t('admin.roles.resetPasswordModal.cancel')}</Button>
            <Button onClick={handleSubmit(submitResetPassword)} disabled={isSubmitting}>
              {isSubmitting ? t('admin.roles.resetPasswordModal.saving') : t('admin.roles.resetPasswordModal.submit')}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit(submitResetPassword)} className="space-y-4">
          <p className="text-sm text-slate-600">
            {t('admin.roles.resetPasswordModal.description')} <span className="font-bold text-slate-900">{resetTarget?.FullName}</span>.
          </p>
          <div>
            <label className="block text-sm font-semibold text-slate-700 font-bold dark:text-slate-200 mb-1.5">{t('admin.roles.resetPasswordModal.newPasswordLabel')}</label>
            <input type="password" {...register('NewPassword', {
              required: t('admin.roles.resetPasswordModal.newPasswordRequired'),
              minLength: { value: 6, message: t('admin.roles.resetPasswordModal.newPasswordMinLength') }
            })}
            className="w-full rounded-3xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            {errors.NewPassword && <p className="text-xs text-red-500 mt-1">{errors.NewPassword.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 font-bold dark:text-slate-200 mb-1.5">{t('admin.roles.resetPasswordModal.confirmPasswordLabel')}</label>
            <input type="password" {...register('ConfirmPassword', {
              required: t('admin.roles.resetPasswordModal.confirmPasswordRequired'),
              validate: (val, formVals) => val === formVals.NewPassword || t('admin.roles.resetPasswordModal.confirmPasswordMismatch')
            })}
            className="w-full rounded-3xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            {errors.ConfirmPassword && <p className="text-xs text-red-500 mt-1">{errors.ConfirmPassword.message}</p>}
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminRoles