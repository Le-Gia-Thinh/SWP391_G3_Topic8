import React, { useState, useEffect } from 'react'
import {
  Box, Typography, Card, Grid, LinearProgress, Chip, Avatar, Tooltip, Select, MenuItem, FormControl
} from '@mui/material'
import {
  Star, MessageSquare, Car, MapPin, User, Phone, CheckCircle2, TrendingUp, AlertCircle, Sparkles
} from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import relativeTime from 'dayjs/plugin/relativeTime'
import staffApi from '../../apis/staffApi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const StaffFeedback = () => {
  const [summary, setSummary] = useState(null)
  const [feedbacks, setFeedbacks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchFeedbacks()
  }, [])

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
            className={`${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-100 text-slate-200'
            }`}
          />
        ))}
      </div>
    )
  }

  if (isLoading && !summary) {
    return (
      <Box className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </Box>
    )
  }

  return (
    <Box className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Tổng hợp Đánh giá
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold bg-linear-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
            Xem và phân tích phản hồi từ tài xế về chất lượng dịch vụ
          </p>
        </div>
      </div>

      <Grid container spacing={4}>
        {/* Cột trái: Thống kê tổng quan */}
        <Grid item xs={12} md={4}>
          <div className="sticky top-6 space-y-4">
            <Card className="rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Điểm Trung Bình</p>
                <div className="flex items-center justify-center gap-3">
                  <h2 className="text-6xl font-black text-slate-900">{summary?.averageRating?.toFixed(1) || '0.0'}</h2>
                  <Star className="fill-amber-400 text-amber-400 h-10 w-10" />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-500">
                  Dựa trên <span className="font-bold text-slate-900">{summary?.totalFeedbacks}</span> lượt đánh giá
                </p>
              </div>

              <div className="mt-8 space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const percent = summary?.distribution?.[star] || 0
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex w-12 items-center gap-1 font-bold text-slate-600">
                        {star} <Star size={14} className="fill-amber-400 text-amber-400" />
                      </div>
                      <div className="relative flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 h-full rounded-full ${
                            star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="w-10 text-right text-xs font-bold text-slate-500">
                        {percent}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            <Card className="rounded-2xl border border-blue-100 bg-blue-50/50 shadow-sm p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">Góc nhìn Tổng quan</h3>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-blue-700/80">
                    Phần lớn khách hàng hài lòng với dịch vụ. Hãy tiếp tục duy trì chất lượng phục vụ và hỗ trợ tài xế nhé!
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Grid>

        {/* Cột phải: Danh sách đánh giá */}
        <Grid item xs={12} md={8}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Phản hồi gần đây</h3>
            
            <FormControl size="small" className="min-w-[160px]">
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl bg-white text-sm font-bold text-slate-700"
                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' } }}
              >
                <MenuItem value="all" className="font-medium text-sm">Tất cả đánh giá</MenuItem>
                <MenuItem value="positive" className="font-medium text-sm">Đánh giá tốt (4-5 sao)</MenuItem>
                <MenuItem value="negative" className="font-medium text-sm">Cần cải thiện (1-3 sao)</MenuItem>
                <MenuItem value="with_comment" className="font-medium text-sm">Có bình luận</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className="space-y-4">
            {filteredFeedbacks.length === 0 ? (
              <Card className="rounded-2xl border border-dashed border-slate-200 shadow-none p-12 text-center bg-transparent">
                <MessageSquare className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-base font-bold text-slate-700">Chưa có đánh giá nào</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Chưa có dữ liệu đánh giá phù hợp với bộ lọc hiện tại.
                </p>
              </Card>
            ) : (
              filteredFeedbacks.map((f, idx) => (
                <Card key={f.RatingID || idx} className="rounded-2xl border border-slate-200/60 shadow-sm p-5 hover:border-blue-200 transition-colors">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 font-bold">
                      {f.DriverName?.charAt(0) || 'U'}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900">{f.DriverName}</h4>
                          <div className="mt-1 flex items-center gap-3">
                            {renderStars(f.Rating)}
                            <span className="text-xs font-medium text-slate-400">
                              {dayjs(f.CreatedAt).fromNow()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <Chip 
                            size="small" 
                            icon={<Car size={14} />} 
                            label={f.PlateNumber} 
                            className="bg-slate-100 font-bold text-slate-600 rounded-lg"
                          />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {f.SessionCode}
                          </span>
                        </div>
                      </div>

                      {f.Comment && (
                        <div className="mt-4 rounded-xl bg-slate-50 p-4">
                          <p className="text-sm font-medium leading-relaxed text-slate-700 italic">
                            "{f.Comment}"
                          </p>
                        </div>
                      )}

                      {f.Tags && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {f.Tags.split(',').map((tag, i) => (
                            <Chip 
                              key={i} 
                              size="small" 
                              label={tag.trim()} 
                              className="bg-blue-50 text-blue-700 font-medium rounded-md text-xs border border-blue-100"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Grid>
      </Grid>
    </Box>
  )
}

export default StaffFeedback
