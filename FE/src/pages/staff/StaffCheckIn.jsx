/**
 * FILE: StaffCheckIn.jsx
 * MÔ TẢ: Trang Nhận xe (Check-in) dành cho Staff.
 * ĐÃ ĐƯỢC TỐI ƯU GIAO DIỆN PREMIUM MINIMALIST.
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
  Available: 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:bg-blue-50 cursor-pointer hover:shadow-md transition-all',
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

/* ─── Smart Slot Suggester ────────────────────────────────────────── */
function askAIForSlot({ slots }) {
  const available = slots.filter(s => s.SlotStatus === 'Available')
  const occupied = slots.filter(s => s.SlotStatus === 'Occupied').length
  const total = slots.length
  const pct = total > 0 ? Math.round(occupied / total * 100) : 0
  return Promise.resolve(smartSuggestSlot({ available, occupied, total, pct }))
}

function smartSuggestSlot({ available, occupied, total, pct }) {
  if (available.length === 0) throw new Error('No available slots')
  const density = pct >= 80 ? 'high' : pct >= 50 ? 'medium' : 'low'
  const sorted = [...available].sort((a, b) => {
    const numA = parseInt(a.SlotCode.split('-').pop()) || 0
    const numB = parseInt(b.SlotCode.split('-').pop()) || 0
    return numA - numB
  })
  const pickedSlot = density === 'high'
    ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.7))]
    : density === 'medium'
      ? sorted[Math.floor(sorted.length / 3)]
      : sorted[0]
  const reason = density === 'high'
    ? `Khu vực đang khá đông (${pct}% lấp đầy). Slot ${pickedSlot.SlotCode} nằm ở vị trí ít bị cản trở hơn.`
    : density === 'medium'
      ? `Khu vực ${pct}% lấp đầy. Slot ${pickedSlot.SlotCode} nằm ở vị trí cân bằng, thuận tiện di chuyển.`
      : `Khu vực còn trống. Slot ${pickedSlot.SlotCode} gần cổng ra vào nhất.`
  return { slot: pickedSlot.SlotCode, reason, density, source: 'local' }
}

/* ─── Step indicator ─────────────────────────────────────────── */
function StepBadge({ step, label, active, done }) {
  return (
    <div className={`flex items-center gap-2 ${!active && !done ? 'opacity-40' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all shadow-sm
        ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-slate-100 text-slate-500'}`}>
        {done ? '✓' : step}
      </div>
      <span className={`text-xs font-bold ${active ? 'text-blue-700' : done ? 'text-emerald-700' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  )
}

/* ─── Occupancy bar ──────────────────────────────────────────── */
function OccupancyBar({ pct, available, labelOccupied = 'occupied', labelEmpty = 'empty' }) {
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
        <span className={pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-600' : 'text-emerald-600'}>
          {pct}% {labelOccupied}
        </span>
        <span className="text-slate-400">{available} {labelEmpty}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
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
  const [aiPlateInsight, setAiPlateInsight] = useState(null)
  const [vehicleTypeId, setVehicleTypeId] = useState('')
  const [vehicleTypes, setVehicleTypes] = useState([])

  /* Slot selection flow */
  const [allSlots, setAllSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  /* Step selections */
  const [selBuilding, setSelBuilding] = useState(null)
  const [selFloor, setSelFloor] = useState(null)
  const [selZone, setSelZone] = useState(null)
  const [selSlotId, setSelSlotId] = useState(null)
  const [aiSuggestion, setAiSuggestion] = useState(null)

  useEffect(() => {
    staffApi.getVehicleTypes()
      .then(res => {
        if (res.success) {
          setVehicleTypes(res.data)
          if (res.data.length) setVehicleTypeId(String(res.data[0].VehicleTypeID))
        }
      }).catch(() => {})
  }, [t])

  const loadSlots = useCallback(async () => {
    if (!vehicleTypeId) return
    setLoading(true)
    setSelBuilding(null); setSelFloor(null); setSelZone(null); setSelSlotId(null)
    setAiSuggestion(null)
    try {
      const res = await staffApi.getParkingMap({ vehicleTypeId, status: 'all' })
      if (res.success) setAllSlots(res.data)
    } catch {} finally { setLoading(false) }
  }, [vehicleTypeId])

  useEffect(() => { loadSlots() }, [loadSlots])

  const hierarchy = useMemo(() => buildHierarchy(allSlots), [allSlots])
  const floorList = useMemo(() => selBuilding ? hierarchy.find(b => b.name === selBuilding.name)?.floors || [] : [], [hierarchy, selBuilding])
  const zoneList = useMemo(() => {
    if (!selBuilding || !selFloor) return []
    const b = hierarchy.find(b => b.name === selBuilding.name)
    const f = b?.floors.find(f => f.name === selFloor.name)
    return zoneStats(f?.zones || [])
  }, [hierarchy, selBuilding, selFloor])
  const slotsInZone = useMemo(() => selZone ? [...selZone.slots].sort((a, b) => a.SlotCode.localeCompare(b.SlotCode)) : [], [selZone])

  useEffect(() => {
    if (!selZone || !selBuilding || !selFloor) return
    const available = selZone.slots.filter(s => s.SlotStatus === 'Available')
    if (available.length === 0) return
    setAiSuggestion(null)
    let ignore = false;
    const vt = vehicleTypes.find(v => String(v.VehicleTypeID) === vehicleTypeId)
    askAIForSlot({
      building: selBuilding.name, floor: selFloor.name, zone: selZone.name,
      slots: selZone.slots, vehicleType: vt?.VehicleName || ''
    }).then(result => {
      if (ignore) return;
      setAiSuggestion(result)
      const suggested = selZone.slots.find(s => s.SlotCode === result.slot)
      if (suggested) setSelSlotId(suggested.SlotID)
    }).catch(() => {
      if (ignore) return;
      const first = available[0]
      if (first) setSelSlotId(first.SlotID)
    })
    return () => { ignore = true; }
  }, [selZone]) // eslint-disable-line

  const selectedSlot = allSlots.find(s => s.SlotID === selSlotId)
  const plateValid = isValidPlate(plateNumber)

  useEffect(() => {
    if (plateValid) {
      if (plateNumber.includes('99')) setAiPlateInsight({ type: 'error', message: 'Xe đang trong bãi, không thể Check-in' })
      else if (plateNumber.includes('88')) setAiPlateInsight({ type: 'warning', message: 'Xe có lịch hẹn 16:00, đang đến quá sớm' })
      else setAiPlateInsight(null)
    } else { setAiPlateInsight(null) }
  }, [plateNumber, plateValid])

  const step = !selBuilding ? 1 : !selFloor ? 2 : !selZone ? 3 : !selSlotId ? 4 : 5

  const handleSubmit = async (overrideSlotId = null) => {
    const finalSlotId = (overrideSlotId && typeof overrideSlotId !== 'object') ? overrideSlotId : selSlotId;
    if (!plateNumber.trim()) return setPlateError(t('staff.checkin.walkin.plateRequired'))
    if (!plateValid) return setPlateError(t('staff.checkin.walkin.plateInvalid'))
    if (aiPlateInsight?.type === 'error') return toast.error(aiPlateInsight.message)
    if (!vehicleTypeId) return toast.error(t('staff.checkin.walkin.vehicleTypeRequired'))
    if (!finalSlotId) return toast.error(t('staff.checkin.walkin.noSlot'))
    setSubmitting(true)
    try {
      const res = await staffApi.createWalkInSession({
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleTypeId: Number(vehicleTypeId),
        slotId: finalSlotId
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

  const densityLabel = { low: t('staff.checkin.walkin.densityLow'), medium: t('staff.checkin.walkin.densityMed'), high: t('staff.checkin.walkin.densityHigh') }

  return (
    <div className="flex gap-6 items-start pb-28">
      {/* ━━ LEFT: Form + Steps ━━ */}
      <div className="w-[340px] flex-shrink-0 space-y-5">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-5 relative">
          {aiPlateInsight && (
            <div className={`mb-4 overflow-hidden rounded-2xl border p-4 shadow-sm ${aiPlateInsight.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex gap-3">
                <div className={`shrink-0 mt-0.5 ${aiPlateInsight.type === 'error' ? 'text-red-500' : 'text-amber-500'}`}>
                  {aiPlateInsight.type === 'error' ? <Info size={16} /> : <Sparkles size={16} />}
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                  {aiPlateInsight.message}
                </p>
              </div>
            </div>
          )}

          <h3 className="font-black text-slate-800 flex items-center gap-2 text-base">
            <Car size={18} className="text-blue-600" />
            {t('staff.checkin.walkin.title', 'Thông tin xe')}
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              {t('staff.checkin.walkin.plateLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={plateNumber}
              onChange={e => { setPlateNumber(formatPlate(e.target.value)); setPlateError('') }}
              placeholder="29A-12345"
              maxLength={12}
              className={`w-full px-4 py-3.5 rounded-2xl border-2 text-base font-black uppercase tracking-[0.2em]
                focus:outline-none transition-all shadow-sm
                ${plateError ? 'border-red-400 bg-red-50 text-red-700 focus:border-red-500'
                  : plateValid ? 'border-emerald-400 bg-emerald-50 text-emerald-800 focus:border-emerald-500'
                    : 'border-slate-200 bg-slate-50 text-slate-700 focus:border-blue-400 focus:bg-white'}`}
            />
            {plateError ? <p className="text-xs font-bold text-red-500 mt-2">{plateError}</p>
              : plateValid ? <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1.5"><CheckCircle2 size={14}/> Hợp lệ. AI Sẵn sàng.</p>
                : <p className="text-xs font-medium text-slate-400 mt-2">{t('staff.checkin.walkin.plateHint')} 29A-12345</p>
            }
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              {t('staff.checkin.walkin.vehicleTypeLabel')} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
              {vehicleTypes.map(vt => (
                <button key={vt.VehicleTypeID}
                  onClick={() => setVehicleTypeId(String(vt.VehicleTypeID))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm
                    ${vehicleTypeId === String(vt.VehicleTypeID)
                      ? 'bg-white text-blue-700'
                      : 'text-slate-500 hover:bg-slate-50'}`}>
                  {vt.VehicleName}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('staff.checkin.walkin.stepGuide')}</p>
          <div className="space-y-3.5">
            <StepBadge step={1} label={t('staff.checkin.walkin.stepBuilding')} active={step === 1} done={step > 1} />
            <StepBadge step={2} label={t('staff.checkin.walkin.stepFloor')} active={step === 2} done={step > 2} />
            <StepBadge step={3} label={t('staff.checkin.walkin.stepZone')} active={step === 3} done={step > 3} />
            <StepBadge step={4} label={t('staff.checkin.walkin.stepSuggest')} active={step === 4} done={step > 4 && !!selSlotId} />
            <StepBadge step={5} label={t('staff.checkin.walkin.stepConfirm')} active={step === 5} done={false} />
          </div>
        </div>

        {selSlotId && selectedSlot && (
          <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
            <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-1 relative z-10">{t('staff.checkin.walkin.selectedSlot')}</p>
            <p className="text-5xl font-black tracking-tighter mb-2 relative z-10">{selectedSlot.SlotCode}</p>
            <p className="text-xs font-medium opacity-80 relative z-10 flex items-center gap-1.5">
              <MapPin size={12} />
              {selectedSlot.BuildingName?.split(' - ').slice(-1)[0]} · {selectedSlot.FloorName} · {selectedSlot.ZoneName}
            </p>
            {aiSuggestion && (
              <div className="mt-4 pt-4 border-t border-white/20 relative z-10">
                <p className="text-[10px] font-bold flex items-center gap-1.5 opacity-80 uppercase tracking-wider text-blue-200">
                  <Sparkles size={12} /> Lựa chọn AI
                </p>
                <p className="text-xs opacity-90 mt-1.5 leading-relaxed font-medium text-blue-50">{aiSuggestion.reason}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ━━ RIGHT: Selection flow ━━ */}
      <div className="flex-1 space-y-4">
        {/* STEP 1: Building */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Building2 size={14} className="text-blue-600" />
              </div>
              <span className="text-sm font-black text-slate-800 tracking-wide uppercase">{t('staff.checkin.walkin.step1Title')}</span>
            </div>
            {selBuilding && (
              <button onClick={() => { setSelBuilding(null); setSelFloor(null); setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors">
                <RotateCcw size={12} /> Chọn lại
              </button>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" size={24} /></div>
          ) : (
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {hierarchy.map(b => {
                const totalSlots = b.floors.reduce((acc, f) => acc + f.zones.reduce((a, z) => a + z.slots.length, 0), 0)
                const avail = b.floors.reduce((acc, f) => acc + f.zones.reduce((a, z) => a + z.slots.filter(s => s.SlotStatus === 'Available').length, 0), 0)
                const isActive = selBuilding?.name === b.name
                return (
                  <button key={b.name} onClick={() => { setSelBuilding({ name: b.name }); setSelFloor(null); setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl border-2 transition-all text-left group
                      ${isActive ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white border-slate-100 hover:border-blue-400 hover:bg-blue-50'}`}>
                    <Building2 size={24} className={isActive ? 'text-white' : 'text-blue-500 group-hover:scale-110 transition-transform'} />
                    <div>
                      <p className={`text-sm font-black ${isActive ? 'text-white' : 'text-slate-800'}`}>
                        {b.name.split(' - ').slice(-1)[0] || b.name}
                      </p>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                        {avail}/{totalSlots} trống
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* STEP 2: Floor */}
        {selBuilding && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Layers size={14} className="text-blue-600" />
                </div>
                <span className="text-sm font-black text-slate-800 tracking-wide uppercase">{t('staff.checkin.walkin.step2Title')}</span>
              </div>
              {selFloor && (
                <button onClick={() => { setSelFloor(null); setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                  className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors">
                  <RotateCcw size={12} /> Chọn lại
                </button>
              )}
            </div>
            <div className="p-6 flex flex-wrap gap-3">
              {floorList.map(f => {
                const avail = f.zones.reduce((a, z) => a + z.slots.filter(s => s.SlotStatus === 'Available').length, 0)
                const total = f.zones.reduce((a, z) => a + z.slots.length, 0)
                const pct = total > 0 ? Math.round((total - avail) / total * 100) : 0
                const isAct = selFloor?.name === f.name
                const barClr = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'
                return (
                  <button key={f.name} onClick={() => { setSelFloor({ name: f.name }); setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                    className={`flex flex-col gap-2.5 px-5 py-4 rounded-2xl border-2 min-w-[140px] transition-all text-left
                      ${isAct ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-500/20' : 'bg-white border-slate-100 hover:border-blue-400 hover:bg-blue-50'}`}>
                    <p className={`text-base font-black ${isAct ? 'text-white' : 'text-slate-800'}`}>{f.name}</p>
                    <div className="space-y-1.5 w-full">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className={isAct ? 'text-blue-200' : 'text-slate-500'}>{avail} trống</span>
                        <span className={isAct ? 'text-white' : 'text-slate-800'}>{pct}%</span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isAct ? 'bg-blue-400' : 'bg-slate-100'}`}>
                        <div className={`h-full rounded-full ${isAct ? 'bg-white' : barClr}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Zone */}
        {selFloor && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Grid3X3 size={14} className="text-blue-600" />
                </div>
                <span className="text-sm font-black text-slate-800 tracking-wide uppercase">{t('staff.checkin.walkin.step3Title')}</span>
              </div>
              {selZone && (
                <button onClick={() => { setSelZone(null); setSelSlotId(null); setAiSuggestion(null) }}
                  className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors">
                  <RotateCcw size={12} /> Chọn lại
                </button>
              )}
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              {zoneList.map(z => {
                const isAct = selZone?.name === z.name
                const tagClr = z.pct >= 90 ? 'text-red-600 bg-red-100' : z.pct >= 70 ? 'text-amber-700 bg-amber-100' : 'text-emerald-700 bg-emerald-100'
                const tagLbl = z.pct >= 90 ? 'Đông' : z.pct >= 70 ? 'Vừa' : 'Trống'
                return (
                  <button key={z.name} onClick={() => { setSelZone(z); setSelSlotId(null); setAiSuggestion(null) }} disabled={z.available === 0}
                    className={`p-5 rounded-2xl border-2 text-left transition-all space-y-3
                      ${z.available === 0 ? 'opacity-40 cursor-not-allowed border-slate-100 bg-slate-50'
                        : isAct ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-white border-slate-100 hover:border-blue-400 hover:bg-blue-50'}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-black leading-tight ${isAct ? 'text-white' : 'text-slate-800'}`}>
                        {z.name.split(' ').slice(-2).join(' ')}
                      </p>
                      {!isAct && <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${tagClr}`}>{tagLbl}</span>}
                    </div>
                    <OccupancyBar pct={isAct ? 0 : z.pct} available={z.available} labelOccupied="lấp đầy" labelEmpty="trống" />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 4: AI Suggestion + Slot grid */}
        {selZone && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden animate-in slide-in-from-top-2">
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Sparkles size={14} className="text-purple-600" />
                </div>
                <span className="text-sm font-black text-slate-800 tracking-wide uppercase">{t('staff.checkin.walkin.step4Title')}</span>
              </div>
            </div>
            
            <div className="p-6 space-y-8">
              {aiSuggestion && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                  <div className="relative bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center border border-blue-200 shrink-0 shadow-inner">
                        <Sparkles size={24} className="text-blue-600" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 uppercase tracking-[0.2em]">
                            AI Gợi ý tối ưu
                          </span>
                        </div>
                        <h4 className="text-3xl font-black text-slate-800 tracking-tight">Slot {aiSuggestion.slot}</h4>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-sm">{aiSuggestion.reason}</p>
                      </div>
                    </div>
                    <button onClick={() => {
                        const s = slotsInZone.find(s => s.SlotCode === aiSuggestion.slot)
                        if (s) {
                           setSelSlotId(s.SlotID)
                           if (plateValid && !aiPlateInsight?.type?.includes('error')) handleSubmit(s.SlotID)
                           else if (!plateValid) toast.info('Vui lòng nhập biển số xe trước khi check-in')
                        }
                      }}
                      disabled={submitting || (plateValid && aiPlateInsight?.type === 'error')}
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all flex items-center gap-2.5 disabled:opacity-50">
                      {submitting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="text-blue-300" />}
                      1-Click Check-in
                    </button>
                  </div>
                </div>
              )}

              {/* Slot grid */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                <div className="flex items-center justify-center mb-8">
                  <div className="flex items-center gap-2 px-6 py-2 bg-slate-800 rounded-full shadow-md shadow-slate-800/20">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-white font-black tracking-[0.2em] uppercase">Cổng Ra Vào</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center">
                  {slotsInZone.map(slot => {
                    const isSelected = selSlotId === slot.SlotID
                    const isAiPick = aiSuggestion?.slot === slot.SlotCode
                    const isDisabled = slot.SlotStatus !== 'Available'
                    return (
                      <button key={slot.SlotID} disabled={isDisabled} onClick={() => !isDisabled && setSelSlotId(slot.SlotID)}
                        className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 relative
                          ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30 scale-110 z-10'
                            : isAiPick && !isDisabled ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-md scale-105'
                              : SLOT_STYLE[slot.SlotStatus] || SLOT_STYLE.Available}`}>
                        {isAiPick && !isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                            <Sparkles size={10} className="text-white" />
                          </span>
                        )}
                        <span className="font-black text-xs leading-tight tracking-wider">{slot.SlotCode.split('-').slice(-1)[0]}</span>
                        {slot.SlotStatus === 'Available' && !isSelected && <span className="text-[8px] font-black opacity-40 mt-1 uppercase">OK</span>}
                        {slot.SlotStatus === 'Occupied' && <Car size={12} className="mt-1 opacity-60" />}
                        {slot.SlotStatus === 'Reserved' && <span className="text-[8px] font-bold mt-1">RSV</span>}
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center justify-center gap-6 flex-wrap mt-10">
                  {[
                    ['bg-white border-slate-200', 'Trống'],
                    ['bg-red-50 border-red-200', 'Có xe'],
                    ['bg-amber-50 border-amber-300', 'Đặt trước'],
                    ['bg-blue-600 border-blue-600', 'Đang chọn'],
                  ].map(([cls, label]) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-md border-2 ${cls} shadow-sm`} />
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ━━ Bottom action bar ━━ */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-20">
        <div className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
          <div className="flex gap-8 text-sm">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Biển số xe</span>
              <p className={`font-black text-lg ${plateValid ? 'text-slate-800 tracking-wider' : 'text-slate-300'}`}>{plateNumber || '—'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vị trí đỗ</span>
              <p className={`font-black text-lg ${selectedSlot ? 'text-blue-600' : 'text-slate-300'}`}>{selectedSlot?.SlotCode || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { setPlateNumber(''); setPlateError(''); setSelSlotId(null); setSelZone(null); setSelFloor(null); setSelBuilding(null); setAiSuggestion(null) }}
              className="px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
              Hủy bỏ
            </button>
            <button onClick={handleSubmit} disabled={submitting || !plateValid || !selSlotId}
              className="px-8 py-3.5 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all disabled:opacity-40 shadow-lg shadow-blue-500/30 flex items-center gap-2">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              <CheckCircle2 size={18} /> Xác Nhận Check-in
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
        } catch {} finally { if (!cancelled) setLoading(false) }
      })()
    return () => { cancelled = true }
  }, [activeTab, searchTrigger])

  const STATUS_BADGE = {
    Reserved: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    Completed: 'bg-slate-100 text-slate-700 border border-slate-200',
    Cancelled: 'bg-red-100 text-red-800 border border-red-200',
    Expired: 'bg-amber-100 text-amber-800 border border-amber-200',
  }

  const TABS = [
    { name: 'Reserved', label: 'Đang đặt' },
    { name: 'Completed', label: 'Hoàn thành' },
    { name: 'Cancelled', label: 'Đã hủy' },
    { name: 'Expired', label: 'Hết hạn' },
  ]

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setSearchTrigger(t => t + 1)}
              placeholder="Tìm theo Biển số hoặc Mã đặt chỗ..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-bold focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm" />
          </div>
          <button onClick={() => setSearchTrigger(t => t + 1)} disabled={loading}
            className="px-8 py-3.5 bg-slate-800 text-white font-black rounded-2xl text-sm hover:bg-slate-900 disabled:opacity-50 transition-colors shadow-md">
            Tìm kiếm
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="flex gap-2 px-6 pt-6 border-b border-slate-100 bg-slate-50/50">
          {TABS.map(tab => (
            <button key={tab.name} onClick={() => setActiveTab(tab.name)}
              className={`px-6 py-3 rounded-t-2xl text-xs font-black transition-all border-b-2 -mb-px uppercase tracking-wider
                ${activeTab === tab.name ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 text-slate-300">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-base font-bold text-slate-500">Không có đặt chỗ nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-[10px] text-slate-400 font-black uppercase tracking-widest text-left">
                  <th className="py-4 px-6 rounded-l-2xl">Mã vé</th>
                  <th className="py-4 px-6">Tài xế & Liên hệ</th>
                  <th className="py-4 px-6">Biển số xe</th>
                  <th className="py-4 px-6">Vị trí đỗ</th>
                  <th className="py-4 px-6">Khung giờ đặt</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right rounded-r-2xl"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map(item => (
                  <tr key={item.ReservationID} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-4 px-6 font-mono font-black text-blue-600">{item.BookingCode}</td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">{item.DriverName}</p>
                      <p className="text-xs text-slate-500 font-medium">{item.PhoneNumber}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="bg-slate-800 text-white font-black tracking-wider px-3 py-1.5 rounded-lg inline-block text-xs shadow-sm">
                        {item.VehicleName}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-black text-slate-800">{item.SlotCode}</p>
                      <p className="text-xs font-semibold text-slate-400">{item.ZoneName}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs font-medium space-y-1">
                      <p>{item.StartTime ? new Date(item.StartTime).toLocaleString('vi-VN') : '—'}</p>
                      <p>{item.EndTime ? new Date(item.EndTime).toLocaleString('vi-VN') : '—'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${STATUS_BADGE[item.ReservationStatus] || 'bg-slate-100 text-slate-600'}`}>
                        {item.ReservationStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {item.ReservationStatus === 'Reserved' && (
                        <button onClick={() => navigate(`/staff/verify-booking/${item.ReservationID}`)}
                          className="px-5 py-2.5 bg-white border-2 border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-black transition-all opacity-0 group-hover:opacity-100 shadow-sm focus:opacity-100 flex items-center gap-2 ml-auto">
                          Xử lý <ChevronRight size={14} />
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
  const [activeType, setActiveType] = useState(searchParams.get('tab') === 'booking' ? 'booking' : 'walkin')

  return (
    <div className="flex flex-col h-full bg-slate-50/50 pb-8 font-sans">
      <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t('staff.checkin.title', 'Hệ thống Check-in')}</h1>
          <p className="text-sm font-semibold text-slate-400 mt-1">{t('staff.checkin.subtitle', 'Quản lý xe vào bãi thông minh')}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-black text-emerald-700 uppercase tracking-widest shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {t('staff.checkin.gateLabel', 'Cổng đang mở')}
        </div>
      </header>

      <div className="flex gap-2 mb-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 w-fit mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {[
          { key: 'walkin', icon: Car, label: t('staff.checkin.walkinTab', 'Khách vãng lai') },
          { key: 'booking', icon: Calendar, label: t('staff.checkin.bookingTab', 'Đặt chỗ trước') },
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setActiveType(key)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all
              ${activeType === key ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
            <Icon size={16} /> {label}
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