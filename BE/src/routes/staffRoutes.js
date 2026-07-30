/**
 * FILE: staffRoutes.js
 * MÔ TẢ: Định nghĩa các đường dẫn API dành riêng cho Nhân viên Bảo vệ (Staff / Manager).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Bắt buộc đăng nhập (`isAuthorized`) và phải sở hữu Role là Staff hoặc Manager (`isStaffOrManager`).
 * 2. Phục vụ toàn bộ các thao tác trực tiếp tại cổng bãi đỗ: Check-in xe vãng lai, Check-in theo mã Đặt chỗ, Check-out tính tiền, Sơ đồ ô đỗ xe thời gian thực (Parking Map), và Xử lý Báo cáo sự cố/Support Ticket.
 */

import express from 'express';
// Import Controllers xử lý nghiệp vụ Staff, Phản hồi, Hỗ trợ kỹ thuật và Thanh toán
import * as staffController from '../controllers/staffController.js';
import * as supportController from '../controllers/supportController.js';
import * as staffFeedbackController from '../controllers/staffFeedbackController.js';
import * as paymentController from '../controllers/paymentController.js';
import { isAuthorized, isStaffOrManager } from '../middlewares/authMiddleware.js';
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
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getDashboard()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getDashboard()` | Page `FE/src/pages/Staff/StaffDashboard.jsx`
 * DỮ LIỆU FE GỬI: Header Token Staff
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { todayCheckIns, todayCheckOuts, activeSessions, totalSlots } }`
 */
router.get('/dashboard', staffController.getDashboard);
router.get('/gates', staffController.getGates);

/**
 * ROUTE: GET /staff/feedbacks
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
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getParkingMap()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getParkingMap(params)` | Page `FE/src/pages/Staff/ParkingMap.jsx`
 * DỮ LIỆU FE GỬI: Query params `?buildingId=1&floorId=2`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { ZoneName, Slots: [ { SlotID, SlotCode, SlotStatus, PlateNumber } ] } ] }`
 */
router.get('/parking-map', staffController.getParkingMap);

/**
 * ROUTE: PATCH /staff/slots/:slotId/status
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `updateSlotStatus()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `updateSlotStatus(slotId, status)`
 * DỮ LIỆU FE GỬI: URL Param `:slotId`, Body `{ status: 'Available' / 'Maintenance' / 'Blocked' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật trạng thái ô đỗ thành công' }`
 */
router.patch('/slots/:slotId/status', staffController.updateSlotStatus);

/**
 * ROUTE: GET /staff/slots/:slotCode
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getSlotDetail()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getSlotDetail(slotCode)`
 * DỮ LIỆU FE GỬI: URL Param `:slotCode`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { SlotID, SlotCode, SlotStatus, CurrentVehicle } }`
 */
router.get('/slots/:slotCode', staffController.getSlotDetail);

/**
 * ROUTE: GET /staff/vehicle-types
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getVehicleTypes()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getVehicleTypes()`
 * DỮ LIỆU FE GỬI: Header Token
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { VehicleTypeID, VehicleName, VehicleCode } ] }`
 */
router.get('/vehicle-types', staffController.getVehicleTypes);

// ─────────────────────────────────────────────────────────────
// 3. CHECK-IN LUỒNG XE VÀO BÃI (WALK-IN & BOOKING)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: POST /staff/check-in/walk-in
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `checkInWalkIn()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `checkInWalkIn(payload)` | Page `FE/src/pages/Staff/CheckIn.jsx`
 * DỮ LIỆU FE GỬI: Body `{ plateNumber, slotId, vehicleTypeId }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Check-in xe vãng lai thành công', data: { SessionID, SessionCode } }`
 */
router.post('/check-in/walk-in', staffController.checkInWalkIn);

/**
 * ROUTE: GET /staff/bookings
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getBookings()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getBookings(params)`
 * DỮ LIỆU FE GỬI: Query string `?search=BK-0005`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { ReservationID, BookingCode, DriverName, SlotCode, StartTime } ] }`
 */
