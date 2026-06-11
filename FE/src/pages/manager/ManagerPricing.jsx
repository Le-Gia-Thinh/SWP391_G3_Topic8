import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Save,
  Edit3,
  Eye,
  Calendar,
  ChevronDown,
  Info,
  ArrowRight,
  Receipt
} from 'lucide-react'
import { toast } from 'react-toastify'

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
  },
  {
    id: 'POL-004',
    vehicleType: 'Xe ô tô (Bán tải)',
    policyType: 'Walk-in',
    baseFee: '30,000đ',
    hourlyFee: '15,000đ',
    overnightFee: '70,000đ',
    effectiveDate: '2024-06-15',
    status: 'Active'
  },
  {
    id: 'POL-005',
    vehicleType: 'Xe máy điện',
    policyType: 'Tất cả',
    baseFee: '3,000đ',
    hourlyFee: '1,000đ',
    overnightFee: '8,000đ',
    effectiveDate: '2024-07-01',
    status: 'Draft'
  },
  {
    id: 'POL-006',
    vehicleType: 'Xe khách (16-29 chỗ)',
    policyType: 'Booking',
    baseFee: '100,000đ',
    hourlyFee: '40,000đ',
    overnightFee: '200,000đ',
    effectiveDate: '2024-05-01',
    status: 'Active'
  },
  {
    id: 'POL-007',
    vehicleType: 'Xe ô tô (4-7 chỗ)',
    policyType: 'VIP',
    baseFee: '50,000đ',
    hourlyFee: '20,000đ',
    overnightFee: '100,000đ',
    effectiveDate: '2023-12-01',
    status: 'Inactive'
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
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100)
  }, [])

  const filteredPolicies = pricingPolicies.filter((policy) =>
    policy.id.toLowerCase().includes(query.toLowerCase()) ||
    policy.vehicleType.toLowerCase().includes(query.toLowerCase())
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success('Đã lưu cấu hình chính sách giá thành công!')
    }, 1000)
  }

  const handleSelectPolicy = (policy) => {
    setSelectedPolicy(policy)
    toast.info(`Đang xem chi tiết chính sách ${policy.id}`)
  }

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-[1.5rem] shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-4 px-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">Cấu hình / Chính sách giá</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Quản lý Chính sách giá</h1>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
        >
          {isSaving ? (
            <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> Đang xử lý...</span>
          ) : (
            <><Save size={18} /> Lưu thay đổi</>
          )}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="space-y-6">
          {/* Policy List */}
          <div className="rounded-[1.5rem] bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Danh sách Chính sách áp dụng</h2>
                  <p className="text-[12px] font-medium text-slate-500 mt-0.5">Quản lý và theo dõi các khung giá đang được thực thi.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm mã hoặc loại xe..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95">
                  <Filter size={16} /> Lọc
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto overflow-y-auto max-h-[360px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                <table className="min-w-full text-left text-sm text-slate-700 relative">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Mã CS</th>
                      <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Loại xe</th>
                      <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Loại phiên</th>
                      <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Phí cơ bản</th>
                      <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Giờ tiếp theo</th>
                      <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Ngày hiệu lực</th>
                      <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Trạng thái</th>
                      <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPolicies.map((policy) => (
                      <tr
                        key={policy.id}
                        className={`group cursor-pointer transition-colors ${selectedPolicy.id === policy.id ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'}`}
                        onClick={() => handleSelectPolicy(policy)}
                      >
                        <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">{policy.id}</td>
                        <td className="px-5 py-4 font-medium">{policy.vehicleType}</td>
                        <td className="px-5 py-4 text-slate-500">{policy.policyType}</td>
                        <td className="px-5 py-4 font-semibold text-slate-800">{policy.baseFee}</td>
                        <td className="px-5 py-4 font-semibold text-slate-600">{policy.hourlyFee}</td>
                        <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{policy.effectiveDate}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${policy.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : policy.status === 'Draft' ? 'bg-amber-50 text-amber-600 border border-amber-200/60' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                            {(policy.status === 'Active' || policy.status === 'Draft') && <span className={`w-1.5 h-1.5 rounded-full ${policy.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />}
                            {policy.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${selectedPolicy.id === policy.id ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 bg-white text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200'}`}>
                            <Edit3 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Configuration Detail */}
          <section className="rounded-[1.5rem] bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                <Info size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cấu hình chi tiết: {selectedPolicy.id}</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Thiết lập các thông số phí chi tiết cho loại phương tiện cụ thể.</p>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-5 xl:grid-cols-2">
                <FormField label="Loại phương tiện" name="vehicleType" value={settings.vehicleType} onChange={handleChange} type="select" options={['Xe ô tô (4-7 chỗ)', 'Xe máy', 'Xe tải (>3.5T)']} />
                <FormField label="Áp dụng cho Loại phiên" name="applyType" value={settings.applyType} onChange={handleChange} type="select" options={['Tất cả (Vãng lai & Đặt trước)', 'Walk-in', 'Booking']} />
              </div>

              <div className="w-full h-px bg-slate-100 my-1"></div>

              <div className="grid gap-5 xl:grid-cols-2">
                <FormField label="Phí vào cổng (Base Fee)" name="baseFee" value={settings.baseFee} onChange={handleChange} suffix="VND" />
                <FormField label="Thời gian miễn phí đầu (phút)" name="freeMinutes" value={settings.freeMinutes} onChange={handleChange} />
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <FormField label="Phí mỗi giờ tiếp theo" name="additionalHourFee" value={settings.additionalHourFee} onChange={handleChange} suffix="VND" />
                <FormField label="Phí qua đêm (sau 00:00)" name="overnightFee" value={settings.overnightFee} onChange={handleChange} suffix="VND" />
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <FormField label="Phí quá giờ (đối với Booking)" name="bookingFee" value={settings.bookingFee} onChange={handleChange} suffix="VND" />
                <FormField label="Phí xử lý sự cố (nếu có)" name="incidentFee" value={settings.incidentFee} onChange={handleChange} suffix="VND" />
              </div>

              <div className="w-full h-px bg-slate-100 my-1"></div>

              <div className="grid gap-5 xl:grid-cols-2">
                <FormField label="Ngày bắt đầu hiệu lực" name="startDate" value={settings.startDate} onChange={handleChange} type="date" />
                <FormField label="Trạng thái áp dụng" name="status" value={settings.status} onChange={handleChange} type="select" options={['Đang hoạt động (Active)', 'Ngưng áp dụng', 'Draft']} />
              </div>
              <FormField label="Ghi chú nội bộ" name="notes" value={settings.notes} onChange={handleChange} type="textarea" />
            </div>
          </section>
        </section>

        {/* Right Sidebar */}
        <aside className="space-y-6">
          <section className="rounded-[1.5rem] bg-gradient-to-b from-blue-50 to-white p-7 shadow-sm border border-blue-100 hover:border-blue-200 transition-colors relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm border border-blue-100">
                  <Receipt size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Xem trước Kết quả</h2>
                  <p className="text-[12px] font-medium text-slate-500 mt-0.5">Mô phỏng tính phí thực tế.</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-2 bg-white rounded-[1.25rem] border border-slate-200 shadow-sm overflow-hidden">
              {/* Ticket Top */}
              <div className="p-5 border-b border-dashed border-slate-300 relative">
                {/* Cutouts */}
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-50 rounded-full border border-slate-200 border-r-transparent border-b-transparent rotate-45"></div>
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-50 rounded-full border border-slate-200 border-l-transparent border-b-transparent -rotate-45"></div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mẫu hoá đơn thanh toán</p>
                    <p className="mt-1.5 text-xl font-bold text-slate-900 tracking-tight">30F-999.88</p>
                  </div>
                  <span className="inline-flex rounded-lg bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">PREVIEW</span>
                </div>
              </div>

              {/* Ticket Body */}
              <div className="p-5 bg-white">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-5">
                  <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">Ô tô (4-7 chỗ) • WALK-IN</span>
                  <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">03 giờ 15 phút</span>
                </div>
                <div className="flex flex-col gap-3 text-sm text-slate-600">
                  <FeeRow label="Phí vào cổng" amount="20,000đ" />
                  <FeeRow label="Phí thời gian (3h x 10k)" amount="30,000đ" />
                  <FeeRow label="Block lẻ (15p)" amount="2,500đ" />
                  <FeeRow label="Giảm trừ miễn phí 15p đầu" amount="-2,500đ" highlight />
                </div>
              </div>

              {/* Ticket Bottom */}
              <div className="p-5 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500">Tổng cộng tạm tính</span>
                  <span className="text-xl font-bold text-blue-600">50,000đ</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white p-6 shadow-sm border border-slate-200/60">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Lưu ý & Cảnh báo hệ thống
            </p>
            <div className="mt-4 space-y-3 rounded-xl bg-amber-50/50 border border-amber-100 p-4 text-xs font-medium text-amber-800 leading-relaxed">
              <p>• Loại phương tiện, phí vào cổng và Ngày hiệu lực là bắt buộc.</p>
              <p>• Chỉ tồn tại 01 chính sách đang hoạt động cho một loại xe theo một loại phiên. Việc lưu sẽ tự động điều chỉnh chính sách cũ sang “Tạm dừng”.</p>
              <p>• Không thể chỉnh sửa chính sách đã có lịch thanh toán hoàn tất. Hệ thống sẽ tạo phiên bản chính sách mới thay thế.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

const FormField = ({ label, name, value, onChange, type = 'text', options = [], suffix }) => (
  <label className="block text-sm font-semibold text-slate-700">
    <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
    {type === 'textarea' ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={3}
        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    ) : type === 'select' ? (
      <div className="relative group">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-semibold text-slate-900 outline-none transition-all cursor-pointer hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>
      </div>
    ) : (
      <div className="relative">
        <input
          name={name}
          value={value}
          type={type}
          onChange={onChange}
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {suffix && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{suffix}</span>}
      </div>
    )}
  </label>
)

const FeeRow = ({ label, amount, highlight }) => (
  <div className="flex items-center justify-between text-sm group">
    <span className={`${highlight ? 'text-emerald-600' : 'text-slate-500 group-hover:text-slate-700 transition-colors'}`}>{label}</span>
    <span className={`font-semibold ${highlight ? 'text-emerald-600 bg-emerald-50 px-2 rounded-md' : 'text-slate-900'}`}>{amount}</span>
  </div>
)

export default ManagerPricing
