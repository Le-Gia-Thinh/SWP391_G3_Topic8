/**
 * FILE: StaffVerifyBooking.jsx
 * MÔ TẢ: Trang Xác thực Đặt chỗ (Verify Booking).
 * Kiểm tra các booking đặt trước, xác thực biển số xe thực tế và tiến hành check-in
 * dựa trên booking đã được hệ thống ghi nhận.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Calendar, Search, ShieldCheck,
  AlertCircle, XCircle, FileText, RefreshCcw,
  Loader2, Clock, CheckCircle2, User, MapPin,
  Car, Phone, Hash, ArrowRight, History, ListChecks,
  Building2, Layers, Grid3X3, Sparkles, RotateCcw, Info
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import staffApi from '../../apis/staffApi'
import { useTranslation } from 'react-i18next'

// ── Helpers ───────────────────────────────────────────────────
const formatPlate = (raw) => {
  const clean = (raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (!clean) return ''
  const prov = clean.slice(0, 2).replace(/[^0-9]/g, '')
  let result = prov
  if (prov.length < 2) return result
  let i = 2, series = ''
  while (i < clean.length && /[A-Z]/.test(clean[i]) && series.length < 2) { series += clean[i]; i++ }
  result += series
  if (!series) return result
  const nums = clean.slice(i).replace(/[^0-9]/g, '').slice(0, 5)
  if (!nums.length) return result
  result += '-'
  result += nums.length <= 3 ? nums : nums.slice(0, nums.length - 2) + '.' + nums.slice(nums.length - 2)
  return result
}

const VN_OFFSET_MS = 7 * 60 * 60 * 1000
const formatDateTime = (dt, t) => {
  if (!dt) return '—'
  const d = new Date(new Date(dt).getTime() + VN_OFFSET_MS)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} · ${d.getUTCDate()} ${t('staff.verifyBooking.monthShort')}${d.getUTCMonth() + 1} ${d.getUTCFullYear()}`
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
  Cancelled: { labelKey: 'staff.verifyBooking.status.cancelled', color: 'bg-slate-100 text-slate-500 border-slate-100', dot: 'bg-slate-400' }
}

const EARLY_CHECKIN_MIN = 60   // quá sớm > 60 phút → phải cancelAndWalkIn
const LATE_CHECKIN_MIN = 60    // no-show nếu trễ > 60 phút
const GRACE_PERIOD_MIN = 15    // ân hạn: đến sớm ≤ 15 phút → miễn phí
const EARLY_FEE_FLAT = 5000    // phụ phí cố định 5.000đ nếu đến sớm 15–60 phút

const getCheckinTimeStatus = (startTime) => {
  if (!startTime) return null
  const diffMin = Math.round((Date.now() - new Date(startTime).getTime()) / 60000)
  // Ranh giới rõ ràng: đúng 15 phút = earlyFee, < 15 phút = grace
  if (diffMin < -EARLY_CHECKIN_MIN)  return { status: 'tooEarly', diffMin, minutesLeft: -diffMin - EARLY_CHECKIN_MIN }
  if (diffMin <= -GRACE_PERIOD_MIN)  return { status: 'earlyFee', diffMin, minutesEarly: -diffMin, fee: EARLY_FEE_FLAT }
  if (diffMin < 0)                   return { status: 'grace',    diffMin, minutesEarly: -diffMin }
  if (diffMin <= 15) return { status: 'onTime', diffMin }
  if (diffMin <= LATE_CHECKIN_MIN) return { status: 'lateWindow', diffMin }
  return { status: 'noShow', diffMin }
}

// ── Slot selector helpers ─────────────────────────────────────
const SLOT_STYLE = {
  Available: 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:bg-blue-50 cursor-pointer',
  Occupied: 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed opacity-60',
  Reserved: 'bg-amber-50 border-amber-300 text-amber-600 border-dashed cursor-not-allowed opacity-60',
  Maintenance: 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50',
  Blocked: 'bg-slate-700 border-slate-700 text-white cursor-not-allowed opacity-50',
}

function buildHierarchy(slots) {
  const map = {}
  slots.forEach(s => {
    const bk = s.BuildingName, fk = s.FloorName, zk = s.ZoneName
    if (!map[bk]) map[bk] = { name: bk, floors: {} }
    if (!map[bk].floors[fk]) map[bk].floors[fk] = { name: fk, zones: {} }
    if (!map[bk].floors[fk].zones[zk]) map[bk].floors[fk].zones[zk] = { name: zk, slots: [] }
    map[bk].floors[fk].zones[zk].slots.push(s)
  })
  return Object.values(map).map(b => ({
    ...b,
    floors: Object.values(b.floors).map(f => ({ ...f, zones: Object.values(f.zones) }))
  }))
}

function zoneStats(zones) {
  return zones.map(z => {
    const total = z.slots.length
    const available = z.slots.filter(s => s.SlotStatus === 'Available').length
    const occupied = z.slots.filter(s => s.SlotStatus === 'Occupied').length
    const reserved = z.slots.filter(s => s.SlotStatus === 'Reserved').length
    const pct = total > 0 ? Math.round((occupied + reserved) / total * 100) : 0
    return { ...z, total, available, occupied, reserved, pct }
  })
}

function smartSuggestSlot(slots) {
  const available = slots.filter(s => s.SlotStatus === 'Available')
  if (!available.length) return null
  const sorted = [...available].sort((a, b) => {
    const na = parseInt(a.SlotCode.split('-').pop()) || 0
    const nb = parseInt(b.SlotCode.split('-').pop()) || 0
    return na - nb
  })
  const pct = Math.round((slots.length - available.length) / slots.length * 100)
  const pick = pct >= 70 ? sorted[Math.floor(sorted.length * 0.6)] : sorted[0]
  return {
    slot: pick.SlotCode,
    reason: pct >= 70
      ? `Khu vực đông (${pct}% lấp đầy). ${pick.SlotCode} ít bị cản trở hơn.`
      : `${pick.SlotCode} gần cổng nhất, dễ ra vào.`
  }
}

// ── Booking Row Card (dùng trong list) ────────────────────────
const BookingRow = ({ booking, onSelect, isSelected, isPending = true }) => {
  const { t } = useTranslation()
  const cfg = STATUS_CONFIG[booking.ReservationStatus] || STATUS_CONFIG.Cancelled
  // Pending: đếm ngược đến giờ khách ĐẾN (StartTime). History: không cần countdown.
  const tr = isPending ? getTimeRemaining(booking.StartTime, t) : null

  return (
    <button
      onClick={() => onSelect(booking)}
      className={`w-full text-left px-3 py-2.5 rounded-3xl border transition-all ${isSelected
        ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
        : 'border-slate-100 bg-white hover:border-blue-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
      }`}
    >
      {/* Row 1: Code + Status + Time remaining */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-black text-blue-600 font-mono text-sm shrink-0">{booking.BookingCode}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
            {t(cfg.labelKey)}
          </span>
        </div>
        {tr && (
          <span className={`text-xs font-semibold shrink-0 ${
            tr.type === 'error' ? 'text-red-500' : tr.type === 'warning' ? 'text-amber-500' : 'text-slate-400'
          }`}>
            <Clock size={11} className="inline mr-0.5 mb-px" />{tr.label}
          </span>
        )}
      </div>

      {/* Row 2: Driver · Vehicle · Slot */}
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-1.5">
        <span className="flex items-center gap-1 truncate font-medium text-slate-700 min-w-0">
          <User size={11} className="text-slate-400 shrink-0" />
          <span className="truncate">{booking.DriverName}</span>
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <Car size={11} className="text-slate-400" />{booking.VehicleName}
        </span>
        <span className="flex items-center gap-1 shrink-0 font-bold text-blue-600">
          <MapPin size={11} className="text-blue-400" />{booking.SlotCode || '—'}
        </span>
      </div>

      {/* Row 3: Time range */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {formatDateTime(booking.StartTime, t)} → {formatDateTime(booking.EndTime, t)}
        </span>
        <ArrowRight size={12} className={`shrink-0 ${isSelected ? 'text-blue-500' : 'text-slate-300'}`} />
      </div>
    </button>
  )
}

// ── Detail Panel ──────────────────────────────────────────────
const BookingDetailPanel = ({ booking, onCheckIn, checking, onClose }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [plateNumber, setPlateNumber] = useState('')
  const [plateError, setPlateError] = useState('')
  const [showWalkInSelector, setShowWalkInSelector] = useState(false)
  const [walkInPlate, setWalkInPlate] = useState('')
  const [walkInPlateError, setWalkInPlateError] = useState('')
  const [cancellingWalkIn, setCancellingWalkIn] = useState(false)

  // AI Validation State
  const [aiPlateInsight, setAiPlateInsight] = useState(null)
  const [aiWalkInInsight, setAiWalkInInsight] = useState(null)

  const normPlate = p => (p || '').toUpperCase().replace(/[^0-9A-Z]/g, '')

  useEffect(() => {
    if (!plateNumber || plateNumber.length < 8) {
      setAiPlateInsight(null)
      return
    }
    let cancelled = false
    staffApi.searchSessions({ keyword: plateNumber, status: 'Active' })
      .then(res => {
        if (cancelled) return
        const sessions = res?.data || []
        const active = sessions.find(s => normPlate(s.PlateNumber) === normPlate(plateNumber))
        setAiPlateInsight(active
          ? { type: 'error', message: 'Xe này đang có phiên đỗ xe đang hoạt động trong bãi.' }
          : null)
      })
      .catch(() => { if (!cancelled) setAiPlateInsight(null) })
    return () => { cancelled = true }
  }, [plateNumber])

  useEffect(() => {
    if (!walkInPlate || walkInPlate.length < 8) {
      setAiWalkInInsight(null)
      return
    }
    let cancelled = false
    staffApi.searchSessions({ keyword: walkInPlate, status: 'Active' })
      .then(res => {
        if (cancelled) return
        const sessions = res?.data || []
        const active = sessions.find(s => normPlate(s.PlateNumber) === normPlate(walkInPlate))
        setAiWalkInInsight(active
          ? { type: 'error', message: 'Xe này đang có phiên đỗ xe đang hoạt động trong bãi.' }
          : null)
      })
      .catch(() => { if (!cancelled) setAiWalkInInsight(null) })
    return () => { cancelled = true }
  }, [walkInPlate])

  // Slot selection state (for walk-in early override)
  const [allSlots, setAllSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selBuilding, setSelBuilding] = useState(null)
  const [selFloor, setSelFloor] = useState(null)
  const [selZone, setSelZone] = useState(null)
  const [selSlotId, setSelSlotId] = useState(null)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [countdown, setCountdown] = useState(null)

  const hierarchy = useMemo(() => buildHierarchy(allSlots), [allSlots])
  const floorList = useMemo(() => {
    if (!selBuilding) return []
    return hierarchy.find(b => b.name === selBuilding.name)?.floors || []
  }, [hierarchy, selBuilding])
  const zoneList = useMemo(() => {
    if (!selBuilding || !selFloor) return []
    const b = hierarchy.find(b => b.name === selBuilding.name)
    const f = b?.floors.find(f => f.name === selFloor.name)
    return zoneStats(f?.zones || [])
  }, [hierarchy, selBuilding, selFloor])
  const slotsInZone = useMemo(() => {
    if (!selZone) return []
    return [...selZone.slots].sort((a, b) => a.SlotCode.localeCompare(b.SlotCode))
  }, [selZone])
  const selectedSlot = allSlots.find(s => s.SlotID === selSlotId)

  // Load slots when modal opens
  useEffect(() => {
    if (!showWalkInSelector || !booking.VehicleTypeID) return
    setLoadingSlots(true)
    setSelBuilding(null); setSelFloor(null); setSelZone(null); setSelSlotId(null); setAiSuggestion(null)
    staffApi.getParkingMap({ vehicleTypeId: booking.VehicleTypeID, status: 'all' })
      .then(res => { if (res.success) setAllSlots(res.data) })
      .catch(() => {})
      .finally(() => setLoadingSlots(false))
  }, [showWalkInSelector]) // eslint-disable-line

  // AI suggest when zone selected
  useEffect(() => {
    if (!selZone) return
    setAiSuggestion(null)
    const suggestion = smartSuggestSlot(selZone.slots)
    if (suggestion) {
      setAiSuggestion(suggestion)
      const suggested = selZone.slots.find(s => s.SlotCode === suggestion.slot)
      if (suggested) setSelSlotId(suggested.SlotID)
    }
  }, [selZone])

  // Live countdown for tooEarly: tick every second until check-in window opens
  useEffect(() => {
    const windowOpensAt = new Date(booking.StartTime).getTime() - EARLY_CHECKIN_MIN * 60 * 1000
    if (Date.now() >= windowOpensAt) { setCountdown(null); return }
    const tick = () => {
      const remaining = Math.max(0, windowOpensAt - Date.now())
      const totalSecs = Math.floor(remaining / 1000)
      const h = Math.floor(totalSecs / 3600)
      const m = Math.floor((totalSecs % 3600) / 60)
      const s = totalSecs % 60
      setCountdown({ h, m, s, total: remaining })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [booking.StartTime]) // eslint-disable-line

  const tr = getTimeRemaining(booking.EndTime, t)
  const isValid = booking.ReservationStatus === 'Reserved'
  const isExpired = tr?.type === 'error'
  const cfg = STATUS_CONFIG[booking.ReservationStatus] || STATUS_CONFIG.Cancelled
  const timeInfo = getCheckinTimeStatus(booking.StartTime)
  const canCheckin = isValid && !isExpired && !['tooEarly', 'noShow'].includes(timeInfo?.status)

  const TIME_STATUS_CFG = {
    tooEarly:    { bg: 'bg-red-50 border-red-200',      text: 'text-red-700',    icon: '🔴', labelKey: 'staff.verifyBooking.checkin.tooEarlyStatus',      msgKey: 'staff.verifyBooking.checkin.tooEarlyMsg' },
    earlyFee:    { bg: 'bg-blue-50 border-blue-200',    text: 'text-blue-700',   icon: '💳', labelKey: 'staff.verifyBooking.checkin.earlyFeeStatus',      msgKey: 'staff.verifyBooking.checkin.earlyFeeMsg' },
    grace:       { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: '✅', labelKey: 'staff.verifyBooking.checkin.gracePeriodStatus', msgKey: 'staff.verifyBooking.checkin.gracePeriodMsg' },
    onTime:      { bg: 'bg-green-50 border-green-200',  text: 'text-green-700',  icon: '🟢', labelKey: 'staff.verifyBooking.checkin.onTimeStatus',        msgKey: 'staff.verifyBooking.checkin.onTimeMsg' },
    lateWindow:  { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: '🟠', labelKey: 'staff.verifyBooking.checkin.lateWindowStatus',   msgKey: 'staff.verifyBooking.checkin.lateWindowMsg' },
    noShow:      { bg: 'bg-red-50 border-red-200',      text: 'text-red-700',    icon: '🔴', labelKey: 'staff.verifyBooking.checkin.noShowStatus',        msgKey: 'staff.verifyBooking.checkin.noShowMsg' }
  }

  const handleSubmit = () => {
    if (!plateNumber.trim()) {
      setPlateError(t('staff.verifyBooking.plateRequired'))
      return
    }
    setPlateError('')
    onCheckIn(booking, plateNumber.trim().toUpperCase())
  }

  const handleCancelAndWalkIn = async (overrideSlotId = null) => {
    const finalSlotId = (overrideSlotId && typeof overrideSlotId !== 'object') ? overrideSlotId : selSlotId;
    
    if (!walkInPlate.trim()) {
      setWalkInPlateError(t('staff.verifyBooking.plateRequired'))
      return
    }
    if (!finalSlotId) {
      toast.error('Vui lòng chọn slot trước khi xác nhận.')
      return
    }
    if (aiWalkInInsight?.type === 'error') {
      toast.error(aiWalkInInsight.message);
      return;
    }
    
    setWalkInPlateError('')
    setCancellingWalkIn(true)
    try {
      const result = await staffApi.cancelAndWalkIn(booking.ReservationID, walkInPlate.trim(), finalSlotId)
      const data = result?.data
      navigate('/staff/checkin-success', {
        state: {
          actionType: 'walkin-checkin',
          sessionCode: data?.sessionCode,
          session: data?.session,
          cancelledBooking: true
        }
      })
    } catch (err) {
      toast.error(err?.response?.data?.message || t('staff.verifyBooking.checkinFailed'))
    } finally {
      setCancellingWalkIn(false)
    }
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
      <div className={`rounded-3xl p-5 border ${isExpired || !isValid
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
      <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('staff.verifyBooking.detailTitle')}</p>
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
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold shrink-0 w-24">
              <Icon size={12} /> {label}
            </span>
            <span className="text-xs font-bold text-slate-800 text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Validation */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t('staff.verifyBooking.validationTitle')}</p>
        <div className="space-y-3">
          {validations.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">{item.label}</p>
                <p className="text-xs font-bold text-slate-700 truncate">{item.value}</p>
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

      {/* Time status banner — không hiện cho tooEarly vì có 2 options riêng bên dưới */}
      {isValid && !isExpired && timeInfo && timeInfo.status !== 'tooEarly' && (() => {
        const tsCfg = TIME_STATUS_CFG[timeInfo.status]
        const msgParams = timeInfo.status === 'earlyFee'
          ? { n: timeInfo.minutesEarly, fee: '5.000đ' }
          : timeInfo.status === 'grace'
            ? { n: timeInfo.minutesEarly }
            : timeInfo.status === 'lateWindow'
              ? { n: timeInfo.diffMin }
              : {}
        return (
          <div className={`rounded-3xl border p-4 ${tsCfg.bg}`}>
            {/* Fee highlight cho earlyFee */}
            {timeInfo.status === 'earlyFee' && (
              <div className="flex items-center justify-between mb-3 bg-blue-100 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💳</span>
                  <span className="text-sm font-black text-blue-800">Phụ phí đến sớm</span>
                </div>
                <span className="text-xl font-black text-blue-700">5.000đ</span>
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{tsCfg.icon}</span>
              <span className={`text-xs font-black uppercase tracking-wider ${tsCfg.text}`}>
                {t(tsCfg.labelKey)}
              </span>
            </div>
            <p className={`text-xs font-medium ${tsCfg.text}`}>
              {t(tsCfg.msgKey, msgParams)}
            </p>
          </div>
        )
      })()}

      {/* ✅ Input biển số thực tế */}
      {canCheckin && (
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t('staff.verifyBooking.actualPlateLabel')}
          </p>
          {/* Premium AI Plate Insight Banner */}
          {aiPlateInsight && (
            <div className="overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center gap-3 p-3">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full ${aiPlateInsight.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                   {aiPlateInsight.type === 'error' ? <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-amber-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-slate-700">
                    <strong className={aiPlateInsight.type === 'error' ? 'text-red-600' : 'text-amber-600'}>
                      {aiPlateInsight.type === 'error' ? 'Lỗi: ' : 'Lưu ý: '}
                    </strong>
                    {aiPlateInsight.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <input
              type="text"
              value={plateNumber}
              onChange={e => {
                setPlateNumber(formatPlate(e.target.value))
                setPlateError('')
              }}
              placeholder={t('staff.verifyBooking.actualPlatePlaceholder')}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm font-black uppercase focus:ring-2 focus:ring-blue-500 outline-none transition-colors ${plateError ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
            />
            {plateError && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">{plateError}</p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {canCheckin ? (
        <div className="space-y-2.5">
          <button
            onClick={handleSubmit} // ✅ gọi handleSubmit thay vì onCheckIn trực tiếp
            disabled={checking}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-3xl shadow-md shadow-blue-200 transition-colors flex items-center justify-center gap-2"
          >
            {checking
              ? <><Loader2 size={16} className="animate-spin" /> {t('staff.verifyBooking.processing')}</>
              : <><ShieldCheck size={16} /> {t('staff.verifyBooking.confirmCheckin')}</>
            }
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-3xl hover:bg-red-50 transition-colors flex justify-center items-center gap-1.5 text-sm"
            >
              <XCircle size={15} /> {t('staff.verifyBooking.reject')}
            </button>
            <button
              onClick={() => navigate('/staff/create-incident')}
              className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-3xl hover:bg-slate-50 transition-colors flex justify-center items-center gap-1.5 text-sm"
            >
              <FileText size={15} /> {t('staff.verifyBooking.createIncidentShort')}
            </button>
          </div>
        </div>
      ) : timeInfo?.status === 'tooEarly' ? (
        <div className="space-y-3">
          {/* Option A: Wait with live countdown */}
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Clock size={15} className="text-amber-600 shrink-0" />
              <span className="text-xs font-black text-amber-700 uppercase tracking-wider">
                {t('staff.verifyBooking.checkin.waitTitle')}
              </span>
            </div>

            {/* Countdown display */}
            {countdown && countdown.total > 0 ? (
              <div className="bg-amber-100 border border-amber-200 rounded-3xl px-4 py-3 mb-2.5 flex flex-col items-center gap-1">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Mở cửa sổ check-in sau</p>
                <div className="flex items-center gap-2">
                  {countdown.h > 0 && (
                    <>
                      <div className="flex flex-col items-center">
                        <span className="text-3xl font-black text-amber-800 font-mono tabular-nums leading-none">
                          {String(countdown.h).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] text-amber-500 font-bold uppercase mt-0.5">giờ</span>
                      </div>
                      <span className="text-2xl font-black text-amber-400 pb-3">:</span>
                    </>
                  )}
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-amber-800 font-mono tabular-nums leading-none">
                      {String(countdown.m).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-amber-500 font-bold uppercase mt-0.5">phút</span>
                  </div>
                  <span className="text-2xl font-black text-amber-400 pb-3">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black text-amber-800 font-mono tabular-nums leading-none">
                      {String(countdown.s).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] text-amber-500 font-bold uppercase mt-0.5">giây</span>
                  </div>
                </div>
                <p className="text-[10px] text-amber-500 mt-0.5">
                  {(() => {
                    const d = new Date(new Date(booking.StartTime).getTime() - EARLY_CHECKIN_MIN * 60000 + VN_OFFSET_MS)
                    return `Check-in mở lúc ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
                  })()}
                </p>
              </div>
            ) : (
              <p className="text-xs text-amber-700 mb-2">Cửa sổ check-in sắp mở…</p>
            )}

            <p className="text-[11px] text-amber-600 leading-relaxed">
              Khách đến quá sớm. Nếu muốn vào ngay, chọn phương án bên dưới để chuyển sang vé vãng lai.
            </p>
          </div>

          {/* Option B: Cancel + Walk-in */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-4 text-white">
            <div className="flex items-center gap-2 mb-1.5">
              <Car size={15} className="text-blue-200 shrink-0" />
              <span className="text-xs font-black text-white uppercase tracking-wider">
                {t('staff.verifyBooking.checkin.walkInNowTitle')}
              </span>
            </div>
            <p className="text-xs text-blue-100 mb-3 leading-relaxed">
              {t('staff.verifyBooking.checkin.walkInNowDesc')}
            </p>
            <button
              onClick={() => setShowWalkInSelector(true)}
              className="w-full py-2 bg-white text-blue-700 text-sm font-black rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <Grid3X3 size={14} />
              Chọn slot & nhận xe ngay
            </button>
          </div>

          {/* Common secondary buttons */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-3xl hover:bg-red-50 transition-colors flex justify-center items-center gap-1.5 text-sm"
            >
              <XCircle size={15} /> {t('staff.verifyBooking.reject')}
            </button>
            <button
              onClick={() => navigate('/staff/create-incident')}
              className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-3xl hover:bg-slate-50 transition-colors flex justify-center items-center gap-1.5 text-sm"
            >
              <FileText size={15} /> {t('staff.verifyBooking.createIncidentShort')}
            </button>
          </div>

          {/* ── Full-screen slot selector ── */}
          {showWalkInSelector && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col overflow-hidden">

              {/* Top bar */}
              <div className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between flex-shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-3xl bg-blue-100 flex items-center justify-center">
                    <Car size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nhận xe sớm → Vãng lai</p>
                    <p className="text-sm font-black text-slate-800">
                      {booking.BookingCode}
                      <span className="font-normal text-slate-400 ml-1">· {booking.DriverName} · {booking.VehicleName}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWalkInSelector(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <XCircle size={16} className="text-slate-500" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-auto bg-slate-50 p-4 pb-24">

                {/* Warning banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-3 mb-4 flex items-start gap-2.5">
                  <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Booking <strong>{booking.BookingCode}</strong> sẽ bị <strong>hủy</strong>. Khách sẽ được nhận vào bãi ngay trên slot bạn chọn bên dưới.
                  </p>
                </div>

                <div className="flex gap-4 items-start">

                  {/* LEFT: Plate + step + summary */}
                  <div className="w-64 flex-shrink-0 space-y-3">

                    {/* Plate input */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 space-y-3">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                        <Info size={14} className="text-blue-500" />
                        Biển số thực tế
                      </h3>
                      
                      {/* Premium AI WalkIn Plate Insight */}
                      {aiWalkInInsight && (
                        <div className="overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-1">
                          <div className="flex items-center gap-3 p-3">
                            <div className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${aiWalkInInsight.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                               {aiWalkInInsight.type === 'error' ? <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-amber-500" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-medium text-slate-700 leading-tight">
                                <strong className={aiWalkInInsight.type === 'error' ? 'text-red-600' : 'text-amber-600'}>
                                  {aiWalkInInsight.type === 'error' ? 'Lỗi: ' : 'Lưu ý: '}
                                </strong>
                                {aiWalkInInsight.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <input
                          type="text"
                          value={walkInPlate}
                          onChange={e => { setWalkInPlate(formatPlate(e.target.value)); setWalkInPlateError('') }}
                          placeholder="29A-12345"
                          maxLength={12}
                          autoFocus
                          className={`w-full px-3 py-2.5 rounded-xl border text-sm font-black uppercase tracking-widest
                            focus:outline-none focus:ring-2 transition-all
                            ${walkInPlateError ? 'border-red-400 bg-red-50 focus:ring-red-200'
                              : walkInPlate.length >= 8 ? 'border-emerald-400 bg-emerald-50 focus:ring-emerald-200'
                                : 'border-slate-200 focus:ring-blue-200 bg-white'}`}
                        />
                        {walkInPlateError
                          ? <p className="text-xs text-red-500 mt-1">{walkInPlateError}</p>
                          : walkInPlate.length >= 8
                            ? <p className="text-xs text-emerald-600 mt-1 font-medium">Biển số hợp lệ ✓</p>
                            : <p className="text-xs text-slate-400 mt-1">Ví dụ: 51A-123.45</p>
                        }
                      </div>

                      {/* Booking info reminder */}
                      <div className="border-t border-slate-50 pt-3 space-y-1.5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Thông tin booking</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <User size={11} className="text-slate-400" />
                          {booking.DriverName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Car size={11} className="text-slate-400" />
                          {booking.VehicleName}
                        </div>
                        {booking.PlateNumber && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Hash size={11} className="text-slate-400" />
                            Biển đặt: <span className="font-bold">{booking.PlateNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step tracker */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 space-y-2.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hướng dẫn</p>
                      {[
                        ['1', 'Chọn tòa nhà', !!selBuilding],
                        ['2', 'Chọn tầng', !!selFloor],
                        ['3', 'Chọn khu vực', !!selZone],
                        ['4', 'Xác nhận slot', !!selSlotId],
                      ].map(([num, label, done]) => (
                        <div key={num} className={`flex items-center gap-2 ${!done && num > (selBuilding ? selFloor ? selZone ? 4 : 3 : 2 : 1) ? 'opacity-40' : ''}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0
                            ${done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {done ? '✓' : num}
                          </div>
                          <span className={`text-xs font-semibold ${done ? 'text-emerald-700' : 'text-slate-500'}`}>{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Selected slot summary */}
                    {selSlotId && selectedSlot && (
                      <div className="bg-blue-600 rounded-3xl p-4 text-white space-y-1">
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Slot đã chọn</p>
                        <p className="text-3xl font-black">{selectedSlot.SlotCode}</p>
                        <p className="text-xs opacity-80">
                          {selectedSlot.BuildingName?.split(' - ').slice(-1)[0]}
                          {' · '}{selectedSlot.FloorName}
                          {' · '}{selectedSlot.ZoneName}
                        </p>
                        {aiSuggestion && (
                          <div className="mt-2 pt-2 border-t border-white/20">
                            <p className="text-[10px] flex items-center gap-1 opacity-80">
                              <Sparkles size={9} /> Gợi ý thông minh
                            </p>
                            <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{aiSuggestion.reason}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* RIGHT: Slot selection */}
                  <div className="flex-1 space-y-3">
                    {loadingSlots ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 size={28} className="animate-spin text-blue-400" />
                        <p className="text-sm text-slate-400">Đang tải sơ đồ bãi đỗ…</p>
                      </div>
                    ) : (
                      <>
                        {/* Building */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                            <div className="flex items-center gap-2">
                              <Building2 size={14} className="text-blue-500" />
                              <span className="text-sm font-bold text-slate-700">1. Chọn tòa nhà</span>
                            </div>
                            {selBuilding && (
                              <button onClick={() => { setSelBuilding(null); setSelFloor(null); setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                                <RotateCcw size={10} /> Đổi
                              </button>
                            )}
                          </div>
                          <div className="p-3 flex flex-wrap gap-2">
                            {hierarchy.map(b => {
                              const avail = b.floors.reduce((a, f) => a + f.zones.reduce((aa, z) => aa + z.slots.filter(s => s.SlotStatus === 'Available').length, 0), 0)
                              const total = b.floors.reduce((a, f) => a + f.zones.reduce((aa, z) => aa + z.slots.length, 0), 0)
                              const isActive = selBuilding?.name === b.name
                              return (
                                <button key={b.name}
                                  onClick={() => { setSelBuilding({ name: b.name }); setSelFloor(null); setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-3xl border transition-all
                                    ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                                  <Building2 size={16} className={isActive ? 'text-blue-100' : 'text-slate-400'} />
                                  <div>
                                    <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-700'}`}>
                                      {b.name.split(' - ').slice(-1)[0] || b.name}
                                    </p>
                                    <p className={`text-[10px] font-semibold ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                                      {avail}/{total} trống
                                    </p>
                                  </div>
                                  {isActive && <CheckCircle2 size={14} className="text-white ml-1" />}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Floor */}
                        {selBuilding && (
                          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                              <div className="flex items-center gap-2">
                                <Layers size={14} className="text-blue-500" />
                                <span className="text-sm font-bold text-slate-700">2. Chọn tầng</span>
                              </div>
                              {selFloor && (
                                <button onClick={() => { setSelFloor(null); setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                                  <RotateCcw size={10} /> Đổi
                                </button>
                              )}
                            </div>
                            <div className="p-3 flex flex-wrap gap-2">
                              {floorList.map(f => {
                                const avail = f.zones.reduce((a, z) => a + z.slots.filter(s => s.SlotStatus === 'Available').length, 0)
                                const total = f.zones.reduce((a, z) => a + z.slots.length, 0)
                                const pct = total > 0 ? Math.round((total - avail) / total * 100) : 0
                                const isAct = selFloor?.name === f.name
                                const barClr = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
                                return (
                                  <button key={f.name}
                                    onClick={() => { setSelFloor({ name: f.name }); setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                                    className={`flex flex-col gap-1.5 px-4 py-3 rounded-3xl border min-w-[110px] transition-all
                                      ${isAct ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                                    <div className="flex items-center justify-between gap-2">
                                      <p className={`text-sm font-bold ${isAct ? 'text-white' : 'text-slate-700'}`}>{f.name}</p>
                                      {isAct && <CheckCircle2 size={13} className="text-white" />}
                                    </div>
                                    <p className={`text-[10px] font-semibold ${isAct ? 'text-blue-100' : 'text-slate-400'}`}>
                                      {avail} trống / {total}
                                    </p>
                                    <div className={`h-1 rounded-full ${isAct ? 'bg-blue-400' : 'bg-slate-100'}`}>
                                      <div className={`h-full rounded-full ${isAct ? 'bg-white/60' : barClr}`} style={{ width: `${pct}%` }} />
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Zone */}
                        {selFloor && (
                          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                              <div className="flex items-center gap-2">
                                <Grid3X3 size={14} className="text-blue-500" />
                                <span className="text-sm font-bold text-slate-700">3. Chọn khu vực</span>
                              </div>
                              {selZone && (
                                <button onClick={() => { setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                                  <RotateCcw size={10} /> Đổi
                                </button>
                              )}
                            </div>
                            <div className="p-3 grid grid-cols-2 gap-2">
                              {zoneList.map(z => {
                                const isAct = selZone?.name === z.name
                                const tagClr = z.pct >= 90 ? 'text-red-500 bg-red-50' : z.pct >= 70 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                                const tagLbl = z.pct >= 90 ? 'Rất đông' : z.pct >= 70 ? 'Khá đông' : 'Còn trống'
                                return (
                                  <button key={z.name}
                                    onClick={() => { setSelZone(z); setSelSlotId(null); setAiSuggestion(null) }}
                                    disabled={z.available === 0}
                                    className={`p-3 rounded-3xl border text-left transition-all space-y-2
                                      ${z.available === 0 ? 'opacity-40 cursor-not-allowed border-slate-100 bg-slate-50'
                                        : isAct ? 'bg-blue-600 border-blue-600 shadow-md'
                                          : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                                    <div className="flex items-center justify-between">
                                      <p className={`text-xs font-bold ${isAct ? 'text-white' : 'text-slate-700'}`}>
                                        {z.name.split(' ').slice(-2).join(' ')}
                                      </p>
                                      {isAct && <CheckCircle2 size={12} className="text-white flex-shrink-0" />}
                                    </div>
                                    {!isAct && (
                                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tagClr}`}>
                                        {tagLbl}
                                      </span>
                                    )}
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[10px] font-semibold">
                                        <span className={isAct ? 'text-blue-100' : z.pct >= 90 ? 'text-red-500' : z.pct >= 70 ? 'text-amber-600' : 'text-emerald-600'}>
                                          {z.pct}% lấp đầy
                                        </span>
                                        <span className={isAct ? 'text-blue-100' : 'text-slate-400'}>{z.available} trống</span>
                                      </div>
                                      <div className={`h-1.5 rounded-full ${isAct ? 'bg-blue-400' : 'bg-slate-100'}`}>
                                        <div className={`h-full rounded-full ${isAct ? 'bg-white/60' : z.pct >= 90 ? 'bg-red-500' : z.pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                          style={{ width: `${z.pct}%` }} />
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Slot grid */}
                        {selZone && (
                          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-50 flex items-center gap-2">
                              <Sparkles size={14} className="text-purple-500" />
                              <span className="text-sm font-bold text-slate-700">4. Chọn slot cụ thể</span>
                              {aiSuggestion && (
                                <span className="ml-auto text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
                                  Gợi ý: {aiSuggestion.slot}
                                </span>
                              )}
                            </div>

                            <div className="p-4 space-y-4">
                              {/* Premium Minimalist AI suggestion banner */}
                              {aiSuggestion && (
                                <div className="relative group mb-4">
                                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />
                                  <div className="relative bg-white border border-slate-200/60 rounded-3xl p-4 flex flex-col md:flex-row md:items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-100/50 flex-shrink-0">
                                      <Sparkles size={18} className="text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 uppercase tracking-widest">Gợi ý thông minh</p>
                                      <div className="flex items-baseline gap-2 mt-0.5">
                                        <p className="text-2xl font-bold text-slate-800 tracking-tight">{aiSuggestion.slot}</p>
                                      </div>
                                      <p className="text-xs text-slate-500 leading-relaxed font-medium truncate mt-1">{aiSuggestion.reason}</p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const s = slotsInZone.find(s => s.SlotCode === aiSuggestion.slot);
                                        if (s) {
                                           setSelSlotId(s.SlotID)
                                           if (walkInPlate.length >= 8 && aiWalkInInsight?.type !== 'error') {
                                             handleCancelAndWalkIn(s.SlotID)
                                           } else if (walkInPlate.length < 8) {
                                             toast.info('Vui lòng nhập biển số xe trước khi 1-Click Check-in')
                                           }
                                        }
                                      }}
                                      disabled={cancellingWalkIn || (walkInPlate.length >= 8 && aiWalkInInsight?.type === 'error')}
                                      className="flex-shrink-0 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 group/btn relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed">
                                      <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                                      {cancellingWalkIn ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-blue-200" />}
                                      <span>1-Click Check-in</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Gate indicator */}
                              <div className="flex items-center justify-center">
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-700 rounded-full">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span className="text-[10px] text-white font-bold tracking-widest">CỔNG VÀO</span>
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                </div>
                              </div>

                              {/* Slot grid */}
                              <div className="flex flex-wrap gap-2 justify-center">
                                {slotsInZone.map(slot => {
                                  const isSel = selSlotId === slot.SlotID
                                  const isAiPick = aiSuggestion?.slot === slot.SlotCode
                                  const isDisabled = slot.SlotStatus !== 'Available'
                                  return (
                                    <button key={slot.SlotID}
                                      disabled={isDisabled}
                                      onClick={() => !isDisabled && setSelSlotId(slot.SlotID)}
                                      title={`${slot.SlotCode} – ${slot.SlotStatus}`}
                                      className={`w-14 h-14 rounded-3xl border-2 flex flex-col items-center justify-center
                                        transition-all duration-150 relative
                                        ${isSel
                                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110 z-10'
                                          : isAiPick && !isDisabled
                                            ? 'bg-purple-50 border-purple-400 text-purple-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] scale-105'
                                            : SLOT_STYLE[slot.SlotStatus] || SLOT_STYLE.Available
                                        }`}>
                                      {isAiPick && !isSel && (
                                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-purple-500 rounded-full flex items-center justify-center">
                                          <Sparkles size={8} className="text-white" />
                                        </span>
                                      )}
                                      <span className="font-black text-[10px] leading-tight">
                                        {slot.SlotCode.split('-').slice(-1)[0]}
                                      </span>
                                      {slot.SlotStatus === 'Available' && !isSel && (
                                        <span className="text-[7px] font-bold opacity-50 mt-0.5">OK</span>
                                      )}
                                      {slot.SlotStatus === 'Occupied' && <Car size={10} className="mt-0.5 opacity-60" />}
                                      {slot.SlotStatus === 'Reserved' && <span className="text-[7px] font-bold mt-0.5">ĐẶT</span>}
                                    </button>
                                  )
                                })}
                              </div>

                              {/* Legend */}
                              <div className="flex items-center gap-4 flex-wrap border-t border-slate-50 pt-3">
                                {[
                                  ['bg-white border-slate-200', 'Trống'],
                                  ['bg-red-50 border-red-200', 'Đang đậu'],
                                  ['bg-amber-50 border-amber-300', 'Đã đặt'],
                                  ['bg-purple-50 border-purple-400', 'Gợi ý AI'],
                                  ['bg-blue-600 border-blue-600', 'Đã chọn'],
                                ].map(([cls, label]) => (
                                  <div key={label} className="flex items-center gap-1.5">
                                    <div className={`w-3 h-3 rounded border-2 ${cls}`} />
                                    <span className="text-[10px] text-slate-500 font-medium">{label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom action bar */}
              <div className="bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-lg flex-shrink-0 px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex gap-6">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Biển số</p>
                    <p className={`font-black text-sm ${walkInPlate.length >= 8 ? 'text-slate-800' : 'text-slate-300'}`}>
                      {walkInPlate || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Slot</p>
                    <p className={`font-black text-sm ${selectedSlot ? 'text-blue-600' : 'text-slate-300'}`}>
                      {selectedSlot?.SlotCode || '—'}
                    </p>
                  </div>
                  {selectedSlot && (
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Vị trí</p>
                      <p className="text-xs font-medium text-slate-600">{selectedSlot.FloorName} · {selectedSlot.ZoneName}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowWalkInSelector(false)}
                    className="px-4 py-2 rounded-3xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={handleCancelAndWalkIn}
                    disabled={cancellingWalkIn || !selSlotId || walkInPlate.length < 8}
                    className="px-6 py-2 rounded-3xl bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {cancellingWalkIn
                      ? <><Loader2 size={14} className="animate-spin" /> Đang xử lý…</>
                      : <><ShieldCheck size={15} /> Xác nhận nhận xe</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {(!isValid || isExpired) && (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">
                {isExpired
                  ? t('staff.verifyBooking.expiredNotice')
                  : t('staff.verifyBooking.invalidStatusNotice', { status: booking.ReservationStatus })}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-3xl hover:bg-red-50 transition-colors flex justify-center items-center gap-1.5 text-sm"
            >
              <XCircle size={15} /> {t('staff.verifyBooking.reject')}
            </button>
            <button
              onClick={() => navigate('/staff/create-incident')}
              className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-3xl hover:bg-slate-50 transition-colors flex justify-center items-center gap-1.5 text-sm"
            >
              <FileText size={15} /> {t('staff.verifyBooking.createIncidentFull')}
            </button>
          </div>
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
  const [timeWindow, setTimeWindow] = useState('all') // 'all' | '1' | '2' | '4'
  const [historyDateFilter, setHistoryDateFilter] = useState('today') // 'today'|'1'|'3'|'7'|'30'
  const [pendingList, setPendingList] = useState([])
  const [historyList, setHistoryList] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const [selectedBooking, setSelected] = useState(null)
  const [checking, setChecking] = useState(false)
  const [searchId, setSearchId] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searching, setSearching] = useState(false)

  const computeDateRange = (filter) => {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const tomorrowEnd = new Date(now)
    tomorrowEnd.setHours(23, 59, 59, 999)

    if (filter === 'today') {
      return { dateFrom: todayStart.toISOString(), dateTo: tomorrowEnd.toISOString() }
    }
    const days = parseInt(filter)
    const from = new Date(todayStart)
    from.setDate(from.getDate() - days)
    return { dateFrom: from.toISOString(), dateTo: tomorrowEnd.toISOString() }
  }

  // Fetch lists
  const fetchPending = useCallback(async () => {
    setLoadingList(true)
    try {
      const params = { status: 'Reserved' }
      if (timeWindow !== 'all') params.timeWindowHours = timeWindow
      const res = await staffApi.getBookingQueue(params)
      const data = res?.data ?? res ?? []
      setPendingList(Array.isArray(data) ? data : [])
    } catch { toast.error(t('staff.verifyBooking.errors.loadPending')) }
    finally { setLoadingList(false) }
  }, [t, timeWindow])

  const fetchHistory = useCallback(async () => {
    setLoadingList(true)
    try {
      const { dateFrom, dateTo } = computeDateRange(historyDateFilter)
      const [completed, expired] = await Promise.all([
        staffApi.getBookingQueue({ status: 'Completed', dateFrom, dateTo }),
        staffApi.getBookingQueue({ status: 'Expired', dateFrom, dateTo })
      ])
      const c = completed?.data ?? completed ?? []
      const e = expired?.data ?? expired ?? []
      const merged = [...(Array.isArray(c) ? c : []), ...(Array.isArray(e) ? e : [])]
        .sort((a, b) => new Date(b.StartTime) - new Date(a.StartTime))
      setHistoryList(merged)
    } catch { toast.error(t('staff.verifyBooking.errors.loadHistory')) }
    finally { setLoadingList(false) }
  }, [t, historyDateFilter])

  useEffect(() => { fetchPending() }, [fetchPending])
  useEffect(() => { if (tab === 'history') fetchHistory() }, [tab, fetchHistory])
  useEffect(() => { if (tab === 'history') { setHistoryList([]); fetchHistory() } }, [historyDateFilter]) // eslint-disable-line

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

  const handleCheckIn = async (booking, plateNumber) => {
    setChecking(true)
    try {
      const result = await staffApi.checkInBooking(booking.ReservationID, plateNumber)
      const data = result?.data
      toast.success(t('staff.verifyBooking.checkinSuccess', { code: booking.BookingCode }))
      navigate('/staff/checkin-success', {
        state: {
          actionType: 'booking-checkin',
          sessionCode: data?.sessionCode || null,
          session: {
            SessionCode: data?.sessionCode,
            PlateNumber: data?.session?.PlateNumber || plateNumber,
            VehicleName: booking?.VehicleName,
            SlotCode: booking?.SlotCode,
            EntryTime: data?.session?.EntryTime,
          }
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
    <div className="flex flex-col h-full bg-slate-50 pb-14">

      {/* Breadcrumb */}
      <div className="mb-2 text-sm text-slate-500 flex items-center gap-2">
        <ChevronLeft size={16} className="cursor-pointer" onClick={() => navigate(-1)} />
        <span>{t('staff.verifyBooking.breadcrumbStaff')}</span><ChevronRight size={14} />
        <span className="text-blue-600 font-medium">{t('staff.verifyBooking.breadcrumbCurrent')}</span>
      </div>

      <header className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold text-slate-800">{t('staff.verifyBooking.title')}</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-sm font-medium">
          {t('staff.verifyBooking.gateLabel')} <ShieldCheck size={16} />
        </div>
      </header>

      {/* Quick search */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 mb-5 flex gap-3 items-center">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder={t('staff.verifyBooking.searchPlaceholder')}
          className="flex-1 text-sm outline-none bg-transparent placeholder-slate-400"
        />
        {searchId && (
          <button onClick={() => { setSearchId(''); setSearchResult(null) }} className="text-slate-300 hover:text-slate-500">
            <XCircle size={15} />
          </button>
        )}
        <button
          onClick={handleSearch}
          disabled={searching || !searchId.trim()}
          className="px-4 py-1.5 bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-40 flex items-center gap-1.5 shrink-0"
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
          <div className="flex bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-1 gap-1 mb-2">
            <button
              onClick={() => setTab('pending')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'pending'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 shadow-md shadow-blue-200'
                : 'text-slate-500 hover:bg-slate-50'
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
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 shadow-md shadow-blue-200'
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <History size={15} />
              {t('staff.verifyBooking.tabHistory')}
            </button>
          </div>

          {/* Filters */}
          {tab === 'pending' ? (
            <div className="bg-white rounded-3xl border border-slate-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-3 py-2 mb-1.5 flex items-center gap-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                {t('staff.verifyBooking.timeFilter.label')}
              </p>
              <select
                value={timeWindow}
                onChange={e => setTimeWindow(e.target.value)}
                className="flex-1 text-xs font-semibold border border-slate-100 rounded-xl px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 cursor-pointer"
              >
                <option value="all">Tất cả</option>
                <optgroup label="── Giờ tới">
                  {Array.from({ length: 24 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={String(h)}>{h} giờ tới</option>
                  ))}
                </optgroup>
                <optgroup label="── Ngày tới">
                  {Array.from({ length: 29 }, (_, i) => i + 2).map(d => (
                    <option key={d} value={String(d * 24)}>{d} ngày tới</option>
                  ))}
                </optgroup>
              </select>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-3 py-2 mb-1.5 flex items-center gap-2 flex-wrap">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                {t('staff.verifyBooking.dateFilter.label')}
              </p>
              <div className="flex gap-1.5 flex-wrap flex-1">
                {[
                  { val: 'today', labelKey: 'staff.verifyBooking.dateFilter.today' },
                  { val: '1',     labelKey: 'staff.verifyBooking.dateFilter.1d' },
                  { val: '3',     labelKey: 'staff.verifyBooking.dateFilter.3d' },
                  { val: '7',     labelKey: 'staff.verifyBooking.dateFilter.7d' },
                  { val: '30',    labelKey: 'staff.verifyBooking.dateFilter.30d' }
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => { setHistoryDateFilter(opt.val); setSelected(null) }}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                      historyDateFilter === opt.val
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shadow-indigo-200'
                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Refresh + count */}
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {tab === 'pending'
                  ? t('staff.verifyBooking.pendingCount', { n: pendingList.length })
                  : t('staff.verifyBooking.historyCount', { n: historyList.length })}
              </p>
              {tab === 'history' && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {t(`staff.verifyBooking.dateFilter.${historyDateFilter === 'today' ? 'today' : historyDateFilter === '1' ? '1d' : historyDateFilter === '3' ? '3d' : historyDateFilter === '7' ? '7d' : '30d'}`)}
                </p>
              )}
            </div>
            <button
              onClick={tab === 'pending' ? fetchPending : fetchHistory}
              disabled={loadingList}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
            >
              <RefreshCcw size={12} className={loadingList ? 'animate-spin' : ''} /> {t('staff.verifyBooking.refresh')}
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pb-12">
            {loadingList ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-blue-400" size={24} />
              </div>
            ) : currentList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-100 p-10 text-center">
                {tab === 'pending' ? (
                  <>
                    <CheckCircle2 size={32} className="text-green-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600">{t('staff.verifyBooking.emptyPendingTitle')}</p>
                    <p className="text-xs text-slate-400 mt-1">{t('staff.verifyBooking.emptyPendingHint')}</p>
                  </>
                ) : (
                  <>
                    <History size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-600">{t('staff.verifyBooking.emptyHistoryTitle')}</p>
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
                  isPending={tab === 'pending'}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-12">
          {selectedBooking ? (
            <BookingDetailPanel
              booking={selectedBooking}
              onCheckIn={handleCheckIn}
              checking={checking}
              onClose={() => setSelected(null)}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-100 h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck size={28} className="text-blue-300" />
              </div>
              <p className="text-slate-700 font-bold mb-1">{t('staff.verifyBooking.placeholderTitle')}</p>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                {t('staff.verifyBooking.placeholderDesc')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100/60 py-3 px-6 z-20 flex justify-between items-center text-xs shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
          </div>
          <span className="font-bold text-slate-700 uppercase tracking-wide">{t('staff.verifyBooking.autoFlowLabel')}</span>
          <span className="hidden md:inline">
            {t('staff.verifyBooking.autoFlowStep1')} <span className="mx-1.5 text-slate-300">|</span>
            {t('staff.verifyBooking.autoFlowStep2')} <span className="mx-1.5 text-slate-300">|</span>
            {t('staff.verifyBooking.autoFlowStep3')}
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-medium">
          <Link to="/staff/user-guide" className="hover:text-blue-600 transition-colors">{t('staff.verifyBooking.footerGuide')}</Link>
          <span className="text-slate-200">|</span>
          <Link to="/staff/support" className="hover:text-blue-600 transition-colors">{t('staff.verifyBooking.footerSupport')}</Link>
          <span className="text-slate-200">|</span>
          <span>v2.4.0-stable</span>
        </div>
      </div>
    </div>
  )
}

export default StaffVerifyBooking