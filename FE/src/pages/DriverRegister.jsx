/**
 * FILE: DriverRegister.jsx
 * MÔ TẢ: Trang Đăng Ký tài khoản dành riêng cho người dùng Driver (Khách hàng).
 * Thu thập thông tin cá nhân cơ bản và biển số xe, có cơ chế xác thực đầu vào (Validation).
 */

// src/pages/DriverRegister.jsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Info, User, ArrowLeft, ShieldCheck, Mail, Lock, Phone, Car } from 'lucide-react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { registerAPI } from '../apis/authApi'
import { useAuth } from '../contexts/AuthContext'
import { formatPlateNumber } from '../utils/formatters'

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
  
  const getIcon = () => {
    switch(field.name) {
      case 'fullName': return <User className="w-5 h-5 text-slate-400" />
      case 'phoneNumber': return <Phone className="w-5 h-5 text-slate-400" />
      case 'email': return <Mail className="w-5 h-5 text-slate-400" />
      case 'password': 
      case 'confirmPassword': return <Lock className="w-5 h-5 text-slate-400" />
      case 'plateNumber': return <Car className="w-5 h-5 text-slate-400" />
      default: return null
    }
  }

  return (
    <div className={field.fullWidth ? 'sm:col-span-2' : ''}>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 pl-1">
        {field.label}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
          {getIcon()}
        </div>
        <input
          name={field.name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          className={`w-full pl-11 pr-10 py-3 rounded-xl border text-sm font-medium outline-none transition-all shadow-inner
            bg-slate-50 dark:bg-slate-700/50 dark:text-white
            focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-900/30
            ${error ? 'border-red-400 focus:border-red-500 bg-red-50/50' : 'border-slate-200/60 dark:border-slate-600 focus:border-blue-500 hover:border-slate-300 dark:hover:border-slate-500'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-500 pl-1">{error}</p>}
    </div>
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
    const cooked = type === 'checkbox' ? checked : name === 'plateNumber' ? formatPlateNumber(value) : value
    setFormData(f => ({ ...f, [name]: cooked }))
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
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f1] dark:bg-slate-900 p-4 py-12 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply opacity-50 dark:opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[120px] mix-blend-multiply opacity-50 dark:opacity-20 pointer-events-none" />

      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white/50 dark:bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/60 dark:border-slate-700/60 transition-all hover:shadow-sm z-10"
      >
        <ArrowLeft size={16} />
        {t('auth.login.backToHome', 'Quay lại trang chủ')}
      </Link>

      <div className="w-full max-w-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-200/60 dark:border-slate-700/60 p-8 sm:p-12 transition-all duration-300 relative z-10">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            {t('auth.register.title')}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t('auth.register.subtitle')}
          </p>
        </div>

        {/* Section label */}
        <div className="flex items-center gap-4 mb-10 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
          <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">{t('auth.register.personalInfoTitle')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {t('auth.register.personalInfoSubtitle')}
            </p>
          </div>
        </div>

        {/* Server errors */}
        {serverErrors.length > 0 && (
          <div className="mb-8 p-4 rounded-xl bg-red-50/50 border border-red-100 text-red-600 flex gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <ul className="list-disc pl-5 space-y-1 text-sm font-medium">
              {serverErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">

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

            {/* Vehicle type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5 pl-1">
                {t('auth.register.vehicleType')}
              </label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200/60 dark:border-slate-600 text-sm font-medium outline-none transition-all shadow-inner bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-900/30 focus:border-blue-500 appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
              >
                {VEHICLE_OPTIONS.map(opt => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Terms */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="acceptedTerms"
                checked={formData.acceptedTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed select-none">
                {t('auth.register.acceptTermsPrefix')}{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  {t('auth.register.termsOfService')}
                </a>
                {' '}{t('auth.register.and')}{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  {t('auth.register.privacyPolicy')}
                </a>
              </span>
            </label>
            {fieldErrors.acceptedTerms && (
              <p className="text-xs font-medium text-red-500 mt-1.5 ml-7">
                {fieldErrors.acceptedTerms}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-[0_8px_30px_rgb(37,99,235,0.24)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.36)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group relative overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
            ) : <span className="relative z-10 tracking-wide">{t('auth.register.submit')}</span>}
          </button>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              {t('auth.register.backToLogin')}
            </button>
          </div>
        </form>

        {/* Info note */}
        <div className="mt-10 bg-emerald-50/50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1">
                {t('auth.register.approvalNoticeTitle')}
              </h3>
              <p className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80 leading-relaxed">
                {t('auth.register.approvalNoticeBody')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}