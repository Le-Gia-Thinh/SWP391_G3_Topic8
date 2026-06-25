/**
 * FILE: DriverSubscriptionUpgrade.jsx
 * MÔ TẢ: Trang Nâng cấp Gói hội viên dành cho Driver.
 * Cho phép tài xế xem thông tin gói cao cấp hơn, chọn thời hạn nâng cấp
 * và chuyển hướng đến trang thanh toán.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

const upgradePlans = [
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
    popular: true,
  }
];

const durations = [
  { months: 1, discount: 0, label: '1 tháng' },
  { months: 3, discount: 5, label: '3 tháng' },
  { months: 6, discount: 10, label: '6 tháng' },
  { months: 9, discount: 15, label: '9 tháng' },
  { months: 12, discount: 20, label: '12 tháng' },
];

const DriverSubscriptionUpgrade = () => {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(1);

  const getDiscountedPrice = (basePrice, months, discountPercent) => {
    const totalBase = basePrice * months;
    const discountAmount = totalBase * (discountPercent / 100);
    return totalBase - discountAmount;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={() => navigate('/driver/subscription', { state: { activeTab: 'status' } })}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại Gói của tôi</span>
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
            Nâng Cấp Gói Hội Viên
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Bạn đang sử dụng gói <span className="font-bold text-amber-600">Nâng Cao</span>. 
            Nâng cấp lên gói cao hơn để tận hưởng các đặc quyền không giới hạn và vị trí đỗ xe VIP.
          </p>
        </div>

        {/* Duration Selector */}
        <div className="flex justify-center mb-10">
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

        {/* Upgrade Plans */}
        <div className="flex justify-center">
          {upgradePlans.map((plan) => {
            const Icon = plan.icon;
            const selectedDuration = durations.find(d => d.months === duration);
            const finalPrice = getDiscountedPrice(plan.basePrice, selectedDuration.months, selectedDuration.discount);
            
            return (
              <div 
                key={plan.id}
                className="relative bg-white rounded-3xl p-8 shadow-lg border-2 border-purple-400 max-w-md w-full scale-105"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" />
                    Lựa chọn nâng cấp tối ưu
                  </span>
                </div>

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
                  Nâng Cấp Lên {plan.name}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DriverSubscriptionUpgrade;
