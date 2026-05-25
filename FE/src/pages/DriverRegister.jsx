import React, { useState } from 'react';
import { User, EyeOff, Eye, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const DriverRegister = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex justify-center py-12 px-4 bg-[#fbf9f1]/50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10 relative">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tạo tài khoản Tài xế mới</h1>
          <p className="text-sm text-gray-500">Bắt đầu tham gia để trải nghiệm dịch vụ đỗ xe thông minh</p>
        </div>

        <div className="flex items-center gap-4 mb-8 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Thông tin cá nhân</h2>
            <p className="text-xs text-gray-500">Vui lòng điền chính xác thông tin để được hỗ trợ tốt nhất</p>
          </div>
        </div>

        {/* Error/Warning Message Box (similar to image) */}
        <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          <p className="font-bold mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Phát hiện lỗi nhập liệu:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs font-medium opacity-90">
            <li>Số điện thoại không đúng định dạng.</li>
            <li>Biển số xe không đúng định dạng (VD: 59A-123.45).</li>
            <li>Mật khẩu phải chứa ít nhất 8 ký tự.</li>
            <li>Mật khẩu và xác nhận mật khẩu không khớp.</li>
            <li>Vui lòng đồng ý với các điều khoản dịch vụ để tiếp tục.</li>
          </ul>
        </div>

        <form className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Họ và Tên</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <input 
                type="text" 
                defaultValue="Nguyễn Văn A" 
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Số điện thoại</label>
              <input 
                type="text" 
                defaultValue="0901234567" 
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Email (Tùy chọn)</label>
              <input 
                type="email" 
                placeholder="nguyenvana@gmail.com" 
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Nhập mật khẩu" 
                  className="w-full px-4 py-3 rounded-xl bg-red-50 border border-red-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm outline-none transition-all pr-10"
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  placeholder="Nhập lại mật khẩu" 
                  className="w-full px-4 py-3 rounded-xl bg-red-50 border border-red-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm outline-none transition-all pr-10"
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Biển số xe (Tùy chọn)</label>
              <input 
                type="text" 
                placeholder="VD: 59A-123.45" 
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Loại phương tiện mặc định</label>
              <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none text-gray-600">
                <option>Xe Máy</option>
                <option>Ô Tô</option>
                <option>Xe Đạp</option>
              </select>
            </div>
          </div>

          <div className="flex items-start py-2">
            <input 
              id="terms" 
              type="checkbox" 
              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-600 select-none">
              Tôi đồng ý với <a href="#" className="text-blue-600 font-medium hover:underline">Điều khoản sử dụng</a> và <a href="#" className="text-blue-600 font-medium hover:underline">Chính sách bảo mật</a>
            </label>
          </div>

          <button 
            type="button" 
            className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
          >
            Đăng ký ngay
          </button>
          
          <div className="text-center">
            <Link to="/admin/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-gray-200 px-6 py-2 rounded-lg inline-block">
              Quay lại Đăng nhập
            </Link>
          </div>
        </form>

        <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
          <div className="flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-blue-800 mb-1">Quy Trình Duyệt Tài Khoản</h3>
              <p className="text-xs text-blue-600 leading-relaxed">
                Tài khoản sau khi đăng ký sẽ được phê duyệt bởi Ban Quản Lý (BQL). Thông báo kết quả sẽ được gửi qua số điện thoại hoặc email (nếu có). Quá trình xét duyệt có thể mất từ 1 - 2 ngày làm việc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverRegister;
