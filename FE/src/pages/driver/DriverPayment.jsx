import React, { useMemo, useState } from 'react'
import {
  CreditCard,
  Building2,
  Clock,
  Car,
  MapPin,
  Info,
  Banknote,
  QrCode,
  Wallet,
  CheckCircle2,
  Phone
} from 'lucide-react'
import { Link } from 'react-router-dom'

const SESSION_INFO = {
  referenceCode: 'SESS-240424-001',
  sessionType: 'ĐẶT TRƯỚC',
  bookingCode: 'BK-7792',
  plateNumber: '51A-123.45',
  vehicleType: 'Ô tô (4-7 chỗ)',
  building: 'Vincom Center Đồng Khởi',
  zone: 'Zone A',
  checkInTime: '29/04/2024 - 08:30',
  slot: 'A-102 (Tầng B2)',
  duration: '04 giờ 45 phút'
}

const FEE_ITEMS = [
  {
    label: 'Phí cơ bản (1 giờ đầu)',
    amount: 20000
  },
  {
    label: 'Phí theo giờ (3h tiếp theo x 15.000)',
    amount: 45000
  },
  {
    label: 'Phí quá giờ (45 phút)',
    amount: 15000
  },
  {
    label: 'Phí dịch vụ rửa xe',
    amount: 120000
  },
  {
    label: 'Phí sự cố / mất thẻ',
    amount: 0
  },
  {
    label: 'Giảm giá thành viên B2',
    amount: -20000,
    discount: true
  }
]

const PAYMENT_METHODS = [
  {
    value: 'cash',
    title: 'Tiền mặt tại quầy',
    description: 'Thanh toán trực tiếp cho nhân viên tại cổng ra.',
    Icon: Banknote
  },
  {
    value: 'bank',
    title: 'Chuyển khoản ngân hàng',
    description: 'Quét mã QR hoặc chuyển khoản qua ứng dụng ngân hàng.',
    Icon: QrCode
  },
  {
    value: 'wallet',
    title: 'Ví điện tử',
    description: 'Thanh toán nhanh qua Momo hoặc ZaloPay.',
    Icon: Wallet
  }
]

const formatCurrency = (value) => {
  const absValue = Math.abs(value)

  return `${value < 0 ? '-' : ''}${new Intl.NumberFormat('vi-VN').format(
    absValue
  )} đ`
}

