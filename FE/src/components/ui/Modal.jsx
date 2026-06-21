import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-md',
  showClose = true
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} transform rounded-2xl bg-white dark:bg-slate-800 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200`}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/50 p-5">
            {title && <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>}
            {showClose && (
              <button
                onClick={onClose}
                className="ml-auto rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        <div className="p-6">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-slate-700/50 p-5 bg-gray-50/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper static methods will be implemented via Context in a real app,
// but for simplicity here we just export the generic modal component.
export default Modal
