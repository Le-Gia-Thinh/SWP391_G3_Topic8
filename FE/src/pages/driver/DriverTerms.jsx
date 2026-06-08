import React from 'react'
import { FileText, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const DriverTerms = () => {
  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <Link to="/driver/home" className="text-gray-400 hover:text-gray-600 transition">
          <ChevronLeft size={20} />
        </Link>
        <FileText className="text-blue-500" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Điều khoản dịch vụ</h1>
      </div>

      <div className="prose prose-sm prose-blue max-w-none text-gray-600 leading-relaxed space-y-4">
        <p className="font-semibold text-gray-800">Cập nhật lần cuối: 24/05/2026</p>
        
        <h3 className="text-lg font-bold text-gray-900 mt-6">1. Chấp nhận điều khoản</h3>
        <p>Bằng việc đăng ký và sử dụng dịch vụ của Parking Building Management System (PBMS), bạn đồng ý tuân thủ các quy định và điều kiện được nêu trong tài liệu này.</p>
        
        <h3 className="text-lg font-bold text-gray-900 mt-6">2. Quy định khi gửi xe</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>Bạn phải đỗ xe đúng vị trí đã được chỉ định (đối với xe có đặt trước) hoặc theo sự hướng dẫn của nhân viên bãi xe.</li>
          <li>Không để lại tài sản có giá trị lớn trong xe. Ban quản lý sẽ không chịu trách nhiệm cho các mất mát tài sản cá nhân để bên trong xe.</li>
          <li>Tuân thủ tốc độ tối đa 5km/h trong khu vực hầm xe và bật đèn chiếu gần.</li>
        </ul>

        <h3 className="text-lg font-bold text-gray-900 mt-6">3. Chính sách Thanh toán & Hủy chỗ</h3>
        <p>Hệ thống hỗ trợ thanh toán qua các cổng điện tử và tiền mặt. Việc hủy đặt chỗ phải được thực hiện trước thời gian check-in ít nhất 30 phút để không phát sinh phí bồi thường.</p>
      </div>
    </div>
  )
}

export default DriverTerms
