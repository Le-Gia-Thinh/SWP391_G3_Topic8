// src/pages/driver/DriverPaymentResult.jsx
// Trang redirect từ PayOS về sau khi quét QR
// Route: /driver/payment-result?sessionId=X&status=success|cancel

import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box, Button, Card, CardContent, CircularProgress,
  Container, Divider, Stack, Typography, Chip
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  History as HistoryIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import authorizeAxios from '../../utils/authorizeAxios'

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

const DriverPaymentResult = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const status = params.get('status') // 'success' | 'cancel'
  const sessionId = params.get('sessionId')

  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  const isSuccess = status === 'success'

  // Lấy thông tin payment của session
  useEffect(() => {
    let ignore = false

    if (!sessionId) {
      const timer = setTimeout(() => {
        if (!ignore) {
          setLoading(false)
        }
      }, 0)

      return () => {
        ignore = true
        clearTimeout(timer)
      }
    }

    const timer = setTimeout(() => {
      const fetchPaymentInfo = async () => {
        try {
          const r = await authorizeAxios.get(`/driver/payment/session-info/${sessionId}`)

          if (!ignore) {
            setInfo(r.data?.data || null)
          }
        } catch {
          if (!ignore) {
            setInfo(null)
          }
        } finally {
          if (!ignore) {
            setLoading(false)
          }
        }
      }

      fetchPaymentInfo()
    }, 0)

    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [sessionId])

  if (loading) return (
    <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
      <CircularProgress />
      <Typography mt={2} color="text.secondary">Đang kiểm tra thanh toán...</Typography>
    </Container>
  )

  return (
    <Container maxWidth="sm" sx={{ py: 0 }}>
      <Card sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 4 }}>
        {/* ── Header ── */}
        <Box sx={{
          background: isSuccess
            ? 'linear-gradient(135deg, #16a34a, #059669)'
            : 'linear-gradient(135deg, #dc2626, #b91c1c)',
          px: 5, py: 7, textAlign: 'center', color: '#fff'
        }}>
          <Box sx={{
            width: 88, height: 88, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2.5
          }}>
            {isSuccess
              ? <CheckCircleIcon sx={{ fontSize: 52 }} />
              : <CancelIcon sx={{ fontSize: 52 }} />
            }
          </Box>
          <Typography variant="h5" fontWeight={900} mb={1}>
            {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán đã huỷ'}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            {isSuccess
              ? 'Đã ghi nhận. Vui lòng ra cổng để nhân viên xác nhận.'
              : 'Đơn thanh toán đã bị huỷ. Bạn có thể thử lại bất cứ lúc nào.'}
          </Typography>
          {isSuccess && (
            <Chip
              label="Trạng thái: Đã trả trước"
              size="small"
              sx={{
                mt: 2, bgcolor: 'rgba(255,255,255,0.2)',
                color: '#fff', fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)'
              }}
            />
          )}
        </Box>

        {/* ── Body ── */}
        <CardContent sx={{ p: 4 }}>
          {/* Thông tin giao dịch */}
          {isSuccess && info && (
            <Box
              sx={{
                bgcolor: 'success.50', borderRadius: 2,
                border: '1px solid', borderColor: 'success.200',
                p: 2.5, mb: 3
              }}
            >
              <Typography variant="overline" color="success.dark" fontWeight={800} display="block" mb={1.5}>
                                Chi tiết giao dịch
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">Số tiền đã trả</Typography>
                  <Typography fontWeight={800} color="success.main" fontSize={18}>
                    {fmt(info.PrepaidAmount || info.Amount)}
                  </Typography>
                </Stack>
                <Divider />
                {info.PlateNumber && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Biển số xe</Typography>
                    <Typography fontWeight={700} fontFamily="monospace">{info.PlateNumber}</Typography>
                  </Stack>
                )}
                {info.SlotCode && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Vị trí gửi</Typography>
                    <Typography fontWeight={700}>{info.SlotCode}</Typography>
                  </Stack>
                )}
                {info.VehicleName && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Loại xe</Typography>
                    <Typography fontWeight={700}>{info.VehicleName}</Typography>
                  </Stack>
                )}
                {info.EntryTime && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Vào lúc</Typography>
                    <Typography fontWeight={700}>{fmtTime(info.EntryTime)}</Typography>
                  </Stack>
                )}
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Thời gian thanh toán</Typography>
                  <Typography fontWeight={700}>{fmtTime(info.PrepaidAt || new Date())}</Typography>
                </Stack>
                {info.SnapshotDurationH != null && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Giờ tính phí</Typography>
                    <Typography fontWeight={700}>
                      {Number(info.SnapshotDurationH).toFixed(1)}h
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          )}

          {/* Lưu ý prepaid */}
          {isSuccess && (
            <Box sx={{
              bgcolor: 'warning.50', borderRadius: 2,
              border: '1px solid', borderColor: 'warning.300',
              p: 2, mb: 3
            }}>
              <Typography variant="body2" color="warning.dark" fontWeight={600}>
                                ⚠️ Lưu ý thanh toán trước
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                                Phí được tính tại thời điểm thanh toán. Nếu xe ở lại lâu hơn, nhân viên sẽ thu thêm khoản phụ trội khi xe ra cổng.
              </Typography>
            </Box>
          )}

          {/* Buttons */}
          <Stack spacing={1.5}>
            {isSuccess ? (
              <>
                <Button
                  fullWidth variant="contained" color="success"
                  startIcon={<HomeIcon />}
                  onClick={() => navigate('/driver/home')}
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                >
                                    Về trang chủ
                </Button>
                <Button
                  fullWidth variant="outlined"
                  startIcon={<HistoryIcon />}
                  onClick={() => navigate('/driver/payment-history')}
                  sx={{ py: 1.25, borderRadius: 2 }}
                >
                                    Xem lịch sử giao dịch
                </Button>
              </>
            ) : (
              <>
                <Button
                  fullWidth variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={() => navigate('/driver/payment')}
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                >
                                    Thử lại thanh toán
                </Button>
                <Button
                  fullWidth variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={() => navigate('/driver/home')}
                  sx={{ py: 1.25, borderRadius: 2 }}
                >
                                    Về trang chủ
                </Button>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}

export default DriverPaymentResult