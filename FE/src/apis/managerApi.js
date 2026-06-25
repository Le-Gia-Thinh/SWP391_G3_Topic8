/**
 * FILE: managerApi.js
 * MÔ TẢ: Tập hợp các API dành cho Quản lý (Manager).
 * Bao gồm: Dashboard tổng quan, Quản lý chính sách giá, Quản lý sự cố, 
 * và Báo cáo chi tiết (Doanh thu, Lưu lượng, Giờ cao điểm).
 */

import authorizeAxios from '../utils/authorizeAxios'

// LƯU Ý: authorizeAxios đã có baseURL kết thúc bằng /api → ở đây KHÔNG thêm /api.
const BASE = '/manager'

// ── Dashboard ─────────────────────────────────────────────────
export const getDashboardAPI = () =>
  authorizeAxios.get(`${BASE}/dashboard`)

// ── Config – Buildings ────────────────────────────────────────
export const getBuildingsAPI = () =>
  authorizeAxios.get(`${BASE}/buildings`)

export const updateBuildingAPI = (id, data) =>
  authorizeAxios.patch(`${BASE}/buildings/${id}`, data)

// ── Config – Floors ───────────────────────────────────────────
export const getFloorsAPI = (buildingId) =>
  authorizeAxios.get(`${BASE}/floors`, {
    params: buildingId ? { buildingId } : {}
  })

export const updateFloorAPI = (id, data) =>
  authorizeAxios.patch(`${BASE}/floors/${id}`, data)

// ── Config – Zones (Areas) ────────────────────────────────────
export const getZonesAPI = (floorId) =>
  authorizeAxios.get(`${BASE}/zones`, {
    params: floorId ? { floorId } : {}
  })

export const updateZoneAPI = (id, data) =>
  authorizeAxios.patch(`${BASE}/zones/${id}`, data)

// ── Slots / Positions ─────────────────────────────────────────
export const getParkingSlotsAPI = (params = {}) =>
  authorizeAxios.get(`${BASE}/slots`, { params })

export const getSlotByIdAPI = (id) =>
  authorizeAxios.get(`${BASE}/slots/${id}`)

export const updateSlotStatusAPI = (id, data) =>
  authorizeAxios.patch(`${BASE}/slots/${id}/status`, data)

// ── Pricing Policies ──────────────────────────────────────────
export const getPricingPoliciesAPI = (params = {}) =>
  authorizeAxios.get(`${BASE}/pricing`, { params })

export const createPricingPolicyAPI = (data) =>
  authorizeAxios.post(`${BASE}/pricing`, data)

export const updatePricingPolicyAPI = (id, data) =>
  authorizeAxios.patch(`${BASE}/pricing/${id}`, data)

export const deletePricingPolicyAPI = (id) =>
  authorizeAxios.delete(`${BASE}/pricing/${id}`)

export const deactivatePricingPolicyAPI = (id) =>
  authorizeAxios.patch(`${BASE}/pricing/${id}`, { isActive: 0 })

export const getNightPricingPoliciesAPI = () =>
  authorizeAxios.get(`${BASE}/night-pricing`)

export const updateNightPricingPolicyAPI = (id, data) =>
  authorizeAxios.patch(`${BASE}/night-pricing/${id}`, data)

// ── Vehicle Types ─────────────────────────────────────────────
// Dropdown form: chỉ Active
export const getVehicleTypesAPI = () =>
  authorizeAxios.get(`${BASE}/vehicle-types`)

// Trang quản lý: tất cả (kèm Inactive + thống kê)
export const getAllVehicleTypesAPI = () =>
  authorizeAxios.get(`${BASE}/vehicle-types/all`)

export const createVehicleTypeAPI = (data) =>
  authorizeAxios.post(`${BASE}/vehicle-types`, data)

export const updateVehicleTypeAPI = (id, data) =>
  authorizeAxios.patch(`${BASE}/vehicle-types/${id}`, data)

export const toggleVehicleTypeAPI = (id, isActive) =>
  authorizeAxios.patch(`${BASE}/vehicle-types/${id}/toggle`, { isActive })

// ── Incidents ─────────────────────────────────────────────────
export const getIncidentsAPI = (params = {}) =>
  authorizeAxios.get(`${BASE}/incidents`, { params })

export const getIncidentByIdAPI = (id) =>
  authorizeAxios.get(`${BASE}/incidents/${id}`)

export const updateIncidentStatusAPI = (id, data) =>
  authorizeAxios.patch(`${BASE}/incidents/${id}/status`, data)

// ── Reports ───────────────────────────────────────────────────
export const getRevenueReportAPI = (params = {}) =>
  authorizeAxios.get(`${BASE}/reports/revenue`, { params })

export const getOccupancyReportAPI = () =>
  authorizeAxios.get(`${BASE}/reports/occupancy`)

export const getSessionsReportAPI = (params = {}) =>
  authorizeAxios.get(`${BASE}/reports/sessions`, { params })

export const getPeakHoursReportAPI = (params = {}) =>
  authorizeAxios.get(`${BASE}/reports/peak-hours`, { params })

export const getVehicleFlowReportAPI = (params = {}) =>
  authorizeAxios.get(`${BASE}/reports/vehicle-flow`, { params })

// ── Unpaid ────────────────────────────────────────────────────
export const getUnpaidSessionsAPI = (params = {}) =>
  authorizeAxios.get(`${BASE}/unpaid`, { params })

// ── Staff ─────────────────────────────────────────────────────
export const getStaffListAPI = () =>
  authorizeAxios.get(`${BASE}/staff`)