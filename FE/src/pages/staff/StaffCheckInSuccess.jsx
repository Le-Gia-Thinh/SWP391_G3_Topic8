import React from 'react'
import { CheckCircle2, ChevronRight, Info, Car, MapPin, ArrowRight, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const StaffCheckInSuccess = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24">
      {/* Header breadcrumb */}
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <span>Nhân viên</span> <ChevronRight size={14} />
        <span>Check-in Vãng lai</span> <ChevronRight size={14} />
        <span className="text-blue-600 font-medium">Thành công</span>
      </div>

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Check-in Thành công</h1>
        <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            <MapPin size={16} /> Cổng Bắc - Gate 02
          </div>
        </div>
      </header>

      <div className="flex gap-6 flex-1">
        {/* Left Column */}
        <div className="flex-[2] space-y-6">
          {/* Success Banner */}
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600 mt-1">
              <CheckCircle2 size={32} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-xl font-bold text-gray-800">Phiên gửi xe đã được tạo!</h2>
                <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded border border-green-200">Đang hoạt động</span>
              </div>
              <p className="text-gray-500 text-sm">Yêu cầu check-in vãng lai đã được xử lý hoàn tất và ghi nhận vào hệ thống SmartPark.</p>
            </div>
          </div>

          {/* Session Type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">LOẠI PHIÊN LÀM VIỆC</p>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-800">Check-in Vãng lai</h3>
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md border border-blue-200">WALK_IN</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/staff/checkin-walkin')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors"
              >
                <Car size={18} /> Check-in mới
              </button>
              <button className="px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg flex items-center gap-2 transition-colors">
                Đi tới Check-out <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Note */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-3">
            <Info size={20} className="text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 text-sm mb-1">Lưu ý cho việc trả xe (Check-out):</h4>
              <p className="text-sm text-blue-700">Đây là phiên vãng lai không có mã đặt chỗ trước. Nhân viên có thể tìm kiếm lại phiên này bằng <strong>Biển số xe</strong> tại màn hình Check-out.</p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Info size={20} className="text-blue-500" /> Chi tiết Phiên gửi xe
            </h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">ID Phiên Nội bộ</span>
                <span className="font-bold text-blue-600">PS-20240518-0012</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Thời gian vào</span>
                <span className="font-bold text-gray-800">18/05/2026 14:30:45</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Loại Phiên</span>
                <span className="font-semibold text-gray-800">Vãng lai (Walk-in)</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Cổng vào</span>
                <span className="font-semibold text-gray-800">Gate 02 - Cổng Bắc</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Mã Đặt chỗ</span>
                <span className="font-semibold text-gray-400">Không có (N/A)</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Tầng / Khu vực</span>
                <span className="font-semibold text-gray-800">Tầng B1 - Khu A</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Biển số xe</span>
                <span className="font-black text-gray-900 text-base">51H - 999.88</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Ô đỗ được chỉ định</span>
                <span className="font-bold text-blue-600">A-102</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Loại phương tiện</span>
                <span className="font-semibold text-gray-800">Xe ô tô (4-7 chỗ)</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500">Nhân viên xử lý</span>
                <span className="font-semibold text-gray-800">Nguyễn Văn Hoàng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 space-y-6">
          {/* Status Update */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <h3 className="text-sm font-bold text-gray-600 mb-4 uppercase">Cập nhật trạng thái ô đỗ</h3>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <div className="text-3xl font-black text-blue-600 mb-1">A-102</div>
              <div className="text-xs text-blue-500 font-medium">Mã ô đỗ đã được cập nhật</div>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm font-bold">
              <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg border border-gray-200">TRỐNG</span>
              <ArrowRight size={20} className="text-gray-400" />
              <span className="px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 shadow-sm">ĐÃ ĐỖ</span>
            </div>
            <p className="text-xs text-gray-400 mt-4 italic">Hệ thống cảm biến đã xác nhận xe vào vị trí.</p>
          </div>

          {/* Guide */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Info size={18} className="text-blue-500" /> Hướng dẫn Check-out
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</div>
                <p className="text-sm text-gray-600">Nhập <strong>Biển số xe</strong> tại màn hình Tra cứu Xe ra.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</div>
                <p className="text-sm text-gray-600">Hệ thống sẽ tự động hiển thị chi tiết phiên này và tính toán phí gửi xe dựa trên thời gian thực tế.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</div>
                <p className="text-sm text-gray-600">Yêu cầu nhân viên <strong>xác nhận hình ảnh biển số</strong> khớp với thực tế trước khi thu tiền.</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">* Không cần in vé giấy cho loại hình vãng lai này.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2"><ArrowRight size={16} /> Trạng thái hệ thống: Ổn định</span>
            <span className="flex items-center gap-2"><Clock size={16} /> Đồng bộ cuối: 14:32:05 - 18/05/2026</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/staff/dashboard')}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
            >
              Quay lại Dashboard
            </button>
            <button className="px-6 py-2.5 rounded-xl bg-white border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-50 transition-colors">
              Tới màn hình Check-out
            </button>
            <button
              onClick={() => navigate('/staff/checkin-walkin')}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors"
            >
              Tạo Check-in mới
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffCheckInSuccess
