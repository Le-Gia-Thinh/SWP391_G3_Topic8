import React, { useState } from 'react'
import { AlertTriangle, Filter, Search, SearchX, CheckCircle, Clock, XCircle } from 'lucide-react'

const INCIDENT_DATA = [
  { id: 'INC-20240524-01', title: 'Khách hàng báo mất thẻ từ', type: 'Mất thẻ', location: 'Gate 1', time: '10:15 AM', status: 'pending', severity: 'medium', reporter: 'Nguyễn Văn A' },
  { id: 'INC-20240524-02', title: 'Barrier Gate 3 không mở', type: 'Lỗi phần cứng', location: 'Gate 3', time: '09:30 AM', status: 'resolved', severity: 'high', reporter: 'Trần Thị B' },
  { id: 'INC-20240524-03', title: 'Phát hiện va quẹt xe', type: 'Tai nạn', location: 'Tầng B2, Slot A15', time: '08:45 AM', status: 'processing', severity: 'high', reporter: 'Lê Văn C' },
  { id: 'INC-20240524-04', title: 'Hệ thống nhận diện biển số lỗi', type: 'Lỗi AI', location: 'Gate 2', time: 'Hôm qua', status: 'resolved', severity: 'medium', reporter: 'Hệ thống' }
]

const STATUS_CONFIG = {
  pending: { label: 'Đang chờ xử lý', icon: <Clock size={14} />, color: 'bg-amber-50 text-amber-600 border-amber-200' },
  processing: { label: 'Đang xử lý', icon: <AlertTriangle size={14} />, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  resolved: { label: 'Đã giải quyết', icon: <CheckCircle size={14} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
}

const SEVERITY_CONFIG = {
  low: { label: 'Thấp', color: 'text-gray-500' },
  medium: { label: 'Trung bình', color: 'text-amber-500' },
  high: { label: 'Nghiêm trọng', color: 'text-red-500 font-bold' }
}

const ManagerIncidents = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filtered = INCIDENT_DATA.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' || item.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sự cố & Khiếu nại</h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý và theo dõi các sự cố xảy ra trong khu vực bãi đỗ xe.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã sự cố, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl bg-slate-50 pl-11 pr-4 py-3 text-sm text-slate-900 outline-none focus:bg-white border border-transparent focus:border-blue-500 transition"
            />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 bg-slate-50">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 py-3 outline-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filtered.length > 0 ? (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-xs">Mã SC</th>
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-xs">Nội dung</th>
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-xs">Vị trí</th>
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-xs">Mức độ</th>
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-xs">Trạng thái</th>
                  <th className="pb-3 px-4 font-semibold uppercase tracking-wider text-xs text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-4 font-bold text-slate-900">{item.id}</td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{item.time} • Báo bởi: {item.reporter}</p>
                    </td>
                    <td className="py-4 px-4 text-slate-600">{item.location}</td>
                    <td className={`py-4 px-4 ${SEVERITY_CONFIG[item.severity].color}`}>{SEVERITY_CONFIG[item.severity].label}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_CONFIG[item.status].color}`}>
                        {STATUS_CONFIG[item.status].icon}
                        {STATUS_CONFIG[item.status].label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition">Xem chi tiết</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 flex flex-col items-center text-center text-slate-500">
              <SearchX size={48} className="text-slate-200 mb-4" />
              <p className="font-semibold text-slate-700">Không tìm thấy sự cố nào</p>
              <p className="text-sm mt-1">Thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManagerIncidents
