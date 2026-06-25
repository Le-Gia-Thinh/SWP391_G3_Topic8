/**
 * FILE: DriverTopUp.jsx
 * MÔ TẢ: Trang Nạp tiền vào Ví dành cho Driver.
 * Cung cấp giao diện để tài xế chọn các mệnh giá nạp tiền có sẵn hoặc nhập số tiền tùy ý.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, CreditCard, ArrowRight, CheckCircle2, History, Banknote, ShieldCheck } from 'lucide-react'
import { driverApi } from '../../apis/driverApi'

const predefinedAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000]

const DriverTopUp = () => {
  const [selectedAmount, setSelectedAmount] = useState(100000)
  const [customAmount, setCustomAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [balance, setBalance] = useState(0)
  const navigate = useNavigate()

  // Fetch current balance
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await driverApi.getProfile()
        if (res.success && res.data) {
          setBalance(res.data.AccountBalance || 0)
        }
      } catch (error) {
        console.error('Failed to fetch profile', error)
      }
    }
    fetchProfile()
  }, [])

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (e) => {
    const val = e.target.value.replace(/\D/g, '')
    setCustomAmount(val)
    setSelectedAmount(null)
  }

  const handleTopUp = () => {
    const amountToTopUp = customAmount ? parseInt(customAmount, 10) : selectedAmount
    if (!amountToTopUp || amountToTopUp < 10000) {
      alert('Số tiền nạp tối thiểu là 10,000 VNĐ')
      return
    }

    navigate('/driver/topup-payment', { state: { amount: amountToTopUp } })
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-600" />
            Nạp tiền tài khoản
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Nạp tiền vào ví để dễ dàng thanh toán phí đỗ xe và các dịch vụ khác.
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg shadow-blue-500/30 text-white min-w-[280px]">
          <p className="text-blue-100 font-medium mb-1">Số dư hiện tại</p>
          <div className="text-3xl font-bold flex items-baseline gap-1">
            {balance.toLocaleString('vi-VN')} <span className="text-lg font-normal">VNĐ</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Top Up Form */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Banknote className="w-5 h-5 text-green-500" />
            Chọn mệnh giá nạp
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {predefinedAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleAmountSelect(amount)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2
                  ${selectedAmount === amount 
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-bold transform scale-[1.02] shadow-sm' 
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              >
                <span className="text-lg">{amount.toLocaleString('vi-VN')} đ</span>
              </button>
            ))}
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hoặc nhập số tiền khác (VNĐ)
            </label>
            <div className="relative">
              <input
                type="text"
                value={customAmount ? Number(customAmount).toLocaleString('vi-VN') : ''}
                onChange={handleCustomAmountChange}
                placeholder="Nhập số tiền..."
                className="w-full pl-4 pr-12 py-4 text-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all dark:text-white"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">VNĐ</span>
            </div>
            {customAmount && parseInt(customAmount, 10) < 10000 && (
              <p className="text-red-500 text-sm mt-2">Số tiền nạp tối thiểu là 10,000 VNĐ</p>
            )}
          </div>

          <button
            onClick={handleTopUp}
            disabled={isProcessing || success || (!selectedAmount && !customAmount)}
            className={`w-full py-4 px-6 rounded-xl text-lg font-bold text-white transition-all flex items-center justify-center gap-2
              ${success ? 'bg-green-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg'}
              ${isProcessing ? 'opacity-80 cursor-wait' : ''}
              ${(!selectedAmount && !customAmount) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : success ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                Nạp tiền thành công!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Tiến hành thanh toán <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </button>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>Giao dịch được mã hóa và bảo mật an toàn 100%</span>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5" />
              Phương thức hỗ trợ
            </h3>
            <ul className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" /> Thẻ nội địa (ATM)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" /> Thẻ quốc tế (Visa/Mastercard)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" /> Ví điện tử (Momo, ZaloPay)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" /> Chuyển khoản ngân hàng (VietQR)
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-500" />
              Lịch sử nạp gần đây
            </h3>
            <div className="text-center text-gray-500 py-6 text-sm">
              Chưa có giao dịch nạp tiền nào gần đây.
            </div>
            <button className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium mt-2">
              Xem tất cả lịch sử giao dịch →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverTopUp
