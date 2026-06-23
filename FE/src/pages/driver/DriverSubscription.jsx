import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Crown, CheckCircle2, Star, Zap, Shield, ChevronRight, Calendar, Clock, CreditCard, AlertCircle } from 'lucide-react';

const plans = [
  {
    id: 'basic',
    name: 'Cơ Bản',
    basePrice: 99000,
    description: 'Phù hợp cho người đỗ xe không thường xuyên.',
    icon: Shield,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    features: [
      'Miễn phí 5 lượt đỗ xe đầu tiên',
      'Giảm 10% phí đỗ xe các lượt tiếp theo',
      'Hỗ trợ khách hàng tiêu chuẩn',
      'Thanh toán linh hoạt'
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Nâng Cao',
    basePrice: 199000,
    description: 'Lựa chọn phổ biến cho người đi làm hàng ngày.',
    icon: Star,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    buttonColor: 'bg-amber-500 hover:bg-amber-600',
    features: [
      'Miễn phí 15 lượt đỗ xe đầu tiên',
      'Giảm 25% phí đỗ xe các lượt tiếp theo',
      'Ưu tiên đặt chỗ trước 24h',
      'Hỗ trợ khách hàng ưu tiên 24/7'
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Cao Cấp',
    basePrice: 399000,
    description: 'Trải nghiệm đặc quyền, không giới hạn.',
    icon: Crown,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    features: [
      'Đỗ xe không giới hạn thời gian',
      'Giữ cố định 1 vị trí đỗ xe VIP',
      'Miễn phí dịch vụ rửa xe 1 lần/tháng',
      'Đường dây nóng hỗ trợ riêng biệt'
    ],
    popular: false,
  }
];

const durations = [
  { months: 1, discount: 0, label: '1 tháng' },
  { months: 3, discount: 5, label: '3 tháng' },
  { months: 6, discount: 10, label: '6 tháng' },
  { months: 9, discount: 15, label: '9 tháng' },
  { months: 12, discount: 20, label: '12 tháng' },
];

const DriverSubscription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'status'
  const [duration, setDuration] = useState(1);

  // Read activeTab from location state if redirected back from payment
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Mock data for current subscription status
  const currentSubscription = {
    active: true,
    planId: 'pro',
    planName: 'Nâng Cao',
    startDate: '15/06/2026',
    endDate: '15/12/2026',
    totalDays: 183,
    daysLeft: 175,
    autoRenew: true,
  };

  const getDiscountedPrice = (basePrice, months, discountPercent) => {
    const totalBase = basePrice * months;
    const discountAmount = totalBase * (discountPercent / 100);
    return totalBase - discountAmount;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      
      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-center">
        <div className="bg-white p-1.5 rounded-full border border-slate-200 shadow-sm inline-flex">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeTab === 'plans'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mua Gói Ưu Đãi
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeTab === 'status'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gói Của Tôi
          </button>
        </div>
      </div>

      {activeTab === 'plans' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header Section */}
          <div className="max-w-7xl mx-auto text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Nâng Cấp Trải Nghiệm Đỗ Xe
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Lựa chọn thời hạn và gói hội viên phù hợp với nhu cầu của bạn để tiết kiệm chi phí tối đa.
            </p>

            {/* Duration Selector */}
            <div className="flex justify-center mt-10">
              <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-center gap-2 max-w-3xl">
                {durations.map((opt) => (
                  <button
                    key={opt.months}
                    onClick={() => setDuration(opt.months)}
                    className={`relative px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex flex-col items-center min-w-[100px] ${
                      duration === opt.months
                        ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700 shadow-sm'
                        : 'border border-transparent hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.discount > 0 ? (
                      <span className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                        duration === opt.months ? 'bg-indigo-500 text-white' : 'bg-rose-100 text-rose-600 font-bold'
                      }`}>
                        Giảm {opt.discount}%
                      </span>
                    ) : (
                      <span className="text-xs mt-1 text-slate-400 font-normal">Giá gốc</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const selectedDuration = durations.find(d => d.months === duration);
              const finalPrice = getDiscountedPrice(plan.basePrice, selectedDuration.months, selectedDuration.discount);
              
              return (
                <div 
                  key={plan.id}
                  className={`relative bg-white rounded-3xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                    plan.popular ? 'border-2 border-amber-400 scale-105 z-10' : 'border border-slate-200 mt-4 md:mt-0'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-current" />
                        Phổ Biến Nhất
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-2xl ${plan.bgColor}`}>
                      <Icon className={`w-8 h-8 ${plan.color}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-sm text-slate-500">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    {selectedDuration.discount > 0 && (
                      <div className="text-slate-400 line-through text-sm mb-1">
                        {(plan.basePrice * selectedDuration.months).toLocaleString('vi-VN')} đ
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-900">{finalPrice.toLocaleString('vi-VN')}</span>
                      <span className="text-lg font-medium text-slate-500">đ</span>
                    </div>
                    <div className="text-slate-500 text-sm mt-1">
                      / {selectedDuration.label}
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-slate-700">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.color}`} />
                        <span className="text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => {
                      const { icon, ...serializablePlan } = plan;
                      navigate('/driver/subscription-payment', { state: { plan: serializablePlan, duration: selectedDuration, finalPrice } });
                    }}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 group ${plan.buttonColor}`}
                  >
                    Đăng Ký Ngay
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'status' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
          {currentSubscription.active ? (
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Status Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white relative overflow-hidden">
                <Star className="absolute top-4 right-4 w-32 h-32 text-white opacity-10 -rotate-12" />
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-sm">
                    Đang Hoạt Động
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold mb-1">Gói {currentSubscription.planName}</h2>
                <p className="text-amber-100">Tận hưởng các đặc quyền ưu tiên của bạn.</p>
              </div>

              {/* Status Body */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Chu kỳ hiện tại</p>
                      <p className="font-bold text-slate-900">{currentSubscription.startDate} - {currentSubscription.endDate}</p>
                      <p className="text-sm text-indigo-600 mt-2 font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Còn lại {currentSubscription.daysLeft} ngày
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-start gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Gia hạn tự động</p>
                      <p className="font-bold text-slate-900">{currentSubscription.autoRenew ? 'Đang Bật' : 'Đang Tắt'}</p>
                      <p className="text-sm text-emerald-600 mt-2 font-medium">
                        Lần thanh toán tiếp theo: {currentSubscription.endDate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-slate-600">Tiến trình gói</span>
                    <span className="text-amber-600">
                      {Math.round(((currentSubscription.totalDays - currentSubscription.daysLeft) / currentSubscription.totalDays) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-amber-500 h-3 rounded-full" 
                      style={{ width: `${((currentSubscription.totalDays - currentSubscription.daysLeft) / currentSubscription.totalDays) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => navigate('/driver/subscription-upgrade')}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                  >
                    Nâng Cấp Gói
                  </button>
                  <button 
                    onClick={() => navigate('/driver/subscription-cancel')}
                    className="px-6 py-3 bg-white text-rose-600 border border-rose-200 rounded-xl font-bold hover:bg-rose-50 transition-colors flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Hủy Gia Hạn
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-12 h-12 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Chưa Đăng Ký Gói</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Bạn hiện chưa đăng ký bất kỳ gói hội viên nào. Nâng cấp ngay để nhận ưu đãi đỗ xe và các quyền lợi hấp dẫn.
              </p>
              <button 
                onClick={() => setActiveTab('plans')}
                className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-md"
              >
                Xem Các Gói Ưu Đãi
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverSubscription;
