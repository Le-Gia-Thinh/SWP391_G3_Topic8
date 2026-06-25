/**
 * FILE: guestApi.js
 * MÔ TẢ: Tập hợp các API dành cho Khách vãng lai (Guest).
 * Bao gồm: Tra cứu phiên gửi xe thông qua biển số và lấy số liệu thống kê hiển thị trang chủ.
 */

import authorizedAxiosInstance from '../utils/authorizeAxios'

const guestApi = {
  trackSession: async (searchTerm) => {
    const res = await authorizedAxiosInstance.get('/guest/track-session', {
      params: { searchTerm }
    })
    return res.data
  },
  getHomeStats: async () => {
    const res = await authorizedAxiosInstance.get('/guest/home-stats')
    return res.data
  }
}

export default guestApi
