import React, { useEffect, useMemo, useState } from 'react'
import {
  Bike,
  CarFront,
  Truck,
  Clock,
  CalendarDays,
  FileText,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  RefreshCcw,
  Info
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import authorizeAxios from '../../utils/authorizeAxios'

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
    title: 'Lịch sử đặt chỗ',
    description: 'Xem các booking đã tạo',
    to: '/driver/history',
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

const formatDateTime = (value) => {
  if (!value) return '--'

  const date = new Date(String(value).endsWith('Z') ? String(value).slice(0, -1) : value)

  if (Number.isNaN(date.getTime())) return '--'

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatCurrency = (value) => {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VNĐ`
}

const getVehicleIconAndColor = (vehicleCode, vehicleName) => {
  const text = `${vehicleCode || ''} ${vehicleName || ''}`.toLowerCase()

  if (text.includes('moto') || text.includes('bike') || text.includes('máy')) {
    return {
      Icon: Bike,
      color: 'orange'
    }
  }

  if (text.includes('truck') || text.includes('tải')) {
    return {
      Icon: Truck,
      color: 'green'
    }
  }

  return {
    Icon: CarFront,
    color: 'blue'
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

const VehicleStatusCard = ({ vehicle }) => {
  const { Icon, color } = getVehicleIconAndColor(
    vehicle.VehicleCode,
    vehicle.VehicleName
  )

  const classes = COLOR_CLASSES[color] || COLOR_CLASSES.blue
  const available = Number(vehicle.AvailableSlots || 0)
  const total = Number(vehicle.TotalSlots || 0)

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
          {(vehicle.VehicleName || 'Phương tiện').toUpperCase()}
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
      className={`flex items-center justify-between gap-4 text-sm ${
        border ? 'border-b border-gray-50 pb-4' : ''
      }`}
    >
      <span className="text-gray-500">
        {label}
      </span>

      <span
        className={`text-right font-bold ${
          highlight ? 'text-blue-600' : 'text-gray-900'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

const BookingCard = ({ booking }) => {
  if (!booking) {
    return (
      <EmptyCard
        title="Chưa có đặt chỗ đang hoạt động"
        description="Bạn có thể tạo đặt chỗ mới để giữ vị trí trước khi đến bãi."
        actionText="Đặt chỗ mới"
        actionTo="/driver/booking"
      />
    )
  }

  const slotText = `${booking.FloorName || '--'} / Khu ${
    booking.ZoneName || '--'
  } / Slot ${booking.SlotCode || '--'}`

  return (
    <div className="flex h-full min-h-[430px] flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">
            Mã đặt chỗ
          </p>

          <h3 className="text-2xl font-black text-blue-600">
            {booking.BookingCode}
          </h3>
        </div>

        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
          Đang hoạt động
        </span>
      </div>

      <div className="flex-1 space-y-4">
        <InfoRow label="Thời gian bắt đầu" value={formatDateTime(booking.StartTime)} />
        <InfoRow label="Thời gian kết thúc" value={formatDateTime(booking.EndTime)} />
        <InfoRow label="Loại phương tiện" value={booking.VehicleName || '--'} />
        <InfoRow
          label="Vị trí chỉ định"
          value={slotText}
          highlight
          border={false}
        />
      </div>

      <Link
        to="/driver/booking-confirmation"
        state={{
          reservationId: booking.ReservationID,
          bookingCode: booking.BookingCode,
          parkingName: booking.BuildingName,
          vehicleType: booking.VehicleCode,
          bookingDate: booking.ReservationDate,
          startTime: booking.StartTime,
          floor: booking.FloorName,
          zone: booking.ZoneName,
          selectedSlot: booking.SlotCode
        }}
        className="mt-auto flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gray-50 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100"
      >
        Xem chi tiết đặt chỗ
        <ChevronRight size={16} />
      </Link>
    </div>
  )
}

const ActiveSessionCard = ({ session }) => {
  if (!session) {
    return (
      <EmptyCard
        title="Chưa có phiên gửi xe hiện tại"
        description="Phiên gửi xe sẽ xuất hiện sau khi Staff check-in xe vào bãi."
        actionText="Xem phiên gửi xe"
        actionTo="/driver/session"
      />
    )
  }

  const slotText = `${session.FloorName || '--'} / Khu ${
    session.ZoneName || '--'
  } / Slot ${session.SlotCode || '--'}`

  return (
    <div className="relative flex h-full min-h-[430px] flex-col overflow-hidden rounded-2xl border border-blue-200 bg-white p-6 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
      <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-blue-500" />

      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">
            Biển số đang gửi
          </p>

          <h3 className="text-2xl font-black text-gray-900">
            {session.PlateNumber || '--'}
          </h3>
        </div>

        <div className="text-right">
          <p className="mb-1 text-xs font-medium text-gray-500">
            Loại phiên
          </p>

          <span className="text-sm font-bold text-gray-900">
            {session.BookingCode ? 'Đặt chỗ trước' : 'Vãng lai'}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4 text-sm">
        <InfoRow label="Mã phiên" value={session.SessionCode || `SESS-${session.SessionID}`} />
        <InfoRow label="Mã đặt chỗ liên kết" value={session.BookingCode || 'Không có'} />
        <InfoRow label="Thời gian vào" value={formatDateTime(session.EntryTime)} />

        <InfoRow
          label="Vị trí hiện tại"
          value={slotText}
          highlight
        />

        <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
          <span className="text-gray-500">
            Phí ước tính
          </span>

          <span className="text-right text-xl font-black text-blue-600">
            {formatCurrency(session.Amount)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-500">
            Trạng thái thanh toán
          </span>

          <span className="text-right font-bold text-gray-900">
            {session.PaymentStatus || 'Pending'}
          </span>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-gray-100 pt-5">
        <Link
          to="/driver/report"
          className="flex h-14 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Báo sự cố
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

const EmptyCard = ({ title, description, actionText, actionTo }) => {
  return (
    <div className="flex h-full min-h-[430px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-500">
        <Info size={26} />
      </div>

      <h3 className="text-base font-bold text-gray-900">
        {title}
      </h3>

      <p className="mt-2 max-w-xs text-sm text-gray-500">
        {description}
      </p>

      <Link
        to={actionTo}
        className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700"
      >
        {actionText}
      </Link>
    </div>
  )
}

const DriverHome = () => {
  const { user } = useAuth()

  const [homeData, setHomeData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fetchHomeData = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')

      const response = await authorizeAxios.get('/driver/home')
      setHomeData(response.data?.data || null)
    } catch (error) {
      console.error('Get driver home failed:', error)

      const message =
        error.response?.data?.message ||
        'Không thể tải dữ liệu trang chủ. Vui lòng thử lại.'

      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHomeData()
  }, [])

  const slotSummary = homeData?.slotSummary || []
  const bookingSummary = homeData?.bookingSummary || {}

  const displayName =
    homeData?.user?.FullName ||
    user?.fullName ||
    user?.FullName ||
    'Driver'

  const updatedAt = useMemo(() => {
    return formatDateTime(homeData?.serverTime || new Date())
  }, [homeData?.serverTime])

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <p className="font-bold text-gray-700">
          Đang tải dữ liệu trang chủ...
        </p>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center shadow-sm">
        <p className="font-bold text-red-600">
          {errorMessage}
        </p>

        <button
          type="button"
          onClick={fetchHomeData}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          <RefreshCcw size={16} />
          Thử lại
        </button>
      </div>
    )
  }

  return (
    <div className="animate-in space-y-8 fade-in duration-500">
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Xin chào, {displayName}!
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Chào mừng bạn quay trở lại. Đây là tình trạng bãi xe hiện tại.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchHomeData}
            className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            <RefreshCcw size={16} />
            Làm mới
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryMiniCard
          label="Tổng booking"
          value={bookingSummary.TotalBookings || 0}
        />

        <SummaryMiniCard
          label="Đang hoạt động"
          value={bookingSummary.ActiveBookings || 0}
        />

        <SummaryMiniCard
          label="Đã sử dụng"
          value={bookingSummary.CompletedBookings || 0}
        />

        <SummaryMiniCard
          label="Đã hủy / hết hạn"
          value={
            Number(bookingSummary.CancelledBookings || 0) +
            Number(bookingSummary.ExpiredBookings || 0)
          }
        />
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {slotSummary.length > 0 ? (
            slotSummary.map((vehicle) => (
              <VehicleStatusCard
                key={vehicle.VehicleTypeID}
                vehicle={vehicle}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-sm text-gray-500">
              Chưa có dữ liệu vị trí đỗ.
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <Clock size={14} />

          <span>
            Dữ liệu được cập nhật gần nhất lúc{' '}
            <span className="font-medium">{updatedAt}</span>
          </span>
        </div>
      </section>

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

      <section className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        <div className="flex flex-col">
          <SectionHeader
            icon={CalendarDays}
            title="Đặt chỗ hiện tại"
            actionText="Xem tất cả"
            actionTo="/driver/history"
          />

          <BookingCard booking={homeData?.currentBooking} />
        </div>

        <div className="flex flex-col">
          <SectionHeader
            icon={Clock}
            title="Phiên gửi xe đang hoạt động"
            actionText="Xem chi tiết"
            actionTo="/driver/session"
          />

          <ActiveSessionCard session={homeData?.currentSession} />
        </div>
      </section>
    </div>
  )
}

const SummaryMiniCard = ({ label, value }) => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-gray-900">
        {value}
      </p>
    </div>
  )
}

export default DriverHome