import authorizedAxiosInstance from '../utils/authorizeAxios'

const guestApi = {
  trackSession: async (plateNumber, sessionCode) => {
    const res = await authorizedAxiosInstance.get('/guest/track-session', {
      params: { plateNumber, sessionCode }
    })
    return res.data
  }
}

export default guestApi
