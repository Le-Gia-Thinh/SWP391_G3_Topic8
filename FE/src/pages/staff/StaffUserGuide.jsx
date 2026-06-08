import React from 'react'
import { BookOpen, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const StaffUserGuide = () => {
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <Link to="/staff/support" className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
          <ChevronLeft size={20} />
        </Link>
        <BookOpen className="text-emerald-600" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Hướng dẫn sử dụng hệ thống PBMS</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 prose prose-blue max-w-none">
        <h3 className="text-xl font-bold text-gray-900">1. Quy trình đón xe Vãng lai (Walk-in)</h3>
        <p>
          Khi xe tiến vào cổng, camera sẽ tự động nhận diện biển số. Nếu thành công, hệ thống sẽ tự động in thẻ và mở barie.
          Trong trường hợp camera không nhận diện được do biển số mờ/bẩn:
        </p>
        <ul>
          <li>Vào mục <strong>Nhận xe vãng lai</strong>.</li>
          <li>Chụp ảnh thủ công hoặc nhập biển số vào hệ thống.</li>
          <li>Xác nhận loại xe và nhấn <strong>Mở Barie & In thẻ</strong>.</li>
        </ul>

        <h3 className="text-xl font-bold text-gray-900 mt-8">2. Quy trình đón xe Đặt trước (Booking)</h3>
        <p>
          Đối với khách hàng đã thanh toán hoặc giữ chỗ trên ứng dụng:
        </p>
        <ul>
          <li>Vào mục <strong>Nhận xe đặt trước</strong>.</li>
          <li>Quét mã QR trên điện thoại của khách hàng bằng máy quét, hoặc nhập mã Booking ID (VD: BK-12345).</li>
          <li>Hệ thống sẽ đối chiếu với biển số xe và tự động chỉ định vị trí đỗ. Đưa thẻ cho khách và hướng dẫn vị trí đỗ (Ví dụ: Tầng B1, ô A-01).</li>
        </ul>

        <h3 className="text-xl font-bold text-gray-900 mt-8">3. Check-out và Thanh toán</h3>
        <p>
          Khi khách hàng lấy xe ra:
        </p>
        <ul>
          <li>Thu lại thẻ từ khách hàng và đặt lên đầu đọc thẻ.</li>
          <li>Hệ thống hiển thị hình ảnh lúc vào, lúc ra để nhân viên đối chiếu.</li>
          <li>Xác nhận số tiền phí. Chọn phương thức thanh toán (Tiền mặt / Chuyển khoản / Đã thanh toán trước).</li>
          <li>Bấm <strong>Hoàn tất & Mở barie</strong> để xe ra.</li>
        </ul>
      </div>
    </div>
  )
}

export default StaffUserGuide
