// src/apis/managerApi.js
import authorizeAxios from '../utils/authorizeAxios'

const BASE = '/api/manager'

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

// ── Staff ─────────────────────────────────────────────────────
export const getStaffListAPI = () =>
  authorizeAxios.get(`${BASE}/staff`)