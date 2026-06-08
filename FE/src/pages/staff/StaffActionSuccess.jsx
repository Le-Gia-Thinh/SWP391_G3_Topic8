import React from 'react'
import { CheckCircle2, ChevronRight, Info, Car, MapPin, ArrowRight, Clock, ShieldCheck, Edit3, Home, Printer, AlertTriangle, FileText } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const StaffActionSuccess = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // actionType: 'walkin-checkin' | 'booking-checkin' | 'checkout'
  const actionType = location.state?.actionType || 'walkin-checkin' 

  const isWalkIn = actionType === 'walkin-checkin'
  const isBooking = actionType === 'booking-checkin'
  const isCheckOut = actionType === 'checkout'

  const title = isWalkIn ? 'Check-in Thành công' : isBooking ? 'Booking Check-in Successful' : 'Check-out Hoàn tất'
  const breadcrumb = isWalkIn ? 'Check-in Vãng lai' : isBooking ? 'Check-in đặt chỗ' : 'Thanh toán xe ra'

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24 animate-in fade-in">
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <span>Nhân viên</span> <ChevronRight size={14} />
        <span>{breadcrumb}</span> <ChevronRight size={14} />
        <span className="text-blue-600 font-medium">Thành công</span>
      </div>

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            {isCheckOut ? null : <><MapPin size={16} /> Cổng Bắc - Gate 02</>}
          </div>
        </div>
      </header>

      <div className="flex gap-6 flex-1 flex-col xl:flex-row">
        {/* Left Column */}
        <div className="flex-[2] space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600 mt-1 shrink-0">
              <CheckCircle2 size={32} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-xl font-bold text-gray-800">
                  {isCheckOut ? 'Check-out thành công!' : isBooking ? 'Đã Check-in Thành công!' : 'Phiên gửi xe đã được tạo!'}
                </h2>
                {!isCheckOut && <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded border border-green-200">Đang hoạt động</span>}
              </div>
              <p className="text-gray-500 text-sm">
                {isCheckOut ? 'Khách hàng đã thanh toán và barrie mở thành công.' : isBooking ? 'Mã đặt chỗ đã được chuyển đổi thành một phiên gửi xe đang hoạt động trong hệ thống.' : 'Yêu cầu check-in vãng lai đã được xử lý hoàn tất và ghi nhận vào hệ thống SmartPark.'}
              </p>
              {isBooking && (
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md border border-gray-200 uppercase">Trạng thái Booking: <strong>USED</strong></span>
                  <span className="text-xs font-semibold px-3 py-1.5 bg-green-100 text-green-700 rounded-md border border-green-200 uppercase">Trạng thái Phiên: <strong>ACTIVE</strong></span>
                </div>
              )}
              {isCheckOut && (
                <div className="flex gap-3 mt-4">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                    <Printer size={16} /> In biên lai
                  </button>
                  <button onClick={() => navigate('/staff/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 transition-colors">
                    <Home size={16} /> Về trang chủ
                  </button>
                </div>
              )}
            </div>
          </div>

          {isWalkIn && (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">LOẠI PHIÊN LÀM VIỆC</p>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-800">Check-in Vãng lai</h3>
                    <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md border border-blue-200">WALK_IN</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => navigate('/staff/checkin')} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors">
                    <Car size={18} /> Check-in mới
                  </button>
                  <button onClick={() => navigate('/staff/checkout')} className="px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg flex items-center gap-2 transition-colors">
                    Đi tới Check-out <ArrowRight size={18} />
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-3">
                <Info size={20} className="text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm mb-1">Lưu ý cho việc trả xe (Check-out):</h4>
                  <p className="text-sm text-blue-700">Đây là phiên vãng lai không có mã đặt chỗ trước. Nhân viên có thể tìm kiếm lại phiên này bằng <strong>Biển số xe</strong> tại màn hình Check-out.</p>
                </div>
              </div>
            </>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {isCheckOut ? <FileText size={20} className="text-blue-600" /> : <ShieldCheck size={20} className="text-blue-500" />}
                {isCheckOut ? 'Tóm tắt phiên gửi xe' : 'Chi tiết Phiên & Đặt chỗ'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 mb-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">ID Phiên Nội bộ</span><span className="font-bold text-blue-600">PS-20240518-0012</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Loại Phiên</span><span className="font-semibold text-gray-800">{isBooking ? 'Booking' : 'Vãng lai (Walk-in)'}</span>
              </div>
              {isBooking && (
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-500">Mã Đặt chỗ</span><span className="font-bold text-gray-800">BK-8829</span>
                </div>
              )}
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Thời gian vào</span><span className="font-bold text-gray-800">18/05/2026 14:30:45</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Biển số xe</span><span className="font-black text-gray-900 border border-gray-200 px-2 py-1 rounded">51H-999.88</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Loại phương tiện</span><span className="font-semibold text-gray-800">Xe ô tô (4-7 chỗ)</span>
              </div>
              {isCheckOut && (
                <>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-sm text-gray-500">Thời gian ra</span><span className="font-bold text-gray-800">18/05/2026, 17:45 PM</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-sm text-gray-500">Tổng thời lượng</span><span className="font-bold text-blue-600">3 giờ 15 phút</span>
                  </div>
                </>
              )}
            </div>

            {isCheckOut && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex justify-between items-center">
                <span className="text-sm font-bold text-blue-900 uppercase">Tổng số tiền đã thu</span>
                <span className="text-3xl font-black text-blue-600">130,000 VND</span>
              </div>
            )}
          </div>

          {isCheckOut && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ShieldCheck size={20} className="text-blue-600" /> Thông tin thanh toán</h3>
                <div className="flex gap-3">
                  <button className="text-sm font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                    <AlertTriangle size={16} /> Báo cáo sai sót
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Mã giao dịch</p><p className="text-sm font-bold text-gray-800">PAY-8791-A92B</p></div>
                <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Phương thức</p><p className="text-sm font-bold text-gray-800">Tiền mặt</p></div>
                <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Số tiền</p><p className="text-sm font-bold text-blue-600">130,000 VND</p></div>
                <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Thời gian</p><p className="text-sm font-bold text-gray-800">17:46 PM</p></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex-1 space-y-6">
          {isBooking && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-4">Quyền sở hữu thuộc</p>
              <p className="text-xs text-gray-400 mb-1">MÃ ĐẶT CHỖ</p>
              <h3 className="text-4xl font-black text-blue-600 mb-2">BK-1025</h3>
              <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 mb-6">SỬ DỤNG</span>
              <div className="flex gap-3 w-full">
                <button className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex justify-center items-center gap-2"><Edit3 size={18} /> Sửa</button>
                <button onClick={() => navigate('/staff/dashboard')} className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors flex justify-center items-center gap-2">Về Dashboard <Home size={18} /></button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <h3 className="text-sm font-bold text-gray-600 mb-4 uppercase">Cập nhật vị trí đỗ</h3>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <div className="text-3xl font-black text-blue-600 mb-1">A-102</div>
              <div className="text-xs text-blue-500 font-medium">Mã ô đỗ đã được cập nhật</div>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm font-bold">
              <span className={`px-4 py-2 rounded-lg border ${isCheckOut ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {isCheckOut ? 'ĐANG ĐỖ' : 'TRỐNG'}
              </span>
              <ArrowRight size={20} className="text-gray-400" />
              <span className={`px-4 py-2 rounded-lg border shadow-sm ${isCheckOut ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                {isCheckOut ? 'TRỐNG' : 'ĐÃ ĐỖ'}
              </span>
            </div>
            <p className="text-xs text-green-600 bg-green-50 px-3 py-2 mt-4 rounded-lg border border-green-100 flex items-center justify-center gap-1">
              <CheckCircle2 size={14} /> Hệ thống đã nhận cảm biến {isCheckOut ? 'rời' : 'vào'} vị trí.
            </p>
          </div>

          {!isCheckOut && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2"><Info size={18} className="text-blue-500" /> Hướng dẫn Check-out</h3>
              <div className="space-y-4">
                <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</div><p className="text-sm text-gray-600">Nhập <strong>Biển số xe</strong> tại màn hình Tra cứu Xe ra.</p></div>
                <div className="flex gap-3"><div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</div><p className="text-sm text-gray-600">Hệ thống sẽ tự động hiển thị chi tiết phiên này và tính toán phí gửi xe dựa trên thời gian thực tế.</p></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 gap-4 md:gap-0">
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2"><ArrowRight size={16} /> Trạng thái hệ thống: Ổn định</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/staff/dashboard')} className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">Về Dashboard</button>
            <button onClick={() => navigate(isCheckOut ? '/staff/checkout' : '/staff/checkin')} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 transition-colors">
              {isCheckOut ? 'Check-out xe mới' : 'Check-in mới'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffActionSuccess
