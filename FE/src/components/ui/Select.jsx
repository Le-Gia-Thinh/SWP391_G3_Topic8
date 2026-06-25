/**
 * FILE: Select.jsx
 * MÔ TẢ: Component Select (Dropdown) tùy chỉnh (Custom) thay thế cho thẻ <select> mặc định.
 * Hỗ trợ giao diện đồng bộ, hiển thị danh sách thả xuống mượt mà bằng React + TailwindCSS.
 */

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * CustomSelect – Pure React + Tailwind dropdown
 * @param {string} value - giá trị đang chọn
 * @param {function} onChange - callback khi chọn
 * @param {Array<{value, label}>} options - danh sách tuỳ chọn
 * @param {string} className - class bổ sung cho wrapper
 * @param {string} placeholder - text hiển thị khi chưa chọn
 */
const CustomSelect = ({ value, onChange, options = [], className = '', placeholder = 'Chọn...' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        role="combobox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 text-sm cursor-pointer flex items-center justify-between select-none hover:border-blue-300 transition-colors"
      >
        <span className={`truncate ${selectedOption ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 rounded-xl shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              role="option"
              aria-selected={value === option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                value === option.value
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:text-blue-400'
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomSelect
