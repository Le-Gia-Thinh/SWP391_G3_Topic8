// src/pages/admin/AdminParkingConfig.jsx

import { useState, useEffect, useCallback } from 'react'
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

const SLOT_CFG = {
    Available: { label: 'Trống', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' },
    Occupied: { label: 'Đang đỗ', dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 border-blue-200/70' },
    Reserved: { label: 'Đặt trước', dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 border-violet-200/70' },
    Maintenance: { label: 'Bảo trì', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-200/70' },
    Blocked: { label: 'Đã khóa', dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 border-red-200/70' }
}

// Loại xe thường gặp (fallback nếu chưa load được từ DB). VehicleTypeID khớp seed data.
const VEHICLE_TYPES = [
    { VehicleTypeID: 1, VehicleName: 'Xe máy' },
    { VehicleTypeID: 2, VehicleName: 'Ô tô' }
]

const AdminParkingConfig = () => {
    const [isLoaded, setIsLoaded] = useState(false)
    const [loading, setLoading] = useState(true)

    const [buildings, setBuildings] = useState([])
    const [floors, setFloors] = useState([])
    const [zones, setZones] = useState([])
    const [selectedBuildingId, setSelectedBuildingId] = useState(null)

    // Modal states
    const [floorModal, setFloorModal] = useState(null)   // { mode: 'create'|'edit', data? }
    const [zoneModal, setZoneModal] = useState(null)      // { mode, floorId, data? }
    const [slotPanel, setSlotPanel] = useState(null)      // zone đang mở quản lý slot
    const [confirm, setConfirm] = useState(null)          // { type, label, onYes }
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
            toast.error('Không thể tải cấu trúc bãi đỗ')
        }
    }, [])

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
            toast.error('Không thể tải danh sách tòa nhà')
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
            toast.success(`Đã ${floor.IsActive ? 'tắt' : 'bật'} ${floor.FloorName}`)
            refresh()
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Cập nhật trạng thái tầng thất bại')
        }
    }
    const askDeleteFloor = (floor) => setConfirm({
        type: 'floor',
        label: `Xóa ${floor.FloorName}? Tầng phải không còn khu vực bên trong.`,
        onYes: async () => {
            await deleteFloorAPI(floor.FloorID)
            toast.success('Đã xóa tầng')
            refresh()
        }
    })

    // ── Zone actions ────────────────────────────────────────────
    const askDeleteZone = (zone) => setConfirm({
        type: 'zone',
        label: `Xóa khu vực "${zone.ZoneName}"? Khu vực phải không còn slot bên trong.`,
        onYes: async () => {
            await deleteZoneAPI(zone.ZoneID)
            toast.success('Đã xóa khu vực')
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
            toast.error(err?.response?.data?.message || 'Thao tác thất bại')
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
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">Quản trị / Hạ tầng</p>
                    <h1 className="text-2xl font-bold text-slate-900 mt-1">Cấu hình Bãi đỗ</h1>
                </div>
                <button onClick={refresh}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition self-start">
                    <RefreshCcw size={16} /> Làm mới
                </button>
            </div>

            {/* Giải thích sức chứa — giải quyết hiểu lầm "5/10" */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3.5 text-sm font-medium text-blue-800 flex items-start gap-2.5">
                <Info size={18} className="shrink-0 mt-0.5" />
                <p>
                    Mỗi khu vực có <strong>sức chứa tối đa</strong> (số bạn đặt) và <strong>số slot thực tế</strong> (số ô đỗ đã tạo).
                    Thanh <strong>5 / 10</strong> nghĩa là đã tạo 5 ô trên tối đa 10. Muốn thêm ô, bấm <strong>Thêm slot</strong>;
                    khi đã đầy, tăng sức chứa của khu vực trước.
                </p>
            </div>

            {/* Chọn tòa nhà */}
            {buildings.length === 0 ? (
                <div className="rounded-3xl bg-white p-10 shadow-sm border border-slate-200/60 text-center text-slate-400">
                    <Building size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold text-slate-600">Chưa có tòa nhà nào</p>
                    <p className="text-sm mt-1">Tạo tòa nhà ở trang Quản lý cơ sở trước, rồi quay lại đây.</p>
                </div>
            ) : (
                <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/60">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building size={20} /></div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Chọn tòa nhà</h2>
                            <p className="text-[12px] font-medium text-slate-500 mt-0.5">Quản lý tầng, khu vực và slot bên trong tòa đã chọn.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        {buildings.map(b => {
                            const active = b.BuildingID === selectedBuildingId
                            return (
                                <button key={b.BuildingID} onClick={() => switchBuilding(b.BuildingID)}
                                    className={`rounded-2xl border px-4 py-3 text-left transition ${active ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-blue-200'}`}>
                                    <p className={`text-sm font-bold ${active ? 'text-blue-800' : 'text-slate-800'}`}>{b.BuildingName}</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{b.ActualFloors ?? 0} tầng · {b.SlotCount ?? 0} slot</p>
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
                                <h2 className="text-lg font-bold text-slate-900">Tầng trong {selectedBuilding.BuildingName}</h2>
                                <p className="text-[12px] font-medium text-slate-500 mt-0.5">{buildingFloors.length} tầng</p>
                            </div>
                        </div>
                        <button onClick={() => setFloorModal({ mode: 'create' })}
                            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95 transition-all">
                            <Plus size={16} /> Thêm tầng
                        </button>
                    </div>

                    <div className="p-5">
                        {buildingFloors.length === 0 ? (
                            <div className="py-10 text-center text-slate-400">
                                <Layers size={36} className="mx-auto mb-2 text-slate-300" />
                                <p className="font-semibold text-slate-600">Chưa có tầng nào</p>
                                <p className="text-sm mt-1">Bấm “Thêm tầng” để bắt đầu.</p>
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
                title="Xác nhận xóa"
                footer={(
                    <>
                        <Button variant="secondary" onClick={() => setConfirm(null)} disabled={busy}>Hủy</Button>
                        <Button variant="danger" onClick={runConfirm} isLoading={busy}>Xóa</Button>
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
                                {floor.IsActive ? 'Đang hoạt động' : 'Đã tắt'}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{floor.ZoneCount ?? zones.length} khu vực · {floor.SlotCount ?? 0} slot</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={onToggle} title={floor.IsActive ? 'Tắt tầng' : 'Bật tầng'}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${floor.IsActive ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                        <Power size={13} /> {floor.IsActive ? 'Tắt' : 'Bật'}
                    </button>
                    <button onClick={onEdit} title="Sửa tầng" className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"><Pencil size={15} /></button>
                    <button onClick={onDelete} title="Xóa tầng" className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"><Trash2 size={15} /></button>
                </div>
            </div>

            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Khu vực</p>
                    <button onClick={onAddZone}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-blue-200 transition">
                        <Plus size={13} /> Thêm khu vực
                    </button>
                </div>
                {zones.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">Tầng này chưa có khu vực.</p>
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
                    <button onClick={onEdit} title="Sửa khu vực" className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"><Pencil size={14} /></button>
                    <button onClick={onDelete} title="Xóa khu vực" className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"><Trash2 size={14} /></button>
                </div>
            </div>

            <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                    <span className="text-slate-500">Sức chứa</span>
                    <span className={full ? 'text-amber-600' : 'text-slate-700'}>{actual}<span className="text-slate-400 font-normal"> / {total || '—'}</span></span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${full ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                </div>
            </div>

            <button onClick={onManage}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition">
                <LayoutGrid size={14} /> Quản lý slot
            </button>
        </div>
    )
}

// ── Modal thêm/sửa Tầng ──────────────────────────────────────
const FloorModal = ({ mode, data, buildingId, onClose, onSaved }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: { floorName: data?.FloorName || '' }
    })

    const onSubmit = async (form) => {
        try {
            if (mode === 'edit') {
                await updateFloorAPI(data.FloorID, { floorName: form.floorName })
                toast.success('Cập nhật tầng thành công')
            } else {
                await createFloorAPI({ buildingId, floorName: form.floorName, isActive: 1 })
                toast.success('Thêm tầng thành công')
            }
            onSaved()
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Thao tác thất bại')
        }
    }

    return (
        <Modal isOpen onClose={onClose} title={mode === 'edit' ? 'Sửa tầng' : 'Thêm tầng mới'}
            footer={(
                <>
                    <Button variant="secondary" onClick={onClose}>Hủy</Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : mode === 'edit' ? 'Lưu' : 'Tạo mới'}</Button>
                </>
            )}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Tên tầng</label>
                    <input {...register('floorName', { required: 'Vui lòng nhập tên tầng' })} placeholder="VD: Tầng 1, Tầng hầm B1"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                    {errors.floorName && <p className="text-xs text-red-500 mt-1">{errors.floorName.message}</p>}
                </div>
            </form>
        </Modal>
    )
}

// ── Modal thêm/sửa Khu vực (Zone) ────────────────────────────
const ZoneModal = ({ mode, data, floorId, onClose, onSaved }) => {
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
                toast.success('Cập nhật khu vực thành công')
            } else {
                await createZoneAPI({ floorId, ...payload })
                toast.success('Thêm khu vực thành công')
            }
            onSaved()
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Thao tác thất bại')
        }
    }

    return (
        <Modal isOpen onClose={onClose} title={mode === 'edit' ? 'Sửa khu vực' : 'Thêm khu vực mới'}
            footer={(
                <>
                    <Button variant="secondary" onClick={onClose}>Hủy</Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : mode === 'edit' ? 'Lưu' : 'Tạo mới'}</Button>
                </>
            )}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Tên khu vực</label>
                    <input {...register('zoneName', { required: 'Vui lòng nhập tên khu vực' })} placeholder="VD: Zone A - Xe máy"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                    {errors.zoneName && <p className="text-xs text-red-500 mt-1">{errors.zoneName.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Loại xe cho phép</label>
                        <select {...register('allowedVehicleTypeId')}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition">
                            {VEHICLE_TYPES.map(v => <option key={v.VehicleTypeID} value={v.VehicleTypeID}>{v.VehicleName}</option>)}
                        </select>
                        {mode === 'edit' && <p className="text-[11px] text-slate-400 mt-1">Không đổi được nếu khu vực đã có slot khác loại.</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Sức chứa tối đa</label>
                        <input type="number" min="0" {...register('totalSlots', { min: { value: 0, message: 'Không hợp lệ' } })}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                        {errors.totalSlots && <p className="text-xs text-red-500 mt-1">{errors.totalSlots.message}</p>}
                    </div>
                </div>
                <p className="text-[12px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                    Sức chứa tối đa là giới hạn số slot. Tạo slot thực tế ở bước “Quản lý slot” sau khi lưu khu vực.
                </p>
            </form>
        </Modal>
    )
}

// ── Panel quản lý Slot của 1 zone (thêm/sửa/xóa/bulk) ─────────
const SlotPanel = ({ zone, onClose, onChanged }) => {
    const [data, setData] = useState(null)   // { zone:{...}, slots:[...] }
    const [loading, setLoading] = useState(true)
    const [busyId, setBusyId] = useState(null)
    const [tab, setTab] = useState('grid')   // 'grid' | 'add' | 'bulk'

    const load = useCallback(async () => {
        setLoading(true)
        try {
            const res = await getSlotsByZoneAPI(zone.ZoneID)
            setData(res.data)
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể tải slot')
        } finally {
            setLoading(false)
        }
    }, [zone.ZoneID])

    useEffect(() => { load() }, [load])

    const cap = data?.zone
    const full = cap && cap.totalSlots != null && cap.actualSlots >= cap.totalSlots

    // Single add
    const addForm = useForm({ defaultValues: { slotCode: '' } })
    const submitAdd = async (form) => {
        try {
            await createSlotAPI({ zoneId: zone.ZoneID, slotCode: form.slotCode })
            toast.success(`Đã thêm slot ${form.slotCode.toUpperCase()}`)
            addForm.reset({ slotCode: '' })
            await load(); onChanged?.()
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể thêm slot')
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
            toast.success(`Đã tạo ${createdCount} slot${skippedCount ? `, bỏ qua ${skippedCount} mã trùng` : ''}`)
            bulkForm.reset({ prefix: form.prefix, start: Number(form.end) + 1, end: Number(form.end) + 10, pad: Number(form.pad) })
            await load(); onChanged?.()
            setTab('grid')
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể tạo slot hàng loạt')
        }
    }

    const cycleStatus = async (slot, newStatus) => {
        setBusyId(slot.SlotID)
        try {
            await updateSlotAPI(slot.SlotID, { slotStatus: newStatus })
            await load(); onChanged?.()
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Cập nhật thất bại')
        } finally {
            setBusyId(null)
        }
    }
    const removeSlot = async (slot) => {
        setBusyId(slot.SlotID)
        try {
            await deleteSlotAPI(slot.SlotID)
            toast.success(`Đã xóa slot ${slot.SlotCode}`)
            await load(); onChanged?.()
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Không thể xóa slot')
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
                            {zone.FloorName} · {zone.AllowedVehicleName}
                            {cap && <> · <strong className={full ? 'text-amber-600' : 'text-slate-700'}>{cap.actualSlots}/{cap.totalSlots ?? '—'}</strong> slot</>}
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 transition"><X size={18} /></button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-6 pt-4 shrink-0">
                    {[
                        { k: 'grid', label: 'Danh sách slot', icon: LayoutGrid },
                        { k: 'add', label: 'Thêm 1 slot', icon: Plus },
                        { k: 'bulk', label: 'Thêm hàng loạt', icon: Rows3 }
                    ].map(t => {
                        const Icon = t.icon
                        const on = tab === t.k
                        return (
                            <button key={t.k} onClick={() => setTab(t.k)}
                                className={`inline-flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-sm font-semibold border-b-2 transition ${on ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                <Icon size={15} /> {t.label}
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
                                        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />{c.label}
                                    </span>
                                ))}
                            </div>
                            {loading ? (
                                <div className="py-16 flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
                            ) : !data?.slots?.length ? (
                                <div className="py-16 text-center text-slate-400">
                                    <LayoutGrid size={36} className="mx-auto mb-2 text-slate-300" />
                                    <p className="font-semibold text-slate-600">Chưa có slot nào</p>
                                    <p className="text-sm mt-1">Dùng tab “Thêm 1 slot” hoặc “Thêm hàng loạt”.</p>
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
                                                <p className="text-[11px] font-semibold mt-0.5">{cfg.label}</p>

                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {locked ? (
                                                        <span className="text-[10px] text-slate-500">Đang sử dụng — không sửa/xóa</span>
                                                    ) : (
                                                        <>
                                                            {slot.SlotStatus !== 'Available' && (
                                                                <button disabled={busyId === slot.SlotID} onClick={() => cycleStatus(slot, 'Available')}
                                                                    className="inline-flex items-center gap-1 rounded-lg bg-white/70 border border-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-50"><Check size={11} /> Trống</button>
                                                            )}
                                                            {slot.SlotStatus !== 'Maintenance' && (
                                                                <button disabled={busyId === slot.SlotID} onClick={() => cycleStatus(slot, 'Maintenance')}
                                                                    className="inline-flex items-center gap-1 rounded-lg bg-white/70 border border-amber-200 px-2 py-1 text-[10px] font-bold text-amber-700 hover:bg-amber-50 transition disabled:opacity-50">Bảo trì</button>
                                                            )}
                                                            {slot.SlotStatus !== 'Blocked' && (
                                                                <button disabled={busyId === slot.SlotID} onClick={() => cycleStatus(slot, 'Blocked')}
                                                                    className="inline-flex items-center gap-1 rounded-lg bg-white/70 border border-red-200 px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-50 transition disabled:opacity-50">Khóa</button>
                                                            )}
                                                            <button disabled={busyId === slot.SlotID} onClick={() => removeSlot(slot)} title="Xóa slot"
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
                                    Khu vực đã đầy ({cap.actualSlots}/{cap.totalSlots}). Tăng sức chứa ở nút “Sửa khu vực” trước khi thêm.
                                </div>
                            )}
                            <form onSubmit={addForm.handleSubmit(submitAdd)} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mã slot</label>
                                    <input {...addForm.register('slotCode', { required: 'Nhập mã slot' })} placeholder="VD: A-M-06"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition uppercase" />
                                    {addForm.formState.errors.slotCode && <p className="text-xs text-red-500 mt-1">{addForm.formState.errors.slotCode.message}</p>}
                                    <p className="text-[11px] text-slate-400 mt-1">Mã phải duy nhất trong toàn hệ thống. Loại xe tự gán theo khu vực ({zone.AllowedVehicleName}).</p>
                                </div>
                                <Button onClick={addForm.handleSubmit(submitAdd)} disabled={addForm.formState.isSubmitting || full}>
                                    {addForm.formState.isSubmitting ? 'Đang thêm...' : 'Thêm slot'}
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
                                    Khu vực đã đầy ({cap.actualSlots}/{cap.totalSlots}). Tăng sức chứa trước.
                                </div>
                            )}
                            <form onSubmit={bulkForm.handleSubmit(submitBulk)} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tiền tố mã</label>
                                    <input {...bulkForm.register('prefix', { required: 'Nhập tiền tố' })} placeholder="VD: A-M-"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition uppercase" />
                                    {bulkForm.formState.errors.prefix && <p className="text-xs text-red-500 mt-1">{bulkForm.formState.errors.prefix.message}</p>}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Từ số</label>
                                        <input type="number" min="0" {...bulkForm.register('start')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Đến số</label>
                                        <input type="number" min="0" {...bulkForm.register('end')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số chữ số</label>
                                        <input type="number" min="1" max="4" {...bulkForm.register('pad')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                                    </div>
                                </div>
                                <BulkPreview bulkForm={bulkForm} />
                                <Button onClick={bulkForm.handleSubmit(submitBulk)} disabled={bulkForm.formState.isSubmitting || full}>
                                    {bulkForm.formState.isSubmitting ? 'Đang tạo...' : 'Tạo hàng loạt'}
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
    const prefix = (bulkForm.watch('prefix') || '').toUpperCase()
    const start = Number(bulkForm.watch('start'))
    const end = Number(bulkForm.watch('end'))
    const pad = Number(bulkForm.watch('pad')) || 2
    if (!prefix || !Number.isInteger(start) || !Number.isInteger(end) || end < start) {
        return <p className="text-[12px] text-slate-400">Nhập tiền tố và dải số để xem trước.</p>
    }
    const count = end - start + 1
    const sample = []
    for (let i = start; i <= Math.min(end, start + 2); i++) sample.push(prefix + String(i).padStart(pad, '0'))
    const tail = count > 3 ? `… ${prefix}${String(end).padStart(pad, '0')}` : ''
    return (
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[12px] font-semibold text-slate-600">Sẽ tạo <strong className="text-blue-600">{count}</strong> slot:</p>
            <p className="text-[12px] text-slate-500 mt-1 font-mono">{sample.join(', ')}{tail}</p>
        </div>
    )
}

export default AdminParkingConfig