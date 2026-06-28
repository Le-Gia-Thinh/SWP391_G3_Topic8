/**
 * FILE: AdminDashboard.jsx
 * MÔ TẢ: Trang Bảng điều khiển (Dashboard) chính của Admin.
 * Hiển thị các chỉ số tổng quan (KPIs) về lượng người dùng (Tổng số, Đang hoạt động, Chờ xác thực) và biểu đồ phân bổ vai trò.
 */

// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, UserCheck, UserX, MailCheck, RefreshCcw, ShieldCheck } from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../../contexts/AuthContext'
import { getAdminStatsAPI, USE_MOCK } from '../../apis/adminApi'

const roleStyle = {
  Driver: 'from-sky-500 to-blue-600',
  Staff: 'from-emerald-500 to-teal-600',
  Manager: 'from-violet-500 to-fuchsia-600',
  Admin: 'from-rose-500 to-pink-600'
}

const AdminDashboard = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const displayName = user?.fullName || t('admin.dashboardPage.defaultAdmin')

  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await getAdminStatsAPI()
      setData(res.data.data)
    } catch {
      toast.error(t('admin.dashboardPage.loadFail'))
    } finally {
      setLoading(false)
      setTimeout(() => setMounted(true), 100)
    }
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }
  if (!data) return null

  const { totalUsers = 0, activeUsers = 0, inactiveUsers = 0, verifiedUsers = 0, usersByRole = [] } = data
  const maxRole = Math.max(...usersByRole.map(r => r.Count), 1)

  const kpiCards = [
    { title: t('admin.dashboardPage.kpi.totalUsers'), value: totalUsers, icon: Users, color: 'from-sky-500 to-blue-600', tint: 'text-blue-500' },
    { title: t('admin.dashboardPage.kpi.activeUsers'), value: activeUsers, icon: UserCheck, color: 'from-emerald-500 to-teal-600', tint: 'text-emerald-500' },
    { title: t('admin.dashboardPage.kpi.inactiveUsers'), value: inactiveUsers, icon: UserX, color: 'from-rose-500 to-pink-600', tint: 'text-rose-500' },
    { title: t('admin.dashboardPage.kpi.verifiedUsers'), value: verifiedUsers, icon: MailCheck, color: 'from-violet-500 to-fuchsia-600', tint: 'text-violet-500' }
  ]

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">{t('admin.dashboardPage.eyebrow')}</p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">{t('admin.dashboardPage.title')}</h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            {t('admin.dashboardPage.greetingPre')} <span className="text-blue-600 font-bold">{displayName}</span>{t('admin.dashboardPage.greetingPost')}
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition self-start"
        >
          <RefreshCcw size={16} /> {t('admin.dashboardPage.refresh')}
        </button>
      </div>

      {/* Cảnh báo mock data */}
      {USE_MOCK && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm font-semibold text-amber-700 flex items-center gap-2">
          <ShieldCheck size={18} />
          {t('admin.dashboardPage.mockNotice')}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((item, i) => {
          const Icon = item.icon
          return (
            <div
              key={item.title}
              className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{item.title}</p>
                <Icon size={20} className={item.tint} />
              </div>
              <p className="text-3xl font-black text-slate-800 font-black tracking-tight mt-2">{item.value}</p>
              <div className={`mt-3 h-1.5 w-full rounded-full bg-linear-to-r ${item.color}`} />
            </div>
          )
        })}
      </div>

      {/* Người dùng theo vai trò */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-6">
          <Users className="text-blue-500" size={22} />
          <h2 className="text-lg font-bold text-slate-900">{t('admin.dashboardPage.byRoleTitle')}</h2>
        </div>
        <div className="space-y-5">
          {usersByRole.map((r) => {
            const pct = Math.round((r.Count / maxRole) * 100)
            return (
              <div key={r.RoleID}>
                <div className="flex items-center justify-between text-sm font-bold text-slate-700 font-bold mb-2">
                  <span>{t(`roles.${r.RoleName}`, r.RoleName)}</span>
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">{r.Count}</span>
                </div>
                <div className="h-3.5 rounded-full bg-slate-100 shadow-inner overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-linear-to-r ${roleStyle[r.RoleName] || 'from-slate-400 to-slate-500'} transition-all duration-1000 ease-out`}
                    style={{ width: mounted ? `${Math.max(pct, 2)}%` : '0%' }}
                  />
                </div>
              </div>
            )
          })}
          {usersByRole.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">{t('admin.dashboardPage.noUsers')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard