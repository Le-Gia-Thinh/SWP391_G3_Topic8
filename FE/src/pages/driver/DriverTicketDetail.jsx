/**
 * FILE: DriverTicketDetail.jsx
 * MÔ TẢ: Trang Chi tiết Hỗ trợ (Ticket) dành cho Driver.
 * Hiển thị nội dung chi tiết của một ticket và lịch sử phản hồi giữa tài xế và nhân viên,
 * đồng thời cho phép tài xế gửi phản hồi mới (nếu ticket chưa đóng).
 */

import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Clock, User, ShieldCheck } from 'lucide-react'
import driverApi from '../../apis/driverApi'
import { toast } from 'react-toastify'
import dayjs from 'dayjs'

const STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-700 dark:text-blue-400',
  Pending: 'bg-orange-100 text-orange-700',
  Resolved: 'bg-green-100 text-green-700 dark:text-green-400',
  Closed: 'bg-gray-100 text-gray-700 dark:text-gray-300'
}

const STATUS_LABEL_KEYS = {
  Open: 'driver.ticketDetail.statusOpen',
  Pending: 'driver.ticketDetail.statusPending',
  Resolved: 'driver.ticketDetail.statusResolved',
  Closed: 'driver.ticketDetail.statusClosed'
}

const DriverTicketDetail = () => {
  // Hook useTranslation: Hỗ trợ dịch ngôn ngữ (đa ngôn ngữ).
  const { t } = useTranslation()
  // Hook useParams: Lấy tham số 'id' (mã ticket) từ URL (ví dụ: /driver/support/123 -> id = 123).
  const { id } = useParams()
  // Hook useNavigate: Hỗ trợ điều hướng chuyển trang programmatically.
  const navigate = useNavigate()

  // Hook useState:
  // - ticket: Lưu trữ thông tin chi tiết của ticket và danh sách các tin nhắn phản hồi (Replies).
  // - loading: Trạng thái chờ load dữ liệu (true = đang load).
  // - replyContent: Lưu nội dung đoạn chat phản hồi mà tài xế đang gõ.
  // - submitting: Trạng thái đang gửi phản hồi (true = đang gửi, block nút bấm để chống spam).
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Hook useRef: Tạo một tham chiếu (reference) để trỏ tới thẻ div cuối cùng trong khu vực chat.
  // Giúp tự động cuộn (scroll) màn hình xuống tin nhắn mới nhất khi có tin nhắn thêm vào.
  const endOfMessagesRef = useRef(null)

  /**
   * Hàm xử lý logic: fetchDetail
   * Gửi request lên server để lấy thông tin chi tiết của 1 ticket dựa theo ID.
   * Nếu có lỗi hoặc không tìm thấy, sẽ thông báo lỗi và đưa người dùng về trang danh sách.
   */
  const fetchDetail = async () => {
    try {
      setLoading(true)
      const res = await driverApi.getTicketDetails(id)
      if (res.success) {
        setTicket(res.data)
      }
    } catch (error) {
      toast.error(t('driver.ticketDetail.loadError'))
      navigate('/driver/support')
    } finally {
      setLoading(false)
    }
  }

  // Hook useEffect: Lắng nghe sự thay đổi của biến 'id' từ URL.
  // Khi 'id' thay đổi hoặc khi vào trang lần đầu, sẽ gọi hàm fetchDetail() để tải dữ liệu ticket tương ứng.
  useEffect(() => {
    fetchDetail()
  }, [id])

  // Hook useEffect: Lắng nghe sự thay đổi của mảng ticket?.Replies.
  // Mỗi khi danh sách tin nhắn thay đổi (có người gửi thêm tin nhắn mới), hàm này sẽ cuộn trang xuống phần tử cuối cùng mượt mà (smooth).
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [ticket?.Replies])

  /**
   * Hàm xử lý logic: handleReply
   * Xử lý khi người dùng ấn nút "Gửi" tin nhắn phản hồi.
   * - Kiểm tra nội dung tin nhắn không được để trống.
   * - Gọi API replyTicket với nội dung tin nhắn.
   * - Nếu thành công, làm sạch ô nhập và gọi lại fetchDetail() để cập nhật lại giao diện.
   * 
   * @param {Event} e Sự kiện submit form
   */
  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    try {
      setSubmitting(true)
      const res = await driverApi.replyTicket(id, { content: replyContent })
      if (res.success) {
        setReplyContent('')
        fetchDetail() // Tải lại chi tiết để lấy tin nhắn mới và trạng thái (nếu có thay đổi)
      }
    } catch (error) {
      toast.error(t('driver.ticketDetail.replyError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('driver.ticketDetail.loading')}</div>
  }

  if (!ticket) return null

  const isClosed = ticket.Status === 'Closed' || ticket.Status === 'Resolved'

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 dark:bg-gray-900 border-b border-gray-100 dark:border-slate-700/50 dark:border-gray-800 p-4 shrink-0 rounded-t-2xl shadow-sm">
        <button
          onClick={() => navigate('/driver/support')}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white dark:text-white line-clamp-1">{ticket.Subject}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
            {t('driver.ticketDetail.createdAt', { time: dayjs(ticket.CreatedAt).format('DD/MM/YYYY HH:mm') })}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${STATUS_COLORS[ticket.Status]}`}>
          {t(STATUS_LABEL_KEYS[ticket.Status] || 'driver.ticketDetail.statusOpen')}
        </span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50 dark:bg-gray-950 space-y-6">

        {/* Original Ticket Content */}
        <div className="flex gap-4 max-w-[85%] ml-auto flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
            <User size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">{t('driver.ticketDetail.you')}</span>
            <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm text-sm whitespace-pre-wrap">
              {ticket.Content}
            </div>
            <span className="text-[10px] text-gray-400 mr-1">{dayjs(ticket.CreatedAt).format('HH:mm DD/MM')}</span>
          </div>
        </div>

        {/* Replies */}
        {ticket.Replies?.map(reply => {
          const isMe = reply.SenderRole === 'Driver'

          return (
            <div key={reply.ReplyID} className={`flex gap-4 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 dark:text-blue-400' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'}`}>
                {isMe ? <User size={16} /> : <ShieldCheck size={16} />}
              </div>
              <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : ''}`}>
                <span className={`text-xs font-semibold text-gray-500 dark:text-gray-400 ${isMe ? 'mr-1' : 'ml-1'}`}>
                  {isMe ? t('driver.ticketDetail.you') : t('driver.ticketDetail.staff')}
                </span>
                <div className={`p-4 rounded-2xl shadow-sm text-sm whitespace-pre-wrap ${isMe
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 dark:bg-gray-800 border border-gray-100 dark:border-slate-700/50 dark:border-gray-700 text-gray-800 dark:text-gray-200 dark:text-gray-200 rounded-tl-none'
                }`}>
                  {reply.Content}
                </div>
                <span className={`text-[10px] text-gray-400 ${isMe ? 'mr-1' : 'ml-1'}`}>
                  {dayjs(reply.CreatedAt).format('HH:mm DD/MM')}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Reply Input */}
      <div className="p-4 bg-white dark:bg-slate-800 dark:bg-gray-900 border-t border-gray-100 dark:border-slate-700/50 dark:border-gray-800 rounded-b-2xl shrink-0 shadow-sm">
        {isClosed ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 p-2">
            {t('driver.ticketDetail.closedHint')}
          </div>
        ) : (
          <form onSubmit={handleReply} className="flex gap-2 relative">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={t('driver.ticketDetail.replyPlaceholder')}
              className="flex-1 max-h-32 min-h-[44px] rounded-2xl border border-gray-200 dark:border-slate-700 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/50 dark:bg-gray-800 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:bg-slate-800 dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-100 dark:text-white resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleReply(e)
                }
              }}
            />
            <button
              type="submit"
              disabled={submitting || !replyContent.trim()}
              className="h-11 w-11 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed self-end mb-0.5"
            >
              <Send size={18} className="ml-1" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default DriverTicketDetail