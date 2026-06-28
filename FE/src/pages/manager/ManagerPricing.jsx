/**
 * FILE: ManagerPricing.jsx
 * MÔ TẢ: Trang Quản lý Bảng giá (Pricing Policies) dành cho Manager.
 * Quản lý các block giá ban ngày, giá qua đêm theo loại xe. Cung cấp hướng dẫn trực quan (PricingGuide) cho người thiết lập.
 */

// src/pages/manager/ManagerPricing.jsx
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search, Filter, Save, Edit3, Plus, RefreshCcw,
  AlertTriangle, CheckCircle, X, Trash2, Moon, HelpCircle, ChevronDown
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  getPricingPoliciesAPI,
  createPricingPolicyAPI,
  updatePricingPolicyAPI,
  deletePricingPolicyAPI,
  getVehicleTypesAPI,
  getNightPricingPoliciesAPI,
  updateNightPricingPolicyAPI
} from '../../apis/managerApi'

const fmtVnd = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const fmtH = (h) => h == null ? '—' : `${h}h`
const fmtTime = (t) => {
  if (!t) return '--:--'
  // Nếu là chuỗi ISO datetime (chứa 'T'), lấy phần giờ
  if (t.includes('T')) {
    const match = t.match(/T(\d{2}:\d{2})/)
    return match ? match[1] : t.slice(0, 5)
  }
  // Nếu đã là "HH:mm" hoặc "HH:mm:ss"
  return t.slice(0, 5)
}
const EMPTY_FORM = {
  vehicleTypeId: '',
  minHours: '0',
  maxHours: '',
  fee: '',
  isOvernight: false,
  isActive: true
}

const StatusBadge = ({ isActive }) => {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold
      ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
        : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {isActive ? t('manager.pricing.statusActive') : t('manager.pricing.statusInactive')}
    </span>
  )
}

