// src/pages/admin/AdminAuditLog.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  Search, RefreshCcw, ScrollText, ShieldCheck, LogIn, LogOut, Plus, Pencil, Trash2, Lock, Unlock, Activity
} from 'lucide-react'
import { toast } from 'react-toastify'
import Badge from '../../components/ui/Badge'
import { getAuditLogsAPI, USE_MOCK } from '../../apis/adminApi'

const roleBadge = {
  Driver: 'primary',
  Staff: 'success',
  Manager: 'warning',
  Admin: 'danger'
}

// Cấu hình hiển thị theo loại hành động
const actionMeta = {
  Login: { label: 'Đăng nhập', icon: LogIn, cls: 'bg-sky-50 text-sky-600 border-sky-200/60' },
  Logout: { label: 'Đăng xuất', icon: LogOut, cls: 'bg-slate-50 text-slate-600 border-slate-200/60' },
  Create: { label: 'Tạo mới', icon: Plus, cls: 'bg-emerald-50 text-emerald-600 border-emerald-200/60' },
  Update: { label: 'Cập nhật', icon: Pencil, cls: 'bg-amber-50 text-amber-600 border-amber-200/60' },
  Delete: { label: 'Xoá', icon: Trash2, cls: 'bg-rose-50 text-rose-600 border-rose-200/60' },
  Lock: { label: 'Khoá', icon: Lock, cls: 'bg-red-50 text-red-600 border-red-200/60' },
  Unlock: { label: 'Mở khoá', icon: Unlock, cls: 'bg-teal-50 text-teal-600 border-teal-200/60' }
}

const ACTION_FILTERS = ['Login', 'Logout', 'Create', 'Update', 'Delete', 'Lock', 'Unlock']

const fmtDateTime = (d) => d
  ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '—'

const AdminAuditLog = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [trigger, setTrigger] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (actionFilter) params.action = actionFilter
      const res = await getAuditLogsAPI(params)
      setRows(res.data.data || [])
    } catch {
      toast.error('Không thể tải nhật ký hoạt động')
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 80)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  useEffect(() => { fetchData() }, [fetchData])

  const applyFilters = () => setTrigger(t => t + 1)

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">Quản trị / Giám sát</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Nhật ký hoạt động</h1>
        </div>
        <button onClick={applyFilters}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition self-start">
          <RefreshCcw size={16} /> Làm mới
        </button>
      </div>

      {USE_MOCK && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm font-semibold text-amber-700 flex items-center gap-2">
          <ShieldCheck size={18} />
          Đang dùng dữ liệu mẫu — nhật ký sẽ được ghi & lấy từ DB khi backend tạo bảng AuditLogs.
        </div>
      )}

      {/* Filters + Table */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/60">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center mb-5">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()}
              placeholder="Tìm theo người dùng, mô tả, đối tượng..."
              className="w-full rounded-xl bg-slate-50 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setTrigger(t => t + 1) }}
            className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none border border-slate-200 hover:border-slate-300 focus:border-blue-500 transition">
            <option value="">Tất cả hành động</option>
            {ACTION_FILTERS.map(a => <option key={a} value={a}>{actionMeta[a].label}</option>)}
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto overflow-y-auto max-h-130">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : rows.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center text-slate-500">
                <ScrollText size={44} className="text-slate-300 mb-3" />
                <p className="font-bold text-slate-700">Chưa có nhật ký</p>
                <p className="text-sm mt-1 text-slate-500">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
              </div>
            ) : (
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Người thực hiện</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Hành động</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Đối tượng</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Chi tiết</th>
                    <th className="px-5 py-4 font-bold text-[12px] text-slate-500 bg-slate-50">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(log => {
                    const meta = actionMeta[log.Action] || { label: log.Action, icon: Activity, cls: 'bg-slate-50 text-slate-600 border-slate-200/60' }
                    const Icon = meta.icon
                    return (
                      <tr key={log.LogID} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-600">
                              {log.UserName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{log.UserName}</p>
                              <Badge variant={roleBadge[log.RoleName] || 'default'} className="mt-0.5">{log.RoleName}</Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border ${meta.cls}`}>
                            <Icon size={13} /> {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-700">{log.Target || '—'}</td>
                        <td className="px-5 py-4 text-slate-600">{log.Description}</td>
                        <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">{fmtDateTime(log.CreatedAt)}</td>
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

export default AdminAuditLog
