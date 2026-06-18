import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import driverApi from '../../apis/driverApi'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'

const ISSUE_TYPES = [
  { id: 'not_found', label: 'Không tìm thấy đặt chỗ', severity: 'Trung bình' },
  { id: 'no_session', label: 'Không thấy phiên hoạt động', severity: 'Cao' },
  { id: 'wrong_fee', label: 'Sai mức phí', severity: 'Trung bình' },
  { id: 'no_vehicle', label: 'Không tìm thấy phương tiện', severity: 'Trung bình' },
  { id: 'occupied', label: 'Vị trí đã bị chiếm', severity: 'Cao' },
  { id: 'wrong_plate', label: 'Sai biển số xe', severity: 'Trung bình' },
  { id: 'payment', label: 'Vấn đề thanh toán', severity: 'Cao' },
  { id: 'other', label: 'Vấn đề khác', severity: 'Thấp' }
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

function getStatusLabel(status) {
  const map = {
    Active: 'Đang đỗ',
    Completed: 'Đã hoàn tất',
    Reserved: 'Đã đặt',
    Expired: 'Hết hạn',
    Cancelled: 'Đã hủy',
    Open: 'Đang mở',
    InProgress: 'Đang xử lý',
    Resolved: 'Đã xử lý'
  }

  return map[status] || status || '—'
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
    reservations: [],
    recentReports: []
  })

  const selectedIssueData = useMemo(() => {
    return ISSUE_TYPES.find((issue) => issue.id === selectedIssue)
  }, [selectedIssue])

  const relatedOptions = useMemo(() => {
    const options = []

    const currentSession = context.currentSession

    if (currentSession) {
      const sessionId = getValue(currentSession, 'SessionID', 'sessionId')

      options.push({
        id: `session-${sessionId}`,
        kind: 'session',
        label: `Phiên hiện tại (${getValue(currentSession, 'SessionCode', 'sessionCode') || sessionId} - ${getValue(currentSession, 'PlateNumber', 'plateNumber') || 'Chưa có biển số'})`,
        sessionId,
        reservationId: getValue(currentSession, 'ReservationID', 'reservationId') || null,
        bookingCode: getValue(currentSession, 'BookingCode', 'bookingCode') || '',
        plateNumber: getValue(currentSession, 'PlateNumber', 'plateNumber') || '',
        vehicleName: getValue(currentSession, 'VehicleName', 'vehicleName') || '',
        slotCode: getValue(currentSession, 'SlotCode', 'slotCode') || '',
        buildingName: getValue(currentSession, 'BuildingName', 'buildingName') || '',
        time: getValue(currentSession, 'EntryTime', 'entryTime'),
        status: getValue(currentSession, 'SessionStatus', 'sessionStatus') || 'Active',
        type: 'Phiên gửi xe hiện tại'
      })
    }

    context.reservations.forEach((reservation) => {
      const reservationId = getValue(reservation, 'ReservationID', 'reservationId')

      if (!reservationId) return

      options.push({
        id: `reservation-${reservationId}`,
        kind: 'reservation',
        label: `${getValue(reservation, 'BookingCode', 'bookingCode') || `BK-${reservationId}`} - ${getValue(reservation, 'PlateNumber', 'plateNumber') || 'Chưa check-in'}`,
        sessionId: getValue(reservation, 'SessionID', 'sessionId') || null,
        reservationId,
        bookingCode: getValue(reservation, 'BookingCode', 'bookingCode') || '',
        plateNumber: getValue(reservation, 'PlateNumber', 'plateNumber') || '',
        vehicleName: getValue(reservation, 'VehicleName', 'vehicleName') || '',
        slotCode: getValue(reservation, 'SlotCode', 'slotCode') || '',
        buildingName: getValue(reservation, 'BuildingName', 'buildingName') || '',
        time: getValue(reservation, 'StartTime', 'startTime', 'CreatedAt', 'createdAt'),
        status: getValue(reservation, 'ReservationStatus', 'reservationStatus'),
        type: 'Đặt chỗ'
      })
    })

    if (options.length === 0) {
      options.push({
        id: 'none',
        kind: 'none',
        label: 'Không có phiên/đặt chỗ liên quan',
        sessionId: null,
        reservationId: null,
        bookingCode: '',
        plateNumber: '',
        vehicleName: '',
        slotCode: '',
        buildingName: '',
        time: '',
        status: '',
        type: 'Không có dữ liệu liên quan'
      })
    }

    return options
  }, [context])

  const selectedRelated = useMemo(() => {
    return relatedOptions.find((item) => item.id === selectedRelatedId) || relatedOptions[0]
  }, [relatedOptions, selectedRelatedId])

  const loadReportContext = useCallback(async () => {
    setLoading(true)

    try {
      const response = await driverApi.getReportContext()

      setContext({
        currentSession: response.data?.currentSession || null,
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
      toast.error('Chỉ chấp nhận ảnh JPG/PNG và mỗi file tối đa 5MB.')
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
      toast.error('Vui lòng chọn loại sự cố.')
      return
    }

    if (!description.trim() || description.trim().length < 5) {
      toast.error('Vui lòng mô tả sự cố rõ hơn, tối thiểu 5 ký tự.')
      return
    }

    const payload = {
      issueType: selectedIssue,
      issueLabel: selectedIssueData?.label || '',
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

      toast.success(response.message || 'Gửi báo cáo sự cố thành công.')
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
          Đang tải dữ liệu báo cáo...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Báo cáo sự cố
          </h1>

          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>🏢</span>
            <span>{selectedRelated?.buildingName || 'Tòa nhà đang sử dụng'}</span>
          </div>
        </div>

        {isSubmitted && (
          <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600">
            Báo cáo đã được gửi
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard
            step="A"
            title="Chọn loại sự cố"
            description="Vui lòng chọn danh mục phù hợp nhất với vấn đề bạn đang gặp phải"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              {ISSUE_TYPES.map((issue) => {
                const active = selectedIssue === issue.id

                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => setSelectedIssue(issue.id)}
                    className={`rounded-xl border p-3 text-sm font-semibold transition-colors ${
                      active
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {issue.label}
                  </button>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard
            step="B"
            title="Thông tin phiên gửi xe liên quan"
            description="Chọn phiên hoặc đặt chỗ bị ảnh hưởng bởi sự cố này"
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Chọn phiên đỗ xe
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
                        {selectedRelated?.plateNumber || 'Chưa có biển số'}
                      </span>

                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {getStatusLabel(selectedRelated?.status)}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Mã đặt chỗ:{' '}
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {selectedRelated?.bookingCode || 'Không có'}
                      </span>
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>⏰</span>
                      <span>{formatDateTime(selectedRelated?.time)}</span>
                      <span className="mx-1">•</span>
                      <span>Loại: {selectedRelated?.type || '—'}</span>
                      {selectedRelated?.slotCode && (
                        <>
                          <span className="mx-1">•</span>
                          <span>Vị trí: {selectedRelated.slotCode}</span>
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
                  Làm mới
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            step="C"
            title="Mô tả sự cố"
            description="Cung cấp thêm chi tiết để chúng tôi có thể hỗ trợ bạn nhanh hơn"
          >
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Chi tiết vấn đề
              </label>

              <textarea
                rows={5}
                maxLength={1000}
                placeholder="Hãy mô tả vấn đề của bạn ở đây. Ví dụ: Tôi đã thanh toán nhưng cổng không mở, ứng dụng báo sai phí..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full resize-none rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <div className="mt-1 text-right text-xs text-gray-400">
                {description.length} / 1000 ký tự
              </div>
            </div>
          </SectionCard>

          <SectionCard
            step="D"
            title="Hình ảnh đính kèm"
            description="Tải lên ảnh chụp bằng chứng như biên lai, màn hình lỗi hoặc vị trí xe"
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
                Nhấn để chọn tập tin
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Chấp nhận JPG, PNG. Tối đa 5MB mỗi tệp. Tối đa 5 tệp.
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
              * Hiện tại hệ thống lưu tên file đính kèm vào database. Nếu muốn upload ảnh thật, cần thêm API upload file riêng.
            </p>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 dark:border-slate-700/50 pb-4">
              <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400">
                Tóm tắt báo cáo
              </h2>

              <span className="rounded bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
                Section 5
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <SummaryRow
                label="Loại sự cố"
                value={selectedIssueData?.label || 'Chưa chọn'}
              />

              <SummaryRow
                label="Liên quan"
                value={selectedRelated?.type || 'Không có'}
              />

              <SummaryRow
                label="Mã đặt chỗ"
                value={selectedRelated?.bookingCode || 'Không có'}
              />

              <SummaryRow
                label="Biển số xe"
                value={selectedRelated?.plateNumber || 'Chưa có'}
              />

              <SummaryRow
                label="Mức độ đề xuất"
                value={selectedIssueData?.severity || 'Trung bình'}
                border
              />

              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  Trạng thái sau gửi:
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    isSubmitted
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {isSubmitted ? 'Đã gửi' : 'Đang chờ'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3 rounded-xl bg-blue-50/50 p-4 text-sm text-blue-800">
              <span className="mt-0.5 shrink-0">ℹ️</span>

              <p className="text-xs leading-relaxed">
                Báo cáo của bạn sẽ được lưu vào database và gửi đến bộ phận vận hành.
                Trạng thái ban đầu là Open.
              </p>
            </div>

            {selectedRelated?.kind === 'none' && (
              <div className="mt-4 flex gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <p className="text-xs font-semibold leading-relaxed">
                  Bạn cần có ít nhất một phương tiện đang đỗ (phiên hoạt động) hoặc một đặt chỗ để có thể gửi báo cáo sự cố.
                </p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={submitting || selectedRelated?.kind === 'none'}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors ${
                  submitting || selectedRelated?.kind === 'none'
                    ? 'cursor-not-allowed bg-blue-400 opacity-70'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <span>➤</span>
                {submitting ? 'Đang gửi...' : 'Gửi báo cáo ngay'}
              </Button>

              <Button
                onClick={handleCancel}
                variant="secondary"
                className="w-full"
              >
                Hủy bỏ
              </Button>
            </div>
          </Card>

          <div className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-gray-50/80 p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Báo cáo gần đây
            </h3>

            {context.recentReports.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bạn chưa có báo cáo nào.
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
                      {report.Description || 'Không có mô tả'}
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
              Hỗ trợ kỹ thuật
            </h3>

            <div className="space-y-2">
              <SupportRow icon="☎" label="Hotline:" value="1900 88xx" />
              <SupportRow icon="✉" label="Email:" value="support@parkingsafe.com" />
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-slate-700 pt-4 text-[10px] font-semibold text-gray-400">
              <span>PHIÊN BẢN HỆ THỐNG 2.4.0-RELEASE</span>
              <span>© 2026 PARKINGSAFE INC.</span>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '', title: '' })}
        title={alertModal.title}
        footer={<Button variant="primary" onClick={() => setAlertModal({ isOpen: false, message: '', title: '' })}>Đóng</Button>}
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