/**
 * FILE: Footer.jsx
 * MÔ TẢ: Component Footer (chân trang) dành cho các trang giao diện khách (Guest/Home).
 * Hiển thị thông tin liên hệ, liên kết hỗ trợ, mạng xã hội và đăng ký nhận bản tin.
 */

import { useTranslation } from 'react-i18next'
import { Building2, Phone, Mail, MapPin, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = () => {
  const { t } = useTranslation()
  return (
    <footer className="bg-white pt-16 pb-8 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-blue-600 mb-4">
              <Building2 className="w-6 h-6" />
              <span className="font-bold text-lg text-gray-900 tracking-tight">
                {t('footer.brandName')}
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {t('footer.brandDesc')}
            </p>
            <div className="flex items-center gap-4 text-gray-400">
              <a href="javascript:void(0)" className="hover:text-blue-600 transition-colors"><div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">FB</div></a>
              <a href="javascript:void(0)" className="hover:text-blue-600 transition-colors"><div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">YT</div></a>
              <a href="javascript:void(0)" className="hover:text-blue-600 transition-colors"><div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">IN</div></a>
            </div>
          </div>

          {/* Hỗ Trợ */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">{t('footer.supportTitle')}</h3>
            <ul className="space-y-3">
              <li><a href="javascript:void(0)" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">{t('footer.supportAbout')}</a></li>
              <li><a href="javascript:void(0)" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">{t('footer.supportEmail')}</a></li>
              <li><a href="javascript:void(0)" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">{t('footer.supportPrivacy')}</a></li>
              <li><a href="javascript:void(0)" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">{t('footer.supportTerms')}</a></li>
            </ul>
          </div>

          {/* Liên Hệ */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">{t('footer.contactTitle')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-500">
                  {t('footer.contactAddress')}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500 font-medium text-blue-600">
                  {t('footer.contactHotline')}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500">
                  {t('footer.contactEmail')}
                </span>
              </li>
            </ul>
          </div>

          {/* Bản Tin */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">{t('footer.newsletterTitle')}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {t('footer.newsletterDesc')}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={t('footer.newsletterPlaceholder')}
                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
              />
              <button className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">
            {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <a href="javascript:void(0)" className="hover:text-gray-600">{t('footer.linkTerms')}</a>
            <a href="javascript:void(0)" className="hover:text-gray-600">{t('footer.linkPrivacy')}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer