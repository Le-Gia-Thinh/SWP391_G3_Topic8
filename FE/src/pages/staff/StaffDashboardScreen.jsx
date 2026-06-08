import React from 'react';
import { 
  Car, 
  Grid, 
  LogOut, 
  CreditCard, 
  Clock, 
  ChevronRight,
  Search,
  AlertTriangle,
  Map,
  ArrowRightLeft,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, colorClass, borderColorClass }) => (
  <div className={`bg-white rounded-xl p-5 border-l-4 ${borderColorClass} shadow-sm flex flex-col justify-between`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-sm font-medium text-gray-500">{title}</span>
      <div className={`p-2 rounded-lg ${colorClass}`}>
        {icon}
      </div>
    </div>
    <span className="text-2xl font-bold text-gray-800">{value}</span>
  </div>
);

const QuickActionCard = ({ title, desc, icon, iconColorClass, onClick }) => (
  <button onClick={onClick} className="bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all rounded-xl p-4 flex items-center gap-4 text-left group">
    <div className={`p-3 rounded-xl ${iconColorClass} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div className="flex-1">
      <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{title}</h4>
      <p className="text-xs text-gray-500 line-clamp-1">{desc}</p>
    </div>
    <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
  </button>
);

const AlertItem = ({ title, time, type }) => {
  const isError = type === 'error';
  return (
    <div className={`p-4 rounded-xl border ${isError ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'} flex gap-3 mb-3`}>
      <div className="mt-0.5">
        <AlertTriangle size={16} className={isError ? 'text-red-500' : 'text-gray-500'} />
      </div>
      <div>
        <h5 className={`text-sm font-semibold ${isError ? 'text-red-800' : 'text-gray-700'}`}>{title}</h5>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <Clock size={12} /> {time}
        </p>
      </div>
    </div>
  );
};

const StaffDashboardScreen = () => {
  const navigate = useNavigate();
  const recentIns = [
    { id: '#8821', type: 'Vãng lai', typeColor: 'bg-gray-100 text-gray-600', plate: '51G-123.45', vehicle: 'Ô tô 4 chỗ', time: '10:45:12', slot: 'A-024', staff: 'Nguyễn An' },
    { id: '#8820', type: 'Booking', typeColor: 'bg-blue-50 text-blue-600', plate: '30H-998.21', vehicle: 'Ô tô 7 chỗ', time: '10:42:05', slot: 'B-112', staff: 'Nguyễn An' },
    { id: '#8819', type: 'Vãng lai', typeColor: 'bg-gray-100 text-gray-600', plate: '43A-552.12', vehicle: 'Xe máy', time: '10:39:58', slot: 'M-005', staff: 'Nguyễn An' },
    { id: '#8818', type: 'Vãng lai', typeColor: 'bg-gray-100 text-gray-600', plate: '29D-111.90', vehicle: 'Bán tải', time: '10:25:30', slot: 'C-010', staff: 'Nguyễn An' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-6">
        {/* Main Content (Left) */}
        <div className="flex-1 space-y-6">
          {/* Stats */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Grid size={20} className="text-blue-500" /> Tóm tắt vận hành
            </h3>
            <div className="grid grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard title="Xe trong bãi" value="1,245" icon={<Car size={18} className="text-blue-600" />} colorClass="bg-blue-50" borderColorClass="border-blue-500" />
              <StatCard title="Chỗ trống" value="155" icon={<Grid size={18} className="text-green-600" />} colorClass="bg-green-50" borderColorClass="border-green-500" />
              <StatCard title="Check-in hôm nay" value="842" icon={<ArrowRightLeft size={18} className="text-purple-600" />} colorClass="bg-purple-50" borderColorClass="border-purple-500" />
              <StatCard title="Check-out hôm nay" value="798" icon={<LogOut size={18} className="text-orange-600" />} colorClass="bg-orange-50" borderColorClass="border-orange-500" />
              <StatCard title="Chưa thanh toán" value="12" icon={<CreditCard size={18} className="text-red-600" />} colorClass="bg-red-50" borderColorClass="border-red-500" />
              <StatCard title="Lượt đặt trước" value="45" icon={<Clock size={18} className="text-indigo-600" />} colorClass="bg-indigo-50" borderColorClass="border-indigo-500" />
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ArrowRightLeft size={20} className="text-blue-500" /> Thao tác nhanh
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <QuickActionCard title="Nhận xe vãng lai" desc="Nhập biển số cho xe không có đặt trước" icon={<Car size={20} className="text-blue-600" />} iconColorClass="bg-blue-50" onClick={() => navigate('/staff/checkin-walkin')} />
              <QuickActionCard title="Nhận xe đặt trước" desc="Quét mã hoặc nhập mã đặt chỗ" icon={<Clock size={20} className="text-purple-600" />} iconColorClass="bg-purple-50" onClick={() => navigate('/staff/checkin-booking')} />
              <QuickActionCard title="Thanh toán & Trả xe" desc="Tính tiền và xác nhận xe ra" icon={<LogOut size={20} className="text-orange-600" />} iconColorClass="bg-orange-50" onClick={() => navigate('/staff/checkout')} />
              <QuickActionCard title="Tra cứu phiên" desc="Tìm kiếm lịch sử vào/ra theo biển số" icon={<Search size={20} className="text-indigo-600" />} iconColorClass="bg-indigo-50" />
              <QuickActionCard title="Tạo sự cố" desc="Báo cáo mất thẻ, hỏng thiết bị, va chạm" icon={<AlertTriangle size={20} className="text-red-600" />} iconColorClass="bg-red-50" onClick={() => navigate('/staff/create-incident')} />
              <QuickActionCard title="Xem sơ đồ chỗ" desc="Kiểm tra chi tiết vị trí các ô đỗ" icon={<Map size={20} className="text-green-600" />} iconColorClass="bg-green-50" />
            </div>
          </div>

          {/* Recent Check-ins Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Lượt vào gần đây</h3>
                <p className="text-xs text-gray-500">Danh sách 5 phiên nhận xe mới nhất</p>
              </div>
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Xem tất cả
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 text-gray-500 font-medium">
                  <tr>
                    <th className="py-3 px-5">ID Phiên</th>
                    <th className="py-3 px-5">Loại</th>
                    <th className="py-3 px-5">Biển số</th>
                    <th className="py-3 px-5">Loại xe</th>
                    <th className="py-3 px-5">Thời gian vào</th>
                    <th className="py-3 px-5">Ô đỗ</th>
                    <th className="py-3 px-5">NV Trực</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentIns.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-5 font-medium text-blue-600">{item.id}</td>
                      <td className="py-3 px-5">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${item.typeColor}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-5 font-bold text-gray-800">{item.plate}</td>
                      <td className="py-3 px-5 text-gray-600">{item.vehicle}</td>
                      <td className="py-3 px-5 text-gray-600">{item.time}</td>
                      <td className="py-3 px-5 font-medium text-gray-800">{item.slot}</td>
                      <td className="py-3 px-5 text-gray-600">{item.staff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Sidebar - Alerts */}
        <div className="w-80 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" /> Thông báo & Cảnh báo
              </h3>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-md">8 Mới</span>
            </div>
            
            <div className="space-y-1">
              <AlertItem title="Sai lệch biển số: 51G-123.45 (Cổng A)" time="3 phút trước" type="error" />
              <AlertItem title="Lượt đặt trước #BK-992 sắp hết hạn" time="15 phút trước" type="warning" />
              <AlertItem title="Cần thanh toán: Xe 30H-112.00 quá hạn 2h" time="34 phút trước" type="error" />
              <AlertItem title="Bảo trì ô đỗ khu vực C-010 đến C-015" time="1 giờ trước" type="warning" />
            </div>

            <button className="w-full mt-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2">
              XEM TẤT CẢ LỊCH SỬ <ChevronRight size={16} />
            </button>
          </div>

          {/* Quick Search */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2 uppercase">
              <Search size={16} /> Tra cứu nhanh biển số
            </h3>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Nhập biển số xe..." 
                className="w-full py-2.5 pl-4 pr-10 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              />
              <Search size={18} className="absolute right-3 top-2.5 text-blue-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardScreen;
