/**
 * FILE: staffRoutes.js
 * MÔ TẢ: Định nghĩa các đường dẫn API dành riêng cho Nhân viên Bảo vệ (Staff / Manager).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Bắt buộc đăng nhập (`isAuthorized`) và phải sở hữu Role là Staff hoặc Manager (`isStaffOrManager`).
 * 2. Phục vụ toàn bộ các thao tác trực tiếp tại cổng bãi đỗ: Check-in xe vãng lai, Check-in theo mã Đặt chỗ, Check-out tính tiền, Sơ đồ ô đỗ xe thời gian thực (Parking Map), và Xử lý Báo cáo sự cố/Support Ticket.
 * 3. Kiểm tra phân quyền linh hoạt qua middleware `hasPermission('PERM_NAME')`:
 *    - BƯỚC 1: Kiểm tra quyền nhóm vai trò (RolePermissions). Nếu vai trò không có quyền -> Từ chối 403.
 *    - BƯỚC 2: Kiểm tra quyền cá nhân (UserPermissions). Nếu bị thu hồi (IsGranted=0) -> Từ chối 403.
 */

import express from 'express';
// Import Controllers xử lý nghiệp vụ Staff, Phản hồi, Hỗ trợ kỹ thuật và Thanh toán
import * as staffController from '../controllers/staffController.js';
import * as supportController from '../controllers/supportController.js';
import * as staffFeedbackController from '../controllers/staffFeedbackController.js';
import * as paymentController from '../controllers/paymentController.js';
import { isAuthorized, isStaffOrManager, hasPermission } from '../middlewares/authMiddleware.js';
import {
    validateStaffWalkIn,
    validateStaffBookingCheckIn,
    validateStaffCheckOut,
    validateConfirmSurcharge
} from '../utils/validationUtils.js';

const router = express.Router();

// Tất cả các Route trong file này đều yêu cầu Đăng nhập & Quyền Staff/Manager
router.use(isAuthorized);
router.use(isStaffOrManager);

// ─────────────────────────────────────────────────────────────
// 1. DASHBOARD & THỐNG KÊ STAFF
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /staff/dashboard
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager`
 * QUYỀN YÊU CẦU: Mặc định cho Staff/Manager
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getDashboard()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getDashboard()` | Page `FE/src/pages/Staff/StaffDashboard.jsx`
 * DỮ LIỆU FE GỬI: Header Token Staff
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { todayCheckIns, todayCheckOuts, activeSessions, totalSlots } }`
 */
router.get('/dashboard', staffController.getDashboard);
router.get('/gates', staffController.getGates);

/**
 * ROUTE: GET /staff/feedbacks
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager`
 * CONTROLLER BE: `BE/src/controllers/staffFeedbackController.js` -> `getFeedbackSummary()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getFeedbacks()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { FeedbackID, RatingScore, DriverName, Comment } ] }`
 */
router.get('/feedbacks', staffFeedbackController.getFeedbackSummary);

// ─────────────────────────────────────────────────────────────
// 2. PARKING MAP & SLOTS (Sơ đồ vị trí ô đỗ)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /staff/parking-map
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('VIEW_SLOTS')`
 * QUYỀN YÊU CẦU: `VIEW_SLOTS` (Xem sơ đồ & chi tiết vị trí đỗ xe)
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getParkingMap()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getParkingMap(params)` | Page `FE/src/pages/Staff/ParkingMap.jsx`
 * DỮ LIỆU FE GỬI: Query params `?buildingId=1&floorId=2`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { ZoneName, Slots: [ { SlotID, SlotCode, SlotStatus, PlateNumber } ] } ] }`
 */
router.get('/parking-map', hasPermission('VIEW_SLOTS'), staffController.getParkingMap);

/**
 * ROUTE: PATCH /staff/slots/:slotId/status
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('VIEW_SLOTS')`
 * QUYỀN YÊU CẦU: `VIEW_SLOTS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `updateSlotStatus()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `updateSlotStatus(slotId, status)`
 * DỮ LIỆU FE GỬI: URL Param `:slotId`, Body `{ status: 'Available' / 'Maintenance' / 'Blocked' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật trạng thái ô đỗ thành công' }`
 */
router.patch('/slots/:slotId/status', hasPermission('VIEW_SLOTS'), staffController.updateSlotStatus);

/**
 * ROUTE: GET /staff/slots/:slotCode
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('VIEW_SLOTS')`
 * QUYỀN YÊU CẦU: `VIEW_SLOTS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getSlotDetail()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getSlotDetail(slotCode)`
 * DỮ LIỆU FE GỬI: URL Param `:slotCode`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { SlotID, SlotCode, SlotStatus, CurrentVehicle } }`
 */
router.get('/slots/:slotCode', hasPermission('VIEW_SLOTS'), staffController.getSlotDetail);

/**
 * ROUTE: GET /staff/vehicle-types
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('VIEW_SLOTS')`
 * QUYỀN YÊU CẦU: `VIEW_SLOTS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getVehicleTypes()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getVehicleTypes()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { VehicleTypeID, VehicleName, VehicleCode } ] }`
 */
router.get('/vehicle-types', hasPermission('VIEW_SLOTS'), staffController.getVehicleTypes);

// ─────────────────────────────────────────────────────────────
// 3. CHECK-IN LUỒNG XE VÀO BÃI (WALK-IN & BOOKING)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: POST /staff/check-in/walk-in
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_SESSIONS')`
 * QUYỀN YÊU CẦU: `MANAGE_SESSIONS` (Quản lý phiên đỗ xe & Check-in/out)
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `checkInWalkIn()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `checkInWalkIn(payload)` | Page `FE/src/pages/Staff/CheckIn.jsx`
 * DỮ LIỆU FE GỬI: Body `{ plateNumber, slotId, vehicleTypeId }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Check-in xe vãng lai thành công', data: { SessionID, SessionCode } }`
 */
router.post('/check-in/walk-in', hasPermission('MANAGE_SESSIONS'), staffController.checkInWalkIn);

/**
 * ROUTE: GET /staff/bookings
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_SESSIONS')`
 * QUYỀN YÊU CẦU: `MANAGE_SESSIONS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getBookings()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getBookings(params)`
 * DỮ LIỆU FE GỬI: Query string `?search=BK-0005`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { ReservationID, BookingCode, DriverName, SlotCode, StartTime } ] }`
 */
router.get('/bookings', hasPermission('MANAGE_SESSIONS'), staffController.getBookings);

/**
 * ROUTE: GET /staff/bookings/:reservationId
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_SESSIONS')`
 * QUYỀN YÊU CẦU: `MANAGE_SESSIONS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getBookingDetail()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getBookingDetail(reservationId)`
 * DỮ LIỆU FE GỬI: URL Param `:reservationId`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { ReservationID, BookingCode, PlateNumber, DriverName, SlotCode } }`
 */
router.get('/bookings/:reservationId', hasPermission('MANAGE_SESSIONS'), staffController.getBookingDetail);

/**
 * ROUTE: POST /staff/bookings/:reservationId/check-in
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_SESSIONS')`
 * QUYỀN YÊU CẦU: `MANAGE_SESSIONS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `checkInBooking()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `checkInBooking(reservationId, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:reservationId`, Body `{ plateNumber }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Check-in đơn đặt chỗ thành công', data: { SessionID } }`
 */
router.post('/bookings/:reservationId/check-in', hasPermission('MANAGE_SESSIONS'), staffController.checkInBooking);

/**
 * ROUTE: POST /staff/bookings/:reservationId/cancel-and-walkin
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_SESSIONS')`
 * QUYỀN YÊU CẦU: `MANAGE_SESSIONS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `cancelAndWalkIn()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `cancelAndWalkIn(reservationId, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:reservationId`, Body `{ newSlotId, plateNumber }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Hủy booking cũ và cho xe vào vãng lai thành công' }`
 */
router.post('/bookings/:reservationId/cancel-and-walkin', hasPermission('MANAGE_SESSIONS'), staffController.cancelAndWalkIn);

// ─────────────────────────────────────────────────────────────
// 4. SESSIONS & CHECK-OUT LUỒNG XE RA KHỎI BÃI
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /staff/sessions
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_SESSIONS')`
 * QUYỀN YÊU CẦU: `MANAGE_SESSIONS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `searchSessions()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `searchSessions(params)`
 * DỮ LIỆU FE GỬI: Query string `?plateNumber=51H-12345`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { SessionID, SessionCode, PlateNumber, EntryTime, SlotCode } ] }`
 */
router.get('/sessions', hasPermission('MANAGE_SESSIONS'), staffController.searchSessions);

/**
 * ROUTE: GET /staff/sessions/active
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_SESSIONS')`
 * QUYỀN YÊU CẦU: `MANAGE_SESSIONS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getActiveSessions()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getActiveSessions()`
 * DỮ LIỆU FE GỬI: Header Token Staff
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ ...danh sách xe đang đỗ trong bãi ] }`
 */
router.get('/sessions/active', hasPermission('MANAGE_SESSIONS'), staffController.getActiveSessions);

/**
 * ROUTE: GET /staff/sessions/:sessionId/checkout-preview
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_PAYMENTS')`
 * QUYỀN YÊU CẦU: `MANAGE_PAYMENTS` (Tính tiền & thu phí đỗ xe)
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getCheckoutPreview()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getCheckoutPreview(sessionId)`
 * DỮ LIỆU FE GỬI: URL Param `:sessionId`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { SessionID, PlateNumber, ParkedDuration, BaseFee, OvertimeFee, TotalFee } }`
 */
router.get('/sessions/:sessionId/checkout-preview', hasPermission('MANAGE_PAYMENTS'), staffController.getCheckoutPreview);

/**
 * ROUTE: POST /staff/sessions/:sessionId/check-out
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_PAYMENTS')`
 * QUYỀN YÊU CẦU: `MANAGE_PAYMENTS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `checkOutSession()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `checkOutSession(sessionId, payload)` | Page `FE/src/pages/Staff/CheckOut.jsx`
 * DỮ LIỆU FE GỬI: URL Param `:sessionId`, Body `{ paymentMethod: 'Cash' / 'PayOS' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Check-out thành công', data }`
 */
router.post('/sessions/:sessionId/check-out', hasPermission('MANAGE_PAYMENTS'), staffController.checkOutSession);

/**
 * ROUTE: POST /staff/sessions/:sessionId/confirm-surcharge
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_PAYMENTS')`
 * QUYỀN YÊU CẦU: `MANAGE_PAYMENTS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `confirmSurcharge()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `confirmSurcharge(sessionId, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:sessionId`, Body `{ surchargeAmount, reason }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Xác nhận phụ phí thành công' }`
 */
router.post('/sessions/:sessionId/confirm-surcharge', hasPermission('MANAGE_PAYMENTS'), staffController.confirmSurcharge);

// ─────────────────────────────────────────────────────────────
// 5. INCIDENTS (Xử lý sự cố tại bãi đỗ)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: POST /staff/incidents
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_INCIDENTS')`
 * QUYỀN YÊU CẦU: `MANAGE_INCIDENTS` (Quản lý & Báo cáo sự cố)
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `createIncident()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `createIncident(payload)`
 * DỮ LIỆU FE GỬI: Body `{ sessionId, incidentType, description, priority, attachments }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Tạo báo cáo sự cố thành công', data: { IncidentID } }`
 */
router.post('/incidents', hasPermission('MANAGE_INCIDENTS'), staffController.createIncident);

/**
 * ROUTE: GET /staff/incidents
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_INCIDENTS')`
 * QUYỀN YÊU CẦU: `MANAGE_INCIDENTS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getIncidents()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getIncidents(params)`
 * DỮ LIỆU FE GỬI: Query params `?status=Open`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { IncidentID, IncidentType, Status, Priority, Description } ] }`
 */
router.get('/incidents', hasPermission('MANAGE_INCIDENTS'), staffController.getIncidents);

/**
 * ROUTE: GET /staff/incidents/:incidentId
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_INCIDENTS')`
 * QUYỀN YÊU CẦU: `MANAGE_INCIDENTS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getIncidentById()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getIncidentById(incidentId)`
 * DỮ LIỆU FE GỬI: URL Param `:incidentId`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { IncidentID, Description, Status, Photos: [] } }`
 */
router.get('/incidents/:incidentId', staffController.getIncidentById);

/**
 * ROUTE: PATCH /staff/incidents/:incidentId/status
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_INCIDENTS')`
 * QUYỀN YÊU CẦU: `MANAGE_INCIDENTS`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `updateIncidentStatus()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `updateIncidentStatus(incidentId, status)`
 * DỮ LIỆU FE GỬI: URL Param `:incidentId`, Body `{ status: 'Resolved' / 'In_Progress' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật trạng thái sự cố thành công' }`
 */
