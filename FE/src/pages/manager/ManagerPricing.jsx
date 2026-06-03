import { useState } from 'react'
import {
  Search,
  Filter,
  Save,
  Plus,
  Edit3,
  Eye,
  Calendar,
  ChevronDown,
  Info,
  CheckCircle
} from 'lucide-react'

const pricingPolicies = [
  {
    id: 'POL-001',
    vehicleType: 'Xe ô tô (4-7 chỗ)',
    policyType: 'Tất cả',
    baseFee: '20,000đ',
    hourlyFee: '10,000đ',
    overnightFee: '50,000đ',
    effectiveDate: '2024-01-01',
    status: 'Active'
  },
  {
    id: 'POL-002',
    vehicleType: 'Xe máy',
    policyType: 'Walk-in',
    baseFee: '5,000đ',
    hourlyFee: '2,000đ',
    overnightFee: '10,000đ',
    effectiveDate: '2024-01-01',
    status: 'Active'
  },
  {
    id: 'POL-003',
    vehicleType: 'Xe tải (>3.5T)',
    policyType: 'Booking',
    baseFee: '50,000đ',
    hourlyFee: '25,000đ',
    overnightFee: '120,000đ',
    effectiveDate: '2024-06-01',
    status: 'Active'
  }
]

const initialSettings = {
  vehicleType: 'Xe ô tô (4-7 chỗ)',
  applyType: 'Tất cả (Vãng lai & Đặt trước)',
  baseFee: '20,000',
  freeMinutes: '15',
  additionalHourFee: '10,000',
  overnightFee: '50,000',
  bookingFee: '15,000',
  incidentFee: '0',
  startDate: '2024-05-20',
  status: 'Đang hoạt động (Active)',
  notes: ''
}

const ManagerPricing = () => {
  const [settings, setSettings] = useState(initialSettings)
  const [selectedPolicy, setSelectedPolicy] = useState(pricingPolicies[0])
  const [query, setQuery] = useState('')

  const filteredPolicies = pricingPolicies.filter((policy) =>
    policy.id.toLowerCase().includes(query.toLowerCase()) ||
    policy.vehicleType.toLowerCase().includes(query.toLowerCase())
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Cấu hình / Chính sách giá</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Quản lý Chính sách giá</h1>
        </div>
        <button className="inline-flex items-center gap-2 rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
          <Save size={16} /> Lưu thay đổi
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Danh sách Chính sách áp dụng</p>
                  <p className="text-sm text-slate-500">Quản lý và theo dõi các khung giá đang được thực thi trong hệ thống.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative w-full max-w-xs">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm mã chính sách..."
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
                <button className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  <Filter size={16} /> Lọc dữ liệu
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-4">Mã chính sách</th>
                    <th className="px-4 py-4">Loại xe</th>
                    <th className="px-4 py-4">Loại phiên</th>
                    <th className="px-4 py-4">Phí cơ bản</th>
                    <th className="px-4 py-4">Phí giờ tiếp theo</th>
                    <th className="px-4 py-4">Ngày hiệu lực</th>
                    <th className="px-4 py-4">Trạng thái</th>
                    <th className="px-4 py-4">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPolicies.map((policy) => (
                    <tr
                      key={policy.id}
                      className={`border-t border-slate-200 bg-white ${selectedPolicy.id === policy.id ? 'bg-sky-50' : ''}`}
                      onClick={() => setSelectedPolicy(policy)}
                    >
                      <td className="cursor-pointer px-4 py-4 font-semibold text-slate-900">{policy.id}</td>
                      <td className="px-4 py-4">{policy.vehicleType}</td>
                      <td className="px-4 py-4">{policy.policyType}</td>
                      <td className="px-4 py-4">{policy.baseFee}</td>
                      <td className="px-4 py-4">{policy.hourlyFee}</td>
                      <td className="px-4 py-4">{policy.effectiveDate}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${policy.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {policy.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                          <Edit3 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Info size={20} />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Cấu hình chi tiết Chính sách</p>
                <p className="text-sm text-slate-500">Thiết lập các thông số phí chi tiết cho loại phương tiện cụ thể.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <FormField label="Loại phương tiện" name="vehicleType" value={settings.vehicleType} onChange={handleChange} type="select" options={['Xe ô tô (4-7 chỗ)', 'Xe máy', 'Xe tải (>3.5T)']} />
              <FormField label="Áp dụng cho Loại phiên" name="applyType" value={settings.applyType} onChange={handleChange} type="select" options={['Tất cả (Vãng lai & Đặt trước)', 'Walk-in', 'Booking']} />
              <div className="grid gap-4 xl:grid-cols-2">
                <FormField label="Phí vào cổng (Base Fee)" name="baseFee" value={settings.baseFee} onChange={handleChange} suffix="VND" />
                <FormField label="Thời gian miễn phí đầu (phút)" name="freeMinutes" value={settings.freeMinutes} onChange={handleChange} />
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <FormField label="Phí mỗi giờ tiếp theo" name="additionalHourFee" value={settings.additionalHourFee} onChange={handleChange} suffix="VND" />
                <FormField label="Phí qua đêm (sau 00:00)" name="overnightFee" value={settings.overnightFee} onChange={handleChange} suffix="VND" />
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <FormField label="Phí qua giờ (dối với Booking)" name="bookingFee" value={settings.bookingFee} onChange={handleChange} suffix="VND" />
                <FormField label="Phí xử lý sự cố (nếu có)" name="incidentFee" value={settings.incidentFee} onChange={handleChange} suffix="VND" />
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <FormField label="Ngày bắt đầu hiệu lực" name="startDate" value={settings.startDate} onChange={handleChange} type="date" />
                <FormField label="Trạng thái áp dụng" name="status" value={settings.status} onChange={handleChange} type="select" options={['Đang hoạt động (Active)', 'Ngưng áp dụng', 'Draft']} />
              </div>
              <FormField label="Ghi chú nội bộ" name="notes" value={settings.notes} onChange={handleChange} type="textarea" />
            </div>
          </section>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <Eye size={20} />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Xem trước Kết quả</p>
                <p className="text-sm text-slate-500">Mô phỏng tính phí thực tế.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4 rounded-3xl bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Mẫu hoá đơn thanh toán</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">30F-999.88</p>
                </div>
                <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">PREVIEW</span>
              </div>
              <div className="rounded-3xl bg-white p-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Ô tô (4-7 chỗ) • WALK-IN</span>
                  <span>03 giờ 15 phút</span>
                </div>
                <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
                  <FeeRow label="Phí vào cổng" amount="20,000đ" />
                  <FeeRow label="Phí thời gian (3h x 10k)" amount="30,000đ" />
                  <FeeRow label="Block lệ (15p)" amount="2,500đ" />
                  <FeeRow label="Giảm trừ miễn phí 15p đầu" amount="-2,500đ" />
                </div>
                <div className="mt-4 rounded-3xl bg-slate-100 p-4 text-center text-lg font-semibold text-slate-900">
                  Tổng cộng tạm tính 50,000đ
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Lưu ý & Cảnh báo hệ thống</p>
            <div className="mt-4 space-y-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-slate-900">• Loại phương tiện, phí vào cổng và Ngày hiệu lực là bắt buộc.</p>
              <p>• Chỉ tồn tại chính sách đang hoạt động cho xe ô tô (4-7 chỗ) loại phiên “Tất cả”. Việc lưu sẽ tự động điều chỉnh chính sách cũ sang “Tạm dừng”.</p>
              <p>• Không thể chỉnh sửa chính sách đã có lịch thanh toán hoàn tất. Hãy tạo chính sách mới thay thế.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

const FormField = ({ label, name, value, onChange, type = 'text', options = [], suffix }) => (
  <label className="block text-sm font-semibold text-slate-700">
    <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">{label}</span>
    {type === 'textarea' ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full resize-none rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
    ) : type === 'select' ? (
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
    ) : (
      <div className="relative">
        <input
          name={name}
          value={value}
          type={type}
          onChange={onChange}
          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
        {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">{suffix}</span>}
      </div>
    )}
  </label>
)

const FeeRow = ({ label, amount }) => (
  <div className="flex items-center justify-between text-sm text-slate-700">
    <span>{label}</span>
    <span className="font-semibold text-slate-900">{amount}</span>
  </div>
)

export default ManagerPricing
