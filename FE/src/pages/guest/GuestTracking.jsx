import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Car, Clock, MapPin, CreditCard, ArrowLeft,
  CheckCircle2, AlertCircle, Timer, Building2, Layers,
  SquareParking, Bike, Truck, CarFront, ShieldCheck
} from 'lucide-react'
import guestApi from '../../apis/guestApi'

const VEHICLE_ICONS = {
  motorcycle: Bike,
  car: CarFront,
  truck: Truck
}

const STATUS_MAP = {
  Active: { label: 'Đang gửi', color: 'emerald', icon: Timer },
  Completed: { label: 'Đã lấy xe', color: 'blue', icon: CheckCircle2 },
  Lost: { label: 'Mất xe', color: 'red', icon: AlertCircle },
  Overdue: { label: 'Quá hạn', color: 'amber', icon: AlertCircle }
}

const GuestTracking = () => {
  const [plateNumber, setPlateNumber] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSearched, setIsSearched] = useState(false)
  const [currentDuration, setCurrentDuration] = useState(null)
  const [currentFee, setCurrentFee] = useState(null)
  const intervalRef = useRef(null)
  const plateRef = useRef(null)

  useEffect(() => {
    plateRef.current?.focus()
  }, [])

  // Realtime duration counter for active sessions
  useEffect(() => {
    if (session && session.status === 'Active') {
      const updateDuration = () => {
        const entry = new Date(session.entryTime)
        const now = new Date()
        const diffMs = now - entry
        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
        setCurrentDuration({ hours, minutes, seconds, text: `${hours} giờ ${minutes} phút ${seconds} giây` })
      }
      updateDuration()
      intervalRef.current = setInterval(updateDuration, 1000)
      return () => clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [session])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!plateNumber.trim() || !sessionCode.trim()) {
      setError('Vui lòng nhập đầy đủ Biển số xe và Mã phiên')
      return
    }

    setIsLoading(true)
    setError('')
    setSession(null)
    setIsSearched(true)

    try {
      const res = await guestApi.trackSession(plateNumber.trim(), sessionCode.trim())
      if (res.success) {
        setSession(res.data)
        setCurrentFee(res.data.fee)
      } else {
        setError(res.message || 'Không tìm thấy phiên gửi xe')
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Không tìm thấy phiên gửi xe. Vui lòng kiểm tra lại thông tin.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setPlateNumber('')
    setSessionCode('')
    setSession(null)
    setError('')
    setIsSearched(false)
    setCurrentDuration(null)
    setCurrentFee(null)
    plateRef.current?.focus()
  }

  const statusInfo = session ? (STATUS_MAP[session.status] || STATUS_MAP.Active) : null
  const VehicleIcon = session ? (VEHICLE_ICONS[session.vehicleCode?.toLowerCase()] || CarFront) : CarFront
  const displayDuration = currentDuration || session?.duration

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Trang chủ
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20">
              <SquareParking size={18} className="text-white" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-slate-900">PBMS</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-10">
        {/* Hero Section */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-600/25">
            <Search size={28} className="text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900">
            Tra cứu Phiên Gửi Xe
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Nhập biển số xe và mã phiên trên vé gửi xe để xem thông tin
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mx-auto mb-8 max-w-lg">
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/60 bg-white shadow-xl shadow-slate-900/5">
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Biển số xe
                </label>
                <input
                  ref={plateRef}
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  placeholder="VD: 59A-12345"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base font-bold tracking-wider text-slate-900 placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal transition-all focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Mã phiên (trên vé gửi xe)
                </label>
                <input
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  placeholder="VD: SS-00042"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base font-bold tracking-wider text-slate-900 placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal transition-all focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang tra cứu...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Tra cứu
                  </>
                )}
              </button>
              {isSearched && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]"
                >
                  Nhập lại
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Error State */}
        {error && (
          <div className="mx-auto mb-8 max-w-lg animate-in fade-in">
            <div className="flex items-start gap-4 rounded-2xl border border-red-100 bg-red-50 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-red-800">{error}</p>
                <p className="mt-1 text-xs font-medium text-red-600/70">
                  Hãy kiểm tra lại biển số xe và mã phiên trên vé gửi xe của bạn.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Session Result */}
        {session && (
          <div className="mx-auto max-w-lg space-y-5 animate-in slide-in-from-bottom-4 fade-in duration-500">
            {/* Status Banner */}
            <div className={`relative overflow-hidden rounded-2xl p-6 ${
              session.status === 'Active'
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-600/25'
                : session.status === 'Completed'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl shadow-blue-600/25'
                : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl shadow-amber-600/25'
            }`}>
              <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-widest opacity-80">Trạng thái</p>
                  <h2 className="text-2xl font-black">{statusInfo?.label}</h2>
                  {session.status === 'Active' && (
                    <p className="mt-1 text-sm font-medium opacity-90">
                      Xe của bạn đang được bảo quản an toàn
                    </p>
                  )}
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                  {statusInfo && <statusInfo.icon size={28} />}
                </div>
              </div>
            </div>

            {/* Session Info Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-slate-900/5">
              {/* Top decorative bar */}
              <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
              
              <div className="p-6">
                {/* Session Code & Plate */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="mb-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Mã phiên</p>
                    <p className="text-2xl font-black tracking-tight text-blue-600">{session.sessionCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="mb-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Biển số</p>
                    <div className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-1.5">
                      <VehicleIcon size={16} className="text-slate-500" />
                      <span className="text-base font-black tracking-wider text-slate-800">{session.plateNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="space-y-3.5">
                  <InfoRow
                    icon={Car}
                    label="Loại xe"
                    value={session.vehicleName}
                  />
                  <InfoRow
                    icon={MapPin}
                    label="Vị trí đỗ"
                    value={`${session.location.building} → ${session.location.floor} → Khu ${session.location.zone} → ${session.location.slot}`}
                    highlight
                  />
                  <InfoRow
                    icon={Clock}
                    label="Giờ vào"
                    value={formatDateTime(session.entryTime)}
                  />
                  {session.exitTime && (
                    <InfoRow
                      icon={Clock}
                      label="Giờ ra"
                      value={formatDateTime(session.exitTime)}
                    />
                  )}
                </div>
              </div>

              {/* Duration & Fee Section */}
              <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/80 to-white p-6">
                {/* Duration */}
                <div className="mb-5">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Thời gian gửi xe
                  </p>
                  {session.status === 'Active' && displayDuration ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black tabular-nums text-slate-900">
                        {String(displayDuration.hours).padStart(2, '0')}
                      </span>
                      <span className="text-lg font-bold text-slate-400">h</span>
                      <span className="text-4xl font-black tabular-nums text-slate-900 ml-1">
                        {String(displayDuration.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-lg font-bold text-slate-400">m</span>
                      {displayDuration.seconds !== undefined && (
                        <>
                          <span className="text-4xl font-black tabular-nums text-slate-900 ml-1">
                            {String(displayDuration.seconds).padStart(2, '0')}
                          </span>
                          <span className="text-lg font-bold text-slate-400">s</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-xl font-black text-slate-900">{session.duration?.text || '--'}</p>
                  )}
                </div>

                {/* Fee */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-blue-400">
                        {currentFee?.isEstimated ? 'Phí tạm tính' : 'Tổng phí gửi xe'}
                      </p>
                      <p className="text-3xl font-black text-blue-700">
                        {currentFee?.formatted || session.fee?.formatted || '--'}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                      <CreditCard size={22} className="text-blue-600" />
                    </div>
                  </div>
                  {currentFee?.isEstimated && (
                    <p className="mt-2 text-[11px] font-medium text-blue-500">
                      * Phí được tính dựa trên thời gian thực tế khi lấy xe
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-3 rounded-xl border border-slate-200/60 bg-white p-4">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-500" />
              <p className="text-xs font-medium leading-relaxed text-slate-500">
                Xe của bạn được giám sát 24/7 bởi hệ thống camera và đội ngũ bảo vệ chuyên nghiệp. 
                Nếu cần hỗ trợ, vui lòng liên hệ nhân viên tại bãi xe.
              </p>
            </div>
          </div>
        )}

        {/* Empty State (before search) */}
        {!isSearched && !session && (
          <div className="mx-auto max-w-lg">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Car size={24} className="text-slate-400" />
              </div>
              <p className="font-bold text-slate-600">Nhập thông tin để bắt đầu</p>
              <p className="mt-1 text-sm font-medium text-slate-400">
                Bạn có thể tìm thấy Mã phiên (SS-XXXXX) trên vé gửi xe
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white/70 py-6 text-center">
        <p className="text-xs font-medium text-slate-400">
          © {new Date().getFullYear()} PBMS — Parking Building Management System
        </p>
      </footer>
    </div>
  )
}

const InfoRow = ({ icon: Icon, label, value, highlight = false }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
      <Icon size={16} className="text-slate-400" />
    </div>
    <div className="min-w-0 flex-1 border-b border-dashed border-slate-100 pb-3.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${highlight ? 'text-blue-600' : 'text-slate-800'}`}>{value}</p>
    </div>
  </div>
)

const formatDateTime = (value) => {
  if (!value) return '--'
  const date = new Date(String(value).endsWith('Z') ? String(value).slice(0, -1) : value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export default GuestTracking