router.get('/bookings', staffController.getBookings);

/**
 * ROUTE: GET /staff/bookings/:reservationId
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getBookingDetail()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getBookingDetail(reservationId)`
 * DỮ LIỆU FE GỬI: URL Param `:reservationId`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { ReservationID, BookingCode, PlateNumber, DriverName, SlotCode } }`
 */
router.get('/bookings/:reservationId', staffController.getBookingDetail);

/**
 * ROUTE: POST /staff/bookings/:reservationId/check-in
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `checkInBooking()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `checkInBooking(reservationId, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:reservationId`, Body `{ plateNumber }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Check-in đơn đặt chỗ thành công', data: { SessionID } }`
 */
router.post('/bookings/:reservationId/check-in', staffController.checkInBooking);

/**
 * ROUTE: POST /staff/bookings/:reservationId/cancel-and-walkin
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `cancelAndWalkIn()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `cancelAndWalkIn(reservationId, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:reservationId`, Body `{ newSlotId, plateNumber }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Hủy booking cũ và cho xe vào vãng lai thành công' }`
 */
router.post('/bookings/:reservationId/cancel-and-walkin', staffController.cancelAndWalkIn);

// ─────────────────────────────────────────────────────────────
// 4. SESSIONS & CHECK-OUT LUỒNG XE RA KHỎI BÃI
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /staff/sessions
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `searchSessions()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `searchSessions(params)`
 * DỮ LIỆU FE GỬI: Query string `?plateNumber=51H-12345`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { SessionID, SessionCode, PlateNumber, EntryTime, SlotCode } ] }`
 */
router.get('/sessions', staffController.searchSessions);

/**
 * ROUTE: GET /staff/sessions/active
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getActiveSessions()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getActiveSessions()`
 * DỮ LIỆU FE GỬI: Header Token Staff
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ ...danh sách xe đang đỗ trong bãi ] }`
 */
router.get('/sessions/active', staffController.getActiveSessions);

/**
 * ROUTE: GET /staff/sessions/:sessionId/checkout-preview
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getCheckoutPreview()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getCheckoutPreview(sessionId)`
 * DỮ LIỆU FE GỬI: URL Param `:sessionId`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { SessionID, PlateNumber, ParkedDuration, BaseFee, OvertimeFee, TotalFee } }`
 */
router.get('/sessions/:sessionId/checkout-preview', staffController.getCheckoutPreview);

/**
 * ROUTE: POST /staff/sessions/:sessionId/check-out
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `checkOutSession()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `checkOutSession(sessionId, payload)` | Page `FE/src/pages/Staff/CheckOut.jsx`
 * DỮ LIỆU FE GỬI: URL Param `:sessionId`, Body `{ paymentMethod: 'Cash' / 'PayOS' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Check-out thành công', data }`
 */
router.post('/sessions/:sessionId/check-out', staffController.checkOutSession);

/**
 * ROUTE: POST /staff/sessions/:sessionId/confirm-surcharge
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `confirmSurcharge()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `confirmSurcharge(sessionId, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:sessionId`, Body `{ surchargeAmount, reason }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Xác nhận phụ phí thành công' }`
 */
router.post('/sessions/:sessionId/confirm-surcharge', staffController.confirmSurcharge);

// ─────────────────────────────────────────────────────────────
// 5. INCIDENTS (Xử lý sự cố tại bãi đỗ)
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: POST /staff/incidents
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `createIncident()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `createIncident(payload)`
 * DỮ LIỆU FE GỬI: Body `{ sessionId, incidentType, description, priority, attachments }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Tạo báo cáo sự cố thành công', data: { IncidentID } }`
 */
router.post('/incidents', staffController.createIncident);

/**
 * ROUTE: GET /staff/incidents
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getIncidents()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getIncidents(params)`
 * DỮ LIỆU FE GỬI: Query params `?status=Open`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { IncidentID, IncidentType, Status, Priority, Description } ] }`
 */
router.get('/incidents', staffController.getIncidents);

