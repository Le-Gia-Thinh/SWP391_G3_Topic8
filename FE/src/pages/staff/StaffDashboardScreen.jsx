import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Car, Grid, LogOut, CreditCard, Clock, ChevronRight,
  Search, AlertTriangle, Map, ArrowRightLeft, RefreshCcw, Loader2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import staffApi from '../../apis/staffApi'

// ── Sub-components ────────────────────────────────────────────
const StatCard = ({ title, value, icon, colorClass, borderColorClass, loading }) => (
  <div className={`bg-white rounded-xl p-5 border-l-4 ${borderColorClass} shadow-sm flex flex-col justify-between`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-sm font-medium text-gray-500">{title}</span>
      <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
    </div>
    {loading
      ? <div className="h-8 w-16 bg-gray-100 animate-pulse rounded" />
      : <span className="text-2xl font-bold text-gray-800">{value ?? '—'}</span>
    }
  </div>
)

const QuickActionCard = ({ title, desc, icon, iconColorClass, onClick }) => (
  <button onClick={onClick} className="bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all rounded-xl p-4 flex items-center gap-4 text-left group">
    <div className={`p-3 rounded-xl ${iconColorClass} group-hover:scale-110 transition-transform`}>{icon}</div>
    <div className="flex-1">
      <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{title}</h4>
      <p className="text-xs text-gray-500 line-clamp-1">{desc}</p>
    </div>
    <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
  </button>
)

const AlertItem = ({ title, time, type }) => {
  const isError = type === 'error' || type === 'High'
  return (
    <div className={`p-4 rounded-xl border ${isError ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'} flex gap-3 mb-3`}>
      <AlertTriangle size={16} className={`mt-0.5 ${isError ? 'text-red-500' : 'text-gray-500'}`} />
      <div>
        <h5 className={`text-sm font-semibold ${isError ? 'text-red-800' : 'text-gray-700'}`}>{title}</h5>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Grid size={20} className="text-blue-500" /> {t('staff.dashboard.summary.title')} {/* TRANSLATED: Tóm tắt vận hành */}
              </h3>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> {t('staff.dashboard.summary.refresh')} {/* TRANSLATED: Làm mới */}
              </button>
            </div>
            <div className="grid grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard loading={loading} title={t('staff.dashboard.stats.occupied') /* TRANSLATED: Xe trong bãi */} value={stats.occupiedSlots} icon={<Car size={18} className="text-blue-600" />} colorClass="bg-blue-50" borderColorClass="border-blue-500" />
              <StatCard loading={loading} title={t('staff.dashboard.stats.available') /* TRANSLATED: Chỗ trống */} value={stats.availableSlots} icon={<Grid size={18} className="text-green-600" />} colorClass="bg-green-50" borderColorClass="border-green-500" />
              <StatCard loading={loading} title={t('staff.dashboard.stats.todayCheckin') /* TRANSLATED: Check-in hôm nay */} value={stats.todayCheckIns} icon={<ArrowRightLeft size={18} className="text-purple-600" />} colorClass="bg-purple-50" borderColorClass="border-purple-500" />
              <StatCard loading={loading} title={t('staff.dashboard.stats.todayCheckout') /* TRANSLATED: Check-out hôm nay */} value={stats.todayCheckOuts} icon={<LogOut size={18} className="text-orange-600" />} colorClass="bg-orange-50" borderColorClass="border-orange-500" />
              <StatCard loading={loading} title={t('staff.dashboard.stats.openIncidents') /* TRANSLATED: Sự cố đang mở */} value={stats.openIncidents} icon={<AlertTriangle size={18} className="text-red-600" />} colorClass="bg-red-50" borderColorClass="border-red-500" />
              <StatCard loading={loading} title={t('staff.dashboard.stats.pendingBookings') /* TRANSLATED: Lượt đặt trước */} value={stats.pendingBookings} icon={<Clock size={18} className="text-indigo-600" />} colorClass="bg-indigo-50" borderColorClass="border-indigo-500" />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ArrowRightLeft size={20} className="text-blue-500" /> {t('staff.dashboard.quickActions.title')} {/* TRANSLATED: Thao tác nhanh */}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <QuickActionCard title={t('staff.layout.mainMenu.checkinWalkin')} desc={t('staff.dashboard.quickActions.walkinDesc')} /* TRANSLATED: Nhận xe vãng lai */ icon={<Car size={20} className="text-blue-600" />} iconColorClass="bg-blue-50" onClick={() => navigate('/staff/checkin')} />
              <QuickActionCard title={t('staff.layout.mainMenu.checkinBooking')} desc={t('staff.dashboard.quickActions.bookingDesc')} /* TRANSLATED: Nhận xe đặt trước */ icon={<Clock size={20} className="text-purple-600" />} iconColorClass="bg-purple-50" onClick={() => navigate('/staff/checkin?tab=booking')} />
              <QuickActionCard title={t('staff.layout.mainMenu.checkout')} desc={t('staff.dashboard.quickActions.checkoutDesc')} /* TRANSLATED: Thanh toán & Trả xe */ icon={<LogOut size={20} className="text-orange-600" />} iconColorClass="bg-orange-50" onClick={() => navigate('/staff/checkout')} />
            </div>
          </div>

          {/* Recent Check-ins */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-blue-500" /> {t('staff.dashboard.recentCheckins.title', 'Lượt check-in gần đây')}
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-blue-500" size={28} />
                </div>
              ) : recentCheckIns.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">{t('staff.dashboard.recentCheckins.empty', 'Chưa có lượt check-in nào')}</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="py-3 px-5">{t('staff.dashboard.recentCheckins.headers.session', 'Mã phiên')}</th>
                      <th className="py-3 px-5">{t('staff.dashboard.recentCheckins.headers.plate', 'Biển số')}</th>
                      <th className="py-3 px-5">{t('staff.dashboard.recentCheckins.headers.vehicle')} {/* TRANSLATED: Loại xe */}</th>
                      <th className="py-3 px-5">{t('staff.dashboard.recentCheckins.headers.time')} {/* TRANSLATED: Thời gian vào */}</th>
                      <th className="py-3 px-5">{t('staff.dashboard.recentCheckins.headers.slot')} {/* TRANSLATED: Ô đỗ */}</th>
                      <th className="py-3 px-5">{t('staff.dashboard.recentCheckins.headers.zone')} {/* TRANSLATED: Khu vực */}</th>
                      <th className="py-3 px-5">{t('staff.dashboard.recentCheckins.headers.status')} {/* TRANSLATED: Trạng thái */}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentCheckIns.map((item) => (
                      <tr key={item.SessionID} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/staff/search-session?keyword=${item.PlateNumber}`)}>
                        <td className="py-3 px-5 font-medium text-blue-600">{item.SessionCode}</td>
                        <td className="py-3 px-5 font-bold text-gray-800">{item.PlateNumber}</td>
                        <td className="py-3 px-5 text-gray-600">{item.VehicleName}</td>
                        <td className="py-3 px-5 text-gray-600">{item.EntryTime ? new Date(item.EntryTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}</td>
                        <td className="py-3 px-5 font-medium text-gray-800">{item.SlotCode}</td>
                        <td className="py-3 px-5 text-gray-600">{item.ZoneName} · {item.FloorName}</td>
                        <td className="py-3 px-5"><span className="px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">{item.SessionStatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex flex-col gap-4">
          {/* Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" /> {t('staff.dashboard.alerts.title')}
              </h3>
              {alerts.length > 0 && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-md">{alerts.length} {t('staff.dashboard.alerts.new')} {/* TRANSLATED: Mới */}</span>}
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}
              </div>
            ) : alerts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">{t('staff.dashboard.alerts.empty')} {/* TRANSLATED: Không có cảnh báo nào */}</p>
            ) : (
              <div className="space-y-1">
                {alerts.map(alert => (
                  <AlertItem key={alert.IncidentID} title={`${alert.IncidentType} · ${alert.Description?.slice(0, 40) || ''}`} time={new Date(alert.CreatedAt).toLocaleString('vi-VN')} type={alert.Priority} />
                ))}
              </div>
            )}
            <button onClick={() => navigate('/staff/incidents')} className="w-full mt-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2">
              {t('staff.dashboard.alerts.viewAll')} {/* TRANSLATED: XEM TẤT CẢ */} <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Search */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2 uppercase"><Search size={16} /> {t('staff.dashboard.quickSearch.title')} {/* TRANSLATED: Tra cứu nhanh biển số */}</h3>
            <div className="relative">
              <input
                type="text"
                value={quickSearch}
                onChange={e => setQuickSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') navigate(`/staff/search-session?keyword=${encodeURIComponent(quickSearch.trim())}`) }}
                placeholder={t('staff.dashboard.quickSearch.placeholder')} /* TRANSLATED: Nhập biển số xe, Enter để tìm... */
                className="w-full py-2.5 pl-4 pr-10 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
              <Search size={18} className="absolute right-3 top-2.5 text-blue-400" />
            </div>
            <p className="text-xs text-blue-600 mt-2">{t('staff.dashboard.quickSearch.hint')} {/* TRANSLATED: Nhấn Enter để tìm kiếm */}</p>
          </div>

          {/* Today Revenue */}
          {!loading && stats && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><CreditCard size={16} className="text-green-600" /> {t('staff.dashboard.revenue.title')} {/* TRANSLATED: Doanh thu hôm nay */}</h3>
              <p className="text-2xl font-black text-green-600">{Number(stats.todayRevenue || 0).toLocaleString('vi-VN')}₫</p>
              <p className="text-xs text-gray-400 mt-1">{t('staff.dashboard.revenue.desc')} {/* TRANSLATED: Đã thanh toán hoàn tất */}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}