/**
 * FILE: subscriptionApi.js
 * MÔ TẢ: Tập hợp API xử lý đăng ký Gói hội viên (Subscriptions).
 * Lấy danh sách gói, kiểm tra trạng thái và thanh toán qua PayOS/Ví.
 */

import authorizeAxios from '../utils/authorizeAxios'

const unwrap = (response) => response.data

export const subscriptionApi = {
  getPlans: async () => {
    const res = await authorizeAxios.get('/driver/subscriptions/plans')
    return unwrap(res)
  },

  getMyStatus: async () => {
    const res = await authorizeAxios.get('/driver/subscriptions/my-status')
    return unwrap(res)
  },

  checkStatus: async (orderCode) => {
    const res = await authorizeAxios.get(`/driver/subscriptions/status/${orderCode}`)
    return unwrap(res)
  },

  // Tạo link thanh toán PayOS (trả về qrCode, accountNumber, v.v.)
  createPayment: async (payload) => {
    const res = await authorizeAxios.post('/driver/subscriptions/create-payment', payload)
    return unwrap(res)
  },

  // Xác nhận đã thanh toán → ghi DB
  subscribe: async (payload) => {
    const res = await authorizeAxios.post('/driver/subscriptions/pay', payload)
    return unwrap(res)
  }
}
