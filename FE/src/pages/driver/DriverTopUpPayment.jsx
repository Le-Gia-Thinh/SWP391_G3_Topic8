import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { QrCode, Copy, CheckCircle2, AlertCircle, ArrowLeft, Clock, XCircle } from 'lucide-react'
import { CircularProgress, Box } from '@mui/material'
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

const DriverTopUpPayment = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const statusParam = searchParams.get('status')
  
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
  }

  if (loading) {
     return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
           <CircularProgress />
        </Box>
     )
  }

  if (error) {
     return (
        <div className="p-6 max-w-3xl mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Quay lại</button>
        </div>
     )
  }

  if (payment?.status === 'PAID') {
    return (
      <div className="p-6 max-w-3xl mx-auto min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Nạp tiền thành công!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
          Bạn đã nạp thành công <strong>{payment.amount.toLocaleString('vi-VN')} VNĐ</strong> vào tài khoản.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Đang tự động chuyển hướng về trang chủ...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" /> Quay lại
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Thanh toán nạp tiền ví</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mã đơn hàng: {payment?.orderCode}</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full font-medium">
            <Clock className="w-4 h-4" />
            Thời gian còn lại: {formatTime(timeLeft)}
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex flex-col items-center">
              <QRCanvas data={payment?.qrCode} size={256} />
            </div>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã QR này
            </p>
          </div>

          {/* Payment Details Section */}
          <div className="space-y-6 flex flex-col justify-center">
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-gray-500 dark:text-gray-400">Ngân hàng:</span>
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {payment?.bankBin}
                  <button onClick={() => handleCopy(payment?.bankBin)} className="text-gray-400 hover:text-blue-600"><Copy className="w-4 h-4"/></button>
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-gray-500 dark:text-gray-400">Số tài khoản:</span>
                <span className="font-semibold text-blue-600 flex items-center gap-2">
                  {payment?.accountNumber}
                  <button onClick={() => handleCopy(payment?.accountNumber)} className="text-gray-400 hover:text-blue-600"><Copy className="w-4 h-4"/></button>
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-gray-500 dark:text-gray-400">Tên tài khoản:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {payment?.accountName}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-gray-500 dark:text-gray-400">Nội dung chuyển khoản:</span>
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {payment?.description}
                  <button onClick={() => handleCopy(payment?.description)} className="text-gray-400 hover:text-blue-600"><Copy className="w-4 h-4"/></button>
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-500 dark:text-gray-400 text-lg">Số tiền cần thanh toán:</span>
                <span className="font-bold text-2xl text-blue-600">
                  {payment?.amount?.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>Hệ thống sẽ tự động cập nhật số dư sau khi nhận được tiền. Vui lòng giữ lại biên lai để đối chiếu nếu cần.</p>
            </div>
            
            <a 
              href={payment?.checkoutUrl} 
              target="_blank" 
              rel="noreferrer"
              className="w-full text-center block py-4 bg-gray-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-md"
            >
              Mở link thanh toán PayOS
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverTopUpPayment

