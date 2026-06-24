import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import axios from '../../utils/authorizeAxios'
import { Map, RefreshCcw, Car, Info, ZoomIn, ZoomOut } from 'lucide-react'

const STATUS_CONFIG = {
  available: { labelKey: 'staff.parkingMap.statusAvailable', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  occupied: { labelKey: 'staff.parkingMap.statusOccupied', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
  reserved: { labelKey: 'staff.parkingMap.statusReserved', bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700' },
  maintenance: { labelKey: 'staff.parkingMap.statusMaintenance', bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-500' },
  blocked: { labelKey: 'staff.parkingMap.statusBlocked', bg: 'bg-gray-800', border: 'border-gray-800', text: 'text-white' }
}

function buildZones(slots) {
  const zoneMap = {}
  slots.forEach(slot => {
    const key = slot.ZoneID
    if (!zoneMap[key]) {
      zoneMap[key] = {
        id: slot.ZoneID,
        label: `${slot.BuildingName} · ${slot.FloorName} · ${slot.ZoneName}`,
        statuses: {},
        slotCodes: []
      }
    }
    zoneMap[key].statuses[slot.SlotCode] = (slot.SlotStatus || 'Available').toLowerCase()
    zoneMap[key].slotCodes.push(slot.SlotCode)
  })
  return Object.values(zoneMap).map(zone => {
    const codes = [...new Set(zone.slotCodes)].sort()
    const rows = []
    for (let i = 0; i < codes.length; i += 10) rows.push(codes.slice(i, i + 10))
    return { ...zone, rows }
  })
}

const StaffParkingMap = () => {
  const { t } = useTranslation()
  const [zones, setZones] = useState([])
  const [activeZone, setActiveZone] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // ✅ inline effect + cancelled flag
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await axios.get('/staff/parking-map')
        if (cancelled) return
        const flatSlots = res.data?.data || []
        const built = buildZones(flatSlots)
        setZones(built)
        setActiveZone(prev => built.find(z => z.id === prev) ? prev : (built[0]?.id ?? null))
      } catch {
        if (!cancelled) {
          setZones([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [refreshTrigger])

  const handleRefresh = () => setRefreshTrigger(t => t + 1)

  const zone = zones.find(z => z.id === activeZone)
  const getStatus = (slotCode) => zone?.statuses[slotCode] || 'available'
  const totalSlots = zone ? Object.keys(zone.statuses).length : 0
  const availableCount = zone ? Object.values(zone.statuses).filter(s => s === 'available').length : 0
  const occupiedCount = zone ? Object.values(zone.statuses).filter(s => s === 'occupied').length : 0
  const reservedCount = zone ? Object.values(zone.statuses).filter(s => s === 'reserved').length : 0

  const handleSelectSlot = async (slotCode) => {
    try {
      const res = await axios.get(`/staff/slots/${slotCode}`)
      const slotData = res.data?.data
      if (!slotData) {
        setSelectedSlot({ id: slotCode, status: getStatus(slotCode), zone: zone?.label, details: null, error: t('staff.parkingMap.noDataShort') })
        return
      }
      setSelectedSlot({
        id: slotCode, status: getStatus(slotCode), zone: zone?.label,
        type: slotData.type,
        details: {
          sessionCode: slotData.sessionCode, bookingCode: slotData.bookingCode,
          sessionId: slotData.sessionId, reservationId: slotData.reservationId,
          driverName: slotData.driverName, driverEmail: slotData.driverEmail, driverPhone: slotData.driverPhone,
          entryTime: slotData.entryTime, exitTime: slotData.exitTime,
          startTime: slotData.startTime, endTime: slotData.endTime,
          plateNumber: slotData.plateNumber, paymentStatus: slotData.paymentStatus,
          amount: slotData.amount, finalAmount: slotData.finalAmount,
          prepaidAmount: slotData.prepaidAmount, surchargeAmount: slotData.surchargeAmount,
          paymentMethod: slotData.paymentMethod, reservationStatus: slotData.reservationStatus
        }
      })
    } catch {
      setSelectedSlot({ id: slotCode, status: getStatus(slotCode), zone: zone?.label, details: null, error: t('staff.parkingMap.loadError') })
    }
  }

  const formatDateTime = (ds) => {
    if (!ds) return 'N/A'
    try { return new Date(ds).toLocaleString('vi-VN') } catch { return ds }
  }
  const formatCurrency = (v) => {
    if (v === null || v === undefined) return '0 VND'
    return Number(v).toLocaleString('vi-VN') + ' VND'
  }

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Map size={24} className="text-blue-600" /> {t('staff.parkingMap.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('staff.parkingMap.subtitle')}</p>
        </div>
        <button onClick={handleRefresh} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
          <RefreshCcw size={15} /> {t('staff.parkingMap.refresh')}
        </button>
      </header>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            {zones.map(z => (
              <button key={`zone-${z.id}`} onClick={() => { setActiveZone(z.id); setSelectedSlot(null) }}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeZone === z.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}>
                {z.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2">
              <button onClick={() => setZoom(z => Math.max(0.7, z - 0.1))} className="p-1.5 text-gray-500 hover:text-gray-800"><ZoomOut size={16} /></button>
              <span className="text-xs font-semibold text-gray-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1.5 text-gray-500 hover:text-gray-800"><ZoomIn size={16} /></button>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            {[
              { label: t('staff.parkingMap.statTotal'), value: totalSlots, color: 'text-gray-800' },
              { label: t('staff.parkingMap.statAvailable'), value: availableCount, color: 'text-green-600' },
              { label: t('staff.parkingMap.statOccupied'), value: occupiedCount, color: 'text-red-600' },
              { label: t('staff.parkingMap.statReserved'), value: reservedCount, color: 'text-orange-500' }
            ].map(item => (
              <div key={item.label} className="bg-white rounded-lg border border-gray-100 px-4 py-2 text-center shadow-sm flex-1">
                <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-500 font-semibold">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1 overflow-auto">
            <div className="h-6 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center mb-4">
              <span className="text-xs text-gray-400 font-semibold tracking-widest">{t('staff.parkingMap.gateLabel')}</span>
            </div>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s' }}>
              {zone?.rows.map((row, ri) => (
                <div key={`row-${ri}`} className="flex gap-2 mb-2 justify-center">
                  {row.map(slotCode => {
                    const st = getStatus(slotCode)
                    const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.available
                    const isSelected = selectedSlot?.id === slotCode
                    return (
                      <button key={`slot-${slotCode}`} onClick={() => handleSelectSlot(slotCode)}
                        className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all hover:scale-110 hover:shadow-md ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110' : `${cfg.bg} ${cfg.border} ${cfg.text}`}`}
                        title={`${slotCode} – ${t(cfg.labelKey)}`}>
                        <span className="font-bold text-xs">{slotCode}</span>
                        {st === 'occupied' && <Car size={10} className="mt-0.5 opacity-70" />}
                        {st === 'available' && <span className="text-[8px] opacity-50 font-semibold">{t('staff.parkingMap.tagAvailable')}</span>}
                        {st === 'reserved' && <span className="text-[8px] font-bold opacity-70">{t('staff.parkingMap.tagReserved')}</span>}
                        {st === 'maintenance' && <span className="text-[8px] font-bold opacity-70">{t('staff.parkingMap.tagMaintenance')}</span>}
                        {st === 'blocked' && <span className="text-[8px] font-bold opacity-70">{t('staff.parkingMap.tagBlocked')}</span>}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-64 flex flex-col gap-4">
          {selectedSlot && !selectedSlot.error ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left max-h-[calc(100vh-300px)] overflow-y-auto">
              <h3 className="text-sm font-bold text-gray-600 uppercase mb-4 border-b pb-2">{t('staff.parkingMap.detailTitle')}</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-black text-blue-600">{selectedSlot.id}</div>
                <div className="text-xs text-gray-400 mt-1">{selectedSlot.zone}</div>
              </div>
              <div className={`text-center py-2 px-3 rounded-lg font-bold text-sm mb-4 ${STATUS_CONFIG[selectedSlot.status]?.bg} ${STATUS_CONFIG[selectedSlot.status]?.text} border ${STATUS_CONFIG[selectedSlot.status]?.border}`}>
                {t(STATUS_CONFIG[selectedSlot.status]?.labelKey).toUpperCase()}
              </div>
              {selectedSlot.details ? (
                <div className="text-xs text-gray-600 space-y-2">
                  {selectedSlot.type === 'session' && (
                    <>
                      <p className="font-bold text-gray-700 border-b pb-2">{t('staff.parkingMap.sessionTitle')}</p>
                      {selectedSlot.details.sessionCode && <p><strong>{t('staff.parkingMap.sessionCode')}:</strong> {selectedSlot.details.sessionCode}</p>}
                      {selectedSlot.details.plateNumber && <p><strong>{t('staff.parkingMap.plate')}:</strong> {selectedSlot.details.plateNumber}</p>}
                      {selectedSlot.details.entryTime && <p><strong>{t('staff.parkingMap.entryTime')}:</strong> {formatDateTime(selectedSlot.details.entryTime)}</p>}
                    </>
                  )}
                  {selectedSlot.type === 'reservation' && (
                    <>
                      <p className="font-bold text-gray-700 border-b pb-2">{t('staff.parkingMap.reservationTitle')}</p>
                      {selectedSlot.details.bookingCode && <p><strong>{t('staff.parkingMap.bookingCode')}:</strong> {selectedSlot.details.bookingCode}</p>}
                      {selectedSlot.details.startTime && <p><strong>{t('staff.parkingMap.startTime')}:</strong> {formatDateTime(selectedSlot.details.startTime)}</p>}
                      {selectedSlot.details.endTime && <p><strong>{t('staff.parkingMap.endTime')}:</strong> {formatDateTime(selectedSlot.details.endTime)}</p>}
                      {selectedSlot.details.reservationStatus && <p><strong>{t('staff.parkingMap.reservationStatus')}:</strong> {selectedSlot.details.reservationStatus}</p>}
                    </>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <p className="font-bold text-gray-700 mb-1">{t('staff.parkingMap.driverInfo')}</p>
                    {selectedSlot.details.driverName && <p><strong>{t('staff.parkingMap.driverName')}:</strong> {selectedSlot.details.driverName}</p>}
                    {selectedSlot.details.driverEmail && <p><strong>{t('staff.parkingMap.driverEmail')}:</strong> {selectedSlot.details.driverEmail}</p>}
                    {selectedSlot.details.driverPhone && <p><strong>{t('staff.parkingMap.driverPhone')}:</strong> {selectedSlot.details.driverPhone}</p>}
                  </div>
                  {selectedSlot.details.paymentStatus && (
                    <div className="border-t pt-2 mt-2">
                      <p className="font-bold text-gray-700 mb-1">{t('staff.parkingMap.payment')}</p>
                      <p><strong>{t('staff.parkingMap.paymentStatus')}:</strong> {selectedSlot.details.paymentStatus}</p>
                      {selectedSlot.details.finalAmount != null && <p><strong>{t('staff.parkingMap.totalFee')}:</strong> {formatCurrency(selectedSlot.details.finalAmount)}</p>}
                      {selectedSlot.details.prepaidAmount && <p><strong>{t('staff.parkingMap.paidAmount')}:</strong> {formatCurrency(selectedSlot.details.prepaidAmount)}</p>}
                      {selectedSlot.details.surchargeAmount > 0 && <p><strong>{t('staff.parkingMap.surcharge')}:</strong> {formatCurrency(selectedSlot.details.surchargeAmount)}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-400 text-xs">{t('staff.parkingMap.noData')}</p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <Info size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{selectedSlot?.error || t('staff.parkingMap.clickHint')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StaffParkingMap