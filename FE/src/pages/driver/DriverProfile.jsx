import React, { useEffect, useState } from 'react'
import {
  User,
  Mail,
  Phone,
  Car,
  Shield,
  Key,
  Camera,
  RefreshCcw,
  AlertCircle
} from 'lucide-react'
import authorizeAxios from '../../utils/authorizeAxios'
import { useAuth } from '../../contexts/AuthContext'

const getInitials = (name) => {
  if (!name) return 'DR'

  const parts = name.trim().split(/\s+/)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return name.slice(0, 2).toUpperCase()
}

const getProfileFromUser = (user) => {
  if (!user) {
    return {
      userId: '',
      fullName: '',
      email: '',
      phone: '',
      roleName: 'Driver',
      driverLicense: 'Chưa cập nhật'
    }
  }

  return {
    userId: user.UserID || user.userId || user.id || '',
    fullName: user.FullName || user.fullName || user.name || '',
    email: user.Email || user.email || '',
    phone: user.PhoneNumber || user.phoneNumber || user.phone || '',
    roleName: user.RoleName || user.roleName || 'Driver',
    driverLicense:
      user.DriverLicense ||
      user.driverLicense ||
      user.LicenseNumber ||
      user.licenseNumber ||
      'Chưa cập nhật'
  }
}

const DriverProfile = () => {
  const { user } = useAuth()

  const [profileData, setProfileData] = useState(getProfileFromUser(user))
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')

      const response = await authorizeAxios.get('/auth/me')

      const currentUser =
        response.data?.data?.user ||
        response.data?.data ||
        response.data?.user ||
        response.data

      setProfileData(getProfileFromUser(currentUser))
    } catch (error) {
      console.error('Get profile failed:', error)

      const message =
        error.response?.data?.message ||
        'Không thể tải thông tin cá nhân. Vui lòng thử lại.'

      setErrorMessage(message)

      if (user) {
        setProfileData(getProfileFromUser(user))
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChangePassword = () => {
    console.log('Change password')
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <p className="font-bold text-gray-700">
          Đang tải thông tin cá nhân...
        </p>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle size={24} />
        </div>

        <p className="font-bold text-red-600">
          {errorMessage}
        </p>

        <button
          type="button"
          onClick={fetchProfile}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          <RefreshCcw size={16} />
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hồ sơ cá nhân
        </h1>
        <p className="text-sm text-gray-500">
          Thông tin được lấy từ tài khoản đã đăng ký trong hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 text-3xl font-bold text-orange-600">
              {getInitials(profileData.fullName)}

              <button
                type="button"
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white transition-colors hover:bg-blue-700"
              >
                <Camera size={14} />
              </button>
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              {profileData.fullName || 'Driver'}
            </h2>

            <p className="text-sm text-gray-500">
              Tài khoản {profileData.roleName || 'Driver'}
            </p>

            <div className="mt-6 flex flex-col gap-2 rounded-xl bg-gray-50 p-4 text-sm">
              <ProfileQuickInfo
                icon={<Mail size={16} />}
                value={profileData.email || 'Chưa cập nhật email'}
              />

              <ProfileQuickInfo
                icon={<Phone size={16} />}
                value={profileData.phone || 'Chưa cập nhật số điện thoại'}
              />

              <ProfileQuickInfo
                icon={<Shield size={16} />}
                value={`GPLX: ${profileData.driverLicense || 'Chưa cập nhật'}`}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
              Bảo mật
            </h3>

            <button
              type="button"
              onClick={handleChangePassword}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                  <Key size={16} />
                </div>
                Đổi mật khẩu
              </div>

              <span className="text-gray-400">
                ›
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Thông tin cơ bản
                </h2>
                <p className="text-sm text-gray-500">
                  Dữ liệu tài khoản hiện tại trong database.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchProfile}
                className="flex w-fit items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
              >
                <RefreshCcw size={16} />
                Làm mới
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <ProfileInput
                label="Mã tài khoản"
                icon={<User className="h-5 w-5" />}
                type="text"
                value={profileData.userId || 'Chưa có'}
              />

              <ProfileInput
                label="Vai trò"
                icon={<Shield className="h-5 w-5" />}
                type="text"
                value={profileData.roleName || 'Driver'}
              />

              <ProfileInput
                label="Họ và tên"
                icon={<User className="h-5 w-5" />}
                type="text"
                value={profileData.fullName || 'Chưa cập nhật'}
              />

              <ProfileInput
                label="Email"
                icon={<Mail className="h-5 w-5" />}
                type="email"
                value={profileData.email || 'Chưa cập nhật'}
              />

              <ProfileInput
                label="Số điện thoại"
                icon={<Phone className="h-5 w-5" />}
                type="tel"
                value={profileData.phone || 'Chưa cập nhật'}
              />

              <ProfileInput
                label="Giấy phép lái xe"
                icon={<Shield className="h-5 w-5" />}
                type="text"
                value={profileData.driverLicense || 'Chưa cập nhật'}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Phương tiện của tôi
                </h2>
                <p className="text-sm text-gray-500">
                  Chức năng quản lý phương tiện sẽ cần bảng vehicle riêng trong database.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                <Car size={24} />
              </div>

              <h3 className="text-sm font-bold text-gray-800">
                Chưa có dữ liệu phương tiện từ database
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Hiện tại hệ thống chỉ lấy thông tin cá nhân từ account đăng ký.
                Nếu muốn lưu nhiều xe, cần thêm bảng phương tiện của Driver.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProfileQuickInfo = ({ icon, value }) => {
  return (
    <div className="flex items-center gap-3 text-gray-600">
      <span className="shrink-0 text-gray-400">
        {icon}
      </span>

      <span className="truncate">
        {value}
      </span>
    </div>
  )
}

const ProfileInput = ({
  label,
  icon,
  type,
  value
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>

        <input
          type={type}
          disabled
          value={value}
          readOnly
          className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-medium text-gray-800 outline-none disabled:opacity-80"
        />
      </div>
    </div>
  )
}

export default DriverProfile