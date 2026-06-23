import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { QrCode, Copy, CheckCircle2, AlertCircle, ArrowLeft, Clock } from 'lucide-react'

const DriverTopUpPayment = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [paymentStatus, setPaymentStatus] = useState('pending') // pending, success

  const amount = location.state?.amount || 100000
  const orderId = `TOPUP_${Math.floor(Date.now() / 1000)}`

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || paymentStatus === 'success') return

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, paymentStatus])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    // You could show a tiny toast here
  }

  const handleSimulatePaymentSuccess = () => {
    setPaymentStatus('success')
    setTimeout(() => {
      navigate('/driver/home')
    }, 3000)
  }

  if (paymentStatus === 'success') {
    return (
      <div className="p-6 max-w-3xl mx-auto min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Thanh toán thành công!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
          Bạn đã nạp thành công <strong>{amount.toLocaleString('vi-VN')} VNĐ</strong> vào tài khoản.
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mã đơn hàng: {orderId}</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full font-medium">
            <Clock className="w-4 h-4" />
            Thời gian còn lại: {formatTime(timeLeft)}
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
              {/* Fake QR Code */}
              <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400">
                <QrCode className="w-24 h-24 mb-2 opacity-50" />
                <span className="text-sm font-medium">Mã QR Thanh Toán</span>
              </div>
            </div>
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
              Sử dụng ứng dụng ngân hàng hoặc ví điện tử để quét mã QR này
            </p>
          </div>

          {/* Payment Details Section */}
          <div className="space-y-6 flex flex-col justify-center">
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-gray-500 dark:text-gray-400">Nhà cung cấp:</span>
                <span className="font-semibold text-gray-900 dark:text-white">Công ty Bãi Đỗ Xe ABC</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-gray-500 dark:text-gray-400">Ngân hàng:</span>
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Vietcombank
                  <button onClick={() => handleCopy('Vietcombank')} className="text-gray-400 hover:text-blue-600"><Copy className="w-4 h-4"/></button>
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-gray-500 dark:text-gray-400">Số tài khoản:</span>
                <span className="font-semibold text-blue-600 flex items-center gap-2">
                  1234567890
                  <button onClick={() => handleCopy('1234567890')} className="text-gray-400 hover:text-blue-600"><Copy className="w-4 h-4"/></button>
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-gray-500 dark:text-gray-400">Nội dung chuyển khoản:</span>
                <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {orderId}
                  <button onClick={() => handleCopy(orderId)} className="text-gray-400 hover:text-blue-600"><Copy className="w-4 h-4"/></button>
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-500 dark:text-gray-400 text-lg">Số tiền cần thanh toán:</span>
                <span className="font-bold text-2xl text-blue-600">
                  {amount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>Hệ thống sẽ tự động cập nhật số dư sau khi nhận được tiền. Vui lòng giữ lại biên lai để đối chiếu nếu cần.</p>
            </div>

            {/* Mock button to simulate webhook success */}
            <button 
              onClick={handleSimulatePaymentSuccess}
              className="w-full py-4 bg-gray-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-md"
            >
              (Giả lập) Đã chuyển khoản thành công
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverTopUpPayment
