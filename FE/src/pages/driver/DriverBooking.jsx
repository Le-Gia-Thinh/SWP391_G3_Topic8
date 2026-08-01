/**
 * FILE: DriverBooking.jsx
 * MÔ TẢ: Trang Đặt chỗ đỗ xe dành cho Driver.
 * Cho phép tài xế chọn tòa nhà, phương tiện, thời gian bắt đầu, thời lượng
 * và chọn ô đỗ (tự động hoặc thủ công) để tạo mới một lượt đặt chỗ (booking).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  MapPin,
  Car,
  Clock,
  Info,
  CheckCircle2,
  Building,
  CreditCard,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatPlateNumber } from '../../utils/formatters'
import authorizeAxios from '../../utils/authorizeAxios'


const DEFAULT_BUILDINGS = []

/**
 * Thêm số 0 vào trước số có 1 chữ số (vd: 9 -> '09')
 * @param {number|string} value Giá trị cần format
 * @returns {string} Chuỗi đã format
 */
const padNumber = (value) => String(value).padStart(2, '0')

const formatTimeDisplay = (t) => {
  if (!t) return ''
  if (typeof t === 'string' && t.includes('T')) {
    const d = new Date(t)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  if (typeof t === 'string') {
    return t.split(':').slice(0, 2).join(':')
  }
  return String(t)
}

/**
 * Lấy ngày hiện tại theo định dạng YYYY-MM-DD
 * @returns {string} Ngày hiện tại
 */
/**
 * Hàm xử lý logic: getTodayDateValue
 * Trả về chuỗi ngày hiện tại (YYYY-MM-DD).
 */
const getTodayDateValue = () => {
  const now = new Date()
  return `${now.getFullYear()}-${padNumber(now.getMonth() + 1)}-${padNumber(now.getDate())}`
}

const getDaysDiff = (d1, d2) => {
  if (!d1 || !d2) return 0
  const t1 = new Date(d1 + 'T00:00:00')
  const t2 = new Date(d2 + 'T00:00:00')
  return Math.max(0, Math.round((t2.getTime() - t1.getTime()) / (24 * 60 * 60 * 1000)))
}

/**
 * Tính toán thời gian bắt đầu tối thiểu cho phép (hiện tại + 15 phút)
 * Làm tròn lên phút tiếp theo nếu có số giây lẻ
 * @returns {Date} Thời gian tối thiểu
 */
/**
 * Hàm xử lý logic: getMinimumStartDate
 * Tính toán và trả về đối tượng Date đại diện cho thời gian tối thiểu được phép đặt chỗ
 * (thường là hiện tại cộng thêm 15 phút, làm tròn lên phút tiếp theo).
 */
const getMinimumStartDate = () => {
  const minimum = new Date(Date.now() + 15 * 60 * 1000)

  if (minimum.getSeconds() > 0 || minimum.getMilliseconds() > 0) {
    minimum.setMinutes(minimum.getMinutes() + 1)
  }

  minimum.setSeconds(0)
  minimum.setMilliseconds(0)

  return minimum
}

/**
 * Hàm xử lý logic: getMinimumStartTimeValue
 * Trả về chuỗi giờ:phút tối thiểu được phép đặt (HH:mm).
 */
const getMinimumStartTimeValue = () => {
  const minimum = getMinimumStartDate()
  return `${padNumber(minimum.getHours())}:${padNumber(minimum.getMinutes())}`
}

const isToday = (dateValue) => dateValue === getTodayDateValue()

/**
 * Chuyển đổi chuỗi ngày và giờ thành đối tượng Date của Javascript
 * @param {string} dateValue YYYY-MM-DD
 * @param {string} timeValue HH:mm
 * @returns {Date|null} Đối tượng Date
 */
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

/**
 * Hàm xử lý logic: getMinutesDiff
 * Tính khoảng cách thời gian (bằng phút) giữa 2 mốc thời gian (cùng 1 ngày).
 */
const getMinutesDiff = (dateValue, timeValueA, timeValueB) => {
  const dateA = buildLocalDateTime(dateValue, timeValueA)
  const dateB = buildLocalDateTime(dateValue, timeValueB)

  if (!dateA || !dateB) return 0

  return Math.abs(Math.floor((dateA.getTime() - dateB.getTime()) / 60000))
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value || 0)
}

/**
 * Hàm xử lý logic: getOptionLabel
 * Tìm kiếm và trả về chuỗi hiển thị (label) của một option dựa vào giá trị (value) cung cấp.
 */
const getOptionLabel = (options, value) => {
  return options.find((item) => String(item.value) === String(value))?.label || value
}

/**
 * Loại bỏ các phần tử trùng lặp trong mảng dựa vào một key
 * @param {Array} items Mảng đầu vào
 * @param {Function} keyGetter Hàm lấy giá trị khóa (key)
 * @returns {Array} Mảng đã lọc trùng lặp
 */
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
  const { t } = useTranslation()
  const navigate = useNavigate()
  const latestSlotRequestRef = useRef(0)

  const [buildingOptions, setBuildingOptions] = useState(DEFAULT_BUILDINGS)
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlotId, setSelectedSlotId] = useState(null)

  const [licensePlate, setLicensePlate] = useState('')
  const [vehicleType, setVehicleType] = useState('CAR')
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicleId, setSelectedVehicleId] = useState('manual')
  const [bookingDate, setBookingDate] = useState(getTodayDateValue())
  const [exitDate, setExitDate] = useState(getTodayDateValue())
  const [startTime, setStartTime] = useState(getMinimumStartTimeValue())
  const [isStartTimeTouched, setIsStartTimeTouched] = useState(false)
  const [duration, setDuration] = useState('4h')
  const [buildingId, setBuildingId] = useState('')
  const [floorId, setFloorId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [autoSelect, setAutoSelect] = useState(true)

  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [slotFilter, setSlotFilter] = useState('all')

  const [vehicleTypesList, setVehicleTypesList] = useState([])
  const [pricingPolicies, setPricingPolicies] = useState([])

  const activeVehicleTypeId = useMemo(() => {
    const found = vehicleTypesList.find(v => v.VehicleCode === vehicleType)
    return found ? found.VehicleTypeID : null
  }, [vehicleTypesList, vehicleType])

  const durations = useMemo(() => {
    if (!activeVehicleTypeId) return []

    const relevantPolicies = pricingPolicies
      .filter(p => p.VehicleTypeID === activeVehicleTypeId && !p.IsOvernight && p.MaxHours !== 999)
      .sort((a, b) => a.MaxHours - b.MaxHours)

    if (relevantPolicies.length === 0) return []

    const generated = []
    for (let i = 1; i <= 24; i++) {
      let policy = relevantPolicies.find(p => p.MaxHours >= i)
      if (!policy) {
        policy = pricingPolicies.find(p => p.VehicleTypeID === activeVehicleTypeId && !p.IsOvernight && p.MaxHours === 999)
      }
      if (!policy) policy = relevantPolicies[relevantPolicies.length - 1]

      generated.push({
        value: `${i}h`,
        label: `${i}h`,
        price: policy ? policy.Fee : 0
      })
    }
    return generated
  }, [pricingPolicies, activeVehicleTypeId])

  useEffect(() => {
    if (durations.length > 0 && !durations.some(d => d.value === duration)) {
      setDuration(durations[0].value)
    }
  }, [durations, duration])

  const selectedDuration = durations.find((item) => item.value === duration) || durations[0]

  const totalHours = useMemo(() => {
    const days = getDaysDiff(bookingDate, exitDate)
    const hours = parseInt(duration, 10) || 4
    return days * 24 + hours
  }, [bookingDate, exitDate, duration])

  const temporaryPrice = useMemo(() => {
    const baseHourPrice = selectedDuration?.price || 0
    const days = getDaysDiff(bookingDate, exitDate)
    if (days > 0) {
      const maxFeePolicy = pricingPolicies.find(p => p.VehicleTypeID === activeVehicleTypeId && !p.IsOvernight && p.MaxHours === 999)
      const dailyMaxFee = maxFeePolicy ? maxFeePolicy.Fee : 120000
      return days * dailyMaxFee + baseHourPrice
    }
    return baseHourPrice
  }, [bookingDate, exitDate, selectedDuration, pricingPolicies, activeVehicleTypeId])

  const isBookingTimeValid = isStartTimeValid(bookingDate, startTime)

  const selectedBuildingData = useMemo(() => {
    return buildingOptions.find(b => String(b.value) === String(buildingId))
  }, [buildingOptions, buildingId])

  const exitDateTimeText = useMemo(() => {
    const start = buildLocalDateTime(bookingDate, startTime)
    if (!start) return ''
    const end = new Date(start.getTime() + totalHours * 60 * 60 * 1000)
    
    const pad = (n) => String(n).padStart(2, '0')
    const timeStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`
    const dateStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`
    return `${timeStr} - ${dateStr}`
  }, [bookingDate, startTime, totalHours])

  const isTimeInClosedWindow = useMemo(() => {
    if (!selectedBuildingData || selectedBuildingData.is247) return false
    
    if (!selectedBuildingData.openTime || !selectedBuildingData.closeTime) return false

    const formatTimePart = (t) => {
      if (!t) return ''
      if (typeof t === 'string' && t.includes('T')) {
        const d = new Date(t)
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      }
      if (typeof t === 'string') {
        return t.split(':').slice(0, 2).join(':')
      }
      return String(t)
    }

    const openTimeStr = formatTimePart(selectedBuildingData.openTime)
    const closeTimeStr = formatTimePart(selectedBuildingData.closeTime)

    if (!openTimeStr || !closeTimeStr) return false

    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number)
      return h * 60 + m
    }

    const openMin = toMinutes(openTimeStr)
    const closeMin = toMinutes(closeTimeStr)

    const isOutsideOpenHours = (date) => {
      const min = date.getHours() * 60 + date.getMinutes()
      if (openMin < closeMin) {
        return min < openMin || min > closeMin
      } else {
        return min > closeMin && min < openMin
      }
    }

    const start = buildLocalDateTime(bookingDate, startTime)
    if (!start) return false
    
    const end = new Date(start.getTime() + totalHours * 60 * 60 * 1000)

    return isOutsideOpenHours(start) || isOutsideOpenHours(end)
  }, [selectedBuildingData, bookingDate, startTime, totalHours])

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

  const finalDisplaySlots = useMemo(() => {
    if (slotFilter === 'all') return displaySlots
    if (slotFilter === 'available') return displaySlots.filter(s => s.uiStatus === 'available' || s.uiStatus === 'selected')
    if (slotFilter === 'occupied') return displaySlots.filter(s => s.uiStatus === 'occupied')
    if (slotFilter === 'selected') return displaySlots.filter(s => s.uiStatus === 'selected')
    return displaySlots
  }, [displaySlots, slotFilter])

  /**
   * Gọi API lấy danh sách các tòa nhà (bãi đỗ xe)
   * và thiết lập tòa nhà mặc định nếu chưa có
   */
  /**
   * Hàm xử lý logic: fetchBuildings
   * Gọi API GET /buildings để lấy danh sách tòa nhà/bãi đỗ xe và lưu vào state.
   */
  const fetchBuildings = async () => {
    try {
      const response = await authorizeAxios.get('/buildings')
      const buildings = response.data?.data || []

      if (buildings.length > 0) {
        setBuildingOptions(
          buildings.map((building) => ({
            value: String(building.BuildingID),
            label: building.BuildingName,
            openTime: building.OpenTime,
            closeTime: building.CloseTime,
            is247: building.Is247
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

  /**
   * Gọi API lấy danh sách phương tiện của tài xế
   * Tự động chọn xe mặc định để load thông tin biển số và loại xe
   */
  /**
   * Hàm xử lý logic: fetchVehicles
   * Lấy danh sách phương tiện của tài xế. Tự động chọn phương tiện mặc định (nếu có).
   */
  const fetchVehicles = async () => {
    try {
      const response = await authorizeAxios.get('/driver/vehicles')
      const data = response.data?.data || response.data || []
      const vehicleList = Array.isArray(data) ? data : (data.vehicles || [])
      setVehicles(vehicleList)

      const defaultVehicle = vehicleList.find(v => v.IsDefault) || vehicleList[0]
      if (defaultVehicle) {
        setSelectedVehicleId(String(defaultVehicle.VehicleID))
        setLicensePlate(defaultVehicle.PlateNumber)
        setVehicleType(defaultVehicle.VehicleTypeID === 1 ? 'MOTO' : defaultVehicle.VehicleTypeID === 2 ? 'CAR' : 'TRUCK')
      } else {
        setSelectedVehicleId('manual')
      }
    } catch (error) {
      console.error('Fetch vehicles failed:', error)
      setSelectedVehicleId('manual')
    }
  }

  /**
   * Hàm xử lý logic: fetchVehicleTypesList
   * Gọi API để lấy danh mục các loại xe (Car, Moto, Truck...).
   */
  const fetchVehicleTypesList = async () => {
    try {
      const response = await authorizeAxios.get('/vehicle-types')
      setVehicleTypesList(response.data?.data || [])
    } catch (error) {
      console.error('Fetch vehicle types failed:', error)
    }
  }

  /**
   * Hàm xử lý logic: fetchPricingPolicies
   * Gọi API lấy chính sách giá để tự động tạo danh sách thời lượng (durations) cho phép chọn.
   */
  const fetchPricingPolicies = async () => {
    try {
      const response = await authorizeAxios.get('/pricing')
      setPricingPolicies(response.data?.data || [])
    } catch (error) {
      console.error('Fetch pricing policies failed:', error)
    }
  }

  /**
   * Gọi API tìm kiếm các vị trí đỗ (slots) còn trống
   * Dựa trên: Tòa nhà, Loại xe, Ngày, Giờ và Thời lượng
   * Sau đó xử lý logic tự động chọn khu vực và gợi ý vị trí tốt nhất (AI/Nearest)
   */
  /**
   * Hàm xử lý logic: fetchAvailableSlots
   * Tìm vị trí trống dựa trên các điều kiện lọc. 
   * Ngoài ra, tích hợp AI gợi ý vị trí (isAIRec) hoặc tự động chọn slot trống đầu tiên.
   */
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
          duration: `${totalHours}h`
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
        scopedSlots.find((slot) => slot.isAIRec) ||
        data.find((slot) => slot.isAIRec) ||
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
        t('driver.booking.errLoadSlots')

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
    void Promise.resolve().then(fetchVehicles)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void Promise.resolve().then(fetchAvailableSlots)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId, vehicleType, bookingDate, exitDate, startTime, duration])

  useEffect(() => {
    fetchBuildings()
    fetchVehicles()
    fetchVehicleTypesList()
    fetchPricingPolicies()
  }, [])

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
      (slot) => slot.isAIRec
    ) || filteredSlots.find(
      (slot) => slot.DisplayStatus === 'available'
    )

    const globalNearestAvailable = availableSlots.find(
      (slot) => slot.isAIRec
    ) || availableSlots.find(
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

  /**
   * Hàm xử lý logic: handleChangeDate
   * Xử lý khi người dùng đổi ngày đặt chỗ. Nếu là ngày quá khứ sẽ bị chặn.
   */
  const handleChangeDate = (event) => {
    const value = event.target.value
    const today = getTodayDateValue()

    if (value < today) {
      setBookingDate(today)
      setExitDate(today)
      setStartTime(getMinimumStartTimeValue())
      setIsStartTimeTouched(false)
      setErrorMessage(t('driver.booking.errPastDate'))
      return
    }

    setBookingDate(value)
    if (exitDate < value) {
      setExitDate(value)
    }

    if (value === today) {
      const minimumTime = getMinimumStartTimeValue()

      if (!isStartTimeValid(value, startTime)) {
        setStartTime(minimumTime)
        setIsStartTimeTouched(false)
      }
    }

    setErrorMessage('')
  }

  const handleChangeExitDate = (event) => {
    const value = event.target.value
    if (value < bookingDate) {
      setExitDate(bookingDate)
      return
    }
    setExitDate(value)
    setErrorMessage('')
  }

  /**
   * Hàm xử lý logic: handleChangeStartTime
   * Cập nhật thời gian bắt đầu đỗ xe. Reset về thời gian tối thiểu nếu không hợp lệ.
   */
  const handleChangeStartTime = (event) => {
    const value = event.target.value
    setIsStartTimeTouched(true)
    setStartTime(value)
    setErrorMessage('')
  }

  const handleBlurStartTime = () => {
    const minimumTime = getMinimumStartTimeValue()
    if (isToday(bookingDate) && !isStartTimeValid(bookingDate, startTime)) {
      setStartTime(minimumTime)
      setIsStartTimeTouched(false)
      setErrorMessage(t('driver.booking.errTimeAdjusted'))
    }
  }

  /**
   * Hàm xử lý logic: handleChangeBuilding
   * Đổi tòa nhà đặt chỗ và reset danh sách slot trống hiện tại.
   */
  const handleChangeBuilding = (event) => {
    setBuildingId(event.target.value)

    latestSlotRequestRef.current += 1

    setAvailableSlots([])
    setFloorId('')
    setZoneId('')
    setSelectedSlotId(null)
    setErrorMessage('')
  }

  /**
   * Hàm xử lý logic: handleChangeVehicleType
   * Thay đổi loại phương tiện và yêu cầu lấy lại danh sách slot.
   */
  const handleChangeVehicleType = (event) => {
    setVehicleType(event.target.value)

    latestSlotRequestRef.current += 1

    setAvailableSlots([])
    setFloorId('')
    setZoneId('')
    setSelectedSlotId(null)
    setErrorMessage('')
  }

  /**
   * Hàm xử lý logic: handleChangeFloor
   * Lọc slot theo Tầng (Floor) vừa chọn, reset Khu vực (Zone).
   */
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

  /**
   * Hàm xử lý logic: handleChangeZone
   * Lọc slot theo Khu (Zone) thuộc Tầng (Floor) hiện tại.
   */
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

  /**
   * Hàm xử lý logic: handleChangeSelectedVehicle
   * Người dùng chọn biển số xe có sẵn, tự động điền loại xe và biển số.
   */
  const handleChangeSelectedVehicle = (event) => {
    const val = event.target.value
    setSelectedVehicleId(val)
    if (val === 'manual') {
      setLicensePlate('')
    } else {
      const vehicle = vehicles.find(v => String(v.VehicleID) === val)
      if (vehicle) {
        setLicensePlate(vehicle.PlateNumber)
        setVehicleType(vehicle.VehicleTypeID === 1 ? 'MOTO' : vehicle.VehicleTypeID === 2 ? 'CAR' : 'TRUCK')
      }
    }
  }

  /**
   * Hàm xử lý logic: handleAutoSelectChange
   * Bật/tắt chế độ tự động chọn Slot.
   */
  const handleAutoSelectChange = (event) => {
    const checked = event.target.checked
    setAutoSelect(checked)

    if (checked) {
      const scopedNearestAvailable = filteredSlots.find(
        (slot) => slot.isAIRec
      ) || filteredSlots.find(
        (slot) => slot.DisplayStatus === 'available'
      )

      const globalNearestAvailable = availableSlots.find(
        (slot) => slot.isAIRec
      ) || availableSlots.find(
        (slot) => slot.DisplayStatus === 'available'
      )

      setSelectedSlotId(
        scopedNearestAvailable?.SlotID ||
        globalNearestAvailable?.SlotID ||
        null
      )
    }
  }

  /**
   * Hàm xử lý logic: handleSelectSlot
   * Khi người dùng click thủ công vào sơ đồ bãi đỗ để chọn ô (Slot). Tự động tắt autoSelect.
   */
  const handleSelectSlot = (slot) => {
    if (slot.uiStatus === 'occupied') return

    setSelectedSlotId(slot.SlotID)
    setAutoSelect(false)
  }

  /**
   * Xử lý khi tài xế bấm nút "Xác nhận đặt chỗ"
   * 1. Validate form (biển số, giờ giấc, slot)
   * 2. Gọi API POST /reservations để tạo Booking
   * 3. Chuyển hướng sang trang Confirmation
   */
  /**
   * Hàm xử lý logic: handleSubmit
   * Xác nhận và gửi dữ liệu lên server để tạo đơn đặt chỗ.
   */
  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!licensePlate.trim()) {
      setErrorMessage(t('driver.booking.errNoPlate'))
      return
    }

    if (!isStartTimeValid(bookingDate, startTime)) {
      const minimumTime = getMinimumStartTimeValue()
      setStartTime(minimumTime)
      setIsStartTimeTouched(false)
      setErrorMessage(t('driver.booking.errReconfirm'))
      return
    }

    if (!selectedSlotId) {
      setErrorMessage(t('driver.booking.errNoSlot'))
      return
    }

    try {
      setIsSubmitting(true)

      const response = await authorizeAxios.post('/reservations', {
        vehicleType,
        licensePlate: licensePlate.trim().toUpperCase(),
        bookingDate,
        startTime,
        duration: `${totalHours}h`,
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
        setErrorMessage(t('driver.booking.errNoReservationId'))
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
          statusLabel: reservation?.StatusLabel || t('driver.booking.statusActive')
        }
      })
    } catch (error) {
      console.error('Create booking failed:', error)
      console.error('Create booking response:', error.response?.data)

      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        t('driver.booking.errBookFail')

      setErrorMessage(message)
      await fetchAvailableSlots()
    } finally {
      setIsSubmitting(false)
    }
  }

  const buildingLabel = getOptionLabel(buildingOptions, buildingId)
  const vehicleLabel = vehicleTypesList.find(v => v.VehicleCode === vehicleType)?.VehicleName || vehicleType
  const durationLabel = getOptionLabel(durations, duration)

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-6xl animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          {t('driver.booking.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('driver.booking.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Clock size={20} />
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {t('driver.booking.infoTitle')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('driver.booking.infoDesc')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t('driver.booking.building')}
                </label>
                <select
                  value={buildingId}
                  onChange={handleChangeBuilding}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 px-4 py-2.5 text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  {buildingOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t('driver.booking.selectVehicle')}
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={handleChangeSelectedVehicle}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 text-sm font-semibold text-blue-700 dark:text-blue-400 outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  {vehicles.map((v) => (
                    <option key={v.VehicleID} value={v.VehicleID}>
                      {v.PlateNumber} ({v.VehicleTypeID === 1 ? t('driver.booking.vehicleMoto') : v.VehicleTypeID === 2 ? t('driver.booking.vehicleCar') : t('driver.booking.vehicleTruck')})
                    </option>
                  ))}
                  <option value="manual">{t('driver.booking.manualOption')}</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t('driver.booking.plate')}
                </label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(event) => setLicensePlate(formatPlateNumber(event.target.value))}
                  placeholder={t('driver.booking.platePlaceholder')}
                  disabled={selectedVehicleId !== 'manual'}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 px-4 py-2.5 text-sm uppercase outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t('driver.booking.vehicleType')}
                </label>
                <select
                  value={vehicleType}
                  onChange={handleChangeVehicleType}
                  disabled={selectedVehicleId !== 'manual'}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 px-4 py-2.5 text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {vehicleTypesList.map((item) => (
                    <option key={item.VehicleCode} value={item.VehicleCode} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100">
                      {item.VehicleName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
              <span>
                {t('driver.booking.autoUpdateHint')}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {/* Entry Date */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t('driver.booking.date')}
                </label>
                <div className="relative">
                  <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={bookingDate}
                    min={getTodayDateValue()}
                    onChange={handleChangeDate}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 py-2.5 pl-9 pr-4 text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Exit Date */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <CalendarDays size={12} className="text-orange-500" />
                  {t('driver.booking.exitDate', 'Ngày ra')}
                  {getDaysDiff(bookingDate, exitDate) > 0 && (
                    <span className="ml-1 rounded-full bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 text-[9px] font-black text-orange-600 dark:text-orange-400">
                      +{getDaysDiff(bookingDate, exitDate)}d
                    </span>
                  )}
                </label>
                <div className="relative">
                  <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" />
                  <input
                    type="date"
                    value={exitDate}
                    min={bookingDate}
                    onChange={handleChangeExitDate}
                    className="w-full rounded-xl border border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-900/10 py-2.5 pl-9 pr-4 text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              {/* Start Time */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t('driver.booking.startTime')}
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    value={startTime}
                    onChange={handleChangeStartTime}
                    onBlur={handleBlurStartTime}
                    className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 py-2.5 pl-9 pr-4 text-sm outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Duration slider */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t('driver.booking.durationLabel', { value: duration.replace('h', t('driver.booking.hourSuffix')) })}
                  {getDaysDiff(bookingDate, exitDate) > 0 && (
                    <span className="ml-2 text-orange-500 font-black">
                      (+{getDaysDiff(bookingDate, exitDate) * 24}h) = {totalHours}h {t('driver.booking.totalLabel', 'tổng')}
                    </span>
                  )}
                </label>
                <div className="pt-2 pb-1">
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, durations.length - 1)}
                    step="1"
                    value={Math.max(0, durations.findIndex(d => d.value === duration))}
                    onChange={(event) => {
                      const idx = parseInt(event.target.value, 10)
                      if (durations[idx]) setDuration(durations[idx].value)
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-blue-600"
                  />
                  <div className="relative h-5 mt-2.5 mx-1">
                    {[1, 4, 8, 12, 16, 20, 24].map((h) => {
                      const idx = h - 1
                      const pct = (idx / 23) * 100
                      const isSelected = duration === `${h}h`

                      return (
                        <span
                          key={h}
                          className={`absolute -translate-x-1/2 text-[10px] text-slate-400 font-bold transition-all hover:text-blue-600 ${
                            isSelected ? 'text-blue-600 dark:text-blue-400 font-black scale-110' : ''
                          }`}
                          onClick={() => setDuration(`${h}h`)}
                          style={{
                            cursor: 'pointer',
                            left: `${pct}%`
                          }}
                        >
                          {h}h
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Calculated Exit Time Info */}
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-gray-500 dark:text-gray-400">
                  {t('driver.booking.exitTimeCalculated', 'Giờ ra dự kiến:')}
                </span>
                <span className="font-black text-gray-950 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                  {exitDateTimeText}
                </span>
              </div>

              {selectedBuildingData && !selectedBuildingData.is247 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-slate-50 dark:bg-slate-900/30 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  ⚡ {t('driver.booking.operatingHoursInfo', 'Giờ mở cửa:')} <span className="font-bold text-gray-800 dark:text-gray-200">{formatTimeDisplay(selectedBuildingData.openTime)} - {formatTimeDisplay(selectedBuildingData.closeTime)}</span>
                </div>
              )}
            </div>

            {isTimeInClosedWindow && (
              <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold border border-red-200/60 dark:border-red-900/40 shadow-sm animate-pulse">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                <div>
                  <p className="font-bold">{t('driver.booking.closedHoursWarningTitle', 'Ngoài giờ hoạt động!')}</p>
                  <p className="mt-0.5 font-medium leading-relaxed">{t('driver.booking.closedHoursWarning', 'Thời gian đỗ xe (giờ vào hoặc giờ ra) nằm ngoài giờ mở cửa của tòa nhà này. Vui lòng điều chỉnh hoặc chọn tòa nhà khác!')}</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {t('driver.booking.slotsTitle')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {buildingLabel} - {selectedSlot?.FloorName || '--'} - {selectedSlot?.ZoneName || '--'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="slotFilter"
                    value="all"
                    checked={slotFilter === 'all'}
                    onChange={() => setSlotFilter('all')}
                    className="h-3 w-3 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                  />
                  {t('driver.booking.filterAll')}
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="slotFilter"
                    value="available"
                    checked={slotFilter === 'available'}
                    onChange={() => setSlotFilter('available')}
                    className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500"
                  />
                  {t('driver.booking.filterAvailable')}
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="slotFilter"
                    value="occupied"
                    checked={slotFilter === 'occupied'}
                    onChange={() => setSlotFilter('occupied')}
                    className="h-4 w-4 text-gray-600 dark:text-gray-400 focus:ring-gray-500"
                  />
                  {t('driver.booking.filterOccupied')}
                </label>
              </div>
            </div>

            <div className="mb-4 flex items-start gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
              {t('driver.booking.aiHint')}
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <select
                value={floorId}
                onChange={handleChangeFloor}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:w-48"
                disabled={floorOptions.length === 0}
              >
                {floorOptions.length === 0 ? (
                  <option value="">{t('driver.booking.selectFloor')}</option>
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
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
                disabled={zoneOptions.length === 0}
              >
                {zoneOptions.length === 0 ? (
                  <option value="">{t('driver.booking.selectZone')}</option>
                ) : (
                  zoneOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))
                )}
              </select>

              <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 sm:ml-auto">
                <input
                  type="checkbox"
                  checked={autoSelect}
                  onChange={handleAutoSelectChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                {t('driver.booking.autoSelect')}
              </label>
            </div>

            <div className="rounded-xl border border-gray-100 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-900/50 p-6">
              {isLoadingSlots ? (
                <div className="py-8 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {t('driver.booking.loadingSlots')}
                </div>
              ) : finalDisplaySlots.length === 0 ? (
                <div className="py-8 text-center text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {t('driver.booking.noSlotsFilter')}
                </div>
              ) : (
                <>
                  {/* AI Recommendation Banner */}
                  {finalDisplaySlots.find(s => s.isAIRec) && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="p-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg animate-pulse shadow-md">
                        <Sparkles size={20} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm flex items-center gap-2">
                          {t('driver.booking.aiBannerTitle')}
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 text-xs mt-1.5 leading-relaxed">
                          {t('driver.booking.aiBannerBodyPre')} <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">{finalDisplaySlots.find(s => s.isAIRec).SlotCode}</span>. {finalDisplaySlots.find(s => s.isAIRec).AIReason}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-5 gap-3 md:grid-cols-10">
                    {finalDisplaySlots.map((slot) => (
                      <button
                        key={slot.SlotID}
                        type="button"
                        disabled={slot.uiStatus === 'occupied'}
                        onClick={() => handleSelectSlot(slot)}
                        className={`flex h-12 items-center justify-center rounded-lg border text-xs font-bold outline-none transition-all relative ${slot.uiStatus === 'occupied'
                          ? 'cursor-not-allowed border-gray-200 bg-gray-100/80 font-semibold text-gray-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-gray-600 opacity-50'
                          : slot.uiStatus === 'selected'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm ring-2 ring-blue-100'
                            : slot.isAIRec
                              ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)] ring-2 ring-yellow-400/50 hover:border-yellow-500 z-10 scale-105'
                              : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:text-blue-500'
                        }`}
                      >
                        {slot.SlotCode}
                        {slot.isAIRec && (
                          <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] text-white shadow-sm animate-bounce" title={t('driver.booking.aiTooltip')}>
                            ✨
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:text-blue-400">
                <Building size={24} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {buildingLabel}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedSlot?.Address || t('driver.booking.addressFallback')}
                </p>
              </div>
            </div>

            <div className="w-fit rounded-lg border border-blue-100 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 shadow-sm">
              {t('driver.booking.slotBadge', { code: selectedSlot?.SlotCode || '--' })}
            </div>
          </div>
        </div>

        <div>
          <div className="sticky top-6 rounded-2xl border-2 border-blue-100 bg-white dark:bg-slate-800 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <CreditCard className="text-blue-500" size={20} />
              {t('driver.booking.summaryTitle')}
            </h2>

            <div className="mb-6 space-y-4">
              <SummaryRow icon={<Building size={16} />} label={t('driver.booking.buildingLabel')} value={buildingLabel} />
              <SummaryRow icon={<Car size={16} />} label={t('driver.booking.plateLabel')} value={licensePlate || t('driver.booking.plateNotEntered')} />
              <SummaryRow label={t('driver.booking.vehicleLabel')} value={vehicleLabel} />
              <SummaryRow icon={<Clock size={16} />} label={t('driver.booking.timeIn')} value={`${startTime} - ${bookingDate}`} />
              <SummaryRow icon={<Clock size={16} />} label={t('driver.booking.timeOut', 'Giờ ra dự kiến')} value={exitDateTimeText} />
              <SummaryRow label={t('driver.booking.durationSummary')} value={`${totalHours}h`} />

              <div className="flex items-center justify-between pb-2 text-sm">
                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <MapPin size={16} />
                  {t('driver.booking.slotPos')}
                </span>

                <span className="rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 font-bold text-blue-600 dark:text-blue-400">
                  {selectedSlot?.FloorName || '--'} - {selectedSlot?.ZoneName || '--'} - {selectedSlot?.SlotCode || '--'}
                </span>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-gray-100 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-900/50 p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {t('driver.booking.tempPrice')}
                </span>

                <span className="text-xl font-black text-gray-900 dark:text-white">
                  {formatCurrency(temporaryPrice)} {t('driver.common.currency')}
                </span>
              </div>

              <p className="text-right text-[10px] font-medium text-blue-500">
                {t('driver.booking.tempPriceNote')}
              </p>
            </div>

            <div className="mb-6 rounded-xl border border-orange-100 bg-orange-50/50 p-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-orange-800">
                <AlertCircle size={14} />
                {t('driver.booking.noteTitle')}
              </h4>

              <ul className="list-disc space-y-1.5 pl-4 text-[11px] font-medium text-orange-700 opacity-90">
                <li>{t('driver.booking.note1')}</li>
                <li>{t('driver.booking.note2')}</li>
                <li>{t('driver.booking.note3')}</li>
              </ul>
            </div>

            {errorMessage && (
              <div className="mb-3 rounded-xl border border-red-100 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm font-medium text-red-600">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isLoadingSlots || !selectedSlotId}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 size={18} />
              {isSubmitting ? t('driver.booking.submitting') : t('driver.booking.submit')}
            </button>

            <button
              type="button"
              onClick={() => navigate('/driver/home')}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-3.5 font-bold text-gray-600 dark:text-gray-400 transition-all hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              {t('driver.booking.cancelBtn')}
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
      <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        {icon}
        {label}
      </span>

      <span className="font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}

export default DriverBooking