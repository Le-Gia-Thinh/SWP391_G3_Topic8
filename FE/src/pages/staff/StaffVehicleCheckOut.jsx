import React from 'react';
import { ChevronRight, Search, FileSearch, Filter, AlertTriangle, UserPlus, HelpCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StaffVehicleCheckOut = () => {
  const navigate = useNavigate();

  const sessions = [
    { id: 'SS-45071', type: 'Walk-in', booking: '-', plate: '29A-123.45', vehicle: 'Ô tô 4 chỗ', timeIn: '08:15 - 14 Th1', slot: 'A-12', duration: '1h 15m', status: 'Đang đỗ' },
    { id: 'SS-45072', type: 'Booking', booking: 'BK-7721', plate: '12F-9874.12', vehicle: 'Ô tô 7 chỗ', timeIn: '08:30 - 14 Th1', slot: 'B-01', duration: '4h 30m', status: 'Đang đỗ' },
    { id: 'SS-45073', type: 'Walk-in', booking: '-', plate: '30H-1445.71', vehicle: 'Xe máy', timeIn: '11:05 - 14 Th1', slot: 'M-44', duration: '1h 00m', status: 'Đang đỗ' },
    { id: 'SS-45074', type: 'Booking', booking: 'BK-0102', plate: '51G-666.11', vehicle: 'Ô tô 4 chỗ', timeIn: '11:45 - 14 Th1', slot: 'A-34', duration: '1h 45m', status: 'Đang đỗ' },
    { id: 'SS-45075', type: 'Walk-in', booking: '-', plate: '49A-001.21', vehicle: 'Ô tô bán tải', timeIn: '07:15 - 14 Th1', slot: 'C-02', duration: '5h 15m', status: 'Đang đỗ' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-16">
      {/* Header breadcrumb */}
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <span>Nhân viên</span> <ChevronRight size={14} />
        <span>Thanh toán</span> <ChevronRight size={14} />
        <span className="text-blue-600 font-medium">Vehicle Check-out</span>
      </div>
      
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Vehicle Check-out</h1>
        <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            Đồng bộ: Hoàn tất (Online) <span className="w-2 h-2 rounded-full bg-green-500 ml-1"></span>
          </div>
        </div>
      </header>

      <div className="flex gap-6 flex-1">
        {/* Left/Main Column */}
        <div className="flex-[3] space-y-6">
          
          {/* Search Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
              <FileSearch size={20} className="text-blue-600" /> Tìm kiếm phiên gửi xe
            </h3>
            <p className="text-sm text-gray-500 mb-6">Nhập thông tin 1 trong 3 trường để tìm kiếm phiên đỗ xe.</p>
            
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Biển số xe (Thực tế)</label>
                <input type="text" placeholder="VD: 30A-123.45" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-bold" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mã ID Thẻ (Thẻ cứng)</label>
                <input type="text" placeholder="VD: 001-2091" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mã Đặt chỗ (Thay check)</label>
                <input type="text" placeholder="VD: BK-9911" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">Làm mới</button>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 hover:bg-blue-700">Tìm phiên hoạt động</button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3 italic">* Hệ thống sẽ ưu tiên tìm kiếm theo thứ tự ưu tiên: Mã Thẻ &gt; Mã Đặt chỗ &gt; Biển số.</p>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                Danh sách Phiên đang hoạt động <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">5 phiên</span>
              </h3>
              <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
                <Filter size={16} /> Lọc kết quả
              </button>
            </div>

            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left text-sm">
                <thead className="text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-2">ID Phiên</th>
                    <th className="py-3 px-2">Loại</th>
                    <th className="py-3 px-2">Mã Booking</th>
                    <th className="py-3 px-2">Biển số xe</th>
                    <th className="py-3 px-2">Loại xe</th>
                    <th className="py-3 px-2">Thời gian vào</th>
                    <th className="py-3 px-2">Vị trí đỗ</th>
                    <th className="py-3 px-2">Thời lượng</th>
                    <th className="py-3 px-2">Trạng thái</th>
                    <th className="py-3 px-2 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sessions.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="py-3 px-2 font-bold text-blue-600">{item.id}</td>
                      <td className="py-3 px-2 text-gray-600">{item.type}</td>
                      <td className="py-3 px-2 text-gray-500">{item.booking}</td>
                      <td className="py-3 px-2 font-bold text-gray-800">{item.plate}</td>
                      <td className="py-3 px-2 text-gray-600">{item.vehicle}</td>
                      <td className="py-3 px-2 text-gray-600">{item.timeIn}</td>
                      <td className="py-3 px-2 font-bold text-gray-800">{item.slot}</td>
                      <td className="py-3 px-2 text-gray-600">{item.duration}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 bg-green-50 text-green-600 border border-green-200 rounded text-xs font-bold">{item.status}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button 
                          onClick={() => navigate('/staff/payment')}
                          className="px-4 py-1.5 bg-white border border-blue-600 text-blue-600 font-semibold rounded-lg text-xs hover:bg-blue-50"
                        >
                          Thanh toán
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State / Not Found State Example */}
            <div className="border border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center text-center bg-gray-50">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-400 mb-4 shadow-sm">
                <Search size={24} />
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">Không tìm thấy phiên hoạt động khớp với yêu cầu</h4>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                Kiểm tra lại Biển số xe / ID Thẻ / Mã Booking. Nếu xe thực tế đang ở cổng nhưng không có thông tin hệ thống, hãy tạo Báo cáo Sự cố để quản lý hỗ trợ xử lý ngay.
              </p>
              <div className="flex gap-3 justify-center">
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-50">
                  <Search size={16} /> Thử lại Tra cứu Phiên
                </button>
                <button 
                  onClick={() => navigate('/staff/create-incident')}
                  className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-100"
                >
                  <AlertTriangle size={16} /> Tạo Báo cáo sự cố
                </button>
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-50">
                  <UserPlus size={16} /> Kiểm tra quản lý
                </button>
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-gray-50">
                  <HelpCircle size={16} /> Xem chi tiết Hỗ trợ
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 space-y-6">
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
            <h3 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
              <ChevronRight size={16} className="text-blue-500" /> Hướng dẫn xử lý
            </h3>
            <ul className="space-y-4 text-sm text-blue-800">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <span>Sử dụng <strong>Biển số xe</strong> hoặc mã thẻ tương ứng của xe để lấy thông tin.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <span>Luôn đối chiếu hình ảnh biển số thực tế và hình ảnh nhận diện lúc check-in trước khi tính tiền.</span>
              </li>
            </ul>

            <div className="mt-6 bg-white rounded-lg p-4 border border-red-200 flex items-start gap-3 shadow-sm">
              <AlertCircle size={20} className="text-red-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800 mb-1">Trường hợp không tìm thấy phiên:</p>
                <p className="text-[10px] text-gray-600">Khách hàng bị mất thẻ hoặc biển số bị mờ/thay đổi lúc check-in. Vui lòng hỏi lại thông tin hoặc chuyển ca thành báo cáo sự cố.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center justify-between px-6 py-3 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> reading: Smart_Cam_01</span>
            <span>ID Sync record: #440019299</span>
          </div>
          <div className="flex gap-4">
            <span>Local Network: Connected</span>
            <a href="javascript:void(0)" className="text-blue-600 hover:underline">Verify last sync record</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffVehicleCheckOut;
