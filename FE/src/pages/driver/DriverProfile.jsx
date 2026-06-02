import React, { useState } from 'react'
import {
  User,
  Mail,
  Phone,
  Car,
  Shield,
  Key,
  Camera,
  Save,
  Edit3
} from 'lucide-react'

const INITIAL_PROFILE = {
  fullName: 'Duy Nguyễn',
  email: 'driver@smartpark.com',
  phone: '0987 654 321',
  driverLicense: '79-123456789'
}

const INITIAL_VEHICLES = [
  {
    id: 'V1',
    plate: '51A-999.88',
    type: 'Ô tô (4-7 chỗ)',
    brand: 'VinFast Lux A2.0',
    color: 'Đen',
    isDefault: true
  },
  {
    id: 'V2',
    plate: '51G-123.45',
    type: 'Ô tô (4-7 chỗ)',
    brand: 'Honda City',
    color: 'Trắng',
    isDefault: false
  }
]

const getInitials = (name) => {
  if (!name) return 'DN'

  const parts = name.trim().split(/\s+/)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  return name.slice(0, 2).toUpperCase()
}

const DriverProfile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState(INITIAL_PROFILE)
  const [backupProfileData, setBackupProfileData] = useState(INITIAL_PROFILE)
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES)

  const handleStartEdit = () => {
    setBackupProfileData(profileData)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setProfileData(backupProfileData)
    setIsEditing(false)
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setProfileData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = () => {
    // Sau này gọi API update profile ở đây.
    setBackupProfileData(profileData)
    setIsEditing(false)
  }

  const handleSetDefaultVehicle = (vehicleId) => {
    setVehicles((prev) =>
      prev.map((vehicle) => ({
        ...vehicle,
        isDefault: vehicle.id === vehicleId
      }))
    )
  }

  const handleAddVehicle = () => {
    // Sau này có thể mở modal thêm phương tiện ở đây.
    console.log('Open add vehicle modal')
  }

  const handleEditVehicle = (vehicleId) => {
    // Sau này có thể mở modal sửa phương tiện ở đây.
    console.log('Edit vehicle:', vehicleId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hồ sơ cá nhân
        </h1>
        <p className="text-sm text-gray-500">
          Quản lý thông tin tài khoản và phương tiện của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Avatar Card */}
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
              {profileData.fullName}
            </h2>
            <p className="text-sm text-gray-500">
              Tài khoản Tài xế
            </p>

            <div className="mt-6 flex flex-col gap-2 rounded-xl bg-gray-50 p-4 text-sm">
              <ProfileQuickInfo
                icon={<Mail size={16} />}
                value={profileData.email}
              />

              <ProfileQuickInfo
                icon={<Phone size={16} />}
                value={profileData.phone}
              />

              <ProfileQuickInfo
                icon={<Shield size={16} />}
                value={`GPLX: ${profileData.driverLicense}`}
              />
            </div>
          </div>

          {/* Security Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
              Bảo mật
            </h3>

            <button
              type="button"
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

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Information */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Thông tin cơ bản
              </h2>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="flex w-fit items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <Edit3 size={16} />
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                  >
                    <Save size={16} />
                    Lưu
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <ProfileInput
                label="Họ và tên"
                icon={<User className="h-5 w-5" />}
                type="text"
                name="fullName"
                value={profileData.fullName}
                disabled={!isEditing}
                onChange={handleChange}
              />

              <ProfileInput
                label="Email"
                icon={<Mail className="h-5 w-5" />}
                type="email"
                name="email"
                value={profileData.email}
                disabled={!isEditing}
                onChange={handleChange}
              />

              <ProfileInput
                label="Số điện thoại"
                icon={<Phone className="h-5 w-5" />}
                type="tel"
                name="phone"
                value={profileData.phone}
                disabled={!isEditing}
                onChange={handleChange}
              />

              <ProfileInput
                label="Giấy phép lái xe"
                icon={<Shield className="h-5 w-5" />}
                type="text"
                name="driverLicense"
                value={profileData.driverLicense}
                disabled={!isEditing}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Vehicles */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Phương tiện của tôi
                </h2>
                <p className="text-sm text-gray-500">
                  Quản lý danh sách xe dùng để đặt chỗ và check-in.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddVehicle}
                className="w-fit text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                + Thêm phương tiện
              </button>
            </div>

            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onEdit={handleEditVehicle}
                  onSetDefault={handleSetDefaultVehicle}
                />
              ))}
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
  name,
  value,
  disabled,
  onChange
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
          name={name}
          disabled={disabled}
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm font-medium text-gray-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-70"
        />
      </div>
    </div>
  )
}

const VehicleCard = ({ vehicle, onEdit, onSetDefault }) => {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/30 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <Car size={24} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-gray-900">
              {vehicle.plate}
            </span>

            {vehicle.isDefault && (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Mặc định
              </span>
            )}
          </div>

          <div className="mt-1 text-sm text-gray-500">
            {vehicle.brand} • {vehicle.color} • {vehicle.type}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(vehicle.id)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        >
          Sửa
        </button>

        {!vehicle.isDefault && (
          <button
            type="button"
            onClick={() => onSetDefault(vehicle.id)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
          >
            Đặt mặc định
          </button>
        )}
      </div>
    </div>
  )
}

export default DriverProfile