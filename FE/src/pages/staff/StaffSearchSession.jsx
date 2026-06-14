import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, XCircle, Car, Clock, MapPin, CheckCircle2, AlertTriangle, Calendar, User, Hash, Tag } from 'lucide-react'
import staffApi from '../../apis/staffApi'

const STATUS_CONFIG = {
  active: { label: 'Đang đỗ', icon: <Clock size={14} />, color: 'bg-green-50 text-green-700 border-green-200' },
  completed: { label: 'Đã hoàn thành', icon: <CheckCircle2 size={14} />, color: 'bg-gray-100 text-gray-600 border-gray-200' },
  reserved: { label: 'Đã đặt', icon: <Calendar size={14} />, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  incident: { label: 'Sự cố', icon: <AlertTriangle size={14} />, color: 'bg-red-50 text-red-600 border-red-200' }
}

const STATUS_MAP = { active: 'Active', completed: 'Completed', reserved: 'Reserved', all: undefined }

function normalizeStatus(raw = '') {
  const s = raw.toLowerCase().trim()
  if (s === 'active') return 'active'
  if (s === 'completed') return 'completed'
  if (s === 'reserved') return 'reserved'
  return s
}

function safeLower(val) {
  if (val === null || val === undefined) return ''
  return String(val).toLowerCase()
}

function normalizeRow(s) {
  const isReservation = !s.SessionID && s.ReservationID
  const status = normalizeStatus(s.SessionStatus || s.ReservationStatus || '')
  return {
    _key: isReservation ? `rsv-${s.ReservationID}` : `sess-${s.SessionID}`,
    id: s.SessionID || s.ReservationID || '',
    sessionCode: s.SessionCode || '',
    bookingCode: s.BookingCode || '',
    plate: s.PlateNumber || '—',
    status,
    type: s.BookingCode ? 'Booking' : 'Vãng lai',
    vehicle: s.VehicleName || '',
    vehicleCode: s.VehicleCode || '',
    gate: s.SlotCode || '',
    checkIn: s.EntryTime ? new Date(s.EntryTime).toLocaleString('vi-VN')
      : s.StartTime ? new Date(s.StartTime).toLocaleString('vi-VN') : '',
    checkOut: s.ExitTime ? new Date(s.ExitTime).toLocaleString('vi-VN')
      : s.EndTime && status !== 'active' && status !== 'reserved'
        ? new Date(s.EndTime).toLocaleString('vi-VN') : null,
    staff: s.DriverName || '',
    phone: s.PhoneNumber || '',
    _rawCheckIn: s.EntryTime || s.StartTime || ''
  }
}

const StaffSearchSession = () => {
  const [sessions, setSessions] = useState([])
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ status: 'all', type: 'all', vehicle: 'all', gate: 'all', date: '' })
  const [selectedSession, setSelectedSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Dùng ref để đọc filters.status mà không gây eslint warning
  const statusRef = useRef(filters.status)
  useEffect(() => { statusRef.current = filters.status }, [filters.status])

  // ✅ inline effect + cancelled flag — refetch khi status thay đổi
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const params = { status: STATUS_MAP[statusRef.current] }
        const res = await staffApi.searchSessions(params)
        if (!cancelled) {
          const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
          setSessions(raw.map(normalizeRow))
        }
      } catch (err) {
        if (!cancelled) console.error('searchSessions error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [filters.status]) // ✅ deps trực tiếp, không cần fetchSessions callback

  const vehicleOptions = useMemo(() => [...new Set(sessions.map(s => s.vehicle).filter(Boolean))], [sessions])
  const gateOptions = useMemo(() => [...new Set(sessions.map(s => s.gate).filter(Boolean))], [sessions])

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
  const clearFilters = () => { setFilters({ status: 'all', type: 'all', vehicle: 'all', gate: 'all', date: '' }); setQuery('') }

  const filtered = useMemo(() => {
    const q = safeLower(query)
    return sessions.filter(s => {
      if (q &&
        !safeLower(s.plate).includes(q) && !safeLower(s.id).includes(q) &&
        !safeLower(s.sessionCode).includes(q) && !safeLower(s.bookingCode).includes(q) &&
        !safeLower(s.staff).includes(q)) return false
      if (filters.type !== 'all' && s.type !== filters.type) return false
      if (filters.vehicle !== 'all' && s.vehicle !== filters.vehicle) return false
      if (filters.gate !== 'all' && s.gate !== filters.gate) return false
      if (filters.date && s._rawCheckIn) {
        if (s._rawCheckIn.slice(0, 10) !== filters.date) return false
      }
      return true
    })
  }, [sessions, query, filters])

  const selectSession = session => setSelectedSession(prev => (prev?._key === session._key ? null : session))

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-3 mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2 pl-2 whitespace-nowrap">
          <Search size={20} className="text-blue-600" /> Tra cứu
        </h1>
        <div className="flex-1 min-w-50 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Biển số, mã phiên, mã booking, tài xế..."
            className="w-full pl-12 pr-10 py-2.5 rounded-full bg-slate-50 border border-transparent focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-50 transition-all text-sm outline-none" />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <XCircle size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-300">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang đỗ</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="reserved">Đã đặt</option>
          </select>
          <select value={filters.type} onChange={e => handleFilterChange('type', e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-300">
            <option value="all">Tất cả loại</option>
            <option value="Booking">Booking</option>
            <option value="Vãng lai">Vãng lai</option>
          </select>
          {vehicleOptions.length > 0 && (
            <select value={filters.vehicle} onChange={e => handleFilterChange('vehicle', e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-300">
              <option value="all">Tất cả xe</option>
              {vehicleOptions.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          )}
          {gateOptions.length > 0 && (
            <select value={filters.gate} onChange={e => handleFilterChange('gate', e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-300">
              <option value="all">Tất cả slot</option>
              {gateOptions.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          )}
          <input type="date" value={filters.date} onChange={e => handleFilterChange('date', e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-300" />
          <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap">Xóa bộ lọc</button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex-1 min-w-0 space-y-3 overflow-auto pr-1 pb-4">
          {loading ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 flex flex-col items-center justify-center h-full">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-gray-400 text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center h-full flex flex-col justify-center items-center">
              <Search size={48} className="text-gray-200 mb-4" />
              <p className="text-gray-600 font-bold text-lg">Không tìm thấy phiên nào</p>
              <p className="text-gray-400 text-sm mt-1">Thử thay đổi từ khóa hoặc bộ lọc</p>
            </div>
          ) : (
            filtered.map(session => {
              const stCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.completed
              const isSelected = selectedSession?._key === session._key
              return (
                <div key={session._key} role="button" tabIndex={0}
                  onClick={() => selectSession(session)} onKeyDown={e => e.key === 'Enter' && selectSession(session)}
                  className={`w-full text-left bg-white rounded-2xl border transition-all hover:shadow-md p-5 cursor-pointer outline-none ${isSelected ? 'border-blue-400 shadow-md ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`shrink-0 p-3 rounded-2xl ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-50 text-blue-600'}`}>
                        <Car size={24} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl font-black text-gray-900 tracking-wide leading-none whitespace-nowrap">{session.plate}</div>
                        <div className="text-xs font-semibold text-gray-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
                          {session.sessionCode && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{session.sessionCode}</span>}
                          {session.bookingCode && <span className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-500">{session.bookingCode}</span>}
                          {session.vehicle && (<><span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" /><span>{session.vehicle}</span></>)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${session.type === 'Booking' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-gray-200 text-gray-600'}`}>{session.type}</span>
                      <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border ${stCfg.color}`}>{stCfg.icon} {stCfg.label}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div><div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Vị trí (Slot)</div><div className="font-black text-blue-600">{session.gate || '—'}</div></div>
                    <div><div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Tài xế</div><div className="font-bold text-gray-700 truncate">{session.staff || '—'}</div></div>
                    <div><div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Thời gian vào</div><div className="font-bold text-gray-700">{session.checkIn || '—'}</div></div>
                    <div>
                      <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Thời gian ra</div>
                      <div className={`font-bold ${session.checkOut ? 'text-gray-700' : 'text-green-600'}`}>
                        {session.checkOut ? session.checkOut : (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse block" />
                            {session.status === 'reserved' ? 'Chưa vào' : 'Đang đỗ'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="w-80 flex flex-col gap-4 pb-4 shrink-0">
          {selectedSession ? <DetailPanel session={selectedSession} /> : (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 text-center h-full flex flex-col justify-center items-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4"><Search size={28} className="text-blue-300" /></div>
              <p className="text-gray-800 font-bold mb-1">Xem chi tiết phiên</p>
              <p className="text-xs text-gray-400 leading-relaxed">Hãy click chọn một phiên gửi xe ở danh sách bên trái để xem thông tin chi tiết.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailPanel({ session }) {
  const stCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.completed
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="bg-blue-600 p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
          <Car size={64} className="text-white transform rotate-12 scale-150 translate-x-4 -translate-y-4" />
        </div>
        <h3 className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em] mb-2 relative z-10">Chi tiết phiên gửi xe</h3>
        <p className="text-2xl font-black text-white tracking-widest relative z-10 drop-shadow-md break-all leading-tight px-2" title={session.plate}>{session.plate}</p>
        {session.vehicle && <p className="text-sm font-medium text-blue-100 mt-1 relative z-10">{session.vehicle}</p>}
      </div>
      <div className="p-5 overflow-auto">
        <div className={`flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold mb-5 border ${stCfg.color}`}>{stCfg.icon} {stCfg.label}</div>
        <div className="space-y-4">
          <div className="space-y-2 border-b border-gray-100 pb-4">
            {session.sessionCode && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Hash size={10} /> Mã phiên</span>
                <span className="text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded font-mono">{session.sessionCode}</span>
              </div>
            )}
            {session.bookingCode && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Tag size={10} /> Mã booking</span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-mono">{session.bookingCode}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4">
            <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Loại</p><p className="text-sm font-bold text-gray-800">{session.type}</p></div>
            <div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Vị trí đỗ</p><p className="text-sm font-black text-blue-600">{session.gate || '—'}</p></div>
          </div>
          <div className="space-y-3 border-b border-gray-100 pb-4 text-sm">
            {[['Vào', session.checkIn], ['Ra', null]].map(([label]) => null)}
            <div className="flex justify-between items-center gap-2">
              <span className="text-gray-500 font-medium flex items-center gap-2 shrink-0"><MapPin size={14} /> Slot</span>
              <span className="font-bold text-gray-800">{session.gate || '—'}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-gray-500 font-medium flex items-center gap-2 shrink-0"><Clock size={14} /> Vào</span>
              <span className="font-bold text-gray-800 text-right">{session.checkIn || '—'}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-gray-500 font-medium flex items-center gap-2 shrink-0"><Clock size={14} /> Ra</span>
              <span className="font-bold text-gray-800 text-right">
                {session.checkOut || (
                  <span className={`flex items-center gap-1 justify-end ${session.status === 'reserved' ? 'text-orange-500' : 'text-green-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse block ${session.status === 'reserved' ? 'bg-orange-400' : 'bg-green-500'}`} />
                    {session.status === 'reserved' ? 'Chưa vào' : 'Đang đỗ'}
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="space-y-2 pt-1 text-sm">
            <div className="flex justify-between items-center gap-2">
              <span className="text-gray-500 font-medium flex items-center gap-2"><User size={14} /> Tài xế</span>
              <span className="font-bold text-gray-800 text-right">{session.staff || '—'}</span>
            </div>
            {session.phone && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-500 font-medium flex items-center gap-2"><User size={14} /> SĐT</span>
                <span className="font-bold text-gray-800">{session.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffSearchSession