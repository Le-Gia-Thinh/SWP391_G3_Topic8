/**
 * FILE: StaffFeedback.jsx
 * MÔ TẢ: Trang Xem Đánh giá (Feedback) dành cho Staff.
 * Xem tổng quan điểm đánh giá và danh sách phản hồi từ khách hàng.
 */

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Star, MessageSquare, Car, MapPin, TrendingUp, Sparkles
} from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import relativeTime from 'dayjs/plugin/relativeTime'
import staffApi from '../../apis/staffApi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const StaffFeedback = () => {
  const { t } = useTranslation()
  const [summary, setSummary] = useState(null)
  const [feedbacks, setFeedbacks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true)
      const res = await staffApi.getFeedbackSummary()
      if (res.success) {
        setSummary(res.data.summary)
        setFeedbacks(res.data.feedbacks || [])
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách đánh giá:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filter === 'all') return true
    if (filter === 'positive') return f.Rating >= 4
    if (filter === 'negative') return f.Rating <= 3
    if (filter === 'with_comment') return !!f.Comment
    return true
  })

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-slate-100 dark:fill-slate-700 text-slate-200 dark:text-slate-600'
            }`}
          />
        ))}
      </div>
    )
  }

  if (isLoading && !summary) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {t('staff.feedback.title')}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold bg-linear-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
            {t('staff.feedback.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Cột trái: Thống kê tổng quan */}
        <div className="md:col-span-4 space-y-4">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="text-center">
                <p className="mb-2 text-sm font-bold uppercase tracking-widest text-slate-400">{t('staff.feedback.averageRating')}</p>
                <div className="flex items-center justify-center gap-3">
                  <h2 className="text-6xl font-black text-slate-900 dark:text-white">{summary?.averageRating?.toFixed(1) || '0.0'}</h2>
                  <Star className="h-10 w-10 fill-amber-400 text-amber-400" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t('staff.feedback.basedOn')} <span className="font-bold text-slate-900 dark:text-white">{summary?.totalFeedbacks}</span> {t('staff.feedback.ratingsCount')}
                </p>
              </div>

              <div className="mt-8 space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const percent = summary?.distribution?.[star] || 0
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex w-12 items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
                        {star} <Star size={14} className="fill-amber-400 text-amber-400" />
                      </div>
                      <div className="relative flex-1 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className={`absolute left-0 top-0 h-full rounded-full ${star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="w-10 text-right text-xs font-bold text-slate-500 dark:text-slate-400">
                        {percent}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
                  <TrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 dark:text-blue-100">{t('staff.feedback.overviewTitle')}</h3>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-blue-700/80 dark:text-blue-300/80">
                    {t('staff.feedback.overviewBody')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Danh sách đánh giá */}
        <div className="md:col-span-8">
          <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{t('staff.feedback.recentTitle')}</h3>

            <div className="min-w-[160px]">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/50"
              >
                <option value="all">{t('staff.feedback.filterAll')}</option>
                <option value="positive">{t('staff.feedback.filterPositive')}</option>
                <option value="negative">{t('staff.feedback.filterNegative')}</option>
                <option value="with_comment">{t('staff.feedback.filterWithComment')}</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredFeedbacks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-transparent p-12 text-center">
                <MessageSquare className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">{t('staff.feedback.emptyTitle')}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t('staff.feedback.emptyHint')}
                </p>
              </div>
            ) : (
              filteredFeedbacks.map((f, idx) => (
                <div key={f.RatingID || idx} className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-800 p-5 shadow-sm transition-colors hover:border-blue-200 dark:hover:border-blue-800">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 font-bold text-white">
                      {f.DriverName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{f.DriverName}</h4>
                          <div className="mt-1 flex items-center gap-3">
                            {renderStars(f.Rating)}
                            <span className="text-xs font-medium text-slate-400">
                              {dayjs(f.CreatedAt).fromNow()}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-1 sm:items-end">
                          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 px-2 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <Car size={14} />
                            {f.PlateNumber}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {f.SessionCode}
                          </span>
                        </div>
                      </div>

                      {f.Comment && (
                        <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-100 dark:border-slate-700/50">
                          <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 italic">
                            &quot;{f.Comment}&quot;
                          </p>
                        </div>
                      )}

                      {f.Tags && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {f.Tags.split(',').map((tag, i) => (
                            <span
                              key={i}
                              className="rounded-md border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffFeedback