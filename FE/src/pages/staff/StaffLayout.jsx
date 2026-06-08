import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import StaffNavbar from './StaffNavbar';
import { useAuth } from '../../contexts/AuthContext';

const StaffLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = user?.fullName || 'Nguyễn Văn An';
  const displayRole = user?.role?.roleName || 'Nhân viên';

  const mainMenu = [
    { name: 'Bảng điều khiển', path: '/staff/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Nhận xe vãng lai', path: '/staff/checkin-walkin', icon: <CarFront size={20} /> },
    { name: 'Nhận xe đặt trước', path: '/staff/checkin-booking', icon: <CalendarCheck size={20} /> },
    { name: 'Thanh toán & Trả xe', path: '/staff/checkout', icon: <LogOut size={20} /> }
  ]

  const manageMenu = [
    { name: 'Báo cáo sự cố', path: '/staff/create-incident', icon: <AlertCircle size={20} /> },
    { name: 'Xem sơ đồ chỗ', path: '/staff/parking-map', icon: <Map size={20} /> },
    { name: 'Tra cứu phiên', path: '/staff/search-session', icon: <Search size={20} /> }
  ]

  const isActive = (path) => {
    if (path === '/staff/dashboard') {
      return location.pathname === '/staff' || location.pathname === '/staff/dashboard';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleNavigate = () => {
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
  };

  return (
    <div className="flex h-screen bg-[#f7f9fb] text-gray-900 font-sans">
      {/* Overlay khi mở sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo & Close button */}
        <div className="p-6 flex items-center justify-between border-b border-gray-100 mb-2">
          <Link to="/staff/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
              <Car size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">PBMS</p>
              <p className="text-[11px] text-gray-400">Staff Portal</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav - CHÍNH */}
        <div className="px-4 flex-1 overflow-y-auto">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">Chính</p>
          <nav className="space-y-1">
            {mainMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavigate}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Nav - QUẢN LÝ */}
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3 mt-8">Quản lý</p>
          <nav className="space-y-1">
            {manageMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavigate}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-100">
          <div className="rounded-2xl border border-gray-100 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
                {displayName.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500 truncate">{displayRole}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar with hamburger */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
          >
            <Menu size={20} />
          </button>

          {/* Logo in top bar */}
          <Link to="/staff/dashboard" className="flex items-center gap-3 mr-4 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
              <Car size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">PBMS</p>
              <p className="text-[11px] text-gray-400">Staff Portal</p>
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
        <footer className="bg-white border-t border-gray-200 py-3 px-6 flex items-center justify-between text-xs text-gray-500 z-10">
          <div className="flex items-center gap-6">
            <span>Hệ thống: Trực tuyến</span>
            <span>v2.4.12-pro</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Đồng bộ ổn định
            </span>
            <Link to="/staff/support" className="text-blue-600 hover:underline flex items-center gap-1">
              <HelpCircle size={14} /> Trợ giúp
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default StaffLayout
