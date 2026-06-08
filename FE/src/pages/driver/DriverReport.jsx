import React, { useMemo, useState } from 'react'
import authorizeAxios from '../../utils/authorizeAxios'
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

const CURRENT_SESSION = {
  plateNumber: '51A-999.88',
  status: 'Đang đỗ',
  bookingCode: 'BK-2024-1029',
  sessionCode: 'B-1029',
  time: '12:45, 24/05/2024',
  type: 'Booking'
}

const DriverReport = () => {
  const [selectedIssue, setSelectedIssue] = useState('not_found')
  const [selectedSession, setSelectedSession] = useState('current')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState([
    { id: 1, name: 'Receipt.jpg' },
    { id: 2, name: 'Error.png' }
  ])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', title: '' })

  const selectedIssueData = useMemo(() => {
    return ISSUE_TYPES.find((issue) => issue.id === selectedIssue)
  }, [selectedIssue])

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) return

    const newFiles = files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name
    }))

    setAttachments((prev) => [...prev, ...newFiles])
    event.target.value = ''
  }

  const handleRemoveAttachment = (fileId) => {
    setAttachments((prev) => prev.filter((file) => file.id !== fileId))
  }

  const handleSubmit = async () => {
    const payload = {
      issueType: selectedIssue,
      issueLabel: selectedIssueData?.label,
      session: selectedSession,
      bookingCode: CURRENT_SESSION.bookingCode,
      plateNumber: CURRENT_SESSION.plateNumber,
      description,
      attachments
    }

    try {
      setIsSubmitting(true)
      await authorizeAxios.post('/driver/report', payload)
      setIsSubmitted(true)
      setAlertModal({ isOpen: true, title: 'Thành công', message: 'Báo cáo của bạn đã được gửi thành công.' })
    } catch (error) {
      console.error('Submit report failed:', error)
      setAlertModal({ isOpen: true, title: 'Lỗi', message: error.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedIssue('not_found')
    setSelectedSession('current')
    setDescription('')
    setAttachments([])
    setIsSubmitted(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Báo cáo sự cố
          </h1>

          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <span>🏢</span>
            <span>Tòa nhà Bitexco Financial Tower</span>
          </div>
        </div>

        {isSubmitted && (
          <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600">
            Báo cáo đã được gửi
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* A. Issue Type */}
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
                    className={`rounded-xl border p-3 text-sm font-semibold transition-colors ${active
                      ? 'border-blue-500 bg-blue-50/50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {issue.label}
                  </button>
                )
              })}
            </div>
          </SectionCard>

          {/* B. Session Information */}
          <SectionCard
            step="B"
            title="Thông tin phiên gửi xe liên quan"
            description="Chọn phiên hoặc đặt chỗ bị ảnh hưởng bởi sự cố này"
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Chọn phiên đỗ xe
                </label>

                <select
                  value={selectedSession}
                  onChange={(event) => setSelectedSession(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="current">
                    Phiên hiện tại ({CURRENT_SESSION.sessionCode} - {CURRENT_SESSION.plateNumber})
                  </option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xl text-blue-600">
                    🚗
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        {CURRENT_SESSION.plateNumber}
                      </span>

                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {CURRENT_SESSION.status}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      Mã đặt chỗ:{' '}
                      <span className="font-semibold text-gray-700">
                        {CURRENT_SESSION.bookingCode}
                      </span>
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-gray-500">
                      <span>⏰</span>
                      <span>{CURRENT_SESSION.time}</span>
                      <span className="mx-1">•</span>
                      <span>Loại: {CURRENT_SESSION.type}</span>
                    </div>
                  </div>
                </div>

                <Button variant="secondary" size="sm">
                  Thay đổi
                </Button>
              </div>
            </div>
          </SectionCard>

          {/* C. Description */}
          <SectionCard
            step="C"
            title="Mô tả sự cố"
            description="Cung cấp thêm chi tiết để chúng tôi có thể hỗ trợ bạn nhanh hơn"
          >
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Chi tiết vấn đề
              </label>

              <textarea
                rows={5}
                maxLength={1000}
                placeholder="Hãy mô tả vấn đề của bạn ở đây. Ví dụ: Tôi đã thanh toán nhưng cổng không mở, ứng dụng báo sai phí..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full resize-none rounded-xl border border-gray-200 p-4 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />

              <div className="mt-1 text-right text-xs text-gray-400">
                {description.length} / 1000 ký tự
              </div>
            </div>
          </SectionCard>

          {/* D. Attachments */}
          <SectionCard
            step="D"
            title="Hình ảnh đính kèm"
            description="Tải lên ảnh chụp bằng chứng như biên lai, màn hình lỗi hoặc vị trí xe"
          >
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/30">
              <input
                type="file"
                accept="image/png,image/jpeg"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-600">
                ⬆
              </div>

              <p className="mt-4 text-sm font-bold text-gray-700">
                Nhấn để tải lên tập tin
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Chấp nhận JPG, PNG. Tối đa 5MB mỗi tệp.
              </p>
            </label>

            {attachments.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="relative h-24 w-32 overflow-hidden rounded-xl border border-gray-200"
                  >
                    <div className="flex h-full w-full items-center justify-center bg-gray-200 px-2 text-center">
                      <span className="break-all text-xs text-gray-500">
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

            <p className="mt-4 text-xs italic text-gray-500">
              * Lưu ý: Hệ thống không hỗ trợ chụp ảnh trực tiếp qua camera tại bước này.
            </p>
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-blue-700">
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
                value="Phiên đỗ xe hiện tại"
              />

              <SummaryRow
                label="Mã đặt chỗ"
                value={CURRENT_SESSION.bookingCode}
              />

              <SummaryRow
                label="Biển số xe"
                value={CURRENT_SESSION.plateNumber}
              />

              <SummaryRow
                label="Mức độ đề xuất"
                value={selectedIssueData?.severity || 'Trung bình'}
                border
              />

              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-gray-800">
                  Trạng thái sau gửi:
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isSubmitted
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
                Báo cáo của bạn sẽ được gửi trực tiếp đến bộ phận vận hành tòa nhà.
                Thời gian phản hồi dự kiến từ 5-15 phút.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitted || isSubmitting}
                isLoading={isSubmitting}
                className="w-full"
              >
                {isSubmitted ? 'Đã gửi báo cáo' : 'Gửi báo cáo ngay'}
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

          {/* Support */}
          <Card className="bg-gray-50/80 p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
              Hỗ trợ kỹ thuật
            </h3>

            <div className="space-y-2">
              <SupportRow icon="☎" label="Hotline:" value="1900 88xx" />
              <SupportRow icon="✉" label="Email:" value="support@parkingsafe.com" />
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 text-[10px] font-semibold text-gray-400">
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
        <p className="text-gray-700">{alertModal.message}</p>
      </Modal>
    </div>
  )
}

const SectionCard = ({ step, title, description, children }) => {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-600">
          {step}
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {title}
          </h2>

          <p className="text-xs text-gray-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </Card>
  )
}

const SummaryRow = ({ label, value, border = false }) => {
  return (
    <div
      className={`flex items-center justify-between ${border ? 'border-b border-gray-100 pb-4' : ''
      }`}
    >
      <span className="text-gray-500">
        {label}
      </span>

      <span className="text-right font-semibold text-gray-800">
        {value}
      </span>
    </div>
  )
}

const SupportRow = ({ icon, label, value }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="text-gray-400">{icon}</span>
      <span className="font-medium">{label}</span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  )
}

export default DriverReport