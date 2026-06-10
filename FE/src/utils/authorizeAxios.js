// src/utils/authorizeAxios.js
import axios from 'axios'
import { toast } from 'react-toastify'

// ── Instance ──────────────────────────────────────────────────────
// Project dùng httpOnly cookie:
// - accessToken / refreshToken nằm trong cookie
// - FE không đọc token bằng JS
// - browser tự gửi cookie nhờ withCredentials: true
const authorizeAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true
})

// ── CÁCH ĐANG DÙNG TRONG PROJECT: isRefreshing + waitingQueue ─────
// Mục tiêu:
// Nếu nhiều request cùng bị TOKEN_EXPIRED,
// chỉ request đầu tiên gọi /auth/refresh.
// Các request sau chờ refresh xong rồi retry lại.
let isRefreshing = false
let waitingQueue = [] // [{ resolve, reject }]

function flushQueue(error = null) {
  waitingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  )
  waitingQueue = []
}

// ── Request interceptor ───────────────────────────────────────────
authorizeAxios.interceptors.request.use(
  (config) => {
    console.log(`🚀 [REQUEST] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ──────────────────────────────────────────
authorizeAxios.interceptors.response.use(
  (response) => {
    console.log(`✅ [RESPONSE] ${response.config.url} →`, response.status)
    return response
  },

  async (error) => {
    const original = error.config
    const status = error.response?.status
    const code = error.response?.data?.code

    console.log(`❌ [ERROR] ${original?.url} → ${status} | code: ${code}`)

    if (!original) return Promise.reject(error)

    // Access token hết hạn:
    // BE trả 401 + code TOKEN_EXPIRED.
    // Khi đó mới gọi /auth/refresh.
    if (status === 401 && code === 'TOKEN_EXPIRED' && !original._retry) {
      console.log('🔄 [REFRESH] Access token hết hạn, đang refresh...')
      original._retry = true

      // Nếu đang refresh rồi, request này không gọi refresh nữa.
      // Nó được đưa vào hàng chờ.
      if (isRefreshing) {
        console.log('⏳ [REFRESH] Đang chờ refresh hoàn tất...')

        return new Promise((resolve, reject) => {
          waitingQueue.push({ resolve, reject })
        })
          .then(() => authorizeAxios(original))
          .catch((err) => Promise.reject(err))
      }

      isRefreshing = true

      try {
        // Với httpOnly cookie:
        // Không cần truyền refreshToken trong body.
        // Browser tự gửi refreshToken cookie lên BE.
        // BE sẽ set lại accessToken cookie mới.
        await authorizeAxios.post('/auth/refresh')

        console.log('✅ [REFRESH] Refresh token thành công!')

        flushQueue()
        return authorizeAxios(original)
      } catch (refreshErr) {
        console.log('❌ [REFRESH] Refresh token thất bại → logout')

        flushQueue(refreshErr)

        window.dispatchEvent(new CustomEvent('auth:logout'))
        window.dispatchEvent(new CustomEvent('auth:loading-done'))
        window.location.href = '/login'

        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    // 401 nhưng không phải TOKEN_EXPIRED:
    // NO_TOKEN, TOKEN_INVALID... thì không refresh.
    if (status === 401 && code !== 'TOKEN_EXPIRED') {
      window.dispatchEvent(new CustomEvent('auth:logout'))
      window.dispatchEvent(new CustomEvent('auth:loading-done'))
    }

    // Không toast cho lỗi 401 ở interceptor.
    // Login sai nên toast ở AdminLogin.jsx catch để tránh /auth/me tự báo lỗi khi app init.
    const isRefreshRequest = original?.url?.includes('/auth/refresh')

    if (status !== 401 && !isRefreshRequest) {
      const message =
        error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại'
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default authorizeAxios

// =================================================================
// CÁCH TRONG VIDEO - CHỈ COMMENT ĐỂ HỌC THÊM, KHÔNG CHẠY
// =================================================================
//
// Ý tưởng của video là dùng 1 biến refreshTokenPromise.
//
// Thay vì tự tạo waitingQueue như cách trên,
// ta lưu request /auth/refresh vào refreshTokenPromise.
// Nếu request khác cũng bị TOKEN_EXPIRED trong lúc refresh đang chạy,
// nó không gọi refresh lần nữa mà chờ chung refreshTokenPromise.
//
// Với project dùng httpOnly cookie, cách video vẫn dùng được,
// nhưng cần hiểu khác một chút:
//
// - Không lấy refreshToken từ localStorage.
// - Không set accessToken vào localStorage.
// - Không cần gắn Authorization: Bearer.
// - Chỉ gọi authorizeAxios.post('/auth/refresh').
// - Browser tự gửi refreshToken cookie nhờ withCredentials: true.
// - BE tự set lại accessToken cookie mới.
//
// Code minh họa:
//
// let refreshTokenPromise = null
//
// authorizeAxios.interceptors.response.use(
//   (response) => response,
//
//   async (error) => {
//     const original = error.config
//     const status = error.response?.status
//     const code = error.response?.data?.code
//
//     if (!original) return Promise.reject(error)
//
//     if (status === 401 && code === 'TOKEN_EXPIRED' && !original._retry) {
//       original._retry = true
//
//       if (!refreshTokenPromise) {
//         // Request đầu tiên tạo refresh promise.
//         refreshTokenPromise = authorizeAxios.post('/auth/refresh')
//           .then((res) => {
//             console.log('✅ [VIDEO STYLE] Refresh thành công')
//             return res
//           })
//           .catch((err) => {
//             console.log('❌ [VIDEO STYLE] Refresh thất bại')
//
//             window.dispatchEvent(new CustomEvent('auth:logout'))
//             window.dispatchEvent(new CustomEvent('auth:loading-done'))
//             window.location.href = '/login'
//
//             return Promise.reject(err)
//           })
//           .finally(() => {
//             // Sau khi refresh xong, reset lại để lần sau token hết hạn
//             // có thể tạo refresh promise mới.
//             refreshTokenPromise = null
//           })
//       }
//
//       // Request đầu tiên và các request chờ đều đi vào đây.
//       // Sau khi refreshTokenPromise resolve, retry lại request ban đầu.
//       return refreshTokenPromise.then(() => {
//         return authorizeAxios(original)
//       })
//     }
//
//     return Promise.reject(error)
//   }
// )
//
// So sánh nhanh:
// - Cách hiện tại: isRefreshing + waitingQueue, dễ thấy rõ hàng chờ.
// - Cách video: refreshTokenPromise, gọn hơn.
// - Cả hai đều có mục tiêu giống nhau:
//   nhiều request TOKEN_EXPIRED cùng lúc → chỉ gọi /auth/refresh 1 lần.