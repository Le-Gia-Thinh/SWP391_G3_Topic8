import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Car,
  Bike,
  CarFront,
  Truck,
  Plus,
  Pencil,
  Trash2,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw
} from 'lucide-react'
import { toast } from 'react-toastify'
import driverApi from '../../apis/driverApi'

const VEHICLE_ICONS = {
  MOTO: { Icon: Bike, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200' },
  CAR: { Icon: CarFront, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200' },
  TRUCK: { Icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
}

function getVehicleStyle(vehicleCode) {
  return VEHICLE_ICONS[vehicleCode] || VEHICLE_ICONS.CAR
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const DriverVehicles = () => {
  const { t } = useTranslation()
  const [vehicles, setVehicles] = useState([])
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const [form, setForm] = useState({
    plateNumber: '',
    vehicleTypeId: '',
    vehicleBrand: '',
    vehicleColor: ''
  })

  const resetForm = () => {
    setForm({ plateNumber: '', vehicleTypeId: '', vehicleBrand: '', vehicleColor: '' })
    setEditingVehicle(null)
    setShowForm(false)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [vehicleResult, typeResult] = await Promise.allSettled([
        driverApi.getVehicles(),
        driverApi.getVehicleTypes()
      ])

      if (vehicleResult.status === 'fulfilled') {
        setVehicles(vehicleResult.value?.data || [])
      }
      if (typeResult.status === 'fulfilled') {
        setVehicleTypes(typeResult.value?.data || typeResult.value || [])
      }
    } catch {
      toast.error(t('driver.vehicles.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openAddForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (vehicle) => {
    setEditingVehicle(vehicle)
    setForm({
      plateNumber: vehicle.PlateNumber || '',
      vehicleTypeId: String(vehicle.VehicleTypeID || ''),
      vehicleBrand: vehicle.VehicleBrand || '',
      vehicleColor: vehicle.VehicleColor || ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.plateNumber.trim()) {
      toast.error(t('driver.vehicles.validatePlate'))
      return
    }
    if (!form.vehicleTypeId) {
      toast.error(t('driver.vehicles.validateType'))
      return
    }

    setSaving(true)
    try {
      const payload = {
        plateNumber: form.plateNumber.trim(),
        vehicleTypeId: Number(form.vehicleTypeId),
        vehicleBrand: form.vehicleBrand.trim() || null,
        vehicleColor: form.vehicleColor.trim() || null
      }

      if (editingVehicle) {
        await driverApi.updateVehicle(editingVehicle.VehicleID, payload)
        toast.success(t('driver.vehicles.updateSuccess'))
      } else {
        await driverApi.addVehicle(payload)
        toast.success(t('driver.vehicles.addSuccess'))
      }

      resetForm()
      fetchData()
    } catch {
      // authorizeAxios đã toast lỗi
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (vehicleId) => {
    try {
      await driverApi.deleteVehicle(vehicleId)
      toast.success(t('driver.vehicles.deleteSuccess'))
      setDeleteConfirm(null)
      fetchData()
    } catch {
      // authorizeAxios đã toast lỗi
    }
  }

  const handleSetDefault = async (vehicleId) => {
    try {
      await driverApi.setDefaultVehicle(vehicleId)
      toast.success(t('driver.vehicles.setDefaultSuccess'))
      fetchData()
    } catch {
      // authorizeAxios đã toast lỗi
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-400 shadow-sm">
          <Loader2 size={20} className="animate-spin text-blue-600 dark:text-blue-400" />
          {t('driver.vehicles.loading')}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('driver.vehicles.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('driver.vehicles.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 shadow-sm transition hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            {t('driver.vehicles.refresh')}
          </button>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 active:scale-95"
          >
            <Plus size={16} />
            {t('driver.vehicles.addNew')}
          </button>
        </div>
      </section>

      {/* Add/Edit Form */}
      {showForm && (
        <section className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {editingVehicle ? t('driver.vehicles.formTitleEdit') : t('driver.vehicles.formTitleAdd')}
            </h2>
            <button onClick={resetForm} className="rounded-lg p-1.5 text-gray-400 hover:bg-white dark:bg-slate-800 hover:text-gray-600 dark:text-gray-400 transition">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('driver.vehicles.plateLabel')}</label>
              <input
                type="text"
                value={form.plateNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, plateNumber: e.target.value.toUpperCase() }))}
                placeholder={t('driver.vehicles.platePlaceholder')}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white transition focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('driver.vehicles.typeLabel')}</label>
              <select
                value={form.vehicleTypeId}
                onChange={(e) => setForm((prev) => ({ ...prev, vehicleTypeId: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white transition focus:border-blue-500 focus:outline-none"
              >
                <option value="">{t('driver.vehicles.typeSelect')}</option>
                {(Array.isArray(vehicleTypes) ? vehicleTypes : []).map((vt) => (
                  <option key={vt.VehicleTypeID} value={vt.VehicleTypeID}>
                    {vt.VehicleName} ({vt.VehicleCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('driver.vehicles.brandLabel')}</label>
              <input
                type="text"
                value={form.vehicleBrand}
                onChange={(e) => setForm((prev) => ({ ...prev, vehicleBrand: e.target.value }))}
                placeholder={t('driver.vehicles.brandPlaceholder')}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white transition focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('driver.vehicles.colorLabel')}</label>
              <input
                type="text"
                value={form.vehicleColor}
                onChange={(e) => setForm((prev) => ({ ...prev, vehicleColor: e.target.value }))}
                placeholder={t('driver.vehicles.colorPlaceholder')}
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white transition focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 border-t border-blue-100 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                {t('driver.vehicles.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {editingVehicle ? t('driver.vehicles.update') : t('driver.vehicles.add')}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Vehicle List */}
      <section>
        {vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 bg-gray-50/50 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-gray-300 shadow-sm border border-gray-100 dark:border-slate-700/50">
              <Car size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('driver.vehicles.emptyTitle')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
              {t('driver.vehicles.emptyHint')}
            </p>
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 active:scale-95"
            >
              <Plus size={16} />
              {t('driver.vehicles.addFirst')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => {
              const style = getVehicleStyle(vehicle.VehicleCode)
              const VIcon = style.Icon

              return (
                <div
                  key={vehicle.VehicleID}
                  className={`relative rounded-2xl border bg-white dark:bg-slate-800 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 ${vehicle.IsDefault ? `${style.border} ring-2 ring-blue-100` : 'border-gray-100 dark:border-slate-700/50'
                  }`}
                >
                  {/* Default Badge */}
                  {vehicle.IsDefault && (
                    <div className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                      <Star size={10} fill="currentColor" />
                      {t('driver.vehicles.defaultBadge')}
                    </div>
                  )}

                  {/* Icon + Plate */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.color}`}>
                      <VIcon size={28} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{vehicle.PlateNumber}</h3>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{vehicle.VehicleName}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 rounded-xl bg-gray-50 dark:bg-slate-900/50 p-3 text-sm mb-4">
                    {vehicle.VehicleBrand && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">{t('driver.vehicles.brand')}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{vehicle.VehicleBrand}</span>
                      </div>
                    )}
                    {vehicle.VehicleColor && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">{t('driver.vehicles.color')}</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{vehicle.VehicleColor}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{t('driver.vehicles.createdAt')}</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{formatDate(vehicle.CreatedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!vehicle.IsDefault && (
                      <button
                        onClick={() => handleSetDefault(vehicle.VehicleID)}
                        className="flex-1 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 transition hover:bg-blue-100"
                      >
                        {t('driver.vehicles.setDefault')}
                      </button>
                    )}
                    <button
                      onClick={() => openEditForm(vehicle)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:text-blue-400"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(vehicle.VehicleID)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 transition hover:bg-red-50 dark:bg-red-900/20 hover:text-red-600 hover:border-red-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Delete Confirmation */}
                  {deleteConfirm === vehicle.VehicleID && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-800/95 backdrop-blur-sm p-6">
                      <AlertCircle size={32} className="text-red-500 mb-2" />
                      <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t('driver.vehicles.deleteTitle')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center">{t('driver.vehicles.deleteHint', { plate: vehicle.PlateNumber })}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                        >
                          {t('driver.vehicles.cancel')}
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.VehicleID)}
                          className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                        >
                          {t('driver.vehicles.delete')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default DriverVehicles