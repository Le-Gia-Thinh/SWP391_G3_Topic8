import express from 'express'
import * as staffController from '../controllers/staffController.js'
import { isAuthorized, isStaffOrManager } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.use(isAuthorized)
router.use(isStaffOrManager)

// Dashboard
router.get('/dashboard', staffController.getDashboard)

// Parking map / slots
router.get('/parking-map', staffController.getParkingMap)
router.patch('/slots/:slotId/status', staffController.updateSlotStatus)

// Walk-in check-in
router.post('/check-in/walk-in', staffController.checkInWalkIn)

// Booking check-in
router.get('/bookings', staffController.getBookings)
router.get('/bookings/:reservationId', staffController.getBookingDetail)
router.post('/bookings/:reservationId/check-in', staffController.checkInBooking)

// Sessions / checkout
router.get('/sessions', staffController.searchSessions)
router.get('/sessions/active', staffController.getActiveSessions)
router.get('/sessions/:sessionId/checkout-preview', staffController.getCheckoutPreview)
router.post('/sessions/:sessionId/check-out', staffController.checkOutSession)
router.post('/sessions/:sessionId/confirm-surcharge', staffController.confirmSurcharge)

// Incidents
router.post('/incidents', staffController.createIncident)
router.get('/incidents', staffController.getIncidents)

// Profile
router.get('/profile', staffController.getProfile)

export default router