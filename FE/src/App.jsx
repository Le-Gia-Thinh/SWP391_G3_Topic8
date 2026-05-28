  // src/App.jsx
  import { Route, Routes } from 'react-router-dom'
  import { GuestRoute, ProtectedRoute, RoleRoute } from './components/ProtectedRoute'

  import Home from './pages/Home'
  import AdminLogin from './pages/AdminLogin'
  import DriverRegister from './pages/DriverRegister'
  import ManagerDashboard from './pages/ManagerDashboard'
  import StaffDashboard from './pages/StaffDashboard'
  import DriverDashboard from './pages/DriverDashboard'

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
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/booking" element={<Booking />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    )
  }

  export default App