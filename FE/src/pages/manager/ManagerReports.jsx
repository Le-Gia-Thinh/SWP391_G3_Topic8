/**
 * FILE: ManagerReports.jsx
 * MÔ TẢ: Trang Báo cáo Thống kê dành cho Manager.
 * Xem báo cáo doanh thu, lượt xe vào/ra, tỷ lệ lấp đầy (theo tầng/loại xe) và mật độ sử dụng theo giờ. Hỗ trợ xuất CSV.
 */

// src/pages/manager/ManagerReports.jsx
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText, Download, DollarSign, CarFront,
  RefreshCcw, Calendar, Clock, BarChart3, Sparkles
} from 'lucide-react'
import { toast } from 'react-toastify'
import {
  getRevenueReportAPI,
  getOccupancyReportAPI,
  getSessionsReportAPI,
  getPeakHoursReportAPI
} from '../../apis/managerApi'

const fmtVnd = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ'
const fmtNum = (n) => Number(n || 0).toLocaleString('vi-VN')
const todayStr = () => new Date().toISOString().slice(0, 10)
const daysAgoStr = (d) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10)

const ManagerReports = () => {
  const { t } = useTranslation()
  const [tab, setTab] = useState('revenue')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [startDate, setStartDate] = useState(daysAgoStr(30))
  const [endDate, setEndDate] = useState(todayStr())

  const [revenue, setRevenue] = useState(null)
  const [sessions, setSessions] = useState(null)
  const [occupancy, setOccupancy] = useState(null)
  const [peak, setPeak] = useState(null)

  const TABS = [
    { key: 'revenue', label: t('manager.reports.tabs.revenue'), icon: DollarSign },
    { key: 'sessions', label: t('manager.reports.tabs.sessions'), icon: CarFront },
    { key: 'occupancy', label: t('manager.reports.tabs.occupancy'), icon: BarChart3 },
    { key: 'peak', label: t('manager.reports.tabs.peak'), icon: Clock }
  ]

  const exportCsv = useCallback((filename, rows) => {
    if (!rows || rows.length === 0) {
      toast.info(t('manager.reports.exportEmpty'))
      return
    }
    const headers = Object.keys(rows[0])
    const escape = (v) => {
      const s = v == null ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => escape(r[h])).join(','))
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    toast.success(t('manager.reports.exportSuccess'))
  }, [t])

  const fetchReport = useCallback(async (which) => {
    setLoading(true)
    try {
      const params = { startDate, endDate }
      if (which === 'revenue') {
        const res = await getRevenueReportAPI(params)
        setRevenue(res.data.data)
      } else if (which === 'sessions') {
        const res = await getSessionsReportAPI(params)
        setSessions(res.data.data)
      } else if (which === 'occupancy') {
        const res = await getOccupancyReportAPI()
        setOccupancy(res.data.data)
      } else if (which === 'peak') {
        const res = await getPeakHoursReportAPI(params)
        setPeak(res.data.data)
      }
    } catch {
      toast.error(t('manager.reports.loadFail'))
    } finally {
      setLoading(false)
      setTimeout(() => setMounted(true), 80)
    }
  }, [startDate, endDate, t])

  useEffect(() => { fetchReport(tab) }, [tab, fetchReport])

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">{t('manager.reports.eyebrow')}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{t('manager.reports.title')}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm font-bold bg-linear-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent drop-shadow-sm">
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
            {t('manager.reports.subtitle')}
          </p>
        </div>
        <button onClick={() => fetchReport(tab)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition self-start">
          <RefreshCcw size={16} /> {t('manager.reports.refresh')}
        </button>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {TABS.map(tb => {
              const Icon = tb.icon
              const active = tab === tb.key
              return (
                <button key={tb.key} onClick={() => setTab(tb.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${active ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                  <Icon size={15} /> {tb.label}
                </button>
              )
            })}
          </div>
          {tab !== 'occupancy' && (
            <div className="flex items-center gap-2 lg:ml-auto">
              <Calendar size={16} className="text-slate-400" />
              <input type="date" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
              <span className="text-slate-400">→</span>
              <input type="date" value={endDate} min={startDate} max={todayStr()} onChange={e => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500" />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {tab === 'revenue' && <RevenueTab data={revenue} mounted={mounted} exportCsv={exportCsv} />}
          {tab === 'sessions' && <SessionsTab data={sessions} exportCsv={exportCsv} />}
          {tab === 'occupancy' && <OccupancyTab data={occupancy} mounted={mounted} />}
          {tab === 'peak' && <PeakTab data={peak} />}
        </>
      )}
    </div>
  )
}

const RevenueTab = ({ data, mounted, exportCsv }) => {
  const { t } = useTranslation()
  if (!data) return <Empty />
  const { summary = {}, chart = [], byVehicle = [] } = data
  const max = Math.max(...chart.map(c => Number(c.TotalRevenue) || 0), 1)

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg shadow-blue-500/20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-100 mb-1">{t('manager.reports.revenue.totalLabel')}</p>
          <p className="text-4xl font-black tracking-tight">{fmtVnd(summary.TotalRevenue)}</p>
          <p className="text-sm text-blue-200 mt-1">
            {t('manager.reports.revenue.txInfo', { count: fmtNum(summary.TotalTransactions), avg: fmtVnd(summary.AvgPerTransaction) })}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-blue-200 text-xs">{t('manager.reports.revenue.cash')}</p>
            <p className="font-bold">{fmtVnd(summary.CashRevenue)}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-blue-200 text-xs">{t('manager.reports.revenue.banking')}</p>
            <p className="font-bold">{fmtVnd(summary.BankingRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">{t('manager.reports.revenue.chartTitle')}</h2>
            <button onClick={() => exportCsv(t('manager.reports.revenue.csvName'), chart)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
              <Download size={14} /> {t('manager.reports.exportCsv')}
            </button>
          </div>
          {chart.length === 0 ? <p className="text-sm text-slate-400 text-center py-10">{t('manager.reports.noData')}</p> : (
            <div className="flex items-end justify-between gap-2 min-h-50">
              {chart.slice(-14).map((c, i) => {
                const pct = Math.round((Number(c.TotalRevenue) / max) * 100)
                return (
                  <div key={i} className="group relative flex h-full w-full flex-col items-center justify-end gap-2">
                    <div className="absolute -top-10 z-10 scale-0 rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold text-white opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap">
                      {fmtVnd(c.TotalRevenue)}
                    </div>
                    <div className="relative h-[160px] w-full max-w-9 rounded-t-lg bg-slate-50 overflow-hidden border border-slate-100">
                      <div className="absolute bottom-0 w-full rounded-t-lg bg-linear-to-t from-blue-600 to-sky-400 transition-all duration-700"
                        style={{ height: mounted ? `${Math.max(pct, 2)}%` : '0%' }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 -rotate-45 origin-center whitespace-nowrap mt-1">
                      {String(c.Period).slice(0, 10).slice(5)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-5">{t('manager.reports.revenue.byVehicleTitle')}</h2>
          <div className="space-y-4">
            {byVehicle.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">{t('manager.reports.noData')}</p> :
              byVehicle.map((v, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-800">{v.VehicleName}</p>
                    <p className="text-xs text-slate-400">{t('manager.reports.revenue.txCount', { n: fmtNum(v.TransactionCount) })}</p>
                  </div>
                  <p className="font-black text-slate-900">{fmtVnd(v.TotalRevenue)}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const SessionsTab = ({ data, exportCsv }) => {
  const { t } = useTranslation()
  if (!data) return <Empty />
  const { summary = {}, dailyTrend = [], byVehicle = [] } = data
  const avgMin = Math.round(summary.AvgParkingMinutes || 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: t('manager.reports.sessions.total'), value: fmtNum(summary.TotalSessions), color: 'from-sky-500 to-blue-600' },
          { label: t('manager.reports.sessions.active'), value: fmtNum(summary.ActiveSessions), color: 'from-emerald-500 to-teal-600' },
          { label: t('manager.reports.sessions.completed'), value: fmtNum(summary.CompletedSessions), color: 'from-violet-500 to-fuchsia-600' },
          { label: t('manager.reports.sessions.avgDuration'), value: `${Math.floor(avgMin / 60)}h${avgMin % 60}m`, color: 'from-orange-500 to-amber-600' }
        ].map(s => (
          <div key={s.label} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
            <p className="text-3xl font-black text-slate-800">{s.value}</p>
            <div className={`mt-2 inline-flex rounded-lg bg-linear-to-br ${s.color} px-2.5 py-1 text-xs font-bold text-white`}>—</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">{t('manager.reports.sessions.byVehicleTitle')}</h2>
          <button onClick={() => exportCsv(t('manager.reports.sessions.csvName'), byVehicle)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition">
            <Download size={14} /> {t('manager.reports.exportCsv')}
          </button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 font-bold uppercase text-[11px]">{t('manager.reports.sessions.colVehicle')}</th>
                <th className="px-5 py-3 font-bold uppercase text-[11px]">{t('manager.reports.sessions.colCount')}</th>
                <th className="px-5 py-3 font-bold uppercase text-[11px]">{t('manager.reports.sessions.colAvg')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {byVehicle.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">{t('manager.reports.noData')}</td></tr>
              ) : byVehicle.map((v, i) => {
                const m = Math.round(v.AvgMinutes || 0)
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-bold text-slate-800">{v.VehicleName}</td>
                    <td className="px-5 py-3 font-semibold text-slate-700">{fmtNum(v.SessionCount)}</td>
                    <td className="px-5 py-3 text-slate-500">{Math.floor(m / 60)}h{m % 60}m</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {dailyTrend.length > 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">{t('manager.reports.sessions.trendTitle')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 font-bold uppercase text-[11px]">{t('manager.reports.sessions.colDay')}</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px]">{t('manager.reports.sessions.colTotal')}</th>
                  <th className="px-5 py-3 font-bold uppercase text-[11px]">{t('manager.reports.sessions.colCompleted')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dailyTrend.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-700">{new Date(d.Day).toLocaleDateString('vi-VN')}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">{fmtNum(d.TotalSessions)}</td>
                    <td className="px-5 py-3 text-emerald-600 font-semibold">{fmtNum(d.Completed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const OccupancyTab = ({ data, mounted }) => {
  const { t } = useTranslation()
  if (!data) return <Empty />
  const { byFloor = [], byVehicleType = [] } = data

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-5">{t('manager.reports.occupancy.byFloorTitle')}</h2>
        <div className="space-y-5">
          {byFloor.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">{t('manager.reports.noData')}</p> :
            byFloor.map((f, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm font-semibold text-slate-600 mb-2">
                  <span className="truncate">{f.BuildingName} · {f.FloorName}</span>
                  <span className="text-slate-900 ml-2">{f.OccupancyPct}% <span className="text-slate-400 font-normal">({f.Occupied}/{f.TotalSlots})</span></span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-linear-to-r from-blue-600 to-sky-400 transition-all duration-1000"
                    style={{ width: mounted ? `${f.OccupancyPct}%` : '0%' }} />
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-5">{t('manager.reports.occupancy.byVehicleTitle')}</h2>
        <div className="space-y-5">
          {byVehicleType.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">{t('manager.reports.noData')}</p> :
            byVehicleType.map((v, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm font-semibold text-slate-600 mb-2">
                  <span>{v.VehicleName}</span>
                  <span className="text-slate-900 ml-2">{v.OccupancyPct}% <span className="text-slate-400 font-normal">({v.Occupied}/{v.TotalSlots})</span></span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-linear-to-r from-violet-600 to-fuchsia-400 transition-all duration-1000"
                    style={{ width: mounted ? `${v.OccupancyPct}%` : '0%' }} />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

const PeakTab = ({ data }) => {
  const { t } = useTranslation()
  if (!data) return <Empty />
  const { byVehicle = [] } = data
  const globalMax = Math.max(1, ...byVehicle.flatMap(v => v.hours))

  const heat = (n) => {
    if (n === 0) return 'bg-slate-50 text-slate-300'
    const ratio = n / globalMax
    if (ratio > 0.75) return 'bg-blue-600 text-white'
    if (ratio > 0.5) return 'bg-blue-400 text-white'
    if (ratio > 0.25) return 'bg-blue-200 text-blue-800'
    return 'bg-blue-50 text-blue-500'
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm overflow-x-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('manager.reports.peak.title')}</h2>
          <p className="text-xs text-slate-500 mt-1">{t('manager.reports.peak.subtitle')}</p>
        </div>
      </div>
      {byVehicle.length === 0 ? <p className="text-sm text-slate-400 text-center py-10">{t('manager.reports.noData')}</p> : (
        <div className="min-w-[760px] space-y-3">
          <div className="flex items-center gap-1 pl-28">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="flex-1 text-center text-[10px] font-bold text-slate-400">{h}</div>
            ))}
          </div>
          {byVehicle.map(v => (
            <div key={v.vehicleTypeId} className="flex items-center gap-1">
              <div className="w-28 text-sm font-bold text-slate-700 truncate pr-2">{v.vehicleName}</div>
              {v.hours.map((n, h) => (
                <div key={h} title={t('manager.reports.peak.tooltip', { h, n })}
                  className={`flex-1 aspect-square min-w-[22px] rounded flex items-center justify-center text-[10px] font-bold ${heat(n)}`}>
                  {n > 0 ? n : ''}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const Empty = () => {
  const { t } = useTranslation()
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
      <FileText size={36} className="text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 font-medium">{t('manager.reports.empty')}</p>
    </div>
  )
}

export default ManagerReports