import React, { useState } from 'react'
import { Map, RefreshCcw, Car, Bike, Info, ZoomIn, ZoomOut } from 'lucide-react'

const ZONES = [
  {
    id: 'A',
    label: 'Khu A – Tầng B1',
    rows: [
      ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10'],
      ['A11', 'A12', 'A13', 'A14', 'A15', 'A16', 'A17', 'A18', 'A19', 'A20'],
      ['A21', 'A22', 'A23', 'A24', 'A25', 'A26', 'A27', 'A28', 'A29', 'A30']
    ],
    statuses: {
      A01: 'occupied', A02: 'occupied', A03: 'available', A04: 'reserved', A05: 'available',
      A06: 'occupied', A07: 'available', A08: 'available', A09: 'occupied', A10: 'available',
      A11: 'available', A12: 'selected', A13: 'occupied', A14: 'available', A15: 'reserved',
      A16: 'available', A17: 'occupied', A18: 'available', A19: 'available', A20: 'occupied',
      A21: 'maintenance', A22: 'maintenance', A23: 'available', A24: 'available', A25: 'occupied',
      A26: 'available', A27: 'available', A28: 'occupied', A29: 'available', A30: 'available'
    }
  },
  {
    id: 'B',
    label: 'Khu B – Tầng B2',
    rows: [
      ['B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10'],
      ['B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19', 'B20']
    ],
    statuses: {
      B01: 'occupied', B02: 'available', B03: 'available', B04: 'occupied', B05: 'occupied',
      B06: 'reserved', B07: 'available', B08: 'occupied', B09: 'available', B10: 'available',
      B11: 'available', B12: 'occupied', B13: 'available', B14: 'reserved', B15: 'available',
      B16: 'available', B17: 'maintenance', B18: 'occupied', B19: 'available', B20: 'available'
    }
  },
  {
    id: 'M',
    label: 'Khu M – Xe máy',
    rows: [
      ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10']
    ],
    statuses: {
      M01: 'occupied', M02: 'occupied', M03: 'occupied', M04: 'available', M05: 'available',
      M06: 'occupied', M07: 'available', M08: 'occupied', M09: 'available', M10: 'available'
    }
  }
]

const STATUS_CONFIG = {
  available:    { label: 'Trống', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  occupied:     { label: 'Đã đỗ', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700' },
  reserved:     { label: 'Đã đặt', bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700' },
  maintenance:  { label: 'Bảo trì', bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-500' },
  selected:     { label: 'Đang xem', bg: 'bg-blue-600', border: 'border-blue-600', text: 'text-white' }
}

const StaffParkingMap = () => {
  const [activeZone, setActiveZone] = useState('A')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [zoom, setZoom] = useState(1)

  const zone = ZONES.find(z => z.id === activeZone)

  const getStatus = (slotId) => zone.statuses[slotId] || 'available'

  const totalSlots = Object.keys(zone.statuses).length
  const availableCount = Object.values(zone.statuses).filter(s => s === 'available').length
  const occupiedCount = Object.values(zone.statuses).filter(s => s === 'occupied').length
  const reservedCount = Object.values(zone.statuses).filter(s => s === 'reserved').length

  const selectedInfo = selectedSlot ? {
    id: selectedSlot,
    status: getStatus(selectedSlot),
    zone: activeZone
  } : null

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
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
          <RefreshCcw size={15} /> Làm mới
        </button>
      </header>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Map panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Zone tabs */}
          <div className="flex gap-2 mb-4">
            {ZONES.map(z => (
              <button
                key={z.id}
                onClick={() => { setActiveZone(z.id); setSelectedSlot(null) }}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  activeZone === z.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                }`}
              >
                {z.label}
              </button>
            ))}
            {/* Zoom */}
            <div className="ml-auto flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2">
              <button onClick={() => setZoom(z => Math.max(0.7, z - 0.1))} className="p-1.5 text-gray-500 hover:text-gray-800">
                <ZoomOut size={16} />
              </button>
              <span className="text-xs font-semibold text-gray-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1.5 text-gray-500 hover:text-gray-800">
                <ZoomIn size={16} />
              </button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex gap-3 mb-4">
            {[
              { label: 'Tổng ô', value: totalSlots, color: 'text-gray-800' },
              { label: 'Trống', value: availableCount, color: 'text-green-600' },
              { label: 'Đã đỗ', value: occupiedCount, color: 'text-red-600' },
              { label: 'Đã đặt', value: reservedCount, color: 'text-orange-500' }
            ].map(item => (
              <div key={item.label} className="bg-white rounded-lg border border-gray-100 px-4 py-2 text-center shadow-sm flex-1">
                <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-500 font-semibold">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1 overflow-auto">
            {/* Road lane */}
            <div className="h-6 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center mb-4">
              <span className="text-xs text-gray-400 font-semibold tracking-widest">◀ LỐI VÀO / RA ▶</span>
            </div>

            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s' }}>
              {zone.rows.map((row, ri) => (
                <div key={ri} className="flex gap-2 mb-2 justify-center">
                  {row.map(slotId => {
                    const st = getStatus(slotId)
                    const cfg = STATUS_CONFIG[st]
                    const isSelected = selectedSlot === slotId
                    return (
                      <button
                        key={slotId}
                        onClick={() => setSelectedSlot(isSelected ? null : slotId)}
                        className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all hover:scale-110 hover:shadow-md ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110'
                            : `${cfg.bg} ${cfg.border} ${cfg.text}`
                        }`}
                        title={`${slotId} – ${cfg.label}`}
                      >
                        <span className="font-bold text-xs">{slotId}</span>
                        {(st === 'occupied') && <Car size={10} className="mt-0.5 opacity-70" />}
                        {(st === 'available') && <span className="text-[8px] opacity-50 font-semibold">TRỐNG</span>}
                        {(st === 'reserved') && <span className="text-[8px] font-bold opacity-70">ĐẶT</span>}
                        {(st === 'maintenance') && <span className="text-[8px] font-bold opacity-70">BT</span>}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Road lane bottom */}
            <div className="h-6 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center mt-4">
              <span className="text-xs text-gray-400 font-semibold tracking-widest">◀ LỐI RA ▶</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded border ${cfg.bg} ${cfg.border}`} />
                <span className="text-xs text-gray-600 font-medium">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar – slot detail */}
        <div className="w-64 flex flex-col gap-4">
          {selectedInfo ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-600 uppercase mb-4 border-b pb-2">Chi tiết ô đỗ</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-black text-blue-600">{selectedInfo.id}</div>
                <div className="text-xs text-gray-400 mt-1">Khu {selectedInfo.zone}</div>
              </div>
              <div className={`text-center py-2 px-3 rounded-lg font-bold text-sm mb-4 ${STATUS_CONFIG[selectedInfo.status].bg} ${STATUS_CONFIG[selectedInfo.status].text} border ${STATUS_CONFIG[selectedInfo.status].border}`}>
                {STATUS_CONFIG[selectedInfo.status].label.toUpperCase()}
              </div>
              {selectedInfo.status === 'occupied' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Biển số:</span><span className="font-bold">51G-123.45</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Loại xe:</span><span className="font-bold">Ô tô 4 chỗ</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Vào lúc:</span><span className="font-bold">10:30</span></div>
                </div>
              )}
              {selectedInfo.status === 'reserved' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Booking:</span><span className="font-bold">BK-8829</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Hẹn vào:</span><span className="font-bold">11:00</span></div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center">
              <Info size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nhấn vào một ô đỗ để xem chi tiết</p>
            </div>
          )}

          {/* Quick stats card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Tổng quan bãi</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Công suất sử dụng</span>
                <span className="text-sm font-bold text-gray-800">
                  {Math.round((occupiedCount / totalSlots) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(occupiedCount / totalSlots) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 pt-1">Cập nhật: {new Date().toLocaleTimeString('vi-VN')}</p>
            </div>
          </div>

          {/* Vehicle type info */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Phân loại phương tiện</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg"><Car size={16} className="text-blue-600" /></div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-700">Ô tô</p>
                  <p className="text-xs text-gray-400">Khu A, B</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg"><Bike size={16} className="text-green-600" /></div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-700">Xe máy</p>
                  <p className="text-xs text-gray-400">Khu M</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffParkingMap
