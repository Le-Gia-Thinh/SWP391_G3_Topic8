import React from 'react'
import { Check } from 'lucide-react'

/**
 * CustomCheckbox – Pure React + Tailwind
 * @param {boolean} checked - trạng thái tick
 * @param {function} onChange - callback(newValue: boolean)
 * @param {string} label - nhãn hiển thị bên cạnh
 * @param {string} className - class bổ sung
 * @param {string} labelClassName - class bổ sung cho text label
 */
const CustomCheckbox = ({ checked, onChange, label, className = '', labelClassName = 'text-sm font-medium text-gray-700' }) => {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 cursor-pointer select-none ${className}`}
    >
      <div
        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors border-2 ${
          checked
            ? 'bg-blue-600 border-blue-600'
            : 'bg-white border-gray-300 hover:border-blue-400'
        }`}
      >
        {checked && <Check size={13} className="text-white" strokeWidth={3} />}
      </div>
      {label && <span className={labelClassName}>{label}</span>}
    </div>
  )
}

export default CustomCheckbox
