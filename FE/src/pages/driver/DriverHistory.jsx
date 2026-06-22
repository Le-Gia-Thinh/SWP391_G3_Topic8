import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Calendar,
  RefreshCcw,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  CreditCard,
  Car,
  Sparkles
} from 'lucide-react'
import { Link } from 'react-router-dom'
import authorizeAxios from '../../utils/authorizeAxios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'

const STATUS_BADGE_VARIANTS = {
  active: 'primary',
  used: 'default',
  expired: 'warning',
  cancelled: 'danger',
  Completed: 'success',
  Failed: 'danger',
  Pending: 'warning',
  Prepaid: 'primary'
}

const formatDate = (value) => {
  if (!value) return '--/--/----'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--/--/----'
  return date.toLocaleDateString('vi-VN')
}

const formatTime = (value) => {
  if (!value) return '--:--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getIsoDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const fmt = (n) =>
  n != null ? new Intl.NumberFormat('vi-VN').format(Number(n)) + ' VNĐ' : '--'

// Trả về key i18n + statusValue cho mỗi ReservationStatus
const getDisplayStatus = (item) => {
  const status = item.ReservationStatus || ''
  switch (status) {
    case 'Pending': return { statusLabelKey: 'driver.history.statusPending', statusValue: 'Pending' }
    case 'Prepaid': return { statusLabelKey: 'driver.history.statusPrepaid', statusValue: 'Prepaid' }
    case 'Reserved': return { statusLabelKey: 'driver.history.statusActive', statusValue: 'active' }
    case 'Completed': return { statusLabelKey: 'driver.history.statusUsed', statusValue: 'used' }
    case 'Cancelled': return { statusLabelKey: 'driver.history.statusCancelled', statusValue: 'cancelled' }
    default: return { statusLabelKey: 'driver.history.statusUnknown', statusValue: 'default' }
  }
}

const splitDateTimeText = (datetimeStr) => {
  if (!datetimeStr) return { time: '--:--', date: '--/--/----', isoDate: '' }
  try {
    const d = new Date(datetimeStr)
    if (isNaN(d.getTime())) return { time: '--:--', date: '--/--/----', isoDate: '' }
    return {
      time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      date: d.toLocaleDateString('vi-VN'),
      isoDate: d.toISOString().slice(0, 10)
    }
  } catch {
    return { time: '--:--', date: '--/--/----', isoDate: '' }
  }
}

// mapReservationToBooking nhận t để fallback các giá trị thiếu
const mapReservationToBooking = (item, t) => {
  const displayStatus = getDisplayStatus(item)
  const start = splitDateTimeText(item.StartTime || item.StartTimeText)
  const end = splitDateTimeText(item.EndTime || item.EndTimeText)

  return {
    id: item.BookingCode || `BK-${String(item.ReservationID).padStart(4, '0')}`,
    reservationId: item.ReservationID,
    building: item.BuildingName || t('driver.history.noBuilding'),
    vehicleType: item.VehicleName || t('driver.history.noVehicle'),
    vehicleTypeValue: item.VehicleCode || '',
    plate: item.PlateNumber || t('driver.history.noPlate'),
    floor: item.FloorName || '--',
    zone: item.ZoneName || '--',
    slot: item.SlotCode || '--',

    startTime: start.time,
    startDate: start.date,
    endTime: end.time,
    endDate: end.date,

    rawStartText: item.StartTime || item.StartTimeText,
    rawEndText: item.EndTime || item.EndTimeText,
    rawStartDate: start.isoDate,

    statusLabelKey: displayStatus.statusLabelKey,
    statusValue: displayStatus.statusValue,
    reservationStatus: item.ReservationStatus,
    raw: item
  }
}

const DriverHistory = () => {
  const { t } = useTranslation()

  const STATUS_OPTIONS = [
    { value: '', labelKey: 'driver.history.statusAll' },
    { value: 'active', labelKey: 'driver.history.statusActive' },
    { value: 'used', labelKey: 'driver.history.statusUsed' },
    { value: 'expired', labelKey: 'driver.history.statusExpired' },
    { value: 'cancelled', labelKey: 'driver.history.statusCancelled' }
  ]

  const VEHICLE_OPTIONS = [
    { value: '', labelKey: 'driver.history.vehicleAll' },
    { value: 'MOTO', labelKey: 'driver.history.vehicleMoto' },
    { value: 'MOTORBIKE', labelKey: 'driver.history.vehicleMoto' },
    { value: 'CAR', labelKey: 'driver.history.vehicleCar' },
    { value: 'TRUCK', labelKey: 'driver.history.vehicleTruck' }
  ]

  const [activeTab, setActiveTab] = useState('booking')

  // Booking State
  const [bookings, setBookings] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Payment State
  const [payments, setPayments] = useState([])

  const [isLoading, setIsLoading] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Modals state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, booking: null })
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' })

  const fetchReservations = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const response = await authorizeAxios.get('/reservations')
      const data = response.data?.data || []

      let mockData = data.map((item) => mapReservationToBooking(item, t))
      setBookings(mockData)
    } catch (error) {
      console.error('Get reservations failed:', error)
      const message = error.response?.data?.message || t('driver.history.loadBookingFail')
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const response = await authorizeAxios.get('/driver/payment/history', {
        params: { limit: 50, offset: 0 }
      })
      let data = response.data?.data || []
      setPayments(data)
    } catch (error) {
      console.error('Get payments failed:', error)
      const message = error.response?.data?.message || t('driver.history.loadPaymentFail')
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'booking') {
      fetchReservations()
    } else {
      fetchPayments()
    }
  }, [activeTab])

  const filteredBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    return bookings.filter((booking) => {
      const matchesSearch =
        !keyword ||
        booking.id.toLowerCase().includes(keyword) ||
        booking.plate.toLowerCase().includes(keyword) ||
        booking.building.toLowerCase().includes(keyword)
      const matchesStatus = !statusFilter || booking.statusValue === statusFilter
      const matchesVehicle = !vehicleFilter || booking.vehicleTypeValue === vehicleFilter
      const matchesDate = !dateFilter || getIsoDate(booking.rawStartDate) === dateFilter
      return matchesSearch && matchesStatus && matchesVehicle && matchesDate
    })
  }, [bookings, searchTerm, statusFilter, vehicleFilter, dateFilter])

  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setVehicleFilter('')
    setDateFilter('')
    fetchReservations()
  }

  const handleCancelBooking = (booking) => {
    if (!booking?.reservationId) {
      setAlertModal({ isOpen: true, message: t('driver.history.cancelNoCode') })
      return
    }
    setConfirmModal({ isOpen: true, booking })
  }

  const confirmCancel = async () => {
    const booking = confirmModal.booking
    setConfirmModal({ isOpen: false, booking: null })
    if (!booking) return

    try {
      setIsCancelling(true)
      await authorizeAxios.patch(`/reservations/${booking.reservationId}/cancel`)
      await fetchReservations()
      setAlertModal({ isOpen: true, message: t('driver.history.cancelSuccess', { code: booking.id }) })
    } catch (error) {
      console.error('Cancel reservation failed:', error)
      setAlertModal({ isOpen: true, message: error.response?.data?.message || t('driver.history.cancelFail') })
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] shadow-sm border border-slate-200 dark:border-slate-700/60">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-blue-500">{t('driver.history.eyebrow')}</p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('driver.history.title')}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold bg-linear-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
            {t('driver.history.subtitle')}
          </p>
        </div>

        <Link
          to="/driver/booking"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
        >
          <span className="text-lg leading-none mb-0.5">+</span> {t('driver.history.newBooking')}
        </Link>
      </div>

      <div className="rounded-[1.5rem] bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700/60 p-6 hover:border-blue-200 transition-colors">
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
          <button
            onClick={() => setActiveTab('booking')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'booking' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Car size={18} /> {t('driver.history.tabBooking')}
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'payment' ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <CreditCard size={18} /> {t('driver.history.tabPayment')}
          </button>
        </div>

        {activeTab === 'booking' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.search')}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('driver.history.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-9 pr-4 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.status')}</label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value || 'all-status'} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.vehicleType')}</label>
                <select
                  value={vehicleFilter}
                  onChange={(event) => setVehicleFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                  {VEHICLE_OPTIONS.map((option) => (
                    <option key={option.value || 'all-vehicle'} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 transition-all hover:bg-slate-100 active:scale-95"
                >
                  <RefreshCcw size={16} /> {t('driver.history.refresh')}
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 relative">
              <div className="overflow-x-auto overflow-y-auto max-h-[320px]">
                <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.colCode')}</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.colBuilding')}</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.colPlate')}</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.colTime')}</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.colStatus')}</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">{t('driver.history.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-slate-500 dark:text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/30">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600"></div>
                            <span>{t('driver.history.loading')}</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-slate-500 dark:text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/30">{t('driver.history.noData')}</td>
                      </tr>
                    ) : (
                      filteredBookings.map((booking) => (
                        <tr key={booking.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/80 group">
                          <td className="px-5 py-4 font-black text-blue-600 dark:text-blue-400">{booking.id}</td>
                          <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">{booking.building}</td>
                          <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                            <span className="inline-block rounded bg-slate-100 dark:bg-slate-800 px-2 py-1 text-sm border border-slate-200 dark:border-slate-700">{booking.plate}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="rounded-lg bg-blue-50/80 p-2 text-blue-600 dark:text-blue-400 border border-blue-100">
                                <Calendar size={14} className="stroke-[2.5]" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-white">{booking.startTime}</span>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{booking.startDate}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={STATUS_BADGE_VARIANTS[booking.statusValue] || 'default'}>
                              {t(booking.statusLabelKey)}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-3">
                              {booking.statusValue === 'active' && (
                                <button
                                  disabled={isCancelling}
                                  onClick={() => handleCancelBooking(booking)}
                                  className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                  {t('driver.history.cancel')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 relative">
              <div className="overflow-x-auto overflow-y-auto max-h-[320px]">
                <table className="min-w-full text-left text-sm text-slate-600 dark:text-slate-400">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.colTxId')}</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.colPlate')}</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.colTime')}</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.colAmount')}</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.colMethod')}</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('driver.history.colStatus')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-slate-500 dark:text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/30">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600"></div>
                            <span>{t('driver.history.loading')}</span>
                          </div>
                        </td>
                      </tr>
                    ) : payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-slate-500 dark:text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900/30">{t('driver.history.noPayment')}</td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr key={payment.PaymentID} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/80">
                          <td className="px-5 py-4 font-black text-slate-800 dark:text-slate-200">#{String(payment.PaymentID || '').slice(-6) || 'N/A'}</td>
                          <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                            <span className="inline-block rounded bg-slate-100 dark:bg-slate-800 px-2 py-1 text-sm border border-slate-200 dark:border-slate-700">{payment.PlateNumber}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="rounded-lg bg-blue-50/80 p-2 text-blue-600 dark:text-blue-400 border border-blue-100">
                                <Calendar size={14} className="stroke-[2.5]" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-white">{formatTime(payment.PaymentTime)}</span>
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{formatDate(payment.PaymentTime)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-black text-blue-600 dark:text-blue-400">{fmt(payment.Amount)}</td>
                          <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">{payment.PaymentMethod || '--'}</td>
                          <td className="px-5 py-4">
                            <Badge variant={STATUS_BADGE_VARIANTS[payment.PaymentStatus] || 'default'}>
                              {payment.PaymentStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, booking: null })}
        title={t('driver.history.cancelModalTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModal({ isOpen: false, booking: null })}>{t('driver.history.back')}</Button>
            <Button variant="danger" onClick={confirmCancel} isLoading={isCancelling}>{t('driver.history.confirmCancel')}</Button>
          </>
        }
      >
        <p className="text-slate-600 dark:text-slate-400">{t('driver.history.cancelConfirmPre')} <span className="font-bold text-slate-900 dark:text-white">{confirmModal.booking?.id}</span> {t('driver.history.cancelConfirmPost')}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{t('driver.history.cancelConfirmHint')}</p>
      </Modal>

      <Modal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '' })}
        title={t('driver.history.alertTitle')}
        footer={<Button variant="primary" onClick={() => setAlertModal({ isOpen: false, message: '' })}>{t('driver.history.close')}</Button>}
      >
        <p className="text-slate-700 dark:text-slate-300 font-medium">{alertModal.message}</p>
      </Modal>
    </div>
  )
}

export default DriverHistory