/**
 * FILE: Header.jsx
 * MÔ TẢ: Component Header (đầu trang) hiển thị trên các trang giao diện công khai (như trang chủ).
 * Chứa Logo, các menu điều hướng nhanh, Nút chuyển đổi ngôn ngữ, và nút Đăng nhập / Đăng ký.
 */

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Building2, ChevronLeft } from 'lucide-react'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import { useTranslation } from 'react-i18next'

const Header = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const isAuthPage = location.pathname.includes('/login') || location.pathname.includes('/register')

  return (
    <header className="bg-white border-b border-gray-100 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-blue-600">
          <Building2 className="w-6 h-6" />
          <span className="font-bold text-lg text-gray-900 tracking-tight">
            ParkingBuilding <span className="text-blue-600 font-semibold">Management</span>
          </span>
        </Link>

        {isAuthPage ? (
          <Link to="/" className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            {t('layout.header.backToHome')}
          </Link>
        ) : (
          <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">{t('layout.header.navHome')}</Link>
              <a href="#bang-gia" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">{t('layout.header.navPricing')}</a>
              <a href="#ho-tro" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">{t('layout.header.navSupport')}</a>
              <a href="#quy-dinh" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">{t('layout.header.navRules')}</a>
              <a href="#lien-he" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">{t('layout.header.navContact')}</a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Link to="/admin/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                {t('layout.header.login')}
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
              >
                {t('layout.header.register')}
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

export default Header
