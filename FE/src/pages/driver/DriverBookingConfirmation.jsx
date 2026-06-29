/**
 * FILE: DriverBookingConfirmation.jsx
 * MÔ TẢ: Trang Xác nhận Đặt chỗ thành công dành cho Driver.
 * Hiển thị thông tin chi tiết về booking vừa tạo (mã booking, biển số, ô đỗ, thời gian),
 * các lưu ý quan trọng và cung cấp chức năng Hủy đặt chỗ nếu cần.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'


// Map code xe → key i18n driver.vehicle.*  (thay cho VEHICLE_LABELS cứng)
const vehicleLabelKey = (code) => {
  const c = String(code || '').toUpperCase()
  if (c === 'CAR') return 'driver.vehicle.car'
  if (c === 'MOTO' || c === 'MOTORBIKE' || c === 'BIKE') return 'driver.vehicle.motorbike'
  if (c === 'TRUCK') return 'driver.vehicle.truck'
  return null
}

const STATUS_CLASSES = {
  active: 'border-green-100 bg-white dark:bg-slate-800 text-green-700 dark:text-green-400',
  used: 'border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300',
  expired: 'border-amber-100 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400',
  cancelled: 'border-red-100 bg-white dark:bg-slate-800 text-red-700 dark:text-red-400'
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

function calculateDurationLabel(startTimeText, endTimeText, t) {
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

  return t('driver.common.durationHM', { h: hours, m: String(minutes).padStart(2, '0') })
}

function mapReservationToBooking(reservation, stateBooking, t) {
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

  const vehicleCode =
    source.VehicleCode ||
    source.vehicleCode ||
    stateBooking?.vehicleType ||
    'CAR'

  const vKey = vehicleLabelKey(vehicleCode)

  return {
    reservationId,

    bookingCode:
      source.BookingCode ||
      source.bookingCode ||
      stateBooking?.bookingCode ||
      (reservationId
        ? `BK-${String(reservationId).padStart(4, '0')}`
        : t('driver.bookingConfirm.noCode')),

    driverName:
      source.DriverName ||
      source.driverName ||
      stateBooking?.driverName ||
      t('driver.bookingConfirm.defaultDriver'),

    parkingName:
      source.BuildingName ||
      source.buildingName ||
      stateBooking?.parkingName ||
      '--',

    address:
      source.Address ||
      source.address ||
      stateBooking?.address ||
      '--',

    licensePlate:
      source.PlateNumber ||
      source.plateNumber ||
      stateBooking?.licensePlate ||
      t('driver.bookingConfirm.notCheckedIn'),

    vehicleType: vehicleCode,

    vehicleName:
      source.VehicleName ||
      source.vehicleName ||
      stateBooking?.vehicleName ||
      (vKey ? t(vKey) : vehicleCode),

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

    durationLabel: calculateDurationLabel(startTimeText, endTimeText, t),

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
      '',

    reservationStatus:
      source.ReservationStatus ||
      source.reservationStatus ||
      stateBooking?.reservationStatus
  }
}

const DriverBookingConfirmation = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
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
        t('driver.bookingConfirm.loadFail')

      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadReservationDetail = async () => {
      if (!reservationId) return

      try {
        const response = await authorizeAxios.get(`/reservations/${reservationId}`)

        if (!cancelled) {
          setReservation(response.data?.data || null)
          setErrorMessage('')
        }
      } catch (error) {
        console.error('Get reservation detail failed:', error)

        const message =
          error.response?.data?.message ||
          t('driver.bookingConfirm.loadFail')

        if (!cancelled) {
          setErrorMessage(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadReservationDetail()

    return () => {
      cancelled = true
    }
  }, [reservationId, t])

  const booking = useMemo(() => {
    return mapReservationToBooking(reservation, location.state, t)
  }, [reservation, location.state, t])

  const statusClassName =
    STATUS_CLASSES[booking?.statusValue] || STATUS_CLASSES.active

  const canCancel = booking?.statusValue === 'active'

  const fullSlotName = t('driver.bookingConfirm.slotPattern', {
    floor: booking?.floor || '--',
    zone: booking?.zone || '--',
    slot: booking?.selectedSlot || '--'
  })

  const vKey = vehicleLabelKey(booking?.vehicleType)
  const vehicleLabel =
    booking?.vehicleName ||
    (vKey ? t(vKey) : booking?.vehicleType) ||
    '--'

  const handleCopyBookingCode = async () => {
    try {
      await navigator.clipboard.writeText(booking?.bookingCode || '')
    } catch {
      // ignore
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
      const message = error.response?.data?.message || t('driver.bookingConfirm.cancelFail')
      setAlertModal({ isOpen: true, message })
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-10 text-center shadow-sm">
        <p className="font-bold text-gray-700 dark:text-gray-300">
          {t('driver.bookingConfirm.loading')}
        </p>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 dark:bg-red-900/20 p-10 text-center shadow-sm">
        <p className="font-bold text-red-600">
          {errorMessage}
        </p>

        <Button
          onClick={fetchReservationDetail}
          variant="danger"
          className="mt-4"
          icon={RefreshCcw}
        >
          {t('driver.common.retry')}
        </Button>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-10 text-center shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {t('driver.bookingConfirm.noData')}
        </h2>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t('driver.bookingConfirm.noDataHint')}
        </p>

        <Link
          to="/driver/history"
          className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
        >
          {t('driver.bookingConfirm.backToHistory')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in pb-24 duration-500">
      <div className="mb-6 flex items-center gap-4 border-b border-gray-100 dark:border-slate-700/50 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('driver.bookingConfirm.title')}
        </h1>

        <div className="h-4 w-px bg-gray-300" />

        <div className="flex items-center gap-1.5 rounded-lg border border-gray-100 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-900/50 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
          <MapPin size={16} className="text-blue-500" />
          {booking.parkingName}
        </div>
      </div>

      <div className="mb-8 flex items-start justify-between gap-4 rounded-2xl border border-green-200 bg-green-50 dark:bg-green-900/20 p-5 sm:items-center">
        <div className="flex items-start gap-4 sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:text-green-400">
            <CheckCircle2 size={24} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-green-800">
              {t('driver.bookingConfirm.successBanner')}
            </h2>

            <p className="mt-1 text-sm text-green-700 dark:text-green-400">
              {t('driver.bookingConfirm.successBannerHint')}
            </p>
          </div>
        </div>

        {booking.statusLabel && (
          <span className={`rounded-xl border px-4 py-2 text-sm font-bold shadow-sm ${statusClassName}`}>
            {booking.statusLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-6 shadow-sm md:p-8">
            <h3 className="mb-6 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
              <CalendarDays className="text-blue-500" size={20} />
              {t('driver.bookingConfirm.detailTitle')}
            </h3>

            <div className="space-y-4">
              <DetailRow icon={<User size={16} />} label={t('driver.bookingConfirm.driverName')} value={booking.driverName} bold />
              <DetailRow icon={<Car size={16} />} label={t('driver.bookingConfirm.plate')} value={booking.licensePlate} bold />
              <DetailRow icon={<Car size={16} />} label={t('driver.bookingConfirm.vehicleType')} value={vehicleLabel} />
              <DetailRow icon={<Building size={16} />} label={t('driver.bookingConfirm.building')} value={booking.parkingName} />

              <DetailRow
                icon={<MapPin size={16} />}
                label={t('driver.bookingConfirm.slot')}
                value={fullSlotName}
                valueClassName="rounded-lg border border-blue-100 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 font-bold text-blue-600 dark:text-blue-400"
              />

              <DetailRow
                icon={<Clock size={16} />}
                label={t('driver.bookingConfirm.startTime')}
                value={`${booking.startClock} - ${booking.startDate}`}
                bold
              />

              <DetailRow
                icon={<Clock size={16} />}
                label={t('driver.bookingConfirm.estDuration')}
                value={booking.durationLabel}
              />

              <DetailRow
                icon={<Clock size={16} />}
                label={t('driver.bookingConfirm.expireTime')}
                value={`${booking.endClock} - ${booking.endDate}`}
                valueClassName="font-bold text-red-600"
                noBorder
              />
            </div>
          </div>

          <div>
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
              {t('driver.bookingConfirm.notesTitle')}
            </h3>

            <div className="space-y-4">
              <NoteCard
                icon={<AlertCircle size={20} />}
                iconClassName="text-orange-500"
                className="border-orange-100 bg-orange-50/50"
                title={t('driver.bookingConfirm.note1Title')}
                titleClassName="text-orange-800"
                contentClassName="text-orange-700"
              >
                {t('driver.bookingConfirm.note1Body')}
              </NoteCard>

              <NoteCard
                icon={<ShieldCheck size={20} />}
                iconClassName="text-blue-500"
                className="border-blue-100 bg-blue-50/50"
                title={t('driver.bookingConfirm.note2Title')}
                titleClassName="text-blue-800"
                contentClassName="text-blue-700 dark:text-blue-400"
              >
                {t('driver.bookingConfirm.note2Body')}
              </NoteCard>

              <NoteCard
                icon={<Ban size={20} />}
                iconClassName="text-gray-500 dark:text-gray-400"
                className="border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50"
                title={t('driver.bookingConfirm.note3Title')}
                titleClassName="text-gray-700 dark:text-gray-300"
                contentClassName="text-gray-600 dark:text-gray-400"
              >
                {t('driver.bookingConfirm.note3Body')}
              </NoteCard>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-blue-100 bg-white dark:bg-slate-800 p-6 text-center shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('driver.bookingConfirm.yourCode')}
            </p>

            <button
              type="button"
              onClick={handleCopyBookingCode}
              className="group relative mb-4 w-full overflow-hidden rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 py-4 transition-colors hover:bg-blue-100"
            >
              <h2 className="text-3xl font-black tracking-wider text-blue-600 dark:text-blue-400">
                {booking.bookingCode}
              </h2>

              <div className="absolute right-2 top-2 text-blue-400 opacity-0 transition-opacity group-hover:opacity-100">
                <Copy size={16} />
              </div>
            </button>

            <p className="mb-6 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {t('driver.bookingConfirm.codeHintPre')}{' '}
              <span className="font-bold text-gray-900 dark:text-white">
                {booking.licensePlate}
              </span>{' '}
              {t('driver.bookingConfirm.codeHintPost')}
            </p>

            <Link
              to="/driver/history"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700"
            >
              <Eye size={16} />
              {t('driver.bookingConfirm.viewBookingHistory')}
            </Link>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] sm:left-64">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Parking Building Management System
            </p>
            <p className="text-xs text-gray-400">
              {t('driver.bookingConfirm.footerSub')}
            </p>
          </div>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <button
              type="button"
              onClick={handleCancelBooking}
              disabled={!canCancel}
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 dark:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('driver.bookingConfirm.cancelThis')}
            </button>

            <Link
              to="/driver/booking"
              className="flex-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-2.5 text-center text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 sm:flex-none"
            >
              {t('driver.bookingConfirm.bookMore')}
            </Link>

            <Link
              to="/driver/session"
              className="flex-1 rounded-xl bg-blue-600 px-6 py-2.5 text-center text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700 sm:flex-none"
            >
              {t('driver.bookingConfirm.viewSession')}
            </Link>
          </div>
        </div>
      </div>

      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        title={t('driver.bookingConfirm.cancelModalTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModal({ isOpen: false })}>{t('common.back')}</Button>
            <Button variant="danger" onClick={confirmCancel}>{t('driver.bookingConfirm.confirmCancel')}</Button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">
          {t('driver.bookingConfirm.cancelConfirmPre')}{' '}
          <span className="font-bold text-gray-900 dark:text-white">{booking?.bookingCode}</span>{' '}
          {t('driver.bookingConfirm.cancelConfirmPost')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('driver.bookingConfirm.cancelConfirmNote')}</p>
      </Modal>

      <Modal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '' })}
        title={t('driver.bookingConfirm.alertTitle')}
        footer={<Button variant="primary" onClick={() => setAlertModal({ isOpen: false, message: '' })}>{t('driver.bookingConfirm.close')}</Button>}
      >
        <p className="text-gray-700 dark:text-gray-300">{alertModal.message}</p>
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
    ? 'font-bold text-gray-900 dark:text-white'
    : 'font-medium text-gray-900 dark:text-white'

  return (
    <div
      className={`flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-center ${noBorder ? '' : 'border-b border-gray-50'
      }`}
    >
      <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
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