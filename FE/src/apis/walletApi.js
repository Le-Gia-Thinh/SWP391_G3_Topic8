/**
 * FILE: walletApi.js
 * MÔ TẢ: Tập hợp API xử lý Ví điện tử (Wallet).
 * Hỗ trợ nạp tiền, kiểm tra số dư, xem lịch sử giao dịch và thanh toán trực tiếp.
 */

import authorizeAxios from '../utils/authorizeAxios'

const unwrap = (response) => response.data

export const walletApi = {
  // Tạo link nạp tiền PayOS
  createTopup: async (amount) => {
    const res = await authorizeAxios.post('/driver/wallet/create-topup', { amount })
    return unwrap(res)
  },

  // Polling trạng thái nạp tiền
  checkTopupStatus: async (orderCode) => {
    const res = await authorizeAxios.get(`/driver/wallet/status/${orderCode}`)
    return unwrap(res)
  },

  // Lấy số dư ví
  getBalance: async () => {
    const res = await authorizeAxios.get('/driver/wallet/balance')
    return unwrap(res)
  },

  // Lịch sử giao dịch
  getHistory: async (limit = 20) => {
    const res = await authorizeAxios.get('/driver/wallet/history', { params: { limit } })
    return unwrap(res)
  },

  // Thanh toán đỗ xe bằng ví
  payParking: async (sessionId) => {
    const res = await authorizeAxios.post('/driver/wallet/pay-parking', { sessionId })
    return unwrap(res)
  },

  // Mua gói hội viên bằng ví
  paySubscription: async (planId, durationMonths) => {
    const res = await authorizeAxios.post('/driver/wallet/pay-subscription', { planId, durationMonths })
    return unwrap(res)
  },
}

export default walletApi
