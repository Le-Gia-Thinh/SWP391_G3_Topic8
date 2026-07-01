/**
 * FILE: DriverLayout.jsx
 * MÔ TẢ: Layout chính của phân hệ Driver.
 * Chứa Sidebar điều hướng, Header (thông tin người dùng, đổi vị trí, thông báo),
 * và phần nội dung chính (Outlet) cho các trang con.
 */

// File: /FE/src/pages/driver/DriverLayout.jsx

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Home, PlusSquare, History, Car, CreditCard, AlertTriangle,
  User, Settings, LogOut, MapPin, Bell, ChevronDown, Menu, X
} from 'lucide-react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const MENU_ITEMS = [
  { icon: Home, labelKey: 'driver.layout.menu.home', path: '/driver/home' },
  { icon: PlusSquare, labelKey: 'driver.layout.menu.newBooking', path: '/driver/booking' },
  { icon: History, labelKey: 'driver.layout.menu.history', path: '/driver/history' },
  { icon: Car, labelKey: 'driver.layout.menu.session', path: '/driver/session' },
  { icon: CreditCard, labelKey: 'driver.layout.menu.payment', path: '/driver/payment' },
  { icon: AlertTriangle, labelKey: 'driver.layout.menu.report', path: '/driver/report' },
  { icon: User, labelKey: 'driver.layout.menu.profile', path: '/driver/profile' },
  { icon: CreditCard, labelKey: 'driver.layout.menu.paymentHistory', path: '/driver/payment-history' },
  { icon: CreditCard, labelKey: 'driver.layout.menu.paymentResult', path: '/driver/payment-result' },
  { icon: Settings, labelKey: 'driver.layout.menu.settings', path: '/driver/settings' },
  { icon: AlertTriangle, labelKey: 'driver.layout.menu.support', path: '/driver/support' },
  { icon: User, labelKey: 'driver.layout.menu.terms', path: '/driver/terms' },
  { icon: User, labelKey: 'driver.layout.menu.privacy', path: '/driver/privacy' }
]

const LOCATIONS = [
  'District 1 Parking Tower',
  'District 3 Parking Center',
  'District 7 Parking Building',
  'Bình Thạnh Smart Parking'
]

const DriverLayout = () => {
  const { t } = useTranslation()
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
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800">
            <Menu size={24} />
          </button>
          <Link to="/driver/home" onClick={closeAllDropdowns} className="flex items-center gap-3 group">
            {/* Premium Icon */}
            <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 group-hover:shadow-blue-500/50 transition-all duration-300 ring-2 ring-white/20">
              <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm" />
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-md z-10 relative" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19.5v-15h5a4.5 4.5 0 0 1 0 9H9" />
                <path d="M14 4.5A4.5 4.5 0 0 1 18.5 9" className="stroke-cyan-300 opacity-70" />
                <circle cx="18" cy="18" r="2.5" className="fill-green-400 stroke-white dark:stroke-slate-800" strokeWidth="1.5" />
              </svg>
            </div>
            
            {/* Typography */}
            <div className="hidden sm:flex flex-col justify-center ml-2">
              <div className="flex items-baseline leading-none">
                <span className="text-[26px] font-black text-slate-800 dark:text-white tracking-tighter">Smart</span>
                <span className="text-[26px] font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 tracking-tighter">Park</span>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 ml-1 mb-1 animate-pulse" />
              </div>
              <span className="text-[9.5px] font-black tracking-[0.25em] text-slate-400 dark:text-slate-500 uppercase mt-1.5 flex items-center gap-2">
                Driver Portal
                <span className="w-8 h-[2px] bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-600 rounded-full"></span>
              </span>
            </div>
          </Link>
          <div className="relative hidden sm:block" ref={locationRef}>
            <button onClick={() => setIsLocationOpen(prev => !prev)} className="flex items-center gap-2 rounded-xl p-2 text-sm font-bold text-blue-600 dark:text-blue-400">
              {selectedLocation} <ChevronDown size={14} className={`${isLocationOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLocationOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl border bg-white dark:bg-slate-800 shadow-xl">
                {LOCATIONS.map(loc => (
                  <button key={loc} onClick={() => handleSelectLocation(loc)} className={`w-full px-3 py-2 text-left ${selectedLocation === loc ? 'bg-blue-50 dark:bg-blue-900/20 font-bold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={profileRef}>
            <button onClick={() => setIsProfileOpen(prev => !prev)} className="flex items-center gap-3 rounded-xl p-1.5">
              <div className="text-sm font-bold text-white bg-orange-600 h-10 w-10 flex items-center justify-center rounded-full">{displayName.slice(0, 2)}</div>
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border bg-white dark:bg-slate-800 shadow-xl">
                <Link to="/driver/profile" onClick={closeAllDropdowns} className="block px-4 py-2">{t('driver.layout.profileMenu.profile')}</Link>
                <Link to="/driver/settings" onClick={closeAllDropdowns} className="block px-4 py-2">{t('driver.layout.profileMenu.settings')}</Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600">{t('driver.layout.profileMenu.logout')}</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 relative">
        <aside className={`fixed inset-y-0 left-0 z-50 w-[270px] bg-white dark:bg-slate-800 border-r shadow-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0 flex' : '-translate-x-full hidden'}`}>
          <div className="py-6 flex-1 overflow-y-auto">
            <nav className="space-y-1 px-4">
              {MENU_ITEMS.map(item => {
                const Icon = item.icon
                return (
                  <Link key={item.path} to={item.path} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActiveMenu(item.path) ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:bg-blue-900/20 hover:text-blue-600 dark:text-blue-400'}`}>
                    <Icon size={18} /> {t(item.labelKey)}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1280px] px-8 py-8">
            <Outlet />
            <footer className="mt-10 flex flex-col gap-4 border-t border-gray-200 dark:border-slate-700 pt-6 text-xs text-gray-400 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <span>SmartPark v2.4.0-stable</span>
                <span>© 2026 SmartPark Inc.</span>
              </div>
              <div className="flex flex-wrap gap-6">
                <Link to="/driver/support">{t('driver.layout.footer.support')}</Link>
                <Link to="/driver/terms">{t('driver.layout.footer.terms')}</Link>
                <Link to="/driver/privacy">{t('driver.layout.footer.privacy')}</Link>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DriverLayout