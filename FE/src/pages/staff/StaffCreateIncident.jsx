import { useState, useEffect, useRef } from 'react'
import {
  Box, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Tabs, Tab, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, InputAdornment, CircularProgress, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, Divider, Alert,
  FormHelperText, Stack, Badge, Collapse, Autocomplete
} from '@mui/material'
import {
  AlertTriangle, ArrowLeft, Plus, Search, RefreshCw,
  Clock, Eye, Edit2, UploadCloud, Trash2,
  Image as ImageIcon, X, ZoomIn,
  ChevronLeft, ChevronRight, Filter, Calendar, Car, CheckCircle2, User, MapPin, Clock as ClockIcon
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
  { value: 'Low', labelKey: 'low', color: '#4caf50' },
  { value: 'Normal', labelKey: 'normal', color: '#2196f3' },
  { value: 'High', labelKey: 'high', color: '#f44336' }
]
const STATUSES = [
  { value: 'all', labelKey: 'all', color: 'default' },
  { value: 'Open', labelKey: 'open', color: 'error' },
  { value: 'InProgress', labelKey: 'inProgress', color: 'warning' },
  { value: 'Resolved', labelKey: 'resolved', color: 'success' }
]
const UPDATE_STATUSES = ['Open', 'InProgress', 'Resolved']
const MAX_IMAGES = 15
const MAX_FILE_MB = 5

// ─── Biển số & mã phiên helpers ───────────────────────────────────────────────
// Biển số: gõ 51a12345 → 51A-123.45 (hoa + tự '-' + tự '.')
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

// Mã phiên: gõ ss123 / SS123 / 123 → SS-00123 (hoa + tự 'SS-' + đệm 0)
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
    Open: { label: t('staff.createIncident.statuses.open'), color: 'error' },
    InProgress: { label: t('staff.createIncident.statuses.inProgress'), color: 'warning' },
    Resolved: { label: t('staff.createIncident.statuses.resolved'), color: 'success' }
  }
  const s = map[status] || { label: status, color: 'default' }
  return <Chip label={s.label} color={s.color} size="small" />
}

function PriorityBadge({ priority }) {
  const { t } = useTranslation()
  const map = {
    Low: { label: t('staff.createIncident.priorities.low'), bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
    Normal: { label: t('staff.createIncident.priorities.normal'), bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
    High: { label: t('staff.createIncident.priorities.high'), bg: '#fde8e8', color: '#c62828', border: '#ef9a9a' }
  }
  const s = map[priority] || map.Normal
  return (
    <Chip label={s.label} size="small" sx={{
      bgcolor: s.bg, color: s.color, fontWeight: 600,
      fontSize: '0.7rem', border: `1px solid ${s.border}`
    }} />
  )
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
    <Box onClick={onClose} sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <IconButton onClick={onClose} sx={{ position: 'absolute', top: 16, right: 16, color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
        <X size={22} />
      </IconButton>
      <Typography sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
        {idx + 1} / {images.length}
      </Typography>
      {idx > 0 && (
        <IconButton onClick={e => { e.stopPropagation(); setIdx(i => i - 1) }} sx={{ position: 'absolute', left: 16, color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
          <ChevronLeft size={28} />
        </IconButton>
      )}
      <Box component="img" src={images[idx]} onClick={e => e.stopPropagation()} sx={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 2, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }} />
      {idx < images.length - 1 && (
        <IconButton onClick={e => { e.stopPropagation(); setIdx(i => i + 1) }} sx={{ position: 'absolute', right: 16, color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
          <ChevronRight size={28} />
        </IconButton>
      )}
      {images.length > 1 && (
        <Box sx={{ position: 'absolute', bottom: 16, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', px: 2 }}>
          {images.map((src, i) => (
            <Box key={i} component="img" src={src} onClick={e => { e.stopPropagation(); setIdx(i) }}
              sx={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 1, cursor: 'pointer', opacity: i === idx ? 1 : 0.45, border: i === idx ? '2px solid white' : '2px solid transparent', transition: 'all 0.15s' }} />
          ))}
        </Box>
      )}
    </Box>
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
    <Box>
      {editable && (
        <Box onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          onClick={() => images.length < MAX_IMAGES && fileRef.current?.click()}
          sx={{ border: '2px dashed', borderColor: images.length >= MAX_IMAGES ? 'divider' : 'primary.light', borderRadius: 2, p: 2, textAlign: 'center', cursor: images.length >= MAX_IMAGES ? 'not-allowed' : 'pointer', bgcolor: images.length >= MAX_IMAGES ? '#f8fafc' : 'primary.50', transition: 'all 0.2s', '&:hover': images.length < MAX_IMAGES ? { borderColor: 'primary.main', bgcolor: '#eff6ff' } : {}, mb: 1.5 }}>
          <UploadCloud size={22} style={{ margin: '0 auto 6px', display: 'block', color: '#94a3b8' }} />
          <Typography variant="body2" color="text.secondary">
            {images.length >= MAX_IMAGES ? t('staff.createIncident.attachments.maxReached', { max: MAX_IMAGES }) : t('staff.createIncident.attachments.dropOrClick', { current: images.length, max: MAX_IMAGES })}
          </Typography>
          <Typography variant="caption" color="text.disabled">{t('staff.createIncident.attachments.limitLabel', { maxMb: MAX_FILE_MB })}</Typography>
        </Box>
      )}
      <input ref={fileRef} type="file" multiple hidden accept="image/*" onChange={handleAdd} />
      {images.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 1 }}>
          {images.map((src, i) => (
            <Box key={i} sx={{ position: 'relative', borderRadius: 1.5, overflow: 'hidden', aspectRatio: '1' }}>
              <Box component="img" src={src} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, '&:hover': { bgcolor: 'rgba(0,0,0,0.45)' }, '&:hover .img-actions': { opacity: 1 } }}>
                <Box className="img-actions" sx={{ opacity: 0, transition: 'opacity 0.2s', display: 'flex', gap: 0.5 }}>
                  <IconButton size="small" onClick={() => setLightbox(i)} sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' }, p: 0.5 }}>
                    <ZoomIn size={14} />
                  </IconButton>
                  {editable && (
                    <IconButton size="small" onClick={() => handleRemove(i)} sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fee2e2' }, p: 0.5 }}>
                      <Trash2 size={14} color="#ef4444" />
                    </IconButton>
                  )}
                </Box>
              </Box>
              <Box sx={{ position: 'absolute', top: 3, left: 3, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.6rem', px: 0.6, py: 0.2, borderRadius: 0.5, lineHeight: 1.4 }}>
                {i + 1}
              </Box>
            </Box>
          ))}
        </Box>
      )}
      {lightbox !== null && <Lightbox images={images} startIndex={lightbox} onClose={() => setLightbox(null)} />}
    </Box>
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

  // Tải danh sách phiên Active 1 lần (bỏ qua nếu đã gắn sẵn sessionId)
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
        /* bỏ qua */
      } finally {
        if (!cancelled) setLoadingSessions(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [sessionId])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(err => ({ ...err, [field]: '' }))
  }

  // Gắn 1 phiên (object đầy đủ) → tự điền + lưu để hiện thẻ xác nhận
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

  // Chọn phiên từ dropdown
  const handlePickSession = (session) => {
    if (!session) {
      setForm(f => ({ ...f, sessionCode: '', plateNumber: '', _driverName: '', _sessionId: undefined, _linkedSession: null }))
      return
    }
    linkSession(session)
  }

  // Gõ MÃ PHIÊN: tự format khi gõ (SS-xxxxx)
  const handleSessionChange = (e) => {
    setForm(f => ({ ...f, sessionCode: formatSessionCode(e.target.value), _linkedSession: null }))
    setErrors(err => ({ ...err, sessionCode: '' }))
  }

  // Rời ô mã phiên → đệm 0 + tra ra biển số & tài xế
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

  // Gõ BIỂN SỐ: tự format khi gõ (51A-123.45)
  const handlePlateChange = (e) => {
    setForm(f => ({ ...f, plateNumber: formatPlate(e.target.value), _linkedSession: null }))
    setErrors(err => ({ ...err, plateNumber: '' }))
  }

  // Rời ô biển số → tra ra mã phiên & tài xế
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
    <Box>
      <Stack spacing={2.5}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
            <AlertTriangle size={16} color="#f59e0b" />
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">{t('staff.createIncident.form.linkedInfo')}</Typography>
          </Stack>

          {/* 🔍 Dropdown tìm nhanh phiên đang đỗ */}
          {!sessionId && (
            <Autocomplete
              options={sessionOptions}
              loading={loadingSessions}
              size="small"
              fullWidth
              sx={{ mb: 2 }}
              onChange={(_, value) => handlePickSession(value)}
              isOptionEqualToValue={(a, b) => a.SessionID === b.SessionID}
              getOptionLabel={(o) =>
                o?.PlateNumber ? `${o.PlateNumber} · ${o.SessionCode || ''}` : (o?.SessionCode || '')
              }
              filterOptions={(opts, { inputValue }) => {
                const q = inputValue.toLowerCase().trim()
                const list = !q ? opts : opts.filter(o =>
                  (o.PlateNumber || '').toLowerCase().includes(q) ||
                  (o.SessionCode || '').toLowerCase().includes(q) ||
                  (o.DriverName || '').toLowerCase().includes(q) ||
                  (o.SlotCode || '').toLowerCase().includes(q) ||
                  String(o.SessionID || '').includes(q)
                )
                return list.slice(0, 50)
              }}
              renderOption={(props, o) => (
                <li {...props} key={o.SessionID} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Car size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                  <span style={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>
                      {o.PlateNumber || 'UNKNOWN'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {[o.SessionCode, o.DriverName, o.SlotCode].filter(Boolean).join(' · ')}
                    </Typography>
                  </span>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('staff.createIncident.form.searchSession')}
                  placeholder={t('staff.createIncident.form.searchSessionPlaceholder')}
                  helperText={loadingSessions ? t('staff.createIncident.form.loadingSessions') : t('staff.createIncident.form.sessionOptionsCount', { count: sessionOptions.length })}
                />
              )}
              noOptionsText={t('staff.createIncident.form.noSessionMatch')}
              loadingText={t('staff.createIncident.form.loading')}
            />
          )}

          {/* Hai ô gõ tay — tự format + tra chéo 2 chiều */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label={t('staff.createIncident.form.sessionCodeLabel')}
              value={form.sessionCode}
              onChange={handleSessionChange}
              onBlur={handleSessionLookup}
              size="small" fullWidth placeholder={t('staff.createIncident.form.sessionCodePlaceholder')}
              InputProps={{
                readOnly: !!sessionId,
                endAdornment: lookupLoading ? <CircularProgress size={14} /> : null
              }}
              helperText={sessionId ? t('staff.createIncident.form.sessionCodeLinked') : t('staff.createIncident.form.sessionCodeHint')}
            />
            <TextField
              label={t('staff.createIncident.form.plateLabel')}
              value={form.plateNumber}
              onChange={handlePlateChange}
              onBlur={handlePlateLookup}
              size="small" fullWidth placeholder={t('staff.createIncident.form.platePlaceholder')}
              inputProps={{ maxLength: 12, style: { textTransform: 'uppercase' } }}
              error={!!errors.plateNumber}
              helperText={errors.plateNumber || (sessionId ? '' : t('staff.createIncident.form.plateHint'))}
            />
          </Stack>

          {/* ✅ Thẻ xác nhận phiên đã liên kết */}
          {form._linkedSession && (
            <Paper variant="outlined" sx={{ p: 1.75, borderRadius: 2, bgcolor: '#f0f9ff', borderColor: '#bae6fd', mt: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.25}>
                <CheckCircle2 size={16} color="#0284c7" />
                <Typography variant="caption" fontWeight={700} color="#0369a1" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('staff.createIncident.form.linkedConfirm')}
                </Typography>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
                {[
                  { icon: Car, label: t('staff.createIncident.form.plate'), value: form._linkedSession.PlateNumber || '—', strong: true },
                  { icon: User, label: t('staff.createIncident.form.driver'), value: form._linkedSession.DriverName || '—' },
                  { icon: AlertTriangle, label: t('staff.createIncident.form.sessionCode'), value: form._linkedSession.SessionCode || form.sessionCode || '—' },
                  { icon: MapPin, label: t('staff.createIncident.form.slot'), value: [form._linkedSession.ZoneName, form._linkedSession.FloorName, form._linkedSession.SlotCode].filter(Boolean).join(' · ') || form._linkedSession.SlotCode || '—' },
                  { icon: Car, label: t('staff.createIncident.form.vehicle'), value: form._linkedSession.VehicleName || '—' },
                  { icon: ClockIcon, label: t('staff.createIncident.form.entryTime'), value: form._linkedSession.EntryTime ? fmtDate(form._linkedSession.EntryTime) : '—' }
                ].map(({ icon: Icon, label, value, strong }) => (
                  <Stack key={label} direction="row" spacing={1} alignItems="flex-start">
                    <Icon size={13} color="#0284c7" style={{ marginTop: 3, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="#0369a1" sx={{ opacity: 0.8 }}>{label}</Typography>
                      <Typography variant="body2" fontWeight={strong ? 700 : 500} color="#075985" sx={{ lineHeight: 1.3 }}>
                        {value}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Box>
            </Paper>
          )}
        </Paper>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth size="small" error={!!errors.incidentType}>
            <InputLabel>{t('staff.createIncident.form.incidentTypeLabel')}</InputLabel>
            <Select value={form.incidentType} label={t('staff.createIncident.form.incidentTypeLabel')} onChange={set('incidentType')}>
              {INCIDENT_TYPES.map(key => <MenuItem key={key} value={key}>{t(`staff.createIncident.types.${key}`)}</MenuItem>)}
            </Select>
            {errors.incidentType && <FormHelperText>{errors.incidentType}</FormHelperText>}
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>{t('staff.createIncident.form.priorityLabel')}</InputLabel>
            <Select value={form.priority} label={t('staff.createIncident.form.priorityLabel')} onChange={set('priority')}>
              {PRIORITIES.map(p => (
                <MenuItem key={p.value} value={p.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.color, flexShrink: 0 }} />
                    {t(`staff.createIncident.priorities.${p.labelKey}`)}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Box>
          <TextField label={t('staff.createIncident.form.descLabel')} multiline rows={4} fullWidth value={form.description} onChange={set('description')} placeholder={t('staff.createIncident.form.descPlaceholder')} error={!!errors.description} helperText={errors.description} inputProps={{ maxLength: 500 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
            <Typography variant="caption" color={descLen < 20 ? 'error' : 'text.secondary'}>
              {descLen < 20 ? t('staff.createIncident.form.descLengthHint', { current: descLen, count: 20 - descLen }) : `${descLen}/500`}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <ImageIcon size={16} color="#64748b" />
            <Typography variant="subtitle2" color="text.secondary">{t('staff.createIncident.form.attachmentHint', { max: MAX_IMAGES })}</Typography>
          </Stack>
          <AttachmentGrid images={images} editable onChange={setImages} />
        </Box>

        <Button variant="contained" size="large" fullWidth onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Plus size={16} />}
          sx={{ mt: 1, py: 1.5, fontWeight: 700, fontSize: '1rem', bgcolor: form.priority === 'High' ? '#dc2626' : 'primary.main', '&:hover': { bgcolor: form.priority === 'High' ? '#b91c1c' : 'primary.dark' } }}>
          {loading ? t('staff.createIncident.form.submitLoading') : `${t('staff.createIncident.form.submitBtn')}${images.length ? ` (${images.length})` : ''}`}
        </Button>
      </Stack>
    </Box>
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AlertTriangle size={20} color="#f59e0b" />
          <Typography fontWeight={700}>{t('staff.createIncident.detail.title', { id: incidentId })}</Typography>
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress size={32} /></Box>
        ) : incident ? (
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <StatusChip status={incident.IncidentStatus} />
              <PriorityBadge priority={incident.Priority} />
              <Chip label={incident.IncidentType} size="small" variant="outlined" />
            </Stack>
            <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              {[
                [t('staff.createIncident.detail.code'), `#${incident.IncidentID}`], [t('staff.createIncident.detail.session'), incident.SessionCode || '—'],
                [t('staff.createIncident.detail.driver'), incident.DriverName || '—'], [t('staff.createIncident.detail.phone'), incident.DriverPhone || '—'],
                [t('staff.createIncident.detail.plate'), incident.PlateNumber || '—'], [t('staff.createIncident.detail.staff'), incident.AssignedStaffName || t('staff.createIncident.detail.unassigned')],
                [t('staff.createIncident.detail.createdAt'), fmtDate(incident.CreatedAt)], [t('staff.createIncident.detail.updatedAt'), fmtDate(incident.UpdatedAt)]
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{value}</Typography>
                </Box>
              ))}
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" mb={0.5} display="block">{t('staff.createIncident.detail.desc')}</Typography>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, whiteSpace: 'pre-wrap' }}>
                <Typography variant="body2">{incident.Description}</Typography>
              </Paper>
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <ImageIcon size={15} color="#64748b" />
                <Typography variant="subtitle2" color="text.secondary">
                  {t('staff.createIncident.attachments.title')}
                  {imagesDirty && <Chip label={t('staff.createIncident.attachments.changed')} size="small" color="warning" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />}
                </Typography>
              </Stack>
              <AttachmentGrid images={editImages} editable onChange={(imgs) => { setEditImages(imgs); setImagesDirty(true) }} />
              {editImages.length === 0 && !imagesDirty && <Typography variant="caption" color="text.disabled">{t('staff.createIncident.attachments.noImages')}</Typography>}
            </Box>
            <Divider />
            <Typography variant="subtitle2" fontWeight={700}>{t('staff.createIncident.detail.updateStatusTitle')}</Typography>
            <FormControl size="small" fullWidth>
              <InputLabel>{t('staff.createIncident.detail.newStatus')}</InputLabel>
              <Select value={editStatus} label={t('staff.createIncident.detail.newStatus')} onChange={e => setEditStatus(e.target.value)}>
                {UPDATE_STATUSES.map(s => <MenuItem key={s} value={s}><StatusChip status={s} /></MenuItem>)}
              </Select>
            </FormControl>
            <TextField label={t('staff.createIncident.detail.updateNote')} multiline rows={2} size="small" fullWidth value={editNote} onChange={e => setEditNote(e.target.value)} placeholder={t('staff.createIncident.detail.updateNotePlaceholder')} />
          </Stack>
        ) : (
          <Alert severity="error">{t('staff.createIncident.detail.loadError')}</Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">{t('staff.createIncident.detail.close')}</Button>
        <Button onClick={handleUpdate} variant="contained" disabled={updating || loading || !incident}
          startIcon={updating ? <CircularProgress size={14} color="inherit" /> : <Edit2 size={14} />}>
          {updating ? t('staff.createIncident.detail.saving') : t('staff.createIncident.detail.saveBtn')}
        </Button>
      </DialogActions>
    </Dialog>
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
    <Box>
      <Stack direction="row" spacing={1.5} mb={1.5} alignItems="center">
        <TextField size="small" placeholder={t('staff.createIncident.history.localSearch')} value={localSearch} onChange={e => setLocalSearch(e.target.value)} sx={{ flex: 1 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={16} color="#94a3b8" /></InputAdornment>,
            endAdornment: localSearch ? <InputAdornment position="end"><IconButton size="small" onClick={() => setLocalSearch('')}><X size={14} /></IconButton></InputAdornment> : null
          }} />
        <Tooltip title={showFilters ? t('staff.createIncident.history.hideFilters') : t('staff.createIncident.history.showFilters')}>
          <Badge color="error" variant="dot" invisible={!hasActiveFilters}>
            <Button variant={showFilters ? 'contained' : 'outlined'} size="small" startIcon={<Filter size={15} />} onClick={() => setShowFilters(v => !v)} sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
              {t('staff.createIncident.history.filters')}
            </Button>
          </Badge>
        </Tooltip>
        <Tooltip title={t('staff.createIncident.history.refresh')}>
          <IconButton onClick={handleSearch} size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
            <RefreshCw size={16} />
          </IconButton>
        </Tooltip>
      </Stack>

      <Collapse in={showFilters}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: '#fafbfc' }}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField size="small" label={t('staff.createIncident.history.keyword')} value={keyword} onChange={e => setKeyword(e.target.value)} sx={{ flex: 2 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search size={14} color="#94a3b8" /></InputAdornment> }} />
              <FormControl size="small" sx={{ flex: 1, minWidth: 130 }}>
                <InputLabel>{t('staff.createIncident.history.status')}</InputLabel>
                <Select value={statusFilter} label={t('staff.createIncident.history.status')} onChange={e => setStatusFilter(e.target.value)}>
                  {STATUSES.map(s => <MenuItem key={s.value} value={s.value}>{t(`staff.createIncident.statuses.${s.labelKey}`)}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
                <InputLabel>{t('staff.createIncident.history.priority')}</InputLabel>
                <Select value={priorityFilter} label={t('staff.createIncident.history.priority')} onChange={e => setPriorityFilter(e.target.value)}>
                  <MenuItem value="all">{t('staff.createIncident.priorities.all') || 'All'}</MenuItem>
                  <MenuItem value="High">{t('staff.createIncident.priorities.high')}</MenuItem>
                  <MenuItem value="Normal">{t('staff.createIncident.priorities.normal')}</MenuItem>
                  <MenuItem value="Low">{t('staff.createIncident.priorities.low')}</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
              <TextField size="small" label={t('staff.createIncident.history.fromDate')} type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={14} color="#94a3b8" /></InputAdornment> }} />
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>—</Typography>
              <TextField size="small" label={t('staff.createIncident.history.toDate')} type="date" value={toDate} onChange={e => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Calendar size={14} color="#94a3b8" /></InputAdornment> }} />
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Button variant="contained" size="small" onClick={handleSearch} sx={{ fontWeight: 600 }}>{t('staff.createIncident.history.searchBtn')}</Button>
                {hasActiveFilters && <Button variant="outlined" size="small" color="inherit" onClick={handleReset}>{t('staff.createIncident.history.clearBtn')}</Button>}
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Collapse>

      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap alignItems="center">
        {STATUSES.filter(s => s.value !== 'all').map(s => {
          const count = incidents.filter(i => i.IncidentStatus === s.value).length
          if (!count) return null
          return (
            <Chip key={s.value} label={`${t(`staff.createIncident.statuses.${s.labelKey}`)}: ${count}`} color={s.color} size="small" variant="outlined"
              onClick={() => setStatusFilter(s.value)} sx={{ cursor: 'pointer', fontWeight: 600 }} />
          )
        })}
        {filtered.length !== incidents.length && (
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            {t('staff.createIncident.history.showing', { current: filtered.length, total: incidents.length })}
          </Typography>
        )}
        {incidents.length > 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ alignSelf: 'center', ml: 'auto' }}>
            {t('staff.createIncident.history.total', { total: incidents.length })}
          </Typography>
        )}
      </Stack>

      {loading ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary" mt={1.5}>{t('staff.createIncident.history.loading')}</Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
          <AlertTriangle size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <Typography color="text.secondary">
            {incidents.length === 0 ? t('staff.createIncident.history.empty') : t('staff.createIncident.history.noMatch')}
          </Typography>
          {hasActiveFilters && <Button size="small" onClick={handleReset} sx={{ mt: 1 }}>{t('staff.createIncident.history.clearBtn')}</Button>}
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
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
                  <TableCell key={i} sx={{ fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(inc => (
                <TableRow key={inc.IncidentID} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.78rem' }}>
                    #{inc.IncidentID}
                    {inc.SessionCode && <Typography variant="caption" display="block" color="primary.main">{inc.SessionCode}</Typography>}
                  </TableCell>
                  <TableCell><Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 170 }}>{inc.IncidentType}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{inc.DriverName || '—'}</Typography>
                    {inc.PlateNumber && <Typography variant="caption" color="text.secondary">{inc.PlateNumber}</Typography>}
                  </TableCell>
                  <TableCell><PriorityBadge priority={inc.Priority} /></TableCell>
                  <TableCell><StatusChip status={inc.IncidentStatus} /></TableCell>
                  <TableCell>
                    {Array.isArray(inc.Attachments) && inc.Attachments.length > 0 ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {inc.Attachments.slice(0, 3).map((src, i) => (
                          <Box key={i} component="img" src={src}
                            sx={{ width: 28, height: 28, borderRadius: 0.75, objectFit: 'cover', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                            onClick={() => { setSelectedId(inc.IncidentID); setDetailOpen(true) }} />
                        ))}
                        {inc.Attachments.length > 3 && <Typography variant="caption" color="text.secondary" sx={{ ml: 0.3 }}>+{inc.Attachments.length - 3}</Typography>}
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{fmtDate(inc.CreatedAt)}</TableCell>
                  <TableCell>
                    <Tooltip title={t('staff.createIncident.history.viewUpdate')}>
                      <IconButton size="small" onClick={() => { setSelectedId(inc.IncidentID); setDetailOpen(true) }} sx={{ color: 'primary.main' }}>
                        <Eye size={16} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <IncidentDetailModal incidentId={selectedId} open={detailOpen} onClose={() => setDetailOpen(false)} onUpdated={handleSearch} />
    </Box>
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', pb: 6 }}>
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: { xs: 2, md: 4 }, py: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton size="small" onClick={() => navigate('/staff/dashboard')} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              <ArrowLeft size={18} />
            </IconButton>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AlertTriangle size={22} color="#f59e0b" />
              <Typography variant="h6" fontWeight={700}>{t('staff.createIncident.tabs.pageTitle')}</Typography>
            </Stack>
          </Stack>
          <Button variant="contained" size="small" startIcon={<Plus size={15} />} onClick={() => setTab(0)} sx={{ fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}>
            {t('staff.createIncident.tabs.create')}
          </Button>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 3 }, pt: 3 }}>
        <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc', px: 1, '& .MuiTab-root': { fontWeight: 600, minHeight: 48 } }}>
            <Tab label={t('staff.createIncident.tabs.create')} icon={<Plus size={16} />} iconPosition="start" />
            <Tab label={<Stack direction="row" alignItems="center" spacing={0.75}><Clock size={16} /><span>{t('staff.createIncident.tabs.history')}</span></Stack>} />
          </Tabs>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {tab === 0 && <CreateIncidentForm sessionId={sessionId} driverId={driverId} onSuccess={handleCreated} />}
            {tab === 1 && <IncidentHistory refreshTrigger={refreshKey} />}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}