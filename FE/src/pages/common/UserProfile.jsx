import React, { useState, useEffect } from 'react'
import {
  User, Mail, Phone, MapPin, Calendar, Edit3, Camera, Shield,
  CheckCircle2, ChevronRight, Settings, Bell, Monitor, Globe, Moon,
  Sun, Eye, EyeOff, Smartphone, Save, AlertTriangle, LogOut, Lock, Building, Car
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import authorizeAxios from '../../utils/authorizeAxios'
import { useNavigate } from 'react-router-dom'

const Toggle = ({ checked, onChange, label, desc }) => (
  <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
)

const PROFILE_TABS = [
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: User },
  { id: 'settings', label: 'Cài đặt hệ thống', icon: Settings },
  { id: 'security', label: 'Bảo mật tài khoản', icon: Shield }
]

const ProfileContent = ({ user, editing }) => {
  const isDriver = user?.roleName?.toLowerCase() === 'driver' || user?.RoleName?.toLowerCase() === 'driver'
  const isManager = user?.roleName?.toLowerCase() === 'manager' || user?.RoleName?.toLowerCase() === 'manager'
  const isStaff = user?.roleName?.toLowerCase() === 'staff' || user?.RoleName?.toLowerCase() === 'staff'

  const infoFields = [
    { icon: <User size={16} className="text-blue-500" />, label: 'Họ và tên', value: user?.fullName || user?.FullName || 'Chưa cập nhật' },
    { icon: <Mail size={16} className="text-purple-500" />, label: 'Email', value: user?.email || user?.Email || 'Chưa cập nhật' },
    { icon: <Phone size={16} className="text-green-500" />, label: 'Số điện thoại', value: user?.phone || user?.PhoneNumber || 'Chưa cập nhật' },
    { icon: <Shield size={16} className="text-indigo-500" />, label: 'Vai trò', value: user?.roleName || user?.RoleName || 'Thành viên' }
  ]

  if (isStaff) {
    infoFields.push({ icon: <MapPin size={16} className="text-red-500" />, label: 'Cổng phụ trách', value: 'Gate 01' })
  }
  if (isManager) {
    infoFields.push({ icon: <Building size={16} className="text-orange-500" />, label: 'Chi nhánh', value: 'SmartPark District 1' })
  }
  if (isDriver) {
    infoFields.push({ icon: <Car size={16} className="text-yellow-500" />, label: 'Giấy phép lái xe', value: user?.driverLicense || 'Chưa cập nhật' })
  }

  return (
    <div className="flex gap-6 flex-col lg:flex-row animate-in fade-in">
      <div className="w-full lg:w-72 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">
              {(user?.fullName || user?.FullName || 'U').charAt(0)}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-blue-700 transition-colors">
              <Camera size={14} />
            </button>
          </div>
          <p className="text-lg font-black text-gray-900">{user?.fullName || user?.FullName || 'Người dùng'}</p>
          <p className="text-sm text-gray-500">{user?.email || user?.Email}</p>
          <span className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 uppercase">
            {user?.roleName || user?.RoleName || 'Thành viên'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 mb-5">Thông tin cá nhân</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {infoFields.map(({ icon, label, value }) => (
              <div key={label} className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">{icon} {label}</label>
                {editing ? (
                  <input defaultValue={value} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                ) : (
                  <p className="text-sm font-semibold text-gray-800 px-3 py-2 bg-gray-50 rounded-lg">{value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const SettingsContent = ({ saved, handleSave }) => {
  const [settings, setSettings] = useState({
    darkMode: false, emailNotif: true, pushNotif: true, soundAlert: true, language: 'vi'
  })
  const set = (key) => (val) => setSettings(prev => ({ ...prev, [key]: val }))

  return (
    <div className="flex gap-6 flex-col lg:flex-row animate-in fade-in">
      <div className="flex-1 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2"><Monitor size={18} className="text-blue-500" /> Giao diện</h3>
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 mb-3 mt-4">Chủ đề màu sắc</p>
            <div className="flex gap-3">
              {[{ id: 'light', icon: <Sun size={18} />, label: 'Sáng' }, { id: 'dark', icon: <Moon size={18} />, label: 'Tối' }].map(({ id, icon, label }) => (
                <button key={id} onClick={() => set('darkMode')(id === 'dark')} className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${(id === 'dark' && settings.darkMode) || (id === 'light' && !settings.darkMode) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>
                  {icon}<span className="text-xs font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2"><Bell size={18} className="text-purple-500" /> Thông báo</h3>
          <Toggle label="Thông báo qua Email" checked={settings.emailNotif} onChange={set('emailNotif')} />
          <Toggle label="Thông báo đẩy (Push)" checked={settings.pushNotif} onChange={set('pushNotif')} />
          <Toggle label="Âm thanh cảnh báo" checked={settings.soundAlert} onChange={set('soundAlert')} />
        </div>
      </div>
      <div className="w-full lg:w-80 flex flex-col gap-5">
        <button onClick={handleSave} className={`w-full py-3 font-bold rounded-xl text-white ${saved ? 'bg-green-500' : 'bg-blue-600'}`}>
          {saved ? 'Đã lưu' : 'Lưu cài đặt'}
        </button>
      </div>
    </div>
  )
}

const SecurityContent = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [showOld, setShowOld] = useState(false); const [showNew, setShowNew] = useState(false)
  const [oldPw, setOldPw] = useState(''); const [newPw, setNewPw] = useState('')
  const [saved, setSaved] = useState(false)

  const handleChangePassword = (e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 3000); setOldPw(''); setNewPw('') }
  const handleLogoutAll = async () => { await logout(); navigate('/login') }

  return (
    <div className="flex gap-6 flex-col lg:flex-row animate-in fade-in">
      <div className="flex-1 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2"><Lock size={18} className="text-blue-500" /> Đổi mật khẩu</h3>
          {saved && <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-4 font-semibold text-sm"><CheckCircle2 size={18}/> Đổi mật khẩu thành công</div>}
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[{ label: 'Mật khẩu hiện tại', val: oldPw, setVal: setOldPw, show: showOld, setShow: setShowOld }, { label: 'Mật khẩu mới', val: newPw, setVal: setNewPw, show: showNew, setShow: setShowNew }].map(({ label, val, setVal, show, setShow }) => (
              <div key={label}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} value={val} onChange={e => setVal(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={!oldPw || !newPw} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl">Cập nhật</button>
          </form>
        </div>
      </div>
      <div className="w-full lg:w-80 flex flex-col gap-5">
        <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
          <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2"><AlertTriangle size={16} /> Vùng nguy hiểm</h3>
          <button onClick={handleLogoutAll} className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm">
            <LogOut size={15} /> Đăng xuất thiết bị khác
          </button>
        </div>
      </div>
    </div>
  )
}

const UserProfile = () => {
  const { user } = useAuth()
  const [profileData, setProfileData] = useState(user)
  const [activeTab, setActiveTab] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authorizeAxios.get('/auth/me')
        const currentUser = response.data?.data?.user || response.data?.data || response.data?.user || response.data
        if (currentUser) setProfileData(currentUser)
      } catch (error) {
        console.error('Get profile failed:', error)
        setProfileData(user)
      }
    }
    if (!profileData) fetchProfile()
  }, [user])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {activeTab === 'profile' && 'Hồ sơ cá nhân'}
            {activeTab === 'settings' && 'Cài đặt hệ thống'}
            {activeTab === 'security' && 'Bảo mật tài khoản'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản, cài đặt và tùy chọn bảo mật</p>
        </div>

        {activeTab === 'profile' && (
          <button
            onClick={() => {
              if (editing) { handleSave(); setEditing(false) }
              else setEditing(true)
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-sm transition-colors"
          >
            {editing ? <Save size={15} /> : <Edit3 size={15} />}
            {editing ? 'Lưu hồ sơ' : 'Chỉnh sửa'}
          </button>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            {PROFILE_TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all text-left ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {active && <ChevronRight size={16} className="ml-auto opacity-70" />}
                </button>
              )
            })}
          </nav>
        </aside>
        <main className="flex-1 min-h-[500px]">
          {activeTab === 'profile' && <ProfileContent user={profileData} editing={editing} />}
          {activeTab === 'settings' && <SettingsContent saved={saved} handleSave={handleSave} />}
          {activeTab === 'security' && <SecurityContent />}
        </main>
      </div>
    </div>
  )
}

export default UserProfile
