import authorizeAxios from '../utils/authorizeAxios'

// Fallback mock data if API is not yet ready
const MOCK_SESSIONS = [
  { id: 'PS-20240518-0012', plate: '51H-999.88', vehicle: 'Ô tô 4 chỗ', type: 'Vãng lai', typeColor: 'bg-gray-100 text-gray-600', slot: 'A-102', gate: 'Gate 02', checkIn: '18/05/2026 14:30', checkOut: null, status: 'active', staff: 'Nguyễn Văn An' },
  { id: 'PS-20240518-0010', plate: '30A-997.21', vehicle: 'Ô tô 7 chỗ', type: 'Booking', typeColor: 'bg-blue-50 text-blue-600', slot: 'B-112', gate: 'Gate 01', checkIn: '18/05/2026 10:42', checkOut: '18/05/2026 13:15', status: 'completed', staff: 'Nguyễn Văn An' },
  { id: 'PS-20240518-0008', plate: '43A-552.12', vehicle: 'Xe máy', type: 'Vãng lai', typeColor: 'bg-gray-100 text-gray-600', slot: 'M-005', gate: 'Gate 03', checkIn: '18/05/2026 09:15', checkOut: '18/05/2026 11:50', status: 'completed', staff: 'Trần Minh Hòa' },
  { id: 'PS-20240517-0099', plate: '29D-111.90', vehicle: 'Bán tải', type: 'Vãng lai', typeColor: 'bg-gray-100 text-gray-600', slot: 'C-010', gate: 'Gate 01', checkIn: '17/05/2026 08:00', checkOut: '17/05/2026 17:30', status: 'completed', staff: 'Lê Thị Hoa' },
  { id: 'PS-20240518-0015', plate: '51G-888.77', vehicle: 'Ô tô 4 chỗ', type: 'Booking', typeColor: 'bg-blue-50 text-blue-600', slot: 'A-008', gate: 'Gate 01', checkIn: '18/05/2026 15:00', checkOut: null, status: 'active', staff: 'Nguyễn Văn An' }
]

export const getSessions = async () => {
  try {
    const res = await authorizeAxios.get('/staff/sessions')
    return res.data?.data || res.data
  } catch (err) {
    console.warn('API getSessions not available, using Mock Data')
    return MOCK_SESSIONS
  }
}
