import { getPool, sql } from './src/config/db.js'
import { subscriptionService } from './src/services/subscriptionService.js'
import { createReservation } from './src/services/reservationService.js'
const { getMyStatus } = subscriptionService
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

async function run() {
    try {
        const pool = await getPool()
        console.log("Connected to DB")
        
        // 1. Find Alice
        const userRes = await pool.request().query("SELECT * FROM Users WHERE FullName = 'Alice Driver'")
        const alice = userRes.recordset[0]
        if (!alice) throw new Error("Alice not found")
        const driverId = alice.UserID
        
        console.log(`\n--- ALICE (${driverId}) ---`)
        
        // 2. Check current subscription
        const currentSub = await getMyStatus(driverId)
        console.log("Current Subscription:", currentSub ? currentSub.planName : "None")
        
        // 3. Make a booking
        // Find an available slot
        const slotRes = await pool.request().query("SELECT TOP 1 * FROM ParkingSlots WHERE SlotStatus = 'Available' AND VehicleTypeID = 1")
        const slot = slotRes.recordset[0]
        if (!slot) throw new Error("No available slot")
        
        console.log(`\n--- BOOKING SLOT ${slot.SlotCode} ---`)
        const start = new Date()
        start.setHours(start.getHours() + 1) // 1 hour from now
        const end = new Date(start)
        end.setHours(end.getHours() + 2) // 2 hours duration
        
        console.log(`Booking from ${start.toISOString()} to ${end.toISOString()} with Plate: 51A-99999`)
        
        try {
            const mockReq = {
                user: { id: driverId },
                body: {
                    vehicleTypeId: 1,
                    buildingId: 1,
                    reservationDate: start.toISOString().split('T')[0],
                    startTime: start.toISOString(),
                    endTime: end.toISOString(),
                    licensePlate: '51A-99999'
                }
            }
            
            const booking = await createReservation(mockReq)
            console.log("Booking successful! Reservation ID:", booking.ReservationID)
            
            const bookingCheck = await pool.request().query(`SELECT * FROM Reservations WHERE ReservationID = ${booking.ReservationID}`)
            console.log("Booking Details:", bookingCheck.recordset[0])
            
        } catch (err) {
            console.error("Booking failed:", err.message)
        }
        
        console.log("\n--- TEST COMPLETED ---")
        process.exit(0)
    } catch (error) {
        console.error("Test Error:", error)
        process.exit(1)
    }
}

run()
