import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Car,
  ShieldCheck,
  Clock,
  MapPin,
  Info,
  ArrowRightLeft,
  AlertTriangle,
  Check,
  RefreshCcw,
  Map
} from 'lucide-react'
import authorizeAxios from '../../utils/authorizeAxios'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

const parseBackendDate = (value) => {
  if (!value) return null

  if (value instanceof Date) return value

  let text = String(value)

  // SQL Server datetime sometimes comes back with Z and JS treats it as UTC.
  // Remove Z so FE treats it as local time for this project.
  if (text.endsWith('Z')) {
    text = text.slice(0, -1)
  }

  const date = new Date(text)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

const formatDateTime = (value) => {
  const date = parseBackendDate(value)

  if (!date) return '--'

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatCurrency = (value) => {
  const number = Number(value || 0)
  return `${new Intl.NumberFormat('vi-VN').format(number)} VNĐ`
}

const getParkedDuration = (entryTime, currentTime) => {
  const entry = parseBackendDate(entryTime)
  const now = currentTime || new Date()

  if (!entry) return '--'

  const diffSeconds = Math.max(
    0,
    Math.floor((now.getTime() - entry.getTime()) / 1000)
  )

  const hours = Math.floor(diffSeconds / 3600)
  const minutes = Math.floor((diffSeconds % 3600) / 60)
  const seconds = diffSeconds % 60

  return `${hours} giờ ${minutes} phút ${seconds} giây`
}

const getProgress = (sessionInfo, currentTime) => {
  if (!sessionInfo?.EntryTime) return 5

  const entry = parseBackendDate(sessionInfo.EntryTime)
  const now = currentTime || new Date()

  if (!entry) return 5

  let totalMinutes = 240

  if (sessionInfo.ReservationStartTime && sessionInfo.ReservationEndTime) {
    const start = parseBackendDate(sessionInfo.ReservationStartTime)
    const end = parseBackendDate(sessionInfo.ReservationEndTime)

    if (start && end) {
      totalMinutes = Math.max(
        1,
        Math.floor((end.getTime() - start.getTime()) / 60000)
      )
    }
  }

  const parkedMinutes = Math.max(
    0,
    Math.floor((now.getTime() - entry.getTime()) / 60000)
  )

  return Math.min(
    100,
    Math.max(5, Math.round((parkedMinutes / totalMinutes) * 100))
  )
}

const DriverSession = () => {
  const navigate = useNavigate()

  const [sessionInfo, setSessionInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mapModal, setMapModal] = useState({ isOpen: false })

  const fetchCurrentSession = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')

      const response = await authorizeAxios.get('/driver/current-session')
      setSessionInfo(response.data?.data || null)
    } catch (error) {
      console.error('Get current session failed:', error)

      const message =
        error.response?.data?.message ||
        'Không thể tải phiên đỗ hiện tại. Vui lòng thử lại.'

      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrentSession()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const parkedDuration = useMemo(() => {
    return getParkedDuration(sessionInfo?.EntryTime, currentTime)
  }, [sessionInfo?.EntryTime, currentTime])

  const progress = useMemo(() => {
    return getProgress(sessionInfo, currentTime)
  }, [sessionInfo, currentTime])

  const totalAmount = Number(sessionInfo?.Amount || 0)

  const costDetails = [
    {
      label: `Phí đỗ xe (${parkedDuration})`,
      amount: formatCurrency(totalAmount)
    },
    {
      label: 'Phí quá giờ',
      amount: '0 VNĐ'
    },
    {
      label: 'Phí dịch vụ khác',
      amount: '0 VNĐ'
    }
  ]

  const sessionTimeline = [
    {
      title: 'Nhân viên ghi nhận vào cổng',
      time: formatDateTime(sessionInfo?.EntryTime),
      status: 'done'
    },
    {
      title: `Đã đỗ vào vị trí ${sessionInfo?.SlotCode || '--'}`,
      time: formatDateTime(sessionInfo?.EntryTime),
      status: 'done'
    },
    {
      title: 'Đang trong thời gian đỗ',
      time: `Đã đỗ ${parkedDuration}`,
      status: 'active'
    },
    {
      title: 'Chờ xác nhận ra cổng (Checkout)',
      time: '',
      status: 'pending'
    }
  ]

  const handleGoPayment = () => {
    navigate('/driver/payment')
  }

  const handleGoReport = () => {
    navigate('/driver/report')
  }

  const handleViewMap = () => {
    setMapModal({ isOpen: true })
  }

  if (isLoading) {
    return (
      <Card className="p-10 text-center">
        <p className="font-bold text-gray-700">
          Đang tải phiên đỗ hiện tại...
        </p>
      </Card>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center shadow-sm">
        <p className="font-bold text-red-600">
          {errorMessage}
        </p>

        <Button
          onClick={fetchCurrentSession}
          variant="danger"
          className="mt-4"
          icon={RefreshCcw}
        >
          Thử lại
        </Button>
      </div>
    )
  }

  if (!sessionInfo) {
    return (
      <div className="space-y-6">
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

        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Info size={26} />
          </div>

          <h2 className="text-lg font-bold text-gray-900">
            Bạn chưa có phiên đỗ xe đang hoạt động
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Phiên đỗ hiện tại chỉ xuất hiện sau khi nhân viên check-in xe của bạn vào bãi.
          </p>

          <Button
            onClick={() => navigate('/driver/booking')}
            className="mt-5"
          >
            Đặt chỗ mới
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <span>Hệ thống</span>
          <span>›</span>
          <span>Phiên đỗ xe</span>
        </div>

        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Chi tiết phiên đỗ hiện tại
          </h1>

          <Button
            onClick={fetchCurrentSession}
            variant="secondary"
            className="w-fit"
            icon={RefreshCcw}
          >
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Thông tin phiên đỗ
                </h2>

                <p className="text-sm text-gray-500">
                  Mã tham chiếu hệ thống:{' '}
                  {sessionInfo.SessionCode || `SESS-${sessionInfo.SessionID}`}
                </p>
              </div>

              <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                {sessionInfo.statusLabel || 'Đang hoạt động'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Loại phiên
                </div>

                <div className="flex items-center gap-2 font-bold text-gray-800">
                  <ArrowRightLeft size={16} className="text-blue-500" />
                  {sessionInfo.sessionType || 'VÃNG LAI'}
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Mã đặt chỗ
                </div>

                <div className="font-bold text-blue-600">
                  {sessionInfo.BookingCode || 'Không có'}
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
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Thông tin phương tiện
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <div className="flex h-24 items-center justify-center rounded-xl bg-gray-200/80 shadow-inner">
                  <span className="text-3xl font-black tracking-widest text-gray-800">
                    {sessionInfo.PlateNumber || '--'}
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  <InfoRow
                    icon={<Car size={16} />}
                    label="Loại xe"
                    value={sessionInfo.VehicleName || '--'}
                  />

                  <InfoRow
                    icon={<ShieldCheck size={16} />}
                    label="Hãng xe"
                    value="Chưa cập nhật"
                    border={false}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-5">
                <InfoRow label="Cổng vào" value="Cổng chính" />

                <InfoRow
                  icon={<Clock size={16} />}
                  label="Thời điểm vào"
                  value={formatDateTime(sessionInfo.EntryTime)}
                />

                <InfoRow
                  label="Thời gian đã đỗ"
                  value={parkedDuration}
                  valueClassName="font-bold text-blue-600"
                  border={false}
                />

                <div className="pt-2">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-500">
                      Tiến độ đỗ xe
                    </span>

                    <span className="text-blue-600">
                      {progress}%
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Vị trí đỗ xe
              </h2>

              <Button
                onClick={handleViewMap}
                variant="outline"
                size="sm"
                icon={MapPin}
              >
                Xem sơ đồ vị trí
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <LocationCard
                label="Tòa nhà"
                value={sessionInfo.BuildingName || '--'}
              />

              <LocationCard
                label="Tầng"
                value={sessionInfo.FloorName || '--'}
              />

              <LocationCard
                label="Khu vực"
                value={sessionInfo.ZoneName || '--'}
              />

              <LocationCard
                label="Mã vị trí"
                value={sessionInfo.SlotCode || '--'}
                active
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Tạm tính chi phí
              </h2>

              <span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                {sessionInfo.PaymentStatus || 'Pending'}
              </span>
            </div>

            <div className="mb-6 space-y-3 text-sm">
              {costDetails.map((item) => (
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
                  {formatCurrency(totalAmount)}
                </span>

                <span className="mb-1 text-[10px] text-gray-400">
                  Đã bao gồm VAT
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleGoPayment} className="w-full">
                Thanh toán ngay
              </Button>

              <Button
                onClick={handleGoReport}
                variant="secondary"
                className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                icon={AlertTriangle}
              >
                Báo cáo sự cố đỗ xe
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="mb-6 text-lg font-bold text-gray-900">
              Trình trạng phiên
            </h2>

            <div className="relative ml-3 space-y-8 border-l-2 border-gray-100">
              {sessionTimeline.map((item) => (
                <TimelineItem
                  key={item.title}
                  item={item}
                />
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
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
          </Card>

          <Button
            onClick={fetchCurrentSession}
            variant="secondary"
            className="w-full"
            icon={RefreshCcw}
          >
            Làm mới phiên hiện tại
          </Button>
        </div>
      </div>

      <Modal
        isOpen={mapModal.isOpen}
        onClose={() => setMapModal({ isOpen: false })}
        title="Sơ đồ vị trí đỗ xe"
        maxWidth="max-w-2xl"
        footer={<Button onClick={() => setMapModal({ isOpen: false })}>Đóng</Button>}
      >
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <Map className="w-24 h-24 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-700">Sơ đồ tĩnh đang phát triển</h3>
          <p className="text-sm text-gray-500 text-center mt-2 max-w-sm">
            Tính năng xem sơ đồ định tuyến động cho người lái đang được cập nhật. Vui lòng hỏi nhân viên để được hướng dẫn đến vị trí đỗ <span className="font-bold text-blue-600">{sessionInfo?.SlotCode}</span>.
          </p>
        </div>
      </Modal>
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
      className={`flex items-center justify-between gap-4 ${
        border ? 'border-b border-gray-100 pb-2' : ''
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
      className={`rounded-xl border p-4 text-center transition-colors ${
        active
          ? 'border-blue-100 bg-blue-50/50'
          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div
        className={`mb-1 text-xs font-semibold uppercase ${
          active ? 'text-blue-600' : 'text-gray-500'
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
        className={`text-sm ${
          isActive
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
          className={`text-xs ${
            isActive ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          {item.time}
        </div>
      )}
    </div>
  )
}

export default DriverSession