// src/pages/VerifyEmailPages.jsx
import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Box, Card, Typography, Button, CircularProgress } from '@mui/material'
import { CheckCircle, Error, MarkEmailUnread } from '@mui/icons-material'
import { toast } from 'react-toastify'

import authorizeAxios from '../utils/authorizeAxios'
import { checkEmailVerifiedAPI } from '../apis/authApi'
import { useAuth } from '../contexts/AuthContext'

async function resendVerifyEmailAPI(email) {
  return authorizeAxios.post('/auth/resend-verify', { email })
}

function PageWrapper({ children }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
        p: 2
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          borderTop: '3px solid',
          borderColor: 'primary.main',
          boxShadow: 3
        }}
      >
        {children}
      </Card>
    </Box>
  )
}

export function VerifyEmailPending() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

  const navigate = useNavigate()
  const { isAuthenticated, user, getRedirectPath } = useAuth()

  const email =
    localStorage.getItem('pendingVerifyEmail') ||
    sessionStorage.getItem('pendingVerifyEmail') ||
    ''

  useEffect(() => {
    if (!email) return

    let timerId

    async function checkStatus() {
      try {
        setChecking(true)

        const res = await checkEmailVerifiedAPI(email)
        const isVerified = res.data.data.isEmailVerified

        if (isVerified) {
          localStorage.removeItem('pendingVerifyEmail')
          sessionStorage.removeItem('pendingVerifyEmail')

          navigate('/verify-email/success', { replace: true })
        }
      } catch {
        // Không toast ở đây, vì hàm này chạy lặp lại mỗi vài giây.
        // Nếu toast lỗi liên tục sẽ rất khó chịu cho user.
      } finally {
        setChecking(false)
      }
    }

    // Kiểm tra ngay khi vào trang pending
    checkStatus()

    // Sau đó cứ 3 giây hỏi DB một lần
    timerId = setInterval(checkStatus, 3000)

    return () => {
      clearInterval(timerId)
    }
  }, [email, navigate])

  if (isAuthenticated) {
    return <Navigate to={getRedirectPath(user?.roleName)} replace />
  }

  async function handleResend() {
    if (!email) {
      toast.error('Không tìm thấy email cần xác minh, vui lòng đăng ký lại')
      navigate('/register', { replace: true })
      return
    }

    setLoading(true)

    try {
      await resendVerifyEmailAPI(email)
      toast.success('Đã gửi lại email xác minh!')
    } catch {
      toast.error('Gửi lại email thất bại, vui lòng thử lại sau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <MarkEmailUnread sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />

      <Typography variant="h6" fontWeight={700} gutterBottom textAlign="center">
        Kiểm tra hộp thư của bạn
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
        sx={{ mb: 3 }}
      >
        Chúng tôi đã gửi link xác minh đến{' '}
        <strong>{email || 'email của bạn'}</strong>.
        <br />
        Vui lòng click vào link để hoàn tất đăng ký.
      </Typography>

      {checking && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
          Đang kiểm tra trạng thái xác minh...
        </Typography>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
        Không nhận được email?
      </Typography>

      <Button
        variant="outlined"
        onClick={handleResend}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} /> : null}
        sx={{ textTransform: 'none' }}
      >
        {loading ? 'Đang gửi...' : 'Gửi lại email'}
      </Button>
    </PageWrapper>
  )
}

export function VerifyEmailSuccess() {
  const navigate = useNavigate()

  useEffect(() => {
    localStorage.removeItem('pendingVerifyEmail')
    sessionStorage.removeItem('pendingVerifyEmail')
  }, [])

  return (
    <PageWrapper>
      <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />

      <Typography variant="h6" fontWeight={700} gutterBottom textAlign="center">
        Email đã được xác minh!
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
        sx={{ mb: 3 }}
      >
        Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ.
      </Typography>

      <Button
        variant="contained"
        onClick={() => navigate('/login', { replace: true })}
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        Đăng nhập
      </Button>
    </PageWrapper>
  )
}

export function VerifyEmailError() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const email =
    localStorage.getItem('pendingVerifyEmail') ||
    sessionStorage.getItem('pendingVerifyEmail') ||
    ''

  async function handleResend() {
    if (!email) {
      toast.error('Không tìm thấy email cần xác minh, vui lòng đăng ký lại')
      navigate('/register', { replace: true })
      return
    }

    setLoading(true)

    try {
      await resendVerifyEmailAPI(email)
      toast.success('Đã gửi lại email xác minh mới!')
      navigate('/verify-email/pending', { replace: true })
    } catch {
      toast.error('Gửi lại email thất bại, vui lòng thử lại sau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />

      <Typography variant="h6" fontWeight={700} gutterBottom textAlign="center">
        Link xác minh không hợp lệ
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
        sx={{ mb: 3 }}
      >
        Link đã hết hạn hoặc đã được sử dụng.
        <br />
        Vui lòng yêu cầu gửi lại link mới.
      </Typography>

      <Button
        variant="contained"
        color="error"
        onClick={handleResend}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        {loading ? 'Đang gửi...' : 'Gửi lại email xác minh'}
      </Button>
    </PageWrapper>
  )
}