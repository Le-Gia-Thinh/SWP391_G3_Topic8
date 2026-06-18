import { Headphones, AlertTriangle, BookOpen, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const StaffSupport = () => {
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <Link to="/staff/dashboard" className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
          <ChevronLeft size={20} />
        </Link>
        <Headphones className="text-blue-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Trung tâm Hỗ trợ Kỹ thuật</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-start gap-4 hover:border-blue-300 transition">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Sự cố khẩn cấp (Phần cứng/Phần mềm)</h3>
            <p className="text-sm text-gray-500 mt-1">Barrier không mở, hệ thống mạng lỗi, camera mất kết nối.</p>
          </div>
          <a href="tel:0909999999" className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition">
            Gọi IT Hotline: 090 999 9999
          </a>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-start gap-4 hover:border-blue-300 transition">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Tài liệu và Quy trình</h3>
            <p className="text-sm text-gray-500 mt-1">Quy trình xử lý mất thẻ, giải quyết khiếu nại khách hàng.</p>
          </div>
          <Link to="/staff/user-guide" className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition border border-blue-100">
            Xem Hướng dẫn sử dụng
          </Link>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4">Các vấn đề thường gặp (FAQ cho Staff)</h3>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="font-semibold text-gray-800 text-sm mb-1">Q: Khách hàng làm mất thẻ xe thì phải làm sao?</p>
            <p className="text-sm text-gray-600">
              {'A: Yêu cầu khách xuất trình giấy tờ xe (Cà vẹt, CCCD). Sử dụng chức năng "Tra cứu phiên" để tìm lại phiên gửi bằng biển số. Thu phí phạt mất thẻ và tiến hành Check-out thủ công.'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="font-semibold text-gray-800 text-sm mb-1">Q: Xe có mã booking nhưng hệ thống báo lỗi không nhận diện được biển số?</p>
            <p className="text-sm text-gray-600">
              {'A: Chuyển sang "Tiếp nhận xe đặt trước" và dùng máy quét mã QR thủ công, hoặc nhập mã Booking ID trực tiếp để xác thực và mở cổng.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffSupport