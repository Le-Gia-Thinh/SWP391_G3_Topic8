// src/pages/Staff/StaffActionSuccess.jsx
import {
  CheckCircle2, ChevronRight, MapPin, ArrowRight, ShieldCheck, Home, Printer, AlertTriangle,
  FileText, Info
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const formatVND = (v) => Number(v || 0).toLocaleString('vi-VN')
const formatDT = (dt) => dt ? new Date(dt).toLocaleString('vi-VN') : '—'

const StaffActionSuccess = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const actionType = location.state?.actionType || 'walkin-checkin'
  const sessionCode = location.state?.sessionCode
  const session = location.state?.session
  const checkoutData = location.state?.checkoutData // từ StaffPaymentConfirm

  const isWalkIn = actionType === 'walkin-checkin'
  const isBooking = actionType === 'booking-checkin'
  const isCheckOut = actionType === 'checkout'

  const title = isWalkIn ? 'Check-in Thành công' : isBooking ? 'Booking Check-in Thành công' : 'Check-out Hoàn tất'
  const breadcrumb = isWalkIn ? 'Check-in Vãng lai' : isBooking ? 'Check-in Đặt chỗ' : 'Thanh toán xe ra'

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24 animate-in fade-in">
      {/* Breadcrumb */}
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <span>Nhân viên</span> <ChevronRight size={14} />
        <span>{breadcrumb}</span> <ChevronRight size={14} />
        <span className="text-blue-600 font-medium">Thành công</span>
      </div>

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {!isCheckOut && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-sm font-medium">
            <MapPin size={16} /> Cổng Bắc - Gate A
          </div>
        )}
      </header>

      <div className="flex gap-6 flex-1 flex-col xl:flex-row">
        {/* Left */}
        <div className="flex-2 space-y-6">
          {/* Status banner */}
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600 mt-1 shrink-0">
              <CheckCircle2 size={32} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-xl font-bold text-gray-800">
                  {isCheckOut ? 'Check-out thành công!' : isBooking ? 'Check-in Thành công!' : 'Phiên gửi xe đã được tạo!'}
                </h2>
                {!isCheckOut && (
                  <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded border border-green-200">Đang hoạt động</span>
                )}
              </div>
              <p className="text-gray-500 text-sm">
                {isCheckOut
                  ? 'Khách hàng đã thanh toán và hệ thống đã ghi nhận xe ra thành công.'
                  : isBooking
                    ? 'Mã đặt chỗ đã được chuyển thành phiên gửi xe đang hoạt động.'
                    : 'Yêu cầu check-in vãng lai đã được xử lý và ghi nhận vào hệ thống.'}
              </p>
              {isBooking && (
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md border border-gray-200 uppercase">Booking: <strong>COMPLETED</strong></span>
                  <span className="text-xs font-semibold px-3 py-1.5 bg-green-100 text-green-700 rounded-md border border-green-200 uppercase">Phiên: <strong>ACTIVE</strong></span>
                </div>
              )}
              {isCheckOut && (
                <div className="flex gap-3 mt-4">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Printer size={16} /> In biên lai
                  </button>
                  <button onClick={() => navigate('/staff/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                    <Home size={16} /> Về trang chủ
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Walk-in note */}
          {isWalkIn && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-3">
              <Info size={20} className="text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm mb-1">Lưu ý khi trả xe (Check-out):</h4>
                <p className="text-sm text-blue-700">Đây là phiên vãng lai không có mã đặt chỗ. Nhân viên tìm lại phiên bằng <strong>Biển số xe</strong> hoặc <strong>Mã phiên ({sessionCode || '—'})</strong> tại màn hình Check-out.</p>
              </div>
            </div>
          )}

          {/* Session details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {isCheckOut
                  ? <><FileText size={20} className="text-blue-600" /> Tóm tắt phiên gửi xe</>
                  : <><ShieldCheck size={20} className="text-blue-500" /> Chi tiết phiên</>}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10">
              {[
                ['Mã phiên', sessionCode || checkoutData?.SessionCode || session?.SessionCode || '—'],
                ['Biển số xe', session?.PlateNumber || checkoutData?.PlateNumber || '—'],
                ['Loại xe', session?.VehicleName || checkoutData?.VehicleName || '—'],
                ['Ô đỗ', session?.SlotCode || '—'],
                ['Vào lúc', formatDT(session?.EntryTime || checkoutData?.EntryTime)],
                ...(isCheckOut ? [
                  ['Ra lúc', formatDT(checkoutData?.ExitTime)],
                  ['Thời lượng', checkoutData?.DurationH ? `${Math.floor(checkoutData.DurationH)}h ${Math.round((checkoutData.DurationH % 1) * 60)}m` : '—']
                ] : [])
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="font-bold text-gray-800">{val}</span>
                </div>
              ))}
            </div>

            {isCheckOut && checkoutData && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mt-5 flex justify-between items-center">
                <span className="text-sm font-bold text-blue-900 uppercase">Tổng số tiền đã thu</span>
                <span className="text-3xl font-black text-blue-600">
                  {formatVND(checkoutData.SurchargeAmount > 0 ? checkoutData.SurchargeAmount : checkoutData.FinalFee)} ₫
                </span>
              </div>
            )}
          </div>

          {/* Payment info (checkout only) */}
          {isCheckOut && checkoutData && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-blue-600" /> Thông tin thanh toán
                </h3>
                <button onClick={() => navigate('/staff/create-incident')} className="text-sm font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                  <AlertTriangle size={16} /> Báo cáo sai sót
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                  ['Phương thức', checkoutData.PaymentMethod || '—'],
                  ['Đã trả trước', `${formatVND(checkoutData.PrepaidAmount)} ₫`],
                  ['Phụ trội', `${formatVND(checkoutData.SurchargeAmount)} ₫`],
                  ['Tổng phí', `${formatVND(checkoutData.FinalFee)} ₫`]
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">{label}</p>
                    <p className="text-sm font-bold text-gray-800">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex-1 space-y-6">
          {isBooking && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-4">Mã phiên mới</p>
              <h3 className="text-4xl font-black text-blue-600 mb-2">{sessionCode || '—'}</h3>
              <span className="bg-green-50 text-green-600 text-xs font-bold px-3 py-1 rounded-full border border-green-200 mb-6">ĐANG HOẠT ĐỘNG</span>
              <div className="flex gap-3 w-full">
                <button onClick={() => navigate('/staff/dashboard')} className="flex-2 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 flex justify-center items-center gap-2">
                  Về Dashboard <Home size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Slot status change */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <h3 className="text-sm font-bold text-gray-600 mb-4 uppercase">Cập nhật vị trí đỗ</h3>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <div className="text-3xl font-black text-blue-600 mb-1">{session?.SlotCode || '—'}</div>
              <div className="text-xs text-blue-500 font-medium">Mã ô đỗ đã cập nhật</div>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm font-bold">
              <span className={`px-4 py-2 rounded-lg border ${isCheckOut ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                {isCheckOut ? 'ĐANG ĐỖ → TRỐNG' : 'TRỐNG → ĐÃ ĐỖ'}
              </span>
            </div>
            <p className="text-xs text-green-600 bg-green-50 px-3 py-2 mt-4 rounded-lg border border-green-100 flex items-center justify-center gap-1">
              <CheckCircle2 size={14} /> Hệ thống đã cập nhật trạng thái ô đỗ.
            </p>
          </div>

          {/* Guide (check-in only) */}
          {!isCheckOut && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Info size={18} className="text-blue-500" /> Bước tiếp theo
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <p className="text-sm text-gray-600">Khi khách lấy xe, vào màn hình <strong>Checkout</strong> và tìm theo biển số hoặc mã phiên <strong>{sessionCode || '—'}</strong>.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <p className="text-sm text-gray-600">Hệ thống tự tính phí theo giờ thực tế.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-sm text-gray-500 flex items-center gap-2">
            <ArrowRight size={16} /> Trạng thái hệ thống: Ổn định
          </span>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/staff/dashboard')} className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50">
              Về Dashboard
            </button>
            <button
              onClick={() => navigate(isCheckOut ? '/staff/checkout' : '/staff/checkin')}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
            >
              {isCheckOut ? 'Check-out xe mới' : 'Check-in mới'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffActionSuccess