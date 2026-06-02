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

import {
  VerifyEmailPending,
  VerifyEmailSuccess,
  VerifyEmailError
} from './pages/VerifyEmailPages'

import './index.css'

const CheckIn = () => (
  <div style={{ padding: 24 }}>
    🚗 Check In - Staff/Manager
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

      {/* Verify email routes */}
      <Route path="/verify-email/pending" element={<VerifyEmailPending />} />
      <Route path="/verify-email/success" element={<VerifyEmailSuccess />} />
      <Route path="/verify-email/error" element={<VerifyEmailError />} />
      <Route path="/verify-email" element={<VerifyEmailPending />} />

      {/* Guest only */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/register" element={<DriverRegister />} />
      </Route>

      {/* Protected */}
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