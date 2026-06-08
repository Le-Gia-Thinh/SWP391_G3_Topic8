import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Clock3,
  CheckCircle,
  Lock,
  Save,
  ArrowRight,
  ChevronDown,
  Settings,
  AlertTriangle,
  History,
  CarFront,
  Activity,
  Server
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

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
  const navigate = useNavigate()
  const [slot, setSlot] = useState(initialSlot)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100)
  }, [])
  
  const initialSettings = {
    level: 'Tầng hầm B1',
    area: 'Khu vực A',
    vehicleType: 'Ô tô (Tiêu chuẩn)',
    operationStatus: 'Đang sử dụng - Tự động',
    notes: ''
  }
  const [settings, setSettings] = useState(initialSettings)

  const handleChange = (event) => {
    const { name, value } = event.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success('Đã cập nhật thông tin vị trí thành công!')
      setSlot(prev => ({
        ...prev,
        lastUpdated: 'Vừa xong',
        updatedBy: 'Carol Manager'
      }))
    }, 1000)
  }

  const handleCancel = () => {
    setSettings(initialSettings)
    toast.info('Đã hủy các thay đổi chưa lưu')
  }

  const handleLock = () => {
    if (window.confirm(`Bạn có chắc chắn muốn khóa slot ${slot.code} không?`)) {
      toast.warning(`Đã khóa slot ${slot.code} để bảo trì.`)
    }
  }

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-[1.5rem] shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-3 text-slate-600">
          <button 
            onClick={() => navigate(-1)}
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="flex items-center gap-2">
            <span 
              onClick={() => {
                toast.info('Đang chuyển về trang Tổng quan...');
                navigate('/manager');
              }}
              className="text-sm font-semibold text-slate-500 hover:text-blue-600 cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
            >
              Bãi đỗ xe
            </span>
            <span className="text-slate-300">/</span>
            <span 
              onClick={() => {
                toast.info('Đang tải danh sách Quản lý Slot...');
                navigate(-1);
              }}
              className="text-sm font-semibold text-slate-500 hover:text-blue-600 cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
            >
              Quản lý Slot
            </span>
            <span className="text-slate-300">/</span>
            <div className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm">
              {slot.code}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm bg-blue-50 px-5 py-2.5 rounded-xl border border-blue-100">
          <span className="font-semibold text-blue-600 uppercase tracking-wider text-[11px]">Khu vực trực thuộc</span>
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
          <span className="font-bold text-blue-800">{slot.area}</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        {/* Cột 1: Thông tin hạ tầng */}
        <section className="rounded-[1.5rem] bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Server size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Chi tiết hạ tầng</h2>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">Thông tin cơ sở dữ liệu</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Đang hoạt động
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mt-6">
            <Field label="Mã Slot" value={slot.code} highlight icon={<CarFront size={14}/>} />
            <Field label="Tầng" value={slot.floor} />
            <Field label="Khu vực" value={slot.area} />
            <Field label="Loại phương tiện" value={slot.vehicleType} />
            <Field label="Cập nhật cuối" value={slot.lastUpdated} />
            <Field label="Người cập nhật" value={slot.updatedBy} />
          </div>
        </section>

        {/* Cột 2: Trạng thái hiện tại - Clean Blue Theme */}
        <section className="rounded-[1.5rem] bg-gradient-to-b from-blue-50 to-white p-7 shadow-sm border border-blue-100 hover:border-blue-200 transition-colors relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Thời gian thực</h2>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">Live Tracking</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700">
              <CheckCircle size={14} className="text-blue-500" /> Active
            </div>
          </div>
          
          <div className="relative z-10 mt-2 rounded-[1.25rem] bg-white p-5 border border-slate-100 shadow-sm">
            <div className="mb-5 rounded-xl bg-blue-600 p-5 text-white shadow-md shadow-blue-600/20">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200 mb-2">Tình trạng bãi đỗ</p>
              <div className="flex items-baseline gap-3">
                <p className="text-2xl font-bold text-white tracking-tight">{currentSession.state}</p>
              </div>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-blue-200 opacity-90">{currentSession.label}</p>
            </div>
            <div className="grid gap-4 px-1">
              <Stat label="Session ID" value={currentSession.sessionId} icon={<Clock3 size={14}/>} />
              <div className="w-full h-px bg-slate-100"></div>
              <Stat label="Biển số xe" value={currentSession.plate} highlight />
              <div className="w-full h-px bg-slate-100"></div>
              <Stat label="Check-in" value={currentSession.checkIn} />
              <Stat label="Thời gian đỗ" value={currentSession.duration} />
              <Stat label="Nhân viên" value={currentSession.staff} />
            </div>
          </div>
        </section>

        {/* Cột 3: Cập nhật thông tin - Interactive Form */}
        <section className="rounded-[1.5rem] bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Thiết lập Slot</h2>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">Bảng điều khiển</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <Input label="Mã Slot (Hệ thống)" value={slot.code} readOnly />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Tầng" name="level" value={settings.level} onChange={handleChange} options={['Tầng hầm B1', 'Tầng hầm B2', 'Tầng 1', 'Tầng trệt']} />
              <Select label="Khu vực" name="area" value={settings.area} onChange={handleChange} options={['Khu vực A', 'Khu vực B', 'Khu vực C']} />
            </div>
            <Select label="Loại phương tiện hỗ trợ" name="vehicleType" value={settings.vehicleType} onChange={handleChange} options={['Ô tô (Tiêu chuẩn)', 'Xe máy', 'Xe điện']} />
            <Select label="Trạng thái vận hành" name="operationStatus" value={settings.operationStatus} onChange={handleChange} options={['Đang sử dụng - Tự động', 'Available', 'Maintenance']} />
            <Textarea label="Ghi chú nội bộ" name="notes" value={settings.notes} onChange={handleChange} />
          </div>
          
          <div className="mt-6 flex flex-col gap-3">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
            >
              {isSaving ? (
                <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> Đang đồng bộ...</span>
              ) : (
                <><Save size={18} /> Lưu thay đổi</>
              )}
            </button>
            <div className="flex gap-3">
              <button onClick={handleCancel} className="flex-1 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 border border-slate-200 transition hover:bg-slate-50 active:scale-[0.98]">Hủy bỏ</button>
              <button onClick={handleLock} className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-red-600 border border-red-200 transition hover:bg-red-50 active:scale-[0.98]">
                <Lock size={16} /> Khóa Slot
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Lịch sử */}
      <section className="rounded-[1.5rem] bg-white p-7 shadow-sm border border-slate-200/60 mt-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Nhật ký thay đổi</h2>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">Lịch sử hệ thống</p>
            </div>
          </div>
          <button 
            onClick={() => toast.info('Đang tải dữ liệu từ máy chủ...')}
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 transition hover:bg-slate-50 hover:text-blue-600 active:scale-95"
          >
            Xuất file CSV <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>
        
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-[12px] text-slate-500">Thời gian</th>
                <th className="px-6 py-4 font-bold text-[12px] text-slate-500">Thay đổi</th>
                <th className="px-6 py-4 font-bold text-[12px] text-slate-500">Thực hiện bởi</th>
                <th className="px-6 py-4 font-bold text-[12px] text-slate-500">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((item, index) => (
                <tr key={index} className="bg-white hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">{item.time}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 rounded text-slate-600">{item.from}</span>
                      <ArrowRight size={12} className="text-slate-400" />
                      <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded group-hover:bg-blue-100 transition-colors">{item.to}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-2">
                    {item.actor}
                  </td>
                  <td className="px-6 py-4 text-slate-500 italic text-sm">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const Field = ({ label, value, highlight, icon }) => (
  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 transition-colors hover:bg-slate-100/70">
    <div className="flex items-center gap-2 mb-1.5">
      {icon && <span className="text-blue-500">{icon}</span>}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    </div>
    <p className={`text-sm ${highlight ? 'font-bold text-blue-600 text-[15px]' : 'font-semibold text-slate-800'}`}>{value}</p>
  </div>
)

const Stat = ({ label, value, icon, highlight }) => (
  <div className="flex items-center justify-between py-2 text-sm group">
    <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
      {icon && <span className="text-slate-400">{icon}</span>} {label}
    </span>
    <span className={`font-semibold text-right ${highlight ? 'bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded' : 'text-slate-800'}`}>
      {value}
    </span>
  </div>
)

const Input = ({ label, value, readOnly }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
    <input
      type="text"
      value={value}
      readOnly={readOnly}
      className={`w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${readOnly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white hover:border-slate-300'}`}
    />
  </label>
)

const Select = ({ label, name, value, onChange, options }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm font-semibold text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
        <ChevronDown size={16} className="text-slate-400" />
      </div>
    </div>
  </label>
)

const Textarea = ({ label, name, value, onChange }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={3}
      className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      placeholder="Nhập ghi chú hoặc lý do thay đổi..."
    />
  </label>
)

export default ManagerSlots
