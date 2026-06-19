import React, { useState, useEffect } from 'react'
import { Menu, Search, Bell, Moon, Sun, Clock, CalendarDays, Wallet, AlertTriangle, CheckCheck, Info } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAppTheme } from '../../contexts/AppThemeContext'
import { toast } from 'react-toastify'
import driverApi from '../../apis/driverApi'

const getInitials = (name) => {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const Navbar = ({ toggleSidebar, title = 'Dashboard', profileLink = '/profile' }) => {
  const { user } = useAuth()
  const { theme, toggleTheme } = useAppTheme()
  const navigate = useNavigate()
  const userName = user?.fullName || user?.name || 'Người dùng'
  const isDriver = user?.roleName?.toLowerCase() === 'driver' || user?.RoleName?.toLowerCase() === 'driver'

  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (isDriver) {
      driverApi.getUnreadCount()
        .then(res => {
          const count = res?.unreadCount ?? res?.count ?? (typeof res === 'number' ? res : 0)
          setUnreadCount(count)
        })
        .catch(() => {})

      driverApi.getNotifications({ limit: 5 })
        .then(res => {
          if (res.success && res.data) {
            setNotifications(res.data.slice(0, 5))
          }
        })
        .catch(() => {})
    } else {
      // Mock notifications cho Manager/Staff để xem giao diện đẹp
      setNotifications([
        { NotificationID: 1, Title: 'Báo cáo doanh thu', Message: 'Doanh thu tuần này đạt 50tr VNĐ, vượt chỉ tiêu 15%', CreatedAt: new Date().toISOString(), IsRead: false, NotificationType: 'system' },
        { NotificationID: 2, Title: 'Bảo trì hệ thống', Message: 'Sẽ có đợt bảo trì server lúc 00:00 đêm nay.', CreatedAt: new Date(Date.now() - 3600000).toISOString(), IsRead: true, NotificationType: 'incident' }
      ])
      setUnreadCount(1)
    }
  }, [user, isDriver])

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      toast.info('Tính năng Tìm kiếm toàn cục đang được phát triển')
    }
  }

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
  }

  const handleMarkAllRead = () => {
    if (isDriver) {
      driverApi.markAllNotificationsRead().catch(() => {})
    }
    setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })))
    setUnreadCount(0)
    toast.success('Đã đánh dấu tất cả đã đọc')
  }

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(String(dateStr).endsWith('Z') ? String(dateStr).slice(0, -1) : dateStr)
    const diffMs = new Date().getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMs / 3600000)
    if (diffMin < 1) return 'Vừa xong'
    if (diffMin < 60) return `${diffMin} phút trước`
    if (diffHour < 24) return `${diffHour} giờ trước`
    return date.toLocaleDateString('vi-VN')
  }

  const getIcon = (type) => {
    switch (type) {
    case 'booking': return <CalendarDays size={16} className="text-blue-500" />
    case 'session': return <Clock size={16} className="text-indigo-500" />
    case 'payment': return <Wallet size={16} className="text-emerald-500" />
    case 'incident': return <AlertTriangle size={16} className="text-rose-500" />
    default: return <Info size={16} className="text-gray-500" />
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-gray-600 dark:text-gray-300 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            onKeyDown={handleSearch}
            className="h-10 w-64 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-10 pr-4 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative rounded-full p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"
          title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={handleNotificationClick}
            className="relative rounded-full p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-900">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown menu */}
          {showNotifications && (
            <>
              {/* Overlay (click outside to close) */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />

              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-gray-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-2 shadow-xl shadow-slate-900/10 dark:shadow-slate-900/30 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between px-4 py-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Thông báo</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>

                <div className="max-h-[360px] overflow-y-auto rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <Bell className="text-slate-400" size={24} />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Không có thông báo mới</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {notifications.map(notif => (
                        <div
                          key={notif.NotificationID}
                          className={`group flex items-start gap-3 p-4 transition hover:bg-white dark:hover:bg-slate-800 cursor-pointer ${notif.IsRead ? 'opacity-70' : 'bg-blue-50/30 dark:bg-blue-900/10'}`}
                          onClick={() => {
                            setShowNotifications(false)
                            if (isDriver) navigate('/driver/notifications')
                          }}
                        >
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${notif.IsRead ? 'bg-slate-100 dark:bg-slate-700' : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700'}`}>
                            {getIcon(notif.NotificationType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-1">
                              <p className={`text-sm truncate ${notif.IsRead ? 'font-medium text-slate-600 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'}`}>
                                {notif.Title}
                              </p>
                              {!notif.IsRead && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500 mt-1.5" />}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {notif.Message}
                            </p>
                            <p className="mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {formatRelativeTime(notif.CreatedAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isDriver && (
                  <div className="mt-2 text-center">
                    <button
                      onClick={() => {
                        setShowNotifications(false)
                        navigate('/driver/notifications')
                      }}
                      className="inline-block w-full rounded-xl p-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200 transition"
                    >
                      Xem tất cả thông báo
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

        {/* User Profile */}
        <Link to={profileLink} className="flex items-center gap-3 ml-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-sm font-bold text-blue-600 dark:text-blue-400 ring-2 ring-white dark:ring-gray-800 transition group-hover:ring-blue-100 dark:group-hover:ring-blue-900">
            {getInitials(userName)}
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 transition group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {userName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {user?.roleName || user?.RoleName || 'Tài khoản'}
            </span>
          </div>
        </Link>
      </div>
    </header>
  )
}

export default Navbar
