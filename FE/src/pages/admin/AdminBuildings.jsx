// src/pages/admin/AdminBuildings.jsx
import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Search, RefreshCcw, Building2, Plus, Pencil, Trash2, MapPin, Clock, Layers, ShieldCheck } from 'lucide-react'
import { toast } from 'react-toastify'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import {
  getBuildingsAPI, createBuildingAPI, updateBuildingAPI, deleteBuildingAPI, USE_MOCK
} from '../../apis/adminApi'

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—'

const AdminBuildings = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [trigger, setTrigger] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getBuildingsAPI(search.trim() ? { search: search.trim() } : {})
      setRows(res.data.data || [])
    } catch {
      toast.error('Không thể tải danh sách cơ sở')
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 80)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  useEffect(() => { fetchData() }, [fetchData])

  const applyFilters = () => setTrigger(t => t + 1)

  const openCreate = () => {
    setEditing(null)
    reset({ BuildingName: '', Address: '', OperatingHours: '', TotalFloors: '' })
    setModalOpen(true)
  }
  const openEdit = (b) => {
    setEditing(b)
    reset({
      BuildingName: b.BuildingName,
      Address: b.Address || '',
      OperatingHours: b.OperatingHours || '',
      TotalFloors: b.TotalFloors ?? ''
    })
    setModalOpen(true)
  }

  const onSubmit = async (form) => {
    try {
      if (editing) {
        await updateBuildingAPI(editing.BuildingID, form)
        toast.success('Cập nhật cơ sở thành công')
      } else {
        await createBuildingAPI(form)
        toast.success('Thêm cơ sở thành công')
      }
      setModalOpen(false)
      applyFilters()
    } catch {
      toast.error('Thao tác thất bại')
    }
  }

  const confirmDelete = async () => {
    setBusy(true)
    try {
      await deleteBuildingAPI(deleting.BuildingID)
      toast.success('Đã xoá cơ sở')
      setDeleting(null)
      applyFilters()
    } catch {
      toast.error('Không thể xoá cơ sở')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-sm border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">Quản trị / Cơ sở</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Quản lý cơ sở / bãi đỗ</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={applyFilters}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            <RefreshCcw size={16} /> Làm mới
          </button>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:scale-95 transition-all">
            <Plus size={16} /> Thêm cơ sở
          </button>
        </div>
      </div>

      {USE_MOCK && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm font-semibold text-amber-700 flex items-center gap-2">
          <ShieldCheck size={18} />
          Đang dùng dữ liệu mẫu — thao tác chỉ lưu tạm trong phiên. Sẽ lưu thật khi backend Admin kết nối.
        </div>
      )}

      {/* Search */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/60">
        <div className="relative mb-5 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Tìm tên cơ sở, địa chỉ..."
            className="w-full rounded-xl bg-slate-50 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center text-slate-500">
            <Building2 size={44} className="text-slate-300 mb-3" />
            <p className="font-bold text-slate-700">Chưa có cơ sở nào</p>
            <p className="text-sm mt-1 text-slate-500">Bấm &quot;Thêm cơ sở&quot; để tạo mới.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map(b => (
              <div key={b.BuildingID} className="rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition group">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                    <Building2 size={22} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEdit(b)} title="Chỉnh sửa"
                      className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleting(b)} title="Xoá"
                      className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-3">{b.BuildingName}</h3>
                <div className="mt-3 space-y-1.5 text-sm text-slate-500">
                  <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400 shrink-0" /> {b.Address || '—'}</p>
                  <p className="flex items-center gap-2"><Clock size={14} className="text-slate-400 shrink-0" /> {b.OperatingHours || '—'}</p>
                  <p className="flex items-center gap-2"><Layers size={14} className="text-slate-400 shrink-0" /> {b.TotalFloors ?? 0} tầng</p>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">Tạo ngày {fmtDate(b.CreatedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal tạo/sửa */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Chỉnh sửa cơ sở' : 'Thêm cơ sở mới'}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Huỷ</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên cơ sở</label>
            <input {...register('BuildingName', { required: 'Vui lòng nhập tên cơ sở' })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            {errors.BuildingName && <p className="text-xs text-red-500 mt-1">{errors.BuildingName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa chỉ</label>
            <input {...register('Address')}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giờ hoạt động</label>
              <input {...register('OperatingHours')} placeholder="06:00-22:00"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số tầng</label>
              <input type="number" min="0" {...register('TotalFloors', {
                min: { value: 0, message: 'Số tầng không hợp lệ' }
              })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
              {errors.TotalFloors && <p className="text-xs text-red-500 mt-1">{errors.TotalFloors.message}</p>}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal xác nhận xoá */}
      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Xác nhận xoá"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={busy}>Huỷ</Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={busy}>Xoá</Button>
          </>
        )}
      >
        <p className="text-sm text-slate-600">
          Bạn có chắc muốn xoá cơ sở <span className="font-bold text-slate-900">{deleting?.BuildingName}</span>?
          Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </div>
  )
}

export default AdminBuildings
