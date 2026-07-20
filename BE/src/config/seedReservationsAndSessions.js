/*
Thinh
*/

import { getPool, sql } from "./db.js"; -

async function main() {
    try {
        const pool = await getPool();
        console.log("Connected to database. Initializing rich dynamic test data...");

        // 1. Get test drivers (IDs we know exist from the database query)
        const driverEmails = [
            "alice@email.com",
            "david@email.com",
            "eve@email.com",
            "an.nguyen@gmail.com",
            "binh.tran@gmail.com",
            "cuong.le@gmail.com",
            "dung.pham@gmail.com"
        ];

        const driverResult = await pool.request().query(`
            SELECT UserID, Email, FullName 
            FROM Users 
            WHERE Email IN (${driverEmails.map(e => `'${e}'`).join(",")})
        `);
        const drivers = driverResult.recordset;
        if (!drivers.length) {
            console.error("No test drivers found. Please run baseline seeds first.");
            process.exit(1);
        }
        const driverIds = drivers.map(d => d.UserID);
        console.log(`Found ${drivers.length} test drivers to seed data for.`);

        // 2. Fetch available slots for vehicles
        const slotsResult = await pool.request().query(`
            SELECT SlotID, SlotCode, VehicleTypeID 
            FROM ParkingSlots 
            WHERE SlotStatus NOT IN ('Maintenance', 'Blocked')
        `);
        const allSlots = slotsResult.recordset;
        const motorbikeSlots = allSlots.filter(s => s.VehicleTypeID === 1);
        const carSlots = allSlots.filter(s => s.VehicleTypeID === 2);

        if (motorbikeSlots.length < 5 || carSlots.length < 5) {
            console.error("Not enough active parking slots to seed detailed dataset.");
            process.exit(1);
        }

        const now = new Date();

        // 3. Clean up existing records for these target test drivers to allow clean re-seeding
        console.log("Cleaning up old test logs for the test drivers...");
        const driversListStr = driverIds.join(",");
        await pool.request().query(`
            DELETE FROM Feedbacks WHERE IncidentID IN (SELECT IncidentID FROM Incidents WHERE SessionID IN (SELECT SessionID FROM ParkingSessions WHERE DriverID IN (${driversListStr})));
            DELETE FROM Incidents WHERE SessionID IN (SELECT SessionID FROM ParkingSessions WHERE DriverID IN (${driversListStr}));
            DELETE FROM ServiceRatings WHERE SessionID IN (SELECT SessionID FROM ParkingSessions WHERE DriverID IN (${driversListStr}));
            DELETE FROM Payments WHERE SessionID IN (SELECT SessionID FROM ParkingSessions WHERE DriverID IN (${driversListStr}));
            DELETE FROM ParkingSessions WHERE DriverID IN (${driversListStr});
            DELETE FROM Reservations WHERE DriverID IN (${driversListStr});
            DELETE FROM UserSubscriptions WHERE UserID IN (${driversListStr});
            DELETE FROM DriverVehicles WHERE DriverID IN (${driversListStr});
        `);
        console.log("Cleanup finished.");

        // 4. Seed Vehicles (Must have default vehicles matching plates used for test drivers to receive VIP discounts)
        console.log("Seeding default vehicles for drivers...");
        const vehicles = [
            { driverId: 1, plate: "51A-111.11", typeId: 1, brand: "Honda SH", color: "Trang", isDefault: 1 },
            { driverId: 4, plate: "59-C1 222.22", typeId: 2, brand: "Vinfast VF8", color: "Xanh", isDefault: 1 },
            { driverId: 5, plate: "29-H1 333.33", typeId: 2, brand: "Hyundai SantaFe", color: "Den", isDefault: 1 },
            { driverId: 7, plate: "29A-11111", typeId: 1, brand: "Honda Wave", color: "Do", isDefault: 1 },
            { driverId: 8, plate: "30F-33333", typeId: 1, brand: "Yamaha Exciter", color: "Xanh", isDefault: 1 },
            { driverId: 9, plate: "29B-44444", typeId: 2, brand: "Honda City", color: "Bac", isDefault: 1 },
            { driverId: 10, plate: "51H-55555", typeId: 1, brand: "Honda Air Blade", color: "Den", isDefault: 1 }
        ];

        for (const v of vehicles) {
            await pool.request()
                .input("DriverID", sql.Int, v.driverId)
                .input("PlateNumber", sql.NVarChar(20), v.plate)
                .input("VehicleTypeID", sql.Int, v.typeId)
                .input("VehicleBrand", sql.NVarChar(100), v.brand)
                .input("VehicleColor", sql.NVarChar(50), v.color)
                .input("IsDefault", sql.Bit, v.isDefault)
                .query(`
                    INSERT INTO DriverVehicles (DriverID, PlateNumber, VehicleTypeID, VehicleBrand, VehicleColor, IsActive, IsDefault)
                    VALUES (@DriverID, @PlateNumber, @VehicleTypeID, @VehicleBrand, @VehicleColor, 1, @IsDefault)
                `);
        }

        // 5. Seed Subscriptions (Active for 30 days around current date)
        console.log("Seeding active memberships (subscriptions)...");
        const subStart = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
        const subEnd = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);  // 15 days in future
        const subscriptions = [
            { driverId: 1, planId: "basic", amount: 99000 },
            { driverId: 4, planId: "pro", amount: 199000 },
            { driverId: 5, planId: "premium", amount: 399000 },
            { driverId: 7, planId: "premium", amount: 399000 },
            { driverId: 8, planId: "pro", amount: 199000 },
            { driverId: 9, planId: "basic", amount: 99000 },
            { driverId: 10, planId: "premium", amount: 399000 }
        ];

        for (const s of subscriptions) {
            await pool.request()
                .input("UserID", sql.Int, s.driverId)
                .input("PlanID", sql.NVarChar(50), s.planId)
                .input("StartDate", sql.DateTime, subStart)
                .input("EndDate", sql.DateTime, subEnd)
                .input("AmountPaid", sql.Decimal(10, 2), s.amount)
                .query(`
                    INSERT INTO UserSubscriptions (UserID, PlanID, StartDate, EndDate, AmountPaid, Status)
                    VALUES (@UserID, @PlanID, @StartDate, @EndDate, @AmountPaid, 'Active')
                `);
        }

        let reservationsCount = 0;
        let sessionsCount = 0;
        let paymentsCount = 0;

        // Helper helper to get slot
        function getRandomSlot(vehicleTypeId) {
            const list = vehicleTypeId === 1 ? motorbikeSlots : carSlots;
            return list[Math.floor(Math.random() * list.length)];
        }

        // Helper to insert Reservation
        async function insertReservation(driverId, vehicleTypeId, slotId, date, start, end, status, plate) {
            const result = await pool.request()
                .input("DriverID", sql.Int, driverId)
                .input("VehicleTypeID", sql.Int, vehicleTypeId)
                .input("SlotID", sql.Int, slotId)
                .input("ReservationDate", sql.Date, date)
                .input("StartTime", sql.DateTime, start)
                .input("EndTime", sql.DateTime, end)
                .input("Status", sql.NVarChar(20), status)
                .input("PlateNumber", sql.NVarChar(20), plate)
                .query(`
                    INSERT INTO Reservations (DriverID, VehicleTypeID, SlotID, ReservationDate, StartTime, EndTime, ReservationStatus, PlateNumber, CreatedAt)
                    VALUES (@DriverID, @VehicleTypeID, @SlotID, @ReservationDate, @StartTime, @EndTime, @Status, @PlateNumber, DATEADD(HOUR, -2, @StartTime));
                    SELECT SCOPE_IDENTITY() AS ReservationID;
                `);
            reservationsCount++;
            return result.recordset[0].ReservationID;
        }

        // Helper to insert Parking Session
        async function insertSession(driverId, slotId, vehicleTypeId, entry, exit, status, bookingStart, plate) {
            const result = await pool.request()
                .input("DriverID", sql.Int, driverId)
                .input("SlotID", sql.Int, slotId)
                .input("VehicleTypeID", sql.Int, vehicleTypeId)
                .input("EntryTime", sql.DateTime, entry)
                .input("ExitTime", sql.DateTime, exit)
                .input("Status", sql.NVarChar(20), status)
                .input("BookingStartTime", sql.DateTime, bookingStart)
                .input("PlateNumber", sql.NVarChar(20), plate)
                .query(`
                    INSERT INTO ParkingSessions (DriverID, SlotID, PlateNumber, VehicleTypeID, EntryTime, ExitTime, SessionStatus, BookingStartTime, EarlyFeeAmount)
                    VALUES (@DriverID, @SlotID, @PlateNumber, @VehicleTypeID, @EntryTime, @ExitTime, @Status, @BookingStartTime, 0);
                    SELECT SCOPE_IDENTITY() AS SessionID;
                `);
            sessionsCount++;
            return result.recordset[0].SessionID;
        }

        // Helper to insert Payment
        async function insertPayment(sessionId, amount, method, status, time, prepaid = 0, surcharge = 0, surStatus = 'None') {
            await pool.request()
                .input("SessionID", sql.Int, sessionId)
                .input("Amount", sql.Decimal(10, 2), amount)
                .input("Method", sql.NVarChar(50), method)
                .input("Status", sql.NVarChar(20), status)
                .input("Time", sql.DateTime, time)
                .input("Prepaid", sql.Decimal(10, 2), prepaid)
                .input("Surcharge", sql.Decimal(10, 2), surcharge)
                .input("SurStatus", sql.NVarChar(20), surStatus)
                .query(`
                    INSERT INTO Payments (SessionID, Amount, PaymentMethod, PaymentStatus, PaymentTime, PrepaidAmount, SurchargeAmount, SurchargeStatus)
                    VALUES (@SessionID, @Amount, @Method, @Status, @Time, @Prepaid, @Surcharge, @SurStatus)
                `);
            paymentsCount++;
        }

        // 6. Driver vehicle profiles for consistent plate and vehicle type mapping
        const driverProfiles = {
            1: { plate: "51A-111.11", typeId: 1 },  // Alice - Basic (Motorbike)
            4: { plate: "59-C1 222.22", typeId: 2 },  // David - Pro (Car)
            5: { plate: "29-H1 333.33", typeId: 2 },  // Eve - Premium (Car)
            7: { plate: "29A-11111", typeId: 1 },     // An - Premium (Motorbike)
            8: { plate: "30F-33333", typeId: 1 },     // Binh - Pro (Motorbike)
            9: { plate: "29B-44444", typeId: 2 },     // Cuong - Basic (Car)
            10: { plate: "51H-55555", typeId: 1 }     // Dung - Premium (Motorbike)
        };

        // =========================================================================
        // CASE A: PAST COMPLETED SESSIONS (Quá khứ xa - Từ 5 đến 30 ngày trước)
        // Số lượng: ~35 bản ghi tạo doanh thu và lịch sử đỗ xe
        // =========================================================================
        console.log("Seeding past completed sessions (5 to 30 days ago)...");
        for (let i = 0; i < 35; i++) {
            const driverId = driverIds[i % driverIds.length];
            const profile = driverProfiles[driverId];
            const vType = profile.typeId;
            const plate = profile.plate;
            const slot = getRandomSlot(vType);
            
            // Random days in the past (5 to 30 days ago)
            const daysOffset = 5 + (i % 26);
            const hourOffset = 8 + (i % 12);
            
            const startTime = new Date(now.getTime() - daysOffset * 24 * 60 * 60 * 1000);
            startTime.setHours(hourOffset, 0, 0, 0);
            
            const durationHours = 2 + (i % 6); // 2 to 7 hours
            const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

            // 1. Booking
            const resId = await insertReservation(driverId, vType, slot.SlotID, startTime, startTime, endTime, "Completed", plate);
            
            // 2. Session
            const sessId = await insertSession(driverId, slot.SlotID, vType, startTime, endTime, "Completed", startTime, plate);
            
            // 3. Payment
            const basePrice = vType === 1 ? 5000 : 15000;
            const finalFee = Math.ceil(durationHours / 4) * basePrice;
            const method = (i % 3 === 0) ? "Banking" : "Cash";
            await insertPayment(sessId, finalFee, method, "Completed", endTime);
        }

        // =========================================================================
        // CASE B: RECENT COMPLETED SESSIONS (Quá khứ gần - Từ 1 đến 4 ngày trước)
        // Số lượng: ~15 bản ghi
        // =========================================================================
        console.log("Seeding recent completed sessions (1 to 4 days ago)...");
        for (let i = 0; i < 15; i++) {
            const driverId = driverIds[(i + 2) % driverIds.length];
            const profile = driverProfiles[driverId];
            const vType = profile.typeId;
            const plate = profile.plate;
            const slot = getRandomSlot(vType);

            const daysOffset = 1 + (i % 4);
            const hourOffset = 7 + (i % 14);

            const startTime = new Date(now.getTime() - daysOffset * 24 * 60 * 60 * 1000);
            startTime.setHours(hourOffset, 15, 0, 0);

            const durationHours = 1 + (i % 5);
            const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

            // Booking
            const resId = await insertReservation(driverId, vType, slot.SlotID, startTime, startTime, endTime, "Completed", plate);
            
            // Session
            const sessId = await insertSession(driverId, slot.SlotID, vType, startTime, endTime, "Completed", startTime, plate);

            // Payment
            const basePrice = vType === 1 ? 5000 : 15000;
            const finalFee = Math.ceil(durationHours / 4) * basePrice;
            const method = (i % 2 === 0) ? "Banking" : "Cash";
            await insertPayment(sessId, finalFee, method, "Completed", endTime);
        }

        // =========================================================================
        // CASE C: CURRENT ACTIVE SESSIONS (Hiện tại - Đang đỗ trong bãi xe)
        // Số lượng: 5 phiên hoạt động (Một số đã trả trước, một số chưa trả)
        // =========================================================================
        console.log("Seeding current active sessions (Present)...");
        
        // Active 1: Motorbike - Alice Driver (Prepaid 5.000đ - VIP Basic)
        const a1Start = new Date(now.getTime() - 2.5 * 60 * 60 * 1000); // 2h30m ago
        const a1End = new Date(a1Start.getTime() + 4 * 60 * 60 * 1000); // 4h duration
        const a1Plate = driverProfiles[1].plate;
        const a1ResId = await insertReservation(driverIds[0], 1, motorbikeSlots[0].SlotID, a1Start, a1Start, a1End, "Completed", a1Plate);
        const a1SessId = await insertSession(driverIds[0], motorbikeSlots[0].SlotID, 1, a1Start, null, "Active", a1Start, a1Plate);
        await insertPayment(a1SessId, 5000, "Banking", "Prepaid", null, 5000, 0, "Pending");

        // Active 2: Car - David Driver (Chưa trả tiền, đỗ được 1 tiếng - VIP Pro)
        const a2Start = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1h ago
        const a2End = new Date(a2Start.getTime() + 3 * 60 * 60 * 1000); // 3h duration
        const a2Plate = driverProfiles[4].plate;
        const a2ResId = await insertReservation(driverIds[1], 2, carSlots[0].SlotID, a2Start, a2Start, a2End, "Completed", a2Plate);
        const a2SessId = await insertSession(driverIds[1], carSlots[0].SlotID, 2, a2Start, null, "Active", a2Start, a2Plate);
        await insertPayment(a2SessId, 15000, "Cash", "Pending", null, 0, 0, "None");

        // Active 3: Motorbike - Eve Driver (Đã quá giờ đỗ - Overtime check - VIP Premium)
        const a3Start = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5h ago
        const a3End = new Date(a3Start.getTime() + 3 * 60 * 60 * 1000); // 3h duration (quá hạn 2 tiếng)
        const a3Plate = driverProfiles[5].plate;
        const a3ResId = await insertReservation(driverIds[2], 2, carSlots[1].SlotID, a3Start, a3Start, a3End, "Completed", a3Plate);
        const a3SessId = await insertSession(driverIds[2], carSlots[1].SlotID, 2, a3Start, null, "Active", a3Start, a3Plate);
        await insertPayment(a3SessId, 15000, "Banking", "Prepaid", null, 15000, 0, "Pending");

        // Active 4: Motorbike - Tran Thi Binh (Đỗ xe vãng lai nhưng có tài khoản và VIP Pro)
        const a4Start = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3h ago
        const a4Plate = driverProfiles[8].plate;
        const a4SessId = await insertSession(driverIds[4], motorbikeSlots[1].SlotID, 1, a4Start, null, "Active", null, a4Plate);
        await insertPayment(a4SessId, 5000, "Cash", "Pending", null, 0, 0, "None");

        // Active 5: Car - Nguyen Van An (Đỗ xe vãng lai nhưng có tài khoản và VIP Premium)
        const a5Start = new Date(now.getTime() - 0.5 * 60 * 60 * 1000); // 30m ago
        const a5Plate = driverProfiles[7].plate;
        const a5SessId = await insertSession(driverIds[3], carSlots[2].SlotID, 2, a5Start, null, "Active", null, a5Plate);
        await insertPayment(a5SessId, 15000, "Cash", "Pending", null, 0, 0, "None");

        // =========================================================================
        // CASE D: NEAR FUTURE RESERVATIONS (Tương lai gần - Trong vòng 8 tiếng tới)
        // Số lượng: 5 đặt chỗ (Làm chuyển trạng thái Slot thành 'Reserved')
        // =========================================================================
        console.log("Seeding near future reservations (Near Future)...");
        for (let i = 0; i < 5; i++) {
            const driverId = driverIds[i % driverIds.length];
            const profile = driverProfiles[driverId];
            const vType = profile.typeId;
            const plate = profile.plate;
            const slot = getRandomSlot(vType);

            const hourOffset = 1 + (i % 6); // 1 to 6 hours in future
            const startTime = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);
            const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);

            await insertReservation(driverId, vType, slot.SlotID, startTime, startTime, endTime, "Reserved", plate);
        }

        // =========================================================================
        // CASE E: FAR FUTURE RESERVATIONS (Tương lai xa - Từ 1 đến 7 ngày tới)
        // Số lượng: 12 đặt chỗ để test lịch hẹn sắp tới
        // =========================================================================
        console.log("Seeding far future reservations (Far Future)...");
        for (let i = 0; i < 12; i++) {
            const driverId = driverIds[(i + 3) % driverIds.length];
            const profile = driverProfiles[driverId];
            const vType = profile.typeId;
            const plate = profile.plate;
            const slot = getRandomSlot(vType);

            const daysOffset = 1 + (i % 7);
            const hourOffset = 8 + (i % 8);

            const startTime = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
            startTime.setHours(hourOffset, 0, 0, 0);
            const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000);

            await insertReservation(driverId, vType, slot.SlotID, startTime, startTime, endTime, "Reserved", plate);
        }

        // 4. Run database slot status sync
        console.log("Synchronizing Slot Statuses across database...");
        await pool.request().execute("sp_SyncParkingSlotStatuses");

        console.log("\n================ SEED SUMMARY ================");
        console.log(`Successfully seeded:`);
        console.log(`- ${reservationsCount} Reservations (Lịch đặt chỗ)`);
        console.log(`- ${sessionsCount} Parking Sessions (Phiên gửi xe)`);
        console.log(`- ${paymentsCount} Payment Records (Hóa đơn)`);
        console.log("Categories spanned: Past (5-30d), Recent Past (1-4d), Active Present, Near Future (<8h), Far Future (1-7d).");
        console.log("==============================================\n");

        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err.message);
        process.exit(1);
    }
}

main();
