// src/pages/Staff/StaffPaymentConfirm.jsx
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronRight, Banknote, QrCode, MapPin, Clock, Car,
  CheckCircle2, Loader2, X, RefreshCcw, AlertCircle,
  User, Hash, ExternalLink, Copy, Check
} from 'lucide-react'
import { toast } from 'react-toastify'
import staffApi from '../../apis/staffApi'
import ScrollToTopButton from '../common/ScrollToTopButton'

const formatVND = (v) => Number(v || 0).toLocaleString('vi-VN') + ' ₫'

const formatTime = (dt) => {
  if (!dt) return '—'
  const d = new Date(dt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

const calcDuration = (entryTime, minuteLabel) => {
  if (!entryTime) return '—'
  const diff = Math.max(0, Math.floor((Date.now() - new Date(entryTime)) / 60000))
  const h = Math.floor(diff / 60); const m = diff % 60
  return h > 0 ? `${h}h ${m}m` : `${m} ${minuteLabel}`
}

// ── QR Modal ──────────────────────────────────────────────────
const QrModal = ({ qrData, onPaid, onCancel }) => {
  const { t } = useTranslation()
  const [status, setStatus] = useState('PENDING')
  const [copied, setCopied] = useState(false)
  const [remaining, setRemaining] = useState(null)
  const [zoom, setZoom] = useState(false)
  const pollRef = useRef(null)

  const onPaidRef = useRef(onPaid)
  useEffect(() => { onPaidRef.current = onPaid }, [onPaid])

  const orderCodeRef = useRef(qrData?.orderCode)
  useEffect(() => { orderCodeRef.current = qrData?.orderCode }, [qrData?.orderCode])

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      if (!orderCodeRef.current) return
      try {
        const res = await staffApi.getPaymentStatus(orderCodeRef.current)
        const s = res?.data?.status
        if (cancelled) return
        if (s === 'PAID') {
          clearInterval(pollRef.current)
          setStatus('PAID')
          setTimeout(() => onPaidRef.current(), 1500)
        } else if (s === 'CANCELLED' || s === 'EXPIRED') {
          clearInterval(pollRef.current)
          setStatus('CANCELLED')
        }
      } catch { /* bỏ qua lỗi mạng */ }
    }

    pollRef.current = setInterval(poll, 3000)
    return () => {
      cancelled = true
      clearInterval(pollRef.current)
    }
  }, [])

  useEffect(() => {
    const expiredAt = qrData?.expiredAt ? new Date(qrData.expiredAt) : null
    if (!expiredAt) {
      const tm = setTimeout(() => setRemaining(null), 0)
      return () => clearTimeout(tm)
    }
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((expiredAt - Date.now()) / 1000))
      setRemaining(diff)
      if (diff <= 0) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [qrData?.expiredAt])

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const remMin = remaining !== null ? Math.floor(remaining / 60) : null
  const remSec = remaining !== null ? remaining % 60 : null
  const qrImgUrl = qrData?.qrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrData.qrCode)}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {zoom && qrImgUrl && (
        <div className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-black/80 p-6"
          onClick={() => setZoom(false)}>
          <img src={qrImgUrl} alt={t('staff.paymentConfirm.qr.zoomAlt')} className="w-[80vmin] h-[80vmin] max-w-[420px] max-h-[420px] bg-white p-4 rounded-2xl" />
          <p className="text-white/80 text-sm mt-4">{t('staff.paymentConfirm.qr.zoomHint')}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={`p-5 text-center relative ${status === 'PAID' ? 'bg-green-500' : status === 'CANCELLED' ? 'bg-red-500' : 'bg-blue-600'}`}>
          <button onClick={onCancel} className="absolute right-4 top-4 text-white/70 hover:text-white">
            <X size={18} />
          </button>
          <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">
            {status === 'PAID' ? t('staff.paymentConfirm.qr.statusPaid') : status === 'CANCELLED' ? t('staff.paymentConfirm.qr.statusCancelled') : t('staff.paymentConfirm.qr.statusPending')}
          </p>
          <p className="text-3xl font-black text-white">{formatVND(qrData?.amount)}</p>
          {remMin !== null && status === 'PENDING' && (
            <p className="text-xs text-white/70 mt-1">{t('staff.paymentConfirm.qr.expiresIn', { time: `${remMin}:${String(remSec).padStart(2, '0')}` })}</p>
          )}
        </div>
        <div className="p-6">
          {status === 'PAID' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={36} className="text-green-500" />
              </div>
              <p className="font-bold text-gray-800">{t('staff.paymentConfirm.qr.paidTitle')}</p>
              <p className="text-sm text-gray-500">{t('staff.paymentConfirm.qr.paidBody')}</p>
              <Loader2 size={20} className="animate-spin text-blue-500 mt-2" />
            </div>
          )}
          {status === 'CANCELLED' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <AlertCircle size={40} className="text-red-400" />
              <p className="font-bold text-gray-800">{t('staff.paymentConfirm.qr.cancelledBody')}</p>
              <button onClick={onCancel} className="mt-2 px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200">{t('staff.paymentConfirm.qr.close')}</button>
            </div>
          )}
          {status === 'PENDING' && (
            <>
              {qrImgUrl && (
                <div className="flex flex-col items-center mb-4">
                  <button onClick={() => setZoom(true)} className="p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 transition-colors">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.qrCode)}`} alt="QR Code" className="w-48 h-48" />
                  </button>
                  <p className="text-xs text-gray-400 mt-2">{t('staff.paymentConfirm.qr.zoomToScan')}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 mb-4 text-sm">
                {qrData?.accountNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">{t('staff.paymentConfirm.qr.accountNumber')}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-gray-800">{qrData.accountNumber}</span>
                      <button onClick={() => handleCopy(qrData.accountNumber)} className="text-gray-400 hover:text-blue-600">
                        {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                )}
                {qrData?.accountName && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">{t('staff.paymentConfirm.qr.accountName')}</span>
                    <span className="font-bold text-gray-800">{qrData.accountName}</span>
                  </div>
                )}
                {qrData?.description && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">{t('staff.paymentConfirm.qr.description')}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-blue-700">{qrData.description}</span>
                      <button onClick={() => handleCopy(qrData.description)} className="text-gray-400 hover:text-blue-600"><Copy size={13} /></button>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                  <span className="text-gray-500 font-medium">{t('staff.paymentConfirm.qr.amount')}</span>
                  <span className="font-black text-blue-700 text-base">{formatVND(qrData?.amount)}</span>
                </div>
              </div>
              {qrData?.checkoutUrl && (
                <a href={qrData.checkoutUrl} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 py-2.5 border border-blue-300 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 mb-3">
                  <ExternalLink size={14} /> {t('staff.paymentConfirm.qr.openPayos')}
                </a>
              )}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Loader2 size={12} className="animate-spin" />
                {t('staff.paymentConfirm.qr.polling')}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
const StaffPaymentConfirm = () => {
  const { t } = useTranslation()
  const { sessionId: paramId } = useParams()
  const navigate = useNavigate()

  const [sessionData, setSessionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setMethod] = useState('cash')
  const [confirmedPlate, setConfirmed] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [qrData, setQrData] = useState(null)
  const [showQr, setShowQr] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!paramId) {
      setTimeout(() => setLoading(false), 0)
      return
    }
    let cancelled = false
    const run = async () => {
      try {
        const res = await staffApi.getCheckoutPreview(paramId)
        if (!cancelled) setSessionData(res?.data ?? res)
      } catch (err) {
        if (!cancelled) {
          toast.error(err?.response?.data?.message || t('staff.paymentConfirm.toastNotFound'))
          navigate('/staff/checkout')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [paramId, navigate, refreshKey, t])

  const handleCashCheckout = async () => {
    if (!confirmedPlate) return toast.warning(t('staff.paymentConfirm.toastWarnPlate'))
    setProcessing(true)
    try {
      await staffApi.checkOutSession(paramId, { paymentMethod: 'Cash', confirmedPlate: true })
      toast.success(t('staff.paymentConfirm.toastCashSuccess'))
      navigate('/staff/checkout-completed', { state: { actionType: 'checkout', sessionId: paramId } })
    } catch (err) {
      toast.error(err?.response?.data?.message || t('staff.paymentConfirm.toastCashFail'))
    } finally {
      setProcessing(false)
    }
  }

  const handleCreateQr = async () => {
    if (!confirmedPlate) return toast.warning(t('staff.paymentConfirm.toastWarnPlate'))
    setProcessing(true)
    try {
      const res = await staffApi.createPayment(paramId)
      const data = res?.data
      if (!data?.qrCode && !data?.checkoutUrl) throw new Error(t('staff.paymentConfirm.toastNoQr'))
      setQrData(data)
      setShowQr(true)
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || t('staff.paymentConfirm.toastCreateQrFail'))
    } finally {
      setProcessing(false)
    }
  }

  const handleQrPaid = async () => {
    try {
      await staffApi.checkOutSession(paramId, { paymentMethod: 'Banking', confirmedPlate: true })
      toast.success(t('staff.paymentConfirm.toastQrSuccess'))
      navigate('/staff/checkout-completed', { state: { actionType: 'checkout', sessionId: paramId } })
    } catch {
      toast.success(t('staff.paymentConfirm.toastQrConfirmed'))
      navigate('/staff/checkout-completed', { state: { actionType: 'checkout', sessionId: paramId } })
    }
  }

  const handleCancelQr = () => {
    setShowQr(false)
    setQrData(null)
  }

  const [rechecking, setRechecking] = useState(false)
  const handleRecheck = async () => {
    setRechecking(true)
    try {
      const res = await staffApi.getCheckoutPreview(paramId)
      const data = res?.data ?? res
      setSessionData(data)
      const st = data?.session?.PaymentStatus
      if (st === 'Prepaid' || st === 'Completed') {
        toast.success(t('staff.paymentConfirm.toastRecheckPaid'))
      } else {
        toast.info(t('staff.paymentConfirm.toastRecheckUnpaid'))
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || t('staff.paymentConfirm.toastRecheckFail'))
    } finally {
      setRechecking(false)
    }
  }

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  if (!sessionData?.session) return (
    <div className="flex h-full items-center justify-center text-red-500 font-bold">
      {t('staff.paymentConfirm.notFound')}
    </div>
  )

  const { session, estimatedFee = 0, surchargeAmount = 0, prepaidAmount = 0, checkoutTime, durationH } = sessionData
  const totalFee = Number(estimatedFee)
  const surcharge = Number(surchargeAmount)
  const prepaid = Number(prepaidAmount)
  const amountDue = Math.max(0, totalFee - prepaid)
  const isPaid = session.PaymentStatus === 'Prepaid' || session.PaymentStatus === 'Completed'
  const minuteLabel = t('staff.paymentConfirm.minute')

  return (
    <div className="flex flex-col min-h-full bg-gray-50 pb-24">
      {showQr && qrData && <QrModal qrData={qrData} onPaid={handleQrPaid} onCancel={handleCancelQr} />}

      <div className="mb-2 text-sm text-gray-500 flex items-center gap-2">
        <span>{t('staff.paymentConfirm.breadcrumbStaff')}</span><ChevronRight size={14} />
        <span>{t('staff.paymentConfirm.breadcrumbPayment')}</span><ChevronRight size={14} />
        <span className="text-blue-600 font-medium">{t('staff.paymentConfirm.breadcrumbCurrent')}</span>
      </div>

      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('staff.paymentConfirm.title')}</h1>
        <button onClick={() => navigate('/staff/checkout')} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <RefreshCcw size={14} /> {t('staff.paymentConfirm.selectOther')}
        </button>
      </header>

      <div className="flex gap-6">
        <div className="flex-2 space-y-5 pb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-start mb-5 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-800">{t('staff.paymentConfirm.sessionTitle')}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{t('staff.paymentConfirm.sessionDesc')}</p>
              </div>
              <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-3 py-1 rounded-full">{t('staff.paymentConfirm.statusActive')}</span>
            </div>
            <div className="grid grid-cols-3 gap-y-5 gap-x-6">
              {[
                { icon: Hash, label: t('staff.paymentConfirm.fieldSession'), value: session.SessionCode },
                { icon: Car, label: t('staff.paymentConfirm.fieldPlate'), value: session.PlateNumber, highlight: true },
                { icon: User, label: t('staff.paymentConfirm.fieldDriver'), value: session.DriverName },
                { icon: Car, label: t('staff.paymentConfirm.fieldVehicle'), value: session.VehicleName },
                { icon: MapPin, label: t('staff.paymentConfirm.fieldSlot'), value: [session.ZoneName, session.FloorName, session.SlotCode].filter(Boolean).join(' · ') || '—' },
                { icon: Clock, label: t('staff.paymentConfirm.fieldEntryAt'), value: formatTime(session.EntryTime) },
                { icon: Clock, label: t('staff.paymentConfirm.fieldExitAt'), value: checkoutTime ? formatTime(checkoutTime) : t('staff.paymentConfirm.now') },
                { icon: Clock, label: t('staff.paymentConfirm.fieldDuration'), value: calcDuration(session.EntryTime, minuteLabel) }
              ].map(({ icon: Icon, label, value, highlight }) => (
                <div key={label}>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Icon size={10} /> {label}</p>
                  <p className={`text-sm font-bold ${highlight ? 'text-gray-900 text-base tracking-wider' : 'text-gray-700'}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-bold text-gray-800 mb-5">{t('staff.paymentConfirm.feeTitle')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{t('staff.paymentConfirm.feeByTime', { hours: durationH ? durationH.toFixed(1) : '—' })}</span>
                <span className="font-bold text-gray-800">{formatVND(totalFee)}</span>
              </div>
              {prepaid > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{t('staff.paymentConfirm.feePrepaid')}</span>
                  <span className="font-bold text-green-600">− {formatVND(prepaid)}</span>
                </div>
              )}
              {surcharge > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{t('staff.paymentConfirm.feeSurcharge')}</span>
                  <span className="font-bold text-orange-600">+ {formatVND(surcharge)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="font-bold text-gray-800">{prepaid > 0 ? t('staff.paymentConfirm.feeRemain') : t('staff.paymentConfirm.feeTotal')}</span>
                <span className="font-black text-blue-700 text-xl">{formatVND(prepaid > 0 ? amountDue + surcharge : totalFee)}</span>
              </div>
            </div>
            {isPaid && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 size={15} className="shrink-0" />
                {t('staff.paymentConfirm.paidPrepaidNote', { amount: formatVND(prepaid) })}
              </div>
            )}
          </div>

          <div onClick={() => setConfirmed(v => !v)}
            className={`rounded-xl border p-4 flex items-start gap-3 cursor-pointer transition-all ${confirmedPlate ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${confirmedPlate ? 'bg-green-500 border-green-500' : 'border-yellow-400 bg-white'}`}>
              {confirmedPlate && <Check size={12} className="text-white" />}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">{t('staff.paymentConfirm.confirmPlate')} <span className="text-blue-700 tracking-wider">{session.PlateNumber}</span></p>
              <p className="text-xs text-gray-500 mt-0.5">{t('staff.paymentConfirm.confirmPlateHint')}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-5 pb-4">
          {isPaid ? (
            <>
              <div className="bg-green-600 rounded-xl p-5 text-white">
                <p className="text-xs font-bold text-green-100 uppercase tracking-wider mb-1">{t('staff.paymentConfirm.paidTitle')}</p>
                <p className="text-3xl font-black mb-1">{formatVND(prepaid)}</p>
                <p className="text-xs text-green-100">
                  {surcharge > 0 ? t('staff.paymentConfirm.paidWithSurcharge', { amount: formatVND(surcharge) }) : t('staff.paymentConfirm.paidEnough')}
                </p>
              </div>
              <button onClick={handleQrPaid} disabled={processing || !confirmedPlate}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${confirmedPlate && !processing ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {processing ? <><Loader2 size={18} className="animate-spin" /> {t('staff.paymentConfirm.processing')}</> : <><CheckCircle2 size={18} /> {t('staff.paymentConfirm.confirmExit')}</>}
              </button>
              {surcharge > 0 && (
                <p className="text-xs text-center text-orange-600 font-medium">
                  {t('staff.paymentConfirm.surchargeRemainHint', { amount: formatVND(surcharge) })}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-bold text-gray-800 mb-4">{t('staff.paymentConfirm.methodTitle')}</h3>
                <div className="space-y-3">
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'cash' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}><Banknote size={20} /></div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${paymentMethod === 'cash' ? 'text-blue-900' : 'text-gray-700'}`}>{t('staff.paymentConfirm.methodCash')}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t('staff.paymentConfirm.methodCashDesc')}</p>
                    </div>
                    <input type="radio" name="method" checked={paymentMethod === 'cash'} onChange={() => setMethod('cash')} className="w-4 h-4 text-blue-600" />
                  </label>
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'qr' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'qr' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}><QrCode size={20} /></div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${paymentMethod === 'qr' ? 'text-blue-900' : 'text-gray-700'}`}>{t('staff.paymentConfirm.methodQr')}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t('staff.paymentConfirm.methodQrDesc')}</p>
                    </div>
                    <input type="radio" name="method" checked={paymentMethod === 'qr'} onChange={() => setMethod('qr')} className="w-4 h-4 text-blue-600" />
                  </label>
                </div>
              </div>

              <div className="bg-blue-600 rounded-xl p-5 text-white">
                <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">{t('staff.paymentConfirm.toCollect')}</p>
                <p className="text-3xl font-black mb-1">{formatVND(prepaid > 0 ? amountDue + surcharge : totalFee)}</p>
                <p className="text-xs text-blue-200">{paymentMethod === 'cash' ? t('staff.paymentConfirm.cashHint') : t('staff.paymentConfirm.qrHint')}</p>
              </div>

              <button onClick={handleRecheck} disabled={rechecking}
                className="w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 border-2 border-blue-400 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all">
                {rechecking
                  ? <><Loader2 size={18} className="animate-spin" /> {t('staff.paymentConfirm.rechecking')}</>
                  : <><RefreshCcw size={18} /> {t('staff.paymentConfirm.recheckBtn')}</>}
              </button>

              {paymentMethod === 'cash' ? (
                <button onClick={handleCashCheckout} disabled={processing || !confirmedPlate}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${confirmedPlate && !processing ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  {processing ? <><Loader2 size={18} className="animate-spin" /> {t('staff.paymentConfirm.processing')}</> : <><Banknote size={18} /> {t('staff.paymentConfirm.confirmCash')}</>}
                </button>
              ) : (
                <button onClick={handleCreateQr} disabled={processing || !confirmedPlate}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${confirmedPlate && !processing ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  {processing ? <><Loader2 size={18} className="animate-spin" /> {t('staff.paymentConfirm.creatingQr')}</> : <><QrCode size={18} /> {t('staff.paymentConfirm.createQr')}</>}
                </button>
              )}

              {!confirmedPlate && <p className="text-xs text-center text-orange-500 font-medium">{t('staff.paymentConfirm.needConfirmPlate')}</p>}
            </>
          )}

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs text-gray-500 space-y-2">
            <p className="font-bold text-gray-700 text-sm mb-2">{t('staff.paymentConfirm.noteTitle')}</p>
            {isPaid ? (
              <><p>{t('staff.paymentConfirm.notePaid1')}</p><p>{t('staff.paymentConfirm.notePaid2')}</p></>
            ) : paymentMethod === 'cash' ? (
              <><p>{t('staff.paymentConfirm.noteCash1')}</p><p>{t('staff.paymentConfirm.noteCash2')}</p></>
            ) : (
              <><p>{t('staff.paymentConfirm.noteQr1')}</p><p>{t('staff.paymentConfirm.noteQr2')}</p><p>{t('staff.paymentConfirm.noteQr3')}</p><p>{t('staff.paymentConfirm.noteQr4')}</p></>
            )}
          </div>
        </div>
      </div>

      <ScrollToTopButton />
    </div>
  )
}

export default StaffPaymentConfirm