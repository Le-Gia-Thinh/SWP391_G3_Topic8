/**
 * FILE: staffController.js
 * MÔ TẢ: Controller xử lý các chức năng tác nghiệp trực tiếp tại bãi đỗ xe dành cho Staff.
 * 
 * Chức năng:
 * - Xem Dashboard & Sơ đồ bãi đỗ (Parking Map)
 * - Cập nhật trạng thái chỗ đỗ thủ công
 * - Check-in xe (khách walk-in hoặc có đặt trước)
 * - Tra cứu phiên gửi xe & Check-out xe (bao gồm tính phí, phụ thu)
 * - Quản lý sự cố (Tạo và cập nhật sự cố tại bãi đỗ)
 * - Lịch sử thanh toán & các khoản chờ thanh toán
 * 
 * @access Staff only
 */

import { StatusCodes } from 'http-status-codes' // Mã HTTP status chuẩn
import * as staffService from '../services/staffService.js' // Service xử lý logic staff
import * as sessionService from '../services/sessionService.js'; // Service xử lý logic phiên xe


const getUserId = (req) =>
    req.user?.UserID || req.user?.userId || req.jwtDecoded?.userId

export async function getDashboard(req, res, next) {
    try {
        const data = await staffService.getDashboard()
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

export async function getParkingMap(req, res, next) {
    try {
        const data = await staffService.getParkingMap(req.query)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

export async function updateSlotStatus(req, res, next) {
    try {
        const { slotId } = req.params
        const { slotStatus } = req.body
        const data = await staffService.updateSlotStatus(slotId, slotStatus)
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Cập nhật trạng thái slot thành công.',
            data
        })
    } catch (error) {
        next(error)
    }
}

export async function checkInWalkIn(req, res, next) {
    try {
        const data = await staffService.checkInWalkIn(req.body)
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Tạo phiên gửi xe vãng lai thành công.',
            data
        })
    } catch (error) {
        next(error)
    }
}

export async function getBookings(req, res, next) {
    try {
        const data = await staffService.getBookings(req.query)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

export async function getBookingDetail(req, res, next) {
    try {
        const { reservationId } = req.params
        const data = await staffService.getBookingDetail(reservationId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

export async function checkInBooking(req, res, next) {
    try {
        const { reservationId } = req.params
        const data = await staffService.checkInBooking(reservationId)
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Check-in booking thành công.',
            data
        })
    } catch (error) {
        next(error)
    }
}

export async function searchSessions(req, res, next) {
    try {
        const data = await staffService.searchSessions(req.query)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (err) { next(err) }
}

export async function getActiveSessions(req, res, next) {
    try {
        const data = await staffService.searchSessions({
            ...req.query,
            status: 'Active'
        })
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

export async function getCheckoutPreview(req, res, next) {
    try {
        const { sessionId } = req.params
        const data = await staffService.getCheckoutPreview(sessionId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

export async function checkOutSession(req, res, next) {
    try {
        const { sessionId } = req.params
        const data = await staffService.checkOutSession(sessionId, req.body)
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Check-out thành công.',
            data
        })
    } catch (error) {
        next(error)
    }
}

export async function confirmSurcharge(req, res, next) {
    try {
        const { sessionId } = req.params
        const { paymentMethod } = req.body
        const data = await staffService.confirmSurcharge(sessionId, paymentMethod)
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Thu phụ trội thành công.',
            data
        })
    } catch (error) {
        next(error)
    }
}

export async function createIncident(req, res, next) {
    try {
        const staffId = getUserId(req)

        // Validate attachments size nếu có
        const { attachments } = req.body
        if (attachments && Array.isArray(attachments) && attachments.length > 15) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Tối đa 15 ảnh đính kèm.',
                code: 'TOO_MANY_ATTACHMENTS'
            })
        }

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

export async function getIncidents(req, res, next) {
    try {
        const data = await staffService.getIncidents(req.query)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

export async function getIncidentById(req, res, next) {
    try {
        const { incidentId } = req.params
        const data = await staffService.getIncidentById(incidentId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) { next(error) }
}

export async function updateIncidentStatus(req, res, next) {
    try {
        const { incidentId } = req.params

        // Validate attachments nếu có
        const { attachments } = req.body
        if (attachments && Array.isArray(attachments) && attachments.length > 15) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Tối đa 15 ảnh đính kèm.',
                code: 'TOO_MANY_ATTACHMENTS'
            })
        }

        const data = await staffService.updateIncidentStatus(incidentId, req.body)
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Cập nhật sự cố thành công.',
            data
        })
    } catch (error) { next(error) }
}

export async function getProfile(req, res, next) {
    try {
        const staffId = getUserId(req)
        const data = await staffService.getProfile(staffId)
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (error) {
        next(error)
    }
}

export async function getVehicleTypes(req, res, next) {
    try {
        const data = await staffService.getVehicleTypes()
        res.status(StatusCodes.OK).json({ success: true, data })
    } catch (err) {
        next(err)
    }
}

export async function getSlotDetail(req, res, next) {
    try {
        const { slotCode } = req.params
        const data = await staffService.getSlotDetail(slotCode)
        res.status(200).json({ success: true, data })
    } catch (err) {
        next(err)
    }
}
export async function getPendingPayments(req, res, next) {
    try {
        const { keyword, fromDate, toDate, vehicleTypeId } = req.query
        const data = await staffService.searchSessions({
            status: 'Pending',
            keyword,
            fromDate,
            toDate,
            vehicleTypeId
        })
        res.status(200).json({ success: true, data })
    } catch (err) {
        next(err)
    }
}
export async function getPaymentHistory(req, res, next) {
    try {
        const driverId = Number(req.params.driverId)
        const data = await staffService.getPaymentHistory(driverId)
        res.status(200).json({ success: true, data })
    } catch (err) { next(err) }
}