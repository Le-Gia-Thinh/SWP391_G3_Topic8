import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import driverApi from '../../apis/driverApi'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

// Bỏ label/severity cứng, chỉ giữ id + severity raw (sẽ i18n hoá qua key)
const ISSUE_TYPES = [
  { id: 'not_found', severity: 'Trung bình' },
  { id: 'no_session', severity: 'Cao' },
  { id: 'wrong_fee', severity: 'Trung bình' },
  { id: 'no_vehicle', severity: 'Trung bình' },
  { id: 'occupied', severity: 'Cao' },
  { id: 'wrong_plate', severity: 'Trung bình' },
  { id: 'payment', severity: 'Cao' },
  { id: 'other', severity: 'Thấp' }
]

function getValue(obj, ...keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key]
  }

  return ''
}

function formatDateTime(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function normalizeAttachments(files) {
  return files.map((file) => ({
    id: `${file.name}-${file.lastModified}-${file.size}`,
    name: file.name,
    size: file.size,
    type: file.type
  }))
}

const DriverReport = () => {
  const { t } = useTranslation()
  const [selectedIssue, setSelectedIssue] = useState('not_found')
  const [selectedRelatedId, setSelectedRelatedId] = useState('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', title: '' })

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [context, setContext] = useState({
    currentSession: null,
    activeSessions: [],
    reservations: [],
    recentReports: []
  })

  const selectedIssueData = useMemo(() => {
    return ISSUE_TYPES.find((issue) => issue.id === selectedIssue)
  }, [selectedIssue])

  // Helper: lấy label i18n cho issue id
  const getIssueLabel = (id) => t(`driver.report.issues.${id}`)

  // Helper: lấy label trạng thái sự cố
  const getStatusLabel = (status) => {
    if (!status) return '—'
    return t(`driver.report.incidentStatus.${status}`, status)
  }

  const relatedOptions = useMemo(() => {
    const options = []

    const activeSessions = Array.isArray(context.activeSessions) && context.activeSessions.length > 0
      ? context.activeSessions
      : (context.currentSession ? [context.currentSession] : [])

    activeSessions.forEach((session) => {
      const sessionId = getValue(session, 'SessionID', 'sessionId')
      const code = getValue(session, 'SessionCode', 'sessionCode') || sessionId
      const plate = getValue(session, 'PlateNumber', 'plateNumber') || t('driver.report.noPlate')

      options.push({
        id: `session-${sessionId}`,
        kind: 'session',
        label: t('driver.report.relatedSession', { code, plate }),
        sessionId,
        reservationId: getValue(session, 'ReservationID', 'reservationId') || null,
        bookingCode: getValue(session, 'BookingCode', 'bookingCode') || '',
        plateNumber: getValue(session, 'PlateNumber', 'plateNumber') || '',
        vehicleName: getValue(session, 'VehicleName', 'vehicleName') || '',
        slotCode: getValue(session, 'SlotCode', 'slotCode') || '',
        buildingName: getValue(session, 'BuildingName', 'buildingName') || '',
        time: getValue(session, 'EntryTime', 'entryTime'),
        status: getValue(session, 'SessionStatus', 'sessionStatus') || 'Active',
        type: t('driver.report.relatedTypeSession')
      })
    })

    context.reservations.forEach((reservation) => {
      const status = getValue(reservation, 'ReservationStatus', 'reservationStatus')

      // Giữ lại các đặt chỗ đang Active, Reserved hoặc Pending (để báo cáo sự cố lúc chưa check-in)
      if (status !== 'Active' && status !== 'Reserved' && status !== 'Pending') return

      const reservationId = getValue(reservation, 'ReservationID', 'reservationId')

      if (!reservationId) return

      const code = getValue(reservation, 'BookingCode', 'bookingCode') || `BK-${reservationId}`
      const plate = getValue(reservation, 'PlateNumber', 'plateNumber') || t('driver.report.noPlate')

      options.push({
        id: `reservation-${reservationId}`,
        kind: 'reservation',
        label: t('driver.report.relatedReservation', { code, plate }),
        sessionId: getValue(reservation, 'SessionID', 'sessionId') || null,
        reservationId,
        bookingCode: getValue(reservation, 'BookingCode', 'bookingCode') || '',
        plateNumber: getValue(reservation, 'PlateNumber', 'plateNumber') || '',
        vehicleName: getValue(reservation, 'VehicleName', 'vehicleName') || '',
        slotCode: getValue(reservation, 'SlotCode', 'slotCode') || '',
        buildingName: getValue(reservation, 'BuildingName', 'buildingName') || '',
        time: getValue(reservation, 'StartTime', 'startTime', 'CreatedAt', 'createdAt'),
        status: getValue(reservation, 'ReservationStatus', 'reservationStatus'),
        type: t('driver.report.relatedTypeReservation')
      })
    })

    if (options.length === 0) {
      options.push({
        id: 'none',
        kind: 'none',
        label: t('driver.report.relatedNone'),
        sessionId: null,
        reservationId: null,
        bookingCode: '',
        plateNumber: '',
        vehicleName: '',
        slotCode: '',
        buildingName: '',
        time: '',
        status: '',
        type: t('driver.report.relatedTypeNoData')
      })
    }

    return options
  }, [context, t])

  const selectedRelated = useMemo(() => {
    return relatedOptions.find((item) => item.id === selectedRelatedId) || relatedOptions[0]
  }, [relatedOptions, selectedRelatedId])

  const loadReportContext = useCallback(async () => {
    setLoading(true)

    try {
      const response = await driverApi.getReportContext()

      setContext({
        currentSession: response.data?.currentSession || null,
        activeSessions: Array.isArray(response.data?.activeSessions) ? response.data.activeSessions : [],
        reservations: Array.isArray(response.data?.reservations) ? response.data.reservations : [],
        recentReports: Array.isArray(response.data?.recentReports) ? response.data.recentReports : []
      })
    } catch {
      // authorizeAxios đã toast lỗi
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReportContext()
  }, [loadReportContext])

  useEffect(() => {
    if (!selectedRelatedId && relatedOptions.length > 0) {
      setSelectedRelatedId(relatedOptions[0].id)
      return
    }

    const exists = relatedOptions.some((item) => item.id === selectedRelatedId)

    if (!exists && relatedOptions.length > 0) {
      setSelectedRelatedId(relatedOptions[0].id)
    }
  }, [relatedOptions, selectedRelatedId])

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) return

    const invalidFile = files.find((file) => {
      const validType = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)
      const validSize = file.size <= 5 * 1024 * 1024

      return !validType || !validSize
    })

    if (invalidFile) {
      toast.error(t('driver.report.attachInvalid'))
      event.target.value = ''
      return
    }

    const nextFiles = normalizeAttachments(files)

    setAttachments((prev) => {
      const merged = [...prev, ...nextFiles]
      return merged.slice(0, 5)
    })

    event.target.value = ''
  }

  const handleRemoveAttachment = (fileId) => {
    setAttachments((prev) => prev.filter((file) => file.id !== fileId))
  }

  const handleSubmit = async () => {
    if (!selectedIssue) {
      toast.error(t('driver.report.validateType'))
      return
    }

    if (!description.trim() || description.trim().length < 5) {
      toast.error(t('driver.report.validateDesc'))
      return
    }

    const payload = {
      issueType: selectedIssue,
      issueLabel: getIssueLabel(selectedIssue),
      sessionId: selectedRelated?.kind === 'session' ? selectedRelated.sessionId : selectedRelated?.sessionId || null,
      reservationId: selectedRelated?.kind === 'reservation' ? selectedRelated.reservationId : selectedRelated?.reservationId || null,
      bookingCode: selectedRelated?.bookingCode || '',
      plateNumber: selectedRelated?.plateNumber || '',
      description: description.trim(),
      attachments
    }

    setSubmitting(true)

    try {
      const response = await driverApi.createReport(payload)

      toast.success(response.message || t('driver.report.submitSuccess'))
      setIsSubmitted(true)
      setDescription('')
      setAttachments([])

      await loadReportContext()
    } catch {
      // authorizeAxios đã toast lỗi
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedIssue('not_found')
    setDescription('')
    setAttachments([])
    setIsSubmitted(false)

    if (relatedOptions.length > 0) {
      setSelectedRelatedId(relatedOptions[0].id)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="rounded-2xl bg-white dark:bg-slate-800 px-6 py-4 text-sm font-bold text-gray-600 dark:text-gray-400 shadow-sm">
          {t('driver.report.loading')}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('driver.report.title')}
          </h1>

          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>🏢</span>
            <span>{selectedRelated?.buildingName || t('driver.report.defaultBuilding')}</span>
          </div>
        </div>

        {isSubmitted && (
          <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600">
            {t('driver.report.submittedBadge')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            step="A"
            title={t('driver.report.issuesTitle')}
            description={t('driver.report.issuesDesc')}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              {ISSUE_TYPES.map((issue) => {
                const active = selectedIssue === issue.id

                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => setSelectedIssue(issue.id)}
                    className={`rounded-xl border p-3 text-sm font-semibold transition-colors ${active
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    {getIssueLabel(issue.id)}
                  </button>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard
            step="B"
            title={t('driver.report.relatedTitle')}
            description={t('driver.report.relatedDesc')}
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('driver.report.relatedLabel')}
                </label>

                <select
                  value={selectedRelatedId}
                  onChange={(event) => setSelectedRelatedId(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  {relatedOptions.map((option) => (
                    <option key={option.id} value={option.id} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-slate-700 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-xl text-blue-600 dark:text-blue-400">
                    🚗
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedRelated?.plateNumber || t('driver.report.noPlate')}
                      </span>

                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {getStatusLabel(selectedRelated?.status)}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('driver.report.bookingCode')}{' '}
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {selectedRelated?.bookingCode || t('driver.report.noCode')}
                      </span>
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>⏰</span>
                      <span>{formatDateTime(selectedRelated?.time)}</span>
                      <span className="mx-1">•</span>
                      <span>{t('driver.report.type')} {selectedRelated?.type || '—'}</span>
                      {selectedRelated?.slotCode && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{t('driver.report.slot')} {selectedRelated.slotCode}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadReportContext}
                  className="w-fit rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  {t('driver.report.refresh')}
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            step="C"
            title={t('driver.report.descTitle')}
            description={t('driver.report.descSub')}
          >
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('driver.report.descLabel')}
              </label>

              <textarea
                rows={5}
                maxLength={1000}
                placeholder={t('driver.report.descPlaceholder')}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full resize-none rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <div className="mt-1 text-right text-xs text-gray-400">
                {t('driver.report.descCount', { n: description.length })}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            step="D"
            title={t('driver.report.attachTitle')}
            description={t('driver.report.attachSub')}
          >
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/50 p-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/30">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-600 dark:text-blue-400">
                ⬆
              </div>

              <p className="mt-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                {t('driver.report.attachClick')}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('driver.report.attachHint')}
              </p>
            </label>

            {attachments.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="relative h-24 w-32 overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700"
                  >
                    <div className="flex h-full w-full items-center justify-center bg-gray-200 px-2 text-center">
                      <span className="break-all text-xs text-gray-500 dark:text-gray-400">
                        {file.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(file.id)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-xs text-white hover:bg-black/70"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs italic text-gray-500 dark:text-gray-400">
              {t('driver.report.attachNote')}
            </p>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 dark:border-slate-700/50 pb-4">
              <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {t('driver.report.summaryTitle')}
              </h2>

              <span className="rounded bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
                {t('driver.report.summaryBadge')}
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <SummaryRow
                label={t('driver.report.sumIssueType')}
                value={selectedIssueData ? getIssueLabel(selectedIssueData.id) : t('driver.report.sumNotSelected')}
              />

              <SummaryRow
                label={t('driver.report.sumRelated')}
                value={selectedRelated?.type || t('driver.report.sumNone')}
              />

              <SummaryRow
                label={t('driver.report.sumCode')}
                value={selectedRelated?.bookingCode || t('driver.report.sumNone')}
              />

              <SummaryRow
                label={t('driver.report.sumPlate')}
                value={selectedRelated?.plateNumber || t('driver.report.sumNoPlate')}
              />

              <SummaryRow
                label={t('driver.report.sumPriority')}
                value={selectedIssueData ? t(`driver.report.severity.${selectedIssueData.severity}`) : t('driver.report.sumPriorityDefault')}
                border
              />

              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {t('driver.report.sumStatusAfter')}
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isSubmitted
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-orange-100 text-orange-600'
                    }`}
                >
                  {isSubmitted ? t('driver.report.sumSent') : t('driver.report.sumWaiting')}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3 rounded-xl bg-blue-50/50 p-4 text-sm text-blue-800">
              <span className="mt-0.5 shrink-0">ℹ️</span>

              <p className="text-xs leading-relaxed">
                {t('driver.report.infoHint')}
              </p>
            </div>

            {selectedRelated?.kind === 'none' && (
              <div className="mt-4 flex gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <p className="text-xs font-semibold leading-relaxed">
                  {t('driver.report.noneWarning')}
                </p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={submitting || selectedRelated?.kind === 'none'}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors ${submitting || selectedRelated?.kind === 'none'
                    ? 'cursor-not-allowed bg-blue-400 opacity-70'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                <span>➤</span>
                {submitting ? t('driver.report.submitting') : t('driver.report.submit')}
              </Button>

              <Button
                onClick={handleCancel}
                variant="secondary"
                className="w-full"
              >
                {t('driver.report.cancel')}
              </Button>
            </div>
          </Card>

          <div className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-gray-50/80 p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('driver.report.recentTitle')}
            </h3>

            {context.recentReports.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('driver.report.recentEmpty')}
              </p>
            ) : (
              <div className="space-y-3">
                {context.recentReports.slice(0, 5).map((report) => (
                  <div
                    key={report.IncidentID}
                    className="rounded-xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {report.ReportCode || `RP-${report.IncidentID}`}
                      </span>

                      <span className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        {getStatusLabel(report.IncidentStatus)}
                      </span>
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {report.Description || t('driver.report.recentNoDesc')}
                    </p>

                    <p className="mt-2 text-[10px] text-gray-400">
                      {formatDateTime(report.CreatedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Card className="bg-gray-50/80 p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('driver.report.supportTitle')}
            </h3>

            <div className="space-y-2">
              <SupportRow icon="☎" label={t('driver.report.supportHotline')} value="1900 88xx" />
              <SupportRow icon="✉" label={t('driver.report.supportEmail')} value="support@parkingsafe.com" />
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-slate-700 pt-4 text-[10px] font-semibold text-gray-400">
              <span>{t('driver.report.versionInfo')}</span>
              <span>{t('driver.report.copyright')}</span>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '', title: '' })}
        title={alertModal.title}
        footer={<Button variant="primary" onClick={() => setAlertModal({ isOpen: false, message: '', title: '' })}>{t('driver.report.close')}</Button>}
      >
        <p className="text-gray-700 dark:text-gray-300">{alertModal.message}</p>
      </Modal>
    </div>
  )
}

const SectionCard = ({ step, title, description, children }) => {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-600 dark:text-blue-400">
          {step}
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h2>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>

      {children}
    </Card>
  )
}

const SummaryRow = ({ label, value, border }) => {
  return (
    <div className={`flex items-center justify-between gap-4 ${border ? 'border-b border-gray-100 dark:border-slate-700/50 pb-4' : ''}`}>
      <span className="text-gray-500 dark:text-gray-400">
        {label}
      </span>

      <span className="text-right font-bold text-gray-900 dark:text-white">
        {value}
      </span>
    </div>
  )
}

const SupportRow = ({ icon, label, value }) => {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{icon}</span>

      <span className="font-semibold text-gray-500 dark:text-gray-400">
        {label}
      </span>

      <span className="font-bold text-gray-900 dark:text-white">
        {value}
      </span>
    </div>
  )
}

export default DriverReport