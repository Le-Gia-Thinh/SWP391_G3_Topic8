import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Sidebar = ({ links, isOpen, setIsOpen, roleName }) => {
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
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out overflow-hidden lg:static lg:translate-x-0 ${
          isOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:w-20'
        }`}
      >
        <div className={`flex h-20 items-center border-b border-gray-100 ${isOpen ? 'justify-between px-6' : 'lg:justify-center px-6 lg:px-0'}`}>
          <Link to={links[0]?.path || '/'} onClick={() => setIsOpen(false)} className={`flex items-center hover:opacity-80 transition-opacity whitespace-nowrap overflow-hidden ${isOpen ? 'gap-3' : 'lg:gap-0'}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-lg shadow-blue-200">
              P
            </div>
            <div className={`transition-all duration-300 ${isOpen ? 'opacity-100 w-48' : 'lg:opacity-0 lg:w-0'}`}>
              <span className="text-xl font-black tracking-tight text-gray-900">
                Smart<span className="text-blue-600">Park</span>
              </span>
              {roleName && (
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
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
                return <div key={`div-${index}`} className="my-4 border-t border-gray-100" />
              }

              if (link.labelOnly) {
                return (
                  <h3 key={`lbl-${index}`} className={`px-3 text-xs font-bold uppercase tracking-wider text-gray-400 transition-all duration-300 whitespace-nowrap overflow-hidden ${isOpen ? 'mb-2 opacity-100 h-auto' : 'lg:opacity-0 lg:h-0 m-0'}`}>
                    {link.labelOnly}
                  </h3>
                )
              }

              const Icon = link.icon
              const isActive = location.pathname === link.path

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  title={!isOpen ? link.label : ''}
                  className={`group flex items-center justify-between rounded-xl py-3 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  } ${isOpen ? 'px-3' : 'lg:justify-center lg:px-0 px-3'}`}
                >
                  <div className={`flex items-center ${isOpen ? 'gap-3' : 'lg:gap-0'}`}>
                    <div className="flex w-5 h-5 shrink-0 items-center justify-center transition-transform">
                      <Icon
                        size={20}
                        className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}
                      />
                    </div>
                    <span className={`font-semibold transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 ml-3 w-32' : 'lg:opacity-0 lg:w-0'}`}>
                      {link.label}
                    </span>
                  </div>
                  {link.badge && (
                    <span
                      className={`rounded-full py-0.5 text-xs font-bold transition-all duration-300 overflow-hidden ${
                        isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
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

        <div className="border-t border-gray-100 p-4">
          <button
            onClick={handleLogout}
            title={!isOpen ? 'Đăng xuất' : ''}
            className={`flex items-center rounded-xl py-3 font-semibold text-red-600 transition-colors hover:bg-red-50 whitespace-nowrap ${isOpen ? 'w-full gap-3 px-3' : 'lg:justify-center w-full px-3 lg:px-0'}`}
          >
            <div className="flex w-5 h-5 shrink-0 items-center justify-center">
              <LogOut size={20} />
            </div>
            <span className={`transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 ml-3 w-32 text-left' : 'lg:opacity-0 lg:w-0'}`}>
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
