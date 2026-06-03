import { useState } from 'react'
import {
  ArrowLeft,
  Clock3,
  Circle,
  CheckCircle,
  Lock,
  Save,
  ArrowRight,
  ChevronDown,
  Settings
} from 'lucide-react'

const initialSlot = {
  code: 'P1-A-102',
  floor: 'Tầng B1 - Tầng hầm 1',
  area: 'Khu A - Phía Tây',
  vehicleType: 'Ô tô (Standard Sedan/SUV)',
  status: 'Đang hoạt động',
  lastUpdated: 'Hôm nay, 14:30',
  updatedBy: 'System Admin'
}

const currentSession = {
  state: 'Đang sử dụng',
  label: 'OCCUPIED',
  sessionId: 'PS-9920183',
  plate: '30A-123.45',
  checkIn: 'Hôm nay, 14:30:15',
  duration: '02 giờ 45 phút',
  staff: 'Lê Văn Phúc'
}

const history = [
  {
    time: '12/10/2023 14:30:15',
    from: 'Available',
    to: 'Occupied',
    actor: 'Hệ thống (Check-in)',
    note: 'Session ID: PS-9920183'
  },
  {
    time: '12/10/2023 08:00:00',
    from: 'Maintenance',
    to: 'Available',
    actor: 'Trần Văn A (Kỹ thuật)',
    note: 'Đã sửa xong cảm biến sàn'
  },
  {
    time: '11/10/2023 22:00:00',
    from: 'Available',
    to: 'Maintenance',
    actor: 'Lê Thị B (Quản lý)',
    note: 'Lỗi cảm biến vật cản'
  },
  {
    time: '10/10/2023 15:45:10',
    from: 'Reserved',
    to: 'Available',
    actor: 'Hệ thống (Booking)',
    note: 'Booking BK-8827 hết hạn'
  },
  {
    time: '10/10/2023 10:20:00',
    from: 'Available',
    to: 'Available',
    actor: 'Hệ thống (Booking)',
    note: 'Đặt trước bởi khách hàng VIP'
  }
]

