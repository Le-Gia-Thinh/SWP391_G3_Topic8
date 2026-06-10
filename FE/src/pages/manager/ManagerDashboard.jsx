import { ArrowUpRight, Download, Filter, TrendingUp, CarFront } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'

const ManagerDashboard = () => {
  const { user } = useAuth()
  const displayName = user?.fullName || 'Manager'

  // Animation state
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setTimeout(() => setMounted(true), 100)
  }, [])

  const kpis = [
    { title: 'Tổng vị trí', value: '1500', delta: '+5%', color: 'from-sky-500 to-blue-600', shadow: 'shadow-blue-500/20' },
    { title: 'Vị trí trống', value: '245', delta: '-3%', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-teal-500/20' },
    { title: 'Đã đỗ', value: '1205', delta: '+12%', color: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/20' },
    { title: 'Đặt trước', value: '50', delta: '+8%', color: 'from-violet-500 to-fuchsia-600', shadow: 'shadow-fuchsia-500/20' },
    { title: 'Bảo trì', value: '12', delta: '0%', color: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/20' }
  ]

  const revenueData = [
    { label: 'Thứ 2', value: 45, text: '4.5M' },
    { label: 'Thứ 3', value: 65, text: '6.5M' },
    { label: 'Thứ 4', value: 30, text: '3.0M' },
    { label: 'Thứ 5', value: 85, text: '8.5M' },
    { label: 'Thứ 6', value: 55, text: '5.5M' },
    { label: 'Thứ 7', value: 100, text: '10.0M' },
    { label: 'CN', value: 90, text: '9.0M' }
  ]

  const vehicles = [
    { label: 'Ôtô (4-7 chỗ)', value: 52, color: 'bg-gradient-to-r from-sky-400 to-blue-500' },
    { label: 'Xe máy', value: 30, color: 'bg-gradient-to-r from-emerald-400 to-teal-500' },
    { label: 'Xe tải/Bán tải', value: 12, color: 'bg-gradient-to-r from-orange-400 to-amber-500' },
    { label: 'Khác', value: 6, color: 'bg-gradient-to-r from-slate-400 to-slate-500' }
  ]

  const checkIns = [
    { id: 'SES-4812', plate: '30F-123.45', slot: 'A-12', time: '10:15 AM', type: 'Sedan', staff: 'Nguyễn Văn A' },
    { id: 'SES-4813', plate: '51G-9920', slot: 'B-05', time: '10:22 AM', type: 'SUV', staff: 'Trần Thị B' },
    { id: 'SES-4814', plate: '29A-999.99', slot: 'C-01', time: '10:30 AM', type: 'Van', staff: 'Lê Văn C' },
    { id: 'SES-4815', plate: '43H-112.23', slot: 'M-15', time: '10:45 AM', type: 'Motorbike', staff: 'Nguyễn Văn A' },
    { id: 'SES-4816', plate: '15A-888.66', slot: 'A-45', time: '11:05 AM', type: 'Sedan', staff: 'Trần Thị B' }
  ]

  const payments = [
    { id: 'SES-5790', plate: '30E-445.12', status: 'ĐÃ THANH TOÁN', amount: '50.000đ', staff: 'Trần Thị B' },
    { id: 'SES-5791', plate: '51D-221.33', status: 'ĐÃ THANH TOÁN', amount: '120.000đ', staff: 'Lê Văn C' },
    { id: 'SES-5792', plate: '29H-667.89', status: 'CHƯA THANH TOÁN', amount: '35.000đ', staff: 'Nguyễn Văn A' },
    { id: 'SES-5793', plate: '43A-001.22', status: 'ĐÃ THANH TOÁN', amount: '25.000đ', staff: 'Trần Thị B' },
    { id: 'SES-5794', plate: '30G-778.55', status: 'ĐÃ THANH TOÁN', amount: '150.000đ', staff: 'Nguyễn Văn A' }
  ]

  const handleExport = () => {
    toast.info('Đang chuẩn bị dữ liệu báo cáo...')
    setTimeout(() => {
      toast.success('Đã xuất báo cáo thành công!')
    }, 1500)
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manager Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">Xin chào <span className="text-blue-600 font-bold">{displayName}</span>, đây là tổng quan hoạt động của bãi đỗ hôm nay.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm">
            <Filter size={16} className="text-blue-500" /> Hôm nay, 24/05/2024
          </div>
          <button
            onClick={handleExport}
            className="group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/50 hover:-translate-y-0.5 active:scale-95"
          >
            <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></div>
            <Download size={18} className="group-hover:animate-bounce" /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid gap-4 xl:grid-cols-5">
        {kpis.map((item, i) => (
          <div
            key={item.title}
            className={`overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-md ${item.shadow} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{item.title}</p>
                <p className="text-3xl font-black text-slate-800 tracking-tight">{item.value}</p>
              </div>
              <div className={`rounded-2xl bg-gradient-to-br px-3 py-1.5 text-sm font-bold text-white shadow-inner flex items-center gap-1 ${item.color}`}>
                <TrendingUp size={14} /> {item.delta}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Tỷ lệ lấp đầy */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tỷ lệ lấp đầy</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Trạng thái hiện tại toàn hệ thống</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-100 px-3 py-1.5 text-sm font-bold text-blue-600 shadow-sm">
              <ArrowUpRight size={16} /> 82%
            </span>
          </div>

          <div className="space-y-5 flex-1">
            {[
              { label: 'Tầng hầm B1', val: 95, color: 'bg-gradient-to-r from-blue-600 to-blue-400' },
              { label: 'Tầng hầm B2', val: 78, color: 'bg-gradient-to-r from-sky-500 to-sky-300' },
              { label: 'Tầng hầm B3', val: 62, color: 'bg-gradient-to-r from-emerald-500 to-emerald-300' }
            ].map((floor, idx) => (
              <div key={idx} className="group">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-600 mb-2">
                  <span>{floor.label}</span>
                  <span className="text-slate-900">{floor.val}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full ${floor.color} transition-all duration-1000 ease-out`}
                    style={{ width: mounted ? `${floor.val}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-4">
            <div className="flex-1 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Khách vãng lai</p>
              <p className="text-2xl font-black text-slate-800">88%</p>
            </div>
            <div className="flex-1 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/60 p-4 shadow-sm">
              <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Đã đặt trước</p>
              <p className="text-2xl font-black text-blue-800">12%</p>
            </div>
          </div>
        </div>

        {/* Doanh thu */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2 flex flex-col">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Doanh thu 7 ngày qua</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Tăng trưởng doanh thu bãi đỗ (VNĐ)</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-600 shadow-sm">+12.4% vs Tuần trước</span>
            </div>
          </div>

          <div className="flex-1 min-h-[220px] flex items-end justify-between gap-2 sm:gap-4 mt-auto">
            {revenueData.map((item, i) => (
              <div key={item.label} className="group relative flex h-full w-full flex-col items-center justify-end gap-3">
                {/* Tooltip */}
                <div className="absolute -top-12 z-10 scale-0 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white opacity-0 shadow-xl transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                  {item.text} VNĐ
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>

                {/* Bar */}
                <div className="relative h-[180px] w-full max-w-[48px] rounded-t-xl bg-slate-50 overflow-hidden shadow-inner border border-slate-100">
                  <div
                    className="absolute bottom-0 w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-sky-400 transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:from-blue-700 group-hover:to-sky-500"
                    style={{ height: mounted ? `${item.value}%` : '0%' }}
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Lưu lượng xe */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Lưu lượng xe trong ngày</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Lượt xe vào / ra theo khung giờ</p>
            </div>
            <button
              onClick={() => toast.info('Đang tải dữ liệu chi tiết...')}
              className="rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors px-4 py-2 text-sm font-bold text-slate-700 shadow-sm"
            >
              Vào: 1.240 lượt
            </button>
          </div>

          <div className="relative h-[260px] rounded-[2rem] bg-gradient-to-br from-indigo-500 via-blue-500 to-sky-400 p-6 text-white overflow-hidden shadow-lg shadow-blue-500/20 group">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between px-6 py-8 opacity-20 pointer-events-none">
              <div className="w-full border-t border-white border-dashed"></div>
              <div className="w-full border-t border-white border-dashed"></div>
              <div className="w-full border-t border-white border-dashed"></div>
              <div className="w-full border-t border-white border-dashed"></div>
            </div>

            {/* Simulated Data Bars */}
            <div className="relative z-10 flex h-full items-end justify-between gap-4 pb-6 pt-4">
              {[40, 65, 35, 85, 55, 95, 75, 45].map((val, i) => (
                <div key={i} className="flex h-full w-full flex-col justify-end gap-2 group/bar cursor-crosshair">
                  <div className="relative w-full rounded-t-lg bg-white/20 backdrop-blur-sm shadow-inner transition-all duration-300 group-hover/bar:bg-white/40 group-hover/bar:-translate-y-1">
                    <div
                      className="absolute bottom-0 w-full rounded-t-lg bg-white transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_15px_rgba(255,255,255,0.5)] group-hover/bar:bg-blue-50"
                      style={{ height: mounted ? `${val}%` : '0%' }}
                    ></div>
                    {/* Hover Value */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity font-bold text-sm bg-white text-blue-600 px-2 py-1 rounded shadow-lg">
                      {val * 10}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* X-Axis labels */}
            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs font-bold text-white/80">
              <span>06:00</span>
              <span>09:00</span>
              <span>12:00</span>
              <span>15:00</span>
              <span>18:00</span>
              <span>21:00</span>
              <span>23:00</span>
            </div>
          </div>
        </div>

        {/* Cơ cấu loại xe */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <CarFront className="text-blue-500" size={24} />
            <h2 className="text-lg font-bold text-slate-900">Cơ cấu loại xe</h2>
          </div>
          <div className="space-y-6 flex-1 justify-center flex flex-col">
            {vehicles.map((item, idx) => (
              <div key={item.label} className="group">
                <div className="flex items-center justify-between text-sm font-bold text-slate-700 mb-2">
                  <span>{item.label}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-800">{item.value}%</span>
                </div>
                <div className="h-3.5 rounded-full bg-slate-100 shadow-inner overflow-hidden">
                  <div
                    className={`${item.color} h-full rounded-full transition-all duration-1000 ease-out shadow-sm`}
                    style={{ width: mounted ? `${item.value}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Xe vào gần đây */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Lượt xe vào gần đây</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Dữ liệu cập nhật realtime</p>
            </div>
            <button
              onClick={() => toast.info('Chuyển hướng đến danh sách đầy đủ...')}
              className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
            >
              Xem tất cả
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Session ID</th>
                  <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Biển số</th>
                  <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Vị trí</th>
                  <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Giờ vào</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {checkIns.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer">
                    <td className="px-5 py-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{row.id}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">{row.plate}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-blue-600">{row.slot}</td>
                    <td className="px-5 py-4 font-medium text-slate-500">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Giao dịch thanh toán */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Giao dịch thanh toán</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Giao dịch hoàn tất gần đây</p>
            </div>
            <button
              onClick={() => toast.info('Chuyển hướng đến lịch sử giao dịch...')}
              className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
            >
              Xem tất cả
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Session ID</th>
                  <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Biển số</th>
                  <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Số tiền</th>
                  <th className="px-5 py-4 font-bold tracking-wider uppercase text-[11px]">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {payments.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 transition-colors group cursor-pointer">
                    <td className="px-5 py-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{row.id}</td>
                    <td className="px-5 py-4 font-semibold text-slate-700">{row.plate}</td>
                    <td className="px-5 py-4 font-black text-slate-900">{row.amount}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        row.status.includes('CHƯA')
                          ? 'bg-orange-50 text-orange-600 border-orange-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {row.status.includes('CHƯA') ? <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> : <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagerDashboard

