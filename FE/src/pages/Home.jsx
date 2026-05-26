import React from 'react';
import { Users, Car, Bike, ShieldCheck, CheckCircle2 } from 'lucide-react';
import StatCard from '../components/home/StatCard';
import VehicleCard from '../components/home/VehicleCard';

const Home = () => {
  return (
    <div className="flex flex-col gap-24 py-16">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-10">
        <h1 className="text-5xl md:text-6xl font-extrabold text-blue-600 tracking-tight leading-tight mb-6 max-w-4xl mx-auto">
          Đỗ Xe Thông Minh<br />Cho Tòa Nhà Đa Tầng
        </h1>
        <p className="text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
          Giải pháp quản lý tự động, an toàn và hiệu quả cho người quản lý bãi đỗ xe và trải nghiệm gửi xe dễ dàng hơn cho mọi cư dân, nhân viên.
        </p>
        <div className="flex justify-center items-center gap-4 mb-12">
          <button className="bg-blue-600 text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            Khám Phá Hệ Thống
          </button>
          <button className="bg-white text-gray-700 font-medium px-8 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            Xem Quy Trình
          </button>
        </div>
        
        {/* Avatars */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center overflow-hidden"><img src="https://i.pravatar.cc/100?img=1" alt="Avatar" /></div>
            <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-200 flex items-center justify-center overflow-hidden"><img src="https://i.pravatar.cc/100?img=2" alt="Avatar" /></div>
            <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-300 flex items-center justify-center overflow-hidden"><img src="https://i.pravatar.cc/100?img=3" alt="Avatar" /></div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Hơn <span className="text-gray-900 font-bold">2,500</span> lượt ra vào hệ thống mỗi ngày</p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white/50 py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">Tổng Quan Trạng Thái Bãi Đỗ</h2>
            <p className="text-gray-500 text-sm">Hệ thống theo dõi thời gian thực giúp bạn nắm bắt tình trạng hiện tại của tòa nhà đỗ xe.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Tổng Sức Chứa', value: '1,200', unit: 'Chỗ trống', icon: <Users className="w-5 h-5 text-gray-400" /> },
              { label: 'Đang Có Xe', value: '485', unit: 'Chỗ trống', icon: <Car className="w-5 h-5 text-gray-400" /> },
              { label: 'Đang Trống', value: '612', unit: 'Chỗ trống', icon: <Car className="w-5 h-5 text-green-500" /> },
              { label: 'Doanh Thu (ước tính)', value: '105', unit: 'Triệu VNĐ', icon: <Users className="w-5 h-5 text-gray-400" /> },
            ].map((stat, idx) => (
              <StatCard key={idx} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Vehicles Supported */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-blue-600 mb-2">Phương Tiện Được Hỗ Trợ</h2>
          <p className="text-gray-500 text-sm">Chương trình chuyên biệt được tối ưu cho các loại xe khi đăng ký dùng phương tiện.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Xe Máy', desc: '315 chỗ trống / tầng', icon: <Bike className="w-6 h-6" />, progress: 'w-3/4' },
            { title: 'Ô Tô', desc: '120 chỗ trống / tầng', icon: <Car className="w-6 h-6" />, progress: 'w-1/2' },
            { title: 'Xe Đạp', desc: '20 chỗ trống / tầng', icon: <Bike className="w-6 h-6" />, progress: 'w-1/4' },
          ].map((v, i) => (
            <VehicleCard key={i} {...v} />
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white/50 py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-blue-600 mb-4">Bảng Giá Dịch Vụ Niêm Yết</h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                Đơn vị kinh doanh, không phải bãi đỗ xe giá rẻ. Hệ thống tính giá tự động linh hoạt thời gian theo số giờ/phút qua hệ thống quản lý.
              </p>
              <ul className="space-y-4">
                {[
                  'Thanh toán linh hoạt qua ứng dụng',
                  'Ưu đãi giảm 10% khi đăng ký năm',
                  'Hỗ trợ xuất hóa đơn VAT'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium text-gray-500">Loại Phương Tiện</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Giá 1 Giờ Đầu</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Giá Tiếp Theo</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Giá Qua Đêm</th>
                      <th className="px-6 py-4 font-medium text-gray-500 text-right">Vé Tháng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">Xe Đạp</td>
                      <td className="px-6 py-4 text-gray-500">2,000₫</td>
                      <td className="px-6 py-4 text-gray-500">1,000₫/h</td>
                      <td className="px-6 py-4 text-gray-500">20,000₫</td>
                      <td className="px-6 py-4 text-red-500 font-semibold text-right">50,000₫</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">Xe Máy (Mô tô)</td>
                      <td className="px-6 py-4 text-gray-500">5,000₫</td>
                      <td className="px-6 py-4 text-gray-500">2,000₫/h</td>
                      <td className="px-6 py-4 text-gray-500">50,000₫</td>
                      <td className="px-6 py-4 text-red-500 font-semibold text-right">150,000₫</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">Xe Ô Tô</td>
                      <td className="px-6 py-4 text-gray-500">20,000₫</td>
                      <td className="px-6 py-4 text-gray-500">10,000₫/h</td>
                      <td className="px-6 py-4 text-gray-500">150,000₫</td>
                      <td className="px-6 py-4 text-red-500 font-semibold text-right">1,200,000₫</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-4">*Giá vé có thể thay đổi tùy thuộc vào dịp Lễ, Tết hoặc thời gian gửi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Guidelines Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
          <div className="md:w-1/3 bg-blue-600 p-10 text-white flex flex-col justify-center">
            <ShieldCheck className="w-12 h-12 mb-6 text-blue-200" />
            <h2 className="text-2xl font-bold mb-4">Quy Định & Hướng Dẫn Vận Hành</h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-8">
              Để đảm bảo an toàn và vận hành thông suốt cho tòa nhà, người sử dụng dịch vụ vui lòng tuân thủ quy định sử dụng bãi đỗ xe...
            </p>
            <div className="bg-blue-700/50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">!</div>
              <p className="text-xs font-medium">Hệ thống có camera AI giám sát thông minh 24/7 và hệ thống PCCC tự động.</p>
            </div>
          </div>
          <div className="md:w-2/3 p-10">
            <ul className="space-y-6">
              {[
                'Tuân thủ tốc độ tối đa cho phép trong khu vực bãi đỗ xe là 10km/h.',
                'Đậu xe đúng vạch sơn, không lấn chiếm lối đi chung hoặc cản trở các phương tiện khác.',
                'Tắt máy xe ngay sau khi đỗ, không để lại các vật liệu dễ cháy nổ trên xe.',
                'Thanh toán phí dịch vụ gửi xe đúng hạn nếu sử dụng vé tháng, nếu sử dụng vé lượt hãy thanh toán khi ra khỏi bãi.',
                'Cấm hút thuốc, xả rác và gây mất trật tự an ninh trong toàn bộ khu vực bãi đỗ xe.'
              ].map((item, idx) => (
                <li key={idx} className="flex gap-4 items-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
