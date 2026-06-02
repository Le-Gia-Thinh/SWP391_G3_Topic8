  // src/App.jsx
  import { Route, Routes } from 'react-router-dom'
  import { GuestRoute, ProtectedRoute, RoleRoute } from './components/ProtectedRoute'

  import Home from './pages/Home'
  import AdminLogin from './pages/AdminLogin'
  import DriverRegister from './pages/DriverRegister'
  import ManagerDashboard from './pages/ManagerDashboard'
  import StaffDashboard from './pages/StaffDashboard'
  
  import DriverLayout from './pages/driver/DriverLayout'
  import DriverHome from './pages/driver/DriverHome'
  import DriverBooking from './pages/driver/DriverBooking'
  import DriverBookingConfirmation from './pages/driver/DriverBookingConfirmation'
  import './index.css'

  const CheckIn = () => (
    <div style={{ padding: 24 }}>
      🚗 Check In - Staff/Manager
    </div>
  )

  const Booking = () => (
    <div style={{ padding: 24 }}>
      📅 Booking - Driver
    </div>
  )

  const Forbidden = () => (
    <div style={{ padding: 24 }}>
      403 - Bạn không có quyền truy cập
    </div>
  )

  const NotFound = () => (
    <div style={{ padding: 24 }}>
      404 - Không tìm thấy trang
    </div>
  )

  const App = () => {
    return (
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/403" element={<Forbidden />} />

        {/* Chỉ user chưa login mới được vào */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/register" element={<DriverRegister />} />
        </Route>

        {/* Chỉ cần login là vào được */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<div>Profile test</div>} />
        </Route>

        {/* Manager only */}
        <Route element={<RoleRoute allowedRoles={['Manager']} />}>
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        </Route>

        {/* Staff only */}
        <Route element={<RoleRoute allowedRoles={['Staff']} />}>
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
        </Route>

        {/* Staff + Manager */}
        <Route element={<RoleRoute allowedRoles={['Staff', 'Manager']} />}>
          <Route path="/checkin" element={<CheckIn />} />
        </Route>

        {/* Driver only */}
        <Route element={<RoleRoute allowedRoles={['Driver']} />}>
          <Route path="/driver" element={<DriverLayout />}>
            <Route index element={<DriverHome />} />
            <Route path="dashboard" element={<DriverHome />} />
            <Route path="home" element={<DriverHome />} />
            <Route path="booking" element={<DriverBooking />} />
            <Route path="booking-confirmation" element={<DriverBookingConfirmation />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    )
  }

  export default App