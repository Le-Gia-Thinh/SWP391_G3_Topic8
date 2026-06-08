import React from 'react'
import { ShieldAlert, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const DriverPrivacy = () => {
  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto space-y-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <Link to="/driver/home" className="text-gray-400 hover:text-gray-600 transition">
          <ChevronLeft size={20} />
        </Link>
        <ShieldAlert className="text-emerald-500" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Chính sách bảo mật</h1>
      </div>

      <div className="prose prose-sm prose-emerald max-w-none text-gray-600 leading-relaxed space-y-4">
        <p className="font-semibold text-gray-800">Cập nhật lần cuối: 24/05/2026</p>

        <p>Chính sách này giải thích cách chúng tôi thu thập, sử dụng, chia sẻ và bảo vệ thông tin cá nhân của bạn khi sử dụng hệ thống đỗ xe thông minh PBMS.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">1. Thông tin chúng tôi thu thập</h3>
        <p>Chúng tôi chỉ thu thập các thông tin cần thiết phục vụ cho việc quản lý bãi xe bao gồm:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Thông tin tài khoản: Họ tên, Email, Số điện thoại.</li>
          <li>Thông tin phương tiện: Biển số xe, Loại xe.</li>
          <li>Dữ liệu lịch sử gửi xe và hình ảnh biển số chụp tự động tại cổng ra/vào.</li>
        </ul>

        <h3 className="text-lg font-bold text-gray-900 mt-6">2. Sử dụng thông tin</h3>
        <p>Dữ liệu của bạn được dùng hoàn toàn cho mục đích xác thực tự động tại cổng, ghi nhận thời gian gửi để tính phí chính xác và đảm bảo an ninh cho phương tiện của bạn.</p>

        <h3 className="text-lg font-bold text-gray-900 mt-6">3. Bảo vệ dữ liệu</h3>
        <p>Chúng tôi áp dụng các tiêu chuẩn mã hóa SSL/TLS để bảo vệ dữ liệu truyền tải. Dữ liệu thẻ thanh toán không được lưu trữ trực tiếp trên máy chủ của chúng tôi mà qua đối tác thanh toán đạt chuẩn PCI-DSS.</p>
      </div>
    </div>
  )
}

export default DriverPrivacy
