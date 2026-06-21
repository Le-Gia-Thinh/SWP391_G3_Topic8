// src/utils/apiError.js
// Dịch lỗi trả về từ BE sang ngôn ngữ hiện tại, dựa trên `code`.
// Dùng chung cho mọi trang để hiển thị toast lỗi song ngữ.
//
// Cách dùng trong component:
//   import { useApiError } from '../../utils/apiError'
//   const apiError = useApiError()
//   ...
//   catch (err) { toast.error(apiError(err)) }
import { useTranslation } from 'react-i18next'

export function useApiError() {
  const { t } = useTranslation()
  return (err) => {
    const code = err?.response?.data?.code
    const beMessage = err?.response?.data?.message
    // 1) Có code + có bản dịch riêng → dùng bản dịch theo ngôn ngữ hiện tại
    if (code) {
      const key = `errors.${code}`
      const translated = t(key)
      if (translated !== key) return translated // i18next trả lại key nếu không tìm thấy
    }
    // 2) Fallback: message tiếng Việt từ BE (luôn có)
    if (beMessage) return beMessage
    // 3) Cuối cùng: câu mặc định theo ngôn ngữ
    return t('errors.DEFAULT')
  }
}