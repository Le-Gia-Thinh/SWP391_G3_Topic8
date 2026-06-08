import React from 'react'
import { ChevronLeft, ChevronRight, AlertTriangle, Link2, UserCog, UploadCloud, FileText, Image as ImageIcon, X, Trash2, Search, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const StaffCreateIncident = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={18} /> Quay lại Dashboard
          </button>
          <div className="w-px h-5 bg-gray-300"></div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <span>Nhân viên</span> <ChevronRight size={14} />
            <span>Sự cố</span> <ChevronRight size={14} />
            <span className="text-gray-800 font-bold">Tạo mới</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 absolute left-1/2 -translate-x-1/2">Tạo Sự Cố Mới</h1>
      </header>

      <div className="flex gap-6 flex-1">
        {/* Left Column */}
        <div className="flex-[3] space-y-6">

          {/* Section A */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle size={20} className="text-blue-600" /> Section A: Thông tin sự cố
              </h3>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">Bắt buộc điền thông tin chung (*)</span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Loại sự cố <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm appearance-none bg-white">
                  <option>Mất thẻ/Hư hỏng thẻ vãng lai</option>
                  <option>Va chạm/Tai nạn trong bãi</option>
                  <option>Tranh chấp vị trí đỗ</option>
                  <option>Xe hỏng/Cần cứu hộ</option>
                  <option>Hư hỏng tài sản bãi đỗ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mức độ nghiêm trọng <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm appearance-none bg-white">
                  <option>Thấp (Low)</option>
                  <option>Trung bình (Medium)</option>
                  <option>Cao (High)</option>
                  <option>Nghiêm trọng (Critical)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section C */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" /> Section C: Mô tả chi tiết
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả diễn biến sự cố <span className="text-red-500">*</span></label>
              <textarea
                rows="4"
                placeholder="Mô tả chi tiết sự việc để quản lý có thể phân bổ hướng giải quyết nhanh..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none"
              ></textarea>
              <p className="text-xs text-gray-400 mt-2 italic">* Mục mô tả chi tiết là bắt buộc (ít nhất 20 ký tự).</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tệp đính kèm (Hình ảnh hiện trường, Bằng lái...) <span className="text-red-500">*</span></label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <UploadCloud size={24} />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Nhấn để tải lên hoặc kéo thả tệp vào đây</p>
                <p className="text-xs text-gray-500">Phục vụ tối đa: JPG, PNG, PDF (Tối đa 10MB)</p>
              </div>

              {/* Uploaded Files */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-xl p-3 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                        <ImageIcon size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">anh_hien_truong_01.jpg</p>
                        <p className="text-xs text-gray-500">1.2 MB</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                  <div className="flex gap-2">
                    <img src="https://images.unsplash.com/photo-1562853274-b2586e3fcdb4?w=150&h=100&fit=crop" alt="preview 1" className="h-16 w-24 object-cover rounded-md border border-gray-200" />
                    <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=100&fit=crop" alt="preview 2" className="h-16 w-24 object-cover rounded-md border border-gray-200" />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600 shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">bien_ban_ghi_nhan.pdf</p>
                        <p className="text-xs text-gray-500">450 KB</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-[2] space-y-6">

          {/* Section B */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Link2 size={20} className="text-blue-600" /> Section B: Dữ liệu liên quan
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mã Phiên hệ thống (Session ID)</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập ID phiên..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  />
                  <div className="absolute right-3 top-2.5 bg-gray-100 p-1 rounded cursor-pointer hover:bg-gray-200"><Search size={14} className="text-gray-600" /></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mã đặt chỗ (Booking)</label>
                  <input type="text" defaultValue="BK-8829" className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm font-medium" disabled />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ID Tài xế (Driver Code)</label>
                  <input type="text" defaultValue="CUS-00123" className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm font-medium" disabled />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Vị trí đỗ (Slot)</label>
                  <input type="text" defaultValue="Tầng B - Slot B2" className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm font-medium" disabled />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Biển số xe <span className="text-red-500">*</span></label>
                  <input type="text" defaultValue="30A-997.21" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-bold text-gray-800" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">SĐT Tài xế (Nếu có)</label>
                <input type="text" placeholder="0988xxxxxx" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2 mt-4">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  Lưu ý: Chỉ cần nhập 1 trong các ID (Phiên hoặc Đặt chỗ), hệ thống sẽ tự động đồng bộ các dữ liệu liên quan.
                </p>
              </div>
            </div>
          </div>

          {/* Section D */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <UserCog size={20} className="text-blue-600" /> Section D: Giao việc & Phân loại
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Người báo cáo sự cố</label>
                <input type="text" defaultValue="Nguyễn Văn An (ST-1011-200)" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm font-medium" disabled />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nhân viên được phân công <span className="text-red-500">*</span></label>
                <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm appearance-none bg-white">
                  <option>Phân bổ tự động</option>
                  <option>Đội Bảo vệ Cơ động</option>
                  <option>Đội Kỹ thuật</option>
                </select>
              </div>

              <div className="border border-red-200 bg-red-50 p-4 rounded-xl flex items-start gap-3">
                <input type="checkbox" className="mt-1 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500" />
                <div>
                  <label className="text-sm font-bold text-red-800 block mb-1">Chuyển Quản lý xử lý (Escalate)</label>
                  <p className="text-xs text-red-600">Tích vào đây nếu sự cố này vượt quyền hạn xử lý của nhân viên ca trực, quản lý sẽ nhận được thông báo khẩn.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú nội bộ</label>
                <textarea
                  rows="2"
                  placeholder="Ghi chú dành cho quản lý (hiển thị ẩn với khách hàng)..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm resize-none"
                ></textarea>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Không có trích xuất API từ Code...
          </div>
          <div className="flex items-center gap-4">
            <button className="px-6 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors">
              Hủy bỏ
            </button>
            <button className="px-6 py-2.5 rounded-xl border border-blue-600 text-blue-600 font-bold hover:bg-blue-50 transition-colors">
              Lưu nháp
            </button>
            <button
              onClick={() => navigate('/staff/dashboard')}
              className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors"
            >
              Tạo sự cố
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffCreateIncident
