import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  MapPin,
  Car,
  Clock,
  Info,
  CheckCircle2,
  Building,
  CreditCard,
  AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import authorizeAxios from '../../utils/authorizeAxios'

const VEHICLE_TYPES = [
  { value: 'CAR', label: 'Ô tô' },
  { value: 'MOTO', label: 'Xe máy' },
  { value: 'TRUCK', label: 'Xe tải' }
]

const DURATIONS = [
  { value: '4h', label: '4 Giờ', price: 60000 },
  { value: '8h', label: '8 Giờ', price: 100000 },
  { value: '24h', label: 'Cả ngày', price: 180000 }
]

const DEFAULT_BUILDINGS = [{ value: '1', label: 'Toa A' }]

const padNumber = (value) => String(value).padStart(2, '0')

const getTodayDateValue = () => {
  const now = new Date()
  return `${now.getFullYear()}-${padNumber(now.getMonth() + 1)}-${padNumber(now.getDate())}`
}

const getMinimumStartDate = () => {
  const minimum = new Date(Date.now() + 15 * 60 * 1000)

  if (minimum.getSeconds() > 0 || minimum.getMilliseconds() > 0) {
    minimum.setMinutes(minimum.getMinutes() + 1)
  }

  minimum.setSeconds(0)
  minimum.setMilliseconds(0)

  return minimum
}

const getMinimumStartTimeValue = () => {
  const minimum = getMinimumStartDate()
  return `${padNumber(minimum.getHours())}:${padNumber(minimum.getMinutes())}`
}

const isToday = (dateValue) => dateValue === getTodayDateValue()

const buildLocalDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return null

  const [year, month, day] = dateValue.split('-').map(Number)
  const [hour, minute] = timeValue.split(':').map(Number)

  const date = new Date(year, month - 1, day, hour, minute, 0, 0)

  if (Number.isNaN(date.getTime())) return null

  return date
}

const isStartTimeValid = (dateValue, timeValue) => {
  const selected = buildLocalDateTime(dateValue, timeValue)

  if (!selected) return false

  return selected >= getMinimumStartDate()
}

const getMinutesDiff = (dateValue, timeValueA, timeValueB) => {
  const dateA = buildLocalDateTime(dateValue, timeValueA)
  const dateB = buildLocalDateTime(dateValue, timeValueB)

  if (!dateA || !dateB) return 0

  return Math.abs(Math.floor((dateA.getTime() - dateB.getTime()) / 60000))
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value || 0)
}

const getOptionLabel = (options, value) => {
  return options.find((item) => String(item.value) === String(value))?.label || value
}

const uniqueBy = (items, keyGetter) => {
  const map = new Map()

  items.forEach((item) => {
    const key = keyGetter(item)

    if (!map.has(key)) {
      map.set(key, item)
    }
  })

  return Array.from(map.values())
}

