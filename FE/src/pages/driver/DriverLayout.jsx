import React from 'react'
import {
  Home,
  PlusSquare,
  History,
  Car,
  CreditCard,
  AlertTriangle,
  User,
  Settings,
  LogOut,
  MapPin,
  Bell
} from 'lucide-react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const DriverLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const currentPath = location.pathname

  const menuItems = [
    { icon: Home, label: 'Trang chủ', path: '/driver/home' },
    { icon: PlusSquare, label: 'Đặt chỗ mới', path: '/driver/booking' },
    { icon: History, label: 'Lịch sử đặt chỗ', path: '/driver/history' },
    { icon: Car, label: 'Phiên gửi xe hiện tại', path: '/driver/session' },
    { icon: CreditCard, label: 'Thanh toán', path: '/driver/payment' },
    { icon: AlertTriangle, label: 'Báo cáo sự cố', path: '/driver/report' },
    { icon: User, label: 'Hồ sơ cá nhân', path: '/driver/profile' }
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const isActiveMenu = (path) => {
    if (path === '/driver/home') {
      return currentPath === '/driver' || currentPath === '/driver/home'
    }

    return currentPath === path || currentPath.startsWith(`${path}/`)
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-[270px] shrink-0 bg-white border-r border-gray-100 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="h-20 px-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Car size={22} />
            </div>

            <div>
              <h1 className="text-xl font-black text-blue-600 leading-none">
                PBMS
              </h1>
              <p className="text-[11px] text-gray-400 mt-1">
                Parking Building System
              </p>
            </div>
          </div>

          {/* Menu */}
          <nav className="px-4 mt-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActiveMenu(item.path)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Menu */}
        <div className="p-4 border-t border-gray-100 space-y-1">
          <Link
            to="/driver/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            <Settings size={18} />
            <span>Cài đặt hệ thống</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Right Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <MapPin size={17} className="text-blue-500" />
            <span>District 1 Parking Tower</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              className="relative w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
            >
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            </button>

            <div className="h-10 w-px bg-gray-100" />

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">
                  {user?.fullName || 'Driver'}
                </p>
                <p className="text-xs text-gray-400">
                  Driver Account
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-orange-500 overflow-hidden border border-orange-100">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.fullName || 'Driver'
                  )}&background=ff5a1f&color=ffffff&bold=true`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1280px] mx-auto px-8 py-8">
            <Outlet />

            {/* Footer */}
            <footer className="mt-10 pt-6 border-t border-gray-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-xs text-gray-400">
              <div className="flex flex-wrap items-center gap-4">
                <span>SmartPark v2.4.0-stable</span>
                <span>© 2023 SmartPark Inc.</span>
              </div>

              <div className="flex flex-wrap gap-6">
                <Link
                  to="/driver/support"
                  className="hover:text-gray-600 transition-colors"
                >
                  Trung tâm hỗ trợ
                </Link>

                <Link
                  to="/driver/terms"
                  className="hover:text-gray-600 transition-colors"
                >
                  Điều khoản dịch vụ
                </Link>

                <Link
                  to="/driver/privacy"
                  className="hover:text-gray-600 transition-colors"
                >
                  Chính sách bảo mật
                </Link>

                <span className="text-gray-500 font-semibold">
                  Hệ thống ổn định
                </span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DriverLayout