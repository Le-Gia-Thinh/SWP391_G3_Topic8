import React, { useMemo, useState } from 'react'
import {
  CalendarDays,
  MapPin,
  Car,
  Clock,
  Info,
  CheckCircle2,
  Building,
  CreditCard,
  AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CustomSelect from '../../components/ui/Select'
import CustomCheckbox from '../../components/ui/Checkbox'
import authorizeAxios from '../../utils/authorizeAxios'

const FLOORS = [
  { value: 'B1', label: 'Tầng hầm B1' },
  { value: 'B2', label: 'Tầng hầm B2' }
]

const ZONES = [
  { value: 'A', label: 'Khu A - Gần cổng' },
  { value: 'B', label: 'Khu B - Sâu bên trong' }
]

const VEHICLE_TYPES = [
  { value: 'car', label: 'Ô tô (4-7 chỗ)' },
  { value: 'bike', label: 'Xe máy' }
]

const DURATIONS = [
  { value: '4h', label: '4 Giờ', price: 60000 },
  { value: '8h', label: '8 Giờ', price: 100000 },
  { value: '24h', label: 'Cả ngày', price: 180000 }
]

const OCCUPIED_SLOTS = [
  'A-03',
  'A-07',
  'A-08',
  'B-02',
  'B-05',
  'B-09',
  'C-01',
  'C-06',
  'C-10'
]

const PARKING_INFO = {
  name: 'District 1 Parking Tower',
  shortName: 'D1 Parking Tower',
  address: '123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
  gate: 'Cổng A - Lối vào chính'
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value)
}

const getOptionLabel = (options, value) => {
  return options.find((option) => option.value === value)?.label || value
}

const DriverBooking = () => {
  const navigate = useNavigate()

  const [selectedSlot, setSelectedSlot] = useState('A-09')
  const [licensePlate, setLicensePlate] = useState('51K-123.45')
  const [vehicleType, setVehicleType] = useState('car')
  const [bookingDate, setBookingDate] = useState('2026-06-03')
  const [startTime, setStartTime] = useState('08:30')
  const [duration, setDuration] = useState('4h')
  const [floor, setFloor] = useState('B1')
  const [zone, setZone] = useState('A')
  const [autoSelect, setAutoSelect] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const slots = useMemo(() => {
    return Array.from({ length: 30 }, (_, index) => {
      const row = index < 10 ? 'A' : index < 20 ? 'B' : 'C'
      const number = (index % 10) + 1
      const id = `${row}-${number.toString().padStart(2, '0')}`

      if (OCCUPIED_SLOTS.includes(id)) {
        return { id, status: 'occupied' }
      }

      if (id === selectedSlot) {
        return { id, status: 'selected' }
      }

      return { id, status: 'available' }
    })
  }, [selectedSlot])

  const selectedDuration = DURATIONS.find((item) => item.value === duration)
  const temporaryPrice = selectedDuration?.price || 0

  const vehicleTypeLabel = getOptionLabel(VEHICLE_TYPES, vehicleType)
  const durationLabel = getOptionLabel(DURATIONS, duration)

  const handleSelectSlot = (slot) => {
    if (slot.status === 'occupied') return

    setSelectedSlot(slot.id)
    setAutoSelect(false)
  }

  const handleBooking = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!licensePlate.trim()) {
      setErrorMessage('Vui lòng nhập biển số xe.')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await authorizeAxios.post('/reservations', {
        vehicleType,
        licensePlate: licensePlate.trim().toUpperCase(),
        bookingDate,
        startTime,
        duration,
        buildingId: 1
      })

      const reservation = response.data?.data?.reservation

      const bookingData = {
        parkingName: reservation?.BuildingName || PARKING_INFO.name,
        licensePlate: licensePlate.trim().toUpperCase(),
        vehicleType,
        bookingDate,
        startTime,
        duration,
        floor: reservation?.FloorName || floor,
        zone: reservation?.ZoneName || zone,
        selectedSlot: reservation?.SlotCode || selectedSlot,
        temporaryPrice,
        reservationId: reservation?.ReservationID,
        bookingCode: reservation?.BookingCode,
        slotId: reservation?.SlotID
      }

      navigate(`/driver/booking-confirmation?reservationId=${reservation?.ReservationID}`,
        {
          state: bookingData
        }
      )
    } catch (error) {
      console.error('Create booking failed:', error)

      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        'Đặt chỗ thất bại. Vui lòng thử lại.'

      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/driver/home')
  }

  return (
    <form
      onSubmit={handleBooking}
      className="mx-auto max-w-6xl animate-in fade-in duration-500"
    >
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Đặt chỗ đỗ xe mới
        </h1>
        <p className="text-sm text-gray-500">
          Vui lòng chọn loại phương tiện, thời gian và vị trí đỗ mong muốn.
          Mã đặt chỗ sẽ được cấp sau khi bạn hoàn tất quy trình.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Clock size={20} />
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Thông tin đặt chỗ
                </h2>
                <p className="text-xs text-gray-500">
                  Chi tiết phương tiện và thời gian
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">
                    Biển số xe
                  </label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(event) => setLicensePlate(event.target.value)}
                    placeholder="VD: 51K-123.45"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm uppercase outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">
                    Loại phương tiện
                  </label>
                  <CustomSelect
                    value={vehicleType}
                    onChange={setVehicleType}
                    options={VEHICLE_TYPES}
                  />
                </div>
              </div>

              <div className="flex items-start gap-1 text-xs text-gray-500">
                <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
                <span>
                  Nhân viên sẽ dùng biển số này hoặc mã đặt chỗ để xác nhận xe
                  khi vào bãi.
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">
                    Ngày đỗ
                  </label>
                  <div className="relative">
                    <CalendarDays
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(event) => setBookingDate(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">
                    Giờ bắt đầu
                  </label>
                  <div className="relative">
                    <Clock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">
                    Thời lượng dự kiến
                  </label>
                  <CustomSelect
                    value={duration}
                    onChange={setDuration}
                    options={DURATIONS.map(({ value, label }) => ({
                      value,
                      label
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Sơ đồ vị trí trống
                </h2>
                <p className="text-xs text-gray-500">
                  Tầng hầm {floor} - Khu vực {zone}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm border border-gray-200 bg-white" />
                  Trống
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm border border-gray-200 bg-gray-100" />
                  Đã đỗ
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm border border-blue-500 bg-blue-50" />
                  Đang chọn
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <CustomSelect
                className="w-full sm:w-40"
                value={floor}
                onChange={setFloor}
                options={FLOORS}
              />

              <CustomSelect
                className="w-full sm:w-56"
                value={zone}
                onChange={setZone}
                options={ZONES}
              />

              <div className="sm:ml-auto">
                <CustomCheckbox
                  checked={autoSelect}
                  onChange={setAutoSelect}
                  label="Tự động chọn vị trí tối ưu"
                />
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
              <div className="grid grid-cols-5 gap-3 md:grid-cols-10">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleSelectSlot(slot)}
                    disabled={slot.status === 'occupied'}
                    className={`flex h-12 items-center justify-center rounded-lg border text-xs font-bold outline-none transition-all ${slot.status === 'occupied'
                        ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                        : slot.status === 'selected'
                          ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm ring-2 ring-blue-100'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-500'
                      }`}
                  >
                    {slot.id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Building size={24} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {PARKING_INFO.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {PARKING_INFO.address}
                </p>
              </div>
            </div>

            <div className="w-fit rounded-lg border border-blue-100 bg-white px-4 py-2 text-xs font-bold text-blue-600 shadow-sm">
              {PARKING_INFO.gate}
            </div>
          </div>
        </div>

        <div>
          <div className="sticky top-6 rounded-2xl border-2 border-blue-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
              <CreditCard className="text-blue-500" size={20} />
              Tóm tắt đặt chỗ
            </h2>

            <div className="mb-6 space-y-4">
              <SummaryRow
                icon={<Building size={16} />}
                label="Tòa nhà"
                value={PARKING_INFO.shortName}
              />

              <SummaryRow
                icon={<Car size={16} />}
                label="Biển số xe"
                value={licensePlate || 'Chưa nhập'}
              />

              <SummaryRow label="Loại xe" value={vehicleTypeLabel} />

              <SummaryRow
                icon={<Clock size={16} />}
                label="Thời gian vào"
                value={`${startTime} - ${bookingDate}`}
              />

              <SummaryRow label="Thời lượng" value={durationLabel} />

              <div className="flex items-center justify-between pb-2 text-sm">
                <span className="flex items-center gap-2 text-gray-500">
                  <MapPin size={16} />
                  Vị trí đỗ
                </span>

                <span className="rounded-md bg-blue-50 px-2 py-1 font-bold text-blue-600">
                  {floor} - Khu {zone} - {selectedSlot}
                </span>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">
                  Giá tạm tính
                </span>

                <span className="text-xl font-black text-gray-900">
                  {formatCurrency(temporaryPrice)} VND
                </span>
              </div>

              <p className="text-right text-[10px] font-medium text-blue-500">
                Giá đã bao gồm 10% VAT
              </p>
            </div>

            <div className="mb-6 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-orange-800">
                <AlertCircle size={14} />
                Lưu ý chính sách:
              </h4>

              <ul className="list-disc space-y-1.5 pl-4 text-[11px] font-medium text-orange-700 opacity-90">
                <li>Cho phép check-in sớm tối đa 15 phút.</li>
                <li>Hủy trước 30 phút sẽ được hoàn tiền 100%.</li>
                <li>Vị trí có thể được giải phóng nếu không vào sau 30 phút.</li>
              </ul>
            </div>

            {errorMessage && (
              <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 size={18} />
              {isSubmitting ? 'Đang đặt chỗ...' : 'Xác nhận đặt chỗ'}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 font-bold text-gray-600 transition-all hover:bg-gray-50"
            >
              Hủy bỏ
            </button>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                Thanh toán bảo mật thông qua ví điện tử
                <br />
                Hỗ trợ kỹ thuật:{' '}
                <span className="font-bold text-blue-500">1900.6789</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

const SummaryRow = ({ icon, label, value }) => {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 pb-3 text-sm">
      <span className="flex items-center gap-2 text-gray-500">
        {icon}
        {label}
      </span>

      <span className="font-bold text-gray-900">{value}</span>
    </div>
  )
}

export default DriverBooking