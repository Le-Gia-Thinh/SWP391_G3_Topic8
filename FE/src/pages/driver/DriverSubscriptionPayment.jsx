import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, QrCode, ShieldCheck, CheckCircle2, Copy } from 'lucide-react';
import { toast } from 'react-toastify';

const DriverSubscriptionPayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('qr'); // 'qr' or 'transfer'

  // Extract data from navigation state
  const { plan, duration, finalPrice } = location.state || {};

  // If no state, redirect back
  useEffect(() => {
    if (!plan || !duration) {
      navigate('/driver/subscription');
    }
  }, [plan, duration, navigate]);

  if (!plan || !duration) return null;

  const handlePayment = () => {
    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      toast.success('Thanh toán thành công! Gói hội viên đã được kích hoạt.');
      // After success, navigate back to subscription page and trigger the 'status' tab
      navigate('/driver/subscription', { state: { activeTab: 'status' } });
    }, 2000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.info('Đã sao chép vào khay nhớ tạm');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <button 
          onClick={() => navigate('/driver/subscription')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại chọn gói</span>
        </button>
        
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Thanh Toán Gói Hội Viên</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Order Summary */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-indigo-500" />
              Tóm Tắt Đơn Hàng
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500">Gói hội viên</span>
                <span className="font-bold text-slate-900 text-lg">{plan.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500">Chu kỳ thanh toán</span>
                <span className="font-medium text-slate-900">{duration.label}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500">Mức chiết khấu</span>
                <span className="font-medium text-emerald-600">
                  {duration.discount > 0 ? `Giảm ${duration.discount}%` : 'Không có'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500">Phí cơ bản</span>
                <span className="font-medium text-slate-900 line-through text-slate-400">
                  {(plan.basePrice * duration.months).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-lg font-bold text-slate-900">Tổng Thanh Toán</span>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-indigo-600">
                    {finalPrice.toLocaleString('vi-VN')}
                  </span>
                  <span className="text-lg font-bold text-indigo-600 ml-1">đ</span>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-indigo-50 rounded-2xl p-4 flex gap-3 text-indigo-800">
              <ShieldCheck className="w-6 h-6 shrink-0" />
              <p className="text-sm">Giao dịch của bạn được mã hóa an toàn 256-bit và không lưu trữ thông tin thẻ trực tiếp.</p>
            </div>
          </div>

          {/* Right Column: Payment Methods */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Phương Thức Thanh Toán</h2>
            
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setPaymentMethod('qr')}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'qr' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-8 h-8 mb-2" />
                <span className="font-bold text-sm">Mã QR</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod('transfer')}
                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  paymentMethod === 'transfer' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-8 h-8 mb-2" />
                <span className="font-bold text-sm">Chuyển Khoản</span>
              </button>
            </div>

            {paymentMethod === 'qr' && (
              <div className="text-center animate-in fade-in zoom-in duration-300">
                <div className="bg-white p-4 border-2 border-slate-100 rounded-2xl inline-block mb-4 shadow-sm">
                  {/* Placeholder for real QR code */}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAYMENT_DEMO_SUB_${plan.id}`} 
                    alt="Payment QR" 
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <p className="text-sm text-slate-500 mb-2">Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã.</p>
                <p className="font-medium text-rose-500">Mã sẽ hết hạn sau 15:00</p>
              </div>
            )}

            {paymentMethod === 'transfer' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Ngân hàng</p>
                    <p className="font-bold text-slate-900">MB Bank - Ngân hàng Quân Đội</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Số tài khoản</p>
                    <p className="font-bold text-slate-900 text-lg tracking-wider">0999 8888 7777</p>
                  </div>
                  <button onClick={() => copyToClipboard('099988887777')} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
                    <Copy className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Tên tài khoản</p>
                    <p className="font-bold text-slate-900 uppercase">Cong Ty TNHH ParkingSafe</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Số tiền</p>
                    <p className="font-bold text-indigo-600 text-lg">{finalPrice.toLocaleString('vi-VN')} đ</p>
                  </div>
                  <button onClick={() => copyToClipboard(finalPrice.toString())} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-amber-700 uppercase tracking-wider font-bold mb-1">Nội dung chuyển khoản</p>
                    <p className="font-bold text-amber-900">SUB {plan.id.toUpperCase()} 0987654321</p>
                  </div>
                  <button onClick={() => copyToClipboard(`SUB ${plan.id.toUpperCase()} 0987654321`)} className="p-2 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors">
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={loading}
              className={`w-full mt-8 py-4 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang xử lý...
                </>
              ) : (
                'Xác Nhận Đã Thanh Toán'
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-4">
              Bằng việc thanh toán, bạn đồng ý với Điều khoản dịch vụ & Chính sách của chúng tôi.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DriverSubscriptionPayment;
