// src/pages/DriverDashboard.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Home, CalendarDays, LogOut } from 'lucide-react'

const DriverDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#fbf9f1] p-4 flex items-start justify-center">
      <div className="w-full max-w-xl mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">
            Driver Dashboard
          </h1>

          <p className="text-gray-700 mb-2">
            Xin chào: <span className="font-semibold">{user?.fullName || 'Driver'}</span>
          </p>

          <p className="text-gray-700 mb-6">
            Role: <span className="font-semibold">{user?.roleName}</span>
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-blue-200"
            >
              <Home size={16} />
              Về Home
            </button>

            <button
              onClick={() => navigate('/booking')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors"
            >
              <CalendarDays size={16} />
              Booking
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-red-200"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverDashboard