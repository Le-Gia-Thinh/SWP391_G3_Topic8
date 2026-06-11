import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Car,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  History,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  Save,
  Shield,
  Smartphone,
  User,
  Volume2,
  Wallet
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import driverApi from '../../apis/driverApi'
import { forgotPasswordAPI } from '../../apis/authApi'
import { useAuth } from '../../contexts/AuthContext'

const SETTINGS_TABS = [
  { id: 'account', label: 'Tài khoản', icon: User },
  { id: 'vehicles', label: 'Phương tiện', icon: Car },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'security', label: 'Bảo mật', icon: Shield },
  { id: 'payment', label: 'Thanh toán', icon: CreditCard }
]

const DEFAULT_NOTIFICATIONS = {
  push: true,
  sms: false,
  email: true,
  sound: true
}

const DEFAULT_PAYMENT_SETTINGS = {
  defaultMethod: 'Cash',
  autoOpenPaymentLink: true
}

function getValue(obj, ...keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key]
  }
  return ''
}

function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function formatDateTime(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatCurrency(value) {
  const numberValue = Number(value || 0)
  return `${numberValue.toLocaleString('vi-VN')} VND`
}

function normalizeProfile(raw = {}) {
  return {
    userId: getValue(raw, 'UserID', 'userId', 'id'),
    fullName: getValue(raw, 'FullName', 'fullName', 'name'),
    email: getValue(raw, 'Email', 'email'),
    phoneNumber: getValue(raw, 'PhoneNumber', 'phoneNumber'),
    dateOfBirth: toDateInput(getValue(raw, 'DateOfBirth', 'dateOfBirth')),
    avatarUrl: getValue(raw, 'AvatarUrl', 'avatarUrl'),
    isActive: Boolean(getValue(raw, 'IsActive', 'isActive')),
    isEmailVerified: Boolean(getValue(raw, 'IsEmailVerified', 'isEmailVerified')),
    createdAt: getValue(raw, 'CreatedAt', 'createdAt'),
    updatedAt: getValue(raw, 'UpdatedAt', 'updatedAt'),
    roleName: getValue(raw, 'RoleName', 'roleName')
  }
}

function getLocalJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function saveLocalJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

const ToggleRow = ({ icon: Icon, title, desc, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
          <Icon size={18} />
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <p className="mt-1 text-xs text-gray-500">{desc}</p>
        </div>
      </div>

      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
      </label>
    </div>
  )
}

const EmptyState = ({ icon: Icon, title, desc }) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center">
      <Icon size={42} className="mb-3 text-gray-300" />
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-gray-500">{desc}</p>
    </div>
  )
}

const DriverSettings = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [activeTab, setActiveTab] = useState('account')
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)

  const [profile, setProfile] = useState({
    userId: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    avatarUrl: '',
    isActive: false,
    isEmailVerified: false,
    createdAt: '',
    updatedAt: '',
    roleName: ''
  })

  const [currentSession, setCurrentSession] = useState(null)
  const [recentVehicles, setRecentVehicles] = useState([])
  const [paymentHistory, setPaymentHistory] = useState([])

  const storageKey = useMemo(() => {
    const identity = profile.userId || user?.UserID || user?.userId || user?.email || 'driver'
    return `pbms_driver_settings_${identity}`
  }, [profile.userId, user])

  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS)
  const [paymentSettings, setPaymentSettings] = useState(DEFAULT_PAYMENT_SETTINGS)

  const loadLocalSettings = useCallback((key) => {
    setNotifications(getLocalJson(`${key}_notifications`, DEFAULT_NOTIFICATIONS))
    setPaymentSettings(getLocalJson(`${key}_payment`, DEFAULT_PAYMENT_SETTINGS))
  }, [])

  const buildVehicleList = useCallback((reservations = [], session = null) => {
    const map = new Map()

    if (session) {
      const plate = getValue(session, 'PlateNumber', 'plateNumber')

      if (plate) {
        map.set(plate, {
          plateNumber: plate,
          vehicleName: getValue(session, 'VehicleName', 'vehicleName') || 'Phương tiện',
          slotCode: getValue(session, 'SlotCode', 'slotCode'),
          latestUsedAt: getValue(session, 'EntryTime', 'entryTime'),
          status: 'Đang gửi',
          totalSessions: 1
        })
      }
    }

    reservations.forEach((item) => {
      const plate = getValue(item, 'PlateNumber', 'plateNumber')
      if (!plate) return

      const existed = map.get(plate)

      map.set(plate, {
        plateNumber: plate,
        vehicleName: getValue(item, 'VehicleName', 'vehicleName') || existed?.vehicleName || 'Phương tiện',
        slotCode: getValue(item, 'SlotCode', 'slotCode') || existed?.slotCode || '',
        latestUsedAt:
          getValue(item, 'EndTime', 'endTime', 'StartTime', 'startTime', 'CreatedAt', 'createdAt') ||
          existed?.latestUsedAt,
        status: existed?.status || 'Đã sử dụng',
        totalSessions: (existed?.totalSessions || 0) + 1
      })
    })

    return Array.from(map.values()).sort((a, b) => {
      const dateA = new Date(a.latestUsedAt || 0).getTime()
      const dateB = new Date(b.latestUsedAt || 0).getTime()
      return dateB - dateA
    })
  }, [])

  const loadPageData = useCallback(async () => {
    setLoading(true)

    try {
      const [
        profileResult,
        sessionResult,
        reservationsResult,
        paymentsResult
      ] = await Promise.allSettled([
        driverApi.getProfile(),
        driverApi.getCurrentSession(),
        driverApi.getReservations(),
        driverApi.getPaymentHistory({ limit: 10, offset: 0 })
      ])

      let loadedProfile = null
      let loadedSession = null
      let loadedReservations = []
      let loadedPayments = []

      if (profileResult.status === 'fulfilled') {
        loadedProfile = normalizeProfile(profileResult.value?.data)
        setProfile(loadedProfile)
      }

      if (sessionResult.status === 'fulfilled') {
        loadedSession = sessionResult.value?.data || null
        setCurrentSession(loadedSession)
      }

      if (reservationsResult.status === 'fulfilled') {
        loadedReservations = Array.isArray(reservationsResult.value?.data)
          ? reservationsResult.value.data
          : []
      }

      if (paymentsResult.status === 'fulfilled') {
        loadedPayments = Array.isArray(paymentsResult.value?.data)
          ? paymentsResult.value.data
          : []
        setPaymentHistory(loadedPayments)
      }

      setRecentVehicles(buildVehicleList(loadedReservations, loadedSession))

      const identity =
        loadedProfile?.userId ||
        user?.UserID ||
        user?.userId ||
        user?.email ||
        'driver'

      loadLocalSettings(`pbms_driver_settings_${identity}`)
    } catch {
      toast.error('Không thể tải dữ liệu cài đặt.')
    } finally {
      setLoading(false)
    }
  }, [buildVehicleList, loadLocalSettings, user])

  useEffect(() => {
    loadPageData()
  }, [loadPageData])

  const updateProfileField = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveProfile = async () => {
    if (!profile.fullName.trim()) {
      toast.error('Họ và tên không được để trống.')
      return
    }

    if (profile.phoneNumber && !/^[0-9+\-\s.]{8,20}$/.test(profile.phoneNumber)) {
      toast.error('Số điện thoại không hợp lệ.')
      return
    }

    setSavingProfile(true)

    try {
      const response = await driverApi.updateProfile({
        fullName: profile.fullName.trim(),
        phoneNumber: profile.phoneNumber.trim(),
        dateOfBirth: profile.dateOfBirth || null,
        avatarUrl: profile.avatarUrl || null
      })

      setProfile(normalizeProfile(response.data))
      toast.success(response.message || 'Cập nhật thông tin cá nhân thành công.')
    } catch {
      // authorizeAxios đã toast lỗi
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveNotifications = () => {
    saveLocalJson(`${storageKey}_notifications`, notifications)
    toast.success('Đã lưu tùy chọn thông báo trên thiết bị này.')
  }

  const handleSavePaymentSettings = () => {
    saveLocalJson(`${storageKey}_payment`, paymentSettings)
    toast.success('Đã lưu cài đặt thanh toán trên thiết bị này.')
  }

  const handleSendResetPassword = async () => {
    if (!profile.email) {
      toast.error('Không tìm thấy email tài khoản.')
      return
    }

    setSendingReset(true)

    try {
      await forgotPasswordAPI(profile.email)
      toast.success('Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.')
    } catch {
      // authorizeAxios đã toast lỗi
    } finally {
      setSendingReset(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-gray-600 shadow-sm">
          <Loader2 size={20} className="animate-spin text-blue-600" />
          Đang tải cài đặt...
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý tùy chọn và bảo mật tài khoản của bạn.</p>
        </div>

        <button
          onClick={loadPageData}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </section>

      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="w-full shrink-0 md:w-64">
          <nav className="flex flex-col space-y-1">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {active && <ChevronRight size={16} className="ml-auto opacity-70" />}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="min-h-[500px] flex-1 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="border-b border-gray-100 pb-4 text-lg font-bold text-gray-900">Thông tin cá nhân</h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Họ và tên</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(event) => updateProfileField('fullName', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Số điện thoại</label>
                  <input
                    type="text"
                    value={profile.phoneNumber}
                    onChange={(event) => updateProfileField('phoneNumber', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Ngày sinh</label>
                  <input
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(event) => updateProfileField('dateOfBirth', event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Ảnh đại diện URL</label>
                  <input
                    type="text"
                    value={profile.avatarUrl}
                    onChange={(event) => updateProfileField('avatarUrl', event.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 transition-all focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-medium text-gray-500"
                  />
                  <p className="mt-2 text-xs text-gray-400">Email không thể thay đổi. Vui lòng liên hệ hỗ trợ nếu cần.</p>
                </div>
              </div>

              <div className="flex justify-end border-t border-gray-100 pt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Lưu thay đổi
                </button>
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="space-y-6">
              <h2 className="border-b border-gray-100 pb-4 text-lg font-bold text-gray-900">Phương tiện đã sử dụng</h2>

              {currentSession && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Phiên gửi hiện tại</p>

                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-500">Biển số</p>
                      <p className="font-bold text-gray-900">{getValue(currentSession, 'PlateNumber', 'plateNumber') || '—'}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Loại xe</p>
                      <p className="font-bold text-gray-900">{getValue(currentSession, 'VehicleName', 'vehicleName') || '—'}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">Vị trí</p>
                      <p className="font-bold text-gray-900">{getValue(currentSession, 'SlotCode', 'slotCode') || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {recentVehicles.length === 0 ? (
                <EmptyState
                  icon={Car}
                  title="Chưa có dữ liệu phương tiện"
                  desc="Khi bạn có phiên gửi xe hoặc lịch sử check-in, biển số đã sử dụng sẽ hiển thị tại đây."
                />
              ) : (
                <div className="space-y-3">
                  {recentVehicles.map((vehicle) => (
                    <div
                      key={vehicle.plateNumber}
                      className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                          <Car size={20} />
                        </div>

                        <div>
                          <p className="font-bold text-gray-900">{vehicle.plateNumber}</p>
                          <p className="text-xs text-gray-500">
                            {vehicle.vehicleName} • {vehicle.status}
                          </p>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500 md:text-right">
                        <p>Vị trí gần nhất: <span className="font-bold text-gray-900">{vehicle.slotCode || '—'}</span></p>
                        <p>Lần dùng gần nhất: {formatDateTime(vehicle.latestUsedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                Database hiện tại chưa có bảng riêng như <b>DriverVehicles</b>, nên phần này đang đọc biển số từ lịch sử phiên gửi xe.
              </p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="border-b border-gray-100 pb-4 text-lg font-bold text-gray-900">Tùy chọn thông báo</h2>

              <div className="space-y-4">
                <ToggleRow
                  icon={Bell}
                  title="Thông báo đẩy"
                  desc="Nhận thông báo trực tiếp trên trình duyệt hoặc thiết bị."
                  checked={notifications.push}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, push: value }))}
                />

                <ToggleRow
                  icon={Smartphone}
                  title="Thông báo SMS"
                  desc="Nhận mã OTP và cảnh báo quan trọng qua tin nhắn."
                  checked={notifications.sms}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, sms: value }))}
                />

                <ToggleRow
                  icon={Mail}
                  title="Thông báo Email"
                  desc="Nhận hóa đơn, lịch sử thanh toán và cập nhật hệ thống qua email."
                  checked={notifications.email}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, email: value }))}
                />

                <ToggleRow
                  icon={Volume2}
                  title="Âm thanh thông báo"
                  desc="Phát âm thanh khi có thông báo mới."
                  checked={notifications.sound}
                  onChange={(value) => setNotifications((prev) => ({ ...prev, sound: value }))}
                />
              </div>

              <div className="flex justify-end border-t border-gray-100 pt-4">
                <button
                  onClick={handleSaveNotifications}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
                >
                  <Save size={16} />
                  Lưu thông báo
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="border-b border-gray-100 pb-4 text-lg font-bold text-gray-900">Bảo mật tài khoản</h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className={profile.isEmailVerified ? 'text-green-600' : 'text-amber-600'} />
                    <h3 className="font-bold text-gray-900">Xác thực email</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {profile.isEmailVerified ? 'Email đã được xác thực.' : 'Email chưa được xác thực.'}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2">
                    <Shield size={18} className={profile.isActive ? 'text-green-600' : 'text-red-600'} />
                    <h3 className="font-bold text-gray-900">Trạng thái tài khoản</h3>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {profile.isActive ? 'Tài khoản đang hoạt động.' : 'Tài khoản đã bị khóa.'}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Ngày tạo tài khoản: <b className="text-gray-900">{formatDateTime(profile.createdAt)}</b>
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Cập nhật gần nhất: <b className="text-gray-900">{formatDateTime(profile.updatedAt)}</b>
                </p>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 md:flex-row md:justify-end">
                <button
                  onClick={handleSendResetPassword}
                  disabled={sendingReset}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {sendingReset ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  Gửi email đổi mật khẩu
                </button>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-6">
              <h2 className="border-b border-gray-100 pb-4 text-lg font-bold text-gray-900">Cài đặt thanh toán</h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Phương thức mặc định</label>
                  <select
                    value={paymentSettings.defaultMethod}
                    onChange={(event) => setPaymentSettings((prev) => ({ ...prev, defaultMethod: event.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    <option value="Cash">Tiền mặt</option>
                    <option value="BankTransfer">Chuyển khoản</option>
                    <option value="PayOS">PayOS</option>
                  </select>
                </div>

                <ToggleRow
                  icon={Wallet}
                  title="Tự mở link thanh toán"
                  desc="Sau khi tạo thanh toán online, hệ thống tự mở link thanh toán."
                  checked={paymentSettings.autoOpenPaymentLink}
                  onChange={(value) => setPaymentSettings((prev) => ({ ...prev, autoOpenPaymentLink: value }))}
                />
              </div>

              <div className="flex justify-end border-t border-gray-100 pt-4">
                <button
                  onClick={handleSavePaymentSettings}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
                >
                  <Save size={16} />
                  Lưu thanh toán
                </button>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <History size={16} />
                  Lịch sử thanh toán gần đây
                </h3>

                {paymentHistory.length === 0 ? (
                  <EmptyState
                    icon={CreditCard}
                    title="Chưa có lịch sử thanh toán"
                    desc="Các khoản thanh toán sau khi hoàn tất sẽ hiển thị tại đây."
                  />
                ) : (
                  <div className="space-y-3">
                    {paymentHistory.slice(0, 5).map((payment, index) => (
                      <div
                        key={payment.PaymentID || payment.paymentId || index}
                        className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-bold text-gray-900">
                            Phiên #{getValue(payment, 'SessionID', 'sessionId') || '—'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(getValue(payment, 'PaymentTime', 'paymentTime', 'CreatedAt', 'createdAt'))}
                          </p>
                        </div>

                        <div className="md:text-right">
                          <p className="font-black text-gray-900">{formatCurrency(getValue(payment, 'Amount', 'amount'))}</p>
                          <p className="text-xs font-bold text-blue-600">
                            {getValue(payment, 'PaymentStatus', 'paymentStatus') || 'Pending'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default DriverSettings