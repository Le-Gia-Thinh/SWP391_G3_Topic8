import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box, Typography, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Tabs, Tab, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, InputAdornment, CircularProgress, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, Divider, Alert,
  FormHelperText, Stack, Badge, Collapse
} from '@mui/material'
import {
  AlertTriangle, ArrowLeft, Plus, Search, RefreshCw,
  Clock, XCircle, Eye, Edit2, UploadCloud, Trash2,
  FileText, ChevronDown, Image as ImageIcon, X, ZoomIn,
  ChevronLeft, ChevronRight, Filter, Calendar
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import staffApi from '../../apis/staffApi'
import { toast } from 'react-toastify'

// ─── Constants ────────────────────────────────────────────────────────────────

const INCIDENT_TYPES = [
  'Mất thẻ/Hư hỏng thẻ vãng lai',
  'Va chạm/Tai nạn trong bãi',
  'Tranh chấp vị trí đỗ',
  'Xe hỏng/Cần cứu hộ',
  'Hư hỏng tài sản bãi đỗ',
  'Hành vi vi phạm',
  'Sự cố kỹ thuật hệ thống',
  'Khác'
]

const PRIORITIES = [
  { value: 'Low', label: 'Thấp', color: '#4caf50' },
  { value: 'Normal', label: 'Bình thường', color: '#2196f3' },
  { value: 'High', label: 'Khẩn cấp', color: '#f44336' }
]

const STATUSES = [
  { value: 'all', label: 'Tất cả', color: 'default' },
  { value: 'Open', label: 'Mới', color: 'error' },
  { value: 'InProgress', label: 'Đang xử lý', color: 'warning' },
  { value: 'Resolved', label: 'Đã giải quyết', color: 'success' }
]

const UPDATE_STATUSES = ['Open', 'InProgress', 'Resolved']
const MAX_IMAGES = 15
const MAX_FILE_MB = 5

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

/** Chuyển File thành base64 data URL */
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
  const map = {
    Open: { label: 'Mới', color: 'error' },
    InProgress: { label: 'Đang xử lý', color: 'warning' },
    Resolved: { label: 'Đã giải quyết', color: 'success' }
  }
  const s = map[status] || { label: status, color: 'default' }
  return <Chip label={s.label} color={s.color} size="small" />
}

function PriorityBadge({ priority }) {
  const map = {
    Low: { label: 'Thấp', bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
    Normal: { label: 'Bình thường', bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
    High: { label: 'Khẩn cấp', bg: '#fde8e8', color: '#c62828', border: '#ef9a9a' }
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
    <Box
      onClick={onClose}
      sx={{
        position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.92)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      {/* Close */}
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', top: 16, right: 16, color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
      >
        <X size={22} />
      </IconButton>

      {/* Counter */}
      <Typography sx={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem'
      }}>
        {idx + 1} / {images.length}
      </Typography>

      {/* Prev */}
      {idx > 0 && (
        <IconButton
          onClick={e => { e.stopPropagation(); setIdx(i => i - 1) }}
          sx={{ position: 'absolute', left: 16, color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
        >
          <ChevronLeft size={28} />
        </IconButton>
      )}

      {/* Image */}
      <Box
        component="img"
        src={images[idx]}
        onClick={e => e.stopPropagation()}
        sx={{
          maxWidth: '90vw', maxHeight: '88vh',
          objectFit: 'contain', borderRadius: 2,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)'
        }}
      />

      {/* Next */}
      {idx < images.length - 1 && (
        <IconButton
          onClick={e => { e.stopPropagation(); setIdx(i => i + 1) }}
          sx={{ position: 'absolute', right: 16, color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
        >
          <ChevronRight size={28} />
        </IconButton>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <Box sx={{
          position: 'absolute', bottom: 16,
          display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', px: 2
        }}>
          {images.map((src, i) => (
            <Box
              key={i}
              component="img"
              src={src}
              onClick={e => { e.stopPropagation(); setIdx(i) }}
              sx={{
                width: 52, height: 52, objectFit: 'cover', borderRadius: 1,
                cursor: 'pointer', opacity: i === idx ? 1 : 0.45,
                border: i === idx ? '2px solid white' : '2px solid transparent',
                transition: 'all 0.15s'
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

// ─── AttachmentGrid – dùng chung cho view + edit ──────────────────────────────

/**
 * @param images       string[]  - mảng base64 data URLs hiện tại
 * @param editable     boolean   - có cho phép thêm/xóa không
 * @param onChange     fn(images) - callback khi thay đổi (chỉ khi editable)
 */
function AttachmentGrid({ images = [], editable = false, onChange }) {
  const fileRef = useRef(null)
  const [lightbox, setLightbox] = useState(null) // index hoặc null

  const handleAdd = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    e.target.value = null

    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) {
      toast.warning(`Đã đạt tối đa ${MAX_IMAGES} ảnh.`)
      return
    }

    const toProcess = files.slice(0, remaining)
    const oversized = toProcess.filter(f => f.size > MAX_FILE_MB * 1024 * 1024)
    if (oversized.length) {
      toast.error(`${oversized.length} file vượt ${MAX_FILE_MB}MB, bị bỏ qua.`)
    }
    const valid = toProcess.filter(f => f.size <= MAX_FILE_MB * 1024 * 1024)
    if (!valid.length) return

    try {
      const b64arr = await Promise.all(valid.map(fileToBase64))
      onChange([...images, ...b64arr])
    } catch {
      toast.error('Không thể đọc file.')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (!editable) return
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) {
      handleAdd({ target: { files }, currentTarget: {} })
    }
  }

  const handleRemove = (idx) => {
    onChange(images.filter((_, i) => i !== idx))
  }

  if (!editable && images.length === 0) return null

  return (
    <Box>
      {/* Upload zone – chỉ hiện khi editable */}
      {editable && (
        <Box
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => images.length < MAX_IMAGES && fileRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: images.length >= MAX_IMAGES ? 'divider' : 'primary.light',
            borderRadius: 2, p: 2, textAlign: 'center',
            cursor: images.length >= MAX_IMAGES ? 'not-allowed' : 'pointer',
            bgcolor: images.length >= MAX_IMAGES ? '#f8fafc' : 'primary.50',
            transition: 'all 0.2s',
            '&:hover': images.length < MAX_IMAGES
              ? { borderColor: 'primary.main', bgcolor: '#eff6ff' }
              : {},
            mb: 1.5
          }}
        >
          <UploadCloud size={22} style={{ margin: '0 auto 6px', display: 'block', color: '#94a3b8' }} />
          <Typography variant="body2" color="text.secondary">
            {images.length >= MAX_IMAGES
              ? `Đã đạt tối đa ${MAX_IMAGES} ảnh`
              : `Nhấn hoặc kéo ảnh vào đây (${images.length}/${MAX_IMAGES})`}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            JPG, PNG, WEBP — tối đa {MAX_FILE_MB}MB/ảnh
          </Typography>
        </Box>
      )}
      <input ref={fileRef} type="file" multiple hidden accept="image/*" onChange={handleAdd} />

      {/* Grid ảnh */}
      {images.length > 0 && (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: 1
        }}>
          {images.map((src, i) => (
            <Box key={i} sx={{ position: 'relative', borderRadius: 1.5, overflow: 'hidden', aspectRatio: '1' }}>
              <Box
                component="img"
                src={src}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Overlay */}
              <Box sx={{
                position: 'absolute', inset: 0,
                bgcolor: 'rgba(0,0,0,0)', transition: 'background 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.45)' },
                '&:hover .img-actions': { opacity: 1 }
              }}>
                <Box className="img-actions" sx={{
                  opacity: 0, transition: 'opacity 0.2s',
                  display: 'flex', gap: 0.5
                }}>
                  <IconButton
                    size="small"
                    onClick={() => setLightbox(i)}
                    sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' }, p: 0.5 }}
                  >
                    <ZoomIn size={14} />
                  </IconButton>
                  {editable && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemove(i)}
                      sx={{ bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#fee2e2' }, p: 0.5 }}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </IconButton>
                  )}
                </Box>
              </Box>
              {/* Index badge */}
              <Box sx={{
                position: 'absolute', top: 3, left: 3,
                bgcolor: 'rgba(0,0,0,0.5)', color: 'white',
                fontSize: '0.6rem', px: 0.6, py: 0.2, borderRadius: 0.5, lineHeight: 1.4
              }}>
                {i + 1}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {lightbox !== null && (
        <Lightbox images={images} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </Box>
  )
}

// ─── CreateIncidentForm ───────────────────────────────────────────────────────

function CreateIncidentForm({ sessionId, driverId, onSuccess }) {
  const [form, setForm] = useState({
    incidentType: '',
    priority: 'Normal',
    description: '',
    plateNumber: '',
    sessionCode: sessionId ? `SS-${String(sessionId).padStart(5, '0')}` : ''
  })
  const [errors, setErrors] = useState({})
  const [images, setImages] = useState([]) // base64 strings
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(err => ({ ...err, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.incidentType) e.incidentType = 'Vui lòng chọn loại sự cố'
    if (form.description.trim().length < 20)
      e.description = `Cần thêm ${20 - form.description.trim().length} ký tự nữa`
    return e
  }

  const handleSessionLookup = async (val) => {
    const code = val.trim().toUpperCase()
    if (!code || sessionId) return
    const sid = code.startsWith('SS-')
      ? parseInt(code.replace('SS-', ''), 10)
      : parseInt(code, 10)
    if (!sid || isNaN(sid)) return

    setLookupLoading(true)
    try {
      const res = await staffApi.getCheckoutPreview(sid)
      const s = res?.data?.session || res?.session
      if (s) {
        setForm(f => ({
          ...f,
          sessionCode: `SS-${String(sid).padStart(5, '0')}`,
          plateNumber: s.PlateNumber || '',
          _driverName: s.DriverName || ''
        }))
      }
    } catch { /* bỏ qua */ }
    finally { setLookupLoading(false) }
  }

  const handlePlateLookup = async (val) => {
    const plate = val.trim().toUpperCase()
    if (plate.length < 4 || sessionId) return
    setLookupLoading(true)
    try {
      const res = await staffApi.searchSessions({ keyword: plate, status: 'Active' })
      const sessions = res?.data || []
      if (sessions.length > 0) {
        const s = sessions[0]
        setForm(f => ({
          ...f,
          plateNumber: s.PlateNumber,
          sessionCode: s.SessionCode || '',
          _driverName: s.DriverName || ''
        }))
      }
    } catch { /* bỏ qua */ }
    finally { setLookupLoading(false) }
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setLoading(true)
    try {
      await staffApi.createIncident({
        sessionId: sessionId || undefined,
        driverId: driverId || undefined,
        plateNumber: form.plateNumber.trim() || undefined,
        incidentType: form.incidentType,
        priority: form.priority,
        description: form.description.trim(),
        attachments: images
      })
      toast.success('✅ Báo cáo sự cố thành công!')
      setForm({ incidentType: '', priority: 'Normal', description: '', plateNumber: '', sessionCode: '' })
      setImages([])
      onSuccess?.()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Tạo sự cố thất bại')
    } finally {
      setLoading(false)
    }
  }

  const descLen = form.description.trim().length

  return (
    <Box>
      <Stack spacing={2.5}>
        {/* Thông tin liên kết */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc' }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <AlertTriangle size={16} color="#f59e0b" />
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
              Thông tin liên kết (tuỳ chọn)
            </Typography>
            {lookupLoading && <CircularProgress size={14} />}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Mã phiên (SessionID)"
              value={form.sessionCode}
              onChange={set('sessionCode')}
              onBlur={e => handleSessionLookup(e.target.value)}
              size="small"
              fullWidth
              placeholder="SS-00001"
              InputProps={{ readOnly: !!sessionId }}
              helperText={sessionId ? 'Liên kết từ phiên hiện tại' : 'Nhập nếu có session cụ thể'}
            />
            <TextField
              label="Biển số xe"
              value={form.plateNumber}
              onChange={set('plateNumber')}
              onBlur={e => handlePlateLookup(e.target.value)}
              size="small"
              fullWidth
              placeholder="51A-12345"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
          </Stack>
          {form._driverName && (
            <Typography variant="caption" color="primary.main" mt={1} display="block">
              Tài xế: {form._driverName}
            </Typography>
          )}
        </Paper>

        {/* Loại sự cố + Mức độ */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl fullWidth size="small" error={!!errors.incidentType}>
            <InputLabel>Loại sự cố *</InputLabel>
            <Select value={form.incidentType} label="Loại sự cố *" onChange={set('incidentType')}>
              {INCIDENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
            {errors.incidentType && <FormHelperText>{errors.incidentType}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Mức độ ưu tiên</InputLabel>
            <Select value={form.priority} label="Mức độ ưu tiên" onChange={set('priority')}>
              {PRIORITIES.map(p => (
                <MenuItem key={p.value} value={p.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.color, flexShrink: 0 }} />
                    {p.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Mô tả */}
        <Box>
          <TextField
            label="Mô tả chi tiết *"
            multiline rows={4} fullWidth
            value={form.description}
            onChange={set('description')}
            placeholder="Mô tả chi tiết sự cố: thời gian, vị trí, người liên quan, diễn biến..."
            error={!!errors.description}
            helperText={errors.description}
            inputProps={{ maxLength: 500 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
            <Typography variant="caption" color={descLen < 20 ? 'error' : 'text.secondary'}>
              {descLen}/500 ký tự {descLen < 20 && `(cần thêm ${20 - descLen})`}
            </Typography>
          </Box>
        </Box>

        {/* Đính kèm ảnh */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <ImageIcon size={16} color="#64748b" />
            <Typography variant="subtitle2" color="text.secondary">
              Ảnh đính kèm bằng chứng (tuỳ chọn, tối đa {MAX_IMAGES} ảnh)
            </Typography>
          </Stack>
          <AttachmentGrid
            images={images}
            editable
            onChange={setImages}
          />
        </Box>

        {/* Submit */}
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Plus size={16} />}
          sx={{
            mt: 1, py: 1.5, fontWeight: 700, fontSize: '1rem',
            bgcolor: form.priority === 'High' ? '#dc2626' : 'primary.main',
            '&:hover': { bgcolor: form.priority === 'High' ? '#b91c1c' : 'primary.dark' }
          }}
        >
          {loading ? 'Đang gửi báo cáo...' : `Gửi báo cáo sự cố${images.length ? ` (${images.length} ảnh)` : ''}`}
        </Button>
      </Stack>
    </Box>
  )
}

// ─── IncidentDetailModal ──────────────────────────────────────────────────────

function IncidentDetailModal({ incidentId, open, onClose, onUpdated }) {
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editStatus, setEditStatus] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editImages, setEditImages] = useState([]) // ảnh đang chỉnh sửa
  const [imagesDirty, setImagesDirty] = useState(false)

  useEffect(() => {
    if (!open || !incidentId) return
    setLoading(true)
    staffApi.getIncidentById(incidentId)
      .then(r => {
        const data = r.data?.data || r.data
        setIncident(data)
        setEditStatus(data?.IncidentStatus || '')
        setEditNote('')
        const imgs = Array.isArray(data?.Attachments) ? data.Attachments : []
        setEditImages(imgs)
        setImagesDirty(false)
      })
      .catch(() => toast.error('Không tải được chi tiết sự cố'))
      .finally(() => setLoading(false))
  }, [open, incidentId])

  const handleImagesChange = (imgs) => {
    setEditImages(imgs)
    setImagesDirty(true)
  }

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      const payload = {
        status: editStatus,
        note: editNote || undefined
      }
      // Chỉ gửi attachments nếu người dùng đã chỉnh sửa ảnh
      if (imagesDirty) {
        payload.attachments = editImages
      }
      await staffApi.updateIncidentStatus(incidentId, payload)
      toast.success('Cập nhật sự cố thành công')
      onUpdated?.()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AlertTriangle size={20} color="#f59e0b" />
          <Typography fontWeight={700}>Chi tiết sự cố #{incidentId}</Typography>
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <CircularProgress size={32} />
          </Box>
        ) : incident ? (
          <Stack spacing={2.5}>
            {/* Badges */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <StatusChip status={incident.IncidentStatus} />
              <PriorityBadge priority={incident.Priority} />
              <Chip label={incident.IncidentType} size="small" variant="outlined" />
            </Stack>

            {/* Meta grid */}
            <Box sx={{
              bgcolor: '#f8fafc', borderRadius: 2, p: 2,
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5
            }}>
              {[
                ['Mã sự cố', `#${incident.IncidentID}`],
                ['Phiên', incident.SessionCode || '—'],
                ['Tài xế', incident.DriverName || '—'],
                ['SĐT', incident.DriverPhone || '—'],
                ['Biển số', incident.PlateNumber || '—'],
                ['Nhân viên', incident.AssignedStaffName || 'Chưa giao'],
                ['Tạo lúc', fmtDate(incident.CreatedAt)],
                ['Cập nhật', fmtDate(incident.UpdatedAt)]
              ].map(([label, value]) => (
                <Box key={label}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{value}</Typography>
                </Box>
              ))}
            </Box>

            {/* Mô tả */}
            <Box>
              <Typography variant="caption" color="text.secondary" mb={0.5} display="block">Mô tả</Typography>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, whiteSpace: 'pre-wrap' }}>
                <Typography variant="body2">{incident.Description}</Typography>
              </Paper>
            </Box>

            {/* Ảnh đính kèm – có thể chỉnh sửa */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <ImageIcon size={15} color="#64748b" />
                <Typography variant="subtitle2" color="text.secondary">
                  Ảnh đính kèm
                  {imagesDirty && (
                    <Chip label="Đã thay đổi" size="small" color="warning"
                      sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />
                  )}
                </Typography>
              </Stack>
              <AttachmentGrid
                images={editImages}
                editable
                onChange={handleImagesChange}
              />
              {editImages.length === 0 && !imagesDirty && (
                <Typography variant="caption" color="text.disabled">
                  Chưa có ảnh đính kèm. Nhấn vùng upload để thêm.
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Cập nhật trạng thái */}
            <Typography variant="subtitle2" fontWeight={700}>Cập nhật trạng thái</Typography>
            <FormControl size="small" fullWidth>
              <InputLabel>Trạng thái mới</InputLabel>
              <Select value={editStatus} label="Trạng thái mới"
                onChange={e => setEditStatus(e.target.value)}>
                {UPDATE_STATUSES.map(s => (
                  <MenuItem key={s} value={s}><StatusChip status={s} /></MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Ghi chú cập nhật (tuỳ chọn)"
              multiline rows={2} size="small" fullWidth
              value={editNote}
              onChange={e => setEditNote(e.target.value)}
              placeholder="Ghi chú thêm về hành động xử lý..."
            />
          </Stack>
        ) : (
          <Alert severity="error">Không tải được dữ liệu</Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Đóng</Button>
        <Button
          onClick={handleUpdate}
          variant="contained"
          disabled={updating || loading || !incident}
          startIcon={updating ? <CircularProgress size={14} color="inherit" /> : <Edit2 size={14} />}
        >
          {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── IncidentHistory ──────────────────────────────────────────────────────────

function IncidentHistory({ refreshTrigger }) {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filters – gửi lên backend
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Client-side search on top of backend results
  const [localSearch, setLocalSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (priorityFilter !== 'all') params.priority = priorityFilter
      if (keyword.trim()) params.keyword = keyword.trim()
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate

      const res = await staffApi.getIncidents(params)
      setIncidents(res.data?.data || res?.data || [])
    } catch {
      toast.error('Không tải được danh sách sự cố')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter, keyword, fromDate, toDate])

  useEffect(() => { load() }, [load, refreshTrigger])

  // Client-side quick search (trên kết quả đã fetch)
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
    setKeyword('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setFromDate('')
    setToDate('')
    setLocalSearch('')
  }

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || keyword || fromDate || toDate

  return (
    <Box>
      {/* Thanh tìm kiếm nhanh + nút filter */}
      <Stack direction="row" spacing={1.5} mb={1.5} alignItems="center">
        <TextField
          size="small"
          placeholder="Tìm nhanh trong kết quả..."
          value={localSearch}
          onChange={e => setLocalSearch(e.target.value)}
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#94a3b8" />
              </InputAdornment>
            ),
            endAdornment: localSearch ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setLocalSearch('')}>
                  <X size={14} />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
        <Tooltip title={showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc nâng cao'}>
          <Badge color="error" variant="dot" invisible={!hasActiveFilters}>
            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              size="small"
              startIcon={<Filter size={15} />}
              onClick={() => setShowFilters(v => !v)}
              sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              Bộ lọc
            </Button>
          </Badge>
        </Tooltip>
        <Tooltip title="Làm mới">
          <IconButton onClick={load} size="small"
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
            <RefreshCw size={16} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Bộ lọc nâng cao */}
      <Collapse in={showFilters}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: '#fafbfc' }}>
          <Stack spacing={1.5}>
            {/* Row 1 */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                label="Từ khoá (ID, loại, tài xế, biển số)"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                sx={{ flex: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search size={14} color="#94a3b8" /></InputAdornment>
                }}
              />
              <FormControl size="small" sx={{ flex: 1, minWidth: 130 }}>
                <InputLabel>Trạng thái</InputLabel>
                <Select value={statusFilter} label="Trạng thái"
                  onChange={e => setStatusFilter(e.target.value)}>
                  {STATUSES.map(s => (
                    <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1, minWidth: 120 }}>
                <InputLabel>Mức độ</InputLabel>
                <Select value={priorityFilter} label="Mức độ"
                  onChange={e => setPriorityFilter(e.target.value)}>
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="High">Khẩn cấp</MenuItem>
                  <MenuItem value="Normal">Bình thường</MenuItem>
                  <MenuItem value="Low">Thấp</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* Row 2 – Date range */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
              <TextField
                size="small"
                label="Từ ngày"
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Calendar size={14} color="#94a3b8" /></InputAdornment>
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>—</Typography>
              <TextField
                size="small"
                label="Đến ngày"
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Calendar size={14} color="#94a3b8" /></InputAdornment>
                }}
              />
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Button variant="contained" size="small" onClick={load} sx={{ fontWeight: 600 }}>
                  Tìm kiếm
                </Button>
                {hasActiveFilters && (
                  <Button variant="outlined" size="small" color="inherit" onClick={handleReset}>
                    Xoá lọc
                  </Button>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Collapse>

      {/* Summary chips */}
      <Stack direction="row" spacing={1} mb={2} flexWrap="wrap" useFlexGap alignItems="center">
        {STATUSES.filter(s => s.value !== 'all').map(s => {
          const count = incidents.filter(i => i.IncidentStatus === s.value).length
          if (!count) return null
          return (
            <Chip key={s.value} label={`${s.label}: ${count}`} color={s.color}
              size="small" variant="outlined"
              onClick={() => setStatusFilter(s.value)}
              sx={{ cursor: 'pointer', fontWeight: 600 }}
            />
          )
        })}
        {filtered.length !== incidents.length && (
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Hiển thị {filtered.length}/{incidents.length}
          </Typography>
        )}
        {incidents.length > 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ alignSelf: 'center', ml: 'auto' }}>
            Tổng: {incidents.length} sự cố
          </Typography>
        )}
      </Stack>

      {/* Table */}
      {loading ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary" mt={1.5}>Đang tải...</Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{
          py: 6, textAlign: 'center', bgcolor: '#f8fafc',
          borderRadius: 2, border: '1px dashed', borderColor: 'divider'
        }}>
          <AlertTriangle size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <Typography color="text.secondary">
            {incidents.length === 0 ? 'Chưa có sự cố nào được ghi nhận' : 'Không có kết quả phù hợp'}
          </Typography>
          {hasActiveFilters && (
            <Button size="small" onClick={handleReset} sx={{ mt: 1 }}>
              Xoá bộ lọc
            </Button>
          )}
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                {['ID', 'Loại sự cố', 'Tài xế / Biển số', 'Mức độ', 'Trạng thái', 'Ảnh', 'Thời gian', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(inc => (
                <TableRow key={inc.IncidentID} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.78rem' }}>
                    #{inc.IncidentID}
                    {inc.SessionCode && (
                      <Typography variant="caption" display="block" color="primary.main">
                        {inc.SessionCode}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 170 }}>
                      {inc.IncidentType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{inc.DriverName || '—'}</Typography>
                    {inc.PlateNumber && (
                      <Typography variant="caption" color="text.secondary">{inc.PlateNumber}</Typography>
                    )}
                  </TableCell>
                  <TableCell><PriorityBadge priority={inc.Priority} /></TableCell>
                  <TableCell><StatusChip status={inc.IncidentStatus} /></TableCell>
                  {/* Ảnh thumbnail preview */}
                  <TableCell>
                    {Array.isArray(inc.Attachments) && inc.Attachments.length > 0 ? (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {inc.Attachments.slice(0, 3).map((src, i) => (
                          <Box
                            key={i}
                            component="img"
                            src={src}
                            sx={{
                              width: 28, height: 28, borderRadius: 0.75,
                              objectFit: 'cover', border: '1px solid #e2e8f0',
                              cursor: 'pointer'
                            }}
                            onClick={() => { setSelectedId(inc.IncidentID); setDetailOpen(true) }}
                          />
                        ))}
                        {inc.Attachments.length > 3 && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.3 }}>
                            +{inc.Attachments.length - 3}
                          </Typography>
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {fmtDate(inc.CreatedAt)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Xem & cập nhật">
                      <IconButton size="small"
                        onClick={() => { setSelectedId(inc.IncidentID); setDetailOpen(true) }}
                        sx={{ color: 'primary.main' }}>
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

      <IncidentDetailModal
        incidentId={selectedId}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={load}
      />
    </Box>
  )
}

// ─── Page chính ───────────────────────────────────────────────────────────────

export default function StaffIncidentPage({ sessionId, driverId }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreated = () => {
    setRefreshKey(k => k + 1)
    setTimeout(() => setTab(1), 800)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', pb: 6 }}>
      {/* Header */}
      <Box sx={{
        bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider',
        px: { xs: 2, md: 4 }, py: 2, position: 'sticky', top: 0, zIndex: 10
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton size="small" onClick={() => navigate('/staff/dashboard')}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              <ArrowLeft size={18} />
            </IconButton>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AlertTriangle size={22} color="#f59e0b" />
              <Typography variant="h6" fontWeight={700}>Quản lý sự cố</Typography>
            </Stack>
          </Stack>
          <Button
            variant="contained" size="small"
            startIcon={<Plus size={15} />}
            onClick={() => setTab(0)}
            sx={{ fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}
          >
            Tạo sự cố mới
          </Button>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 3 }, pt: 3 }}>
        <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              borderBottom: '1px solid', borderColor: 'divider',
              bgcolor: '#f8fafc', px: 1,
              '& .MuiTab-root': { fontWeight: 600, minHeight: 48 }
            }}
          >
            <Tab label="Tạo sự cố mới" icon={<Plus size={16} />} iconPosition="start" />
            <Tab
              label={
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Clock size={16} />
                  <span>Lịch sử sự cố</span>
                </Stack>
              }
            />
          </Tabs>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {tab === 0 && (
              <CreateIncidentForm
                sessionId={sessionId}
                driverId={driverId}
                onSuccess={handleCreated}
              />
            )}
            {tab === 1 && (
              <IncidentHistory refreshTrigger={refreshKey} />
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}