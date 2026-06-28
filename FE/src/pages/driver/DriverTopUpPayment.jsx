/**
 * FILE: DriverTopUpPayment.jsx
 * MÔ TẢ: Trang Thanh toán Nạp tiền Ví dành cho Driver.
 * Gọi API PayOS để tạo mã QR nạp tiền và liên tục kiểm tra (polling) trạng thái thanh toán.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { QrCode, Copy, CheckCircle2, AlertCircle, ArrowLeft, Clock, XCircle, Loader2 } from 'lucide-react'
import walletApi from '../../apis/walletApi'

// ── QR Canvas ───────────────
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
    <div className="flex items-center justify-center bg-slate-100 rounded-xl p-4 text-sm text-slate-500 font-medium text-center" style={{ width: size, height: size }}>
      Không thể tạo mã QR.<br />Vui lòng thử lại.
    </div>
  );
  return (
    <div className="rounded-xl overflow-hidden shadow-md bg-white border border-slate-100 p-1.5 inline-block">
      <canvas ref={canvasRef} className="block"></canvas>
    </div>
  );
};

const DriverTopUpPayment = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  const amount = location.state?.amount || 100000

  // Tạo link thanh toán
  useEffect(() => {
    if (statusParam) {
       // Xử lý callback từ PayOS
       setLoading(false)
       if (statusParam === 'success') {
          // Giao diện sẽ tự động polling và chuyển trạng thái
       } else {
          setError('Thanh toán đã bị huỷ')
       }
       return
    }

    const initPayment = async () => {
      try {
        setLoading(true)
        const res = await walletApi.createTopup(amount)
        if (res.success) {
          setPayment(res.data)
          const expiresAt = new Date(res.data.expiredAt).getTime()
          const diff = Math.floor((expiresAt - Date.now()) / 1000)
          setTimeLeft(diff > 0 ? diff : 600)
        } else {
          setError(res.message || 'Lỗi tạo thanh toán')
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message)
      } finally {
        setLoading(false)
      }
    }

    if (!payment && !error) {
       initPayment()
    }
  }, [amount, payment, error, statusParam])

  // Polling check status
  useEffect(() => {
    if (!payment || payment.status === 'PAID') return
    if (timeLeft <= 0) return

    const timer = setInterval(async () => {
      setTimeLeft((prev) => prev - 1)
      
      // Mỗi 3s gọi API check 1 lần
      if (timeLeft % 3 === 0) {
        try {
           const res = await walletApi.checkTopupStatus(payment.orderCode)
           if (res.success && res.data.status === 'PAID') {
              setPayment(prev => ({ ...prev, status: 'PAID' }))
              setTimeout(() => navigate('/driver/home'), 3000)
           } else if (res.success && (res.data.status === 'CANCELLED' || res.data.status === 'EXPIRED')) {
              setError('Thanh toán đã bị huỷ hoặc hết hạn')
           }
        } catch (e) {
           console.error('Polling error', e)
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, payment, navigate])

  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (loading) {
     return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4">
           <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
           <p className="text-slate-500 font-medium">Đang khởi tạo thanh toán...</p>
        </div>
     )
  }

  if (error) {
     return (
        <div className="min-h-screen bg-slate-50 pt-10 pb-12 px-4 flex flex-col items-center justify-center text-center">
            <XCircle className="w-20 h-20 text-red-500 mb-4 drop-shadow-md" />
            <h2 className="text-2xl font-black text-slate-800 mb-2">Đã xảy ra lỗi</h2>
            <p className="text-slate-500 font-medium mb-8 max-w-sm">{error}</p>
            <button onClick={() => navigate(-1)} className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-colors">
              Quay lại
            </button>
        </div>
     )
  }

  if (payment?.status === 'PAID') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <CheckCircle2 size={56} className="text-green-500" />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">
          Nạp tiền thành công!
        </h2>
        <p className="text-slate-600 mb-8 text-lg font-medium">
          Bạn đã nạp thành công <strong className="text-green-600 text-xl">{payment.amount.toLocaleString('vi-VN')} VNĐ</strong> vào tài khoản ví.
        </p>
        <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full border border-slate-200 shadow-sm">
          <Loader2 size={16} className="animate-spin text-slate-400" />
          <span className="text-sm font-bold text-slate-500">Đang tự động chuyển hướng về trang chủ...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-6 pb-12 px-4 font-sans animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Quay lại
        </button>

        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 md:px-8 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Thanh toán nạp tiền ví</h1>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Mã đơn hàng: <span className="text-slate-600">{payment?.orderCode}</span></p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border ${timeLeft < 120 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              <Clock size={16} className={timeLeft < 120 ? 'animate-pulse' : ''} />
              Thời gian còn lại: <span className="font-mono text-base">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center">
                <QRCanvas data={payment?.qrCode} size={256} />
              </div>
              <p className="text-sm font-medium text-center text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã QR này
              </p>
            </div>

            {/* Payment Details Section */}
            <div className="flex flex-col justify-center space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                {[
                  { label: 'Ngân hàng', value: payment?.bankBin, field: 'bank' },
                  { label: 'Số tài khoản', value: payment?.accountNumber, field: 'account', highlight: true },
                  { label: 'Tên tài khoản', value: payment?.accountName, field: 'name' },
                  { label: 'Nội dung CK', value: payment?.description, field: 'desc', highlight: true }
                ].map(({ label, value, field, highlight }) => (
                  <div key={field} className="flex justify-between items-center pb-4 border-b border-slate-200/60 last:border-0 last:pb-0">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${highlight ? 'text-blue-600 font-mono text-base' : 'text-slate-800'}`}>
                        {value}
                      </span>
                      {value && field !== 'name' && field !== 'bank' && (
                        <button 
                          onClick={() => handleCopy(value, field)} 
                          className={`p-1.5 rounded-lg transition-colors relative group ${copiedField === field ? 'bg-green-100 text-green-600' : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        >
                          {copiedField === field ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                            {copiedField === field ? 'Đã copy' : 'Copy'}
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-200/60">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">Số tiền thanh toán</span>
                  <span className="font-black text-2xl text-blue-600">
                    {payment?.amount?.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 text-blue-800 rounded-2xl border border-blue-100 text-sm">
                <AlertCircle size={20} className="shrink-0 mt-0.5 text-blue-500" />
                <p className="font-medium text-xs leading-relaxed">
                  Hệ thống sẽ tự động cập nhật số dư sau khi nhận được tiền. Vui lòng giữ lại biên lai để đối chiếu nếu cần.
                </p>
              </div>
              
              <a 
                href={payment?.checkoutUrl} 
                target="_blank" 
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98]"
              >
                Mở link thanh toán PayOS <ExternalLinkIcon size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Dummy component for ExternalLinkIcon if not imported
const ExternalLinkIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
)

export default DriverTopUpPayment
