import React, { useMemo, useState } from 'react'
import {
  Search,
  Calendar,
  RefreshCcw,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import { Link } from 'react-router-dom'

const BOOKINGS = [
  {
    id: 'BK-88291',
    building: 'Vincom Center Đồng Khởi',
    vehicleType: 'Ô tô 4 chỗ',
    vehicleTypeValue: 'car4',
    plate: '51G-123.45',
    floor: 'B2',
    zone: 'A',
    slot: '12',
    startTime: '10:30',
    startDate: '24/05/2024',
    endTime: '12:30',
    endDate: '24/05/2024',
    status: 'Đang hoạt động',
    statusValue: 'active'
  },
  {
    id: 'BK-88295',
    building: 'Bitexco Financial Tower',
    vehicleType: 'Xe bán tải',
    vehicleTypeValue: 'pickup',
    plate: '51H-999.88',
    floor: 'B3',
    zone: 'C',
    slot: '45',
    startTime: '09:00',
    startDate: '24/05/2024',
    endTime: '11:00',
    endDate: '24/05/2024',
    status: 'Đang hoạt động',
    statusValue: 'active'
  },
  {
    id: 'BK-87102',
    building: 'Vincom Center Đồng Khởi',
    vehicleType: 'Ô tô 7 chỗ',
    vehicleTypeValue: 'car7',
    plate: '51A-555.66',
    floor: 'B2',
    zone: 'B',
    slot: '08',
    startTime: '14:00',
    startDate: '23/05/2024',
    endTime: '16:00',
    endDate: '23/05/2024',
    status: 'Đã sử dụng',
    statusValue: 'used'
  },
  {
    id: 'BK-86554',
    building: 'Landmark 81',
    vehicleType: 'Ô tô 4 chỗ',
    vehicleTypeValue: 'car4',
    plate: '60B-112.23',
    floor: 'B1',
    zone: 'D',
    slot: '22',
    startTime: '08:15',
    startDate: '22/05/2024',
    endTime: '10:15',
    endDate: '22/05/2024',
    status: 'Hết hạn',
    statusValue: 'expired'
  },
  {
    id: 'BK-85001',
    building: 'Saigon Centre',
    vehicleType: 'Ô tô 4 chỗ',
    vehicleTypeValue: 'car4',
    plate: '72A-888.88',
    floor: 'B4',
    zone: 'A',
    slot: '01',
    startTime: '18:00',
    startDate: '20/05/2024',
    endTime: '20:00',
    endDate: '20/05/2024',
    status: 'Đã hủy',
    statusValue: 'cancelled'
  }
]

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'used', label: 'Đã sử dụng' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'cancelled', label: 'Đã hủy' }
]

const VEHICLE_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'car4', label: 'Ô tô 4 chỗ' },
  { value: 'car7', label: 'Ô tô 7 chỗ' },
  { value: 'pickup', label: 'Xe bán tải' }
]

const STATUS_CLASSES = {
  active: 'bg-blue-50 text-blue-600',
  used: 'bg-gray-100 text-gray-600',
  expired: 'bg-amber-50 text-amber-600',
  cancelled: 'bg-red-50 text-red-600'
}

const DriverHistory = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const filteredBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return BOOKINGS.filter((booking) => {
      const matchesSearch =
        !keyword ||
        booking.id.toLowerCase().includes(keyword) ||
        booking.plate.toLowerCase().includes(keyword) ||
        booking.building.toLowerCase().includes(keyword)

      const matchesStatus =
        !statusFilter || booking.statusValue === statusFilter

      const matchesVehicle =
        !vehicleFilter || booking.vehicleTypeValue === vehicleFilter

      const matchesDate =
        !dateFilter || booking.startDate.split('/').reverse().join('-') === dateFilter

      return matchesSearch && matchesStatus && matchesVehicle && matchesDate
    })
  }, [searchTerm, statusFilter, vehicleFilter, dateFilter])

  const handleResetFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setVehicleFilter('')
    setDateFilter('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Lịch sử đặt chỗ
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi các lượt đặt chỗ đã tạo, đang hoạt động hoặc đã hủy.
          </p>
        </div>

        <Link
          to="/driver/booking"
          className="w-fit rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700"
        >
          + Đặt chỗ mới
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-gray-500">
              Tìm kiếm đặt chỗ
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Mã đặt chỗ, biển số hoặc tên tòa nhà..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500">
              Trạng thái
            </label>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all-status'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500">
              Ngày đặt
            </label>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-500">
              Loại phương tiện
            </label>

            <select
              value={vehicleFilter}
              onChange={(event) => setVehicleFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
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
              type="button"
              onClick={handleResetFilters}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              <RefreshCcw size={16} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Filter size={20} className="text-blue-500" />
            Danh sách đặt chỗ gần đây
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <span className="text-sm text-gray-500">
              Hiển thị{' '}
              <span className="font-semibold text-gray-800">
                {filteredBookings.length}
              </span>{' '}
              kết quả
            </span>

            <button
              type="button"
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              <SlidersHorizontal size={16} />
              Tùy chỉnh cột
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Mã đặt chỗ</th>
                <th className="px-5 py-4 font-semibold">Tòa nhà</th>
                <th className="px-5 py-4 font-semibold">Loại xe</th>
                <th className="px-5 py-4 font-semibold">Biển số</th>
                <th className="px-5 py-4 font-semibold">Vị trí</th>
                <th className="px-5 py-4 font-semibold">Thời gian đặt</th>
                <th className="px-5 py-4 font-semibold">Hết hạn</th>
                <th className="px-5 py-4 font-semibold">Trạng thái</th>
                <th className="px-5 py-4 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <div className="mx-auto max-w-sm">
                      <p className="font-bold text-gray-700">
                        Không tìm thấy đặt chỗ phù hợp
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Hãy thử đổi từ khóa tìm kiếm hoặc bộ lọc.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-5 py-4">
                      <span className="font-bold text-blue-600">
                        {booking.id}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-800">
                      {booking.building}
                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {booking.vehicleType}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-gray-800">
                        {booking.plate}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-medium text-gray-600">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5">
                          {booking.floor}
                        </span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5">
                          {booking.zone}
                        </span>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5">
                          {booking.slot}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-800">
                        {booking.startTime}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.startDate}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-800">
                        {booking.endTime}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.endDate}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_CLASSES[booking.statusValue] ||
                          STATUS_CLASSES.used
                          }`}
                      >
                        {booking.status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-3 font-semibold">
                        <Link
                          to="/driver/booking-confirmation"
                          state={{
                            bookingCode: booking.id,
                            parkingName: booking.building,
                            licensePlate: booking.plate,
                            vehicleType: booking.vehicleTypeValue,
                            bookingDate: booking.startDate
                              .split('/')
                              .reverse()
                              .join('-'),
                            startTime: booking.startTime,
                            floor: booking.floor,
                            zone: booking.zone,
                            selectedSlot: booking.slot
                          }}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Chi tiết
                        </Link>

                        {booking.statusValue === 'active' && (
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-600"
                          >
                            Hủy bỏ
                          </button>
                        )}

                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-4 border-t border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <Link
            to="/driver/booking"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            + Đặt chỗ mới
          </Link>

          <div className="text-sm text-gray-500">
            Tổng cộng{' '}
            <span className="font-bold text-gray-800">
              {BOOKINGS.length} lượt đặt chỗ
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Trang 1 / 1</span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled
                className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 text-gray-300"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white"
              >
                1
              </button>

              <button
                type="button"
                disabled
                className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg border border-gray-200 text-gray-300"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverHistory