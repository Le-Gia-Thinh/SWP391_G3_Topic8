import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CarFront,
  CalendarCheck,
  AlertCircle,
  Map,
  Search,
  LogOut,
  Bell,
  HelpCircle
} from 'lucide-react';
import StaffNavbar from './StaffNavbar';

const StaffLayout = () => {
  const location = useLocation();

  const mainMenu = [
    { name: 'Bảng điều khiển', path: '/staff/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Nhận xe vãng lai', path: '/staff/checkin-walkin', icon: <CarFront size={20} /> },
    { name: 'Nhận xe đặt trước', path: '/staff/checkin-booking', icon: <CalendarCheck size={20} /> },
    { name: 'Thanh toán & Trả xe', path: '/staff/checkout', icon: <LogOut size={20} /> },
  ];

  const manageMenu = [
    { name: 'Báo cáo sự cố', path: '/staff/create-incident', icon: <AlertCircle size={20} /> },
    { name: 'Xem sơ đồ chỗ', path: '/staff/parking-map', icon: <Map size={20} /> },
    { name: 'Tra cứu phiên', path: '/staff/search-session', icon: <Search size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
              P
            </div>
            <span className="text-xl font-bold text-blue-600">PBMS</span>
          </div>

          {/* Nav - CHÍNH */}
          <div className="px-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-4 px-2">Chính</p>
            <ul className="space-y-1">
              {mainMenu.map((item) => {
                const isActive = location.pathname.includes(item.path);
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Nav - QUẢN LÝ */}
          <div className="px-4 mt-8">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-4 px-2">Quản lý</p>
            <ul className="space-y-1">
              {manageMenu.map((item) => {
                const isActive = location.pathname.includes(item.path) && item.path !== '#';
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
            <img
              src="https://i.pravatar.cc/150?img=11"
              alt="User Avatar"
              className="w-10 h-10 rounded-full border border-gray-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">Nguyễn Văn An</p>
              <p className="text-xs text-gray-500 truncate">Nhân viên Cổng 01</p>
            </div>
            <LogOut size={18} className="text-gray-400 hover:text-red-500" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <StaffNavbar />
        <div className="flex-1 overflow-auto bg-gray-50 p-6 pb-20">
          <Outlet />
        </div>

        {/* Footer Bar */}
        <footer className="bg-white border-t border-gray-200 py-3 px-6 flex items-center justify-between text-xs text-gray-500 z-10">
          <div className="flex items-center gap-6">
            <span>Hệ thống: Trực tuyến (Vận hành bình thường)</span>
            <span>Phiên bản: v2.4.12-pro</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Đồng bộ cuối: 10:55:42 (10 giây trước)
            </span>
            <a href="#" className="text-blue-600 hover:underline flex items-center gap-1">
              <HelpCircle size={14} /> Trung tâm trợ giúp
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default StaffLayout;
