import React, { useState } from 'react'
import { LifeBuoy, Phone, Mail, MessageSquare, ChevronRight, FileText, ShieldAlert, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const DriverHelp = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('support')

  const HELP_TABS = [
    { id: 'support', label: t('driver.helpPage.tabs.support'), icon: HelpCircle },
    { id: 'terms', label: t('driver.helpPage.tabs.terms'), icon: FileText },
    { id: 'privacy', label: t('driver.helpPage.tabs.privacy'), icon: ShieldAlert }
  ]

  const FAQs = t('driver.helpPage.support.faqs', { returnObjects: true })

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('driver.helpPage.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('driver.helpPage.subtitle')}</p>
      </section>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col space-y-1">
            {HELP_TABS.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all text-left ${active ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:bg-blue-900/20 hover:text-blue-600 dark:text-blue-400'}`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {active && <ChevronRight size={16} className="ml-auto opacity-70" />}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-6 md:p-8 shadow-sm min-h-[600px]">
          {activeTab === 'support' && (
            <div className="space-y-8 animate-in fade-in">
              <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6 flex flex-col items-center text-center transition hover:bg-blue-50/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:text-blue-400 mb-4">
                    <Phone size={24} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t('driver.helpPage.support.hotlineTitle')}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('driver.helpPage.support.hotlineDesc')}</p>
                  <a href="tel:19001234" className="text-lg font-black text-blue-600 dark:text-blue-400">1900 1234</a>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-6 flex flex-col items-center text-center transition hover:bg-indigo-50/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
                    <Mail size={24} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t('driver.helpPage.support.emailTitle')}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('driver.helpPage.support.emailDesc')}</p>
                  <a href="mailto:support@smartpark.vn" className="text-sm font-bold text-indigo-600 break-all">support@smartpark.vn</a>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 flex flex-col items-center text-center transition hover:bg-emerald-50/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
                    <MessageSquare size={24} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t('driver.helpPage.support.chatTitle')}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('driver.helpPage.support.chatDesc')}</p>
                  <button
                    onClick={() => { window.location.href = '/driver/support' }}
                    className="rounded-xl bg-emerald-600 text-white px-6 py-2 text-sm font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition dark:shadow-none"
                  >
                    {t('driver.helpPage.support.chatButton')}
                  </button>
                </div>
              </section>

              <section>
                <div className="mb-6 flex items-center gap-3">
                  <LifeBuoy className="text-blue-500" size={24} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('driver.helpPage.support.faqTitle')}</h2>
                </div>

                <div className="space-y-4">
                  {Array.isArray(FAQs) && FAQs.map((faq, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-100 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-900/50 p-5 transition hover:border-blue-100 hover:bg-blue-50/30">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex justify-between items-center">
                        {faq.q}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                <FileText className="text-blue-500" size={24} />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('driver.helpPage.terms.title')}</h2>
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
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700/50 pb-4">
                <ShieldAlert className="text-emerald-500" size={24} />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('driver.helpPage.privacy.title')}</h2>
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
          )}
        </main>
      </div>
    </div>
  )
}

export default DriverHelp