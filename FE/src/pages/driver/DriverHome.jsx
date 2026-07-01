/**
 * FILE: DriverHome.jsx
 * MÔ TẢ: Trang Chủ dành cho Driver.
 * Cung cấp cái nhìn tổng quan: các hành động nhanh (đặt chỗ, phiên, lịch sử...), 
 * tình trạng chỗ trống bãi đỗ, lượt đặt chỗ hiện tại và phiên đỗ xe đang diễn ra.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bike, CarFront, Truck, Clock, CalendarDays, FileText, AlertCircle,
  ChevronRight, ExternalLink, RefreshCcw, CalendarCheck2, Activity,
  CheckCircle2, XCircle, TrendingUp, MessageSquare, Sparkles
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import authorizeAxios from '../../utils/authorizeAxios'

const QUICK_ACTIONS = [
  { titleKey: 'driver.home.quickActions.booking.title', descriptionKey: 'driver.home.quickActions.booking.desc', to: '/driver/booking', Icon: CalendarDays, variant: 'primary' },
  { titleKey: 'driver.home.quickActions.session.title', descriptionKey: 'driver.home.quickActions.session.desc', to: '/driver/session', Icon: Clock, iconClass: 'text-blue-500', bgClass: 'bg-blue-50 dark:bg-blue-900/20' },
  { titleKey: 'driver.home.quickActions.history.title', descriptionKey: 'driver.home.quickActions.history.desc', to: '/driver/history', Icon: FileText, iconClass: 'text-indigo-500', bgClass: 'bg-indigo-50' },
  { titleKey: 'driver.home.quickActions.report.title', descriptionKey: 'driver.home.quickActions.report.desc', to: '/driver/report', Icon: AlertCircle, iconClass: 'text-rose-500', bgClass: 'bg-rose-50' },
  { titleKey: 'driver.home.quickActions.support.title', descriptionKey: 'driver.home.quickActions.support.desc', to: '/driver/support', Icon: MessageSquare, iconClass: 'text-emerald-500', bgClass: 'bg-emerald-50' }
]

const COLOR_CLASSES = {
  orange: { border: 'border-amber-200/60', bg: 'bg-gradient-to-br from-amber-50 to-white', iconBg: 'bg-amber-100/80', iconText: 'text-amber-600', progress: 'bg-amber-500', progressBg: 'bg-amber-100' },
  blue: { border: 'border-blue-200/60', bg: 'bg-gradient-to-br from-blue-50 to-white', iconBg: 'bg-blue-100/80', iconText: 'text-blue-600 dark:text-blue-400', progress: 'bg-blue-500', progressBg: 'bg-blue-100' },
  green: { border: 'border-emerald-200/60', bg: 'bg-gradient-to-br from-emerald-50 to-white', iconBg: 'bg-emerald-100/80', iconText: 'text-emerald-600', progress: 'bg-emerald-500', progressBg: 'bg-emerald-100' }
}

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatCurrency = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VNĐ`

const getVehicleIconAndColor = (vehicleCode, vehicleName) => {
  const text = `${vehicleCode || ''} ${vehicleName || ''}`.toLowerCase()
  if (text.includes('moto') || text.includes('bike') || text.includes('máy')) return { Icon: Bike, color: 'orange' }
  if (text.includes('truck') || text.includes('tải')) return { Icon: Truck, color: 'green' }
  return { Icon: CarFront, color: 'blue' }
}

const SectionHeader = ({ icon: Icon, title, actionText, actionTo }) => (
  <div className="mb-5 flex items-center justify-between">
    <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-white">
      {Icon && (<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"><Icon size={18} /></div>)}
      {title}
    </h2>
    {actionText && actionTo && (
      <Link to={actionTo} className="group flex items-center gap-1 text-sm font-bold text-blue-600 dark:text-blue-400 transition-colors hover:text-blue-700">
        {actionText}
        <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
      </Link>
    )}
  </div>
)

const VehicleStatusCard = ({ vehicle }) => {
  const { t } = useTranslation()
  const { Icon, color } = getVehicleIconAndColor(vehicle.VehicleCode, vehicle.VehicleName)
  const classes = COLOR_CLASSES[color] || COLOR_CLASSES.blue
  const available = Number(vehicle.AvailableSlots || 0)
  const total = Number(vehicle.TotalSlots || 0)
  const used = total - available
  const percentage = total > 0 ? (used / total) * 100 : 0
  return (
    <div className={`relative overflow-hidden rounded-[1.25rem] border p-5 transition-all hover:shadow-md hover:-translate-y-1 ${classes.border} ${classes.bg}`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${classes.iconBg} ${classes.iconText}`}><Icon size={24} /></div>
        <div className="text-right">
          <p className="mb-0.5 text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">{vehicle.VehicleName || t('driver.home.vehicleFallback')}</p>
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{available}</span>
            <span className="text-xs font-bold text-slate-400">{t('driver.home.capacity.available', { total })}</span>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
          <span>{t('driver.home.capacity.fillRate')}</span><span>{percentage.toFixed(1)}%</span>
        </div>
        <div className={`h-2 w-full overflow-hidden rounded-full ${classes.progressBg}`}>
          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${classes.progress}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </div>
  )
}

const QuickActionCard = ({ to, titleKey, descriptionKey, Icon, variant, iconClass, bgClass }) => {
  const { t } = useTranslation()
  const displayTitle = t(titleKey)
  const displayDesc = t(descriptionKey)
  if (variant === 'primary') {
    return (
      <Link to={to} className="group relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/30">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
        <div className="relative z-10">
          <div className="mb-4 inline-flex rounded-xl bg-white/20 p-3 backdrop-blur-md"><Icon size={24} className="text-white" /></div>
          <h3 className="mb-1.5 text-lg font-bold">{displayTitle}</h3>
          <p className="text-xs font-medium text-blue-100/90">{displayDesc}</p>
        </div>
      </Link>
    )
  }
  return (
    <Link to={to} className="group rounded-[1.25rem] border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 transition-all hover:border-blue-200 hover:shadow-md hover:-translate-y-1">
      <div className={`mb-4 inline-flex rounded-xl p-3 transition-transform duration-300 group-hover:scale-110 ${bgClass || 'bg-slate-50 dark:bg-slate-900/50'}`}>
        <Icon className={iconClass || 'text-slate-500 dark:text-slate-400'} size={24} />
      </div>
      <h3 className="mb-1.5 text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-700 transition-colors">{displayTitle}</h3>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{displayDesc}</p>
    </Link>
  )
}

const InfoRow = ({ label, value, highlight = false, border = true }) => (
  <div className={`flex items-center justify-between gap-4 text-sm ${border ? 'border-b border-dashed border-slate-200 dark:border-slate-700 pb-3' : ''}`}>
    <span className="font-medium text-slate-500 dark:text-slate-400">{label}</span>
    <span className={`text-right ${highlight ? 'font-black text-blue-600 dark:text-blue-400' : 'font-bold text-slate-800 dark:text-slate-200'}`}>{value}</span>
  </div>
)

const BookingCard = ({ booking }) => {
  const { t } = useTranslation()
  if (!booking) {
    return (<EmptyCard title={t('driver.home.workflows.noBooking')} description={t('driver.home.workflows.noBookingDesc')} actionText={t('driver.home.workflows.createBooking')} actionTo="/driver/booking" icon={CalendarCheck2} />)
  }
  const slotText = `${booking.FloorName || '--'} / ${t('driver.home.zoneWord')} ${booking.ZoneName || '--'} / Slot ${booking.SlotCode || '--'}`
  return (
    <div className="relative flex h-full min-h-[400px] flex-col rounded-[1.5rem] border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm overflow-hidden hover:border-blue-200 transition-colors">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">{t('driver.home.workflows.bookingCode')}</p>
          <h3 className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">{booking.BookingCode}</h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/60 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          {t('driver.home.activeStatus')}
        </span>
      </div>
      <div className="flex-1 space-y-4 rounded-xl bg-slate-50/50 p-5 border border-slate-100 dark:border-slate-700/50">
        <InfoRow label={t('driver.home.workflows.start')} value={formatDateTime(booking.StartTime)} />
        <InfoRow label={t('driver.home.workflows.end')} value={formatDateTime(booking.EndTime)} />
        <InfoRow label={t('driver.home.workflows.vehicleType')} value={booking.VehicleName || '--'} />
        <InfoRow label={t('driver.home.workflows.location')} value={slotText} highlight border={false} />
      </div>
      <Link to="/driver/booking-confirmation" state={{ reservationId: booking.ReservationID, bookingCode: booking.BookingCode, parkingName: booking.BuildingName, vehicleType: booking.VehicleCode, bookingDate: booking.ReservationDate, startTime: booking.StartTime, floor: booking.FloorName, zone: booking.ZoneName, selectedSlot: booking.SlotCode }} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95">
        {t('driver.home.workflows.viewQr')} <ChevronRight size={16} />
      </Link>
    </div>
  )
}

const ActiveSessionCard = ({ session }) => {
  const { t } = useTranslation()
  if (!session) {
    return (<EmptyCard title={t('driver.home.workflows.noSession')} description={t('driver.home.workflows.noSessionDesc')} actionText={t('driver.home.workflows.viewHistory')} actionTo="/driver/session" icon={Activity} />)
  }
  const slotText = `${session.FloorName || '--'} / ${t('driver.home.zoneWord')} ${session.ZoneName || '--'} / Slot ${session.SlotCode || '--'}`
  return (
    <div className="relative flex h-full min-h-[400px] flex-col overflow-hidden rounded-[1.5rem] border border-blue-200 bg-gradient-to-b from-white to-blue-50/30 p-6 shadow-md shadow-blue-900/5">
      <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#f8fafc] border-r border-blue-200" />
      <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#f8fafc] border-l border-blue-200" />
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">{t('driver.home.workflows.plate')}</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{session.PlateNumber || '--'}</h3>
        </div>
        <div className="text-right">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">{t('driver.home.workflows.sessionType')}</p>
          <span className="inline-block rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">{session.BookingCode ? t('driver.home.workflows.prebooked') : t('driver.home.workflows.walkIn')}</span>
        </div>
      </div>
      <div className="flex-1 space-y-3 border-y border-dashed border-blue-200 py-5">
        <InfoRow label={t('driver.home.workflows.sessionCode')} value={session.SessionCode || `SESS-${session.SessionID}`} />
        <InfoRow label={t('driver.home.workflows.bookingLink')} value={session.BookingCode || t('driver.home.workflows.none')} />
        <InfoRow label={t('driver.home.workflows.entryTime')} value={formatDateTime(session.EntryTime)} />
        <InfoRow label={t('driver.home.workflows.currentLocation')} value={slotText} highlight border={false} />
      </div>
      <div className="mt-5">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{t('driver.home.workflows.estimatedFee')}</p>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(session.Amount)}</span>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">{t('driver.home.workflows.unpaid')}</span>
          </div>
        </div>
        <div className="grid grid-cols-[1fr_2fr] gap-3">
          <Link to="/driver/report" className="flex h-12 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 hover:border-slate-300 active:scale-95">{t('driver.home.workflows.issue')}</Link>
          <Link to="/driver/session" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95">{t('driver.home.workflows.payNow')} <ExternalLink size={16} /></Link>
        </div>
      </div>
    </div>
  )
}

const EmptyCard = ({ title, description, actionText, actionTo, icon: Icon }) => (
  <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 p-8 text-center transition-colors hover:border-blue-300 hover:bg-blue-50/30 group">
    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors"><Icon size={32} /></div>
    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
    <p className="max-w-[250px] text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">{description}</p>
    <Link to={actionTo} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95">{actionText}</Link>
  </div>
)

const SummaryMiniCard = ({ label, value, icon: Icon, color }) => {
  const colorMap = { blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', emerald: 'bg-emerald-50 text-emerald-600', indigo: 'bg-indigo-50 text-indigo-600', rose: 'bg-rose-50 text-rose-600' }
  return (
    <div className="group flex flex-col justify-between rounded-[1.25rem] border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-slate-300">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-2/3 leading-relaxed">{label}</p>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${colorMap[color]}`}><Icon size={20} /></div>
      </div>
      <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
    </div>
  )
}

const DriverHome = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [homeData, setHomeData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchHomeData = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const response = await authorizeAxios.get('/driver/home')
      setHomeData(response.data?.data || null)
    } catch (error) {
      console.error('Get driver home failed:', error)
      setErrorMessage(error.response?.data?.message || t('driver.home.errorMessage'))
    } finally {
      setIsLoading(false)
      setTimeout(() => setIsLoaded(true), 100)
    }
  }

  useEffect(() => { fetchHomeData() }, [])

  const slotSummary = homeData?.slotSummary || []
  const bookingSummary = homeData?.bookingSummary || {}
  const displayName = homeData?.user?.FullName || user?.fullName || user?.FullName || 'Driver'
  const updatedAt = useMemo(() => formatDateTime(homeData?.serverTime || new Date()), [homeData?.serverTime])

  if (isLoading && !homeData) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 mb-4" />
        <p className="font-bold text-slate-500 dark:text-slate-400">{t('driver.home.syncing')}</p>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-red-100 bg-red-50 dark:bg-red-900/20 p-12 text-center shadow-sm">
        <div className="h-16 w-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4"><AlertCircle size={32} /></div>
        <p className="font-bold text-red-700 dark:text-red-400 text-lg mb-2">{t('driver.home.errorTitle')}</p>
        <p className="font-medium text-red-600/80 mb-6">{errorMessage}</p>
        <button type="button" onClick={fetchHomeData} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 active:scale-95 transition-all">
          <RefreshCcw size={16} /> {t('driver.home.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className={`space-y-8 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-blue-500">{t('driver.home.eyebrow')}</p>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('driver.home.greeting', { name: displayName })}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold bg-linear-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
            {t('driver.home.welcomeBack')}
          </p>
        </div>
        <button type="button" onClick={fetchHomeData} className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 shadow-sm transition-all hover:bg-slate-50 hover:text-blue-600 active:scale-95">
          <RefreshCcw size={16} className={isLoading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''} />
          {isLoading ? t('driver.home.loading') : t('driver.home.refresh')}
        </button>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryMiniCard label={t('driver.home.stats.totalBookings')} value={bookingSummary.TotalBookings || 0} icon={FileText} color="blue" />
        <SummaryMiniCard label={t('driver.home.stats.active')} value={bookingSummary.ActiveBookings || 0} icon={TrendingUp} color="emerald" />
        <SummaryMiniCard label={t('driver.home.stats.completed')} value={bookingSummary.CompletedBookings || 0} icon={CheckCircle2} color="indigo" />
        <SummaryMiniCard label={t('driver.home.stats.cancelled')} value={Number(bookingSummary.CancelledBookings || 0) + Number(bookingSummary.ExpiredBookings || 0)} icon={XCircle} color="rose" />
      </section>

      <section className="rounded-[1.5rem] border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-7 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2.5 text-lg font-bold text-slate-900 dark:text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500"><Activity size={18} /></div>
            {t('driver.home.capacity.title')}
          </h2>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
            {t('driver.home.capacity.updatedAt', { time: updatedAt })}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {slotSummary.length > 0 ? (
            slotSummary.map((vehicle) => (<VehicleStatusCard key={vehicle.VehicleTypeID} vehicle={vehicle} />))
          ) : (
            <div className="col-span-full py-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">{t('driver.home.capacity.empty')}</div>
          )}
        </div>
      </section>

      <section>
        <SectionHeader title={t('driver.home.quickActions.title')} icon={CalendarDays} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {QUICK_ACTIONS.map((action) => (<QuickActionCard key={action.to} {...action} />))}
        </div>
      </section>

      <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        <div className="flex flex-col">
          <SectionHeader icon={CalendarCheck2} title={t('driver.home.workflows.currentBooking')} actionText={t('driver.home.workflows.viewHistory')} actionTo="/driver/history" />
          <BookingCard booking={homeData?.currentBooking} />
        </div>
        <div className="flex flex-col">
          <SectionHeader icon={Clock} title={t('driver.home.workflows.currentSession')} actionText={t('driver.home.workflows.sessionDetail')} actionTo="/driver/session" />
          <ActiveSessionCard session={homeData?.currentSession} />
        </div>
      </section>
    </div>
  )
}

export default DriverHome