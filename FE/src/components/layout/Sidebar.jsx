/**
 * FILE: Sidebar.jsx
 * MÔ TẢ: Component Sidebar (Thanh bên) nằm bên trái màn hình trong DashboardLayout.
 * Render danh sách menu chức năng dựa theo quyền của người dùng (Admin/Manager/Staff/Driver).
 * Có hỗ trợ thu gọn (collapse) trên Desktop và trượt ra (drawer) trên Mobile.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Sidebar = ({ links, isOpen, setIsOpen, roleName }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-slate-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out overflow-hidden lg:static lg:translate-x-0 ${isOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:w-20'
        }`}
      >
        <div className={`flex h-20 items-center border-b border-slate-100 dark:border-gray-800 ${isOpen ? 'justify-between px-6' : 'lg:justify-center px-6 lg:px-0'}`}>
          <Link to={links[0]?.path || '/'} onClick={() => setIsOpen(false)} className={`flex items-center hover:opacity-80 transition-opacity whitespace-nowrap overflow-hidden ${isOpen ? 'gap-3' : 'lg:gap-0'}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white shadow-lg shadow-blue-500/30 border border-blue-400/20">
              P
            </div>
            <div className={`transition-all duration-300 ${isOpen ? 'opacity-100 w-48' : 'lg:opacity-0 lg:w-0'}`}>
              <span className="text-xl font-black tracking-tight text-slate-800 dark:text-white">
                Smart<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:text-blue-500">Park</span>
              </span>
              {roleName && (
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {roleName} Portal
                </span>
              )}
            </div>
          </Link>
          <button
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-4">
          <nav className="space-y-1">
            {links.map((link, index) => {
              if (link.isDivider) {
                return <div key={`div-${index}`} className="my-4 border-t border-slate-100 dark:border-gray-800" />
              }

              if (link.labelOnly || link.labelOnlyKey) {
                return (
                  <h3 key={`lbl-${index}`} className={`px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 transition-all duration-300 whitespace-nowrap overflow-hidden ${isOpen ? 'mb-2 opacity-100 h-auto' : 'lg:opacity-0 lg:h-0 m-0'}`}>
                    {link.labelOnlyKey ? t(link.labelOnlyKey) : link.labelOnly}
                  </h3>
                )
              }

              const Icon = link.icon
              const isActive = location.pathname === link.path
              const linkLabel = link.labelKey ? t(link.labelKey) : link.label

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  title={!isOpen ? linkLabel : ''}
                  className={`group flex items-center justify-between rounded-xl py-3 transition-all whitespace-nowrap ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  } ${isOpen ? 'px-3' : 'lg:justify-center lg:px-0 px-3'}`}
                >
                  <div className={`flex items-center ${isOpen ? 'gap-3' : 'lg:gap-0'}`}>
                    <div className="flex w-5 h-5 shrink-0 items-center justify-center transition-transform">
                      <Icon
                        size={20}
                        className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}
                      />
                    </div>
                    <span className={`font-semibold transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 ml-3 w-32' : 'lg:opacity-0 lg:w-0'}`}>
                      {linkLabel}
                    </span>
                  </div>
                  {link.badge && (
                    <span
                      className={`rounded-full py-0.5 text-xs font-bold transition-all duration-300 overflow-hidden ${isActive ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600 border border-red-100'
                      } ${isOpen ? 'opacity-100 px-2' : 'lg:opacity-0 lg:w-0'}`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 dark:border-gray-800 p-4">
          <button
            onClick={handleLogout}
            title={!isOpen ? t('sidebar.logout') : ''}
            className={`flex items-center rounded-xl py-3 font-semibold text-red-600 transition-colors hover:bg-red-50 whitespace-nowrap ${isOpen ? 'w-full gap-3 px-3' : 'lg:justify-center w-full px-3 lg:px-0'}`}
          >
            <div className="flex w-5 h-5 shrink-0 items-center justify-center">
              <LogOut size={20} />
            </div>
            <span className={`transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 ml-3 w-32 text-left' : 'lg:opacity-0 lg:w-0'}`}>
              {t('sidebar.logout')}
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar