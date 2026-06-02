import React from 'react'
import {
  Bike,
  CarFront,
  Zap,
  Clock,
  CalendarDays,
  FileText,
  AlertCircle,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const vehicleStatuses = [
  {
    label: 'MOTORBIKE',
    available: 145,
    total: 300,
    Icon: Bike,
    color: 'orange'
  },
  {
    label: 'CAR',
    available: 42,
    total: 100,
    Icon: CarFront,
    color: 'blue'
  },
  {
    label: 'ELECTRIC VEHICLE',
    available: 12,
    total: 20,
    Icon: Zap,
    color: 'green'
  }
]

const quickActions = [
  {
    title: 'Đặt chỗ đỗ xe',
    description: 'Giữ chỗ trước cho chuyến đi sắp tới',
    to: '/driver/booking',
    Icon: CalendarDays,
    variant: 'primary'
  },
  {
    title: 'Phiên gửi xe',
    description: 'Xem chi tiết thời gian và vị trí gửi',
    to: '/driver/session',
    Icon: Clock,
    iconClass: 'text-blue-500'
  },
  {
    title: 'Bảng giá',
    description: 'Thông tin phí dịch vụ theo giờ/ngày',
    to: '/driver/pricing',
    Icon: FileText,
    iconClass: 'text-indigo-500'
  },
  {
    title: 'Báo sự cố',
    description: 'Gửi báo cáo khi gặp trục trặc kỹ thuật',
    to: '/driver/report',
    Icon: AlertCircle,
    iconClass: 'text-red-500'
  }
]

const currentBooking = {
  code: 'BK-8829102',
  status: 'Đã xác nhận',
  time: '14:30, 24/10/2023',
  vehicleType: 'Car (Sedan)',
  plateNumber: '51K-123.45',
  slot: 'Floor B2 / Area C / Slot 102'
}

const activeSession = {
  plateNumber: '51K-123.45',
  type: 'Booking',
  sessionCode: 'SES-990123',
  bookingCode: 'BK-8829102',
  checkInTime: '14:35, 24/10/2023',
  slot: 'Floor B2 / Area C / Slot 102',
  estimatedFee: '45,000 VND',
  paymentStatus: 'Pending'
}

const colorClasses = {
  orange: {
    border: 'border-orange-100',
    bg: 'bg-orange-50/30',
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-500'
  },
  blue: {
    border: 'border-blue-100',
    bg: 'bg-blue-50/30',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-500'
  },
  green: {
    border: 'border-green-100',
    bg: 'bg-green-50/30',
    iconBg: 'bg-green-100',
    iconText: 'text-green-500'
  }
}

const SectionHeader = ({ icon: Icon, title, actionText, actionTo }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        {Icon && <Icon className="text-blue-500" size={20} />}
        {title}
      </h2>

      {actionText && actionTo && (
        <Link
          to={actionTo}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          {actionText}
        </Link>
      )}
    </div>
  )
}

const VehicleStatusCard = ({ Icon, label, available, total, color }) => {
  const classes = colorClasses[color]

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border ${classes.border} ${classes.bg}`}
    >
      <div
        className={`w-12 h-12 rounded-xl ${classes.iconBg} ${classes.iconText} flex items-center justify-center shrink-0`}
      >
        <Icon size={24} />
      </div>

      <div>
        <p className="text-xs font-bold text-gray-500 tracking-wider mb-1">
          {label}
        </p>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-gray-900">
            {available}
          </span>
          <span className="text-sm font-medium text-gray-400">
            / {total} trống
          </span>
        </div>
      </div>
    </div>
  )
}

const QuickActionCard = ({
  to,
  title,
  description,
  Icon,
  variant,
  iconClass = 'text-blue-500'
}) => {
  if (variant === 'primary') {
    return (
      <Link
        to={to}
        className="bg-blue-600 text-white p-5 rounded-2xl shadow-md shadow-blue-200 hover:-translate-y-1 transition-transform group relative overflow-hidden"
      >
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform" />

        <div className="relative z-10">
          <Icon className="mb-3" size={24} />
          <h3 className="font-bold mb-1">{title}</h3>
          <p className="text-xs text-blue-100">{description}</p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={to}
      className="bg-white border border-gray-100 p-5 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group"
    >
      <Icon
        className={`mb-3 ${iconClass} group-hover:scale-110 transition-transform`}
        size={24}
      />

      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>

      <p className="text-xs text-gray-500">
        {description}
      </p>
    </Link>
  )
}

const InfoRow = ({ label, value, highlight = false, border = true }) => {
  return (
    <div
      className={`flex justify-between items-center gap-4 text-sm ${border ? 'border-b border-gray-50 pb-4' : ''
        }`}
    >
      <span className="text-gray-500">
        {label}
      </span>

      <span
        className={`text-right ${highlight ? 'font-bold text-blue-600' : 'font-bold text-gray-900'
          }`}
      >
        {value}
      </span>
    </div>
  )
}

const BookingCard = ({ booking }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-[430px]">
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            Mã đặt chỗ
          </p>

          <h3 className="text-2xl font-black text-blue-600">
            {booking.code}
          </h3>
        </div>

        <span className="bg-blue-50 text-blue-600 px-3 py-1 text-xs font-bold rounded-full border border-blue-100">
          {booking.status}
        </span>
      </div>

      <div className="space-y-4 flex-1">
        <InfoRow label="Thời gian đặt" value={booking.time} />
        <InfoRow label="Loại phương tiện" value={booking.vehicleType} />
        <InfoRow label="Biển số xe" value={booking.plateNumber} />
        <InfoRow
          label="Vị trí chỉ định"
          value={booking.slot}
          highlight
          border={false}
        />
      </div>

      <button
        type="button"
        className="mt-auto w-full h-14 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        Xem chi tiết vị trí
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

const ActiveSessionCard = ({ session }) => {
  return (
    <div className="bg-white border border-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.1)] rounded-2xl p-6 relative overflow-hidden flex flex-col h-full min-h-[430px]">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />

      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            Biển số đang gửi
          </p>

          <h3 className="text-2xl font-black text-gray-900">
            {session.plateNumber}
          </h3>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium text-gray-500 mb-1">
            Loại phiên
          </p>

          <span className="text-sm font-bold text-gray-900">
            {session.type}
          </span>
        </div>
      </div>

      <div className="space-y-4 flex-1 text-sm">
        <InfoRow label="Mã phiên (ID)" value={session.sessionCode} />
        <InfoRow label="Mã đặt chỗ liên kết" value={session.bookingCode} />
        <InfoRow label="Thời gian vào" value={session.checkInTime} />
        <InfoRow
          label="Vị trí hiện tại"
          value={session.slot}
          highlight
        />

        <div className="flex justify-between items-center gap-4 pt-4 border-t border-gray-100">
          <span className="text-gray-500">
            Phí ước tính
          </span>

          <span className="font-black text-blue-600 text-xl text-right">
            {session.estimatedFee}
          </span>
        </div>

        <div className="flex justify-between items-center gap-4">
          <span className="text-gray-500">
            Trạng thái thanh toán
          </span>

          <span className="font-bold text-gray-900 text-right">
            {session.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-auto pt-5 border-t border-gray-100">
        <button
          type="button"
          className="h-14 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-xl transition-colors"
        >
          Hỗ trợ
        </button>

        <button
          type="button"
          className="h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-blue-200 flex items-center justify-center gap-2"
        >
          Chi tiết phiên
          <ExternalLink size={16} />
        </button>
      </div>
    </div>
  )
}

const DriverHome = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <section>
        <h1 className="text-2xl font-bold text-gray-900">
          Xin chào, {user?.fullName || 'Driver'}!
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1">
          <p className="text-sm text-gray-500">
            Chào mừng bạn quay trở lại. Đây là tình trạng bãi xe hiện tại của bạn.
          </p>

          <p className="w-fit text-xs font-medium text-gray-400 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
            Đang hoạt động: 00:00 - 23:59
          </p>
        </div>
      </section>

      {/* Vehicle Status Cards */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vehicleStatuses.map((vehicle) => (
            <VehicleStatusCard
              key={vehicle.label}
              {...vehicle}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <Clock size={14} />
          <span>
            Dữ liệu được cập nhật thời gian thực vào lúc{' '}
            <span className="font-medium">08:30:38</span>
          </span>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <SectionHeader title="Thao tác nhanh" />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.title}
              {...action}
            />
          ))}
        </div>
      </section>

      {/* Current Booking & Active Session */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div className="flex flex-col">
          <SectionHeader
            icon={CalendarDays}
            title="Đặt chỗ hiện tại"
            actionText="Xem tất cả"
            actionTo="/driver/history"
          />

          <BookingCard booking={currentBooking} />
        </div>

        <div className="flex flex-col">
          <SectionHeader
            icon={Clock}
            title="Phiên gửi xe đang hoạt động"
            actionText="Lịch sử"
            actionTo="/driver/session"
          />

          <ActiveSessionCard session={activeSession} />
        </div>
      </section>
    </div>
  )
}

export default DriverHome