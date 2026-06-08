import { Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute, RoleRoute } from './components/ProtectedRoute'

import Home from './pages/Home'
import AdminLogin from './pages/AdminLogin'
import DriverRegister from './pages/DriverRegister'

import StaffLayout from './pages/staff/StaffLayout'
import StaffDashboardScreen from './pages/staff/StaffDashboardScreen'
import StaffCheckInWalkIn from './pages/staff/StaffCheckInWalkIn'
import StaffCheckInSuccess from './pages/staff/StaffCheckInSuccess'
import StaffBookingCheckIn from './pages/staff/StaffBookingCheckIn'
import StaffVerifyBooking from './pages/staff/StaffVerifyBooking'
import StaffBookingSuccess from './pages/staff/StaffBookingSuccess'
import StaffCreateIncident from './pages/staff/StaffCreateIncident'
import StaffVehicleCheckOut from './pages/staff/StaffVehicleCheckOut'
import StaffPaymentConfirm from './pages/staff/StaffPaymentConfirm'
import StaffCheckOutCompleted from './pages/staff/StaffCheckOutCompleted'
import StaffParkingMap from './pages/staff/StaffParkingMap'
import StaffSearchSession from './pages/staff/StaffSearchSession'
import StaffProfile from './pages/staff/StaffProfile'
import StaffSettings from './pages/staff/StaffSettings'
import StaffSecurity from './pages/staff/StaffSecurity'
import StaffSupport from './pages/staff/StaffSupport'
import StaffUserGuide from './pages/staff/StaffUserGuide'
import DriverLayout from './pages/driver/DriverLayout'
import DriverHome from './pages/driver/DriverHome'
import DriverBooking from './pages/driver/DriverBooking'
import DriverBookingConfirmation from './pages/driver/DriverBookingConfirmation'
import DriverHistory from './pages/driver/DriverHistory'
import DriverSession from './pages/driver/DriverSession'
import DriverPayment from './pages/driver/DriverPayment'
import DriverReport from './pages/driver/DriverReport'
import DriverProfile from './pages/driver/DriverProfile'
import DriverPaymentResult from './pages/driver/DriverPaymentResult'
import DriverPaymentHistory from './pages/driver/DriverPaymentHistory'
import DriverSupport from './pages/driver/DriverSupport'
import DriverSettings from './pages/driver/DriverSettings'
import DriverTerms from './pages/driver/DriverTerms'
import DriverPrivacy from './pages/driver/DriverPrivacy'

import ManagerLayout from './pages/manager/ManagerLayout'
import ManagerDashboard from './pages/manager/ManagerDashboard'
import ManagerConfig from './pages/manager/ManagerConfig'
import ManagerPricing from './pages/manager/ManagerPricing'
import ManagerSlots from './pages/manager/ManagerSlots'
import ManagerProfile from './pages/manager/ManagerProfile'
import ManagerIncidents from './pages/manager/ManagerIncidents'
import ManagerReports from './pages/manager/ManagerReports'

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
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<ManagerDashboard />} />
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="positions" element={<ManagerSlots />} />
          <Route path="config" element={<ManagerConfig />} />
          <Route path="pricing" element={<ManagerPricing />} />
          <Route path="incidents" element={<ManagerIncidents />} />
          <Route path="reports" element={<ManagerReports />} />
          <Route path="profile" element={<ManagerProfile />} />
        </Route>
      </Route>

      {/* Staff only */}
      <Route element={<RoleRoute allowedRoles={['Staff']} />}>
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<StaffDashboardScreen />} />
          <Route path="dashboard" element={<StaffDashboardScreen />} />
          <Route path="checkin-walkin" element={<StaffCheckInWalkIn />} />
          <Route path="checkin-success" element={<StaffCheckInSuccess />} />
          <Route path="checkin-booking" element={<StaffBookingCheckIn />} />
          <Route path="verify-booking" element={<StaffVerifyBooking />} />
          <Route path="booking-success" element={<StaffBookingSuccess />} />
          <Route path="create-incident" element={<StaffCreateIncident />} />
          <Route path="checkout" element={<StaffVehicleCheckOut />} />
          <Route path="payment" element={<StaffPaymentConfirm />} />
          <Route path="checkout-completed" element={<StaffCheckOutCompleted />} />
          <Route path="parking-map" element={<StaffParkingMap />} />
          <Route path="search-session" element={<StaffSearchSession />} />
          <Route path="profile" element={<StaffProfile />} />
          <Route path="settings" element={<StaffSettings />} />
          <Route path="security" element={<StaffSecurity />} />
          <Route path="support" element={<StaffSupport />} />
          <Route path="user-guide" element={<StaffUserGuide />} />
        </Route>
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
          <Route path="history" element={<DriverHistory />} />
          <Route path="session" element={<DriverSession />} />
          <Route path="payment" element={<DriverPayment />} />
          <Route path="report" element={<DriverReport />} />
          <Route path="profile" element={<DriverProfile />} />
          <Route path="payment" element={<DriverPayment />} />
          <Route path="payment-result" element={<DriverPaymentResult />} />
          <Route path="payment-history" element={<DriverPaymentHistory />} />
          <Route path="support" element={<DriverSupport />} />
          <Route path="settings" element={<DriverSettings />} />
          <Route path="terms" element={<DriverTerms />} />
          <Route path="privacy" element={<DriverPrivacy />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App