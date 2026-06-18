import React, { useEffect, useMemo, useState, useCallback } from 'react'
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

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'used', label: 'Đã sử dụng' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'cancelled', label: 'Đã hủy' }
]

const VEHICLE_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'MOTO', label: 'Xe máy' },
  { value: 'MOTORBIKE', label: 'Xe máy' },
  { value: 'CAR', label: 'Ô tô' },
  { value: 'TRUCK', label: 'Xe tải' }
]

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

const getDisplayStatus = (item) => {
  const status = item.ReservationStatus || ''
  switch (status) {
    case 'Pending': return { statusLabel: 'Chờ thanh toán', statusValue: 'Pending' }
    case 'Prepaid': return { statusLabel: 'Đã trả trước', statusValue: 'Prepaid' }
    case 'Reserved': return { statusLabel: 'Đã đặt', statusValue: 'active' }
    case 'Completed': return { statusLabel: 'Đã sử dụng', statusValue: 'used' }
    case 'Cancelled': return { statusLabel: 'Đã hủy', statusValue: 'cancelled' }
    default: return { statusLabel: status || 'Không xác định', statusValue: 'default' }
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

const mapReservationToBooking = (item) => {
  const displayStatus = getDisplayStatus(item)
  const start = splitDateTimeText(item.StartTime || item.StartTimeText)
  const end = splitDateTimeText(item.EndTime || item.EndTimeText)

  return {
    id: item.BookingCode || `BK-${String(item.ReservationID).padStart(4, '0')}`,
    reservationId: item.ReservationID,
    building: item.BuildingName || 'Chưa có tòa nhà',
    vehicleType: item.VehicleName || 'Chưa có loại xe',
    vehicleTypeValue: item.VehicleCode || '',
    plate: item.PlateNumber || 'Chưa check-in',
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

    status: displayStatus.statusLabel,
    statusValue: displayStatus.statusValue,
    reservationStatus: item.ReservationStatus,
    raw: item
  }
}

const DriverHistory = () => {
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

      let mockData = data.map(mapReservationToBooking)
      setBookings(mockData)
    } catch (error) {
      console.error('Get reservations failed:', error)
      const message = error.response?.data?.message || 'Không thể tải lịch sử đặt chỗ.'
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
      const message = error.response?.data?.message || 'Không thể tải lịch sử thanh toán.'
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
      setAlertModal({ isOpen: true, message: 'Không tìm thấy mã đặt chỗ để hủy.' })
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
      setAlertModal({ isOpen: true, message: `Đã hủy đặt chỗ ${booking.id} thành công.` })
    } catch (error) {
      console.error('Cancel reservation failed:', error)
      setAlertModal({ isOpen: true, message: error.response?.data?.message || 'Hủy đặt chỗ thất bại. Vui lòng thử lại.' })
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-200/60">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-blue-500">Quản lý cá nhân</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Lịch sử hoạt động
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold bg-linear-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
            Theo dõi các lượt đặt chỗ và thanh toán của bạn.
          </p>
        </div>

        <Link
          to="/driver/booking"
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
        >
          <span className="text-lg leading-none mb-0.5">+</span> Đặt chỗ mới
        </Link>
      </div>

      <div className="rounded-[1.5rem] bg-white shadow-sm border border-slate-200/60 p-6 hover:border-blue-200 transition-colors">
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('booking')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'booking' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Car size={18} /> Lịch sử đặt chỗ
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'payment' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <CreditCard size={18} /> Lịch sử thanh toán
          </button>
        </div>

        {activeTab === 'booking' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Mã đặt chỗ, biển số..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value || 'all-status'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Loại xe</label>
                <select
                  value={vehicleFilter}
                  onChange={(event) => setVehicleFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                  {VEHICLE_OPTIONS.map((option) => (
                    <option key={option.value || 'all-vehicle'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100 active:scale-95"
                >
                  <RefreshCcw size={16} /> Làm mới
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white relative">
              <div className="overflow-x-auto overflow-y-auto max-h-[320px]">
                <table className="min-w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Mã đặt chỗ</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Tòa nhà</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Biển số</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Thời gian đặt</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-slate-500 font-bold bg-slate-50/50">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                            <span>Đang tải dữ liệu...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-slate-500 font-bold bg-slate-50/50">Không có dữ liệu</td>
                      </tr>
                    ) : (
                      filteredBookings.map((booking) => (
                        <tr key={booking.id} className="transition-colors hover:bg-slate-50/80 group">
                          <td className="px-5 py-4 font-black text-blue-600">{booking.id}</td>
                          <td className="px-5 py-4 font-bold text-slate-800">{booking.building}</td>
                          <td className="px-5 py-4 font-bold text-slate-800">
                            <span className="inline-block rounded bg-slate-100 px-2 py-1 text-sm border border-slate-200">{booking.plate}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="rounded-lg bg-blue-50/80 p-2 text-blue-600 border border-blue-100">
                                <Calendar size={14} className="stroke-[2.5]" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{booking.startTime}</span>
                                <span className="text-[11px] font-semibold text-slate-500">{booking.startDate}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant={STATUS_BADGE_VARIANTS[booking.statusValue] || 'default'}>
                              {booking.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-3">
                              {booking.statusValue === 'active' && (
                                <button
                                  disabled={isCancelling}
                                  onClick={() => handleCancelBooking(booking)}
                                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
                                >
                                  Hủy bỏ
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
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white relative">
              <div className="overflow-x-auto overflow-y-auto max-h-[320px]">
                <table className="min-w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Mã GD</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Biển số</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Thời gian</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Số tiền</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Phương thức</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-slate-500 font-bold bg-slate-50/50">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                            <span>Đang tải dữ liệu...</span>
                          </div>
                        </td>
                      </tr>
                    ) : payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-slate-500 font-bold bg-slate-50/50">Không có giao dịch nào</td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr key={payment.PaymentID} className="transition-colors hover:bg-slate-50/80">
                          <td className="px-5 py-4 font-black text-slate-800">#{String(payment.PaymentID || '').slice(-6) || 'N/A'}</td>
                          <td className="px-5 py-4 font-bold text-slate-800">
                            <span className="inline-block rounded bg-slate-100 px-2 py-1 text-sm border border-slate-200">{payment.PlateNumber}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="rounded-lg bg-blue-50/80 p-2 text-blue-600 border border-blue-100">
                                <Calendar size={14} className="stroke-[2.5]" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900">{formatTime(payment.PaymentTime)}</span>
                                <span className="text-[11px] font-semibold text-slate-500">{formatDate(payment.PaymentTime)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-black text-blue-600">{fmt(payment.Amount)}</td>
                          <td className="px-5 py-4 font-bold text-slate-700">{payment.PaymentMethod || '--'}</td>
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
        title="Xác nhận hủy đặt chỗ"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModal({ isOpen: false, booking: null })}>Quay lại</Button>
            <Button variant="danger" onClick={confirmCancel} isLoading={isCancelling}>Xác nhận hủy</Button>
          </>
        }
      >
        <p className="text-slate-600">Bạn có chắc chắn muốn hủy đặt chỗ <span className="font-bold text-slate-900">{confirmModal.booking?.id}</span> không?</p>
        <p className="text-sm text-slate-500 mt-2">Lưu ý: Thao tác này không thể hoàn tác.</p>
      </Modal>

      <Modal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '' })}
        title="Thông báo"
        footer={<Button variant="primary" onClick={() => setAlertModal({ isOpen: false, message: '' })}>Đóng</Button>}
      >
        <p className="text-slate-700 font-medium">{alertModal.message}</p>
      </Modal>
    </div>
  )
}

export default DriverHistory