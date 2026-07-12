/**
 * FILE: DriverSubscriptionUpgrade.jsx
 * MÔ TẢ: Trang Nâng cấp / Gia hạn Gói hội viên dành cho Driver.
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Shield, Star, Crown, CheckCircle2, ChevronRight, Zap, Info } from 'lucide-react';

const allPlans = {
  basic: {
    id: 'basic',
    name: 'Cơ Bản',
    basePrice: 99000,
    description: 'Bảo vệ cơ bản, tiện lợi hàng ngày.',
    icon: Shield,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    features: [
      'Miễn phí 5 phiên đỗ xe/tháng (1 phiên = 4 tiếng)',
      'Giảm 10% phí đỗ xe khi vượt hạn mức',
      'Áp dụng cho xe Mặc định của tài khoản',
      'Thanh toán linh hoạt'
    ],
    cardStyle: 'border border-slate-200 hover:border-blue-300',
    badgeText: null,
  },
  pro: {
    id: 'pro',
    name: 'Nâng Cao',
    basePrice: 199000,
    description: 'Lựa chọn thông minh cho tài xế chuyên nghiệp.',
    icon: Star,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
    buttonColor: 'bg-amber-500 hover:bg-amber-600',
    features: [
      'Miễn phí 15 phiên đỗ xe/tháng (1 phiên = 4 tiếng)',
      'Giảm 25% phí đỗ xe khi vượt hạn mức',
      'Áp dụng cho xe Mặc định của tài khoản'
    ],
    cardStyle: 'border-2 border-amber-400 scale-105 z-10 shadow-amber-100/50 hover:shadow-amber-200/50',
    badgeText: 'Phổ Biến Nhất',
    badgeBg: 'from-amber-400 to-amber-600',
  },
  premium: {
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
      'Miễn phí 300 phiên/tháng (1 phiên = 4 tiếng, ~1200 giờ)',
      'Đăng ký tối đa 2 xe mặc định miễn phí',
      'Áp dụng cho xe Mặc định & xe VIP'
    ],
    cardStyle: 'border-2 border-purple-500 scale-110 z-20 shadow-xl shadow-purple-200/50 hover:shadow-purple-300/50',
    badgeText: 'Khuyên Dùng',
    badgeBg: 'from-purple-500 to-indigo-500',
  }
};

const durations = [
  { months: 1, discount: 0, label: '1 tháng' },
  { months: 2, discount: 2, label: '2 tháng' },
  { months: 3, discount: 5, label: '3 tháng' },
  { months: 6, discount: 10, label: '6 tháng' },
  { months: 9, discount: 15, label: '9 tháng' },
  { months: 12, discount: 20, label: '1 năm' },
  { months: 24, discount: 30, label: '2 năm' },
];

const DriverSubscriptionUpgrade = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [duration, setDuration] = useState(1);

  const { currentSubscription } = location.state || {};
  
  if (!currentSubscription) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Không tìm thấy thông tin gói hiện tại</h2>
            <button onClick={() => navigate('/driver/subscription')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Quay lại</button>
        </div>
      </div>
    );
  }

  // Find current plan config
  const currentPlanKey = Object.keys(allPlans).find(key => allPlans[key].id === currentSubscription.planId || allPlans[key].name === currentSubscription.planName) || 'basic';
  const currentPlan = allPlans[currentPlanKey];
  
  // Calculate remaining value (prorated)
  const remainingValue = Math.max(0, Math.round((currentPlan.basePrice / 30) * currentSubscription.daysLeft));

  // Only show plans that are equal (renew) or higher (upgrade) and sort by price
  const availablePlans = Object.values(allPlans)
    .filter(p => p.basePrice >= currentPlan.basePrice)
    .sort((a, b) => a.basePrice - b.basePrice);

  const getDiscountedPrice = (basePrice, months, discountPercent) => {
    const totalBase = basePrice * months;
    const discountAmount = totalBase * (discountPercent / 100);
    return totalBase - discountAmount;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate('/driver/subscription', { state: { activeTab: 'status' } })}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại Gói của tôi</span>
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
            Nâng Cấp / Gia Hạn Gói
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto mb-4">
            Bạn đang sử dụng gói <span className="font-bold text-amber-600">{currentSubscription.planName}</span> (còn {currentSubscription.daysLeft} ngày).
          </p>
          
          {remainingValue > 0 && availablePlans.some(p => p.basePrice > currentPlan.basePrice) && (
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium border border-emerald-200">
                <Info className="w-4 h-4" />
                Số dư {remainingValue.toLocaleString('vi-VN')}đ của gói hiện tại sẽ được khấu trừ khi thanh toán nâng cấp.
            </div>
          )}
        </div>

        {/* Duration Selector */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap justify-center gap-2 max-w-5xl">
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
        <div className="flex flex-col lg:flex-row justify-center items-stretch gap-8 lg:flex-nowrap">
          {availablePlans.map((plan) => {
            const Icon = plan.icon;
            const selectedDuration = durations.find(d => d.months === duration);
            const isUpgrade = plan.basePrice > currentPlan.basePrice;
            const planTotalPrice = getDiscountedPrice(plan.basePrice, selectedDuration.months, selectedDuration.discount);
            const finalPrice = isUpgrade ? Math.max(0, planTotalPrice - remainingValue) : planTotalPrice;
            const excessValue = isUpgrade ? Math.max(0, remainingValue - planTotalPrice) : 0;
            const extraDays = excessValue > 0 ? Math.round(excessValue / (plan.basePrice / 30)) : 0;
            
            return (
              <div 
                key={plan.id}
                className={`relative bg-white rounded-3xl p-8 shadow-lg max-w-sm w-full flex-1 transition-all duration-300 ${plan.cardStyle}`}
              >
                {plan.badgeText && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className={`bg-gradient-to-r ${plan.badgeBg} text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-md flex items-center gap-1`}>
                      <Zap className="w-3 h-3 fill-current" />
                      {plan.badgeText}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <div className={`p-3 rounded-2xl ${plan.bgColor}`}>
                    <Icon className={`w-8 h-8 ${plan.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{isUpgrade ? 'Nâng cấp trải nghiệm' : 'Gia hạn gói hiện tại'}</p>
                  </div>
                </div>

                <div className="mb-8 border-b border-slate-100 pb-6">
                  <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-500">Giá gốc ({selectedDuration.label}):</span>
                      <span className="font-semibold text-slate-700">{planTotalPrice.toLocaleString('vi-VN')} đ</span>
                  </div>
                  {isUpgrade && remainingValue > 0 && (
                      <div className="flex justify-between items-center text-sm mb-2 text-emerald-600">
                          <span>Dùng số dư gói cũ:</span>
                          <span className="font-semibold">- {Math.min(remainingValue, planTotalPrice).toLocaleString('vi-VN')} đ</span>
                      </div>
                  )}
                  {extraDays > 0 && (
                      <div className="flex justify-between items-center text-sm mb-2 text-indigo-600 font-medium">
                          <span>Quy đổi thành ngày:</span>
                          <span>+ {extraDays} ngày</span>
                      </div>
                  )}
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-4xl font-extrabold text-slate-900">{finalPrice.toLocaleString('vi-VN')}</span>
                    <span className="text-lg font-medium text-slate-500">đ</span>
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    Thanh toán hôm nay
                  </div>
                </div>

                <ul className="space-y-4 mb-8 min-h-[160px]">
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
                    navigate('/driver/subscription-payment', { 
                        state: { 
                            plan: serializablePlan, 
                            duration: selectedDuration, 
                            finalPrice,
                            deductionAmount: isUpgrade ? remainingValue : 0,
                            excessValue,
                            extraDays 
                        } 
                    });
                  }}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 group ${plan.buttonColor}`}
                >
                  {isUpgrade ? `Nâng Cấp Lên ${plan.name}` : `Gia Hạn ${plan.name}`}
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
