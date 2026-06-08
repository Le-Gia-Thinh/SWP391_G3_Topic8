import React, { useState, useEffect, useRef } from 'react'
import {
  Bell, ChevronDown, LogOut, User, Settings, Shield,
  Clock, AlertTriangle, CheckCircle2, X, ExternalLink
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'warning', title: 'Sai lịch biển số: 51G-123.45', time: '5 phút trước', read: false },
  { id: 2, type: 'info', title: 'Lượt đặt trước #BK-992 sắp hết hạn', time: '12 phút trước', read: false },
  { id: 3, type: 'error', title: 'Cần thanh toán: Xe 30H-112.00 quá hạn 2h', time: '20 phút trước', read: false },
  { id: 4, type: 'success', title: 'Check-in thành công – Biển 43A-552.12', time: '1 giờ trước', read: true },
  { id: 5, type: 'warning', title: 'Bảo trì ô đỗ khu vực C-010', time: '1 giờ trước', read: true }
]

const NOTIF_ICON = {
  warning: <AlertTriangle size={14} className="text-orange-500" />,
  error:   <AlertTriangle size={14} className="text-red-500" />,
  info:    <Clock size={14} className="text-blue-500" />,
  success: <CheckCircle2 size={14} className="text-green-500" />
}

const PAGE_TITLES = {
  '/staff/dashboard':       'Bảng điều khiển',
  '/staff/checkin-walkin':  'Tiếp nhận xe – Walk-in',
  '/staff/checkin-booking': 'Tiếp nhận xe – Đặt trước',
  '/staff/verify-booking':  'Xác thực đặt chỗ',
  '/staff/booking-success': 'Check-in Booking thành công',
  '/staff/checkin-success': 'Check-in Walk-in thành công',
  '/staff/checkout':        'Thanh toán & Trả xe',
  '/staff/payment':         'Xác nhận thanh toán',
  '/staff/checkout-completed': 'Check-out hoàn tất',
  '/staff/create-incident': 'Báo cáo sự cố',
  '/staff/parking-map':     'Sơ đồ bãi đỗ xe',
  '/staff/search-session':  'Tra cứu phiên'
}

const StaffNavbar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [activeGate, setActiveGate] = useState('A')
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [currentTime, setCurrentTime] = useState(new Date())

  const notifRef = useRef(null)
  const profileRef = useRef(null)

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Network status
  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close dropdowns on route change
  useEffect(() => {
    setShowNotif(false)
    setShowProfile(false)
  }, [location.pathname])

  const pageTitle = PAGE_TITLES[location.pathname] || 'Staff Gate Dashboard'

  const dateStr = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(currentTime)

  const timeStr = currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const dismissNotif = (id) => setNotifications(prev => prev.filter(n => n.id !== id))

  const handleLogout = async () => {
    setShowProfile(false)
    await logout()
    navigate('/login')
  }

  const avatarSrc = user?.avatar || 'https://i.pravatar.cc/150?img=11'
  const displayName = user?.fullName || 'Nguyễn Văn An'
  const displayEmail = user?.email || 'staff@pbms.vn'
  const displayRole = user?.role?.roleName || 'Nhân viên'

  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* Left – page title + date */}
      <div>
        <h1 className="text-xl font-bold text-gray-800 leading-tight">{pageTitle}</h1>
        <p className="text-xs text-gray-400 font-medium mt-0.5 uppercase tracking-wide">
          {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} &nbsp;·&nbsp; {timeStr}
        </p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">

        {/* Gate selector */}
        <div className="flex bg-gray-100 rounded-full p-1 text-sm font-semibold">
          {['A', 'B'].map((gate) => (
            <button
              key={gate}
              onClick={() => setActiveGate(gate)}
              className={`px-4 py-1.5 rounded-full transition-all ${
                activeGate === gate
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {gate === 'A' ? 'CỔNG VÀO A' : 'CỔNG RA B'}
            </button>
          ))}
        </div>

        {/* Online badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
          isOnline ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
        </div>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotif(v => !v); setShowProfile(false) }}
            className={`relative p-2.5 rounded-full border transition-all ${
              showNotif ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white px-0.5">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                </div>
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline font-semibold">
                  Đánh dấu đã đọc
                </button>
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell size={28} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Không có thông báo nào</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 group transition-colors ${
                        n.read ? 'hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-50'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">{NOTIF_ICON[n.type]}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${n.read ? 'text-gray-600' : 'text-gray-800 font-semibold'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                      <button
                        onClick={() => dismissNotif(n.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-gray-500 mt-0.5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <button className="w-full text-center text-xs font-semibold text-blue-600 hover:underline flex items-center justify-center gap-1">
                  Xem tất cả lịch sử <ExternalLink size={11} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200" />

        {/* Profile dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotif(false) }}
            className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200"
          >
            <img
              src={avatarSrc}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <span className="font-bold text-sm text-gray-800 hidden sm:block">{displayName}</span>
            <ChevronDown
              size={15}
              className={`text-gray-400 transition-transform hidden sm:block ${showProfile ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Profile dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              {/* User info */}
              <div className="px-4 py-4 bg-gradient-to-br from-blue-600 to-blue-700">
                <div className="flex items-center gap-3">
                  <img src={avatarSrc} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-white/50" />
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">{displayName}</p>
                    <p className="text-blue-200 text-xs truncate">{displayEmail}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {displayRole}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                <button
                  onClick={() => { setShowProfile(false); navigate('/staff/profile') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <User size={15} className="text-blue-600" />
                  </div>
                  <span className="font-medium">Xem hồ sơ cá nhân</span>
                </button>

                <button
                  onClick={() => { setShowProfile(false); navigate('/staff/settings') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Settings size={15} className="text-purple-600" />
                  </div>
                  <span className="font-medium">Cài đặt tài khoản</span>
                </button>

                <button
                  onClick={() => { setShowProfile(false); navigate('/staff/security') }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <Shield size={15} className="text-green-600" />
                  </div>
                  <span className="font-medium">Bảo mật & Mật khẩu</span>
                </button>
              </div>

              {/* Divider + session info */}
              <div className="mx-4 border-t border-gray-100 py-2">
                <div className="flex items-center justify-between text-xs text-gray-400 py-1">
                  <span>Ca trực</span>
                  <span className="font-semibold text-gray-600">Ca Ngày · 07:00 – 19:00</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 py-1">
                  <span>Cổng phụ trách</span>
                  <span className="font-semibold text-gray-600">Gate {activeGate}</span>
                </div>
              </div>

              {/* Logout */}
              <div className="px-2 pb-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                    <LogOut size={15} className="text-red-600" />
                  </div>
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default StaffNavbar
