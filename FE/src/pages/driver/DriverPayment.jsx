/**
 * FILE: DriverPayment.jsx
 * MÔ TẢ: Trang Thanh toán phí đỗ xe dành cho Driver.
 * Cho phép tài xế chọn phiên đỗ xe đang diễn ra, xem chi tiết phí dự kiến, 
 * tạo mã QR thanh toán (PayOS) hoặc thanh toán bằng ví, đồng thời hỗ trợ polling trạng thái giao dịch.
 */

// src/pages/driver/DriverPayment.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { toast } from 'react-toastify'
import {
  Alert, AlertTitle, Box, Button, Card, CardContent, Chip,
  CircularProgress, Container, Divider, Grid, IconButton,
  LinearProgress, Paper, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, Tooltip, Typography
} from '@mui/material'
import {
  QrCode2 as QrCodeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as ClockIcon,
  DirectionsCar as CarIcon,
  ContentCopy as CopyIcon,
  OpenInNew as ExternalIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon,
  Smartphone as PhoneIcon,
  History as HistoryIcon,
  TwoWheeler as BikeIcon,
  LocalShipping as TruckIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material'
import authorizeAxios from '../../utils/authorizeAxios'
import walletApi from '../../apis/walletApi'

// ── Helpers ──────────────────────────────────────────────────────
// fmt cần currency để theo i18n; gọi từ component truyền vào
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
  if (c.includes('moto') || c.includes('bike')) return <BikeIcon />
  if (c.includes('truck')) return <TruckIcon />
  return <CarIcon />
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
    <Box sx={{
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'grey.100', borderRadius: 2, p: 2, textAlign: 'center'
    }}>
      <Typography variant="caption" color="text.secondary">
        {t('driver.payment.qrError1')}<br />{t('driver.payment.qrError2')}
      </Typography>
    </Box>
  )
  return (
    <Box sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </Box>
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

  if (!rem) return <Typography color="error" fontWeight={700} fontSize={14}>{t('driver.payment.expired')}</Typography>
  const m = Math.floor(rem / 60)
  const s = rem % 60
  return (
    <Typography
      fontFamily="monospace" fontWeight={700} fontSize={16}
      color={rem < 120 ? 'error.main' : 'warning.main'}
    >
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </Typography>
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
    <Tooltip title={done ? t('driver.payment.copied') : t('driver.payment.copy')}>
      <IconButton size="small" onClick={copy} color={done ? 'success' : 'default'}>
        {done ? <CheckCircleIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  )
}

// ── Bảng giá theo loại xe ────────────────────────────────────────
const PricingTable = ({ data = [], vehicleName = '' }) => {
  const { t } = useTranslation()
  const cur = t('driver.common.currency')
  if (!data.length) return null
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} mb={1} color="text.secondary">
        {t('driver.payment.pricingTitle', { vehicle: vehicleName })}
      </Typography>
      <Table size="small" sx={{ '& td,th': { py: 0.75, px: 1.5 } }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 700 }}>{t('driver.payment.colFrom')}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{t('driver.payment.colTo')}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{t('driver.payment.colFee')}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{t('driver.payment.colType')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i} hover>
              <TableCell>{row.MinHours}h</TableCell>
              <TableCell>{row.MaxHours >= 999 ? '∞' : `${row.MaxHours}h`}</TableCell>
              <TableCell>
                <Typography fontWeight={700} color="primary.main" fontSize={13}>
                  {fmt(row.Fee, cur)}
                </Typography>
              </TableCell>
              <TableCell>
                {row.IsOvernight
                  ? <Chip label={t('driver.payment.typeOvernight')} size="small" color="warning" />
                  : <Chip label={t('driver.payment.typeHourly')} size="small" color="default" />
                }
                {Number(row.Fee) === 2000 && (
                  <Chip label="TEST" size="small" color="error" sx={{ ml: 0.5 }} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
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
            <Stack key={i} direction="row" justifyContent="space-between" alignItems="center"
              sx={{ px: 2, py: 1, bgcolor: '#eef2ff', borderTop: '1px solid #e0e7ff' }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6366f1' }} />
                <Typography variant="caption" color="#4338ca" fontWeight={600}>
                  {t('driver.payment.nightSegment')}
                  <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                    ({Math.floor(seg.minutes / 60)}h{seg.minutes % 60 > 0 ? ` ${seg.minutes % 60}m` : ''})
                  </Typography>
                </Typography>
                <Chip label={t('driver.payment.nightFlatRate')} size="small"
                  sx={{ fontSize: 10, height: 18, bgcolor: '#c7d2fe', color: '#3730a3' }} />
              </Stack>
              <Typography variant="caption" fontWeight={800} color="#3730a3">{fmt(bd.nightFee, cur)}</Typography>
            </Stack>
          )
        }
        dayIdx++
        const detail = bd.dayDetails[dayIdx - 1]
        const dH = Math.floor(seg.minutes / 60)
        const dM = seg.minutes % 60
        return (
          <Stack key={i} direction="row" justifyContent="space-between" alignItems="center"
            sx={{ px: 2, py: 1, bgcolor: '#f0f9ff', borderTop: i > 0 ? '1px solid #e0f2fe' : 'none' }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0ea5e9' }} />
              <Typography variant="caption" color="#0369a1" fontWeight={600}>
                {t('driver.payment.daySegment')} {dayIdx}
                <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 0.5 }}>
                  ({dH}h{dM > 0 ? ` ${dM}m` : ''})
                </Typography>
              </Typography>
              {detail && (
                <Chip label={bracketLabels[detail.bracketIdx] ?? '-'} size="small"
                  sx={{ fontSize: 10, height: 18, bgcolor: '#bae6fd', color: '#0c4a6e' }} />
              )}
            </Stack>
            <Typography variant="caption" fontWeight={800} color="#0369a1">
              {detail ? fmt(detail.fee, cur) : '—'}
            </Typography>
          </Stack>
        )
      })
    }

    // Simple case: show bracket table
    return bd.brackets.map((b, i) => {
      const isCurrent = bd.dayDetails[0] && i === bd.dayDetails[0].bracketIdx
      return (
        <Stack key={i} direction="row" justifyContent="space-between" alignItems="center"
          sx={{
            px: 2, py: 0.875,
            bgcolor: isCurrent ? '#eff6ff' : 'transparent',
            borderTop: i > 0 ? '1px solid #f1f5f9' : 'none'
          }}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            {isCurrent && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2563eb' }} />}
            <Typography variant="caption" color={isCurrent ? '#1d4ed8' : 'text.secondary'} fontWeight={isCurrent ? 700 : 500}>
              {bracketLabels[i]}
            </Typography>
            {isCurrent && <Chip label="◀ hiện tại" size="small"
              sx={{ fontSize: 10, height: 18, bgcolor: '#dbeafe', color: '#1d4ed8' }} />}
          </Stack>
          <Typography variant="caption" fontWeight={isCurrent ? 800 : 500} color={isCurrent ? '#1d4ed8' : 'text.secondary'}>
            {fmt(b.fee, cur)}
          </Typography>
        </Stack>
      )
    })
  }

  return (
    <Card variant="outlined" sx={{
      borderRadius: 3, overflow: 'hidden',
      border: isPrepaid ? '2px solid' : '1px solid',
      borderColor: isPrepaid ? 'warning.main' : 'divider',
      transition: 'box-shadow .2s',
      '&:hover': { boxShadow: 6 }
    }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1e293b 0%, #1d4ed8 100%)',
        px: 3, py: 2.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, letterSpacing: 2, mb: 0.25 }}>
            {t('driver.payment.plateLabel')}
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: 4, fontFamily: 'monospace' }}>
            {session.PlateNumber}
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={0.75}>
          <Chip icon={getVehicleIcon(session.VehicleCode)} label={session.VehicleName} size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', '& .MuiChip-icon': { color: '#fff' } }} />
          {isPrepaid && <Chip label={t('driver.payment.prepaid')} size="small" color="warning" icon={<CheckCircleIcon />} />}
          {bd?.isOvernight && (
            <Chip label={t('driver.payment.overnightBadge')} size="small"
              sx={{ bgcolor: 'rgba(99,102,241,0.3)', color: '#c7d2fe', fontSize: 11 }} />
          )}
        </Stack>
      </Box>

      <CardContent sx={{ p: 0 }}>
        {/* Info: entry time, duration, location */}
        <Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.25}>
                {t('driver.payment.entryAt')}
              </Typography>
              <Typography variant="body2" fontWeight={700} fontSize={13}>{fmtTime(session.EntryTime)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.25}>
                {t('driver.payment.parked')}
              </Typography>
              <Typography variant="body2" fontWeight={700} fontSize={13} color="primary.main">{dur.text}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.25}>
                {t('driver.payment.location')}
              </Typography>
              <Typography variant="body2" fontWeight={700} fontSize={13}>
                {[session.BuildingName, session.FloorName, session.SlotCode].filter(Boolean).join(' / ')}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Fee breakdown */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.25, bgcolor: '#f8fafc' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('driver.payment.feeBreakdown')}
            </Typography>
            {(bd?.isOvernight || bd?.isMultiDay) && (
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                {t('driver.payment.multiDayNote')}
              </Typography>
            )}
          </Stack>

          {renderFeeRows()}

          {/* Tổng hợp */}
          <Divider />
          {!isPrepaid && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{t('driver.payment.baseFee')}</Typography>
              <Typography variant="caption" fontWeight={700}>{fmt(baseFee, cur)}</Typography>
            </Stack>
          )}
          {isPrepaid && prepaid > 0 && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1, bgcolor: '#fffbeb' }}>
              <Typography variant="caption" color="warning.dark" fontWeight={600}>{t('driver.payment.prepaid')}</Typography>
              <Typography variant="caption" fontWeight={700} color="warning.dark">{fmt(prepaid, cur)}</Typography>
            </Stack>
          )}
          {surcharge > 0 && (
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1, bgcolor: '#fff7ed' }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="caption" color="warning.dark" fontWeight={600}>{t('driver.payment.surcharge')}</Typography>
              </Stack>
              <Typography variant="caption" fontWeight={700} color="warning.dark">+ {fmt(surcharge, cur)}</Typography>
            </Stack>
          )}
          <Stack direction="row" justifyContent="space-between" alignItems="center"
            sx={{ px: 2, py: 1.5, bgcolor: isPrepaid ? '#fefce8' : '#eff6ff', borderTop: '2px solid', borderColor: isPrepaid ? 'warning.light' : 'primary.light' }}>
            <Typography fontWeight={800} color={isPrepaid ? 'warning.dark' : 'primary.dark'} fontSize={14}>
              {t('driver.payment.totalFee')}
            </Typography>
            <Typography fontWeight={900} fontSize={20} color={isPrepaid ? 'warning.dark' : 'primary.dark'}>
              {fmt(grandTotal, cur)}
            </Typography>
          </Stack>
        </Box>

        {/* CTA button */}
        <Box sx={{ px: 3, py: 2.5 }}>
          <Button fullWidth variant="contained"
            startIcon={isMe ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <QrCodeIcon />}
            disabled={!!paying}
            onClick={() => onPay(session)}
            sx={{
              py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: 15,
              background: isPrepaid
                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                : 'linear-gradient(90deg, #2563eb, #1d4ed8)',
              boxShadow: isPrepaid ? '0 4px 12px rgba(245,158,11,0.35)' : '0 4px 12px rgba(37,99,235,0.35)',
              '&:hover': { opacity: 0.92, boxShadow: 'none' }
            }}>
            {isMe ? t('driver.payment.creatingQr') : isPrepaid ? t('driver.payment.createQrAgain') : t('driver.payment.createQr')}
          </Button>
        </Box>
      </CardContent>
    </Card>
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

  // ✅ FIX: Xử lý redirect từ PayOS — dùng ref để tránh setState sync trong effect
  const statusHandledRef = useRef(false)
  useEffect(() => {
    if (statusHandledRef.current) return
    statusHandledRef.current = true
    if (statusFromUrl === 'success') {
      // Dùng setTimeout để tránh setState synchronous trong render cycle
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
    const timer = setTimeout(() => {
      loadSessions()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadSessions])

  // Tạo QR
  const handlePay = async (session) => {
    setPaying(session)
    try {
      const r = await authorizeAxios.post('/driver/payment/create', {
        sessionId: session.SessionID
      })
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
    <Container maxWidth="md" sx={{ py: 0 }}>
      <Box mb={3}>
        <Typography variant="caption" color="text.secondary">
          {t('driver.payment.breadcrumb')}
        </Typography>
        <Typography variant="h5" fontWeight={800} mt={0.5}>
          {t('driver.payment.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('driver.payment.subtitle')}
        </Typography>
      </Box>

      {loadingSessions ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      ) : sessions.length === 0 ? (
        <Paper variant="outlined" sx={{
          borderRadius: 3, p: 6, textAlign: 'center',
          borderStyle: 'dashed', borderColor: 'divider'
        }}>
          <CarIcon sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
          <Typography fontWeight={700} mb={1}>{t('driver.payment.noSessions')}</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {t('driver.payment.noSessionsHint')}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/driver/home')}>
            {t('driver.common.goHome')}
          </Button>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {sessions.map(s => (
            <SessionCard
              key={s.SessionID}
              session={s}
              onPay={handlePay}
              paying={paying}
              now={now}
            />
          ))}
        </Stack>
      )}

      <Box display="flex" justifyContent="center" alignItems="center" gap={1} mt={3}>
        <SecurityIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" color="text.disabled">
          {t('driver.payment.secure')} <strong>PayOS</strong> · VietQR
        </Typography>
      </Box>
    </Container>
  )

  // ──────────────────────────────────────────────────────────────
  // STEP: qr
  // ──────────────────────────────────────────────────────────────
  if (step === 'qr' && payment) return (
    <Container maxWidth="sm" sx={{ py: 0 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleCancel}
        disabled={cancelling}
        sx={{ mb: 2, color: 'text.secondary' }}
      >
        {t('driver.payment.backCancel')}
      </Button>

      <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 4 }}>
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          px: 4, py: 4, color: '#fff'
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <QrCodeIcon />
              <Typography fontWeight={700} fontSize={14} sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {t('driver.payment.scanToPay')}
              </Typography>
            </Stack>
            <Chip
              label={t('driver.payment.waiting')}
              size="small"
              sx={{
                bgcolor: 'rgba(251,191,36,0.2)', color: '#fde68a',
                border: '1px solid rgba(251,191,36,0.4)'
              }}
            />
          </Stack>

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
              )}
            </Box>
          )}

          {/* Polling indicator */}
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" mt={2}>
            <CircularProgress size={12} thickness={5} sx={{ color: 'primary.light' }} />
            <Typography variant="caption" color="text.secondary">
              {t('driver.payment.waitingConfirm')}
            </Typography>
          </Stack>
          <LinearProgress sx={{ mt: 1, borderRadius: 1, height: 3 }} />
          {/* Lưu ý prepaid */}
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }} icon={<ClockIcon />}>
            <AlertTitle>{t('driver.payment.prepayNoteTitle')}</AlertTitle>
            {t('driver.payment.prepayNoteBody')}
          </Alert>

          {/* Huỷ */}
          <Button
            fullWidth variant="outlined" color="error"
            startIcon={cancelling ? <CircularProgress size={16} /> : <CancelIcon />}
            disabled={cancelling}
            onClick={handleCancel}
            sx={{ mt: 2, borderRadius: 2, py: 1.25 }}
          >
            {t('driver.payment.cancelOrder')}
          </Button>
        </Box>
      </>
      )}

        {/* Hướng dẫn */}
        <Box mx={3} mb={3}>
          <Alert severity="info" sx={{ borderRadius: 2 }} icon={<PhoneIcon />}>
            <AlertTitle sx={{ fontWeight: 700 }}>{t('driver.payment.qrGuideTitle')}</AlertTitle>
            <Box component="ol" sx={{ pl: 2, m: 0, '& li': { mb: 0.5 } }}>
              <li>{t('driver.payment.qrGuide1')}</li>
              <li>{t('driver.payment.qrGuide2')}</li>
              <li>{t('driver.payment.qrGuide3')}</li>
              <li>{t('driver.payment.qrGuide4')}</li>
              <li>{t('driver.payment.qrGuide5')}</li>
            </Box>
          </Alert>
        </Box>
      </Card>

      <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" mt={2}>
        <SecurityIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" color="text.disabled">
          {t('driver.payment.securedBy')} <strong>PayOS</strong> · VietQR
        </Typography>
      </Stack>
    </Container>
  )

  // ──────────────────────────────────────────────────────────────
  // STEP: done
  // ──────────────────────────────────────────────────────────────
  if (step === 'done') return (
    <Container maxWidth="sm" sx={{ py: 0 }}>
      <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 4 }}>
        <Box sx={{
          background: 'linear-gradient(135deg, #16a34a, #059669)',
          px: 5, py: 7, textAlign: 'center', color: '#fff'
        }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2
          }}>
            <CheckCircleIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h5" fontWeight={900} mb={1}>{t('driver.payment.doneTitle')}</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            {t('driver.payment.doneBody')}
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {payment && (
            <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, mb: 3 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{t('driver.payment.paidAmount')}</Typography>
                  <Typography fontWeight={800} color="success.main">{fmt(payment.amount, cur)}</Typography>
                </Stack>
                {payment.sessionInfo && (
                  <>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">{t('driver.payment.plate')}</Typography>
                      <Typography fontWeight={700}>{payment.sessionInfo.plateNumber}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">{t('driver.payment.location')}</Typography>
                      <Typography fontWeight={700}>{payment.sessionInfo.slotCode}</Typography>
                    </Stack>
                  </>
                )}
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{t('driver.payment.paidAt')}</Typography>
                  <Typography fontWeight={700}>{fmtTime(new Date())}</Typography>
                </Stack>
              </Stack>
            </Paper>
          )}

          <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
            <AlertTitle>{t('driver.payment.doneNoteTitle')}</AlertTitle>
            {t('driver.payment.doneNoteBody')}
          </Alert>

          <Stack spacing={1.5}>
            <Button
              fullWidth variant="contained" color="success"
              onClick={() => navigate('/driver/home')}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
            >
              {t('driver.common.goHome')}
            </Button>
            <Button
              fullWidth variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => navigate('/driver/history')}
              sx={{ py: 1.25, borderRadius: 2 }}
            >
              {t('driver.common.viewHistory')}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )

  // ──────────────────────────────────────────────────────────────
  // STEP: fail
  // ──────────────────────────────────────────────────────────────
  if (step === 'fail') return (
    <Container maxWidth="sm" sx={{ py: 0 }}>
      <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 4 }}>
        <Box sx={{
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          px: 5, py: 7, textAlign: 'center', color: '#fff'
        }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2
          }}>
            <CancelIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h5" fontWeight={900} mb={1}>{t('driver.payment.failTitle')}</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            {t('driver.payment.failBody')}
          </Typography>
        </Box>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={1.5}>
            <Button
              fullWidth variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => { setStep('select'); setPayment(null); setPaying(null); loadSessions() }}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
            >
              {t('driver.common.retry')}
            </Button>
            <Button
              fullWidth variant="outlined"
              onClick={() => navigate('/driver/home')}
              sx={{ py: 1.25, borderRadius: 2 }}
            >
              {t('driver.common.goHome')}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )

  return null
}

export default DriverPayment