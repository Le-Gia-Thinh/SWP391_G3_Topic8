/**
 * FILE: StaffDashboardScreen.jsx
 * MÔ TẢ: Trang Tổng quan (Dashboard) dành cho Staff.
 * Hiển thị tóm tắt vận hành (số chỗ trống, xe trong bãi, lượt xe hôm nay) và thao tác nhanh.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Car, Grid, LogOut, CreditCard, Clock, ChevronRight,
  Search, AlertTriangle, Map, ArrowRightLeft, RefreshCcw, Loader2, ShieldCheck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import staffApi from '../../apis/staffApi'

// ── Sub-components ────────────────────────────────────────────
const StatCard = ({ title, value, icon, colorClass, borderColorClass, loading }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-slate-900/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl ${colorClass}`} />
    
    <div className="flex justify-between items-start mb-5 relative z-10">
      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{title}</span>
      <div className={`p-2.5 rounded-3xl ${colorClass} border ${borderColorClass} border-opacity-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]`}>{icon}</div>
    </div>
    {loading
      ? <div className="h-9 w-20 bg-slate-100 dark:bg-slate-700 animate-pulse rounded-xl relative z-10" />
      : <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight relative z-10">{value ?? '—'}</span>
    }
  </div>
)

const QuickActionCard = ({ title, desc, icon, iconColorClass, onClick }) => (
  <button onClick={onClick} className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-[0_8px_30px_rgb(37,99,235,0.08)] dark:hover:shadow-[0_8px_30px_rgba(37,99,235,0.15)] transition-all rounded-2xl p-5 flex items-center gap-4 text-left group">
    <div className={`p-3.5 rounded-3xl ${iconColorClass} shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:scale-110 transition-transform`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{title}</h4>
      <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">{desc}</p>
    </div>
    <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
  </button>
)

const AlertItem = ({ title, time, type }) => {
  const isError = type === 'error' || type === 'High'
  return (
    <div className={`p-4 rounded-3xl border ${isError ? 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'} flex gap-3 mb-3 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all`}>
      <AlertTriangle size={18} className={`mt-0.5 shrink-0 ${isError ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`} />
      <div className="min-w-0">
        <h5 className={`text-sm font-bold truncate ${isError ? 'text-red-800 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>{title}</h5>
        <p className={`text-xs mt-1.5 flex items-center gap-1.5 font-medium ${isError ? 'text-red-600/80 dark:text-red-400/80' : 'text-slate-500 dark:text-slate-400'}`}>
          <Clock size={12} /> {time}
        </p>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function StaffDashboardScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ stats: {}, recentCheckIns: [], alerts: [] })
  const [quickSearch, setQuickSearch] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await staffApi.getDashboard()
        if (!cancelled && res.success) setData(res.data)
      } catch {
        if (!cancelled) toast.error(t('staff.dashboard.error') /* TRANSLATED: Không thể tải dữ liệu dashboard */)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [refreshTrigger])

  const handleRefresh = () => setRefreshTrigger(t => t + 1)

  const { stats, recentCheckIns, alerts } = data

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">

          {/* Stats */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2.5 tracking-tight">
                <Grid size={22} className="text-blue-500" /> {t('staff.dashboard.summary.title')}
              </h3>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/60 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 rounded-3xl hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
              >
                <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> {t('staff.dashboard.summary.refresh')}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5">
              <StatCard loading={loading} title={t('staff.dashboard.stats.occupied')} value={stats.occupiedSlots} icon={<Car size={20} className="text-blue-600" />} colorClass="bg-blue-50 dark:bg-blue-900/30" borderColorClass="border-blue-200 dark:border-blue-800" />
              <StatCard loading={loading} title={t('staff.dashboard.stats.available')} value={stats.availableSlots} icon={<Grid size={20} className="text-emerald-600" />} colorClass="bg-emerald-50 dark:bg-emerald-900/30" borderColorClass="border-emerald-200 dark:border-emerald-800" />
              <StatCard loading={loading} title={t('staff.dashboard.stats.todayCheckin')} value={stats.todayCheckIns} icon={<ArrowRightLeft size={20} className="text-purple-600" />} colorClass="bg-purple-50 dark:bg-purple-900/30" borderColorClass="border-purple-200 dark:border-purple-800" />
              <StatCard loading={loading} title={t('staff.dashboard.stats.todayCheckout')} value={stats.todayCheckOuts} icon={<LogOut size={20} className="text-orange-600" />} colorClass="bg-orange-50 dark:bg-orange-900/30" borderColorClass="border-orange-200 dark:border-orange-800" />
              <StatCard loading={loading} title={t('staff.dashboard.stats.openIncidents')} value={stats.openIncidents} icon={<AlertTriangle size={20} className="text-red-600" />} colorClass="bg-red-50 dark:bg-red-900/30" borderColorClass="border-red-200 dark:border-red-800" />
              <StatCard loading={loading} title={t('staff.dashboard.stats.pendingBookings')} value={stats.pendingBookings} icon={<Clock size={20} className="text-indigo-600" />} colorClass="bg-indigo-50 dark:bg-indigo-900/30" borderColorClass="border-indigo-200 dark:border-indigo-800" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-6 flex items-center gap-2.5 tracking-tight">
              <ArrowRightLeft size={22} className="text-blue-500" /> {t('staff.dashboard.quickActions.title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <QuickActionCard title={t('staff.layout.mainMenu.checkinWalkin')} desc={t('staff.dashboard.quickActions.walkinDesc')} icon={<Car size={24} className="text-blue-600 dark:text-blue-400" />} iconColorClass="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800" onClick={() => navigate('/staff/checkin')} />
              <QuickActionCard title={t('staff.layout.mainMenu.checkinBooking')} desc={t('staff.dashboard.quickActions.bookingDesc')} icon={<Clock size={24} className="text-purple-600 dark:text-purple-400" />} iconColorClass="bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800" onClick={() => navigate('/staff/checkin?tab=booking')} />
              <QuickActionCard title={t('staff.layout.mainMenu.checkout')} desc={t('staff.dashboard.quickActions.checkoutDesc')} icon={<LogOut size={24} className="text-orange-600 dark:text-orange-400" />} iconColorClass="bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800" onClick={() => navigate('/staff/checkout')} />
            </div>
          </div>

          {/* Recent Check-ins */}
          <div className="mt-8">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-6 flex items-center gap-2.5 tracking-tight">
              <Clock size={22} className="text-blue-500" /> {t('staff.dashboard.recentCheckins.title')}
            </h3>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                </div>
              ) : recentCheckIns.length === 0 ? (
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500 text-center py-12">{t('staff.dashboard.recentCheckins.empty')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-widest border-b border-slate-100 dark:border-slate-700/50">
                      <tr>
                        <th className="py-4 px-6">{t('staff.dashboard.recentCheckins.headers.sessionId')}</th>
                        <th className="py-4 px-6">{t('staff.dashboard.recentCheckins.headers.plate')}</th>
                        <th className="py-4 px-6">{t('staff.dashboard.recentCheckins.headers.vehicle')}</th>
                        <th className="py-4 px-6">{t('staff.dashboard.recentCheckins.headers.time')}</th>
                        <th className="py-4 px-6">{t('staff.dashboard.recentCheckins.headers.slot')}</th>
                        <th className="py-4 px-6">{t('staff.dashboard.recentCheckins.headers.zone')}</th>
                        <th className="py-4 px-6">{t('staff.dashboard.recentCheckins.headers.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {recentCheckIns.map((item) => (
                        <tr key={item.SessionID} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group" onClick={() => navigate(`/staff/search-session?keyword=${item.PlateNumber}`)}>
                          <td className="py-4 px-6 font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700">{item.SessionCode}</td>
                          <td className="py-4 px-6 font-black text-slate-800 dark:text-white">{item.PlateNumber}</td>
                          <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300">{item.VehicleName}</td>
                          <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300">{item.EntryTime ? new Date(item.EntryTime).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}</td>
                          <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">{item.SlotCode}</td>
                          <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300">{item.ZoneName} · {item.FloorName}</td>
                          <td className="py-4 px-6"><span className="px-3 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">{item.SessionStatus}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[340px] flex flex-col gap-6 shrink-0">
          {/* Alerts */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[17px] font-extrabold text-slate-800 dark:text-white flex items-center gap-2.5 tracking-tight">
                <AlertTriangle size={20} className="text-red-500" /> {t('staff.dashboard.alerts.title')}
              </h3>
              {alerts.length > 0 && <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">{alerts.length} {t('staff.dashboard.alerts.new')}</span>}
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700 animate-pulse rounded-3xl" />)}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 opacity-60">
                <ShieldCheck size={32} className="text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-500">{t('staff.dashboard.alerts.empty')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map(alert => (
                  <AlertItem key={alert.IncidentID} title={`${alert.IncidentType} · ${alert.Description?.slice(0, 40) || ''}`} time={new Date(alert.CreatedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} type={alert.Priority} />
                ))}
              </div>
            )}
            <button onClick={() => navigate('/staff/incidents')} className="w-full mt-5 py-2.5 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-3xl transition-colors flex items-center justify-center gap-2 group border border-transparent hover:border-blue-100 dark:hover:border-blue-800">
              {t('staff.dashboard.alerts.viewAll')} <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Quick Search */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100/60 dark:border-blue-800/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 mix-blend-overlay">
              <Search size={120} className="text-blue-500 transform translate-x-4 -translate-y-4" />
            </div>
            <h3 className="text-sm font-black text-blue-800 dark:text-blue-400 mb-4 flex items-center gap-2.5 uppercase tracking-widest relative z-10"><Search size={18} /> {t('staff.dashboard.quickSearch.title')}</h3>
            <div className="relative z-10">
              <input
                type="text"
                value={quickSearch}
                onChange={e => setQuickSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') navigate(`/staff/search-session?keyword=${encodeURIComponent(quickSearch.trim())}`) }}
                placeholder={t('staff.dashboard.quickSearch.placeholder')}
                className="w-full py-3 pl-5 pr-12 rounded-3xl border border-blue-200/60 dark:border-blue-800/60 bg-white dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 text-sm font-bold shadow-inner transition-all text-slate-800 dark:text-white"
              />
              <button 
                onClick={() => { if(quickSearch) navigate(`/staff/search-session?keyword=${encodeURIComponent(quickSearch.trim())}`) }}
                className="absolute right-2 top-2 p-1.5 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-xl transition-colors"
              >
                <ArrowRightLeft size={16} />
              </button>
            </div>
            <p className="text-[11px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider mt-3 relative z-10 flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white/50 dark:bg-slate-800 rounded border border-blue-200 dark:border-blue-700">Enter</kbd> {t('staff.dashboard.quickSearch.hint')}
            </p>
          </div>

          {/* Today Revenue */}
          {!loading && stats && (
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg border border-emerald-400/30 p-6 text-white relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 bg-white/10 rounded-full w-32 h-32 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <h3 className="text-[13px] font-bold text-emerald-100 mb-2 flex items-center gap-2 uppercase tracking-widest relative z-10"><CreditCard size={18} className="text-emerald-200" /> {t('staff.dashboard.revenue.title')}</h3>
              <p className="text-3xl font-black relative z-10 tracking-tight">{Number(stats.todayRevenue || 0).toLocaleString('vi-VN')}₫</p>
              <p className="text-xs font-semibold text-emerald-100/80 mt-2 relative z-10">{t('staff.dashboard.revenue.desc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}