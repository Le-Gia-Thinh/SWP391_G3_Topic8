// src/pages/StaffDashboard.jsx
import { Box, Button, Card, CardContent, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const StaffDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fbf9f1', p: 4 }}>
      <Card sx={{ maxWidth: 600, mx: 'auto', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
            Staff Dashboard
          </Typography>

          <Typography sx={{ mb: 2 }}>
            Xin chào: {user?.fullName || 'Staff'}
          </Typography>

          <Typography sx={{ mb: 2 }}>
            Role: {user?.roleName}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={() => navigate('/')}>
              Về Home
            </Button>

            <Button variant="outlined" onClick={() => navigate('/checkin')}>
              Check In
            </Button>

            <Button variant="contained" color="error" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default StaffDashboard