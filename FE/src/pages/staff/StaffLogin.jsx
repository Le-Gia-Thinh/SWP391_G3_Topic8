/**
 * FILE: StaffLogin.jsx
 * MÔ TẢ: Trang Đăng nhập dành cho nhân viên (Staff).
 * Cung cấp giao diện đăng nhập bảo mật và chuyển hướng đến trang phù hợp sau khi đăng nhập thành công.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'

const StaffLogin = () => {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('bob@email.com')
  const [password, setPassword] = useState('123456')
  const [isLoading, setIsLoading] = useState(false)
  const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', message: '' })

  const { login, isAuthenticated, getRedirectPath, user } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    return <Navigate to={getRedirectPath(user?.roleName)} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const loggedUser = await login({ email, password })
      toast.success(t('staff.login.loginSuccess'))
      navigate(getRedirectPath(loggedUser.roleName), { replace: true })
    } catch (error) {
      const message = error.response?.data?.message || t('staff.login.loginFail')
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100">

        {/* Left Side - Image/Branding */}
        <div className="md:w-1/2 bg-blue-600 p-12 text-white flex-col justify-between relative overflow-hidden hidden md:flex">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500 opacity-50 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-700 opacity-50 blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-md">
                P
              </div>
              <span className="text-2xl font-bold tracking-tight">PBMS</span>
            </div>

            <h1 className="text-4xl font-extrabold mb-6 leading-tight">
              {t('staff.login.brandTitleLine1')} <br /> {t('staff.login.brandTitleLine2')}
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-md">
              {t('staff.login.brandSubtitle')}
            </p>
          </div>

          <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-blue-200 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">{t('staff.login.securityTitle')}</h3>
                <p className="text-blue-100 text-sm mt-1">
                  {t('staff.login.securityBody')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-2xl shadow-md">
              P
            </div>
            <span className="text-2xl font-bold text-blue-600 tracking-tight">PBMS</span>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('staff.login.title')}</h2>
            <p className="text-gray-500">{t('staff.login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('staff.login.emailLabel')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all"
                  placeholder={t('staff.login.emailPlaceholder')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('staff.login.passwordLabel')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all"
                  placeholder={t('staff.login.passwordPlaceholder')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer">
                  {t('staff.login.rememberMe')}
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => setInfoModal({ isOpen: true, title: t('staff.login.forgotModalTitle'), message: t('staff.login.forgotModalBody') })}
                  className="font-semibold text-blue-600 hover:text-blue-500 hover:underline"
                >
                  {t('staff.login.forgotPassword')}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-8 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? t('staff.login.submitting') : t('staff.login.submit')} <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              {t('staff.login.supportPrompt')}{' '}
              <button
                type="button"
                onClick={() => setInfoModal({ isOpen: true, title: t('staff.login.supportModalTitle'), message: t('staff.login.supportModalBody') })}
                className="font-semibold text-blue-600 hover:text-blue-500 hover:underline"
              >
                {t('staff.login.supportLink')}
              </button>
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={infoModal.isOpen}
        onClose={() => setInfoModal({ isOpen: false, title: '', message: '' })}
        title={infoModal.title}
        footer={<Button variant="primary" onClick={() => setInfoModal({ isOpen: false, title: '', message: '' })}>{t('staff.login.close')}</Button>}
      >
        <p className="text-gray-700">{infoModal.message}</p>
      </Modal>
    </div>
  )
}

export default StaffLogin