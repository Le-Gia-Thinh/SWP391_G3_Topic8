// src/pages/manager/ManagerUnpaid.jsx
import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCcw, AlertTriangle, Clock, CircleDollarSign, Car, Download } from 'lucide-react'
import { toast } from 'react-toastify'
import { getUnpaidSessionsAPI } from '../../apis/managerApi'

const fmtVnd = (n) => n != null ? Number(n).toLocaleString('vi-VN') + 'đ' : '—'
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
}) : '—'
const fmtDur = (m) => {
  if (m == null) return '—'
  const h = Math.floor(m / 60)
  return `${h}h${m % 60}m`
}

function exportCsv(rows) {
  if (!rows.length) { toast.info('Không có dữ liệu để xuất'); return }
  const cols = ['SessionCode', 'PlateNumber', 'DriverName', 'DriverPhone', 'VehicleName',
    'SlotCode', 'ZoneName', 'EntryTime', 'SessionStatus', 'PaymentStatus', 'Amount', 'SurchargeAmount']
  const escape = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => escape(r[c])).join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'xe-chua-thanh-toan.csv'; a.click()
  URL.revokeObjectURL(url)
  toast.success('Đã xuất file CSV')
}

const ManagerUnpaid = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [trigger, setTrigger] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getUnpaidSessionsAPI(search.trim() ? { search: search.trim() } : {})
      setRows(res.data.data || [])
    } catch {
      toast.error('Không thể tải danh sách xe chưa thanh toán')
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 80)
    }
  }, [trigger])
  useEffect(() => { fetchData() }, [fetchData])

  const doSearch = () => setTrigger(t => t + 1)

  // Tổng tiền còn phải thu (ước tính)
  const totalOwed = rows.reduce((s, r) => {
    const owe = r.SurchargeStatus === 'Pending'
      ? Number(r.SurchargeAmount || 0)
      : Number(r.FinalAmount || r.Amount || 0)
    return s + owe
  }, 0)

  const stillParking = rows.filter(r => r.SessionStatus === 'Active').length

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">Giám sát / Công nợ</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Xe chưa thanh toán</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportCsv(rows)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            <Download size={16} /> Xuất CSV
          </button>
          <button onClick={doSearch}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            <RefreshCcw size={16} /> Làm mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-amber-500" /><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Tổng số phiên</p></div>
          <p className="text-3xl font-black text-slate-800">{rows.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Clock size={16} className="text-blue-500" /><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Còn đang đỗ</p></div>
          <p className="text-3xl font-black text-slate-800">{stillParking}</p>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><CircleDollarSign size={16} className="text-red-500" /><p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Ước tính cần thu</p></div>
          <p className="text-3xl font-black text-red-600">{fmtVnd(totalOwed)}</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/60">
        <div className="relative mb-5 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="Tìm biển số, tài xế, mã slot, mã phiên..."
            className="w-full rounded-xl bg-slate-50 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto overflow-y-auto max-h-130">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : rows.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center text-slate-500">
                <CircleDollarSign size={44} className="text-emerald-300 mb-3" />
                <p className="font-bold text-slate-700">Không có xe nào nợ thanh toán</p>
                <p className="text-sm mt-1 text-slate-500">Tất cả phiên đã được thanh toán đầy đủ.</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Phiên</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Tài xế / Biển số</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Vị trí</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Vào lúc</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Thời gian</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Tình trạng</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50 text-right">Cần thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(r => {
                    const owe = r.SurchargeStatus === 'Pending'
                      ? Number(r.SurchargeAmount || 0)
                      : Number(r.FinalAmount || r.Amount || 0)
                    return (
                      <tr key={r.SessionID} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {r.SessionCode}
                          <p className="text-[11px] font-medium text-slate-400 mt-0.5 flex items-center gap-1"><Car size={11} /> {r.VehicleName}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-700">{r.DriverName || '—'}</p>
                          <p className="text-xs text-slate-500">{r.PlateNumber} {r.DriverPhone && `· ${r.DriverPhone}`}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-blue-600">{r.SlotCode}</p>
                          <p className="text-xs text-slate-400">{r.ZoneName} · {r.FloorName}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs">{fmtDateTime(r.EntryTime)}</td>
                        <td className="px-5 py-4 font-semibold text-slate-700">{fmtDur(r.DurationMinutes)}</td>
                        <td className="px-5 py-4">
                          {r.SessionStatus === 'Active' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200/60">
                              <Clock size={12} /> Đang đỗ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200/60">
                              <AlertTriangle size={12} /> Đã ra · chưa trả
                            </span>
                          )}
                          {r.SurchargeStatus === 'Pending' && (
                            <p className="text-[11px] text-red-500 font-semibold mt-1">Còn phụ trội</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-black text-red-600">{owe > 0 ? fmtVnd(owe) : 'Chờ tính'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagerUnpaid