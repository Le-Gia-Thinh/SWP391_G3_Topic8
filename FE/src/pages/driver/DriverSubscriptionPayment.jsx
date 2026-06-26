/**
 * FILE: DriverSubscriptionPayment.jsx
 * MÔ TẢ: Trang Thanh toán Gói hội viên dành cho Driver.
 * Xử lý việc tạo mã QR thanh toán (PayOS) cho gói hội viên đã chọn,
 * hỗ trợ thanh toán qua Ví nội bộ và polling trạng thái thanh toán.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, Clock, QrCode, ShieldCheck, CheckCircle2, Copy, ExternalLink, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { subscriptionApi } from '../../apis/subscriptionApi';
import walletApi from '../../apis/walletApi';

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Number(n || 0)) + ' VNĐ';

// ── QR Canvas (reuse cùng style với DriverPayment) ───────────────
const QRCanvas = ({ data, size = 220 }) => {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    setError(false);
    QRCode.toCanvas(canvasRef.current, data, {
      width: size,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M'
    }).catch(() => setError(true));
  }, [data, size]);

  if (error) return (
    <div className="flex items-center justify-center bg-slate-100 rounded-xl p-4 text-sm text-slate-500" style={{ width: size, height: size }}>
      Không thể tạo mã QR.<br />Vui lòng thử lại.
    </div>
  );
  return (
    <div className="rounded-xl overflow-hidden shadow-lg bg-white p-1.5 inline-block">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

// ── Countdown Timer ──────────────────────────────────────────────
const Countdown = ({ expiredAt }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiredAt).getTime() - Date.now()) / 1000));
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setTimeLeft(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiredAt]);

  return <span className="font-mono font-bold text-white text-sm">{timeLeft}</span>;
};

// ── Copy Button ──────────────────────────────────────────────────
const CopyButton = ({ text }) => {
  const { t } = useTranslation();
  const handleCopy = () => {
    navigator.clipboard.writeText(String(text || ''));
    toast.info(t('driver.subscriptionPayment.copied'));
  };
  return (
    <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
      <Copy className="w-4 h-4" />
    </button>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
const DriverSubscriptionPayment = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState('loading'); // loading | qr | done | error
  const [payment, setPayment] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const { plan, duration, finalPrice } = location.state || {};

  // Redirect if no state
  useEffect(() => {
    if (!plan || !duration) {
      navigate('/driver/subscription');
    }
  }, [plan, duration, navigate]);

  // Fetch balance
  useEffect(() => {
    walletApi.getBalance().then(res => {
      if (res.success) setWalletBalance(res.data.balance);
    }).catch(() => {});
  }, []);

  // Create PayOS payment link on mount
  useEffect(() => {
    if (!plan || !duration) return;

    const createPayment = async () => {
      try {
        setStep('loading');
        const res = await subscriptionApi.createPayment({
          planId: plan.id,
          durationMonths: duration.months
        });
        setPayment(res.data);
        setStep('qr');
      } catch (error) {
        toast.error(t('driver.subscriptionPayment.createFail'));
        setStep('error');
      }
    };

    createPayment();
  }, [plan, duration]);

  // Polling for payment status
  const pollerRef = useRef(null);

  useEffect(() => {
    if (step === 'qr' && payment?.orderCode) {
      pollerRef.current = setInterval(async () => {
        try {
          const res = await subscriptionApi.checkStatus(payment.orderCode);
          if (res.data?.status === 'PAID') {
            clearInterval(pollerRef.current);
            // Confirm subscription
            await handleConfirm();
          } else if (res.data?.status === 'CANCELLED' || res.data?.status === 'EXPIRED') {
            clearInterval(pollerRef.current);
            toast.error(t('driver.subscriptionPayment.cancelledOrExpired'));
            navigate('/driver/subscription');
          }
        } catch (error) {
          // ignore polling errors
        }
      }, 3000);
    }

    return () => clearInterval(pollerRef.current);
  }, [step, payment]);

  // Confirm subscription after payment
  const handleConfirm = useCallback(async () => {
    try {
      setConfirming(true);
      await subscriptionApi.subscribe({
        orderCode: payment.orderCode
      });
      setStep('done');
      toast.success(t('driver.subscriptionPayment.activateSuccess'));
    } catch (error) {
      toast.error(t('driver.subscriptionPayment.paymentNotCompleted'));
    } finally {
      setConfirming(false);
    }
  }, [payment]);

  const handlePayByWallet = async () => {
    try {
       if (walletBalance < payment.amount) {
           toast.error(t('driver.payment.walletInsufficient'));
           return;
       }
       const res = await walletApi.paySubscription(plan.id, duration.months);
       if (res.success) {
           setStep('done');
           toast.success(t('driver.payment.walletSuccess'));
       }
    } catch (e) {
       toast.error(t('driver.payment.walletFail'));
    }
  }

  if (!plan || !duration) return null;

  // ──────────────────────────────────────────────────────────────
  // STEP: loading
  // ──────────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Đang tạo mã thanh toán...</p>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────────
  // STEP: error
  // ──────────────────────────────────────────────────────────────
  if (step === 'error') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center bg-white rounded-3xl p-10 shadow-lg max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">❌</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Không thể tạo thanh toán</h2>
        <p className="text-slate-500 mb-6">Vui lòng quay lại và thử lại sau.</p>
        <button onClick={() => navigate('/driver/subscription')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
          Quay lại
        </button>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────────
  // STEP: done
  // ──────────────────────────────────────────────────────────────
  if (step === 'done') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center bg-white rounded-3xl p-10 shadow-lg max-w-md">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Kích hoạt thành công!</h2>
        <p className="text-slate-500 mb-6">Gói <strong>{plan.name}</strong> ({duration.label}) đã được kích hoạt.</p>
        <button onClick={() => navigate('/driver/subscription', { state: { activeTab: 'status' } })} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">
          Xem Gói Của Tôi
        </button>
      </div>
    </div>
  );

  // ──────────────────────────────────────────────────────────────
  // STEP: qr
  // ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-lg mx-auto">

        {/* Back button */}
        <button
          onClick={() => navigate('/driver/subscription')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại chọn gói</span>
        </button>

        {/* Main Card */}
        <div className="rounded-3xl overflow-hidden shadow-xl">
          {/* ── Header (Dark gradient) ── */}
          <div className="px-6 py-6" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-white/70" />
                <span className="text-white/80 text-sm font-bold">Quét QR để thanh toán</span>
              </div>
              <span className="bg-amber-400/20 text-amber-200 border border-amber-400/40 text-xs font-bold px-3 py-1 rounded-full">
                Chờ thanh toán
              </span>
            </div>

            <div className="text-center">
              <p className="text-white/60 text-sm">Tổng phí gói hội viên</p>
              <p className="text-white text-4xl font-black tracking-tight">
                {fmt(payment.amount)}
              </p>
            </div>

            {payment.expiredAt && (
              <div className="flex items-center justify-center gap-2 mt-4 bg-white/10 rounded-xl py-2.5">
                <Clock className="w-4 h-4 text-white/70" />
                <span className="text-white/70 text-sm">Hết hạn sau:</span>
                <Countdown expiredAt={payment.expiredAt} />
              </div>
            )}
          </div>

          {/* ── Nút thanh toán bằng ví ── */}
          <div className="px-6 pt-6">
             <button
                onClick={handlePayByWallet}
                className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-md"
             >
                <Wallet className="w-5 h-5" />
                Thanh toán ngay bằng Ví
             </button>
             <p className="text-center text-sm text-slate-500 mt-2">
                Số dư hiện tại: <span className="font-bold text-slate-700">{fmt(walletBalance)}</span>
             </p>
             <div className="flex items-center gap-4 my-4">
                <div className="h-px bg-slate-200 flex-1"></div>
                <span className="text-slate-400 text-sm">HOẶC CHUYỂN KHOẢN</span>
                <div className="h-px bg-slate-200 flex-1"></div>
             </div>
          </div>

          {/* ── QR Code area ── */}
          <div className="bg-slate-50 flex flex-col items-center pb-6 px-6">
            <div className="mb-3">
              <QRCanvas data={payment.qrCode} size={220} />
            </div>
            <p className="text-sm text-slate-500 text-center mb-3">
              Mở app ngân hàng → Quét mã → Tự điền số tiền
            </p>
            {payment.checkoutUrl && (
              <button
                onClick={() => window.open(payment.checkoutUrl, '_blank', 'noopener')}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Mở trang thanh toán PayOS
              </button>
            )}
          </div>

          {/* ── Bank transfer info ── */}
          <div className="px-6 pb-4 bg-slate-50">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-3">
              Hoặc chuyển khoản thủ công
            </p>

            <div className="space-y-2">
              {[
                { label: 'Số tài khoản', value: payment.accountNumber, mono: true, large: true },
                { label: 'Tên tài khoản', value: payment.accountName, mono: false },
                { label: 'Số tiền', value: fmt(payment.amount), mono: false, highlight: 'emerald' },
                { label: 'Nội dung CK', value: payment.description, mono: true, highlight: 'amber' },
              ].map(({ label, value, mono, large, highlight }) => (
                <div key={label} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  highlight === 'emerald' ? 'bg-emerald-50 border-emerald-100' :
                  highlight === 'amber' ? 'bg-amber-50 border-amber-100' :
                  'bg-slate-50 border-slate-100'
                }`}>
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className={`font-bold ${large ? 'text-lg' : 'text-sm'} ${mono ? 'font-mono' : ''} ${
                      highlight === 'emerald' ? 'text-emerald-700' :
                      highlight === 'amber' ? 'text-amber-800' :
                      'text-slate-900'
                    }`}>
                      {value || '—'}
                    </p>
                  </div>
                  <CopyButton text={value} />
                </div>
              ))}
            </div>

            {/* Plan info */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs text-slate-500">Gói</p>
                <p className="font-bold text-sm text-slate-900">{payment.planName}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs text-slate-500">Thời hạn</p>
                <p className="font-bold text-sm text-slate-900">{payment.durationMonths} tháng</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs text-slate-500">Giảm</p>
                <p className="font-bold text-sm text-emerald-600">{payment.discountPercent || 0}%</p>
              </div>
            </div>

            {/* Polling indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-500">Đang chờ xác nhận thanh toán...</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
              <div className="bg-indigo-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className={`w-full mt-5 py-4 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                confirming ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl'
              }`}
            >
              {confirming ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang xử lý...
                </>
              ) : (
                'Xác Nhận Đã Thanh Toán'
              )}
            </button>

            {/* Note */}
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-800">Lưu ý thanh toán trước</p>
                <p className="text-xs text-blue-600 mt-1">Phí được tính từ thời điểm mã này hết sẻ hết hạn sau 15 phút. Nhân viên sẽ thu tiền thanh toán lại nếu hết hạn.</p>
              </div>
            </div>
          </div>

          {/* Guide */}
          <div className="mx-6 mb-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <p className="font-bold text-sm text-indigo-800 mb-2">📱 Hướng dẫn thanh toán</p>
              <ol className="list-decimal list-inside text-xs text-indigo-700 space-y-1">
                <li>Mở ứng dụng ngân hàng / ví điện tử</li>
                <li>Chọn Quét QR hoặc Chuyển khoản</li>
                <li>Quét mã QR hoặc nhập thông tin tài khoản</li>
                <li>Kiểm tra số tiền và nội dung chuyển khoản</li>
                <li>Xác nhận thanh toán & bấm "Xác Nhận" ở đây</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">
            Bảo mật bởi <strong>PayOS</strong> · VietQR
          </span>
        </div>
      </div>
    </div>
  );
};

export default DriverSubscriptionPayment;
