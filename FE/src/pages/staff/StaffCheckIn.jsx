// src/pages/Staff/StaffCheckIn.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Info, Search, CheckCircle2, MapPin, FileText, Calendar, Loader2, RefreshCcw
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import staffApi from '../../apis/staffApi'
import { useTranslation } from 'react-i18next'

// ── Slot status helper ────────────────────────────────────────
const SLOT_STATUS_STYLE = {
  Available: 'bg-white border-gray-300 text-gray-600 hover:border-blue-400',
  Occupied: 'bg-red-50 border-red-200 text-red-700 cursor-not-allowed',
  Reserved: 'bg-orange-50 border-orange-400 text-orange-600 border-dashed',
  Maintenance: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
  Blocked: 'bg-gray-800 border-gray-800 text-white cursor-not-allowed'
}

// ── Biển số helpers ───────────────────────────────────────────
// Định dạng chuẩn VN: 2 số tỉnh + 1 chữ series + 4-5 số
const formatPlate = (raw) => {
  const clean = (raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (!clean) return ''

  // Phần 1: 2 số tỉnh
  const prov = clean.slice(0, 2).replace(/[^0-9]/g, '')
  let result = prov
  if (prov.length < 2) return result

  // Phần 2: chữ series (1-2 ký tự chữ)
  let i = 2
  let series = ''
  while (i < clean.length && /[A-Z]/.test(clean[i]) && series.length < 2) {
    series += clean[i]
    i++
  }
  result += series
  if (!series) return result

  // Phần 3: phần số
  const nums = clean.slice(i).replace(/[^0-9]/g, '').slice(0, 5)
  if (nums.length === 0) return result
  result += '-'
  if (nums.length <= 3) {
    result += nums
  } else {
    result += nums.slice(0, nums.length - 2) + '.' + nums.slice(nums.length - 2)
  }
  return result
}

const PLATE_REGEX = /^(\d{2}[A-Z]{1,2}-?\d{3}\.?\d{2}|\d{2}[A-Z]{1,2}-?\d{4,5})$/i
const isValidPlate = (plate) => PLATE_REGEX.test(plate)

// ── Walk-in content ───────────────────────────────────────────
const WalkInContent = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [plateNumber, setPlateNumber] = useState('')
  const [plateError, setPlateError] = useState('')
  const [vehicleTypeId, setVehicleTypeId] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [note, setNote] = useState('')
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [slots, setSlots] = useState([])
  const [suggestedSlot, setSuggestedSlot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Load vehicle types
  useEffect(() => {
    let cancelled = false
    staffApi.getVehicleTypes()
      .then(res => {
        if (cancelled) return
        if (res.success) {
          setVehicleTypes(res.data)
          if (res.data.length > 0) setVehicleTypeId(String(res.data[0].VehicleTypeID))
        }
      })
      .catch(() => { if (!cancelled) toast.error(t('staff.checkin.walkin.fetchVehicleTypeFailed')) })
    return () => { cancelled = true }
  }, [t])

  // Load parking map
  const loadSlots = useCallback(async () => {
    if (!vehicleTypeId) return
    setLoading(true)
    try {
      const res = await staffApi.getParkingMap({ vehicleTypeId, status: 'all' })
      if (res.success) {
        setSlots(res.data)
        const first = res.data.find(s => s.SlotStatus === 'Available')
        setSuggestedSlot(first || null)
        setSelectedSlotId(prev => prev ?? (first?.SlotID || null))
      }
    } catch {
      toast.error(t('staff.checkin.walkin.fetchMapFailed'))
    } finally {
      setLoading(false)
    }
  }, [vehicleTypeId, t])

  // Auto-fetch slots khi đổi loại xe
  useEffect(() => {
    if (!vehicleTypeId) return
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await staffApi.getParkingMap({ vehicleTypeId, status: 'all' })
        if (cancelled) return
        if (res.success) {
          setSlots(res.data)
          const first = res.data.find(s => s.SlotStatus === 'Available')
          setSuggestedSlot(first || null)
          setSelectedSlotId(prev => prev ?? (first?.SlotID || null))
        }
      } catch {
        if (!cancelled) toast.error(t('staff.checkin.walkin.fetchMapFailed'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [vehicleTypeId, t])

  const handlePlateChange = (e) => {
    const formatted = formatPlate(e.target.value)
    setPlateNumber(formatted)
    if (plateError) setPlateError('')
  }

  const handleSubmit = async () => {
    if (!plateNumber.trim()) {
      setPlateError(t('staff.checkin.walkin.plateRequired'))
      return toast.error(t('staff.checkin.walkin.plateRequired'))
    }
    if (!isValidPlate(plateNumber)) {
      setPlateError(t('staff.checkin.walkin.plateInvalid'))
      return toast.error(t('staff.checkin.walkin.plateInvalid'))
    }
    if (!vehicleTypeId) return toast.error(t('staff.checkin.walkin.vehicleTypeRequired'))
    if (!selectedSlotId) return toast.error(t('staff.checkin.walkin.noSlot'))

    setSubmitting(true)
    try {
      const res = await staffApi.createWalkInSession({
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleTypeId: Number(vehicleTypeId),
        slotId: selectedSlotId
      })
      if (res.success) {
        toast.success(t('staff.checkin.walkin.checkinSuccess'))
        navigate('/staff/checkin-success', {
          state: {
            actionType: 'walkin-checkin',
            sessionId: res.data.sessionId,
            sessionCode: res.data.sessionCode,
            session: res.data.session
          }
        })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('staff.checkin.walkin.checkinFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const slotGroups = slots.reduce((acc, s) => {
    const key = `${s.BuildingName} · ${s.FloorName} · ${s.ZoneName}`
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const availableCount = slots.filter(s => s.SlotStatus === 'Available').length
  const plateValid = isValidPlate(plateNumber)

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24 animate-in fade-in">
      <div className="flex gap-6 flex-1 flex-col xl:flex-row">
        {/* Form */}
        <div className="flex-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Info size={20} className="text-blue-500" /> {t('staff.checkin.walkin.title')}
          </h3>
          <p className="text-sm text-gray-500 mb-6">{t('staff.checkin.walkin.subtitle')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('staff.checkin.walkin.plateLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={plateNumber}
                onChange={handlePlateChange}
                placeholder={t('staff.checkin.walkin.platePlaceholder')}
                maxLength={12}
                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 transition-all text-sm font-bold uppercase tracking-wider ${plateError
                  ? 'border-red-400 bg-red-50 focus:ring-red-400'
                  : plateValid
                    ? 'border-green-400 bg-green-50 focus:ring-green-400'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {plateError ? (
                <p className="text-xs text-red-500 mt-1.5 font-medium">{plateError}</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1.5">
                  {t('staff.checkin.walkin.plateHint')} <span className="font-semibold text-gray-600">{t('staff.checkin.walkin.platePlaceholder')}</span>
                  {plateValid && <span className="text-green-600 ml-2">✓ {t('staff.checkin.walkin.plateValid')}</span>}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('staff.checkin.walkin.vehicleTypeLabel')} <span className="text-red-500">*</span>
              </label>
              <select
                value={vehicleTypeId}
                onChange={e => setVehicleTypeId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all text-sm bg-white"
              >
                {vehicleTypes.map(vt => (
                  <option key={vt.VehicleTypeID} value={vt.VehicleTypeID}>
                    {vt.VehicleName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('staff.checkin.walkin.noteLabel')}</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={t('staff.checkin.walkin.notePlaceholder')}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Slot grid */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700">
                {t('staff.checkin.walkin.selectSlot')} <span className="text-green-600">({availableCount} {t('staff.checkin.walkin.emptySlots')})</span>
              </h4>
              <button onClick={loadSlots} disabled={loading} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} /> {t('staff.checkin.walkin.refreshHint')}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-blue-500" size={24} />
              </div>
            ) : (
              Object.entries(slotGroups).map(([groupName, groupSlots]) => (
                <div key={groupName} className="mb-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">{groupName}</p>
                  <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                    {groupSlots.map((slot, slotIndex) => {
                      const isSelected = selectedSlotId === slot.SlotID
                      const isDisabled = slot.SlotStatus !== 'Available'
                      const style = isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105'
                        : (SLOT_STATUS_STYLE[slot.SlotStatus] || SLOT_STATUS_STYLE.Available)
                      return (
                        <button
                          key={`slot-${slot.SlotID}-${slotIndex}`}
                          disabled={isDisabled}
                          onClick={() => setSelectedSlotId(slot.SlotID)}
                          className={`border rounded-lg p-2 text-center transition-all h-12 flex items-center justify-center ${style}`}
                          title={`${slot.SlotCode} – ${t(`staff.checkin.walkin.slotStatus.${slot.SlotStatus.toLowerCase()}`, slot.SlotStatus)}`}
                        >
                          <span className="font-bold text-xs">{slot.SlotCode}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
              {[
                ['bg-white border-gray-300', t('staff.checkin.walkin.slotStatus.available')],
                ['bg-red-50 border-red-200', t('staff.checkin.walkin.slotStatus.occupied')],
                ['bg-orange-50 border-orange-400 border-dashed', t('staff.checkin.walkin.slotStatus.reserved')],
                ['bg-gray-100 border-gray-300', t('staff.checkin.walkin.slotStatus.maintenance')],
                ['bg-blue-600 border-blue-600', t('staff.checkin.walkin.slotStatus.selecting')]
              ].map(([style, label]) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`w-4 h-4 rounded border ${style}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Suggested slot panel */}
        <div className="flex-1 bg-blue-50 rounded-xl border border-blue-100 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
              <MapPin size={20} className="text-blue-500" /> {t('staff.checkin.walkin.suggestedSlot')}
            </h3>
            <p className="text-sm text-blue-700 mb-6">{t('staff.checkin.walkin.suggestedDesc')}</p>

            {suggestedSlot ? (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-3 text-center">
                  <div className="text-xs text-blue-500 font-bold uppercase mb-1">{t('staff.checkin.walkin.zone')}</div>
                  <div className="text-lg font-black text-blue-900">{suggestedSlot.ZoneName?.split(' ')[0]}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-3 text-center">
                  <div className="text-xs text-blue-500 font-bold uppercase mb-1">{t('staff.checkin.walkin.floor')}</div>
                  <div className="text-lg font-black text-blue-900">{suggestedSlot.FloorName}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-3 text-center">
                  <div className="text-xs text-blue-500 font-bold uppercase mb-1">{t('staff.checkin.walkin.slotCode')}</div>
                  <div className="text-lg font-black text-blue-900">{suggestedSlot.SlotCode}</div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-4 text-center text-gray-400 text-sm mb-6">
                {loading ? t('staff.checkin.walkin.searching') : t('staff.checkin.walkin.noSlot')}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {suggestedSlot && (
              <button
                onClick={() => setSelectedSlotId(suggestedSlot.SlotID)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2"
              >
                <CheckCircle2 size={18} /> {t('staff.checkin.walkin.useThisSlot')}
              </button>
            )}
            <button
              onClick={loadSlots}
              className="w-full py-3 bg-transparent border border-blue-300 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-all"
            >
              {t('staff.checkin.walkin.refreshMap')}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 gap-4 md:gap-0">
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase">{t('staff.checkin.walkin.selectedPlate')}</span>
              <p className="font-black text-gray-800">{plateNumber || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase">{t('staff.checkin.walkin.selectedSlot')}</span>
              <p className="font-bold text-gray-800">
                {selectedSlotId ? slots.find(s => s.SlotID === selectedSlotId)?.SlotCode || '—' : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setPlateNumber(''); setPlateError(''); setSelectedSlotId(suggestedSlot?.SlotID || null) }}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
            >
              {t('staff.checkin.walkin.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !plateValid || !selectedSlotId}
              className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {t('staff.checkin.walkin.confirmCheckin')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Booking content ───────────────────────────────────────────
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
    const fetch = async () => {
      setLoading(true)
      try {
        const params = {}
        if (activeTab !== 'all') params.status = activeTab
        if (keywordRef.current.trim()) params.keyword = keywordRef.current.trim()
        const res = await staffApi.getBookingQueue(params)
        if (!cancelled && res.success) setBookings(res.data)
      } catch {
        if (!cancelled) toast.error(t('staff.checkin.booking.fetchFailed'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [activeTab, searchTrigger, t])

  const handleSearch = () => setSearchTrigger(t => t + 1)

  const tabs = [
    { name: 'Reserved', label: t('staff.checkin.booking.tabs.reserved') },
    { name: 'Completed', label: t('staff.checkin.booking.tabs.completed') },
    { name: 'Cancelled', label: t('staff.checkin.booking.tabs.cancelled') },
    { name: 'Expired', label: t('staff.checkin.booking.tabs.expired') }
  ]

  const statusColor = {
    Reserved: 'bg-green-100 text-green-700',
    Completed: 'bg-gray-100 text-gray-600',
    Cancelled: 'bg-red-100 text-red-600',
    Expired: 'bg-orange-100 text-orange-700'
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 animate-in fade-in space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{t('staff.checkin.booking.searchTitle')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('staff.checkin.booking.searchSubtitle')}</p>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t('staff.checkin.booking.searchPlaceholder')}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {t('staff.checkin.booking.searchBtn')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab.name ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" size={24} /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('staff.checkin.booking.noBooking')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">{t('staff.checkin.booking.colCode')}</th>
                  <th className="py-3 px-4">{t('staff.checkin.booking.colDriver')}</th>
                  <th className="py-3 px-4">{t('staff.checkin.booking.colVehicle')}</th>
                  <th className="py-3 px-4">{t('staff.checkin.booking.colLocation')}</th>
                  <th className="py-3 px-4">{t('staff.checkin.booking.colStart')}</th>
                  <th className="py-3 px-4">{t('staff.checkin.booking.colEnd')}</th>
                  <th className="py-3 px-4">{t('staff.checkin.booking.colStatus')}</th>
                  <th className="py-3 px-4 text-right">{t('staff.checkin.booking.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map(item => (
                  <tr key={item.ReservationID} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-bold text-blue-600">{item.BookingCode}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{item.DriverName}</p>
                      <p className="text-xs text-gray-400">{item.PhoneNumber}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{item.VehicleName}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{item.SlotCode}</p>
                      <p className="text-xs text-gray-400">{item.ZoneName}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {item.StartTime ? new Date(item.StartTime).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {item.EndTime ? new Date(item.EndTime).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[item.ReservationStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {item.ReservationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.ReservationStatus === 'Reserved' && (
                        <button
                          onClick={() => navigate(`/staff/verify-booking/${item.ReservationID}`)}
                          className="px-4 py-1.5 bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold text-xs"
                        >
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

// ── Main wrapper ──────────────────────────────────────────────
const StaffCheckIn = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [activeType, setActiveType] = useState(
    searchParams.get('tab') === 'booking' ? 'booking' : 'walkin'
  )

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('staff.checkin.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('staff.checkin.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-sm font-medium">
          <div className="w-2 h-2 rounded-full bg-green-500" /> {t('staff.checkin.gateLabel')}
        </div>
      </header>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveType('walkin')}
          className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeType === 'walkin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText size={18} /> {t('staff.checkin.walkinTab')}
        </button>
        <button
          onClick={() => setActiveType('booking')}
          className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeType === 'booking' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar size={18} /> {t('staff.checkin.bookingTab')}
        </button>
      </div>

      <div className="flex-1">
        {activeType === 'walkin' ? <WalkInContent /> : <BookingContent />}
      </div>
    </div>
  )
}

export default StaffCheckIn