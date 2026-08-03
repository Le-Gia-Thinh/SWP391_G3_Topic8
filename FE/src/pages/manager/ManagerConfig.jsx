/**
 * FILE: ManagerConfig.jsx
 * MÔ TẢ: Trang Quản lý Cấu trúc Bãi Đỗ Xe dành cho Manager.
 * Xem sơ đồ bãi đỗ (Tòa nhà > Tầng > Khu vực > Ô đỗ) + Quản lý Cổng (Gates) cho Tòa nhà.
 * Manager có thể: bật/tắt tầng, bảo trì/khóa ô đỗ, thêm/sửa/xóa cổng ra vào.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Building, Layers, Map, RefreshCcw, ChevronRight, X, Info,
  Wrench, Lock, Unlock, Power, Car, ShieldAlert,
  DoorOpen, Plus, Pencil, Trash2, CheckCircle2, XCircle,
  Users, UserCheck, UserX, UserPlus
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import {
  getBuildingsAPI, getFloorsAPI, getZonesAPI, getParkingSlotsAPI,
  updateFloorAPI, updateSlotStatusAPI,
  getGatesAPI, createGateAPI, updateGateAPI, deleteGateAPI,
  getBuildingStaffAPI, getUnassignedStaffAPI,
  assignStaffToBuildingAPI, removeStaffFromBuildingAPI
} from '../../apis/managerApi'

// ── Cấu hình hiển thị trạng thái slot ─────────────────────────
const SLOT_CFG = {
  Available:   { labelKey: 'manager.config.slotStatus.available',   dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
  Occupied:    { labelKey: 'manager.config.slotStatus.occupied',    dot: 'bg-blue-500',    chip: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  Reserved:    { labelKey: 'manager.config.slotStatus.reserved',    dot: 'bg-violet-500',  chip: 'bg-violet-50 text-violet-700 border-violet-200/60' },
  Maintenance: { labelKey: 'manager.config.slotStatus.maintenance', dot: 'bg-amber-500',   chip: 'bg-amber-50 text-amber-700 border-amber-200/60' },
  Blocked:     { labelKey: 'manager.config.slotStatus.blocked',     dot: 'bg-red-500',     chip: 'bg-red-50 text-red-700 border-red-200/60' }
}

const GATE_TYPE_OPTIONS = ['In', 'Out', 'BiDirectional']
const GATE_TYPE_LABEL = { In: 'Cổng Vào', Out: 'Cổng Ra', BiDirectional: 'Cổng 2 Chiều' }
const GATE_TYPE_COLOR = {
  In:            'bg-emerald-50 text-emerald-700 border-emerald-200',
  Out:           'bg-rose-50 text-rose-700 border-rose-200',
  BiDirectional: 'bg-violet-50 text-violet-700 border-violet-200'
}

// ── Input nhỏ tái dùng ─────────────────────────────────────────
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>
    {children}
  </div>
)

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition'

const ManagerConfig = () => {
  const { t } = useTranslation()
  const [isLoaded, setIsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)

  const [buildings, setBuildings]           = useState([])
  const [floors, setFloors]                 = useState([])
  const [zones, setZones]                   = useState([])
  const [gates, setGates]                   = useState([])
  const [selectedBuildingId, setSelectedBuildingId] = useState(null)

  // Tabs: 'floors' | 'gates' | 'staff'
  const [activeTab, setActiveTab] = useState('floors')

  const [zoneModal, setZoneModal]       = useState(null)
  const [gateModal, setGateModal]       = useState(null)
  const [gateForm, setGateForm]         = useState({ gateName: '', gateType: 'In', isActive: true })
  const [savingGate, setSavingGate]     = useState(false)
  const [deletingGate, setDeletingGate] = useState(null)

  // Staff tab state
  const [buildingStaff, setBuildingStaff]         = useState([])
  const [unassignedStaff, setUnassignedStaff]     = useState([])
  const [loadingStaff, setLoadingStaff]           = useState(false)
  const [removingAssignId, setRemovingAssignId]   = useState(null)
  const [assigningStaffId, setAssigningStaffId]   = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [bRes, fRes, zRes, gRes] = await Promise.all([
        getBuildingsAPI(), getFloorsAPI(), getZonesAPI(), getGatesAPI()
      ])
      const bData = bRes.data.data || []
      setBuildings(bData)
      setFloors(fRes.data.data || [])
      setZones(zRes.data.data || [])
      setGates(gRes.data.data || [])
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

  // Reload chỉ gates
  const reloadGates = async () => {
    try {
      const gRes = await getGatesAPI()
      setGates(gRes.data.data || [])
    } catch { /* silent */ }
  }

  // Load staff của tòa đang chọn
  const loadBuildingStaff = useCallback(async (buildingId) => {
    if (!buildingId) return
    setLoadingStaff(true)
    try {
      const [sRes, uRes] = await Promise.all([
        getBuildingStaffAPI(buildingId),
        getUnassignedStaffAPI()
      ])
      setBuildingStaff(sRes.data.data || [])
      setUnassignedStaff(uRes.data.data || [])
    } catch {
      toast.error('Không thể tải danh sách nhân sự.')
    } finally {
      setLoadingStaff(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'staff' && selectedBuildingId) {
      loadBuildingStaff(selectedBuildingId)
    }
  }, [activeTab, selectedBuildingId, loadBuildingStaff])

  // Toggle tầng
  const handleFloorToggle = async (floor) => {
    try {
      await updateFloorAPI(floor.FloorID, { floorName: floor.FloorName, isActive: floor.IsActive ? 0 : 1 })
      toast.success(floor.IsActive
        ? t('manager.config.toastFloorOff', { name: floor.FloorName })
        : t('manager.config.toastFloorOn', { name: floor.FloorName }))
      const fRes = await getFloorsAPI()
      setFloors(fRes.data.data || [])
    } catch {
      toast.error(t('manager.config.errFloorToggle'))
    }
  }

  // Mở form thêm cổng
  const openCreateGate = () => {
    setGateForm({ gateName: '', gateType: 'In', isActive: true })
    setGateModal('create')
  }

  // Mở form sửa cổng
  const openEditGate = (gate) => {
    setGateForm({ gateName: gate.GateName, gateType: gate.GateType, isActive: !!gate.IsActive })
    setGateModal(gate)
  }

  // Lưu cổng (tạo mới hoặc cập nhật)
  const saveGate = async () => {
    if (!gateForm.gateName.trim()) { toast.error('Vui lòng nhập tên cổng.'); return }
    setSavingGate(true)
    try {
      if (gateModal === 'create') {
        await createGateAPI({
          buildingId: selectedBuildingId,
          gateName: gateForm.gateName.trim(),
          gateType: gateForm.gateType,
          isActive: gateForm.isActive ? 1 : 0
        })
        toast.success('Đã thêm cổng mới thành công!')
      } else {
        await updateGateAPI(gateModal.GateID, {
          gateName: gateForm.gateName.trim(),
          gateType: gateForm.gateType,
          isActive: gateForm.isActive ? 1 : 0
        })
        toast.success('Đã cập nhật thông tin cổng!')
      }
      setGateModal(null)
      reloadGates()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể lưu cổng.')
    } finally {
      setSavingGate(false)
    }
  }

  // Xóa cổng
  const confirmDeleteGate = async () => {
    setSavingGate(true)
    try {
      await deleteGateAPI(deletingGate.GateID)
      toast.success(`Đã xóa cổng "${deletingGate.GateName}"`)
      setDeletingGate(null)
      reloadGates()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể xóa cổng này.')
    } finally {
      setSavingGate(false)
    }
  }

  // Phân công Staff vào tòa nhà
  const handleAssignStaff = async (staffUserId) => {
    setAssigningStaffId(staffUserId)
    try {
      await assignStaffToBuildingAPI({ buildingId: selectedBuildingId, staffUserId, isPrimary: true })
      toast.success('Đã phân công nhân viên vào tòa nhà!')
      loadBuildingStaff(selectedBuildingId)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể phân công nhân viên.')
    } finally {
      setAssigningStaffId(null)
    }
  }

  // Gỡ Staff khỏi tòa nhà
  const handleRemoveStaff = async (assignmentId) => {
    setRemovingAssignId(assignmentId)
    try {
      await removeStaffFromBuildingAPI(assignmentId)
      toast.success('Đã gỡ nhân viên khỏi tòa nhà.')
      loadBuildingStaff(selectedBuildingId)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể gỡ nhân viên.')
    } finally {
      setRemovingAssignId(null)
    }
  }

  const selectedBuilding  = buildings.find(b => b.BuildingID === selectedBuildingId) || null
  const buildingFloors    = floors.filter(f => f.BuildingID === selectedBuildingId)
  const buildingGates     = gates.filter(g => g.BuildingID === selectedBuildingId)
  const zonesOfFloor      = (floorId) => zones.filter(z => z.FloorID === floorId)

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
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
          className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition self-start">
          <RefreshCcw size={16} /> {t('manager.config.refresh')}
        </button>
      </div>

      {/* Scope notice */}
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
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">{t('manager.config.buildingSectionHint')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {buildings.map(b => {
              const active = b.BuildingID === selectedBuildingId
              return (
                <button key={b.BuildingID} onClick={() => setSelectedBuildingId(b.BuildingID)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${active ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                  <p className={`text-sm font-bold ${active ? 'text-blue-800' : 'text-slate-800'}`}>{b.BuildingName}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {t('manager.config.buildingMeta', { floors: b.FloorCount ?? 0, slots: b.SlotCount ?? 0 })}
                  </p>
                </button>
              )
            })}
          </div>
          {selectedBuilding && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-500 font-medium border-t border-slate-100 pt-3">
              <span>{t('manager.config.addressLabel')} <strong className="text-slate-700">{selectedBuilding.Address || '—'}</strong></span>
              <span>{t('manager.config.operatingHoursLabel')} <strong className="text-slate-700">{selectedBuilding.OperatingHours || '—'}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Navigator ── */}
      <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 w-fit">
        <button onClick={() => setActiveTab('floors')}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition ${activeTab === 'floors' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-50'}`}>
          <Layers size={16} /> Tầng & Khu vực
        </button>
        <button onClick={() => setActiveTab('gates')}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition ${activeTab === 'gates' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-50'}`}>
          <DoorOpen size={16} /> Cổng Ra Vào
          {buildingGates.length > 0 && (
            <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${activeTab === 'gates' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'}`}>
              {buildingGates.length}
            </span>
          )}
        </button>
        <button onClick={() => setActiveTab('staff')}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition ${activeTab === 'staff' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-50'}`}>
          <Users size={16} /> Nhân sự
          {buildingStaff.length > 0 && (
            <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${activeTab === 'staff' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700'}`}>
              {buildingStaff.length}
            </span>
          )}
        </button>
      </div>

      {/* ────────────── TAB: FLOORS & ZONES ────────────── */}
      {activeTab === 'floors' && (
        buildingFloors.length === 0 ? (
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
        )
      )}

      {/* ────────────── TAB: GATES ────────────── */}
      {activeTab === 'gates' && (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-violet-50 text-violet-600">
                <DoorOpen size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Quản lý Cổng Ra Vào</h2>
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                  Cổng được Staff chọn khi thực hiện Check-in / Check-out xe
                </p>
              </div>
            </div>
            <button onClick={openCreateGate}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-95 transition-all">
              <Plus size={15} /> Thêm Cổng Mới
            </button>
          </div>

          {buildingGates.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <DoorOpen size={40} className="mb-3 text-slate-300" />
              <p className="font-semibold text-slate-600">Tòa nhà này chưa có cổng nào</p>
              <p className="text-sm mt-1">Nhấn "Thêm Cổng Mới" để cấu hình cổng ra vào cho Staff sử dụng</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {buildingGates.map(gate => (
                <div key={gate.GateID}
                  className="rounded-2xl border border-slate-200 p-4 hover:border-blue-200 hover:shadow-md transition group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                        <DoorOpen size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{gate.GateName}</p>
                        <span className={`inline-block mt-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${GATE_TYPE_COLOR[gate.GateType] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {GATE_TYPE_LABEL[gate.GateType] || gate.GateType}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => openEditGate(gate)} title="Sửa cổng"
                        className="rounded-xl p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeletingGate(gate)} title="Xóa cổng"
                        className="rounded-xl p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${gate.IsActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {gate.IsActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {gate.IsActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">ID #{gate.GateID}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────── TAB: NHÂN SỰ ────────────── */}
      {activeTab === 'staff' && (
        <div className="space-y-5">
          {/* Nhân sự hiện tại */}
          <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Nhân sự đang trực tại tòa nhà</h2>
                  <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                    Staff có thể làm việc nhiều ca tại tòa nhà này
                  </p>
                </div>
              </div>
              <button onClick={() => loadBuildingStaff(selectedBuildingId)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                <RefreshCcw size={14} /> Làm mới
              </button>
            </div>

            {loadingStaff ? (
              <div className="py-10 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
            ) : buildingStaff.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                <Users size={36} className="mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600">Tòa nhà này chưa có nhân viên nào</p>
                <p className="text-sm mt-1">Phân công nhân viên ở phần bên dưới</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {buildingStaff.map(s => (
                  <div key={s.AssignmentID}
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-sm transition group">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-black text-sm">
                        {s.FullName?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{s.FullName}</p>
                        <p className="text-[11px] text-slate-400">{s.Email}</p>
                        {s.IsPrimary ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                            <UserCheck size={10} /> Trực chính
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Hỗ trợ</span>
                        )}
                      </div>
                    </div>
                    <button
                      disabled={removingAssignId === s.AssignmentID}
                      onClick={() => handleRemoveStaff(s.AssignmentID)}
                      className="opacity-0 group-hover:opacity-100 rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-40">
                      <UserX size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danh sách Staff chưa được phân công */}
          <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                <UserPlus size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Nhân viên chưa được phân công</h2>
                <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                  Nhấn "Phân công" để thêm nhân viên vào tòa nhà đang chọn
                </p>
              </div>
            </div>

            {loadingStaff ? (
              <div className="py-8 flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" /></div>
            ) : unassignedStaff.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                Tất cả nhân viên đã được phân công đến các tòa nhà 🎉
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {unassignedStaff.map(s => (
                  <div key={s.UserID}
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-sm transition">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 font-black text-sm">
                        {s.FullName?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{s.FullName}</p>
                        <p className="text-[11px] text-slate-400">{s.Email}</p>
                        <span className="text-[10px] text-slate-400">{s.PhoneNumber || 'Chưa có SĐT'}</span>
                      </div>
                    </div>
                    <button
                      disabled={assigningStaffId === s.UserID}
                      onClick={() => handleAssignStaff(s.UserID)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition disabled:opacity-50">
                      {assigningStaffId === s.UserID ? '...' : <><UserPlus size={12} /> Phân công</>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────── Modal Slot Grid ────────── */}
      {zoneModal && (
        <ZoneSlotsModal zone={zoneModal} onClose={() => setZoneModal(null)} />
      )}

      {/* ────────── Modal Thêm/Sửa Cổng ────────── */}
      {gateModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {gateModal === 'create' ? 'Thêm Cổng Mới' : `Sửa Cổng: ${gateModal.GateName}`}
              </h3>
              <button onClick={() => setGateModal(null)} className="rounded-xl p-2 hover:bg-slate-100 transition"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Tên Cổng *">
                <input value={gateForm.gateName}
                  onChange={e => setGateForm(f => ({ ...f, gateName: e.target.value }))}
                  placeholder="VD: Cổng Vào Chính, Cổng Ra Phụ..."
                  className={inputCls} />
              </Field>
              <Field label="Loại Cổng">
                <select value={gateForm.gateType}
                  onChange={e => setGateForm(f => ({ ...f, gateType: e.target.value }))}
                  className={inputCls}>
                  {GATE_TYPE_OPTIONS.map(t => (
                    <option key={t} value={t}>{GATE_TYPE_LABEL[t]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Trạng thái">
                <div className="flex gap-3">
                  {[true, false].map(v => (
                    <button key={String(v)} type="button"
                      onClick={() => setGateForm(f => ({ ...f, isActive: v }))}
                      className={`flex-1 py-2 rounded-xl border text-sm font-bold transition ${gateForm.isActive === v
                        ? v ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-100 border-slate-300 text-slate-600'
                        : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                      {v ? 'Hoạt động' : 'Ngưng'}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="flex gap-3 px-6 pb-6 justify-end">
              <button onClick={() => setGateModal(null)}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                Hủy
              </button>
              <button onClick={saveGate} disabled={savingGate}
                className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition disabled:opacity-60">
                {savingGate ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────── Modal Xác nhận Xóa Cổng ────────── */}
      {deletingGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <Trash2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Xóa Cổng</h3>
            </div>
            <p className="text-sm text-slate-600">
              Bạn có chắc chắn muốn xóa cổng <strong className="text-slate-900">"{deletingGate.GateName}"</strong>?
              Thao tác này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setDeletingGate(null)}
                className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                Hủy
              </button>
              <button onClick={confirmDeleteGate} disabled={savingGate}
                className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-500/25 hover:bg-rose-700 transition disabled:opacity-60">
                {savingGate ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
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
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-3xl ${inactive ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{floor.FloorName}</h3>
              <span className={`inline-flex items-center gap-1.5 rounded-xl px-2 py-0.5 text-[11px] font-semibold border ${floor.IsActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${floor.IsActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {floor.IsActive ? t('manager.config.floorActive') : t('manager.config.floorInactive')}
              </span>
            </div>
            <p className="text-[12px] font-medium text-slate-500 mt-0.5">
              {t('manager.config.floorMeta', { zones: floor.ZoneCount ?? zones.length, slots: floor.SlotCount ?? 0 })}
            </p>
          </div>
        </div>
        <button onClick={onToggle}
          className={`inline-flex items-center gap-2 rounded-3xl border px-4 py-2 text-sm font-semibold transition ${floor.IsActive
            ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>
          <Power size={15} /> {floor.IsActive ? t('manager.config.turnOffFloor') : t('manager.config.turnOnFloor')}
        </button>
      </div>
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

// ── Card 1 zone ─────────────────────────────────────────────────
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
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
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
        {full && <p className="text-[10px] text-amber-600 font-medium mt-1">{t('manager.config.zoneFullHint')}</p>}
      </div>
    </button>
  )
}

// ── Modal lưới slot ─────────────────────────────────────────────
const ZoneSlotsModal = ({ zone, onClose }) => {
  const { t } = useTranslation()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
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