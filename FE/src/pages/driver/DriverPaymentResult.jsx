/**
 * FILE: DriverPaymentResult.jsx
 * MÔ TẢ: Trang Kết quả Thanh toán dành cho Driver.
 * Đây là trang redirect từ cổng thanh toán PayOS trả về, hiển thị chi tiết kết quả
 * giao dịch (Thành công/Hủy) cùng với các thông tin thanh toán (biển số, ô đỗ, số tiền...).
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CheckCircle2 as CheckCircleIcon,
  XCircle as CancelIcon,
  History as HistoryIcon,
  Home as HomeIcon,
  RefreshCw as RefreshIcon,
  Loader2
} from 'lucide-react'
import authorizeAxios from '../../utils/authorizeAxios'

const DriverPaymentResult = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const status = params.get('status') // 'success' | 'cancel'
  const sessionId = params.get('sessionId')

  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  const isSuccess = status === 'success'

  const fmt = (n) =>
    n != null ? new Intl.NumberFormat('vi-VN').format(Number(n)) + ' ' + t('driver.common.currency') : '--'

  const fmtTime = (val) => {
    if (!val) return '--'
    const d = new Date(String(val).replace(/Z$/, ''))
    return isNaN(d.getTime()) ? '--' : d.toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit',
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  // Lấy thông tin payment của session
  useEffect(() => {
    let ignore = false

    if (!sessionId) {
      const timer = setTimeout(() => {
        if (!ignore) {
          setLoading(false)
        }
      }, 0)

      return () => {
        ignore = true
        clearTimeout(timer)
      }
    }

    const timer = setTimeout(() => {
      const fetchPaymentInfo = async () => {
        try {
          const r = await authorizeAxios.get(`/driver/payment/session-info/${sessionId}`)
          if (!ignore) {
            setInfo(r.data?.data || null)
          }
        } catch {
          if (!ignore) {
            setInfo(null)
          }
        } finally {
          if (!ignore) {
            setLoading(false)
          }
        }
      }

      fetchPaymentInfo()
    }, 0)

    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [sessionId])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4">
      <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
      <p className="text-slate-500 font-medium">{t('driver.paymentResult.checking')}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 pt-10 pb-12 font-sans px-4">
      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100">
          {/* ── Header ── */}
          <div className={`px-6 py-10 text-center text-white relative overflow-hidden ${isSuccess ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-700'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10 backdrop-blur-sm border border-white/20">
              {isSuccess ? <CheckCircleIcon size={52} className="text-white" /> : <CancelIcon size={52} className="text-white" />}
            </div>
            <h2 className="text-2xl font-black mb-2 relative z-10 tracking-tight">
              {isSuccess ? t('driver.paymentResult.successTitle') : t('driver.paymentResult.cancelTitle')}
            </h2>
            <p className={`text-sm font-medium relative z-10 ${isSuccess ? 'text-green-50' : 'text-red-50'}`}>
              {isSuccess ? t('driver.paymentResult.successBody') : t('driver.paymentResult.cancelBody')}
            </p>
            {isSuccess && (
              <div className="inline-block mt-5 px-4 py-1.5 bg-white/20 text-white border border-white/40 rounded-full text-xs font-bold uppercase tracking-wider relative z-10">
                {t('driver.paymentResult.statusPrepaid')}
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="p-6">
            {/* Thông tin giao dịch */}
            {isSuccess && info && (
              <div className="bg-green-50 rounded-2xl border border-green-200 p-5 mb-6">
                <p className="text-[11px] font-black text-green-700 uppercase tracking-widest mb-4">
                  {t('driver.paymentResult.txDetails')}
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-green-200/60 border-dashed">
                    <span className="text-xs font-bold text-slate-500">{t('driver.payment.paidAmount')}</span>
                    <span className="text-lg font-black text-green-600">{fmt(info.PrepaidAmount || info.Amount)}</span>
                  </div>
                  {info.PlateNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">{t('driver.paymentResult.plate')}</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">{info.PlateNumber}</span>
                    </div>
                  )}
                  {info.SlotCode && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">{t('driver.paymentResult.slot')}</span>
                      <span className="text-sm font-bold text-slate-800">{info.SlotCode}</span>
                    </div>
                  )}
                  {info.VehicleName && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">{t('driver.paymentResult.vehicle')}</span>
                      <span className="text-sm font-bold text-slate-800">{info.VehicleName}</span>
                    </div>
                  )}
                  {info.EntryTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">{t('driver.paymentResult.entryAt')}</span>
                      <span className="text-sm font-bold text-slate-800">{fmtTime(info.EntryTime)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-green-200/60 border-dashed">
                    <span className="text-xs font-bold text-slate-500">{t('driver.payment.paidAt')}</span>
                    <span className="text-sm font-bold text-slate-800">{fmtTime(info.PrepaidAt || new Date())}</span>
                  </div>
                  {info.SnapshotDurationH != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500">{t('driver.paymentResult.billedHours')}</span>
                      <span className="text-sm font-bold text-slate-800">{Number(info.SnapshotDurationH).toFixed(1)}h</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lưu ý prepaid */}
            {isSuccess && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 mb-6">
                <h4 className="text-sm font-bold text-amber-800 mb-1">{t('driver.paymentResult.prepayNoteTitle')}</h4>
                <p className="text-xs font-medium text-amber-700/80">{t('driver.paymentResult.prepayNoteBody')}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-3">
              {isSuccess ? (
                <>
                  <button onClick={() => navigate('/driver/home')} className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-green-500/20">
                    <HomeIcon size={18} /> {t('driver.common.goHome')}
                  </button>
                  <button onClick={() => navigate('/driver/history')} className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold rounded-xl transition-colors shadow-sm">
                    <HistoryIcon size={18} /> {t('driver.common.viewHistory')}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/driver/payment')} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-blue-500/20">
                    <RefreshIcon size={18} /> {t('driver.paymentResult.retry')}
                  </button>
                  <button onClick={() => navigate('/driver/home')} className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold rounded-xl transition-colors shadow-sm">
                    <HomeIcon size={18} /> {t('driver.common.goHome')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriverPaymentResult