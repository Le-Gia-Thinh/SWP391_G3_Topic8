/**
 * FILE: DriverNotifications.jsx
 * MÔ TẢ: Trang Quản lý Thông báo dành cho Driver.
 * Hiển thị danh sách các thông báo theo bộ lọc (tất cả, đặt chỗ, phiên đỗ, thanh toán, sự cố, hệ thống),
 * cho phép đánh dấu đã đọc một phần hoặc toàn bộ.
 */

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  BellOff, CalendarDays, CheckCheck, Clock, Wallet, AlertTriangle, Loader2, Info
} from 'lucide-react'
import { toast } from 'react-toastify'
import driverApi from '../../apis/driverApi'

// labelKey thay cho label cứng — resolve bằng t() lúc render
const TYPE_CONFIG = {
  booking: { icon: CalendarDays, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800', labelKey: 'driver.notifications.typeBooking' },
  session: { icon: Clock, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-800', labelKey: 'driver.notifications.typeSession' },
  payment: { icon: Wallet, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800', labelKey: 'driver.notifications.typePayment' },
  incident: { icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-100 dark:border-rose-800', labelKey: 'driver.notifications.typeIncident' },
  system: { icon: Info, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-slate-900/50', border: 'border-gray-100 dark:border-slate-700/50', labelKey: 'driver.notifications.typeSystem' }
}

const FILTER_TABS = [
  { key: 'all', labelKey: 'driver.notifications.filterAll' },
  { key: 'booking', labelKey: 'driver.notifications.typeBooking' },
  { key: 'session', labelKey: 'driver.notifications.typeSession' },
  { key: 'payment', labelKey: 'driver.notifications.typePayment' },
  { key: 'incident', labelKey: 'driver.notifications.typeIncident' },
  { key: 'system', labelKey: 'driver.notifications.typeSystem' }
]

function formatRelativeTime(dateStr, t) {
  if (!dateStr) return ''
  const date = new Date(String(dateStr).endsWith('Z') ? String(dateStr).slice(0, -1) : dateStr)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return t('driver.notifications.justNow')
  if (diffMin < 60) return t('driver.notifications.minutesAgo', { n: diffMin })
  if (diffHour < 24) return t('driver.notifications.hoursAgo', { n: diffHour })
  if (diffDay < 7) return t('driver.notifications.daysAgo', { n: diffDay })
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const DriverNotifications = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
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
      if (notifResult.status === 'fulfilled') setNotifications(notifResult.value?.data || [])
      if (countResult.status === 'fulfilled') setUnreadCount(countResult.value?.data?.unreadCount || 0)
    } catch {
      toast.error(t('driver.notifications.toastLoadFail'))
    } finally {
      setLoading(false)
    }
  }, [activeFilter, t])

  useEffect(() => { fetchData() }, [fetchData])

  const handleNotificationClick = async (notif) => {
    if (!notif.IsRead) {
      try {
        await driverApi.markNotificationRead(notif.NotificationID)
        setNotifications((prev) => prev.map((n) => (n.NotificationID === notif.NotificationID ? { ...n, IsRead: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch { /* silent */ }
    }
    // Nếu thông báo yêu cầu thiết lập xe mặc định, chuyển đến trang quản lý xe
    if (notif.ReferenceType === 'SET_DEFAULT_VEHICLE') {
      navigate('/driver/vehicles')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await driverApi.markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, IsRead: true })))
      setUnreadCount(0)
      toast.success(t('driver.notifications.toastAllRead'))
    } catch {
      toast.error(t('driver.notifications.toastMarkFail'))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400 shadow-sm">
          <Loader2 size={20} className="animate-spin text-blue-600 dark:text-blue-400" />
          {t('driver.notifications.loading')}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('driver.notifications.title')}</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">{unreadCount}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('driver.notifications.subtitle')}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 shadow-sm transition hover:bg-gray-50 dark:hover:bg-slate-800">
            <CheckCheck size={16} />
            {t('driver.notifications.markAllRead')}
          </button>
        )}
      </section>

      <section className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveFilter(tab.key)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${activeFilter === tab.key ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400'}`}>
            {t(tab.labelKey)}
          </button>
        ))}
      </section>

      <section className="space-y-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/50 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-gray-300 shadow-sm border border-gray-100 dark:border-slate-700/50"><BellOff size={32} /></div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('driver.notifications.empty')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{t('driver.notifications.emptyHint')}</p>
          </div>
        ) : (
          notifications.map((notif) => {
            const config = TYPE_CONFIG[notif.NotificationType] || TYPE_CONFIG.system
            const Icon = config.icon
            return (
              <button key={notif.NotificationID} onClick={() => handleNotificationClick(notif)}
                className={`group flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${notif.IsRead ? 'border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800' : `${config.border} ${config.bg} shadow-sm`}`}>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${notif.IsRead ? 'bg-gray-100 dark:bg-slate-700/50 text-gray-400' : `bg-white dark:bg-slate-800 ${config.color} shadow-sm`}`}><Icon size={20} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm leading-snug ${notif.IsRead ? 'font-semibold text-gray-700 dark:text-gray-300' : 'font-bold text-gray-900 dark:text-white'}`}>{notif.Title}</h3>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(notif.CreatedAt, t)}</span>
                      {!notif.IsRead && (<span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />)}
                    </div>
                  </div>
                  <p className={`mt-1 text-sm leading-relaxed ${notif.IsRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>{notif.Message}</p>
                  <span className={`mt-2 inline-block rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${notif.IsRead ? 'bg-gray-100 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400' : `${config.bg} ${config.color}`}`}>{t(config.labelKey)}</span>
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