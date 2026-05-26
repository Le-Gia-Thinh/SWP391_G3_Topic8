import React, { useState } from "react";
import { User, EyeOff, Eye, Info } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const initialFormData = {
  fullName: "Nguyễn Văn A",
  phoneNumber: "0901234567",
  email: "",
  password: "",
  confirmPassword: "",
  plateNumber: "",
  vehicleType: "Xe Máy",
  acceptedTerms: false
};

const DriverRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validateForm = () => {
    const nextErrors = [];

    const fullName = formData.fullName.trim();
    const phoneNumber = formData.phoneNumber.trim();
    const email = formData.email.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;
    const plateNumber = formData.plateNumber.trim();

    const phoneRegex = /^0\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Chấp nhận: 59A-123.45, 59A12345, 60B-12345
    const plateRegex =
      /^(\d{2}[A-Z]{1,2}-?\d{3}\.?\d{2}|\d{2}[A-Z]{1,2}-?\d{4,5})$/i;

    if (!fullName) {
      nextErrors.push("Vui lòng nhập họ và tên.");
    }

    if (!phoneNumber) {
      nextErrors.push("Vui lòng nhập số điện thoại.");
    } else if (!phoneRegex.test(phoneNumber)) {
      nextErrors.push("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.");
    }

    // Database của bạn đang để Email NOT NULL nên FE cũng bắt buộc nhập email
    if (!email) {
      nextErrors.push("Vui lòng nhập email.");
    } else if (!emailRegex.test(email)) {
      nextErrors.push("Email không đúng định dạng.");
    }

    if (!password || password.length < 8) {
      nextErrors.push("Mật khẩu phải chứa ít nhất 8 ký tự.");
    }

    if (password !== confirmPassword) {
      nextErrors.push("Mật khẩu và xác nhận mật khẩu không khớp.");
    }

    if (plateNumber && !plateRegex.test(plateNumber)) {
      nextErrors.push("Biển số xe không đúng định dạng. Ví dụ: 59A-123.45.");
    }

    if (!formData.acceptedTerms) {
      nextErrors.push("Vui lòng đồng ý với các điều khoản dịch vụ để tiếp tục.");
    }

    return nextErrors;
  };

const registerDriverApi = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || "Đăng ký thất bại.");
    error.data = data;
    error.status = response.status;
    throw error;
  }

  return data;
};

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrors([]);
    setSuccessMessage("");

    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerDriverApi({
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        plateNumber: formData.plateNumber.trim() || null,
        vehicleType: formData.vehicleType,
        terms: formData.acceptedTerms,
        acceptedTerms: formData.acceptedTerms
      });

      setSuccessMessage(
        result?.message ||
          "Đăng ký thành công. Tài khoản đang chờ Ban Quản Lý phê duyệt."
      );

      setFormData(initialFormData);

      setTimeout(() => {
        navigate("/admin/login");
      }, 1500);
    } catch (error) {
      const serverErrors = error.data?.errors;

      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        setErrors(serverErrors);
      } else {
        setErrors([error.message || "Đăng ký thất bại. Vui lòng thử lại."]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputNormalClass =
    "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";

  const passwordInputClass =
    "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all pr-10";

  return (
    <div className="flex justify-center py-12 px-4 bg-[#fbf9f1]/50">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10 relative">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tạo tài khoản Tài xế mới
          </h1>
          <p className="text-sm text-gray-500">
            Bắt đầu tham gia để trải nghiệm dịch vụ đỗ xe thông minh
          </p>
        </div>

        <div className="flex items-center gap-4 mb-8 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-sm">
              Thông tin cá nhân
            </h2>
            <p className="text-xs text-gray-500">
              Vui lòng điền chính xác thông tin để được hỗ trợ tốt nhất
            </p>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            <p className="font-bold mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Phát hiện lỗi nhập liệu:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs font-medium opacity-90">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {successMessage && (
          <div className="mb-8 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-medium">
            {successMessage}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Họ và Tên
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <input
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Số điện thoại
              </label>
              <input
                name="phoneNumber"
                type="text"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={inputNormalClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nguyenvana@gmail.com"
                className={inputNormalClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  className={passwordInputClass}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  className={passwordInputClass}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Biển số xe (Tùy chọn)
              </label>
              <input
                name="plateNumber"
                type="text"
                value={formData.plateNumber}
                onChange={handleChange}
                placeholder="VD: 59A-123.45"
                className={inputNormalClass}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Loại phương tiện mặc định
              </label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none text-gray-600"
              >
                <option value="Xe Máy">Xe Máy</option>
                <option value="Ô Tô">Ô Tô</option>
                <option value="Xe Đạp">Xe Đạp</option>
              </select>
            </div>
          </div>

          <div className="flex items-start py-2">
            <input
              id="terms"
              name="acceptedTerms"
              type="checkbox"
              checked={formData.acceptedTerms}
              onChange={handleChange}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="terms"
              className="ml-2 block text-sm text-gray-600 select-none"
            >
              Tôi đồng ý với{" "}
              <a href="#" className="text-blue-600 font-medium hover:underline">
                Điều khoản sử dụng
              </a>{" "}
              và{" "}
              <a href="#" className="text-blue-600 font-medium hover:underline">
                Chính sách bảo mật
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Đang đăng ký..." : "Đăng ký ngay"}
          </button>

          <div className="text-center">
            <Link
              to="/admin/login"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors bg-gray-100 hover:bg-gray-200 px-6 py-2 rounded-lg inline-block"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        </form>

        <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-100">
          <div className="flex gap-3 items-start">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-blue-800 mb-1">
                Quy Trình Duyệt Tài Khoản
              </h3>
              <p className="text-xs text-blue-600 leading-relaxed">
                Tài khoản sau khi đăng ký sẽ được phê duyệt bởi Ban Quản Lý
                (BQL). Thông báo kết quả sẽ được gửi qua số điện thoại hoặc
                email. Quá trình xét duyệt có thể mất từ 1 - 2 ngày làm việc.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverRegister;