// src/apis/staffApi.js
import authorizedAxiosInstance from '../utils/authorizeAxios'

const STAFF_BASE = '/staff'

const staffApi = {
  // ── Dashboard ────────────────────────────────────────────────
  getDashboard: async () => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/dashboard`)
    return res.data
  },

  // ── Parking map / slots ──────────────────────────────────────
  getParkingMap: async (params = {}) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/parking-map`, { params })
    return res.data
  },

  updateSlotStatus: async (slotId, slotStatus) => {
    const res = await authorizedAxiosInstance.patch(`${STAFF_BASE}/slots/${slotId}/status`, { slotStatus })
    return res.data
  },

  // ── Vehicle types (cho dropdown walk-in) ─────────────────────
  getVehicleTypes: async () => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/vehicle-types`)
    return res.data
  },

  // ── Walk-in check-in ─────────────────────────────────────────
  createWalkInSession: async (payload) => {
    const res = await authorizedAxiosInstance.post(`${STAFF_BASE}/check-in/walk-in`, payload)
    return res.data
  },

  // ── Booking ──────────────────────────────────────────────────
  getBookingQueue: async (params = {}) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/bookings`, { params })
    return res.data
  },

  getBookingDetail: async (reservationId) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/bookings/${reservationId}`)
    return res.data
  },

  checkInBooking: async (reservationId, plateNumber) => {
    const res = await authorizedAxiosInstance.post(
      `${STAFF_BASE}/bookings/${reservationId}/check-in`,
      { plateNumber }
    )
    return res.data
  },

  // ── Sessions / checkout ──────────────────────────────────────
  searchSessions: async (params = {}) => {
    // Lọc bỏ undefined để URL không có key thừa
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/sessions`, { params: cleanParams })
    return res.data
  },

  getActiveSessions: async (params = {}) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/sessions/active`, { params })
    return res.data
  },

  getCheckoutPreview: async (sessionId) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/sessions/${sessionId}/checkout-preview`)
    return res.data
  },

  checkOutSession: async (sessionId, payload) => {
    const res = await authorizedAxiosInstance.post(`${STAFF_BASE}/sessions/${sessionId}/check-out`, payload)
    return res.data
  },

  confirmSurcharge: async (sessionId, paymentMethod = 'Cash') => {
    const res = await authorizedAxiosInstance.post(`${STAFF_BASE}/sessions/${sessionId}/confirm-surcharge`, { paymentMethod })
    return res.data
  },

  // ── Payment (staff tạo QR cho khách walk-in) ────────────────
  createPayment: async (sessionId) => {
    const res = await authorizedAxiosInstance.post(`${STAFF_BASE}/payment/create`, {
      sessionId: Number(sessionId)
    })
    return res.data
  },

  getPaymentStatus: async (orderCode) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/payment/status/${orderCode}`)
    return res.data
  },
  // ── Incidents ────────────────────────────────────────────────
  createIncident: async (body) => {
    const res = await authorizedAxiosInstance.post(`${STAFF_BASE}/incidents`, body)
    return res.data
  },

  getIncidents: async (params = {}) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/incidents`, { params })
    return res.data
  },

  getIncidentById: async (incidentId) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/incidents/${incidentId}`)
    return res.data
  },

  updateIncidentStatus: async (incidentId, body) => {
    const res = await authorizedAxiosInstance.patch(`${STAFF_BASE}/incidents/${incidentId}/status`, body)
    return res.data
  },
  // ── Profile ──────────────────────────────────────────────────
  getStaffProfile: async () => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/profile`)
    return res.data
  },

  // ── Support Tickets ──────────────────────────────────────────
  getTickets: async (params = {}) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/support/tickets`, { params })
    return res.data
  },

  getTicketDetails: async (ticketId) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/support/tickets/${ticketId}`)
    return res.data
  },

  replyTicket: async (ticketId, payload) => {
    const res = await authorizedAxiosInstance.post(`${STAFF_BASE}/support/tickets/${ticketId}/replies`, payload)
    return res.data
  },

  updateTicketStatus: async (ticketId, status) => {
    const res = await authorizedAxiosInstance.patch(`${STAFF_BASE}/support/tickets/${ticketId}/status`, { status })
    return res.data
  }
}

export default staffApi