import React, { useState } from 'react';
import { 
  CalendarDays, 
  MapPin, 
  Car, 
  Clock, 
  Info,
  CheckCircle2,
  Building,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../../components/ui/Select';
import CustomCheckbox from '../../components/ui/Checkbox';

const DriverBooking = () => {
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState('A-09');
  const [vehicleType, setVehicleType] = useState('car');
  const [duration, setDuration] = useState('4h');
  const [floor, setFloor] = useState('B1');
  const [zone, setZone] = useState('A');
  const [autoSelect, setAutoSelect] = useState(true);
  
  // Generating mockup slots
  const slots = Array.from({ length: 30 }, (_, i) => {
    const row = i < 10 ? 'A' : (i < 20 ? 'B' : 'C');
    const num = (i % 10) + 1;
    const id = `${row}-${num.toString().padStart(2, '0')}`;
    
    let status = 'empty';
    if (['A-03', 'A-07', 'A-08', 'B-02', 'B-05', 'B-09', 'C-01', 'C-06', 'C-10'].includes(id)) {
      status = 'occupied';
    } else if (id === selectedSlot) {
      status = 'selected';
    }
    
    return { id, status };
  });

  const handleBooking = (e) => {
    e.preventDefault();
    navigate('/driver/booking-confirmation');
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt chỗ đỗ xe mới</h1>
        <p className="text-sm text-gray-500">Vui lòng chọn loại phương tiện, thời gian và vị trí đỗ mong muốn. Mã đặt chỗ sẽ được cấp sau khi bạn hoàn tất quy trình.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Thông tin đặt chỗ */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Thông tin đặt chỗ</h2>
                <p className="text-xs text-gray-500">Chi tiết phương tiện và thời gian</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Biển số xe</label>
                  <input type="text" defaultValue="51K-123.45" className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Loại phương tiện</label>
                  <CustomSelect 
                    value={vehicleType} 
                    onChange={setVehicleType}
                    options={[
                      { value: 'car', label: 'Ô tô (4-7 chỗ)' },
                      { value: 'bike', label: 'Xe máy' }
                    ]}
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-500 flex items-start gap-1">
                <Info size={14} className="shrink-0 mt-0.5 text-blue-500" />
                Nhân viên sẽ dùng biển số này hoặc mã đặt chỗ để cho xe mở barie.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Ngày đỗ</label>
                  <div className="relative">
                    <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="date" defaultValue="2023-11-15" className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Giờ bắt đầu</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="time" defaultValue="08:30" className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Thời lượng dự kiến</label>
                  <CustomSelect 
                    value={duration} 
                    onChange={setDuration}
                    options={[
                      { value: '4h', label: '4 Giờ' },
                      { value: '8h', label: '8 Giờ' },
                      { value: '24h', label: 'Cả ngày' }
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sơ đồ vị trí trống */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Sơ đồ vị trí trống</h2>
                <p className="text-xs text-gray-500">Tầng hầm {floor} - Khu vực {zone}</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm border border-gray-200 bg-white"></div>Trống</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200"></div>Đã đỗ</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-50 border border-red-200 text-red-500"></div>Bảo trì</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-50 border border-blue-500"></div>Đang chọn</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <CustomSelect 
                className="w-full sm:w-40"
                value={floor}
                onChange={setFloor}
                options={[
                  { value: 'B1', label: 'Tầng hầm B1' },
                  { value: 'B2', label: 'Tầng hầm B2' }
                ]}
              />
              <CustomSelect 
                className="w-full sm:w-56"
                value={zone}
                onChange={setZone}
                options={[
                  { value: 'A', label: 'Khu A - Gần cổng' },
                  { value: 'B', label: 'Khu B - Sâu bên trong' }
                ]}
              />
              <div className="sm:ml-auto">
                <CustomCheckbox 
                  checked={autoSelect} 
                  onChange={setAutoSelect} 
                  label="Tự động chọn vị trí tối ưu" 
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                {slots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => slot.status !== 'occupied' && setSelectedSlot(slot.id)}
                    disabled={slot.status === 'occupied'}
                    className={`h-12 rounded-lg flex items-center justify-center text-xs font-bold transition-all border outline-none ${
                      slot.status === 'occupied' 
                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                        : slot.id === selectedSlot
                          ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm ring-2 ring-blue-100'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-500'
                    }`}
                  >
                    {slot.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Location Details */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Building size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">District 1 Parking Tower</h3>
                <p className="text-xs text-gray-500">123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>
            <div className="text-xs font-bold text-blue-600 bg-white px-4 py-2 rounded-lg border border-blue-100 shadow-sm">
              Cổng A - Lối vào chính
            </div>
          </div>

        </div>

        {/* Right Column - Summary */}
        <div>
          <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="text-blue-500" size={20} />
              Tóm tắt đặt chỗ
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                <span className="text-gray-500 flex items-center gap-2"><Building size={16} /> Tòa nhà</span>
                <span className="font-bold text-gray-900">D1 Parking Tower</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                <span className="text-gray-500 flex items-center gap-2"><Car size={16} /> Biển số xe</span>
                <span className="font-bold text-gray-900">51K-123.45</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                <span className="text-gray-500">Loại xe</span>
                <span className="font-bold text-gray-900">{vehicleType === 'car' ? 'Ô tô (4-7 chỗ)' : 'Xe máy'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                <span className="text-gray-500 flex items-center gap-2"><Clock size={16} /> Thời gian vào</span>
                <span className="font-bold text-gray-900">08:30 - 15/11/2023</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                <span className="text-gray-500">Thời lượng</span>
                <span className="font-bold text-gray-900">{duration === '4h' ? '4 Giờ' : duration === '8h' ? '8 Giờ' : 'Cả ngày'}</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-2">
                <span className="text-gray-500 flex items-center gap-2"><MapPin size={16} /> Vị trí đỗ</span>
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{floor} - Khu {zone} - {selectedSlot}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-gray-700">Giá tạm tính</span>
                <span className="text-xl font-black text-gray-900">60.000 VND</span>
              </div>
              <p className="text-right text-[10px] text-blue-500 font-medium">Giá đã bao gồm 10% VAT</p>
            </div>

            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 mb-6">
              <h4 className="text-xs font-bold text-orange-800 mb-2 flex items-center gap-1.5">
                <AlertCircle size={14} />
                Lưu ý chính sách:
              </h4>
              <ul className="text-[11px] text-orange-700 space-y-1.5 pl-4 list-disc opacity-90 font-medium">
                <li>Cho phép check-in sớm tối đa 15 phút.</li>
                <li>Hủy trước 30 phút sẽ được hoàn tiền 100%.</li>
                <li>Vị trí có thể được giải phóng nếu không vào sau 30 phút.</li>
              </ul>
            </div>

            <button onClick={handleBooking} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-200 mb-3 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} />
              Xác nhận đặt chỗ
            </button>
            <button className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 font-bold py-3.5 rounded-xl transition-all">
              Hủy bỏ
            </button>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">Thanh toán bảo mật thông qua ví điện tử<br/>Hỗ trợ kỹ thuật: <span className="text-blue-500 font-bold">1900.6789</span></p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DriverBooking;
