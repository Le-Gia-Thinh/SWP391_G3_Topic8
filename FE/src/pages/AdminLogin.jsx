// src/pages/AdminLogin.jsx
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  Box, Card, TextField, Typography, Button,
  Checkbox, FormControlLabel, Link,
  InputAdornment, IconButton, Divider, CircularProgress
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-toastify'

const FB_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID

function useFacebookSDK() {
  const fbRef = useRef(null)

  useEffect(() => {
    if (window.FB) {
      fbRef.current = window.FB
      return
    }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v19.0'
      })
      fbRef.current = window.FB
    }
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script')
      script.id = 'facebook-jssdk'
      script.src = 'https://connect.facebook.net/en_US/sdk.js'
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }
  }, [])

  return fbRef
}

function FbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      />
    </svg>
  )
}

const AdminLogin = () => {
  const [showPass, setShowPass] = useState(false)
  const [fbLoading, setFbLoading] = useState(false)

  const { login, loginWithGoogle, loginWithFacebook, isAuthenticated, getRedirectPath, user } = useAuth()
  const navigate = useNavigate()
  const fbRef = useFacebookSDK()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues: { account: '', password: '' } })

  if (isAuthenticated) {
    return <Navigate to={getRedirectPath(user?.roleName)} replace />
  }
  const onSubmit = async ({ account, password }) => {
    try {
      const loggedUser = await login({ email: account, password })

      toast.success('Đăng nhập thành công')
      navigate(getRedirectPath(loggedUser.roleName), { replace: true })
    } catch (error) {
      const message =
        error.response?.data?.message || 'Email hoặc mật khẩu không đúng'

      toast.error(message)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { user: loggedUser, message } = await loginWithGoogle(credentialResponse.credential)
      toast.success(message || `Chào mừng, ${loggedUser.fullName}!`)
      navigate(getRedirectPath(loggedUser.roleName), { replace: true })
    } catch {
      // toast xử lý bởi axios interceptor
    }
  }

  const handleFacebookLogin = () => {
    const FB = fbRef.current || window.FB
    if (!FB) {
      toast.error('Facebook SDK chưa sẵn sàng, thử lại sau giây lát')
      return
    }

    setFbLoading(true)

    FB.login((response) => {
      if (response.authResponse?.accessToken) {
        loginWithFacebook(response.authResponse.accessToken)
          .then(({ user: loggedUser, message }) => {
            toast.success(message || `Chào mừng, ${loggedUser.fullName}!`)
            navigate(getRedirectPath(loggedUser.roleName), { replace: true })
          })
          .catch(() => { })
          .finally(() => setFbLoading(false))
      } else {
        if (response.status !== 'unknown') {
          toast.warning('Đăng nhập Facebook bị huỷ')
        }
        setFbLoading(false)
      }
    }, { scope: 'public_profile,email' })
  }

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100%', bgcolor: 'grey.100', p: 2
    }}>
      <Card sx={{
        width: '100%', maxWidth: 420, p: 4,
        borderTop: '3px solid', borderColor: 'primary.main', boxShadow: 3
      }}>

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>Đăng Nhập</Typography>
          <Typography variant="body2" color="text.secondary">
            Vui lòng nhập thông tin để truy cập hệ thống
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}
        >
          <TextField
            label="Email" placeholder="admin@parking.com"
            fullWidth autoFocus size="small"
            error={!!errors.account} helperText={errors.account?.message}
            {...register('account', {
              required: 'Email không được để trống',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' }
            })}
          />

          <TextField
            label="Mật khẩu" placeholder="Nhập mật khẩu"
            fullWidth size="small"
            type={showPass ? 'text' : 'password'}
            error={!!errors.password} helperText={errors.password?.message}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPass(v => !v)}>
                      {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
            {...register('password', {
              required: 'Mật khẩu không được để trống',
              minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }
            })}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              label={<Typography variant="body2">Ghi nhớ đăng nhập</Typography>}
              control={<Checkbox size="small" {...register('remember')} />}
            />
            <Link href="/forgot-password" variant="body2" underline="hover">
              Quên mật khẩu?
            </Link>
          </Box>

          <Button
            type="submit" variant="contained" fullWidth size="large"
            disabled={isSubmitting}
            sx={{ mt: 1, py: 1.5, fontWeight: 600 }}
          >
            {isSubmitting
              ? <CircularProgress size={22} color="inherit" />
              : 'Đăng Nhập'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">HOẶC</Typography>
        </Divider>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Đăng nhập Google thất bại')}
            text="signin_with"
            shape="rectangular"
            width={350}
          />

          <Button
            fullWidth variant="outlined"
            onClick={handleFacebookLogin}
            disabled={fbLoading}
            startIcon={fbLoading ? <CircularProgress size={18} /> : <FbIcon />}
            sx={{
              width: 350, py: 1,
              borderColor: '#1877F2', color: '#1877F2',
              fontWeight: 500, textTransform: 'none', fontSize: 14,
              '&:hover': { borderColor: '#1557B0', bgcolor: '#f0f6ff' }
            }}
          >
            {fbLoading ? 'Đang đăng nhập...' : 'Đăng nhập với Facebook'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" sx={{ textAlign: 'center' }} color="text.secondary">
          Bạn chưa có tài khoản?{' '}
          <Link href="/register" underline="hover" fontWeight={500}>
            Đăng ký ngay
          </Link>
        </Typography>

      </Card>
    </Box>
  )
}

export default AdminLogin