import { useState } from 'react'
import {
  Plus,
  Edit3,
  Settings,
  Shield,
  ArrowUpRight,
  CheckCircle,
  Circle,
  Save,
  RefreshCcw
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const initialInfo = {
  buildingName: 'VinPark Central Plaza',
  address: '720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh, TP. HCM',
  openTime: '05:00',
  closeTime: '23:30',
  capacity: '1500',
  hotline: '1900 6789',
  description: 'Bãi đỗ xe thông minh 5 tầng với hệ thống giám sát 24/7 và hỗ trợ xả điện.'
}

const initialFloors = [
  { code: 'FL-01', name: 'Tầng Trệt (G)', zones: 4, capacity: 250, status: 'Active' },
  { code: 'FL-02', name: 'Tầng 1 (L1)', zones: 6, capacity: 350, status: 'Active' },
  { code: 'FL-03', name: 'Tầng 2 (L2)', zones: 6, capacity: 350, status: 'Active' },
  { code: 'FL-04', name: 'Tầng Hầm B1', zones: 8, capacity: 450, status: 'Active' },
  { code: 'FL-05', name: 'Khu vực Kỹ thuật', zones: 1, capacity: 100, status: 'Maintenance' }
]

const initialAreas = [
  { code: 'AR-G-01', name: 'Khu A - VIP', floor: 'Tầng Trệt', type: 'Xe Ô tô', capacity: 50, status: 'Active' },
  { code: 'AR-G-02', name: 'Khu B - Xe Máy', floor: 'Tầng Trệt', type: 'Xe Máy', capacity: 200, status: 'Active' },
  { code: 'AR-L1-01', name: 'Khu C - Ô tô', floor: 'Tầng 1', type: 'Xe Ô tô', capacity: 150, status: 'Active' },
  { code: 'AR-B1-01', name: 'Khu D - Ưu tiên', floor: 'Tầng Hầm B1', type: 'Xe Ô tô', capacity: 100, status: 'Active' },
  { code: 'AR-B1-02', name: 'Khu E - Xe Điện', floor: 'Tầng Hầm B1', type: 'Xe Điện', capacity: 50, status: 'Active' }
]

const initialGates = [
  { name: 'Cổng Chính Bắc', type: 'Cổng Vào', staff: 2, status: 'Active' },
  { name: 'Cổng Chính Nam', type: 'Cổng Ra', staff: 2, status: 'Active' },
  { name: 'Cổng Phụ Tây', type: 'Vào & Ra', staff: 2, status: 'Active' },
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

  const handleInfoChange = (event) => {
    const { name, value } = event.target
    setInfo((prev) => ({ ...prev, [name]: value }))
  }

  const toggleRule = (ruleName) => {
    setRules((prev) => ({ ...prev, [ruleName]: !prev[ruleName] }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Cấu hình / Tòa nhà đỗ xe</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Cấu hình Bãi đỗ xe</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <RefreshCcw size={16} /> Huỷ thay đổi
          </button>
          <button className="inline-flex items-center gap-2 rounded-3xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
            <Save size={16} /> Lưu thay đổi
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <Settings size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Thông tin Tòa nhà</h2>
                <p className="text-sm text-slate-500">Cấu hình thông tin cơ bản và trạng thái vận hành của tòa nhà.</p>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              <Plus size={16} /> Thêm chi nhánh
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
              <LabelInput label="Tên toà nhà" name="buildingName" value={info.buildingName} onChange={handleInfoChange} />
              <LabelInput label="Giờ mở cửa" name="openTime" value={info.openTime} onChange={handleInfoChange} />
              <LabelInput label="Mô tả cơ sở" name="description" value={info.description} onChange={handleInfoChange} textarea />
            </div>
            <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
              <LabelInput label="Địa chỉ chi tiết" name="address" value={info.address} onChange={handleInfoChange} />
              <LabelInput label="Giờ đóng cửa" name="closeTime" value={info.closeTime} onChange={handleInfoChange} />
              <div className="grid gap-4 sm:grid-cols-2">
                <LabelInput label="Tổng sức chứa (slots)" name="capacity" value={info.capacity} onChange={handleInfoChange} />
                <LabelInput label="Hotline hỗ trợ" name="hotline" value={info.hotline} onChange={handleInfoChange} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Quản lý Tầng (Floors)</h2>
              <p className="text-sm text-slate-500">Danh sách các tầng và sức chứa hiện tại.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-3xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
              <Plus size={16} /> Thêm tầng mới
            </button>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-white text-slate-500">
                <tr>
                  <th className="px-4 py-3">Mã Tầng</th>
                  <th className="px-4 py-3">Tên Tầng</th>
                  <th className="px-4 py-3">Tổng Khu Vực</th>
                  <th className="px-4 py-3">Sức Chứa</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                  <th className="px-4 py-3">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {floors.map((floor) => (
                  <tr key={floor.code} className="border-t border-slate-200 bg-white">
                    <td className="px-4 py-4 font-semibold text-slate-900">{floor.code}</td>
                    <td className="px-4 py-4">{floor.name}</td>
                    <td className="px-4 py-4">{floor.zones}</td>
                    <td className="px-4 py-4">{floor.capacity}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${floor.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {floor.status}
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
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Quản lý Khu vực (Areas)</h2>
              <p className="text-sm text-slate-500">Chi tiết phân bổ loại xe và sức chứa theo từng khu vực.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
              <Plus size={16} /> Thêm khu vực
            </button>
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="bg-white text-slate-500">
                <tr>
                  <th className="px-4 py-3">Mã Khu Vực</th>
                  <th className="px-4 py-3">Tên Khu Vực</th>
                  <th className="px-4 py-3">Thuộc Tầng</th>
                  <th className="px-4 py-3">Loại Xe Hỗ Trợ</th>
                  <th className="px-4 py-3">Sức Chứa</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                  <th className="px-4 py-3">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area) => (
                  <tr key={area.code} className="border-t border-slate-200 bg-white">
                    <td className="px-4 py-4 font-semibold text-slate-900">{area.code}</td>
                    <td className="px-4 py-4">{area.name}</td>
                    <td className="px-4 py-4">{area.floor}</td>
                    <td className="px-4 py-4">{area.type}</td>
                    <td className="px-4 py-4">{area.capacity}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${area.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {area.status}
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
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Cấu hình Cổng (Gates)</h2>
                <p className="text-sm text-slate-500">Thiết lập lối vào/ra và phân bổ nhân sự.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {gates.map((gate) => (
                <div key={gate.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{gate.name}</p>
                      <p className="text-sm text-slate-500">{gate.type} • {gate.staff} nhân viên</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${gate.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {gate.status}
                      </span>
                      <button className="text-sm font-semibold text-sky-600 hover:text-sky-700">Cấu hình</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <ArrowUpRight size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Quy tắc Vận hành</h2>
                <p className="text-sm text-slate-500">Thiết lập logic nghiệp vụ cho nhân viên bãi đỗ.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <RuleToggle label="Cho phép khách vãng lai" value={rules.allowOnsite} onToggle={() => toggleRule('allowOnsite')} />
              <RuleToggle label="Cho phép đặt chỗ trước (Booking)" value={rules.allowBooking} onToggle={() => toggleRule('allowBooking')} />
              <RuleToggle label="Yêu cầu xác thực trước khi thanh toán" value={rules.requirePrepay} onToggle={() => toggleRule('requirePrepay')} />
              <RuleToggle label="Chống trùng lặp biên số (Anti-Passback)" value={rules.antiPassback} onToggle={() => toggleRule('antiPassback')} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

const LabelInput = ({ label, name, value, onChange, textarea }) => (
  <label className="block text-sm font-semibold text-slate-700">
    <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-500">{label}</span>
    {textarea ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full resize-none rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
    ) : (
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={name.includes('Time') ? 'time' : 'text'}
        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      />
    )}
  </label>
)

const RuleToggle = ({ label, value, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex w-full items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300"
  >
    <div>
      <p className="font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-sm text-slate-500">{value ? 'Đang bật' : 'Đang tắt'}</p>
    </div>
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${value ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
      {value ? <CheckCircle size={18} /> : <Circle size={18} />}
    </span>
  </button>
)

export default ManagerConfig
