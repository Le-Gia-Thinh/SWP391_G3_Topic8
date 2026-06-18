// src/pages/manager/ManagerVehicleTypes.jsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit3, RefreshCcw, Save, X, CheckCircle, Car, Search } from 'lucide-react'
import { toast } from 'react-toastify'
import {
  getAllVehicleTypesAPI,
  createVehicleTypeAPI,
  updateVehicleTypeAPI,
  toggleVehicleTypeAPI
} from '../../apis/managerApi'

const StatusBadge = ({ isActive }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold
    ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
    : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    {isActive ? 'Active' : 'Inactive'}
  </span>
)

// ── Modal tạo/sửa ─────────────────────────────────────────────
const VehicleTypeModal = ({ editing, onClose, onSaved }) => {
  const [form, setForm] = useState({
    vehicleCode: editing?.VehicleCode || '',
    vehicleName: editing?.VehicleName || '',
    description: editing?.Description || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!editing && !form.vehicleCode.trim()) return toast.warn('Vui lòng nhập mã loại xe')
    if (!form.vehicleName.trim()) return toast.warn('Vui lòng nhập tên loại xe')
    setSaving(true)
    try {
      if (editing) {
        await updateVehicleTypeAPI(editing.VehicleTypeID, {
          vehicleName: form.vehicleName.trim(),
          description: form.description.trim() || null
        })
        toast.success('Cập nhật loại xe thành công')
      } else {
        await createVehicleTypeAPI({
          vehicleCode: form.vehicleCode.trim().toUpperCase(),
          vehicleName: form.vehicleName.trim(),
          description: form.description.trim() || null
        })
        toast.success('Tạo loại xe thành công')
      }
      onSaved()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">{editing ? 'Chỉnh sửa loại xe' : 'Thêm loại xe mới'}</h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 transition"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Mã loại xe (VehicleCode) {editing && <span className="text-slate-400">— không đổi được</span>}</span>
            <input
              value={form.vehicleCode}
              disabled={!!editing}
              onChange={e => setForm(f => ({ ...f, vehicleCode: e.target.value.toUpperCase() }))}
              placeholder="VD: MOTO, CAR, TRUCK"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Tên loại xe</span>
            <input
              value={form.vehicleName}
              onChange={e => setForm(f => ({ ...f, vehicleName: e.target.value }))}
              placeholder="VD: Xe máy, Ô tô con"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">Mô tả (tuỳ chọn)</span>
            <textarea
              value={form.description} rows={2}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">Hủy</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
            {saving ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang lưu...</> : <><Save size={16} /> {editing ? 'Cập nhật' : 'Tạo mới'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

const ManagerVehicleTypes = () => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null) // { editing } | { editing: null } | null
  const [togglingId, setTogglingId] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAllVehicleTypesAPI()
      setList(res.data.data || [])
    } catch {
      toast.error('Không thể tải danh sách loại xe')
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 80)
    }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  const handleToggle = async (vt) => {
    setTogglingId(vt.VehicleTypeID)
    try {
      await toggleVehicleTypeAPI(vt.VehicleTypeID, vt.IsActive ? 0 : 1)
      toast.success(`Đã ${vt.IsActive ? 'tắt' : 'bật'} loại xe ${vt.VehicleName}`)
      fetchData()
    } catch {
      toast.error('Cập nhật thất bại')
    } finally {
      setTogglingId(null)
    }
  }

  const filtered = list.filter(v => {
    if (!query.trim()) return true
    const s = query.toLowerCase()
    return (v.VehicleName || '').toLowerCase().includes(s) ||
      (v.VehicleCode || '').toLowerCase().includes(s)
  })

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">Cấu hình / Loại phương tiện</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Quản lý Loại phương tiện</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            <RefreshCcw size={16} /> Làm mới
          </button>
          <button onClick={() => setModal({ editing: null })}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm">
            <Plus size={16} /> Thêm loại xe
          </button>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/60">
        <div className="relative mb-5 max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm mã, tên loại xe..."
            className="w-full rounded-xl bg-slate-50 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto overflow-y-auto max-h-125">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">ID</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Mã</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Tên loại xe</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Mô tả</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Slot</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Bảng giá</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Trạng thái</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">Không có loại xe nào</td></tr>
                  ) : filtered.map(vt => (
                    <tr key={vt.VehicleTypeID} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-500 text-xs">#{vt.VehicleTypeID}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold">
                          <Car size={12} /> {vt.VehicleCode}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800">{vt.VehicleName}</td>
                      <td className="px-5 py-4 text-slate-500 max-w-55 truncate">{vt.Description || '—'}</td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{vt.SlotCount ?? 0}</td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{vt.PolicyCount ?? 0}</td>
                      <td className="px-5 py-4"><StatusBadge isActive={vt.IsActive} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setModal({ editing: vt })}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all" title="Chỉnh sửa">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleToggle(vt)} disabled={togglingId === vt.VehicleTypeID}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${vt.IsActive
                              ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} disabled:opacity-50`}
                            title={vt.IsActive ? 'Tắt' : 'Bật'}>
                            {vt.IsActive ? <X size={14} /> : <CheckCircle size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-amber-50/50 border border-amber-100 p-4 text-xs font-medium text-amber-800">
          Tắt loại xe (Inactive) thay vì xóa để giữ liên kết với slot và bảng giá đã tạo. Mã loại xe không thể đổi sau khi tạo.
        </div>
      </div>

      {modal && (
        <VehicleTypeModal
          editing={modal.editing}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchData() }}
        />
      )}
    </div>
  )
}

export default ManagerVehicleTypes