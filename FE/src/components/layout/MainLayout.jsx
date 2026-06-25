/**
 * FILE: MainLayout.jsx
 * MÔ TẢ: Layout chung dành cho các trang công khai (Guest).
 * Bao gồm Header, nội dung chính (Outlet) và Footer, đảm bảo chiều cao tối thiểu 100vh.
 */

import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
