/**
 * FILE: StaffCheckIn.jsx
 * MÔ TẢ: Trang Nhận xe (Check-in) dành cho Staff.
 * Hỗ trợ nhận xe vãng lai (nhập biển số, gợi ý ô đỗ) và nhận xe đặt trước (tìm booking).
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Info, Search, CheckCircle2, MapPin, FileText, Calendar,
  Loader2, RefreshCcw, ChevronDown, Car, Building2,
  Layers, Grid3X3, Sparkles, ChevronRight, RotateCcw
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import staffApi from '../../apis/staffApi'
import { useTranslation } from 'react-i18next'

/* ─── Plate helpers ──────────────────────────────────────────── */
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

/* ─── Slot status styles ─────────────────────────────────────── */
const SLOT_STYLE = {
  Available: 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:bg-blue-50 cursor-pointer',
  Occupied: 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed opacity-60',
  Reserved: 'bg-amber-50 border-amber-300 text-amber-600 border-dashed cursor-not-allowed opacity-60',
  Maintenance: 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50',
  Blocked: 'bg-slate-700 border-slate-700 text-white cursor-not-allowed opacity-50',
}

/* ─── Build hierarchy ────────────────────────────────────────── */
function buildHierarchy(slots) {
  const map = {}
  slots.forEach(s => {
    const bk = s.BuildingName, fk = s.FloorName, zk = s.ZoneName
    if (!map[bk]) map[bk] = { name: bk, floors: {} }
    if (!map[bk].floors[fk]) map[bk].floors[fk] = { name: fk, zones: {} }
    if (!map[bk].floors[fk].zones[zk]) map[bk].floors[fk].zones[zk] = { name: zk, slots: [] }
    map[bk].floors[fk].zones[zk].slots.push(s)
  })
  return Object.values(map).map(b => ({
    ...b,
    floors: Object.values(b.floors).map(f => ({
      ...f,
      zones: Object.values(f.zones)
    }))
  }))
}

/* ─── Zone stats helper ──────────────────────────────────────── */
function zoneStats(zones) {
  return zones.map(z => {
    const total = z.slots.length
    const available = z.slots.filter(s => s.SlotStatus === 'Available').length
    const occupied = z.slots.filter(s => s.SlotStatus === 'Occupied').length
    const reserved = z.slots.filter(s => s.SlotStatus === 'Reserved').length
    const pct = total > 0 ? Math.round((occupied + reserved) / total * 100) : 0
    return { ...z, total, available, occupied, reserved, pct }
  })
}

/* ─── Smart Slot Suggester (local, không cần AI)
   {t('staff.checkin.walkin.aiImproving')} — hiện dùng logic thông minh local.
   ────────────────────────────────────────────────────────────── */
function askAIForSlot({ slots }) {
  const available = slots.filter(s => s.SlotStatus === 'Available')
  const occupied = slots.filter(s => s.SlotStatus === 'Occupied').length
  const total = slots.length
  const pct = total > 0 ? Math.round(occupied / total * 100) : 0
  return Promise.resolve(smartSuggestSlot({ available, occupied, total, pct }))
}

/* ─── Smart local fallback (không cần AI/network) ───────────── */
function smartSuggestSlot({ available, occupied, total, pct }) {
  if (available.length === 0) throw new Error('No available slots')

  // Xác định mật độ
  const density = pct >= 80 ? 'high' : pct >= 50 ? 'medium' : 'low'

  // Sắp xếp slot theo số cuối (ưu tiên slot số nhỏ = gần cổng)
  const sorted = [...available].sort((a, b) => {
    const numA = parseInt(a.SlotCode.split('-').pop()) || 0
    const numB = parseInt(b.SlotCode.split('-').pop()) || 0
    return numA - numB
  })

  const pickedSlot =
    density === 'high'
      ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.7))]
      : density === 'medium'
        ? sorted[Math.floor(sorted.length / 3)]
        : sorted[0]

  const reason =
    density === 'high'
      ? `Khu vực đang khá đông (${pct}% lấp đầy). Slot ${pickedSlot.SlotCode} nằm ở vị trí ít bị cản trở hơn, dễ ra vào.`
      : density === 'medium'
        ? `Khu vực ${pct}% lấp đầy. Slot ${pickedSlot.SlotCode} nằm ở vị trí cân bằng, thuận tiện di chuyển.`
        : `Khu vực còn nhiều chỗ trống. Slot ${pickedSlot.SlotCode} gần cổng ra vào nhất, tiện nhất cho khách.`

  return {
    slot: pickedSlot.SlotCode,
    reason,
    density,
    source: 'local' // để biết đây là fallback
  }
}

/* ─── Step indicator ─────────────────────────────────────────── */
function StepBadge({ step, label, active, done }) {
  return (
    <div className={`flex items-center gap-2 ${!active && !done ? 'opacity-40' : ''}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all
        ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
        {done ? '✓' : step}
      </div>
      <span className={`text-xs font-semibold ${active ? 'text-blue-700' : done ? 'text-emerald-700' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  )
}

/* ─── Occupancy bar ──────────────────────────────────────────── */
function OccupancyBar({ pct, available, labelOccupied = 'occupied', labelEmpty = 'empty' }) {
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-semibold">
        <span className={pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-600' : 'text-emerald-600'}>
          {pct}% {labelOccupied}
        </span>
        <span className="text-slate-500">{available} {labelEmpty}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WALK-IN CONTENT
═══════════════════════════════════════════════════════════════ */
const WalkInContent = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  /* Form state */
  const [plateNumber, setPlateNumber] = useState('')
  const [plateError, setPlateError] = useState('')
  const [vehicleTypeId, setVehicleTypeId] = useState('')
  const [vehicleTypes, setVehicleTypes] = useState([])

  /* Slot selection flow */
  const [allSlots, setAllSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  /* Step selections */
  const [selBuilding, setSelBuilding] = useState(null) // { name }
  const [selFloor, setSelFloor] = useState(null) // { name }
  const [selZone, setSelZone] = useState(null) // { name, slots, ... }
  const [selSlotId, setSelSlotId] = useState(null)

  /* AI suggestion */
  const [aiSuggestion, setAiSuggestion] = useState(null) // { slot, reason, density }

  /* Load vehicle types */
  useEffect(() => {
    staffApi.getVehicleTypes()
      .then(res => {
        if (res.success) {
          setVehicleTypes(res.data)
          if (res.data.length) setVehicleTypeId(String(res.data[0].VehicleTypeID))
        }
      })
      .catch(() => toast.error(t('staff.checkin.walkin.fetchVehicleTypeFailed')))
  }, [t])

  /* Load slots */
  const loadSlots = useCallback(async () => {
    if (!vehicleTypeId) return
    setLoading(true)
    setSelBuilding(null); setSelFloor(null); setSelZone(null); setSelSlotId(null)
    setAiSuggestion(null)
    try {
      const res = await staffApi.getParkingMap({ vehicleTypeId, status: 'all' })
      if (res.success) setAllSlots(res.data)
    } catch { toast.error(t('staff.checkin.walkin.fetchMapFailed')) }
    finally { setLoading(false) }
  }, [vehicleTypeId, t])

  useEffect(() => { loadSlots() }, [loadSlots])

  /* Hierarchy */
  const hierarchy = useMemo(() => buildHierarchy(allSlots), [allSlots])

  const floorList = useMemo(() => {
    if (!selBuilding) return []
    return hierarchy.find(b => b.name === selBuilding.name)?.floors || []
  }, [hierarchy, selBuilding])

  const zoneList = useMemo(() => {
    if (!selBuilding || !selFloor) return []
    const b = hierarchy.find(b => b.name === selBuilding.name)
    const f = b?.floors.find(f => f.name === selFloor.name)
    return zoneStats(f?.zones || [])
  }, [hierarchy, selBuilding, selFloor])

  const slotsInZone = useMemo(() => {
    if (!selZone) return []
    return [...selZone.slots].sort((a, b) => a.SlotCode.localeCompare(b.SlotCode))
  }, [selZone])

  /* Ask AI when zone selected */
  useEffect(() => {
    if (!selZone || !selBuilding || !selFloor) return
    const available = selZone.slots.filter(s => s.SlotStatus === 'Available')
    if (available.length === 0) return
    setAiSuggestion(null)

    const vt = vehicleTypes.find(v => String(v.VehicleTypeID) === vehicleTypeId)

    askAIForSlot({
      building: selBuilding.name,
      floor: selFloor.name,
      zone: selZone.name,
      slots: selZone.slots,
      vehicleType: vt?.VehicleName || t('staff.checkin.walkin.vehicleTypeRequired')
    })
      .then(result => {
        setAiSuggestion(result)
        // Auto-select AI suggested slot
        const suggested = selZone.slots.find(s => s.SlotCode === result.slot)
        if (suggested) setSelSlotId(suggested.SlotID)
      })
      .catch(() => {
        // Fallback: pick first available
        const first = available[0]
        if (first) setSelSlotId(first.SlotID)
      })
  }, [selZone]) // eslint-disable-line

  const selectedSlot = allSlots.find(s => s.SlotID === selSlotId)
  const plateValid = isValidPlate(plateNumber)

  /* Step tracking */
  const step = !selBuilding ? 1 : !selFloor ? 2 : !selZone ? 3 : !selSlotId ? 4 : 5

  /* Submit */
  const handleSubmit = async () => {
    if (!plateNumber.trim()) { setPlateError(t('staff.checkin.walkin.plateRequired')); return }
    if (!plateValid) { setPlateError(t('staff.checkin.walkin.plateInvalid')); return }
    if (!vehicleTypeId) return toast.error(t('staff.checkin.walkin.vehicleTypeRequired'))
    if (!selSlotId) return toast.error(t('staff.checkin.walkin.noSlot'))
    setSubmitting(true)
    try {
      const res = await staffApi.createWalkInSession({
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleTypeId: Number(vehicleTypeId),
        slotId: selSlotId
      })
      if (res.success) {
        toast.success(t('staff.checkin.walkin.checkinSuccess'))
        navigate('/staff/checkin-success', {
          state: { actionType: 'walkin-checkin', sessionId: res.data.sessionId, sessionCode: res.data.sessionCode, session: res.data.session }
        })
      }
    } catch (err) { toast.error(err.response?.data?.message || t('staff.checkin.walkin.checkinFailed')) }
    finally { setSubmitting(false) }
  }

  const densityColor = { low: 'text-emerald-600', medium: 'text-amber-600', high: 'text-red-600' }
  const densityLabel = { low: t('staff.checkin.walkin.densityLow'), medium: t('staff.checkin.walkin.densityMed'), high: t('staff.checkin.walkin.densityHigh') }

  return (
    <div className="flex gap-4 items-start pb-24">

      {/* ━━ LEFT: Form + Steps ━━ */}
      <div className="w-72 flex-shrink-0 space-y-3">

        {/* Form card */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
            <Info size={15} className="text-blue-500" />
            {t('staff.checkin.walkin.title', 'Thông tin xe')}
          </h3>

          {/* Plate */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {t('staff.checkin.walkin.plateLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={plateNumber}
              onChange={e => { setPlateNumber(formatPlate(e.target.value)); setPlateError('') }}
              placeholder="29A-12345"
              maxLength={12}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm font-black uppercase tracking-widest
                focus:outline-none focus:ring-2 transition-all
                ${plateError ? 'border-red-400 bg-red-50 focus:ring-red-300'
                  : plateValid ? 'border-emerald-400 bg-emerald-50 focus:ring-emerald-300'
                    : 'border-slate-200 focus:ring-blue-300'}`}
            />
            {plateError
              ? <p className="text-xs text-red-500 mt-1">{plateError}</p>
              : plateValid
                ? <p className="text-xs text-emerald-600 mt-1 font-medium">{t('staff.checkin.walkin.plateValid')}</p>
                : <p className="text-xs text-slate-400 mt-1">{t('staff.checkin.walkin.plateHint')} 29A-12345</p>
            }
          </div>

          {/* Vehicle type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              {t('staff.checkin.walkin.vehicleTypeLabel')} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {vehicleTypes.map(vt => (
                <button key={vt.VehicleTypeID}
                  onClick={() => setVehicleTypeId(String(vt.VehicleTypeID))}
                  className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-all
                    ${vehicleTypeId === String(vt.VehicleTypeID)
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}>
                  {vt.VehicleName}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step tracker */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('staff.checkin.walkin.stepGuide')}</p>
          <div className="space-y-2.5">
            <StepBadge step={1} label={t('staff.checkin.walkin.stepBuilding')} active={step === 1} done={step > 1} />
            <StepBadge step={2} label={t('staff.checkin.walkin.stepFloor')} active={step === 2} done={step > 2} />
            <StepBadge step={3} label={t('staff.checkin.walkin.stepZone')} active={step === 3} done={step > 3} />
            <StepBadge step={4} label={t('staff.checkin.walkin.stepSuggest')} active={step === 4} done={step > 4 && !!selSlotId} />
            <StepBadge step={5} label={t('staff.checkin.walkin.stepConfirm')} active={step === 5} done={false} />
          </div>
        </div>

        {/* Selected summary */}
        {selSlotId && selectedSlot && (
          <div className="bg-blue-600 rounded-xl p-4 text-white space-y-1">
            <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{t('staff.checkin.walkin.selectedSlot')}</p>
            <p className="text-3xl font-black">{selectedSlot.SlotCode}</p>
            <p className="text-xs opacity-80">
              {selectedSlot.BuildingName?.split(' - ').slice(-1)[0]}
              {' · '}{selectedSlot.FloorName}
              {' · '}{selectedSlot.ZoneName}
            </p>
            {aiSuggestion && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-[10px] flex items-center gap-1 opacity-80">
                  <Sparkles size={10} /> {t('staff.checkin.walkin.aiLabel')}
                </p>
                <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{aiSuggestion.reason}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ━━ RIGHT: Selection flow ━━ */}
      <div className="flex-1 space-y-3">

        {/* STEP 1: Building */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-blue-500" />
              <span className="text-sm font-bold text-slate-700">{t('staff.checkin.walkin.step1Title')}</span>
            </div>
            {selBuilding && (
              <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                {selBuilding.name.split(' - ').slice(-1)[0]}
                <button onClick={() => { setSelBuilding(null); setSelFloor(null); setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                  className="ml-1 text-slate-400 hover:text-slate-600">
                  <RotateCcw size={10} />
                </button>
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin text-blue-400" size={20} /></div>
          ) : (
            <div className="p-3 flex flex-wrap gap-2">
              {hierarchy.map(b => {
                const totalSlots = b.floors.reduce((acc, f) => acc + f.zones.reduce((a, z) => a + z.slots.length, 0), 0)
                const avail = b.floors.reduce((acc, f) => acc + f.zones.reduce((a, z) => a + z.slots.filter(s => s.SlotStatus === 'Available').length, 0), 0)
                const isActive = selBuilding?.name === b.name
                return (
                  <button key={b.name}
                    onClick={() => { setSelBuilding({ name: b.name }); setSelFloor(null); setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                      ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                    <Building2 size={18} className={isActive ? 'text-blue-100' : 'text-slate-400'} />
                    <div>
                      <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-slate-700'}`}>
                        {b.name.split(' - ').slice(-1)[0] || b.name}
                      </p>
                      <p className={`text-[10px] font-semibold ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                        {avail}/{totalSlots} {t('staff.checkin.walkin.statEmpty')}
                      </p>
                    </div>
                    {isActive && <CheckCircle2 size={16} className="text-white ml-1" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* STEP 2: Floor */}
        {selBuilding && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-blue-500" />
                <span className="text-sm font-bold text-slate-700">{t('staff.checkin.walkin.step2Title')}</span>
              </div>
              {selFloor && (
                <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                  {selFloor.name}
                  <button onClick={() => { setSelFloor(null); setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                    className="ml-1 text-slate-400 hover:text-slate-600">
                    <RotateCcw size={10} />
                  </button>
                </span>
              )}
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {floorList.map(f => {
                const avail = f.zones.reduce((a, z) => a + z.slots.filter(s => s.SlotStatus === 'Available').length, 0)
                const total = f.zones.reduce((a, z) => a + z.slots.length, 0)
                const pct = total > 0 ? Math.round((total - avail) / total * 100) : 0
                const isAct = selFloor?.name === f.name
                const barClr = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
                return (
                  <button key={f.name}
                    onClick={() => { setSelFloor({ name: f.name }); setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                    className={`flex flex-col gap-1.5 px-4 py-3 rounded-xl border min-w-[120px] transition-all text-left
                      ${isAct ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-sm font-bold ${isAct ? 'text-white' : 'text-slate-700'}`}>{f.name}</p>
                      {isAct && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <p className={`text-[10px] font-semibold ${isAct ? 'text-blue-100' : 'text-slate-400'}`}>
                      {avail} {t('staff.checkin.walkin.statEmpty')} / {total}
                    </p>
                    <div className={`h-1 rounded-full ${isAct ? 'bg-blue-400' : 'bg-slate-100'}`}>
                      <div className={`h-full rounded-full ${isAct ? 'bg-white' : barClr}`} style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Zone */}
        {selFloor && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Grid3X3 size={14} className="text-blue-500" />
                <span className="text-sm font-bold text-slate-700">{t('staff.checkin.walkin.step3Title')}</span>
              </div>
              {selZone && (
                <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                  {selZone.name}
                  <button onClick={() => { setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                    className="ml-1 text-slate-400 hover:text-slate-600">
                    <RotateCcw size={10} />
                  </button>
                </span>
              )}
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {zoneList.map(z => {
                const isAct = selZone?.name === z.name
                const tagClr = z.pct >= 90 ? 'text-red-500 bg-red-50' : z.pct >= 70 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
                const tagLbl = z.pct >= 90 ? t('staff.checkin.walkin.zoneCrowded') : z.pct >= 70 ? t('staff.checkin.walkin.zoneMed') : t('staff.checkin.walkin.zoneOk')
                return (
                  <button key={z.name}
                    onClick={() => { setSelZone(z); setSelSlotId(null); setAiSuggestion(null) }}
                    disabled={z.available === 0}
                    className={`p-3 rounded-xl border text-left transition-all space-y-2
                      ${z.available === 0 ? 'opacity-40 cursor-not-allowed border-slate-100 bg-slate-50'
                        : isAct ? 'bg-blue-600 border-blue-600 shadow-md'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-bold leading-tight ${isAct ? 'text-white' : 'text-slate-700'}`}>
                        {z.name.split(' ').slice(-2).join(' ')}
                      </p>
                      {isAct && <CheckCircle2 size={13} className="text-white flex-shrink-0" />}
                    </div>
                    {!isAct && (
                      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tagClr}`}>
                        {tagLbl}
                      </span>
                    )}
                    <OccupancyBar pct={isAct ? 0 : z.pct} available={z.available} labelOccupied={t('staff.checkin.walkin.statOccupied')} labelEmpty={t('staff.checkin.walkin.statEmpty')} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 4: AI Suggestion + Slot grid */}
        {selZone && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-purple-500" />
                  <span className="text-sm font-bold text-slate-700">{t('staff.checkin.walkin.step4Title')}</span>
                </div>

              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* AI suggestion banner */}
              {aiSuggestion ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Sparkles size={18} className="text-blue-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{t('staff.checkin.walkin.aiLabel')}</p>
                          {aiSuggestion.density && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white ${densityColor[aiSuggestion.density]}`}>
                              {densityLabel[aiSuggestion.density]}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 italic flex items-center gap-0.5">
                            <Sparkles size={9} /> {t('staff.checkin.walkin.aiImproving')}
                          </span>
                        </div>
                        <p className="text-xl font-black text-blue-700 mt-0.5">{aiSuggestion.slot}</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{aiSuggestion.reason}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const s = slotsInZone.find(s => s.SlotCode === aiSuggestion.slot)
                        if (s) setSelSlotId(s.SlotID)
                      }}
                      className="flex-shrink-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> {t('staff.checkin.walkin.useThisSlot')}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Gate */}
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-700 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-white font-bold tracking-widest">{t('staff.parkingMap.gateLabel')}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>

              {/* Slot grid */}
              <div className="flex flex-wrap gap-2 justify-center">
                {slotsInZone.map(slot => {
                  const isSelected = selSlotId === slot.SlotID
                  const isAiPick = aiSuggestion?.slot === slot.SlotCode
                  const isDisabled = slot.SlotStatus !== 'Available'
                  return (
                    <button key={slot.SlotID}
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setSelSlotId(slot.SlotID)}
                      title={`${slot.SlotCode} – ${slot.SlotStatus}`}
                      className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center
                        transition-all duration-150 relative
                        ${isSelected
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110 z-10'
                          : isAiPick && !isDisabled
                            ? 'bg-purple-50 border-purple-400 text-purple-700 shadow-sm scale-105'
                            : SLOT_STYLE[slot.SlotStatus] || SLOT_STYLE.Available
                        }`}>
                      {isAiPick && !isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-purple-500 rounded-full flex items-center justify-center">
                          <Sparkles size={8} className="text-white" />
                        </span>
                      )}
                      <span className="font-black text-[10px] leading-tight">
                        {slot.SlotCode.split('-').slice(-1)[0]}
                      </span>
                      {slot.SlotStatus === 'Available' && !isSelected && (
                        <span className="text-[7px] font-bold opacity-50 mt-0.5">OK</span>
                      )}
                      {slot.SlotStatus === 'Occupied' && <Car size={10} className="mt-0.5 opacity-60" />}
                      {slot.SlotStatus === 'Reserved' && <span className="text-[7px] font-bold mt-0.5">{t('staff.checkin.walkin.slotStatus.reserved').slice(0, 3)}</span>}
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 flex-wrap border-t border-slate-50 pt-3">
                {[
                  ['bg-white border-slate-200', t('staff.checkin.walkin.slotStatus.available')],
                  ['bg-red-50 border-red-200', t('staff.checkin.walkin.slotStatus.occupied')],
                  ['bg-amber-50 border-amber-300', t('staff.checkin.walkin.slotStatus.reserved')],
                  ['bg-purple-50 border-purple-400', t('staff.checkin.walkin.slotStatus.selecting')],
                  ['bg-blue-600 border-blue-600', t('staff.checkin.walkin.slotStatus.selecting')],
                ].map(([cls, label]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded border-2 ${cls}`} />
                    <span className="text-[10px] text-slate-500 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ━━ Bottom action bar ━━ */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-slate-100 shadow-lg z-20">
        <div className="flex items-center justify-between px-6 py-3 gap-4">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">{t('staff.checkin.walkin.selectedPlate')}</span>
              <p className={`font-black ${plateValid ? 'text-slate-800' : 'text-slate-300'}`}>{plateNumber || '—'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Slot</span>
              <p className={`font-black ${selectedSlot ? 'text-blue-600' : 'text-slate-300'}`}>{selectedSlot?.SlotCode || '—'}</p>
            </div>
            {selectedSlot && (
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{t('staff.checkin.walkin.slotCode')}</span>
                <p className="text-xs font-medium text-slate-600">{selectedSlot.FloorName} · {selectedSlot.ZoneName}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setPlateNumber(''); setPlateError(''); setSelSlotId(null); setSelZone(null); setSelFloor(null); setSelBuilding(null); setAiSuggestion(null) }}
              className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
              {t('staff.checkin.walkin.cancel')}
            </button>
            <button onClick={handleSubmit}
              disabled={submitting || !plateValid || !selSlotId}
              className="px-6 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              <CheckCircle2 size={15} />
              {t('staff.checkin.walkin.confirmCheckin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   BOOKING CONTENT
═══════════════════════════════════════════════════════════════ */
const BookingContent = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Reserved')
  const [keyword, setKeyword] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTrigger, setSearchTrigger] = useState(0)
  const keywordRef = useRef(keyword)
  useEffect(() => { keywordRef.current = keyword }, [keyword])

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        setLoading(true)
        try {
          const params = {}
          if (activeTab !== 'all') params.status = activeTab
          if (keywordRef.current.trim()) params.keyword = keywordRef.current.trim()
          const res = await staffApi.getBookingQueue(params)
          if (!cancelled && res.success) setBookings(res.data)
        } catch { if (!cancelled) toast.error(t('staff.checkin.booking.fetchFailed')) }
        finally { if (!cancelled) setLoading(false) }
      })()
    return () => { cancelled = true }
  }, [activeTab, searchTrigger, t])

  const STATUS_BADGE = {
    Reserved: 'bg-emerald-100 text-emerald-700',
    Completed: 'bg-slate-100 text-slate-600',
    Cancelled: 'bg-red-100 text-red-600',
    Expired: 'bg-amber-100 text-amber-700',
  }

  const TABS = [
    { name: 'Reserved', label: t('staff.checkin.booking.tabs.reserved', 'Đang đặt') },
    { name: 'Completed', label: t('staff.checkin.booking.tabs.completed', 'Hoàn thành') },
    { name: 'Cancelled', label: t('staff.checkin.booking.tabs.cancelled', 'Đã hủy') },
    { name: 'Expired', label: t('staff.checkin.booking.tabs.expired', 'Hết hạn') },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearchTrigger(t => t + 1)}
              placeholder={t('staff.checkin.booking.searchPlaceholder', t('staff.checkin.booking.searchPlaceholder'))}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all" />
          </div>
          <button onClick={() => setSearchTrigger(t => t + 1)} disabled={loading}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {t('staff.checkin.booking.searchBtn')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex gap-1 px-4 pt-4 border-b border-slate-100">
          {TABS.map(tab => (
            <button key={tab.name} onClick={() => setActiveTab(tab.name)}
              className={`px-4 py-2 rounded-t-lg text-xs font-bold transition-colors border-b-2 -mb-px
                ${activeTab === tab.name ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={22} /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-slate-300">
            <Calendar size={36} className="mx-auto mb-2" />
            <p className="text-sm font-medium">{t('staff.checkin.booking.noBooking', 'Không có đặt chỗ nào')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 font-bold uppercase tracking-wide">
                  <th className="py-3 px-4 text-left">{t('staff.checkin.booking.colCode')}</th>
                  <th className="py-3 px-4 text-left">{t('staff.checkin.booking.colDriver')}</th>
                  <th className="py-3 px-4 text-left">Xe</th>
                  <th className="py-3 px-4 text-left">{t('staff.checkin.walkin.slotCode')}</th>
                  <th className="py-3 px-4 text-left">{t('staff.checkin.booking.colStart')}</th>
                  <th className="py-3 px-4 text-left">{t('staff.checkin.booking.colEnd')}</th>
                  <th className="py-3 px-4 text-left">{t('staff.checkin.booking.colStatus')}</th>
                  <th className="py-3 px-4 text-right">{t('staff.checkin.booking.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map(item => (
                  <tr key={item.ReservationID} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-black text-blue-600 text-xs">{item.BookingCode}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{item.DriverName}</p>
                      <p className="text-xs text-slate-400">{item.PhoneNumber}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{item.VehicleName}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-700 text-xs">{item.SlotCode}</p>
                      <p className="text-xs text-slate-400">{item.ZoneName}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {item.StartTime ? new Date(item.StartTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {item.EndTime ? new Date(item.EndTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${STATUS_BADGE[item.ReservationStatus] || 'bg-slate-100 text-slate-600'}`}>
                        {item.ReservationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.ReservationStatus === 'Reserved' && (
                        <button onClick={() => navigate(`/staff/verify-booking/${item.ReservationID}`)}
                          className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold transition-colors">
                          {t('staff.checkin.booking.processBtn')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
const StaffCheckIn = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [activeType, setActiveType] = useState(
    searchParams.get('tab') === 'booking' ? 'booking' : 'walkin'
  )

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-8">
      <header className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('staff.checkin.title', 'Check-in xe')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{t('staff.checkin.subtitle', 'Quản lý xe vào bãi')}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {t('staff.checkin.gateLabel', 'Cổng đang mở')}
        </div>
      </header>

      <div className="flex gap-1 mb-5 bg-white rounded-xl border border-slate-100 shadow-sm p-1 w-fit">
        {[
          { key: 'walkin', icon: FileText, label: t('staff.checkin.walkinTab', 'Khách vãng lai') },
          { key: 'booking', icon: Calendar, label: t('staff.checkin.bookingTab', 'Đặt chỗ trước') },
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setActiveType(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all
              ${activeType === key ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="flex-1">
        {activeType === 'walkin' ? <WalkInContent /> : <BookingContent />}
      </div>
    </div>
  )
}

export default StaffCheckIn