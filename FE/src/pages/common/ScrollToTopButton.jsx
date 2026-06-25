/**
 * FILE: ScrollToTopButton.jsx
 * MÔ TẢ: Component nút cuộn lên đầu trang (Scroll to Top).
 * Tự động theo dõi vùng cuộn và chỉ hiển thị khi cuộn xuống một khoảng nhất định.
 */

// src/components/common/ScrollToTopButton.jsx
import { useState, useEffect, useRef } from 'react'
import { ArrowUp } from 'lucide-react'

/**
 * Nút "Quay lại đầu trang" dùng chung.
 * Tự dò vùng cuộn (window hoặc khung layout có overflow), chỉ hiện khi
 * đã cuộn quá `threshold` px. Bấm → trượt êm về đầu.
 *
 * Dùng: đặt <ScrollToTopButton /> ở cuối JSX của trang bất kỳ.
 */
const ScrollToTopButton = ({ threshold = 300 }) => {
  const [visible, setVisible] = useState(false)
  const anchorRef = useRef(null)
  const scrollerRef = useRef(null)

  useEffect(() => {
    // Tìm phần tử cha gần nhất có thể cuộn; nếu không có → dùng window
    let el = anchorRef.current?.parentElement
    let scroller = window
    while (el) {
      const oy = getComputedStyle(el).overflowY
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) {
        scroller = el
        break
      }
      el = el.parentElement
    }
    scrollerRef.current = scroller

    const getTop = () => (scroller === window ? window.scrollY : scroller.scrollTop)
    const onScroll = () => setVisible(getTop() > threshold)
    scroller.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // kiểm tra ngay lần đầu
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [threshold])

  const handleClick = () => {
    const scroller = scrollerRef.current
    if (scroller === window) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (scroller) {
      scroller.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* mốc vô hình để dò vùng cuộn */}
      <span ref={anchorRef} aria-hidden className="hidden" />
      <button
        onClick={handleClick}
        aria-label="Quay lại đầu trang"
        title="Quay lại đầu trang"
        className={`fixed bottom-20 right-6 z-40 w-11 h-11 rounded-full bg-blue-600 text-white
          shadow-lg shadow-blue-300/50 flex items-center justify-center
          hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95
          transition-all duration-200
          ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'}`}
      >
        <ArrowUp size={20} strokeWidth={2.5} />
      </button>
    </>
  )
}

export default ScrollToTopButton