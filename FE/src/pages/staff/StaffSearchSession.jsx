import React, { useState } from 'react'
import { Search, Car, Clock, MapPin, ChevronRight, CheckCircle2, XCircle, AlertTriangle, RefreshCcw, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const MOCK_SESSIONS = [
  {
    id: 'PS-20240518-0012',
    plate: '51H-999.88',
    vehicle: 'Ô tô 4 chỗ',
    type: 'Vãng lai',
    typeColor: 'bg-gray-100 text-gray-600',
    slot: 'A-102',
    gate: 'Gate 02',
    checkIn: '18/05/2026 14:30',
    checkOut: null,
    status: 'active',
    staff: 'Nguyễn Văn An'
  },
  {
    id: 'PS-20240518-0010',
    plate: '30A-997.21',
    vehicle: 'Ô tô 7 chỗ',
    type: 'Booking',
    typeColor: 'bg-blue-50 text-blue-600',
    slot: 'B-112',
    gate: 'Gate 01',
    checkIn: '18/05/2026 10:42',
    checkOut: '18/05/2026 13:15',
    status: 'completed',
    staff: 'Nguyễn Văn An'
  },
  {
    id: 'PS-20240518-0008',
    plate: '43A-552.12',
    vehicle: 'Xe máy',
    type: 'Vãng lai',
    typeColor: 'bg-gray-100 text-gray-600',
    slot: 'M-005',
    gate: 'Gate 03',
    checkIn: '18/05/2026 09:15',
    checkOut: '18/05/2026 11:50',
    status: 'completed',
    staff: 'Trần Minh Hòa'
  },
  {
    id: 'PS-20240517-0099',
    plate: '29D-111.90',
    vehicle: 'Bán tải',
    type: 'Vãng lai',
    typeColor: 'bg-gray-100 text-gray-600',
    slot: 'C-010',
    gate: 'Gate 01',
    checkIn: '17/05/2026 08:00',
    checkOut: '17/05/2026 17:30',
    status: 'completed',
    staff: 'Lê Thị Hoa'
  },
  {
    id: 'PS-20240518-0015',
    plate: '51G-888.77',
    vehicle: 'Ô tô 4 chỗ',
    type: 'Booking',
    typeColor: 'bg-blue-50 text-blue-600',
    slot: 'A-008',
    gate: 'Gate 01',
    checkIn: '18/05/2026 15:00',
    checkOut: null,
    status: 'active',
    staff: 'Nguyễn Văn An'
  }
]

const STATUS_CONFIG = {
  active:    { label: 'Đang đỗ', icon: <Clock size={14} />, color: 'bg-green-50 text-green-700 border-green-200' },
  completed: { label: 'Đã hoàn thành', icon: <CheckCircle2 size={14} />, color: 'bg-gray-100 text-gray-600 border-gray-200' },
  incident:  { label: 'Sự cố', icon: <AlertTriangle size={14} />, color: 'bg-red-50 text-red-600 border-red-200' }
}

const StaffSearchSession = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedSession, setSelectedSession] = useState(null)

  const filtered = MOCK_SESSIONS.filter(s => {
    const matchQuery =
      query === '' ||
      s.plate.toLowerCase().includes(query.toLowerCase()) ||
      s.id.toLowerCase().includes(query.toLowerCase())
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchQuery && matchStatus
  })

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Search size={24} className="text-blue-600" /> Tra cứu Phiên gửi xe
          </h1>
          <p className="text-sm text-gray-500 mt-1">Tìm kiếm lịch sử vào/ra theo biển số hoặc mã phiên</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
          <RefreshCcw size={15} /> Làm mới
        </button>
      </header>

      {/* Search bar + filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nhập biển số (vd: 51H-999.88) hoặc mã phiên (vd: PS-2024...)..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3">
            <Filter size={15} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none py-2 pr-2"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang đỗ</option>
              <option value="completed">Đã hoàn thành</option>
            </select>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex gap-6 mt-3 pt-3 border-t border-gray-100 text-sm">
          <span className="text-gray-500">Kết quả: <strong className="text-gray-800">{filtered.length}</strong> phiên</span>
          <span className="text-green-600 font-medium">● {filtered.filter(s => s.status === 'active').length} đang đỗ</span>
          <span className="text-gray-500 font-medium">● {filtered.filter(s => s.status === 'completed').length} hoàn thành</span>
        </div>
      </div>

      {/* Results + Detail */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* List */}
        <div className="flex-1 min-w-0 space-y-3 overflow-auto pr-1">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Search size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Không tìm thấy phiên nào phù hợp</p>
              <p className="text-sm text-gray-400 mt-1">Thử tìm bằng biển số hoặc mã phiên khác</p>
            </div>
          ) : (
            filtered.map(session => {
              const stCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.completed
              const isSelected = selectedSession?.id === session.id
              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(isSelected ? null : session)}
                  className={`w-full text-left bg-white rounded-xl border transition-all hover:shadow-md p-5 ${
                    isSelected ? 'border-blue-400 shadow-md ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 rounded-xl">
                        <Car size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-gray-900 tracking-wide">{session.plate}</p>
                        <p className="text-xs text-gray-500">{session.vehicle} · {session.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${session.typeColor}`}>{session.type}</span>
                      <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full border ${stCfg.color}`}>
                        {stCfg.icon} {stCfg.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400 font-semibold uppercase mb-0.5">Ô đỗ</p>
                      <p className="font-bold text-blue-600">{session.slot}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase mb-0.5">Cổng</p>
                      <p className="font-bold text-gray-800">{session.gate}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase mb-0.5">Giờ vào</p>
                      <p className="font-bold text-gray-800">{session.checkIn}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-semibold uppercase mb-0.5">Giờ ra</p>
                      <p className={`font-bold ${session.checkOut ? 'text-gray-800' : 'text-green-600'}`}>
                        {session.checkOut || '— Đang đỗ'}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-blue-100 flex justify-end">
                      <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                        Xem chi tiết bên phải <ChevronRight size={12} />
                      </span>
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Detail panel */}
        <div className="w-72 flex flex-col gap-4">
          {selectedSession ? (
            <>
              {/* Session card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-600 uppercase mb-4 border-b pb-2">Chi tiết phiên</h3>
                <div className="text-center mb-4">
                  <p className="text-2xl font-black text-gray-900 tracking-widest">{selectedSession.plate}</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedSession.vehicle}</p>
                </div>

                <div className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-bold mb-5 border ${STATUS_CONFIG[selectedSession.status]?.color}`}>
                  {STATUS_CONFIG[selectedSession.status]?.icon}
                  {STATUS_CONFIG[selectedSession.status]?.label}
                </div>

                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Mã phiên', value: selectedSession.id },
                    { label: 'Loại phiên', value: selectedSession.type },
                    { label: 'Ô đỗ', value: selectedSession.slot },
                    { label: 'Cổng vào', value: selectedSession.gate },
                    { label: 'Giờ vào', value: selectedSession.checkIn },
                    { label: 'Giờ ra', value: selectedSession.checkOut || '— Đang đỗ' },
                    { label: 'Nhân viên', value: selectedSession.staff }
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-start">
                      <span className="text-gray-400 font-semibold">{label}</span>
                      <span className="font-bold text-gray-800 text-right max-w-[55%]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Thao tác nhanh</h3>
                {selectedSession.status === 'active' && (
                  <button
                    onClick={() => navigate('/staff/checkout')}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <MapPin size={15} /> Tiến hành Check-out
                  </button>
                )}
                <button
                  onClick={() => navigate('/staff/create-incident')}
                  className="w-full py-2.5 bg-white hover:bg-red-50 text-red-600 font-bold rounded-lg text-sm border border-red-200 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={15} /> Báo cáo sự cố
                </button>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold rounded-lg text-sm border border-gray-200 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <Search size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Chọn một phiên để xem chi tiết và thao tác</p>
            </div>
          )}

          {/* Summary card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Hôm nay</h3>
            <div className="space-y-2">
              {[
                { label: 'Tổng phiên', value: MOCK_SESSIONS.length, color: 'text-gray-800' },
                { label: 'Đang đỗ', value: MOCK_SESSIONS.filter(s => s.status === 'active').length, color: 'text-green-600' },
                { label: 'Đã hoàn thành', value: MOCK_SESSIONS.filter(s => s.status === 'completed').length, color: 'text-gray-500' }
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className={`text-sm font-black ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffSearchSession
