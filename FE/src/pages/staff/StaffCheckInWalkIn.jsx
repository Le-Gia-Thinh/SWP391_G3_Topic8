import React from 'react'
import { ChevronLeft, Info, Search, CheckCircle2, AlertCircle, Clock, MapPin, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const StaffCheckInWalkIn = () => {
  const navigate = useNavigate()
  // Generate dummy slots
  const slots = Array.from({ length: 30 }, (_, i) => {
    const num = (i + 1).toString().padStart(2, '0')
    let status = 'trống'
    if ([2, 7, 13, 14, 26, 29].includes(i + 1)) status = 'đã có xe'
    if ([4, 21].includes(i + 1)) status = 'đã đặt'
    if ([8].includes(i + 1)) status = 'bảo trì'
    if ([18].includes(i + 1)) status = 'khóa'
    if ([5].includes(i + 1)) status = 'đang chọn' // For A-05
    return { id: `A-${num}`, status }
  })

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <ChevronLeft size={16} /> Quay về
          </button>
          <div className="w-px h-6 bg-gray-300"></div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Tiếp nhận xe - Walk-in
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-600 text-xs font-semibold">Trực tiếp</span>
          </h1>
        </div>
        <div className="text-sm font-medium text-gray-500">
          📍 Cổng Chính - GATE 01 • 24/10/2026 14:30
        </div>
      </header>

      <div className="flex gap-6 flex-1">
        {/* Left Column: Form */}
        <div className="flex-[2] bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Info size={20} className="text-blue-500" /> Thông tin xe vào bãi
          </h3>
          <p className="text-sm text-gray-500 mb-6">Nhập chính xác biển số và loại phương tiện để hệ thống tự động kiểm tra.</p>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ID Thẻ (Card ID)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập ID thẻ"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                />
                <button className="px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium text-sm">
                  <Search size={16} /> Tìm
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Biển số (Nhập tay)</label>
              <input
                type="text"
                defaultValue="51F-123.45"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Loại phương tiện</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm appearance-none bg-white">
                <option>Xe ô tô 4-7 chỗ</option>
                <option>Xe máy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cổng vào</label>
              <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm appearance-none bg-white">
                <option>Cổng Chính (Gate 01)</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              Thẻ mất hoặc không có thẻ cứng
            </label>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú (Tùy chọn)</label>
            <input
              type="text"
              placeholder="Nhập ghi chú nếu xe có hư hỏng ngoại thất..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
            />
          </div>

          {/* Validation Badges */}
          <div className="flex gap-4 mt-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-semibold opacity-50 cursor-not-allowed">
              <AlertCircle size={14} /> Mã không hợp lệ
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 text-xs font-semibold opacity-50 cursor-not-allowed">
              <AlertCircle size={14} /> Tài khoản bị khóa
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-600 text-xs font-semibold opacity-50 cursor-not-allowed">
              <Clock size={14} /> Phiên đã hết hạn
            </div>
          </div>
        </div>

        {/* Right Column: Recommendation */}
        <div className="flex-1 bg-blue-50 rounded-xl border border-blue-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
              <MapPin size={20} className="text-blue-500" /> Gợi ý vị trí tối ưu
            </h3>
            <p className="text-sm text-blue-700 mb-8">Hệ thống tìm kiếm vị trí trống gần nhất với cổng vào.</p>

            <div className="flex gap-4 justify-center mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 text-center flex-1">
                <div className="text-xs text-blue-500 font-bold uppercase mb-1">Tầng</div>
                <div className="text-2xl font-black text-blue-900">B1</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 text-center flex-1">
                <div className="text-xs text-blue-500 font-bold uppercase mb-1">Khu vực</div>
                <div className="text-2xl font-black text-blue-900">A</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4 text-center flex-1">
                <div className="text-xs text-blue-500 font-bold uppercase mb-1">Mã vị trí</div>
                <div className="text-2xl font-black text-blue-900">A-05</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-200 transition-all flex justify-center items-center gap-2">
              <CheckCircle2 size={18} /> Sử dụng vị trí này
            </button>
            <button className="w-full py-3 bg-transparent border border-blue-300 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-all">
              Thay đổi vị trí khác
            </button>
            <p className="text-xs text-center text-blue-500 mt-4 flex items-center justify-center gap-1">
              <Info size={12} /> Khoảng cách di chuyển ước tính: 45m
            </p>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800">Sơ đồ bãi đỗ thực tế</h3>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-blue-600 text-blue-600 font-medium rounded-lg text-sm bg-blue-50">Tầng B1</button>
            <button className="px-4 py-2 border border-gray-200 text-gray-600 font-medium rounded-lg text-sm hover:bg-gray-50">Tầng 02</button>
            <select className="px-4 py-2 border border-gray-200 text-gray-800 font-medium rounded-lg text-sm bg-white ml-2">
              <option>Khu vực A</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-6 mb-6 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-gray-400 bg-white"></div> Trống (42)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div> Đã có xe (18)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-orange-400 bg-white"></div> Đã đặt chỗ (5)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300"></div> Bảo trì (2)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-800"></div> Khóa (1)</div>
        </div>

        {/* Grid Map */}
        <div className="grid grid-cols-10 gap-3">
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
                {slot.status === 'đã có xe' && <span className="text-[10px] uppercase font-semibold opacity-70 mt-0.5">Đã đỗ</span>}
                {slot.status === 'trống' && <span className="text-[10px] uppercase font-semibold opacity-50 mt-0.5">Trống</span>}
                {slot.status === 'đã đặt' && <span className="text-[10px] uppercase font-semibold opacity-70 mt-0.5">Đã đặt</span>}
                {slot.status === 'bảo trì' && <span className="text-[10px] uppercase font-semibold opacity-70 mt-0.5">Bảo trì</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex gap-8">
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Loại phiếu</p>
              <p className="text-sm font-bold text-blue-600 flex items-center gap-1"><CheckCircle2 size={16} /> VÃNG LAI</p>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">ID Thẻ</p>
              <p className="text-sm font-bold text-gray-400">---</p>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Biển số xe</p>
              <p className="text-lg font-black text-gray-800">51F-123.45</p>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Lối vào / Thời gian</p>
              <p className="text-sm font-bold text-gray-800">Cổng 01 <span className="text-gray-500 text-xs font-normal ml-1">24/10/2026 14:30</span></p>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Vị trí dự kiến</p>
              <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                B1 <span className="text-gray-400">→</span> <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs">A-05</span>
              </p>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div>
              <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Nhân viên</p>
              <p className="text-sm font-bold text-gray-800">An Nguyễn <span className="text-gray-400 text-xs font-normal ml-1">STF-9982</span></p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors">
              Hủy thao tác
            </button>
            <button
              onClick={() => navigate('/staff/checkin-success')}
              className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors"
            >
              Xác nhận Check-in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffCheckInWalkIn
