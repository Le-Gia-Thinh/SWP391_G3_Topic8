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

const Sidebar = ({ links, isOpen, setIsOpen, onHoverEnter, onHoverLeave, roleName }) => {
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
        onMouseEnter={() => onHoverEnter?.()}
        onMouseLeave={() => onHoverLeave?.()}
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-slate-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out overflow-hidden lg:static lg:translate-x-0 ${isOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:w-20'
        }`}
      >
        <div className={`flex h-20 items-center border-b border-slate-100 dark:border-gray-800 ${isOpen ? 'justify-between px-6' : 'lg:justify-center px-6 lg:px-0'}`}>
          <Link to={links[0]?.path || '/'} onClick={() => setIsOpen(false)} className={`flex items-center hover:opacity-80 transition-opacity whitespace-nowrap overflow-hidden ${isOpen ? 'gap-3' : 'lg:gap-0'}`}>
            <div className={`flex shrink-0 items-center justify-center transition-all duration-300 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 border border-blue-400/20 ring-2 ring-white/20 ${isOpen ? 'h-11 w-11' : 'h-10 w-10'}`}>
              <svg viewBox="0 0 24 24" fill="none" className={`drop-shadow-md z-10 relative transition-all duration-300 ${isOpen ? 'w-6 h-6' : 'w-5 h-5'}`} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19.5v-15h5a4.5 4.5 0 0 1 0 9H9" />
                <path d="M14 4.5A4.5 4.5 0 0 1 18.5 9" className="stroke-cyan-300 opacity-70" />
                <circle cx="18" cy="18" r="2.5" className="fill-green-400 stroke-white dark:stroke-slate-800" strokeWidth="1.5" />
              </svg>
            </div>
            <div className={`transition-all duration-300 ${isOpen ? 'opacity-100 w-48 ml-1' : 'lg:opacity-0 lg:w-0'}`}>
              <div className="flex items-baseline leading-none">
                <span className="text-[22px] font-black tracking-tighter text-slate-800 dark:text-white">Smart</span>
                <span className="text-[22px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Park</span>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 ml-1 mb-1 animate-pulse" />
              </div>
              {roleName && (
                <span className="flex items-center gap-2 text-[9px] mt-1 font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  {roleName} Portal
                  <span className="w-8 h-[2px] bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-600 rounded-full"></span>
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
                  className={`group flex items-center justify-between rounded-xl py-3 transition-all duration-200 ease-out whitespace-nowrap ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-500 hover:bg-blue-600 hover:text-white hover:shadow-md hover:shadow-blue-500/20 dark:text-gray-400'
                  } ${isOpen ? 'px-3' : 'lg:justify-center lg:px-0 px-3'}`}
                >
                  <div className={`flex items-center ${isOpen ? 'gap-3' : 'lg:gap-0'}`}>
                    <div className="flex w-5 h-5 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-110">
                      <Icon
                        size={20}
                        className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}
                      />
                    </div>
                    <span className={`font-semibold transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 ml-3 w-32' : 'lg:opacity-0 lg:w-0'}`}>
                      {linkLabel}
                    </span>
                  </div>
                  {link.badge && (
                    <span
                      className={`rounded-full py-0.5 text-xs font-bold transition-all duration-300 overflow-hidden ${isActive ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600 border border-red-100 group-hover:bg-white/20 group-hover:text-white group-hover:border-transparent'
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