import { useState, useEffect } from 'react'
import {
  Plus,
  Edit3,
  Settings,
  Shield,
  ArrowUpRight,
  CheckCircle,
  Circle,
  Save,
  RefreshCcw,
  Building,
  Layers,
  Map
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

const initialInfo = {
  buildingName: 'VinPark Central Plaza',
  address: '720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP. HCM',
  openTime: '05:00',
  closeTime: '23:30',
  capacity: '1500',
  hotline: '1900 6789',
  description: 'Bãi đỗ xe thông minh 5 tầng với hệ thống giám sát 24/7 và hỗ trợ sạc điện.'
}

const initialFloors = [
  { code: 'FL-01', name: 'Tầng Trệt (G)', zones: 4, capacity: 250, status: 'Active' },
  { code: 'FL-02', name: 'Tầng 1 (L1)', zones: 6, capacity: 350, status: 'Active' },
  { code: 'FL-03', name: 'Tầng 2 (L2)', zones: 6, capacity: 350, status: 'Active' },
  { code: 'FL-04', name: 'Tầng Hầm B1', zones: 8, capacity: 450, status: 'Active' },
  { code: 'FL-05', name: 'Khu vực Kỹ thuật', zones: 1, capacity: 100, status: 'Maintenance' },
  { code: 'FL-06', name: 'Tầng Thượng (R)', zones: 2, capacity: 150, status: 'Active' },
  { code: 'FL-07', name: 'Tầng Hầm B2', zones: 8, capacity: 450, status: 'Active' },
  { code: 'FL-08', name: 'Tầng Hầm B3', zones: 8, capacity: 450, status: 'Inactive' }
]

const initialAreas = [
  { code: 'AR-G-01', name: 'Khu A - VIP', floor: 'Tầng Trệt', type: 'Xe Ô tô', capacity: 50, status: 'Active' },
  { code: 'AR-G-02', name: 'Khu B - Xe Máy', floor: 'Tầng Trệt', type: 'Xe Máy', capacity: 200, status: 'Active' },
  { code: 'AR-L1-01', name: 'Khu C - Ô tô', floor: 'Tầng 1', type: 'Xe Ô tô', capacity: 150, status: 'Active' },
  { code: 'AR-B1-01', name: 'Khu D - Ưu tiên', floor: 'Tầng Hầm B1', type: 'Xe Ô tô', capacity: 100, status: 'Active' },
  { code: 'AR-B1-02', name: 'Khu E - Xe Điện', floor: 'Tầng Hầm B1', type: 'Xe Điện', capacity: 50, status: 'Active' },
  { code: 'AR-L2-01', name: 'Khu F - Xe khách', floor: 'Tầng 2', type: 'Xe Khách', capacity: 30, status: 'Active' },
  { code: 'AR-B2-01', name: 'Khu G - Dài hạn', floor: 'Tầng Hầm B2', type: 'Xe Ô tô', capacity: 200, status: 'Maintenance' },
  { code: 'AR-B3-01', name: 'Khu H - Tạm thời', floor: 'Tầng Hầm B3', type: 'Xe Tải nhỏ', capacity: 100, status: 'Inactive' }
]

const initialGates = [
  { name: 'Cổng Chính Bắc', type: 'Cổng Vào', staff: 2, status: 'Active' },
  { name: 'Cổng Chính Nam', type: 'Cổng Ra', staff: 2, status: 'Active' },
  { name: 'Cổng Phụ Tây', type: 'Vào & Ra', staff: 2, status: 'Active' },
  { name: 'Cổng Phụ Đông', type: 'Cổng Vào', staff: 1, status: 'Active' },
  { name: 'Cổng Giao Nhận', type: 'Vào & Ra', staff: 1, status: 'Maintenance' },
  { name: 'Cổng VIP', type: 'Vào & Ra', staff: 2, status: 'Active' },
  { name: 'Cổng Nội Bộ', type: 'Vào & Ra', staff: 0, status: 'Inactive' }
]

const initialRules = {
  allowOnsite: true,
  allowBooking: true,
  requirePrepay: true,
  antiPassback: true
}

const ManagerConfig = () => {
  const { user } = useAuth()
  const [info, setInfo] = useState(initialInfo)
  const [floors] = useState(initialFloors)
  const [areas] = useState(initialAreas)
  const [gates] = useState(initialGates)
  const [rules, setRules] = useState(initialRules)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100)
  }, [])

  const handleInfoChange = (event) => {
    const { name, value } = event.target
    setInfo((prev) => ({ ...prev, [name]: value }))
  }

  const toggleRule = (ruleName) => {
    setRules((prev) => ({ ...prev, [ruleName]: !prev[ruleName] }))
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success('Đã cập nhật cấu hình bãi đỗ xe thành công!')
    }, 1000)
  }

  const handleReset = () => {
    setInfo(initialInfo)
    setRules(initialRules)
    toast.info('Đã hoàn tác các thay đổi chưa lưu')
  }

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-[1.5rem] shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-4 px-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">Cấu hình / Tòa nhà đỗ xe</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Cấu hình Bãi đỗ xe</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
          >
            <RefreshCcw size={16} /> Huỷ thay đổi
          </button>
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
      </div>

      <div className="grid gap-6">
        {/* Thông tin Tòa nhà */}
        <section className="rounded-[1.5rem] bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Building size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Thông tin Tòa nhà</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Cấu hình thông tin cơ bản và trạng thái vận hành của tòa nhà.</p>
              </div>
            </div>
            <button 
              onClick={() => toast.info('Chức năng thêm chi nhánh mới đang được phát triển')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 shadow-sm"
            >
              <Plus size={16} /> Thêm chi nhánh
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4 rounded-[1.25rem] bg-slate-50 border border-slate-100 p-5">
              <LabelInput label="Tên toà nhà" name="buildingName" value={info.buildingName} onChange={handleInfoChange} />
              <LabelInput label="Giờ mở cửa" name="openTime" value={info.openTime} onChange={handleInfoChange} type="time" />
              <LabelInput label="Mô tả cơ sở" name="description" value={info.description} onChange={handleInfoChange} textarea />
            </div>
            <div className="space-y-4 rounded-[1.25rem] bg-slate-50 border border-slate-100 p-5">
              <LabelInput label="Địa chỉ chi tiết" name="address" value={info.address} onChange={handleInfoChange} />
              <LabelInput label="Giờ đóng cửa" name="closeTime" value={info.closeTime} onChange={handleInfoChange} type="time" />
              <div className="grid gap-4 sm:grid-cols-2">
                <LabelInput label="Tổng sức chứa (slots)" name="capacity" value={info.capacity} onChange={handleInfoChange} />
                <LabelInput label="Hotline hỗ trợ" name="hotline" value={info.hotline} onChange={handleInfoChange} />
              </div>
            </div>
          </div>
        </section>

        {/* Quản lý Tầng */}
        <section className="rounded-[1.5rem] bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Layers size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Quản lý Tầng (Floors)</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Danh sách các tầng và sức chứa hiện tại.</p>
              </div>
            </div>
            <button 
              onClick={() => toast.info('Chức năng thêm tầng mới đang được phát triển')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] shadow-sm"
            >
              <Plus size={16} /> Thêm tầng mới
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <table className="min-w-full text-left text-sm text-slate-700 relative">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Mã Tầng</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Tên Tầng</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Tổng Khu Vực</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Sức Chứa</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Trạng Thái</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {floors.map((floor) => (
                    <tr key={floor.code} className="bg-white hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">{floor.code}</td>
                      <td className="px-5 py-4 font-medium">{floor.name}</td>
                      <td className="px-5 py-4">{floor.zones}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{floor.capacity}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${floor.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${floor.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {floor.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:text-blue-600 hover:border-blue-200">
                          <Edit3 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Quản lý Khu vực */}
        <section className="rounded-[1.5rem] bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Map size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Quản lý Khu vực (Areas)</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Chi tiết phân bổ loại xe và sức chứa theo từng khu vực.</p>
              </div>
            </div>
            <button 
              onClick={() => toast.info('Chức năng thêm khu vực mới đang được phát triển')}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] shadow-sm"
            >
              <Plus size={16} /> Thêm khu vực
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <table className="min-w-full text-left text-sm text-slate-700 relative">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Mã Khu Vực</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Tên Khu Vực</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Thuộc Tầng</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Loại Xe Hỗ Trợ</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Sức Chứa</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Trạng Thái</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {areas.map((area) => (
                    <tr key={area.code} className="bg-white hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">{area.code}</td>
                      <td className="px-5 py-4 font-medium">{area.name}</td>
                      <td className="px-5 py-4 text-slate-500">{area.floor}</td>
                      <td className="px-5 py-4 font-medium">{area.type}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{area.capacity}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${area.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${area.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {area.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:text-blue-600 hover:border-blue-200">
                          <Edit3 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          {/* Cấu hình cổng */}
          <section className="rounded-[1.5rem] bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cấu hình Cổng (Gates)</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Thiết lập lối vào/ra và phân bổ nhân sự.</p>
              </div>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[320px] pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {gates.map((gate) => (
                <div key={gate.name} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50 hover:border-slate-300">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{gate.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5 font-medium">{gate.type} • {gate.staff} nhân viên</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${gate.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {gate.status}
                      </span>
                      <button 
                        onClick={() => toast.info(`Đang mở cấu hình ${gate.name}`)}
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Cấu hình
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quy tắc vận hành */}
          <section className="rounded-[1.5rem] bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                <ArrowUpRight size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Quy tắc Vận hành</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Thiết lập logic nghiệp vụ cho nhân viên bãi đỗ.</p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <RuleToggle label="Cho phép khách vãng lai (Walk-in)" value={rules.allowOnsite} onToggle={() => toggleRule('allowOnsite')} />
              <RuleToggle label="Cho phép đặt chỗ trước (Booking)" value={rules.allowBooking} onToggle={() => toggleRule('allowBooking')} />
              <RuleToggle label="Yêu cầu xác thực trước khi thanh toán" value={rules.requirePrepay} onToggle={() => toggleRule('requirePrepay')} />
              <RuleToggle label="Chống trùng lặp biển số (Anti-Passback)" value={rules.antiPassback} onToggle={() => toggleRule('antiPassback')} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

const LabelInput = ({ label, name, value, onChange, textarea, type = 'text' }) => (
  <label className="block text-sm font-semibold text-slate-700">
    <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
    {textarea ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={3}
        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
      />
    ) : (
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
      />
    )}
  </label>
)

const RuleToggle = ({ label, value, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={`group flex w-full items-center justify-between rounded-xl border ${value ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'} px-5 py-4 text-left transition-all hover:shadow-sm active:scale-[0.99]`}
  >
    <div>
      <p className={`font-bold ${value ? 'text-blue-900' : 'text-slate-800'}`}>{label}</p>
      <p className={`mt-0.5 text-xs font-medium ${value ? 'text-blue-600' : 'text-slate-500'}`}>{value ? 'Đang bật' : 'Đang tắt'}</p>
    </div>
    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${value ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
      {value ? <CheckCircle size={16} /> : <Circle size={16} />}
    </span>
  </button>
)

export default ManagerConfig
