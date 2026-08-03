/**
 * FILE: AdminBuildings.jsx
 * MÔ TẢ: Trang Quản lý Tòa nhà dành cho Admin.
 * Cho phép xem danh sách, thêm mới, chỉnh sửa thông tin (Tên, Địa chỉ, Tọa độ GPS, Số tầng) và xóa tòa nhà.
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Search, RefreshCcw, Building2, Plus, Pencil, Trash2, MapPin, Clock, Layers, Users, Map, Navigation } from 'lucide-react'
import { toast } from 'react-toastify'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import {
  getBuildingsAPI, createBuildingAPI, updateBuildingAPI, deleteBuildingAPI, getBuildingAssignmentsAPI
} from '../../apis/adminApi'

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  : '—'

const AdminBuildings = () => {
  const { t } = useTranslation()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [trigger, setTrigger] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [previewCoords, setPreviewCoords] = useState(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm()
  const watchedAddress = watch('Address')
  const watchedLat = watch('Latitude')
  const watchedLng = watch('Longitude')
  const [geocoding, setGeocoding] = useState(false)

  const [staffModalBuilding, setStaffModalBuilding] = useState(null)
  const [mapModalBuilding, setMapModalBuilding] = useState(null)
  const [staffList, setStaffList] = useState([])
  const [loadingStaff, setLoadingStaff] = useState(false)

  const showBuildingStaff = async (b) => {
    setStaffModalBuilding(b)
    setLoadingStaff(true)
    try {
      const res = await getBuildingAssignmentsAPI(b.BuildingID)
      setStaffList(res?.data?.data || [])
    } catch {
      toast.error('Không thể tải danh sách nhân sự tòa nhà.')
    } finally {
      setLoadingStaff(false)
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getBuildingsAPI(search.trim() ? { search: search.trim() } : {})
      setRows(res.data.data || [])
    } catch {
      toast.error(t('admin.buildings.loadFail'))
    } finally {
      setLoading(false)
      setTimeout(() => setIsLoaded(true), 80)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  useEffect(() => { fetchData() }, [fetchData])

  const applyFilters = () => setTrigger(tt => tt + 1)

  const openCreate = () => {
    setEditing(null)
    setPreviewCoords(null)
    reset({ BuildingName: '', Address: '', OperatingHours: '', TotalFloors: '', Latitude: '', Longitude: '' })
    setModalOpen(true)
  }

  const openEdit = (b) => {
    setEditing(b)
    setPreviewCoords(b.Latitude && b.Longitude ? { lat: b.Latitude, lng: b.Longitude } : null)
    reset({
      BuildingName: b.BuildingName,
      Address: b.Address || '',
      OperatingHours: b.OperatingHours || '',
      TotalFloors: b.TotalFloors ?? '',
      Latitude: b.Latitude ?? '',
      Longitude: b.Longitude ?? ''
    })
    setModalOpen(true)
  }

  // Hàm Reverse Geocoding (Từ Lat/Lng -> Tên Địa Chỉ)
  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`)
      const data = await res.json()
      if (data && data.display_name) {
        setValue('Address', data.display_name)
      }
    } catch {
      // Ignore network error for reverse geocoding
    }
  }

  // Hàm Forward Geocoding (Từ Tên Địa Chỉ -> Lat/Lng)
  const geocodeAddress = async (addrStr) => {
    if (!addrStr || !addrStr.trim()) return
    setGeocoding(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addrStr.trim())}&limit=1`)
      const data = await res.json()
      if (data && data.length > 0) {
        const foundLat = parseFloat(parseFloat(data[0].lat).toFixed(6))
        const foundLng = parseFloat(parseFloat(data[0].lon).toFixed(6))
        setValue('Latitude', foundLat)
        setValue('Longitude', foundLng)
        setPreviewCoords({ lat: foundLat, lng: foundLng })
        toast.success(`Đã cập nhật tọa độ GPS: ${foundLat}, ${foundLng}`)
      } else {
        toast.warning('Không tìm thấy tọa độ cho địa chỉ này trên bản đồ.')
      }
    } catch {
      toast.error('Lỗi khi tra cứu tọa độ từ địa chỉ.')
    } finally {
      setGeocoding(false)
    }
  }

  // Lấy vị trí GPS hiện tại từ trình duyệt
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ lấy vị trí GPS.')
      return
    }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6))
        const lng = parseFloat(pos.coords.longitude.toFixed(6))
        setValue('Latitude', lat)
        setValue('Longitude', lng)
        setPreviewCoords({ lat, lng })
        toast.success(`Đã lấy vị trí GPS: ${lat}, ${lng}`)
        await reverseGeocode(lat, lng)
        setGettingLocation(false)
      },
      () => {
        setGettingLocation(false)
        toast.error('Không thể lấy vị trí. Vui lòng cho phép trình duyệt truy cập vị trí.')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  // Update preview khi người dùng nhập tay lat/lng
  useEffect(() => {
    const lat = parseFloat(watchedLat)
    const lng = parseFloat(watchedLng)
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      setPreviewCoords({ lat, lng })
    } else {
      setPreviewCoords(null)
    }
  }, [watchedLat, watchedLng])

  const toApiPayload = (form) => ({
    buildingName: form.BuildingName,
    address: form.Address || null,
    operatingHours: form.OperatingHours || null,
    totalFloors: form.TotalFloors === '' || form.TotalFloors === undefined ? null : Number(form.TotalFloors),
    latitude: form.Latitude !== '' && form.Latitude !== undefined ? parseFloat(form.Latitude) : null,
    longitude: form.Longitude !== '' && form.Longitude !== undefined ? parseFloat(form.Longitude) : null
  })

  const onSubmit = async (form) => {
    try {
      const payload = toApiPayload(form)
      if (editing) {
        await updateBuildingAPI(editing.BuildingID, payload)
        toast.success(t('admin.buildings.updateSuccess'))
      } else {
        await createBuildingAPI(payload)
        toast.success(t('admin.buildings.createSuccess'))
      }
      setModalOpen(false)
      applyFilters()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.buildings.saveFail'))
    }
  }

  const confirmDelete = async () => {
    setBusy(true)
    try {
      await deleteBuildingAPI(deleting.BuildingID)
      toast.success(t('admin.buildings.deleteSuccess'))
      setDeleting(null)
      applyFilters()
    } catch (err) {
      toast.error(err?.response?.data?.message || t('admin.buildings.deleteFail'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`space-y-6 pb-12 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between bg-white p-4 py-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <div className="px-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-500">{t('admin.buildings.eyebrow')}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{t('admin.buildings.title')}</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={applyFilters}
            className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            <RefreshCcw size={16} /> {t('admin.buildings.refresh')}
          </button>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:scale-95 transition-all">
            <Plus size={16} /> {t('admin.buildings.addNew')}
          </button>
        </div>
      </div>

      {/* Search + Grid */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60">
        <div className="relative mb-5 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder={t('admin.buildings.searchPlaceholder')}
            className="w-full rounded-3xl bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 pl-11 pr-4 py-2.5 text-sm font-medium text-slate-900 outline-none border border-slate-200 hover:border-slate-300 focus:bg-white dark:focus:bg-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center text-slate-500 font-medium">
            <Building2 size={44} className="text-slate-300 mb-3" />
            <p className="font-bold text-slate-700">{t('admin.buildings.emptyTitle')}</p>
            <p className="text-sm mt-1 text-slate-500">{t('admin.buildings.emptyHint')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map(b => (
              <div key={b.BuildingID} className="rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition group">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                    <Building2 size={22} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setMapModalBuilding(b)} title="Xem bản đồ vị trí trực tiếp"
                      className="rounded-xl p-2 text-emerald-600 font-medium hover:bg-emerald-50 hover:text-emerald-700 transition">
                      <Map size={15} />
                    </button>
                    <button onClick={() => showBuildingStaff(b)} title="Xem danh sách nhân sự"
                      className="rounded-xl p-2 text-indigo-500 font-medium hover:bg-indigo-50 hover:text-indigo-600 transition">
                      <Users size={15} />
                    </button>
                    <button onClick={() => openEdit(b)} title={t('admin.buildings.edit')}
                      className="rounded-xl p-2 text-slate-500 font-medium hover:bg-blue-50 hover:text-blue-600 transition">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => setDeleting(b)} title={t('admin.buildings.delete')}
                      className="rounded-xl p-2 text-slate-500 font-medium hover:bg-rose-50 hover:text-rose-600 transition">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-3">{b.BuildingName}</h3>
                <div className="mt-3 space-y-1.5 text-sm text-slate-500 font-medium">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    {b.Address ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.Latitude && b.Longitude ? `${b.Latitude},${b.Longitude}` : b.Address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-bold transition leading-snug"
                        title="Nhấp để định vị chỉ đường trên Google Maps"
                      >
                        {b.Address}
                      </a>
                    ) : <span>—</span>}
                  </div>
                  <p className="flex items-center gap-2"><Clock size={14} className="text-slate-400 shrink-0" /> {b.OperatingHours || '—'}</p>
                  <p className="flex items-center gap-2"><Layers size={14} className="text-slate-400 shrink-0" /> {b.TotalFloors ?? 0} {t('admin.buildings.floorsSuffix')}</p>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">{t('admin.buildings.createdAt')} {fmtDate(b.CreatedAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal tạo/sửa tòa nhà ── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('admin.buildings.modal.titleEdit') : t('admin.buildings.modal.titleCreate')}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('admin.buildings.modal.cancel')}</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? t('admin.buildings.modal.saving') : editing ? t('admin.buildings.modal.saveChanges') : t('admin.buildings.modal.create')}
            </Button>
          </>
        )}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tên tòa nhà */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('admin.buildings.modal.buildingName')}</label>
            <input {...register('BuildingName', { required: t('admin.buildings.modal.buildingNameRequired') })}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            {errors.BuildingName && <p className="text-xs text-red-500 mt-1">{errors.BuildingName.message}</p>}
          </div>

          {/* Địa chỉ */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t('admin.buildings.modal.address')}
                <span className="ml-1 text-xs font-normal text-slate-400">(tên đường, quận, thành phố)</span>
              </label>
              <button type="button" onClick={() => geocodeAddress(watchedAddress)} disabled={geocoding || !watchedAddress?.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition disabled:opacity-50">
                <Search size={11} className={geocoding ? 'animate-spin' : ''} />
                {geocoding ? 'Đang tìm...' : 'Định vị GPS theo địa chỉ'}
              </button>
            </div>
            <input {...register('Address')}
              placeholder="VD: Lô E2a-7, Đường D1, Khu CNC, P. Long Thạnh Mỹ, TP. Thủ Đức"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>

          {/* Tọa độ GPS */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Tọa độ GPS (Latitude / Longitude)
                <span className="ml-1 text-xs font-normal text-slate-400">(dùng để ghim bản đồ chính xác)</span>
              </label>
              <button type="button" onClick={getCurrentLocation} disabled={gettingLocation}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition disabled:opacity-60">
                <Navigation size={12} className={gettingLocation ? 'animate-spin' : ''} />
                {gettingLocation ? 'Đang lấy...' : 'Lấy vị trí hiện tại'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input type="number" step="any" {...register('Latitude')}
                  placeholder="10.841517"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                <p className="text-[10px] text-slate-400 mt-1">Vĩ độ (Latitude)</p>
              </div>
              <div>
                <input type="number" step="any" {...register('Longitude')}
                  placeholder="106.809883"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
                <p className="text-[10px] text-slate-400 mt-1">Kinh độ (Longitude)</p>
              </div>
            </div>

            {/* Preview mini map */}
            {(previewCoords || watchedAddress?.trim()) && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 200 }}>
                <iframe
                  title="Preview Map"
                  width="100%" height="100%"
                  frameBorder="0" scrolling="no"
                  src={previewCoords 
                    ? `https://maps.google.com/maps?q=${previewCoords.lat},${previewCoords.lng}&z=16&output=embed`
                    : `https://maps.google.com/maps?q=${encodeURIComponent(watchedAddress)}&z=15&output=embed`
                  }
                />
              </div>
            )}
          </div>

          {/* Giờ hoạt động + Số tầng */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('admin.buildings.modal.operatingHours')}</label>
              <input {...register('OperatingHours', {
                pattern: {
                  value: /^([01]?[0-9]|2[0-3]):[0-5][0-9]-([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
                  message: t('admin.buildings.modal.operatingHoursPattern')
                }
              })} placeholder={t('admin.buildings.modal.operatingHoursPlaceholder')}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
              {errors.OperatingHours && <p className="text-xs text-red-500 mt-1">{errors.OperatingHours.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                {t('admin.buildings.modal.totalFloors')}
                <span className="ml-1 text-xs font-normal text-slate-400">(tự tạo tầng)</span>
              </label>
              <input type="number" min="0" {...register('TotalFloors', {
                min: { value: 0, message: t('admin.buildings.modal.totalFloorsMin') }
              })}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
              {errors.TotalFloors && <p className="text-xs text-red-500 mt-1">{errors.TotalFloors.message}</p>}
              <p className="text-[10px] text-slate-400 mt-1">Nhập số tầng → hệ thống tự tạo Tầng 1, Tầng 2...</p>
            </div>
          </div>
        </form>
      </Modal>

      {/* ── Modal xác nhận xoá ── */}
      <Modal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title={t('admin.buildings.confirmDelete.title')}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={busy}>{t('admin.buildings.confirmDelete.cancel')}</Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={busy}>{t('admin.buildings.confirmDelete.confirm')}</Button>
          </>
        )}
      >
        <p className="text-sm text-slate-600">
          {t('admin.buildings.confirmDelete.body')} <span className="font-bold text-slate-900">{deleting?.BuildingName}</span>{t('admin.buildings.confirmDelete.bodyEnd')}
        </p>
      </Modal>

      {/* ── Modal Danh sách Nhân sự thuộc Tòa nhà ── */}
      <Modal
        isOpen={!!staffModalBuilding}
        onClose={() => setStaffModalBuilding(null)}
        title={`Danh sách Nhân sự — ${staffModalBuilding?.BuildingName || ''}`}
        footer={(
          <Button variant="secondary" onClick={() => setStaffModalBuilding(null)}>Đóng</Button>
        )}
      >
        <div className="space-y-3">
          {loadingStaff ? (
            <div className="py-8 flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" /></div>
          ) : staffList.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Chưa có nhân sự nào được phân công tại tòa nhà này.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {staffList.map(s => (
                <div key={s.AssignmentID} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{s.FullName}</p>
                    <p className="text-xs text-slate-400">{s.Email} · {s.PhoneNumber || 'Chưa có SĐT'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.RoleName === 'Manager' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                      {s.RoleName}
                    </span>
                    {s.IsPrimary ? <span className="block text-[10px] text-emerald-600 font-bold mt-1">★ Trực chính</span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Modal Xem Bản đồ Vị trí Trực tuyến ── */}
      <Modal
        isOpen={!!mapModalBuilding}
        onClose={() => setMapModalBuilding(null)}
        title={`Bản đồ Vị trí Bãi đỗ — ${mapModalBuilding?.BuildingName || ''}`}
        footer={(
          <Button variant="secondary" onClick={() => setMapModalBuilding(null)}>Đóng</Button>
        )}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-medium flex items-start gap-1.5">
            <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5" />
            <span>
              <span className="font-bold text-slate-800">{mapModalBuilding?.Address || '—'}</span>
              {mapModalBuilding?.Latitude && (
                <span className="ml-2 text-slate-400">({mapModalBuilding.Latitude}, {mapModalBuilding.Longitude})</span>
              )}
            </span>
          </p>
          <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
            {mapModalBuilding && (
              <iframe
                title="Embedded Google Map"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  mapModalBuilding.Latitude && mapModalBuilding.Longitude
                    ? `${mapModalBuilding.Latitude},${mapModalBuilding.Longitude}`
                    : mapModalBuilding.Address || ''
                )}&z=16&output=embed`}
              />
            )}
          </div>
          <div className="flex justify-end">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                mapModalBuilding?.Latitude && mapModalBuilding?.Longitude
                  ? `${mapModalBuilding.Latitude},${mapModalBuilding.Longitude}`
                  : mapModalBuilding?.Address || ''
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Mở trên ứng dụng Google Maps ↗
            </a>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AdminBuildings