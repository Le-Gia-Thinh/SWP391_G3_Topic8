import React, { useState } from 'react'
import { Search, ChevronRight, Info, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const StaffBookingCheckIn = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Đang chờ')

  const tabs = [
    { name: 'Đang chờ', count: 12 },
    { name: 'Sắp đến', count: 5 },
    { name: 'Đến muộn', count: 2 },
    { name: 'Hết hạn', count: 6 },
    { name: 'Đã sử dụng', count: 134 }
  ]

  const bookings = [
    { code: 'BK-8821', plate: '30S-123.45', owner: 'Nguyễn Văn An', vehicle: 'Sedan 4 chỗ', slot: 'A-13', time: '08:30 AM', deadline: '09:00 AM', status: 'Đang chờ', statusColor: 'bg-green-100 text-green-700' },
    { code: 'BK-8820', plate: '29A-999.99', owner: 'Trần Thị Bình', vehicle: 'SUV 7 chỗ', slot: 'B-04', time: '08:45 AM', deadline: '09:15 AM', status: 'Sắp đến', statusColor: 'bg-blue-100 text-blue-700' },
    { code: 'BK-8790', plate: '51G-555.21', owner: 'Lê Minh Chiến', vehicle: 'Pickup', slot: 'C-01', time: '08:00 AM', deadline: '08:30 AM', status: 'Đến muộn', statusColor: 'bg-orange-100 text-orange-700' },
    { code: 'BK-8822', plate: '30H-432.12', owner: 'Phạm Đức Dũng', vehicle: 'Sedan 4 chỗ', slot: 'A-15', time: '09:00 AM', deadline: '09:30 AM', status: 'Đang chờ', statusColor: 'bg-green-100 text-green-700' },
    { code: 'BK-8601', plate: '15B-678.90', owner: 'Hoàng Quốc Hùng', vehicle: 'Van', slot: 'D-02', time: '07:15 AM', deadline: '08:15 AM', status: 'Đã sử dụng', statusColor: 'bg-gray-100 text-gray-700' }
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24">
      {/* Header breadcrumb */}
      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <span>Nhân viên</span> <ChevronRight size={14} />
        <span className="text-blue-600 font-medium">Check-in đặt trước</span>
      </div>

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Đặt chỗ Check-in</h1>
        <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500"></div> Cổng vào: Gate A (Main)
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="space-y-6 flex-1">

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Tìm kiếm nhanh lượt đặt</h2>
            <p className="text-sm text-gray-500 mb-6">Nhập biển số xe (đầy đủ hoặc 4 số cuối) hoặc mã đặt chỗ để thực hiện check-in nhanh.</p>

            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Ví dụ: 30S-123.45 hoặc BK-8921"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                />
              </div>
              <button
                onClick={() => navigate('/staff/verify-booking')}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-colors"
              >
                Tìm kiếm ngay
              </button>
            </div>

            <div className="mt-4 flex items-center gap-6 text-sm">
              <span className="flex items-center gap-1.5 text-gray-500"><Info size={16} /> Hệ thống tự động quét dữ liệu trong 24h gần nhất.</span>
              <button
                onClick={() => navigate('/staff/checkin-walkin')}
                className="flex items-center gap-1 text-blue-600 font-semibold hover:underline"
              >
                <Plus size={16} /> Tạo lượt Walk-in mới
              </button>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Hàng chờ đặt chỗ hôm nay</h3>
            <p className="text-sm text-gray-500 mb-6">Theo dõi các phương tiện đã đặt trước theo khung giờ hiện tại.</p>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100">
              {tabs.map(tab => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab.name
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tab.name} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-4 px-4 whitespace-nowrap">Mã đặt chỗ</th>
                  <th className="py-4 px-4 whitespace-nowrap">Biển số xe</th>
                  <th className="py-4 px-4 whitespace-nowrap">Chủ xe</th>
                  <th className="py-4 px-4 whitespace-nowrap">Loại xe</th>
                  <th className="py-4 px-4 whitespace-nowrap">Vị trí</th>
                  <th className="py-4 px-4 whitespace-nowrap">Giờ đặt</th>
                  <th className="py-4 px-4 whitespace-nowrap">Hạn chót</th>
                  <th className="py-4 px-4 whitespace-nowrap">Trạng thái</th>
                  <th className="py-4 px-4 whitespace-nowrap text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-blue-600">{item.code}</td>
                    <td className="py-4 px-4 font-bold text-gray-800">{item.plate}</td>
                    <td className="py-4 px-4 text-gray-600">{item.owner}</td>
                    <td className="py-4 px-4 text-gray-600">{item.vehicle}</td>
                    <td className="py-4 px-4 font-medium text-gray-800">{item.slot}</td>
                    <td className="py-4 px-4 text-gray-600">{item.time}</td>
                    <td className="py-4 px-4 font-medium text-red-600">{item.deadline}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {item.status !== 'Đã sử dụng' && (
                        <button
                          onClick={() => navigate('/staff/verify-booking')}
                          className="px-4 py-1.5 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold text-xs transition-colors"
                        >
                          Xử lý
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
            <span>Hiển thị <strong>5</strong> trên tổng số <strong>12</strong> lượt đang chờ check-in.</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50">Trước</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-600 text-white font-bold">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50">3</button>
              <button className="px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50">Tiếp</button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center justify-between px-6 py-3 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Hệ thống: Ổn định</span>
            <span>Đồng bộ cuối: 10:55:42 - 18/05/2026</span>
          </div>
          <div className="flex gap-4">
            <span>Phiên bản v2.4.12-STABLE</span>
            <a href="javascript:void(0)" className="text-blue-600 hover:underline">Hỗ trợ kỹ thuật</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffBookingCheckIn
