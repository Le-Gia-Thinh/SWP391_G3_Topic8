/**
 * FILE: LanguageSwitcher.jsx
 * MÔ TẢ: Nút chuyển đổi ngôn ngữ (Việt ⇄ Anh) nằm trên thanh Navbar hoặc Header.
 * Gọi trực tiếp API thay đổi ngôn ngữ của i18next khi người dùng tương tác.
 */

// src/components/ui/LanguageSwitcher.jsx
// Nút chuyển nhanh Việt ⇄ Anh. Đặt ở header/topbar.
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()
  const current = i18n.language?.startsWith('en') ? 'en' : 'vi'

  const toggle = () => i18n.changeLanguage(current === 'vi' ? 'en' : 'vi')

  return (
    <button
      onClick={toggle}
      title={current === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
    >
      <Languages size={15} />
      {/* Hiện ngôn ngữ ĐANG dùng, gọn gàng */}
      <span>{current === 'vi' ? 'VI' : 'EN'}</span>
    </button>
  )
}

export default LanguageSwitcher