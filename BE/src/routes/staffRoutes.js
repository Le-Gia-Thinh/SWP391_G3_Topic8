// src/routes/staffRoutes.js
import express from 'express'
import * as staffController from '../controllers/staffController.js'
import * as supportController from '../controllers/supportController.js'
import { isAuthorized, isStaffOrManager } from '../middlewares/authMiddleware.js'
import {
    validateStaffWalkIn,
    validateStaffBookingCheckIn,
    validateStaffCheckOut,
    validateConfirmSurcharge
} from '../utilities/authValidation.js'

const router = express.Router()

router.use(isAuthorized)
router.use(isStaffOrManager)

// Dashboard
router.get('/dashboard', staffController.getDashboard)

// Parking map / slots
router.get('/parking-map', staffController.getParkingMap)
router.patch('/slots/:slotId/status', staffController.updateSlotStatus)

// Vehicle types (cho dropdown walk-in)
router.get('/vehicle-types', staffController.getVehicleTypes)

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
router.get('/incidents/:incidentId', staffController.getIncidentById)
router.patch('/incidents/:incidentId/status', staffController.updateIncidentStatus)
// Profile
router.get('/profile', staffController.getProfile)
router.get('/slots/:slotCode', staffController.getSlotDetail)

// Support Tickets
router.get('/support/tickets', supportController.getStaffTickets)
router.get('/support/tickets/:id', supportController.getTicketDetails)
router.post('/support/tickets/:id/replies', supportController.replyTicket)
router.patch('/support/tickets/:id/status', supportController.updateTicketStatus)

//Payment confirmation
router.get('/sessions/pending-payments', staffController.getPendingPayments)
router.get('/drivers/:driverId/payment-history', staffController.getPaymentHistory)

router.post('/checkin/walkin', isAuthorized, validateStaffWalkIn, staffController.checkInWalkIn)
router.post('/checkin/booking/:reservationId', isAuthorized, validateStaffBookingCheckIn, staffController.checkInBooking)
router.post('/checkout/:sessionId', isAuthorized, validateStaffCheckOut, staffController.checkOutSession)
router.post('/sessions/:sessionId/surcharge', isAuthorized, validateConfirmSurcharge, staffController.confirmSurcharge)
export default router