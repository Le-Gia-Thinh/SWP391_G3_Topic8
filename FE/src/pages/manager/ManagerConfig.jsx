/**
 * FILE: ManagerConfig.jsx
 * MÔ TẢ: Trang Quản lý Cấu trúc Bãi Đỗ Xe dành cho Manager.
 * Xem sơ đồ bãi đỗ (Tòa nhà > Tầng > Khu vực > Ô đỗ), đóng/mở tầng, đánh dấu bảo trì/khóa ô đỗ.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Building, Layers, Map, RefreshCcw, ChevronRight, X, Info,
  Wrench, Lock, Unlock, Power, Car, ShieldAlert
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import {
  getBuildingsAPI,
  getFloorsAPI,
  getZonesAPI,
  getParkingSlotsAPI,
  updateFloorAPI,
  updateSlotStatusAPI
} from '../../apis/managerApi'

// ── Cấu hình hiển thị trạng thái slot ─────────────────────────
const SLOT_CFG = {
  Available: { labelKey: 'manager.config.slotStatus.available', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  Occupied: { labelKey: 'manager.config.slotStatus.occupied', dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  Reserved: { labelKey: 'manager.config.slotStatus.reserved', dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 border-violet-200/60' },
  Maintenance: { labelKey: 'manager.config.slotStatus.maintenance', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  Blocked: { labelKey: 'manager.config.slotStatus.blocked', dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 border-red-200/60' }
}

const ManagerConfig = () => {
  const { t } = useTranslation()
  const [isLoaded, setIsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  const [buildings, setBuildings] = useState([])
  const [floors, setFloors] = useState([])
  const [zones, setZones] = useState([])

  const [selectedBuildingId, setSelectedBuildingId] = useState(null)
  const [zoneModal, setZoneModal] = useState(null) // zone đang mở lưới slot

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [bRes, fRes, zRes] = await Promise.all([
        getBuildingsAPI(),
        getFloorsAPI(),
        getZonesAPI()
      ])
      const bData = bRes.data.data || []
      setBuildings(bData)
      setFloors(fRes.data.data || [])
      setZones(zRes.data.data || [])
      if (bData.length > 0 && selectedBuildingId == null) {
        setSelectedBuildingId(bData[0].BuildingID)
      }
    } catch {
      toast.error(t('manager.config.errLoad'))
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Bật/tắt tầng (quyền vận hành của Manager)
  const handleFloorToggle = async (floor) => {
    try {
      await updateFloorAPI(floor.FloorID, {
        floorName: floor.FloorName,
        isActive: floor.IsActive ? 0 : 1
      })
      toast.success(floor.IsActive ? t('manager.config.toastFloorOff', { name: floor.FloorName }) : t('manager.config.toastFloorOn', { name: floor.FloorName }))
      const fRes = await getFloorsAPI()
      setFloors(fRes.data.data || [])
    } catch {
      toast.error(t('manager.config.errFloorToggle'))
    }
  }

  const selectedBuilding = buildings.find(b => b.BuildingID === selectedBuildingId) || null
  const buildingFloors = floors.filter(f => f.BuildingID === selectedBuildingId)
  const zonesOfFloor = (floorId) => zones.filter(z => z.FloorID === floorId)

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">{t('manager.config.eyebrow')}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{t('manager.config.title')}</h1>
        </div>
        <button onClick={loadAll}
          className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 font-bold hover:bg-slate-50 transition self-start">
          <RefreshCcw size={16} /> {t('manager.config.refresh')}
        </button>
      </div>

      {/* Thông báo phạm vi quyền — trung thực với người dùng */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3.5 text-sm font-medium text-blue-800 flex items-start gap-2.5">
        <Info size={18} className="shrink-0 mt-0.5" />
        <p>
          {t('manager.config.scopeNoticePre')} <strong>{t('manager.config.scopeNoticeViewLabel')}</strong> {t('manager.config.scopeNoticeAnd')} <strong>{t('manager.config.scopeNoticeOperateLabel')}</strong>: {t('manager.config.scopeNoticeMid')}
          {t('manager.config.scopeNoticeAdminPre')} <strong>{t('manager.config.scopeNoticeAdminLabel')}</strong> {t('manager.config.scopeNoticeAdminPost')}
        </p>
      </div>

      {/* Chọn tòa nhà */}
      {buildings.length > 0 && (
        <div className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
              <Building size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('manager.config.buildingSection')}</h2>
              <p className="text-[12px] font-medium text-slate-500 font-medium mt-0.5">{t('manager.config.buildingSectionHint')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {buildings.map(b => {
              const active = b.BuildingID === selectedBuildingId
              return (
                <button key={b.BuildingID} onClick={() => setSelectedBuildingId(b.BuildingID)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${active ? 'border-blue-400 bg-blue-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]' : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}>
                  <p className={`text-sm font-bold ${active ? 'text-blue-800' : 'text-slate-800 font-black'}`}>{b.BuildingName}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {t('manager.config.buildingMeta', { floors: b.FloorCount ?? 0, slots: b.SlotCount ?? 0 })}
                  </p>
                </button>
              )
            })}
          </div>
          {selectedBuilding && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-500 font-medium border-t border-slate-100 pt-3">
              <span>{t('manager.config.addressLabel')} <strong className="text-slate-700 font-bold">{selectedBuilding.Address || '—'}</strong></span>
              <span>{t('manager.config.operatingHoursLabel')} <strong className="text-slate-700 font-bold">{selectedBuilding.OperatingHours || '—'}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Các tầng + zone bên trong (phân cấp trực quan) */}
      {buildingFloors.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 text-center text-slate-400">
          <Layers size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-600">{t('manager.config.noFloorsTitle')}</p>
          <p className="text-sm mt-1">{t('manager.config.noFloorsHint')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {buildingFloors.map(floor => (
            <FloorCard
              key={floor.FloorID}
              floor={floor}
              zones={zonesOfFloor(floor.FloorID)}
              onToggle={() => handleFloorToggle(floor)}
              onOpenZone={(z) => setZoneModal(z)}
            />
          ))}
        </div>
      )}

      {/* Modal lưới slot của 1 zone */}
      {zoneModal && (
        <ZoneSlotsModal
          zone={zoneModal}
          onClose={() => setZoneModal(null)}
        />
      )}
    </div>
  )
}

// ── Card 1 tầng: header bật/tắt + danh sách zone ──────────────
const FloorCard = ({ floor, zones, onToggle, onOpenZone }) => {
  const { t } = useTranslation()
  const inactive = !floor.IsActive
  return (
    <section className={`rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-colors ${inactive ? 'border-slate-200/60 opacity-75' : 'border-slate-200/60 hover:border-blue-200'}`}>
      {/* Header tầng */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-3xl ${inactive ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{floor.FloorName}</h3>
              <span className={`inline-flex items-center gap-1.5 rounded-xl px-2 py-0.5 text-[11px] font-semibold border ${floor.IsActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${floor.IsActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {floor.IsActive ? t('manager.config.floorActive') : t('manager.config.floorInactive')}
              </span>
            </div>
            <p className="text-[12px] font-medium text-slate-500 font-medium mt-0.5">
              {t('manager.config.floorMeta', { zones: floor.ZoneCount ?? zones.length, slots: floor.SlotCount ?? 0 })}
            </p>
          </div>
        </div>
        <button onClick={onToggle}
          className={`inline-flex items-center gap-2 rounded-3xl border px-4 py-2 text-sm font-semibold transition ${floor.IsActive
            ? 'border-slate-200 text-slate-700 font-bold hover:bg-slate-50'
            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
          }`}>
          <Power size={15} /> {floor.IsActive ? t('manager.config.turnOffFloor') : t('manager.config.turnOnFloor')}
        </button>
      </div>

      {/* Danh sách zone */}
      <div className="p-5">
        {zones.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">{t('manager.config.noZonesInFloor')}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {zones.map(zone => (
              <ZoneCard key={zone.ZoneID} zone={zone} onOpen={() => onOpenZone(zone)} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Card 1 zone: tên, loại xe, thanh sức chứa actual/total ────
const ZoneCard = ({ zone, onOpen }) => {
  const { t } = useTranslation()
  const total = zone.TotalSlots ?? 0
  const actual = zone.ActualSlots ?? 0
  const pct = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0
  const full = total > 0 && actual >= total

  return (
    <button onClick={onOpen}
      className="text-left rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-500 font-medium group-hover:bg-blue-50 group-hover:text-blue-600 transition">
            <Map size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{zone.ZoneName}</p>
            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <Car size={11} /> {zone.AllowedVehicleName}
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition" />
      </div>

      {/* Thanh sức chứa */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
          <span className="text-slate-500 font-medium">{t('manager.config.capacityLabel')}</span>
          <span className={full ? 'text-amber-600' : 'text-slate-700 font-bold'}>
            {actual}<span className="text-slate-400 font-normal"> / {total || '—'}</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${full ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }} />
        </div>
        {full && (
          <p className="text-[10px] text-amber-600 font-medium mt-1">{t('manager.config.zoneFullHint')}</p>
        )}
      </div>
    </button>
  )
}

// ── Modal: lưới slot của 1 zone + đổi trạng thái Maintenance/Blocked ──
const ZoneSlotsModal = ({ zone, onClose }) => {
  const { t } = useTranslation()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Dùng API slots của Manager, lọc theo zone
      const res = await getParkingSlotsAPI({ zoneId: zone.ZoneID, limit: 200 })
      setSlots(res.data.data || [])
    } catch {
      toast.error(t('manager.config.errLoadSlots'))
    } finally {
      setLoading(false)
    }
  }, [zone.ZoneID, t])

  useEffect(() => { load() }, [load])

  const changeStatus = async (slot, newStatus) => {
    setBusyId(slot.SlotID)
    try {
      await updateSlotStatusAPI(slot.SlotID, { status: newStatus })
      const labels = {
        Available: t('manager.config.actionLabels.available'),
        Maintenance: t('manager.config.actionLabels.maintenance'),
        Blocked: t('manager.config.actionLabels.blocked')
      }
      toast.success(t('manager.config.toastSlotChanged', { action: labels[newStatus], code: slot.SlotCode }))
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('manager.config.errUpdateSlot'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{zone.ZoneName}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {zone.FloorName} · {zone.AllowedVehicleName} · {zone.ActualSlots ?? 0}/{zone.TotalSlots ?? '—'} {t('manager.config.slotUnit')}
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 transition"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {/* Chú thích trạng thái */}
          <div className="flex flex-wrap gap-2 mb-5">
            {Object.entries(SLOT_CFG).map(([k, c]) => (
              <span key={k} className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold border ${c.chip}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{t(c.labelKey)}
              </span>
            ))}
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : slots.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Info size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">{t('manager.config.noSlotsInZone')}</p>
              <p className="text-sm mt-1">{t('manager.config.noSlotsInZoneHint')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slots.map(slot => {
                const cfg = SLOT_CFG[slot.SlotStatus] || SLOT_CFG.Available
                // Manager chỉ thao tác được khi slot KHÔNG đang Occupied/Reserved
                const locked = ['Occupied', 'Reserved'].includes(slot.SlotStatus)
                return (
                  <div key={slot.SlotID}
                    className={`rounded-2xl border p-3 ${busyId === slot.SlotID ? 'opacity-60' : ''} ${cfg.chip}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">{slot.SlotCode}</span>
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    </div>
                    <p className="text-[11px] font-semibold mt-0.5">{t(cfg.labelKey)}</p>
                    {slot.PlateNumber && (
                      <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">🚗 {slot.PlateNumber}</p>
                    )}

                    {/* Hành động: chỉ hiện khi slot rảnh để thao tác */}
                    {locked ? (
                      <p className="mt-2 text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <ShieldAlert size={11} /> {t('manager.config.inUse')}
                      </p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {slot.SlotStatus !== 'Available' && (
                          <button disabled={busyId === slot.SlotID} onClick={() => changeStatus(slot, 'Available')}
                            className="inline-flex items-center gap-1 rounded-xl bg-white/70 border border-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-50">
                            <Unlock size={11} /> {t('manager.config.openBtn')}
                          </button>
                        )}
                        {slot.SlotStatus !== 'Maintenance' && (
                          <button disabled={busyId === slot.SlotID} onClick={() => changeStatus(slot, 'Maintenance')}
                            className="inline-flex items-center gap-1 rounded-xl bg-white/70 border border-amber-200 px-2 py-1 text-[10px] font-bold text-amber-700 hover:bg-amber-50 transition disabled:opacity-50">
                            <Wrench size={11} /> {t('manager.config.maintenanceBtn')}
                          </button>
                        )}
                        {slot.SlotStatus !== 'Blocked' && (
                          <button disabled={busyId === slot.SlotID} onClick={() => changeStatus(slot, 'Blocked')}
                            className="inline-flex items-center gap-1 rounded-xl bg-white/70 border border-red-200 px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-50 transition disabled:opacity-50">
                            <Lock size={11} /> {t('manager.config.blockBtn')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManagerConfig