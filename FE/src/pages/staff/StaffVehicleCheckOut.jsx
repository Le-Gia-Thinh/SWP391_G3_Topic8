// src/pages/Staff/StaffVehicleCheckOut.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronRight, Search, FileSearch, AlertTriangle, AlertCircle,
  RefreshCcw, Loader2, Car, Clock, ArrowUp, ArrowDown,
  ArrowUpDown, X, SlidersHorizontal, Receipt, MapPin, TrendingUp
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import staffApi from '../../apis/staffApi'

// ── Helpers ─────────────────────────────────────────────
const formatVND = (v) => Number(v || 0).toLocaleString('vi-VN') + ' đ'

const calcDurationMinutes = (entryTime) => {
  if (!entryTime) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(entryTime).getTime()) / 60000))
}

const formatDuration = (entryTime) => {
  const diff = calcDurationMinutes(entryTime)
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return h === 0 ? `${m} phút` : `${h}h ${m}m`
}

const formatTime = (dt) => {
  if (!dt) return '—'
  const d = new Date(dt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} - ${d.getDate()} Th${d.getMonth() + 1}`
}

// ── Sort & Filter ─────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới vào nhất', icon: ArrowDown },
  { value: 'oldest', label: 'Cũ vào nhất', icon: ArrowUp },
  { value: 'duration_desc', label: 'Lâu nhất', icon: ArrowDown },
  { value: 'duration_asc', label: 'Ngắn nhất', icon: ArrowUp },
  { value: 'plate', label: 'Biển số A→Z', icon: ArrowUpDown },
  { value: 'fee_desc', label: 'Phí cao nhất', icon: ArrowDown }
]

const VEHICLE_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả loại xe' },
  { value: '1', label: 'Xe máy' },
  { value: '2', label: 'Ô tô' },
  { value: '3', label: 'Xe tải' }
]

function sortSessions(list, key) {
  const arr = [...list]
  switch (key) {
    case 'newest': return arr.sort((a, b) => new Date(b.EntryTime) - new Date(a.EntryTime))
    case 'oldest': return arr.sort((a, b) => new Date(a.EntryTime) - new Date(b.EntryTime))
    case 'duration_desc': return arr.sort((a, b) => calcDurationMinutes(b.EntryTime) - calcDurationMinutes(a.EntryTime))
    case 'duration_asc': return arr.sort((a, b) => calcDurationMinutes(a.EntryTime) - calcDurationMinutes(b.EntryTime))
    case 'plate': return arr.sort((a, b) => (a.PlateNumber || '').localeCompare(b.PlateNumber || ''))
    case 'fee_desc': return arr.sort((a, b) => Number(b.Amount || 0) - Number(a.Amount || 0))
    default: return arr
  }
}

// ── Filter Popover ────────────────────────────────────────────
const FilterPopover = ({ vehicleType, setVehicleType, sortKey, setSortKey, onClose }) => (
  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-30 p-4">
    <div className="flex items-center justify-between mb-3">
      <span className="font-bold text-gray-800 text-sm">Lọc & Sắp xếp</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
    </div>

    <p className="text-xs font-bold text-gray-400 uppercase mb-1.5">Loại xe</p>
    <div className="flex flex-col gap-0.5 mb-4">
      {VEHICLE_FILTER_OPTIONS.map(opt => (
        <button key={opt.value}
          onClick={() => { setVehicleType(opt.value); onClose() }}
          className={`text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${vehicleType === opt.value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
        >{opt.label}</button>
      ))}
    </div>

    <p className="text-xs font-bold text-gray-400 uppercase mb-1.5">Sắp xếp theo</p>
    <div className="flex flex-col gap-0.5">
      {SORT_OPTIONS.map(opt => {
        const Icon = opt.icon
        return (
          <button key={opt.value} onClick={() => { setSortKey(opt.value); onClose() }}
            className={`text-left px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${sortKey === opt.value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Icon size={13} /> {opt.label}
          </button>
        )
      })}
    </div>
  </div>
)

// ── Session Card ──────────────────────────────────────────────
const SessionCard = ({ session, onCheckout }) => {
  const isBooking = !!session.BookingCode
  const isUnknown = session.PlateNumber === 'UNKNOWN'
  const durationMin = calcDurationMinutes(session.EntryTime)
  const isOverdue = durationMin >= 180
  const feeDisplay = Number(
    session.FinalAmount != null
      ? session.FinalAmount
      : ((session.PrepaidAmount ?? 0) + (session.SurchargeAmount ?? 0)) || session.Amount || 0
  )

  return (
    <div className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-all p-4 flex flex-col gap-3 ${isOverdue ? 'border-orange-200 hover:border-orange-400' : 'border-gray-100 hover:border-blue-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-blue-600 font-black text-sm shrink-0 font-mono">{session.SessionCode}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${isBooking ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {isBooking ? 'Booking' : 'Vãng lai'}
          </span>
          {isBooking && <span className="text-xs text-purple-500 font-semibold">{session.BookingCode}</span>}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full shrink-0 ${isOverdue ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
          <Clock size={11} /> {formatDuration(session.EntryTime)}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${isUnknown ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-white'}`}>
          <Car size={13} />
          <span className="font-black text-sm tracking-wider">{isUnknown ? '? KHÔNG RÕ ?' : session.PlateNumber}</span>
        </div>
        <span className="text-xs text-gray-500 font-medium">{session.VehicleName}</span>
      </div>

      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-1.5"><MapPin size={11} className="text-gray-400 shrink-0" /><span className="font-semibold">{session.SlotCode}</span><span className="text-gray-400 truncate">· {session.ZoneName} · {session.FloorName} · {session.BuildingName}</span></div>
        <div className="flex items-center gap-1.5"><Clock size={11} className="text-gray-400 shrink-0" /> <span>Vào: {formatTime(session.EntryTime)}</span></div>
        <div className="flex items-center gap-1.5 truncate"><span className="text-gray-400">Khách:</span> <span className="font-medium truncate">{session.DriverName}</span> {session.PhoneNumber && <span className="text-gray-400 ml-1">{session.PhoneNumber}</span>}</div>
      </div>

      <div className="bg-blue-50 rounded-lg px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-blue-600 font-semibold">Phí hiện tại</span>
        <span className="font-black text-blue-800 text-sm">{feeDisplay > 0 ? formatVND(feeDisplay) : '—'}</span>
      </div>

      <button onClick={() => onCheckout(session)}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2">
        <Receipt size={14} /> Thanh toán & Ra xe
      </button>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────
const StaffVehicleCheckOut = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [sessions, setSessions] = useState([])
  const [allSessions, setAllSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [vehicleType, setVehicleType] = useState('all')
  const [sortKey, setSortKey] = useState('newest')
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({ fromDate: '', toDate: '' }) // ✅ thêm state filters
  const filterRef = useRef(null)

  useEffect(() => {
    const h = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilter(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const loadActive = useCallback(async () => {
    setLoading(true)
    try {
      const res = await staffApi.searchSessions({ status: 'Active' })
      const raw = res?.data ?? res ?? []
      const data = Array.isArray(raw) ? raw : []
      setAllSessions(data)
      setSessions(data)
      setSearched(true)
    } catch (err) {
      console.error('loadActive error:', err)
      toast.error('Không tải được danh sách phiên đỗ xe')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadActive() }, [loadActive])

  // ── handle search với filter keyword + date ──
  const handleSearch = () => {
    const kw = query.trim().toLowerCase()
    const filtered = allSessions.filter(s => {
      const entry = new Date(s.EntryTime)
      const from = filters.fromDate ? new Date(filters.fromDate) : null
      const to = filters.toDate ? new Date(filters.toDate) : null

      const dateMatch = (!from || entry >= from) && (!to || entry <= to)
      const keywordMatch =
        String(s.SessionID || '').toLowerCase().includes(kw) ||
        (s.SessionCode || '').toLowerCase().includes(kw) ||
        (s.PlateNumber || '').toLowerCase().includes(kw) ||
        (s.DriverName || '').toLowerCase().includes(kw) ||
        (s.BookingCode || '').toLowerCase().includes(kw) ||
        (s.SlotCode || '').toLowerCase().includes(kw) ||
        (s.PhoneNumber || '').toLowerCase().includes(kw)

      return dateMatch && keywordMatch
    })
    setSessions(filtered)
    setSearched(true)
    if (filtered.length === 0) toast.info('Không tìm thấy phiên nào khớp với từ khóa')
  }

  const handleReset = () => {
    setQuery('')
    setVehicleType('all')
    setSortKey('newest')
    setFilters({ fromDate: '', toDate: '' })
    loadActive()
  }

  // ── Client-side filter + sort + map Amount FE/BE đồng bộ ──
  const displayed = sortSessions(
    (vehicleType === 'all' ? sessions : sessions.filter(s => String(s.VehicleTypeID) === vehicleType))
      .map(s => ({
        ...s,
        Amount: s.FinalAmount != null
          ? s.FinalAmount
          : ((s.PrepaidAmount ?? 0) + (s.SurchargeAmount ?? 0)) || s.Amount || 0
      })),
    sortKey
  )

  const activeFilters = (vehicleType !== 'all' ? 1 : 0) + (sortKey !== 'newest' ? 1 : 0)
  const totalFee = displayed.reduce((sum, s) => sum + Number(s.Amount || 0), 0)


  return (
    <div className="flex flex-col h-full bg-gray-50 pb-12">
      {/* Breadcrumb */}
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <span>Nhân viên</span><ChevronRight size={14} />
        <span>Thanh toán</span><ChevronRight size={14} />
        <span className="text-blue-600 font-medium">Vehicle Check-out</span>
      </div>

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Vehicle Check-out</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-sm font-medium">
          Đồng bộ: Hoàn tất (Online)
          <span className="w-2 h-2 rounded-full bg-green-500 ml-1 animate-pulse" />
        </div>
      </header>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Main column */}
        <div className="flex-[3] flex flex-col gap-5 min-h-0">

          {/* Search bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-1">
              <FileSearch size={18} className="text-blue-600" /> Tìm kiếm phiên gửi xe
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Tìm theo:{' '}
              <span className="font-semibold text-gray-700">Mã phiên (SS-XXXXX)</span> ·{' '}
              <span className="font-semibold text-gray-700">Mã booking (BK-XXXX)</span> ·{' '}
              <span className="font-semibold text-gray-700">Biển số</span> ·{' '}
              <span className="font-semibold text-gray-700">Tên khách</span>
            </p>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="SS-01005, BK-0102, 61A-123.45, Tên khách..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
                {query && (
                  <button onClick={handleReset} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Filter dropdown */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilter(v => !v)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${activeFilters > 0
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <SlidersHorizontal size={15} /> Lọc & Sắp xếp
                  {activeFilters > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-black">
                      {activeFilters}
                    </span>
                  )}
                </button>
                {showFilter && (
                  <FilterPopover
                    vehicleType={vehicleType} setVehicleType={setVehicleType}
                    sortKey={sortKey} setSortKey={setSortKey}
                    onClose={() => setShowFilter(false)}
                  />
                )}
              </div>

              <button onClick={handleSearch} disabled={loading}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                Tìm phiên hoạt động
              </button>

              <button onClick={handleReset} disabled={loading}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5">
                <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
              </button>
            </div>

            {/* Active filter chips */}
            {activeFilters > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {vehicleType !== 'all' && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {VEHICLE_FILTER_OPTIONS.find(o => o.value === vehicleType)?.label}
                    <button onClick={() => setVehicleType('all')}><X size={10} /></button>
                  </span>
                )}
                {sortKey !== 'newest' && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {SORT_OPTIONS.find(o => o.value === sortKey)?.label}
                    <button onClick={() => setSortKey('newest')}><X size={10} /></button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Result count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-700">Danh sách Phiên đang hoạt động</h3>
              {searched && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {displayed.length} phiên
                </span>
              )}
            </div>
            {displayed.length > 0 && totalFee > 0 && (
              <span className="text-xs text-gray-500">
                Tổng phí ghi nhận:{' '}
                <span className="font-black text-gray-800">{formatVND(totalFee)}</span>
              </span>
            )}
          </div>

          {/* Scrollable card grid */}
          <div className="overflow-y-auto flex-1 pr-1 pb-4" style={{ maxHeight: 'calc(100vh - 380px)' }}>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-blue-500" size={28} />
                  <p className="text-sm text-gray-400">Đang tải danh sách...</p>
                </div>
              </div>
            ) : displayed.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayed.map(session => (
                  <SessionCard
                    key={session.SessionID}
                    session={session}
                    onCheckout={(s) => navigate(`/staff/checkout/${s.SessionID}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center text-center bg-gray-50">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-400 mb-4 shadow-sm">
                  <Search size={24} />
                </div>
                <h4 className="text-base font-bold text-gray-800 mb-2">
                  {query
                    ? `Không tìm thấy phiên khớp với "${query}"`
                    : 'Không có phiên đỗ xe nào đang hoạt động'}
                </h4>
                <p className="text-sm text-gray-500 max-w-md mb-5">
                  Kiểm tra lại Biển số xe / Mã Phiên / Mã Booking. Nếu xe đang ở cổng nhưng không có trong hệ thống, hãy tạo Báo cáo Sự cố.
                </p>
                <div className="flex gap-3">
                  <button onClick={handleReset}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-50">
                    <Search size={15} /> Thử lại
                  </button>
                  <button onClick={() => navigate('/staff/create-incident')}
                    className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-100">
                    <AlertTriangle size={15} /> Tạo Báo cáo sự cố
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
            <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
              <ChevronRight size={16} className="text-blue-500" /> Hướng dẫn xử lý
            </h3>
            <ul className="space-y-4 text-sm text-blue-800">
              {[
                'Tìm bằng Biển số, Mã phiên (SS-XXXXX) hoặc Mã booking (BK-XXXX).',
                'Luôn đối chiếu biển số thực tế với hệ thống trước khi tính tiền.',
                'Phí cuối cùng do server tính khi bấm Thanh toán — không cần tính tay.'
              ].map((txt, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">{i + 1}</span>
                  <span>{txt}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 bg-white rounded-lg p-4 border border-red-200 flex items-start gap-3 shadow-sm">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-800 mb-1">Không tìm thấy phiên?</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Khách bị mất thẻ hoặc biển số mờ/thay đổi lúc check-in. Hỏi lại hoặc tạo báo cáo sự cố.
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Thống kê nhanh</p>
            <div className="space-y-2.5 text-sm">
              {[
                { label: 'Tổng đang đỗ', value: allSessions.length, color: 'text-gray-800' },
                { label: 'Walk-in', value: allSessions.filter(s => !s.BookingCode).length, color: 'text-blue-600' },
                { label: 'Booking', value: allSessions.filter(s => !!s.BookingCode).length, color: 'text-purple-600' },
                { label: 'Đang hiển thị', value: displayed.length, color: 'text-gray-800' }
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
              {totalFee > 0 && (
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1"><TrendingUp size={12} /> Tổng phí ghi nhận</span>
                  <span className="font-black text-green-700 text-xs">{formatVND(totalFee)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center justify-between px-6 py-2.5 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" /> reading: Smart_Cam_01
            </span>
            <span>ID Sync record: #440019299</span>
          </div>
          <div className="flex gap-4">
            <span>Local Network: Connected</span>
            <a href="#" className="text-blue-600 hover:underline">Verify last sync record</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffVehicleCheckOut