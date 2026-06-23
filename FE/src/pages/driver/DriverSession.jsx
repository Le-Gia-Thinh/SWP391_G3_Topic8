import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRightLeft,
  Car,
  Clock,
  CreditCard,
  Info,
  Loader2,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  Map
} from 'lucide-react'
import driverApi from '../../apis/driverApi'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

const parseBackendDate = (value) => {
  if (!value) return null

  if (value instanceof Date) return value

  let text = String(value)

  if (text.endsWith('Z')) {
    text = text.slice(0, -1)
  }

  const date = new Date(text)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

const formatDateTime = (value) => {
  const date = parseBackendDate(value)

  if (!date) return '--'

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatCurrency = (value) => {
  const number = Number(value || 0)
  return `${new Intl.NumberFormat('vi-VN').format(number)} VNĐ`
}

// getParkedDuration nhận t để i18n hoá chuỗi "X giờ Y phút Z giây"
const getParkedDuration = (entryTime, currentTime, t) => {
  const entry = parseBackendDate(entryTime)
  const now = currentTime || new Date()

  if (!entry) return '--'

  const diffSeconds = Math.max(
    0,
    Math.floor((now.getTime() - entry.getTime()) / 1000)
  )

  const hours = Math.floor(diffSeconds / 3600)
  const minutes = Math.floor((diffSeconds % 3600) / 60)
  const seconds = diffSeconds % 60

  return t('driver.session.duration', { h: hours, m: minutes, s: seconds })
}

const getProgress = (session, currentTime) => {
  const entry = parseBackendDate(session?.EntryTime)
  const now = currentTime || new Date()

  if (!entry) return 5

  const parkedMinutes = Math.max(
    0,
    Math.floor((now.getTime() - entry.getTime()) / 60000)
  )

  const defaultTotalMinutes = 240

  return Math.min(
    100,
    Math.max(5, Math.round((parkedMinutes / defaultTotalMinutes) * 100))
  )
}

// Trả về key i18n thay vì label cứng
const getSessionStatusKey = (status) => {
  const map = {
    Active: 'driver.session.statusActive',
    Completed: 'driver.session.statusCompleted',
    Cancelled: 'driver.session.statusCancelled',
    Pending: 'driver.session.statusPending'
  }

  return map[status] || 'driver.session.statusActive'
}

const getSessionTitle = (session) => {
  return session?.SessionCode || `SESS-${session?.SessionID || '--'}`
}

const getSessionSubTitle = (session, t) => {
  const plate = session?.PlateNumber || t('driver.session.noPlate')
  const slot = session?.SlotCode || t('driver.session.noSlot')
  return `${plate} • ${slot}`
}

const normalizeSessionRows = (response) => {
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response)) return response
  return []
}

const InfoRow = ({
  icon,
  label,
  value,
  valueClassName = 'font-semibold text-gray-800 dark:text-gray-200',
  border = true
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${border ? 'border-b border-gray-100 dark:border-slate-700/50 pb-2' : ''
        }`}
    >
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </div>

      <span className={`text-right ${valueClassName}`}>
        {value || '--'}
      </span>
    </div>
  )
}

const LocationCard = ({ label, value, active = false }) => {
  return (
    <div
      className={`rounded-xl border p-4 text-center transition-colors ${active
        ? 'border-blue-100 bg-blue-50/50'
        : 'border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 hover:border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
        }`}
    >
      <div
        className={`mb-1 text-xs font-semibold uppercase ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
          }`}
      >
        {label}
      </div>

      <div
        className={
          active
            ? 'text-xl font-black text-blue-600 dark:text-blue-400'
            : 'font-bold text-gray-800 dark:text-gray-200'
        }
      >
        {value || '--'}
      </div>
    </div>
  )
}

const SessionListItem = ({ session, active, onClick, currentTime }) => {
  const { t } = useTranslation()
  const parkedDuration = getParkedDuration(session.EntryTime, currentTime, t)

  return (
    <button
      type="button"
      onClick={() => onClick(session.SessionID)}
      className={`w-full rounded-xl border p-4 text-left transition-all ${active
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
        : 'border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 hover:border-blue-100 hover:bg-gray-50 dark:hover:bg-slate-800'
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div
            className={`font-black ${active ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'
              }`}
          >
            {getSessionTitle(session)}
          </div>

          <div className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
            {getSessionSubTitle(session, t)}
          </div>
        </div>

        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active
            ? 'bg-blue-600 text-white'
            : 'bg-emerald-50 text-emerald-600'
            }`}
        >
          {t(getSessionStatusKey(session.SessionStatus))}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
        <div>
          <div className="font-semibold text-gray-400">{t('driver.session.entryTime')}</div>
          <div className="font-bold text-gray-700 dark:text-gray-300">
            {formatDateTime(session.EntryTime)}
          </div>
        </div>

        <div>
          <div className="font-semibold text-gray-400">{t('driver.session.parkedDuration')}</div>
          <div className="font-bold text-blue-600 dark:text-blue-400">
            {parkedDuration}
          </div>
        </div>
      </div>
    </button>
  )
}

const SessionDetail = ({
  session,
  currentTime,
  onGoPayment,
  onGoReport,
  onViewMap
}) => {
  const { t } = useTranslation()
  const parkedDuration = useMemo(() => {
    return getParkedDuration(session.EntryTime, currentTime, t)
  }, [session.EntryTime, currentTime, t])

  const progress = useMemo(() => {
    return getProgress(session, currentTime)
  }, [session, currentTime])

  const totalAmount = Number(session.Amount || 0)

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 shadow-sm">
      <div className="border-b border-gray-100 dark:border-slate-700/50 bg-gray-50/60 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">
                {getSessionTitle(session)}
              </h2>

              <span className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                {t(getSessionStatusKey(session.SessionStatus))}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('driver.session.internalCode', { id: session.SessionID })}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onGoPayment(session.SessionID)}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700"
          >
            <CreditCard size={16} />
            {t('driver.session.pay')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className="rounded-xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-5">
            <div className="mb-4 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-blue-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">
                {t('driver.session.sectionInfo')}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 p-4 sm:grid-cols-2">
              <InfoRow
                label={t('driver.session.type')}
                value={session.BookingCode ? t('driver.session.typePrebooked') : t('driver.session.typeWalkin')}
              />

              <InfoRow
                label={t('driver.session.bookingCode')}
                value={session.BookingCode || t('driver.session.noBookingCode')}
                valueClassName="font-bold text-blue-600 dark:text-blue-400"
              />

              <InfoRow
                icon={<Clock size={16} />}
                label={t('driver.session.entryTime')}
                value={formatDateTime(session.EntryTime)}
              />

              <InfoRow
                label={t('driver.session.parkedDuration')}
                value={parkedDuration}
                valueClassName="font-bold text-blue-600 dark:text-blue-400"
                border={false}
              />
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-500 dark:text-gray-400">{t('driver.session.progress')}</span>
                <span className="text-blue-600 dark:text-blue-400">{progress}%</span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Car size={18} className="text-blue-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">
                {t('driver.session.sectionVehicle')}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <div className="flex h-24 items-center justify-center rounded-xl bg-gray-200/80 shadow-inner">
                  <span className="text-3xl font-black tracking-widest text-gray-800 dark:text-gray-200">
                    {session.PlateNumber || '--'}
                  </span>
                </div>
              </div>

              <div className="space-y-4 rounded-xl bg-gray-50 dark:bg-slate-900/50 p-4">
                <InfoRow
                  icon={<Car size={16} />}
                  label={t('driver.session.vehicleType')}
                  value={session.VehicleName || '--'}
                />

                <InfoRow
                  icon={<ShieldCheck size={16} />}
                  label={t('driver.session.vehicleCode')}
                  value={session.VehicleCode || session.VehicleTypeID || '--'}
                  border={false}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-blue-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {t('driver.session.sectionLocation')}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => onViewMap(session.SessionID)}
                className="flex w-fit items-center gap-2 rounded-lg border border-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:bg-blue-900/20"
              >
                <MapPin size={16} />
                {t('driver.session.viewMap')}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <LocationCard
                label={t('driver.session.building')}
                value={session.BuildingName}
              />

              <LocationCard
                label={t('driver.session.floor')}
                value={session.FloorName}
              />

              <LocationCard
                label={t('driver.session.zone')}
                value={session.ZoneName}
              />

              <LocationCard
                label={t('driver.session.slotCode')}
                value={session.SlotCode}
                active
              />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {t('driver.session.feeEstimate')}
              </h3>

              <span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                {session.PaymentStatus || 'Pending'}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('driver.session.feeParking')}</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('driver.session.feeOvertime')}</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">0 VNĐ</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('driver.session.feeOther')}</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">0 VNĐ</span>
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 dark:border-slate-700/50 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('driver.session.feeTotal')}
              </p>

              <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
                {formatCurrency(totalAmount)}
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => onGoPayment(session.SessionID)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700"
              >
                <CreditCard size={18} />
                {t('driver.session.payThisSession')}
              </button>

              <button
                type="button"
                onClick={() => onGoReport(session.SessionID)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                <AlertTriangle size={18} className="text-orange-500" />
                {t('driver.session.reportIncident')}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex gap-3 text-sm text-blue-800">
              <Info size={20} className="mt-0.5 shrink-0 text-blue-500" />

              <p>
                {t('driver.session.exitHint')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const DriverSession = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mapModal, setMapModal] = useState({ isOpen: false })

  const fetchCurrentSessions = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')

      const response = await driverApi.getCurrentSessions()
      const rows = normalizeSessionRows(response)

      setSessions(rows)

      if (rows.length > 0) {
        setSelectedSessionId((prev) => {
          const exists = rows.some((item) => String(item.SessionID) === String(prev))
          return exists ? prev : String(rows[0].SessionID)
        })
      } else {
        setSelectedSessionId('')
      }
    } catch (error) {
      console.error('Get current sessions failed:', error)

      const message =
        error.response?.data?.message ||
        t('driver.session.loadError')

      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrentSessions()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const selectedSession = useMemo(() => {
    return sessions.find((item) => String(item.SessionID) === String(selectedSessionId)) || sessions[0] || null
  }, [sessions, selectedSessionId])

  const handleGoPayment = (sessionId) => {
    navigate('/driver/payment', {
      state: { sessionId }
    })
  }

  const handleGoReport = (sessionId) => {
    navigate('/driver/report', {
      state: { sessionId }
    })
  }

  const handleViewMap = () => {
    setMapModal({ isOpen: true })
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-10 text-center shadow-sm">
        <div className="flex items-center justify-center gap-3 font-bold text-gray-700 dark:text-gray-300">
          <Loader2 size={20} className="animate-spin text-blue-600 dark:text-blue-400" />
          {t('driver.session.loading')}
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 dark:bg-red-900/20 p-10 text-center shadow-sm">
        <p className="font-bold text-red-600">
          {errorMessage}
        </p>

        <button
          type="button"
          onClick={fetchCurrentSessions}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          <RefreshCcw size={16} />
          {t('driver.session.retry')}
        </button>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span>{t('driver.session.breadcrumbSystem')}</span>
            <span>›</span>
            <span>{t('driver.session.breadcrumbSession')}</span>
          </div>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {t('driver.session.title')}
          </h1>
        </div>

        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            <Info size={26} />
          </div>

          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('driver.session.emptyTitle')}
          </h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('driver.session.emptyHint')}
          </p>

          <Button
            onClick={() => navigate('/driver/booking')}
            className="mt-5"
          >
            {t('driver.session.newBooking')}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          <span>{t('driver.session.breadcrumbSystem')}</span>
          <span>›</span>
          <span>{t('driver.session.breadcrumbSession')}</span>
        </div>

        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('driver.session.title')}
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('driver.session.subtitle', { count: sessions.length })}
            </p>
          </div>

          <button
            type="button"
            onClick={fetchCurrentSessions}
            className="flex w-fit items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <RefreshCcw size={16} />
            {t('driver.session.refresh')}
          </button>
        </div>
      </div>

      <div className="block lg:hidden">
        <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300">
          {t('driver.session.selectLabel')}
        </label>

        <select
          value={selectedSessionId}
          onChange={(event) => setSelectedSessionId(event.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        >
          {sessions.map((session) => (
            <option key={session.SessionID} value={String(session.SessionID)}>
              {getSessionTitle(session)} - {session.PlateNumber || t('driver.session.noPlate')} - {session.SlotCode || t('driver.session.noSlot')}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-4 rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">
                  {t('driver.session.listTitle')}
                </h2>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('driver.session.listHint')}
                </p>
              </div>

              <span className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                {sessions.length}
              </span>
            </div>

            <div className="max-h-[calc(100vh-260px)] space-y-3 overflow-y-auto pr-1">
              {sessions.map((session) => (
                <SessionListItem
                  key={session.SessionID}
                  session={session}
                  active={String(session.SessionID) === String(selectedSessionId)}
                  onClick={setSelectedSessionId}
                  currentTime={currentTime}
                />
              ))}
            </div>
          </div>
        </aside>

        <main>
          {selectedSession && (
            <SessionDetail
              session={selectedSession}
              currentTime={currentTime}
              onGoPayment={handleGoPayment}
              onGoReport={handleGoReport}
              onViewMap={handleViewMap}
            />
          )}
        </main>
      </div>

      <Modal
        isOpen={mapModal.isOpen}
        onClose={() => setMapModal({ isOpen: false })}
        title={t('driver.session.mapModalTitle')}
        maxWidth="max-w-2xl"
        footer={<Button onClick={() => setMapModal({ isOpen: false })}>{t('driver.session.close')}</Button>}
      >
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700">
          <Map className="w-24 h-24 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">{t('driver.session.mapDevTitle')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 max-w-sm">
            {t('driver.session.mapDevHint')} <span className="font-bold text-blue-600 dark:text-blue-400">{selectedSession?.SlotCode}</span>.
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default DriverSession