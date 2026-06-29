/**
 * FILE: Login.jsx
 * MÔ TẢ: Trang Đăng Nhập cho tất cả người dùng (Admin, Manager, Staff, Driver).
 * Hỗ trợ đăng nhập bằng Email/Password (truyền thống) và tích hợp đăng nhập qua Google, Facebook.
 */

// src/pages/Login.jsx
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ArrowLeft, ShieldCheck, Globe } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useApiError } from '../utils/apiError'
import { toast } from 'react-toastify'
import loginCover from '../assets/login_cover.png'

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
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      />
    </svg>
  )
}

const AdminLogin = () => {
  const { t, i18n } = useTranslation()
  const apiError = useApiError()
  const [showPass, setShowPass] = useState(false)
  const [fbLoading, setFbLoading] = useState(false)

  const { login, loginWithGoogle, loginWithFacebook, isAuthenticated, getRedirectPath, user } = useAuth()
  const navigate = useNavigate()
  const fbRef = useFacebookSDK()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues: { account: '', password: '', remember: false } })

  if (isAuthenticated) {
    return <Navigate to={getRedirectPath(user?.roleName)} replace />
  }

  const onSubmit = async ({ account, password }) => {
    try {
      const loggedUser = await login({ email: account, password })
      toast.success(t('auth.login.loginSuccess'))
      navigate(getRedirectPath(loggedUser.roleName), { replace: true })
    } catch (error) {
      const message = error.response?.data?.message
        ? apiError(error)
        : t('auth.login.loginFailedDefault')
      toast.error(message)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { user: loggedUser, message } = await loginWithGoogle(credentialResponse.credential)
      toast.success(message || t('auth.login.welcomeBack', { name: loggedUser.fullName }))
      navigate(getRedirectPath(loggedUser.roleName), { replace: true })
    } catch {
      // toast xử lý bởi axios interceptor
    }
  }

  const handleFacebookLogin = () => {
    const FB = fbRef.current || window.FB
    if (!FB) {
      toast.error(t('auth.login.facebookNotReady'))
      return
    }

    setFbLoading(true)

    FB.login((response) => {
      if (response.authResponse?.accessToken) {
        loginWithFacebook(response.authResponse.accessToken)
          .then(({ user: loggedUser, message }) => {
            toast.success(message || t('auth.login.welcomeBack', { name: loggedUser.fullName }))
            navigate(getRedirectPath(loggedUser.roleName), { replace: true })
          })
          .catch(() => { })
          .finally(() => setFbLoading(false))
      } else {
        if (response.status !== 'unknown') {
          toast.warning(t('auth.login.facebookCancelled'))
        }
        setFbLoading(false)
      }
    }, { scope: 'public_profile,email' })
  }

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi'
    i18n.changeLanguage(nextLang)
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden">
      
      {/* ━━ LEFT SIDE: IMAGE COVER ━━ */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-200">
        <div className="absolute inset-0">
          <img 
            src={loginCover} 
            alt="Smart Parking Cover" 
            className="w-full h-full object-cover mix-blend-multiply opacity-90"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        
        <div className="relative z-10 p-16 flex flex-col justify-end h-full text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl border border-white/40 flex items-center justify-center mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
            <ShieldCheck size={32} className="text-white drop-shadow-md" />
          </div>
          <h2 className="text-5xl font-black tracking-tight mb-4 leading-tight drop-shadow-lg">
            Nền Tảng Đỗ Xe <br/> Thông Minh
          </h2>
          <p className="text-lg text-white/90 font-medium max-w-md drop-shadow-md">
            Quản lý và tối ưu hóa hệ thống bãi đỗ xe của bạn một cách dễ dàng, nhanh chóng và an toàn tuyệt đối.
          </p>
        </div>
      </div>

      {/* ━━ RIGHT SIDE: LOGIN FORM ━━ */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px] mix-blend-multiply opacity-60 dark:opacity-20 pointer-events-none animate-[pulse_8s_ease-in-out_infinite]" />
        
        <Link
          to="/"
          className="absolute top-8 left-8 lg:left-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl px-5 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-all hover:shadow-sm hover:-translate-x-1 z-20"
        >
          <ArrowLeft size={16} />
          {t('auth.login.backToHome', 'Quay lại')}
        </Link>

        <button
          type="button"
          onClick={toggleLanguage}
          className="absolute top-8 right-8 lg:right-8 inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-all hover:shadow-sm hover:scale-105 z-20"
        >
          <Globe size={16} />
          <span className="uppercase">{i18n.language === 'vi' ? 'EN' : 'VI'}</span>
        </button>

        <div className="w-full max-w-[440px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700/60 p-10 transition-all duration-300 relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              {t('auth.login.title')}
            </h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {t('auth.login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                {t('auth.login.email')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  {...register('account', {
                    required: t('auth.login.emailRequired'),
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('auth.login.emailInvalid') }
                  })}
                  placeholder={t('auth.login.emailPlaceholder')}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 text-sm font-bold outline-none transition-all shadow-[inset_0_2px_4px_rgb(0,0,0,0.02)]
                    bg-slate-50/80 dark:bg-slate-700/50 dark:text-white backdrop-blur-sm
                    focus:bg-white dark:focus:bg-slate-800 focus:ring-[4px] focus:ring-blue-500/20 dark:focus:ring-blue-900/30
                    ${errors.account ? 'border-red-400 focus:border-red-500 bg-red-50/80' : 'border-slate-100 dark:border-slate-600 focus:border-blue-500 hover:border-slate-300'}`}
                />
              </div>
              {errors.account && <p className="mt-2 text-xs font-bold text-red-500">{errors.account.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                {t('auth.login.password')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPass ? 'text' : 'password'}
                  {...register('password', {
                    required: t('auth.login.passwordRequired'),
                    minLength: { value: 6, message: t('auth.login.passwordMinLength') }
                  })}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  className={`w-full pl-11 pr-11 py-3.5 rounded-2xl border-2 text-sm font-bold outline-none transition-all shadow-[inset_0_2px_4px_rgb(0,0,0,0.02)]
                    bg-slate-50/80 dark:bg-slate-700/50 dark:text-white backdrop-blur-sm
                    focus:bg-white dark:focus:bg-slate-800 focus:ring-[4px] focus:ring-blue-500/20 dark:focus:ring-blue-900/30
                    ${errors.password ? 'border-red-400 focus:border-red-500 bg-red-50/80' : 'border-slate-100 dark:border-slate-600 focus:border-blue-500 hover:border-slate-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-xs font-bold text-red-500">{errors.password.message}</p>}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('remember')}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors"
                />
                <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">{t('auth.login.rememberMe')}</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-black text-blue-600 hover:text-blue-700 transition-colors">
                {t('auth.login.forgotPassword')}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-black tracking-wide rounded-2xl transition-all shadow-[0_8px_30px_rgb(37,99,235,0.24)] hover:shadow-[0_12px_40px_rgb(37,99,235,0.4)] hover:-translate-y-1 flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
              ) : <span className="relative z-10">{t('auth.login.submit')}</span>}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.or')}</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <div className="space-y-3 flex flex-col items-center">
            <div className="w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error(t('auth.login.googleFailed'))}
                text="signin_with"
                shape="rectangular"
                width="100%"
                size="large"
              />
            </div>

            <button
              onClick={handleFacebookLogin}
              disabled={fbLoading}
              className="w-full py-3 px-4 bg-white border-2 border-slate-100 hover:border-blue-200 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-700 transition-all flex items-center justify-center gap-3 disabled:opacity-70 shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              {fbLoading ? (
                <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              ) : <FbIcon />}
              {t('auth.login.facebookButton')}
            </button>
          </div>

          <div className="mt-8 text-center bg-slate-50/50 py-4 rounded-xl border border-slate-100/50">
            <p className="text-sm font-bold text-slate-500">
              {t('auth.login.noAccount')}{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-black transition-colors ml-1">
                {t('auth.login.registerNow')}
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AdminLogin