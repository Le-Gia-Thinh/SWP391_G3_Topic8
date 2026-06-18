import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Clock, Search, Filter } from 'lucide-react'
import staffApi from '../../apis/staffApi'
import { toast } from 'react-toastify'
import dayjs from 'dayjs'

const STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-700',
  Pending: 'bg-orange-100 text-orange-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-700'
}

const STATUS_LABELS = {
  Open: 'Mới gửi',
  Pending: 'Đang xử lý',
  Resolved: 'Đã giải quyết',
  Closed: 'Đã đóng'
}

const StaffSupportManager = () => {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const res = await staffApi.getTickets({ status: statusFilter === 'All' ? undefined : statusFilter })
      if (res.success) {
        setTickets(res.data)
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách ticket')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Yêu Cầu Hỗ Trợ</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tiếp nhận và xử lý yêu cầu từ tài xế</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 pl-10 pr-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold outline-none focus:border-blue-500 dark:text-white"
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Open">Mới gửi (Chưa xử lý)</option>
              <option value="Pending">Đang xử lý</option>
              <option value="Resolved">Đã giải quyết</option>
              <option value="Closed">Đã đóng</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Đang tải dữ liệu...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Không có yêu cầu hỗ trợ nào khớp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tài xế</th>
                  <th className="px-6 py-4 font-semibold">Vấn đề</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold">Cập nhật lúc</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {tickets.map((t) => (
                  <tr key={t.TicketID} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{t.DriverName}</div>
                      <div className="text-xs text-gray-500">{t.DriverPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 max-w-xs">{t.Subject}</div>
                      <div className="text-xs text-gray-500">{t.ReplyCount} phản hồi</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[t.Status]}`}>
                        {STATUS_LABELS[t.Status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {dayjs(t.UpdatedAt).format('HH:mm DD/MM/YYYY')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/staff/support/${t.TicketID}`}
                        className="inline-flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                      >
                        Chi tiết
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffSupportManager
