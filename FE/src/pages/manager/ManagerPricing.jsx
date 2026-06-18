// src/pages/manager/ManagerPricing.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  Search, Filter, Save, Edit3, Plus, RefreshCcw,
  AlertTriangle, CheckCircle, X
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  getPricingPoliciesAPI,
  createPricingPolicyAPI,
  updatePricingPolicyAPI,
  getVehicleTypesAPI
} from '../../apis/managerApi'

// ── helpers ──────────────────────────────────────────────────
const fmtVnd = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const fmtH = (h) => h == null ? '—' : `${h}h`

const EMPTY_FORM = {
  vehicleTypeId: '',
  minHours: '0',
  maxHours: '',
  fee: '',
  isOvernight: false,
  isActive: true
}

const StatusBadge = ({ isActive }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold
    ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
    : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    {isActive ? 'Active' : 'Inactive'}
  </span>
)

// ── Modal form ────────────────────────────────────────────────
const PolicyModal = ({ open, onClose, vehicleTypes, editing, onSaved }) => {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        vehicleTypeId: String(editing.VehicleTypeID),
        minHours: String(editing.MinHours),
        maxHours: String(editing.MaxHours),
        fee: String(editing.Fee),
        isOvernight: Boolean(editing.IsOvernight),
        isActive: Boolean(editing.IsActive)
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, editing])

  // Live preview tính phí mẫu
  useEffect(() => {
    const fee = parseFloat(form.fee) || 0
    const min = parseFloat(form.minHours) || 0
    const max = parseFloat(form.maxHours) || '∞'
    setPreview({ fee, min, max, overnight: form.isOvernight })
  }, [form.fee, form.minHours, form.maxHours, form.isOvernight])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async () => {
    if (!form.vehicleTypeId) return toast.warn('Vui lòng chọn loại xe')
    if (!form.fee || parseFloat(form.fee) < 0) return toast.warn('Phí không hợp lệ')
    if (parseFloat(form.maxHours) <= parseFloat(form.minHours) && !form.isOvernight)
      return toast.warn('MaxHours phải lớn hơn MinHours')

    setSaving(true)
    try {
      const payload = {
        vehicleTypeId: Number(form.vehicleTypeId),
        minHours: parseFloat(form.minHours),
        maxHours: parseFloat(form.maxHours) || 999,
        fee: parseFloat(form.fee),
        isOvernight: form.isOvernight,
        isActive: form.isActive ? 1 : 0
      }
      if (editing) {
        await updatePricingPolicyAPI(editing.PricingPolicyID, payload)
        toast.success('Cập nhật chính sách giá thành công')
      } else {
        await createPricingPolicyAPI(payload)
        toast.success('Tạo chính sách giá thành công')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {editing ? 'Chỉnh sửa Chính sách' : 'Tạo Chính sách mới'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Loại xe */}
          <FormField label="Loại xe *">
            <select
              name="vehicleTypeId"
              value={form.vehicleTypeId}
              onChange={handleChange}
              className="field-select"
            >
              <option value="">-- Chọn loại xe --</option>
              {vehicleTypes.map(v => (
                <option key={v.VehicleTypeID} value={v.VehicleTypeID}>
                  {v.VehicleName} ({v.VehicleCode})
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Từ giờ thứ (MinHours)">
              <input
                type="number" name="minHours" min="0" step="0.5"
                value={form.minHours} onChange={handleChange}
                className="field-input"
                placeholder="0"
              />
            </FormField>
            <FormField label="Đến giờ thứ (MaxHours)">
              <input
                type="number" name="maxHours" min="0" step="0.5"
                value={form.maxHours} onChange={handleChange}
                className="field-input"
                placeholder="3"
                disabled={form.isOvernight}
              />
            </FormField>
          </div>

          <FormField label="Phí áp dụng (VNĐ) *">
            <input
              type="number" name="fee" min="0" step="1000"
              value={form.fee} onChange={handleChange}
              className="field-input"
              placeholder="5000"
            />
          </FormField>

          <div className="flex gap-4">
            {/* Qua đêm */}
            <label className="flex items-center gap-3 cursor-pointer flex-1 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
              <div className={`relative w-10 h-5 rounded-full transition-colors ${form.isOvernight ? 'bg-blue-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isOvernight ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <input type="checkbox" name="isOvernight" checked={form.isOvernight} onChange={handleChange} className="hidden" />
              <span className="text-sm font-semibold text-slate-700">Phí qua đêm</span>
            </label>

            {/* Active */}
            <label className="flex items-center gap-3 cursor-pointer flex-1 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
              <div className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="hidden" />
              <span className="text-sm font-semibold text-slate-700">Đang hoạt động</span>
            </label>
          </div>

          {/* Preview */}
          {preview && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Xem trước</p>
              <p className="text-sm font-medium text-blue-900">
                {form.isOvernight
                  ? `Phí qua đêm (>8h): ${fmtVnd(preview.fee)}`
                  : `Giờ ${preview.min} → ${preview.max}: ${fmtVnd(preview.fee)}`
                }
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang lưu...</>
            ) : (
              <><Save size={16} /> {editing ? 'Cập nhật' : 'Tạo mới'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────
const ManagerPricing = () => {
  const [policies, setPolicies] = useState([])
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const [filterVehicle, setFilterVehicle] = useState('all')
  const [filterActive, setFilterActive] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [polRes, vtRes] = await Promise.all([
        getPricingPoliciesAPI(),
        getVehicleTypesAPI()
      ])
      setPolicies(polRes.data.data || [])
      setVehicleTypes(vtRes.data.data || [])
    } catch {
      toast.error('Không thể tải dữ liệu chính sách giá')
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 100)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = policies.filter(p => {
    const matchSearch = !query ||
      p.VehicleName?.toLowerCase().includes(query.toLowerCase()) ||
      p.VehicleCode?.toLowerCase().includes(query.toLowerCase()) ||
      String(p.PricingPolicyID).includes(query)
    const matchVehicle = filterVehicle === 'all' || String(p.VehicleTypeID) === filterVehicle
    const matchActive = filterActive === 'all'
      || (filterActive === '1' && p.IsActive)
      || (filterActive === '0' && !p.IsActive)
    return matchSearch && matchVehicle && matchActive
  })

  const handleToggleActive = async (policy) => {
    setTogglingId(policy.PricingPolicyID)
    try {
      await updatePricingPolicyAPI(policy.PricingPolicyID, { isActive: policy.IsActive ? 0 : 1 })
      toast.success(`Đã ${policy.IsActive ? 'tắt' : 'bật'} chính sách`)
      fetchData()
    } catch {
      toast.error('Cập nhật thất bại')
    } finally {
      setTogglingId(null)
    }
  }

  const openCreate = () => { setEditingPolicy(null); setModalOpen(true) }
  const openEdit = (p) => { setEditingPolicy(p); setModalOpen(true) }

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">Cấu hình / Chính sách giá</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Quản lý Chính sách giá</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCcw size={16} /> Làm mới
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={16} /> Tạo chính sách mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/60">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Tìm mã, tên loại xe..."
              className="w-full rounded-xl bg-slate-50 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 bg-slate-50">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 py-2.5 outline-none cursor-pointer"
            >
              <option value="all">Tất cả loại xe</option>
              {vehicleTypes.map(v => (
                <option key={v.VehicleTypeID} value={v.VehicleTypeID}>{v.VehicleName}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 bg-slate-50">
            <Filter size={16} className="text-slate-400" />
            <select
              value={filterActive} onChange={e => setFilterActive(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 py-2.5 outline-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto overflow-y-auto max-h-135">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">ID</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Loại xe</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Từ giờ</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Đến giờ</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Phí (VNĐ)</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Qua đêm</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Trạng thái</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                        Không tìm thấy chính sách nào
                      </td>
                    </tr>
                  ) : filtered.map(p => (
                    <tr key={p.PricingPolicyID} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-500 text-xs">#{p.PricingPolicyID}</td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">{p.VehicleName}</p>
                        <p className="text-xs text-slate-400">{p.VehicleCode}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">{fmtH(p.MinHours)}</td>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {p.IsOvernight ? '∞' : fmtH(p.MaxHours)}
                      </td>
                      <td className="px-5 py-4 font-black text-slate-900">{fmtVnd(p.Fee)}</td>
                      <td className="px-5 py-4">
                        {p.IsOvernight
                          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200/60 rounded-lg px-2 py-1">🌙 Qua đêm</span>
                          : <span className="text-xs text-slate-400">—</span>
                        }
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge isActive={p.IsActive} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                            title="Chỉnh sửa"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(p)}
                            disabled={togglingId === p.PricingPolicyID}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${p.IsActive
                              ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            } disabled:opacity-50`}
                            title={p.IsActive ? 'Tắt' : 'Bật'}
                          >
                            {p.IsActive ? <X size={14} /> : <CheckCircle size={14} />}
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
      </div>

      {/* Info box */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/60">
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
          <AlertTriangle size={14} />
          Lưu ý hệ thống
        </p>
        <div className="mt-3 space-y-2 rounded-xl bg-amber-50/50 border border-amber-100 p-4 text-xs font-medium text-amber-800 leading-relaxed">
          <p>• Hệ thống tính phí theo tier: chọn tier phù hợp nhất với số giờ thực tế của phiên gửi xe.</p>
          <p>• Tier qua đêm ưu tiên hơn tier thông thường khi số giờ &gt; 8h.</p>
          <p>• Phí tối thiểu là 2,000đ (do giới hạn cổng thanh toán PayOS).</p>
          <p>• Tắt chính sách (Inactive) thay vì xóa để giữ lịch sử tính phí.</p>
        </div>
      </div>

      {/* Modal */}
      <PolicyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        vehicleTypes={vehicleTypes}
        editing={editingPolicy}
        onSaved={fetchData}
      />

      <style>{`
        .field-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: #fff;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
          outline: none;
          transition: all 0.15s;
        }
        .field-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px #bfdbfe; }
        .field-input:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
        .field-select {
          width: 100%;
          appearance: none;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: #fff;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
          outline: none;
          cursor: pointer;
          transition: all 0.15s;
        }
        .field-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px #bfdbfe; }
      `}</style>
    </div>
  )
}

const FormField = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
    {children}
  </label>
)

export default ManagerPricing