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
import { useTranslation } from 'react-i18next'

// ── Helpers ───────────────────────────────────────────────────
const formatDateTime = (dt, t) => {
  if (!dt) return '—'
  const d = new Date(dt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${d.getDate()} ${t('staff.verifyBooking.monthShort')}${d.getMonth() + 1} ${d.getFullYear()}`
}

const getTimeRemaining = (endTime, t) => {
  if (!endTime) return null
  const diff = Math.floor((new Date(endTime) - Date.now()) / 60000)
  if (diff <= 0) return { label: t('staff.verifyBooking.timeExpired'), type: 'error' }
  if (diff <= 60) return { label: t('staff.verifyBooking.timeLeftMin', { n: diff }), type: 'warning' }
  const h = Math.floor(diff / 60); const m = diff % 60
  return { label: t('staff.verifyBooking.timeLeftHM', { h, m }), type: 'ok' }
}

const STATUS_CONFIG = {
  Reserved: { labelKey: 'staff.verifyBooking.status.reserved', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  Completed: { labelKey: 'staff.verifyBooking.status.completed', color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  Expired: { labelKey: 'staff.verifyBooking.status.expired', color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
  Cancelled: { labelKey: 'staff.verifyBooking.status.cancelled', color: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' }
}

// ── Booking Row Card (dùng trong list) ────────────────────────
const BookingRow = ({ booking, onSelect, isSelected }) => {
  const { t } = useTranslation()
  const cfg = STATUS_CONFIG[booking.ReservationStatus] || STATUS_CONFIG.Cancelled
  const tr = getTimeRemaining(booking.EndTime, t)

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
            {t(cfg.labelKey)}
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
          {formatDateTime(booking.StartTime, t)} → {formatDateTime(booking.EndTime, t)}
        </span>
        <ArrowRight size={14} className={`shrink-0 ${isSelected ? 'text-blue-500' : 'text-gray-300'}`} />
      </div>
    </button>
  )
}

// ── Detail Panel ──────────────────────────────────────────────
const BookingDetailPanel = ({ booking, onCheckIn, checking, onClose }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [plateNumber, setPlateNumber] = useState('') // ✅ thêm state
  const [plateError, setPlateError] = useState('')

  const tr = getTimeRemaining(booking.EndTime, t)
  const isValid = booking.ReservationStatus === 'Reserved'
  const isExpired = tr?.type === 'error'
  const cfg = STATUS_CONFIG[booking.ReservationStatus] || STATUS_CONFIG.Cancelled

  // ✅ Validate + gọi onCheckIn với plateNumber
  const handleSubmit = () => {
    if (!plateNumber.trim()) {
      setPlateError(t('staff.verifyBooking.plateRequired'))
      return
    }
    setPlateError('')
    onCheckIn(booking, plateNumber.trim().toUpperCase())
  }

  const validations = [
    {
      label: t('staff.verifyBooking.checks.reservationStatus'),
      value: isValid ? t('staff.verifyBooking.checks.reservationValid') : t(cfg.labelKey),
      status: isValid ? 'ok' : 'error'
    },
    {
      label: t('staff.verifyBooking.checks.slotLabel'),
      value: booking.SlotCode
        ? `${t('staff.verifyBooking.checks.slotPrefix')} ${booking.SlotCode}${booking.SlotStatus ? ` · ${booking.SlotStatus}` : ''}`
        : t('staff.verifyBooking.checks.noSlot'),
      status: booking.SlotCode ? 'ok' : 'warning'
    },
    {
      label: t('staff.verifyBooking.checks.vehicleType'),
      value: booking.VehicleName || '—',
      status: 'ok'
    },
    {
      label: t('staff.verifyBooking.checks.zoneFloor'),
      value: [booking.ZoneName, booking.FloorName].filter(Boolean).join(' · ') || '—',
      status: booking.SlotCode ? 'ok' : 'warning'
    },
    {
      label: t('staff.verifyBooking.checks.validUntil'),
      value: tr?.label || '—',
      status: tr?.type || 'ok'
    }
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* Header card */}
      <div className={`rounded-xl p-5 border ${isExpired || !isValid
        ? 'bg-red-50 border-red-200'
        : 'bg-blue-600 border-blue-500'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${isExpired || !isValid ? 'text-red-400' : 'text-blue-200'}`}>
              {t('staff.verifyBooking.bookingCodeLabel')}
            </p>
            <p className={`text-2xl font-black tracking-wider ${isExpired || !isValid ? 'text-red-700' : 'text-white'}`}>
              {booking.BookingCode}
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${cfg.color}`}>
            {t(cfg.labelKey)}
          </span>
        </div>
        <div className={`text-sm font-medium ${isExpired || !isValid ? 'text-red-600' : 'text-blue-100'}`}>
          {booking.VehicleName} · {t('staff.verifyBooking.checks.slotPrefix')} {booking.SlotCode || '—'}
        </div>
      </div>

      {/* Info grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('staff.verifyBooking.detailTitle')}</p>
        {[
          { icon: User, label: t('staff.verifyBooking.fields.driver'), value: booking.DriverName },
          { icon: Phone, label: t('staff.verifyBooking.fields.phone'), value: booking.PhoneNumber || '—' },
          { icon: Car, label: t('staff.verifyBooking.fields.vehicle'), value: booking.VehicleName },
          { icon: MapPin, label: t('staff.verifyBooking.fields.location'), value: [booking.BuildingName, booking.FloorName, booking.ZoneName, booking.SlotCode].filter(Boolean).join(' · ') || '—' },
          { icon: Hash, label: t('staff.verifyBooking.fields.systemId'), value: `#${booking.ReservationID}` },
          { icon: Calendar, label: t('staff.verifyBooking.fields.start'), value: formatDateTime(booking.StartTime, t) },
          { icon: Calendar, label: t('staff.verifyBooking.fields.end'), value: formatDateTime(booking.EndTime, t) }
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
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{t('staff.verifyBooking.validationTitle')}</p>
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
                {item.status === 'ok' ? t('staff.verifyBooking.checks.ok') : item.status === 'warning' ? t('staff.verifyBooking.checks.warning') : t('staff.verifyBooking.checks.invalid')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Input biển số thực tế */}
      {isValid && !isExpired && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            {t('staff.verifyBooking.actualPlateLabel')}
          </p>
          <input
            type="text"
            value={plateNumber}
            onChange={e => {
              setPlateNumber(e.target.value.toUpperCase())
              setPlateError('')
            }}
            placeholder={t('staff.verifyBooking.actualPlatePlaceholder')}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none ${plateError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
          />
          {plateError && (
            <p className="text-xs text-red-500 mt-1.5 font-medium">{plateError}</p>
          )}
        </div>
      )}

      {/* Actions */}
      {isValid && !isExpired ? (
        <div className="space-y-2.5">
          <button
            onClick={handleSubmit} // ✅ gọi handleSubmit thay vì onCheckIn trực tiếp
            disabled={checking}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-colors flex items-center justify-center gap-2"
          >
            {checking
              ? <><Loader2 size={16} className="animate-spin" /> {t('staff.verifyBooking.processing')}</>
              : <><ShieldCheck size={16} /> {t('staff.verifyBooking.confirmCheckin')}</>
            }
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex justify-center items-center gap-1.5 text-sm"
            >
              <XCircle size={15} /> {t('staff.verifyBooking.reject')}
            </button>
            <button
              onClick={() => navigate('/staff/create-incident')}
              className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex justify-center items-center gap-1.5 text-sm"
            >
              <FileText size={15} /> {t('staff.verifyBooking.createIncidentShort')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">
              {isExpired
                ? t('staff.verifyBooking.expiredNotice')
                : t('staff.verifyBooking.invalidStatusNotice', { status: booking.ReservationStatus })}
            </p>
          </div>
          <button
            onClick={() => navigate('/staff/create-incident')}
            className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex justify-center items-center gap-2 text-sm"
          >
            <FileText size={15} /> {t('staff.verifyBooking.createIncidentFull')}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
const StaffVerifyBooking = () => {
  const { t } = useTranslation()
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
    } catch { toast.error(t('staff.verifyBooking.errors.loadPending')) }
    finally { setLoadingList(false) }
  }, [t])

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
    } catch { toast.error(t('staff.verifyBooking.errors.loadHistory')) }
    finally { setLoadingList(false) }
  }, [t])

  useEffect(() => { fetchPending() }, [fetchPending])
  useEffect(() => { if (tab === 'history') fetchHistory() }, [tab, fetchHistory])

  // Auto-select từ URL param
  useEffect(() => {
    if (!reservationId) return
    staffApi.getBookingDetail(reservationId)
      .then(res => { const d = res?.data ?? res; if (d) setSelected(d) })
      .catch(() => toast.error(t('staff.verifyBooking.errors.notFoundFromUrl')))
  }, [reservationId, t])

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
    } catch { toast.error(t('staff.verifyBooking.errors.notFound')) }
    finally { setSearching(false) }
  }

  const handleCheckIn = async (booking, plateNumber) => { // ✅ nhận thêm plateNumber
    setChecking(true)
    try {
      await staffApi.checkInBooking(booking.ReservationID, plateNumber) // ✅ truyền xuống
      toast.success(t('staff.verifyBooking.checkinSuccess', { code: booking.BookingCode }))
      navigate('/staff/checkin-success', {
        state: {
          actionType: 'booking-checkin',
          sessionCode: null,
          session: null
        }
      })
    } catch (err) {
      toast.error(err?.response?.data?.message || t('staff.verifyBooking.checkinFailed'))
    } finally {
      setChecking(false)
    }
  }
  const currentList = tab === 'pending' ? pendingList : historyList

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24">

      {/* Breadcrumb */}
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <ChevronLeft size={16} className="cursor-pointer" onClick={() => navigate(-1)} />
        <span>{t('staff.verifyBooking.breadcrumbStaff')}</span><ChevronRight size={14} />
        <span className="text-blue-600 font-medium">{t('staff.verifyBooking.breadcrumbCurrent')}</span>
      </div>

      <header className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold text-gray-800">{t('staff.verifyBooking.title')}</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-sm font-medium">
          {t('staff.verifyBooking.gateLabel')} <ShieldCheck size={16} />
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
          placeholder={t('staff.verifyBooking.searchPlaceholder')}
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
          {t('staff.verifyBooking.searchBtn')}
        </button>
      </div>

      {/* Main layout: list + detail */}
      <div className="flex gap-5 flex-1 min-h-0">

        {/* Left: Tabs + List */}
        <div className="flex flex-col w-110 shrink-0 min-h-0">

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
              {t('staff.verifyBooking.tabPending')}
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
              {t('staff.verifyBooking.tabHistory')}
            </button>
          </div>

          {/* Refresh + count */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {tab === 'pending' ? t('staff.verifyBooking.pendingCount', { n: pendingList.length }) : t('staff.verifyBooking.historyCount', { n: historyList.length })}
            </p>
            <button
              onClick={tab === 'pending' ? fetchPending : fetchHistory}
              disabled={loadingList}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
            >
              <RefreshCcw size={12} className={loadingList ? 'animate-spin' : ''} /> {t('staff.verifyBooking.refresh')}
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
                    <p className="text-sm font-bold text-gray-600">{t('staff.verifyBooking.emptyPendingTitle')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('staff.verifyBooking.emptyPendingHint')}</p>
                  </>
                ) : (
                  <>
                    <History size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-600">{t('staff.verifyBooking.emptyHistoryTitle')}</p>
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
              <p className="text-gray-700 font-bold mb-1">{t('staff.verifyBooking.placeholderTitle')}</p>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                {t('staff.verifyBooking.placeholderDesc')}
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
          <span className="font-bold text-gray-700 uppercase tracking-wide">{t('staff.verifyBooking.autoFlowLabel')}</span>
          <span className="hidden md:inline">
            {t('staff.verifyBooking.autoFlowStep1')} <span className="mx-1.5 text-gray-300">|</span>
            {t('staff.verifyBooking.autoFlowStep2')} <span className="mx-1.5 text-gray-300">|</span>
            {t('staff.verifyBooking.autoFlowStep3')}
          </span>
        </div>
        <div className="flex items-center gap-4 text-gray-400 font-medium">
          <Link to="/staff/user-guide" className="hover:text-blue-600 transition-colors">{t('staff.verifyBooking.footerGuide')}</Link>
          <span className="text-gray-200">|</span>
          <Link to="/staff/support" className="hover:text-blue-600 transition-colors">{t('staff.verifyBooking.footerSupport')}</Link>
          <span className="text-gray-200">|</span>
          <span>v2.4.0-stable</span>
        </div>
      </div>
    </div>
  )
}

export default StaffVerifyBooking