import React from 'react'

const Card = ({ children, className = '', noPadding = false, ...props }) => {
  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white shadow-sm ${
        noPadding ? '' : 'p-6'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
