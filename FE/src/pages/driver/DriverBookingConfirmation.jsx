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
  Download,
  Eye,
  ArrowRight,
  RefreshCcw
} from 'lucide-react'
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams
} from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import authorizeAxios from '../../utils/authorizeAxios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

const PARKING_INFO = {
  name: 'District 1 Parking Tower',
  address: '123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh'
}

const VEHICLE_LABELS = {
  car: 'Ô tô (4-7 chỗ)',
  bike: 'Xe máy',
  CAR: 'Ô tô',
  MOTO: 'Xe máy',
  MOTORBIKE: 'Xe máy',
  TRUCK: 'Xe tải'
}

const formatBackendDate = (value) => {
  if (!value) return null

  let text = String(value)

  if (text.endsWith('Z')) {
    text = text.slice(0, -1)
  }

  const date = new Date(text)

  if (Number.isNaN(date.getTime())) return null

  return date
}

const formatDate = (value) => {
  const date = formatBackendDate(value)

  if (!date) {
    if (!value) return '--/--/----'

    const [year, month, day] = String(value).split('-')

    if (year && month && day) {
      return `${day}/${month}/${year}`
    }

    return String(value)
  }

  return date.toLocaleDateString('vi-VN')
}

const formatTime = (value) => {
  const date = formatBackendDate(value)

  if (!date) {
    if (!value) return '--:--'
    return String(value).slice(0, 5)
  }

  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value || 0)
}

const getDurationLabel = (startTime, endTime, fallbackDuration) => {
  const start = formatBackendDate(startTime)
  const end = formatBackendDate(endTime)

  if (!start || !end) {
    if (fallbackDuration === '4h') return '4 Giờ 00 Phút'
    if (fallbackDuration === '8h') return '8 Giờ 00 Phút'
    if (fallbackDuration === '24h') return 'Cả ngày'
    return fallbackDuration || '--'
  }

  const diffMinutes = Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / 60000)
  )

  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60

  return `${hours} Giờ ${String(minutes).padStart(2, '0')} Phút`
}

const mapReservationToBooking = (reservation, stateBooking, user) => {
  if (!reservation && !stateBooking) return null

  const source = reservation || {}

  return {
    reservationId:
      source.ReservationID ||
      stateBooking?.reservationId ||
      stateBooking?.ReservationID,

    bookingCode:
      source.BookingCode ||
      stateBooking?.bookingCode ||
      stateBooking?.BookingCode,

    driverName:
      source.DriverName ||
      user?.fullName ||
      user?.FullName ||
      stateBooking?.driverName ||
      'Driver',

    parkingName:
      source.BuildingName ||
      stateBooking?.parkingName ||
      PARKING_INFO.name,

    address:
      source.Address ||
      stateBooking?.address ||
      PARKING_INFO.address,

    licensePlate:
      source.PlateNumber ||
      stateBooking?.licensePlate ||
      'Chưa check-in',

    vehicleType:
      source.VehicleCode ||
      stateBooking?.vehicleType ||
      source.VehicleName ||
      'car',

    vehicleName:
      source.VehicleName ||
      VEHICLE_LABELS[source.VehicleCode] ||
      VEHICLE_LABELS[stateBooking?.vehicleType] ||
      stateBooking?.vehicleType ||
      'Chưa cập nhật',

    bookingDate:
      source.ReservationDate ||
      stateBooking?.bookingDate,

    startTime:
      source.StartTime ||
      stateBooking?.startTime,

    endTime:
      source.EndTime ||
      stateBooking?.endTime,

    duration:
      stateBooking?.duration,

    floor:
      source.FloorName ||
      stateBooking?.floor ||
      '--',

    zone:
      source.ZoneName ||
      stateBooking?.zone ||
      '--',

    selectedSlot:
      source.SlotCode ||
      stateBooking?.selectedSlot ||
      '--',

    temporaryPrice:
      stateBooking?.temporaryPrice ||
      0,

    statusLabel:
      source.StatusLabel ||
      stateBooking?.statusLabel ||
      'Đang hoạt động',

    statusValue:
      source.StatusValue ||
      stateBooking?.statusValue ||
      'active',

    reservationStatus:
      source.ReservationStatus ||
      stateBooking?.reservationStatus
  }
}

