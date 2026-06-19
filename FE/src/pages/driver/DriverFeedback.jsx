import React, { useCallback, useEffect, useState } from 'react'
import {
  Star,
  MessageSquare,
  Loader2,
  AlertCircle,
  Send,
  X,
  Clock,
  MapPin,
  ThumbsUp,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'react-toastify'
import driverApi from '../../apis/driverApi'

const QUICK_TAGS = [
  'Sạch sẽ',
  'Dễ tìm',
  'Nhân viên thân thiện',
  'Giá hợp lý',
  'An ninh tốt',
  'Thuận tiện'
]

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(String(value).endsWith('Z') ? String(value).slice(0, -1) : value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatCurrency(value) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VNĐ`
}

const StarRating = ({ rating, size = 20, interactive = false, onChange }) => {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = interactive ? star <= (hovered || rating) : star <= rating

        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={`transition-transform ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
          >
            <Star
              size={size}
              className={filled ? 'text-amber-400' : 'text-gray-300'}
              fill={filled ? 'currentColor' : 'none'}
            />
          </button>
        )
      })}
    </div>
  )
}

const DriverFeedback = () => {
  const [unratedSessions, setUnratedSessions] = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [ratingForm, setRatingForm] = useState(null) // { sessionId, ... }
  const [formRating, setFormRating] = useState(0)
  const [formComment, setFormComment] = useState('')
  const [formTags, setFormTags] = useState([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [unratedResult, ratingsResult] = await Promise.allSettled([
        driverApi.getUnratedSessions(),
        driverApi.getDriverRatings()
      ])

      if (unratedResult.status === 'fulfilled') {
        setUnratedSessions(unratedResult.value?.data || [])
      }
      if (ratingsResult.status === 'fulfilled') {
        setRatings(ratingsResult.value?.data || [])
      }
    } catch {
      toast.error('Không thể tải dữ liệu đánh giá.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openRatingForm = (session) => {
    setRatingForm(session)
    setFormRating(0)
    setFormComment('')
    setFormTags([])
  }

  const closeRatingForm = () => {
    setRatingForm(null)
    setFormRating(0)
    setFormComment('')
    setFormTags([])
  }

  const toggleTag = (tag) => {
    setFormTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmitRating = async () => {
    if (!formRating || formRating < 1) {
      toast.error('Vui lòng chọn số sao đánh giá.')
      return
    }

    setSubmitting(true)
    try {
      await driverApi.createRating({
        sessionId: ratingForm.SessionID,
        rating: formRating,
        comment: formComment.trim() || null,
        tags: formTags.length > 0 ? formTags : null
      })
      toast.success('Cảm ơn bạn đã đánh giá dịch vụ!')
      closeRatingForm()
      fetchData()
    } catch {
      // authorizeAxios đã toast lỗi
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400 shadow-sm">
          <Loader2 size={20} className="animate-spin text-blue-600 dark:text-blue-400" />
          Đang tải đánh giá...
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đánh giá dịch vụ</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Chia sẻ trải nghiệm của bạn để chúng tôi cải thiện dịch vụ.</p>
      </section>

      {/* Rating Modal */}
      {ratingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Đánh giá phiên gửi xe</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Biển số: {ratingForm.PlateNumber}</p>
              </div>
              <button onClick={closeRatingForm} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 transition">
                <X size={20} />
              </button>
            </div>

            {/* Session Info */}
            <div className="rounded-xl bg-gray-50 dark:bg-slate-900/50 p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><MapPin size={14} /> Vị trí</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{ratingForm.SlotCode} — {ratingForm.BuildingName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Clock size={14} /> Thời gian</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{formatDateTime(ratingForm.EntryTime)} → {formatDateTime(ratingForm.ExitTime)}</span>
              </div>
            </div>

            {/* Stars */}
            <div className="flex flex-col items-center mb-6">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Bạn đánh giá bao nhiêu sao?</p>
              <StarRating rating={formRating} size={36} interactive onChange={setFormRating} />
              <p className="mt-2 text-xs text-gray-400">
                {formRating === 0 && 'Chọn số sao'}
                {formRating === 1 && 'Rất tệ 😞'}
                {formRating === 2 && 'Tệ 😕'}
                {formRating === 3 && 'Bình thường 😐'}
                {formRating === 4 && 'Tốt 😊'}
                {formRating === 5 && 'Tuyệt vời! 🤩'}
              </p>
            </div>

            {/* Quick Tags */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Gắn thẻ nhanh</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                      formTags.includes(tag)
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                        : 'bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:bg-blue-900/20 hover:text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Bình luận (tùy chọn)</label>
              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                placeholder="Chia sẻ thêm về trải nghiệm của bạn..."
                maxLength={500}
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white transition focus:border-blue-500 focus:bg-white dark:bg-slate-800 focus:outline-none resize-none"
              />
              <p className="mt-1 text-right text-xs text-gray-400">{formComment.length}/500</p>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <button
                onClick={closeRatingForm}
                className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitRating}
                disabled={submitting || formRating < 1}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unrated Sessions */}
      <section>
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-500">
            <Star size={18} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Phiên chưa đánh giá</h2>
          {unratedSessions.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
              {unratedSessions.length}
            </span>
          )}
        </div>

        {unratedSessions.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/50 py-12 text-center">
            <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-400" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Tuyệt vời!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Bạn đã đánh giá tất cả các phiên gửi xe.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unratedSessions.map((session) => (
              <div
                key={session.SessionID}
                className="flex flex-col gap-4 rounded-2xl border border-amber-100 bg-amber-50/30 p-5 transition hover:shadow-md md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-amber-600 shadow-sm">
                    <Clock size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{session.PlateNumber}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {session.SlotCode} — {session.BuildingName || '—'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDateTime(session.EntryTime)} → {formatDateTime(session.ExitTime)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openRatingForm(session)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/200 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-200 transition hover:bg-amber-600 active:scale-95"
                >
                  <Star size={16} />
                  Đánh giá ngay
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past Ratings */}
      <section>
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
            <MessageSquare size={18} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Đánh giá đã gửi</h2>
        </div>

        {ratings.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/50 py-12 text-center">
            <ThumbsUp size={32} className="mx-auto mb-3 text-gray-300" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Chưa có đánh giá</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Đánh giá sau mỗi phiên gửi xe để giúp cải thiện dịch vụ.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((item) => (
              <div
                key={item.RatingID}
                className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Star size={20} fill="currentColor" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <StarRating rating={item.Rating} size={16} />
                        <span className="text-xs font-bold text-gray-400">{formatDateTime(item.CreatedAt)}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{item.PlateNumber}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.SlotCode} — {item.BuildingName || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {item.Tags && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.Tags.split(', ').map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {item.Comment && (
                  <p className="mt-3 rounded-xl bg-gray-50 dark:bg-slate-900/50 p-3 text-sm text-gray-600 dark:text-gray-400 italic">
                    &quot;{item.Comment}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default DriverFeedback
