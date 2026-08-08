/**
 * FILE: staffController.js
 * MÔ TẢ: Controller xử lý toàn bộ các tác nghiệp thực tế tại bãi đỗ xe dành cho Nhân viên Bảo vệ (Staff).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Quản lý sơ đồ bãi đỗ: Xem sơ đồ thời gian thực (Parking Map), xem chi tiết ô đỗ theo SlotCode, cập nhật trạng thái Maintenance/Blocked thủ công.
 * 2. Luồng xe vào bãi (Check-in): Cho xe vãng lai (Walk-in) vào bãi hoặc xác nhận Check-in cho xe đã đặt trước (Booking Check-in).
 * 3. Luồng xe ra bãi (Check-out): Xem trước bảng tính tiền (Preview Fee), xác nhận xe ra, tính phí phạt đỗ quá giờ và thu tiền phụ trội (Surcharge).
 * 4. Quản lý sự cố tại bãi (Incidents): Tạo biên bản sự cố (Mất thẻ, va quẹt, vi phạm đỗ), đính kèm tối đa 15 ảnh bằng chứng và cập nhật tiến độ giải quyết.
 */

// Import enum StatusCodes chuẩn quốc tế (200 OK, 201 CREATED, 400 BAD REQUEST,...) từ thư viện 'http-status-codes'
import { StatusCodes } from 'http-status-codes'
// Import tất cả hàm xử lý từ tầng service 'BE/src/services/staffService.js'
// LIÊN KẾT FILE: `BE/src/services/staffService.js` - Chứa các thủ tục SQL Server Check-in (`sp_CheckInVehicle`), Check-out (`sp_CheckOutWithSurcharge`), tạo Incidents.
import * as staffService from '../services/staffService.js'
// Import service phiên đỗ xe
import * as sessionService from '../services/sessionService.js';

/**
 * HÀM HELPER: getUserId
 * TÁC DỤNG: Lấy mã ID của Nhân viên bảo vệ đang đăng nhập từ req.user hoặc req.jwtDecoded
 */
const getUserId = (req) =>
    req.user?.UserID || req.user?.userId || req.user?.id || req.jwtDecoded?.userId || req.jwtDecoded?.UserID

/**
 * HÀM 1: getDashboard
 * TÁC DỤNG: Lấy dữ liệu báo cáo tổng quan dành riêng cho ca trực bảo vệ (Số xe đang gửi, số ô đỗ trống, số sự cố đang mở).
 * 
 * @route GET /api/staff/dashboard
 * @access Staff Only (Chỉ bảo vệ ca trực)
 */
export async function getDashboard(req, res, next) {
    try {
        const staffUserId = ['Staff', 'Manager'].includes(req.user?.RoleName) ? getUserId(req) : null;
        const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null;
        const data = await staffService.getDashboard(staffUserId, buildingId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

export async function getGates(req, res, next) {
    try {
        const staffUserId = ['Staff', 'Manager'].includes(req.user?.RoleName) ? getUserId(req) : null;
        const buildingId = req.query.buildingId ? Number(req.query.buildingId) : null;
        const data = await staffService.getGates(buildingId, staffUserId);
        res.status(StatusCodes.OK).json({ success: true, data });
    } catch (error) {
        next(error);
    }
}

/**
 * HÀM 2: getParkingMap
 * TÁC DỤNG: Lấy sơ đồ bãi đỗ xe đa tầng theo thời gian thực (hỗ trợ lọc theo Tòa nhà, Tầng, Loại xe, Trạng thái).
 * 
 * @route GET /api/staff/parking-map?buildingId=1&floorId=2
 * @access Staff Only
 */
export async function getParkingMap(req, res, next) {
    try {
        const staffUserId = ['Staff', 'Manager'].includes(req.user?.RoleName) ? getUserId(req) : null;
        const data = await staffService.getParkingMap(req.query, staffUserId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 3: updateSlotStatus
 * TÁC DỤNG: Bảo vệ thay đổi trạng thái ô đỗ xe bằng tay (Ví dụ: Chuyển ô đỗ sang 'Maintenance' khi bị hỏng hoặc 'Blocked' khi bảo trì).
 * 
 * @route PUT /api/staff/slots/:slotId/status
 * @access Staff Only
 */
export async function updateSlotStatus(req, res, next) {
    try {
        const { slotId } = req.params // Lấy ID ô đỗ từ đường dẫn URL
        const { slotStatus } = req.body // Lấy trạng thái mới từ req.body (Maintenance / Available / Blocked)
        const staffUserId = getUserId(req)
        const data = await staffService.updateSlotStatus(slotId, slotStatus, staffUserId)
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Cập nhật trạng thái slot thành công.',
            data
        })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 4: checkInWalkIn
 * TÁC DỤNG: Thực hiện Check-in cho xe vãng lai (khách không đặt chỗ trước).
 * Khởi tạo phiên đỗ xe mới trong bảng `ParkingSessions` và đổi trạng thái ô đỗ thành 'Occupied'.
 * 
 * @route POST /api/staff/check-in/walk-in
 * @access Staff Only
 */
export async function checkInWalkIn(req, res, next) {
    try {
        const staffUserId = getUserId(req)
        const data = await staffService.checkInWalkIn({
            ...req.body,
            staffUserId
        })
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Tạo phiên gửi xe vãng lai thành công.',
            data
        })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 5: getBookings
 * TÁC DỤNG: Tra cứu danh sách các lịch Đặt chỗ đỗ trước (Reservations) đang chờ xe tới bãi.
 * 
 * @route GET /api/staff/bookings?status=Reserved
 * @access Staff Only
 */
export async function getBookings(req, res, next) {
    try {
        const staffUserId = ['Staff', 'Manager'].includes(req.user?.RoleName) ? getUserId(req) : null;
        const data = await staffService.getBookings(req.query, staffUserId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 6: getBookingDetail
 * TÁC DỤNG: Xem thông tin chi tiết của một mã đặt chỗ trước (Thông tin tài xế, thời gian đăng ký đỗ).
 * 
 * @route GET /api/staff/bookings/:reservationId
 * @access Staff Only
 */
export async function getBookingDetail(req, res, next) {
    try {
        const { reservationId } = req.params
        const staffUserId = getUserId(req)
        const data = await staffService.getBookingDetail(reservationId, staffUserId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 7: checkInBooking
 * TÁC DỤNG: Xác nhận Check-in cho xe đã đặt chỗ trước.
 * Đổi trạng thái lịch đặt chỗ từ 'Reserved' thành 'Completed' và khởi tạo phiên đỗ xe Active.
 * 
 * @route POST /api/staff/bookings/:reservationId/check-in
 * @access Staff Only
 */
export async function checkInBooking(req, res, next) {
    try {
        const { reservationId } = req.params // Lấy ID mã đặt chỗ từ URL
        const { plateNumber, cardCode, gateIn, gateInId } = req.body || {}
        const staffId = getUserId(req)

        // Gọi service xử lý chuyển đổi đặt trước thành phiên đỗ xe hoạt động
        const data = await staffService.checkInBooking(reservationId, {
            plateNumber,
            cardCode,
            gateIn,
            gateInId,
            staffId
        })

        // Trả về kết quả HTTP 201 Created
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Check-in booking thành công.',
            data
        })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 8: cancelAndWalkIn
 * TÁC DỤNG: Xử lý trường hợp khách đến sai giờ đặt trước -> Hủy đơn đặt trước và chuyển xe sang đỗ theo dạng Vãng lai (Walk-in).
 * 
 * @route POST /api/staff/bookings/:reservationId/cancel-and-walk-in
 * @access Staff Only
 */
export async function cancelAndWalkIn(req, res, next) {
    try {
        const { reservationId } = req.params
        const { plateNumber, slotId, cardCode, gateIn, gateInId } = req.body || {}
        const staffId = getUserId(req)

        const data = await staffService.cancelAndWalkIn(reservationId, {
            plateNumber,
            slotId,
            cardCode,
            gateIn,
            gateInId,
            staffId
        })

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Check-in vãng lai thành công. Đặt trước đã được hủy.',
            data
        })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 9: searchSessions
 * TÁC DỤNG: Tìm kiếm các phiên đỗ xe theo từ khóa biển số xe, mã phiên, ngày vào/ra.
 * 
 * @route GET /api/staff/sessions/search?keyword=29A12345
 * @access Staff Only
 */
export async function searchSessions(req, res, next) {
    try {
        const staffUserId = getUserId(req)
        const data = await staffService.searchSessions(req.query, staffUserId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (err) { next(err) }
}

/**
 * HÀM 10: getActiveSessions
 * TÁC DỤNG: Lấy danh sách toàn bộ các xe đang có mặt đỗ trong bãi (`SessionStatus = 'Active'`).
 * 
 * @route GET /api/staff/sessions/active
 * @access Staff Only
 */
export async function getActiveSessions(req, res, next) {
    try {
        const staffUserId = getUserId(req)
        const data = await staffService.searchSessions({
            ...req.query,
            status: 'Active'
        }, staffUserId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 11: getCheckoutPreview
 * TÁC DỤNG: Xem trước bảng tính phí đỗ xe trước khi bấm cho xe ra (Xem tổng số giờ đỗ, phí tạm tính, phí phạt quá giờ nếu có).
 * 
 * @route GET /api/staff/sessions/:sessionId/checkout-preview
 * @access Staff Only
 */
export async function getCheckoutPreview(req, res, next) {
    try {
        const { sessionId } = req.params
        const staffUserId = getUserId(req)
        const data = await staffService.getCheckoutPreview(sessionId, staffUserId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 12: checkOutSession
 * TÁC DỤNG: Cho xe rời khỏi bãi đỗ xe (Check-out).
 * Gọi Stored Procedure `sp_CheckOutVehicle` hoặc `sp_CheckOutWithSurcharge` để cập nhật ExitTime=GETDATE(), tính tổng tiền và giải phóng vị trí đỗ.
 * 
 * @route POST /api/staff/sessions/:sessionId/checkout
 * @access Staff Only
 */
export async function checkOutSession(req, res, next) {
    try {
        const { sessionId } = req.params
        const staffUserId = getUserId(req)
        const data = await staffService.checkOutSession(sessionId, { ...req.body, staffUserId })
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Check-out thành công.',
            data
        })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 13: confirmSurcharge
 * TÁC DỤNG: Xác nhận bảo vệ đã thu đủ số tiền phụ trội (Surcharge) từ tài xế gửi quá giờ.
 * 
 * @route POST /api/staff/sessions/:sessionId/confirm-surcharge
 * @access Staff Only
 */
export async function confirmSurcharge(req, res, next) {
    try {
        const { sessionId } = req.params
        const { paymentMethod } = req.body
        const staffUserId = getUserId(req)
        const data = await staffService.confirmSurcharge(sessionId, paymentMethod, staffUserId)
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Thu phụ trội thành công.',
            data
        })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 14: createIncident
 * TÁC DỤNG: Lập biên bản sự cố xảy ra tại bãi đỗ (Mất vé/Mất thẻ, va quẹt xe, đỗ sai vị trí quy định,...).
 * Giới hạn tối đa 15 tệp ảnh đính kèm minh chứng.
 * 
 * @route POST /api/staff/incidents
 * @access Staff Only
 */
export async function createIncident(req, res, next) {
    try {
        const staffId = getUserId(req)

        // RÀNG BUỘC KÍCH THƯỚC FILE ĐÍNH KÈM:
        const { attachments } = req.body
        if (attachments && Array.isArray(attachments) && attachments.length > 15) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Tối đa 15 ảnh đính kèm.',
                code: 'TOO_MANY_ATTACHMENTS'
            })
        }

        // Gọi service tạo bản ghi sự cố trong bảng Incidents
        const data = await staffService.createIncident({
            ...req.body,
            staffId
        })

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Tạo sự cố thành công.',
            data
        })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 15: getIncidents
 * TÁC DỤNG: Lấy danh sách các sự cố trong bãi (hỗ trợ lọc theo trạng thái Open/InProgress/Resolved).
 * 
 * @route GET /api/staff/incidents
 * @access Staff Only
 */
export async function getIncidents(req, res, next) {
    try {
        const staffUserId = getUserId(req)
        const data = await staffService.getIncidents(req.query, staffUserId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 16: getIncidentById
 * TÁC DỤNG: Xem thông tin chi tiết một sự cố kèm danh sách hình ảnh đính kèm và lịch sử xử lý.
 * 
 * @route GET /api/staff/incidents/:incidentId
 * @access Staff Only
 */
export async function getIncidentById(req, res, next) {
    try {
        const { incidentId } = req.params
        const staffUserId = getUserId(req)
        const data = await staffService.getIncidentById(incidentId, staffUserId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) { next(error) }
}

/**
 * HÀM 17: updateIncidentStatus
 * TÁC DỤNG: Bảo vệ cập nhật tiến độ giải quyết sự cố (Chuyển trạng thái sang InProgress hoặc Resolved/Closed).
 * 
 * @route PUT /api/staff/incidents/:incidentId/status
 * @access Staff Only
 */
export async function updateIncidentStatus(req, res, next) {
    try {
        const { incidentId } = req.params
        const staffUserId = getUserId(req)

        const { attachments } = req.body
        if (attachments && Array.isArray(attachments) && attachments.length > 15) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Tối đa 15 ảnh đính kèm.',
                code: 'TOO_MANY_ATTACHMENTS'
            })
        }

        const data = await staffService.updateIncidentStatus(incidentId, req.body, staffUserId)
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Cập nhật sự cố thành công.',
            data
        })
    } catch (error) { next(error) }
}

/**
 * HÀM 18: getProfile
 * TÁC DỤNG: Lấy thông tin cá nhân và ca trực của Nhân viên bảo vệ đang đăng nhập.
 * 
 * @route GET /api/staff/profile
 * @access Staff Only
 */
export async function getProfile(req, res, next) {
    try {
        const staffId = getUserId(req)
        const data = await staffService.getProfile(staffId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

/**
 * HÀM 19: getVehicleTypes
 * TÁC DỤNG: Lấy danh sách loại xe phục vụ form cho xe vào bãi tại trạm bảo vệ.
 * 
 * @route GET /api/staff/vehicle-types
 * @access Staff Only
 */
export async function getVehicleTypes(req, res, next) {
    try {
        const data = await staffService.getVehicleTypes()
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (err) {
        next(err)
    }
}

/**
 * HÀM 20: getSlotDetail
 * TÁC DỤNG: Tra cứu thông tin chi tiết một ô đỗ xe theo SlotCode (ví dụ 'A-101').
 * 
 * @route GET /api/staff/slots/:slotCode
 * @access Staff Only
 */
export async function getSlotDetail(req, res, next) {
    try {
        const { slotCode } = req.params
        const staffUserId = getUserId(req)
        const data = await staffService.getSlotDetail(slotCode, staffUserId)
        res.status(200).json({ success: true, data })
    } catch (err) {
        next(err)
    }
}

/**
 * HÀM 21: getPendingPayments
 * TÁC DỤNG: Lấy danh sách các xe đang chờ thanh toán tiền tại trạm bảo vệ.
 * 
 * @route GET /api/staff/pending-payments
 * @access Staff Only
 */
export async function getPendingPayments(req, res, next) {
    try {
        const { keyword, fromDate, toDate, vehicleTypeId } = req.query
        const staffUserId = getUserId(req)
        const data = await staffService.searchSessions({
            status: 'Pending',
            keyword,
            fromDate,
            toDate,
            vehicleTypeId
        }, staffUserId)
        res.status(200).json({ success: true, data })
    } catch (err) {
        next(err)
    }
}

/**
 * HÀM 22: getPaymentHistory
 * TÁC DỤNG: Xem lịch sử thanh toán của một tài xế theo driverId.
 * 
 * @route GET /api/staff/drivers/:driverId/payments
 * @access Staff Only
 */
export async function getPaymentHistory(req, res, next) {
    try {
        const driverId = Number(req.params.driverId)
        const data = await staffService.getPaymentHistory(driverId)
        res.status(200).json({ success: true, data })
    } catch (err) { next(err) }
}