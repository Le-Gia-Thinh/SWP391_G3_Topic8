/**
 * FILE: Card.jsx
 * MÔ TẢ: Component Thẻ (Card) vùng chứa cơ bản với viền cong, nền trắng/tối và đổ bóng.
 * Thường dùng làm khung bao bọc cho các thành phần nội dung (Biểu đồ, Bảng, Form).
 */

import React from 'react'

const Card = ({ children, className = '', noPadding = false, ...props }) => {
  return (
    <div
      className={`rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 shadow-sm ${
        noPadding ? '' : 'p-6'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
