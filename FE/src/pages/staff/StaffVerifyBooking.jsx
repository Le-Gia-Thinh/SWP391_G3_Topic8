import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Search, ShieldCheck, AlertTriangle, XCircle, FileText, RefreshCcw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const StaffVerifyBooking = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24">
      {/* Header breadcrumb */}
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <ChevronLeft size={16} className="cursor-pointer" onClick={() => navigate(-1)} />
        <span>Nhân viên</span> <ChevronRight size={14} />
        <span>Check-in đặt chỗ</span> <ChevronRight size={14} />
        <span className="text-blue-600 font-medium">Xác thực</span>
      </div>

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Xác thực Đặt chỗ</h1>
        <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            CỔNG VÀO: GATE-01 <ShieldCheck size={16} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-6 flex-1">

        {/* Top Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-blue-900">Đang xử lý Booking: BK-8829-2024</h2>
              <p className="text-sm text-blue-700">Vui lòng đối soát thông tin bên dưới trước khi cho xe vào.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <Search size={16} /> Quay lại Dashboard
          </button>
        </div>

        <div className="flex gap-6">
          {/* Left Column */}
          <div className="flex-[2] space-y-6">

            {/* Booking Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Thông tin Đặt chỗ chi tiết</h3>
                  <p className="text-sm text-gray-500">Dữ liệu được trích xuất từ hệ thống quản lý đặt chỗ</p>
                </div>
                <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-md">Đã xác nhận</span>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Mã đặt chỗ (Booking Code)</p>
                  <p className="text-base font-bold text-gray-800">BK-8829-2024</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">ID Hệ thống</p>
                  <p className="text-base font-bold text-gray-800">#10-991200</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Tên tài xế</p>
                  <p className="text-base font-bold text-gray-800">Trần Hoàng Nam</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Biển số xe</p>
                  <p className="text-lg font-black text-gray-900">30A-997.21</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Loại phương tiện</p>
                  <p className="text-base font-bold text-gray-800">Ôtô (4-7 chỗ)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Vị trí bảo lưu</p>
                  <p className="text-base font-bold text-gray-800">Khu A - Slot A12</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Thời gian đặt</p>
                  <p className="text-base font-bold text-gray-800">10:30, 24 Th05 2026</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Hết hạn lúc</p>
                  <p className="text-base font-bold text-gray-800">11:30, 24 Th05 2026</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-400 italic">Dữ liệu cập nhật 2 phút trước</span>
                <button className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
                  <RefreshCcw size={14} /> Dữ liệu Bảo mật Hệ thống
                </button>
              </div>
            </div>

            {/* Check-in Confirm Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Xác nhận Phiên Check-in</h3>
              <p className="text-sm text-gray-500 mb-6 border-b border-gray-100 pb-4">Thông tin sẽ được ghi nhận vào hệ thống sau khi xác nhận</p>

              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Loại Phiên (Session Type)</p>
                  <p className="text-base font-bold text-gray-800">BOOKING (Theo lịch đặt)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Nhân viên thực hiện</p>
                  <p className="text-base font-bold text-gray-800">Nguyễn Văn An</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Thời gian vào thực tế</p>
                  <p className="text-base font-bold text-gray-800">10:45:12, 24 Th05 2026</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Vị trí phân bổ</p>
                  <p className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm">SLOT-A12</span>
                    <span className="text-xs text-gray-500 font-normal">(Đúng vị trí đã đặt)</span>
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="flex-1 space-y-6">

            {/* Validation Results */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-bold text-gray-800 mb-1">Kết quả Đối soát</h3>
              <p className="text-xs text-gray-500 mb-6">Kiểm tra chéo thông tin thực tế và hệ thống</p>

              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">Trạng thái đặt chỗ</p>
                    <p className="text-sm font-bold text-gray-800">Booking còn hiệu lực</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">Hợp lệ</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">Vị trí bãi đỗ</p>
                    <p className="text-sm font-bold text-gray-800">Slot A12 vẫn đang chờ</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">Hợp lệ</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">Loại phương tiện</p>
                    <p className="text-sm font-bold text-gray-800">Khớp với dữ liệu đăng ký</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">Hợp lệ</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">Biển số xe</p>
                    <p className="text-sm font-bold text-gray-800">Khớp 100% (30A-997.21)</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">Hợp lệ</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-0.5">Thời gian hiệu lực</p>
                    <p className="text-sm font-bold text-gray-800">Còn 45 phút trước khi hết hạn</p>
                  </div>
                  <span className="text-sm font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Cảnh báo</span>
                </div>
              </div>
            </div>

            {/* Alert Note */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-gray-500" /> Lưu ý Quan trọng
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-3 text-sm">
                <AlertTriangle size={20} className="text-gray-500 shrink-0" />
                <p className="text-gray-700">Tài xế có 1 lịch sử hủy đặt chỗ trong 30 ngày qua.</p>
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center italic">Không phát hiện sai phạm nghiêm trọng cho mã đặt chỗ này.</p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate('/staff/checkin-success', { state: { actionType: 'booking-checkin' } })}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-colors text-lg"
              >
                Xác nhận Cho xe vào
              </button>
              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex justify-center items-center gap-2">
                  <XCircle size={18} /> Từ chối (Reject)
                </button>
                <button onClick={() => navigate('/staff/create-incident')} className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex justify-center items-center gap-2">
                  <FileText size={18} /> Tạo Sự cố
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Minimal Status Footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/60 py-3 px-6 z-20 flex justify-between items-center text-xs shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 text-gray-500">
           <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </div>
            <span className="font-bold text-gray-700 uppercase tracking-wide">Quy trình tự động:</span>
            <span className="hidden md:inline">Cập nhật trạng thái Booking <span className="mx-1.5 text-gray-300">|</span> Kích hoạt Phiên <span className="mx-1.5 text-gray-300">|</span> Cập nhật Slot</span>
        </div>
        <div className="flex items-center gap-4 text-gray-400 font-medium">
          <Link to="/staff/user-guide" className="hover:text-blue-600 transition-colors">Hướng dẫn</Link>
          <span className="text-gray-200">|</span>
          <Link to="/staff/support" className="hover:text-blue-600 transition-colors">Hỗ trợ & Báo lỗi</Link>
          <span className="text-gray-200">|</span>
          <span>v2.4.0-stable</span>
        </div>
      </div>
    </div>
  )
}

export default StaffVerifyBooking
