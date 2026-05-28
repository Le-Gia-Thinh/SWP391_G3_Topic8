// src/pages/DriverRegister.jsx
import { useState } from 'react'
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

const VEHICLE_OPTIONS = ['Xe Máy', 'Ô Tô', 'Xe Đạp']

const INITIAL_FORM = {
  fullName: '',
  phoneNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
  plateNumber: '',
  vehicleType: 'Xe Máy',
  acceptedTerms: false
}

const FIELDS = [
  { name: 'fullName', label: 'Họ và Tên', placeholder: 'Nguyễn Văn A', fullWidth: true, hasUserIcon: true },
  { name: 'phoneNumber', label: 'Số điện thoại', placeholder: '0901234567' },
  { name: 'email', label: 'Email', placeholder: 'nguyenvana@gmail.com', type: 'email' },
  { name: 'password', label: 'Mật khẩu', placeholder: 'Ít nhất 8 ký tự', type: 'password' },
  { name: 'confirmPassword', label: 'Xác nhận mật khẩu', placeholder: 'Nhập lại mật khẩu', type: 'password' },
  { name: 'plateNumber', label: 'Biển số xe (Tùy chọn)', placeholder: 'VD: 59A-123.45' }
]

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
      '&.Mui-focused fieldset': { borderWidth: 2, borderColor: '#3b82f6' }
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

function validate(data) {
  const errors = {}
  if (!data.fullName.trim())
    errors.fullName = 'Vui lòng nhập họ và tên'
  if (!data.phoneNumber.trim())
    errors.phoneNumber = 'Vui lòng nhập số điện thoại'
  else if (!RE.phone.test(data.phoneNumber.trim()))
    errors.phoneNumber = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0'
  if (!data.email.trim())
    errors.email = 'Vui lòng nhập email'
  else if (!RE.email.test(data.email.trim()))
    errors.email = 'Email không đúng định dạng'
  if (!data.password || data.password.length < 8)
    errors.password = 'Mật khẩu phải chứa ít nhất 8 ký tự'
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = 'Mật khẩu và xác nhận mật khẩu không khớp'
  if (data.plateNumber.trim() && !RE.plate.test(data.plateNumber.trim()))
    errors.plateNumber = 'Biển số xe không đúng định dạng. Ví dụ: 59A-123.45'
  if (!data.acceptedTerms)
    errors.acceptedTerms = 'Vui lòng đồng ý với các điều khoản dịch vụ để tiếp tục'
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

  const handleChange = ({ target: { name, value, checked, type } }) => {
    setFormData(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    // Xóa error của field khi user bắt đầu nhập lại
    if (fieldErrors[name]) setFieldErrors(e => ({ ...e, [name]: '' }))
  }

  const togglePwd = (name) => setShowPwd(s => ({ ...s, [name]: !s[name] }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerErrors([])

    const errors = validate(formData)
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
        // plateNumber và vehicleType: BE hiện chưa có field này trong DB
        // → gửi kèm để sau này BE mở rộng, không gây lỗi
        ...(formData.plateNumber.trim() && { plateNumber: formData.plateNumber.trim() })
      })

      // FIX 4: dùng toast thay vì state successMsg
      // → đồng nhất UX với toàn app
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
      setFormData(INITIAL_FORM)

      setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch {
      // FIX 5: lỗi từ server đã được authorizeAxios interceptor toast rồi
      // Chỉ cần set serverErrors nếu cần hiển thị thêm chi tiết
      setServerErrors(['Đăng ký thất bại, vui lòng kiểm tra lại thông tin.'])
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
            Tạo tài khoản Tài xế mới
          </Box>
          <Box component="p" className="text-sm text-gray-500">
            Bắt đầu tham gia để trải nghiệm dịch vụ đỗ xe thông minh
          </Box>
        </Box>

        {/* Section label */}
        <Box className="flex items-center gap-4 mb-8 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
          <Box className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </Box>
          <Box>
            <Box component="h2" className="font-bold text-gray-900 text-sm">Thông tin cá nhân</Box>
            <Box component="p" className="text-xs text-gray-500">
              Vui lòng điền chính xác thông tin để được hỗ trợ tốt nhất
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
                Loại phương tiện mặc định
              </Box>
              <FormControl fullWidth sx={sx.input}>
                <Select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  displayEmpty
                >
                  {VEHICLE_OPTIONS.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
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
                  Tôi đồng ý với{' '}
                  <Box component="a" href="#" className="text-blue-600 font-medium hover:underline">
                    Điều khoản sử dụng
                  </Box>
                  {' '}và{' '}
                  <Box component="a" href="#" className="text-blue-600 font-medium hover:underline">
                    Chính sách bảo mật
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
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký ngay'}
          </Button>

          <Box className="text-center">
            <Button
              type="button"
              onClick={() => navigate('/login')}
              sx={sx.secondaryBtn}
            >
              Quay lại Đăng nhập
            </Button>
          </Box>
        </Box>

        {/* Info note */}
        <Box className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
          <Box className="flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <Box>
              <Box component="h3" className="text-sm font-bold text-blue-800 mb-1">
                Quy Trình Duyệt Tài Khoản
              </Box>
              <Box component="p" className="text-xs text-blue-600 leading-relaxed">
                Tài khoản sau khi đăng ký sẽ được phê duyệt bởi Ban Quản Lý (BQL).
                Thông báo kết quả sẽ được gửi qua số điện thoại hoặc email.
                Quá trình xét duyệt có thể mất từ 1 – 2 ngày làm việc.
              </Box>
            </Box>
          </Box>
        </Box>

      </Paper>
    </Box>
  )
}