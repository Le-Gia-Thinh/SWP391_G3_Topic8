import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
  HourglassEmpty as HourglassIcon,
  LocalShipping as TruckIcon
} from '@mui/icons-material'
import authorizeAxios from '../../utils/authorizeAxios'

const PAGE_SIZE = 15

const unwrap = (res) => res.data

const fmt = (value) => {
  const number = Number(value || 0)
  return `${new Intl.NumberFormat('vi-VN').format(number)} VNĐ`
}

const parseBackendDate = (value) => {
  if (!value) return null
  let text = String(value)
  if (text.endsWith('Z')) text = text.slice(0, -1)
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

const fmtTime = (value) => {
  const date = parseBackendDate(value)
  if (!date) return '--'
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const fmtDuration = (minutes) => {
  if (minutes === undefined || minutes === null) return '--'
  const total = Math.max(0, Number(minutes || 0))
  const h = Math.floor(total / 60)
  const m = total % 60
  return h === 0 ? `${m} phút` : `${h}h ${m}m`
}

const getParkingMinutes = (row, currentTime = new Date()) => {
  const entry = parseBackendDate(row.EntryTime)
  if (!entry) return row.ParkingMinutes ?? null
  const exit = row.ExitTime ? parseBackendDate(row.ExitTime) : null
  const end = exit || currentTime
  return Math.max(0, Math.floor((end.getTime() - entry.getTime()) / 60000))
}

const getRowId = (row, index) => row.PaymentID || row.SessionID || `${row.PlateNumber}-${index}`

const getDisplayAmount = (row) => Number(row.FinalAmount || row.Amount || 0)
const getPaidAmount = (row) => {
  if (row.PaymentStatus === 'Completed') return Number(row.FinalAmount || row.Amount || 0)
  if (row.PaymentStatus === 'Prepaid') return Number(row.PrepaidAmount || row.Amount || 0)
  return 0
}

const getStatusConfig = (status, surchargeStatus) => {
  if (status === 'Completed') return { label: 'Đã thanh toán', color: 'success', icon: <CheckCircleIcon fontSize="small" /> }
  if (status === 'Prepaid' && surchargeStatus === 'Pending') return { label: 'Cần thu thêm', color: 'warning', icon: <WarningIcon fontSize="small" /> }
  if (status === 'Prepaid') return { label: 'Đã trả trước', color: 'info', icon: <ClockIcon fontSize="small" /> }
  if (status === 'Pending') return { label: 'Chờ thanh toán', color: 'default', icon: <HourglassIcon fontSize="small" /> }
  if (status === 'Cancelled') return { label: 'Đã hủy', color: 'error', icon: <CancelIcon fontSize="small" /> }
  if (status === 'Failed') return { label: 'Thất bại', color: 'error', icon: <CancelIcon fontSize="small" /> }
  return { label: status || 'Đang xử lý', color: 'default', icon: <HourglassIcon fontSize="small" /> }
}

const getVehicleIcon = (code, name) => {
  const text = `${code || ''} ${name || ''}`.toLowerCase()
  if (text.includes('moto') || text.includes('motor') || text.includes('bike')) return <BikeIcon sx={{ fontSize: 18 }} />
  if (text.includes('truck')) return <TruckIcon sx={{ fontSize: 18 }} />
  return <CarIcon sx={{ fontSize: 18 }} />
}

const getMethodLabel = (method) => {
  const map = { Banking: 'Chuyển khoản', BankTransfer: 'Chuyển khoản', Cash: 'Tiền mặt', Card: 'Thẻ', Momo: 'MoMo', PayOS: 'PayOS', Pending: '--' }
  return map[method] || method || '--'
}

// --- Components ---
const HistoryRowDetail = ({ row, currentTime }) => {
  const exitText = row.ExitTime ? fmtTime(row.ExitTime) : 'Đang gửi'
  const minutes = getParkingMinutes(row, currentTime)

  return (
    <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderRadius: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="overline" color="text.secondary" fontWeight={800}>
            Thông tin xe & phiên
          </Typography>
          <Stack spacing={0.9} mt={1}>
            {[
              ['Biển số', row.PlateNumber || '--'],
              ['Loại xe', row.VehicleName || '--'],
              ['Vị trí', row.SlotCode || '--'],
              ['Khu vực', `${row.BuildingName || '--'} / ${row.FloorName || '--'} / ${row.ZoneName || '--'}`],
              ['Vào lúc', fmtTime(row.EntryTime)],
              ['Ra lúc', exitText],
              ['Thời gian thực', fmtDuration(minutes)]
            ].map(([label, value]) => (
              <Stack key={label} direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="caption" fontWeight={800} textAlign="right">{value}</Typography>
              </Stack>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="overline" color="text.secondary" fontWeight={800}>
            Chi tiết thanh toán
          </Typography>
          <Stack spacing={0.9} mt={1}>
            {[
              ['Phương thức', getMethodLabel(row.PaymentMethod)],
              ['Tổng phí', fmt(getDisplayAmount(row))],
            ].map(([label, value]) => (
              <Stack key={label} direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="caption" fontWeight={800} textAlign="right">{value}</Typography>
              </Stack>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}

const HistoryCard = ({ row, index, currentTime }) => {
  const [open, setOpen] = useState(false)
  const { label, color, icon } = getStatusConfig(row.PaymentStatus, row.SurchargeStatus)
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mb: 1.5, overflow: 'hidden' }}>
      <CardContent sx={{ p: 2, pb: '12px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: 'primary.50', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {getVehicleIcon(row.VehicleCode, row.VehicleName)}
            </Box>
            <Box>
              <Typography fontWeight={900} fontSize={16} fontFamily="monospace" letterSpacing={1}>{row.PlateNumber || '--'}</Typography>
              <Typography variant="caption" color="text.secondary">{row.VehicleName || '--'} · {row.SlotCode || '--'}</Typography>
            </Box>
          </Stack>
          <Stack alignItems="flex-end">
            <Chip icon={icon} label={label} size="small" color={color} sx={{ fontWeight: 800, fontSize: 11 }} />
          </Stack>
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="caption" color="text.secondary">Tổng phí</Typography>
            <Typography fontWeight={900} color="primary.main" fontSize={16}>{fmt(getDisplayAmount(row))}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setOpen((prev) => !prev)}>{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
        </Stack>
      </CardContent>
      <Collapse in={open}>
        <Divider />
        <Box sx={{ p: 2 }}>
          <HistoryRowDetail row={row} currentTime={currentTime} />
        </Box>
      </Collapse>
    </Card>
  )
}

const DriverPaymentHistory = () => {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const PAGE_SIZE = 15

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const response = await authorizeAxios.get('/driver/payment/history', { params: { limit: PAGE_SIZE, offset: 0 } })
      const data = Array.isArray(response.data?.data) ? response.data.data : []
      setRows(data)
    } catch (err) {
      console.error(err)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Container maxWidth="lg" sx={{ py: 0 }}>
      <Box mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 1.5, color: 'text.secondary', px: 0 }}>Quay lại</Button>
        <Typography variant="h5" fontWeight={900}>Lịch sử giao dịch</Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 7, textAlign: 'center', borderStyle: 'dashed', borderColor: 'divider' }}>
          <HistoryIcon sx={{ fontSize: 52, color: 'grey.300', mb: 2 }} />
          <Typography fontWeight={800} mb={1}>Chưa có giao dịch nào</Typography>
          <Button variant="contained" onClick={() => navigate('/driver/payment')}>Thanh toán ngay</Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {rows.map((row, index) => (
            <HistoryCard key={getRowId(row, index)} row={row} index={index} currentTime={currentTime} />
          ))}
        </Box>
      )}
    </Container>
  )
}

export default DriverPaymentHistory