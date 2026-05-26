import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { phoneOrEmail: '', password: '', remember: false }
  });

  const onSubmit = (data) => {
    // TODO: Replace with real auth call
    console.log(data);
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] py-12 px-4">
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-sm border border-gray-100 p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" aria-hidden />

        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Đăng Nhập</h1>
          <p className="text-sm text-gray-500">Vui lòng nhập thông tin để truy cập hệ thống</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="phoneOrEmail" className="block text-xs font-bold text-gray-700 mb-1.5">Số điện thoại hoặc Tài khoản</label>
            <input
              id="phoneOrEmail"
              name="phoneOrEmail"
              type="text"
              placeholder="Ví dụ: 0912345678 hoặc admin@..."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              {...register('phoneOrEmail', { required: 'Vui lòng nhập số điện thoại hoặc tài khoản' })}
            />
            {errors.phoneOrEmail && <p className="text-xs text-red-500 mt-1">{errors.phoneOrEmail.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-gray-700">Mật khẩu</label>
              <Link to="/forgot-password" className="text-xs text-blue-600 font-medium hover:underline">Quên mật khẩu?</Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center pt-2">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              {...register('remember')}
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-600 cursor-pointer select-none">
              Ghi nhớ đăng nhập
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 mt-4"
          >
            Đăng Nhập
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Bạn không có tài khoản? <Link to="/contact" className="text-blue-600 font-medium hover:underline">Vui lòng liên hệ CSKH</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
