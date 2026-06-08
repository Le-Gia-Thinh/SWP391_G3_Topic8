import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, AlertTriangle, Link2, UserCog, UploadCloud, FileText, Image as ImageIcon, X, Trash2, Search, Info, ChevronUp, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const StaffCreateIncident = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const [files, setFiles] = useState([
    { id: 1, name: 'anh_hien_truong_01.jpg', size: '1.2 MB', type: 'image', previews: ['https://images.unsplash.com/photo-1562853274-b2586e3fcdb4?w=150&h=100&fit=crop', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=150&h=100&fit=crop'] },
    { id: 2, name: 'bien_ban_ghi_nhan.pdf', size: '450 KB', type: 'pdf' }
  ])
  const [isEscalated, setIsEscalated] = useState(false)
  const [isActionBarVisible, setIsActionBarVisible] = useState(true)

  const fileInputRef = React.useRef(null)

  const handleSubmit = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Báo cáo sự cố thành công!')
      navigate('/staff/dashboard')
    }, 1500)
  }

  const handleDeleteFile = (id) => {
    setFiles(files.filter(f => f.id !== id))
  }

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files)
    if (uploadedFiles.length === 0) return

    const newFiles = uploadedFiles.map(file => {
      const isImage = file.type.startsWith('image/')
      return {
        id: Date.now() + Math.random(),
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: isImage ? 'image' : 'pdf',
        previews: isImage ? [URL.createObjectURL(file)] : null
      }
    })

    setFiles([...files, ...newFiles])
    // Reset input value to allow uploading the same file again if deleted
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple 
                accept="image/*,.pdf" 
              />
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <UploadCloud size={24} />
                </div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Nhấn để tải lên hoặc kéo thả tệp vào đây</p>
                <p className="text-xs text-gray-500">Phục vụ tối đa: JPG, PNG, PDF (Tối đa 10MB)</p>
              </div>

              {/* Uploaded Files */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                {files.map(file => (
                  <div key={file.id} className="border border-gray-200 rounded-xl p-3 flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${file.type === 'image' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                          {file.type === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate" title={file.name}>{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteFile(file.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                    {file.previews && (
                      <div className="flex gap-2">
                        {file.previews.map((preview, i) => (
                          <img key={i} src={preview} alt={`preview ${i+1}`} className="h-16 w-24 object-cover rounded-md border border-gray-200" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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

              <label className="border border-red-200 bg-red-50 p-4 rounded-xl flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={isEscalated} onChange={(e) => setIsEscalated(e.target.checked)} className="mt-1 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer" />
                <div>
                  <span className="text-sm font-bold text-red-800 block mb-1">Chuyển Quản lý xử lý (Escalate)</span>
                  <p className="text-xs text-red-600">Tích vào đây nếu sự cố này vượt quyền hạn xử lý của nhân viên ca trực, quản lý sẽ nhận được thông báo khẩn.</p>
                </div>
              </label>

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

      {/* Dynamic Island Action Bar */}
      <div 
        className="fixed bottom-6 left-[calc(16rem+1.5rem)] right-6 z-30 flex justify-center group"
        onMouseEnter={() => setIsActionBarVisible(true)}
        onMouseLeave={() => setIsActionBarVisible(false)}
      >
        {/* Animated Gradient Glow (only visible when expanded) */}
        <div className={`absolute top-0 bottom-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActionBarVisible ? 'w-full max-w-4xl opacity-20' : 'w-[240px] opacity-0'} bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-[20px] blur animate-pulse pointer-events-none`}></div>

        <div 
          className={`relative bg-white/85 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden ring-1 ring-black/5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center ${
            isActionBarVisible 
              ? 'w-full max-w-4xl rounded-2xl px-6 py-4 justify-between h-[80px]' 
              : 'w-[240px] rounded-full px-4 py-3 justify-center cursor-pointer hover:bg-white h-[48px]'
          }`}
        >
          {/* Collapsed State Content */}
          <div className={`flex items-center gap-3 absolute transition-all duration-300 ${isActionBarVisible ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100 delay-200'}`}>
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white"></span>
            </div>
            <span className="text-sm font-bold text-gray-700">Tùy chọn thao tác</span>
            <ChevronUp size={16} className="text-gray-400 group-hover:animate-bounce" />
          </div>

          {/* Expanded State Content */}
          <div className={`w-full flex items-center justify-between transition-all duration-500 ${isActionBarVisible ? 'opacity-100 scale-100 delay-100' : 'opacity-0 scale-95 pointer-events-none absolute'}`}>
            <div className="flex items-center gap-4">
              <div className="relative flex h-4 w-4 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              </div>
              <div>
                <p className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">Sẵn sàng báo cáo</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Hệ thống đã tự động lưu thông tin an toàn</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/staff/dashboard')}
                className="px-6 py-2.5 rounded-xl bg-gray-50/80 backdrop-blur-sm text-gray-600 font-bold hover:bg-gray-200 hover:text-gray-900 transition-all focus:ring-2 focus:ring-gray-200"
              >
                Hủy bỏ
              </button>
              <button className="px-6 py-2.5 rounded-xl bg-blue-50/80 backdrop-blur-sm text-blue-700 font-bold hover:bg-blue-100 transition-all focus:ring-2 focus:ring-blue-200">
                Lưu nháp
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="relative group/btn px-8 py-2.5 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center min-w-[170px] overflow-hidden hover:scale-105 active:scale-95 duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-500 group-hover/btn:scale-110 group-hover/btn:opacity-90"></div>
                <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite]"></div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-blue-600 blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>

                {isLoading ? (
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Đang gửi...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2 relative z-10 drop-shadow-md">
                    <AlertTriangle size={18} className="animate-bounce" style={{ animationDuration: '2s' }} /> 
                    Gửi Sự Cố Ngay
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffCreateIncident
