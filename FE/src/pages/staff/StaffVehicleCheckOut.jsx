/**
 * FILE: StaffVehicleCheckOut.jsx
 * MÔ TẢ: Trang Quản lý Xe ra (Check-out) dành cho Staff.
 * Tìm kiếm các phiên đỗ xe đang Active (trong bãi), lọc/sắp xếp danh sách
 * và hỗ trợ thanh toán hoặc xử lý sự cố khi xe ra.
 */

// src/pages/staff/StaffVehicleCheckOut.jsx
import { useState, useEffect, useRef } from 'react'
import {
  ChevronRight, Search, FileSearch, AlertTriangle, AlertCircle,
  RefreshCcw, Loader2, Car, Clock, ArrowUp, ArrowDown,
  ArrowUpDown, X, SlidersHorizontal, Receipt, MapPin, TrendingUp,
  CalendarRange, Info, Moon, Sun, CheckCircle2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import staffApi from '../../apis/staffApi'
import ScrollToTopButton from '../common/ScrollToTopButton'
import { useTranslation } from 'react-i18next'

const formatVND = (v) => Number(v || 0).toLocaleString('vi-VN') + ' đ'

// Vietnam is UTC+7, no DST — shift trick: add offset then use UTC accessors
const VN_OFFSET_MS = 7 * 60 * 60 * 1000
const toVN = (dt) => new Date(new Date(dt).getTime() + VN_OFFSET_MS)

const calcDurationMinutes = (entryTime) => {
  if (!entryTime) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(entryTime).getTime()) / 60000))
}

// Bảng giá ban ngày theo bracket (đồng bộ với PricingPolicies trong DB)
const DAY_BRACKETS = {
  1: [{maxH: 4, fee: 5000},  {maxH: 8, fee: 8000},  {maxH: Infinity, fee: 15000}],  // MOTO
  2: [{maxH: 4, fee: 40000}, {maxH: 8, fee: 70000}, {maxH: Infinity, fee: 120000}], // CAR
  3: [{maxH: 4, fee: 70000}, {maxH: 8, fee: 130000},{maxH: Infinity, fee: 200000}], // TRUCK
}

const NIGHT_FEE = { 1: 12000, 2: 120000, 3: 200000 }

// Tách khoảng [start, end] thành các segment ngày (06:00-22:00) và đêm (22:00-06:00)
// Sử dụng giờ Việt Nam (UTC+7) để xác định ngày/đêm
const splitDayNightSegments = (start, end) => {
  const segs = []
  let cur = new Date(start.getTime())
  while (cur < end) {
    const vnCur = new Date(cur.getTime() + VN_OFFSET_MS)
    const h = vnCur.getUTCHours()
    const isDay = h >= 6 && h < 22
    const nextVN = new Date(vnCur)
    if (isDay) {
      nextVN.setUTCHours(22, 0, 0, 0)
    } else if (h >= 22) {
      nextVN.setUTCDate(nextVN.getUTCDate() + 1)
      nextVN.setUTCHours(6, 0, 0, 0)
    } else {
      nextVN.setUTCHours(6, 0, 0, 0)
    }
    let next = new Date(nextVN.getTime() - VN_OFFSET_MS)
    if (next > end) next = new Date(end)
    const mins = Math.floor((next - cur) / 60000)
    if (mins > 0) segs.push({ type: isDay ? 'day' : 'night', minutes: mins })
    cur = next
  }
  return segs
}

// Tính phí chính xác theo segment ngày/đêm — khớp với sp_CalcParkingFeeV2
const calcFeeBreakdown = (entryTime, vehicleTypeId) => {
  if (!entryTime || !vehicleTypeId) return null
  const entry = new Date(entryTime)
  const now = new Date()
  const totalMinutes = Math.max(0, Math.floor((now - entry) / 60000))
  const segs = splitDayNightSegments(entry, now)
  const brackets = DAY_BRACKETS[vehicleTypeId] ?? DAY_BRACKETS[1]
  const nightFee = NIGHT_FEE[vehicleTypeId] ?? NIGHT_FEE[1]

  let baseFee = 0
  const dayDetails = []
  let nightCount = 0

  segs.forEach(seg => {
    if (seg.type === 'night') {
      baseFee += nightFee
      nightCount++
    } else {
      const hours = seg.minutes / 60
      const idx = brackets.findIndex(b => hours <= b.maxH)
      const bracketIdx = idx === -1 ? brackets.length - 1 : idx
      const fee = brackets[bracketIdx].fee
      baseFee += fee
      dayDetails.push({ minutes: seg.minutes, hours, bracketIdx, fee })
    }
  })

  return {
    totalMinutes,
    segments: segs,
    dayDetails,
    nightCount,
    nightFee,
    nightFeeTotal: nightCount * nightFee,
    baseFee,
    brackets,
    isOvernight: nightCount > 0,
    isMultiDay: dayDetails.length > 1
  }
}

const calcBracketFee = (entryTime, vehicleTypeId) => {
  const bd = calcFeeBreakdown(entryTime, vehicleTypeId)
  return bd ? bd.baseFee : null
}

const hasPrepaid = (s) => s.PaymentStatus === 'Prepaid'

const getBookingCode = (s) => {
  if (s.BookingCode) return s.BookingCode
  if (s.PlateNumber?.toUpperCase().startsWith('BOOKING-')) {
    const id = s.PlateNumber.replace(/BOOKING-/i, '').padStart(4, '0')
    return `BK-${id}`
  }
  return null
}

const getDisplayFee = (s) => {
  if (s.FinalAmount != null) return Number(s.FinalAmount)
  const prepaid = Number(s.PrepaidAmount ?? 0)
  const surcharge = Number(s.SurchargeAmount ?? 0)
  if (prepaid > 0) return prepaid + surcharge
  // Tính phí ước tính theo bracket hiện tại (cập nhật theo thời gian thực)
  return calcBracketFee(s.EntryTime, s.VehicleTypeID) ?? Number(s.Amount ?? 0)
}

function sortSessions(list, key) {
  const arr = [...list]
  switch (key) {
  case 'newest': return arr.sort((a, b) => new Date(b.EntryTime) - new Date(a.EntryTime))
  case 'oldest': return arr.sort((a, b) => new Date(a.EntryTime) - new Date(b.EntryTime))
  case 'duration_desc': return arr.sort((a, b) => calcDurationMinutes(b.EntryTime) - calcDurationMinutes(a.EntryTime))
  case 'duration_asc': return arr.sort((a, b) => calcDurationMinutes(a.EntryTime) - calcDurationMinutes(b.EntryTime))
  case 'plate': return arr.sort((a, b) => (a.PlateNumber || '').localeCompare(b.PlateNumber || ''))
  case 'fee_desc': return arr.sort((a, b) => getDisplayFee(b) - getDisplayFee(a))
  default: return arr
  }
}

const fmtModalTime = (dt) => {
  if (!dt) return '—'
  const d = toVN(dt)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} — ${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`
}

const FeeBreakdownModal = ({ session, onClose }) => {
  const { t } = useTranslation()
  const bd = calcFeeBreakdown(session.EntryTime, session.VehicleTypeID)
  const isPrepaid = hasPrepaid(session)
  const surcharge = Number(session.SurchargeAmount ?? 0)
  const prepaid = Number(session.PrepaidAmount ?? 0)

  if (!bd) return null

  const totalH = Math.floor(bd.totalMinutes / 60)
  const totalM = bd.totalMinutes % 60
  const bracketLabels = [
    t('staff.checkout.feeModal.bracketLabel0'),
    t('staff.checkout.feeModal.bracketLabel1'),
    t('staff.checkout.feeModal.bracketLabel2')
  ]

  // Tổng hiển thị: nếu prepaid → dùng prepaid+surcharge, nếu không → baseFee+surcharge
  const baseForDisplay = isPrepaid ? prepaid : bd.baseFee
  const grandTotal = baseForDisplay + surcharge

  // Render nội dung tính phí: segment chi tiết (qua đêm) hoặc bracket table (đơn giản)
  const renderFeeDetail = () => {
    if (bd.isOvernight || bd.isMultiDay) {
      // Hiển thị từng segment
      let dayIdx = 0
      return (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
            <Receipt size={12} /> {t('staff.checkout.feeModal.segmentTitle')}
          </p>
          <p className="text-[11px] text-slate-400 mb-2">{t('staff.checkout.feeModal.multiDayNote')}</p>
          <div className="border border-slate-100 rounded-3xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs">
                  <th className="text-left px-3.5 py-2 font-semibold">{t('staff.checkout.feeModal.colTime')}</th>
                  <th className="text-left px-3.5 py-2 font-semibold text-[11px]">{t('staff.checkout.feeModal.colBracket')}</th>
                  <th className="text-right px-3.5 py-2 font-semibold">{t('staff.checkout.feeModal.colFee')}</th>
                </tr>
              </thead>
              <tbody>
                {bd.segments.map((seg, i) => {
                  if (seg.type === 'night') {
                    return (
                      <tr key={i} className="border-t border-slate-50 bg-indigo-50/60">
                        <td className="px-3.5 py-2.5 font-medium text-indigo-700 flex items-center gap-1.5">
                          <Moon size={11} /> {t('staff.checkout.feeModal.nightPart')}
                          <span className="text-[11px] text-indigo-500">
                            ({Math.floor(seg.minutes / 60)}h{seg.minutes % 60 > 0 ? ` ${seg.minutes % 60}m` : ''})
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-[11px] text-indigo-500">{t('staff.checkout.feeModal.nightFlatRate')}</td>
                        <td className="px-3.5 py-2.5 text-right font-black text-indigo-800">{formatVND(bd.nightFee)}</td>
                      </tr>
                    )
                  }
                  dayIdx++
                  const detail = bd.dayDetails[dayIdx - 1]
                  const dH = Math.floor(seg.minutes / 60)
                  const dM = seg.minutes % 60
                  return (
                    <tr key={i} className="border-t border-slate-50">
                      <td className="px-3.5 py-2.5 font-medium text-slate-700 flex items-center gap-1.5">
                        <Sun size={11} className="text-yellow-500" />
                        {t('staff.checkout.feeModal.dayPart')} {dayIdx}
                        <span className="text-[11px] text-slate-400">({dH}h{dM > 0 ? ` ${dM}m` : ''})</span>
                      </td>
                      <td className="px-3.5 py-2.5 text-[11px] text-slate-500">
                        {detail ? bracketLabels[detail.bracketIdx] : '—'}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-black text-slate-800">
                        {detail ? formatVND(detail.fee) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // Trường hợp đơn giản: bracket table
    return (
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
          <Sun size={12} className="text-yellow-500" /> {t('staff.checkout.feeModal.dayBracketTitle')}
        </p>
        <div className="border border-slate-100 rounded-3xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs">
                <th className="text-left px-3.5 py-2 font-semibold">{t('staff.checkout.feeModal.colTime')}</th>
                <th className="text-right px-3.5 py-2 font-semibold">{t('staff.checkout.feeModal.colFee')}</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {bd.brackets.map((b, i) => {
                const isCurrent = bd.dayDetails[0] && i === bd.dayDetails[0].bracketIdx
                return (
                  <tr key={i} className={isCurrent ? 'bg-blue-50' : 'border-t border-slate-50'}>
                    <td className={`px-3.5 py-2.5 font-medium ${isCurrent ? 'text-blue-700 border-t border-blue-100' : 'text-slate-700'}`}>
                      {bracketLabels[i] ?? `Bracket ${i + 1}`}
                    </td>
                    <td className={`px-3.5 py-2.5 text-right font-black ${isCurrent ? 'text-blue-800 border-t border-blue-100' : 'text-slate-800'}`}>
                      {formatVND(b.fee)}
                    </td>
                    <td className={`pr-3 py-2.5 text-center ${isCurrent ? 'border-t border-blue-100' : 'border-t border-slate-50'}`}>
                      {isCurrent && <CheckCircle2 size={14} className="text-blue-500 inline" />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Luôn hiển thị thông tin phí đêm để staff biết */}
        <div className="mt-2 px-1 flex items-center gap-1.5 text-[11px] text-indigo-500">
          <Moon size={10} />
          <span>{t('staff.checkout.feeModal.nightTitle')}: {session.VehicleName} = {formatVND(bd.nightFee)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-blue-600 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Receipt size={18} />
            <span className="font-bold text-base">{t('staff.checkout.feeModal.title')}</span>
            {bd.isOvernight && <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Moon size={10} /> {t('staff.checkout.card.overnightBadge')}</span>}
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Thông tin phiên */}
          <div className="bg-slate-50 rounded-3xl p-3.5 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('staff.checkout.feeModal.plate')}</span>
              <span className="font-black font-mono text-slate-800">{session.PlateNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('staff.checkout.feeModal.vehicleType')}</span>
              <span className="font-semibold text-slate-800">{session.VehicleName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{t('staff.checkout.feeModal.entryTime')}</span>
              <span className="font-semibold text-slate-800">{fmtModalTime(session.EntryTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">{t('staff.checkout.feeModal.duration')}</span>
              <span className="font-black text-blue-700 flex items-center gap-1">
                <Clock size={13} />
                {totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM} ${t('staff.checkout.feeModal.minute')}`}
              </span>
            </div>
          </div>

          {/* Chi tiết phí */}
          {renderFeeDetail()}

          {/* Tổng hợp phí */}
          <div className="border border-slate-100 rounded-3xl overflow-hidden">
            {!isPrepaid && (
              <div className="flex justify-between px-4 py-2.5 text-sm border-b border-slate-50">
                <span className="text-slate-600">{t('staff.checkout.feeModal.baseFee')}</span>
                <span className="font-bold text-slate-800">{formatVND(bd.baseFee)}</span>
              </div>
            )}
            {isPrepaid && (
              <div className="flex justify-between px-4 py-2.5 text-sm border-b border-slate-50 bg-green-50">
                <span className="text-green-700 font-medium">{t('staff.checkout.feeModal.prepaidLabel')}</span>
                <span className="font-bold text-green-800">{formatVND(prepaid)}</span>
              </div>
            )}
            {surcharge > 0 && (
              <div className="flex justify-between px-4 py-2.5 text-sm border-b border-slate-50 bg-orange-50">
                <span className="text-orange-700 font-medium flex items-center gap-1.5">
                  <AlertCircle size={12} /> {t('staff.checkout.feeModal.surcharge')}
                </span>
                <span className="font-bold text-orange-800">+ {formatVND(surcharge)}</span>
              </div>
            )}
            <div className={`flex items-center justify-between px-4 py-3 ${isPrepaid ? 'bg-green-50' : 'bg-blue-50'}`}>
              <span className={`font-bold text-sm ${isPrepaid ? 'text-green-700' : 'text-blue-700'}`}>
                {t('staff.checkout.feeModal.totalFee')}
              </span>
              <span className={`font-black text-xl ${isPrepaid ? 'text-green-800' : 'text-blue-800'}`}>
                {formatVND(grandTotal)}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center">{t('staff.checkout.feeModal.finalNote')}</p>
        </div>
      </div>
    </div>
  )
}

const FilterPopover = ({ vehicleType, setVehicleType, sortKey, setSortKey, onClose }) => {
  const { t } = useTranslation()

  const VEHICLE_FILTER_OPTIONS = [
    { value: 'all', label: t('staff.checkout.filter.vehicles.all') },
    { value: '1', label: t('staff.checkout.filter.vehicles.1') },
    { value: '2', label: t('staff.checkout.filter.vehicles.2') },
    { value: '3', label: t('staff.checkout.filter.vehicles.3') }
  ]

  const SORT_OPTIONS = [
    { value: 'newest', label: t('staff.checkout.filter.sorts.newest'), icon: ArrowDown },
    { value: 'oldest', label: t('staff.checkout.filter.sorts.oldest'), icon: ArrowUp },
    { value: 'duration_desc', label: t('staff.checkout.filter.sorts.duration_desc'), icon: ArrowDown },
    { value: 'duration_asc', label: t('staff.checkout.filter.sorts.duration_asc'), icon: ArrowUp },
    { value: 'plate', label: t('staff.checkout.filter.sorts.plate'), icon: ArrowUpDown },
    { value: 'fee_desc', label: t('staff.checkout.filter.sorts.fee_desc'), icon: ArrowDown }
  ]

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-3xl shadow-xl border border-slate-50 z-30 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-slate-800 text-sm">{t('staff.checkout.filter.title')}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={15} /></button>
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase mb-1.5">{t('staff.checkout.filter.vehicleType')}</p>
      <div className="flex flex-col gap-0.5 mb-4">
        {VEHICLE_FILTER_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => { setVehicleType(opt.value); onClose() }}
            className={`text-left px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${vehicleType === opt.value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
            {opt.label}
          </button>
        ))}
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase mb-1.5">{t('staff.checkout.filter.sortBy')}</p>
      <div className="flex flex-col gap-0.5">
        {SORT_OPTIONS.map(opt => {
          const Icon = opt.icon
          return (
            <button key={opt.value} onClick={() => { setSortKey(opt.value); onClose() }}
              className={`text-left px-3 py-1.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${sortKey === opt.value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Icon size={13} /> {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const SessionCard = ({ session, onCheckout, onShowFee }) => {
  const { t } = useTranslation()
  const formatDuration = (entryTime) => {
    const diff = calcDurationMinutes(entryTime)
    const h = Math.floor(diff / 60); const m = diff % 60
    return h === 0 ? `${m} ${t('staff.checkout.time.minute')}` : `${h}${t('staff.checkout.time.h')} ${m}${t('staff.checkout.time.m')}`
  }

  const formatTime = (dt) => {
    if (!dt) return '—'
    const d = toVN(dt)
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} — ${d.getUTCDate()} ${t('staff.checkout.time.month')}${d.getUTCMonth() + 1}`
  }

  const bookingCode = getBookingCode(session)
  const isBooking = !!bookingCode
  const isPrepaid = hasPrepaid(session)
  const isUnknown = session.PlateNumber === 'UNKNOWN'
  const durationMin = calcDurationMinutes(session.EntryTime)
  const isOverdue = durationMin >= 180
  const feeDisplay = getDisplayFee(session)
  const surcharge = Number(session.SurchargeAmount ?? 0)
  // Qua đêm = vào ngày khác hoặc đã đỗ hơn 16h (chắc chắn qua khung đêm)
  const vnDay = (dt) => { const d = toVN(dt); return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}` }
  const isOvernight = vnDay(session.EntryTime) !== vnDay(new Date()) || durationMin >= 16 * 60

  return (
    <div className={`bg-white border rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-all p-4 flex flex-col gap-3 ${isOverdue ? 'border-orange-200 hover:border-orange-400' : 'border-slate-50 hover:border-blue-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-blue-600 font-black text-sm shrink-0 font-mono">{session.SessionCode}</span>
          {isPrepaid && <span className="px-2 py-0.5 rounded-full text-xs font-bold shrink-0 bg-green-100 text-green-700">{t('staff.checkout.card.prepaidBadge')}</span>}
          {isOvernight && <span className="px-2 py-0.5 rounded-full text-xs font-bold shrink-0 bg-indigo-100 text-indigo-700 flex items-center gap-1"><Moon size={10} />{t('staff.checkout.card.overnightBadge')}</span>}
          {surcharge > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold shrink-0 bg-orange-100 text-orange-700 flex items-center gap-1"><AlertCircle size={10} />{t('staff.checkout.card.surchargeBadge')}</span>}
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${isBooking ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            {isBooking ? t('staff.checkout.card.bookingBadge') : t('staff.checkout.card.walkinBadge')}
          </span>
          {isBooking && <span className="text-xs text-purple-500 font-semibold">{bookingCode}</span>}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full shrink-0 ${isOverdue ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
          <Clock size={11} /> {formatDuration(session.EntryTime)}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${isUnknown ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-white'}`}>
          <Car size={13} />
          <span className="font-black text-sm tracking-wider">{isUnknown ? t('staff.checkout.card.unknownPlate') : session.PlateNumber}</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">{session.VehicleName}</span>
      </div>
      <div className="space-y-1 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <MapPin size={11} className="text-slate-400 shrink-0" />
          <span className="font-semibold">{session.SlotCode}</span>
          <span className="text-slate-400 truncate">· {session.ZoneName} · {session.FloorName} · {session.BuildingName}</span>
        </div>
        <div className="flex items-center gap-1.5"><Clock size={11} className="text-slate-400 shrink-0" /><span>{t('staff.checkout.card.entryTime')} {formatTime(session.EntryTime)}</span></div>
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-slate-400">{t('staff.checkout.card.driver')}</span>
          <span className="font-medium truncate">{session.DriverName}</span>
          {session.PhoneNumber && <span className="text-slate-400 ml-1">{session.PhoneNumber}</span>}
        </div>
      </div>
      <div className={`rounded-xl px-3 py-2 flex items-center justify-between ${isPrepaid ? 'bg-green-50' : 'bg-blue-50'}`}>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${isPrepaid ? 'text-green-700' : 'text-blue-600'}`}>{isPrepaid ? t('staff.checkout.card.prepaidLabel') : t('staff.checkout.card.estimatedFeeLabel')}</span>
          {!isPrepaid && (
            <button onClick={() => onShowFee(session)} title="Chi tiết phí"
              className="text-blue-400 hover:text-blue-600 transition-colors">
              <Info size={13} />
            </button>
          )}
        </div>
        <span className={`font-black text-sm ${isPrepaid ? 'text-green-800' : 'text-blue-800'}`}>{feeDisplay > 0 ? formatVND(feeDisplay) : '—'}</span>
      </div>
      <button onClick={() => onCheckout(session)}
        className={`w-full py-2 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${isPrepaid ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
        <Receipt size={14} />
        {isPrepaid ? t('staff.checkout.card.finishBtn') : t('staff.checkout.card.payBtn')}
      </button>
    </div>
  )
}

const StaffVehicleCheckOut = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [sessions, setSessions] = useState([])
  const [allSessions, setAllSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [vehicleType, setVehicleType] = useState('all')
  const [sortKey, setSortKey] = useState('newest')
  const [showFilter, setShowFilter] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [feeModal, setFeeModal] = useState(null)

  const filterRef = useRef(null)

  useEffect(() => {
    const h = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilter(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await staffApi.searchSessions({ status: 'Active' })
        if (!cancelled) {
          const raw = res?.data ?? res ?? []
          const data = Array.isArray(raw) ? raw : []
          setAllSessions(data)
          setSessions(data)
          setSearched(true)
        }
      } catch {
        if (!cancelled) {
          toast.error(t('staff.checkout.errors.loadFailed'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [refreshTrigger, t])

  const handleSearch = () => {
    const kw = query.trim().toLowerCase()
    const filtered = allSessions.filter(s => {
      const entry = new Date(s.EntryTime)
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(toDate + 'T23:59:59') : null
      const dateMatch = (!from || entry >= from) && (!to || entry <= to)
      const bk = getBookingCode(s) || ''
      const keywordMatch = !kw ||
        String(s.SessionID || '').includes(kw) ||
        (s.SessionCode || '').toLowerCase().includes(kw) ||
        (s.PlateNumber || '').toLowerCase().includes(kw) ||
        (s.DriverName || '').toLowerCase().includes(kw) ||
        bk.toLowerCase().includes(kw) ||
        (s.SlotCode || '').toLowerCase().includes(kw) ||
        (s.PhoneNumber || '').toLowerCase().includes(kw)
      return dateMatch && keywordMatch
    })
    setSessions(filtered)
    setSearched(true)
    if (filtered.length === 0) toast.info(t('staff.checkout.errors.noMatch'))
  }

  const handleReset = () => {
    setQuery(''); setVehicleType('all'); setSortKey('newest'); setFromDate(''); setToDate('')
    setRefreshTrigger(t => t + 1)
  }

  const displayed = sortSessions(
    (vehicleType === 'all' ? sessions : sessions.filter(s => String(s.VehicleTypeID) === vehicleType))
      .map(s => ({ ...s, _displayFee: getDisplayFee(s) })),
    sortKey
  )

  const activeFilters = (vehicleType !== 'all' ? 1 : 0) + (sortKey !== 'newest' ? 1 : 0) + (fromDate || toDate ? 1 : 0)
  const totalFee = displayed.reduce((sum, s) => sum + s._displayFee, 0)
  const prepaidCount = displayed.filter(hasPrepaid).length

  const VEHICLE_FILTER_OPTIONS = [
    { value: 'all', label: t('staff.checkout.filter.vehicles.all') },
    { value: '1', label: t('staff.checkout.filter.vehicles.1') },
    { value: '2', label: t('staff.checkout.filter.vehicles.2') },
    { value: '3', label: t('staff.checkout.filter.vehicles.3') }
  ]

  const SORT_OPTIONS = [
    { value: 'newest', label: t('staff.checkout.filter.sorts.newest'), icon: ArrowDown },
    { value: 'oldest', label: t('staff.checkout.filter.sorts.oldest'), icon: ArrowUp },
    { value: 'duration_desc', label: t('staff.checkout.filter.sorts.duration_desc'), icon: ArrowDown },
    { value: 'duration_asc', label: t('staff.checkout.filter.sorts.duration_asc'), icon: ArrowUp },
    { value: 'plate', label: t('staff.checkout.filter.sorts.plate'), icon: ArrowUpDown },
    { value: 'fee_desc', label: t('staff.checkout.filter.sorts.fee_desc'), icon: ArrowDown }
  ]

  return (
    <div className="flex flex-col min-h-full bg-slate-50 pb-12">
      <div className="mb-2 text-sm text-slate-500 flex items-center gap-2">
        <span>{t('staff.checkout.breadcrumb').split(' / ')[0]}</span><ChevronRight size={14} /><span>{t('staff.checkout.breadcrumb').split(' / ')[1]}</span><ChevronRight size={14} />
        <span className="text-blue-600 font-medium">{t('staff.checkout.title')}</span>
      </div>

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t('staff.checkout.title')}</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-sm font-medium">
          {t('staff.checkout.syncStatus')} <span className="w-2 h-2 rounded-full bg-green-500 ml-1 animate-pulse" />
        </div>
      </header>

      <div className="flex gap-6">
        <div className="flex-3 flex flex-col gap-5">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 p-5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1"><FileSearch size={18} className="text-blue-600" /> {t('staff.checkout.searchTitle')}</h3>
            <p className="text-xs text-slate-500 mb-3">
              {t('staff.checkout.searchHint')} <span className="font-semibold text-slate-700">{t('staff.checkout.searchHint2')}</span>
            </p>

            <div className="flex gap-3 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder={t('staff.checkout.searchPlaceholder')}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                {query && <button onClick={() => setQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"><X size={15} /></button>}
              </div>

              <div className="relative" ref={filterRef}>
                <button onClick={() => setShowFilter(v => !v)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${activeFilters > 0 ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
                  <SlidersHorizontal size={15} /> {t('staff.checkout.filterBtn')}
                  {activeFilters > 0 && <span className="bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 text-xs rounded-full w-4 h-4 flex items-center justify-center font-black">{activeFilters}</span>}
                </button>
                {showFilter && <FilterPopover vehicleType={vehicleType} setVehicleType={setVehicleType} sortKey={sortKey} setSortKey={setSortKey} onClose={() => setShowFilter(false)} />}
              </div>

              <button onClick={handleSearch} disabled={loading}
                className="px-5 py-2.5 bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 rounded-xl text-sm font-bold shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} {t('staff.checkout.searchBtn')}
              </button>

              <button onClick={handleReset} disabled={loading}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5">
                <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> {t('staff.checkout.resetBtn')}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <CalendarRange size={14} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500 font-medium">{t('staff.checkout.filterDateHint')}</span>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500" />
              <span className="text-slate-400 text-sm">→</span>
              <input type="date" value={toDate} min={fromDate || undefined} onChange={e => setToDate(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500" />
              {(fromDate || toDate) && <button onClick={() => { setFromDate(''); setToDate('') }} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"><X size={11} /> {t('staff.checkout.filterClear')}</button>}
            </div>

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
                {(fromDate || toDate) && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {fromDate || '...'} → {toDate || '...'}
                    <button onClick={() => { setFromDate(''); setToDate('') }}><X size={10} /></button>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-700">{t('staff.checkout.activeSessions')}</h3>
              {searched && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{displayed.length} {t('staff.checkout.sessionCount')}</span>}
              {prepaidCount > 0 && <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{prepaidCount} {t('staff.checkout.prepaidCount')}</span>}
            </div>
            {displayed.length > 0 && totalFee > 0 && (
              <span className="text-xs text-slate-500">{t('staff.checkout.totalFeeLabel')} <span className="font-black text-slate-800">{formatVND(totalFee)}</span></span>
            )}
          </div>

          <div className="pr-1 pb-4">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-blue-500" size={28} />
                  <p className="text-sm text-slate-400">{t('staff.checkout.loadingList')}</p>
                </div>
              </div>
            ) : displayed.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayed.map(session => (
                  <SessionCard key={session.SessionID} session={session}
                    onCheckout={(s) => navigate(`/staff/checkout/${s.SessionID}`)}
                    onShowFee={(s) => setFeeModal(s)} />
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 rounded-3xl p-10 flex flex-col items-center text-center bg-slate-50">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"><Search size={24} /></div>
                <h4 className="text-base font-bold text-slate-800 mb-2">
                  {query || fromDate || toDate ? t('staff.checkout.noSessionSearch') : t('staff.checkout.noSessionEmpty')}
                </h4>
                <p className="text-sm text-slate-500 max-w-md mb-5">{t('staff.checkout.noSessionHint')}</p>
                <div className="flex gap-3">
                  <button onClick={handleReset} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-slate-50"><RefreshCcw size={15} /> {t('staff.checkout.retryBtn')}</button>
                  <button onClick={() => navigate('/staff/create-incident')} className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-100"><AlertTriangle size={15} /> {t('staff.checkout.createIncidentBtn')}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-blue-50 rounded-3xl border border-blue-100 p-5">
            <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2"><ChevronRight size={16} className="text-blue-500" /> {t('staff.checkout.guidanceTitle')}</h3>
            <ul className="space-y-4 text-sm text-blue-800">
              {[t('staff.checkout.guidance1'), t('staff.checkout.guidance2'), t('staff.checkout.guidance3'), t('staff.checkout.guidance4')].map((txt, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">{i + 1}</span>
                  <span>{txt}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 bg-white rounded-xl p-4 border border-red-200 flex items-start gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800 mb-1">{t('staff.checkout.notFoundTitle')}</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">{t('staff.checkout.notFoundDesc')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-50 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <p className="text-xs font-bold text-slate-500 uppercase mb-3">{t('staff.checkout.quickStats')}</p>
            <div className="space-y-2.5 text-sm">
              {[
                { label: t('staff.checkout.statTotal'), value: allSessions.length, color: 'text-slate-800' },
                { label: t('staff.checkout.statWalkin'), value: allSessions.filter(s => !getBookingCode(s)).length, color: 'text-blue-600' },
                { label: t('staff.checkout.statBooking'), value: allSessions.filter(s => !!getBookingCode(s)).length, color: 'text-purple-600' },
                { label: t('staff.checkout.statPrepaid'), value: allSessions.filter(hasPrepaid).length, color: 'text-green-600' },
                { label: t('staff.checkout.statDisplayed'), value: displayed.length, color: 'text-slate-800' }
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-slate-500">{item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
              {totalFee > 0 && (
                <div className="border-t border-slate-50 pt-2 flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1"><TrendingUp size={12} /> {t('staff.checkout.totalFeeLabel')}</span>
                  <span className="font-black text-green-700 text-xs">{formatVND(totalFee)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-64 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center justify-between px-6 py-2.5 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> {t('staff.checkout.bottomReading')}</span>
            <span>{t('staff.checkout.bottomSync')}</span>
          </div>
          <div className="flex gap-4">
            <span>{t('staff.checkout.bottomNetwork')}</span>
            <a href="#" className="text-blue-600 hover:underline">{t('staff.checkout.bottomVerify')}</a>
          </div>
        </div>
      </div>

      <ScrollToTopButton />

      {feeModal && <FeeBreakdownModal session={feeModal} onClose={() => setFeeModal(null)} />}
    </div>
  )
}

export default StaffVehicleCheckOut