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

  getPricing: async (vehicleTypeId) => {
    const params = vehicleTypeId ? { vehicleTypeId } : {}
    const res = await authorizeAxios.get('/pricing', { params })
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
  },

  // ── Notifications ─────────────────────────────────────────
  getNotifications: async (params = {}) => {
    const res = await authorizeAxios.get('/driver/notifications', {
      params: buildQuery(params)
    })
    return unwrap(res)
  },

  getUnreadCount: async () => {
    const res = await authorizeAxios.get('/driver/notifications/unread-count')
    return unwrap(res)
  },

  markNotificationRead: async (notificationId) => {
    const res = await authorizeAxios.patch(`/driver/notifications/${notificationId}/read`)
    return unwrap(res)
  },

  markAllNotificationsRead: async () => {
    const res = await authorizeAxios.patch('/driver/notifications/read-all')
    return unwrap(res)
  },

  // ── Vehicles ──────────────────────────────────────────────
  getVehicles: async () => {
    const res = await authorizeAxios.get('/driver/vehicles')
    return unwrap(res)
  },

  addVehicle: async (payload) => {
    const res = await authorizeAxios.post('/driver/vehicles', payload)
    return unwrap(res)
  },

  updateVehicle: async (vehicleId, payload) => {
    const res = await authorizeAxios.patch(`/driver/vehicles/${vehicleId}`, payload)
    return unwrap(res)
  },

  deleteVehicle: async (vehicleId) => {
    const res = await authorizeAxios.delete(`/driver/vehicles/${vehicleId}`)
    return unwrap(res)
  },

  setDefaultVehicle: async (vehicleId) => {
    const res = await authorizeAxios.patch(`/driver/vehicles/${vehicleId}/default`)
    return unwrap(res)
  },

  // ── Ratings / Feedback ────────────────────────────────────
  getDriverRatings: async (params = {}) => {
    const res = await authorizeAxios.get('/driver/ratings', {
      params: buildQuery(params)
    })
    return unwrap(res)
  },

  createRating: async (payload) => {
    const res = await authorizeAxios.post('/driver/ratings', payload)
    return unwrap(res)
  },

  getUnratedSessions: async () => {
    const res = await authorizeAxios.get('/driver/completed-sessions')
    return unwrap(res)
  },

  // ── Support Tickets ───────────────────────────────────────
  createTicket: async (payload) => {
    const res = await authorizeAxios.post('/driver/support/tickets', payload)
    return unwrap(res)
  },

  getTickets: async () => {
    const res = await authorizeAxios.get('/driver/support/tickets')
    return unwrap(res)
  },

  getTicketDetails: async (ticketId) => {
    const res = await authorizeAxios.get(`/driver/support/tickets/${ticketId}`)
    return unwrap(res)
  },

  replyTicket: async (ticketId, payload) => {
    const res = await authorizeAxios.post(`/driver/support/tickets/${ticketId}/replies`, payload)
    return unwrap(res)
  }
}

export default driverApi