const DriverBooking = () => {
  const navigate = useNavigate()
  const latestSlotRequestRef = useRef(0)

  const [buildingOptions, setBuildingOptions] = useState(DEFAULT_BUILDINGS)
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlotId, setSelectedSlotId] = useState(null)

  const [licensePlate, setLicensePlate] = useState('51K-123.45')
  const [vehicleType, setVehicleType] = useState('CAR')
  const [bookingDate, setBookingDate] = useState(getTodayDateValue())
  const [startTime, setStartTime] = useState(getMinimumStartTimeValue())
  const [isStartTimeTouched, setIsStartTimeTouched] = useState(false)
  const [duration, setDuration] = useState('4h')
  const [buildingId, setBuildingId] = useState('1')
  const [floorId, setFloorId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [autoSelect, setAutoSelect] = useState(true)

  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const selectedDuration = DURATIONS.find((item) => item.value === duration)
  const temporaryPrice = selectedDuration?.price || 0

  const isBookingTimeValid = isStartTimeValid(bookingDate, startTime)

  const floorOptions = useMemo(() => {
    return uniqueBy(
      availableSlots.map((slot) => ({
        value: String(slot.FloorID),
        label: slot.FloorName
      })),
      (item) => item.value
    )
  }, [availableSlots])

  const zoneOptions = useMemo(() => {
    const scopedSlots = floorId
      ? availableSlots.filter((slot) => String(slot.FloorID) === String(floorId))
      : availableSlots

    return uniqueBy(
      scopedSlots.map((slot) => ({
        value: String(slot.ZoneID),
        label: slot.ZoneName
      })),
      (item) => item.value
    )
  }, [availableSlots, floorId])

  const filteredSlots = useMemo(() => {
    return availableSlots.filter((slot) => {
      const matchFloor = !floorId || String(slot.FloorID) === String(floorId)
      const matchZone = !zoneId || String(slot.ZoneID) === String(zoneId)

      return matchFloor && matchZone
    })
  }, [availableSlots, floorId, zoneId])

  const displaySlots = useMemo(() => {
    return filteredSlots.map((slot) => {
      if (slot.DisplayStatus !== 'available') {
        return {
          ...slot,
          uiStatus: 'occupied'
        }
      }

      if (slot.SlotID === selectedSlotId) {
        return {
          ...slot,
          uiStatus: 'selected'
        }
      }

      return {
        ...slot,
        uiStatus: 'available'
      }
    })
  }, [filteredSlots, selectedSlotId])

  const selectedSlot = useMemo(() => {
    return availableSlots.find((slot) => slot.SlotID === selectedSlotId) || null
  }, [availableSlots, selectedSlotId])

  const fetchBuildings = async () => {
    try {
      const response = await authorizeAxios.get('/buildings')
      const buildings = response.data?.data || []

      if (buildings.length > 0) {
        setBuildingOptions(
          buildings.map((building) => ({
            value: String(building.BuildingID),
            label: building.BuildingName
          }))
        )

        const currentBuildingExists = buildings.some(
          (building) => String(building.BuildingID) === String(buildingId)
        )

        if (!currentBuildingExists) {
          setBuildingId(String(buildings[0].BuildingID))
        }
      }
    } catch (error) {
      console.error('Get buildings failed:', error)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!buildingId || !vehicleType || !bookingDate || !startTime || !duration) {
      setAvailableSlots([])
      setFloorId('')
      setZoneId('')
      setSelectedSlotId(null)
      return
    }

    if (!isStartTimeValid(bookingDate, startTime)) {
      setAvailableSlots([])
      setFloorId('')
      setZoneId('')
      setSelectedSlotId(null)
      return
    }

    const requestId = latestSlotRequestRef.current + 1
    latestSlotRequestRef.current = requestId

    try {
      setIsLoadingSlots(true)
      setErrorMessage('')

      const response = await authorizeAxios.get('/reservations/available-slots', {
        params: {
          buildingId,
          vehicleType,
          bookingDate,
          startTime,
          duration
        }
      })

      if (requestId !== latestSlotRequestRef.current) {
        return
      }

      const data = response.data?.data || []

      setAvailableSlots(data)

      if (data.length === 0) {
        setFloorId('')
        setZoneId('')
        setSelectedSlotId(null)
        return
      }

      const firstFloorId = String(data[0].FloorID)

      const firstZoneInFloor = data.find(
        (slot) => String(slot.FloorID) === firstFloorId
      )

      const firstZoneId = firstZoneInFloor
        ? String(firstZoneInFloor.ZoneID)
        : String(data[0].ZoneID)

      setFloorId(firstFloorId)
      setZoneId(firstZoneId)

      const scopedSlots = data.filter(
        (slot) =>
          String(slot.FloorID) === firstFloorId &&
          String(slot.ZoneID) === firstZoneId
      )

      const nearestAvailable =
        scopedSlots.find((slot) => slot.DisplayStatus === 'available') ||
        data.find((slot) => slot.DisplayStatus === 'available')

      setSelectedSlotId(nearestAvailable?.SlotID || null)
    } catch (error) {
      if (requestId !== latestSlotRequestRef.current) {
        return
      }

      console.error('Get available slots failed:', error)

      const message =
        error.response?.data?.message ||
        'Không thể tải sơ đồ vị trí trống từ database.'

      setErrorMessage(message)
      setAvailableSlots([])
      setFloorId('')
      setZoneId('')
      setSelectedSlotId(null)
    } finally {
      if (requestId === latestSlotRequestRef.current) {
        setIsLoadingSlots(false)
      }
    }
  }

  useEffect(() => {
    void Promise.resolve().then(fetchBuildings)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void Promise.resolve().then(fetchAvailableSlots)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId, vehicleType, bookingDate, startTime, duration])

  useEffect(() => {
    const timer = setInterval(() => {
      const today = getTodayDateValue()
      const minimumTime = getMinimumStartTimeValue()

      if (bookingDate !== today) return

      const currentStartIsValid = isStartTimeValid(bookingDate, startTime)

      if (!currentStartIsValid) {
        setStartTime(minimumTime)
        setIsStartTimeTouched(false)
        return
      }

      if (!isStartTimeTouched) {
        setStartTime(minimumTime)
        return
      }

      const diffMinutes = getMinutesDiff(bookingDate, startTime, minimumTime)

      if (diffMinutes <= 1) {
        setStartTime(minimumTime)
        setIsStartTimeTouched(false)
      }
    }, 30000)

    return () => clearInterval(timer)
  }, [bookingDate, startTime, isStartTimeTouched])

  useEffect(() => {
    if (!autoSelect) return undefined

    const selectedVisible = filteredSlots.some(
      (slot) =>
        slot.SlotID === selectedSlotId &&
        slot.DisplayStatus === 'available'
    )

    if (selectedVisible) return undefined

    const scopedNearestAvailable = filteredSlots.find(
      (slot) => slot.DisplayStatus === 'available'
    )

    const globalNearestAvailable = availableSlots.find(
      (slot) => slot.DisplayStatus === 'available'
    )

    const nextSelectedSlotId =
      scopedNearestAvailable?.SlotID ||
      globalNearestAvailable?.SlotID ||
      null

    if (nextSelectedSlotId === selectedSlotId) return undefined

    let cancelled = false

    queueMicrotask(() => {
      if (!cancelled) {
        setSelectedSlotId(nextSelectedSlotId)
      }
    })

    return () => {
      cancelled = true
    }
  }, [autoSelect, filteredSlots, availableSlots, selectedSlotId])

  const handleChangeDate = (event) => {
    const value = event.target.value
    const today = getTodayDateValue()

    if (value < today) {
      setBookingDate(today)
      setStartTime(getMinimumStartTimeValue())
      setIsStartTimeTouched(false)
      setErrorMessage('Không thể chọn ngày trong quá khứ.')
      return
    }

    setBookingDate(value)

    if (value === today) {
      const minimumTime = getMinimumStartTimeValue()

      if (!isStartTimeValid(value, startTime)) {
        setStartTime(minimumTime)
        setIsStartTimeTouched(false)
      }
    }

    setErrorMessage('')
  }

  const handleChangeStartTime = (event) => {
    const value = event.target.value
    const minimumTime = getMinimumStartTimeValue()

    setIsStartTimeTouched(true)

    if (isToday(bookingDate) && !isStartTimeValid(bookingDate, value)) {
      setStartTime(minimumTime)
      setIsStartTimeTouched(false)
      setErrorMessage('Giờ bắt đầu đã được tự động cập nhật để cách hiện tại tối thiểu 15 phút.')
      return
    }

    setStartTime(value)
    setErrorMessage('')
  }

  const handleChangeBuilding = (event) => {
    setBuildingId(event.target.value)

    latestSlotRequestRef.current += 1

    setAvailableSlots([])
    setFloorId('')
    setZoneId('')
    setSelectedSlotId(null)
    setErrorMessage('')
  }

  const handleChangeVehicleType = (event) => {
    setVehicleType(event.target.value)

    latestSlotRequestRef.current += 1

    setAvailableSlots([])
    setFloorId('')
    setZoneId('')
    setSelectedSlotId(null)
    setErrorMessage('')
  }

  const handleChangeFloor = (event) => {
    const newFloorId = event.target.value

    setFloorId(newFloorId)

    const firstZoneInFloor = availableSlots.find(
      (slot) => String(slot.FloorID) === String(newFloorId)
    )

    const newZoneId = firstZoneInFloor ? String(firstZoneInFloor.ZoneID) : ''

    setZoneId(newZoneId)

    const scopedSlots = availableSlots.filter(
      (slot) =>
        String(slot.FloorID) === String(newFloorId) &&
        String(slot.ZoneID) === String(newZoneId)
    )

    const nearestAvailable = scopedSlots.find(
      (slot) => slot.DisplayStatus === 'available'
    )

    setSelectedSlotId(nearestAvailable?.SlotID || null)
  }

  const handleChangeZone = (event) => {
    const newZoneId = event.target.value

    setZoneId(newZoneId)

    const scopedSlots = availableSlots.filter(
      (slot) =>
        String(slot.FloorID) === String(floorId) &&
        String(slot.ZoneID) === String(newZoneId)
    )

    const nearestAvailable = scopedSlots.find(
      (slot) => slot.DisplayStatus === 'available'
    )

    setSelectedSlotId(nearestAvailable?.SlotID || null)
  }

  const handleAutoSelectChange = (event) => {
    const checked = event.target.checked
    setAutoSelect(checked)

    if (checked) {
      const scopedNearestAvailable = filteredSlots.find(
        (slot) => slot.DisplayStatus === 'available'
      )

      const globalNearestAvailable = availableSlots.find(
        (slot) => slot.DisplayStatus === 'available'
      )

      setSelectedSlotId(
        scopedNearestAvailable?.SlotID ||
        globalNearestAvailable?.SlotID ||
        null
      )
    }
  }

  const handleSelectSlot = (slot) => {
    if (slot.uiStatus === 'occupied') return

    setSelectedSlotId(slot.SlotID)
    setAutoSelect(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!licensePlate.trim()) {
      setErrorMessage('Vui lòng nhập biển số xe.')
      return
    }

    if (!isStartTimeValid(bookingDate, startTime)) {
      const minimumTime = getMinimumStartTimeValue()
      setStartTime(minimumTime)
      setIsStartTimeTouched(false)
      setErrorMessage('Thời gian đặt chỗ đã được cập nhật. Vui lòng bấm xác nhận lại.')
      return
    }

    if (!selectedSlotId) {
      setErrorMessage('Vui lòng chọn một vị trí đỗ xe còn trống.')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await authorizeAxios.post('/reservations', {
        vehicleType,
        licensePlate: licensePlate.trim().toUpperCase(),
        bookingDate,
        startTime,
        duration,
        buildingId: Number(buildingId),
        slotId: selectedSlotId
      })

      console.log('CREATE RESERVATION RESPONSE:', response.data)

      const responseData = response.data?.data

      const reservation =
        responseData?.reservation ||
        responseData?.data?.reservation ||
        responseData?.data ||
        responseData ||
        response.data?.reservation ||
        response.data

      const reservationId =
        reservation?.ReservationID ||
        reservation?.reservationId ||
        reservation?.ReservationId ||
        reservation?.id

      if (!reservationId) {
        console.error('Không tìm thấy ReservationID trong response:', response.data)
        setErrorMessage(
          'Đặt chỗ thành công nhưng không lấy được mã đặt chỗ để chuyển sang trang xác nhận.'
        )
        return
      }

      navigate(`/driver/booking-confirmation?reservationId=${reservationId}`, {
        state: {
          reservationId,
          bookingCode: reservation?.BookingCode,
          parkingName: reservation?.BuildingName,
          address: reservation?.Address,
          licensePlate: licensePlate.trim().toUpperCase(),
          vehicleType,
          vehicleName: reservation?.VehicleName,
          floor: reservation?.FloorName,
          zone: reservation?.ZoneName,
          selectedSlot: reservation?.SlotCode,
          startTimeText: reservation?.StartTimeText,
          endTimeText: reservation?.EndTimeText,
          startClockText: reservation?.StartClockText,
          endClockText: reservation?.EndClockText,
          temporaryPrice,
          statusValue: reservation?.StatusValue || 'active',
          statusLabel: reservation?.StatusLabel || 'Đang hoạt động'
        }
      })
    } catch (error) {
      console.error('Create booking failed:', error)
      console.error('Create booking response:', error.response?.data)

      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        'Đặt chỗ thất bại. Vui lòng thử lại.'

      setErrorMessage(message)
      await fetchAvailableSlots()
    } finally {
      setIsSubmitting(false)
    }
  }

  const buildingLabel = getOptionLabel(buildingOptions, buildingId)
  const vehicleLabel = getOptionLabel(VEHICLE_TYPES, vehicleType)
  const durationLabel = getOptionLabel(DURATIONS, duration)

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-6xl animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Đặt chỗ đỗ xe mới
        </h1>
        <p className="text-sm text-gray-500">
          Chọn thời gian theo giờ Việt Nam, vị trí trống sẽ được tải trực tiếp từ database.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Clock size={20} />
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Thông tin đặt chỗ
                </h2>
                <p className="text-xs text-gray-500">
                  Giờ bắt đầu sẽ tự động bám theo thời gian hiện tại + 15 phút nếu bạn chưa chọn giờ xa hơn.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  Tòa nhà
                </label>
                <select
                  value={buildingId}
                  onChange={handleChangeBuilding}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {buildingOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  Biển số xe
                </label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(event) => setLicensePlate(event.target.value)}
                  placeholder="VD: 51K-123.45"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  Loại phương tiện
                </label>
                <select
                  value={vehicleType}
                  onChange={handleChangeVehicleType}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {VEHICLE_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-1 text-xs text-gray-500">
              <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
              <span>
                Nếu bạn để giờ bắt đầu ở mốc sớm nhất, hệ thống sẽ tự tăng theo thời gian thực để luôn hợp lệ.
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  Ngày đỗ
                </label>
                <div className="relative">
                  <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={bookingDate}
                    min={getTodayDateValue()}
                    onChange={handleChangeDate}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  Giờ bắt đầu
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={handleChangeStartTime}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  Thời lượng
                </label>
                <select
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  {DURATIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Sơ đồ vị trí trống
                </h2>
                <p className="text-xs text-gray-500">
                  {buildingLabel} - {selectedSlot?.FloorName || '--'} - {selectedSlot?.ZoneName || '--'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm border border-gray-200 bg-white" />
                  Trống
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm border border-gray-300 bg-gray-100" />
                  Đã đỗ / Đã giữ
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-sm border border-blue-500 bg-blue-50" />
                  Đang chọn
                </div>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <select
                value={floorId}
                onChange={handleChangeFloor}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:w-48"
                disabled={floorOptions.length === 0}
              >
                {floorOptions.length === 0 ? (
                  <option value="">Chọn tầng...</option>
                ) : (
                  floorOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))
                )}
              </select>

              <select
                value={zoneId}
                onChange={handleChangeZone}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
                disabled={zoneOptions.length === 0}
              >
                {zoneOptions.length === 0 ? (
                  <option value="">Chọn khu...</option>
                ) : (
                  zoneOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))
                )}
              </select>

              <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 sm:ml-auto">
                <input
                  type="checkbox"
                  checked={autoSelect}
                  onChange={handleAutoSelectChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Tự động chọn vị trí tối ưu
              </label>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-6">
              {isLoadingSlots ? (
                <div className="py-8 text-center text-sm font-semibold text-gray-500">
                  Đang tải vị trí từ database...
                </div>
              ) : displaySlots.length === 0 ? (
                <div className="py-8 text-center text-sm font-semibold text-gray-500">
                  Không có vị trí phù hợp trong thời gian này.
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3 md:grid-cols-10">
                  {displaySlots.map((slot) => (
                    <button
                      key={slot.SlotID}
                      type="button"
                      disabled={slot.uiStatus === 'occupied'}
                      onClick={() => handleSelectSlot(slot)}
                      className={`flex h-12 items-center justify-center rounded-lg border text-xs font-bold outline-none transition-all ${slot.uiStatus === 'occupied'
                        ? 'cursor-not-allowed border-gray-300 bg-gray-100 font-black text-gray-700 opacity-80'
                        : slot.uiStatus === 'selected'
                          ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm ring-2 ring-blue-100'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-500'
                      }`}
                    >
                      {slot.SlotCode}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Building size={24} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {buildingLabel}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedSlot?.Address || 'Địa chỉ bãi xe'}
                </p>
              </div>
            </div>

            <div className="w-fit rounded-lg border border-blue-100 bg-white px-4 py-2 text-xs font-bold text-blue-600 shadow-sm">
              Slot: {selectedSlot?.SlotCode || '--'}
            </div>
          </div>
        </div>

        <div>
          <div className="sticky top-6 rounded-2xl border-2 border-blue-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
              <CreditCard className="text-blue-500" size={20} />
              Tóm tắt đặt chỗ
            </h2>

            <div className="mb-6 space-y-4">
              <SummaryRow icon={<Building size={16} />} label="Tòa nhà" value={buildingLabel} />
              <SummaryRow icon={<Car size={16} />} label="Biển số xe" value={licensePlate || 'Chưa nhập'} />
              <SummaryRow label="Loại xe" value={vehicleLabel} />
              <SummaryRow icon={<Clock size={16} />} label="Thời gian vào" value={`${startTime} - ${bookingDate}`} />
              <SummaryRow label="Thời lượng" value={durationLabel} />

              <div className="flex items-center justify-between pb-2 text-sm">
                <span className="flex items-center gap-2 text-gray-500">
                  <MapPin size={16} />
                  Vị trí đỗ
                </span>

                <span className="rounded-md bg-blue-50 px-2 py-1 font-bold text-blue-600">
                  {selectedSlot?.FloorName || '--'} - {selectedSlot?.ZoneName || '--'} - {selectedSlot?.SlotCode || '--'}
                </span>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">
                  Giá tạm tính
                </span>

                <span className="text-xl font-black text-gray-900">
                  {formatCurrency(temporaryPrice)} VND
                </span>
              </div>

              <p className="text-right text-[10px] font-medium text-blue-500">
                Giá demo tạm tính
              </p>
            </div>

            <div className="mb-6 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-orange-800">
                <AlertCircle size={14} />
                Lưu ý
              </h4>

              <ul className="list-disc space-y-1.5 pl-4 text-[11px] font-medium text-orange-700 opacity-90">
                <li>Giờ bắt đầu tự cập nhật nếu đang ở mốc sớm nhất.</li>
                <li>Booking chỉ hết hạn khi EndTime nhỏ hơn giờ hiện tại của SQL Server.</li>
                <li>Khi staff check-in, xe chuyển sang phiên gửi hiện tại.</li>
              </ul>
            </div>

            {errorMessage && (
              <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isLoadingSlots || !selectedSlotId || !isBookingTimeValid}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 size={18} />
              {isSubmitting ? 'Đang đặt chỗ...' : 'Xác nhận đặt chỗ'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/driver/home')}
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 font-bold text-gray-600 transition-all hover:bg-gray-50"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

const SummaryRow = ({ icon, label, value }) => {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 pb-3 text-sm">
      <span className="flex items-center gap-2 text-gray-500">
        {icon}
        {label}
      </span>

      <span className="font-bold text-gray-900">{value}</span>
    </div>
  )
}

export default DriverBooking