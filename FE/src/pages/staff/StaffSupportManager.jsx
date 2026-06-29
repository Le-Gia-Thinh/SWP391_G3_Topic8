/**
 * FILE: StaffSupportManager.jsx
 * MÔ TẢ: Trang Quản lý Yêu cầu Hỗ trợ (Tickets) dành cho Staff.
 * Hiển thị danh sách các ticket được gửi từ Driver, hỗ trợ lọc theo trạng thái
 * (Open, Pending, Resolved, Closed) và chuyển hướng tới trang chi tiết ticket.
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Clock, Search, Filter } from 'lucide-react'
import staffApi from '../../apis/staffApi'
import { toast } from 'react-toastify'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

const STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-700',
  Pending: 'bg-orange-100 text-orange-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-slate-100 text-slate-700'
}

const StaffSupportManager = () => {
  const { t } = useTranslation()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')

  const STATUS_LABELS = {
    Open: t('staff.support.tickets.statusOpen'),
    Pending: t('staff.support.tickets.statusPending'),
    Resolved: t('staff.support.tickets.statusResolved'),
    Closed: t('staff.support.tickets.statusClosed')
  }

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const res = await staffApi.getTickets({ status: statusFilter === 'All' ? undefined : statusFilter })
      if (res.success) {
        setTickets(res.data)
      }
    } catch (error) {
      toast.error(t('staff.support.tickets.loadError'))
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('staff.support.tickets.title')}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('staff.support.tickets.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 pl-10 pr-8 rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold outline-none focus:border-blue-500 dark:text-white"
            >
              <option value="All">{t('staff.support.tickets.filterAll')}</option>
              <option value="Open">{t('staff.support.tickets.filterOpen')}</option>
              <option value="Pending">{t('staff.support.tickets.statusPending')}</option>
              <option value="Resolved">{t('staff.support.tickets.statusResolved')}</option>
              <option value="Closed">{t('staff.support.tickets.statusClosed')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">{t('staff.support.tickets.loading')}</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {t('staff.support.tickets.empty')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-50 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">{t('staff.support.tickets.colDriver')}</th>
                  <th className="px-6 py-4 font-semibold">{t('staff.support.tickets.colSubject')}</th>
                  <th className="px-6 py-4 font-semibold">{t('staff.support.tickets.colStatus')}</th>
                  <th className="px-6 py-4 font-semibold">{t('staff.support.tickets.colUpdated')}</th>
                  <th className="px-6 py-4 font-semibold text-right">{t('staff.support.tickets.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tickets.map((t2) => (
                  <tr key={t2.TicketID} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{t2.DriverName}</div>
                      <div className="text-xs text-slate-500">{t2.DriverPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-xs">{t2.Subject}</div>
                      <div className="text-xs text-slate-500">{t('staff.support.tickets.replyCount', { n: t2.ReplyCount })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[t2.Status]}`}>
                        {STATUS_LABELS[t2.Status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {dayjs(t2.UpdatedAt).format('HH:mm DD/MM/YYYY')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/staff/support/${t2.TicketID}`}
                        className="inline-flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                      >
                        {t('staff.support.tickets.viewDetail')}
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