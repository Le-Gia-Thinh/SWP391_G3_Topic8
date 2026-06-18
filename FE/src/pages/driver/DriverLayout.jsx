// File: /FE/src/pages/driver/DriverLayout.jsx

import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  Bell,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

// Page constants (menu items)
const MENU_ITEMS = [
  { icon: Home, label: 'Trang chủ', path: '/driver/home' },
  { icon: PlusSquare, label: 'Đặt chỗ mới', path: '/driver/booking' },
  { icon: History, label: 'Lịch sử đặt chỗ', path: '/driver/history' },
  { icon: Car, label: 'Phiên gửi xe hiện tại', path: '/driver/session' },
  { icon: CreditCard, label: 'Thanh toán', path: '/driver/payment' },
  { icon: AlertTriangle, label: 'Báo cáo sự cố', path: '/driver/report' },
  { icon: User, label: 'Hồ sơ cá nhân', path: '/driver/profile' },
  { icon: CreditCard, label: 'Lịch sử thanh toán', path: '/driver/payment-history' },
  { icon: CreditCard, label: 'Kết quả thanh toán', path: '/driver/payment-result' },
  { icon: Settings, label: 'Cài đặt', path: '/driver/settings' },
  { icon: AlertTriangle, label: 'Hỗ trợ', path: '/driver/support' },
  { icon: User, label: 'Điều khoản', path: '/driver/terms' },
  { icon: User, label: 'Chính sách bảo mật', path: '/driver/privacy' }
]

const LOCATIONS = [
  'District 1 Parking Tower',
  'District 3 Parking Center',
  'District 7 Parking Building',
  'Bình Thạnh Smart Parking'
]

const DriverLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const profileRef = useRef(null)
  const locationRef = useRef(null)
  const notificationRef = useRef(null)

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0])
  const [notifications, setNotifications] = useState([])

  const displayName = user?.fullName || 'Duy Nguyễn'
  const displayEmail = user?.email || 'driver@smartpark.com'

  const closeAllDropdowns = () => {
    setIsProfileOpen(false)
    setIsLocationOpen(false)
    setIsNotificationsOpen(false)
  }

  const handleLogout = async () => {
    closeAllDropdowns()
    await logout()
    navigate('/login', { replace: true })
  }

  const handleSelectLocation = (locationName) => {
    setSelectedLocation(locationName)
    setIsLocationOpen(false)
  }

  const currentPath = location.pathname
  const isActiveMenu = (path) => {
    if (path === '/driver/home') {
      return currentPath === '/driver' || currentPath === '/driver/home'
    }
    return currentPath === path || currentPath.startsWith(`${path}/`)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target
      if (profileRef.current && !profileRef.current.contains(target)) setIsProfileOpen(false)
      if (locationRef.current && !locationRef.current.contains(target)) setIsLocationOpen(false)
      if (notificationRef.current && !notificationRef.current.contains(target)) setIsNotificationsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 px-4 md:px-8">
        {/* Logo + Location */}
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-slate-900/50">
            <Menu size={24} />
          </button>
          <Link to="/driver/home" onClick={closeAllDropdowns} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:text-blue-400">
              <Car size={20} />
            </div>
            <span className="hidden sm:block text-blue-600 dark:text-blue-400 font-black text-2xl">PBMS</span>
          </Link>
          {/* Location Dropdown */}
          <div className="relative hidden sm:block" ref={locationRef}>
            <button onClick={() => setIsLocationOpen(prev => !prev)} className="flex items-center gap-2 rounded-xl p-2 text-sm font-bold text-blue-600 dark:text-blue-400">
              {selectedLocation} <ChevronDown size={14} className={`${isLocationOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLocationOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl border bg-white dark:bg-slate-800 shadow-xl">
                {LOCATIONS.map(loc => (
                  <button key={loc} onClick={() => handleSelectLocation(loc)} className={`w-full px-3 py-2 text-left ${selectedLocation===loc?'bg-blue-50 dark:bg-blue-900/20 font-bold text-blue-600 dark:text-blue-400':'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:bg-slate-900/50'}`}>
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={profileRef}>
            <button onClick={() => setIsProfileOpen(prev => !prev)} className="flex items-center gap-3 rounded-xl p-1.5">
              <div className="text-sm font-bold text-white bg-orange-600 h-10 w-10 flex items-center justify-center rounded-full">{displayName.slice(0,2)}</div>
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border bg-white dark:bg-slate-800 shadow-xl">
                <Link to="/driver/profile" onClick={closeAllDropdowns} className="block px-4 py-2">Hồ sơ cá nhân</Link>
                <Link to="/driver/settings" onClick={closeAllDropdowns} className="block px-4 py-2">Cài đặt</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600">Đăng xuất</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 relative">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-[270px] bg-white dark:bg-slate-800 border-r shadow-xl transition-transform duration-300 ${sidebarOpen?'translate-x-0 flex':'-translate-x-full hidden'}`}>
          <div className="py-6 flex-1 overflow-y-auto">
            <nav className="space-y-1 px-4">
              {MENU_ITEMS.map(item => {
                const Icon = item.icon
                return (
                  <Link key={item.path} to={item.path} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActiveMenu(item.path)?'bg-blue-600 text-white':'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:bg-blue-900/20 hover:text-blue-600 dark:text-blue-400'}`}>
                    <Icon size={18} /> {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1280px] px-8 py-8">
            <Outlet />
            {/* Footer Links */}
            <footer className="mt-10 flex flex-col gap-4 border-t border-gray-200 dark:border-slate-700 pt-6 text-xs text-gray-400 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <span>SmartPark v2.4.0-stable</span>
                <span>© 2026 SmartPark Inc.</span>
              </div>
              <div className="flex flex-wrap gap-6">
                <Link to="/driver/support">Trung tâm hỗ trợ</Link>
                <Link to="/driver/terms">Điều khoản dịch vụ</Link>
                <Link to="/driver/privacy">Chính sách bảo mật</Link>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DriverLayout