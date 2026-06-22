import React from 'react'
import { ShieldAlert, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const DriverPrivacy = () => {
  const { t } = useTranslation()
  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto space-y-6 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700/50 shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700/50 pb-4">
        <Link to="/driver/home" className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition">
          <ChevronLeft size={20} />
        </Link>
        <ShieldAlert className="text-emerald-500" size={24} />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('driver.helpPage.privacy.title')}</h1>
      </div>

      <div className="prose prose-sm prose-emerald max-w-none text-gray-600 dark:text-gray-400 leading-relaxed space-y-4">
        <p className="font-semibold text-gray-800 dark:text-gray-200">{t('driver.helpPage.privacy.lastUpdated')}</p>

        <p>{t('driver.helpPage.privacy.intro')}</p>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">{t('driver.helpPage.privacy.section1Title')}</h3>
        <p>{t('driver.helpPage.privacy.section1Intro')}</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>{t('driver.helpPage.privacy.section1Item1')}</li>
          <li>{t('driver.helpPage.privacy.section1Item2')}</li>
          <li>{t('driver.helpPage.privacy.section1Item3')}</li>
        </ul>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">{t('driver.helpPage.privacy.section2Title')}</h3>
        <p>{t('driver.helpPage.privacy.section2Body')}</p>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6">{t('driver.helpPage.privacy.section3Title')}</h3>
        <p>{t('driver.helpPage.privacy.section3Body')}</p>
      </div>
    </div>
  )
}

export default DriverPrivacy