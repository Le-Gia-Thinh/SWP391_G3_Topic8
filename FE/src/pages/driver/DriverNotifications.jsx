import React, { useCallback, useEffect, useState } from 'react'
import {
  Bell,
  BellOff,
  CalendarDays,
  CheckCheck,
  Clock,
  Wallet,
  AlertTriangle,
  Loader2,
  Info
} from 'lucide-react'
import { toast } from 'react-toastify'
import driverApi from '../../apis/driverApi'

const TYPE_CONFIG = {
  booking: { icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Đặt chỗ' },
  session: { icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', label: 'Phiên gửi' },
  payment: { icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Thanh toán' },
  incident: { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', label: 'Sự cố' },
  system: { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', label: 'Hệ thống' }
}

const FILTER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'booking', label: 'Đặt chỗ' },
  { key: 'session', label: 'Phiên gửi' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'incident', label: 'Sự cố' },
  { key: 'system', label: 'Hệ thống' }
]

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(String(dateStr).endsWith('Z') ? String(dateStr).slice(0, -1) : dateStr)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  if (diffHour < 24) return `${diffHour} giờ trước`
  if (diffDay < 7) return `${diffDay} ngày trước`

  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const DriverNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (activeFilter !== 'all') params.type = activeFilter

      const [notifResult, countResult] = await Promise.allSettled([
        driverApi.getNotifications(params),
        driverApi.getUnreadCount()
      ])

      if (notifResult.status === 'fulfilled') {
        setNotifications(notifResult.value?.data || [])
      }
      if (countResult.status === 'fulfilled') {
        setUnreadCount(countResult.value?.data?.unreadCount || 0)
      }
    } catch {
      toast.error('Không thể tải thông báo.')
    } finally {
      setLoading(false)
    }
  }, [activeFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleMarkRead = async (notifId) => {
    try {
      await driverApi.markNotificationRead(notifId)
      setNotifications((prev) =>
        prev.map((n) => (n.NotificationID === notifId ? { ...n, IsRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // silent
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await driverApi.markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, IsRead: true })))
      setUnreadCount(0)
      toast.success('Đã đánh dấu tất cả đã đọc.')
    } catch {
      toast.error('Không thể đánh dấu đã đọc.')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-gray-600 shadow-sm">
          <Loader2 size={20} className="animate-spin text-blue-600" />
          Đang tải thông báo...
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">Theo dõi cập nhật về đặt chỗ, phiên gửi xe và thanh toán.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 shadow-sm transition hover:bg-gray-50"
          >
            <CheckCheck size={16} />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </section>

      {/* Filter Tabs */}
      <section className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeFilter === tab.key
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {/* Notification List */}
      <section className="space-y-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm border border-gray-100">
              <BellOff size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Chưa có thông báo</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Thông báo về đặt chỗ, phiên gửi xe và thanh toán sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const config = TYPE_CONFIG[notif.NotificationType] || TYPE_CONFIG.system
            const Icon = config.icon

            return (
              <button
                key={notif.NotificationID}
                onClick={() => !notif.IsRead && handleMarkRead(notif.NotificationID)}
                className={`group flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  notif.IsRead
                    ? 'border-gray-100 bg-white'
                    : `${config.border} ${config.bg} shadow-sm`
                }`}
              >
                {/* Icon */}
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  notif.IsRead ? 'bg-gray-100 text-gray-400' : `bg-white ${config.color} shadow-sm`
                }`}>
                  <Icon size={20} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm leading-snug ${
                      notif.IsRead ? 'font-semibold text-gray-700' : 'font-bold text-gray-900'
                    }`}>
                      {notif.Title}
                    </h3>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatRelativeTime(notif.CreatedAt)}
                      </span>
                      {!notif.IsRead && (
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>
                  </div>
                  <p className={`mt-1 text-sm leading-relaxed ${
                    notif.IsRead ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    {notif.Message}
                  </p>
                  <span className={`mt-2 inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    notif.IsRead ? 'bg-gray-100 text-gray-500' : `${config.bg} ${config.color}`
                  }`}>
                    {config.label}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </section>
    </div>
  )
}

export default DriverNotifications
