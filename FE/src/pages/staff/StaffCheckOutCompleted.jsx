import React from 'react'
import { ChevronRight, CheckCircle2, FileText, Home, ArrowRight, Printer, AlertTriangle, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const StaffCheckOutCompleted = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24">
      {/* Header breadcrumb */}
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <span>Nhân viên</span> <ChevronRight size={14} />
        <span>Thanh toán xe ra</span> <ChevronRight size={14} />
        <span className="text-blue-600 font-medium">Hoàn tất</span>
      </div>

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Check-out Hoàn tất</h1>
      </header>

      <div className="flex gap-6 flex-1">
        {/* Left Column */}
        <div className="flex-[2] space-y-6">
          {/* Success Banner */}
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full text-green-600 shrink-0">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Check-out thành công!</h2>
                <p className="text-gray-500 text-sm">Khách hàng đã thanh toán và barrie mở thành công.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <Printer size={16} /> In biên lai
              </button>
              <button
                onClick={() => navigate('/staff/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-md shadow-blue-200"
              >
                <Home size={16} /> Về trang chủ
              </button>
            </div>
          </div>

          {/* Session Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" /> Tóm tắt phiên gửi xe
            </h3>

            <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500 font-semibold">Mã Phiên Nội bộ</span>
                <span className="font-bold text-gray-800">SS-45071</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500 font-semibold">Loại phương tiện</span>
                <span className="font-bold text-gray-800">Ô tô (4-7 chỗ)</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500 font-semibold">Cổng vào</span>
                <span className="font-bold text-gray-800">Gate 01</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500 font-semibold">Thời gian vào</span>
                <span className="font-bold text-gray-800">10/10/2026, 08:30 AM</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500 font-semibold">Biển số (thực tế)</span>
                <span className="font-bold text-gray-800">N/A</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500 font-semibold">Thời gian ra</span>
                <span className="font-bold text-gray-800">10/10/2026, 04:45 PM</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500 font-semibold">Biển số (ra)</span>
                <span className="font-black text-gray-900 bg-gray-100 px-2 py-1 rounded">29A-123.45</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500 font-semibold">Tổng thời lượng</span>
                <span className="font-bold text-blue-600">8 giờ 15 phút</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex justify-between items-center">
              <span className="text-sm font-bold text-blue-900 uppercase">Tổng số tiền đã thu</span>
              <span className="text-3xl font-black text-blue-600">130,000 VND</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-600" /> Thông tin thanh toán
              </h3>
              <div className="flex gap-3">
                <button className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors">
                  <FileText size={16} /> Xem chi tiết Phiếu thu
                </button>
                <button className="text-sm font-semibold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                  <AlertTriangle size={16} /> Báo cáo sai sót
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Mã giao dịch</p>
                <p className="text-sm font-bold text-gray-800">PAY-8791-A92B</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Phương thức</p>
                <p className="text-sm font-bold text-gray-800">Tiền mặt (Nhân viên)</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Số tiền</p>
                <p className="text-sm font-bold text-blue-600">130,000 VND</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Thời gian thanh toán</p>
                <p className="text-sm font-bold text-gray-800">10/10/2026, 04:46 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-gray-600 mb-6 uppercase border-b border-gray-100 w-full pb-2 text-left">Cập nhật vị trí đỗ</h3>

            <div className="text-3xl font-black text-blue-600 mb-2">P-A102</div>
            <p className="text-xs text-gray-400 font-semibold uppercase mb-6">MÃ VỊ TRÍ ĐỖ</p>

            <div className="flex items-center justify-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 w-full mb-6">
              <span className="text-sm font-bold text-red-500 bg-white border border-red-200 px-3 py-1.5 rounded shadow-sm">Đang có xe</span>
              <ArrowRight size={20} className="text-gray-400" />
              <span className="text-sm font-bold text-green-600 bg-white border border-green-200 px-3 py-1.5 rounded shadow-sm">Trống</span>
            </div>

            <p className="text-xs text-green-600 bg-green-50 w-full py-3 rounded-lg border border-green-100 flex items-center justify-center gap-1.5">
              <CheckCircle2 size={16} /> Cảm biến đã xác nhận xe rời vị trí.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-sm font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <CheckCircle2 size={16} /> Không phát hiện lỗi
            </span>
            <div className="text-xs text-gray-500">
              <p className="font-semibold text-gray-700">Trạng thái Hệ thống</p>
              <p>Kết nối máy in: Sẵn sàng • Cảm biến: Online</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-400 text-right mr-4">
              <p>Nhân viên: Nguyễn Văn An</p>
              <p>Phiên trực: STF-C01-09</p>
            </div>
            <button
              onClick={() => navigate('/staff/checkout')}
              className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center gap-2 text-lg"
            >
              Check-out xe mới <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffCheckOutCompleted
