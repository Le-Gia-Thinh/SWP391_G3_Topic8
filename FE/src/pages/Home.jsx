import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import guestApi from '../apis/guestApi'
import {
  Box,
  Container,
  Button,
  Avatar,
  AvatarGroup,
  Card,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import { Users, Car, Bike, ShieldCheck, CheckCircle2 } from 'lucide-react'

const defaultStats = [
  { label: 'Tổng Sức Chứa', value: '1,200', unit: 'Chỗ trống', icon: <Users className="w-5 h-5 text-gray-400" /> },
  { label: 'Đang Có Xe', value: '485', unit: 'Chỗ trống', icon: <Car className="w-5 h-5 text-gray-400" /> },
  { label: 'Đang Trống', value: '612', unit: 'Chỗ trống', icon: <Car className="w-5 h-5 text-green-500" /> },
  { label: 'Lượt xe hôm nay', value: '105', unit: 'Lượt', icon: <CheckCircle2 className="w-5 h-5 text-gray-400" /> }
]

const defaultVehicles = [
  { title: 'Xe Máy', desc: 'Đang tải...', icon: <Bike className="w-6 h-6" />, progress: 0 },
  { title: 'Ô Tô', desc: 'Đang tải...', icon: <Car className="w-6 h-6" />, progress: 0 },
  { title: 'Xe Đạp', desc: 'Đang tải...', icon: <Bike className="w-6 h-6" />, progress: 0 }
]

const pricingRows = [
  { vehicle: 'Xe Đạp', firstHour: '2,000₫', nextHour: '1,000₫/h', overnight: '20,000₫', monthly: '50,000₫' },
  { vehicle: 'Xe Máy (Mô tô)', firstHour: '5,000₫', nextHour: '2,000₫/h', overnight: '50,000₫', monthly: '150,000₫' },
  { vehicle: 'Xe Ô Tô', firstHour: '20,000₫', nextHour: '10,000₫/h', overnight: '150,000₫', monthly: '1,200,000₫' }
]

const pricingBenefits = [
  'Thanh toán linh hoạt qua ứng dụng',
  'Ưu đãi giảm 10% khi đăng ký năm',
  'Hỗ trợ xuất hóa đơn VAT'
]

const guidelines = [
  'Tuân thủ tốc độ tối đa cho phép trong khu vực bãi đỗ xe là 10km/h.',
  'Đậu xe đúng vạch sơn, không lấn chiếm lối đi chung hoặc cản trở các phương tiện khác.',
  'Tắt máy xe ngay sau khi đỗ, không để lại các vật liệu dễ cháy nổ trên xe.',
  'Thanh toán phí dịch vụ gửi xe đúng hạn nếu sử dụng vé tháng, nếu sử dụng vé lượt hãy thanh toán khi ra khỏi bãi.',
  'Cấm hút thuốc, xả rác và gây mất trật tự an ninh trong toàn bộ khu vực bãi đỗ xe.'
]

const Home = () => {
  const navigate = useNavigate()
  const { isAuthenticated, user, getRedirectPath, loading } = useAuth()

  const [statsData, setStatsData] = useState(defaultStats)
  const [vehiclesData, setVehiclesData] = useState(defaultVehicles)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await guestApi.getHomeStats()
        if (res.success && res.data) {
          const { overview, vehicles } = res.data

          setStatsData([
            { label: 'Tổng Sức Chứa', value: overview.totalCapacity.toLocaleString(), unit: 'Chỗ trống', icon: <Users className="w-5 h-5 text-gray-400" /> },
            { label: 'Đang Có Xe', value: overview.occupied.toLocaleString(), unit: 'Chỗ', icon: <Car className="w-5 h-5 text-gray-400" /> },
            { label: 'Đang Trống', value: overview.available.toLocaleString(), unit: 'Chỗ', icon: <Car className="w-5 h-5 text-green-500" /> },
            { label: 'Lượt xe hôm nay', value: overview.todayCheckIns.toLocaleString(), unit: 'Lượt', icon: <CheckCircle2 className="w-5 h-5 text-gray-400" /> }
          ])

          if (vehicles && vehicles.length > 0) {
            setVehiclesData(vehicles.map(v => {
              let icon = <Car className="w-6 h-6" />
              if (v.code === 'MOTORBIKE') icon = <Bike className="w-6 h-6" />
              if (v.code === 'BICYCLE') icon = <Bike className="w-6 h-6" />

              return {
                title: v.name,
                desc: `${v.available} chỗ trống / ${v.total}`,
                icon,
                progress: v.occupancyRate
              }
            }))
          }
        }
      } catch (err) {
        console.error('Error fetching home stats:', err)
      }
    }
    fetchStats()
  }, [])

  return (
    <Box className="flex flex-col gap-24 py-16">
      {/* Hero Section */}
      <Box component="section" className="text-center pt-10">
        <Container maxWidth="lg" className="px-4 sm:px-6 lg:px-8">
          <Box
            component="h1"
            className="text-5xl md:text-6xl font-extrabold text-blue-600 tracking-tight leading-tight mb-6 max-w-4xl mx-auto"
          >
            Đỗ Xe Thông Minh
            <br />
            Cho Tòa Nhà Đa Tầng
          </Box>

          <Box component="p" className="text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
            Giải pháp quản lý tự động, an toàn và hiệu quả cho người quản lý bãi đỗ xe và trải nghiệm gửi xe dễ dàng hơn cho mọi cư dân, nhân viên.
          </Box>

          <Box className="flex flex-wrap justify-center items-center gap-4 mb-12">
            {loading ? null : isAuthenticated ? (
              <>
                <Box component="p" className="text-lg text-gray-700 font-medium w-full text-center">
                  Xin chào, <span className="text-blue-600 font-bold">{user?.fullName}</span> 👋
                </Box>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={() => navigate(getRedirectPath(user?.roleName))}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    px: 4,
                    py: 1.5,
                    bgcolor: '#2563eb',
                    boxShadow: '0 10px 15px -3px rgb(191 219 254), 0 4px 6px -4px rgb(191 219 254)',
                    '&:hover': { bgcolor: '#1d4ed8' }
                  }}
                >
                  Vào Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={() => navigate('/login')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    px: 4,
                    py: 1.5,
                    bgcolor: '#2563eb',
                    boxShadow: '0 10px 15px -3px rgb(191 219 254), 0 4px 6px -4px rgb(191 219 254)',
                    '&:hover': { bgcolor: '#1d4ed8' }
                  }}
                >
                  Đăng Nhập
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/register')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    px: 4,
                    py: 1.5,
                    color: '#2563eb',
                    bgcolor: '#ffffff',
                    borderColor: '#bfdbfe',
                    '&:hover': { bgcolor: '#eff6ff', borderColor: '#93c5fd' }
                  }}
                >
                  Đăng Ký
                </Button>
                <Button
                  variant="text"
                  onClick={() => navigate('/parking-info')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    px: 4,
                    py: 1.5,
                    color: '#374151',
                    '&:hover': { bgcolor: '#f9fafb' }
                  }}
                >
                  Xem Quy Trình
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/guest/tracking')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: '0.5rem',
                    px: 4,
                    py: 1.5,
                    color: '#059669',
                    bgcolor: '#ecfdf5',
                    borderColor: '#a7f3d0',
                    '&:hover': { bgcolor: '#d1fae5', borderColor: '#6ee7b7' }
                  }}
                >
                  🔍 Tra cứu phiên gửi xe
                </Button>
              </>
            )}
          </Box>

          {/* Avatars */}
          <Box className="flex items-center justify-center gap-3">
            <AvatarGroup
              max={3}
              sx={{
                '& .MuiAvatar-root': {
                  width: 40,
                  height: 40,
                  border: '2px solid white',
                  fontSize: 14
                }
              }}
            >
              <Avatar src="https://i.pravatar.cc/100?img=1" alt="Avatar" />
              <Avatar src="https://i.pravatar.cc/100?img=2" alt="Avatar" />
              <Avatar src="https://i.pravatar.cc/100?img=3" alt="Avatar" />
            </AvatarGroup>
            <Box component="p" className="text-sm text-gray-500 font-medium">
              Hơn <span className="text-gray-900 font-bold">2,500</span> lượt ra vào hệ thống mỗi ngày
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Box component="section" className="bg-white/50 py-16 border-y border-gray-100">
        <Container maxWidth="lg" className="px-4 sm:px-6 lg:px-8">
          <Box className="text-center mb-12">
            <Box component="h2" className="text-2xl font-bold text-blue-600 mb-2">
              Tổng Quan Trạng Thái Bãi Đỗ
            </Box>
            <Box component="p" className="text-gray-500 text-sm">
              Hệ thống theo dõi thời gian thực giúp bạn nắm bắt tình trạng hiện tại của tòa nhà đỗ xe.
            </Box>
          </Box>

          <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, idx) => (
              <Card
                key={idx}
                className="p-6 text-left border-none shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Box className="flex justify-between items-start mb-6">
                  <Box className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    {stat.icon}
                  </Box>
                  <Box component="span" className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {stat.unit}
                  </Box>
                </Box>
                <Box>
                  <Box component="p" className="text-sm text-gray-500 mb-1">
                    {stat.label}
                  </Box>
                  <Box component="p" className="text-3xl font-bold text-blue-600">
                    {stat.value}
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Vehicles Supported */}
      <Box component="section">
        <Container maxWidth="lg" className="px-4 sm:px-6 lg:px-8">
          <Box className="text-center mb-12">
            <Box component="h2" className="text-2xl font-bold text-blue-600 mb-2">
              Phương Tiện Được Hỗ Trợ
            </Box>
            <Box component="p" className="text-gray-500 text-sm">
              Chương trình chuyên biệt được tối ưu cho các loại xe khi đăng ký dùng phương tiện.
            </Box>
          </Box>

          <Box className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {vehiclesData.map((vehicle, idx) => (
              <Card
                key={idx}
                className="p-8 text-left border-none shadow-xl hover:-translate-y-2 transition-all duration-300 rounded-2xl bg-white"
              >
                <Chip
                  label="Cho Phép"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 24,
                    right: 24,
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#2563eb',
                    bgcolor: '#eff6ff',
                    borderRadius: '0.375rem',
                    height: 24
                  }}
                />

                <Box className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 mb-6 group-hover:text-blue-600 transition-colors">
                  {vehicle.icon}
                </Box>

                <Box component="h3" className="text-lg font-bold text-blue-600 mb-1">
                  {vehicle.title}
                </Box>
                <Box component="p" className="text-sm text-gray-500 mb-6">
                  {vehicle.desc}
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={vehicle.progress}
                  sx={{
                    height: 6,
                    borderRadius: 999,
                    bgcolor: '#f3f4f6',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#2563eb',
                      borderRadius: 999
                    }
                  }}
                />
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box component="section" className="bg-white/50 py-16 border-y border-gray-100">
        <Container maxWidth="lg" className="px-4 sm:px-6 lg:px-8">
          <Box className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <Box className="lg:col-span-1">
              <Box component="h2" className="text-2xl font-bold text-blue-600 mb-4">
                Bảng Giá Dịch Vụ Niêm Yết
              </Box>
              <Box component="p" className="text-gray-500 text-sm mb-8 leading-relaxed">
                Đơn vị kinh doanh, không phải bãi đỗ xe giá rẻ. Hệ thống tính giá tự động linh hoạt thời gian theo số giờ/phút qua hệ thống quản lý.
              </Box>
              <Box component="ul" className="space-y-4">
                {pricingBenefits.map((item, idx) => (
                  <Box key={idx} component="li" className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    {item}
                  </Box>
                ))}
              </Box>
            </Box>

            <Box className="lg:col-span-2">
              <TableContainer
                component={Paper}
                elevation={0}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <Table className="w-full text-left text-sm">
                  <TableHead className="bg-gray-50/50 border-b border-gray-100">
                    <TableRow>
                      <TableCell className="px-6 py-4 font-medium text-gray-500">Loại Phương Tiện</TableCell>
                      <TableCell className="px-6 py-4 font-medium text-gray-500">Giá 1 Giờ Đầu</TableCell>
                      <TableCell className="px-6 py-4 font-medium text-gray-500">Giá Tiếp Theo</TableCell>
                      <TableCell className="px-6 py-4 font-medium text-gray-500">Giá Qua Đêm</TableCell>
                      <TableCell className="px-6 py-4 font-medium text-gray-500 text-right" align="right">Vé Tháng</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className="divide-y divide-gray-100">
                    {pricingRows.map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="px-6 py-4 font-bold text-gray-900">{row.vehicle}</TableCell>
                        <TableCell className="px-6 py-4 text-gray-500">{row.firstHour}</TableCell>
                        <TableCell className="px-6 py-4 text-gray-500">{row.nextHour}</TableCell>
                        <TableCell className="px-6 py-4 text-gray-500">{row.overnight}</TableCell>
                        <TableCell className="px-6 py-4 text-red-500 font-semibold text-right" align="right">
                          {row.monthly}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box component="p" className="text-xs text-gray-400 mt-4">
                *Giá vé có thể thay đổi tùy thuộc vào dịp Lễ, Tết hoặc thời gian gửi.
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Guidelines Section */}
      <Box component="section" className="mb-16">
        <Container maxWidth="lg" className="px-4 sm:px-6 lg:px-8">
          <Card
            elevation={0}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row"
          >
            <Box className="md:w-1/3 bg-blue-600 p-10 text-white flex flex-col justify-center">
              <ShieldCheck className="w-12 h-12 mb-6 text-blue-200" />
              <Box component="h2" className="text-2xl font-bold mb-4">
                Quy Định & Hướng Dẫn Vận Hành
              </Box>
              <Box component="p" className="text-blue-100 text-sm leading-relaxed mb-8">
                Để đảm bảo an toàn và vận hành thông suốt cho tòa nhà, người sử dụng dịch vụ vui lòng tuân thủ quy định sử dụng bãi đỗ xe...
              </Box>
              <Box className="bg-blue-700/50 rounded-xl p-4 flex items-center gap-3">
                <Box className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">!</Box>
                <Box component="p" className="text-xs font-medium">
                  Hệ thống có camera AI giám sát thông minh 24/7 và hệ thống PCCC tự động.
                </Box>
              </Box>
            </Box>

            <Box className="md:w-2/3 p-10">
              <Box component="ul" className="space-y-6">
                {guidelines.map((item, idx) => (
                  <Box key={idx} component="li" className="flex gap-4 items-start">
                    <Box className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </Box>
                    <Box component="p" className="text-sm text-gray-700 leading-relaxed font-medium">
                      {item}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Card>
        </Container>
      </Box>
    </Box>
  )
}

export default Home
