import React from 'react'

const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-600 dark:text-gray-400',
    primary: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    success: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    danger: 'bg-red-50 dark:bg-red-900/20 text-red-600',
    warning: 'bg-yellow-50 text-yellow-600',
    info: 'bg-cyan-50 text-cyan-600'
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  )
}

export default Badge
