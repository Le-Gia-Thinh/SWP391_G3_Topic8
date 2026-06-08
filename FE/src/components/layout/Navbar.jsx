import React from 'react'
import { Menu, Search, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

const getInitials = (name) => {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const Navbar = ({ toggleSidebar, title = 'Dashboard', profileLink = '/profile' }) => {
  const { user } = useAuth()
  const userName = user?.fullName || user?.name || 'Người dùng'

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      toast.info('Tính năng Tìm kiếm toàn cục đang được phát triển')
    }
  }

  const handleNotification = () => {
    toast.info('Bạn hiện không có thông báo mới nào')
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-blue-600"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 hidden sm:block">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            onKeyDown={handleSearch}
            className="h-10 w-64 rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Notifications */}
        <button 
          onClick={handleNotification}
          className="relative rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
        >
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500"></span>
        </button>

        <div className="h-8 w-px bg-gray-200"></div>

        {/* User Profile */}
        <Link to={profileLink} className="flex items-center gap-3 transition hover:opacity-80">
          <div className="hidden text-right md:block">
            <p className="text-sm font-bold text-gray-900">{userName}</p>
            <p className="text-xs font-semibold text-gray-500">{user?.roleName || 'Member'}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {getInitials(userName)}
          </div>
        </Link>
      </div>
    </header>
  )
}

export default Navbar
