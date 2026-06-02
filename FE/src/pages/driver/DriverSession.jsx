import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Car,
  ShieldCheck,
  Clock,
  MapPin,
  Info,
  ArrowRightLeft,
  AlertTriangle,
  Check
} from 'lucide-react'

const SESSION_INFO = {
  sessionCode: 'SESS-20240824-0982',
  status: 'Đang hoạt động',
  sessionType: 'ĐẶT TRƯỚC (BOOKING)',
  bookingCode: 'BK-4492-AXZ',
  plateNumber: '51A - 999.88',
  vehicleType: 'Ô tô (4-7 chỗ)',
  brand: 'VinFast Lux A2.0',
  gate: 'Cổng chính (Lý Tự Trọng)',
  checkInTime: '14:30 - 24/08/2024',
  parkedDuration: '03 giờ 45 phút',
  progress: 65,
  building: 'Vincom Center',
  floor: 'Hầm B2',
  zone: 'Zone A',
  slot: 'A-102'
}

const COST_DETAILS = [
  {
    label: 'Phí đỗ xe (3h 45p)',
    amount: '120.000 VNĐ'
  },
  {
    label: 'Phí quá giờ (0h 00p)',
    amount: '0 VNĐ'
  },
  {
    label: 'Phí dịch vụ khác',
    amount: '0 VNĐ'
  }
]

const SESSION_TIMELINE = [
  {
    title: 'Nhân viên ghi nhận vào cổng',
    time: '24/08/2024 - 14:30:12',
    status: 'done'
  },
  {
    title: 'Đã đỗ vào vị trí A-102',
    time: '24/08/2024 - 14:38:45',
    status: 'done'
  },
  {
    title: 'Đang trong thời gian đỗ',
    time: 'Cập nhật 2 phút trước',
    status: 'active'
  },
  {
    title: 'Chờ xác nhận ra cổng (Checkout)',
    time: '',
    status: 'pending'
  }
]

const DriverSession = () => {
  const navigate = useNavigate()

  const handleGoPayment = () => {
    navigate('/driver/payment')
  }

  const handleGoReport = () => {
    navigate('/driver/report')
  }

  const handleViewMap = () => {
    console.log('View parking map')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span>Hệ thống</span>
          <span>›</span>
          <span>Phiên đỗ xe</span>
        </div>

        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Chi tiết phiên đỗ hiện tại
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Session Information */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Thông tin phiên đỗ
                </h2>

                <p className="text-sm text-gray-500">
                  Mã tham chiếu hệ thống: {SESSION_INFO.sessionCode}
                </p>
              </div>

              <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                {SESSION_INFO.status}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Loại phiên
                </div>

                <div className="flex items-center gap-2 font-bold text-gray-800">
                  <ArrowRightLeft size={16} className="text-blue-500" />
                  {SESSION_INFO.sessionType}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Mã đặt chỗ
                </div>

                <div className="font-bold text-blue-600">
                  {SESSION_INFO.bookingCode}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-3 rounded-xl bg-blue-50/50 p-4 text-sm text-blue-800">
              <Info size={20} className="mt-0.5 shrink-0 text-blue-500" />

              <p>
                Để hoàn tất phiên đỗ và thanh toán, vui lòng cung cấp{' '}
                <span className="font-bold">biển số xe</span> hoặc{' '}
                <span className="font-bold">mã đặt chỗ</span> cho nhân viên bãi
                xe khi di chuyển ra cổng kiểm soát.
              </p>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Thông tin phương tiện
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <div className="flex h-24 items-center justify-center rounded-xl bg-gray-200/80 shadow-inner">
                  <span className="text-3xl font-black tracking-widest text-gray-800">
                    {SESSION_INFO.plateNumber}
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  <InfoRow
                    icon={<Car size={16} />}
                    label="Loại xe"
                    value={SESSION_INFO.vehicleType}
                  />

                  <InfoRow
                    icon={<ShieldCheck size={16} />}
                    label="Hãng xe"
                    value={SESSION_INFO.brand}
                    border={false}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-5">
                <InfoRow
                  label="Cổng vào"
                  value={SESSION_INFO.gate}
                />

                <InfoRow
                  icon={<Clock size={16} />}
                  label="Thời điểm vào"
                  value={SESSION_INFO.checkInTime}
                />

                <InfoRow
                  label="Thời gian đã đỗ"
                  value={SESSION_INFO.parkedDuration}
                  valueClassName="font-bold text-blue-600"
                  border={false}
                />

                <div className="pt-2">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-500">
                      Tiến độ đỗ xe
                    </span>

                    <span className="text-blue-600">
                      {SESSION_INFO.progress}%
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${SESSION_INFO.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parking Location */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Vị trí đỗ xe
              </h2>

              <button
                type="button"
                onClick={handleViewMap}
                className="flex w-fit items-center gap-2 rounded-lg border border-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
              >
                <MapPin size={16} />
                Xem sơ đồ vị trí
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <LocationCard
                label="Tòa nhà"
                value={SESSION_INFO.building}
              />

              <LocationCard
                label="Tầng"
                value={SESSION_INFO.floor}
              />

              <LocationCard
                label="Khu vực"
                value={SESSION_INFO.zone}
              />

              <LocationCard
                label="Mã vị trí"
                value={SESSION_INFO.slot}
                active
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Cost */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Tạm tính chi phí
              </h2>

              <span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                Chờ thanh toán
              </span>
            </div>

            <div className="mb-6 space-y-3 text-sm">
              {COST_DETAILS.map((item) => (
                <CostRow
                  key={item.label}
                  label={item.label}
                  amount={item.amount}
                />
              ))}
            </div>

            <div className="mb-6 border-t border-gray-100 pt-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Tổng tạm tính
              </div>

              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <span className="text-3xl font-black text-gray-900">
                  120.000 VNĐ
                </span>

                <span className="mb-1 text-[10px] text-gray-400">
                  Đã bao gồm VAT
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoPayment}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700"
              >
                Thanh toán ngay
              </button>

              <button
                type="button"
                onClick={handleGoReport}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
              >
                <AlertTriangle size={18} className="text-orange-500" />
                Báo cáo sự cố đỗ xe
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-gray-900">
              Trình trạng phiên
            </h2>

            <div className="relative ml-3 space-y-8 border-l-2 border-gray-100">
              {SESSION_TIMELINE.map((item) => (
                <TimelineItem
                  key={item.title}
                  item={item}
                />
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-full bg-white p-2 text-blue-500 shadow-sm">
                <Info size={20} />
              </div>

              <div>
                <div className="font-bold text-gray-800">
                  Hỗ trợ 24/7
                </div>

                <div className="mt-1 text-sm text-gray-500">
                  Hotline:{' '}
                  <span className="font-bold text-blue-600">
                    1900 1234
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const InfoRow = ({
  icon,
  label,
  value,
  valueClassName = 'font-semibold text-gray-800',
  border = true
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${border ? 'border-b border-gray-100 pb-2' : ''
        }`}
    >
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon && <span>{icon}</span>}
        {label}
      </div>

      <span className={`text-right ${valueClassName}`}>
        {value}
      </span>
    </div>
  )
}

const LocationCard = ({ label, value, active = false }) => {
  return (
    <div
      className={`rounded-xl border p-4 text-center transition-colors ${active
        ? 'border-blue-100 bg-blue-50/50'
        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
        }`}
    >
      <div
        className={`mb-1 text-xs font-semibold uppercase ${active ? 'text-blue-600' : 'text-gray-500'
          }`}
      >
        {label}
      </div>

      <div
        className={
          active
            ? 'text-xl font-black text-blue-600'
            : 'font-bold text-gray-800'
        }
      >
        {value}
      </div>
    </div>
  )
}

const CostRow = ({ label, amount }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">
        {label}
      </span>

      <span className="font-bold text-gray-800">
        {amount}
      </span>
    </div>
  )
}

const TimelineItem = ({ item }) => {
  const isDone = item.status === 'done'
  const isActive = item.status === 'active'
  const isPending = item.status === 'pending'

  return (
    <div className="relative pl-6">
      <div className="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white">
        {isDone && (
          <Check size={12} className="text-gray-400" />
        )}

        {isActive && (
          <div className="h-3 w-3 rounded-full border-2 border-blue-600 bg-white" />
        )}

        {isPending && (
          <div className="h-3 w-3 rounded-full border-2 border-gray-200 bg-white" />
        )}
      </div>

      <div
        className={`text-sm ${isActive
          ? 'font-bold text-blue-600'
          : isPending
            ? 'font-semibold text-gray-400'
            : 'font-bold text-gray-800'
          }`}
      >
        {item.title}
      </div>

      {item.time && (
        <div
          className={`text-xs ${isActive ? 'text-blue-500' : 'text-gray-500'
            }`}
        >
          {item.time}
        </div>
      )}
    </div>
  )
}

export default DriverSession