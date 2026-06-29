/**
 * FILE: Forbidden.jsx
 * MÔ TẢ: Trang Lỗi 403 (Forbidden) hiển thị khi người dùng cố truy cập
 * vào một trang mà họ không có quyền (không khớp vai trò / Role).
 */

import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Forbidden = () => {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 text-orange-600">
        <ShieldAlert size={48} />
      </div>
      <h1 className="mb-2 text-6xl font-black text-gray-900">403</h1>
      <h2 className="mb-4 text-2xl font-bold text-gray-800">Truy cập bị từ chối</h2>
      <p className="mb-8 max-w-md text-gray-500">
        Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ với quản trị viên nếu bạn cho rằng đây là lỗi.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        <ArrowLeft size={20} />
        Quay lại trang trước
      </button>
    </div>
  )
}

export default Forbidden
