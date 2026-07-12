/**
 * FILE: DriverSubscription.jsx
 * MÔ TẢ: Trang Đăng ký / Quản lý Gói hội viên (Subscription) dành cho Driver.
 * Hiển thị 2 tab:
 * 1. Các gói hiện có để mua (Basic, Pro, Premium) kèm chiết khấu theo số tháng.
 * 2. Trạng thái Gói hiện tại của tài xế (nếu có).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Crown, CheckCircle2, Star, Zap, Shield, ChevronRight, Calendar, Clock, CreditCard, AlertCircle } from 'lucide-react';
import { subscriptionApi } from '../../apis/subscriptionApi';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

// Frontend UI configs for plans
const planConfigs = {
  basic: {
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

const DriverSubscription = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'status'
  const [duration, setDuration] = useState(1);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read activeTab from location state if redirected back from payment
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
        setLoading(true);
        const [plansRes, statusRes] = await Promise.all([
            subscriptionApi.getPlans(),
            subscriptionApi.getMyStatus()
        ]);
        
        // Merge DB plans with UI configs
        const mergedPlans = plansRes.data.map(p => ({
            ...p,
            ...(planConfigs[p.id] || planConfigs.basic) // fallback to basic if not found
        }));
        
        // Ensure premium plan is added if missing from backend
        if (!mergedPlans.find(p => p.id === 'premium' || p.PlanID === 'premium')) {
             mergedPlans.push({
                 id: 'premium',
                 name: 'Cao Cấp',
                 basePrice: 399000,
                 description: 'Trải nghiệm đặc quyền, không giới hạn.',
                 ...planConfigs.premium
             });
        }
        if (statusRes.data) {
            const startDate = new Date(statusRes.data.startDate);
            const endDate = new Date(statusRes.data.endDate);
            const today = new Date();
            
            const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
            const daysLeft = Math.round((endDate - today) / (1000 * 60 * 60 * 24));
            
            const storedAutoRenew = localStorage.getItem('driver_subscription_auto_renew');
            const isAutoRenew = storedAutoRenew ? storedAutoRenew === 'true' : true;

            const currentBasePrice = statusRes.data.basePrice || mergedPlans.find(p => p.id === statusRes.data.planId)?.basePrice || 0;

            setCurrentSubscription({
                active: true,
                planId: statusRes.data.planId,
                planName: statusRes.data.planName,
                startDate: startDate.toLocaleDateString('vi-VN'),
                endDate: endDate.toLocaleDateString('vi-VN'),
                totalDays: Math.max(1, totalDays),
                daysLeft: Math.max(0, daysLeft),
                autoRenew: isAutoRenew,
                basePrice: currentBasePrice
            });
            
            // Filter out plans cheaper than current
            let finalPlans = mergedPlans.filter(p => p.basePrice >= currentBasePrice);
            finalPlans.sort((a, b) => a.basePrice - b.basePrice);
            setPlans(finalPlans);
        } else {
            // No active subscription, just sort by price
            mergedPlans.sort((a, b) => a.basePrice - b.basePrice);
            setPlans(mergedPlans);
            setCurrentSubscription({ active: false });
        }
    } catch (error) {
        toast.error(t('driver.membershipPage.loadError'));
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDiscountedPrice = (basePrice, months, discountPercent) => {
    const totalBase = basePrice * months;
    const discountAmount = totalBase * (discountPercent / 100);
    return totalBase - discountAmount;
  };

  if (loading) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

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
          <div className="max-w-7xl mx-auto text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Nâng Cấp Trải Nghiệm Đỗ Xe
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Lựa chọn thời hạn và gói hội viên phù hợp với nhu cầu của bạn để tiết kiệm chi phí tối đa.
            </p>

            <div className="flex justify-center mt-10">
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
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const selectedDuration = durations.find(d => d.months === duration);
              const finalPrice = getDiscountedPrice(plan.basePrice, selectedDuration.months, selectedDuration.discount);
              
              return (
                <div 
                  key={plan.id}
                  className={`relative bg-white rounded-3xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${plan.cardStyle}`}
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
          {currentSubscription?.active ? (
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
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

                <div className="mb-8">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-slate-600">Tiến trình gói</span>
                    <span className="text-amber-600">
                      {Math.min(100, Math.max(0, Math.round(((currentSubscription.totalDays - currentSubscription.daysLeft) / currentSubscription.totalDays) * 100)))}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-amber-500 h-3 rounded-full" 
                      style={{ width: `${Math.min(100, Math.max(0, ((currentSubscription.totalDays - currentSubscription.daysLeft) / currentSubscription.totalDays) * 100))}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => navigate('/driver/subscription-upgrade', { state: { currentSubscription } })}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                  >
                    Nâng Cấp / Gia Hạn
                  </button>
                  {currentSubscription.autoRenew && (
                    <button 
                      onClick={() => navigate('/driver/subscription-cancel')}
                      className="px-6 py-3 bg-white text-rose-600 border border-rose-200 rounded-xl font-bold hover:bg-rose-50 transition-colors flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Hủy Gia Hạn
                    </button>
                  )}
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
