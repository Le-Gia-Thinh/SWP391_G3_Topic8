import { useState } from 'react'
import { User, Mail, Phone, Building, Shield, Edit3, Save } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const getInitials = (name) => {
  if (!name) return 'MG'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const ManagerProfile = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    fullName: user?.fullName || 'Carol Manager',
    email: user?.email || 'manager@smartpark.com',
    phone: user?.phone || '0123 456 789',
    branch: user?.branch || 'District 1 Parking Tower'
  })
  const [backupProfile, setBackupProfile] = useState(profile)

  const handleEdit = () => {
    setBackupProfile(profile)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setProfile(backupProfile)
    setIsEditing(false)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ quản lý</h1>
        <p className="text-sm text-gray-500">Xem chi tiết thông tin tài khoản và cập nhật nhanh.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-600">
              {getInitials(profile.fullName)}
            </div>
            <div className="mt-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900">{profile.fullName}</h2>
              <p className="mt-1 text-sm text-gray-500">Quản lý SmartPark</p>
            </div>

            <div className="mt-6 space-y-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-slate-400" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-slate-400" />
                <span>{profile.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building size={18} className="text-slate-400" />
                <span>{profile.branch}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Bảo mật</h2>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <span className="flex items-center gap-3">
                  <Shield size={16} /> Đổi mật khẩu
                </span>
                <span>›</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h2>
                <p className="mt-1 text-sm text-gray-500">Cập nhật thông tin và địa chỉ quản lý bãi đỗ.</p>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex items-center gap-2 rounded-3xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Edit3 size={16} /> Chỉnh sửa
                </button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-3xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-2 rounded-3xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Save size={16} /> Lưu
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <ProfileField
                label="Họ và tên"
                value={profile.fullName}
                name="fullName"
                disabled={!isEditing}
                onChange={handleChange}
                icon={<User className="h-5 w-5 text-slate-400" />}
              />
              <ProfileField
                label="Email"
                value={profile.email}
                name="email"
                disabled={!isEditing}
                onChange={handleChange}
                icon={<Mail className="h-5 w-5 text-slate-400" />}
              />
              <ProfileField
                label="Số điện thoại"
                value={profile.phone}
                name="phone"
                disabled={!isEditing}
                onChange={handleChange}
                icon={<Phone className="h-5 w-5 text-slate-400" />}
              />
              <ProfileField
                label="Chi nhánh quản lý"
                value={profile.branch}
                name="branch"
                disabled={!isEditing}
                onChange={handleChange}
                icon={<Building className="h-5 w-5 text-slate-400" />}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Lịch sử truy cập</h2>
            <p className="mt-2 text-sm text-gray-500">Xem các lần đăng nhập và hoạt động gần đây.</p>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">24/05/2024</p>
                <p>Đăng nhập qua trình duyệt Chrome từ văn phòng District 1.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">23/05/2024</p>
                <p>Cập nhật thông tin chi nhánh quản lý.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProfileField = ({ label, value, name, disabled, onChange, icon }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
    <div className="relative rounded-3xl border border-gray-200 bg-slate-50 px-4 py-3">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <input
        name={name}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className="w-full bg-transparent pl-12 text-sm text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-70"
      />
    </div>
  </div>
)

export default ManagerProfile
