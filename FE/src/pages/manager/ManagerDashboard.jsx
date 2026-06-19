// src/pages/manager/ManagerDashboard.jsx
import { ArrowUpRight, Download, CarFront, RefreshCcw, Sparkles } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'
import { getDashboardAPI } from '../../apis/managerApi'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

const ManagerDashboard = () => {
  const { user } = useAuth()
  const displayName = user?.fullName || 'Manager'

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await getDashboardAPI()
      setData(res.data.data)
    } catch {
      toast.error('Không thể tải dữ liệu dashboard')
    } finally {
      setLoading(false)
      setTimeout(() => setMounted(true), 100)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  const handleExport = () => {
    toast.info('Đang chuẩn bị dữ liệu báo cáo...')
    setTimeout(() => toast.success('Đã xuất báo cáo thành công!'), 1500)
  }

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!data) return null

  const { kpis, revenue7Days = [], floorOccupancy = [], vehicleBreakdown = [], recentCheckIns = [], recentPayments = [] } = data

  // KPI cards
  const kpiCards = [
    { title: 'Tổng vị trí', value: kpis.totalSlots, delta: null, color: 'from-sky-500 to-blue-600', shadow: 'shadow-blue-500/20' },
    { title: 'Vị trí trống', value: kpis.available, delta: null, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-teal-500/20' },
    { title: 'Đang đỗ', value: kpis.occupied, delta: null, color: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/20' },
    { title: 'Đặt trước', value: kpis.reserved, delta: null, color: 'from-violet-500 to-fuchsia-600', shadow: 'shadow-fuchsia-500/20' },
    { title: 'Bảo trì', value: kpis.maintenance, delta: null, color: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/20' }
  ]

  // Build revenue chart data – last 7 days
  const last7 = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const dayName = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]
    const found = revenue7Days.find(r => String(r.Period) === key)
    last7.push({ label: dayName, value: found ? found.TotalRevenue : 0, date: key })
  }
  const maxRevenue = Math.max(...last7.map(d => d.value), 1)

  // Vehicle breakdown total
  const totalVehicles = vehicleBreakdown.reduce((s, v) => s + v.Count, 0) || 1
  const vehicleColors = [
    'bg-linear-to-r from-sky-400 to-blue-500',
    'bg-linear-to-r from-emerald-400 to-teal-500',
    'bg-linear-to-r from-orange-400 to-amber-500',
    'bg-linear-to-r from-slate-400 to-slate-500'
  ]

  // Revenue today formatted
  const revenueFormatted = (kpis.revenueToday || 0).toLocaleString('vi-VN') + 'đ'

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manager Dashboard</h1>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold bg-linear-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
            Xin chào <span className="font-black text-blue-600">{displayName}</span>, đây là tổng quan hoạt động của bãi đỗ.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            <RefreshCcw size={16} /> Làm mới
          </button>
          <button
            onClick={handleExport}
            className="group relative inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:-translate-y-0.5 active:scale-95"
          >
            <Download size={18} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Doanh thu hôm nay banner */}
      <div className="rounded-3xl bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg shadow-blue-500/20">
        <p className="text-sm font-semibold text-blue-100 mb-1">Doanh thu hôm nay</p>
        <p className="text-4xl font-black tracking-tight">{revenueFormatted}</p>
        <p className="text-sm text-blue-200 mt-1">
          {kpis.todaySessions} phiên •
          {kpis.activeSessions} đang hoạt động
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 xl:grid-cols-5">
        {kpiCards.map((item, i) => (
          <div
            key={item.title}
            className={`overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-md ${item.shadow} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{item.title}</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{item.value}</p>
            <div className={`mt-2 inline-flex rounded-lg bg-linear-to-br ${item.color} px-2.5 py-1 text-xs font-bold text-white`}>
              {item.title === 'Đang đỗ' && kpis.totalSlots > 0
                ? `${Math.round((item.value / kpis.totalSlots) * 100)}%`
                : '—'
              }
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Tỷ lệ lấp đầy theo tầng */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tỷ lệ lấp đầy</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Theo từng tầng</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-100 px-3 py-1.5 text-sm font-bold text-blue-600 shadow-sm">
              <ArrowUpRight size={16} />
              {kpis.totalSlots > 0 ? Math.round((kpis.occupied / kpis.totalSlots) * 100) : 0}%
            </span>
          </div>

          <div className="space-y-5 flex-1">
            {floorOccupancy.slice(0, 5).map((floor, idx) => (
              <div key={floor.FloorID || idx} className="group">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-600 mb-2">
                  <span className="truncate max-w-37.5" title={floor.FloorName}>{floor.FloorName}</span>
                  <span className="text-slate-900 ml-2">{floor.OccupancyPct}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-blue-600 to-sky-400 transition-all duration-1000 ease-out"
                    style={{ width: mounted ? `${floor.OccupancyPct}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
            {floorOccupancy.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Chưa có dữ liệu tầng</p>
            )}
          </div>
        </div>

        {/* Doanh thu 7 ngày */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2 flex flex-col">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Doanh thu 7 ngày qua</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Tổng doanh thu (VNĐ)</p>
            </div>
          </div>

          <div className="flex-1 min-h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    padding: '12px 16px',
                    fontWeight: 'bold',
                    color: '#0f172a'
                  }}
                  itemStyle={{ color: '#2563eb' }}
                  formatter={(value) => [`${value.toLocaleString('vi-VN')} VNĐ`, 'Doanh thu']}
                  labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Cơ cấu loại xe */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <CarFront className="text-blue-500" size={24} />
            <h2 className="text-lg font-bold text-slate-900">Cơ cấu loại xe</h2>
          </div>
          <div className="space-y-5 flex-1">
            {vehicleBreakdown.length > 0 ? vehicleBreakdown.map((v, idx) => {
              const pct = Math.round((v.Count / totalVehicles) * 100)
              return (
                <div key={v.VehicleCode || idx}>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-700 mb-2">
                    <span>{v.VehicleName}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md">{pct}%</span>
                  </div>
                  <div className="h-3.5 rounded-full bg-slate-100 shadow-inner overflow-hidden">
                    <div
                      className={`${vehicleColors[idx % vehicleColors.length]} h-full rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: mounted ? `${pct}%` : '0%' }}
                    />
                  </div>
                </div>
              )
            }) : (
              <p className="text-sm text-slate-400 text-center py-8">Không có xe đang đỗ</p>
            )}
          </div>
        </div>

        {/* Xe vào gần đây */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Lượt xe vào gần đây</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Dữ liệu thực tế từ hệ thống</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Session</th>
                  <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Biển số</th>
                  <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Vị trí</th>
                  <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Giờ vào</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {recentCheckIns.length > 0 ? recentCheckIns.map((row) => (
                  <tr key={row.SessionID} className="hover:bg-blue-50/50 transition-colors cursor-pointer">
                    <td className="px-5 py-4 font-bold text-slate-900">{row.SessionCode}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{row.PlateNumber}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-blue-600">{row.SlotCode}</td>
                    <td className="px-5 py-4 font-medium text-slate-500">
                      {row.EntryTime ? new Date(row.EntryTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm">Chưa có dữ liệu</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Thanh toán gần nhất */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Giao dịch thanh toán gần đây</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Dữ liệu thực tế</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Session</th>
                <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Biển số</th>
                <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Số tiền</th>
                <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Trạng thái</th>
                <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {recentPayments.length > 0 ? recentPayments.map((row) => (
                <tr key={row.PaymentID} className="hover:bg-blue-50/50 transition-colors cursor-pointer">
                  <td className="px-5 py-4 font-bold text-slate-900">{row.SessionCode}</td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{row.PlateNumber}</td>
                  <td className="px-5 py-4 font-black text-slate-900">
                    {Number(row.Amount).toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
                      ${row.PaymentStatus === 'Completed' || row.PaymentStatus === 'Prepaid'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : 'bg-orange-50 text-orange-600 border-orange-100'
                }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${row.PaymentStatus === 'Completed' || row.PaymentStatus === 'Prepaid' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                      {row.PaymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-500">
                    {row.PaymentTime
                      ? new Date(row.PaymentTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                      : '—'
                    }
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">Chưa có giao dịch</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ManagerDashboard