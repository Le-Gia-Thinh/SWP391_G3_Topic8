/**
 * FILE: ManagerIncidents.jsx
 * MÔ TẢ: Trang Quản lý Sự cố dành cho Manager.
 * Cho phép xem chi tiết sự cố (kèm hình ảnh), chuyển trạng thái (Open, InProgress, Resolved) và phân công Staff xử lý.
 */

// src/pages/manager/ManagerIncidents.jsx
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, Filter, Search, SearchX, CheckCircle, Clock,
  ShieldAlert, X, Eye, RefreshCcw, Image as ImageIcon, User, Car, MapPin
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  getIncidentsAPI,
  getIncidentByIdAPI,
  updateIncidentStatusAPI,
  getStaffListAPI
} from '../../apis/managerApi'

const STATUS_META = {
  Open: { icon: <Clock size={14} />, color: 'bg-amber-50 text-amber-600 border border-amber-200/60' },
  InProgress: { icon: <AlertTriangle size={14} />, color: 'bg-blue-50 text-blue-600 border border-blue-200/60' },
  Resolved: { icon: <CheckCircle size={14} />, color: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' }
}

const PRIORITY_COLOR = {
  Low: 'text-slate-600 bg-slate-100/70',
  Normal: 'text-blue-600 bg-blue-50',
  High: 'text-red-600 bg-red-50 font-bold'
}

const fmtDate = (d) => d ? new Date(d).toLocaleString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : '—'

const StatusBadge = ({ status }) => {
  const { t } = useTranslation()
  const c = STATUS_META[status] || { icon: null, color: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${c.color}`}>
      {c.icon}{t(`manager.incidents.status.${status}`, status)}
    </span>
  )
}

const PriorityBadge = ({ priority }) => {
  const { t } = useTranslation()
  const cls = PRIORITY_COLOR[priority] || PRIORITY_COLOR.Normal
  return <span className={`inline-block px-2 py-1 rounded-md text-[11px] ${cls}`}>{t(`manager.incidents.priority.${priority}`, priority)}</span>
}

const IncidentModal = ({ incidentId, staffList, onClose, onUpdated }) => {
  const { t } = useTranslation()
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [assignedStaffId, setAssignedStaffId] = useState('')
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await getIncidentByIdAPI(incidentId)
        if (cancelled) return
        const data = res.data.data
        setIncident(data)
        setStatus(data.IncidentStatus || 'Open')
        setAssignedStaffId(data.AssignedStaffID ? String(data.AssignedStaffID) : '')
      } catch {
        if (!cancelled) { toast.error(t('manager.incidents.modal.loadFail')); onClose() }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [incidentId, onClose, t])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateIncidentStatusAPI(incidentId, {
        status,
        assignedStaffId: assignedStaffId ? Number(assignedStaffId) : undefined
      })
      toast.success(t('manager.incidents.modal.updateSuccess'))
      onUpdated()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('manager.incidents.modal.updateFail'))
    } finally {
      setSaving(false)
    }
  }

  const images = Array.isArray(incident?.Attachments) ? incident.Attachments : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert size={20} className="text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">{t('manager.incidents.modal.title', { id: incidentId })}</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 transition"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : incident ? (
            <div className="p-6 space-y-5">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={incident.IncidentStatus} />
                <PriorityBadge priority={incident.Priority} />
                <span className="inline-block px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">{incident.IncidentType}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-3xl bg-slate-50 p-4">
                {[
                  { icon: AlertTriangle, label: t('manager.incidents.modal.sessionCode'), value: incident.SessionCode || '—' },
                  { icon: User, label: t('manager.incidents.modal.driver'), value: incident.DriverName || '—' },
                  { icon: Car, label: t('manager.incidents.modal.plate'), value: incident.PlateNumber || '—' },
                  { icon: User, label: t('manager.incidents.modal.phone'), value: incident.DriverPhone || '—' },
                  { icon: MapPin, label: t('manager.incidents.modal.assignedStaff'), value: incident.AssignedStaffName || t('manager.incidents.modal.unassigned') },
                  { icon: Clock, label: t('manager.incidents.modal.createdAt'), value: fmtDate(incident.CreatedAt) }
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2">
                    <Icon size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400">{label}</p>
                      <p className="text-sm font-semibold text-slate-800 font-black truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 font-medium mb-1.5">{t('manager.incidents.modal.description')}</p>
                <div className="rounded-3xl border border-slate-200 p-3 whitespace-pre-wrap text-sm text-slate-700 font-bold">
                  {incident.Description || '—'}
                </div>
              </div>

              {images.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon size={15} className="text-slate-400" />
                    <p className="text-xs font-semibold text-slate-500 font-medium">{t('manager.incidents.modal.attachments', { count: images.length })}</p>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {images.map((src, i) => (
                      <img key={i} src={src} alt={`attachment-${i}`}
                        onClick={() => setLightbox(src)}
                        className="aspect-square w-full object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-80 transition" />
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <p className="text-sm font-bold text-slate-700 font-bold">{t('manager.incidents.modal.handleTitle')}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600 mb-1.5 block">{t('manager.incidents.modal.statusLabel')}</span>
                    <select value={status} onChange={e => setStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 font-black outline-none focus:border-blue-500">
                      <option value="Open">{t('manager.incidents.status.Open')}</option>
                      <option value="InProgress">{t('manager.incidents.status.InProgress')}</option>
                      <option value="Resolved">{t('manager.incidents.status.Resolved')}</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600 mb-1.5 block">{t('manager.incidents.modal.assignLabel')}</span>
                    <select value={assignedStaffId} onChange={e => setAssignedStaffId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 font-black outline-none focus:border-blue-500">
                      <option value="">{t('manager.incidents.modal.assignNone')}</option>
                      {staffList.map(s => (
                        <option key={s.UserID} value={s.UserID}>{s.FullName} ({s.RoleName})</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 rounded-3xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 font-bold hover:bg-slate-50 transition">{t('manager.incidents.modal.close')}</button>
          <button onClick={handleSave} disabled={saving || loading}
            className="flex-1 rounded-3xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
            {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t('manager.incidents.modal.saving')}</> : t('manager.incidents.modal.save')}
          </button>
        </div>
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)} className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4">
          <img src={lightbox} alt="preview" className="max-w-[90vw] max-h-[88vh] object-contain rounded-xl" />
        </div>
      )}
    </div>
  )
}

const ManagerIncidents = () => {
  const { t } = useTranslation()
  const [incidents, setIncidents] = useState([])
  const [staffList, setStaffList] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [searchTrigger, setSearchTrigger] = useState(0)
  const [selectedId, setSelectedId] = useState(null)

  const fetchData = useCallback(async (params) => {
    setLoading(true)
    try {
      const res = await getIncidentsAPI(params)
      setIncidents(res.data.data || [])
    } catch {
      toast.error(t('manager.incidents.loadFail'))
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 80)
    }
  }, [t])

  useEffect(() => {
    let cancelled = false
    getStaffListAPI()
      .then(res => { if (!cancelled) setStaffList(res.data.data || []) })
      .catch(() => { })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const params = {}
    if (filterStatus !== 'all') params.status = filterStatus
    if (filterPriority !== 'all') params.priority = filterPriority
    if (searchTerm.trim()) params.search = searchTerm.trim()
    fetchData(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTrigger, fetchData])

  const handleSearch = () => setSearchTrigger(tt => tt + 1)

  const filtered = incidents.filter(item => {
    if (!searchTerm.trim()) return true
    const s = searchTerm.toLowerCase()
    return (
      String(item.IncidentID).includes(s) ||
      (item.IncidentType || '').toLowerCase().includes(s) ||
      (item.DriverName || '').toLowerCase().includes(s) ||
      (item.PlateNumber || '').toLowerCase().includes(s)
    )
  })

  const counts = incidents.reduce((acc, i) => {
    acc[i.IncidentStatus] = (acc[i.IncidentStatus] || 0) + 1
    return acc
  }, {})

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <div className="flex items-center gap-4 px-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">{t('manager.incidents.eyebrow')}</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{t('manager.incidents.title')}</h1>
          </div>
        </div>
        <button onClick={handleSearch}
          className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 font-bold hover:bg-slate-50 transition self-start">
          <RefreshCcw size={16} /> {t('manager.incidents.refresh')}
        </button>
      </div>

      <div className="rounded-3xl bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('manager.incidents.listTitle')}</h2>
              <p className="text-[12px] font-medium text-slate-500 font-medium mt-0.5">{t('manager.incidents.listDesc')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_META).map(([k, c]) => counts[k] ? (
              <button key={k} onClick={() => { setFilterStatus(k); handleSearch() }}
                className={`text-xs font-bold px-2.5 py-1 rounded-xl ${c.color}`}>
                {t(`manager.incidents.status.${k}`)}: {counts[k]}
              </button>
            ) : null)}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('manager.incidents.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full rounded-3xl bg-slate-50 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 rounded-3xl border border-slate-200 px-4 bg-slate-50">
            <Filter size={16} className="text-slate-400" />
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setSearchTrigger(tt => tt + 1) }}
              className="bg-transparent text-sm font-semibold text-slate-700 font-bold py-2.5 outline-none cursor-pointer">
              <option value="all">{t('manager.incidents.filterAllStatus')}</option>
              <option value="Open">{t('manager.incidents.status.Open')}</option>
              <option value="InProgress">{t('manager.incidents.status.InProgress')}</option>
              <option value="Resolved">{t('manager.incidents.status.Resolved')}</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-3xl border border-slate-200 px-4 bg-slate-50">
            <Filter size={16} className="text-slate-400" />
            <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setSearchTrigger(tt => tt + 1) }}
              className="bg-transparent text-sm font-semibold text-slate-700 font-bold py-2.5 outline-none cursor-pointer">
              <option value="all">{t('manager.incidents.filterAllPriority')}</option>
              <option value="High">{t('manager.incidents.priority.High')}</option>
              <option value="Normal">{t('manager.incidents.priority.Normal')}</option>
              <option value="Low">{t('manager.incidents.priority.Low')}</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <div className="overflow-x-auto overflow-y-auto max-h-115">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : filtered.length > 0 ? (
              <table className="min-w-full text-left text-sm text-slate-700 font-bold">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('manager.incidents.col.id')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('manager.incidents.col.typeDesc')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('manager.incidents.col.driverPlate')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('manager.incidents.col.image')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('manager.incidents.col.priority')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('manager.incidents.col.status')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50 text-right">{t('manager.incidents.col.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(item => {
                    const imgs = Array.isArray(item.Attachments) ? item.Attachments : []
                    return (
                      <tr key={item.IncidentID} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900">
                          #{item.IncidentID}
                          {item.SessionCode && <p className="text-[11px] font-semibold text-blue-600">{item.SessionCode}</p>}
                        </td>
                        <td className="px-5 py-4 max-w-60">
                          <p className="font-bold text-slate-800 font-black">{item.IncidentType}</p>
                          <p className="text-[12px] font-medium text-slate-500 font-medium mt-1 truncate">{item.Description}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{fmtDate(item.CreatedAt)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-700 font-bold">{item.DriverName || '—'}</p>
                          {item.PlateNumber && <p className="text-xs text-slate-500 font-medium">{item.PlateNumber}</p>}
                        </td>
                        <td className="px-5 py-4">
                          {imgs.length > 0 ? (
                            <div className="flex items-center -space-x-1">
                              {imgs.slice(0, 3).map((src, i) => (
                                <img key={i} src={src} alt="" className="w-7 h-7 rounded border border-white object-cover" />
                              ))}
                              {imgs.length > 3 && <span className="text-xs text-slate-400 ml-2">+{imgs.length - 3}</span>}
                            </div>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-4"><PriorityBadge priority={item.Priority} /></td>
                        <td className="px-5 py-4"><StatusBadge status={item.IncidentStatus} /></td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => setSelectedId(item.IncidentID)}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:border-blue-200 hover:bg-blue-50 active:scale-95">
                            <Eye size={13} /> {t('manager.incidents.viewDetail')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center text-slate-500 font-medium bg-slate-50/50">
                <SearchX size={48} className="text-slate-300 mb-4" />
                <p className="font-bold text-slate-700 font-bold text-base">{t('manager.incidents.emptyTitle')}</p>
                <p className="text-sm mt-1.5 text-slate-500 font-medium">{t('manager.incidents.emptyHint')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedId && (
        <IncidentModal
          incidentId={selectedId}
          staffList={staffList}
          onClose={() => setSelectedId(null)}
          onUpdated={handleSearch}
        />
      )}
    </div>
  )
}

export default ManagerIncidents