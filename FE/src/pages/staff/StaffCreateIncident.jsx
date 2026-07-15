/**
 * FILE: StaffCreateIncident.jsx
 * MÔ TẢ: Trang Báo cáo Sự cố dành cho Staff.
 * Tạo sự cố mới (tìm kiếm theo mã phiên, biển số) và xem/cập nhật lịch sử sự cố.
 */

import { useState, useEffect, useRef } from 'react'
import {
  AlertTriangle, ArrowLeft, Plus, Search, RefreshCw,
  Clock, Eye, Edit2, UploadCloud, Trash2,
  Image as ImageIcon, X, ZoomIn,
  ChevronLeft, ChevronRight, ChevronDown, Filter, Calendar, Car, CheckCircle2, User, MapPin, Clock as ClockIcon, Loader2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import staffApi from '../../apis/staffApi'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'

// ─── Constants ────────────────────────────────────────────────────────────────
const INCIDENT_TYPES = [
  'lostCard',
  'accident',
  'dispute',
  'brokenVehicle',
  'damageProperty',
  'violation',
  'technical',
  'other'
]
const PRIORITIES = [
  { value: 'Low', labelKey: 'low', color: 'bg-emerald-500' },
  { value: 'Normal', labelKey: 'normal', color: 'bg-blue-500' },
  { value: 'High', labelKey: 'high', color: 'bg-red-500' }
]
const STATUSES = [
  { value: 'all', labelKey: 'all', color: 'default' },
  { value: 'Open', labelKey: 'open', color: 'error' },
  { value: 'InProgress', labelKey: 'inProgress', color: 'warning' },
  { value: 'Resolved', labelKey: 'resolved', color: 'success' }
]
const UPDATE_STATUSES = ['Open', 'InProgress', 'Resolved']
const MAX_IMAGES = 15
const MAX_FILE_MB = 100

// ─── Biển số & mã phiên helpers ───────────────────────────────────────────────
const formatPlate = (raw) => {
  const clean = (raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (!clean) return ''
  const prov = clean.slice(0, 2).replace(/[^0-9]/g, '')
  let result = prov
  if (prov.length < 2) return result
  let i = 2, series = ''
  while (i < clean.length && /[A-Z]/.test(clean[i]) && series.length < 2) { series += clean[i]; i++ }
  result += series
  if (!series) return result
  const nums = clean.slice(i).replace(/[^0-9]/g, '').slice(0, 5)
  if (!nums.length) return result
  result += '-'
  result += nums.length <= 3 ? nums : nums.slice(0, nums.length - 2) + '.' + nums.slice(nums.length - 2)
  return result
}
const PLATE_REGEX = /^(\d{2}[A-Z]{1,2}-?\d{3}\.?\d{2}|\d{2}[A-Z]{1,2}-?\d{4,5})$/i
const isValidPlate = (p) => PLATE_REGEX.test(p)

const formatSessionCode = (raw) => {
  const digits = (raw || '').replace(/[^0-9]/g, '')
  if (!digits) return ''
  return `SS-${digits.slice(0, 5)}`
}
const padSessionCode = (raw) => {
  const digits = (raw || '').replace(/[^0-9]/g, '')
  return digits ? `SS-${digits.padStart(5, '0')}` : ''
}
const sessionCodeToId = (code) => {
  const digits = (code || '').replace(/[^0-9]/g, '')
  return digits ? parseInt(digits, 10) : null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Small UI components ──────────────────────────────────────────────────────
function StatusChip({ status }) {
  const { t } = useTranslation()
  const map = {
    Open: { label: t('staff.createIncident.statuses.open'), style: 'bg-red-50 text-red-600 border-red-200' },
    InProgress: { label: t('staff.createIncident.statuses.inProgress'), style: 'bg-amber-50 text-amber-600 border-amber-200' },
    Resolved: { label: t('staff.createIncident.statuses.resolved'), style: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
  }
  const s = map[status] || { label: status, style: 'bg-slate-50 text-slate-600 border-slate-200' }
  return <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${s.style}`}>{s.label}</span>
}

function PriorityBadge({ priority }) {
  const { t } = useTranslation()
  const map = {
    Low: { label: t('staff.createIncident.priorities.low'), style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    Normal: { label: t('staff.createIncident.priorities.normal'), style: 'bg-blue-50 text-blue-700 border-blue-200' },
    High: { label: t('staff.createIncident.priorities.high'), style: 'bg-red-50 text-red-700 border-red-200' }
  }
  const s = map[priority] || map.Normal
  return <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${s.style}`}>{s.label}</span>
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIdx(i => Math.min(images.length - 1, i + 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [images.length, onClose])

  if (!images.length) return null
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white bg-white/10 hover:bg-white/20 rounded-3xl transition-colors">
        <X size={24} />
      </button>
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
        {idx + 1} / {images.length}
      </div>
      {idx > 0 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i - 1) }} className="absolute left-4 p-3 text-white bg-white/10 hover:bg-white/20 rounded-3xl transition-colors">
          <ChevronLeft size={32} />
        </button>
      )}
      <img src={images[idx]} onClick={e => e.stopPropagation()} className="max-w-[90vw] max-h-[88vh] object-contain rounded-3xl shadow-2xl" alt="Incident attachment" />
      {idx < images.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i + 1) }} className="absolute right-4 p-3 text-white bg-white/10 hover:bg-white/20 rounded-3xl transition-colors">
          <ChevronRight size={32} />
        </button>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-2 flex-wrap justify-center px-4">
          {images.map((src, i) => (
            <img key={i} src={src} onClick={e => { e.stopPropagation(); setIdx(i) }}
              className={`w-14 h-14 object-cover rounded-xl cursor-pointer transition-all ${i === idx ? 'opacity-100 ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100 ring-2 ring-transparent'}`}
              alt={`Thumbnail ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AttachmentGrid ───────────────────────────────────────────────────────────
function AttachmentGrid({ images = [], editable = false, onChange }) {
  const { t } = useTranslation()
  const fileRef = useRef(null)
  const [lightbox, setLightbox] = useState(null)

  const handleAdd = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    e.target.value = null
    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) { toast.warning(t('staff.createIncident.attachments.maxReached', { max: MAX_IMAGES })); return }
    const toProcess = files.slice(0, remaining)
    const oversized = toProcess.filter(f => f.size > MAX_FILE_MB * 1024 * 1024)
    if (oversized.length) toast.error(t('staff.createIncident.attachments.oversized', { count: oversized.length, maxMb: MAX_FILE_MB }))
    const valid = toProcess.filter(f => f.size <= MAX_FILE_MB * 1024 * 1024)
    if (!valid.length) return
    try {
      const b64arr = await Promise.all(valid.map(fileToBase64))
      onChange([...images, ...b64arr])
    } catch { toast.error(t('staff.createIncident.attachments.readError')) }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (!editable) return
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) handleAdd({ target: { files }, currentTarget: {} })
  }

  const handleRemove = (idx) => onChange(images.filter((_, i) => i !== idx))

  if (!editable && images.length === 0) return null

  return (
    <div>
      {editable && (
        <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          onClick={() => images.length < MAX_IMAGES && fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${images.length >= MAX_IMAGES ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 cursor-pointer hover:border-blue-400'} mb-4`}
        >
          <UploadCloud size={28} className="mx-auto mb-2 text-slate-400" />
          <p className="text-sm font-medium text-slate-600 mb-1">
            {images.length >= MAX_IMAGES ? t('staff.createIncident.attachments.maxReached', { max: MAX_IMAGES }) : t('staff.createIncident.attachments.dropOrClick', { current: images.length, max: MAX_IMAGES })}
          </p>
          <p className="text-xs text-slate-400">{t('staff.createIncident.attachments.limitLabel', { maxMb: MAX_FILE_MB })}</p>
        </div>
      )}
      <input ref={fileRef} type="file" multiple hidden accept="image/*" onChange={handleAdd} />
      {images.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-3">
          {images.map((src, i) => (
            <div key={i} className="relative rounded-3xl overflow-hidden aspect-square group bg-slate-100">
              <img src={src} className="w-full h-full object-cover block" alt={`Attachment ${i + 1}`} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                  <button onClick={() => setLightbox(i)} className="p-1.5 bg-white/90 hover:bg-white rounded-xl text-slate-700 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <ZoomIn size={16} />
                  </button>
                  {editable && (
                    <button onClick={() => handleRemove(i)} className="p-1.5 bg-white/90 hover:bg-red-50 hover:text-red-600 rounded-xl text-red-500 transition-colors shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}
      {lightbox !== null && <Lightbox images={images} startIndex={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ─── CreateIncidentForm ───────────────────────────────────────────────────────
function CreateIncidentForm({ sessionId, driverId, onSuccess }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    incidentType: '', priority: 'Normal', description: '', plateNumber: '',
    sessionCode: sessionId ? `SS-${String(sessionId).padStart(5, '0')}` : '',
    _driverName: '', _sessionId: sessionId || undefined, _linkedSession: null
  })
  const [errors, setErrors] = useState({})
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sessionOptions, setSessionOptions] = useState([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)

  // 1. Tải danh sách phiên Active 1 lần (để cho combobox)
  useEffect(() => {
    if (sessionId) return
    let cancelled = false
    const run = async () => {
      setLoadingSessions(true)
      try {
        const res = await staffApi.searchSessions({ status: 'Active' })
        if (cancelled) return
        const raw = res?.data ?? res ?? []
        setSessionOptions(Array.isArray(raw) ? raw : [])
      } catch {
        // bỏ qua
      } finally {
        if (!cancelled) setLoadingSessions(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [sessionId])

  const setField = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(err => ({ ...err, [field]: '' }))
  }

  const linkSession = (s) => {
    if (!s) return
    setForm(f => ({
      ...f,
      sessionCode: s.SessionCode || `SS-${String(s.SessionID).padStart(5, '0')}`,
      plateNumber: s.PlateNumber || '',
      _driverName: s.DriverName || '',
      _sessionId: s.SessionID,
      _linkedSession: s
    }))
  }

  const handlePickSession = (e) => {
    const val = e.target.value
    if (!val) {
      setForm(f => ({ ...f, sessionCode: '', plateNumber: '', _driverName: '', _sessionId: undefined, _linkedSession: null }))
      return
    }
    const session = sessionOptions.find(o => String(o.SessionID) === val)
    if (session) linkSession(session)
  }

  const handleSessionChange = (e) => {
    setForm(f => ({ ...f, sessionCode: formatSessionCode(e.target.value), _linkedSession: null }))
    setErrors(err => ({ ...err, sessionCode: '' }))
  }

  const handleSessionLookup = async () => {
    if (sessionId) return
    const padded = padSessionCode(form.sessionCode)
    if (!padded) return
    setForm(f => ({ ...f, sessionCode: padded }))
    const sid = sessionCodeToId(padded)
    if (!sid) return
    setLookupLoading(true)
    try {
      const res = await staffApi.getCheckoutPreview(sid)
      const s = res?.data?.session || res?.session || res?.data
      if (s && (s.PlateNumber || s.SessionCode)) {
        linkSession({ ...s, SessionID: s.SessionID || sid })
      } else {
        toast.warning(t('staff.createIncident.form.sessionNotFound', { code: padded }))
      }
    } catch {
      toast.warning(t('staff.createIncident.form.sessionNotFound', { code: padded }))
    } finally {
      setLookupLoading(false)
    }
  }

  const handlePlateChange = (e) => {
    setForm(f => ({ ...f, plateNumber: formatPlate(e.target.value), _linkedSession: null }))
    setErrors(err => ({ ...err, plateNumber: '' }))
  }

  const handlePlateLookup = async () => {
    if (sessionId) return
    const plate = (form.plateNumber || '').trim().toUpperCase()
    if (plate.length < 3) return
    if (!isValidPlate(plate)) {
      toast.warning(t('staff.createIncident.form.plateInvalid'))
      return
    }
    setLookupLoading(true)
    try {
      const res = await staffApi.searchSessions({ keyword: plate, status: 'Active' })
      const raw = res?.data ?? res ?? []
      const list = Array.isArray(raw) ? raw : []
      const match = list.find(s => (s.PlateNumber || '').toUpperCase() === plate) || list[0]
      if (match) {
        linkSession(match)
      } else {
        toast.warning(t('staff.createIncident.form.plateNotFound', { plate }))
      }
    } catch {
      toast.warning(t('staff.createIncident.form.plateNotFound', { plate }))
    } finally {
      setLookupLoading(false)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.incidentType) e.incidentType = t('staff.createIncident.form.incidentTypeRequired')
    if (form.description.trim().length < 20) e.description = t('staff.createIncident.form.descMinLength', { count: 20 - form.description.trim().length })
    if (form.plateNumber && !isValidPlate(form.plateNumber)) e.plateNumber = t('staff.createIncident.form.plateInvalid')
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      await staffApi.createIncident({
        sessionId: sessionId || form._sessionId || undefined,
        driverId: driverId || undefined,
        plateNumber: form.plateNumber.trim() || undefined,
        incidentType: form.incidentType, priority: form.priority,
        description: form.description.trim(), attachments: images
      })
      toast.success(t('staff.createIncident.form.submitSuccess'))
      setForm({ incidentType: '', priority: 'Normal', description: '', plateNumber: '', sessionCode: '', _driverName: '', _sessionId: undefined, _linkedSession: null })
      setImages([])
      onSuccess?.()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || t('staff.createIncident.form.submitError'))
    } finally { setLoading(false) }
  }

  const descLen = form.description.trim().length

  return (
    <div className="space-y-6">
      {/* Block Linked Session */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-amber-500" />
          <h3 className="font-bold text-slate-700">{t('staff.createIncident.form.linkedInfo')}</h3>
        </div>

        {!sessionId && (
          <div className="mb-5 relative">
            <select
              value={form._sessionId || ''}
              onChange={handlePickSession}
              disabled={loadingSessions}
              className="w-full bg-white border border-slate-300 rounded-3xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 appearance-none"
            >
              <option value="">{t('staff.createIncident.form.searchSessionPlaceholder')}</option>
              {sessionOptions.map(o => (
                <option key={o.SessionID} value={o.SessionID}>
                  {o.PlateNumber ? `${o.PlateNumber} · ${o.SessionCode || ''}` : (o.SessionCode || '')}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">{t('staff.createIncident.form.sessionCodeLabel')}</label>
            <div className="relative">
              <input
                type="text"
                value={form.sessionCode}
                onChange={handleSessionChange}
                onBlur={handleSessionLookup}
                readOnly={!!sessionId}
                placeholder={t('staff.createIncident.form.sessionCodePlaceholder')}
                className="w-full bg-white border border-slate-300 rounded-3xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all read-only:bg-slate-100"
              />
              {lookupLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />}
            </div>
            <p className="text-[11px] text-slate-400">{sessionId ? t('staff.createIncident.form.sessionCodeLinked') : t('staff.createIncident.form.sessionCodeHint')}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">{t('staff.createIncident.form.plateLabel')}</label>
            <input
              type="text"
              value={form.plateNumber}
              onChange={handlePlateChange}
              onBlur={handlePlateLookup}
              placeholder={t('staff.createIncident.form.platePlaceholder')}
              className={`w-full bg-white border rounded-3xl px-4 py-2.5 text-sm font-bold uppercase outline-none transition-all ${errors.plateNumber ? 'border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'}`}
              maxLength={12}
            />
            <p className={`text-[11px] ${errors.plateNumber ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
              {errors.plateNumber || (sessionId ? '' : t('staff.createIncident.form.plateHint'))}
            </p>
          </div>
        </div>

        {/* Thẻ xác nhận phiên đã liên kết */}
        {form._linkedSession && (
          <div className="mt-5 bg-blue-50 border border-blue-200 rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-blue-600" />
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">{t('staff.createIncident.form.linkedConfirm')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex gap-2.5 items-start">
                <Car size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-blue-400">{t('staff.createIncident.form.plate')}</p>
                  <p className="text-sm font-black text-blue-900">{form._linkedSession.PlateNumber || '—'}</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <User size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-blue-400">{t('staff.createIncident.form.driver')}</p>
                  <p className="text-sm font-bold text-blue-900">{form._linkedSession.DriverName || '—'}</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <AlertTriangle size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-blue-400">{t('staff.createIncident.form.sessionCode')}</p>
                  <p className="text-sm font-bold text-blue-900">{form._linkedSession.SessionCode || form.sessionCode || '—'}</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-blue-400">{t('staff.createIncident.form.slot')}</p>
                  <p className="text-sm font-bold text-blue-900">{[form._linkedSession.ZoneName, form._linkedSession.FloorName, form._linkedSession.SlotCode].filter(Boolean).join(' · ') || form._linkedSession.SlotCode || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Block Thông tin sự cố */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">{t('staff.createIncident.form.incidentTypeLabel')}</label>
          <div className="relative">
            <select
              value={form.incidentType}
              onChange={setField('incidentType')}
              className={`w-full bg-white border rounded-3xl px-4 py-2.5 text-sm font-medium outline-none appearance-none transition-all ${errors.incidentType ? 'border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'}`}
            >
              <option value="" disabled>{t('staff.createIncident.form.incidentTypeLabel')}</option>
              {INCIDENT_TYPES.map(key => <option key={key} value={key}>{t(`staff.createIncident.types.${key}`)}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {errors.incidentType && <p className="text-[11px] text-red-500 font-medium">{errors.incidentType}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">{t('staff.createIncident.form.priorityLabel')}</label>
          <div className="relative">
            <select
              value={form.priority}
              onChange={setField('priority')}
              className="w-full bg-white border border-slate-300 rounded-3xl px-4 py-2.5 text-sm font-medium outline-none appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{t(`staff.createIncident.priorities.${p.labelKey}`)}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700">{t('staff.createIncident.form.descLabel')}</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={setField('description')}
          placeholder={t('staff.createIncident.form.descPlaceholder')}
          maxLength={500}
          className={`w-full bg-white border rounded-3xl px-4 py-3 text-sm outline-none resize-none transition-all ${errors.description ? 'border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'}`}
        />
        <div className="flex justify-between items-center px-1">
          <p className="text-[11px] text-red-500 font-medium">{errors.description}</p>
          <p className={`text-[11px] ${descLen < 20 ? 'text-red-400' : 'text-slate-400'}`}>
            {descLen < 20 ? t('staff.createIncident.form.descLengthHint', { current: descLen, count: 20 - descLen }) : `${descLen}/500`}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon size={16} className="text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700">{t('staff.createIncident.form.attachmentHint', { max: MAX_IMAGES })}</h3>
        </div>
        <AttachmentGrid images={images} editable onChange={setImages} />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 rounded-3xl py-3.5 text-sm font-bold text-white transition-all shadow-md active:scale-[0.98] ${
          loading ? 'bg-slate-400 cursor-not-allowed shadow-none' :
          form.priority === 'High' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
        }`}
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        {loading ? t('staff.createIncident.form.submitLoading') : `${t('staff.createIncident.form.submitBtn')}${images.length ? ` (${images.length})` : ''}`}
      </button>
    </div>
  )
}

// ─── IncidentDetailModal ──────────────────────────────────────────────────────
function IncidentDetailModal({ incidentId, open, onClose, onUpdated }) {
  const { t } = useTranslation()
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editStatus, setEditStatus] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editImages, setEditImages] = useState([])
  const [imagesDirty, setImagesDirty] = useState(false)

  useEffect(() => {
    if (!open || !incidentId) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const r = await staffApi.getIncidentById(incidentId)
        if (cancelled) return
        const data = r.data?.data || r.data
        setIncident(data)
        setEditStatus(data?.IncidentStatus || '')
        setEditNote('')
        setEditImages(Array.isArray(data?.Attachments) ? data.Attachments : [])
        setImagesDirty(false)
      } catch {
        if (!cancelled) toast.error(t('staff.createIncident.detail.loadError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [open, incidentId])

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      const payload = { status: editStatus, note: editNote || undefined }
      if (imagesDirty) payload.attachments = editImages
      await staffApi.updateIncidentStatus(incidentId, payload)
      toast.success(t('staff.createIncident.detail.updateSuccess'))
      onUpdated?.()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('staff.createIncident.detail.updateError'))
    } finally { setUpdating(false) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-3xl">
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-lg font-black text-slate-800">{t('staff.createIncident.detail.title', { id: incidentId })}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
              <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : incident ? (
            <div className="space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <StatusChip status={incident.IncidentStatus} />
                <PriorityBadge priority={incident.Priority} />
                <span className="px-2 py-0.5 rounded border border-slate-200 text-[11px] font-bold text-slate-600 bg-white">{incident.IncidentType}</span>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                {[
                  [t('staff.createIncident.detail.code'), `#${incident.IncidentID}`],
                  [t('staff.createIncident.detail.session'), incident.SessionCode || '—'],
                  [t('staff.createIncident.detail.driver'), incident.DriverName || '—'],
                  [t('staff.createIncident.detail.phone'), incident.DriverPhone || '—'],
                  [t('staff.createIncident.detail.plate'), incident.PlateNumber || '—'],
                  [t('staff.createIncident.detail.staff'), incident.AssignedStaffName || t('staff.createIncident.detail.unassigned')],
                  [t('staff.createIncident.detail.createdAt'), fmtDate(incident.CreatedAt)],
                  [t('staff.createIncident.detail.updatedAt'), fmtDate(incident.UpdatedAt)]
                ].map(([label, value], i) => (
                  <div key={i}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t('staff.createIncident.detail.desc')}</p>
                <div className="bg-white border border-slate-200 rounded-3xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  {incident.Description}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon size={16} className="text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-700">
                    {t('staff.createIncident.attachments.title')}
                    {imagesDirty && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full">{t('staff.createIncident.attachments.changed')}</span>}
                  </h3>
                </div>
                <AttachmentGrid images={editImages} editable onChange={(imgs) => { setEditImages(imgs); setImagesDirty(true) }} />
                {editImages.length === 0 && !imagesDirty && <p className="text-xs text-slate-400 italic">{t('staff.createIncident.attachments.noImages')}</p>}
              </div>

              <hr className="border-slate-100" />

              {/* Update Status */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">{t('staff.createIncident.detail.updateStatusTitle')}</h3>
                <div className="space-y-4">
                  <div className="relative max-w-xs">
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-3xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-all"
                    >
                      {UPDATE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <textarea
                    rows={2}
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    placeholder={t('staff.createIncident.detail.updateNotePlaceholder')}
                    className="w-full bg-white border border-slate-300 rounded-3xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

            </div>
          ) : (
            <div className="p-4 bg-red-50 text-red-600 rounded-3xl flex items-center gap-2">
              <AlertTriangle size={18} /> {t('staff.createIncident.detail.loadError')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-3xl hover:bg-slate-50 transition-colors">
            {t('staff.createIncident.detail.close')}
          </button>
          <button
            onClick={handleUpdate}
            disabled={updating || loading || !incident}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-3xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
          >
            {updating ? <Loader2 size={16} className="animate-spin" /> : <Edit2 size={16} />}
            {updating ? t('staff.createIncident.detail.saving') : t('staff.createIncident.detail.saveBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── IncidentHistory ──────────────────────────────────────────────────────────
function IncidentHistory({ refreshTrigger }) {
  const { t } = useTranslation()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [localSearch, setLocalSearch] = useState('')

  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [searchTrigger, setSearchTrigger] = useState(0)

  const keywordRef = useRef(keyword)
  const statusRef = useRef(statusFilter)
  const priorityRef = useRef(priorityFilter)
  const fromDateRef = useRef(fromDate)
  const toDateRef = useRef(toDate)
  useEffect(() => { keywordRef.current = keyword }, [keyword])
  useEffect(() => { statusRef.current = statusFilter }, [statusFilter])
  useEffect(() => { priorityRef.current = priorityFilter }, [priorityFilter])
  useEffect(() => { fromDateRef.current = fromDate }, [fromDate])
  useEffect(() => { toDateRef.current = toDate }, [toDate])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const params = {}
        if (statusRef.current !== 'all') params.status = statusRef.current
        if (priorityRef.current !== 'all') params.priority = priorityRef.current
        if (keywordRef.current.trim()) params.keyword = keywordRef.current.trim()
        if (fromDateRef.current) params.fromDate = fromDateRef.current
        if (toDateRef.current) params.toDate = toDateRef.current
        const res = await staffApi.getIncidents(params)
        if (!cancelled) setIncidents(res.data?.data || res?.data || [])
      } catch {
        if (!cancelled) toast.error(t('staff.createIncident.detail.loadError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [searchTrigger, refreshTrigger])

  const handleSearch = () => setSearchTrigger(t => t + 1)

  const filtered = incidents.filter(i => {
    if (!localSearch.trim()) return true
    const s = localSearch.toLowerCase()
    return (
      String(i.IncidentID).includes(s) ||
      (i.IncidentType || '').toLowerCase().includes(s) ||
      (i.DriverName || '').toLowerCase().includes(s) ||
      (i.PlateNumber || '').toLowerCase().includes(s) ||
      (i.Description || '').toLowerCase().includes(s)
    )
  })

  const handleReset = () => {
    setKeyword(''); setStatusFilter('all'); setPriorityFilter('all')
    setFromDate(''); setToDate(''); setLocalSearch('')
    setSearchTrigger(t => t + 1)
  }

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || keyword || fromDate || toDate

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('staff.createIncident.history.localSearch')}
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-10 pr-10 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {localSearch && (
            <button onClick={() => setLocalSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-3xl border transition-colors ${showFilters || hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <Filter size={16} />
          {t('staff.createIncident.history.filters')}
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-red-500" />}
        </button>
        <button onClick={handleSearch} className="p-2 border border-slate-200 rounded-3xl bg-white text-slate-600 hover:bg-slate-50 transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      {showFilters && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder={t('staff.createIncident.history.keyword')} value={keyword} onChange={e => setKeyword(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none appearance-none focus:border-blue-500">
                {STATUSES.map(s => <option key={s.value} value={s.value}>{t(`staff.createIncident.statuses.${s.labelKey}`)}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none appearance-none focus:border-blue-500">
                <option value="all">{t('staff.createIncident.priorities.all') || 'All Priorities'}</option>
                <option value="High">{t('staff.createIncident.priorities.high')}</option>
                <option value="Normal">{t('staff.createIncident.priorities.normal')}</option>
                <option value="Low">{t('staff.createIncident.priorities.low')}</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[150px]">
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <span className="text-slate-400">—</span>
            <div className="relative flex-1 min-w-[150px]">
              <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSearch} className="px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-900 transition-colors">{t('staff.createIncident.history.searchBtn')}</button>
              {hasActiveFilters && <button onClick={handleReset} className="px-4 py-2 bg-white border border-slate-300 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors">{t('staff.createIncident.history.clearBtn')}</button>}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUSES.filter(s => s.value !== 'all').map(s => {
          const count = incidents.filter(i => i.IncidentStatus === s.value).length
          if (!count) return null
          return (
            <button key={s.value} onClick={() => setStatusFilter(s.value)} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              {t(`staff.createIncident.statuses.${s.labelKey}`)}: <span className="text-slate-900">{count}</span>
            </button>
          )
        })}
        <div className="ml-auto text-xs font-medium text-slate-400">
          {filtered.length !== incidents.length ? t('staff.createIncident.history.showing', { current: filtered.length, total: incidents.length }) : t('staff.createIncident.history.total', { total: incidents.length })}
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-slate-500 font-medium">{t('staff.createIncident.history.loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
          <AlertTriangle size={48} className="text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">{incidents.length === 0 ? t('staff.createIncident.history.empty') : t('staff.createIncident.history.noMatch')}</p>
          {hasActiveFilters && <button onClick={handleReset} className="mt-3 text-sm text-blue-600 font-bold hover:underline">{t('staff.createIncident.history.clearBtn')}</button>}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    t('staff.createIncident.history.colId'),
                    t('staff.createIncident.history.colType'),
                    t('staff.createIncident.history.colDriver'),
                    t('staff.createIncident.history.colPriority'),
                    t('staff.createIncident.history.colStatus'),
                    t('staff.createIncident.history.colImage'),
                    t('staff.createIncident.history.colTime'),
                    ''
                  ].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(inc => (
                  <tr key={inc.IncidentID} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-700">#{inc.IncidentID}</p>
                      {inc.SessionCode && <p className="text-[10px] font-bold text-blue-500">{inc.SessionCode}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700 max-w-[150px] truncate">{inc.IncidentType}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-slate-800">{inc.DriverName || '—'}</p>
                      {inc.PlateNumber && <p className="text-xs font-semibold text-slate-500">{inc.PlateNumber}</p>}
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={inc.Priority} /></td>
                    <td className="px-4 py-3"><StatusChip status={inc.IncidentStatus} /></td>
                    <td className="px-4 py-3">
                      {Array.isArray(inc.Attachments) && inc.Attachments.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {inc.Attachments.slice(0, 3).map((src, i) => (
                            <img key={i} src={src} className="w-8 h-8 rounded-xl object-cover border border-slate-200 cursor-pointer hover:scale-110 transition-transform" onClick={() => { setSelectedId(inc.IncidentID); setDetailOpen(true) }} alt="Attachment" />
                          ))}
                          {inc.Attachments.length > 3 && <span className="text-[10px] font-bold text-slate-500 ml-1">+{inc.Attachments.length - 3}</span>}
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">{fmtDate(inc.CreatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setSelectedId(inc.IncidentID); setDetailOpen(true) }} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <IncidentDetailModal incidentId={selectedId} open={detailOpen} onClose={() => setDetailOpen(false)} onUpdated={handleSearch} />
    </div>
  )
}

// ─── Page chính ───────────────────────────────────────────────────────────────
export default function StaffCreateIncident({ sessionId, driverId }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreated = () => {
    setRefreshKey(k => k + 1)
    setTimeout(() => setTab(1), 800)
  }

  return (
    <div className="min-h-screen bg-[#fbf9f1] dark:bg-slate-900 pb-10 transition-colors duration-300 font-sans">
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 px-4 md:px-8 py-4 sticky top-0 z-20 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/staff/dashboard')} className="p-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 rounded-3xl transition-colors border border-slate-200/60 dark:border-slate-600/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-3xl shadow-md shadow-orange-500/20">
                <AlertTriangle size={22} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t('staff.createIncident.tabs.pageTitle')}</h1>
            </div>
          </div>
          <button onClick={() => setTab(0)} className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-3xl transition-colors shadow-md shadow-blue-500/30">
            <Plus size={18} /> {t('staff.createIncident.tabs.create')}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-2 p-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100/60 dark:border-slate-700/60">
            <button onClick={() => setTab(0)} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${tab === 0 ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-800'}`}>
              <Plus size={18} /> {t('staff.createIncident.tabs.create')}
            </button>
            <button onClick={() => setTab(1)} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${tab === 1 ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-800'}`}>
              <Clock size={18} /> {t('staff.createIncident.tabs.history')}
            </button>
          </div>
          <div className="p-6 md:p-8">
            {tab === 0 && <CreateIncidentForm sessionId={sessionId} driverId={driverId} onSuccess={handleCreated} />}
            {tab === 1 && <IncidentHistory refreshTrigger={refreshKey} />}
          </div>
        </div>
      </div>
    </div>
  )
}
