// src/pages/AdminLogin.jsx
import { useState } from 'react'
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

const AdminLogin = () => {
  const [showPass, setShowPass] = useState(false)
  const { login, loginWithGoogle, isAuthenticated, getRedirectPath, user } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues: { account: '', password: '' } })

  // Đã login → redirect thẳng về trang theo role
  if (isAuthenticated) {
    return <Navigate to={getRedirectPath(user?.roleName)} replace />
  }

  const onSubmit = async ({ account, password }) => {
    try {
      const loggedUser = await login({ email: account, password })
      navigate(getRedirectPath(loggedUser.roleName), { replace: true })
    } catch {
      // Lỗi đã toast bởi axios interceptor
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const loggedUser = await loginWithGoogle(credentialResponse.credential)
      navigate(getRedirectPath(loggedUser.roleName), { replace: true })
    } catch {
      // Lỗi đã toast
    }
  }

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', bgcolor: 'grey.100', p: 2
    }}>
      <Card sx={{
        width: '100%', maxWidth: 420, p: 4,
        borderTop: '3px solid', borderColor: 'primary.main', boxShadow: 3
      }}>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>Đăng Nhập</Typography>
          <Typography variant="body2" color="text.secondary">
            Vui lòng nhập thông tin để truy cập hệ thống
          </Typography>
        </Box>

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          <TextField
            label="Email"
            placeholder="admin@parking.com"
            fullWidth
            autoFocus
            size="small"
            error={!!errors.account}
            helperText={errors.account?.message}
            {...register('account', {
              required: 'Email không được để trống',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' }
            })}
          />

          <TextField
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            fullWidth
            size="small"
            type={showPass ? 'text' : 'password'}
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPass(v => !v)}>
                    {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )
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
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            sx={{ mt: 1, py: 1.5, fontWeight: 600 }}
          >
            {isSubmitting
              ? <CircularProgress size={22} color="inherit" />
              : 'Đăng Nhập'
            }
          </Button>
        </Box>

        {/* Social Login */}
        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">HOẶC</Typography>
        </Divider>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => { }}
            text="signin_with"
            shape="rectangular"
            width="350"
          />
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography
          variant="body2"
          sx={{ textAlign: 'center' }}
          color="text.secondary"
        >
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