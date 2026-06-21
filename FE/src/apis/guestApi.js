import authorizedAxiosInstance from '../utils/authorizeAxios'

const guestApi = {
  trackSession: async (searchTerm) => {
    const res = await authorizedAxiosInstance.get('/guest/track-session', {
      params: { searchTerm }
    })
    return res.data
  },
  getHomeStats: async () => {
    const res = await authorizedAxiosInstance.get('/guest/home-stats')
    return res.data
  }
}

export default guestApi
