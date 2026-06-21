// src/i18n/index.js
// Khởi tạo react-i18next. Import file này MỘT LẦN ở main.jsx (trước khi render App).
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import vi from './locales/vi.json'
import en from './locales/en.json'

// Lấy ngôn ngữ đã lưu, mặc định tiếng Việt
const saved = localStorage.getItem('lang') || 'vi'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en }
    },
    lng: saved,
    fallbackLng: 'vi', // thiếu key tiếng Anh → fallback tiếng Việt
    interpolation: {
      escapeValue: false // React đã tự chống XSS
    }
  })

// Đồng bộ thuộc tính lang của <html> + lưu localStorage mỗi khi đổi
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('lang', lng)
  document.documentElement.setAttribute('lang', lng)
})
document.documentElement.setAttribute('lang', saved)

export default i18n