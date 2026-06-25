/**
 * FILE: DriverTerms.jsx
 * MÔ TẢ: Trang Điều khoản Sử dụng dành cho Driver.
 * Hiển thị các điều khoản chung, quyền và trách nhiệm của tài xế khi sử dụng hệ thống.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const DriverTerms = () => {
  const { t } = useTranslation()
  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto space-y-6 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700/50 pb-4">
        <Link to="/driver/home" className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition">
          <ChevronLeft size={20} />
        </Link>
        <FileText className="text-blue-500" size={24} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('driver.helpPage.terms.title')}</h1>
      </div>

      <div className="prose prose-sm prose-blue max-w-none text-gray-600 dark:text-gray-400 leading-relaxed space-y-4">
        <p className="font-semibold text-gray-800 dark:text-gray-200">{t('driver.helpPage.terms.lastUpdated')}</p>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">{t('driver.helpPage.terms.section1Title')}</h3>
        <p>{t('driver.helpPage.terms.section1Body')}</p>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">{t('driver.helpPage.terms.section2Title')}</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>{t('driver.helpPage.terms.section2Item1')}</li>
          <li>{t('driver.helpPage.terms.section2Item2')}</li>
          <li>{t('driver.helpPage.terms.section2Item3')}</li>
        </ul>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">{t('driver.helpPage.terms.section3Title')}</h3>
        <p>{t('driver.helpPage.terms.section3Body')}</p>
      </div>
    </div>
  )
}

export default DriverTerms