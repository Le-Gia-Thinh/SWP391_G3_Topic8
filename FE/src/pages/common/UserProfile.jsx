/**
 * FILE: UserProfile.jsx
 * MÔ TẢ: Trang Hồ Sơ Người Dùng (Profile) dùng chung cho mọi Role.
 * Hiển thị thông tin cá nhân, cài đặt hệ thống (ngôn ngữ, giao diện, thông báo)
 * và quản lý bảo mật (đổi mật khẩu). Driver có thêm lịch sử hoạt động và thanh toán.
 */

import React, { useState, useEffect } from 'react'
import {
  User, Mail, Phone, MapPin, Calendar, Edit3, Camera, Shield,
  CheckCircle2, ChevronRight, Settings, Bell, Monitor, Moon,
  Sun, Eye, EyeOff, Save, AlertTriangle, LogOut, Lock, Building, Car,
  Activity, CreditCard
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import authorizeAxios from '../../utils/authorizeAxios'
import driverApi from '../../apis/driverApi'
import { changePasswordAPI } from '../../apis/authApi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAppTheme } from '../../contexts/AppThemeContext'
import { useTranslation } from 'react-i18next'

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

const ProfileContent = ({ user, editing, formData, onChange, recentActivity, recentPayments }) => {
  const { t } = useTranslation()
  const isDriver = user?.roleName?.toLowerCase() === 'driver' || user?.RoleName?.toLowerCase() === 'driver'
  const isManager = user?.roleName?.toLowerCase() === 'manager' || user?.RoleName?.toLowerCase() === 'manager'
  const isStaff = user?.roleName?.toLowerCase() === 'staff' || user?.RoleName?.toLowerCase() === 'staff'

  const fmtDate = (d) => {
    if (!d) return '--/--/----'
    return new Date(d).toLocaleDateString('vi-VN')
  }

  const fmtTime = (d) => {
    if (!d) return '--:--'
    return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex gap-6 flex-col lg:flex-row animate-in fade-in">
      <div className="w-full lg:w-72 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">
              {(formData?.fullName || user?.fullName || user?.FullName || 'U').charAt(0)}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-white hover:bg-blue-700 transition-colors">
              <Camera size={14} />
            </button>
          </div>
          <p className="text-lg font-black text-gray-900">{formData?.fullName || user?.fullName || user?.FullName || t('navbar.defaultUser')}</p>
          <p className="text-sm text-gray-500">{user?.email || user?.Email}</p>
          <span className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 uppercase">
            {user?.roleName || user?.RoleName || t('userProfile.memberLabel')}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 mb-5">{t('userProfile.personalInfo')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5"><User size={16} className="text-blue-500" /> {t('userProfile.fullName')}</label>
              {editing ? <input value={formData?.fullName || ''} onChange={onChange('fullName')} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium" /> : <p className="text-sm font-semibold text-gray-800 px-3 py-2 bg-gray-50 rounded-lg">{formData?.fullName || t('userProfile.notUpdated')}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5"><Mail size={16} className="text-purple-500" /> {t('userProfile.email')}</label>
              <p className="text-sm font-semibold text-gray-800 px-3 py-2 bg-gray-50 rounded-lg">{user?.email || user?.Email || t('userProfile.notUpdated')}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5"><Phone size={16} className="text-green-500" /> {t('userProfile.phone')}</label>
              {editing ? <input value={formData?.phoneNumber || ''} onChange={onChange('phoneNumber')} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium" /> : <p className="text-sm font-semibold text-gray-800 px-3 py-2 bg-gray-50 rounded-lg">{formData?.phoneNumber || t('userProfile.notUpdated')}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5"><Calendar size={16} className="text-orange-500" /> {t('userProfile.dob')}</label>
              {editing ? <input type="date" value={formData?.dateOfBirth || ''} onChange={onChange('dateOfBirth')} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm font-medium" /> : <p className="text-sm font-semibold text-gray-800 px-3 py-2 bg-gray-50 rounded-lg">{formData?.dateOfBirth ? fmtDate(formData?.dateOfBirth) : t('userProfile.notUpdated')}</p>}
            </div>
            {isStaff && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5"><MapPin size={16} className="text-red-500" /> {t('userProfile.gateLabel')}</label>
                <p className="text-sm font-semibold text-gray-800 px-3 py-2 bg-gray-50 rounded-lg">Gate 01</p>
              </div>
            )}
            {isManager && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5"><Building size={16} className="text-orange-500" /> {t('userProfile.branch')}</label>
                <p className="text-sm font-semibold text-gray-800 px-3 py-2 bg-gray-50 rounded-lg">SmartPark District 1</p>
              </div>
            )}
            {isDriver && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5"><CreditCard size={16} className="text-teal-500" /> {t('userProfile.balance')}</label>
                <p className="text-sm font-semibold text-gray-800 px-3 py-2 bg-gray-50 rounded-lg">
                  {new Intl.NumberFormat('vi-VN').format(user?.accountBalance || 0)} VNĐ
                </p>
              </div>
            )}
          </div>
        </div>

        {isDriver && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Activity size={18} className="text-blue-500" /> {t('userProfile.recentActivity')}</h3>
              </div>
              <div className="space-y-3">
                {recentActivity?.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">{t('userProfile.noActivity')}</p>
                ) : (
                  recentActivity?.map((act, i) => (
                    <div key={act.ReservationID || i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{act.PlateNumber || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{fmtDate(act.StartTime)} {fmtTime(act.StartTime)}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{act.ReservationStatus || 'N/A'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><CreditCard size={18} className="text-emerald-500" /> {t('userProfile.paymentHistory')}</h3>
              </div>
              <div className="space-y-3">
                {recentPayments?.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">{t('userProfile.noPayment')}</p>
                ) : (
                  recentPayments?.map((pay, i) => (
                    <div key={pay.PaymentID || i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{new Intl.NumberFormat('vi-VN').format(pay.Amount || 0)} VNĐ</p>
                        <p className="text-xs text-gray-500">{fmtDate(pay.PaymentTime)} {fmtTime(pay.PaymentTime)}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{pay.PaymentStatus || 'N/A'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const SettingsContent = ({ saved, handleSave }) => {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useAppTheme()
  const [settings, setSettings] = useState({
    emailNotif: true, pushNotif: true, soundAlert: true, language: 'vi'
  })
  const set = (key) => (val) => setSettings(prev => ({ ...prev, [key]: val }))

  return (
    <div className="flex gap-6 flex-col lg:flex-row animate-in fade-in">
      <div className="flex-1 space-y-5">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2"><Monitor size={18} className="text-blue-500" /> {t('userProfile.settings.appearance')}</h3>
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-4">{t('userProfile.settings.colorTheme')}</p>
            <div className="flex gap-3">
              {[
                { id: 'light', icon: <Sun size={18} />, label: t('userProfile.settings.light') },
                { id: 'dark', icon: <Moon size={18} />, label: t('userProfile.settings.dark') }
              ].map(({ id, icon, label }) => (
                <button
                  key={id}
                  onClick={() => { if (theme !== id) toggleTheme() }}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${(id === 'dark' && theme === 'dark') || (id === 'light' && theme === 'light') ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'}`}>
                  {icon}<span className="text-xs font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2"><Bell size={18} className="text-purple-500" /> {t('userProfile.settings.notifications')}</h3>
          <Toggle label={t('userProfile.settings.emailNotif')} checked={settings.emailNotif} onChange={set('emailNotif')} />
          <Toggle label={t('userProfile.settings.pushNotif')} checked={settings.pushNotif} onChange={set('pushNotif')} />
          <Toggle label={t('userProfile.settings.soundAlert')} checked={settings.soundAlert} onChange={set('soundAlert')} />
        </div>
      </div>
      <div className="w-full lg:w-80 flex flex-col gap-5">
        <button onClick={handleSave} className={`w-full py-3 font-bold rounded-xl text-white ${saved ? 'bg-green-500' : 'bg-blue-600'}`}>
          {saved ? t('userProfile.settings.saved') : t('userProfile.settings.saveSettings')}
        </button>
      </div>
    </div>
  )
}

const SecurityContent = () => {
  const { t } = useTranslation()
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasPassword = user?.hasPassword

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if ((hasPassword && !oldPw) || !newPw) return
    try {
      setIsSubmitting(true)
      const res = await changePasswordAPI({ oldPassword: oldPw, newPassword: newPw })
      if (res.data?.success) {
        toast.success(res.data.message || t('userProfile.security.updateSuccess'))
        setOldPw('')
        setNewPw('')
      } else {
        toast.error(res.data?.message || t('userProfile.security.updateFail'))
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('userProfile.security.updateFail'))
    } finally {
      setIsSubmitting(false)
    }
  }
  const handleLogoutAll = async () => { await logout(); navigate('/login') }

  return (
    <div className="flex gap-6 flex-col lg:flex-row animate-in fade-in">
      <div className="flex-1 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Lock size={18} className="text-blue-500" />
            {hasPassword ? t('userProfile.security.changePassword') : t('userProfile.security.createPassword')}
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {hasPassword && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('userProfile.security.currentPassword')}</label>
                <div className="relative">
                  <input type={showOld ? 'text' : 'password'} value={oldPw} onChange={e => setOldPw(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showOld ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('userProfile.security.newPassword')}</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showNew ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <button type="submit" disabled={(hasPassword && !oldPw) || !newPw || isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl flex justify-center items-center gap-2">
              {isSubmitting ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : t('userProfile.security.update')}
            </button>
          </form>
        </div>
      </div>
      <div className="w-full lg:w-80 flex flex-col gap-5">
        <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
          <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2"><AlertTriangle size={16} /> {t('userProfile.security.dangerZone')}</h3>
          <button onClick={handleLogoutAll} className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm">
            <LogOut size={15} /> {t('userProfile.security.logoutAll')}
          </button>
        </div>
      </div>
    </div>
  )
}

const UserProfile = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [profileData, setProfileData] = useState(user)
  const [activeTab, setActiveTab] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  const PROFILE_TABS = [
    { id: 'profile', label: t('userProfile.tabs.profile'), icon: User },
    { id: 'settings', label: t('userProfile.tabs.settings'), icon: Settings },
    { id: 'security', label: t('userProfile.tabs.security'), icon: Shield }
  ]

  const TAB_TITLES = {
    profile: t('userProfile.tabs.profile'),
    settings: t('userProfile.tabs.settings'),
    security: t('userProfile.tabs.security'),
  }

  const [formData, setFormData] = useState({
    fullName: user?.fullName || user?.FullName || '',
    phoneNumber: user?.phone || user?.PhoneNumber || '',
    dateOfBirth: user?.dateOfBirth || user?.DateOfBirth || ''
  })

  const [recentActivity, setRecentActivity] = useState([])
  const [recentPayments, setRecentPayments] = useState([])
  const [isUpdating, setIsUpdating] = useState(false)

  const isDriver = user?.roleName?.toLowerCase() === 'driver' || user?.RoleName?.toLowerCase() === 'driver'

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authorizeAxios.get('/auth/me')
        const currentUser = response.data?.data?.user || response.data?.data || response.data?.user || response.data
        if (currentUser) {
          setProfileData(currentUser)
          setFormData({
            fullName: currentUser.fullName || currentUser.FullName || '',
            phoneNumber: currentUser.phone || currentUser.PhoneNumber || '',
            dateOfBirth: currentUser.dateOfBirth || currentUser.DateOfBirth || ''
          })
        }
      } catch (error) {
        console.error('Get profile failed:', error)
        setProfileData(user)
      }
    }
    if (!profileData || !formData.fullName) fetchProfile()
  }, [user])

  useEffect(() => {
    if (!isDriver) return
    const fetchHistory = async () => {
      try {
        const [actRes, payRes] = await Promise.allSettled([
          driverApi.getReservations({ limit: 5 }),
          driverApi.getPaymentHistory({ limit: 5 })
        ])
        if (actRes.status === 'fulfilled') setRecentActivity(actRes.value?.data?.slice(0, 5) || [])
        if (payRes.status === 'fulfilled') setRecentPayments(payRes.value?.data?.slice(0, 5) || [])
      } catch (e) { console.error('Load history error', e) }
    }
    fetchHistory()
  }, [isDriver])

  const handleInputChange = (field) => (e) => setFormData(p => ({ ...p, [field]: e.target.value }))

  const handleSave = async () => {
    if (activeTab === 'profile' && isDriver) {
      setIsUpdating(true)
      try {
        await driverApi.updateProfile({
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          dateOfBirth: formData.dateOfBirth
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        setEditing(false)
      } catch (error) {
        console.error('Update profile error:', error)
      } finally {
        setIsUpdating(false)
      }
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      setEditing(false)
    }
  }

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{TAB_TITLES[activeTab]}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('userProfile.subtitle')}</p>
        </div>

        {activeTab === 'profile' && (
          <button
            disabled={isUpdating}
            onClick={() => { if (editing) handleSave(); else setEditing(true) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-sm transition-colors disabled:opacity-70"
          >
            {editing
              ? (isUpdating
                ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                : <Save size={15} />)
              : <Edit3 size={15} />}
            {editing
              ? (isUpdating ? t('userProfile.saving') : (saved ? t('userProfile.saved') : t('userProfile.saveProfile')))
              : t('userProfile.edit')}
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
          {activeTab === 'profile' && <ProfileContent user={profileData} editing={editing} formData={formData} onChange={handleInputChange} recentActivity={recentActivity} recentPayments={recentPayments} />}
          {activeTab === 'settings' && <SettingsContent saved={saved} handleSave={handleSave} />}
          {activeTab === 'security' && <SecurityContent />}
        </main>
      </div>
    </div>
  )
}

export default UserProfile