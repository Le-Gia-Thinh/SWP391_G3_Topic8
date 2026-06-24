import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Car, Clock, MapPin, CreditCard, ArrowLeft,
  CheckCircle2, AlertCircle, Timer, Building2, Layers,
  SquareParking, Bike, Truck, CarFront, ShieldCheck
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import guestApi from '../../apis/guestApi'

const VEHICLE_ICONS = {
  motorcycle: Bike,
  car: CarFront,
  truck: Truck
}

const GuestTracking = () => {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearched, setIsSearched] = useState(false)
  const [currentDuration, setCurrentDuration] = useState(null)
  const [currentFee, setCurrentFee] = useState(null)
  const intervalRef = useRef(null)
  const plateRef = useRef(null)

  // STATUS_MAP built with t() so it re-evaluates on language change
  const STATUS_MAP = {
    Active: { label: t('guest.tracking.statusActive'), color: 'emerald', icon: Timer },
    Completed: { label: t('guest.tracking.statusCompleted'), color: 'blue', icon: CheckCircle2 },
    Lost: { label: t('guest.tracking.statusLost'), color: 'red', icon: AlertCircle },
    Overdue: { label: t('guest.tracking.statusOverdue'), color: 'amber', icon: AlertCircle }
  }

  useEffect(() => {
    plateRef.current?.focus()
  }, [])

  // Realtime duration counter for active sessions
  useEffect(() => {
    if (session && session.status === 'Active') {
      const updateDuration = () => {
        const entry = new Date(session.entryTime)
        const now = new Date()
        const diffMs = now - entry
        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
        setCurrentDuration({ hours, minutes, seconds })
      }
      updateDuration()
      intervalRef.current = setInterval(updateDuration, 1000)
      return () => clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [session])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      setError(t('guest.tracking.errRequired'))
      return
    }

    setIsLoading(true)
    setError('')
    setSession(null)
    setIsSearched(true)

    try {
      const res = await guestApi.trackSession(searchTerm.trim())
      if (res.success) {
        setSession(res.data)
        setCurrentFee(res.data.fee)
      } else {
        // Bỏ res.message — luôn dùng t()
        setError(t('guest.tracking.errNotFound'))
      }
    } catch (err) {
      // Bỏ err.response.data.message — luôn dùng t()
      setError(t('guest.tracking.errNotFoundDetail'))
    } finally {
      setIsLoading(false)
    }
  }
  const handleReset = () => {
    setSearchTerm('')
    setSession(null)
    setError('')
    setIsSearched(false)
    setCurrentDuration(null)
    setCurrentFee(null)
    plateRef.current?.focus()
  }

  const statusInfo = session ? (STATUS_MAP[session.status] || STATUS_MAP.Active) : null
  const VehicleIcon = session ? (VEHICLE_ICONS[session.vehicleCode?.toLowerCase()] || CarFront) : CarFront
  const displayDuration = currentDuration || session?.duration

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/40 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
          >
            <ArrowLeft size={18} />
            {t('guest.tracking.backToHome')}
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20">
              <SquareParking size={18} className="text-white" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t('guest.tracking.appName')}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-10">
        {/* Hero Section */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-600/25">
            <Search size={28} className="text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {t('guest.tracking.heroTitle')}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t('guest.tracking.heroSubtitle')}
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mx-auto mb-8 max-w-lg">
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-xl shadow-slate-900/5 dark:shadow-slate-900/30">
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {t('guest.tracking.inputLabel')}
                </label>
                <input
                  ref={plateRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                  placeholder={t('guest.tracking.inputPlaceholder')}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3 text-base font-bold tracking-wider text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-500 placeholder:font-normal placeholder:tracking-normal transition-all focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 px-6 py-4 flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t('guest.tracking.searching')}
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    {t('guest.tracking.searchBtn')}
                  </>
                )}
              </button>
              {isSearched && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 active:scale-[0.98]"
                >
                  {t('guest.tracking.resetBtn')}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="mx-auto mb-8 max-w-lg animate-in fade-in">
            <div className="flex items-start gap-4 rounded-2xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-red-800">{error}</p>
                <p className="mt-1 text-xs font-medium text-red-600/70">
                  {t('guest.tracking.errorHint')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Session Result */}
        {session && (
          <div className="mx-auto max-w-lg space-y-5 animate-in slide-in-from-bottom-4 fade-in duration-500">
            {/* Status Banner */}
            <div className={`relative overflow-hidden rounded-2xl p-6 ${session.status === 'Active'
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-600/25'
              : session.status === 'Completed'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-600/25'
                : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl shadow-amber-600/25'
              }`}>
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-widest opacity-80">
                    {t('guest.tracking.statusLabel')}
                  </p>
                  <h2 className="text-2xl font-black">{statusInfo?.label}</h2>
                  {session.status === 'Active' && (
                    <p className="mt-1 text-sm font-medium opacity-90">
                      {t('guest.tracking.statusSafeNote')}
                    </p>
                  )}
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                  {statusInfo && <statusInfo.icon size={28} />}
                </div>
              </div>
            </div>

            {/* Session Info Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 shadow-lg shadow-slate-900/5 dark:shadow-slate-900/30">
              {/* Top decorative bar */}
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />

              <div className="p-6">
                {/* Session Code & Plate */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="mb-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      {t('guest.tracking.fieldSessionCode')}
                    </p>
                    <p className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                      {session.sessionCode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      {t('guest.tracking.fieldPlate')}
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5">
                      <VehicleIcon size={16} className="text-slate-500" />
                      <span className="text-base font-black tracking-wider text-slate-800 dark:text-slate-100">
                        {session.plateNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-3.5">
                  <InfoRow
                    icon={Car}
                    label={t('guest.tracking.fieldVehicleType')}
                    value={session.vehicleName}
                  />
                  <InfoRow
                    icon={MapPin}
                    label={t('guest.tracking.fieldLocation')}
                    value={`${session.location.building} → ${session.location.floor} → ${t('guest.tracking.locationZonePrefix')} ${session.location.zone} → ${session.location.slot}`}
                    highlight
                  />
                  <InfoRow
                    icon={Clock}
                    label={t('guest.tracking.fieldEntryTime')}
                    value={formatDateTime(session.entryTime)}
                  />
                  {session.exitTime && (
                    <InfoRow
                      icon={Clock}
                      label={t('guest.tracking.fieldExitTime')}
                      value={formatDateTime(session.exitTime)}
                    />
                  )}
                </div>
              </div>

              {/* Duration & Fee Section */}
              <div className="border-t border-slate-100 dark:border-slate-700 bg-gradient-to-b from-slate-50/80 dark:from-slate-800/80 to-white dark:to-slate-800 p-6">
                {/* Duration */}
                <div className="mb-5">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {t('guest.tracking.durationTitle')}
                  </p>
                  {session.status === 'Active' && displayDuration ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black tabular-nums text-slate-900 dark:text-white">
                        {String(displayDuration.hours).padStart(2, '0')}
                      </span>
                      <span className="text-lg font-bold text-slate-400">h</span>
                      <span className="text-4xl font-black tabular-nums text-slate-900 dark:text-white ml-1">
                        {String(displayDuration.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-lg font-bold text-slate-400">m</span>
                      {displayDuration.seconds !== undefined && (
                        <>
                          <span className="text-4xl font-black tabular-nums text-slate-900 dark:text-white ml-1">
                            {String(displayDuration.seconds).padStart(2, '0')}
                          </span>
                          <span className="text-lg font-bold text-slate-400">s</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-xl font-black text-slate-900 dark:text-white">
                      {session.duration?.text || '--'}
                    </p>
                  )}
                </div>

                {/* Fee */}
                <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-blue-400">
                        {currentFee?.isEstimated
                          ? t('guest.tracking.feeEstimated')
                          : t('guest.tracking.feeTotal')}
                      </p>
                      <p className="text-3xl font-black text-blue-700">
                        {currentFee?.formatted || session.fee?.formatted || '--'}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                      <CreditCard size={22} className="text-blue-600" />
                    </div>
                  </div>
                  {currentFee?.isEstimated && (
                    <p className="mt-2 text-[11px] font-medium text-blue-500">
                      {t('guest.tracking.feeEstimatedNote')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-500" />
              <p className="text-xs font-medium leading-relaxed text-slate-500">
                {t('guest.tracking.securityNote')}
              </p>
            </div>
          </div>
        )}

        {/* Empty State (before search) */}
        {!isSearched && !session && (
          <div className="mx-auto max-w-lg">
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700/50">
                <Car size={24} className="text-slate-400" />
              </div>
              <p className="font-bold text-slate-600 dark:text-slate-300">
                {t('guest.tracking.emptyTitle')}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-400">
                {t('guest.tracking.emptySubtitle')}
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 py-6 text-center">
        <p className="text-xs font-medium text-slate-400">
          © {new Date().getFullYear()} {t('guest.tracking.footerText')}
        </p>
      </footer>
    </div>
  )
}

const InfoRow = ({ icon: Icon, label, value, highlight = false }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-700/50">
      <Icon size={16} className="text-slate-400" />
    </div>
    <div className="min-w-0 flex-1 border-b border-dashed border-slate-100 dark:border-slate-700 pb-3.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${highlight ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
        {value}
      </p>
    </div>
  </div>
)

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(String(value).endsWith('Z') ? String(value).slice(0, -1) : value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export default GuestTracking