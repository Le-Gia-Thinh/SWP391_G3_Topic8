import React from 'react';
import { ChevronRight, CheckCircle2, ShieldCheck, MapPin, Calendar, Clock, Edit3, Home, Info, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StaffBookingSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24">
      {/* Header breadcrumb */}
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <span>Nhân viên</span> <ChevronRight size={14} />
        <span>Check-in đặt chỗ</span> <ChevronRight size={14} />
        <span className="text-blue-600 font-medium">Thành công</span>
      </div>
      
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Booking Check-in Successful</h1>
        <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            CỔNG VÀO: GATE-01 (MAIN) <ShieldCheck size={16} />
          </div>
        </div>
      </header>

      <div className="flex gap-6 flex-1">
        {/* Left Column */}
        <div className="flex-[2] space-y-6">
          {/* Success Banner */}
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600 mt-1 shrink-0">
              <CheckCircle2 size={32} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Đã Check-in Thành công!</h2>
              <p className="text-gray-500 text-sm mb-4">Mã đặt chỗ đã được chuyển đổi thành một phiên gửi xe đang hoạt động trong hệ thống.</p>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md border border-gray-200 uppercase">Trạng thái Booking: <strong>USED</strong></span>
                <span className="text-xs font-semibold px-3 py-1.5 bg-green-100 text-green-700 rounded-md border border-green-200 uppercase">Trạng thái Phiên: <strong>ACTIVE</strong></span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-500" /> Chi tiết Phiên & Đặt chỗ
              </h3>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-md uppercase">INTERNAL_DATA_STRICT</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-semibold">ID Phiên Tạo mới (ID)</span>
                <span className="font-bold text-blue-600">PS-20240518-0099</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-semibold">Loại hình phiên</span>
                <span className="font-medium text-gray-800">Booking (Nhận đặt chỗ trước)</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-semibold">Mã Đặt chỗ (Booking Code)</span>
                <span className="font-bold text-gray-800">BK-8829</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-semibold">Mã định danh Chủ xe</span>
                <span className="font-medium text-gray-800">CUS-00192-752104</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-semibold">Chủ xe lái</span>
                <span className="font-medium text-gray-800">Trần Hoàng Nam</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-semibold">Biển số xe</span>
                <span className="font-black text-gray-900 border border-gray-200 px-2 py-1 rounded">30A-997.21</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-semibold">Loại phương tiện</span>
                <span className="font-medium text-gray-800">Ôtô (4-7 chỗ)</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-semibold">Thời gian vào</span>
                <span className="font-medium text-gray-800">10:45:12 | 24/05/2026</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-semibold">Cổng vào</span>
                <span className="font-medium text-gray-800">Gate 01 (Lối đi chính xe cơ giới)</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-semibold">Vị trí đỗ chỉ định</span>
                <span className="font-bold text-blue-600">Tầng B - Khu A - SLOT B2</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 font-semibold">Nhân viên check-in (User)</span>
                <span className="font-medium text-gray-800">Nguyễn Văn An (ST-1011-200)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 space-y-6">
          
          {/* Top Right Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-4">Quyền sở hữu thuộc</p>
            <p className="text-xs text-gray-400 mb-1">MÃ ĐẶT CHỖ</p>
            <h3 className="text-4xl font-black text-blue-600 mb-2">BK-1025</h3>
            <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 mb-6">SỬ DỤNG</span>

            <p className="text-xs text-gray-500 italic mb-8 border border-gray-100 bg-gray-50 p-3 rounded-lg text-left">
              "Trong quá trình xuất bãi xe này sẽ tự động tra dữ liệu Booking vì loại hình Check-in là BOOKING. Nhân viên không cần phải nhập thủ công mã Booking."
            </p>

            <div className="flex gap-3 w-full">
              <button className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex justify-center items-center gap-2">
                <Edit3 size={18} /> Sửa nhật ký
              </button>
              <button 
                onClick={() => navigate('/staff/dashboard')}
                className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
              >
                Về Dashboard <Home size={18} />
              </button>
            </div>
          </div>

          {/* Bottom Right Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-600 mb-6 uppercase border-b border-gray-100 pb-2">Cập nhật trạng thái ô đỗ</h3>
            
            <div className="flex justify-between items-center mb-6 px-2">
              <div className="text-center">
                <div className="text-xl font-bold text-orange-500 mb-1">SLOT B2</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Trạng thái (Cũ)</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ArrowRight size={24} className="text-gray-300" />
                <span className="text-[10px] bg-red-100 text-red-600 px-2 rounded-full font-bold">ĐANG ĐỖ</span>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600 mb-1">SLOT B2</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Trạng thái (Mới)</div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase">Vị trí</span>
              <span className="text-sm font-bold text-gray-800">Tầng B - Khu A</span>
            </div>

            <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-100 flex items-center justify-center gap-1">
              <CheckCircle2 size={14} /> Hệ thống đã nhận cảm biến đỗ thành công.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-3">
            <Info size={20} className="text-blue-500 shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 text-sm mb-1">Hướng dẫn Check-out</h4>
              <ul className="text-xs text-blue-700 list-disc pl-4 space-y-1">
                <li>Tra cứu bằng <strong>Biển số xe</strong> tại màn Check-out.</li>
                <li>Lịch sử sẽ tự động liên kết với Booking ID để hiển thị đầy đủ thông tin.</li>
                <li>In biên lai nếu khách hàng yêu cầu.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8 text-sm font-medium text-gray-500">
            <span>Hệ thống: Ổn định</span>
            <span className="flex items-center gap-2"><Clock size={16} /> Đồng bộ cuối: 10:45:15 - 24/05/2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 mr-4">Trạng thái Đồng bộ thiết bị: <span className="text-green-500 font-semibold">Hoàn thành</span></span>
            <button className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">
              Đi đến Check-out
            </button>
            <button 
              onClick={() => navigate('/staff/dashboard')}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors"
            >
              Màn hình Check-in mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffBookingSuccess;
