// src/pages/manager/ManagerConfig.jsx
import { useState, useEffect } from 'react'
import { Edit3, ArrowUpRight, CheckCircle, Circle, Save, RefreshCcw, Building, Layers, Map, X } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  getBuildingsAPI,
  updateBuildingAPI,
  getFloorsAPI,
  updateFloorAPI,
  getZonesAPI,
  updateZoneAPI,
  getVehicleTypesAPI
} from '../../apis/managerApi'

const ManagerConfig = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Building
  const [buildings, setBuildings] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [buildingForm, setBuildingForm] = useState({
    buildingName: '', address: '', operatingHours: '', totalFloors: ''
  })

  // Floors & Zones & VehicleTypes
  const [floors, setFloors] = useState([])
  const [zones, setZones] = useState([])
  const [vehicleTypes, setVehicleTypes] = useState([])

  // Zone edit modal
  const [zoneModal, setZoneModal] = useState(null) // zone object hoặc null

  // Operating rules (local state — chưa có bảng DB)
  const [rules, setRules] = useState({
    allowOnsite: true,
    allowBooking: true,
    requirePrepay: true,
    antiPassback: true
  })

  const loadAll = async () => {
    try {
      const [bRes, fRes, zRes, vtRes] = await Promise.all([
        getBuildingsAPI(),
        getFloorsAPI(),
        getZonesAPI(),
        getVehicleTypesAPI()
      ])
      const bData = bRes.data.data || []
      setBuildings(bData)
      setFloors(fRes.data.data || [])
      setZones(zRes.data.data || [])
      setVehicleTypes(vtRes.data.data || [])

      if (bData.length > 0) {
        const b = bData[0]
        setSelectedBuilding(b)
        setBuildingForm({
          buildingName: b.BuildingName || '',
          address: b.Address || '',
          operatingHours: b.OperatingHours || '',
          totalFloors: b.TotalFloors || ''
        })
      }
    } catch {
      toast.error('Không thể tải dữ liệu cấu hình')
    } finally {
      setTimeout(() => setIsLoaded(true), 100)
    }
  }

  const reloadZones = async () => {
    try {
      const zRes = await getZonesAPI()
      setZones(zRes.data.data || [])
    } catch { /* bỏ qua */ }
  }

  const handleInfoChange = (e) => {
    const { name, value } = e.target
    setBuildingForm(prev => ({ ...prev, [name]: value }))
  }

  const toggleRule = (ruleName) => {
    setRules(prev => ({ ...prev, [ruleName]: !prev[ruleName] }))
  }

  const handleSave = async () => {
    if (!selectedBuilding) return
    setIsSaving(true)
    try {
      await updateBuildingAPI(selectedBuilding.BuildingID, {
        buildingName: buildingForm.buildingName,
        address: buildingForm.address,
        operatingHours: buildingForm.operatingHours,
        totalFloors: buildingForm.totalFloors ? Number(buildingForm.totalFloors) : null
      })
      toast.success('Đã cập nhật cấu hình tòa nhà thành công!')
      loadAll()
    } catch {
      toast.error('Lưu thất bại, vui lòng thử lại')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (selectedBuilding) {
      setBuildingForm({
        buildingName: selectedBuilding.BuildingName || '',
        address: selectedBuilding.Address || '',
        operatingHours: selectedBuilding.OperatingHours || '',
        totalFloors: selectedBuilding.TotalFloors || ''
      })
    }
    toast.info('Đã hoàn tác các thay đổi chưa lưu')
  }

  const handleFloorToggle = async (floor) => {
    try {
      await updateFloorAPI(floor.FloorID, {
        floorName: floor.FloorName,
        isActive: floor.IsActive ? 0 : 1
      })
      toast.success(`Đã cập nhật trạng thái ${floor.FloorName}`)
      const fRes = await getFloorsAPI()
      setFloors(fRes.data.data || [])
    } catch {
      toast.error('Cập nhật thất bại')
    }
  }
  useEffect(() => { loadAll() }, [])

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="flex items-center gap-4 px-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">Cấu hình / Tòa nhà đỗ xe</p>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">Cấu hình Bãi đỗ xe</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
          >
            <RefreshCcw size={16} /> Huỷ thay đổi
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !selectedBuilding}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              <><Save size={18} /> Lưu thay đổi</>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Thông tin Tòa nhà */}
        <section className="rounded-3xl bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Building size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Thông tin Tòa nhà</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                  Cấu hình thông tin cơ bản. Đang chỉnh sửa:
                  <strong className="text-blue-600 ml-1">{selectedBuilding?.BuildingName || '...'}</strong>
                </p>
              </div>
            </div>
            {buildings.length > 1 && (
              <select
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 outline-none"
                value={selectedBuilding?.BuildingID || ''}
                onChange={(e) => {
                  const b = buildings.find(x => x.BuildingID === Number(e.target.value))
                  if (b) {
                    setSelectedBuilding(b)
                    setBuildingForm({
                      buildingName: b.BuildingName || '', address: b.Address || '',
                      operatingHours: b.OperatingHours || '', totalFloors: b.TotalFloors || ''
                    })
                  }
                }}
              >
                {buildings.map(b => (
                  <option key={b.BuildingID} value={b.BuildingID}>{b.BuildingName}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4 rounded-[1.25rem] bg-slate-50 border border-slate-100 p-5">
              <LabelInput label="Tên toà nhà" name="buildingName" value={buildingForm.buildingName} onChange={handleInfoChange} />
              <LabelInput label="Giờ hoạt động (vd: 06:00-22:00)" name="operatingHours" value={buildingForm.operatingHours} onChange={handleInfoChange} />
            </div>
            <div className="space-y-4 rounded-[1.25rem] bg-slate-50 border border-slate-100 p-5">
              <LabelInput label="Địa chỉ chi tiết" name="address" value={buildingForm.address} onChange={handleInfoChange} />
              <LabelInput label="Tổng số tầng" name="totalFloors" value={buildingForm.totalFloors} onChange={handleInfoChange} type="number" />
            </div>
          </div>

          {selectedBuilding && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Số tầng', value: selectedBuilding.FloorCount ?? '—' },
                { label: 'Tổng slots', value: selectedBuilding.SlotCount ?? '—' }
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500">{s.label}</p>
                  <p className="text-2xl font-black text-blue-800 mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quản lý Tầng */}
        <section className="rounded-3xl bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Layers size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Quản lý Tầng (Floors)</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Bật/tắt tầng đang khai thác.</p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto overflow-y-auto max-h-75">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">ID</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Tên Tầng</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Khu vực</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Tổng Slots</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Trạng Thái</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {floors.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Chưa có dữ liệu tầng</td></tr>
                  ) : floors.map((floor) => (
                    <tr key={floor.FloorID} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900">{floor.FloorID}</td>
                      <td className="px-5 py-4 font-medium">{floor.FloorName}</td>
                      <td className="px-5 py-4 text-slate-500">{floor.ZoneCount} khu vực</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{floor.SlotCount}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${floor.IsActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${floor.IsActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {floor.IsActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleFloorToggle(floor)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:text-blue-600 hover:border-blue-200"
                          title="Bật/Tắt tầng"
                        >
                          {floor.IsActive ? 'Tắt tầng' : 'Bật tầng'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Quản lý Khu vực */}
        <section className="rounded-3xl bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Map size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Quản lý Khu vực (Zones)</h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Phân bổ loại xe và sức chứa theo từng khu vực.</p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto overflow-y-auto max-h-75">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Mã Zone</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Tên Khu Vực</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Thuộc Tầng</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Loại Xe</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Sức chứa</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zones.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Chưa có dữ liệu khu vực</td></tr>
                  ) : zones.map((zone) => (
                    <tr key={zone.ZoneID} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">Z-{zone.ZoneID}</td>
                      <td className="px-5 py-4 font-medium">{zone.ZoneName}</td>
                      <td className="px-5 py-4 text-slate-500">{zone.FloorName}</td>
                      <td className="px-5 py-4 font-medium">{zone.AllowedVehicleName}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {zone.ActualSlots}<span className="text-slate-400 font-normal"> / {zone.TotalSlots ?? '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setZoneModal(zone)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:text-blue-600 hover:border-blue-200"
                          title="Chỉnh sửa khu vực"
                        >
                          <Edit3 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Quy tắc vận hành */}
        <section className="rounded-3xl bg-white p-7 shadow-sm border border-slate-200/60 hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Quy tắc Vận hành</h2>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">Thiết lập logic nghiệp vụ cho nhân viên bãi đỗ.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <RuleToggle label="Cho phép khách vãng lai (Walk-in)" value={rules.allowOnsite} onToggle={() => toggleRule('allowOnsite')} />
            <RuleToggle label="Cho phép đặt chỗ trước (Booking)" value={rules.allowBooking} onToggle={() => toggleRule('allowBooking')} />
            <RuleToggle label="Yêu cầu xác thực trước thanh toán" value={rules.requirePrepay} onToggle={() => toggleRule('requirePrepay')} />
            <RuleToggle label="Chống trùng lặp biển số (Anti-Passback)" value={rules.antiPassback} onToggle={() => toggleRule('antiPassback')} />
          </div>
        </section>
      </div>

      {/* Zone edit modal */}
      {zoneModal && (
        <ZoneEditModal
          zone={zoneModal}
          vehicleTypes={vehicleTypes}
          onClose={() => setZoneModal(null)}
          onSaved={() => { setZoneModal(null); reloadZones() }}
        />
      )}
    </div>
  )
}

// ── Zone Edit Modal ───────────────────────────────────────────
const ZoneEditModal = ({ zone, vehicleTypes, onClose, onSaved }) => {
  const [form, setForm] = useState({
    zoneName: zone.ZoneName || '',
    allowedVehicleTypeId: String(zone.AllowedVehicleTypeID || ''),
    totalSlots: String(zone.TotalSlots ?? '')
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.zoneName.trim()) return toast.warn('Vui lòng nhập tên khu vực')
    if (!form.allowedVehicleTypeId) return toast.warn('Vui lòng chọn loại xe')
    setSaving(true)
    try {
      await updateZoneAPI(zone.ZoneID, {
        zoneName: form.zoneName.trim(),
        allowedVehicleTypeId: Number(form.allowedVehicleTypeId),
        totalSlots: form.totalSlots ? Number(form.totalSlots) : 0
      })
      toast.success('Cập nhật khu vực thành công')
      onSaved()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Chỉnh sửa khu vực Z-{zone.ZoneID}</h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 transition"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Tên khu vực</span>
            <input
              value={form.zoneName}
              onChange={e => setForm(f => ({ ...f, zoneName: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Loại xe cho phép</span>
            <select
              value={form.allowedVehicleTypeId}
              onChange={e => setForm(f => ({ ...f, allowedVehicleTypeId: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="">-- Chọn loại xe --</option>
              {vehicleTypes.map(v => (
                <option key={v.VehicleTypeID} value={v.VehicleTypeID}>{v.VehicleName} ({v.VehicleCode})</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Sức chứa (TotalSlots)</span>
            <input
              type="number" min="0"
              value={form.totalSlots}
              onChange={e => setForm(f => ({ ...f, totalSlots: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <span className="mt-1 block text-[11px] text-slate-400">Số slot thực tế hiện có: {zone.ActualSlots}</span>
          </label>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
            {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang lưu...</> : <><Save size={16} /> Lưu</>}
          </button>
        </div>
      </div>
    </div>
  )
}

const LabelInput = ({ label, name, value, onChange, type = 'text' }) => (
  <label className="block text-sm font-semibold text-slate-700">
    <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
    <input name={name} value={value} onChange={onChange} type={type}
      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm" />
  </label>
)

const RuleToggle = ({ label, value, onToggle }) => (
  <button type="button" onClick={onToggle}
    className={`group flex w-full items-center justify-between rounded-xl border ${value ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'} px-5 py-4 text-left transition-all hover:shadow-sm active:scale-[0.99]`}
  >
    <div>
      <p className={`font-bold ${value ? 'text-blue-900' : 'text-slate-800'}`}>{label}</p>
      <p className={`mt-0.5 text-xs font-medium ${value ? 'text-blue-600' : 'text-slate-500'}`}>{value ? 'Đang bật' : 'Đang tắt'}</p>
    </div>
    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${value ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
      {value ? <CheckCircle size={16} /> : <Circle size={16} />}
    </span>
  </button>
)

export default ManagerConfig