/**
 * FILE: DriverRegister.jsx
 * MÔ TẢ: Trang Đăng Ký tài khoản dành riêng cho người dùng Driver (Khách hàng).
 * Thu thập thông tin cá nhân cơ bản và biển số xe, có cơ chế xác thực đầu vào (Validation).
 */

// src/pages/DriverRegister.jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert, Box, Button, Checkbox, FormControl, FormControlLabel,
  IconButton, InputAdornment, MenuItem, Paper, Select, TextField
} from '@mui/material'
import { Eye, EyeOff, Info, User } from 'lucide-react'
import { useNavigate, Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { registerAPI } from '../apis/authApi'
import { useAuth } from '../contexts/AuthContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  fullName: '',
  phoneNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
  plateNumber: '',
  vehicleType: 'motorbike', // key i18n, không phải label
  acceptedTerms: false
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sx = {
  input: {
    '& .MuiOutlinedInput-root': {
      minHeight: 58,
      borderRadius: '0.75rem',
      backgroundColor: '#f9fafb',
      fontSize: '0.875rem',
      transition: 'all 0.2s ease',
      '& fieldset': { borderColor: '#e5e7eb' },
      '&:hover fieldset': { borderColor: '#d1d5db' },
      '&.Mui-focused': { backgroundColor: '#ffffff' },
      '&.Mui-focused fieldset': { borderWidth: 2, borderColor: '#3b82f6' },
      '& input:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 100px white inset',
        WebkitTextFillColor: 'black'
      }
    },
    '& .MuiFormHelperText-root': { marginLeft: 0, fontSize: '0.75rem' }
  },
  primaryBtn: {
    height: 56,
    borderRadius: '0.75rem',
    backgroundColor: '#2563eb',
    boxShadow: '0 10px 15px -3px rgb(191 219 254), 0 4px 6px -4px rgb(191 219 254)',
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '1rem',
    '&:hover': { backgroundColor: '#1d4ed8' },
    '&.Mui-disabled': { backgroundColor: '#93c5fd', color: '#fff' }
  },
  secondaryBtn: {
    borderRadius: '0.5rem',
    color: '#4b5563',
    backgroundColor: '#f3f4f6',
    fontWeight: 500,
    textTransform: 'none',
    px: 3,
    py: 1,
    '&:hover': { color: '#2563eb', backgroundColor: '#e5e7eb' }
  },
  checkbox: {
    color: '#9ca3af',
    '&.Mui-checked': { color: '#2563eb' }
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

const RE = {
  phone: /^0\d{9}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  plate: /^(\d{2}[A-Z]{1,2}-?\d{3}\.?\d{2}|\d{2}[A-Z]{1,2}-?\d{4,5})$/i
}

function validate(data, t) {
  const errors = {}
  if (!data.fullName.trim())
    errors.fullName = t('auth.register.fullNameRequired')
  if (!data.phoneNumber.trim())
    errors.phoneNumber = t('auth.register.phoneRequired')
  else if (!RE.phone.test(data.phoneNumber.trim()))
    errors.phoneNumber = t('auth.register.phoneInvalid')
  if (!data.email.trim())
    errors.email = t('auth.register.emailRequired')
  else if (!RE.email.test(data.email.trim()))
    errors.email = t('auth.register.emailInvalid')
  if (!data.password || data.password.length < 8)
    errors.password = t('auth.register.passwordTooShort')
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = t('auth.register.confirmPasswordMismatch')
  if (data.plateNumber.trim() && !RE.plate.test(data.plateNumber.trim()))
    errors.plateNumber = t('auth.register.plateNumberInvalid')
  if (!data.acceptedTerms)
    errors.acceptedTerms = t('auth.register.acceptTermsRequired')
  return errors
}

// ─── FieldItem ────────────────────────────────────────────────────────────────

function FieldItem({ field, value, error, onChange, showPassword, onTogglePassword }) {
  const isPassword = field.type === 'password'
  const inputType = isPassword && showPassword ? 'text' : (field.type || 'text')

  return (
    <Box className={field.fullWidth ? 'sm:col-span-2' : ''}>
      <Box component="label" className="block text-xs font-bold text-gray-700 mb-1.5">
        {field.label}
      </Box>
      <TextField
        fullWidth
        name={field.name}
        type={inputType}
        value={value}
        onChange={onChange}
        placeholder={field.placeholder}
        error={Boolean(error)}
        helperText={error || ' '}
        sx={sx.input}
        InputProps={{
          startAdornment: field.hasUserIcon
            ? <InputAdornment position="start"><User className="w-4 h-4 text-gray-400" /></InputAdornment>
            : undefined,
          endAdornment: isPassword
            ? (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  type="button"
                  onClick={onTogglePassword}
                  aria-label="toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </IconButton>
              </InputAdornment>
            )
            : undefined
        }}
      />
    </Box>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DriverRegister() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // FIX 1: dùng AuthContext để kiểm tra đã login chưa
  const { isAuthenticated, getRedirectPath, user } = useAuth()

  const [formData, setFormData] = useState(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [serverErrors, setServerErrors] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPwd, setShowPwd] = useState({ password: false, confirmPassword: false })

  // FIX 2: đã login → redirect thẳng, không cho vào trang register
  if (isAuthenticated) {
    return <Navigate to={getRedirectPath(user?.roleName)} replace />
  }

  // Build FIELDS với t() - vào trong component để có access t
  const FIELDS = [
    { name: 'fullName', label: t('auth.register.fullName'), placeholder: t('auth.register.fullNamePlaceholder'), fullWidth: true, hasUserIcon: true },
    { name: 'phoneNumber', label: t('auth.register.phoneNumber'), placeholder: t('auth.register.phoneNumberPlaceholder') },
    { name: 'email', label: t('auth.register.email'), placeholder: t('auth.register.emailPlaceholder'), type: 'email' },
    { name: 'password', label: t('auth.register.password'), placeholder: t('auth.register.passwordPlaceholder'), type: 'password' },
    { name: 'confirmPassword', label: t('auth.register.confirmPassword'), placeholder: t('auth.register.confirmPasswordPlaceholder'), type: 'password' },
    { name: 'plateNumber', label: t('auth.register.plateNumber'), placeholder: t('auth.register.plateNumberPlaceholder') }
  ]

  const VEHICLE_OPTIONS = [
    { key: 'motorbike', label: t('auth.register.vehicleOptions.motorbike') },
    { key: 'car', label: t('auth.register.vehicleOptions.car') },
    { key: 'bicycle', label: t('auth.register.vehicleOptions.bicycle') }
  ]

  const handleChange = ({ target: { name, value, checked, type } }) => {
    setFormData(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    // Xóa error của field khi user bắt đầu nhập lại
    if (fieldErrors[name]) setFieldErrors(e => ({ ...e, [name]: '' }))
  }

  const togglePwd = (name) => setShowPwd(s => ({ ...s, [name]: !s[name] }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerErrors([])

    const errors = validate(formData, t)
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)

    try {
      // FIX 3: dùng authorizeAxios qua registerAPI thay vì fetch thô
      // → cookie, interceptor, toast lỗi đều hoạt động đồng nhất
      await registerAPI({
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        password: formData.password,
        ...(formData.plateNumber.trim() && { plateNumber: formData.plateNumber.trim() })
      })

      localStorage.setItem('pendingVerifyEmail', formData.email.trim().toLowerCase())
      localStorage.removeItem('emailVerified')
      toast.success(t('auth.register.registerSuccess'))
      navigate('/verify-email/pending', { replace: true })
    } catch {
      // FIX 5: lỗi từ server đã được authorizeAxios interceptor toast rồi
      // Chỉ cần set serverErrors nếu cần hiển thị thêm chi tiết
      setServerErrors([t('auth.register.registerFailedDefault')])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box className="flex justify-center py-12 px-4 bg-[#fbf9f1]/50">
      <Paper
        elevation={0}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10 relative"
      >

        {/* Header */}
        <Box className="text-center mb-8">
          <Box component="h1" className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth.register.title')}
          </Box>
          <Box component="p" className="text-sm text-gray-500">
            {t('auth.register.subtitle')}
          </Box>
        </Box>

        {/* Section label */}
        <Box className="flex items-center gap-4 mb-8 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
          <Box className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </Box>
          <Box>
            <Box component="h2" className="font-bold text-gray-900 text-sm">{t('auth.register.personalInfoTitle')}</Box>
            <Box component="p" className="text-xs text-gray-500">
              {t('auth.register.personalInfoSubtitle')}
            </Box>
          </Box>
        </Box>

        {/* Server errors */}
        {serverErrors.length > 0 && (
          <Alert
            severity="error"
            icon={<Info className="w-4 h-4" />}
            className="mb-8 rounded-xl"
            onClose={() => setServerErrors([])}
          >
            <Box component="ul" className="list-disc pl-5 space-y-1 text-xs font-medium">
              {serverErrors.map((err, i) => (
                <Box component="li" key={i}>{err}</Box>
              ))}
            </Box>
          </Alert>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">

            {FIELDS.map(field => (
              <FieldItem
                key={field.name}
                field={field}
                value={formData[field.name]}
                error={fieldErrors[field.name]}
                onChange={handleChange}
                showPassword={showPwd[field.name]}
                onTogglePassword={() => togglePwd(field.name)}
              />
            ))}

            {/* Vehicle type — hiển thị UI nhưng chưa lưu DB */}
            <Box>
              <Box component="label" className="block text-xs font-bold text-gray-700 mb-1.5">
                {t('auth.register.vehicleType')}
              </Box>
              <FormControl fullWidth sx={sx.input}>
                <Select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  displayEmpty
                >
                  {VEHICLE_OPTIONS.map(opt => (
                    <MenuItem key={opt.key} value={opt.key}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

          </Box>

          {/* Terms */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  name="acceptedTerms"
                  checked={formData.acceptedTerms}
                  onChange={handleChange}
                  sx={sx.checkbox}
                />
              }
              label={
                <Box component="span" className="text-sm text-gray-600 select-none">
                  {t('auth.register.acceptTermsPrefix')}{' '}
                  <Box component="a" href="#" className="text-blue-600 font-medium hover:underline">
                    {t('auth.register.termsOfService')}
                  </Box>
                  {' '}{t('auth.register.and')}{' '}
                  <Box component="a" href="#" className="text-blue-600 font-medium hover:underline">
                    {t('auth.register.privacyPolicy')}
                  </Box>
                </Box>
              }
            />
            {fieldErrors.acceptedTerms && (
              <Box component="p" className="text-xs text-red-600 mt-1 ml-8">
                {fieldErrors.acceptedTerms}
              </Box>
            )}
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            sx={sx.primaryBtn}
          >
            {isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}
          </Button>

          <Box className="text-center">
            <Button
              type="button"
              onClick={() => navigate('/login')}
              sx={sx.secondaryBtn}
            >
              {t('auth.register.backToLogin')}
            </Button>
          </Box>
        </Box>

        {/* Info note */}
        <Box className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
          <Box className="flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <Box>
              <Box component="h3" className="text-sm font-bold text-blue-800 mb-1">
                {t('auth.register.approvalNoticeTitle')}
              </Box>
              <Box component="p" className="text-xs text-blue-600 leading-relaxed">
                {t('auth.register.approvalNoticeBody')}
              </Box>
            </Box>
          </Box>
        </Box>

      </Paper>
    </Box>
  )
}