// src/pages/manager/ManagerSlots.jsx
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search, Filter, RefreshCcw, Lock, Unlock, Wrench,
  ChevronRight,
  Activity, History, X, Info
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  getParkingSlotsAPI,
  getSlotByIdAPI,
  updateSlotStatusAPI,
  getFloorsAPI,
  getZonesAPI,
  getVehicleTypesAPI
} from '../../apis/managerApi'

// ── Status config ─────────────────────────────────────────────
const STATUS_CFG = {
  Available: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', dot: 'bg-emerald-500' },
  Occupied: { color: 'bg-blue-50 text-blue-700 border-blue-200/60', dot: 'bg-blue-500' },
  Reserved: { color: 'bg-violet-50 text-violet-700 border-violet-200/60', dot: 'bg-violet-500' },
  Maintenance: { color: 'bg-amber-50 text-amber-700 border-amber-200/60', dot: 'bg-amber-500' },
  Blocked: { color: 'bg-red-50 text-red-700 border-red-200/60', dot: 'bg-red-500' }
}

const StatusBadge = ({ status }) => {
  const { t } = useTranslation()
  const cfg = STATUS_CFG[status] || STATUS_CFG.Available
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {t(`manager.slots.status.${status}`, status)}
    </span>
  )
}

const fmtVnd = (n) => n != null ? Number(n).toLocaleString('vi-VN') + 'đ' : '—'

// ── Detail Panel (modal) ──────────────────────────────────────
const SlotDetail = ({ slotId, onClose, onStatusChange }) => {
  const { t } = useTranslation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getSlotByIdAPI(slotId)
      setData(res.data.data)
    } catch {
      toast.error(t('manager.slots.loadDetailFail'))
      onClose()
    } finally {
      setLoading(false)
    }
  }, [slotId])

  useEffect(() => { load() }, [load])

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true)
    try {
      await updateSlotStatusAPI(slotId, { status: newStatus })
      const code = data?.slot?.SlotCode
      const msgKey = newStatus === 'Maintenance' ? 'toastMaintenance' : newStatus === 'Blocked' ? 'toastBlocked' : 'toastUnlocked'
      toast.success(t(`manager.slots.${msgKey}`, { code }))
      onStatusChange()
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('manager.slots.updateFail'))
    } finally {
      setUpdating(false)
    }
  }

  const slot = data?.slot
  const session = data?.currentSession
  const history = data?.history || []
  const canMaintain = slot && !['Occupied', 'Reserved'].includes(slot.SlotStatus)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t('manager.slots.detail.title')}</h3>
            {slot && <p className="text-xs text-slate-500 mt-0.5">{slot.SlotCode} • {slot.ZoneName} • {slot.FloorName}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : slot ? (
            <div className="p-6 space-y-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoCard label={t('manager.slots.detail.slotCode')} value={slot.SlotCode} highlight />
                <InfoCard label={t('manager.slots.detail.vehicle')} value={slot.VehicleName} />
                <InfoCard label={t('manager.slots.detail.zone')} value={slot.ZoneName} />
                <InfoCard label={t('manager.slots.detail.status')} value={<StatusBadge status={slot.SlotStatus} />} raw />
              </div>

              {/* Active session */}
              {session ? (
                <div className="rounded-xl bg-blue-600 p-5 text-white shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity size={16} className="text-blue-200" />
                    <p className="text-sm font-bold text-blue-100">{t('manager.slots.detail.activeSession')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-blue-200 text-xs mb-0.5">{t('manager.slots.detail.plate')}</p>
                      <p className="font-bold text-lg">{session.PlateNumber}</p>
                    </div>
                    <div>
                      <p className="text-blue-200 text-xs mb-0.5">{t('manager.slots.detail.duration')}</p>
                      <p className="font-bold">{Math.floor(session.ParkedMinutes / 60)}h {session.ParkedMinutes % 60}m</p>
                    </div>
                    <div>
                      <p className="text-blue-200 text-xs mb-0.5">{t('manager.slots.detail.driver')}</p>
                      <p className="font-semibold">{session.DriverName}</p>
                    </div>
                    <div>
                      <p className="text-blue-200 text-xs mb-0.5">{t('manager.slots.detail.entryTime')}</p>
                      <p className="font-semibold">{new Date(session.EntryTime).toLocaleTimeString('vi-VN')}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-center gap-3 text-slate-500">
                  <Info size={16} />
                  <p className="text-sm">{t('manager.slots.detail.noSession')}</p>
                </div>
              )}

              {/* Action buttons */}
              {canMaintain && (
                <div className="flex gap-3">
                  {slot.SlotStatus !== 'Available' && (
                    <button
                      onClick={() => handleStatusUpdate('Available')}
                      disabled={updating}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
                    >
                      <Unlock size={16} /> {t('manager.slots.detail.unlockBtn')}
                    </button>
                  )}
                  {slot.SlotStatus !== 'Maintenance' && (
                    <button
                      onClick={() => handleStatusUpdate('Maintenance')}
                      disabled={updating}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60 transition"
                    >
                      <Wrench size={16} /> {t('manager.slots.detail.maintenanceBtn')}
                    </button>
                  )}
                  {slot.SlotStatus !== 'Blocked' && (
                    <button
                      onClick={() => handleStatusUpdate('Blocked')}
                      disabled={updating}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition"
                    >
                      <Lock size={16} /> {t('manager.slots.detail.blockBtn')}
                    </button>
                  )}
                </div>
              )}

              {/* History */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History size={16} className="text-slate-400" />
                  <h4 className="text-sm font-bold text-slate-700">{t('manager.slots.detail.historyTitle')}</h4>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="overflow-y-auto max-h-60">
                    <table className="min-w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 font-bold text-slate-400">{t('manager.slots.detail.colSession')}</th>
                          <th className="px-4 py-3 font-bold text-slate-400">{t('manager.slots.detail.colPlate')}</th>
                          <th className="px-4 py-3 font-bold text-slate-400">{t('manager.slots.detail.colIn')}</th>
                          <th className="px-4 py-3 font-bold text-slate-400">{t('manager.slots.detail.colTime')}</th>
                          <th className="px-4 py-3 font-bold text-slate-400">{t('manager.slots.detail.colPayment')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {history.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">{t('manager.slots.detail.noHistory')}</td></tr>
                        ) : history.map(h => (
                          <tr key={h.SessionID} className="bg-white hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-700">{h.SessionCode}</td>
                            <td className="px-4 py-3 font-semibold">{h.PlateNumber}</td>
                            <td className="px-4 py-3 text-slate-500">{new Date(h.EntryTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</td>
                            <td className="px-4 py-3">{h.DurationMinutes != null ? `${Math.floor(h.DurationMinutes / 60)}h${h.DurationMinutes % 60}m` : t('manager.slots.detail.stillParking')}</td>
                            <td className="px-4 py-3">
                              {h.Amount ? (
                                <span className={`font-semibold ${h.PaymentStatus === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {fmtVnd(h.Amount)}
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const InfoCard = ({ label, value, highlight, raw }) => (
  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
    {raw ? value : (
      <p className={`text-sm ${highlight ? 'font-black text-blue-600 text-base' : 'font-semibold text-slate-800'}`}>
        {value || '—'}
      </p>
    )}
  </div>
)

// ── Main List Page ────────────────────────────────────────────
const ManagerSlots = () => {
  const { t } = useTranslation()
  const [slots, setSlots] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [floors, setFloors] = useState([])
  const [zones, setZones] = useState([])
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [page, setPage] = useState(1)
  const LIMIT = 30

  // Filters
  const [search, setSearch] = useState('')
  const [filterFloor, setFilterFloor] = useState('all')
  const [filterZone, setFilterZone] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterVehicle, setFilterVehicle] = useState('all')

  // Detail modal
  const [selectedSlotId, setSelectedSlotId] = useState(null)

  // Filter meta
  const filteredZones = filterFloor === 'all'
    ? zones
    : zones.filter(z => String(z.FloorID) === filterFloor)

  const fetchSlots = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = {
        ...(filterFloor !== 'all' && { floorId: filterFloor }),
        ...(filterZone !== 'all' && { zoneId: filterZone }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterVehicle !== 'all' && { vehicleTypeId: filterVehicle }),
        ...(search && { search }),
        page: p,
        limit: LIMIT
      }
      const res = await getParkingSlotsAPI(params)
      setSlots(res.data.data || [])
      setTotal(res.data.total || 0)
      setPage(p)
    } catch {
      toast.error(t('manager.slots.loadFail'))
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 100)
    }
  }, [filterFloor, filterZone, filterStatus, filterVehicle, search, t])

  useEffect(() => {
    const tm = setTimeout(() => fetchSlots(1), search ? 400 : 0)
    return () => clearTimeout(tm)
  }, [fetchSlots])

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [fRes, zRes, vtRes] = await Promise.all([
          getFloorsAPI(), getZonesAPI(), getVehicleTypesAPI()
        ])
        setFloors(fRes.data.data || [])
        setZones(zRes.data.data || [])
        setVehicleTypes(vtRes.data.data || [])
      } catch { /* */ }
    }
    loadMeta()
  }, [])

  // Stats
  const statCounts = slots.reduce((acc, s) => {
    acc[s.SlotStatus] = (acc[s.SlotStatus] || 0) + 1
    return acc
  }, {})

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">{t('manager.slots.eyebrow')}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{t('manager.slots.title')}</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchSlots(page)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCcw size={16} /> {t('manager.slots.refresh')}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATUS_CFG).map(([k, cfg]) => (
          <button
            key={k}
            onClick={() => { setFilterStatus(filterStatus === k ? 'all' : k); setPage(1) }}
            className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${filterStatus === k ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-slate-100 bg-white'
              }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t(`manager.slots.status.${k}`)}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <p className="text-2xl font-black text-slate-800">{statCounts[k] || 0}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filters + Table */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/60">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('manager.slots.filters.searchPlaceholder')}
              className="w-full rounded-xl bg-slate-50 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <FilterSelect value={filterFloor} onChange={e => { setFilterFloor(e.target.value); setFilterZone('all') }}>
            <option value="all">{t('manager.slots.filters.allFloor')}</option>
            {floors.map(f => <option key={f.FloorID} value={f.FloorID}>{f.FloorName}</option>)}
          </FilterSelect>
          <FilterSelect value={filterZone} onChange={e => setFilterZone(e.target.value)}>
            <option value="all">{t('manager.slots.filters.allZone')}</option>
            {filteredZones.map(z => <option key={z.ZoneID} value={z.ZoneID}>{z.ZoneName}</option>)}
          </FilterSelect>
          <FilterSelect value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}>
            <option value="all">{t('manager.slots.filters.allVehicle')}</option>
            {vehicleTypes.map(v => <option key={v.VehicleTypeID} value={v.VehicleTypeID}>{v.VehicleName}</option>)}
          </FilterSelect>
        </div>

        {/* Info bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-slate-500">
            {t('manager.slots.showing')} <strong className="text-slate-800">{slots.length}</strong> / <strong className="text-slate-800">{total}</strong> {t('manager.slots.slotUnit')}
          </p>
          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <X size={12} /> {t('manager.slots.filters.clearStatus')}
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto overflow-y-auto max-h-125]">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">{t('manager.slots.col.slotCode')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">{t('manager.slots.col.location')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">{t('manager.slots.col.vehicle')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">{t('manager.slots.col.status')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">{t('manager.slots.col.currentVehicle')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">{t('manager.slots.col.parkedFrom')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50 text-right">{t('manager.slots.col.detail')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slots.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center text-slate-400">{t('manager.slots.empty')}</td>
                    </tr>
                  ) : slots.map(slot => (
                    <tr key={slot.SlotID} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-black text-slate-900">{slot.SlotCode}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-700">{slot.ZoneName}</p>
                        <p className="text-xs text-slate-400">{slot.FloorName} • {slot.BuildingName}</p>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">{slot.VehicleCode}</span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={slot.SlotStatus} />
                      </td>
                      <td className="px-5 py-4">
                        {slot.PlateNumber ? (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2.5 py-1 text-xs font-bold">
                            {slot.PlateNumber}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        {slot.EntryTime
                          ? new Date(slot.EntryTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                          : '—'
                        }
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedSlotId(slot.SlotID)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all gap-1"
                        >
                          {t('manager.slots.detailBtn')} <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              onClick={() => fetchSlots(page - 1)}
              disabled={page <= 1 || loading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              {t('manager.slots.prev')}
            </button>
            <span className="text-sm font-bold text-slate-600">
              {t('manager.slots.pageOf', { page, total: totalPages })}
            </span>
            <button
              onClick={() => fetchSlots(page + 1)}
              disabled={page >= totalPages || loading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              {t('manager.slots.next')}
            </button>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedSlotId && (
        <SlotDetail
          slotId={selectedSlotId}
          onClose={() => setSelectedSlotId(null)}
          onStatusChange={() => fetchSlots(page)}
        />
      )}
    </div>
  )
}

const FilterSelect = ({ value, onChange, children }) => (
  <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 bg-slate-50">
    <Filter size={14} className="text-slate-400 shrink-0" />
    <select
      value={value} onChange={onChange}
      className="bg-transparent text-sm font-semibold text-slate-700 py-2.5 outline-none cursor-pointer"
    >
      {children}
    </select>
  </div>
)

export default ManagerSlots