/**
 * FILE: DriverPayment.jsx
 * MÔ TẢ: Trang Thanh toán phí đỗ xe dành cho Driver.
 * Cho phép tài xế chọn phiên đỗ xe đang diễn ra, xem chi tiết phí dự kiến, 
 * tạo mã QR thanh toán (PayOS) hoặc thanh toán bằng ví, đồng thời hỗ trợ polling trạng thái giao dịch.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { toast } from 'react-toastify'
import {
  QrCode as QrCodeIcon,
  CheckCircle2 as CheckCircleIcon,
  XCircle as CancelIcon,
  Clock as ClockIcon,
  Car as CarIcon,
  Copy as CopyIcon,
  ExternalLink as ExternalIcon,
  RefreshCw as RefreshIcon,
  ArrowLeft as ArrowBackIcon,
  ShieldCheck as SecurityIcon,
  Smartphone as PhoneIcon,
  History as HistoryIcon,
  Bike as BikeIcon,
  Truck as TruckIcon,
  Wallet as WalletIcon,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import authorizeAxios from '../../utils/authorizeAxios'
import walletApi from '../../apis/walletApi'

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (n, currency = 'VNĐ') =>
  new Intl.NumberFormat('vi-VN').format(Number(n || 0)) + ' ' + currency

const fmtTime = (val) => {
  if (!val) return '--'
  const d = new Date(String(val).replace(/Z$/, ''))
  return isNaN(d.getTime()) ? '--' : d.toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

const getDuration = (entry, now = new Date()) => {
  const e = new Date(String(entry).replace(/Z$/, ''))
  if (isNaN(e.getTime())) return { text: '--', h: 0, m: 0, s: 0 }
  const totalSec = Math.max(0, Math.floor((now - e) / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return { text: `${h}h ${m}m ${s}s`, h, m, s, totalSec }
}

const getVehicleIcon = (code) => {
  const c = (code || '').toLowerCase()
  if (c.includes('moto') || c.includes('bike')) return <BikeIcon size={16} />
  if (c.includes('truck')) return <TruckIcon size={16} />
  return <CarIcon size={16} />
}

// ── Fee Calculation (khớp với sp_CalcParkingFeeV2) ───────────────
const DAY_BRACKETS = {
  1: [{ maxH: 4, fee: 5000 }, { maxH: 8, fee: 8000 }, { maxH: Infinity, fee: 15000 }],
  2: [{ maxH: 4, fee: 40000 }, { maxH: 8, fee: 70000 }, { maxH: Infinity, fee: 120000 }],
  3: [{ maxH: 4, fee: 70000 }, { maxH: 8, fee: 130000 }, { maxH: Infinity, fee: 200000 }]
}
const NIGHT_FEE = { 1: 12000, 2: 120000, 3: 200000 }

const splitDayNightSegs = (start, end) => {
  const segs = []
  let cur = new Date(start.getTime())
  while (cur < end) {
    const h = cur.getHours()
    const isDay = h >= 6 && h < 22
    const next = new Date(cur)
    if (isDay) { next.setHours(22, 0, 0, 0) }
    else if (h >= 22) { next.setDate(next.getDate() + 1); next.setHours(6, 0, 0, 0) }
    else { next.setHours(6, 0, 0, 0) }
    const clamped = next > end ? new Date(end) : next
    const mins = Math.floor((clamped - cur) / 60000)
    if (mins > 0) segs.push({ type: isDay ? 'day' : 'night', minutes: mins })
    cur = clamped
  }
  return segs
}

const calcBreakdown = (entryTime, vehicleTypeId) => {
  if (!entryTime || !vehicleTypeId) return null
  const entry = new Date(String(entryTime).replace(/Z$/, ''))
  const now = new Date()
  const totalMinutes = Math.max(0, Math.floor((now - entry) / 60000))
  const segs = splitDayNightSegs(entry, now)
  const brackets = DAY_BRACKETS[vehicleTypeId] ?? DAY_BRACKETS[1]
  const nightFee = NIGHT_FEE[vehicleTypeId] ?? NIGHT_FEE[1]
  let baseFee = 0
  const dayDetails = []
  let nightCount = 0
  segs.forEach(seg => {
    if (seg.type === 'night') { baseFee += nightFee; nightCount++ }
    else {
      const hours = seg.minutes / 60
      const idx = brackets.findIndex(b => hours <= b.maxH)
      const bi = idx === -1 ? brackets.length - 1 : idx
      baseFee += brackets[bi].fee
      dayDetails.push({ minutes: seg.minutes, hours, bracketIdx: bi, fee: brackets[bi].fee })
    }
  })
  return { totalMinutes, segments: segs, dayDetails, nightCount, nightFee, nightFeeTotal: nightCount * nightFee, baseFee, brackets, isOvernight: nightCount > 0, isMultiDay: dayDetails.length > 1 }
}

// ── QR Canvas ────────────────────────────────────────────────────
const QRCanvas = ({ data, size = 230 }) => {
  const { t } = useTranslation()
  const canvasRef = useRef(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!data || !canvasRef.current) return
    setError(false)
    QRCode.toCanvas(canvasRef.current, data, {
      width: size, margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M'
    }).catch(() => setError(true))
  }, [data, size])

  if (error) return (
    <div style={{ width: size, height: size }} className="flex items-center justify-center bg-slate-100 rounded-xl p-4 text-center">
      <span className="text-xs text-slate-500 font-medium">
        {t('driver.payment.qrError1')}<br />{t('driver.payment.qrError2')}
      </span>
    </div>
  )
  return (
    <div className="rounded-xl overflow-hidden shadow-md bg-white border border-slate-100 p-1">
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}

// ── Countdown ────────────────────────────────────────────────────
const Countdown = ({ expiredAt }) => {
  const { t } = useTranslation()
  const [rem, setRem] = useState(0)
  useEffect(() => {
    const exp = new Date(expiredAt).getTime()
    const tick = () => setRem(Math.max(0, Math.floor((exp - Date.now()) / 1000)))
    tick()
    const tm = setInterval(tick, 1000)
    return () => clearInterval(tm)
  }, [expiredAt])

  if (!rem) return <span className="text-red-500 font-bold text-sm">{t('driver.payment.expired')}</span>
  const m = Math.floor(rem / 60)
  const s = rem % 60
  return (
    <span className={`font-mono font-bold text-base ${rem < 120 ? 'text-red-400' : 'text-amber-400'}`}>
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  )
}

// ── CopyButton ───────────────────────────────────────────────────
const CopyButton = ({ text }) => {
  const { t } = useTranslation()
  const [done, setDone] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(String(text))
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }
  return (
    <button onClick={copy} className={`p-1.5 rounded-lg transition-colors ${done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} group relative`} title={done ? t('driver.payment.copied') : t('driver.payment.copy')}>
      {done ? <CheckCircleIcon size={16} /> : <CopyIcon size={16} />}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
        {done ? t('driver.payment.copied') : t('driver.payment.copy')}
      </div>
    </button>
  )
}

// ── Bảng giá theo loại xe ────────────────────────────────────────
const PricingTable = ({ data = [], vehicleName = '' }) => {
  const { t } = useTranslation()
  const cur = t('driver.common.currency')
  if (!data.length) return null
  return (
    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <h4 className="text-sm font-bold text-slate-500 mb-2">
        {t('driver.payment.pricingTitle', { vehicle: vehicleName })}
      </h4>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2 text-slate-600 font-bold">{t('driver.payment.colFrom')}</th>
              <th className="px-3 py-2 text-slate-600 font-bold">{t('driver.payment.colTo')}</th>
              <th className="px-3 py-2 text-slate-600 font-bold">{t('driver.payment.colFee')}</th>
              <th className="px-3 py-2 text-slate-600 font-bold">{t('driver.payment.colType')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-3 py-2 text-slate-700 font-medium">{row.MinHours}h</td>
                <td className="px-3 py-2 text-slate-700 font-medium">{row.MaxHours >= 999 ? '∞' : `${row.MaxHours}h`}</td>
                <td className="px-3 py-2 font-bold text-blue-600">
                  {fmt(row.Fee, cur)}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${row.IsOvernight ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {row.IsOvernight ? t('driver.payment.typeOvernight') : t('driver.payment.typeHourly')}
                  </span>
                  {Number(row.Fee) === 2000 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 ml-1">TEST</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Session Card ─────────────────────────────────────────────────
const SessionCard = ({ session, onPay, paying, now }) => {
  const { t } = useTranslation()
  const cur = t('driver.common.currency')
  const dur = getDuration(session.EntryTime, now)
  const isMe = paying?.SessionID === session.SessionID
  const isPrepaid = session.PaymentStatus === 'Prepaid'
  const surcharge = Number(session.SurchargeAmount ?? 0)
  const prepaid = Number(session.PrepaidAmount ?? 0)
  const bd = calcBreakdown(session.EntryTime, session.VehicleTypeID)
  const baseFee = bd ? bd.baseFee : Number(session.CurrentAmount || 0)
  const grandTotal = (isPrepaid ? prepaid : baseFee) + surcharge

  const bracketLabels = [
    t('driver.payment.bracketLabel0'),
    t('driver.payment.bracketLabel1'),
    t('driver.payment.bracketLabel2')
  ]

  const renderFeeRows = () => {
    if (!bd) return null
    if (bd.isOvernight || bd.isMultiDay) {
      let dayIdx = 0
      return bd.segments.map((seg, i) => {
        if (seg.type === 'night') {
          return (
            <div key={i} className="flex justify-between items-center px-4 py-2 bg-indigo-50 border-t border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-xs font-semibold text-indigo-700">
                  {t('driver.payment.nightSegment')}
                  <span className="text-indigo-400 ml-1">
                    ({Math.floor(seg.minutes / 60)}h{seg.minutes % 60 > 0 ? ` ${seg.minutes % 60}m` : ''})
                  </span>
                </span>
                <span className="px-1.5 py-0.5 bg-indigo-200 text-indigo-800 text-[10px] font-bold rounded">
                  {t('driver.payment.nightFlatRate')}
                </span>
              </div>
              <span className="text-xs font-black text-indigo-800">{fmt(bd.nightFee, cur)}</span>
            </div>
          )
        }
        dayIdx++
        const detail = bd.dayDetails[dayIdx - 1]
        const dH = Math.floor(seg.minutes / 60)
        const dM = seg.minutes % 60
        return (
          <div key={i} className={`flex justify-between items-center px-4 py-2 bg-sky-50 ${i > 0 ? 'border-t border-sky-100' : ''}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-500" />
              <span className="text-xs font-semibold text-sky-700">
                {t('driver.payment.daySegment')} {dayIdx}
                <span className="text-sky-400 ml-1">
                  ({dH}h{dM > 0 ? ` ${dM}m` : ''})
                </span>
              </span>
              {detail && (
                <span className="px-1.5 py-0.5 bg-sky-200 text-sky-900 text-[10px] font-bold rounded">
                  {bracketLabels[detail.bracketIdx] ?? '-'}
                </span>
              )}
            </div>
            <span className="text-xs font-black text-sky-800">
              {detail ? fmt(detail.fee, cur) : '—'}
            </span>
          </div>
        )
      })
    }

    // Simple case: show bracket table
    return bd.brackets.map((b, i) => {
      const isCurrent = bd.dayDetails[0] && i === bd.dayDetails[0].bracketIdx
      return (
        <div key={i} className={`flex justify-between items-center px-4 py-2 ${isCurrent ? 'bg-blue-50' : 'bg-transparent'} ${i > 0 ? 'border-t border-slate-100' : ''}`}>
          <div className="flex items-center gap-2">
            {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
            <span className={`text-xs ${isCurrent ? 'font-bold text-blue-700' : 'font-medium text-slate-500'}`}>
              {bracketLabels[i]}
            </span>
            {isCurrent && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">◀ hiện tại</span>}
          </div>
          <span className={`text-xs ${isCurrent ? 'font-black text-blue-700' : 'font-semibold text-slate-500'}`}>
            {fmt(b.fee, cur)}
          </span>
        </div>
      )
    })
  }

  return (
    <div className={`bg-white rounded-3xl overflow-hidden transition-all duration-300 border-[3px] ${isPrepaid ? 'border-amber-400' : 'border-transparent'} shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] group`}>
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-800 px-6 py-5 flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase mb-1">{t('driver.payment.plateLabel')}</p>
          <p className="text-2xl font-black text-white tracking-widest font-mono drop-shadow-md">{session.PlateNumber}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 relative z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-lg text-white border border-white/10 backdrop-blur-sm">
            {getVehicleIcon(session.VehicleCode)}
            <span className="text-xs font-bold">{session.VehicleName}</span>
          </div>
          {isPrepaid && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-400 text-amber-950 rounded-lg text-[10px] font-black uppercase">
              <CheckCircleIcon size={12} /> {t('driver.payment.prepaid')}
            </div>
          )}
          {bd?.isOvernight && (
            <div className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded text-[10px] font-bold">
              {t('driver.payment.overnightBadge')}
            </div>
          )}
        </div>
      </div>

      <div className="p-0">
        {/* Info: entry time, duration, location */}
        <div className="px-6 py-5 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">{t('driver.payment.entryAt')}</p>
              <p className="text-sm font-bold text-slate-800">{fmtTime(session.EntryTime)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">{t('driver.payment.parked')}</p>
              <p className="text-sm font-black text-blue-600">{dur.text}</p>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">{t('driver.payment.location')}</p>
              <p className="text-sm font-bold text-slate-800">
                {[session.BuildingName, session.FloorName, session.SlotCode].filter(Boolean).join(' / ')}
              </p>
            </div>
          </div>
        </div>

        {/* Fee breakdown */}
        <div>
          <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50 border-y border-slate-100">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{t('driver.payment.feeBreakdown')}</span>
            {(bd?.isOvernight || bd?.isMultiDay) && (
              <span className="text-[10px] font-medium text-slate-400">{t('driver.payment.multiDayNote')}</span>
            )}
          </div>
          
          <div className="bg-white">
            {renderFeeRows()}
          </div>

          {/* Tổng hợp */}
          <div className="border-t border-slate-100">
            {!isPrepaid && (
              <div className="flex justify-between items-center px-4 py-2 bg-white">
                <span className="text-xs font-semibold text-slate-500">{t('driver.payment.baseFee')}</span>
                <span className="text-xs font-bold text-slate-800">{fmt(baseFee, cur)}</span>
              </div>
            )}
            {isPrepaid && prepaid > 0 && (
              <div className="flex justify-between items-center px-4 py-2 bg-amber-50">
                <span className="text-xs font-semibold text-amber-700">{t('driver.payment.prepaid')}</span>
                <span className="text-xs font-bold text-amber-800">{fmt(prepaid, cur)}</span>
              </div>
            )}
            {surcharge > 0 && (
              <div className="flex justify-between items-center px-4 py-2 bg-orange-50">
                <span className="text-xs font-semibold text-orange-700">{t('driver.payment.surcharge')}</span>
                <span className="text-xs font-bold text-orange-800">+ {fmt(surcharge, cur)}</span>
              </div>
            )}
            <div className={`flex justify-between items-center px-6 py-4 border-t-2 ${isPrepaid ? 'bg-amber-50 border-amber-200' : 'bg-blue-50/50 border-blue-100'}`}>
              <span className={`text-sm font-black ${isPrepaid ? 'text-amber-900' : 'text-blue-900'}`}>{t('driver.payment.totalFee')}</span>
              <span className={`text-2xl font-black ${isPrepaid ? 'text-amber-600' : 'text-blue-600'}`}>{fmt(grandTotal, cur)}</span>
            </div>
          </div>
        </div>

        {/* CTA button */}
        <div className="px-6 py-5 bg-white border-t border-slate-100">
          <button 
            disabled={!!paying}
            onClick={() => onPay(session)}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] ${
              isPrepaid 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-500/20 hover:shadow-orange-500/40' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 hover:shadow-blue-500/40'
            } disabled:opacity-50 disabled:shadow-none`}
          >
            {isMe ? <Loader2 size={18} className="animate-spin" /> : <QrCodeIcon size={18} />}
            {isMe ? t('driver.payment.creatingQr') : isPrepaid ? t('driver.payment.createQrAgain') : t('driver.payment.createQr')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
const DriverPayment = () => {
  const { t } = useTranslation()
  const cur = t('driver.common.currency')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const statusFromUrl = params.get('status')

  const [step, setStep] = useState('select') // select | qr | done | fail
  const [sessions, setSessions] = useState([])
  const [loadingSessions, setLS] = useState(true)
  const [paying, setPaying] = useState(null)
  const [payment, setPayment] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [now, setNow] = useState(new Date())
  const [showPricing, setShowPricing] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [isWalletPaying, setIsWalletPaying] = useState(false)
  const pollerRef = useRef(null)

  // Clock — cập nhật "đã đỗ" mỗi giây
  useEffect(() => {
    const tm = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tm)
  }, [])

  // Fetch wallet balance
  useEffect(() => {
    walletApi.getBalance().then(res => {
      if (res.success) setWalletBalance(res.data.balance);
    }).catch(() => {});
  }, []);

  // Xử lý redirect từ PayOS — dùng ref để tránh setState sync trong effect
  const statusHandledRef = useRef(false)
  useEffect(() => {
    if (statusHandledRef.current) return
    statusHandledRef.current = true
    if (statusFromUrl === 'success') {
      setTimeout(() => setStep('done'), 0)
    } else if (statusFromUrl === 'cancel') {
      toast.info(t('driver.payment.toastCancelledPayos'))
    }
  }, [statusFromUrl, t])

  // Cleanup poller khi unmount
  useEffect(() => {
    return () => clearInterval(pollerRef.current)
  }, [])

  // Load sessions
  const loadSessions = useCallback(async () => {
    setLS(true)
    try {
      const r = await authorizeAxios.get('/driver/active-sessions')
      setSessions(r.data?.data || [])
    } catch {
      setSessions([])
    } finally {
      setLS(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => loadSessions(), 0)
    return () => clearTimeout(timer)
  }, [loadSessions])

  // Tạo QR
  const handlePay = async (session) => {
    setPaying(session)
    try {
      const r = await authorizeAxios.post('/driver/payment/create', { sessionId: session.SessionID })
      setPayment(r.data.data)
      setStep('qr')
      if (r.data.data.checkoutUrl !== 'FREE') {
        startPolling(r.data.data.orderCode)
      }
    } catch (e) {
      toast.error(e.response?.data?.message || t('driver.payment.toastCreateFail'))
      setPaying(null)
    }
  }

  // Poll trạng thái mỗi 3s
  const startPolling = (orderCode) => {
    clearInterval(pollerRef.current)
    pollerRef.current = setInterval(async () => {
      try {
        const r = await authorizeAxios.get(`/driver/payment/status/${orderCode}`)
        const s = r.data?.data?.status
        if (s === 'PAID') {
          clearInterval(pollerRef.current)
          setStep('done')
          toast.success(t('driver.payment.toastSuccess'))
        } else if (s === 'CANCELLED' || s === 'EXPIRED') {
          clearInterval(pollerRef.current)
          setStep('fail')
        }
      } catch {
        // tiếp tục poll
      }
    }, 3000)
  }

  // Huỷ đơn
  const handleCancel = async () => {
    setCancelling(true)
    clearInterval(pollerRef.current)
    try {
      if (payment?.orderCode) {
        await authorizeAxios.post('/driver/payment/cancel', { orderCode: payment.orderCode })
      }
    } catch {
      // bỏ qua
    } finally {
      setPayment(null)
      setPaying(null)
      setCancelling(false)
      setStep('select')
      loadSessions()
    }
  }

  // Thanh toán bằng ví
  const handlePayByWallet = async () => {
    try {
      if (walletBalance < payment.amount) {
        toast.error(t('driver.payment.walletInsufficient'))
        return
      }
      const res = await walletApi.payParking(paying.SessionID)
      if (res.success) {
        setStep('done')
        toast.success(t('driver.payment.walletSuccess'))
      }
    } catch (e) {
      toast.error(t('driver.payment.walletFail'))
    }
  }

  // ──────────────────────────────────────────────────────────────
  // STEP: select
  // ──────────────────────────────────────────────────────────────
  if (step === 'select') return (
    <div className="min-h-screen bg-slate-50 pt-6 pb-12 font-sans px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t('driver.payment.breadcrumb')}</p>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{t('driver.payment.title')}</h1>
          <p className="text-sm font-medium text-slate-500">{t('driver.payment.subtitle')}</p>
        </div>

        {loadingSessions ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CarIcon size={40} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{t('driver.payment.noSessions')}</h3>
            <p className="text-sm text-slate-500 mb-6">{t('driver.payment.noSessionsHint')}</p>
            <button onClick={() => navigate('/driver/home')} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-blue-500/20">
              {t('driver.common.goHome')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sessions.map(s => (
              <SessionCard key={s.SessionID} session={s} onPay={handlePay} paying={paying} now={now} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-8 opacity-60">
          <SecurityIcon size={14} className="text-slate-500" />
          <p className="text-xs font-medium text-slate-500">
            {t('driver.payment.secure')} <strong className="text-slate-700">PayOS</strong> · VietQR
          </p>
        </div>
      </div>
    </div>
  )

  // ──────────────────────────────────────────────────────────────
  // STEP: qr
  // ──────────────────────────────────────────────────────────────
  if (step === 'qr' && payment) return (
    <div className="min-h-screen bg-slate-50 pt-4 pb-12 font-sans px-4">
      <div className="max-w-md mx-auto">
        <button onClick={handleCancel} disabled={cancelling} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 mb-6 transition-colors group disabled:opacity-50">
          <ArrowBackIcon size={18} className="group-hover:-translate-x-1 transition-transform" />
          {t('driver.payment.backCancel')}
        </button>

        <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-900 px-6 py-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-2 text-white/80">
                <QrCodeIcon size={18} />
                <span className="text-sm font-bold">{t('driver.payment.scanToPay')}</span>
              </div>
              <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                {t('driver.payment.waiting')}
              </span>
            </div>

<<<<<<< HEAD
            <div className="text-center relative z-10">
              <p className="text-xs font-semibold text-white/60 mb-1 uppercase tracking-widest">{t('driver.payment.totalFee')}</p>
              <p className="text-[2.5rem] font-black tracking-tight leading-none mb-2">
                {fmt(payment.amount, cur)}
              </p>
              {payment.discountPercent > 0 && (
                <div className="inline-block px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg text-xs font-bold mt-2">
                  Đã giảm {payment.discountPercent}% (lượt {payment.sessionCount}) - Gói {payment.planId?.toUpperCase()}
                </div>
=======
          <Box textAlign="center">
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{t('driver.payment.totalFee')}</Typography>
            <Typography sx={{ fontSize: 40, fontWeight: 900, letterSpacing: -1 }}>
              {fmt(payment.amount, cur)}
            </Typography>
            {payment.discountPercent > 0 && (
              <Chip
                label={`Đã giảm ${payment.discountPercent}% (lượt ${payment.sessionCount}) - Gói ${payment.planId.toUpperCase()}`}
                size="small"
                sx={{ mt: 1, bgcolor: 'success.main', color: 'white', fontWeight: 'bold' }}
              />
            )}
          </Box>

          {payment.expiredAt && (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center"
              sx={{ mt: 2.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, py: 1.25 }}
            >
              <ClockIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{t('driver.payment.expiresIn')}</Typography>
              <Countdown expiredAt={payment.expiredAt} />
            </Stack>
          )}
        </Box>

        {payment.checkoutUrl !== 'FREE' && (
          <Box sx={{ px: 4, pt: 3 }}>
            <Button
              fullWidth
              variant="contained"
              disabled={isWalletPaying}
              onClick={async () => {
                try {
                  if (walletBalance < payment.amount) {
                    toast.error(t('driver.payment.walletInsufficient', 'Số dư ví không đủ!'));
                    return;
                  }
                  setIsWalletPaying(true);
                  const res = await walletApi.payParking(paying.SessionID);
                  if (res.success) {
                    setStep('done');
                    clearInterval(pollerRef.current);
                    toast.success(t('driver.payment.walletSuccess', 'Thanh toán bằng ví thành công!'));
                  }
                } catch (e) {
                  toast.error(t('driver.payment.walletFail', 'Thanh toán bằng ví thất bại!'));
                } finally {
                  setIsWalletPaying(false);
                }
              }}
              startIcon={<WalletIcon />}
              sx={{
                bgcolor: '#4f46e5',
                color: 'white',
                py: 1.5,
                fontWeight: 'bold',
                borderRadius: 2,
                '&:hover': { bgcolor: '#4338ca' }
              }}
            >
              {isWalletPaying ? 'Đang xử lý...' : `Thanh toán bằng Ví (Số dư: ${fmt(walletBalance)})`}
            </Button>
            
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 3, mb: 1 }}>
              <Divider sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                HOẶC CHUYỂN KHOẢN PAYOS
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Stack>
          </Box>
        )}

        {payment.checkoutUrl === 'FREE' ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={800} color="success.main" mb={1}>
              Miễn phí hoàn toàn!
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              Gói Hội viên của bạn chi trả toàn bộ phí đỗ xe cho lượt này. Vui lòng bấm xác nhận để hoàn tất.
            </Typography>
            <Button variant="contained" color="success" onClick={() => {
              setStep('done');
              toast.success(t('driver.payment.freeSuccess'));
            }} size="large" fullWidth>
              Xác Nhận Đã Thanh Toán (Miễn Phí)
            </Button>
          </Box>
        ) : (
          <>
            {/* QR */}
        <Box sx={{ bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, px: 4 }}>
          <Paper elevation={4} sx={{ p: 1.5, borderRadius: 3, bgcolor: '#fff', mb: 2 }}>
            <QRCanvas data={payment.qrCode} size={220} />
          </Paper>
          <Typography variant="caption" color="text.secondary" textAlign="center" mb={1.5}>
            {t('driver.payment.qrHint')}
          </Typography>
          <Stack direction="row" spacing={2} width="100%" justifyContent="center" mt={2}>
            <Button
              variant="outlined" size="small"
              startIcon={<ExternalIcon fontSize="small" />}
              onClick={() => window.open(payment.checkoutUrl, '_blank', 'noopener')}
              sx={{ flex: 1 }}
            >
              {t('driver.payment.openPayos')}
            </Button>
            <Button
              variant="contained" size="small"
              color="primary"
              startIcon={<WalletIcon fontSize="small" />}
              onClick={handlePayByWallet}
              sx={{ flex: 1 }}
            >
              Thanh toán ví ({fmt(walletBalance)})
            </Button>
          </Stack>
        </Box>

        {/* Thông tin CK */}
        <Box px={3} pb={2}>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>
            {t('driver.payment.manualTransfer')}
          </Typography>

          <Stack spacing={1.5} mt={1}>
            {[
              { label: t('driver.payment.accountNumber'), value: payment.accountNumber, mono: true, color: 'inherit', large: true },
              { label: t('driver.payment.accountName'), value: payment.accountName, mono: false, color: 'inherit' },
              { label: payment.discountPercent > 0 ? 'Tổng tiền (đã giảm)' : t('driver.payment.amount'), value: fmt(payment.amount, cur), mono: false, color: 'success.main', original: payment.fee },
              { label: t('driver.payment.transferContent'), value: payment.description, mono: true, color: 'warning.dark' }
            ].map(({ label, value, mono, color, large, original }) => (
              <Paper key={label} variant="outlined" sx={{
                px: 2, py: 1.5, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: color === 'success.main' ? 'success.50' : color === 'warning.dark' ? 'warning.50' : 'grey.50'
              }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  {original !== undefined && payment.discountPercent > 0 && (
                      <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.disabled', ml: 1 }}>
                        {fmt(original, cur)}
                      </Typography>
                  )}
                  <Typography
                    fontWeight={700}
                    fontSize={large ? 18 : 14}
                    fontFamily={mono ? 'monospace' : 'inherit'}
                    color={color}
                  >
                    {value}
                  </Typography>
                </Box>
                <CopyButton text={value} />
              </Paper>
            ))}
          </Stack>

          {/* Session info */}
          {payment.sessionInfo && (
            <Grid container spacing={2} mt={0.5}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{t('driver.payment.plate')}</Typography>
                <Typography fontWeight={700}>{payment.sessionInfo.plateNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">{t('driver.payment.location')}</Typography>
                <Typography fontWeight={700}>{payment.sessionInfo.slotCode}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">{t('driver.payment.entryAt')}</Typography>
                <Typography fontWeight={700}>{fmtTime(payment.sessionInfo.entryTime)}</Typography>
              </Grid>
            </Grid>
          )}

          {/* Bảng phí toggle */}
          {payment.pricingTable?.length > 0 && (
            <Box mt={2}>
              <Button
                size="small" variant="text"
                onClick={() => setShowPricing(v => !v)}
                sx={{ mb: 1, px: 0, fontWeight: 600 }}
              >
                {showPricing ? t('driver.payment.hidePricing') : t('driver.payment.showPricing')}
              </Button>
              {showPricing && (
                <PricingTable
                  data={payment.pricingTable}
                  vehicleName={payment.sessionInfo?.vehicleName}
                />
>>>>>>> 7054c7b0316fe9e878a1ab08111ca3545b35e59e
              )}
            </div>

            {payment.expiredAt && (
              <div className="flex items-center justify-center gap-2 mt-6 bg-white/10 rounded-xl py-3 border border-white/10 backdrop-blur-sm relative z-10">
                <ClockIcon size={16} className="text-white/70" />
                <span className="text-sm font-medium text-white/70">{t('driver.payment.expiresIn')}</span>
                <Countdown expiredAt={payment.expiredAt} />
              </div>
            )}
          </div>

          {payment.checkoutUrl === 'FREE' ? (
            <div className="p-10 text-center">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon size={48} className="text-green-500" />
              </div>
              <h3 className="text-2xl font-black text-green-600 mb-3">Miễn phí hoàn toàn!</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                Gói Hội viên của bạn chi trả toàn bộ phí đỗ xe cho lượt này. Vui lòng bấm xác nhận để hoàn tất.
              </p>
              <button onClick={() => { setStep('done'); toast.success(t('driver.payment.freeSuccess')); }} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-500/30 text-lg">
                Xác Nhận Đã Thanh Toán
              </button>
            </div>
          ) : (
            <>
              {/* QR */}
              <div className="bg-slate-50 flex flex-col items-center py-8 px-6 border-b border-slate-100">
                <QRCanvas data={payment.qrCode} size={240} />
                <p className="text-xs font-medium text-slate-500 text-center mt-4 mb-6">
                  {t('driver.payment.qrHint')}
                </p>
                <div className="flex gap-3 w-full">
                  <button onClick={() => window.open(payment.checkoutUrl, '_blank', 'noopener')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-colors shadow-sm">
                    <ExternalIcon size={16} /> {t('driver.payment.openPayos')}
                  </button>
                  <button onClick={handlePayByWallet} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-blue-500/20">
                    <WalletIcon size={16} /> Ví ({fmt(walletBalance)})
                  </button>
                </div>
              </div>

              {/* Thông tin CK */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('driver.payment.manualTransfer')}</span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: t('driver.payment.accountNumber'), value: payment.accountNumber, mono: true, bg: 'bg-slate-50', text: 'text-slate-800', lg: true },
                    { label: t('driver.payment.accountName'), value: payment.accountName, mono: false, bg: 'bg-slate-50', text: 'text-slate-800' },
                    { label: payment.discountPercent > 0 ? 'Tổng tiền (đã giảm)' : t('driver.payment.amount'), value: fmt(payment.amount, cur), mono: false, bg: 'bg-green-50', text: 'text-green-700', original: payment.fee },
                    { label: t('driver.payment.transferContent'), value: payment.description, mono: true, bg: 'bg-amber-50', text: 'text-amber-700' }
                  ].map(({ label, value, mono, bg, text, lg, original }) => (
                    <div key={label} className={`flex items-center justify-between p-4 rounded-2xl ${bg} border border-black/5`}>
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                        <div className="flex items-center gap-2">
                          <p className={`${mono ? 'font-mono' : 'font-sans'} font-bold ${lg ? 'text-lg' : 'text-sm'} ${text}`}>
                            {value}
                          </p>
                          {original !== undefined && payment.discountPercent > 0 && (
                            <p className="text-xs font-semibold text-slate-400 line-through">
                              {fmt(original, cur)}
                            </p>
                          )}
                        </div>
                      </div>
                      <CopyButton text={value} />
                    </div>
                  ))}
                </div>

                {/* Session info */}
                {payment.sessionInfo && (
                  <div className="grid grid-cols-2 gap-4 p-4 mt-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('driver.payment.plate')}</p>
                      <p className="text-sm font-bold text-slate-800">{payment.sessionInfo.plateNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('driver.payment.location')}</p>
                      <p className="text-sm font-bold text-slate-800">{payment.sessionInfo.slotCode}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('driver.payment.entryAt')}</p>
                      <p className="text-sm font-bold text-slate-800">{fmtTime(payment.sessionInfo.entryTime)}</p>
                    </div>
                  </div>
                )}

                {/* Bảng phí toggle */}
                {payment.pricingTable?.length > 0 && (
                  <div className="mt-4">
                    <button onClick={() => setShowPricing(v => !v)} className="flex items-center justify-center gap-2 w-full py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                      {showPricing ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {showPricing ? t('driver.payment.hidePricing') : t('driver.payment.showPricing')}
                    </button>
                    {showPricing && <PricingTable data={payment.pricingTable} vehicleName={payment.sessionInfo?.vehicleName} />}
                  </div>
                )}

                {/* Polling indicator */}
                <div className="mt-6 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                    <span className="text-xs font-bold text-slate-500">{t('driver.payment.waitingConfirm')}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-1/3 animate-[pulse_2s_ease-in-out_infinite] rounded-full translate-x-full"></div>
                  </div>
                </div>

                {/* Lưu ý prepaid */}
                <div className="mt-6 flex items-start gap-3 p-4 bg-blue-50 text-blue-800 rounded-2xl border border-blue-100">
                  <ClockIcon size={20} className="text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold mb-1">{t('driver.payment.prepayNoteTitle')}</h4>
                    <p className="text-xs font-medium opacity-80">{t('driver.payment.prepayNoteBody')}</p>
                  </div>
                </div>

                {/* Huỷ */}
                <button 
                  onClick={handleCancel} 
                  disabled={cancelling} 
                  className="w-full flex items-center justify-center gap-2 mt-6 py-3.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {cancelling ? <Loader2 size={18} className="animate-spin" /> : <CancelIcon size={18} />}
                  {t('driver.payment.cancelOrder')}
                </button>
              </div>
            </>
          )}

          {/* Hướng dẫn */}
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                <PhoneIcon size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-2">{t('driver.payment.qrGuideTitle')}</h4>
                <ol className="list-decimal list-inside text-xs font-medium text-slate-600 space-y-1.5">
                  <li>{t('driver.payment.qrGuide1')}</li>
                  <li>{t('driver.payment.qrGuide2')}</li>
                  <li>{t('driver.payment.qrGuide3')}</li>
                  <li>{t('driver.payment.qrGuide4')}</li>
                  <li>{t('driver.payment.qrGuide5')}</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 opacity-60">
          <SecurityIcon size={14} className="text-slate-500" />
          <p className="text-xs font-medium text-slate-500">
            {t('driver.payment.securedBy')} <strong className="text-slate-700">PayOS</strong> · VietQR
          </p>
        </div>
      </div>
    </div>
  )

  // ──────────────────────────────────────────────────────────────
  // STEP: done
  // ──────────────────────────────────────────────────────────────
  if (step === 'done') return (
    <div className="min-h-screen bg-slate-50 pt-10 pb-12 font-sans px-4">
      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-10 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 backdrop-blur-sm border border-white/20">
              <CheckCircleIcon size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-black mb-2 relative z-10 tracking-tight">{t('driver.payment.doneTitle')}</h2>
            <p className="text-sm font-medium text-green-50 relative z-10">
              {t('driver.payment.doneBody')}
            </p>
          </div>

          <div className="p-6">
            {payment && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 border-dashed">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('driver.payment.paidAmount')}</span>
                  <span className="text-lg font-black text-green-600">{fmt(payment.amount, cur)}</span>
                </div>
                {payment.sessionInfo && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-500">{t('driver.payment.plate')}</span>
                      <span className="text-sm font-bold text-slate-800">{payment.sessionInfo.plateNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-500">{t('driver.payment.location')}</span>
                      <span className="text-sm font-bold text-slate-800">{payment.sessionInfo.slotCode}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 border-dashed">
                  <span className="text-sm font-medium text-slate-500">{t('driver.payment.paidAt')}</span>
                  <span className="text-sm font-bold text-slate-800">{fmtTime(new Date())}</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 mb-6 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100">
              <ClockIcon size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold mb-1">{t('driver.payment.doneNoteTitle')}</h4>
                <p className="text-xs font-medium opacity-80">{t('driver.payment.doneNoteBody')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={() => navigate('/driver/home')} className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-green-500/20">
                {t('driver.common.goHome')}
              </button>
              <button onClick={() => navigate('/driver/history')} className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold rounded-xl transition-colors shadow-sm">
                <HistoryIcon size={18} /> {t('driver.common.viewHistory')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // ──────────────────────────────────────────────────────────────
  // STEP: fail
  // ──────────────────────────────────────────────────────────────
  if (step === 'fail') return (
    <div className="min-h-screen bg-slate-50 pt-10 pb-12 font-sans px-4">
      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100">
          <div className="bg-gradient-to-br from-red-500 to-rose-700 px-6 py-10 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 backdrop-blur-sm border border-white/20">
              <CancelIcon size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-black mb-2 relative z-10 tracking-tight">{t('driver.payment.failTitle')}</h2>
            <p className="text-sm font-medium text-red-50 relative z-10">
              {t('driver.payment.failBody')}
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              <button onClick={() => { setStep('select'); setPayment(null); setPaying(null); loadSessions() }} className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-red-500/20">
                <RefreshIcon size={18} /> {t('driver.common.retry')}
              </button>
              <button onClick={() => navigate('/driver/home')} className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold rounded-xl transition-colors shadow-sm">
                {t('driver.common.goHome')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return null
}

export default DriverPayment