const ManagerSlots = () => {
  const [slot, setSlot] = useState(initialSlot)
  const [settings, setSettings] = useState({
    level: 'Tầng hầm B1',
    area: 'Khu vực A',
    vehicleType: 'Ô tô (Tiêu chuẩn)',
    operationStatus: 'Đang sử dụng - Tự động',
    notes: ''
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3 text-slate-600">
          <button className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <ArrowLeft size={16} /> Quay lại
          </button>
          <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
            Bãi đỗ xe
          </div>
          <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
            Quản lý Slot
          </div>
          <div className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            {slot.code}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>Chi tiết Vị trí</span>
          <span className="inline-flex h-2 w-2 rounded-full bg-slate-300" />
          <span>{slot.area}</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Thông tin Vị trí</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-900">Chi tiết kỹ thuật cơ sở hạ tầng</h2>
            </div>
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">Đang hoạt động</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mã Slot" value={slot.code} />
            <Field label="Tầng" value={slot.floor} />
            <Field label="Khu vực" value={slot.area} />
            <Field label="Loại phương tiện" value={slot.vehicleType} />
            <Field label="Cập nhật cuối" value={slot.lastUpdated} />
            <Field label="Người cập nhật" value={slot.updatedBy} />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trạng thái Hiện tại</p>
              <h2 className="mt-3 text-lg font-semibold text-slate-900">Dữ liệu phiên đỗ xe thời gian thực</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-3xl bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              <CheckCircle size={14} className="text-emerald-600" /> Hoạt động
            </div>
          </div>
          <div className="mt-6 rounded-3xl bg-white p-6 text-slate-700 shadow-sm">
            <div className="mb-4 rounded-3xl bg-sky-100 p-4 text-sky-700">
              <p className="text-sm uppercase tracking-[0.2em] text-sky-700">Trạng thái</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">Đang sử dụng</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">OCCUPIED</p>
            </div>
            <div className="grid gap-4 text-sm text-slate-600">
              <Stat label="Session ID" value={currentSession.sessionId} />
              <Stat label="Biển số xe" value={currentSession.plate} />
              <Stat label="Check-in" value={currentSession.checkIn} />
              <Stat label="Thời gian đỗ" value={currentSession.duration} />
              <Stat label="Nhân viên trực" value={currentSession.staff} />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
              <Settings size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cập nhật Thông tin Vị trí</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-900">Chỉ Quản lý mới có quyền thay đổi</h2>
            </div>
          </div>
          <div className="space-y-4">
            <Input label="Mã Slot (Hệ thống)" value={slot.code} readOnly />
            <Select label="Tầng" name="level" value={settings.level} onChange={handleChange} options={['Tầng hầm B1', 'Tầng hầm B2', 'Tầng 1', 'Tầng trệt']} />
            <Select label="Khu vực" name="area" value={settings.area} onChange={handleChange} options={['Khu vực A', 'Khu vực B', 'Khu vực C']} />
            <Select label="Loại phương tiện hỗ trợ" name="vehicleType" value={settings.vehicleType} onChange={handleChange} options={['Ô tô (Tiêu chuẩn)', 'Xe máy', 'Xe điện']} />
            <Select label="Trạng thái vận hành" name="operationStatus" value={settings.operationStatus} onChange={handleChange} options={['Đang sử dụng - Tự động', 'Available', 'Maintenance']} />
            <Textarea label="Ghi chú nội bộ" name="notes" value={settings.notes} onChange={handleChange} />
          </div>
          <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">
            <p className="font-semibold text-slate-900">Quy định hệ thống</p>
            <p className="mt-2">Không thể chuyển sang trạng thái <span className="font-semibold">Đang sử dụng</span> nếu chưa có dữ liệu phiên thực tế. Trạng thái đang sử dụng được hệ thống tự động kích hoạt khi có xe vào.</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button className="rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Hủy bỏ</button>
            <button className="rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"><Save size={16} /> Lưu thay đổi</button>
            <button className="rounded-3xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"><Lock size={16} /> Khóa Slot</button>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Lịch sử Trạng thái & Thay đổi</p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Nhật ký chi tiết các lần thay đổi trạng thái và người thực hiện</h2>
          </div>
          <button className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            <ArrowRight size={16} /> Xem tất cả
          </button>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Trạng thái cũ</th>
                <th className="px-4 py-3">Trạng thái mới</th>
                <th className="px-4 py-3">Người thực hiện</th>
                <th className="px-4 py-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.time} className="border-t border-slate-200 bg-white">
                  <td className="px-4 py-4 text-slate-600">{item.time}</td>
                  <td className="px-4 py-4 text-slate-600">{item.from}</td>
                  <td className="px-4 py-4 text-slate-600">{item.to}</td>
                  <td className="px-4 py-4 text-slate-600">{item.actor}</td>
                  <td className="px-4 py-4 text-slate-600">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const Field = ({ label, value }) => (
  <div className="rounded-3xl bg-slate-50 p-4">
    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
    <p className="mt-3 text-sm font-semibold text-slate-900">{value}</p>
  </div>
)

const Stat = ({ label, value }) => (
  <div className="grid gap-1 text-sm">
    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</span>
    <span className="text-base font-semibold text-slate-900">{value}</span>
  </div>
)

const Input = ({ label, value, readOnly }) => (
  <label className="block text-sm font-semibold text-slate-700">
    <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">{label}</span>
    <input
      type="text"
      value={value}
      readOnly={readOnly}
      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
    />
  </label>
)

const Select = ({ label, name, value, onChange, options }) => (
  <label className="block text-sm font-semibold text-slate-700">
    <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">{label}</span>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-3xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  </label>
)

const Textarea = ({ label, name, value, onChange }) => (
  <label className="block text-sm font-semibold text-slate-700">
    <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">{label}</span>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={4}
      className="w-full resize-none rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
    />
  </label>
)

export default ManagerSlots
