// src/pages/admin/AdminParkingConfig.jsx

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import {
  Building, Layers, Map, RefreshCcw, Plus, Pencil, Trash2, X, ChevronRight,
  Power, Car, LayoutGrid, Rows3, Info, AlertTriangle, Check
} from 'lucide-react'
import { toast } from 'react-toastify'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import {
  getBuildingsAPI,
  getFloorsAPI, createFloorAPI, updateFloorAPI, deleteFloorAPI,
  getZonesAPI, createZoneAPI, updateZoneAPI, deleteZoneAPI,
  getSlotsByZoneAPI, createSlotAPI, createSlotsBulkAPI, updateSlotAPI, deleteSlotAPI
} from '../../apis/adminApi'

// SLOT_CFG: bỏ label tĩnh, dùng key 'available'/'occupied'/... để t() tại nơi dùng
const SLOT_CFG = {
  Available: { key: 'available', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' },
  Occupied: { key: 'occupied', dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 border-blue-200/70' },
  Reserved: { key: 'reserved', dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 border-violet-200/70' },
  Maintenance: { key: 'maintenance', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-200/70' },
  Blocked: { key: 'blocked', dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 border-red-200/70' }
}

// Loại xe thường gặp (fallback nếu chưa load được từ DB). VehicleTypeID khớp seed data.
const VEHICLE_TYPES = [
  { VehicleTypeID: 1, VehicleName: 'Xe máy' },
  { VehicleTypeID: 2, VehicleName: 'Ô tô' }
]

const AdminParkingConfig = () => {
  const { t } = useTranslation()
  const [isLoaded, setIsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  const [buildings, setBuildings] = useState([])
  const [floors, setFloors] = useState([])
  const [zones, setZones] = useState([])
  const [selectedBuildingId, setSelectedBuildingId] = useState(null)

  // Modal states
  const [floorModal, setFloorModal] = useState(null) // { mode: 'create'|'edit', data? }
  const [zoneModal, setZoneModal] = useState(null) // { mode, floorId, data? }
  const [slotPanel, setSlotPanel] = useState(null) // zone đang mở quản lý slot
  const [confirm, setConfirm] = useState(null) // { type, label, onYes }
  const [busy, setBusy] = useState(false)

  // ── Load dữ liệu ────────────────────────────────────────────
  const loadStructure = useCallback(async (buildingId) => {
    try {
      const [fRes, zRes] = await Promise.all([
        getFloorsAPI(buildingId),
        getZonesAPI()
      ])
      setFloors(fRes.data.data || [])
      setZones(zRes.data.data || [])
    } catch {
      toast.error(t('admin.parkingConfig.loadStructureFail'))
    }
  }, [t])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const bRes = await getBuildingsAPI()
      const bData = bRes.data.data || []
      setBuildings(bData)
      const bid = selectedBuildingId ?? bData[0]?.BuildingID ?? null
      if (bid != null) {
        setSelectedBuildingId(bid)
        await loadStructure(bid)
      }
    } catch {
      toast.error(t('admin.parkingConfig.loadBuildingsFail'))
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const switchBuilding = async (bid) => {
    setSelectedBuildingId(bid)
    await loadStructure(bid)
  }
  const refresh = () => loadStructure(selectedBuildingId)

  // ── Floor actions ───────────────────────────────────────────
  const toggleFloor = async (floor) => {
    try {
      await updateFloorAPI(floor.FloorID, { isActive: floor.IsActive ? 0 : 1 })
      toast.success(floor.IsActive
        ? t('admin.parkingConfig.floor.toggleOffSuccess', { name: floor.FloorName })
        : t('admin.parkingConfig.floor.toggleOnSuccess', { name: floor.FloorName }))
      refresh()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.parkingConfig.floor.toggleFail'))
    }
  }
  const askDeleteFloor = (floor) => setConfirm({
    type: 'floor',
    label: t('admin.parkingConfig.floor.deleteConfirmLabel', { name: floor.FloorName }),
    onYes: async () => {
      await deleteFloorAPI(floor.FloorID)
      toast.success(t('admin.parkingConfig.floor.deleteSuccess'))
      refresh()
    }
  })

  // ── Zone actions ────────────────────────────────────────────
  const askDeleteZone = (zone) => setConfirm({
    type: 'zone',
    label: t('admin.parkingConfig.zone.deleteConfirmLabel', { name: zone.ZoneName }),
    onYes: async () => {
      await deleteZoneAPI(zone.ZoneID)
      toast.success(t('admin.parkingConfig.zone.deleteSuccess'))
      refresh()
    }
  })

  const runConfirm = async () => {
    if (!confirm) return
    setBusy(true)
    try {
      await confirm.onYes()
      setConfirm(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.parkingConfig.confirmFail'))
    } finally {
      setBusy(false)
    }
  }

  const selectedBuilding = buildings.find(b => b.BuildingID === selectedBuildingId) || null
  const buildingFloors = floors.filter(f => f.BuildingID === selectedBuildingId)
  const zonesOfFloor = (fid) => zones.filter(z => z.FloorID === fid)

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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">{t('admin.parkingConfig.eyebrow')}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{t('admin.parkingConfig.title')}</h1>
        </div>
        <button onClick={refresh}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition self-start">
          <RefreshCcw size={16} /> {t('admin.parkingConfig.refresh')}
        </button>
      </div>

      {/* Giải thích sức chứa — giải quyết hiểu lầm "5/10" */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3.5 text-sm font-medium text-blue-800 flex items-start gap-2.5">
        <Info size={18} className="shrink-0 mt-0.5" />
        <p dangerouslySetInnerHTML={{ __html: t('admin.parkingConfig.capacityNotice') }} />
      </div>

      {/* Chọn tòa nhà */}
      {buildings.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 shadow-sm border border-slate-200/60 text-center text-slate-400">
          <Building size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-600">{t('admin.parkingConfig.noBuildings.title')}</p>
          <p className="text-sm mt-1">{t('admin.parkingConfig.noBuildings.hint')}</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t('admin.parkingConfig.chooseBuilding.title')}</h2>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">{t('admin.parkingConfig.chooseBuilding.hint')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {buildings.map(b => {
              const active = b.BuildingID === selectedBuildingId
              return (
                <button key={b.BuildingID} onClick={() => switchBuilding(b.BuildingID)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${active ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-blue-200'}`}>
                  <p className={`text-sm font-bold ${active ? 'text-blue-800' : 'text-slate-800'}`}>{b.BuildingName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t('admin.parkingConfig.chooseBuilding.floorsAndSlots', { floors: b.ActualFloors ?? 0, slots: b.SlotCount ?? 0 })}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Khu vực Tầng */}
      {selectedBuilding && (
        <div className="rounded-3xl bg-white shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Layers size={20} /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t('admin.parkingConfig.floorsSection.titlePrefix')} {selectedBuilding.BuildingName}</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">{buildingFloors.length} {t('admin.parkingConfig.floorsSection.countSuffix')}</p>
              </div>
            </div>
            <button onClick={() => setFloorModal({ mode: 'create' })}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95 transition-all">
              <Plus size={16} /> {t('admin.parkingConfig.floorsSection.addFloor')}
            </button>
          </div>

          <div className="p-5">
            {buildingFloors.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Layers size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">{t('admin.parkingConfig.floorsSection.emptyTitle')}</p>
                <p className="text-sm mt-1">{t('admin.parkingConfig.floorsSection.emptyHint')}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {buildingFloors.map(floor => (
                  <FloorBlock
                    key={floor.FloorID}
                    floor={floor}
                    zones={zonesOfFloor(floor.FloorID)}
                    onToggle={() => toggleFloor(floor)}
                    onEdit={() => setFloorModal({ mode: 'edit', data: floor })}
                    onDelete={() => askDeleteFloor(floor)}
                    onAddZone={() => setZoneModal({ mode: 'create', floorId: floor.FloorID })}
                    onEditZone={(z) => setZoneModal({ mode: 'edit', floorId: floor.FloorID, data: z })}
                    onDeleteZone={(z) => askDeleteZone(z)}
                    onManageSlots={(z) => setSlotPanel(z)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {floorModal && (
        <FloorModal
          mode={floorModal.mode}
          data={floorModal.data}
          buildingId={selectedBuildingId}
          onClose={() => setFloorModal(null)}
          onSaved={() => { setFloorModal(null); refresh() }}
        />
      )}
      {zoneModal && (
        <ZoneModal
          mode={zoneModal.mode}
          data={zoneModal.data}
          floorId={zoneModal.floorId}
          onClose={() => setZoneModal(null)}
          onSaved={() => { setZoneModal(null); refresh() }}
        />
      )}
      {slotPanel && (
        <SlotPanel
          zone={slotPanel}
          onClose={() => setSlotPanel(null)}
          onChanged={refresh}
        />
      )}

      {/* Confirm xóa */}
      <Modal
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        title={t('admin.parkingConfig.confirmModal.title')}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)} disabled={busy}>{t('admin.parkingConfig.confirmModal.cancel')}</Button>
            <Button variant="danger" onClick={runConfirm} isLoading={busy}>{t('admin.parkingConfig.confirmModal.confirm')}</Button>
          </>
        )}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">{confirm?.label}</p>
        </div>
      </Modal>
    </div>
  )
}

// ── Block 1 tầng: header (toggle/sửa/xóa) + lưới zone ─────────
const FloorBlock = ({ floor, zones, onToggle, onEdit, onDelete, onAddZone, onEditZone, onDeleteZone, onManageSlots }) => {
  const { t } = useTranslation()
  const inactive = !floor.IsActive
  return (
    <section className={`rounded-2xl border ${inactive ? 'border-slate-200 bg-slate-50/50' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${inactive ? 'bg-slate-200 text-slate-500' : 'bg-indigo-50 text-indigo-600'}`}>
            <Layers size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">{floor.FloorName}</h3>
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${floor.IsActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${floor.IsActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {floor.IsActive ? t('admin.parkingConfig.floor.active') : t('admin.parkingConfig.floor.inactive')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{t('admin.parkingConfig.floor.zoneAndSlotCount', { zones: floor.ZoneCount ?? zones.length, slots: floor.SlotCount ?? 0 })}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onToggle} title={floor.IsActive ? t('admin.parkingConfig.floor.toggleOffTitle') : t('admin.parkingConfig.floor.toggleOnTitle')}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${floor.IsActive ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
            <Power size={13} /> {floor.IsActive ? t('admin.parkingConfig.floor.toggleOff') : t('admin.parkingConfig.floor.toggleOn')}
          </button>
          <button onClick={onEdit} title={t('admin.parkingConfig.floor.editTitle')} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"><Pencil size={15} /></button>
          <button onClick={onDelete} title={t('admin.parkingConfig.floor.deleteTitle')} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"><Trash2 size={15} /></button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">{t('admin.parkingConfig.floor.zonesHeading')}</p>
          <button onClick={onAddZone}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-blue-200 transition">
            <Plus size={13} /> {t('admin.parkingConfig.floor.addZone')}
          </button>
        </div>
        {zones.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">{t('admin.parkingConfig.floor.zonesEmpty')}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {zones.map(z => (
              <ZoneCard key={z.ZoneID} zone={z}
                onManage={() => onManageSlots(z)}
                onEdit={() => onEditZone(z)}
                onDelete={() => onDeleteZone(z)} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Card zone: thanh sức chứa + nút quản lý slot/sửa/xóa ──────
const ZoneCard = ({ zone, onManage, onEdit, onDelete }) => {
  const { t } = useTranslation()
  const total = zone.TotalSlots ?? 0
  const actual = zone.ActualSlots ?? 0
  const pct = total > 0 ? Math.min(100, Math.round((actual / total) * 100)) : 0
  const full = total > 0 && actual >= total

  return (
    <div className="rounded-2xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500"><Map size={16} /></div>
          <div>
            <p className="text-sm font-bold text-slate-900">{zone.ZoneName}</p>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5"><Car size={11} /> {zone.AllowedVehicleName}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
          <button onClick={onEdit} title={t('admin.parkingConfig.zone.editTitle')} className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"><Pencil size={14} /></button>
          <button onClick={onDelete} title={t('admin.parkingConfig.zone.deleteTitle')} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
          <span className="text-slate-500">{t('admin.parkingConfig.zone.capacityLabel')}</span>
          <span className={full ? 'text-amber-600' : 'text-slate-700'}>{actual}<span className="text-slate-400 font-normal"> / {total || '—'}</span></span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${full ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <button onClick={onManage}
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition">
        <LayoutGrid size={14} /> {t('admin.parkingConfig.zone.manageSlots')}
      </button>
    </div>
  )
}

// ── Modal thêm/sửa Tầng ──────────────────────────────────────
const FloorModal = ({ mode, data, buildingId, onClose, onSaved }) => {
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { floorName: data?.FloorName || '' }
  })

  const onSubmit = async (form) => {
    try {
      if (mode === 'edit') {
        await updateFloorAPI(data.FloorID, { floorName: form.floorName })
        toast.success(t('admin.parkingConfig.floorModal.updateSuccess'))
      } else {
        await createFloorAPI({ buildingId, floorName: form.floorName, isActive: 1 })
        toast.success(t('admin.parkingConfig.floorModal.createSuccess'))
      }
      onSaved()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.parkingConfig.floorModal.saveFail'))
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={mode === 'edit' ? t('admin.parkingConfig.floorModal.titleEdit') : t('admin.parkingConfig.floorModal.titleCreate')}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>{t('admin.parkingConfig.floorModal.cancel')}</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>{isSubmitting ? t('admin.parkingConfig.floorModal.saving') : mode === 'edit' ? t('admin.parkingConfig.floorModal.save') : t('admin.parkingConfig.floorModal.create')}</Button>
        </>
      )}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('admin.parkingConfig.floorModal.label')}</label>
          <input {...register('floorName', { required: t('admin.parkingConfig.floorModal.required') })} placeholder={t('admin.parkingConfig.floorModal.placeholder')}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          {errors.floorName && <p className="text-xs text-red-500 mt-1">{errors.floorName.message}</p>}
        </div>
      </form>
    </Modal>
  )
}

// ── Modal thêm/sửa Khu vực (Zone) ────────────────────────────
const ZoneModal = ({ mode, data, floorId, onClose, onSaved }) => {
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      zoneName: data?.ZoneName || '',
      allowedVehicleTypeId: data?.AllowedVehicleTypeID ? String(data.AllowedVehicleTypeID) : '1',
      totalSlots: data?.TotalSlots ?? 10
    }
  })

  const onSubmit = async (form) => {
    const payload = {
      zoneName: form.zoneName,
      allowedVehicleTypeId: Number(form.allowedVehicleTypeId),
      totalSlots: Number(form.totalSlots)
    }
    try {
      if (mode === 'edit') {
        await updateZoneAPI(data.ZoneID, payload)
        toast.success(t('admin.parkingConfig.zoneModal.updateSuccess'))
      } else {
        await createZoneAPI({ floorId, ...payload })
        toast.success(t('admin.parkingConfig.zoneModal.createSuccess'))
      }
      onSaved()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.parkingConfig.zoneModal.saveFail'))
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={mode === 'edit' ? t('admin.parkingConfig.zoneModal.titleEdit') : t('admin.parkingConfig.zoneModal.titleCreate')}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>{t('admin.parkingConfig.zoneModal.cancel')}</Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>{isSubmitting ? t('admin.parkingConfig.zoneModal.saving') : mode === 'edit' ? t('admin.parkingConfig.zoneModal.save') : t('admin.parkingConfig.zoneModal.create')}</Button>
        </>
      )}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('admin.parkingConfig.zoneModal.nameLabel')}</label>
          <input {...register('zoneName', { required: t('admin.parkingConfig.zoneModal.nameRequired') })} placeholder={t('admin.parkingConfig.zoneModal.namePlaceholder')}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          {errors.zoneName && <p className="text-xs text-red-500 mt-1">{errors.zoneName.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('admin.parkingConfig.zoneModal.vehicleTypeLabel')}</label>
            <select {...register('allowedVehicleTypeId')}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition">
              {VEHICLE_TYPES.map(v => <option key={v.VehicleTypeID} value={v.VehicleTypeID}>{v.VehicleName}</option>)}
            </select>
            {mode === 'edit' && <p className="text-[11px] text-slate-400 mt-1">{t('admin.parkingConfig.zoneModal.vehicleTypeEditHint')}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('admin.parkingConfig.zoneModal.totalSlotsLabel')}</label>
            <input type="number" min="0" {...register('totalSlots', { min: { value: 0, message: t('admin.parkingConfig.zoneModal.totalSlotsInvalid') } })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            {errors.totalSlots && <p className="text-xs text-red-500 mt-1">{errors.totalSlots.message}</p>}
          </div>
        </div>
        <p className="text-[12px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
          {t('admin.parkingConfig.zoneModal.helperNotice')}
        </p>
      </form>
    </Modal>
  )
}

// ── Panel quản lý Slot của 1 zone (thêm/sửa/xóa/bulk) ─────────
const SlotPanel = ({ zone, onClose, onChanged }) => {
  const { t } = useTranslation()
  const [data, setData] = useState(null) // { zone:{...}, slots:[...] }
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [tab, setTab] = useState('grid') // 'grid' | 'add' | 'bulk'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getSlotsByZoneAPI(zone.ZoneID)
      setData(res.data)
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.parkingConfig.slot.panel.loadFail'))
    } finally {
      setLoading(false)
    }
  }, [zone.ZoneID, t])

  useEffect(() => { load() }, [load])

  const cap = data?.zone
  const full = cap && cap.totalSlots != null && cap.actualSlots >= cap.totalSlots

  // Single add
  const addForm = useForm({ defaultValues: { slotCode: '' } })
  const submitAdd = async (form) => {
    try {
      await createSlotAPI({ zoneId: zone.ZoneID, slotCode: form.slotCode })
      toast.success(t('admin.parkingConfig.slot.panel.addSuccess', { code: form.slotCode.toUpperCase() }))
      addForm.reset({ slotCode: '' })
      await load(); onChanged?.()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.parkingConfig.slot.panel.addFail'))
    }
  }

  // Bulk add
  const bulkForm = useForm({ defaultValues: { prefix: '', start: 1, end: 10, pad: 2 } })
  const submitBulk = async (form) => {
    try {
      const res = await createSlotsBulkAPI({
        zoneId: zone.ZoneID,
        prefix: form.prefix,
        start: Number(form.start),
        end: Number(form.end),
        pad: Number(form.pad)
      })
      const { createdCount, skippedCount } = res.data.data
      toast.success(
        t('admin.parkingConfig.slot.panel.bulkSuccess', { count: createdCount })
                + (skippedCount ? t('admin.parkingConfig.slot.panel.bulkSkipped', { count: skippedCount }) : '')
      )
      bulkForm.reset({ prefix: form.prefix, start: Number(form.end) + 1, end: Number(form.end) + 10, pad: Number(form.pad) })
      await load(); onChanged?.()
      setTab('grid')
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.parkingConfig.slot.panel.bulkFail'))
    }
  }

  const cycleStatus = async (slot, newStatus) => {
    setBusyId(slot.SlotID)
    try {
      await updateSlotAPI(slot.SlotID, { slotStatus: newStatus })
      await load(); onChanged?.()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.parkingConfig.slot.panel.updateFail'))
    } finally {
      setBusyId(null)
    }
  }
  const removeSlot = async (slot) => {
    setBusyId(slot.SlotID)
    try {
      await deleteSlotAPI(slot.SlotID)
      toast.success(t('admin.parkingConfig.slot.panel.deleteSuccess', { code: slot.SlotCode }))
      await load(); onChanged?.()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.parkingConfig.slot.panel.deleteFail'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{zone.ZoneName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('admin.parkingConfig.slot.panel.floorAndVehicle', { floor: zone.FloorName, vehicle: zone.AllowedVehicleName })}
              {cap && <> · <strong className={full ? 'text-amber-600' : 'text-slate-700'}>{cap.actualSlots}/{cap.totalSlots ?? '—'}</strong> {t('admin.parkingConfig.slot.panel.slotCountSuffix')}</>}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 transition"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {[
            { k: 'grid', labelKey: 'tabGrid', icon: LayoutGrid },
            { k: 'add', labelKey: 'tabAdd', icon: Plus },
            { k: 'bulk', labelKey: 'tabBulk', icon: Rows3 }
          ].map(tt => {
            const Icon = tt.icon
            const on = tab === tt.k
            return (
              <button key={tt.k} onClick={() => setTab(tt.k)}
                className={`inline-flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-sm font-semibold border-b-2 transition ${on ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <Icon size={15} /> {t(`admin.parkingConfig.slot.panel.${tt.labelKey}`)}
              </button>
            )
          })}
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {/* Tab: danh sách slot */}
          {tab === 'grid' && (
            <>
              <div className="flex flex-wrap gap-2 mb-5">
                {Object.entries(SLOT_CFG).map(([k, c]) => (
                  <span key={k} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold border ${c.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{t(`admin.parkingConfig.slot.status.${k}`)}
                  </span>
                ))}
              </div>
              {loading ? (
                <div className="py-16 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
              ) : !data?.slots?.length ? (
                <div className="py-16 text-center text-slate-400">
                  <LayoutGrid size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">{t('admin.parkingConfig.slot.panel.gridEmptyTitle')}</p>
                  <p className="text-sm mt-1">{t('admin.parkingConfig.slot.panel.gridEmptyHint')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {data.slots.map(slot => {
                    const cfg = SLOT_CFG[slot.SlotStatus] || SLOT_CFG.Available
                    const locked = ['Occupied', 'Reserved'].includes(slot.SlotStatus)
                    return (
                      <div key={slot.SlotID} className={`rounded-2xl border p-3 ${busyId === slot.SlotID ? 'opacity-60' : ''} ${cfg.chip}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 text-sm">{slot.SlotCode}</span>
                          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        </div>
                        <p className="text-[11px] font-semibold mt-0.5">{t(`admin.parkingConfig.slot.status.${slot.SlotStatus}`)}</p>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {locked ? (
                            <span className="text-[10px] text-slate-500">{t('admin.parkingConfig.slot.panel.lockedNotice')}</span>
                          ) : (
                            <>
                              {slot.SlotStatus !== 'Available' && (
                                <button disabled={busyId === slot.SlotID} onClick={() => cycleStatus(slot, 'Available')}
                                  className="inline-flex items-center gap-1 rounded-lg bg-white/70 border border-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-50"><Check size={11} /> {t('admin.parkingConfig.slot.panel.markAvailable')}</button>
                              )}
                              {slot.SlotStatus !== 'Maintenance' && (
                                <button disabled={busyId === slot.SlotID} onClick={() => cycleStatus(slot, 'Maintenance')}
                                  className="inline-flex items-center gap-1 rounded-lg bg-white/70 border border-amber-200 px-2 py-1 text-[10px] font-bold text-amber-700 hover:bg-amber-50 transition disabled:opacity-50">{t('admin.parkingConfig.slot.panel.markMaintenance')}</button>
                              )}
                              {slot.SlotStatus !== 'Blocked' && (
                                <button disabled={busyId === slot.SlotID} onClick={() => cycleStatus(slot, 'Blocked')}
                                  className="inline-flex items-center gap-1 rounded-lg bg-white/70 border border-red-200 px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-50 transition disabled:opacity-50">{t('admin.parkingConfig.slot.panel.markBlocked')}</button>
                              )}
                              <button disabled={busyId === slot.SlotID} onClick={() => removeSlot(slot)} title={t('admin.parkingConfig.slot.panel.deleteSlotTitle')}
                                className="inline-flex items-center gap-1 rounded-lg bg-white/70 border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-50 transition disabled:opacity-50"><Trash2 size={11} /></button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Tab: thêm 1 slot */}
          {tab === 'add' && (
            <div className="max-w-md">
              {full && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 mb-4 flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  {t('admin.parkingConfig.slot.panel.fullNotice', { actual: cap.actualSlots, total: cap.totalSlots })}
                </div>
              )}
              <form onSubmit={addForm.handleSubmit(submitAdd)} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('admin.parkingConfig.slot.panel.addCodeLabel')}</label>
                  <input {...addForm.register('slotCode', { required: t('admin.parkingConfig.slot.panel.addCodeRequired') })} placeholder={t('admin.parkingConfig.slot.panel.addCodePlaceholder')}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition uppercase" />
                  {addForm.formState.errors.slotCode && <p className="text-xs text-red-500 mt-1">{addForm.formState.errors.slotCode.message}</p>}
                  <p className="text-[11px] text-slate-400 mt-1">{t('admin.parkingConfig.slot.panel.addCodeHint', { vehicle: zone.AllowedVehicleName })}</p>
                </div>
                <Button onClick={addForm.handleSubmit(submitAdd)} disabled={addForm.formState.isSubmitting || full}>
                  {addForm.formState.isSubmitting ? t('admin.parkingConfig.slot.panel.adding') : t('admin.parkingConfig.slot.panel.addButton')}
                </Button>
              </form>
            </div>
          )}

          {/* Tab: thêm hàng loạt */}
          {tab === 'bulk' && (
            <div className="max-w-lg">
              {full && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 mb-4 flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  {t('admin.parkingConfig.slot.panel.fullNoticeShort', { actual: cap.actualSlots, total: cap.totalSlots })}
                </div>
              )}
              <form onSubmit={bulkForm.handleSubmit(submitBulk)} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('admin.parkingConfig.slot.panel.bulkPrefixLabel')}</label>
                  <input {...bulkForm.register('prefix', { required: t('admin.parkingConfig.slot.panel.bulkPrefixRequired') })} placeholder={t('admin.parkingConfig.slot.panel.bulkPrefixPlaceholder')}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition uppercase" />
                  {bulkForm.formState.errors.prefix && <p className="text-xs text-red-500 mt-1">{bulkForm.formState.errors.prefix.message}</p>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('admin.parkingConfig.slot.panel.bulkStartLabel')}</label>
                    <input type="number" min="0" {...bulkForm.register('start')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('admin.parkingConfig.slot.panel.bulkEndLabel')}</label>
                    <input type="number" min="0" {...bulkForm.register('end')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('admin.parkingConfig.slot.panel.bulkPadLabel')}</label>
                    <input type="number" min="1" max="4" {...bulkForm.register('pad')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                  </div>
                </div>
                <BulkPreview bulkForm={bulkForm} />
                <Button onClick={bulkForm.handleSubmit(submitBulk)} disabled={bulkForm.formState.isSubmitting || full}>
                  {bulkForm.formState.isSubmitting ? t('admin.parkingConfig.slot.panel.bulkCreating') : t('admin.parkingConfig.slot.panel.bulkButton')}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Xem trước mã sẽ sinh ra trong bulk
const BulkPreview = ({ bulkForm }) => {
  const { t } = useTranslation()
  const prefix = (bulkForm.watch('prefix') || '').toUpperCase()
  const start = Number(bulkForm.watch('start'))
  const end = Number(bulkForm.watch('end'))
  const pad = Number(bulkForm.watch('pad')) || 2
  if (!prefix || !Number.isInteger(start) || !Number.isInteger(end) || end < start) {
    return <p className="text-[12px] text-slate-400">{t('admin.parkingConfig.slot.panel.previewHint')}</p>
  }
  const count = end - start + 1
  const sample = []
  for (let i = start; i <= Math.min(end, start + 2); i++) sample.push(prefix + String(i).padStart(pad, '0'))
  const tail = count > 3 ? `… ${prefix}${String(end).padStart(pad, '0')}` : ''
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
      <p className="text-[12px] font-semibold text-slate-600" dangerouslySetInnerHTML={{ __html: t('admin.parkingConfig.slot.panel.previewCount', { count }) }} />
      <p className="text-[12px] text-slate-500 mt-1 font-mono">{sample.join(', ')}{tail}</p>
    </div>
  )
}

export default AdminParkingConfig