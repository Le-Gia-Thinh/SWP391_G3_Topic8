import React, { useState, useEffect } from 'react'
import { AlertTriangle, Filter, Search, SearchX, CheckCircle, Clock, ShieldAlert } from 'lucide-react'

const INCIDENT_DATA = [
  { id: 'INC-20240524-01', title: 'Khách hàng báo mất thẻ từ', type: 'Mất thẻ', location: 'Gate 1', time: '10:15 AM', status: 'pending', severity: 'medium', reporter: 'Nguyễn Văn A' },
  { id: 'INC-20240524-02', title: 'Barrier Gate 3 không mở', type: 'Lỗi phần cứng', location: 'Gate 3', time: '09:30 AM', status: 'resolved', severity: 'high', reporter: 'Trần Thị B' },
  { id: 'INC-20240524-03', title: 'Phát hiện va quẹt xe', type: 'Tai nạn', location: 'Tầng B2, Slot A15', time: '08:45 AM', status: 'processing', severity: 'high', reporter: 'Lê Văn C' },
  { id: 'INC-20240524-04', title: 'Hệ thống nhận diện biển số lỗi', type: 'Lỗi AI', location: 'Gate 2', time: 'Hôm qua', status: 'resolved', severity: 'medium', reporter: 'Hệ thống' },
  { id: 'INC-20240525-01', title: 'Xe đỗ sai quy định', type: 'Vi phạm', location: 'Tầng 1, Khu A', time: '07:20 AM', status: 'pending', severity: 'low', reporter: 'Bảo vệ ca sáng' },
  { id: 'INC-20240525-02', title: 'Cúp điện đột ngột khu B', type: 'Sự cố điện', location: 'Tầng Trệt', time: '08:00 AM', status: 'processing', severity: 'high', reporter: 'Hệ thống' },
  { id: 'INC-20240525-03', title: 'Hệ thống thanh toán chậm', type: 'Lỗi phần mềm', location: 'Tất cả Gate', time: '09:10 AM', status: 'pending', severity: 'medium', reporter: 'Thu ngân' },
  { id: 'INC-20240525-04', title: 'Tràn nước do mưa lớn', type: 'Thiên tai', location: 'Tầng Hầm B3', time: '10:30 AM', status: 'resolved', severity: 'high', reporter: 'Hệ thống' }
]

const STATUS_CONFIG = {
  pending: { label: 'Đang chờ xử lý', icon: <Clock size={14} />, color: 'bg-amber-50 text-amber-600 border border-amber-200/60' },
  processing: { label: 'Đang xử lý', icon: <AlertTriangle size={14} />, color: 'bg-blue-50 text-blue-600 border border-blue-200/60' },
  resolved: { label: 'Đã giải quyết', icon: <CheckCircle size={14} />, color: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' }
}

const SEVERITY_CONFIG = {
  low: { label: 'Thấp', color: 'text-slate-500 bg-slate-100/50 px-2 py-1 rounded-md text-[11px]' },
  medium: { label: 'Trung bình', color: 'text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-[11px]' },
  high: { label: 'Nghiêm trọng', color: 'text-red-600 bg-red-50 font-bold px-2 py-1 rounded-md text-[11px]' }
}

const ManagerIncidents = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100)
  }, [])

  const filtered = INCIDENT_DATA.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' || item.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-[1.5rem] shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-4 px-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">Giám sát / Sự cố</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Sự cố & Khiếu nại</h1>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh sách Sự cố</h2>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">Quản lý và theo dõi các sự cố xảy ra trong khu vực bãi đỗ xe.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã sự cố, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-slate-50 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 bg-slate-50 hover:border-slate-300 transition-colors">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 py-2.5 outline-none cursor-pointer w-full sm:w-auto"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto overflow-y-auto max-h-[420px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {filtered.length > 0 ? (
              <table className="min-w-full text-left text-sm text-slate-700 relative">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Mã SC</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Nội dung</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Vị trí</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Mức độ</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Trạng thái</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(item => (
                    <tr key={item.id} className="bg-white hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4 font-bold text-slate-900">{item.id}</td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">{item.title}</p>
                        <p className="text-[12px] font-medium text-slate-500 mt-1">{item.time} • Báo bởi: {item.reporter}</p>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-600">{item.location}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-block border ${SEVERITY_CONFIG[item.severity].color.includes('border') ? '' : 'border-transparent'} ${SEVERITY_CONFIG[item.severity].color}`}>
                          {SEVERITY_CONFIG[item.severity].label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${STATUS_CONFIG[item.status].color}`}>
                          {STATUS_CONFIG[item.status].icon}
                          {STATUS_CONFIG[item.status].label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 active:scale-95">
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center text-slate-500 bg-slate-50/50">
                <SearchX size={48} className="text-slate-300 mb-4" />
                <p className="font-bold text-slate-700 text-base">Không tìm thấy sự cố nào</p>
                <p className="text-sm mt-1.5 text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagerIncidents
