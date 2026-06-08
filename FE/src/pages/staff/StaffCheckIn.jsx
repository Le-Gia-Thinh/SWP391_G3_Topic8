import React, { useState } from 'react'
import { ChevronLeft, Info, Search, CheckCircle2, AlertCircle, Clock, MapPin, Plus, ChevronRight, FileText, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const WalkInContent = () => {
  const navigate = useNavigate()
  const slots = Array.from({ length: 30 }, (_, i) => {
    const num = (i + 1).toString().padStart(2, '0')
    let status = 'trống'
    if ([2, 7, 13, 14, 26, 29].includes(i + 1)) status = 'đã có xe'
    if ([4, 21].includes(i + 1)) status = 'đã đặt'
    if ([8].includes(i + 1)) status = 'bảo trì'
    if ([18].includes(i + 1)) status = 'khóa'
    if ([5].includes(i + 1)) status = 'đang chọn'
    return { id: `A-${num}`, status }
  })

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24 animate-in fade-in">
      <div className="flex gap-6 flex-1 flex-col xl:flex-row">
        <div className="flex-[2] bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2"><Info size={20} className="text-blue-500" /> Thông tin xe vào bãi</h3>
          <p className="text-sm text-gray-500 mb-6">Nhập chính xác biển số và loại phương tiện để hệ thống tự động kiểm tra.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ID Thẻ (Card ID)</label>
              <div className="flex gap-2">
                <input type="text" placeholder="Nhập ID thẻ" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                <button className="px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium text-sm"><Search size={16} /> Tìm</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Biển số (Nhập tay)</label>
              <input type="text" defaultValue="51F-123.45" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Loại phương tiện</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all text-sm appearance-none bg-white"><option>Xe ô tô 4-7 chỗ</option><option>Xe máy</option></select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cổng vào</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all text-sm appearance-none bg-white"><option>Cổng Chính (Gate 01)</option></select>
            </div>
          </div>
          <div className="mb-6"><label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" />Thẻ mất hoặc không có thẻ cứng</label></div>
          <div className="mb-8"><label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú (Tùy chọn)</label><input type="text" placeholder="Nhập ghi chú nếu xe có hư hỏng..." className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm" /></div>
          <div className="flex gap-4 mt-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-semibold opacity-50 cursor-not-allowed"><AlertCircle size={14} /> Mã không hợp lệ</div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 text-xs font-semibold opacity-50 cursor-not-allowed"><AlertCircle size={14} /> Tài khoản bị khóa</div>
          </div>
        </div>

        <div className="flex-1 bg-blue-50 rounded-xl border border-blue-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2"><MapPin size={20} className="text-blue-500" /> Gợi ý vị trí tối ưu</h3>
            <p className="text-sm text-blue-700 mb-8">Hệ thống tìm kiếm vị trí trống gần nhất với cổng vào.</p>
            <div className="flex gap-4 justify-center mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 text-center flex-1"><div className="text-xs text-blue-500 font-bold uppercase mb-1">Tầng</div><div className="text-2xl font-black text-blue-900">B1</div></div>
              <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 text-center flex-1"><div className="text-xs text-blue-500 font-bold uppercase mb-1">Khu vực</div><div className="text-2xl font-black text-blue-900">A</div></div>
              <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 text-center flex-1"><div className="text-xs text-blue-500 font-bold uppercase mb-1">Mã vị trí</div><div className="text-2xl font-black text-blue-900">A-05</div></div>
            </div>
          </div>
          <div className="space-y-3">
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2"><CheckCircle2 size={18} /> Sử dụng vị trí này</button>
            <button className="w-full py-3 bg-transparent border border-blue-300 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-all">Thay đổi vị trí khác</button>
            <p className="text-xs text-center text-blue-500 mt-4 flex items-center justify-center gap-1"><Info size={12} /> Khoảng cách di chuyển ước tính: 45m</p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800">Sơ đồ bãi đỗ thực tế</h3>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-blue-600 text-blue-600 font-medium rounded-lg text-sm bg-blue-50">Tầng B1</button>
            <button className="px-4 py-2 border border-gray-200 text-gray-600 font-medium rounded-lg text-sm hover:bg-gray-50">Tầng 02</button>
            <select className="px-4 py-2 border border-gray-200 text-gray-800 font-medium rounded-lg text-sm bg-white ml-2"><option>Khu vực A</option></select>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-3">
          {slots.map(slot => {
            let style = 'bg-white border-gray-300 text-gray-600'
            if (slot.status === 'đã có xe') style = 'bg-red-50 border-red-200 text-red-700'
            if (slot.status === 'đã đặt') style = 'bg-white border-orange-400 text-orange-600 border-dashed'
            if (slot.status === 'bảo trì') style = 'bg-gray-100 border-gray-300 text-gray-400'
            if (slot.status === 'khóa') style = 'bg-gray-800 border-gray-800 text-white'
            if (slot.status === 'đang chọn') style = 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-105'
            return (
              <div key={slot.id} className={`border rounded-lg p-3 text-center transition-all ${style} flex flex-col justify-center items-center h-16 cursor-pointer hover:opacity-80`}>
                <span className="font-bold text-sm">{slot.id}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 gap-4 md:gap-0">
          <div className="flex flex-wrap gap-4 md:gap-8 justify-center">
            <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Biển số xe</p><p className="text-lg font-black text-gray-800">51F-123.45</p></div>
            <div className="hidden md:block w-px h-10 bg-gray-200"></div>
            <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Lối vào</p><p className="text-sm font-bold text-gray-800">Cổng 01</p></div>
            <div className="hidden md:block w-px h-10 bg-gray-200"></div>
            <div><p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Vị trí dự kiến</p><p className="text-sm font-bold text-gray-800">A-05</p></div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">Hủy</button>
            <button onClick={() => navigate('/staff/checkin-success', { state: { actionType: 'walkin-checkin' } })} className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">Xác nhận Check-in</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const BookingContent = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Đang chờ')
  const tabs = [{ name: 'Đang chờ', count: 12 }, { name: 'Sắp đến', count: 5 }, { name: 'Đến muộn', count: 2 }, { name: 'Hết hạn', count: 6 }, { name: 'Đã sử dụng', count: 134 }]
  const bookings = [
    { code: 'BK-8821', plate: '30S-123.45', owner: 'Nguyễn Văn An', vehicle: 'Sedan 4 chỗ', slot: 'A-13', time: '08:30 AM', deadline: '09:00 AM', status: 'Đang chờ', statusColor: 'bg-green-100 text-green-700' },
    { code: 'BK-8820', plate: '29A-999.99', owner: 'Trần Thị Bình', vehicle: 'SUV 7 chỗ', slot: 'B-04', time: '08:45 AM', deadline: '09:15 AM', status: 'Sắp đến', statusColor: 'bg-blue-100 text-blue-700' },
    { code: 'BK-8790', plate: '51G-555.21', owner: 'Lê Minh Chiến', vehicle: 'Pickup', slot: 'C-01', time: '08:00 AM', deadline: '08:30 AM', status: 'Đến muộn', statusColor: 'bg-orange-100 text-orange-700' }
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50 animate-in fade-in">
      <div className="space-y-6 flex-1 pb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Tìm kiếm nhanh lượt đặt</h2>
            <p className="text-sm text-gray-500 mb-6">Nhập biển số xe (đầy đủ hoặc 4 số cuối) hoặc mã đặt chỗ để thực hiện check-in nhanh.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input type="text" placeholder="Ví dụ: 30S-123.45 hoặc BK-8921" className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all font-medium" />
              </div>
              <button onClick={() => navigate('/staff/verify-booking')} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors">Tìm kiếm</button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Hàng chờ đặt chỗ hôm nay</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100 mt-4">
              {tabs.map(tab => (
                <button key={tab.name} onClick={() => setActiveTab(tab.name)} className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab.name ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                  {tab.name} ({tab.count})
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-4 px-4 whitespace-nowrap">Mã</th>
                  <th className="py-4 px-4 whitespace-nowrap">Biển số</th>
                  <th className="py-4 px-4 whitespace-nowrap">Chủ xe</th>
                  <th className="py-4 px-4 whitespace-nowrap">Vị trí</th>
                  <th className="py-4 px-4 whitespace-nowrap">Giờ đặt</th>
                  <th className="py-4 px-4 whitespace-nowrap">Trạng thái</th>
                  <th className="py-4 px-4 whitespace-nowrap text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50">
                    <td className="py-4 px-4 font-bold text-blue-600">{item.code}</td>
                    <td className="py-4 px-4 font-bold text-gray-800">{item.plate}</td>
                    <td className="py-4 px-4 text-gray-600">{item.owner}</td>
                    <td className="py-4 px-4 font-medium text-gray-800">{item.slot}</td>
                    <td className="py-4 px-4 text-gray-600">{item.time}</td>
                    <td className="py-4 px-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${item.statusColor}`}>{item.status}</span></td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => navigate('/staff/verify-booking')} className="px-4 py-1.5 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold text-xs">Xử lý</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

const StaffCheckIn = () => {
  const [activeType, setActiveType] = useState('walkin')

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Check In Phương Tiện</h1>
          <p className="text-sm text-gray-500 mt-1">Ghi nhận thông tin xe vào bãi</p>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500"></div> Cổng vào: Gate A (Main)
          </div>
        </div>
      </header>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveType('walkin')}
          className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeType === 'walkin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText size={18} /> Khách vãng lai (Walk-in)
        </button>
        <button
          onClick={() => setActiveType('booking')}
          className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeType === 'booking' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar size={18} /> Khách đặt trước (Booking)
        </button>
      </div>

      <div className="flex-1">
        {activeType === 'walkin' ? <WalkInContent /> : <BookingContent />}
      </div>
    </div>
  )
}

export default StaffCheckIn
