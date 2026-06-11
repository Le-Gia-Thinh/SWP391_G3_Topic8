import authorizeAxios from '../utils/authorizeAxios'

const unwrap = (response) => response.data

const buildQuery = (params = {}) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== undefined && value !== null && value !== ''
    })
  )
}

export const driverApi = {
  getHome: async () => {
    const res = await authorizeAxios.get('/driver/home')
    return unwrap(res)
  },

  getProfile: async () => {
    const res = await authorizeAxios.get('/driver/profile')
    return unwrap(res)
  },

  updateProfile: async (payload) => {
    const res = await authorizeAxios.patch('/driver/profile', payload)
    return unwrap(res)
  },

  getBuildings: async () => {
    const res = await authorizeAxios.get('/buildings')
    return unwrap(res)
  },

  getVehicleTypes: async () => {
    const res = await authorizeAxios.get('/vehicle-types')
    return unwrap(res)
  },

  getAvailableSlots: async (params = {}) => {
    const res = await authorizeAxios.get('/reservations/available-slots', {
      params: buildQuery(params)
    })
    return unwrap(res)
  },

  createReservation: async (payload) => {
    const res = await authorizeAxios.post('/reservations', payload)
    return unwrap(res)
  },

  getReservations: async (params = {}) => {
    const res = await authorizeAxios.get('/reservations', {
      params: buildQuery(params)
    })
    return unwrap(res)
  },

  getReservationById: async (reservationId) => {
    const res = await authorizeAxios.get(`/reservations/${reservationId}`)
    return unwrap(res)
  },

  cancelReservation: async (reservationId) => {
    const res = await authorizeAxios.patch(`/reservations/${reservationId}/cancel`)
    return unwrap(res)
  },

  getCurrentSession: async () => {
    const res = await authorizeAxios.get('/driver/current-session')
    return unwrap(res)
  },

  getCurrentSessions: async () => {
    const res = await authorizeAxios.get('/driver/current-sessions')
    return unwrap(res)
  },

  getActiveSessions: async (params = {}) => {
    const res = await authorizeAxios.get('/driver/active-sessions', {
      params: buildQuery(params)
    })
    return unwrap(res)
  },

  createPayment: async (sessionId) => {
    const res = await authorizeAxios.post('/driver/payment/create', {
      sessionId
    })
    return unwrap(res)
  },

  getPaymentStatus: async (orderCode) => {
    const res = await authorizeAxios.get(`/driver/payment/status/${orderCode}`)
    return unwrap(res)
  },

  cancelPayment: async ({ orderCode, reason }) => {
    const res = await authorizeAxios.post('/driver/payment/cancel', {
      orderCode,
      reason
    })
    return unwrap(res)
  },

  getPaymentHistory: async (params = {}) => {
    const res = await authorizeAxios.get('/driver/payment/history', {
      params: buildQuery(params)
    })
    return unwrap(res)
  },

  getSessionPaymentInfo: async (sessionId) => {
    const res = await authorizeAxios.get(`/driver/payment/session-info/${sessionId}`)
    return unwrap(res)
  },

  getReportContext: async () => {
    const res = await authorizeAxios.get('/driver/report-context')
    return unwrap(res)
  },

  createReport: async (payload) => {
    const res = await authorizeAxios.post('/driver/reports', payload)
    return unwrap(res)
  },

  getReports: async (params = {}) => {
    const res = await authorizeAxios.get('/driver/reports', {
      params: buildQuery(params)
    })
    return unwrap(res)
  }
}

export default driverApi