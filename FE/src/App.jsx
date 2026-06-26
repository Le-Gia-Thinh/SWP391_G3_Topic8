/**
 * FILE: App.jsx
 * MÔ TẢ: Component gốc chứa cấu hình Router chính của ứng dụng.
 * Định nghĩa tất cả các tuyến đường (Routes) công khai và bảo vệ (Protected/Role Routes).
 * Hỗ trợ tải lười (Lazy Loading) các trang để tối ưu hiệu suất.
 */

import React, { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute, RoleRoute } from './components/ProtectedRoute'
import {
  LayoutGrid, LayoutDashboard, Map, FileText, CheckSquare, Search, BookOpen, Clock, Settings, Wallet, AlertTriangle, ShieldCheck, Home as HomeIcon, HelpCircle, LogOut, Bell, Car, Star, Users, KeyRound, Building2, ScrollText, Crown, CreditCard
} from 'lucide-react'

// Import Layouts
import DashboardLayout from './components/layout/DashboardLayout'
import AIChatBox from './components/chat/AIChatBox'

// Import Common Pages (Lazy)
const Home = React.lazy(() => import('./pages/Home'))
const Login = React.lazy(() => import('./pages/Login'))
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
const ManagerVehicleTypes = React.lazy(() => import('./pages/manager/ManagerVehicleTypes'))
const ManagerUnpaid = React.lazy(() => import('./pages/manager/ManagerUnpaid'))
// Admin Pages (Lazy)
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'))
const AdminRoles = React.lazy(() => import('./pages/admin/AdminRoles'))
const AdminBuildings = React.lazy(() => import('./pages/admin/AdminBuildings'))
const AdminParkingConfig = React.lazy(() => import('./pages/admin/AdminParkingConfig'))
const AdminAuditLog = React.lazy(() => import('./pages/admin/AdminAuditLog'))
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
const StaffSupportManager = React.lazy(() => import('./pages/staff/StaffSupportManager'))
const StaffTicketDetail = React.lazy(() => import('./pages/staff/StaffTicketDetail'))
const StaffUserGuide = React.lazy(() => import('./pages/staff/StaffUserGuide'))
const StaffPaymentHistory = React.lazy(() => import('./pages/staff/StaffPaymentHistory'))
const StaffFeedback = React.lazy(() => import('./pages/staff/StaffFeedback'))
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
const DriverSupport = React.lazy(() => import('./pages/driver/DriverSupport'))
const DriverTicketDetail = React.lazy(() => import('./pages/driver/DriverTicketDetail'))
const DriverTerms = React.lazy(() => import('./pages/driver/DriverTerms'))
const DriverPrivacy = React.lazy(() => import('./pages/driver/DriverPrivacy'))
const DriverNotifications = React.lazy(() => import('./pages/driver/DriverNotifications'))
const DriverVehicles = React.lazy(() => import('./pages/driver/DriverVehicles'))
const DriverFeedback = React.lazy(() => import('./pages/driver/DriverFeedback'))
const DriverSubscription = React.lazy(() => import('./pages/driver/DriverSubscription'))
const DriverSubscriptionPayment = React.lazy(() => import('./pages/driver/DriverSubscriptionPayment'))
const DriverSubscriptionUpgrade = React.lazy(() => import('./pages/driver/DriverSubscriptionUpgrade'))
const DriverSubscriptionCancel = React.lazy(() => import('./pages/driver/DriverSubscriptionCancel'))
const DriverTopUp = React.lazy(() => import('./pages/driver/DriverTopUp'))
const DriverTopUpPayment = React.lazy(() => import('./pages/driver/DriverTopUpPayment'))

// Guest Pages (Lazy)
const GuestTracking = React.lazy(() => import('./pages/guest/GuestTracking'))

import './index.css'

