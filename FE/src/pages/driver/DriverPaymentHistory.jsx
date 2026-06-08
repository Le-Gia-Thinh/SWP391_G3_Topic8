// src/pages/driver/DriverPaymentHistory.jsx
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Collapse
} from '@mui/material'
import {
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as ClockIcon,
  DirectionsCar as CarIcon,
  Payment as PaymentIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  TwoWheeler as BikeIcon,
  LocalShipping as TruckIcon,
  HourglassEmpty as HourglassIcon
} from '@mui/icons-material'
import authorizeAxios from '../../utils/authorizeAxios'

// ── Helpers ─────────────────────────────────────────────────────
const fmt = (n) =>
  n != null ? new Intl.NumberFormat('vi-VN').format(Number(n)) + ' VNĐ' : '--'

const fmtTime = (val) => {
  if (!val) return '--'
  const d = new Date(String(val).replace(/Z$/, ''))
  return isNaN(d.getTime()) ? '--' : d.toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

const fmtDuration = (minutes) => {
  if (!minutes && minutes !== 0) return '--'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} phút`
  return `${h}h ${m}m`
}

const getStatusConfig = (status, surchargeStatus) => {
  if (status === 'Completed')
    return { label: 'Hoàn thành', color: 'success', icon: <CheckCircleIcon fontSize="small" /> }
  if (status === 'Prepaid' && surchargeStatus === 'Pending')
    return { label: 'Cần thu thêm', color: 'warning', icon: <WarningIcon fontSize="small" /> }
  if (status === 'Prepaid')
    return { label: 'Đã trả trước', color: 'info', icon: <ClockIcon fontSize="small" /> }
  if (status === 'Cancelled')
    return { label: 'Đã huỷ', color: 'error', icon: <CancelIcon fontSize="small" /> }
  if (status === 'Failed')
    return { label: 'Thất bại', color: 'error', icon: <CancelIcon fontSize="small" /> }
  return { label: status || 'Đang xử lý', color: 'default', icon: <HourglassIcon fontSize="small" /> }
}

const getVehicleIcon = (code) => {
  const c = (code || '').toLowerCase()
  if (c.includes('moto') || c.includes('bike')) return <BikeIcon sx={{ fontSize: 18 }} />
  if (c.includes('truck')) return <TruckIcon sx={{ fontSize: 18 }} />
  return <CarIcon sx={{ fontSize: 18 }} />
}

const getMethodLabel = (method) => {
  const map = {
    Banking: 'Chuyển khoản',
    Cash: 'Tiền mặt',
    Card: 'Thẻ',
    Momo: 'MoMo',
    Pending: '--'
  }
  return map[method] || method || '--'
}

// ── Row chi tiết (collapse) ──────────────────────────────────────
const HistoryRowDetail = ({ row }) => (
  <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Typography variant="overline" color="text.secondary" fontWeight={700}>Thông tin xe & phiên</Typography>
        <Stack spacing={0.75} mt={1}>
          {[
            ['Biển số', row.PlateNumber],
            ['Loại xe', row.VehicleName],
            ['Vị trí', row.SlotCode],
            ['Khu vực', `${row.BuildingName} / ${row.FloorName} / ${row.ZoneName}`],
            ['Vào lúc', fmtTime(row.EntryTime)],
            ['Ra lúc', fmtTime(row.ExitTime) || 'Đang gửi'],
            ['Thời gian thực', fmtDuration(row.ParkingMinutes)]
          ].map(([k, v]) => (
            <Stack key={k} direction="row" justifyContent="space-between" spacing={1}>
              <Typography variant="caption" color="text.secondary">{k}</Typography>
              <Typography variant="caption" fontWeight={700} textAlign="right">{v}</Typography>
            </Stack>
          ))}
        </Stack>
      </Grid>

      <Grid item xs={12} sm={6}>
        <Typography variant="overline" color="text.secondary" fontWeight={700}>Chi tiết thanh toán</Typography>
        <Stack spacing={0.75} mt={1}>
          {[
            ['Phương thức', getMethodLabel(row.PaymentMethod)],
            ['Giờ tính phí', row.SnapshotDurationH != null ? `${Number(row.SnapshotDurationH).toFixed(1)}h` : '--'],
            ['Đã trả trước', row.PrepaidAmount > 0 ? fmt(row.PrepaidAmount) : '--'],
            ['Phụ trội', row.SurchargeAmount > 0 ? fmt(row.SurchargeAmount) : '--'],
            ['Tổng phí', fmt(row.FinalAmount || row.Amount)],
            ['Thanh toán lúc', fmtTime(row.PrepaidAt || row.PaymentTime)]
          ].filter(([, v]) => v && v !== '--').map(([k, v]) => (
            <Stack key={k} direction="row" justifyContent="space-between" spacing={1}>
              <Typography variant="caption" color="text.secondary">{k}</Typography>
              <Typography
                variant="caption" fontWeight={700} textAlign="right"
                color={k === 'Tổng phí' ? 'primary.main' : 'inherit'}
              >
                {v}
              </Typography>
            </Stack>
          ))}
        </Stack>

        {row.SurchargeStatus === 'Pending' && (
          <Alert severity="warning" sx={{ mt: 1.5, py: 0.5, borderRadius: 1.5 }}>
            <Typography variant="caption" fontWeight={700}>
                            Cần thu thêm: {fmt(row.SurchargeAmount)}
            </Typography>
          </Alert>
        )}
        {row.PaymentNote && (
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        Ghi chú: {row.PaymentNote}
          </Typography>
        )}
      </Grid>
    </Grid>
  </Box>
)

// ── Card (mobile view) ───────────────────────────────────────────
const HistoryCard = ({ row }) => {
  const [open, setOpen] = useState(false)
  const { label, color, icon } = getStatusConfig(row.PaymentStatus, row.SurchargeStatus)
  const displayDate = row.PrepaidAt || row.PaymentTime

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mb: 1.5, overflow: 'hidden' }}>
      <CardContent sx={{ p: 2, pb: '12px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box sx={{
              width: 36, height: 36, borderRadius: '50%',
              bgcolor: 'primary.50', color: 'primary.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {getVehicleIcon(row.VehicleCode)}
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize={16} fontFamily="monospace" letterSpacing={1}>
                {row.PlateNumber}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {row.VehicleName} · {row.SlotCode}
              </Typography>
            </Box>
          </Stack>
          <Stack alignItems="flex-end">
            <Chip
              icon={icon}
              label={label}
              size="small"
              color={color}
              sx={{ fontWeight: 700, fontSize: 11 }}
            />
            <Typography variant="caption" color="text.secondary" mt={0.5}>
              {fmtTime(displayDate)}
            </Typography>
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" color="text.secondary">Tổng phí</Typography>
            <Typography fontWeight={800} color="primary.main" fontSize={16}>
              {fmt(row.FinalAmount || row.Amount)}
            </Typography>
            {row.PrepaidAmount > 0 && row.PrepaidAmount !== (row.FinalAmount || row.Amount) && (
              <Typography variant="caption" color="text.secondary">
                                Trả trước: {fmt(row.PrepaidAmount)}
                {row.SurchargeAmount > 0 && ` + Phụ trội: ${fmt(row.SurchargeAmount)}`}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => setOpen(v => !v)}>
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>
      </CardContent>

      <Collapse in={open}>
        <Divider />
        <Box sx={{ p: 2 }}>
          <HistoryRowDetail row={row} />
        </Box>
      </Collapse>
    </Card>
  )
}

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════
const PAGE_SIZE = 15

const DriverPaymentHistory = () => {
  const navigate = useNavigate()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [expandedRow, setExpandedRow] = useState(null)

  const loadHistory = useCallback(async (off = 0, append = false) => {
    setLoading(true)

    try {
      const r = await authorizeAxios.get('/driver/payment/history', {
        params: { limit: PAGE_SIZE, offset: off }
      })

      const data = r.data?.data || []

      setRows(prev => append ? [...prev, ...data] : data)
      setHasMore(data.length === PAGE_SIZE)
      setOffset(off)
    } catch {
      setRows(prev => append ? prev : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistory(0, false)
    }, 0)

    return () => clearTimeout(timer)
  }, [loadHistory])

  const handleLoadMore = () => loadHistory(offset + PAGE_SIZE, true)

  const totalPaid = rows
    .filter(r => ['Completed', 'Prepaid'].includes(r.PaymentStatus))
    .reduce((s, r) => s + Number(r.PrepaidAmount || r.Amount || 0), 0)

  return (
    <Container maxWidth="md" sx={{ py: 0 }}>
      {/* ── Header ── */}
      <Box mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 1.5, color: 'text.secondary', px: 0 }}
        >
                    Quay lại
        </Button>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
          <Box>
            <Typography variant="caption" color="text.secondary">Tài khoản › Lịch sử</Typography>
            <Typography variant="h5" fontWeight={800} mt={0.5}>Lịch sử giao dịch</Typography>
            <Typography variant="body2" color="text.secondary">
                            Toàn bộ thanh toán phí gửi xe của bạn
            </Typography>
          </Box>
          <Tooltip title="Tải lại">
            <IconButton onClick={() => loadHistory(0, false)} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Tổng kết ── */}
      {rows.length > 0 && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Tổng giao dịch', value: rows.length + '+', icon: <HistoryIcon />, color: '#2563eb' },
            { label: 'Tổng đã thanh toán', value: fmt(totalPaid), icon: <PaymentIcon />, color: '#16a34a' },
            {
              label: 'Cần thu thêm',
              value: rows.filter(r => r.SurchargeStatus === 'Pending').length,
              icon: <WarningIcon />, color: '#d97706',
              hide: !rows.some(r => r.SurchargeStatus === 'Pending')
            }
          ].filter(s => !s.hide).map(({ label, value, icon, color }) => (
            <Grid item xs={6} sm={4} key={label}>
              <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, borderColor: 'divider' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ color, opacity: 0.85 }}>{icon}</Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography fontWeight={800} fontSize={15} color={color}>{value}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Loading ban đầu ── */}
      {loading && rows.length === 0 ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Paper variant="outlined" sx={{
          borderRadius: 3, p: 7, textAlign: 'center',
          borderStyle: 'dashed', borderColor: 'divider'
        }}>
          <HistoryIcon sx={{ fontSize: 52, color: 'grey.300', mb: 2 }} />
          <Typography fontWeight={700} mb={1}>Chưa có giao dịch nào</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
                        Lịch sử sẽ hiển thị sau khi bạn thực hiện thanh toán.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/driver/payment')}>
                        Thanh toán ngay
          </Button>
        </Paper>
      ) : (
        <>
          {/* ── Danh sách (desktop: table, mobile: card) ── */}

          {/* Desktop Table */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2, display: { xs: 'none', md: 'block' }, mb: 2 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {['Biển số', 'Loại xe', 'Vị trí', 'Vào lúc', 'Thời gian', 'Phí', 'Trạng thái', 'Chi tiết'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const { label, color, icon } = getStatusConfig(row.PaymentStatus, row.SurchargeStatus)
                  const isExpanded = expandedRow === row.PaymentID
                  return (
                    <React.Fragment key={row.PaymentID}>
                      <TableRow
                        hover
                        sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                        onClick={() => setExpandedRow(isExpanded ? null : row.PaymentID)}
                      >
                        <TableCell>
                          <Typography fontWeight={700} fontFamily="monospace" fontSize={13}>
                            {row.PlateNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            {getVehicleIcon(row.VehicleCode)}
                            <Typography fontSize={13}>{row.VehicleName}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography fontSize={12}>{row.SlotCode}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.ZoneName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontSize={12}>{fmtTime(row.EntryTime)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontSize={12}>{fmtDuration(row.ParkingMinutes)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={800} color="primary.main" fontSize={13}>
                            {fmt(row.FinalAmount || row.Amount)}
                          </Typography>
                          {row.PrepaidAmount > 0 && row.SurchargeAmount > 0 && (
                            <Typography variant="caption" color="warning.dark" display="block">
                                                            +{fmt(row.SurchargeAmount)} phụ trội
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={icon}
                            label={label}
                            size="small"
                            color={color}
                            sx={{ fontWeight: 700, fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <HistoryRowDetail row={row} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
            {rows.map(row => <HistoryCard key={row.PaymentID} row={row} />)}
          </Box>

          {/* Load more */}
          {hasMore && (
            <Box textAlign="center" mt={2}>
              <Button
                variant="outlined"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                onClick={handleLoadMore}
                sx={{ borderRadius: 2, px: 4 }}
              >
                                Tải thêm
              </Button>
            </Box>
          )}
        </>
      )}
    </Container>
  )
}

export default DriverPaymentHistory