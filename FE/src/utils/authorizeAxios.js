// src/utils/authorizeAxios.js
import axios from 'axios'
import { toast } from 'react-toastify'

// ── Instance ──────────────────────────────────────────────────────
const authorizeAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true // ✅ Gửi/nhận httpOnly cookie tự động
})

// ── Refresh-token queue ───────────────────────────────────────────
// Khi đang refresh, các request 401 khác đợi trong hàng này
let isRefreshing = false
let waitingQueue = [] // [{ resolve, reject }]

function flushQueue(error = null) {
  waitingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  )
  waitingQueue = []
}

// ── Request interceptor ───────────────────────────────────────────
// Cookie được gửi tự động nhờ withCredentials — không cần đính header
authorizeAxios.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// ── Response interceptor ──────────────────────────────────────────
authorizeAxios.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config
    const status = error.response?.status
    const code = error.response?.data?.code

    if (!original) return Promise.reject(error)

    // ── 1. Access token hết hạn → thử refresh ────────────────────
    if (status === 401 && code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true

      // Đang refresh rồi → đẩy vào hàng chờ
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          waitingQueue.push({ resolve, reject })
        })
          .then(() => authorizeAxios(original))
          .catch((err) => Promise.reject(err))
      }

      isRefreshing = true

      try {
        // Cookie refreshToken tự gửi kèm nhờ withCredentials
        await authorizeAxios.post('/auth/refresh')

        // Giải phóng hàng chờ; từng request sẽ retry với cookie mới
        flushQueue()
        return authorizeAxios(original)
      } catch (refreshErr) {
        flushQueue(refreshErr)

        // Refresh thất bại → buộc logout toàn app
        window.dispatchEvent(new CustomEvent('auth:logout'))
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại')
        window.location.href = '/login'

        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    // ── 2. 401 không phải TOKEN_EXPIRED (NO_TOKEN, TOKEN_INVALID) ─
    // Không loop: _retry đã set hoặc code khác TOKEN_EXPIRED
    if (status === 401 && code !== 'TOKEN_EXPIRED') {
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }

    // ── 3. Hiển thị toast cho tất cả lỗi khác (4xx/5xx trừ 401) ──
    if (status !== 401) {
      const message =
        error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại'
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default authorizeAxios