const DriverPayment = () => {
  const [paymentMethod, setPaymentMethod] = useState('bank')
  const [paymentStatus, setPaymentStatus] = useState('pending')

  const totalAmount = useMemo(() => {
    return FEE_ITEMS.reduce((total, item) => total + item.amount, 0)
  }, [])

  const handleConfirmPayment = () => {
    setPaymentStatus('processing')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <CreditCard size={20} />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Thanh toán phí gửi xe
          </h1>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Building2 size={14} />
            <span>
              {SESSION_INFO.building} - {SESSION_INFO.zone}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Session Information */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Thông tin phiên gửi xe
                </h2>
                <p className="text-sm text-gray-500">
                  Chi tiết thông tin xe và thời gian lưu trú
                </p>
              </div>

              <span className="text-xs font-bold tracking-wider text-gray-400">
                REF: {SESSION_INFO.referenceCode}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2">
              <SessionInfoRow
                label="Loại phiên"
                value={SESSION_INFO.sessionType}
                badge
              />

              <SessionInfoRow
                label="Mã đặt chỗ"
                value={SESSION_INFO.bookingCode}
                bold
              />

              <SessionInfoRow
                icon={<Car size={16} />}
                label="Biển số xe"
                value={SESSION_INFO.plateNumber}
                bold
              />

              <SessionInfoRow
                label="Loại phương tiện"
                value={SESSION_INFO.vehicleType}
              />

              <SessionInfoRow
                icon={<Clock size={16} />}
                label="Thời gian vào"
                value={SESSION_INFO.checkInTime}
                removeBottomBorderOnDesktop
              />

              <SessionInfoRow
                icon={<MapPin size={16} />}
                label="Vị trí đỗ"
                value={SESSION_INFO.slot}
                removeBottomBorderOnDesktop
              />
            </div>

            <div className="mt-4 flex flex-col gap-2 rounded-xl bg-blue-50/50 p-4 sm:flex-row sm:items-center sm:gap-4">
              <span className="flex w-32 items-center gap-1 text-sm text-gray-500">
                <Clock size={16} className="text-blue-500" />
                Thời gian đã gửi
              </span>

              <span className="text-lg font-bold text-blue-600">
                {SESSION_INFO.duration}
              </span>
            </div>
          </div>

          {/* Fee Details */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Chi tiết phí dịch vụ
              </h2>
              <p className="text-sm text-gray-500">
                Bảng kê chi phí dựa trên thời gian gửi xe thực tế
              </p>
            </div>

            <div className="space-y-4 text-sm">
              {FEE_ITEMS.map((item) => (
                <FeeRow
                  key={item.label}
                  label={item.label}
                  amount={item.amount}
                  discount={item.discount}
                />
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
              <span className="text-lg font-bold text-gray-900">
                Tổng cộng thanh toán
              </span>

              <span className="text-2xl font-black text-blue-600">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <div className="mt-6 flex gap-3 rounded-xl bg-blue-50/50 p-4 text-sm text-blue-800">
              <Info className="mt-0.5 shrink-0 text-blue-500" size={18} />

              <div>
                <span className="font-bold">Thông tin hoàn tất</span>
                <p className="mt-1">
                  Sau khi bạn xác nhận thanh toán, nhân viên bãi xe sẽ kiểm tra
                  thông tin, xác nhận giao dịch và hoàn tất checkout tại cổng ra.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Payment Method */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Phương thức thanh toán
              </h2>
              <p className="text-sm text-gray-500">
                Chọn cách thức thanh toán phù hợp
              </p>
            </div>

            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <PaymentMethodCard
                  key={method.value}
                  method={method}
                  selected={paymentMethod === method.value}
                  onSelect={setPaymentMethod}
                />
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-gray-50 p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                Hướng dẫn thanh toán
              </div>

              <ul className="list-inside list-disc space-y-1 text-xs text-gray-600">
                <li>Sau khi chọn phương thức, hệ thống sẽ ghi nhận yêu cầu.</li>
                <li>Vui lòng di chuyển xe đến lối ra gần nhất.</li>
                <li>Nhân viên sẽ xác nhận thông tin và hoàn tất checkout.</li>
              </ul>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={paymentStatus === 'processing'}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors ${paymentStatus === 'processing'
                  ? 'cursor-not-allowed bg-blue-400'
                  : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                <CheckCircle2 size={18} />
                {paymentStatus === 'processing'
                  ? 'Đã gửi yêu cầu thanh toán'
                  : 'Xác nhận thanh toán'}
              </button>

              <Link
                to="/driver/session"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
              >
                Quay lại phiên gửi xe
              </Link>
            </div>
          </div>

          {/* Current Status */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">
                Trạng thái hiện tại
              </h2>

              <span
                className={`text-xs font-bold ${paymentStatus === 'processing'
                  ? 'text-blue-500'
                  : 'text-gray-400'
                  }`}
              >
                {paymentStatus === 'processing' ? 'ĐANG XỬ LÝ' : 'ĐANG CHỜ'}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${paymentStatus === 'processing'
                  ? 'bg-blue-50 text-blue-500'
                  : 'bg-gray-50 text-gray-400'
                  }`}
              >
                {paymentStatus === 'processing' ? (
                  <CheckCircle2 size={32} />
                ) : (
                  <Clock size={32} />
                )}
              </div>

              <div className="font-bold text-gray-800">
                {paymentStatus === 'processing'
                  ? 'Yêu cầu thanh toán đã được gửi'
                  : 'Yêu cầu thanh toán đang chờ xử lý'}
              </div>

              <p className="mt-1 text-xs text-gray-500">
                {paymentStatus === 'processing'
                  ? 'Vui lòng chờ nhân viên xác nhận giao dịch tại cổng ra.'
                  : 'Hệ thống đang chờ bạn xác nhận phương thức thanh toán.'}
              </p>
            </div>

            <div className="mt-6 space-y-2 border-t border-gray-100 pt-4 text-xs">
              <StatusRow label="Mã giao dịch" value="PAY-48029-112" />
              <StatusRow label="Thời gian khởi tạo" value="29/04/2024 - 13:15" />
              <StatusRow
                label="Số tiền"
                value={formatCurrency(totalAmount)}
              />
            </div>
          </div>

          {/* Support */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Info size={14} />
              </div>

              <h2 className="text-sm font-bold text-gray-900">
                Cần hỗ trợ?
              </h2>
            </div>

            <p className="mb-4 text-xs text-gray-500">
              Nếu gặp khó khăn trong quá trình thanh toán, vui lòng nhấn nút gọi
              hỗ trợ tại trạm hoặc liên hệ hotline.
            </p>

            <a
              href="tel:19001234"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200"
            >
              <Phone size={16} />
              Hotline: 1900 1234
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

const SessionInfoRow = ({
  icon,
  label,
  value,
  badge = false,
  bold = false,
  removeBottomBorderOnDesktop = false
}) => {
  return (
    <div
      className={`flex items-center gap-4 border-b border-gray-50 pb-4 ${removeBottomBorderOnDesktop ? 'md:border-none md:pb-0' : ''
        }`}
    >
      <span className="flex w-32 items-center gap-1 text-sm text-gray-500">
        {icon}
        {label}
      </span>

      {badge ? (
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
          {value}
        </span>
      ) : (
        <span
          className={`text-gray-800 ${bold ? 'font-bold' : 'font-semibold'
            }`}
        >
          {value}
        </span>
      )}
    </div>
  )
}

const FeeRow = ({ label, amount, discount = false }) => {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 pb-4">
      <span
        className={`${discount ? 'font-semibold text-emerald-600' : 'text-gray-600'
          }`}
      >
        {label}
      </span>

      <span
        className={`font-bold ${discount ? 'text-emerald-600' : 'text-gray-800'
          }`}
      >
        {formatCurrency(amount)}
      </span>
    </div>
  )
}

const PaymentMethodCard = ({ method, selected, onSelect }) => {
  const Icon = method.Icon

  return (
    <label
      className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${selected
        ? 'border-blue-500 bg-blue-50/50'
        : 'border-gray-200 hover:bg-gray-50'
        }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
          }`}
      >
        <Icon size={20} />
      </div>

      <div className="flex-1">
        <div className="font-bold text-gray-800">
          {method.title}
        </div>

        <div className="text-xs text-gray-500">
          {method.description}
        </div>
      </div>

      <input
        type="radio"
        name="payment"
        className="h-4 w-4 text-blue-600"
        checked={selected}
        onChange={() => onSelect(method.value)}
      />
    </label>
  )
}

const StatusRow = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">
        {label}
      </span>

      <span className="font-semibold text-gray-800">
        {value}
      </span>
    </div>
  )
}

export default DriverPayment