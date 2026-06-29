/**
 * FILE: StaffSupport.jsx
 * MÔ TẢ: Trang Hỗ trợ (Support) dành cho nhân viên.
 * Cung cấp thông tin liên hệ khẩn cấp (Hotline), liên kết tài liệu hướng dẫn sử dụng,
 * và các câu hỏi thường gặp (FAQ) liên quan đến nghiệp vụ Staff.
 */

import { useTranslation } from 'react-i18next'
import { Headphones, AlertTriangle, BookOpen, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const StaffSupport = () => {
  const { t } = useTranslation()
  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <Link to="/staff/dashboard" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
          <ChevronLeft size={20} />
        </Link>
        <Headphones className="text-blue-600" size={24} />
        <h1 className="text-2xl font-bold text-slate-900">{t('staff.support.title')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-start gap-4 hover:border-blue-300 transition">
          <div className="p-3 bg-red-50 text-red-600 rounded-3xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('staff.support.urgentTitle')}</h3>
            <p className="text-sm text-slate-500 mt-1">{t('staff.support.urgentDesc')}</p>
          </div>
          <a href="tel:0909999999" className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white shadow-md shadow-red-500/20 hover:shadow-red-500/40 rounded-xl text-sm font-bold hover:bg-red-700 transition">
            {t('staff.support.hotlineBtn')}
          </a>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-start gap-4 hover:border-blue-300 transition">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-3xl">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('staff.support.docsTitle')}</h3>
            <p className="text-sm text-slate-500 mt-1">{t('staff.support.docsDesc')}</p>
          </div>
          <Link to="/staff/user-guide" className="mt-auto inline-flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition border border-blue-100">
            {t('staff.support.guideBtn')}
          </Link>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <h3 className="font-bold text-slate-900 mb-4">{t('staff.support.faqTitle')}</h3>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-50">
            <p className="font-semibold text-slate-800 text-sm mb-1">{t('staff.support.faq1Q')}</p>
            <p className="text-sm text-slate-600">{t('staff.support.faq1A')}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-50">
            <p className="font-semibold text-slate-800 text-sm mb-1">{t('staff.support.faq2Q')}</p>
            <p className="text-sm text-slate-600">{t('staff.support.faq2A')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffSupport