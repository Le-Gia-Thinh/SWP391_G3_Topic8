import React from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  User, 
  Car, 
  Building, 
  Clock, 
  CalendarDays,
  AlertCircle,
  ShieldCheck,
  Ban,
  Copy,
  Download,
  Eye,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DriverBookingConfirmation = () => {
  return (
    <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Xác nhận đặt chỗ</h1>
        <div className="h-4 w-px bg-gray-300"></div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          <MapPin size={16} className="text-blue-500" />
          District 1 Parking Tower
        </div>
      </div>

      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8 flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-green-800">Vị trí của bạn đã được giữ chỗ thành công!</h2>
            <p className="text-sm text-green-700 mt-1">Cảm ơn bạn đã sử dụng dịch vụ. Vui lòng kiểm tra thông tin chi tiết bên dưới.</p>
          </div>
        </div>
        <div className="hidden sm:block">
          <span className="bg-white text-green-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-green-100">Đang hoạt động</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Details */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CalendarDays className="text-blue-500" size={20} />
              Thông tin chi tiết đặt chỗ
            </h3>
            
            <p className="text-sm text-gray-500 mb-6">Vui lòng xuất trình thông tin này khi đến bãi đỗ xe.</p>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-50 gap-1">
                <span className="text-gray-500 text-sm flex items-center gap-2"><User size={16} /> Tên tài xế</span>
                <span className="font-bold text-gray-900">Nguyễn Văn A</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-50 gap-1">
                <span className="text-gray-500 text-sm flex items-center gap-2"><Car size={16} /> Biển số xe</span>
                <span className="font-bold text-gray-900">51K - 123.45</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-50 gap-1">
                <span className="text-gray-500 text-sm flex items-center gap-2"><Car size={16} /> Loại phương tiện</span>
                <span className="font-medium text-gray-900">Ô tô (4-7 chỗ)</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-50 gap-1">
                <span className="text-gray-500 text-sm flex items-center gap-2"><Building size={16} /> Tòa nhà đỗ xe</span>
                <span className="font-medium text-gray-900">District 1 Parking Tower</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-50 gap-1">
                <span className="text-gray-500 text-sm flex items-center gap-2"><MapPin size={16} /> Vị trí đỗ</span>
                <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">Tầng 2 / Khu A / Số 102</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-50 gap-1">
                <span className="text-gray-500 text-sm flex items-center gap-2"><Clock size={16} /> Thời gian bắt đầu</span>
                <span className="font-bold text-gray-900">14:30 - 24/10/2023</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-gray-50 gap-1">
                <span className="text-gray-500 text-sm flex items-center gap-2"><Clock size={16} /> Thời gian dự kiến</span>
                <span className="font-medium text-gray-900">4 Giờ 00 Phút</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-1">
                <span className="text-gray-500 text-sm flex items-center gap-2"><Clock size={16} /> Thời gian hết hạn</span>
                <span className="font-bold text-red-600">18:30 - 24/10/2023</span>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              Lưu ý quan trọng
            </h3>
            
            <div className="space-y-4">
              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-5 flex gap-3">
                <AlertCircle className="text-orange-500 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-orange-800 text-sm mb-1">Thời gian hiệu lực</h4>
                  <p className="text-xs text-orange-700 leading-relaxed">Vui lòng đến bãi đỗ xe trước thời hạn <span className="font-bold">14:30</span>. Sau thời gian này, nếu bạn chưa check-in vị trí tự động bị hủy và vị trí sẽ được giải phóng cho người khác.</p>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex gap-3">
                <ShieldCheck className="text-blue-500 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-blue-800 text-sm mb-1">Quy trình vào cổng</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">Hệ thống camera sẽ tự động nhận diện <span className="font-bold">biển số xe</span> hoặc <span className="font-bold">Mã đặt chỗ</span>. Sau khi mở barie, bạn có thể di chuyển phương tiện đến vị trí xe.</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex gap-3">
                <Ban className="text-gray-500 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-gray-700 text-sm mb-1">Chính sách hủy</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">Bạn có thể hủy đặt chỗ miễn phí trước 30 phút. Quá thời gian này có thể phát sinh phí hủy dịch vụ theo quy định.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 shadow-sm text-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mã đặt chỗ của bạn</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl py-4 mb-4 relative overflow-hidden group cursor-pointer hover:bg-blue-100 transition-colors">
              <h2 className="text-3xl font-black text-blue-600 tracking-wider">BK-1025</h2>
              <div className="absolute top-2 right-2 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <Copy size={16} />
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              Cung cấp biển số xe <span className="font-bold text-gray-900">51K - 123.45</span> hoặc mã này cho nhân viên tại cổng vào.
            </p>
            
            <div className="space-y-3">
              <Link to="/driver/history" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 text-sm">
                <Eye size={16} />
                Xem danh sách của tôi
              </Link>
              <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                <Download size={16} />
                Tải xuống vé (PDF)
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">Vị trí bãi xe</h4>
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh
              </p>
              <Link to="#" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                Xem trên bản đồ <ArrowRight size={13} />
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 sm:left-64 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-500">Phiên bản hiện tại v2.4.0</p>
              <p className="text-xs text-gray-400">Parking Building Management System</p>
            </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="text-sm font-bold text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors shrink-0">
              Hủy đặt chỗ này
            </button>
            <Link to="/driver/booking" className="flex-1 sm:flex-none text-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-6 rounded-xl transition-colors text-sm">
              Đặt thêm chỗ mới
            </Link>
            <button className="flex-1 sm:flex-none text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-md shadow-blue-200 text-sm">
              Xem chi tiết chỗ đỗ
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DriverBookingConfirmation;