const DriverBookingConfirmation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const reservationIdFromQuery = searchParams.get('reservationId')
  const reservationIdFromState = location.state?.reservationId
  const reservationId = reservationIdFromQuery || reservationIdFromState

  const [reservation, setReservation] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(reservationId))
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmModal, setConfirmModal] = useState({ isOpen: false })
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' })

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
    return mapReservationToBooking(reservation, location.state, user)
  }, [reservation, location.state, user])

  const bookingCode = booking?.bookingCode || 'Không có mã'

  const formattedDate = formatDate(booking?.startTime || booking?.bookingDate)
  const startTime = formatTime(booking?.startTime)
  const expiredTime = formatTime(booking?.endTime)

  const durationLabel = getDurationLabel(
    booking?.startTime,
    booking?.endTime,
    booking?.duration
  )

  const vehicleLabel =
    booking?.vehicleName ||
    VEHICLE_LABELS[booking?.vehicleType] ||
    booking?.vehicleType ||
    '--'

  const fullSlotName = `${booking?.floor || '--'} / Khu ${
    booking?.zone || '--'
  } / Slot ${booking?.selectedSlot || '--'}`

  const handleCopyBookingCode = async () => {
    try {
      await navigator.clipboard.writeText(bookingCode)
    } catch {
      // Clipboard may be blocked by browser permission.
    }
  }
  const handleCancelBooking = () => {
    if (!booking?.reservationId) {
      navigate('/driver/history')
      return
    }
    setConfirmModal({ isOpen: true })
  }

  const confirmCancel = async () => {
    setConfirmModal({ isOpen: false })
    try {
      await authorizeAxios.patch(`/reservations/${booking.reservationId}/cancel`)
      navigate('/driver/history')
    } catch (error) {
      console.error('Cancel reservation failed:', error)
      const message = error.response?.data?.message || 'Hủy đặt chỗ thất bại. Vui lòng thử lại.'
      setAlertModal({ isOpen: true, message })
    }
  }


  const handleViewSlotDetail = () => {
    navigate('/driver/session')
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

        <Button
          onClick={fetchReservationDetail}
          variant="danger"
          className="mt-4"
          icon={RefreshCcw}
        >
          Thử lại
        </Button>
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

        <div className="hidden sm:block">
          <span className="rounded-xl border border-green-100 bg-white px-4 py-2 text-sm font-bold text-green-700 shadow-sm">
            {booking.statusLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <h3 className="mb-6 flex items-center gap-2 text-base font-bold text-gray-900">
              <CalendarDays className="text-blue-500" size={20} />
              Thông tin chi tiết đặt chỗ
            </h3>

            <p className="mb-6 text-sm text-gray-500">
              Vui lòng xuất trình thông tin này khi đến bãi đỗ xe.
            </p>

            <div className="space-y-4">
              <DetailRow
                icon={<User size={16} />}
                label="Tên tài xế"
                value={booking.driverName}
                bold
              />

              <DetailRow
                icon={<Car size={16} />}
                label="Biển số xe"
                value={booking.licensePlate}
                bold
              />

              <DetailRow
                icon={<Car size={16} />}
                label="Loại phương tiện"
                value={vehicleLabel}
              />

              <DetailRow
                icon={<Building size={16} />}
                label="Tòa nhà đỗ xe"
                value={booking.parkingName}
              />

              <DetailRow
                icon={<MapPin size={16} />}
                label="Vị trí đỗ"
                value={fullSlotName}
                valueClassName="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 font-bold text-blue-600"
              />

              <DetailRow
                icon={<Clock size={16} />}
                label="Thời gian bắt đầu"
                value={`${startTime} - ${formattedDate}`}
                bold
              />

              <DetailRow
                icon={<Clock size={16} />}
                label="Thời gian dự kiến"
                value={durationLabel}
              />

              <DetailRow
                icon={<Clock size={16} />}
                label="Thời gian hết hạn"
                value={`${expiredTime} - ${formattedDate}`}
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
                Vui lòng check-in đúng thời gian đã đặt. Nếu bạn không vào bãi
                sau thời gian cho phép, vị trí có thể được giải phóng cho người khác.
              </NoteCard>

              <NoteCard
                icon={<ShieldCheck size={20} />}
                iconClassName="text-blue-500"
                className="border-blue-100 bg-blue-50/50"
                title="Quy trình vào cổng"
                titleClassName="text-blue-800"
                contentClassName="text-blue-700"
              >
                Khi đến bãi xe, bạn cung cấp biển số xe hoặc mã đặt chỗ cho
                nhân viên để được xác nhận và hướng dẫn vào đúng vị trí.
              </NoteCard>

              <NoteCard
                icon={<Ban size={20} />}
                iconClassName="text-gray-500"
                className="border-gray-200 bg-gray-50"
                title="Chính sách hủy"
                titleClassName="text-gray-700"
                contentClassName="text-gray-600"
              >
                Bạn có thể hủy đặt chỗ miễn phí trước 30 phút nếu booking chưa được check-in.
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
                {bookingCode}
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

            <div className="space-y-3">
              <Link
                to="/driver/history"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700"
              >
                <Eye size={16} />
                Xem danh sách của tôi
              </Link>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50"
              >
                <Download size={16} />
                Tải xuống vé PDF
              </button>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <MapPin size={20} />
            </div>

            <div>
              <h4 className="mb-1 text-sm font-bold text-gray-900">
                Vị trí bãi xe
              </h4>

              <p className="mb-2 text-xs leading-relaxed text-gray-500">
                {booking.address}
              </p>

              <Link
                to="#"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
              >
                Xem trên bản đồ <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] sm:left-64">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-500">
              Phiên bản hiện tại v2.4.0
            </p>
            <p className="text-xs text-gray-400">
              Parking Building Management System
            </p>
          </div>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <button
              type="button"
              onClick={handleCancelBooking}
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-50"
            >
              Hủy đặt chỗ này
            </button>

            <Link
              to="/driver/booking"
              className="flex-1 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-center text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 sm:flex-none"
            >
              Đặt thêm chỗ mới
            </Link>

            <button
              type="button"
              onClick={handleViewSlotDetail}
              className="flex-1 rounded-xl bg-blue-600 px-6 py-2.5 text-center text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700 sm:flex-none"
            >
              Xem chi tiết chỗ đỗ
            </button>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ isOpen: false })}
        title="Xác nhận hủy đặt chỗ"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModal({ isOpen: false })}>Quay lại</Button>
            <Button variant="danger" onClick={confirmCancel}>Xác nhận hủy</Button>
          </>
        }
      >
        <p className="text-gray-600">Bạn có chắc chắn muốn hủy đặt chỗ <span className="font-bold text-gray-900">{booking?.bookingCode}</span> không?</p>
        <p className="text-sm text-gray-500 mt-2">Lưu ý: Thao tác này không thể hoàn tác.</p>
      </Modal>

      <Modal 
        isOpen={alertModal.isOpen} 
        onClose={() => setAlertModal({ isOpen: false, message: '' })}
        title="Thông báo"
        footer={<Button variant="primary" onClick={() => setAlertModal({ isOpen: false, message: '' })}>Đóng</Button>}
      >
        <p className="text-gray-700">{alertModal.message}</p>
      </Modal>
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