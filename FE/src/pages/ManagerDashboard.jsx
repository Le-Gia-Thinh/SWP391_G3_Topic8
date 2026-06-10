import { ArrowUpRight, Download } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ManagerDashboard = () => {
  const { user } = useAuth()
  const displayName = user?.fullName || 'Manager'

  const kpis = [
    { title: 'Tổng vị trí', value: '1500', delta: '+5%', color: 'from-sky-500 to-blue-600' },
    { title: 'Vị trí trống', value: '245', delta: '-3%', color: 'from-emerald-500 to-teal-600' },
    { title: 'Đã đỗ', value: '1205', delta: '+12%', color: 'from-orange-500 to-amber-600' },
    { title: 'Đặt trước', value: '50', delta: '+8%', color: 'from-violet-500 to-fuchsia-600' },
    { title: 'Bảo trì', value: '12', delta: '0%', color: 'from-rose-500 to-pink-600' }
  ]

  const revenueData = [
    { label: 'Thứ 2', value: 70 },
    { label: 'Thứ 3', value: 85 },
    { label: 'Thứ 4', value: 75 },
    { label: 'Thứ 5', value: 95 },
    { label: 'Thứ 6', value: 80 },
    { label: 'Thứ 7', value: 110 },
    { label: 'CN', value: 100 }
  ]

  const vehicles = [
    { label: 'Motorbike', value: 52, color: 'bg-sky-500' },
    { label: 'Car', value: 30, color: 'bg-emerald-500' },
    { label: 'Truck', value: 12, color: 'bg-orange-500' },
    { label: 'Other', value: 6, color: 'bg-slate-500' }
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manager Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Xin chào {displayName}, đây là tổng quan hoạt động của bãi đỗ.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">24/05/2024</div>
          <button className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            <Download size={16} /> Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {kpis.map((item) => (
          <div key={item.title} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.title}</p>
                <p className="mt-4 text-3xl font-black text-slate-900">{item.value}</p>
              </div>
              <div className={`rounded-3xl bg-gradient-to-br px-3 py-2 text-sm font-semibold text-white ${item.color}`}>
                {item.delta}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Tỷ lệ lấp đầy</h2>
              <p className="mt-1 text-sm text-slate-500">Trạng thái hiện tại toàn hệ thống</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-3xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <ArrowUpRight size={16} /> 82%
            </span>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Tầng hầm B1</span>
              <span>95%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100">
              <div className="h-2.5 rounded-full bg-blue-600" style={{ width: '95%' }} />
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Tầng hầm B2</span>
              <span>78%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100">
              <div className="h-2.5 rounded-full bg-sky-500" style={{ width: '78%' }} />
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Tầng hầm B3</span>
              <span>62%</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100">
              <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: '62%' }} />
            </div>
          </div>
          <div className="mt-5 rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <p className="font-semibold">Walk in</p>
            <p className="text-2xl font-black">88%</p>
          </div>
          <div className="mt-3 rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <p className="font-semibold">Reserved</p>
            <p className="text-2xl font-black">12%</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Doanh thu 7 ngày qua</h2>
              <p className="mt-1 text-sm text-slate-500">Tăng trưởng theo VNĐ</p>
            </div>
            <span className="rounded-3xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">+12.4%</span>
          </div>
          <div className="mt-6 grid h-44 grid-cols-7 items-end gap-3">
            {revenueData.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div className="h-full w-full rounded-t-3xl bg-slate-100">
                  <div
                    className="h-full w-full rounded-t-3xl bg-green-500"
                    style={{ height: `${item.value}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Lưu lượng xe</h2>
              <p className="mt-1 text-sm text-slate-500">Thống kê xe vào/ra trong ngày</p>
            </div>
            <button className="rounded-3xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">Vào: 1.240</button>
          </div>
          <div className="mt-6 h-[260px] rounded-[2rem] bg-gradient-to-b from-blue-400 to-blue-100 p-4 text-white">
            <div className="flex h-full flex-col justify-between">
              <div className="space-y-4">
                <div className="h-2 rounded-full bg-white/20" style={{ width: '65%' }} />
                <div className="h-2 rounded-full bg-white/20" style={{ width: '75%' }} />
                <div className="h-2 rounded-full bg-white/20" style={{ width: '55%' }} />
                <div className="h-2 rounded-full bg-white/20" style={{ width: '85%' }} />
              </div>
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>08:00</span>
                <span>10:00</span>
                <span>12:00</span>
                <span>14:00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Cơ cấu loại xe</h2>
          <div className="mt-6 space-y-4">
            {vehicles.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className={`${item.color} h-3 rounded-full`} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Lượt xe vào gần đây</h2>
              <p className="text-sm text-slate-500">Dữ liệu cập nhật 30 phút</p>
            </div>
            <button className="rounded-3xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">Xem tất cả</button>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Session ID</th>
                  <th className="px-4 py-3">Biển số</th>
                  <th className="px-4 py-3">Vị trí</th>
                  <th className="px-4 py-3">Giờ vào</th>
                  <th className="px-4 py-3">Nhân viên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {checkIns.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-semibold text-slate-900">{row.id}</td>
                    <td className="px-4 py-4 text-slate-700">{row.plate}</td>
                    <td className="px-4 py-4 text-slate-700">{row.slot}</td>
                    <td className="px-4 py-4 text-slate-700">{row.time}</td>
                    <td className="px-4 py-4 text-slate-700">{row.staff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Lượt xe ra & Thanh toán</h2>
              <p className="text-sm text-slate-500">Dữ liệu giao dịch hoàn tất</p>
            </div>
            <button className="rounded-3xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">Xem tất cả</button>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Session ID</th>
                  <th className="px-4 py-3">Biển số</th>
                  <th className="px-4 py-3">Số tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {payments.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-semibold text-slate-900">{row.id}</td>
                    <td className="px-4 py-4 text-slate-700">{row.plate}</td>
                    <td className="px-4 py-4 text-slate-700">{row.amount}</td>
                    <td className={`px-4 py-4 text-sm font-semibold ${row.status.includes('CHƯA') ? 'text-orange-600' : 'text-emerald-600'}`}>
                      {row.status}
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
