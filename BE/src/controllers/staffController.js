import { StatusCodes } from 'http-status-codes'
import * as staffService from '../services/staffService.js'

const getUserId = (req) => {
    return req.user?.UserID || req.user?.userId || req.jwtDecoded?.userId
}

export async function getDashboard(req, res, next) {
    try {
        const data = await staffService.getDashboard()

        res.status(StatusCodes.OK).json({
            success: true,
            data
        })
    } catch (error) {
        next(error)
    }
}

export async function getParkingMap(req, res, next) {
    try {
        const data = await staffService.getParkingMap(req.query)

        res.status(StatusCodes.OK).json({
            success: true,
            data
        })
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

        res.status(StatusCodes.OK).json({
            success: true,
            data
        })
    } catch (error) {
        next(error)
    }
}

export async function getBookingDetail(req, res, next) {
    try {
        const { reservationId } = req.params

        const data = await staffService.getBookingDetail(reservationId)

        res.status(StatusCodes.OK).json({
            success: true,
            data
        })
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

        res.status(StatusCodes.OK).json({
            success: true,
            data
        })
    } catch (error) {
        next(error)
    }
}

export async function getActiveSessions(req, res, next) {
    try {
        const data = await staffService.searchSessions({
            ...req.query,
            status: 'Active'
        })

        res.status(StatusCodes.OK).json({
            success: true,
            data
        })
    } catch (error) {
        next(error)
    }
}

export async function getCheckoutPreview(req, res, next) {
    try {
        const { sessionId } = req.params

        const data = await staffService.getCheckoutPreview(sessionId)

        res.status(StatusCodes.OK).json({
            success: true,
            data
        })
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

        res.status(StatusCodes.OK).json({
            success: true,
            data
        })
    } catch (error) {
        next(error)
    }
}

export async function getProfile(req, res, next) {
    try {
        const staffId = getUserId(req)

        const data = await staffService.getProfile(staffId)

        res.status(StatusCodes.OK).json({
            success: true,
            data
        })
    } catch (error) {
        next(error)
    }
}