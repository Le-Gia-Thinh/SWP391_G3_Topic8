import React, { useState } from 'react'
import { Shield, Lock, Eye, EyeOff, Smartphone, Key, AlertTriangle, CheckCircle2, LogOut, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const StaffSecurity = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [twoFA, setTwoFA] = useState(false)
  const [saved, setSaved] = useState(false)

  const strength = newPw.length === 0 ? 0 : newPw.length < 6 ? 1 : newPw.length < 10 ? 2 : 3
  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Mạnh']
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-500']
  const strengthText = ['', 'text-red-500', 'text-yellow-600', 'text-green-600']

  const handleChangePassword = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setOldPw(''); setNewPw(''); setConfirmPw('')
  }

  const handleLogoutAll = async () => {
    await logout()
    navigate('/login')
  }

  const loginHistory = [
    { device: 'Máy tính Gate A', location: 'TP. Hồ Chí Minh, VN', time: 'Hôm nay, 07:02', current: true },
    { device: 'Điện thoại (Android)', location: 'TP. Hồ Chí Minh, VN', time: 'Hôm qua, 22:15', current: false },
    { device: 'Chrome trên macOS', location: 'Hà Nội, VN', time: '05/06/2026, 08:40', current: false }
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield size={24} className="text-green-600" /> Bảo mật & Mật khẩu
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý mật khẩu và bảo mật tài khoản của bạn</p>
        </div>
      </header>

      <div className="flex gap-6 flex-1 min-h-0 overflow-auto">
        {/* Left */}
        <div className="flex-1 space-y-5">

          {/* Security score */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold opacity-80 mb-1">Điểm bảo mật tài khoản</p>
                <p className="text-4xl font-black">72 / 100</p>
                <p className="text-sm opacity-70 mt-1">Mức độ: Tốt — cần bật xác thực 2 lớp</p>
              </div>
              <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center">
                <Shield size={36} className="text-white" />
              </div>
            </div>
            <div className="mt-4 w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '72%' }} />
            </div>
          </div>

          {/* Change password */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Lock size={18} className="text-blue-500" /> Đổi mật khẩu
            </h3>
            <p className="text-xs text-gray-400 mb-5">Mật khẩu nên dài ít nhất 8 ký tự và có ký tự đặc biệt</p>

            {saved && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-sm font-semibold text-green-700">
                <CheckCircle2 size={18} /> Đổi mật khẩu thành công!
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                { label: 'Mật khẩu hiện tại', val: oldPw, setVal: setOldPw, show: showOld, setShow: setShowOld },
                { label: 'Mật khẩu mới', val: newPw, setVal: setNewPw, show: showNew, setShow: setShowNew },
                { label: 'Xác nhận mật khẩu mới', val: confirmPw, setVal: setConfirmPw, show: showConfirm, setShow: setShowConfirm }
              ].map(({ label, val, setVal, show, setShow }) => (
                <div key={label}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      value={val}
                      onChange={e => setVal(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    />
                    <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Strength bar */}
              {newPw.length > 0 && (
                <div>
                  <div className="flex gap-1.5 mb-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${strength >= i ? strengthColor[strength] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${strengthText[strength]}`}>Độ mạnh: {strengthLabel[strength]}</p>
                </div>
              )}

              {confirmPw && newPw !== confirmPw && (
                <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                  <AlertTriangle size={13} /> Mật khẩu xác nhận không khớp
                </p>
              )}

              <button
                type="submit"
                disabled={!oldPw || !newPw || newPw !== confirmPw}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-100"
              >
                Cập nhật mật khẩu
              </button>
            </form>
          </div>
        </div>

        {/* Right */}
        <div className="w-80 flex flex-col gap-5">

          {/* Two-factor auth */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Smartphone size={18} className="text-purple-500" /> Xác thực 2 lớp (2FA)
            </h3>
            <p className="text-xs text-gray-400 mb-4">Thêm lớp bảo mật bằng OTP điện thoại</p>

            <div className={`flex items-center justify-between p-4 rounded-xl border-2 mb-4 ${twoFA ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                {twoFA ? <CheckCircle2 size={20} className="text-green-600" /> : <Shield size={20} className="text-gray-400" />}
                <div>
                  <p className={`text-sm font-bold ${twoFA ? 'text-green-800' : 'text-gray-600'}`}>
                    {twoFA ? 'Đang bật' : 'Chưa bật'}
                  </p>
                  <p className="text-xs text-gray-400">{twoFA ? 'Qua ứng dụng Authenticator' : 'Khuyến nghị bật ngay'}</p>
                </div>
              </div>
              <button
                onClick={() => setTwoFA(v => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors ${twoFA ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${twoFA ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Login history */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
              <Clock size={18} className="text-orange-500" /> Lịch sử đăng nhập
            </h3>
            <p className="text-xs text-gray-400 mb-4">Các thiết bị đã đăng nhập gần đây</p>

            <div className="space-y-3">
              {loginHistory.map((h, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${h.current ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800">{h.device}</p>
                    <p className="text-[11px] text-gray-400">{h.location}</p>
                    <p className="text-[11px] text-gray-400">{h.time}</p>
                  </div>
                  {h.current && (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Hiện tại</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
            <h3 className="text-sm font-bold text-red-800 mb-1 flex items-center gap-2">
              <AlertTriangle size={16} /> Vùng nguy hiểm
            </h3>
            <p className="text-xs text-red-600 mb-4">Các thao tác này không thể hoàn tác</p>
            <button
              onClick={handleLogoutAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors"
            >
              <LogOut size={15} /> Đăng xuất toàn bộ thiết bị
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffSecurity
