import authorizedAxiosInstance from '../utils/authorizeAxios'

const guestApi = {
  trackSession: async (plateNumber, sessionCode) => {
    const res = await authorizedAxiosInstance.get('/guest/track-session', {
      params: { plateNumber, sessionCode }
    })
    return res.data
  },
  getHomeStats: async () => {
    const res = await authorizedAxiosInstance.get('/guest/home-stats')
    return res.data
  }
}

export default guestApi
