/**
 * FILE: StaffUserGuide.jsx
 * MÔ TẢ: Trang Tài liệu Hướng dẫn Sử dụng (User Guide) dành cho Staff.
 * Hiển thị các quy trình thao tác cơ bản như Check-in, Check-out, xử lý sự cố.
 */

import { BookOpen, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'

const StaffUserGuide = () => {
  const { t } = useTranslation()

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-4">
        <Link to="/staff/support" className="p-2 -ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <ChevronLeft size={20} />
        </Link>
        <BookOpen className="text-emerald-600 dark:text-emerald-500" size={24} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('staff.userGuide.title')}</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 prose prose-blue dark:prose-invert max-w-none">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('staff.userGuide.section1Title')}</h3>
        <p className="dark:text-gray-300">{t('staff.userGuide.section1Body')}</p>
        <ul className="dark:text-gray-300">
          <li><Trans i18nKey="staff.userGuide.section1Item1" components={{ strong: <strong className="dark:text-gray-100" /> }} /></li>
          <li>{t('staff.userGuide.section1Item2')}</li>
          <li><Trans i18nKey="staff.userGuide.section1Item3" components={{ strong: <strong className="dark:text-gray-100" /> }} /></li>
        </ul>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8">{t('staff.userGuide.section2Title')}</h3>
        <p className="dark:text-gray-300">{t('staff.userGuide.section2Body')}</p>
        <ul className="dark:text-gray-300">
          <li><Trans i18nKey="staff.userGuide.section2Item1" components={{ strong: <strong className="dark:text-gray-100" /> }} /></li>
          <li>{t('staff.userGuide.section2Item2')}</li>
          <li>{t('staff.userGuide.section2Item3')}</li>
        </ul>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8">{t('staff.userGuide.section3Title')}</h3>
        <p className="dark:text-gray-300">{t('staff.userGuide.section3Body')}</p>
        <ul className="dark:text-gray-300">
          <li>{t('staff.userGuide.section3Item1')}</li>
          <li>{t('staff.userGuide.section3Item2')}</li>
          <li>{t('staff.userGuide.section3Item3')}</li>
          <li><Trans i18nKey="staff.userGuide.section3Item4" components={{ strong: <strong className="dark:text-gray-100" /> }} /></li>
        </ul>
      </div>
    </div>
  )
}

export default StaffUserGuide