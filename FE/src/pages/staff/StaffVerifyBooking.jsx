import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar, Search, ShieldCheck,
  AlertCircle, XCircle, FileText, RefreshCcw,
  Loader2, Clock, CheckCircle2, User, MapPin,
  Car, Phone, Hash, ArrowRight, History, ListChecks
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import staffApi from '../../apis/staffApi'

// ── Helpers ───────────────────────────────────────────────────
const formatDateTime = (dt) => {
  if (!dt) return '—'
  const d = new Date(dt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${d.getDate()} Th${d.getMonth() + 1} ${d.getFullYear()}`
}

const getTimeRemaining = (endTime) => {
  if (!endTime) return null
  const diff = Math.floor((new Date(endTime) - Date.now()) / 60000)
  if (diff <= 0) return { label: 'Đã hết hạn', type: 'error' }
  if (diff <= 60) return { label: `Còn ${diff} phút`, type: 'warning' }
  const h = Math.floor(diff / 60); const m = diff % 60
  return { label: `Còn ${h}h ${m}m`, type: 'ok' }
}

const STATUS_CONFIG = {
  Reserved: { label: 'Chờ xác thực', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  Completed: { label: 'Đã check-in', color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  Expired: { label: 'Hết hạn', color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
  Cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' }
}

// ── Booking Row Card (dùng trong list) ────────────────────────
const BookingRow = ({ booking, onSelect, isSelected }) => {
  const cfg = STATUS_CONFIG[booking.ReservationStatus] || STATUS_CONFIG.Cancelled
  const tr = getTimeRemaining(booking.EndTime)

  return (
    <button
      onClick={() => onSelect(booking)}
      className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-md ${isSelected
        ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100 shadow-md'
        : 'border-gray-200 bg-white hover:border-blue-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-black text-blue-600 font-mono text-sm shrink-0">{booking.BookingCode}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        {tr && (
          <span className={`text-xs font-bold shrink-0 px-2 py-0.5 rounded-full ${tr.type === 'error' ? 'bg-red-50 text-red-600' :
            tr.type === 'warning' ? 'bg-yellow-50 text-yellow-600' :
              'bg-gray-50 text-gray-500'
          }`}>
            <Clock size={10} className="inline mr-0.5" />{tr.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
        <div className="flex items-center gap-1 truncate">
          <User size={11} className="text-gray-400 shrink-0" />
          <span className="truncate font-medium">{booking.DriverName}</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <Car size={11} className="text-gray-400 shrink-0" />
          <span className="truncate">{booking.VehicleName}</span>
        </div>
        <div className="flex items-center gap-1 truncate">
          <MapPin size={11} className="text-gray-400 shrink-0" />
          <span className="truncate font-semibold text-blue-600">{booking.SlotCode || '—'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <span className="text-[11px] text-gray-400">
          {formatDateTime(booking.StartTime)} → {formatDateTime(booking.EndTime)}
        </span>
        <ArrowRight size={14} className={`shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-300'}`} />
      </div>
    </button>
  )
}

// ── Detail Panel ──────────────────────────────────────────────
const BookingDetailPanel = ({ booking, onCheckIn, checking, onClose }) => {
  const navigate = useNavigate()
  const tr = getTimeRemaining(booking.EndTime)
  const isValid = booking.ReservationStatus === 'Reserved'
  const isExpired = tr?.type === 'error'
  const cfg = STATUS_CONFIG[booking.ReservationStatus] || STATUS_CONFIG.Cancelled

  const validations = [
    {
      label: 'Trạng thái đặt chỗ',
      value: isValid ? 'Booking còn hiệu lực' : cfg.label,
      status: isValid ? 'ok' : 'error'
    },
    {
      label: 'Vị trí bãi đỗ',
      value: booking.SlotCode
        ? `Slot ${booking.SlotCode}${booking.SlotStatus ? ` · ${booking.SlotStatus}` : ''}`
        : 'Chưa có slot',
      status: booking.SlotCode ? 'ok' : 'warning'
    },
    {
      label: 'Loại phương tiện',
      value: booking.VehicleName || '—',
      status: 'ok'
    },
    {
      label: 'Khu vực / Tầng',
      value: [booking.ZoneName, booking.FloorName].filter(Boolean).join(' · ') || '—',
      status: booking.SlotCode ? 'ok' : 'warning'
    },
    {
      label: 'Thời gian hiệu lực',
      value: tr?.label || '—',
      status: tr?.type || 'ok'
    }
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* Header card */}
      <div className={`rounded-xl p-5 border ${isExpired || !isValid ? 'bg-red-50 border-red-200' : 'bg-blue-600 border-blue-500'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isExpired || !isValid ? 'text-red-400' : 'text-blue-200'}`}>
              Mã đặt chỗ
            </p>
            <p className={`text-2xl font-black tracking-wider ${isExpired || !isValid ? 'text-red-700' : 'text-white'}`}>
              {booking.BookingCode}
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
        <div className={`text-sm font-medium ${isExpired || !isValid ? 'text-red-600' : 'text-blue-100'}`}>
          {booking.VehicleName} · Slot {booking.SlotCode || '—'}
        </div>
      </div>

      {/* Info grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông tin chi tiết</p>

        {[
          { icon: User, label: 'Tài xế', value: booking.DriverName },
          { icon: Phone, label: 'SĐT', value: booking.PhoneNumber || '—' },
          { icon: Car, label: 'Phương tiện', value: booking.VehicleName },
          { icon: MapPin, label: 'Vị trí', value: [booking.BuildingName, booking.FloorName, booking.ZoneName, booking.SlotCode].filter(Boolean).join(' · ') || '—' },
          { icon: Hash, label: 'ID hệ thống', value: `#${booking.ReservationID}` },
          { icon: Calendar, label: 'Bắt đầu', value: formatDateTime(booking.StartTime) },
          { icon: Calendar, label: 'Kết thúc', value: formatDateTime(booking.EndTime) }
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start justify-between gap-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold shrink-0 w-24">
              <Icon size={12} /> {label}
            </span>
            <span className="text-xs font-bold text-gray-800 text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Validation */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Kết quả đối soát</p>
        <div className="space-y-3">
          {validations.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">{item.label}</p>
                <p className="text-xs font-bold text-gray-700 truncate">{item.value}</p>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded shrink-0 ${item.status === 'ok' ? 'text-green-600 bg-green-50' :
                item.status === 'warning' ? 'text-yellow-600 bg-yellow-50' :
                  'text-red-600 bg-red-50'
              }`}>
                {item.status === 'ok' ? '✓ Hợp lệ' : item.status === 'warning' ? '⚠ Cảnh báo' : '✗ Không hợp lệ'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {isValid && !isExpired ? (
        <div className="space-y-2.5">
          <button
            onClick={() => onCheckIn(booking)}
            disabled={checking}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-colors flex items-center justify-center gap-2"
          >
            {checking
              ? <><Loader2 size={16} className="animate-spin" /> Đang xử lý...</>
              : <><ShieldCheck size={16} /> Xác nhận cho xe vào</>
            }
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex justify-center items-center gap-1.5 text-sm"
            >
              <XCircle size={15} /> Từ chối
            </button>
            <button
              onClick={() => navigate('/staff/create-incident')}
              className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex justify-center items-center gap-1.5 text-sm"
            >
              <FileText size={15} /> Tạo Sự cố
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">
              {isExpired
                ? 'Booking đã hết hạn. Không thể check-in.'
                : `Trạng thái "${booking.ReservationStatus}" — không thể check-in.`}
            </p>
          </div>
          <button
            onClick={() => navigate('/staff/create-incident')}
            className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex justify-center items-center gap-2 text-sm"
          >
            <FileText size={15} /> Tạo Báo cáo Sự cố
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
const StaffVerifyBooking = () => {
  const navigate = useNavigate()
  const { reservationId } = useParams()

  const [tab, setTab] = useState('pending') // 'pending' | 'history'
  const [pendingList, setPendingList] = useState([])
  const [historyList, setHistoryList] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const [selectedBooking, setSelected] = useState(null)
  const [checking, setChecking] = useState(false)
  const [searchId, setSearchId] = useState('')
  const [setSearchResult] = useState(null)
  const [searching, setSearching] = useState(false)

  // Fetch lists
  const fetchPending = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await staffApi.getBookingQueue({ status: 'Reserved' })
      const data = res?.data ?? res ?? []
      setPendingList(Array.isArray(data) ? data : [])
    } catch { toast.error('Không tải được danh sách chờ xác thực') }
    finally { setLoadingList(false) }
  }, [])

  const fetchHistory = useCallback(async () => {
    setLoadingList(true)
    try {
      const [completed, expired] = await Promise.all([
        staffApi.getBookingQueue({ status: 'Completed' }),
        staffApi.getBookingQueue({ status: 'Expired' })
      ])
      const c = completed?.data ?? completed ?? []
      const e = expired?.data ?? expired ?? []
      const merged = [...(Array.isArray(c) ? c : []), ...(Array.isArray(e) ? e : [])]
        .sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt))
      setHistoryList(merged)
    } catch { toast.error('Không tải được lịch sử') }
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => { fetchPending() }, [fetchPending])
  useEffect(() => { if (tab === 'history') fetchHistory() }, [tab, fetchHistory])

  // Auto-select từ URL param
  useEffect(() => {
    if (!reservationId) return
    staffApi.getBookingDetail(reservationId)
      .then(res => { const d = res?.data ?? res; if (d) setSelected(d) })
      .catch(() => toast.error('Không tìm thấy booking từ URL'))
  }, [reservationId])

  const handleSearch = async () => {
    const id = searchId.trim()
    if (!id) return
    setSearching(true)
    try {
      const res = await staffApi.getBookingDetail(id)
      const d = res?.data ?? res
      if (!d) throw new Error()
      setSearchResult(d)
      setSelected(d)
    } catch { toast.error('Không tìm thấy booking') }
    finally { setSearching(false) }
  }

  const handleCheckIn = async (booking) => {
    setChecking(true)
    try {
      await staffApi.checkInBooking(booking.ReservationID)
      toast.success(`Check-in ${booking.BookingCode} thành công!`)
      navigate('/staff/checkin-success', { state: { actionType: 'booking-checkin' } })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Check-in thất bại')
    } finally { setChecking(false) }
  }

  const currentList = tab === 'pending' ? pendingList : historyList

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24">

      {/* Breadcrumb */}
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <ChevronLeft size={16} className="cursor-pointer" onClick={() => navigate(-1)} />
        <span>Nhân viên</span><ChevronRight size={14} />
        <span className="text-blue-600 font-medium">Xác thực Booking</span>
      </div>

      <header className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold text-gray-800">Xác thực Đặt chỗ</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-sm font-medium">
          CỔNG VÀO: GATE-01 <ShieldCheck size={16} />
        </div>
      </header>

      {/* Quick search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5 flex gap-3 items-center">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          type="text"
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Nhập mã booking (BK-0001) hoặc ID để tra cứu nhanh..."
          className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
        />
        {searchId && (
          <button onClick={() => { setSearchId(''); setSearchResult(null) }} className="text-gray-300 hover:text-gray-500">
            <XCircle size={15} />
          </button>
        )}
        <button
          onClick={handleSearch}
          disabled={searching || !searchId.trim()}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-40 flex items-center gap-1.5 shrink-0"
        >
          {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          Tra cứu
        </button>
      </div>

      {/* Main layout: list + detail */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* Left: Tabs + List */}
        <div className="flex flex-col w-[440px] shrink-0 min-h-0">

          {/* Tabs */}
          <div className="flex bg-white rounded-xl border border-gray-200 shadow-sm p-1 gap-1 mb-4">
            <button
              onClick={() => setTab('pending')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'pending'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <ListChecks size={15} />
              Chờ xác thực
              {pendingList.length > 0 && (
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${tab === 'pending' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
                }`}>
                  {pendingList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <History size={15} />
              Lịch sử
            </button>
          </div>

          {/* Refresh + count */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {tab === 'pending' ? `${pendingList.length} booking đang chờ` : `${historyList.length} bản ghi`}
            </p>
            <button
              onClick={tab === 'pending' ? fetchPending : fetchHistory}
              disabled={loadingList}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
            >
              <RefreshCcw size={12} className={loadingList ? 'animate-spin' : ''} /> Làm mới
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pb-4">
            {loadingList ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-blue-400" size={24} />
              </div>
            ) : currentList.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
                {tab === 'pending' ? (
                  <>
                    <CheckCircle2 size={32} className="text-green-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-600">Không có booking nào đang chờ</p>
                    <p className="text-xs text-gray-400 mt-1">Tất cả đã được xử lý hoặc chưa có đặt chỗ mới</p>
                  </>
                ) : (
                  <>
                    <History size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-600">Chưa có lịch sử</p>
                  </>
                )}
              </div>
            ) : (
              currentList.map(b => (
                <BookingRow
                  key={b.ReservationID}
                  booking={b}
                  onSelect={setSelected}
                  isSelected={selectedBooking?.ReservationID === b.ReservationID}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-4">
          {selectedBooking ? (
            <BookingDetailPanel
              booking={selectedBooking}
              onCheckIn={handleCheckIn}
              checking={checking}
              onClose={() => setSelected(null)}
            />
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck size={28} className="text-blue-300" />
              </div>
              <p className="text-gray-700 font-bold mb-1">Chọn một booking để xem chi tiết</p>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Click vào bất kỳ booking nào ở danh sách bên trái, hoặc tra cứu nhanh bằng mã booking ở thanh tìm kiếm phía trên.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/60 py-3 px-6 z-20 flex justify-between items-center text-xs shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
          </div>
          <span className="font-bold text-gray-700 uppercase tracking-wide">Quy trình tự động:</span>
          <span className="hidden md:inline">
            Cập nhật trạng thái Booking <span className="mx-1.5 text-gray-300">|</span>
            Kích hoạt Phiên <span className="mx-1.5 text-gray-300">|</span>
            Cập nhật Slot
          </span>
        </div>
        <div className="flex items-center gap-4 text-gray-400 font-medium">
          <Link to="/staff/user-guide" className="hover:text-blue-600 transition-colors">Hướng dẫn</Link>
          <span className="text-gray-200">|</span>
          <Link to="/staff/support" className="hover:text-blue-600 transition-colors">Hỗ trợ & Báo lỗi</Link>
          <span className="text-gray-200">|</span>
          <span>v2.4.0-stable</span>
        </div>
      </div>
    </div>
  )
}

export default StaffVerifyBooking