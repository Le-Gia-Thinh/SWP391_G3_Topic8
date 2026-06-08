import React, { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  MapPin,
  User,
  Car,
  Building,
  Clock,
  CalendarDays,
  AlertCircle,
  ShieldCheck,
  Ban,
  Copy,
  Eye,
  RefreshCcw
} from 'lucide-react'
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams
} from 'react-router-dom'
import authorizeAxios from '../../utils/authorizeAxios'

const PARKING_INFO = {
  name: 'District 1 Parking Tower',
  address: '123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh'
}

const VEHICLE_LABELS = {
  CAR: 'Ô tô',
  MOTO: 'Xe máy',
  MOTORBIKE: 'Xe máy',
  TRUCK: 'Xe tải',
  car: 'Ô tô',
  bike: 'Xe máy'
}

const STATUS_CLASSES = {
  active: 'border-green-100 bg-white text-green-700',
  used: 'border-gray-100 bg-white text-gray-700',
  expired: 'border-amber-100 bg-white text-amber-700',
  cancelled: 'border-red-100 bg-white text-red-700'
}

function splitDateTimeText(value) {
  if (!value) {
    return {
      date: '--/--/----',
      time: '--:--',
      isoDate: ''
    }
  }

  const text = String(value).trim()
  const [datePart, timePart = ''] = text.split(' ')
  const [year, month, day] = datePart.split('-')

  return {
    date: year && month && day ? `${day}/${month}/${year}` : '--/--/----',
    time: timePart ? timePart.slice(0, 5) : '--:--',
    isoDate: year && month && day ? `${year}-${month}-${day}` : ''
  }
}

function calculateDurationLabel(startTimeText, endTimeText) {
  const start = splitDateTimeText(startTimeText)
  const end = splitDateTimeText(endTimeText)

  if (
    !start.isoDate ||
    !end.isoDate ||
    start.time === '--:--' ||
    end.time === '--:--'
  ) {
    return '--'
  }

  const startDate = new Date(`${start.isoDate}T${start.time}:00`)
  const endDate = new Date(`${end.isoDate}T${end.time}:00`)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return '--'
  }

  const diffMinutes = Math.max(
    0,
    Math.floor((endDate.getTime() - startDate.getTime()) / 60000)
  )

  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  return `${hours} Giờ ${String(minutes).padStart(2, '0')} Phút`
}

function mapReservationToBooking(reservation, stateBooking) {
  if (!reservation && !stateBooking) return null

  const source = reservation || {}

  const startTimeText =
    source.StartTimeText ||
    source.startTimeText ||
    stateBooking?.startTimeText ||
    null

  const endTimeText =
    source.EndTimeText ||
    source.endTimeText ||
    stateBooking?.endTimeText ||
    null

  const start = splitDateTimeText(startTimeText)
  const end = splitDateTimeText(endTimeText)

  const reservationId =
    source.ReservationID ||
    source.reservationId ||
    stateBooking?.reservationId

  return {
    reservationId,

    bookingCode:
      source.BookingCode ||
      source.bookingCode ||
      stateBooking?.bookingCode ||
      (reservationId
        ? `BK-${String(reservationId).padStart(4, '0')}`
        : 'Không có mã'),

    driverName:
      source.DriverName ||
      source.driverName ||
      stateBooking?.driverName ||
      'Driver',

    parkingName:
      source.BuildingName ||
      source.buildingName ||
      stateBooking?.parkingName ||
      PARKING_INFO.name,

    address:
      source.Address ||
      source.address ||
      stateBooking?.address ||
      PARKING_INFO.address,

    licensePlate:
      source.PlateNumber ||
      source.plateNumber ||
      stateBooking?.licensePlate ||
      'Chưa check-in',

    vehicleType:
      source.VehicleCode ||
      source.vehicleCode ||
      stateBooking?.vehicleType ||
      'CAR',

    vehicleName:
      source.VehicleName ||
      source.vehicleName ||
      stateBooking?.vehicleName ||
      VEHICLE_LABELS[source.VehicleCode] ||
      VEHICLE_LABELS[stateBooking?.vehicleType] ||
      'Ô tô',

    floor:
      source.FloorName ||
      source.floorName ||
      stateBooking?.floor ||
      '--',

    zone:
      source.ZoneName ||
      source.zoneName ||
      stateBooking?.zone ||
      '--',

    selectedSlot:
      source.SlotCode ||
      source.slotCode ||
      stateBooking?.selectedSlot ||
      '--',

    startTimeText,
    endTimeText,

    startClock:
      source.StartClockText ||
      source.startClockText ||
      stateBooking?.startClockText ||
      start.time,

    endClock:
      source.EndClockText ||
      source.endClockText ||
      stateBooking?.endClockText ||
      end.time,

    startDate: start.date,
    endDate: end.date,

    durationLabel: calculateDurationLabel(startTimeText, endTimeText),

    temporaryPrice: stateBooking?.temporaryPrice || 0,

    statusValue:
      source.StatusValue ||
      source.statusValue ||
      stateBooking?.statusValue ||
      'active',

    statusLabel:
      source.StatusLabel ||
      source.statusLabel ||
      stateBooking?.statusLabel ||
      'Đang hoạt động',

    reservationStatus:
      source.ReservationStatus ||
      source.reservationStatus ||
      stateBooking?.reservationStatus
  }
}

const DriverBookingConfirmation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const reservationIdFromQuery = searchParams.get('reservationId')
  const reservationIdFromState = location.state?.reservationId
  const reservationId = reservationIdFromQuery || reservationIdFromState

  const [reservation, setReservation] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(reservationId))
  const [errorMessage, setErrorMessage] = useState('')

  const fetchReservationDetail = async () => {
    if (!reservationId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setErrorMessage('')

      const response = await authorizeAxios.get(`/reservations/${reservationId}`)
      setReservation(response.data?.data || null)
    } catch (error) {
      console.error('Get reservation detail failed:', error)

      const message =
        error.response?.data?.message ||
        'Không thể tải chi tiết đặt chỗ. Vui lòng thử lại.'

      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReservationDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId])

  const booking = useMemo(() => {
    return mapReservationToBooking(reservation, location.state)
  }, [reservation, location.state])

  const statusClassName =
    STATUS_CLASSES[booking?.statusValue] || STATUS_CLASSES.active

  const canCancel = booking?.statusValue === 'active'

  const fullSlotName = `${booking?.floor || '--'} / Khu ${
    booking?.zone || '--'
  } / Slot ${booking?.selectedSlot || '--'}`

  const vehicleLabel =
    booking?.vehicleName ||
    VEHICLE_LABELS[booking?.vehicleType] ||
    booking?.vehicleType ||
    '--'

  const handleCopyBookingCode = async () => {
    try {
      await navigator.clipboard.writeText(booking?.bookingCode || '')
    } catch {
      // ignore
    }
  }

  const handleCancelBooking = async () => {
    if (!booking?.reservationId) {
      navigate('/driver/history')
      return
    }

    if (!canCancel) {
      alert('Chỉ có thể hủy booking đang hoạt động/chưa check-in.')
      return
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn hủy đặt chỗ ${booking.bookingCode} không?`
    )

    if (!confirmed) return

    try {
      await authorizeAxios.patch(`/reservations/${booking.reservationId}/cancel`)
      navigate('/driver/history')
    } catch (error) {
      console.error('Cancel reservation failed:', error)

      const message =
        error.response?.data?.message ||
        'Hủy đặt chỗ thất bại. Vui lòng thử lại.'

      alert(message)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <p className="font-bold text-gray-700">
          Đang tải chi tiết đặt chỗ...
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
          onClick={fetchReservationDetail}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          <RefreshCcw size={16} />
          Thử lại
        </button>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">
          Không có dữ liệu đặt chỗ
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Vui lòng quay lại lịch sử đặt chỗ để chọn một booking.
        </p>

        <Link
          to="/driver/history"
          className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
        >
          Về lịch sử đặt chỗ
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in pb-24 duration-500">
      <div className="mb-6 flex items-center gap-4 border-b border-gray-100 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Xác nhận đặt chỗ
        </h1>

        <div className="h-4 w-px bg-gray-300" />

        <div className="flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-500">
          <MapPin size={16} className="text-blue-500" />
          {booking.parkingName}
        </div>
      </div>

      <div className="mb-8 flex items-start justify-between gap-4 rounded-2xl border border-green-200 bg-green-50 p-5 sm:items-center">
        <div className="flex items-start gap-4 sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 size={24} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-green-800">
              Vị trí của bạn đã được giữ chỗ thành công!
            </h2>

            <p className="mt-1 text-sm text-green-700">
              Vui lòng kiểm tra thông tin chi tiết bên dưới.
            </p>
          </div>
        </div>

        <span className={`rounded-xl border px-4 py-2 text-sm font-bold shadow-sm ${statusClassName}`}>
          {booking.statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <h3 className="mb-6 flex items-center gap-2 text-base font-bold text-gray-900">
              <CalendarDays className="text-blue-500" size={20} />
              Thông tin chi tiết đặt chỗ
            </h3>

            <div className="space-y-4">
              <DetailRow icon={<User size={16} />} label="Tên tài xế" value={booking.driverName} bold />
              <DetailRow icon={<Car size={16} />} label="Biển số xe" value={booking.licensePlate} bold />
              <DetailRow icon={<Car size={16} />} label="Loại phương tiện" value={vehicleLabel} />
              <DetailRow icon={<Building size={16} />} label="Tòa nhà đỗ xe" value={booking.parkingName} />

              <DetailRow
                icon={<MapPin size={16} />}
                label="Vị trí đỗ"
                value={fullSlotName}
                valueClassName="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 font-bold text-blue-600"
              />

              <DetailRow
                icon={<Clock size={16} />}
                label="Thời gian bắt đầu"
                value={`${booking.startClock} - ${booking.startDate}`}
                bold
              />

              <DetailRow
                icon={<Clock size={16} />}
                label="Thời gian dự kiến"
                value={booking.durationLabel}
              />

              <DetailRow
                icon={<Clock size={16} />}
                label="Thời gian hết hạn"
                value={`${booking.endClock} - ${booking.endDate}`}
                valueClassName="font-bold text-red-600"
                noBorder
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
              Lưu ý quan trọng
            </h3>

            <div className="space-y-4">
              <NoteCard
                icon={<AlertCircle size={20} />}
                iconClassName="text-orange-500"
                className="border-orange-100 bg-orange-50/50"
                title="Thời gian hiệu lực"
                titleClassName="text-orange-800"
                contentClassName="text-orange-700"
              >
                Booking chỉ hết hạn khi thời gian hết hạn nhỏ hơn giờ hiện tại của SQL Server.
              </NoteCard>

              <NoteCard
                icon={<ShieldCheck size={20} />}
                iconClassName="text-blue-500"
                className="border-blue-100 bg-blue-50/50"
                title="Quy trình vào cổng"
                titleClassName="text-blue-800"
                contentClassName="text-blue-700"
              >
                Khi đến bãi xe, cung cấp biển số xe hoặc mã đặt chỗ cho nhân viên để được check-in.
              </NoteCard>

              <NoteCard
                icon={<Ban size={20} />}
                iconClassName="text-gray-500"
                className="border-gray-200 bg-gray-50"
                title="Chính sách hủy"
                titleClassName="text-gray-700"
                contentClassName="text-gray-600"
              >
                Bạn chỉ có thể hủy booking đang hoạt động và chưa được staff check-in.
              </NoteCard>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-blue-100 bg-white p-6 text-center shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              Mã đặt chỗ của bạn
            </p>

            <button
              type="button"
              onClick={handleCopyBookingCode}
              className="group relative mb-4 w-full overflow-hidden rounded-xl border border-blue-200 bg-blue-50 py-4 transition-colors hover:bg-blue-100"
            >
              <h2 className="text-3xl font-black tracking-wider text-blue-600">
                {booking.bookingCode}
              </h2>

              <div className="absolute right-2 top-2 text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
                <Copy size={16} />
              </div>
            </button>

            <p className="mb-6 text-xs leading-relaxed text-gray-500">
              Cung cấp biển số xe{' '}
              <span className="font-bold text-gray-900">
                {booking.licensePlate}
              </span>{' '}
              hoặc mã này cho nhân viên tại cổng vào.
            </p>

            <Link
              to="/driver/history"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700"
            >
              <Eye size={16} />
              Xem lịch sử đặt chỗ
            </Link>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] sm:left-64">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-500">
              Parking Building Management System
            </p>
            <p className="text-xs text-gray-400">
              Driver booking confirmation
            </p>
          </div>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <button
              type="button"
              onClick={handleCancelBooking}
              disabled={!canCancel}
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Hủy đặt chỗ này
            </button>

            <Link
              to="/driver/booking"
              className="flex-1 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-center text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 sm:flex-none"
            >
              Đặt thêm chỗ mới
            </Link>

            <Link
              to="/driver/session"
              className="flex-1 rounded-xl bg-blue-600 px-6 py-2.5 text-center text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700 sm:flex-none"
            >
              Xem phiên gửi hiện tại
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const DetailRow = ({
  icon,
  label,
  value,
  bold = false,
  valueClassName = '',
  noBorder = false
}) => {
  const defaultValueClass = bold
    ? 'font-bold text-gray-900'
    : 'font-medium text-gray-900'

  return (
    <div
      className={`flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center ${
        noBorder ? '' : 'border-b border-gray-50'
      }`}
    >
      <span className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {label}
      </span>

      <span className={valueClassName || defaultValueClass}>
        {value}
      </span>
    </div>
  )
}

const NoteCard = ({
  icon,
  iconClassName,
  className,
  title,
  titleClassName,
  contentClassName,
  children
}) => {
  return (
    <div className={`flex gap-3 rounded-xl border p-5 ${className}`}>
      <div className={`shrink-0 ${iconClassName}`}>
        {icon}
      </div>

      <div>
        <h4 className={`mb-1 text-sm font-bold ${titleClassName}`}>
          {title}
        </h4>

        <p className={`text-xs leading-relaxed ${contentClassName}`}>
          {children}
        </p>
      </div>
    </div>
  )
}

export default DriverBookingConfirmation