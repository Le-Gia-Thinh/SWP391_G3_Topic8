import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MessageSquare, Clock, CheckCircle, Ticket } from 'lucide-react'
import driverApi from '../../apis/driverApi'
import { toast } from 'react-toastify'
import dayjs from 'dayjs'

const STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-700 dark:text-blue-400',
  Pending: 'bg-orange-100 text-orange-700',
  Resolved: 'bg-green-100 text-green-700 dark:text-green-400',
  Closed: 'bg-gray-100 text-gray-700 dark:text-gray-300'
}

const STATUS_LABELS = {
  Open: 'Mới gửi',
  Pending: 'Chờ phản hồi',
  Resolved: 'Đã giải quyết',
  Closed: 'Đã đóng'
}

const DriverSupport = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const res = await driverApi.getTickets()
      if (res.success) {
        setTickets(res.data)
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách yêu cầu hỗ trợ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !content.trim()) {
      return toast.warn('Vui lòng nhập đủ tiêu đề và nội dung')
    }

    try {
      const res = await driverApi.createTicket({ subject, content })
      if (res.success) {
        toast.success('Đã gửi yêu cầu hỗ trợ')
        setSubject('')
        setContent('')
        setShowForm(false)
        fetchTickets()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo yêu cầu')
    }
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yêu Cầu Hỗ Trợ</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Gửi và theo dõi các yêu cầu hỗ trợ của bạn</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 shadow-sm shadow-blue-200 dark:shadow-none"
        >
          {showForm ? 'Hủy' : <><Plus size={18} /> Tạo yêu cầu mới</>}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Gửi yêu cầu hỗ trợ</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Tiêu đề vấn đề</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ví dụ: Lỗi thanh toán, Hỏi về hóa đơn..."
                className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-100 dark:text-white"
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Nội dung chi tiết</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải để chúng tôi hỗ trợ tốt nhất..."
                className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-100 resize-none dark:text-white"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-sm shadow-emerald-200 dark:shadow-none"
              >
                Gửi yêu cầu
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-slate-400">Đang tải...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-slate-700 text-blue-500 dark:text-slate-400 mb-4">
              <Ticket size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chưa có yêu cầu nào</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Các yêu cầu hỗ trợ của bạn sẽ xuất hiện ở đây</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
            {tickets.map(ticket => (
              <Link
                key={ticket.TicketID}
                to={`/driver/support/${ticket.TicketID}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 transition hover:bg-gray-50 dark:hover:bg-slate-700/50 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:text-blue-400 transition">
                      {ticket.Subject}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[ticket.Status]}`}>
                      {STATUS_LABELS[ticket.Status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {dayjs(ticket.UpdatedAt).format('DD/MM/YYYY HH:mm')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={14} />
                      {ticket.ReplyCount} phản hồi
                    </span>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0">
                  <span className="inline-flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Xem chi tiết <CheckCircle size={16} className="ml-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DriverSupport
