import { Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute, RoleRoute } from './components/ProtectedRoute'

import Home from './pages/Home'
import AdminLogin from './pages/AdminLogin'
import DriverRegister from './pages/DriverRegister'
import ManagerDashboard from './pages/ManagerDashboard'
import StaffDashboard from './pages/StaffDashboard'
import DriverDashboard from './pages/DriverDashboard'
import { VerifyEmailPending, VerifyEmailSuccess, VerifyEmailError } from './pages/VerifyEmailPages'

import './index.css'

const CheckIn = () => <div style={{ padding: 24 }}>🚗 Check In - Staff/Manager</div>
const Booking = () => <div style={{ padding: 24 }}>📅 Booking - Driver</div>
const Forbidden = () => <div style={{ padding: 24 }}>403 - Bạn không có quyền truy cập</div>
const NotFound = () => <div style={{ padding: 24 }}>404 - Không tìm thấy trang</div>

const App = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/403" element={<Forbidden />} />

      {/* ✅ Bug 4 & 5 fix — verify routes ra ngoài GuestRoute, không bị block */}
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
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/booking" element={<Booking />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App