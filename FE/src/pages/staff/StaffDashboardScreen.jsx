import React, { useEffect, useState, useCallback } from 'react'
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
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ stats: {}, recentCheckIns: [], alerts: [] })
  const [quickSearch, setQuickSearch] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await staffApi.getDashboard()
      if (res.success) setData(res.data)
    } catch {
      toast.error('Không thể tải dữ liệu dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const handleQuickSearch = e => {
    if (e.key === 'Enter' && quickSearch.trim()) {
      navigate(`/staff/search-session?keyword=${encodeURIComponent(quickSearch.trim())}`)
    }
  }

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
                <Grid size={20} className="text-blue-500" /> Tóm tắt vận hành
              </h3>
              <button onClick={loadDashboard} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
              </button>
            </div>
            <div className="grid grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard loading={loading} title="Xe trong bãi" value={stats.occupiedSlots} icon={<Car size={18} className="text-blue-600" />} colorClass="bg-blue-50" borderColorClass="border-blue-500" />
              <StatCard loading={loading} title="Chỗ trống" value={stats.availableSlots} icon={<Grid size={18} className="text-green-600" />} colorClass="bg-green-50" borderColorClass="border-green-500" />
              <StatCard loading={loading} title="Check-in hôm nay" value={stats.todayCheckIns} icon={<ArrowRightLeft size={18} className="text-purple-600" />} colorClass="bg-purple-50" borderColorClass="border-purple-500" />
              <StatCard loading={loading} title="Check-out hôm nay" value={stats.todayCheckOuts} icon={<LogOut size={18} className="text-orange-600" />} colorClass="bg-orange-50" borderColorClass="border-orange-500" />
              <StatCard loading={loading} title="Sự cố đang mở" value={stats.openIncidents} icon={<AlertTriangle size={18} className="text-red-600" />} colorClass="bg-red-50" borderColorClass="border-red-500" />
              <StatCard loading={loading} title="Lượt đặt trước" value={stats.pendingBookings} icon={<Clock size={18} className="text-indigo-600" />} colorClass="bg-indigo-50" borderColorClass="border-indigo-500" />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ArrowRightLeft size={20} className="text-blue-500" /> Thao tác nhanh
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <QuickActionCard title="Nhận xe vãng lai" desc="Nhập biển số cho xe không có đặt trước" icon={<Car size={20} className="text-blue-600" />} iconColorClass="bg-blue-50" onClick={() => navigate('/staff/checkin')} />
              <QuickActionCard title="Nhận xe đặt trước" desc="Quét mã hoặc nhập mã đặt chỗ" icon={<Clock size={20} className="text-purple-600" />} iconColorClass="bg-purple-50" onClick={() => navigate('/staff/checkin?tab=booking')} />
              <QuickActionCard title="Thanh toán & Trả xe" desc="Tính tiền và xác nhận xe ra" icon={<LogOut size={20} className="text-orange-600" />} iconColorClass="bg-orange-50" onClick={() => navigate('/staff/checkout')} />
              <QuickActionCard title="Tra cứu phiên" desc="Tìm kiếm lịch sử vào/ra theo biển số" icon={<Search size={20} className="text-indigo-600" />} iconColorClass="bg-indigo-50" onClick={() => navigate('/staff/search-session')} />
              <QuickActionCard title="Tạo sự cố" desc="Báo cáo mất thẻ, hỏng thiết bị, va chạm" icon={<AlertTriangle size={20} className="text-red-600" />} iconColorClass="bg-red-50" onClick={() => navigate('/staff/create-incident')} />
              <QuickActionCard title="Xem sơ đồ chỗ" desc="Kiểm tra chi tiết vị trí các ô đỗ" icon={<Map size={20} className="text-green-600" />} iconColorClass="bg-green-50" onClick={() => navigate('/staff/parking-map')} />
            </div>
          </div>

          {/* Recent Check-ins Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Lượt vào gần đây</h3>
                <p className="text-xs text-gray-500">8 phiên nhận xe mới nhất</p>
              </div>
              <button onClick={() => navigate('/staff/search-session')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Xem tất cả
              </button>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center p-12 gap-3 text-gray-400">
                  <Loader2 className="animate-spin" size={20} /> Đang tải...
                </div>
              ) : recentCheckIns.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">Chưa có phiên nào hôm nay</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 text-gray-500 font-medium">
                    <tr>
                      <th className="py-3 px-5">ID Phiên</th>
                      <th className="py-3 px-5">Biển số</th>
                      <th className="py-3 px-5">Loại xe</th>
                      <th className="py-3 px-5">Thời gian vào</th>
                      <th className="py-3 px-5">Ô đỗ</th>
                      <th className="py-3 px-5">Khu vực</th>
                      <th className="py-3 px-5">Trạng thái</th>
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
                <AlertTriangle size={18} className="text-red-500" /> Thông báo & Cảnh báo
              </h3>
              {alerts.length > 0 && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-md">{alerts.length} Mới</span>}
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}
              </div>
            ) : alerts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Không có cảnh báo nào</p>
            ) : (
              <div className="space-y-1">
                {alerts.map(alert => (
                  <AlertItem key={alert.IncidentID} title={`${alert.IncidentType} · ${alert.Description?.slice(0, 40) || ''}`} time={new Date(alert.CreatedAt).toLocaleString('vi-VN')} type={alert.Priority} />
                ))}
              </div>
            )}
            <button onClick={() => navigate('/staff/incidents')} className="w-full mt-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2">
              XEM TẤT CẢ <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Search */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2 uppercase"><Search size={16} /> Tra cứu nhanh biển số</h3>
            <div className="relative">
              <input type="text" value={quickSearch} onChange={(e) => setQuickSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/staff/search-session?keyword=${encodeURIComponent(quickSearch.trim())}`) }} placeholder="Nhập biển số xe, Enter để tìm..." className="w-full py-2.5 pl-4 pr-10 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
              <Search size={18} className="absolute right-3 top-2.5 text-blue-400" />
            </div>
            <p className="text-xs text-blue-600 mt-2">Nhấn Enter để tìm kiếm</p>
          </div>

          {/* Today Revenue */}
          {!loading && stats && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><CreditCard size={16} className="text-green-600" /> Doanh thu hôm nay</h3>
              <p className="text-2xl font-black text-green-600">{Number(stats.todayRevenue || 0).toLocaleString('vi-VN')}₫</p>
              <p className="text-xs text-gray-400 mt-1">Đã thanh toán hoàn tất</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}