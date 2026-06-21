import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, User, ShieldCheck, CheckCircle, XCircle } from 'lucide-react'
import staffApi from '../../apis/staffApi'
import { toast } from 'react-toastify'
import dayjs from 'dayjs'

const STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-700',
  Pending: 'bg-orange-100 text-orange-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-slate-100 text-slate-700'
}

const STATUS_LABELS = {
  Open: 'Mới gửi',
  Pending: 'Đang xử lý',
  Resolved: 'Đã giải quyết',
  Closed: 'Đã đóng'
}

const StaffTicketDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const endOfMessagesRef = useRef(null)

  const fetchDetail = async () => {
    try {
      setLoading(true)
      const res = await staffApi.getTicketDetails(id)
      if (res.success) {
        setTicket(res.data)
      }
    } catch (error) {
      toast.error('Lỗi khi tải chi tiết yêu cầu')
      navigate('/staff/support')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [ticket?.Replies])

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    try {
      setSubmitting(true)
      const res = await staffApi.replyTicket(id, { content: replyContent })
      if (res.success) {
        setReplyContent('')
        fetchDetail()
      }
    } catch (error) {
      toast.error('Lỗi khi gửi phản hồi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Xác nhận chuyển trạng thái thành: ${STATUS_LABELS[newStatus]}?`)) return

    try {
      const res = await staffApi.updateTicketStatus(id, newStatus)
      if (res.success) {
        toast.success('Đã cập nhật trạng thái')
        fetchDetail()
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái')
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>
  }

  if (!ticket) return null

  return (
    <div className="animate-in fade-in duration-500 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4 shrink-0 rounded-t-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/staff/support')}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{ticket.Subject}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tài xế: <span className="font-semibold text-slate-700 dark:text-slate-300">{ticket.DriverName}</span> ({ticket.DriverPhone})
            </p>
          </div>
          <span className={`hidden sm:inline-block ml-2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${STATUS_COLORS[ticket.Status]}`}>
            {STATUS_LABELS[ticket.Status]}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {ticket.Status !== 'Resolved' && ticket.Status !== 'Closed' && (
            <button
              onClick={() => handleStatusChange('Resolved')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/50 transition"
            >
              <CheckCircle size={14} /> Giải quyết
            </button>
          )}
          {ticket.Status !== 'Closed' && (
            <button
              onClick={() => handleStatusChange('Closed')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <XCircle size={14} /> Đóng
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950 space-y-6">

        {/* Original Ticket Content */}
        <div className="flex gap-4 max-w-[85%]">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
            <User size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 ml-1">{ticket.DriverName} (Tài xế)</span>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap">
              {ticket.Content}
            </div>
            <span className="text-[10px] text-slate-400 ml-1">{dayjs(ticket.CreatedAt).format('HH:mm DD/MM')}</span>
          </div>
        </div>

        {/* Replies */}
        {ticket.Replies?.map(reply => {
          const isStaff = reply.SenderRole !== 'Driver'

          return (
            <div key={reply.ReplyID} className={`flex gap-4 max-w-[85%] ${isStaff ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!isStaff ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'}`}>
                {!isStaff ? <User size={16} /> : <ShieldCheck size={16} />}
              </div>
              <div className={`flex flex-col gap-1 ${isStaff ? 'items-end' : ''}`}>
                <span className={`text-xs font-semibold text-slate-500 ${isStaff ? 'mr-1' : 'ml-1'}`}>
                  {!isStaff ? ticket.DriverName : 'Bạn'}
                </span>
                <div className={`p-4 rounded-2xl shadow-sm text-sm whitespace-pre-wrap ${
                  isStaff
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}>
                  {reply.Content}
                </div>
                <span className={`text-[10px] text-slate-400 ${isStaff ? 'mr-1' : 'ml-1'}`}>
                  {dayjs(reply.CreatedAt).format('HH:mm DD/MM')}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Reply Input */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl shrink-0 shadow-sm">
        {ticket.Status === 'Closed' ? (
          <div className="text-center text-sm text-slate-500 p-2">
            Ticket này đã bị đóng.
          </div>
        ) : (
          <form onSubmit={handleReply} className="flex gap-2 relative">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Nhập phản hồi hỗ trợ tài xế..."
              className="flex-1 max-h-32 min-h-[44px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-100 dark:text-white resize-none"
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
              className="h-11 w-11 shrink-0 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed self-end mb-0.5"
            >
              <Send size={18} className="ml-1" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default StaffTicketDetail
