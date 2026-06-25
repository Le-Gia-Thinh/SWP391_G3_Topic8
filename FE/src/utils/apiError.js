/**
 * FILE: apiError.js
 * MÔ TẢ: Tiện ích xử lý và dịch thông báo lỗi trả về từ API backend.
 * Tích hợp i18next để đa ngôn ngữ hóa thông báo lỗi dựa trên error code.
 */

// src/utils/apiError.js
//
// Hai cách dùng:
//
// 1. Trong COMPONENT (React) — dùng hook:
//      import { useApiError } from '../../utils/apiError'
//      const apiError = useApiError()
//      catch (err) { toast.error(apiError(err)) }
//
// 2. Trong INTERCEPTOR / file ngoài React — dùng hàm thường:
//      import { translateError } from '../../utils/apiError'
//      toast.error(translateError(err))

import i18next from 'i18next'
import { useTranslation } from 'react-i18next'

// ── Core logic (không phụ thuộc hook) ────────────────────────────
// Dùng được cả trong interceptor lẫn component.
export function translateError(err) {
  const code = err?.response?.data?.code
  const beMessage = err?.response?.data?.message

  // 1) Có error code → tìm bản dịch trong errors.*
  if (code) {
    const key = `errors.${code}`
    const translated = i18next.t(key)
    // i18next trả lại key nguyên nếu không tìm thấy → bỏ qua
    if (translated !== key) return translated
  }

  // 2) Fallback: message từ BE (luôn là tiếng Việt)
  if (beMessage) return beMessage

  // 3) Cuối cùng: câu mặc định theo ngôn ngữ hiện tại
  return i18next.t('errors.DEFAULT')
}

// ── Hook dùng trong React component ──────────────────────────────
// Bọc translateError trong hook để component tự re-render khi đổi ngôn ngữ.
export function useApiError() {
  // eslint-disable-next-line no-unused-vars
  const { i18n } = useTranslation() // subscribe language change
  return translateError
}