import React from 'react'
import { Menu, Search, Bell, Moon, Sun } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAppTheme } from '../../contexts/AppThemeContext'
import { toast } from 'react-toastify'

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

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      toast.info('Tính năng Tìm kiếm toàn cục đang được phát triển')
    }
  }

  const handleNotification = () => {
    if (user?.roleName?.toLowerCase() === 'driver' || user?.RoleName?.toLowerCase() === 'driver') {
      navigate('/driver/notifications')
    } else {
      toast.info('Bạn hiện không có thông báo mới nào')
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
        <button
          onClick={handleNotification}
          className="relative rounded-full p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-900 bg-red-500"></span>
        </button>

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
