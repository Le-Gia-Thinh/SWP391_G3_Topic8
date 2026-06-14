// src/pages/manager/ManagerIncidents.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Filter, Search, SearchX, CheckCircle, Clock, ShieldAlert, RefreshCcw, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { getIncidentsAPI, getIncidentByIdAPI, updateIncidentStatusAPI } from '../../apis/managerApi'

const STATUS_CONFIG = {
  Open: { label: 'Chờ xử lý', icon: <Clock size={14} />, color: 'bg-amber-50 text-amber-600 border border-amber-200/60' },
  InProgress: { label: 'Đang xử lý', icon: <AlertTriangle size={14} />, color: 'bg-blue-50 text-blue-600 border border-blue-200/60' },
  Resolved: { label: 'Đã giải quyết', icon: <CheckCircle size={14} />, color: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' },
}

const PRIORITY_CONFIG = {
  Low: { label: 'Thấp', color: 'text-slate-500 bg-slate-100/50 px-2 py-1 rounded-md text-[11px]' },
  Normal: { label: 'Trung bình', color: 'text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-[11px]' },
  High: { label: 'Nghiêm trọng', color: 'text-red-600 bg-red-50 font-bold px-2 py-1 rounded-md text-[11px]' },
}

const ManagerIncidents = () => {
  const [incidents, setIncidents] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [isLoaded, setIsLoaded] = useState(false)

  // Detail modal
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterPriority !== 'all' && { priority: filterPriority }),
        ...(searchTerm && { search: searchTerm }),
        limit: 50,
      }
      const res = await getIncidentsAPI(params)
      setIncidents(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Không thể tải danh sách sự cố')
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 100)
    }
  }, [filterStatus, filterPriority, searchTerm])

  useEffect(() => {
    const timer = setTimeout(fetchIncidents, searchTerm ? 400 : 0)
    return () => clearTimeout(timer)
  }, [fetchIncidents])

  const openDetail = async (incident) => {
    setShowModal(true)
    setDetailLoading(true)
    try {
      const res = await getIncidentByIdAPI(incident.IncidentID)
      setSelectedIncident(res.data.data)
    } catch {
      toast.error('Không thể tải chi tiết sự cố')
      setShowModal(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedIncident) return
    setUpdatingStatus(true)
    try {
      await updateIncidentStatusAPI(selectedIncident.IncidentID, { status: newStatus })
      toast.success('Cập nhật trạng thái thành công')
      setShowModal(false)
      setSelectedIncident(null)
      fetchIncidents()
    } catch {
      toast.error('Cập nhật thất bại')
    } finally {
      setUpdatingStatus(false)
    }
  }

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
        <button
          onClick={fetchIncidents}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCcw size={16} /> Làm mới
        </button>
      </div>

      <div className="rounded-[1.5rem] bg-white p-7 shadow-sm border border-slate-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh sách Sự cố</h2>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                Tổng cộng: <strong className="text-slate-700">{total}</strong> sự cố
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm mã sự cố, biển số, tên khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-slate-50 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 bg-slate-50">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 py-2.5 outline-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Open">Chờ xử lý</option>
              <option value="InProgress">Đang xử lý</option>
              <option value="Resolved">Đã giải quyết</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 bg-slate-50">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 py-2.5 outline-none cursor-pointer"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="Low">Thấp</option>
              <option value="Normal">Trung bình</option>
              <option value="High">Nghiêm trọng</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto overflow-y-auto max-h-[480px]">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : incidents.length > 0 ? (
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Mã SC</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Loại / Mô tả</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Biển số</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Vị trí</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Mức độ</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Trạng thái</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map(item => {
                    const statusCfg = STATUS_CONFIG[item.IncidentStatus] || STATUS_CONFIG.Open
                    const priorityCfg = PRIORITY_CONFIG[item.Priority] || PRIORITY_CONFIG.Normal
                    const location = [item.SlotCode, item.ZoneName, item.FloorName].filter(Boolean).join(' • ') || '—'
                    return (
                      <tr key={item.IncidentID} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">INC-{String(item.IncidentID).padStart(6, '0')}</td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800">{item.IncidentType}</p>
                          {item.Description && (
                            <p className="text-[12px] font-medium text-slate-500 mt-0.5 line-clamp-1">{item.Description}</p>
                          )}
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(item.CreatedAt).toLocaleString('vi-VN')} • {item.DriverName || 'Khách vãng lai'}
                          </p>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">{item.PlateNumber || '—'}</td>
                        <td className="px-5 py-4 font-medium text-slate-600 text-xs">{location}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-block ${priorityCfg.color}`}>{priorityCfg.label}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${statusCfg.color}`}>
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => openDetail(item)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50"
                          >
                            Xem & Xử lý
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center text-slate-500 bg-slate-50/50">
                <SearchX size={48} className="text-slate-300 mb-4" />
                <p className="font-bold text-slate-700 text-base">Không tìm thấy sự cố nào</p>
                <p className="text-sm mt-1.5 text-slate-500">Thử thay đổi từ khóa hoặc bộ lọc.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-[1.5rem] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Chi tiết Sự cố</h3>
              <button
                onClick={() => { setShowModal(false); setSelectedIncident(null) }}
                className="rounded-lg p-2 hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
              ) : selectedIncident ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Mã sự cố" value={`INC-${String(selectedIncident.IncidentID).padStart(6, '0')}`} />
                    <InfoRow label="Loại" value={selectedIncident.IncidentType} />
                    <InfoRow label="Mức độ" value={PRIORITY_CONFIG[selectedIncident.Priority]?.label} />
                    <InfoRow label="Trạng thái" value={STATUS_CONFIG[selectedIncident.IncidentStatus]?.label} />
                    <InfoRow label="Biển số" value={selectedIncident.PlateNumber || '—'} />
                    <InfoRow label="Khách hàng" value={selectedIncident.DriverName || '—'} />
                    <InfoRow label="Vị trí" value={[selectedIncident.SlotCode, selectedIncident.ZoneName, selectedIncident.FloorName].filter(Boolean).join(' • ') || '—'} />
                    <InfoRow label="Thời gian" value={new Date(selectedIncident.CreatedAt).toLocaleString('vi-VN')} />
                  </div>
                  {selectedIncident.Description && (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mô tả</p>
                      <p className="text-sm text-slate-700">{selectedIncident.Description}</p>
                    </div>
                  )}
                  {selectedIncident.StaffName && (
                    <InfoRow label="Nhân viên phụ trách" value={selectedIncident.StaffName} />
                  )}

                  {/* Action buttons */}
                  {selectedIncident.IncidentStatus !== 'Resolved' && (
                    <div className="flex gap-3 pt-2">
                      {selectedIncident.IncidentStatus === 'Open' && (
                        <button
                          onClick={() => handleStatusUpdate('InProgress')}
                          disabled={updatingStatus}
                          className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition"
                        >
                          {updatingStatus ? 'Đang cập nhật...' : 'Bắt đầu xử lý'}
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusUpdate('Resolved')}
                        disabled={updatingStatus}
                        className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
                      >
                        {updatingStatus ? 'Đang cập nhật...' : 'Đánh dấu Đã giải quyết'}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const InfoRow = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
    <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
  </div>
)

export default ManagerIncidents