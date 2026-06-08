import React, { useState } from 'react'
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

const StaffLogin = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('bob@email.com')
  const [password, setPassword] = useState('123456')
  const [isLoading, setIsLoading] = useState(false)

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
      toast.success('Đăng nhập thành công')
      navigate(getRedirectPath(loggedUser.roleName), { replace: true })
    } catch (error) {
      const message = error.response?.data?.message || 'Email hoặc mật khẩu không đúng'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100">

        {/* Left Side - Image/Branding */}
        <div className="md:w-1/2 bg-blue-600 p-12 text-white flex flex-col justify-between relative overflow-hidden hidden md:flex">
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
              Quản lý bãi đỗ xe <br/> thông minh
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-md">
              Hệ thống dành riêng cho nhân viên vận hành. Kiểm soát xe ra vào, quản lý doanh thu và xử lý sự cố nhanh chóng.
            </p>
          </div>

          <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-8 h-8 text-blue-200 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Bảo mật đa lớp</h3>
                <p className="text-blue-100 text-sm mt-1">
                  Mọi thao tác truy cập đều được mã hóa và theo dõi 24/7 để đảm bảo an toàn cho hệ thống.
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập Nhân viên</h2>
            <p className="text-gray-500">Vui lòng điền thông tin để tiếp tục truy cập</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email hoặc Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all"
                  placeholder="nhanvien@parking.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all"
                  placeholder="••••••••"
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
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <div className="text-sm">
                <Link to="#" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-8 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Bạn gặp vấn đề khi đăng nhập?{' '}
              <Link to="#" className="font-semibold text-blue-600 hover:text-blue-500">
                Liên hệ IT Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffLogin
