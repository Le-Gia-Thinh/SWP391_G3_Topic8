// src/pages/driver/DriverPayment.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react'
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
  LocalShipping as TruckIcon
} from '@mui/icons-material'
import authorizeAxios from '../../utils/authorizeAxios'

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('vi-VN').format(Number(n || 0)) + ' VNĐ'

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

// ── QR Canvas ────────────────────────────────────────────────────
const QRCanvas = ({ data, size = 230 }) => {
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
        Không hiển thị QR được.<br />Dùng link PayOS bên dưới.
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
  const [rem, setRem] = useState(0)
  useEffect(() => {
    const exp = new Date(expiredAt).getTime()
    const tick = () => setRem(Math.max(0, Math.floor((exp - Date.now()) / 1000)))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [expiredAt])

  if (!rem) return <Typography color="error" fontWeight={700} fontSize={14}>Hết hạn</Typography>
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
  const [done, setDone] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(String(text))
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }
  return (
    <Tooltip title={done ? 'Đã copy!' : 'Copy'}>
      <IconButton size="small" onClick={copy} color={done ? 'success' : 'default'}>
        {done ? <CheckCircleIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  )
}

// ── Bảng giá theo loại xe ────────────────────────────────────────
const PricingTable = ({ data = [], vehicleName = '' }) => {
  if (!data.length) return null
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} mb={1} color="text.secondary">
        Bảng phí — {vehicleName}
      </Typography>
      <Table size="small" sx={{ '& td,th': { py: 0.75, px: 1.5 } }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 700 }}>Từ giờ</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Đến giờ</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Phí</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i} hover>
              <TableCell>{row.MinHours}h</TableCell>
              <TableCell>{row.MaxHours >= 999 ? '∞' : `${row.MaxHours}h`}</TableCell>
              <TableCell>
                <Typography fontWeight={700} color="primary.main" fontSize={13}>
                  {fmt(row.Fee)}
                </Typography>
              </TableCell>
              <TableCell>
                {row.IsOvernight
                  ? <Chip label="Qua đêm" size="small" color="warning" />
                  : <Chip label="Theo giờ" size="small" color="default" />
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
  const dur = getDuration(session.EntryTime, now)
  const isMe = paying?.SessionID === session.SessionID
  const isPrepaid = session.PaymentStatus === 'Prepaid'

  return (
    <Card variant="outlined" sx={{
      borderRadius: 3, overflow: 'hidden',
      border: isPrepaid ? '2px solid' : '1px solid',
      borderColor: isPrepaid ? 'warning.main' : 'divider',
      transition: 'box-shadow .2s',
      '&:hover': { boxShadow: 4 }
    }}>
      <Box sx={{
        background: 'linear-gradient(135deg, #1e293b 0%, #1d4ed8 100%)',
        px: 3, py: 2.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 2, mb: 0.25 }}>
            BIỂN SỐ XE
          </Typography>
          <Typography sx={{ color: '#fff', fontSize: 24, fontWeight: 900, letterSpacing: 4, fontFamily: 'monospace' }}>
            {session.PlateNumber}
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={0.5}>
          <Chip
            icon={getVehicleIcon(session.VehicleCode)}
            label={session.VehicleName}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', '& .MuiChip-icon': { color: '#fff' } }}
          />
          {isPrepaid && (
            <Chip label="Đã trả trước" size="small" color="warning" icon={<CheckCircleIcon />} />
          )}
        </Stack>
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={2} mb={2.5}>
          {[
            ['Vào lúc', fmtTime(session.EntryTime)],
            ['Đã đỗ', dur.text],
            ['Vị trí', `${session.BuildingName} / ${session.FloorName} / ${session.SlotCode}`],
            ['Phí tạm tính', fmt(session.CurrentAmount || 0)]
          ].map(([label, value]) => (
            <Grid item xs={6} key={label}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.25} fontWeight={600}>
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={700}>{value}</Typography>
            </Grid>
          ))}
        </Grid>

        {isPrepaid && session.SurchargeAmount > 0 && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            <AlertTitle>Phụ trội</AlertTitle>
            Xe đã ở thêm sau khi trả trước. Cần thu thêm: <strong>{fmt(session.SurchargeAmount)}</strong>
          </Alert>
        )}

        <Button
          fullWidth variant="contained"
          startIcon={isMe ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <QrCodeIcon />}
          disabled={!!paying}
          onClick={() => onPay(session)}
          sx={{
            py: 1.5, borderRadius: 2, fontWeight: 700,
            background: isPrepaid
              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
              : 'linear-gradient(90deg, #2563eb, #1d4ed8)',
            '&:hover': { opacity: 0.92 }
          }}
        >
          {isMe ? 'Đang tạo mã QR...' : isPrepaid ? 'Tạo QR bổ sung / Xem lại' : 'Tạo mã QR thanh toán'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
const DriverPayment = () => {
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
  const pollerRef = useRef(null)

  // Clock — cập nhật "đã đỗ" mỗi giây
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // ✅ FIX: Xử lý redirect từ PayOS — dùng ref để tránh setState sync trong effect
  const statusHandledRef = useRef(false)
  useEffect(() => {
    if (statusHandledRef.current) return
    statusHandledRef.current = true
    if (statusFromUrl === 'success') {
      // Dùng setTimeout để tránh setState synchronous trong render cycle
      setTimeout(() => setStep('done'), 0)
    } else if (statusFromUrl === 'cancel') {
      toast.info('Bạn đã huỷ thanh toán trên trang PayOS.')
    }
  }, [statusFromUrl])

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
      startPolling(r.data.data.orderCode)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Không thể tạo link thanh toán')
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
          toast.success('🎉 Thanh toán thành công!')
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

  // ──────────────────────────────────────────────────────────────
  // STEP: select
  // ──────────────────────────────────────────────────────────────
  if (step === 'select') return (
    <Container maxWidth="md" sx={{ py: 0 }}>
      <Box mb={3}>
        <Typography variant="caption" color="text.secondary">
          Hệ thống › Thanh toán phí gửi xe
        </Typography>
        <Typography variant="h5" fontWeight={800} mt={0.5}>
          Thanh toán phí gửi xe
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Chọn xe cần thanh toán để nhận mã QR chuyển khoản
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
          <Typography fontWeight={700} mb={1}>Không có xe đang gửi tại bãi</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Phiên gửi xe sẽ hiển thị sau khi Staff check-in xe của bạn.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/driver/home')}>
            Về trang chủ
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
          Thanh toán bảo mật qua <strong>PayOS</strong> · VietQR
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
        Quay lại / Huỷ đơn
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
                Quét QR để thanh toán
              </Typography>
            </Stack>
            <Chip
              label="Chờ thanh toán"
              size="small"
              sx={{
                bgcolor: 'rgba(251,191,36,0.2)', color: '#fde68a',
                border: '1px solid rgba(251,191,36,0.4)'
              }}
            />
          </Stack>

          <Box textAlign="center">
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Tổng phí gửi xe</Typography>
            <Typography sx={{ fontSize: 40, fontWeight: 900, letterSpacing: -1 }}>
              {fmt(payment.amount)}
            </Typography>
          </Box>

          {payment.expiredAt && (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center"
              sx={{ mt: 2.5, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, py: 1.25 }}
            >
              <ClockIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Hết hạn sau:</Typography>
              <Countdown expiredAt={payment.expiredAt} />
            </Stack>
          )}
        </Box>

        {/* QR */}
        <Box sx={{ bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, px: 4 }}>
          <Paper elevation={4} sx={{ p: 1.5, borderRadius: 3, bgcolor: '#fff', mb: 2 }}>
            <QRCanvas data={payment.qrCode} size={220} />
          </Paper>
          <Typography variant="caption" color="text.secondary" textAlign="center" mb={1.5}>
            Mở app ngân hàng → QR / Scan → quét mã
          </Typography>
          <Button
            variant="outlined" size="small"
            startIcon={<ExternalIcon fontSize="small" />}
            onClick={() => window.open(payment.checkoutUrl, '_blank', 'noopener')}
          >
            Mở trang PayOS
          </Button>
        </Box>

        {/* Thông tin CK */}
        <Box px={3} pb={2}>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>
            Hoặc chuyển khoản thủ công
          </Typography>

          <Stack spacing={1.5} mt={1}>
            {[
              { label: 'Số tài khoản', value: payment.accountNumber, mono: true, color: 'inherit', large: true },
              { label: 'Tên tài khoản', value: payment.accountName, mono: false, color: 'inherit' },
              { label: 'Số tiền', value: fmt(payment.amount), mono: false, color: 'success.main' },
              { label: 'Nội dung CK', value: payment.description, mono: true, color: 'warning.dark' }
            ].map(({ label, value, mono, color, large }) => (
              <Paper key={label} variant="outlined" sx={{
                px: 2, py: 1.5, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                bgcolor: color === 'success.main' ? 'success.50' : color === 'warning.dark' ? 'warning.50' : 'grey.50'
              }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
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
                <Typography variant="caption" color="text.secondary">Biển số</Typography>
                <Typography fontWeight={700}>{payment.sessionInfo.plateNumber}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Vị trí</Typography>
                <Typography fontWeight={700}>{payment.sessionInfo.slotCode}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Vào lúc</Typography>
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
                {showPricing ? 'Ẩn bảng phí' : 'Xem bảng phí theo loại xe'}
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
              Đang chờ xác nhận thanh toán...
            </Typography>
          </Stack>
          <LinearProgress sx={{ mt: 1, borderRadius: 1, height: 3 }} />

          {/* Lưu ý prepaid */}
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }} icon={<ClockIcon />}>
            <AlertTitle>Lưu ý thanh toán trước</AlertTitle>
            Phí được tính tại thời điểm này. Nếu xe ở lại lâu hơn, nhân viên sẽ thu thêm khoản phụ trội khi xe ra.
          </Alert>

          {/* Huỷ */}
          <Button
            fullWidth variant="outlined" color="error"
            startIcon={cancelling ? <CircularProgress size={16} /> : <CancelIcon />}
            disabled={cancelling}
            onClick={handleCancel}
            sx={{ mt: 2, borderRadius: 2, py: 1.25 }}
          >
            Huỷ đơn hàng
          </Button>
        </Box>

        {/* Hướng dẫn */}
        <Box mx={3} mb={3}>
          <Alert severity="info" sx={{ borderRadius: 2 }} icon={<PhoneIcon />}>
            <AlertTitle sx={{ fontWeight: 700 }}>Hướng dẫn thanh toán QR</AlertTitle>
            <Box component="ol" sx={{ pl: 2, m: 0, '& li': { mb: 0.5 } }}>
              <li>Mở app ngân hàng (MB Bank, VCB, Techcombank...)</li>
              <li>Chọn <strong>Quét QR / Chuyển khoản QR</strong></li>
              <li>Quét mã QR phía trên</li>
              <li>Kiểm tra số tiền và <strong>nội dung chuyển khoản</strong></li>
              <li>Xác nhận — hệ thống tự cập nhật sau vài giây</li>
            </Box>
          </Alert>
        </Box>
      </Card>

      <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" mt={2}>
        <SecurityIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" color="text.disabled">
          Bảo mật bởi <strong>PayOS</strong> · VietQR
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
          <Typography variant="h5" fontWeight={900} mb={1}>Thanh toán thành công!</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Xe của bạn đã được ghi nhận. Vui lòng ra cổng để nhân viên xác nhận.
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {payment && (
            <Paper variant="outlined" sx={{ borderRadius: 2, p: 2.5, mb: 3 }}>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Số tiền đã trả</Typography>
                  <Typography fontWeight={800} color="success.main">{fmt(payment.amount)}</Typography>
                </Stack>
                {payment.sessionInfo && (
                  <>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Biển số</Typography>
                      <Typography fontWeight={700}>{payment.sessionInfo.plateNumber}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">Vị trí</Typography>
                      <Typography fontWeight={700}>{payment.sessionInfo.slotCode}</Typography>
                    </Stack>
                  </>
                )}
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Thời gian thanh toán</Typography>
                  <Typography fontWeight={700}>{fmtTime(new Date())}</Typography>
                </Stack>
              </Stack>
            </Paper>
          )}

          <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
            <AlertTitle>Lưu ý</AlertTitle>
            Đây là xác nhận trả trước. Nếu xe ở lại lâu hơn, nhân viên sẽ thu thêm khoản phụ trội khi xe ra cổng.
          </Alert>

          <Stack spacing={1.5}>
            <Button
              fullWidth variant="contained" color="success"
              onClick={() => navigate('/driver/home')}
              sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
            >
              Về trang chủ
            </Button>
            <Button
              fullWidth variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => navigate('/driver/history')}
              sx={{ py: 1.25, borderRadius: 2 }}
            >
              Xem lịch sử giao dịch
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
          <Typography variant="h5" fontWeight={900} mb={1}>Thanh toán thất bại</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Đơn hàng đã bị huỷ hoặc hết hạn 15 phút.
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
              Thử lại
            </Button>
            <Button
              fullWidth variant="outlined"
              onClick={() => navigate('/driver/home')}
              sx={{ py: 1.25, borderRadius: 2 }}
            >
              Về trang chủ
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )

  return null
}

export default DriverPayment