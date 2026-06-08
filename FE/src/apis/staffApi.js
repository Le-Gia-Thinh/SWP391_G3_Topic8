import authorizedAxiosInstance from '../utils/authorizeAxios'

const STAFF_BASE = '/staff'

export const staffApi = {
  getDashboard: async () => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/dashboard`)
    return res.data
  },

  getParkingMap: async (params = {}) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/parking-map`, {
      params
    })
    return res.data
  },

  createWalkInSession: async (payload) => {
    const res = await authorizedAxiosInstance.post(`${STAFF_BASE}/check-in/walk-in`, payload)
    return res.data
  },

  getBookingQueue: async (params = {}) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/bookings`, {
      params
    })
    return res.data
  },

  getBookingDetail: async (bookingCode) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/bookings/${bookingCode}`)
    return res.data
  },

  checkInBooking: async (bookingCode, payload = {}) => {
    const res = await authorizedAxiosInstance.post(
      `${STAFF_BASE}/bookings/${bookingCode}/check-in`,
      payload
    )
    return res.data
  },

  searchSessions: async (params = {}) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/sessions`, {
      params
    })
    return res.data
  },

  getActiveSessions: async (params = {}) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/sessions/active`, {
      params
    })
    return res.data
  },

  getCheckoutPreview: async (sessionId) => {
    const res = await authorizedAxiosInstance.get(
      `${STAFF_BASE}/sessions/${sessionId}/checkout-preview`
    )
    return res.data
  },

  checkOutSession: async (sessionId, payload) => {
    const res = await authorizedAxiosInstance.post(
      `${STAFF_BASE}/sessions/${sessionId}/check-out`,
      payload
    )
    return res.data
  },

  createIncident: async (payload) => {
    const res = await authorizedAxiosInstance.post(`${STAFF_BASE}/incidents`, payload)
    return res.data
  },

  getIncidents: async (params = {}) => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/incidents`, {
      params
    })
    return res.data
  },

  getStaffProfile: async () => {
    const res = await authorizedAxiosInstance.get(`${STAFF_BASE}/profile`)
    return res.data
  }
}

export default staffApi