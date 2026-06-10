import React, { useState, useEffect } from 'react'
import axios from '../../utils/authorizeAxios'
import { Map, RefreshCcw, Car, Info, ZoomIn, ZoomOut } from 'lucide-react'

const STATUS_CONFIG = {
  available: { label: 'Trống', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  occupied: { label: 'Đã đỗ', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
  reserved: { label: 'Đã đặt', bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700' },
  maintenance: { label: 'Bảo trì', bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-500' },
  blocked: { label: 'Khóa', bg: 'bg-gray-800', border: 'border-gray-800', text: 'text-white' },
}

// Transform flat slots array → grouped zones for display
function buildZones(slots) {
  const zoneMap = {}
  slots.forEach(slot => {
    const key = slot.ZoneID
    if (!zoneMap[key]) {
      zoneMap[key] = {
        id: slot.ZoneID,
        label: `${slot.BuildingName} · ${slot.FloorName} · ${slot.ZoneName}`,
        statuses: {},   // SlotCode → status (lowercase)
        slotCodes: [],  // ordered list of SlotCodes
      }
    }
    zoneMap[key].statuses[slot.SlotCode] = (slot.SlotStatus || 'Available').toLowerCase()
    zoneMap[key].slotCodes.push(slot.SlotCode)
  })

  // Build rows (10 slots per row)
  return Object.values(zoneMap).map(zone => {
    const codes = [...new Set(zone.slotCodes)].sort()
    const rows = []
    for (let i = 0; i < codes.length; i += 10) {
      rows.push(codes.slice(i, i + 10))
    }
    return { ...zone, rows }
  })
}

const StaffParkingMap = () => {
  const [zones, setZones] = useState([])
  const [activeZone, setActiveZone] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchParkingMap = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/staff/parking-map')
      const flatSlots = res.data?.data || []
      const built = buildZones(flatSlots)
      setZones(built)
      setActiveZone(prev =>
        built.find(z => z.id === prev) ? prev : (built[0]?.id ?? null)
      )
    } catch (err) {
      console.error('Fetch parking map error:', err)
      setZones([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchParkingMap() }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  const zone = zones.find(z => z.id === activeZone)
  const getStatus = (slotCode) => zone?.statuses[slotCode] || 'available'
  const totalSlots = zone ? Object.keys(zone.statuses).length : 0
  const availableCount = zone ? Object.values(zone.statuses).filter(s => s === 'available').length : 0
  const occupiedCount = zone ? Object.values(zone.statuses).filter(s => s === 'occupied').length : 0
  const reservedCount = zone ? Object.values(zone.statuses).filter(s => s === 'reserved').length : 0

  const handleSelectSlot = async (slotCode) => {
    try {
      const res = await axios.get(`/staff/slots/${slotCode}`)
      setSelectedSlot({
        id: slotCode,
        status: getStatus(slotCode),
        zone: zone?.label,
        details: res.data?.data
      })
    } catch (err) {
      console.error('Fetch slot details error:', err)
      setSelectedSlot({ id: slotCode, status: getStatus(slotCode), zone: zone?.label, details: null })
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Map size={24} className="text-blue-600" /> Sơ đồ bãi đỗ xe
          </h1>
          <p className="text-sm text-gray-500 mt-1">Xem trạng thái theo thời gian thực của từng ô đỗ</p>
        </div>
        <button
          onClick={fetchParkingMap}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCcw size={15} /> Làm mới
        </button>
      </header>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Map panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Zone tabs */}
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            {zones.map(z => (
              <button
                key={`zone-${z.id}`}
                onClick={() => { setActiveZone(z.id); setSelectedSlot(null) }}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeZone === z.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                  }`}
              >
                {z.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2">
              <button onClick={() => setZoom(z => Math.max(0.7, z - 0.1))} className="p-1.5 text-gray-500 hover:text-gray-800"><ZoomOut size={16} /></button>
              <span className="text-xs font-semibold text-gray-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1.5 text-gray-500 hover:text-gray-800"><ZoomIn size={16} /></button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex gap-3 mb-4">
            {[
              { label: 'Tổng ô', value: totalSlots, color: 'text-gray-800' },
              { label: 'Trống', value: availableCount, color: 'text-green-600' },
              { label: 'Đã đỗ', value: occupiedCount, color: 'text-red-600' },
              { label: 'Đã đặt', value: reservedCount, color: 'text-orange-500' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-lg border border-gray-100 px-4 py-2 text-center shadow-sm flex-1">
                <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-500 font-semibold">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1 overflow-auto">
            <div className="h-6 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center mb-4">
              <span className="text-xs text-gray-400 font-semibold tracking-widest">◀ LỐI VÀO / RA ▶</span>
            </div>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s' }}>
              {zone?.rows.map((row, ri) => (
                <div key={`row-${ri}`} className="flex gap-2 mb-2 justify-center">
                  {row.map(slotCode => {
                    const st = getStatus(slotCode)
                    const cfg = STATUS_CONFIG[st] || STATUS_CONFIG.available
                    const isSelected = selectedSlot?.id === slotCode
                    return (
                      <button
                        key={`slot-${slotCode}`}
                        onClick={() => handleSelectSlot(slotCode)}
                        className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center
                          transition-all hover:scale-110 hover:shadow-md ${isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110'
                            : `${cfg.bg} ${cfg.border} ${cfg.text}`
                          }`}
                        title={`${slotCode} – ${cfg.label}`}
                      >
                        <span className="font-bold text-xs">{slotCode}</span>
                        {st === 'occupied' && <Car size={10} className="mt-0.5 opacity-70" />}
                        {st === 'available' && <span className="text-[8px] opacity-50 font-semibold">TRỐNG</span>}
                        {st === 'reserved' && <span className="text-[8px] font-bold opacity-70">ĐẶT</span>}
                        {st === 'maintenance' && <span className="text-[8px] font-bold opacity-70">BT</span>}
                        {st === 'blocked' && <span className="text-[8px] font-bold opacity-70">KH</span>}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 flex flex-col gap-4">
          {selectedSlot ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-left">
              <h3 className="text-sm font-bold text-gray-600 uppercase mb-4 border-b pb-2">Chi tiết ô đỗ</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-black text-blue-600">{selectedSlot.id}</div>
                <div className="text-xs text-gray-400 mt-1">{selectedSlot.zone}</div>
              </div>
              <div className={`text-center py-2 px-3 rounded-lg font-bold text-sm mb-4
                ${STATUS_CONFIG[selectedSlot.status]?.bg}
                ${STATUS_CONFIG[selectedSlot.status]?.text}
                border ${STATUS_CONFIG[selectedSlot.status]?.border}`}>
                {STATUS_CONFIG[selectedSlot.status]?.label.toUpperCase()}
              </div>
              {selectedSlot.details && (
                <div className="text-xs text-gray-600 space-y-1">
                  {selectedSlot.details.DriverName && <p><strong>Người gửi:</strong> {selectedSlot.details.DriverName}</p>}
                  {selectedSlot.details.DriverEmail && <p><strong>Email:</strong> {selectedSlot.details.DriverEmail}</p>}
                  {selectedSlot.details.DriverPhone && <p><strong>Phone:</strong> {selectedSlot.details.DriverPhone}</p>}
                  {selectedSlot.details.StartTime && <p><strong>Bắt đầu:</strong> {new Date(selectedSlot.details.StartTime).toLocaleString()}</p>}
                  {selectedSlot.details.EndTime && <p><strong>Dự kiến ra:</strong> {new Date(selectedSlot.details.EndTime).toLocaleString()}</p>}
                  {selectedSlot.details.BookingCode && <p><strong>Mã booking:</strong> {selectedSlot.details.BookingCode}</p>}
                  {selectedSlot.details.SessionCode && <p><strong>Mã session:</strong> {selectedSlot.details.SessionCode}</p>}
                  {selectedSlot.details.PaymentStatus && <p><strong>Thanh toán:</strong> {selectedSlot.details.PaymentStatus}</p>}
                  {selectedSlot.details.FinalAmount != null && (
                    <p><strong>Tổng phí:</strong> {selectedSlot.details.FinalAmount.toLocaleString()} VND</p>
                  )}
                  {selectedSlot.details.SurchargeAmount > 0 && (
                    <p><strong>Phụ trội:</strong> {selectedSlot.details.SurchargeAmount.toLocaleString()} VND</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <Info size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nhấn vào một ô đỗ để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StaffParkingMap