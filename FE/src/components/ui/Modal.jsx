/**
 * FILE: Modal.jsx
 * MÔ TẢ: Component Modal (Cửa sổ nổi bật) tái sử dụng cho toàn ứng dụng.
 * Hỗ trợ hiển thị nội dung trên các layer khác, khóa cuộn trang nền và đóng/mở qua state.
 * Dùng React Portal (createPortal) để đưa Modal trực tiếp ra document.body, 
 * giúp Modal luôn nằm chính giữa màn hình (viewport) dù container cha có transform hay transition.
 * Hỗ trợ kéo thả các viền (edges/corners) bên ngoài để tự động thay đổi kích thước linh hoạt.
 */

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-md',
  showClose = true
}) => {
  const [dimensions, setDimensions] = useState({ width: null, height: null })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      setDimensions({ width: null, height: null })
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  // Xử lý kéo thả viền/góc để thay đổi kích thước
  const handleMouseDown = (e, direction) => {
    e.preventDefault()
    e.stopPropagation()

    // Lấy phần tử wrapper (cha trực tiếp chứa các viền và thẻ card)
    const wrapper = e.currentTarget.parentElement
    const startWidth = wrapper.offsetWidth
    const startHeight = wrapper.offsetHeight
    const startX = e.clientX
    const startY = e.clientY

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight

      // Nhân đôi delta vì Modal nằm ở giữa, kéo rộng 1 cạnh sẽ dãn đều 2 bên
      if (direction.includes('r')) {
        newWidth = startWidth + deltaX * 2
      } else if (direction.includes('l')) {
        newWidth = startWidth - deltaX * 2
      }

      if (direction.includes('b')) {
        newHeight = startHeight + deltaY * 2
      } else if (direction.includes('t')) {
        newHeight = startHeight - deltaY * 2
      }

      // Giới hạn kích thước an toàn
      newWidth = Math.max(360, Math.min(window.innerWidth - 32, newWidth))
      newHeight = Math.max(250, Math.min(window.innerHeight - 32, newHeight))

      setDimensions({ width: `${newWidth}px`, height: `${newHeight}px` })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Wrapper co dãn ngoài (không bị overflow-hidden che khuất viền kéo) */}
      <div
        className={`relative z-10 w-full flex flex-col ${dimensions.width ? '' : maxWidth}`}
        style={{ 
          minWidth: '360px', 
          minHeight: '250px',
          width: dimensions.width || undefined,
          height: dimensions.height || undefined
        }}
      >
        {/* Các cạnh kéo giãn nằm ngoài viền (negative margin để dễ nhấp chuột) */}
        <div onMouseDown={(e) => handleMouseDown(e, 't')} className="absolute -top-1.5 left-0 w-full h-3 cursor-n-resize hover:bg-blue-500/20 z-50 transition-all rounded-t-lg" />
        <div onMouseDown={(e) => handleMouseDown(e, 'b')} className="absolute -bottom-1.5 left-0 w-full h-3 cursor-s-resize hover:bg-blue-500/20 z-50 transition-all rounded-b-lg" />
        <div onMouseDown={(e) => handleMouseDown(e, 'l')} className="absolute top-0 -left-1.5 w-3 h-full cursor-w-resize hover:bg-blue-500/20 z-50 transition-all rounded-l-lg" />
        <div onMouseDown={(e) => handleMouseDown(e, 'r')} className="absolute top-0 -right-1.5 w-3 h-full cursor-e-resize hover:bg-blue-500/20 z-50 transition-all rounded-r-lg" />
        
        {/* 4 Góc chéo co giãn */}
        <div onMouseDown={(e) => handleMouseDown(e, 'tl')} className="absolute -top-2 -left-2 w-4 h-4 cursor-nw-resize hover:bg-blue-500/40 z-50 transition-all rounded-tl-full" />
        <div onMouseDown={(e) => handleMouseDown(e, 'tr')} className="absolute -top-2 -right-2 w-4 h-4 cursor-ne-resize hover:bg-blue-500/40 z-50 transition-all rounded-tr-full" />
        <div onMouseDown={(e) => handleMouseDown(e, 'bl')} className="absolute -bottom-2 -left-2 w-4 h-4 cursor-sw-resize hover:bg-blue-500/40 z-50 transition-all rounded-bl-full" />
        <div onMouseDown={(e) => handleMouseDown(e, 'br')} className="absolute -bottom-2 -right-2 w-4 h-4 cursor-se-resize hover:bg-blue-500/40 z-50 transition-all rounded-br-full" />

        {/* Khung Modal chính (chứa rounded-2xl, background và scroll nội bộ) */}
        <div
          className="w-full h-full max-h-[90vh] flex flex-col transform rounded-2xl bg-white dark:bg-slate-800 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        >
          {(title || showClose) && (
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/50 p-5 shrink-0 select-none">
              {title && <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>}
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-auto rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}

          <div className="p-6 overflow-y-auto flex-1">
            {children}
          </div>

          {footer && (
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-slate-700/50 p-5 bg-gray-50/50 rounded-b-2xl shrink-0 select-none">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default Modal
