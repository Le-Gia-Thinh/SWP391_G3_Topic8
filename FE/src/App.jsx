import React, { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute, RoleRoute } from './components/ProtectedRoute'
import {
  LayoutDashboard, Map, FileText, CheckSquare, Search, BookOpen, Clock, Settings, Wallet, AlertTriangle, ShieldCheck, Home as HomeIcon, HelpCircle, LogOut, Bell, Car, Star
} from 'lucide-react'

// Import Layouts
import DashboardLayout from './components/layout/DashboardLayout'

// Import Common Pages (Lazy)
const Home = React.lazy(() => import('./pages/Home'))
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'))
const DriverRegister = React.lazy(() => import('./pages/DriverRegister'))
const NotFound = React.lazy(() => import('./pages/common/NotFound'))
const Forbidden = React.lazy(() => import('./pages/common/Forbidden'))
const CheckIn = React.lazy(() => import('./pages/common/CheckIn'))
const UserProfile = React.lazy(() => import('./pages/common/UserProfile'))

import { VerifyEmailPending, VerifyEmailSuccess, VerifyEmailError } from './pages/VerifyEmailPages'

// Manager Pages (Lazy)
const ManagerDashboard = React.lazy(() => import('./pages/manager/ManagerDashboard'))
const ManagerSlots = React.lazy(() => import('./pages/manager/ManagerSlots'))
const ManagerConfig = React.lazy(() => import('./pages/manager/ManagerConfig'))
const ManagerPricing = React.lazy(() => import('./pages/manager/ManagerPricing'))
const ManagerIncidents = React.lazy(() => import('./pages/manager/ManagerIncidents'))
const ManagerReports = React.lazy(() => import('./pages/manager/ManagerReports'))

// Staff Pages (Lazy)
const StaffDashboardScreen = React.lazy(() => import('./pages/staff/StaffDashboardScreen'))
const StaffCheckIn = React.lazy(() => import('./pages/staff/StaffCheckIn'))
const StaffActionSuccess = React.lazy(() => import('./pages/staff/StaffActionSuccess'))
const StaffVerifyBooking = React.lazy(() => import('./pages/staff/StaffVerifyBooking'))
const StaffCreateIncident = React.lazy(() => import('./pages/staff/StaffCreateIncident'))
const StaffVehicleCheckOut = React.lazy(() => import('./pages/staff/StaffVehicleCheckOut'))
const StaffPaymentConfirm = React.lazy(() => import('./pages/staff/StaffPaymentConfirm'))
const StaffParkingMap = React.lazy(() => import('./pages/staff/StaffParkingMap'))
const StaffSearchSession = React.lazy(() => import('./pages/staff/StaffSearchSession'))
const StaffSupport = React.lazy(() => import('./pages/staff/StaffSupport'))
const StaffUserGuide = React.lazy(() => import('./pages/staff/StaffUserGuide'))

// Driver Pages (Lazy)
const DriverHome = React.lazy(() => import('./pages/driver/DriverHome'))
const DriverBooking = React.lazy(() => import('./pages/driver/DriverBooking'))
const DriverBookingConfirmation = React.lazy(() => import('./pages/driver/DriverBookingConfirmation'))
const DriverHistory = React.lazy(() => import('./pages/driver/DriverHistory'))
const DriverSession = React.lazy(() => import('./pages/driver/DriverSession'))
const DriverPayment = React.lazy(() => import('./pages/driver/DriverPayment'))
const DriverReport = React.lazy(() => import('./pages/driver/DriverReport'))
const DriverPaymentResult = React.lazy(() => import('./pages/driver/DriverPaymentResult'))
const DriverHelp = React.lazy(() => import('./pages/driver/DriverHelp'))
const DriverSettings = React.lazy(() => import('./pages/driver/DriverSettings'))
const DriverSupport = React.lazy(() => import('./pages/driver/DriverSupport'))
const DriverTerms = React.lazy(() => import('./pages/driver/DriverTerms'))
const DriverPrivacy = React.lazy(() => import('./pages/driver/DriverPrivacy'))
const DriverNotifications = React.lazy(() => import('./pages/driver/DriverNotifications'))
const DriverVehicles = React.lazy(() => import('./pages/driver/DriverVehicles'))
const DriverFeedback = React.lazy(() => import('./pages/driver/DriverFeedback'))

import './index.css'

const managerLinks = [
  { path: '/manager/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/manager/positions', label: 'Vị trí đỗ', icon: Map },
  { path: '/manager/reports', label: 'Báo cáo', icon: FileText },
  { isDivider: true },
  { labelOnly: 'Cấu hình' },
  { path: '/manager/pricing', label: 'Bảng giá', icon: Wallet },
  { path: '/manager/config', label: 'Cấu hình bãi đỗ', icon: Settings },
  { path: '/manager/incidents', label: 'Sự cố', icon: AlertTriangle }
]

const staffLinks = [
  { path: '/staff/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { path: '/staff/parking-map', label: 'Bản đồ bãi đỗ', icon: Map },
  { isDivider: true },
  { labelOnly: 'Nghiệp vụ' },
  { path: '/staff/checkin', label: 'Check-in (Vào)', icon: CheckSquare },
  { path: '/staff/checkout', label: 'Check-out (Ra)', icon: LogOut },
  { path: '/staff/search-session', label: 'Tìm kiếm phiên', icon: Search },
  { path: '/staff/verify-booking', label: 'Xác thực Booking', icon: ShieldCheck },
  { path: '/staff/payment-confirm', label: 'Xác nhận thanh toán', icon: Wallet },

  { isDivider: true },
  { labelOnly: 'Khác' },
  { path: '/staff/create-incident', label: 'Báo cáo sự cố', icon: AlertTriangle },
  { path: '/staff/user-guide', label: 'Hướng dẫn sử dụng', icon: BookOpen },
  { path: '/staff/support', label: 'Hỗ trợ kỹ thuật', icon: HelpCircle }
]

const driverLinks = [
  { path: '/driver/home', label: 'Trang chủ', icon: HomeIcon },
  { path: '/driver/session', label: 'Phiên đỗ xe', icon: Clock },
  { path: '/driver/history', label: 'Lịch sử', icon: FileText },
  { path: '/driver/payment', label: 'Thanh toán', icon: Wallet },
  { isDivider: true },
  { labelOnly: 'Quản lý' },
  { path: '/driver/vehicles', label: 'Phương tiện', icon: Car },
  { path: '/driver/notifications', label: 'Thông báo', icon: Bell },
  { path: '/driver/feedback', label: 'Đánh giá', icon: Star },
  { isDivider: true },
  { labelOnly: 'Hỗ trợ' },
  { path: '/driver/report', label: 'Báo cáo sự cố', icon: AlertTriangle },
  { path: '/driver/help', label: 'Trung tâm trợ giúp', icon: HelpCircle },
  { path: '/driver/settings', label: 'Cài đặt', icon: Settings }
]

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
  </div>
)

const App = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
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
          <Route path="/profile" element={<UserProfile />} />
        </Route>

        {/* Staff + Manager */}
        <Route element={<RoleRoute allowedRoles={['Staff', 'Manager']} />}>
          <Route path="/checkin" element={<CheckIn />} />
        </Route>

        {/* Manager only */}
        <Route element={<RoleRoute allowedRoles={['Manager']} />}>
          <Route path="/manager" element={<DashboardLayout links={managerLinks} roleName="Manager" profileLink="/manager/profile" />}>
            <Route index element={<ManagerDashboard />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="positions" element={<ManagerSlots />} />
            <Route path="config" element={<ManagerConfig />} />
            <Route path="pricing" element={<ManagerPricing />} />
            <Route path="incidents" element={<ManagerIncidents />} />
            <Route path="reports" element={<ManagerReports />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>
        </Route>

        {/* Staff only */}
        <Route element={<RoleRoute allowedRoles={['Staff']} />}>
          <Route path="/staff" element={<DashboardLayout links={staffLinks} roleName="Staff" profileLink="/staff/profile" />}>
            {/* Dashboard */}
            <Route index element={<StaffDashboardScreen />} />
            <Route path="dashboard" element={<StaffDashboardScreen />} />

            {/* Check-in */}
            <Route path="checkin" element={<StaffCheckIn />} />
            <Route path="checkin-walkin" element={<StaffCheckIn />} />
            <Route path="checkin-booking" element={<StaffCheckIn />} />

            {/* Verify Booking với reservationId */}
            <Route path="verify-booking" element={<StaffVerifyBooking />} />
            <Route path="verify-booking/:reservationId" element={<StaffVerifyBooking />} />

            {/* Action Success */}
            <Route path="checkin-success" element={<StaffActionSuccess />} />
            <Route path="booking-success" element={<StaffActionSuccess />} />
            <Route path="checkout-completed" element={<StaffActionSuccess />} />

            {/* Checkout */}
            <Route path="checkout" element={<StaffVehicleCheckOut />} />
            <Route path="/staff/checkout/:sessionId" element={<StaffPaymentConfirm />} />
            {/* Create Incident */}
            <Route path="create-incident" element={<StaffCreateIncident />} />

            {/* Payment */}
            <Route path="payment-confirm" element={<StaffPaymentConfirm />} />
            <Route path="/staff/checkout/:sessionId" element={<StaffPaymentConfirm />} />

            {/* Parking Map */}
            <Route path="parking-map" element={<StaffParkingMap />} />


            {/* Search Session */}
            <Route path="search-session" element={<StaffSearchSession />} />

            {/* Profile / Settings */}
            <Route path="profile" element={<UserProfile />} />
            <Route path="settings" element={<UserProfile />} />
            <Route path="security" element={<UserProfile />} />

            {/* Support / User Guide */}
            <Route path="support" element={<StaffSupport />} />
            <Route path="user-guide" element={<StaffUserGuide />} />
          </Route>
        </Route>

        {/* Driver only */}
        <Route element={<RoleRoute allowedRoles={['Driver']} />}>
          <Route path="/driver" element={<DashboardLayout links={driverLinks} roleName="Driver" profileLink="/driver/profile" />}>
            <Route index element={<DriverHome />} />
            <Route path="dashboard" element={<DriverHome />} />
            <Route path="home" element={<DriverHome />} />
            <Route path="booking" element={<DriverBooking />} />
            <Route path="booking-confirmation" element={<DriverBookingConfirmation />} />
            <Route path="history" element={<DriverHistory />} />
            <Route path="session" element={<DriverSession />} />
            <Route path="payment" element={<DriverPayment />} />
            <Route path="report" element={<DriverReport />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="payment-result" element={<DriverPaymentResult />} />
            <Route path="settings" element={<DriverSettings />} />
            <Route path="help" element={<DriverHelp />} />
            <Route path="terms" element={<DriverTerms />} />
            <Route path="privacy" element={<DriverPrivacy />} />
            <Route path="support" element={<DriverSupport />} />
            <Route path="notifications" element={<DriverNotifications />} />
            <Route path="vehicles" element={<DriverVehicles />} />
            <Route path="feedback" element={<DriverFeedback />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App