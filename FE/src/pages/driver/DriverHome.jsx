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

const VEHICLE_STATUSES = [
  {
    label: 'XE MÁY',
    available: 145,
    total: 300,
    Icon: Bike,
    color: 'orange'
  },
  {
    label: 'Ô TÔ',
    available: 42,
    total: 100,
    Icon: CarFront,
    color: 'blue'
  },
  {
    label: 'XE ĐIỆN',
    available: 12,
    total: 20,
    Icon: Zap,
    color: 'green'
  }
]

const QUICK_ACTIONS = [
  {
    title: 'Đặt chỗ đỗ xe',
    description: 'Giữ chỗ trước cho chuyến đi sắp tới',
    to: '/driver/booking',
    Icon: CalendarDays,
    variant: 'primary'
  },
  {
    title: 'Phiên gửi xe',
    description: 'Xem thời gian, vị trí và phí gửi xe',
    to: '/driver/session',
    Icon: Clock,
    iconClass: 'text-blue-500'
  },
  {
    title: 'Bảng giá',
    description: 'Xem phí gửi xe theo giờ hoặc theo ngày',
    to: '/driver/pricing',
    Icon: FileText,
    iconClass: 'text-indigo-500'
  },
  {
    title: 'Báo sự cố',
    description: 'Gửi báo cáo khi gặp vấn đề tại bãi xe',
    to: '/driver/report',
    Icon: AlertCircle,
    iconClass: 'text-red-500'
  }
]

const CURRENT_BOOKING = {
  code: 'BK-8829102',
  status: 'Đã xác nhận',
  time: '14:30, 24/10/2023',
  vehicleType: 'Ô tô 4-7 chỗ',
  plateNumber: '51K-123.45',
  slot: 'Tầng B2 / Khu C / Slot 102'
}

const ACTIVE_SESSION = {
  plateNumber: '51K-123.45',
  type: 'Đặt chỗ trước',
  sessionCode: 'SES-990123',
  bookingCode: 'BK-8829102',
  checkInTime: '14:35, 24/10/2023',
  slot: 'Tầng B2 / Khu C / Slot 102',
  estimatedFee: '45.000 VND',
  paymentStatus: 'Chưa thanh toán'
}

const COLOR_CLASSES = {
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
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
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
  const classes = COLOR_CLASSES[color] || COLOR_CLASSES.blue

  return (
    <div
      className={`flex items-center gap-4 rounded-xl border p-4 ${classes.border} ${classes.bg}`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${classes.iconBg} ${classes.iconText}`}
      >
        <Icon size={24} />
      </div>

      <div>
        <p className="mb-1 text-xs font-bold tracking-wider text-gray-500">
          {label}
        </p>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-gray-900">
            {available}
          </span>

          <span className="text-sm font-medium text-gray-400">
            / {total} còn trống
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
        className="group relative overflow-hidden rounded-2xl bg-blue-600 p-5 text-white shadow-md shadow-blue-200 transition-transform hover:-translate-y-1"
      >
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-xl transition-transform group-hover:scale-150" />

        <div className="relative z-10">
          <Icon className="mb-3" size={24} />

          <h3 className="mb-1 font-bold">
            {title}
          </h3>

          <p className="text-xs text-blue-100">
            {description}
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={to}
      className="group rounded-2xl border border-gray-100 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md"
    >
      <Icon
        className={`mb-3 transition-transform group-hover:scale-110 ${iconClass}`}
        size={24}
      />

      <h3 className="mb-1 font-bold text-gray-900">
        {title}
      </h3>

      <p className="text-xs text-gray-500">
        {description}
      </p>
    </Link>
  )
}

const InfoRow = ({ label, value, highlight = false, border = true }) => {
  return (
    <div
      className={`flex items-center justify-between gap-4 text-sm ${border ? 'border-b border-gray-50 pb-4' : ''
        }`}
    >
      <span className="text-gray-500">
        {label}
      </span>

      <span
        className={`text-right font-bold ${highlight ? 'text-blue-600' : 'text-gray-900'
          }`}
      >
        {value}
      </span>
    </div>
  )
}

const BookingCard = ({ booking }) => {
  return (
    <div className="flex h-full min-h-[430px] flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">
            Mã đặt chỗ
          </p>

          <h3 className="text-2xl font-black text-blue-600">
            {booking.code}
          </h3>
        </div>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
          {booking.status}
        </span>
      </div>

      <div className="flex-1 space-y-4">
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

      <Link
        to="/driver/booking-confirmation"
        className="mt-auto flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gray-50 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100"
      >
        Xem chi tiết đặt chỗ
        <ChevronRight size={16} />
      </Link>
    </div>
  )
}

const ActiveSessionCard = ({ session }) => {
  return (
    <div className="relative flex h-full min-h-[430px] flex-col overflow-hidden rounded-2xl border border-blue-200 bg-white p-6 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
      <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-blue-500" />

      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">
            Biển số đang gửi
          </p>

          <h3 className="text-2xl font-black text-gray-900">
            {session.plateNumber}
          </h3>
        </div>

        <div className="text-right">
          <p className="mb-1 text-xs font-medium text-gray-500">
            Loại phiên
          </p>

          <span className="text-sm font-bold text-gray-900">
            {session.type}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4 text-sm">
        <InfoRow label="Mã phiên" value={session.sessionCode} />
        <InfoRow label="Mã đặt chỗ liên kết" value={session.bookingCode} />
        <InfoRow label="Thời gian vào" value={session.checkInTime} />

        <InfoRow
          label="Vị trí hiện tại"
          value={session.slot}
          highlight
        />

        <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
          <span className="text-gray-500">
            Phí ước tính
          </span>

          <span className="text-right text-xl font-black text-blue-600">
            {session.estimatedFee}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-500">
            Trạng thái thanh toán
          </span>

          <span className="text-right font-bold text-gray-900">
            {session.paymentStatus}
          </span>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-gray-100 pt-5">
        <Link
          to="/driver/support"
          className="flex h-14 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Hỗ trợ
        </Link>

        <Link
          to="/driver/session"
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700"
        >
          Chi tiết phiên
          <ExternalLink size={16} />
        </Link>
      </div>
    </div>
  )
}

const DriverHome = () => {
  const { user } = useAuth()

  return (
    <div className="animate-in space-y-8 fade-in duration-500">
      {/* Welcome */}
      <section>
        <h1 className="text-2xl font-bold text-gray-900">
          Xin chào, {user?.fullName || 'Driver'}!
        </h1>

        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Chào mừng bạn quay trở lại. Đây là tình trạng bãi xe hiện tại.
          </p>

          <p className="w-fit rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-medium text-gray-400 shadow-sm">
            Đang hoạt động: 00:00 - 23:59
          </p>
        </div>
      </section>

      {/* Vehicle Status */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {VEHICLE_STATUSES.map((vehicle) => (
            <VehicleStatusCard
              key={vehicle.label}
              {...vehicle}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <Clock size={14} />

          <span>
            Dữ liệu được cập nhật gần nhất lúc{' '}
            <span className="font-medium">08:30:38</span>
          </span>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <SectionHeader title="Thao tác nhanh" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard
              key={action.title}
              {...action}
            />
          ))}
        </div>
      </section>

      {/* Booking & Session */}
      <section className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        <div className="flex flex-col">
          <SectionHeader
            icon={CalendarDays}
            title="Đặt chỗ hiện tại"
            actionText="Xem tất cả"
            actionTo="/driver/history"
          />

          <BookingCard booking={CURRENT_BOOKING} />
        </div>

        <div className="flex flex-col">
          <SectionHeader
            icon={Clock}
            title="Phiên gửi xe đang hoạt động"
            actionText="Xem lịch sử"
            actionTo="/driver/session"
          />

          <ActiveSessionCard session={ACTIVE_SESSION} />
        </div>
      </section>
    </div>
  )
}

export default DriverHome