const managerLinks = [
  { path: '/manager/dashboard', labelKey: 'sidebar.overview', icon: LayoutDashboard },
  { path: '/manager/positions', labelKey: 'sidebar.manager.positions', icon: Map },
  { path: '/manager/reports', labelKey: 'sidebar.manager.reports', icon: FileText },
  { isDivider: true },
  { labelOnlyKey: 'sidebar.groups.config' },
  { path: '/manager/config', labelKey: 'sidebar.manager.config', icon: Settings },
  { path: '/manager/vehicle-types', labelKey: 'sidebar.manager.vehicleTypes', icon: Car },
  { path: '/manager/pricing', labelKey: 'sidebar.manager.pricing', icon: Wallet },
  { isDivider: true },
  { labelOnlyKey: 'sidebar.groups.monitor' },
  { path: '/manager/incidents', labelKey: 'sidebar.manager.incidents', icon: AlertTriangle },
  { path: '/manager/unpaid', labelKey: 'sidebar.manager.unpaid', icon: Wallet },
  { path: '/manager/feedback', labelKey: 'sidebar.manager.feedback', icon: Star }
]


const adminLinks = [
  { path: '/admin/dashboard', labelKey: 'sidebar.overview', icon: LayoutDashboard },
  { isDivider: true },
  { labelOnlyKey: 'sidebar.groups.admin' },
  { path: '/admin/users', labelKey: 'sidebar.admin.users', icon: Users },
  { path: '/admin/roles', labelKey: 'sidebar.admin.roles', icon: KeyRound },
  { path: '/admin/buildings', labelKey: 'sidebar.admin.buildings', icon: Building2 },
  { path: '/admin/parking-config', labelKey: 'sidebar.admin.parkingConfig', icon: LayoutGrid },
  { isDivider: true },
  { labelOnlyKey: 'sidebar.groups.monitor' },
  { path: '/admin/audit-logs', labelKey: 'sidebar.admin.auditLogs', icon: ScrollText }
]


const staffLinks = [
  { path: '/staff/dashboard', labelKey: 'sidebar.overview', icon: LayoutDashboard },
  { path: '/staff/parking-map', labelKey: 'sidebar.staff.parkingMap', icon: Map },
  { isDivider: true },
  { labelOnlyKey: 'sidebar.groups.operations' },
  { path: '/staff/checkin', labelKey: 'sidebar.staff.checkin', icon: CheckSquare },
  { path: '/staff/checkout', labelKey: 'sidebar.staff.checkout', icon: LogOut },
  { path: '/staff/search-session', labelKey: 'sidebar.staff.searchSession', icon: Search },
  { path: '/staff/verify-booking', labelKey: 'sidebar.staff.verifyBooking', icon: ShieldCheck },
  { path: '/staff/payment-confirm', labelKey: 'sidebar.staff.paymentConfirm', icon: Wallet },

  { isDivider: true },
  { labelOnlyKey: 'sidebar.groups.other' },
  { path: '/staff/create-incident', labelKey: 'sidebar.staff.createIncident', icon: AlertTriangle },
  { path: '/staff/user-guide', labelKey: 'sidebar.staff.userGuide', icon: BookOpen },
  { path: '/staff/support', labelKey: 'sidebar.staff.support', icon: HelpCircle },
  { path: '/staff/feedback', labelKey: 'sidebar.staff.feedback', icon: Star }
]

const driverLinks = [
  { path: '/driver/home', labelKey: 'sidebar.driver.home', icon: HomeIcon },
  { path: '/driver/session', labelKey: 'sidebar.driver.session', icon: Clock },
  { path: '/driver/history', labelKey: 'sidebar.driver.history', icon: FileText },
  { path: '/driver/payment', labelKey: 'sidebar.driver.payment', icon: Wallet },
  { path: '/driver/topup', labelKey: 'Nạp tiền', icon: CreditCard },
  { isDivider: true },
  { labelOnlyKey: 'sidebar.groups.management' },
  { path: '/driver/vehicles', labelKey: 'sidebar.driver.vehicles', icon: Car },
  { path: '/driver/notifications', labelKey: 'sidebar.driver.notifications', icon: Bell },
  { path: '/driver/subscription', labelKey: 'sidebar.driver.subscription', icon: Crown },
  { path: '/driver/feedback', labelKey: 'sidebar.driver.feedback', icon: Star },
  { isDivider: true },
  { labelOnlyKey: 'sidebar.groups.support' },
  { path: '/driver/report', labelKey: 'sidebar.driver.report', icon: AlertTriangle },
  { path: '/driver/help', labelKey: 'sidebar.driver.help', icon: HelpCircle }
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
        <Route path="/guest/tracking" element={<GuestTracking />} />

        {/* Verify email routes */}
        <Route path="/verify-email/pending" element={<VerifyEmailPending />} />
        <Route path="/verify-email/success" element={<VerifyEmailSuccess />} />
        <Route path="/verify-email/error" element={<VerifyEmailError />} />
        <Route path="/verify-email" element={<VerifyEmailPending />} />

        {/* Guest only */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
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

        {/* Admin only */}
        {/* ⚠️ TẠM THỜI: thêm 'Manager' để xem thử UI khi chưa có role Admin trong DB.
            👉 Khi backend có role Admin, đổi lại thành: allowedRoles={['Admin']} */}
        <Route element={<RoleRoute allowedRoles={['Admin', 'Manager']} />}>
          <Route path="/admin" element={<DashboardLayout links={adminLinks} roleName="Admin" profileLink="/admin/profile" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="buildings" element={<AdminBuildings />} />
            <Route path="parking-config" element={<AdminParkingConfig />} />
            <Route path="audit-logs" element={<AdminAuditLog />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>
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
            <Route path="vehicle-types" element={<ManagerVehicleTypes />} />
            <Route path="unpaid" element={<ManagerUnpaid />} />
            <Route path="feedback" element={<StaffFeedback />} />
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
            <Route path="checkout/:sessionId" element={<StaffPaymentConfirm />} />
            <Route path="payment-confirm" element={<StaffPaymentHistory />} />
            {/* Create Incident */}
            <Route path="create-incident" element={<StaffCreateIncident />} />


            {/* Parking Map */}
            <Route path="parking-map" element={<StaffParkingMap />} />


            {/* Search Session */}
            <Route path="search-session" element={<StaffSearchSession />} />

            {/* Profile / Settings */}
            <Route path="profile" element={<UserProfile />} />
            <Route path="security" element={<UserProfile />} />

            {/* Support / User Guide / Feedback */}
            <Route path="support" element={<StaffSupportManager />} />
            <Route path="support/:id" element={<StaffTicketDetail />} />
            <Route path="user-guide" element={<StaffUserGuide />} />
            <Route path="feedback" element={<StaffFeedback />} />
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
            <Route path="topup" element={<DriverTopUp />} />
            <Route path="topup-payment" element={<DriverTopUpPayment />} />
            <Route path="report" element={<DriverReport />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="payment-result" element={<DriverPaymentResult />} />
            <Route path="help" element={<DriverHelp />} />
            <Route path="terms" element={<DriverTerms />} />
            <Route path="privacy" element={<DriverPrivacy />} />
            <Route path="support" element={<DriverSupport />} />
            <Route path="support/:id" element={<DriverTicketDetail />} />
            <Route path="notifications" element={<DriverNotifications />} />
            <Route path="vehicles" element={<DriverVehicles />} />
            <Route path="feedback" element={<DriverFeedback />} />
            <Route path="subscription" element={<DriverSubscription />} />
            <Route path="subscription-payment" element={<DriverSubscriptionPayment />} />
            <Route path="subscription-upgrade" element={<DriverSubscriptionUpgrade />} />
            <Route path="subscription-cancel" element={<DriverSubscriptionCancel />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <AIChatBox />
    </Suspense>
  )
}

export default App