/**
 * ROUTE: GET /staff/incidents/:incidentId
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getIncidentById()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getIncidentById(incidentId)`
 * DỮ LIỆU FE GỬI: URL Param `:incidentId`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { IncidentID, Description, Status, Photos: [] } }`
 */
router.get('/incidents/:incidentId', staffController.getIncidentById);

/**
 * ROUTE: PATCH /staff/incidents/:incidentId/status
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `updateIncidentStatus()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `updateIncidentStatus(incidentId, status)`
 * DỮ LIỆU FE GỬI: URL Param `:incidentId`, Body `{ status: 'Resolved' / 'In_Progress' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật trạng thái sự cố thành công' }`
 */
router.patch('/incidents/:incidentId/status', staffController.updateIncidentStatus);

// ─────────────────────────────────────────────────────────────
// 6. PROFILE & SUPPORT TICKETS STAFF
// ─────────────────────────────────────────────────────────────

/**
 * ROUTE: GET /staff/profile
 * CONTROLLER BE: `BE/src/controllers/staffController.js` -> `getProfile()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getProfile()`
 * DỮ LIỆU FE GỬI: Header Token Staff
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { UserID, FullName, Email, RoleName } }`
 */
router.get('/profile', staffController.getProfile);

/**
 * ROUTE: GET /staff/support/tickets
 * CONTROLLER BE: `BE/src/controllers/supportController.js` -> `getStaffTickets()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getTickets()`
 * DỮ LIỆU FE GỬI: Header Token Staff
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: [ { TicketID, DriverName, Title, Status } ] }`
 */
router.get('/support/tickets', supportController.getStaffTickets);

/**
 * ROUTE: GET /staff/support/tickets/:id
 * CONTROLLER BE: `BE/src/controllers/supportController.js` -> `getTicketDetails()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `getTicketDetails(id)`
 * DỮ LIỆU FE GỬI: URL Param `:id`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, data: { TicketID, Description, Replies: [] } }`
 */
router.get('/support/tickets/:id', supportController.getTicketDetails);

/**
 * ROUTE: POST /staff/support/tickets/:id/replies
 * CONTROLLER BE: `BE/src/controllers/supportController.js` -> `replyTicket()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `replyTicket(id, payload)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ message }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Phản hồi ticket hỗ trợ thành công' }`
 */
router.post('/support/tickets/:id/replies', supportController.replyTicket);

/**
 * ROUTE: PATCH /staff/support/tickets/:id/status
 * CONTROLLER BE: `BE/src/controllers/supportController.js` -> `updateTicketStatus()`
 * FE FILE GỌI: `FE/src/apis/staffApi.js` -> `updateTicketStatus(id, status)`
 * DỮ LIỆU FE GỬI: URL Param `:id`, Body `{ status: 'Closed' / 'In_Progress' }`
 * DỮ LIỆU BE TRẢ VỀ: `{ success: true, message: 'Cập nhật trạng thái ticket thành công' }`
 */
router.patch('/support/tickets/:id/status', supportController.updateTicketStatus);

// ─────────────────────────────────────────────────────────────
// 7. CONFIRMATION & PAYMENT CREATION FOR STAFF
// ─────────────────────────────────────────────────────────────

router.get('/sessions/pending-payments', staffController.getPendingPayments);
router.get('/drivers/:driverId/payment-history', staffController.getPaymentHistory);

router.post('/checkin/walkin', isAuthorized, validateStaffWalkIn, staffController.checkInWalkIn);
router.post('/checkin/booking/:reservationId', isAuthorized, validateStaffBookingCheckIn, staffController.checkInBooking);
router.post('/checkout/:sessionId', isAuthorized, validateStaffCheckOut, staffController.checkOutSession);
router.post('/sessions/:sessionId/surcharge', isAuthorized, validateConfirmSurcharge, staffController.confirmSurcharge);

router.post('/payment/create', paymentController.createPaymentForStaff);
router.get('/payment/status/:orderCode', paymentController.getPaymentStatus);

export default router;