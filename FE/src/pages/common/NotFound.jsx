import { AlertTriangle, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle size={48} />
      </div>
      <h1 className="mb-2 text-6xl font-black text-gray-900">404</h1>
      <h2 className="mb-4 text-2xl font-bold text-gray-800">Không tìm thấy trang</h2>
      <p className="mb-8 max-w-md text-gray-500">
        Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không truy cập được.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md transition-colors hover:bg-blue-700"
      >
        <Home size={20} />
        Về trang chủ
      </Link>
    </div>
  )
}

export default NotFound
