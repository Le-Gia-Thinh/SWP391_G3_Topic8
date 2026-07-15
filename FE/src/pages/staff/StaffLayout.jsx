/**
 * FILE: StaffLayout.jsx
 * MÔ TẢ: Layout chính cho Staff.
 * Bao gồm thanh điều hướng bên trái (Sidebar) và thanh công cụ phía trên.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  CarFront,
  CalendarCheck,
  AlertCircle,
  Map,
  Search,
  LogOut,
  HelpCircle,
  Menu,
  X,
  Car
} from 'lucide-react'
import StaffNavbar from './StaffNavbar'
import { useAuth } from '../../contexts/AuthContext'

const StaffLayout = () => {
  const { t } = useTranslation()

  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const displayName = user?.fullName || 'Nguyễn Văn An'
  const displayRole = user?.role?.roleName || t('staff.layout.defaultRole') /* TRANSLATED: Nhân viên */

  const mainMenu = [
    { name: t('staff.layout.mainMenu.dashboard') /* TRANSLATED: Bảng điều khiển */, path: '/staff/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: t('staff.layout.mainMenu.checkinWalkin') /* TRANSLATED: Nhận xe vãng lai */, path: '/staff/checkin-walkin', icon: <CarFront size={20} /> },
    { name: t('staff.layout.mainMenu.checkinBooking') /* TRANSLATED: Nhận xe đặt trước */, path: '/staff/checkin-booking', icon: <CalendarCheck size={20} /> },
    { name: t('staff.layout.mainMenu.checkout') /* TRANSLATED: Thanh toán & Trả xe */, path: '/staff/checkout', icon: <LogOut size={20} /> }
  ]

  const manageMenu = [
    { name: t('staff.layout.manageMenu.reportIncident') /* TRANSLATED: Báo cáo sự cố */, path: '/staff/create-incident', icon: <AlertCircle size={20} /> },
    { name: t('staff.layout.manageMenu.parkingMap') /* TRANSLATED: Xem sơ đồ chỗ */, path: '/staff/parking-map', icon: <Map size={20} /> },
    { name: t('staff.layout.manageMenu.searchSession') /* TRANSLATED: Tra cứu phiên */, path: '/staff/search-session', icon: <Search size={20} /> }
  ]

  const isActive = (path) => {
    if (path === '/staff/dashboard') {
      return location.pathname === '/staff' || location.pathname === '/staff/dashboard'
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const handleNavigate = () => {
    setSidebarOpen(false)
  }

  const handleLogout = async () => {
    setSidebarOpen(false)
    await logout()
  }

  return (
    <div className="flex h-screen bg-[#fbf9f1] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Overlay khi mở sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo & Close button */}
        <div className="p-6 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 mb-2">
          <Link to="/staff/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
            <div className="relative flex shrink-0 items-center justify-center transition-all duration-300 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 border border-blue-400/20 ring-2 ring-white/20 h-11 w-11 group-hover:scale-105 group-hover:shadow-blue-500/50">
              <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm" />
              <svg viewBox="0 0 24 24" fill="none" className="drop-shadow-md z-10 relative transition-all duration-300 w-6 h-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19.5v-15h5a4.5 4.5 0 0 1 0 9H9" />
                <path d="M14 4.5A4.5 4.5 0 0 1 18.5 9" className="stroke-cyan-300 opacity-70" />
                <circle cx="18" cy="18" r="2.5" className="fill-green-400 stroke-white dark:stroke-slate-800" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-baseline leading-none">
                <span className="text-[22px] font-black tracking-tighter text-slate-800 dark:text-white">Smart</span>
                <span className="text-[22px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Park</span>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 ml-1 mb-1 animate-pulse" />
              </div>
              <span className="flex items-center gap-2 text-[9px] mt-1 font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                Staff Portal
                <span className="w-8 h-[2px] bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-600 rounded-full"></span>
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-3xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav - CHÍNH */}
        <div className="px-5 flex-1 overflow-y-auto py-2 custom-scrollbar">
          <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2">{t('staff.layout.main')}</p>
          <nav className="space-y-1.5">
            {mainMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavigate}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-3xl text-[14px] font-bold transition-all group relative overflow-hidden ${isActive(item.path)
                  ? 'text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {isActive(item.path) && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-md shadow-[0_0_10px_rgba(37,99,235,0.5)]" />}
                <div className={`transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </div>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Nav - QUẢN LÝ */}
          <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 px-2 mt-8">{t('staff.layout.management')}</p>
          <nav className="space-y-1.5">
            {manageMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavigate}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-3xl text-[14px] font-bold transition-all group relative overflow-hidden ${isActive(item.path)
                  ? 'text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {isActive(item.path) && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-500 rounded-r-md shadow-[0_0_10px_rgba(37,99,235,0.5)]" />}
                <div className={`transition-transform duration-300 ${isActive(item.path) ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </div>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-5 border-t border-slate-200/60 dark:border-slate-700/60">
          <div className="rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50 p-4 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 text-white font-black text-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                {displayName.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate leading-tight">{displayName}</p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">{displayRole}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-[13px] font-bold text-red-600 dark:text-red-400 transition-all hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-300 group"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> {t('staff.layout.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar with hamburger */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl px-6 py-3 md:py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-slate-900/50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <Menu size={20} />
          </button>

          {/* Logo in top bar */}
          <Link to="/staff/dashboard" className="flex items-center gap-3 mr-4 hover:opacity-80 transition-opacity md:hidden group">
            <div className="relative flex shrink-0 items-center justify-center transition-all duration-300 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 border border-blue-400/20 ring-2 ring-white/20 h-9 w-9 group-hover:scale-105">
              <svg viewBox="0 0 24 24" fill="none" className="drop-shadow-md z-10 relative w-5 h-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19.5v-15h5a4.5 4.5 0 0 1 0 9H9" />
                <path d="M14 4.5A4.5 4.5 0 0 1 18.5 9" className="stroke-cyan-300 opacity-70" />
                <circle cx="18" cy="18" r="2.5" className="fill-green-400 stroke-white dark:stroke-slate-800" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <span className="text-[18px] leading-none font-black tracking-tighter text-slate-800 dark:text-white flex items-baseline">
                Smart<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Park</span>
              </span>
            </div>
          </Link>

          <div className="flex-1">
            <StaffNavbar />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 pb-20">
          <Outlet />
        </div>

        {/* Footer Bar */}
        <footer className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/60 py-3.5 px-6 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 z-10 shadow-[0_-8px_30px_rgb(0,0,0,0.02)] dark:shadow-none">
          <div className="flex items-center gap-6">
            <span>{t('staff.layout.systemOnline')}</span>
            <span className="hidden sm:inline">v2.4.12-pro</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></span>
              {t('staff.layout.syncStable')}
            </span>
            <Link to="/staff/support" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors flex items-center gap-1.5 font-bold">
              <HelpCircle size={14} /> {t('staff.layout.help')}
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default StaffLayout
