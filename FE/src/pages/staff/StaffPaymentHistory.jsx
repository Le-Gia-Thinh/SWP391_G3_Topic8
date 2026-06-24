// src/pages/staff/StaffPaymentHistory.jsx
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CreditCard, AlertCircle, CheckCircle2, Clock, Search,
  RefreshCcw, Loader2, Banknote, QrCode, Receipt, X,
  Car, MapPin, TrendingUp, Printer, FileText, XCircle,
  AlertTriangle, Info
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import staffApi from '../../apis/staffApi'

// ── Helpers ───────────────────────────────────────────────────
const formatVND = (v) => Number(v || 0).toLocaleString('vi-VN') + ' ₫'

const formatDateTime = (dt) => {
  if (!dt) return '—'
  const d = new Date(dt)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

const formatDuration = (entry, exit, minuteLabel) => {
  if (!entry) return '—'
  const end = exit ? new Date(exit) : new Date()
  const diff = Math.max(0, Math.floor((end - new Date(entry)) / 60000))
  const h = Math.floor(diff / 60); const m = diff % 60
  return h > 0 ? `${h}h ${m}m` : `${m} ${minuteLabel}`
}

// ── Print Invoice (nhận t qua tham số để có i18n) ─────────────
const printInvoice = (session, t) => {
  const win = window.open('', '_blank', 'width=420,height=650')
  if (!win) { toast.error(t('staff.paymentHistory.invoice.popupBlocked')); return }
  const inv = (k) => t(`staff.paymentHistory.invoice.${k}`)
  const minuteLabel = t('staff.paymentHistory.minute')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <title>${inv('windowTitle').replace('{{code}}', session.SessionCode || '')}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Courier New',monospace;font-size:13px;padding:24px}
      .center{text-align:center}.bold{font-weight:bold}
      .divider{border-top:1px dashed #333;margin:10px 0}
      .row{display:flex;justify-content:space-between;margin:5px 0}
      .title{font-size:18px;font-weight:bold;margin:8px 0}
      .total{font-size:15px;font-weight:bold;margin-top:8px}
      .footer{font-size:11px;color:#666;margin-top:12px}
      .surcharge{color:#c2410c}
    </style></head><body>
    <div class="center">
      <div class="bold">${inv('brand')}</div>
      <div class="title">${inv('title')}</div>
      <div>${new Date().toLocaleString('vi-VN')}</div>
    </div>
    <div class="divider"></div>
    <div class="row"><span>${inv('sessionCode')}</span><span class="bold">${session.SessionCode || '—'}</span></div>
    <div class="row"><span>${inv('plate')}</span><span class="bold">${session.PlateNumber || '—'}</span></div>
    <div class="row"><span>${inv('vehicle')}</span><span>${session.VehicleName || '—'}</span></div>
    <div class="row"><span>${inv('slot')}</span><span>${session.SlotCode || '—'}</span></div>
    <div class="row"><span>${inv('entryAt')}</span><span>${formatDateTime(session.EntryTime)}</span></div>
    <div class="row"><span>${inv('exitAt')}</span><span>${formatDateTime(session.ExitTime)}</span></div>
    <div class="row"><span>${inv('duration')}</span><span>${formatDuration(session.EntryTime, session.ExitTime, minuteLabel)}</span></div>
    <div class="divider"></div>
    ${Number(session.PrepaidAmount) > 0 ? `
      <div class="row"><span>${inv('prepaid')}</span><span>${formatVND(session.PrepaidAmount)}</span></div>
      <div class="row surcharge"><span>${inv('surcharge')}</span><span>${formatVND(session.SurchargeAmount)}</span></div>
    ` : ''}
    <div class="row total"><span>${inv('total')}</span><span>${formatVND(session.FinalAmount || session.Amount)}</span></div>
    <div class="row"><span>${inv('method')}</span><span>${session.PaymentMethod || '—'}</span></div>
    <div class="divider"></div>
    <div class="center footer"><div>${inv('thanks')}</div><div>${inv('hotline')}</div></div>
    </body></html>`
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
}

// ── Confirm Dialog (tiền mặt) ─────────────────────────────────
const CashConfirmDialog = ({ session, onConfirm, onCancel, loading }) => {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-orange-500 p-5 text-center">
          <Banknote size={32} className="mx-auto text-white mb-2" />
          <p className="text-white font-black text-lg">{t('staff.paymentHistory.cashDialog.title')}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('staff.paymentHistory.cashDialog.fieldSession')}</span>
              <span className="font-bold font-mono">{session.SessionCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('staff.paymentHistory.cashDialog.fieldPlate')}</span>
              <span className="font-bold tracking-wider">{session.PlateNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('staff.paymentHistory.cashDialog.fieldPrepaid')}</span>
              <span className="font-bold text-green-600">{formatVND(session.PrepaidAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-orange-200 pt-2">
              <span className="font-bold text-gray-700">{t('staff.paymentHistory.cashDialog.fieldDue')}</span>
              <span className="font-black text-orange-600 text-base">{formatVND(session.SurchargeAmount)}</span>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2 text-xs text-yellow-800">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span dangerouslySetInnerHTML={{ __html: t('staff.paymentHistory.cashDialog.hint', { amount: `<strong>${formatVND(session.SurchargeAmount)}</strong>` }) }} />
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} disabled={loading}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 text-sm">
              {t('staff.paymentHistory.cashDialog.cancel')}
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {t('staff.paymentHistory.cashDialog.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Banking Confirm Dialog ────────────────────────────────────
const BankingConfirmDialog = ({ session, onConfirm, onCancel, onSwitchCash, loading }) => {
  const { t } = useTranslation()
  const [checking, setChecking] = useState(true)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [hasTransfer, setHasTransfer] = useState(false)
  const pollRef = useRef(null)

  const sessionRef = useRef(session)
  useEffect(() => { sessionRef.current = session }, [session])

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const res = await staffApi.getCheckoutPreview(sessionRef.current.SessionID)
        const data = res?.data ?? res
        const p = data?.session
        if (cancelled) return
        if (!p) { setChecking(false); return }
        const transferred = p.PaymentStatus === 'Prepaid' && p.SurchargeStatus === 'Pending'
        setHasTransfer(transferred)
        setPaymentInfo({
          prepaidAmount: p.PrepaidAmount,
          surchargeAmount: sessionRef.current.SurchargeAmount,
          finalAmount: sessionRef.current.FinalAmount,
          paymentMethod: p.PaymentMethod,
          prepaidAt: p.PrepaidAt || p.PaymentTime,
          orderCode: p.OrderCode
        })
      } catch {
        if (!cancelled) setHasTransfer(false)
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    check()
    pollRef.current = setInterval(check, 5000)
    return () => {
      cancelled = true
      clearInterval(pollRef.current)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={`p-5 text-center ${hasTransfer ? 'bg-blue-600' : 'bg-gray-700'}`}>
          <QrCode size={28} className="mx-auto text-white mb-2" />
          <p className="text-white font-black text-lg">{t('staff.paymentHistory.bankDialog.title')}</p>
          <p className="text-white/70 text-xs mt-1">
            {hasTransfer ? t('staff.paymentHistory.bankDialog.subReceived') : t('staff.paymentHistory.bankDialog.subPending')}
          </p>
        </div>
        <div className="p-6 space-y-4">
          {checking ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <Loader2 size={28} className="animate-spin text-blue-400" />
              <p className="text-sm text-gray-500">{t('staff.paymentHistory.bankDialog.checking')}</p>
            </div>
          ) : hasTransfer ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span className="font-bold text-green-700">{t('staff.paymentHistory.bankDialog.receivedTag')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('staff.paymentHistory.bankDialog.fieldSession')}</span>
                  <span className="font-bold font-mono">{session.SessionCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('staff.paymentHistory.bankDialog.fieldPlate')}</span>
                  <span className="font-bold">{session.PlateNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('staff.paymentHistory.bankDialog.fieldPrepaid')}</span>
                  <span className="font-bold text-green-600">{formatVND(paymentInfo?.prepaidAmount)}</span>
                </div>
                {paymentInfo?.prepaidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('staff.paymentHistory.bankDialog.fieldTime')}</span>
                    <span className="font-medium">{formatDateTime(paymentInfo.prepaidAt)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-green-200 pt-2">
                  <span className="font-bold text-gray-700">{t('staff.paymentHistory.bankDialog.fieldSurchargeDue')}</span>
                  <span className="font-black text-orange-600">{formatVND(paymentInfo?.surchargeAmount)}</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2 text-xs text-blue-800">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span dangerouslySetInnerHTML={{ __html: t('staff.paymentHistory.bankDialog.hintReceived', { amount: `<strong>${formatVND(paymentInfo?.surchargeAmount)}</strong>` }) }} />
              </div>
              <div className="flex gap-3">
                <button onClick={onCancel} disabled={loading}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 text-sm">
                  {t('staff.paymentHistory.bankDialog.cancel')}
                </button>
                <button onClick={onConfirm} disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {t('staff.paymentHistory.bankDialog.confirm')}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={16} className="text-red-500" />
                  <span className="font-bold text-red-700 text-sm">{t('staff.paymentHistory.bankDialog.notReceivedTag')}</span>
                </div>
                <p className="text-xs text-red-600" dangerouslySetInnerHTML={{ __html: t('staff.paymentHistory.bankDialog.notReceivedBody', { amount: `<strong>${formatVND(session.SurchargeAmount)}</strong>` }) }} />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm space-y-2">
                <p className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-2">{t('staff.paymentHistory.bankDialog.sessionInfo')}</p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{t('staff.paymentHistory.bankDialog.fieldSession')}</span>
                  <span className="font-bold font-mono">{session.SessionCode}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{t('staff.paymentHistory.bankDialog.fieldPlate')}</span>
                  <span className="font-bold">{session.PlateNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{t('staff.paymentHistory.bankDialog.fieldSurcharge')}</span>
                  <span className="font-black text-orange-600">{formatVND(session.SurchargeAmount)}</span>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2 text-xs text-yellow-800">
                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-yellow-600" />
                <span>{t('staff.paymentHistory.bankDialog.hintAction')}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Loader2 size={11} className="animate-spin" />
                {t('staff.paymentHistory.bankDialog.waiting')}
              </div>
              <div className="flex gap-3">
                <button onClick={onCancel}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 text-sm flex items-center justify-center gap-1.5">
                  <X size={13} /> {t('staff.paymentHistory.bankDialog.reject')}
                </button>
                <button onClick={onSwitchCash}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5">
                  <Banknote size={13} /> {t('staff.paymentHistory.bankDialog.switchCash')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Surcharge Card ────────────────────────────────────────────
const SurchargeCard = ({ session, onConfirmCash, onConfirmBanking, onPrint }) => {
  const { t } = useTranslation()
  return (
    <div className="bg-white border border-orange-200 rounded-xl shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-blue-600 font-black text-sm font-mono">{session.SessionCode}</span>
          <div className="mt-1">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 inline-flex items-center gap-1">
              <AlertCircle size={10} /> {t('staff.paymentHistory.surchargeCard.badge')}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{t('staff.paymentHistory.surchargeCard.needToCollect')}</p>
          <p className="text-xl font-black text-orange-600">{formatVND(session.SurchargeAmount)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-gray-800 text-white rounded-lg px-3 py-1.5 flex items-center gap-2">
          <Car size={12} />
          <span className="font-black text-sm tracking-wider">{session.PlateNumber}</span>
        </div>
        <span className="text-xs text-gray-500">{session.VehicleName}</span>
      </div>
      <div className="bg-orange-50 rounded-lg p-3 space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">{t('staff.paymentHistory.surchargeCard.prepaidQr')}</span>
          <span className="font-bold text-green-600">{formatVND(session.PrepaidAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">{t('staff.paymentHistory.surchargeCard.realFee')}</span>
          <span className="font-bold text-gray-700">{formatVND(session.FinalAmount)}</span>
        </div>
        <div className="flex justify-between border-t border-orange-200 pt-1.5">
          <span className="font-bold text-gray-600">{t('staff.paymentHistory.surchargeCard.surcharge')}</span>
          <span className="font-black text-orange-600">{formatVND(session.SurchargeAmount)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <MapPin size={11} />
        <span>{session.SlotCode} · {session.ZoneName} · {session.FloorName}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className="font-medium">{session.DriverName}</span>
        {session.PhoneNumber && <span className="text-gray-400">· {session.PhoneNumber}</span>}
      </div>
      <div className="flex gap-2 mt-1">
        <button onClick={() => onConfirmCash(session)}
          className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors">
          <Banknote size={13} /> {t('staff.paymentHistory.surchargeCard.cash')}
        </button>
        <button onClick={() => onConfirmBanking(session)}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors">
          <QrCode size={13} /> {t('staff.paymentHistory.surchargeCard.banking')}
        </button>
        <button onClick={() => onPrint(session)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors" title={t('staff.paymentHistory.surchargeCard.printTitle')}>
          <Printer size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Payment Badge ─────────────────────────────────────────────
const PaymentBadge = ({ status, surchargeStatus }) => {
  const { t } = useTranslation()
  if (surchargeStatus === 'Pending') return (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 inline-flex items-center gap-1">
      <AlertCircle size={10} /> {t('staff.paymentHistory.badges.surchargePending')}
    </span>
  )
  const map = {
    Completed: { label: t('staff.paymentHistory.badges.completed'), cls: 'bg-green-100 text-green-700 border-green-200' },
    Prepaid: { label: t('staff.paymentHistory.badges.prepaid'), cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    Pending: { label: t('staff.paymentHistory.badges.pending'), cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    Failed: { label: t('staff.paymentHistory.badges.failed'), cls: 'bg-red-100 text-red-600 border-red-200' },
    Cancelled: { label: t('staff.paymentHistory.badges.cancelled'), cls: 'bg-gray-100 text-gray-500 border-gray-200' }
  }
  const s = map[status] || map.Pending
  return <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${s.cls}`}>{s.label}</span>
}

// ── History Row ───────────────────────────────────────────────
const HistoryRow = ({ session, onPrint }) => {
  const { t } = useTranslation()
  const minuteLabel = t('staff.paymentHistory.minute')
  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="py-3 px-4">
        <p className="font-bold text-blue-600 text-sm font-mono">{session.SessionCode}</p>
        <p className="text-xs text-gray-400">{formatDateTime(session.EntryTime)}</p>
      </td>
      <td className="py-3 px-4">
        <div className="bg-gray-800 text-white rounded px-2 py-0.5 text-xs font-bold tracking-wider inline-block">
          {session.PlateNumber}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{session.VehicleName}</p>
      </td>
      <td className="py-3 px-4">
        <p className="text-sm font-medium text-gray-700">{session.DriverName || '—'}</p>
        <p className="text-xs text-gray-400">{session.SlotCode}</p>
      </td>
      <td className="py-3 px-4 text-xs text-gray-500">
        {formatDuration(session.EntryTime, session.ExitTime, minuteLabel)}
      </td>
      <td className="py-3 px-4">
        <p className="font-black text-gray-800 text-sm">{formatVND(session.FinalAmount || session.Amount)}</p>
        {Number(session.PrepaidAmount) > 0 && (
          <p className="text-xs text-green-600">{t('staff.paymentHistory.row.qrPrefix')} {formatVND(session.PrepaidAmount)}</p>
        )}
        {Number(session.SurchargeAmount) > 0 && (
          <p className="text-xs text-orange-600">{t('staff.paymentHistory.row.surchargePrefix')} {formatVND(session.SurchargeAmount)}</p>
        )}
      </td>
      <td className="py-3 px-4">
        <PaymentBadge status={session.PaymentStatus} surchargeStatus={session.SurchargeStatus} />
      </td>
      <td className="py-3 px-4 text-xs text-gray-500">{session.PaymentMethod || '—'}</td>
      <td className="py-3 px-4">
        <button onClick={() => onPrint(session)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={t('staff.paymentHistory.row.printTitle')}>
          <Printer size={15} />
        </button>
      </td>
    </tr>
  )
}

// ── Tab: Chờ thu phụ trội ─────────────────────────────────────
const SurchargeTab = () => {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [cashDialog, setCashDialog] = useState(null)
  const [bankDialog, setBankDialog] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const res = await staffApi.searchSessions({ status: 'Pending' })
        const raw = res?.data ?? res ?? []
        const pending = (Array.isArray(raw) ? raw : []).filter(s => s.SurchargeStatus === 'Pending')
        if (!cancelled) setSessions(pending)
      } catch {
        if (!cancelled) toast.error(t('staff.paymentHistory.surcharge.loadFail'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [refreshTrigger, t])

  const reload = () => setRefreshTrigger(tt => tt + 1)

  const handleConfirmCash = async () => {
    if (!cashDialog) return
    setConfirming(true)
    try {
      await staffApi.confirmSurcharge(cashDialog.SessionID, 'Cash')
      toast.success(t('staff.paymentHistory.surcharge.cashSuccess', { amount: formatVND(cashDialog.SurchargeAmount) }))
      setCashDialog(null)
      reload()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('staff.paymentHistory.surcharge.cashFail'))
    } finally {
      setConfirming(false)
    }
  }

  const handleConfirmBanking = async () => {
    if (!bankDialog) return
    setConfirming(true)
    try {
      await staffApi.confirmSurcharge(bankDialog.SessionID, 'Banking')
      toast.success(t('staff.paymentHistory.surcharge.bankSuccess', { amount: formatVND(bankDialog.SurchargeAmount) }))
      setBankDialog(null)
      reload()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('staff.paymentHistory.surcharge.bankFail'))
    } finally {
      setConfirming(false)
    }
  }

  const handleSwitchToCash = () => {
    const session = bankDialog
    setBankDialog(null)
    setTimeout(() => setCashDialog(session), 100)
  }

  const totalSurcharge = sessions.reduce((sum, s) => sum + Number(s.SurchargeAmount || 0), 0)

  return (
    <>
      {cashDialog && (
        <CashConfirmDialog
          session={cashDialog}
          onConfirm={handleConfirmCash}
          onCancel={() => setCashDialog(null)}
          loading={confirming}
        />
      )}
      {bankDialog && (
        <BankingConfirmDialog
          session={bankDialog}
          onConfirm={handleConfirmBanking}
          onCancel={() => setBankDialog(null)}
          onSwitchCash={handleSwitchToCash}
          loading={confirming}
        />
      )}

      <div className="space-y-5">
        {sessions.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-orange-600">{sessions.length}</p>
              <p className="text-xs text-orange-700 font-semibold mt-1">{t('staff.paymentHistory.surcharge.pendingCount')}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <p className="text-xl font-black text-blue-600">{formatVND(totalSurcharge)}</p>
              <p className="text-xs text-blue-700 font-semibold mt-1">{t('staff.paymentHistory.surcharge.totalDue')}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-center">
              <button onClick={reload} disabled={loading}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-semibold">
                <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> {t('staff.paymentHistory.surcharge.refresh')}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-blue-400" size={28} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
            <CheckCircle2 size={40} className="text-green-300 mx-auto mb-3" />
            <p className="text-base font-bold text-gray-700">{t('staff.paymentHistory.surcharge.emptyTitle')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('staff.paymentHistory.surcharge.emptyDesc')}</p>
            <button onClick={reload} className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1 mx-auto">
              <RefreshCcw size={13} /> {t('staff.paymentHistory.surcharge.refresh')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map(s => (
              <SurchargeCard
                key={s.SessionID}
                session={s}
                onConfirmCash={setCashDialog}
                onConfirmBanking={setBankDialog}
                onPrint={(sess) => printInvoice(sess, t)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── Tab: Lịch sử thanh toán ───────────────────────────────────
const HistoryTab = () => {
  const { t } = useTranslation()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [searchTrigger, setSearchTrigger] = useState(0)

  const keywordRef = useRef(keyword)
  const fromDateRef = useRef(fromDate)
  const toDateRef = useRef(toDate)
  useEffect(() => { keywordRef.current = keyword }, [keyword])
  useEffect(() => { fromDateRef.current = fromDate }, [fromDate])
  useEffect(() => { toDateRef.current = toDate }, [toDate])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        const params = { status: 'Completed' }
        if (keywordRef.current.trim()) params.keyword = keywordRef.current.trim()
        if (fromDateRef.current) params.fromDate = fromDateRef.current
        if (toDateRef.current) params.toDate = toDateRef.current + 'T23:59:59'
        const res = await staffApi.searchSessions(params)
        const raw = res?.data ?? res ?? []
        if (!cancelled) setSessions(Array.isArray(raw) ? raw : [])
      } catch {
        if (!cancelled) toast.error(t('staff.paymentHistory.history.loadFail'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [searchTrigger, t])

  const handleSearch = () => setSearchTrigger(tt => tt + 1)

  const filtered = sessions.filter(s => {
    if (statusFilter === 'surcharge') return Number(s.SurchargeAmount) > 0
    if (statusFilter === 'prepaid') return Number(s.PrepaidAmount) > 0
    if (statusFilter === 'cash') return s.PaymentMethod === 'Cash'
    if (statusFilter === 'banking') return s.PaymentMethod === 'Banking'
    return true
  })

  const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.FinalAmount || s.Amount || 0), 0)

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="relative flex-1 min-w-50">
            <Search className="absolute left-3.5 top-3 text-gray-400" size={15} />
            <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t('staff.paymentHistory.history.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500">
            <option value="all">{t('staff.paymentHistory.history.filterAll')}</option>
            <option value="cash">{t('staff.paymentHistory.history.filterCash')}</option>
            <option value="banking">{t('staff.paymentHistory.history.filterBanking')}</option>
            <option value="prepaid">{t('staff.paymentHistory.history.filterPrepaid')}</option>
            <option value="surcharge">{t('staff.paymentHistory.history.filterSurcharge')}</option>
          </select>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" />
          <span className="text-gray-400 self-center text-sm">→</span>
          <input type="date" value={toDate} min={fromDate || undefined} onChange={e => setToDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleSearch} disabled={loading}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} {t('staff.paymentHistory.history.search')}
          </button>
          {(keyword || fromDate || toDate || statusFilter !== 'all') && (
            <button onClick={() => { setKeyword(''); setFromDate(''); setToDate(''); setStatusFilter('all') }}
              className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1.5">
              <X size={13} /> {t('staff.paymentHistory.history.clear')}
            </button>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
            <span>{t('staff.paymentHistory.history.txCount', { n: filtered.length })}</span>
            <span className="flex items-center gap-1">
              <TrendingUp size={13} className="text-green-500" />
              {t('staff.paymentHistory.history.total')} <strong className="text-gray-800 ml-1">{formatVND(totalRevenue)}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-400" size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">{t('staff.paymentHistory.history.empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">{t('staff.paymentHistory.history.colSession')}</th>
                  <th className="py-3 px-4">{t('staff.paymentHistory.history.colPlate')}</th>
                  <th className="py-3 px-4">{t('staff.paymentHistory.history.colDriver')}</th>
                  <th className="py-3 px-4">{t('staff.paymentHistory.history.colTime')}</th>
                  <th className="py-3 px-4">{t('staff.paymentHistory.history.colAmount')}</th>
                  <th className="py-3 px-4">{t('staff.paymentHistory.history.colStatus')}</th>
                  <th className="py-3 px-4">{t('staff.paymentHistory.history.colMethod')}</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(s => (
                  <HistoryRow key={s.SessionID} session={s} onPrint={(sess) => printInvoice(sess, t)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function StaffPaymentHistory() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [surchargeCount, setSurchargeCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    staffApi.searchSessions({ status: 'Pending' })
      .then(res => {
        if (cancelled) return
        const raw = res?.data ?? res ?? []
        const count = (Array.isArray(raw) ? raw : []).filter(s => s.SurchargeStatus === 'Pending').length
        setSurchargeCount(count)
      })
      .catch(() => { })
    return () => { cancelled = true }
  }, [tab])

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-8">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard size={24} className="text-blue-600" /> {t('staff.paymentHistory.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('staff.paymentHistory.subtitle')}</p>
        </div>
        <button onClick={() => navigate('/staff/checkout')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm">
          <Receipt size={15} /> {t('staff.paymentHistory.newCheckout')}
        </button>
      </header>

      <div className="flex bg-white rounded-xl border border-gray-200 shadow-sm p-1 gap-1 mb-6 w-fit">
        <button onClick={() => setTab(0)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 0 ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}>
          <AlertCircle size={15} />
          {t('staff.paymentHistory.tabSurcharge')}
          {surchargeCount > 0 && (
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${tab === 0 ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
              }`}>{surchargeCount}</span>
          )}
        </button>
        <button onClick={() => setTab(1)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 1 ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}>
          <Clock size={15} /> {t('staff.paymentHistory.tabHistory')}
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {tab === 0 ? <SurchargeTab /> : <HistoryTab />}
      </div>
    </div>
  )
}