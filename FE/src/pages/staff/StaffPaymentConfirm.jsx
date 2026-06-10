import React, { useState } from 'react'
import { ChevronRight, CreditCard, Banknote, QrCode, AlertTriangle, ShieldCheck, Clock, MapPin, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const StaffPaymentConfirm = () => {
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [confirmedPlate, setConfirmedPlate] = useState(false)

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24">
      {/* Header breadcrumb */}
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <span>Nhân viên</span> <ChevronRight size={14} />
        <span>Thanh toán</span> <ChevronRight size={14} />
        <span className="text-blue-600 font-medium">Xác nhận & Thu phí</span>
      </div>

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Chi phí & Xác nhận thanh toán</h1>
      </header>

      <div className="flex gap-6 flex-1">
        {/* Left Column */}
        <div className="flex-[2] space-y-6">

          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Thông tin phiên gửi xe</h3>
                <p className="text-sm text-gray-500">Đối chiếu lại các thông tin của phương tiện vào/ra</p>
              </div>
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">Đang hoạt động</span>
            </div>

            <div className="grid grid-cols-3 gap-y-6">
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Mã Phiên hệ thống (Session ID)</p>
                <p className="text-base font-bold text-gray-800">SS-45071 (Walk-in)</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Loại phương tiện</p>
                <p className="text-base font-bold text-gray-800">Xe ô tô 4 chỗ (Nhóm C)</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Mã Đặt chỗ</p>
                <p className="text-base font-bold text-gray-400">N/A</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Lối vào (Cổng)</p>
                <p className="text-base font-bold text-gray-800">Gate 01</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Lối ra dự kiến (Cổng hiện tại)</p>
                <p className="text-base font-bold text-gray-800">Gate 03 (South B)</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Nhân viên trực</p>
                <p className="text-base font-bold text-gray-800">Nguyễn Văn An</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Thời gian vào thực tế</p>
                <p className="text-base font-bold text-gray-800">06/05/2026 - 14:30</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Thời gian ra hiện tại</p>
                <p className="text-base font-bold text-blue-600">06/05/2026 - 22:42</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Vị trí đỗ</p>
                <p className="text-base font-bold text-gray-800 flex items-center gap-1">
                  <MapPin size={16} className="text-gray-400" /> Khu A - Tầng B - A-12
                </p>
              </div>
            </div>
          </div>

          {/* Verification Box */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h3 className="text-base font-bold text-gray-800 mb-4">Nhận dạng phương tiện</h3>
            <p className="text-sm text-gray-500 mb-4">Vui lòng đối chiếu hình ảnh thực tế và dữ liệu đăng ký/vào bãi.</p>

            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Biển số xe ghi nhận</p>
                <p className="text-2xl font-black text-gray-900 tracking-wider">51H - 882.45</p>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Tổng thời gian đỗ</p>
                <p className="text-xl font-bold text-blue-600 flex items-center gap-2"><Clock size={20} /> 8h 12m</p>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedPlate}
                  onChange={(e) => setConfirmedPlate(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="font-semibold text-gray-800">Xác nhận đúng phương tiện này để thanh toán</span>
              </label>
            </div>

            <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">Lưu ý: Bắt buộc đối soát hình ảnh Camera thật kỹ. Các trường hợp mất xe hoặc thất thoát thẻ do check-out sai sẽ do nhân viên ca trực chịu trách nhiệm.</p>
            </div>
          </div>

          {/* Fee Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Chi tiết tính phí</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Phí cơ bản (2 giờ đầu)</span>
                <span className="font-semibold text-gray-800">15,000 VND</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Phí phụ trội (6 giờ tiếp theo)</span>
                <span className="font-semibold text-gray-800">30,000 VND</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center gap-2">Phí quá giờ (Booking) <span className="text-xs bg-red-100 text-red-600 px-2 rounded font-bold">Vi phạm</span></span>
                <span className="font-semibold text-gray-800">15,000 VND</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-100">
                <span className="text-gray-600 font-semibold">Tổng cộng phí dịch vụ</span>
                <span className="font-bold text-gray-800">60,000 VND</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Khuyến mãi / Giảm giá</span>
                <span className="font-semibold text-green-600">- 0 VND</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-1">TỔNG CỘNG PHẢI THU</p>
                <p className="text-xs text-blue-600">Đã bao gồm VAT (10%)</p>
              </div>
              <div className="text-4xl font-black text-blue-600">60,000 VND</div>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="flex-1 space-y-6">

          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4">Xác nhận Thanh toán</h3>
            <p className="text-sm text-gray-500 mb-6">Vui lòng chọn 1 trong 3 phương thức thanh toán sau.</p>

            <div className="space-y-3 mb-8">
              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                <div className="flex items-center gap-3">
                  <Banknote size={24} className={paymentMethod === 'cash' ? 'text-blue-600' : 'text-gray-500'} />
                  <span className={`font-bold ${paymentMethod === 'cash' ? 'text-blue-900' : 'text-gray-700'}`}>Tiền mặt</span>
                </div>
                <input type="radio" name="payment" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="w-5 h-5 text-blue-600" />
              </label>

              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                <div className="flex items-center gap-3">
                  <CreditCard size={24} className={paymentMethod === 'bank' ? 'text-blue-600' : 'text-gray-500'} />
                  <span className={`font-bold ${paymentMethod === 'bank' ? 'text-blue-900' : 'text-gray-700'}`}>Chuyển khoản Ngân hàng</span>
                </div>
                <input type="radio" name="payment" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} className="w-5 h-5 text-blue-600" />
              </label>

              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'qr' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                <div className="flex items-center gap-3">
                  <QrCode size={24} className={paymentMethod === 'qr' ? 'text-blue-600' : 'text-gray-500'} />
                  <span className={`font-bold ${paymentMethod === 'qr' ? 'text-blue-900' : 'text-gray-700'}`}>Quét mã QR (Momo/VNPay)</span>
                </div>
                <input type="radio" name="payment" checked={paymentMethod === 'qr'} onChange={() => setPaymentMethod('qr')} className="w-5 h-5 text-blue-600" />
              </label>
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-sm font-semibold text-gray-500">Trạng thái thanh toán:</span>
              <span className="text-sm font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded">Chưa thanh toán</span>
            </div>

            <button
              disabled={!confirmedPlate}
              onClick={() => navigate('/staff/checkout-completed', { state: { actionType: 'checkout' } })}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all ${confirmedPlate ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'}`}
            >
              XÁC NHẬN THANH TOÁN
            </button>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
            <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-500" /> Quy trình thanh toán
            </h3>
            <p className="text-xs text-blue-800 leading-relaxed">
              Nhân viên nhận tiền hoặc xác nhận khách hàng đã chuyển khoản thành công trên app. Chọn <strong>&quot;Xác nhận thanh toán&quot;</strong> để kết thúc phiên và mở barie cho xe ra. Nếu khách hàng không đủ tiền/có vấn đề, chọn &quot;Tạo sự cố / Báo cáo khẩn&quot;.
            </p>
          </div>

          {/* Timeline Mini */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Lịch sử Phiên (Tóm tắt)</h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] pl-4 md:pl-0 md:pr-4 md:group-odd:pr-0 md:group-odd:pl-4">
                  <div className="text-xs text-gray-400 font-semibold">14:30</div>
                  <div className="text-sm font-bold text-gray-800">Xe vào bãi thành công</div>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] pl-4 md:pl-0 md:pr-4 md:group-odd:pr-0 md:group-odd:pl-4">
                  <div className="text-xs text-gray-400 font-semibold">14:45</div>
                  <div className="text-sm font-bold text-gray-800">Cảm biến nhận diện đang đỗ</div>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-gray-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] pl-4 md:pl-0 md:pr-4 md:group-odd:pr-0 md:group-odd:pl-4">
                  <div className="text-xs text-gray-400 font-semibold">22:42</div>
                  <div className="text-sm font-bold text-blue-600">Tiến hành Check-out</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-gray-500">Loại thẻ: <span className="text-gray-800">Thẻ cứng vãng lai (RFID)</span></span>
            <div className="w-px h-4 bg-gray-300"></div>
            <span className="text-gray-500">Mã thiết bị: <span className="text-gray-800">POS-0012A</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-6 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors">
              Tạo sự cố (Báo cáo vi phạm)
            </button>
            <button className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">
              Hủy bỏ
            </button>
            <button
              disabled={!confirmedPlate}
              onClick={() => navigate('/staff/checkout-completed', { state: { actionType: 'checkout' } })}
              className={`px-8 py-2.5 rounded-xl font-bold transition-colors ${confirmedPlate ? 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Hoàn tất thanh toán
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffPaymentConfirm
