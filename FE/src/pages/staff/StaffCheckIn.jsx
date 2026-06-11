// src/pages/Staff/StaffCheckIn.jsx
import React, { useState, useEffect, useCallback } from 'react'
import {
  Info, Search, CheckCircle2, AlertCircle, MapPin, Plus,
  ChevronRight, FileText, Calendar, Loader2, RefreshCcw, Car
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import staffApi from '../../apis/staffApi'

// ── Slot status helper ────────────────────────────────────────
const SLOT_STATUS_STYLE = {
  Available: 'bg-white border-gray-300 text-gray-600 hover:border-blue-400',
  Occupied: 'bg-red-50 border-red-200 text-red-700 cursor-not-allowed',
  Reserved: 'bg-orange-50 border-orange-400 text-orange-600 border-dashed',
  Maintenance: 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed',
  Blocked: 'bg-gray-800 border-gray-800 text-white cursor-not-allowed'
}

const formatVND = (v) => Number(v || 0).toLocaleString('vi-VN')

// ── Walk-in content ───────────────────────────────────────────
const WalkInContent = () => {
  const navigate = useNavigate()

  // Form state
  const [plateNumber, setPlateNumber] = useState('')
  const [vehicleTypeId, setVehicleTypeId] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [note, setNote] = useState('')

  // Data
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [slots, setSlots] = useState([])
  const [suggestedSlot, setSuggestedSlot] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [mapParams, setMapParams] = useState({})

  // Load vehicle types
  useEffect(() => {
    staffApi.getVehicleTypes()
      .then(res => {
        if (res.success) {
          setVehicleTypes(res.data)
          if (res.data.length > 0) setVehicleTypeId(String(res.data[0].VehicleTypeID))
        }
      })
      .catch(() => toast.error('Không tải được loại phương tiện'))
  }, [])

  // Load parking map when vehicleTypeId changes
  const loadSlots = useCallback(async () => {
    if (!vehicleTypeId) return
    setLoading(true)
    try {
      const res = await staffApi.getParkingMap({ vehicleTypeId, status: 'all' })
      if (res.success) {
        setSlots(res.data)
        // Suggest first available slot
        const first = res.data.find(s => s.SlotStatus === 'Available')
        setSuggestedSlot(first || null)
        if (first && !selectedSlotId) setSelectedSlotId(first.SlotID)
      }
    } catch {
      toast.error('Không tải được sơ đồ bãi đỗ')
    } finally {
      setLoading(false)
    }
  }, [vehicleTypeId])

  useEffect(() => { loadSlots() }, [loadSlots])

  const handleSubmit = async () => {
    if (!plateNumber.trim()) return toast.error('Vui lòng nhập biển số xe')
    if (!vehicleTypeId) return toast.error('Vui lòng chọn loại phương tiện')
    if (!selectedSlotId) return toast.error('Vui lòng chọn ô đỗ xe')

    setSubmitting(true)
    try {
      const res = await staffApi.createWalkInSession({
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleTypeId: Number(vehicleTypeId),
        slotId: selectedSlotId
      })
      if (res.success) {
        toast.success('Check-in thành công!')
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
      toast.error(err.response?.data?.message || 'Check-in thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  // Group slots by zone for display
  const slotGroups = slots.reduce((acc, s) => {
    const key = `${s.BuildingName} · ${s.FloorName} · ${s.ZoneName}`
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  const availableCount = slots.filter(s => s.SlotStatus === 'Available').length

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24 animate-in fade-in">
      <div className="flex gap-6 flex-1 flex-col xl:flex-row">
        {/* Form */}
        <div className="flex-[2] bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Info size={20} className="text-blue-500" /> Thông tin xe vào bãi
          </h3>
          <p className="text-sm text-gray-500 mb-6">Nhập chính xác biển số và loại phương tiện.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Biển số xe <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={plateNumber}
                onChange={e => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="51F-123.45"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Loại phương tiện <span className="text-red-500">*</span></label>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú (tùy chọn)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Nhập ghi chú nếu xe có hư hỏng..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Slot grid */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700">Chọn ô đỗ <span className="text-green-600">({availableCount} trống)</span></h4>
              <button onClick={loadSlots} disabled={loading} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} /> Làm mới
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-500" size={24} /></div>
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
                          title={`${slot.SlotCode} – ${slot.SlotStatus}`}
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
                ['bg-white border-gray-300', 'Trống'],
                ['bg-red-50 border-red-200', 'Có xe'],
                ['bg-orange-50 border-orange-400 border-dashed', 'Đã đặt'],
                ['bg-gray-100 border-gray-300', 'Bảo trì'],
                ['bg-blue-600 border-blue-600', 'Đang chọn']
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
              <MapPin size={20} className="text-blue-500" /> Gợi ý vị trí tối ưu
            </h3>
            <p className="text-sm text-blue-700 mb-6">Hệ thống tìm kiếm vị trí trống gần nhất.</p>

            {suggestedSlot ? (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-3 text-center">
                  <div className="text-xs text-blue-500 font-bold uppercase mb-1">Khu vực</div>
                  <div className="text-lg font-black text-blue-900">{suggestedSlot.ZoneName?.split(' ')[0]}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-3 text-center">
                  <div className="text-xs text-blue-500 font-bold uppercase mb-1">Tầng</div>
                  <div className="text-lg font-black text-blue-900">{suggestedSlot.FloorName}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-3 text-center">
                  <div className="text-xs text-blue-500 font-bold uppercase mb-1">Mã ô</div>
                  <div className="text-lg font-black text-blue-900">{suggestedSlot.SlotCode}</div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-4 text-center text-gray-400 text-sm mb-6">
                {loading ? 'Đang tìm ô trống...' : 'Không có ô trống phù hợp'}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {suggestedSlot && (
              <button
                onClick={() => setSelectedSlotId(suggestedSlot.SlotID)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2"
              >
                <CheckCircle2 size={18} /> Sử dụng vị trí này
              </button>
            )}
            <button onClick={loadSlots} className="w-full py-3 bg-transparent border border-blue-300 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition-all">
              Làm mới sơ đồ
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 gap-4 md:gap-0">
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase">Biển số xe</span>
              <p className="font-black text-gray-800">{plateNumber || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-semibold uppercase">Ô đỗ</span>
              <p className="font-bold text-gray-800">
                {selectedSlotId ? slots.find(s => s.SlotID === selectedSlotId)?.SlotCode || '—' : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setPlateNumber(''); setSelectedSlotId(suggestedSlot?.SlotID || null) }}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !plateNumber || !selectedSlotId}
              className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Xác nhận Check-in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Booking content ───────────────────────────────────────────
const BookingContent = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Reserved')
  const [keyword, setKeyword] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  const loadBookings = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (activeTab !== 'all') params.status = activeTab
      if (keyword.trim()) params.keyword = keyword.trim()
      const res = await staffApi.getBookingQueue(params)
      if (res.success) setBookings(res.data)
    } catch {
      toast.error('Không tải được danh sách booking')
    } finally {
      setLoading(false)
    }
  }, [activeTab, keyword])

  useEffect(() => { loadBookings() }, [loadBookings])

  const tabs = [
    { name: 'Reserved', label: 'Đang chờ' },
    { name: 'Completed', label: 'Đã sử dụng' },
    { name: 'Cancelled', label: 'Đã hủy' },
    { name: 'Expired', label: 'Hết hạn' }
  ]

  const statusColor = {
    Reserved: 'bg-green-100 text-green-700',
    Completed: 'bg-gray-100 text-gray-600',
    Cancelled: 'bg-red-100 text-red-600',
    Expired: 'bg-orange-100 text-orange-700'
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 animate-in fade-in space-y-6">
      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Tìm kiếm nhanh lượt đặt</h2>
        <p className="text-sm text-gray-500 mb-4">Nhập biển số hoặc mã đặt chỗ để check-in nhanh.</p>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadBookings()}
              placeholder="Biển số hoặc BK-XXXX"
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
          <button onClick={loadBookings} disabled={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50">
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab.name ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-500" size={24} />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Không có booking nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Mã</th>
                  <th className="py-3 px-4">Chủ xe</th>
                  <th className="py-3 px-4">Loại xe</th>
                  <th className="py-3 px-4">Vị trí</th>
                  <th className="py-3 px-4">Bắt đầu</th>
                  <th className="py-3 px-4">Kết thúc</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
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
                          Xử lý
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
  const [searchParams] = useSearchParams()
  const [activeType, setActiveType] = useState(searchParams.get('tab') === 'booking' ? 'booking' : 'walkin')

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Check In Phương Tiện</h1>
          <p className="text-sm text-gray-500 mt-1">Ghi nhận thông tin xe vào bãi</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-sm font-medium">
          <div className="w-2 h-2 rounded-full bg-green-500" /> Cổng vào: Gate A (Main)
        </div>
      </header>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveType('walkin')}
          className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeType === 'walkin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FileText size={18} /> Khách vãng lai (Walk-in)
        </button>
        <button
          onClick={() => setActiveType('booking')}
          className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeType === 'booking' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Calendar size={18} /> Khách đặt trước (Booking)
        </button>
      </div>

      <div className="flex-1">
        {activeType === 'walkin' ? <WalkInContent /> : <BookingContent />}
      </div>
    </div>
  )
}

export default StaffCheckIn