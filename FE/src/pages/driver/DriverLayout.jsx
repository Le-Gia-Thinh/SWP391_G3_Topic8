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
  ChevronDown
} from 'lucide-react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const getInitials = (name) => {
  if (!name) return 'DN'

  const parts = name.trim().split(/\s+/)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return name.slice(0, 2).toUpperCase()
}

const LOCATIONS = [
  'District 1 Parking Tower',
  'District 3 Parking Center',
  'District 7 Parking Building',
  'Bình Thạnh Smart Parking'
]

const MENU_ITEMS = [
  { icon: Home, label: 'Trang chủ', path: '/driver/home' },
  { icon: PlusSquare, label: 'Đặt chỗ mới', path: '/driver/booking' },
  { icon: History, label: 'Lịch sử đặt chỗ', path: '/driver/history' },
  { icon: Car, label: 'Phiên gửi xe hiện tại', path: '/driver/session' },
  { icon: CreditCard, label: 'Thanh toán', path: '/driver/payment' },
  { icon: AlertTriangle, label: 'Báo cáo sự cố', path: '/driver/report' },
  { icon: User, label: 'Hồ sơ cá nhân', path: '/driver/profile' }
]

const NOTIFICATION_STYLES = {
  success: {
    icon: '✓',
    className: 'bg-green-50 text-green-600'
  },
  info: {
    icon: 'ℹ',
    className: 'bg-blue-50 text-blue-600'
  },
  warning: {
    icon: '⚠',
    className: 'bg-amber-50 text-amber-600'
  }
}

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

  const [selectedLocation, setSelectedLocation] = useState('District 1 Parking Tower')

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Đặt chỗ thành công',
      desc: 'Mã đặt chỗ BK-8829102 của bạn đã được xác nhận thành công tại Floor B2 / Area C / Slot 102.',
      time: '5 phút trước',
      type: 'success',
      unread: true
    },
    {
      id: 2,
      title: 'Phiên gửi xe đang hoạt động',
      desc: 'Xe biển số 51K-123.45 đã vào bãi lúc 14:35, 24/10/2023.',
      time: '2 giờ trước',
      type: 'info',
      unread: true
    },
    {
      id: 3,
      title: 'Thông báo thanh toán',
      desc: 'Phiên gửi xe SES-990123 đã được cập nhật số tiền cần thanh toán là 45,000 VND.',
      time: '3 giờ trước',
      type: 'warning',
      unread: false
    }
  ])

  const currentPath = location.pathname

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => notification.unread).length
  }, [notifications])

  const hasUnread = unreadCount > 0

  const displayName = user?.fullName || 'Duy Nguyễn'
  const displayEmail = user?.email || 'driver@smartpark.com'

  const closeAllDropdowns = () => {
    setIsProfileOpen(false)
    setIsLocationOpen(false)
    setIsNotificationsOpen(false)
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        unread: false
      }))
    )
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

  const isActiveMenu = (path) => {
    if (path === '/driver/home') {
      return currentPath === '/driver' || currentPath === '/driver/home'
    }

    return currentPath === path || currentPath.startsWith(`${path}/`)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target

      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false)
      }

      if (locationRef.current && !locationRef.current.contains(target)) {
        setIsLocationOpen(false)
      }

      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc] font-sans text-gray-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-20 w-full shrink-0 items-center justify-between border-b border-gray-100 bg-white px-8">
        {/* Left: Logo & Location */}
        <div className="flex items-center gap-6">
          <Link
            to="/driver/home"
            onClick={closeAllDropdowns}
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Car size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-black leading-none text-blue-600 tracking-tight">
                PBMS
              </h1>
              <p className="mt-1 text-[11px] text-gray-400">
                Parking Building System
              </p>
            </div>
          </Link>

          <div className="hidden h-10 w-px bg-gray-100 md:block" />

          {/* Location Dropdown */}
          <div className="relative hidden sm:block" ref={locationRef}>
            <button
              type="button"
              onClick={() => setIsLocationOpen((prev) => !prev)}
              className="flex cursor-pointer select-none items-center gap-2 rounded-xl p-2 text-sm font-bold text-blue-600 transition-all hover:bg-blue-50/50 focus:outline-none"
            >
              <MapPin size={18} className="shrink-0 text-blue-600" />
              <span className="max-w-[220px] truncate">{selectedLocation}</span>
              <ChevronDown
                size={14}
                className={`text-blue-400 transition-transform ${isLocationOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {isLocationOpen && (
              <div className="absolute left-0 z-50 mt-2 w-64 rounded-2xl border border-gray-100 bg-white py-2 shadow-xl">
                <div className="border-b border-gray-50 px-4 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Chọn bãi đỗ xe
                  </span>
                </div>

                <div className="space-y-0.5 p-1">
                  {LOCATIONS.map((locationName) => {
                    const active = selectedLocation === locationName

                    return (
                      <button
                        key={locationName}
                        type="button"
                        onClick={() => handleSelectLocation(locationName)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-all ${active
                          ? 'bg-blue-50 font-bold text-blue-600'
                          : 'font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                      >
                        <span>{locationName}</span>

                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Notification & Profile */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className="relative flex cursor-pointer select-none items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-600 focus:outline-none"
            >
              <div className="relative flex items-center justify-center">
                <Bell size={20} />

                {hasUnread && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-red-500" />
                )}
              </div>

              <ChevronDown
                size={12}
                className={`text-gray-400 transition-transform ${isNotificationsOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-2xl border border-gray-100 bg-white py-3 shadow-xl sm:w-96">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-800">
                      Thông báo
                    </span>

                    {hasUnread && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-500">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>

                  {hasUnread && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>

                <div className="max-h-[350px] divide-y divide-gray-50 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-gray-400">
                      Không có thông báo nào mới
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const style =
                        NOTIFICATION_STYLES[notification.type] ||
                        NOTIFICATION_STYLES.info

                      return (
                        <div
                          key={notification.id}
                          className={`flex items-start gap-3 px-5 py-3.5 transition-colors ${notification.unread
                            ? 'bg-blue-50/30'
                            : 'hover:bg-gray-50/50'
                            }`}
                        >
                          <div className="mt-1 shrink-0">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${style.className}`}
                            >
                              {style.icon}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={`truncate text-sm ${notification.unread
                                  ? 'font-bold text-gray-800'
                                  : 'font-semibold text-gray-700'
                                  }`}
                              >
                                {notification.title}
                              </p>

                              <span className="shrink-0 text-[10px] font-medium text-gray-400">
                                {notification.time}
                              </span>
                            </div>

                            <p className="mt-1 break-words text-xs leading-relaxed text-gray-500">
                              {notification.desc}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden h-10 w-px bg-gray-100 sm:block" />

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex cursor-pointer items-center gap-3 rounded-xl p-1.5 pr-3 transition-all hover:bg-gray-50 focus:outline-none"
            >
              <div className="hidden text-left sm:block">
                <p className="text-sm font-black text-blue-600">
                  {displayName}
                </p>
                <p className="text-xs font-medium text-gray-400">Driver Account</p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-100 bg-[#ff6b00] text-sm font-bold tracking-wider text-white shadow-sm">
                {getInitials(displayName)}
              </div>

              <ChevronDown
                size={14}
                className={`text-blue-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-gray-100 bg-white py-3 shadow-xl">
                <div className="border-b border-gray-50 px-5 py-3 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Tài khoản
                  </p>

                  <p className="mt-1 truncate text-sm font-bold text-gray-800">
                    {displayName}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {displayEmail}
                  </p>

                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Driver Account
                  </div>
                </div>

                <div className="space-y-0.5 border-b border-gray-50 px-2 py-2">
                  <Link
                    to="/driver/profile"
                    onClick={closeAllDropdowns}
                    className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600"
                  >
                    <User size={16} />
                    <span>Hồ sơ cá nhân</span>
                  </Link>

                  <Link
                    to="/driver/settings"
                    onClick={closeAllDropdowns}
                    className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Settings size={16} />
                    <span>Cài đặt hệ thống</span>
                  </Link>
                </div>

                <div className="px-2 pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition-all hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="hidden w-[270px] shrink-0 flex-col justify-between border-r border-gray-100 bg-white md:flex">
          <div className="py-6">
            <nav className="space-y-1 px-4">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon
                const active = isActiveMenu(item.path)

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeAllDropdowns}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${active
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

          <div className="space-y-1 border-t border-gray-100 p-4">
            <Link
              to="/driver/settings"
              onClick={closeAllDropdowns}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${isActiveMenu('/driver/settings')
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                }`}
            >
              <Settings size={18} />
              <span>Cài đặt hệ thống</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1280px] px-8 py-8">
            <Outlet />

            <footer className="mt-10 flex flex-col gap-4 border-t border-gray-200 pt-6 text-xs text-gray-400 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <span>SmartPark v2.4.0-stable</span>
                <span>© 2026 SmartPark Inc.</span>
              </div>

              <div className="flex flex-wrap gap-6">
                <Link
                  to="/driver/support"
                  className="transition-colors hover:text-gray-600"
                >
                  Trung tâm hỗ trợ
                </Link>

                <Link
                  to="/driver/terms"
                  className="transition-colors hover:text-gray-600"
                >
                  Điều khoản dịch vụ
                </Link>

                <Link
                  to="/driver/privacy"
                  className="transition-colors hover:text-gray-600"
                >
                  Chính sách bảo mật
                </Link>

                <span className="font-semibold text-gray-500">
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