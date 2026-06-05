import React from 'react';
import { Bell, Search, Menu, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const StaffNavbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      {/* Left side */}
      <div className="flex items-center gap-6">
        <button className="p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors md:hidden">
          <Menu size={24} />
        </button>
        
        <div className="hidden md:flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
            P
          </div>
          <span className="text-xl font-bold text-blue-600 tracking-tight">PBMS</span>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md ml-2">STAFF</span>
        </div>
      </div>

      {/* Middle side (Search) */}
      <div className="flex-1 max-w-2xl mx-8 hidden md:block">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm font-medium"
            placeholder="Tra cứu biển số xe, mã phiên, hoặc tên khách hàng..."
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-gray-400 text-xs font-semibold border border-gray-200 rounded px-1.5 py-0.5 bg-white">Ctrl K</span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Gateway Selection (from dashboard image) */}
        <div className="hidden lg:flex bg-gray-50 rounded-lg p-1 border border-gray-200 shadow-sm text-sm font-medium">
          <button className="px-3 py-1.5 rounded-md bg-white text-blue-600 shadow-sm border border-gray-200">Cổng A</button>
          <button className="px-3 py-1.5 rounded-md text-gray-500 hover:text-gray-700 transition-colors">Cổng B</button>
        </div>

        {/* Notifications */}
        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Settings */}
        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors hidden sm:block">
          <Settings size={20} />
        </button>

        <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>

        {/* Profile Dropdown */}
        <div className="flex items-center gap-3 cursor-pointer p-1.5 pr-3 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
          <img
            className="h-9 w-9 rounded-full object-cover border border-gray-200 shadow-sm"
            src="https://i.pravatar.cc/150?img=11"
            alt="User avatar"
          />
          <div className="hidden sm:block text-left">
            <p className="text-sm font-bold text-gray-700 leading-tight">Nguyễn Văn An</p>
            <p className="text-xs text-gray-500 font-medium">Nhân viên Cổng 01</p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default StaffNavbar;
