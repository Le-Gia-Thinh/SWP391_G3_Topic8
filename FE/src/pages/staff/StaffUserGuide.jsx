import { BookOpen, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const StaffUserGuide = () => {
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
        <Link to="/staff/support" className="p-2 -ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <ChevronLeft size={20} />
        </Link>
        <BookOpen className="text-emerald-600 dark:text-emerald-500" size={24} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hướng dẫn sử dụng hệ thống PBMS</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 prose prose-blue dark:prose-invert max-w-none">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">1. Quy trình đón xe Vãng lai (Walk-in)</h3>
        <p className="dark:text-gray-300">
          Khi xe tiến vào cổng, camera sẽ tự động nhận diện biển số. Nếu thành công, hệ thống sẽ tự động in thẻ và mở barie.
          Trong trường hợp camera không nhận diện được do biển số mờ/bẩn:
        </p>
        <ul className="dark:text-gray-300">
          <li>Vào mục <strong className="dark:text-gray-100">Nhận xe vãng lai</strong>.</li>
          <li>Chụp ảnh thủ công hoặc nhập biển số vào hệ thống.</li>
          <li>Xác nhận loại xe và nhấn <strong className="dark:text-gray-100">Mở Barie & In thẻ</strong>.</li>
        </ul>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8">2. Quy trình đón xe Đặt trước (Booking)</h3>
        <p className="dark:text-gray-300">
          Đối với khách hàng đã thanh toán hoặc giữ chỗ trên ứng dụng:
        </p>
        <ul className="dark:text-gray-300">
          <li>Vào mục <strong className="dark:text-gray-100">Nhận xe đặt trước</strong>.</li>
          <li>Quét mã QR trên điện thoại của khách hàng bằng máy quét, hoặc nhập mã Booking ID (VD: BK-12345).</li>
          <li>Hệ thống sẽ đối chiếu với biển số xe và tự động chỉ định vị trí đỗ. Đưa thẻ cho khách và hướng dẫn vị trí đỗ (Ví dụ: Tầng B1, ô A-01).</li>
        </ul>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8">3. Check-out và Thanh toán</h3>
        <p className="dark:text-gray-300">
          Khi khách hàng lấy xe ra:
        </p>
        <ul className="dark:text-gray-300">
          <li>Thu lại thẻ từ khách hàng và đặt lên đầu đọc thẻ.</li>
          <li>Hệ thống hiển thị hình ảnh lúc vào, lúc ra để nhân viên đối chiếu.</li>
          <li>Xác nhận số tiền phí. Chọn phương thức thanh toán (Tiền mặt / Chuyển khoản / Đã thanh toán trước).</li>
          <li>Bấm <strong className="dark:text-gray-100">Hoàn tất & Mở barie</strong> để xe ra.</li>
        </ul>
      </div>
    </div>
  )
}

export default StaffUserGuide
