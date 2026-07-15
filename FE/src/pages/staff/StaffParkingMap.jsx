/**
 * FILE: StaffParkingMap.jsx
 * MÔ TẢ: Bản đồ hiển thị tình trạng bãi đỗ xe theo thời gian thực (Staff).
 * Phân cấp theo Tòa nhà > Tầng > Khu vực. Cho phép xem chi tiết trạng thái từng ô đỗ, 
 * phiên đỗ xe hiện tại, hoặc thông tin đặt chỗ trước.
 */

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import axios from '../../utils/authorizeAxios'
import {
  Map, RefreshCcw, Car, Info, ZoomIn, ZoomOut,
  Building2, Layers, Grid3X3, ChevronRight, X
} from 'lucide-react'

/* ─── Status config ─────────────────────────────────────────── */
const STATUS_CONFIG = {
  available: { labelKey: 'staff.parkingMap.statusAvailable', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  occupied: { labelKey: 'staff.parkingMap.statusOccupied', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', dot: 'bg-red-400' },
  overstay: { labelKey: 'staff.parkingMap.statusOverstay', bg: 'bg-red-100 border-red-500 text-red-950 font-black animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]', border: 'border-red-500', text: 'text-red-950', dot: 'bg-red-600' },
  reserved: { labelKey: 'staff.parkingMap.statusReserved', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', dot: 'bg-amber-400' },
  maintenance: { labelKey: 'staff.parkingMap.statusMaintenance', bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-500', dot: 'bg-slate-400' },
  blocked: { labelKey: 'staff.parkingMap.statusBlocked', bg: 'bg-slate-800', border: 'border-slate-800', text: 'text-white', dot: 'bg-slate-600' },
}

/* ─── Build hierarchy: building → floor → zone ──────────────── */
function buildHierarchy(slots) {
  const buildings = {}

  slots.forEach(slot => {
    const bKey = slot.BuildingID
    const fKey = slot.FloorID
    const zKey = slot.ZoneID

    if (!buildings[bKey]) {
      buildings[bKey] = {
        id: bKey,
        name: slot.BuildingName,
        floors: {}
      }
    }

    const floors = buildings[bKey].floors
    if (!floors[fKey]) {
      floors[fKey] = {
        id: fKey,
        name: slot.FloorName,
        zones: {}
      }
    }

    const zones = floors[fKey].zones
    if (!zones[zKey]) {
      zones[zKey] = {
        id: zKey,
        name: slot.ZoneName,
        slots: []
      }
    }

    zones[zKey].slots.push({
      code: slot.SlotCode,
      status: (slot.SlotStatus || 'Available').toLowerCase(),
      sessionId: slot.SessionID,
      reservationId: slot.ReservationID,
    })
  })

  return Object.values(buildings).map(b => ({
    ...b,
    floors: Object.values(b.floors).map(f => ({
      ...f,
      zones: Object.values(f.zones)
    }))
  }))
}

/* ─── Stat pill ─────────────────────────────────────────────── */
function StatPill({ value, label, color }) {
  return (
    <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 px-3 py-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <span className={`text-lg font-black ${color}`}>{value}</span>
      <span className="text-xs text-slate-400 font-medium">{label}</span>
    </div>
  )
}

/* ─── Sidebar nav item ──────────────────────────────────────── */
function NavItem({ icon: Icon, label, active, onClick, count, indent = 0 }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all text-sm
        ${indent === 1 ? 'pl-6' : indent === 2 ? 'pl-9' : ''}
        ${active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shadow-blue-200 font-semibold'
          : 'text-slate-600 hover:bg-slate-100 font-medium'}`}
    >
      <Icon size={14} className={active ? 'text-blue-100' : 'text-slate-400'} />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold
          ${active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {count}
        </span>
      )}
    </button>
  )
}

/* ─── Main component ────────────────────────────────────────── */
const StaffParkingMap = () => {
  const { t } = useTranslation()
  const [hierarchy, setHierarchy] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [expandedBuildings, setExpandedBuildings] = useState({})
  const [expandedFloors, setExpandedFloors] = useState({})

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        setLoading(true)
        try {
          const res = await axios.get('/staff/parking-map')
          if (cancelled) return
          const slots = res.data?.data || []
          const tree = buildHierarchy(slots)
          setHierarchy(tree)

          // Auto-select first building/floor/zone
          if (tree.length > 0) {
            const b = tree[0]
            setSelectedBuilding(b.id)
            setExpandedBuildings({ [b.id]: true })
            if (b.floors.length > 0) {
              const f = b.floors[0]
              setSelectedFloor(f.id)
              setExpandedFloors({ [f.id]: true })
              if (f.zones.length > 0) setSelectedZone(f.zones[0].id)
            }
          }
        } catch {
          if (!cancelled) setHierarchy([])
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    return () => { cancelled = true }
  }, [refreshTrigger])

  const handleRefresh = () => {
    setSelectedSlot(null)
    setRefreshTrigger(t => t + 1)
  }

  /* ── Derived zone data ── */
  const activeZoneData = useMemo(() => {
    if (!selectedBuilding || !selectedFloor || !selectedZone) return null
    const b = hierarchy.find(b => b.id === selectedBuilding)
    if (!b) return null
    const f = b.floors.find(f => f.id === selectedFloor)
    if (!f) return null
    return f.zones.find(z => z.id === selectedZone) || null
  }, [hierarchy, selectedBuilding, selectedFloor, selectedZone])

  const slots = activeZoneData?.slots || []
  const rows = useMemo(() => {
    const sorted = [...slots].sort((a, b) => a.code.localeCompare(b.code))
    const out = []
    for (let i = 0; i < sorted.length; i += 10) out.push(sorted.slice(i, i + 10))
    return out
  }, [slots])

  const counts = useMemo(() => ({
    total: slots.length,
    available: slots.filter(s => s.status === 'available').length,
    occupied: slots.filter(s => s.status === 'occupied').length,
    overstay: slots.filter(s => s.status === 'overstay').length,
    reserved: slots.filter(s => s.status === 'reserved').length,
    maintenance: slots.filter(s => s.status === 'maintenance').length,
  }), [slots])

  /* ── Select slot ── */
  const handleSelectSlot = async (slot) => {
    if (selectedSlot?.id === slot.code) { setSelectedSlot(null); return }
    try {
      const res = await axios.get(`/staff/slots/${slot.code}`)
      const data = res.data?.data
      setSelectedSlot({
        id: slot.code,
        status: slot.status,
        zone: activeZoneData?.name,
        ...(data || {}),
        error: !data ? t('staff.parkingMap.noDataShort') : null
      })
    } catch {
      setSelectedSlot({ id: slot.code, status: slot.status, zone: activeZoneData?.name, error: t('staff.parkingMap.loadError') })
    }
  }

  const fmt = (ds) => { try { return new Date(ds).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) } catch { return ds || 'N/A' } }
  const fmtCurrency = (v) => v != null ? Number(v).toLocaleString('vi-VN') + ' ₫' : '—'

  /* ── Toggle helpers ── */
  const toggleBuilding = (id) => {
    setExpandedBuildings(prev => ({ ...prev, [id]: !prev[id] }))
  }
  const toggleFloor = (id) => {
    setExpandedFloors(prev => ({ ...prev, [id]: !prev[id] }))
  }

  /* ── Loading ── */
  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-400 font-medium">{t('staff.parkingMap.loading')}</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-slate-50 gap-4">

      {/* ── Header ── */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Map size={20} className="text-blue-600" />
            {t('staff.parkingMap.title')}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('staff.parkingMap.subtitle')}</p>
        </div>
        <button onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <RefreshCcw size={13} /> {t('staff.parkingMap.refresh')}
        </button>
      </header>

      {/* ── Body: sidebar + map + detail ── */}
      <div className="flex gap-3 flex-1 min-h-0">

        {/* ━━ LEFT SIDEBAR: Building > Floor > Zone ━━ */}
        <aside className="w-56 flex-shrink-0 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-y-auto p-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 mb-1">{t('staff.parkingMap.locationLabel')}</p>

          {hierarchy.map(building => {
            const isExpanded = expandedBuildings[building.id]
            const bFloorCount = building.floors.reduce((acc, f) => acc + f.zones.length, 0)

            return (
              <div key={building.id} className="mb-1">
                <NavItem
                  icon={Building2}
                  label={building.name.replace(/Toa [A-Z] - /, '').split(' - ')[0] || building.name}
                  active={selectedBuilding === building.id && !expandedBuildings[building.id]}
                  count={bFloorCount}
                  onClick={() => {
                    setSelectedBuilding(building.id)
                    toggleBuilding(building.id)
                  }}
                />

                {isExpanded && building.floors.map(floor => {
                  const isFloorExpanded = expandedFloors[floor.id]

                  return (
                    <div key={floor.id}>
                      <NavItem
                        icon={Layers}
                        label={floor.name}
                        active={selectedFloor === floor.id && !isFloorExpanded}
                        count={floor.zones.length}
                        indent={1}
                        onClick={() => {
                          setSelectedBuilding(building.id)
                          setSelectedFloor(floor.id)
                          toggleFloor(floor.id)
                        }}
                      />

                      {isFloorExpanded && floor.zones.map(zone => (
                        <NavItem
                          key={zone.id}
                          icon={Grid3X3}
                          label={zone.name.split(' ').slice(-2).join(' ')}
                          active={selectedZone === zone.id}
                          count={zone.slots.filter(s => s.status === 'available').length}
                          indent={2}
                          onClick={() => {
                            setSelectedBuilding(building.id)
                            setSelectedFloor(floor.id)
                            setSelectedZone(zone.id)
                            setSelectedSlot(null)
                          }}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </aside>

        {/* ━━ CENTER: Map ━━ */}
        <div className="flex-1 flex flex-col min-w-0 gap-3">

          {/* Breadcrumb + stats */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-xs text-slate-500">
              {selectedBuilding && (
                <>
                  <Building2 size={12} className="text-blue-500" />
                  <span className="font-semibold text-slate-700">
                    {hierarchy.find(b => b.id === selectedBuilding)?.name?.split(' - ')[0]}
                  </span>
                </>
              )}
              {selectedFloor && (
                <>
                  <ChevronRight size={12} />
                  <Layers size={12} className="text-blue-500" />
                  <span className="font-medium">
                    {hierarchy.find(b => b.id === selectedBuilding)?.floors.find(f => f.id === selectedFloor)?.name}
                  </span>
                </>
              )}
              {activeZoneData && (
                <>
                  <ChevronRight size={12} />
                  <Grid3X3 size={12} className="text-blue-500" />
                  <span className="font-medium">{activeZoneData.name}</span>
                </>
              )}
            </div>

            {/* Stats + zoom */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatPill value={counts.total} label={t('staff.parkingMap.statTotal')} color="text-slate-700" />
              <StatPill value={counts.available} label={t('staff.parkingMap.statAvailable')} color="text-emerald-600" />
              <StatPill value={counts.occupied} label={t('staff.parkingMap.statusOccupied')} color="text-red-500" />
              {counts.overstay > 0 && <StatPill value={counts.overstay} label={t('staff.parkingMap.statusOverstay')} color="text-red-700 animate-pulse font-black" />}
              <StatPill value={counts.reserved} label={t('staff.parkingMap.statusReserved')} color="text-amber-600" />
              {counts.maintenance > 0 && <StatPill value={counts.maintenance} label={t('staff.parkingMap.statusMaintenance')} color="text-slate-500" />}

              <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-xl px-1.5">
                <button onClick={() => setZoom(z => Math.max(0.6, z - 0.1))} className="p-1 text-slate-400 hover:text-slate-700"><ZoomOut size={14} /></button>
                <span className="text-xs font-bold text-slate-600 w-9 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(1.8, z + 0.1))} className="p-1 text-slate-400 hover:text-slate-700"><ZoomIn size={14} /></button>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-sm ${cfg.dot}`} />
                <span className="text-[11px] text-slate-500 font-medium">{t(cfg.labelKey)}</span>
              </div>
            ))}
          </div>

          {/* Map canvas */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-1 overflow-auto p-5">
            {activeZoneData ? (
              <>
                {/* Gate indicator */}
                <div className="flex items-center justify-center mb-5">
                  <div className="flex items-center gap-3 px-6 py-2 bg-slate-700 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-white font-bold tracking-widest">{t('staff.parkingMap.gateLabel', t('staff.parkingMap.gateLabel'))}</span>
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  </div>
                </div>

                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
                  {rows.map((row, ri) => (
                    <div key={ri} className="flex gap-2 mb-2 justify-center">
                      {row.map(slot => {
                        const cfg = STATUS_CONFIG[slot.status] || STATUS_CONFIG.available
                        const isSelected = selectedSlot?.id === slot.code
                        return (
                          <button
                            key={slot.code}
                            onClick={() => handleSelectSlot(slot)}
                            title={`${slot.code} – ${t(cfg.labelKey)}`}
                            className={`w-14 h-14 rounded-3xl border-2 flex flex-col items-center justify-center
                              transition-all duration-150 hover:scale-110 hover:shadow-lg hover:z-10 relative
                              ${isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-300 scale-110 z-10'
                                : `${cfg.bg} ${cfg.border} ${cfg.text}`
                              }`}
                          >
                            <span className="font-bold text-[10px] leading-tight text-center px-0.5">
                              {slot.code.split('-').slice(-1)[0]}
                            </span>
                            {slot.status === 'occupied' && <Car size={11} className="mt-0.5 opacity-80" />}
                            {slot.status === 'overstay' && <Car size={11} className="mt-0.5 animate-bounce text-red-600" />}
                            {slot.status === 'available' && <span className="text-[8px] opacity-50 font-bold mt-0.5">OK</span>}
                            {slot.status === 'reserved' && <span className="text-[8px] font-bold opacity-80 mt-0.5">{t('staff.parkingMap.tagReserved')}</span>}
                            {slot.status === 'maintenance' && <span className="text-[8px] font-bold opacity-70 mt-0.5">BT</span>}
                            {slot.status === 'blocked' && <span className="text-[8px] font-bold opacity-70 mt-0.5">🔒</span>}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300">
                <Grid3X3 size={48} />
                <p className="text-sm font-medium">{t('staff.parkingMap.selectZoneHint')}</p>
              </div>
            )}
          </div>
        </div>

        {/* ━━ RIGHT: Slot detail panel ━━ */}
        <div className="w-60 flex-shrink-0">
          {selectedSlot ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden h-full flex flex-col">
              {/* Panel header */}
              <div className={`px-4 py-3 flex items-center justify-between
                ${STATUS_CONFIG[selectedSlot.status]?.bg} border-b ${STATUS_CONFIG[selectedSlot.status]?.border}`}>
                <div>
                  <p className={`text-lg font-black ${STATUS_CONFIG[selectedSlot.status]?.text}`}>{selectedSlot.id}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wide ${STATUS_CONFIG[selectedSlot.status]?.text} opacity-70`}>
                    {t(STATUS_CONFIG[selectedSlot.status]?.labelKey)}
                  </p>
                </div>
                <button onClick={() => setSelectedSlot(null)}
                  className="p-1 rounded-xl hover:bg-black/10 transition-colors">
                  <X size={14} className={STATUS_CONFIG[selectedSlot.status]?.text} />
                </button>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto p-4 text-xs space-y-4">
                {selectedSlot.error ? (
                  <p className="text-center text-slate-400 py-4">{selectedSlot.error}</p>
                ) : (
                  <>
                    {/* Overstay alert warning */}
                    {selectedSlot.isOvertime && (
                      <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 flex flex-col gap-1 shadow-sm">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                          <span>Cảnh báo: Đỗ quá giờ!</span>
                        </div>
                        <p className="text-[10px] text-red-600">
                          Hạn trả xe dự kiến lúc: {fmt(selectedSlot.bookingEndTime)}
                        </p>
                      </div>
                    )}

                    {/* Zone path */}
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{t('staff.parkingMap.locationLabel')}</p>
                      <p className="text-slate-600 font-medium leading-relaxed">{selectedSlot.zone}</p>
                    </div>

                    {/* Session info */}
                    {selectedSlot.type === 'session' && (
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">{t('staff.parkingMap.sessionTitle')}</p>
                        <div className="space-y-1.5">
                          {selectedSlot.sessionCode && <Row label={t('staff.parkingMap.sessionCode')} value={selectedSlot.sessionCode} bold />}
                          {selectedSlot.plateNumber && <Row label={t('staff.parkingMap.plate')} value={selectedSlot.plateNumber} bold />}
                          {selectedSlot.entryTime && <Row label={t('staff.parkingMap.entryTime')} value={fmt(selectedSlot.entryTime)} />}
                          {selectedSlot.paymentStatus && <Row label={t('staff.parkingMap.payment')} value={selectedSlot.paymentStatus} />}
                          {selectedSlot.finalAmount != null && <Row label={t('staff.parkingMap.totalFee')} value={fmtCurrency(selectedSlot.finalAmount)} bold />}
                          {selectedSlot.prepaidAmount > 0 && <Row label={t('staff.parkingMap.paidAmount')} value={fmtCurrency(selectedSlot.prepaidAmount)} />}
                          {selectedSlot.surchargeAmount > 0 && <Row label={t('staff.parkingMap.surcharge')} value={fmtCurrency(selectedSlot.surchargeAmount)} />}
                        </div>
                      </div>
                    )}

                    {/* Reservation info */}
                    {selectedSlot.type === 'reservation' && (
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">{t('staff.parkingMap.reservationTitle')}</p>
                        <div className="space-y-1.5">
                          {selectedSlot.bookingCode && <Row label={t('staff.parkingMap.bookingCode')} value={selectedSlot.bookingCode} bold />}
                          {selectedSlot.startTime && <Row label={t('staff.parkingMap.startTime')} value={fmt(selectedSlot.startTime)} />}
                          {selectedSlot.endTime && <Row label={t('staff.parkingMap.endTime')} value={fmt(selectedSlot.endTime)} />}
                          {selectedSlot.reservationStatus && <Row label={t('staff.parkingMap.reservationStatus')} value={selectedSlot.reservationStatus} />}
                        </div>
                      </div>
                    )}

                    {/* Driver */}
                    {(selectedSlot.driverName || selectedSlot.driverPhone) && (
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">{t('staff.parkingMap.driverInfo')}</p>
                        <div className="space-y-1.5">
                          {selectedSlot.driverName && <Row label={t('staff.parkingMap.driverName')} value={selectedSlot.driverName} />}
                          {selectedSlot.driverPhone && <Row label={t('staff.parkingMap.driverPhone')} value={selectedSlot.driverPhone} />}
                          {selectedSlot.driverEmail && <Row label={t('staff.parkingMap.driverEmail')} value={selectedSlot.driverEmail} />}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center gap-3 p-6 h-full text-center">
              <div className="w-12 h-12 rounded-3xl bg-slate-50 flex items-center justify-center">
                <Info size={22} className="text-slate-300" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{t('staff.parkingMap.clickHint', t('staff.parkingMap.clickHint'))}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

/* ─── Helper row ───────────────────────────────────────────── */
function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400 flex-shrink-0">{label}</span>
      <span className={`text-right text-slate-700 ${bold ? 'font-bold' : 'font-medium'} break-all`}>{value}</span>
    </div>
  )
}

export default StaffParkingMap