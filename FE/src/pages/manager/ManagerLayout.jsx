/**
 * FILE: ManagerLayout.jsx
 * MÔ TẢ: Layout chung cho giao diện Manager.
 * Chứa Sidebar điều hướng các chức năng quản lý, Header với thanh tìm kiếm và Menu thông báo/hồ sơ.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LayoutGrid, MapPin, Sliders, DollarSign, AlertCircle, FileText,
  LogOut, Bell, ChevronDown, Search, Calendar, Car, Menu, X
} from 'lucide-react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const NotificationPill = ({ type }) => {
  const classes = {
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    error: 'bg-red-50 text-red-600',
    info: 'bg-sky-50 text-sky-600'
  }
  return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${classes[type] || classes.info}`}>{type}</span>
}

const getInitials = (name) => {
  if (!name) return 'MG'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const ManagerLayout = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const LOCATIONS = [
    t('manager.layout.locations.d1'),
    t('manager.layout.locations.d3'),
    t('manager.layout.locations.d7'),
    t('manager.layout.locations.bt')
  ]

  const MENU_ITEMS = [
    { icon: LayoutGrid, label: t('manager.layout.menu.dashboard'), path: '/manager' },
    { icon: Sliders, label: t('manager.layout.menu.config'), path: '/manager/config' },
    { icon: MapPin, label: t('manager.layout.menu.positions'), path: '/manager/positions' },
    { icon: DollarSign, label: t('manager.layout.menu.pricing'), path: '/manager/pricing' },
    { icon: AlertCircle, label: t('manager.layout.menu.incidents'), path: '/manager/incidents' },
    { icon: FileText, label: t('manager.layout.menu.reports'), path: '/manager/reports' }
  ]

  const notificationsData = [
    { id: 1, title: t('manager.layout.notif.n1Title'), message: t('manager.layout.notif.n1Msg'), time: t('manager.layout.notif.n1Time'), type: 'warning', unread: true },
    { id: 2, title: t('manager.layout.notif.n2Title'), message: t('manager.layout.notif.n2Msg'), time: t('manager.layout.notif.n2Time'), type: 'error', unread: true },
    { id: 3, title: t('manager.layout.notif.n3Title'), message: t('manager.layout.notif.n3Msg'), time: t('manager.layout.notif.n3Time'), type: 'info', unread: false }
  ]

  const profileRef = useRef(null)
  const locationRef = useRef(null)
  const notificationRef = useRef(null)

  const [selectedLocation] = useState(LOCATIONS[0])
  const [setIsLocationOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState(notificationsData)

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications]
  )

  const displayName = user?.fullName || t('manager.layout.defaultManager')
  const displayEmail = user?.email || t('manager.layout.defaultEmail')
  const displayRole = user?.roleName === 'Manager' ? t('manager.layout.roleManager') : user?.roleName || t('manager.layout.roleDefault')
  const appName = t('manager.layout.appName')
  const appSubtitle = t('manager.layout.appSubtitle')

  const handleLogout = async () => {
    setIsProfileOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })))
  }

  const isActive = (path) => {
    if (path === '/manager') {
      return location.pathname === '/manager' || location.pathname === '/manager/dashboard'
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false)
      if (locationRef.current && !locationRef.current.contains(event.target)) setIsLocationOpen(false)
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setIsNotificationsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  })

  return (
    <div className="flex min-h-screen bg-[#f7f9fb] text-slate-900">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 flex-col border-r border-slate-100 bg-white px-4 py-6 shadow-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0 flex' : '-translate-x-full hidden'}`}>
        <div className="mb-10 flex items-center justify-between">
          <Link to="/manager" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-100 text-sky-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <Car size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{appName}</p>
              <p className="text-xs text-slate-500 font-medium">{appSubtitle}</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-3xl text-slate-400 hover:bg-slate-50">
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive(item.path) ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 shadow-lg' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto space-y-3 rounded-3xl border border-slate-50 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40">{getInitials(displayName)}</div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500 font-medium">{displayRole}</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100">
            <LogOut size={16} /> {t('manager.layout.logout')}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-100 bg-white px-4 lg:px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setSidebarOpen(true)}
                  className="flex items-center justify-center p-2 rounded-3xl text-slate-500 font-medium hover:bg-slate-50">
                  <Menu size={24} />
                </button>

                <Link to="/manager" className="flex items-center gap-3 hover:opacity-80 transition-opacity ml-2 mr-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <Car size={20} />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900">{appName}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{appSubtitle}</p>
                  </div>
                </Link>
                <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 font-bold hidden sm:block">
                  {selectedLocation}
                </div>
              </div>
              <div className="relative hidden md:block">
                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder={t('manager.layout.searchPlaceholder')}
                  className="w-72 rounded-3xl border border-slate-100 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 font-bold outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700 font-bold sm:block">
                <Calendar size={16} className="mr-2 inline" /> 24/05/2024
              </div>
              <div className="relative" ref={notificationRef}>
                <button type="button" onClick={() => setIsNotificationsOpen((prev) => !prev)}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-slate-100 bg-white text-slate-600 transition hover:bg-slate-50">
                  <Bell size={18} />
                  {unreadCount > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />}
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 z-50 mt-3 w-80 rounded-3xl border border-slate-100 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between pb-3">
                      <p className="text-sm font-semibold text-slate-900">{t('manager.layout.notificationsTitle')}</p>
                      <button type="button" onClick={handleMarkAllRead}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        {t('manager.layout.markAllRead')}
                      </button>
                    </div>
                    <div className="space-y-3">
                      {notifications.map((item) => (
                        <div key={item.id} className={`rounded-3xl border px-4 py-3 ${item.unread ? 'bg-slate-50 border-slate-200' : 'border-transparent'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{item.title}</p>
                              <p className="mt-1 text-sm text-slate-500 font-medium">{item.message}</p>
                            </div>
                            <NotificationPill type={item.type} />
                          </div>
                          <p className="mt-2 text-xs text-slate-400">{item.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={profileRef}>
                <button type="button" onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="inline-flex items-center gap-3 rounded-3xl border border-slate-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 font-bold transition hover:bg-slate-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40">{getInitials(displayName)}</div>
                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-slate-500 font-medium">{displayRole}</p>
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 z-50 mt-3 w-72 rounded-3xl border border-slate-100 bg-white p-4 shadow-xl">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{t('manager.layout.accountLabel')}</p>
                        <p className="mt-2 font-semibold text-slate-900">{displayName}</p>
                        <p className="text-xs text-slate-500 font-medium">{displayEmail}</p>
                      </div>
                      <Link to="/manager/profile" onClick={() => setIsProfileOpen(false)}
                        className="block rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 font-bold hover:bg-slate-100">
                        {t('manager.layout.profile')}
                      </Link>
                      <button type="button" onClick={handleLogout}
                        className="w-full rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100">
                        {t('manager.layout.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-325">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default ManagerLayout