const PolicyModal = ({ open, onClose, vehicleTypes, editing, onSaved }) => {
  const { t } = useTranslation()
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
    if (!form.vehicleTypeId) return toast.warn(t('manager.pricing.modal.warnVehicle'))
    if (!form.fee || parseFloat(form.fee) < 0) return toast.warn(t('manager.pricing.modal.warnFee'))
    if (parseFloat(form.maxHours) <= parseFloat(form.minHours) && !form.isOvernight)
      return toast.warn(t('manager.pricing.modal.warnRange'))

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
        toast.success(t('manager.pricing.modal.updateSuccess'))
      } else {
        await createPricingPolicyAPI(payload)
        toast.success(t('manager.pricing.modal.createSuccess'))
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('manager.pricing.modal.saveFail'))
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {editing ? t('manager.pricing.modal.titleEdit') : t('manager.pricing.modal.titleCreate')}
          </h3>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <FormField label={t('manager.pricing.modal.vehicleLabel')}>
            <select name="vehicleTypeId" value={form.vehicleTypeId} onChange={handleChange} className="field-select">
              <option value="">{t('manager.pricing.modal.selectVehicle')}</option>
              {vehicleTypes.map(v => (
                <option key={v.VehicleTypeID} value={v.VehicleTypeID}>
                  {v.VehicleName} ({v.VehicleCode})
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('manager.pricing.modal.minHoursLabel')}>
              <input type="number" name="minHours" min="0" step="0.5" value={form.minHours} onChange={handleChange}
                className="field-input" placeholder="0" disabled={form.isOvernight} />
            </FormField>
            <FormField label={t('manager.pricing.modal.maxHoursLabel')}>
              <input type="number" name="maxHours" min="0" step="0.5" value={form.maxHours} onChange={handleChange}
                className="field-input" placeholder="3" disabled={form.isOvernight} />
            </FormField>
          </div>

          <FormField label={t('manager.pricing.modal.feeLabel')}>
            <input type="number" name="fee" min="0" step="1000" value={form.fee} onChange={handleChange}
              className="field-input" placeholder="5000" />
          </FormField>

          <div className="flex gap-4">
            <label className="flex items-center gap-3 cursor-pointer flex-1 rounded-3xl border border-slate-200 p-3 hover:bg-slate-50">
              <div className={`relative w-10 h-5 rounded-full transition-colors ${form.isOvernight ? 'bg-blue-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isOvernight ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <input type="checkbox" name="isOvernight" checked={form.isOvernight} onChange={handleChange} className="hidden" />
              <span className="text-sm font-semibold text-slate-700 font-bold">{t('manager.pricing.modal.overnightToggle')}</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer flex-1 rounded-3xl border border-slate-200 p-3 hover:bg-slate-50">
              <div className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="hidden" />
              <span className="text-sm font-semibold text-slate-700 font-bold">{t('manager.pricing.modal.activeToggle')}</span>
            </label>
          </div>

          {preview && (
            <div className="rounded-3xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">{t('manager.pricing.modal.previewLabel')}</p>
              <p className="text-sm font-medium text-blue-900">
                {form.isOvernight
                  ? t('manager.pricing.modal.previewOvernight', { fee: fmtVnd(preview.fee) })
                  : t('manager.pricing.modal.previewTier', { min: preview.min, max: preview.max, fee: fmtVnd(preview.fee) })
                }
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-3xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 font-bold hover:bg-slate-50 transition">
            {t('manager.pricing.modal.cancel')}
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 rounded-3xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t('manager.pricing.modal.saving')}</>
            ) : (
              <><Save size={16} /> {editing ? t('manager.pricing.modal.update') : t('manager.pricing.modal.create')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
const PricingGuide = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
            <HelpCircle size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">{t('manager.pricing.guide.title')}</p>
            <p className="text-xs text-slate-500 font-medium">{t('manager.pricing.guide.subtitle')}</p>
          </div>
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 pt-2 space-y-5 border-t border-slate-100">

          {/* Bước 1: Nguyên tắc chung */}
          <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-4">
            <p className="text-sm font-bold text-blue-700 mb-1">{t('manager.pricing.guide.rule.title')}</p>
            <p className="text-xs text-blue-700/80 leading-relaxed">{t('manager.pricing.guide.rule.desc')}</p>
          </div>

          {/* Bước 2: Cách chia đoạn */}
          <div>
            <p className="text-sm font-bold text-slate-800 font-black mb-2">{t('manager.pricing.guide.split.title')}</p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">{t('manager.pricing.guide.split.desc')}</p>
          </div>

          {/* Ví dụ minh hoạ trực quan */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t('manager.pricing.guide.example.label')}</p>
            </div>
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  {t('manager.pricing.guide.example.seg1')}
                </span>
                <span className="font-bold text-slate-900">5.000đ</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  {t('manager.pricing.guide.example.seg2')}
                </span>
                <span className="font-bold text-slate-900">10.000đ</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  {t('manager.pricing.guide.example.seg3')}
                </span>
                <span className="font-bold text-slate-900">5.000đ</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2.5 border-t border-slate-100">
                <span className="font-bold text-slate-800 font-black">{t('manager.pricing.guide.example.total')}</span>
                <span className="font-black text-emerald-600 text-base">20.000đ</span>
              </div>
            </div>
          </div>

          {/* Bảng chú giải 2 loại đoạn */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex gap-3 rounded-3xl border border-slate-100 bg-slate-50/40 p-3.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-blue-200/60 bg-blue-50 text-blue-600">
                <Search size={14} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 font-black">{t('manager.pricing.guide.dayBlock.title')}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">{t('manager.pricing.guide.dayBlock.desc')}</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-3xl border border-violet-100 bg-violet-50/30 p-3.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-violet-200/60 bg-violet-50 text-violet-600">
                <Moon size={14} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 font-black">{t('manager.pricing.guide.nightBlock.title')}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">{t('manager.pricing.guide.nightBlock.desc')}</p>
              </div>
            </div>
          </div>

          {/* Lưu ý */}
          <div className="flex gap-3 rounded-3xl border border-amber-100 bg-amber-50/40 p-3.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-amber-200/60 bg-amber-50 text-amber-600">
              <AlertTriangle size={14} />
            </div>
            <p className="text-xs text-amber-700/90 leading-relaxed">{t('manager.pricing.guide.note')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
const ManagerPricing = () => {
  const { t } = useTranslation()
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
  const [deletingId, setDeletingId] = useState(null)

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
      toast.error(t('manager.pricing.loadFail'))
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 100)
    }
  }, [t])

  useEffect(() => { fetchData() }, [fetchData])
  const [nightPolicies, setNightPolicies] = useState([])
  const [editingNight, setEditingNight] = useState(null)
  const [savingNight, setSavingNight] = useState(false)

  const fetchNightPolicies = useCallback(async () => {
    try {
      const res = await getNightPricingPoliciesAPI()
      setNightPolicies(res.data.data || [])
    } catch {
      toast.error(t('manager.pricing.night.loadFail'))
    }
  }, [t])

  useEffect(() => { fetchNightPolicies() }, [fetchNightPolicies])

  const handleSaveNight = async (policy, newFee, newStart, newEnd, newActive) => {
    setSavingNight(true)
    try {
      await updateNightPricingPolicyAPI(policy.NightPolicyID, {
        nightFee: parseFloat(newFee),
        nightStartTime: newStart,
        nightEndTime: newEnd,
        isActive: newActive ? 1 : 0
      })
      toast.success(t('manager.pricing.night.updateSuccess'))
      fetchNightPolicies()
      setEditingNight(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || t('manager.pricing.night.saveFail'))
    } finally {
      setSavingNight(false)
    }
  }
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
      toast.success(policy.IsActive ? t('manager.pricing.toggleOff') : t('manager.pricing.toggleOn'))
      fetchData()
    } catch {
      toast.error(t('manager.pricing.toggleFail'))
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (policy) => {
    if (policy.IsActive) return // an toàn 2 lớp, dù nút chỉ hiện khi Inactive
    if (!window.confirm(t('manager.pricing.confirmDelete', { id: policy.PricingPolicyID }))) return
    setDeletingId(policy.PricingPolicyID)
    try {
      await deletePricingPolicyAPI(policy.PricingPolicyID)
      toast.success(t('manager.pricing.deleteSuccess'))
      fetchData()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('manager.pricing.deleteFail'))
    } finally {
      setDeletingId(null)
    }
  }
  const openCreate = () => { setEditingPolicy(null); setModalOpen(true) }
  const openEdit = (p) => { setEditingPolicy(p); setModalOpen(true) }

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">{t('manager.pricing.eyebrow')}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{t('manager.pricing.title')}</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 font-bold hover:bg-slate-50 transition">
            <RefreshCcw size={16} /> {t('manager.pricing.refresh')}
          </button>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-3xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <Plus size={16} /> {t('manager.pricing.createNew')}
          </button>
        </div>
      </div>

      <PricingGuide />


      <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder={t('manager.pricing.searchPlaceholder')}
              className="w-full rounded-3xl bg-slate-50 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 rounded-3xl border border-slate-200 px-4 bg-slate-50">
            <Filter size={16} className="text-slate-400" />
            <select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 font-bold py-2.5 outline-none cursor-pointer">
              <option value="all">{t('manager.pricing.filterAllVehicle')}</option>
              {vehicleTypes.map(v => (
                <option key={v.VehicleTypeID} value={v.VehicleTypeID}>{v.VehicleName}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-3xl border border-slate-200 px-4 bg-slate-50">
            <Filter size={16} className="text-slate-400" />
            <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 font-bold py-2.5 outline-none cursor-pointer">
              <option value="all">{t('manager.pricing.filterAllStatus')}</option>
              <option value="1">{t('manager.pricing.filterActive')}</option>
              <option value="0">{t('manager.pricing.filterInactive')}</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <div className="overflow-x-auto overflow-y-auto max-h-135">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <table className="min-w-full text-left text-sm text-slate-700 font-bold">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('manager.pricing.col.id')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('manager.pricing.col.vehicle')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('manager.pricing.col.minHours')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('manager.pricing.col.maxHours')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('manager.pricing.col.fee')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('manager.pricing.col.overnight')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50">{t('manager.pricing.col.status')}</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 font-medium bg-slate-50 text-right">{t('manager.pricing.col.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                        {t('manager.pricing.empty')}
                      </td>
                    </tr>
                  ) : filtered.map(p => (
                    <tr key={p.PricingPolicyID} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-500 font-medium text-xs">#{p.PricingPolicyID}</td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800 font-black">{p.VehicleName}</p>
                        <p className="text-xs text-slate-400">{p.VehicleCode}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700 font-bold">{fmtH(p.MinHours)}</td>
                      <td className="px-5 py-4 font-semibold text-slate-700 font-bold">
                        {p.IsOvernight ? '∞' : fmtH(p.MaxHours)}
                      </td>
                      <td className="px-5 py-4 font-black text-slate-900">{fmtVnd(p.Fee)}</td>
                      <td className="px-5 py-4">
                        {p.IsOvernight
                          ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200/60 rounded-xl px-2 py-1">{t('manager.pricing.overnightBadge')}</span>
                          : <span className="text-xs text-slate-400">—</span>
                        }
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge isActive={p.IsActive} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(p)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                            title={t('manager.pricing.edit')}>
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleToggleActive(p)} disabled={togglingId === p.PricingPolicyID}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${p.IsActive
                              ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              } disabled:opacity-50`}
                            title={p.IsActive ? t('manager.pricing.turnOff') : t('manager.pricing.turnOn')}>
                            {p.IsActive ? <X size={14} /> : <CheckCircle size={14} />}
                          </button>

                          {/* Chỉ hiện khi policy đã Inactive */}
                          {!p.IsActive && (
                            <button onClick={() => handleDelete(p)} disabled={deletingId === p.PricingPolicyID}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-red-200 bg-white text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
                              title={t('manager.pricing.delete')}>
                              <Trash2 size={14} />
                            </button>
                          )}
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

      <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <div className="flex items-center gap-2 mb-4">
          <Moon size={18} className="text-violet-500" />
          <h2 className="text-lg font-bold text-slate-900">{t('manager.pricing.night.title')}</h2>
        </div>
        <p className="text-xs text-slate-500 font-medium mb-4">{t('manager.pricing.night.desc')}</p>

        <div className="space-y-3">
          {nightPolicies.map(np => (
            <NightPolicyRow
              key={np.NightPolicyID}
              policy={np}
              editing={editingNight === np.NightPolicyID}
              onEdit={() => setEditingNight(np.NightPolicyID)}
              onCancel={() => setEditingNight(null)}
              onSave={handleSaveNight}
              saving={savingNight}
            />
          ))}
        </div>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
          <AlertTriangle size={14} />
          {t('manager.pricing.noteTitle')}
        </p>
        <div className="mt-3 space-y-2 rounded-3xl bg-amber-50/50 border border-amber-100 p-4 text-xs font-medium text-amber-800 leading-relaxed">
          <p>{t('manager.pricing.note1')}</p>
          <p>{t('manager.pricing.note2')}</p>
          <p>{t('manager.pricing.note3')}</p>
          <p>{t('manager.pricing.note4')}</p>
        </div>
      </div>

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
const NightPolicyRow = ({ policy, editing, onEdit, onCancel, onSave, saving }) => {
  const { t } = useTranslation()
  const [fee, setFee] = useState(policy.NightFee)
  const [start, setStart] = useState(fmtTime(policy.NightStartTime))
  const [end, setEnd] = useState(fmtTime(policy.NightEndTime))
  const [active, setActive] = useState(Boolean(policy.IsActive))

  if (!editing) {
    return (
      <div className="flex items-center justify-between rounded-3xl border border-slate-200 p-4">
        <div>
          <p className="font-bold text-slate-800 font-black">{policy.VehicleName} <span className="text-xs text-slate-400">({policy.VehicleCode})</span></p>
          <p className="text-sm text-slate-500 font-medium">
            {fmtTime(policy.NightStartTime)} → {fmtTime(policy.NightEndTime)} · <span className="font-bold text-slate-900">{fmtVnd(policy.NightFee)}</span> / đêm
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge isActive={policy.IsActive} />
          <button onClick={onEdit} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-blue-600 transition-all">
            <Edit3 size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
      <p className="font-bold text-slate-800 font-black">{policy.VehicleName}</p>
      <div className="grid grid-cols-3 gap-3">
        <FormField label={t('manager.pricing.night.startLabel')}>
          <input type="time" value={start} onChange={e => setStart(e.target.value)} className="field-input" />
        </FormField>
        <FormField label={t('manager.pricing.night.endLabel')}>
          <input type="time" value={end} onChange={e => setEnd(e.target.value)} className="field-input" />
        </FormField>
        <FormField label={t('manager.pricing.night.feeLabel')}>
          <input type="number" min="0" step="1000" value={fee} onChange={e => setFee(e.target.value)} className="field-input" />
        </FormField>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
        <span className="text-sm font-semibold text-slate-700 font-bold">{t('manager.pricing.modal.activeToggle')}</span>
      </label>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 font-bold hover:bg-slate-50">
          {t('manager.pricing.modal.cancel')}
        </button>
        <button onClick={() => onSave(policy, fee, start, end, active)} disabled={saving}
          className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? t('manager.pricing.modal.saving') : t('manager.pricing.modal.update')}
        </button>
      </div>
    </div>
  )
}
export default ManagerPricing