router.patch('/incidents/:incidentId/status', hasPermission('MANAGE_INCIDENTS'), staffController.updateIncidentStatus);

// ─────────────────────────────────────────────────────────────
// 6. PROFILE & SUPPORT TICKETS STAFF
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /staff/profile
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager`
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getProfile()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getProfile()`
 * DỮ LIỆU FE GỬI: Header Token Staff
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { UserID, FullName, Email, RoleName } }`
 */
router.get('/profile', staffController.getProfile);

/**
 * ROUTE: GET /staff/support/tickets
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_SUPPORT')`
 * QUYỀN YÊU CẦU: `MANAGE_SUPPORT` (Xử lý ticket hỗ trợ tài xế)
 * CONTROLLER BE: `BE/src/controllers/supportController.js` -> `getStaffTickets()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getTickets()`
 * DỮ LIỆU FE GỬI: Header Token Staff
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { TicketID, DriverName, Title, Status } ] }`
 */
router.get('/support/tickets', hasPermission('MANAGE_SUPPORT'), supportController.getStaffTickets);

/**
 * ROUTE: GET /staff/support/tickets/:id
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_SUPPORT')`
 * QUYỀN YÊU CẦU: `MANAGE_SUPPORT`
 * CONTROLLER BE: `BE/src/controllers/supportController.js` -> `getTicketDetails()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getTicketDetails(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { TicketID, Description, Replies: [] } }`
 */
router.get('/support/tickets/:id', hasPermission('MANAGE_SUPPORT'), supportController.getTicketDetails);

/**
 * ROUTE: POST /staff/support/tickets/:id/replies
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_SUPPORT')`
 * QUYỀN YÊU CẦU: `MANAGE_SUPPORT`
 * CONTROLLER BE: `BE/src/controllers/supportController.js` -> `replyTicket()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `replyTicket(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ message }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Phản hồi ticket hỗ trợ thành công' }`
 */
router.post('/support/tickets/:id/replies', hasPermission('MANAGE_SUPPORT'), supportController.replyTicket);

/**
 * ROUTE: PATCH /staff/support/tickets/:id/status
 * MIDDLEWARE BẢO VỆ: `isAuthorized` + `isStaffOrManager` + `hasPermission('MANAGE_SUPPORT')`
 * QUYỀN YÊU CẦU: `MANAGE_SUPPORT`
 * CONTROLLER BE: `BE/src/controllers/supportController.js` -> `updateTicketStatus()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `updateTicketStatus(id, status)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ status: 'Closed' / 'In_Progress' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật trạng thái ticket thành công' }`
 */
router.patch('/support/tickets/:id/status', hasPermission('MANAGE_SUPPORT'), supportController.updateTicketStatus);

// ─────────────────────────────────────────────────────────────
// 7. CONFIRMATION & PAYMENT CREATION FOR STAFF
// ─────────────────────────────────────────────────────────────

router.get('/sessions/pending-payments', hasPermission('MANAGE_PAYMENTS'), staffController.getPendingPayments);
router.get('/drivers/:driverId/payment-history', hasPermission('MANAGE_PAYMENTS'), staffController.getPaymentHistory);

router.post('/checkin/walkin', isAuthorized, hasPermission('MANAGE_SESSIONS'), validateStaffWalkIn, staffController.checkInWalkIn);
router.post('/checkin/booking/:reservationId', isAuthorized, hasPermission('MANAGE_SESSIONS'), validateStaffBookingCheckIn, staffController.checkInBooking);
router.post('/checkout/:sessionId', isAuthorized, hasPermission('MANAGE_PAYMENTS'), validateStaffCheckOut, staffController.checkOutSession);
router.post('/sessions/:sessionId/surcharge', isAuthorized, hasPermission('MANAGE_PAYMENTS'), validateConfirmSurcharge, staffController.confirmSurcharge);

router.post('/payment/create', hasPermission('MANAGE_PAYMENTS'), paymentController.createPaymentForStaff);
router.get('/payment/status/:orderCode', hasPermission('MANAGE_PAYMENTS'), paymentController.getPaymentStatus);

export default router;