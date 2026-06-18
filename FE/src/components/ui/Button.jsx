import React from 'react'
import { Loader2 } from 'lucide-react'

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700',
    secondary: 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800',
    danger: 'bg-red-600 text-white shadow-md shadow-red-200 hover:bg-red-700',
    outline: 'bg-transparent text-blue-600 dark:text-blue-400 border-2 border-blue-600 hover:bg-blue-50 dark:bg-blue-900/20',
    ghost: 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-base rounded-xl gap-2.5'
  }

  return (
    <button
      type={props.type || 'button'}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : null}
      {children}
    </button>
  )
}

export default Button
