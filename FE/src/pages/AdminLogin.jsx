// src/pages/AdminLogin.jsx
import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
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
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
  } = useForm({ defaultValues: { account: '', password: '', remember: false } })

  if (isAuthenticated) {
    return <Navigate to={getRedirectPath(user?.roleName)} replace />
  }

  const onSubmit = async ({ account, password }) => {
    try {
      const loggedUser = await login({ email: account, password })
      toast.success('Đăng nhập thành công')
      navigate(getRedirectPath(loggedUser.roleName), { replace: true })
    } catch (error) {
      const message = error.response?.data?.message || 'Email hoặc mật khẩu không đúng'
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4 transition-colors duration-300">
      <div className="w-full max-w-[420px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-t-4 border-blue-600 p-8 transition-colors duration-300">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Đăng Nhập</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Vui lòng nhập thông tin để truy cập hệ thống
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                {...register('account', {
                  required: 'Email không được để trống',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' }
                })}
                placeholder="admin@parking.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all
                  bg-slate-50 dark:bg-slate-700 dark:text-white
                  focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30
                  ${errors.account ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-600 focus:border-blue-500 hover:border-slate-300 dark:hover:border-slate-500'}`}
              />
            </div>
            {errors.account && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.account.message}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showPass ? 'text' : 'password'}
                {...register('password', {
                  required: 'Mật khẩu không được để trống',
                  minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }
                })}
                placeholder="Nhập mật khẩu"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm font-medium outline-none transition-all
                  bg-slate-50 dark:bg-slate-700 dark:text-white
                  focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30
                  ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-600 focus:border-blue-500 hover:border-slate-300 dark:hover:border-slate-500'}`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.password.message}</p>}
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('remember')}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Ghi nhớ đăng nhập</span>
            </label>
            <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Đăng Nhập'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hoặc</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="space-y-3 flex flex-col items-center">
          <div className="w-[350px]">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Đăng nhập Google thất bại')}
              text="signin_with"
              shape="rectangular"
              width="350"
            />
          </div>

          <button
            onClick={handleFacebookLogin}
            disabled={fbLoading}
            className="w-[350px] py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {fbLoading ? (
              <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            ) : <FbIcon />}
            Đăng nhập với Facebook
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Bạn chưa có tài khoản?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold transition-colors">
              Đăng ký ngay
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default AdminLogin