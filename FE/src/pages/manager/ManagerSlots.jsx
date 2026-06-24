// src/pages/manager/ManagerSlots.jsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search, RefreshCcw, Lock, Unlock, Wrench,
  ChevronRight, Activity, History, X, Info,
  Building2, Layers, Grid3X3, LayoutGrid, List,
  ChevronDown
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  getParkingSlotsAPI, getSlotByIdAPI, updateSlotStatusAPI,
  getFloorsAPI, getZonesAPI, getVehicleTypesAPI
} from '../../apis/managerApi'

/* ─── Status config ──────────────────────────────────────────── */
const STATUS_CFG = {
  Available: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', mapBg: 'bg-emerald-50 border-emerald-300 hover:border-emerald-500', label: 'Trống' },
  Occupied: { color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', mapBg: 'bg-blue-50 border-blue-300 hover:border-blue-500', label: 'Đang đỗ' },
  Reserved: { color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', mapBg: 'bg-violet-50 border-violet-300 hover:border-violet-500', label: 'Đặt trước' },
  Maintenance: { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', mapBg: 'bg-amber-50 border-amber-300 hover:border-amber-500', label: 'Bảo trì' },
  Blocked: { color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500', mapBg: 'bg-slate-700 border-slate-700 text-white', label: 'Khoá' },
}

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Available
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

const fmtVnd = (n) => n != null ? Number(n).toLocaleString('vi-VN') + 'đ' : '—'

/* ─── Build hierarchy from flat slot list ────────────────────── */
function buildHierarchy(slots) {
  const map = {}
  slots.forEach(s => {
    const bk = s.BuildingName || 'Không rõ'
    const fk = s.FloorName || 'Không rõ'
    const zk = s.ZoneName || 'Không rõ'
    if (!map[bk]) map[bk] = { name: bk, floors: {} }
    if (!map[bk].floors[fk]) map[bk].floors[fk] = { name: fk, zones: {} }
    if (!map[bk].floors[fk].zones[zk]) map[bk].floors[fk].zones[zk] = { name: zk, slots: [] }
    map[bk].floors[fk].zones[zk].slots.push(s)
  })
  return Object.values(map).map(b => ({
    ...b,
    floors: Object.values(b.floors).map(f => ({
      ...f,
      zones: Object.values(f.zones)
    }))
  }))
}

/* ─── Occupancy bar ──────────────────────────────────────────── */
function OccupancyBar({ slots }) {
  const total = slots.length
  const occupied = slots.filter(s => s.SlotStatus === 'Occupied').length
  const reserved = slots.filter(s => s.SlotStatus === 'Reserved').length
  const maint = slots.filter(s => ['Maintenance', 'Blocked'].includes(s.SlotStatus)).length
  const avail = slots.filter(s => s.SlotStatus === 'Available').length
  if (total === 0) return null
  return (
    <div className="space-y-1">
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 gap-px">
        <div className="bg-blue-400 transition-all" style={{ width: `${occupied / total * 100}%` }} />
        <div className="bg-violet-400 transition-all" style={{ width: `${reserved / total * 100}%` }} />
        <div className="bg-amber-400 transition-all" style={{ width: `${maint / total * 100}%` }} />
        <div className="bg-emerald-400 transition-all" style={{ width: `${avail / total * 100}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
        <span>{avail} trống</span>
        <span>{total} tổng</span>
      </div>
    </div>
  )
}

/* ─── Slot Detail Modal ──────────────────────────────────────── */
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
      toast.error(t('manager.slots.loadDetailFail', 'Không tải được chi tiết'))
      onClose()
    } finally { setLoading(false) }
  }, [slotId])

  useEffect(() => { load() }, [load])

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true)
    try {
      await updateSlotStatusAPI(slotId, { status: newStatus })
      toast.success(`Đã cập nhật slot ${data?.slot?.SlotCode} → ${STATUS_CFG[newStatus]?.label}`)
      onStatusChange()
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại')
    } finally { setUpdating(false) }
  }

  const slot = data?.slot
  const session = data?.currentSession
  const history = data?.history || []
  const canMaintain = slot && !['Occupied', 'Reserved'].includes(slot.SlotStatus)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t('manager.slots.detail.title')}</h3>
            {slot && <p className="text-xs text-slate-400 mt-0.5">{slot.SlotCode} · {slot.ZoneName} · {slot.FloorName}</p>}
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
            <div className="p-5 space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Mã slot', value: slot.SlotCode, bold: true },
                  { label: 'Loại xe', value: slot.VehicleName },
                  { label: 'Khu vực', value: slot.ZoneName },
                  { label: 'Trạng thái', value: <StatusBadge status={slot.SlotStatus} />, raw: true },
                ].map(({ label, value, bold, raw }) => (
                  <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                    {raw ? value : (
                      <p className={`text-sm ${bold ? 'font-black text-blue-600 text-base' : 'font-semibold text-slate-800'}`}>{value || '—'}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Active session */}
              {session ? (
                <div className="rounded-xl bg-blue-600 p-5 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity size={15} className="text-blue-200" />
                    <p className="text-sm font-bold text-blue-100">{t('manager.slots.detail.activeSession')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-blue-200 text-xs mb-0.5">{t('manager.slots.detail.plate')}</p><p className="font-black text-xl">{session.PlateNumber}</p></div>
                    <div><p className="text-blue-200 text-xs mb-0.5">{t('manager.slots.detail.duration')}</p><p className="font-bold">{Math.floor(session.ParkedMinutes / 60)}h {session.ParkedMinutes % 60}m</p></div>
                    <div><p className="text-blue-200 text-xs mb-0.5">{t('manager.slots.detail.driver')}</p><p className="font-semibold">{session.DriverName}</p></div>
                    <div><p className="text-blue-200 text-xs mb-0.5">{t('manager.slots.detail.entryTime')}</p><p className="font-semibold">{new Date(session.EntryTime).toLocaleTimeString('vi-VN')}</p></div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 flex items-center gap-3 text-slate-400">
                  <Info size={15} />
                  <p className="text-sm">{t('manager.slots.detail.noSession')}</p>
                </div>
              )}

              {/* Actions */}
              {canMaintain && (
                <div className="flex gap-2">
                  {slot.SlotStatus !== 'Available' && (
                    <button onClick={() => handleStatusUpdate('Available')} disabled={updating}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition">
                      <Unlock size={15} /> Mở slot
                    </button>
                  )}
                  {slot.SlotStatus !== 'Maintenance' && (
                    <button onClick={() => handleStatusUpdate('Maintenance')} disabled={updating}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60 transition">
                      <Wrench size={15} /> Bảo trì
                    </button>
                  )}
                  {slot.SlotStatus !== 'Blocked' && (
                    <button onClick={() => handleStatusUpdate('Blocked')} disabled={updating}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition">
                      <Lock size={15} /> Khoá slot
                    </button>
                  )}
                </div>
              )}

              {/* History */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History size={15} className="text-slate-400" />
                  <h4 className="text-sm font-bold text-slate-700">{t('manager.slots.detail.historyTitle')}</h4>
                </div>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <div className="overflow-y-auto max-h-56">
                    <table className="min-w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2.5 font-bold text-slate-400">{t('manager.slots.detail.colSession')}</th>
                          <th className="px-4 py-2.5 font-bold text-slate-400">{t('manager.slots.detail.plate')}</th>
                          <th className="px-4 py-2.5 font-bold text-slate-400">{t('manager.slots.detail.colIn')}</th>
                          <th className="px-4 py-2.5 font-bold text-slate-400">{t('manager.slots.detail.duration')}</th>
                          <th className="px-4 py-2.5 font-bold text-slate-400">{t('staff.parkingMap.payment')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {history.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-300">{t('manager.slots.detail.noHistory')}</td></tr>
                        ) : history.map(h => (
                          <tr key={h.SessionID} className="hover:bg-slate-50 bg-white">
                            <td className="px-4 py-2.5 font-bold text-slate-700">{h.SessionCode}</td>
                            <td className="px-4 py-2.5 font-semibold">{h.PlateNumber}</td>
                            <td className="px-4 py-2.5 text-slate-400">{new Date(h.EntryTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</td>
                            <td className="px-4 py-2.5">{h.DurationMinutes != null ? `${Math.floor(h.DurationMinutes / 60)}h${h.DurationMinutes % 60}m` : 'Đang đỗ'}</td>
                            <td className="px-4 py-2.5">
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

/* ─── Map view: slot grid for a zone ────────────────────────── */
const ZoneMapView = ({ slots, onSelectSlot, selectedSlotId }) => {
  const sorted = [...slots].sort((a, b) => a.SlotCode.localeCompare(b.SlotCode))
  return (
    <div className="flex flex-wrap gap-2 p-4">
      {sorted.map(slot => {
        const cfg = STATUS_CFG[slot.SlotStatus] || STATUS_CFG.Available
        const isSelected = selectedSlotId === slot.SlotID
        return (
          <button key={slot.SlotID}
            onClick={() => onSelectSlot(slot.SlotID)}
            title={`${slot.SlotCode} · ${cfg.label}${slot.PlateNumber ? ' · ' + slot.PlateNumber : ''}`}
            className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-150
              ${isSelected
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110 z-10'
                : `${cfg.mapBg} ${slot.SlotStatus === 'Blocked' ? 'text-white' : 'text-slate-700'}`
              }`}>
            <span className="font-black text-[10px] leading-tight text-center px-0.5">
              {slot.SlotCode.split('-').slice(-1)[0]}
            </span>
            {slot.PlateNumber && !isSelected && (
              <span className="text-[7px] font-bold opacity-60 mt-0.5 truncate max-w-[52px] px-0.5">
                {slot.PlateNumber.split('-').slice(-1)[0]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Nav item for sidebar ───────────────────────────────────── */
function NavItem({ icon: Icon, label, active, onClick, count, indent = 0, badge }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-sm
        ${indent === 1 ? 'pl-6' : indent === 2 ? 'pl-9' : ''}
        ${active
          ? 'bg-blue-600 text-white font-semibold shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 font-medium'}`}>
      <Icon size={13} className={active ? 'text-blue-100' : 'text-slate-400'} />
      <span className="flex-1 truncate text-xs">{label}</span>
      {badge !== undefined && (
        <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center
          ${active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
const ManagerSlots = () => {
  const { t } = useTranslation()
  const [allSlots, setAllSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('map')   // 'map' | 'list'
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedSlotId, setSelectedSlotId] = useState(null)

  // Hierarchy nav
  const [expandedBuildings, setExpandedBuildings] = useState({})
  const [expandedFloors, setExpandedFloors] = useState({})
  const [selBuilding, setSelBuilding] = useState(null)
  const [selFloor, setSelFloor] = useState(null)
  const [selZone, setSelZone] = useState(null)

  /* Load all slots once (no pagination — use hierarchy nav to drill down) */
  const loadSlots = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getParkingSlotsAPI({ limit: 2000 })
      setAllSlots(res.data.data || [])
    } catch { toast.error('Không tải được danh sách slot') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadSlots() }, [loadSlots])

  /* Build hierarchy */
  const hierarchy = useMemo(() => buildHierarchy(allSlots), [allSlots])

  /* Auto-select first building on load */
  useEffect(() => {
    if (hierarchy.length > 0 && !selBuilding) {
      const b = hierarchy[0]
      setSelBuilding(b.name)
      setExpandedBuildings({ [b.name]: true })
      if (b.floors.length > 0) {
        const f = b.floors[0]
        setSelFloor(f.name)
        setExpandedFloors({ [f.name]: true })
        if (f.zones.length > 0) setSelZone(f.zones[0].name)
      }
    }
  }, [hierarchy])

  /* Derived slots for current view */
  const zoneSlots = useMemo(() => {
    if (!selBuilding || !selFloor || !selZone) return []
    return allSlots.filter(s =>
      s.BuildingName === selBuilding &&
      s.FloorName === selFloor &&
      s.ZoneName === selZone
    )
  }, [allSlots, selBuilding, selFloor, selZone])

  /* Filtered list (for list view + search) */
  const filteredSlots = useMemo(() => {
    let list = selZone ? zoneSlots : allSlots
    if (filterStatus !== 'all') list = list.filter(s => s.SlotStatus === filterStatus)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(s =>
        s.SlotCode?.toLowerCase().includes(q) ||
        s.PlateNumber?.toLowerCase().includes(q) ||
        s.ZoneName?.toLowerCase().includes(q)
      )
    }
    return list
  }, [zoneSlots, allSlots, selZone, filterStatus, search])

  /* Stats for current zone / all */
  const stats = useMemo(() => {
    const source = selZone ? zoneSlots : allSlots
    return Object.keys(STATUS_CFG).reduce((acc, k) => {
      acc[k] = source.filter(s => s.SlotStatus === k).length
      return acc
    }, {})
  }, [zoneSlots, allSlots, selZone])

  const totalSlots = (selZone ? zoneSlots : allSlots).length
  const displaySlots = viewMode === 'map' ? zoneSlots : filteredSlots

  /* Current zone object for OccupancyBar */
  const currentZoneSlots = selZone ? zoneSlots : []

  return (
    <div className="flex flex-col gap-4 pb-12">

      {/* ── Header ── */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500">{t('manager.slots.eyebrow')}</p>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">{t('manager.slots.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all
                ${viewMode === 'map' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>
              <LayoutGrid size={13} /> Bản đồ
            </button>
            <button onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all
                ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>
              <List size={13} /> Danh sách
            </button>
          </div>
          <button onClick={loadSlots} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(STATUS_CFG).map(([k, cfg]) => (
          <button key={k}
            onClick={() => setFilterStatus(filterStatus === k ? 'all' : k)}
            className={`rounded-xl border p-3 text-left transition-all hover:shadow-sm
              ${filterStatus === k ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-100 bg-white'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{cfg.label}</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stats[k] || 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {totalSlots > 0 ? Math.round((stats[k] || 0) / totalSlots * 100) : 0}%
            </p>
          </button>
        ))}
      </div>

      {/* ── Body: sidebar + content ── */}
      <div className="flex gap-3 min-h-0">

        {/* ━━ LEFT SIDEBAR ━━ */}
        <aside className="w-52 flex-shrink-0 bg-white rounded-xl border border-slate-100 shadow-sm overflow-y-auto p-2 max-h-[calc(100vh-280px)]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 mb-1">{t('manager.slots.locationLabel')}</p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
          ) : hierarchy.map(building => {
            const bSlots = allSlots.filter(s => s.BuildingName === building.name)
            const bAvail = bSlots.filter(s => s.SlotStatus === 'Available').length
            const isExpB = expandedBuildings[building.name]

            return (
              <div key={building.name} className="mb-1">
                <button
                  onClick={() => {
                    setExpandedBuildings(prev => ({ ...prev, [building.name]: !prev[building.name] }))
                    setSelBuilding(building.name)
                    setSelFloor(null); setSelZone(null)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all
                    ${selBuilding === building.name && !selFloor ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <Building2 size={13} className={selBuilding === building.name && !selFloor ? 'text-blue-100' : 'text-slate-400'} />
                  <span className="flex-1 truncate text-xs font-semibold">
                    {building.name.split(' - ').slice(-1)[0] || building.name}
                  </span>
                  <span className={`text-[10px] font-bold ${selBuilding === building.name && !selFloor ? 'text-blue-100' : 'text-slate-400'}`}>
                    {bAvail}
                  </span>
                  <ChevronDown size={11} className={`transition-transform ${isExpB ? 'rotate-180' : ''} ${selBuilding === building.name && !selFloor ? 'text-blue-100' : 'text-slate-300'}`} />
                </button>

                {isExpB && building.floors.map(floor => {
                  const fSlots = allSlots.filter(s => s.BuildingName === building.name && s.FloorName === floor.name)
                  const fAvail = fSlots.filter(s => s.SlotStatus === 'Available').length
                  const isExpF = expandedFloors[`${building.name}-${floor.name}`]

                  return (
                    <div key={floor.name}>
                      <button
                        onClick={() => {
                          const key = `${building.name}-${floor.name}`
                          setExpandedFloors(prev => ({ ...prev, [key]: !prev[key] }))
                          setSelBuilding(building.name); setSelFloor(floor.name); setSelZone(null)
                        }}
                        className={`w-full flex items-center gap-2 pl-6 pr-3 py-1.5 rounded-lg text-left transition-all
                          ${selFloor === floor.name && selBuilding === building.name && !selZone ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                        <Layers size={12} className="text-slate-300 flex-shrink-0" />
                        <span className="flex-1 truncate text-xs font-medium">{floor.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{fAvail}</span>
                        <ChevronDown size={10} className={`transition-transform ${isExpF ? 'rotate-180' : ''} text-slate-300`} />
                      </button>

                      {isExpF && floor.zones.map(zone => {
                        const zSlots = allSlots.filter(s => s.BuildingName === building.name && s.FloorName === floor.name && s.ZoneName === zone.name)
                        const zAvail = zSlots.filter(s => s.SlotStatus === 'Available').length
                        const isAct = selZone === zone.name && selFloor === floor.name && selBuilding === building.name
                        return (
                          <button key={zone.name}
                            onClick={() => { setSelBuilding(building.name); setSelFloor(floor.name); setSelZone(zone.name); setSelectedSlotId(null) }}
                            className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 rounded-lg text-left transition-all
                              ${isAct ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <Grid3X3 size={11} className={isAct ? 'text-blue-100' : 'text-slate-300'} />
                            <span className="flex-1 truncate text-[11px] font-medium">
                              {zone.name.split(' ').slice(-2).join(' ')}
                            </span>
                            <span className={`text-[10px] font-bold ${isAct ? 'text-blue-100' : 'text-slate-400'}`}>{zAvail}</span>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </aside>

        {/* ━━ MAIN CONTENT ━━ */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">

          {/* Breadcrumb + zone info */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
              {selBuilding && <>
                <Building2 size={11} className="text-blue-400" />
                <span className="font-semibold text-slate-600">{selBuilding.split(' - ').slice(-1)[0]}</span>
              </>}
              {selFloor && <><span>›</span><Layers size={11} className="text-blue-400" /><span className="font-medium text-slate-600">{selFloor}</span></>}
              {selZone && <><span>›</span><Grid3X3 size={11} className="text-blue-400" /><span className="font-medium text-slate-600">{selZone}</span></>}
              {!selBuilding && <span className="italic">Chọn vị trí từ menu trái</span>}
            </div>
            {selZone && currentZoneSlots.length > 0 && (
              <div className="w-40 flex-shrink-0">
                <OccupancyBar slots={currentZoneSlots} />
              </div>
            )}
          </div>

          {/* Search (list mode) */}
          {viewMode === 'list' && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('manager.slots.filters.searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all" />
            </div>
          )}

          {/* Content area */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex-1 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : viewMode === 'map' ? (
              /* MAP VIEW */
              selZone ? (
                <div>
                  {/* Gate */}
                  <div className="flex items-center justify-center pt-4 pb-2">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-700 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-white font-bold tracking-widest">CỔNG VÀO / RA</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                  </div>
                  <ZoneMapView slots={zoneSlots} onSelectSlot={setSelectedSlotId} selectedSlotId={selectedSlotId} />
                  {/* Legend */}
                  <div className="flex items-center gap-4 flex-wrap px-4 pb-4 pt-2 border-t border-slate-50">
                    {Object.entries(STATUS_CFG).map(([k, cfg]) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-sm border ${cfg.mapBg.split(' ').slice(0, 2).join(' ')}`} />
                        <span className="text-[11px] text-slate-500 font-medium">{cfg.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-300 gap-2">
                  <Grid3X3 size={40} />
                  <p className="text-sm font-medium">{t('manager.slots.selectZoneHint')}</p>
                </div>
              )
            ) : (
              /* LIST VIEW */
              <div className="overflow-auto max-h-[calc(100vh-380px)]">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                    <tr>
                      {['Mã slot', 'Vị trí', 'Loại xe', 'Trạng thái', 'Xe hiện tại', 'Đỗ từ', ''].map(col => (
                        <th key={col} className="px-4 py-3 font-bold text-[11px] text-slate-400 uppercase tracking-wide">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {displaySlots.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-300 text-sm">{t('manager.slots.empty')}</td></tr>
                    ) : displaySlots.map(slot => (
                      <tr key={slot.SlotID} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-black text-slate-900">{slot.SlotCode}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-700 text-xs">{slot.ZoneName}</p>
                          <p className="text-[11px] text-slate-400">{slot.FloorName} · {slot.BuildingName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-semibold">{slot.VehicleCode}</span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={slot.SlotStatus} /></td>
                        <td className="px-4 py-3">
                          {slot.PlateNumber
                            ? <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5 text-xs font-bold">{slot.PlateNumber}</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {slot.EntryTime ? new Date(slot.EntryTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setSelectedSlotId(slot.SlotID)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all">
                            Chi tiết <ChevronRight size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selectedSlotId && (
        <SlotDetail
          slotId={selectedSlotId}
          onClose={() => setSelectedSlotId(null)}
          onStatusChange={() => { loadSlots(); setSelectedSlotId(null) }}
        />
      )}
    </div>
  )
}

export default ManagerSlots