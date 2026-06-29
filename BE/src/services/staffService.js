/**
 * FILE: staffService.js
 * MÔ TẢ: Service xử lý nghiệp vụ cho Nhân viên (Staff).
 * Chức năng: Dashboard nhân viên, Check-in khách walk-in/đặt trước, 
 * Check-out (tính phí/phụ thu), xem Sơ đồ bãi đỗ, và Tạo/Quản lý Sự cố.
 */

import { getPool, sql } from '../config/db.js'

function createHttpError(statusCode, message, code) {
    const error = new Error(message)
    error.statusCode = statusCode
    error.code = code
    return error
}

function badRequest(message, code = 'BAD_REQUEST') {
    return createHttpError(400, message, code)
}

function notFound(message, code = 'NOT_FOUND') {
    return createHttpError(404, message, code)
}

function conflict(message, code = 'CONFLICT') {
    return createHttpError(409, message, code)
}

function normalizeSlotStatus(status) {
    const map = {
        available: 'Available',
        occupied: 'Occupied',
        reserved: 'Reserved',
        maintenance: 'Maintenance',
        blocked: 'Blocked',
        trống: 'Available',
        'đã có xe': 'Occupied',
        'đã đặt': 'Reserved',
        'bảo trì': 'Maintenance',
        khóa: 'Blocked'
    }

    return map[String(status || '').toLowerCase()] || status
}

function parseReservationId(value) {
    if (!value) return null

    const text = String(value).trim()

    if (text.toUpperCase().startsWith('BK-')) {
        return Number(text.replace(/BK-/i, ''))
    }

    return Number(text)
}

function formatBookingCode(reservationId) {
    return `BK-${String(reservationId).padStart(4, '0')}`
}

function formatSessionCode(sessionId) {
    return `SS-${String(sessionId).padStart(5, '0')}`
}
function serializeAttachments(attachments) {
    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
        return null
    }
    if (attachments.length > 15) {
        throw badRequest('Tối đa 15 ảnh đính kèm.', 'TOO_MANY_ATTACHMENTS')
    }
    // Chỉ lưu string (base64 data URL), bỏ qua phần tử không hợp lệ
    const valid = attachments
        .filter(a => typeof a === 'string' && a.startsWith('data:image/'))
        .slice(0, 15)
    return valid.length > 0 ? JSON.stringify(valid) : null
}

/**
 * Parse JSON attachments từ DB, trả về mảng rỗng nếu lỗi
 */
function parseAttachments(raw) {
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}
async function getDefaultDriverId(pool) {
    const result = await pool.request().query(`
        SELECT UserID FROM Users
        WHERE Email = 'walkin.guest@system.local'
          AND IsActive = 1
    `)

    const user = result.recordset[0]

    if (!user) {
        throw notFound(
            'Không tìm thấy tài khoản Khách Vãng Lai.',
            'WALKIN_GUEST_NOT_FOUND'
        )
    }

    return user.UserID
}

async function calcParkingFee(pool, vehicleTypeId, entryTime, exitTime) {
    const request = pool.request()

    request.input('VehicleTypeID', sql.Int, Number(vehicleTypeId))
    request.input('EntryTime', sql.DateTime, entryTime)
    request.input('ExitTime', sql.DateTime, exitTime)
    request.output('Fee', sql.Decimal(10, 2))
    request.output('Breakdown', sql.NVarChar(sql.MAX))

    const result = await request.execute('sp_CalcParkingFeeV2')

    return {
        fee: Number(result.output.Fee || 0),
        breakdown: result.output.Breakdown || null
    }
}

export async function getDashboard() {
    const pool = await getPool()

    const stats = await pool.request().query(`
        SELECT
        (SELECT COUNT(*) FROM ParkingSessions WHERE SessionStatus = 'Active') AS activeSessions,
        (SELECT COUNT(*) FROM ParkingSessions WHERE CAST(EntryTime AS DATE) = CAST(GETDATE() AS DATE)) AS todayCheckIns,
        (SELECT COUNT(*) FROM ParkingSessions WHERE SessionStatus = 'Completed' AND CAST(ExitTime AS DATE) = CAST(GETDATE() AS DATE)) AS todayCheckOuts,
        (SELECT ISNULL(SUM(ISNULL(FinalAmount, Amount)), 0)
        FROM Payments
        WHERE PaymentStatus = 'Completed'
            AND CAST(ISNULL(PaymentTime, SurchargePaidAt) AS DATE) = CAST(GETDATE() AS DATE)) AS todayRevenue,
        (SELECT COUNT(*) FROM Incidents WHERE IncidentStatus IN ('Open', 'InProgress')) AS openIncidents,
        (SELECT COUNT(*) FROM Reservations WHERE ReservationStatus = 'Reserved') AS pendingBookings,
        (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Available') AS availableSlots,
        (SELECT COUNT(*) FROM ParkingSlots WHERE SlotStatus = 'Occupied') AS occupiedSlots
    `)

    const recentCheckIns = await pool.request().query(`
        SELECT TOP 8
        ps.SessionID,
        CONCAT('SS-', RIGHT('00000' + CAST(ps.SessionID AS VARCHAR(10)), 5)) AS SessionCode,
        ps.PlateNumber,
        ps.EntryTime,
        ps.SessionStatus,
        vt.VehicleName,
        vt.VehicleCode,
        sl.SlotCode,
        z.ZoneName,
        f.FloorName,
        b.BuildingName,
        ISNULL(u.FullName, N'Khách vãng lai') AS DriverName
        FROM ParkingSessions ps
        JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
        JOIN ParkingSlots sl ON ps.SlotID = sl.SlotID
        JOIN Zones z ON sl.ZoneID = z.ZoneID
        JOIN Floors f ON z.FloorID = f.FloorID
        JOIN Buildings b ON f.BuildingID = b.BuildingID
        LEFT JOIN Users u ON ps.DriverID = u.UserID
        ORDER BY ps.EntryTime DESC
    `)

    const alerts = await pool.request().query(`
        SELECT TOP 6
        IncidentID,
        IncidentType,
        IncidentStatus,
        Priority,
        Description,
        CreatedAt
        FROM Incidents
        WHERE IncidentStatus IN ('Open', 'InProgress')
        ORDER BY
        CASE Priority
            WHEN 'High' THEN 1
            WHEN 'Normal' THEN 2
            ELSE 3
        END,
        CreatedAt DESC
    `)

    return {
        stats: stats.recordset[0],
        recentCheckIns: recentCheckIns.recordset,
        alerts: alerts.recordset
    }
}



export async function updateSlotStatus(slotId, slotStatus) {
    if (!slotId) {
        throw badRequest('Thiếu SlotID.', 'SLOT_ID_REQUIRED')
    }

    const normalizedStatus = normalizeSlotStatus(slotStatus)

    if (!['Available', 'Occupied', 'Reserved', 'Maintenance', 'Blocked'].includes(normalizedStatus)) {
        throw badRequest('Trạng thái slot không hợp lệ.', 'INVALID_SLOT_STATUS')
    }

    const pool = await getPool()

    const result = await pool.request()
        .input('slotId', sql.Int, Number(slotId))
        .input('slotStatus', sql.NVarChar(20), normalizedStatus)
        .query(`
        UPDATE ParkingSlots
        SET SlotStatus = @slotStatus
        OUTPUT INSERTED.*
        WHERE SlotID = @slotId
        `)

    const slot = result.recordset[0]

    if (!slot) {
        throw notFound('Không tìm thấy slot.', 'SLOT_NOT_FOUND')
    }

    return slot
}

export async function checkInWalkIn({ driverId, plateNumber, licensePlate, vehicleTypeId, slotId }) {
    const pool = await getPool()

    const finalDriverId = driverId ? Number(driverId) : await getDefaultDriverId(pool)
    const finalPlate = plateNumber || licensePlate

    if (!finalPlate) {
        throw badRequest('Vui lòng nhập biển số xe.', 'PLATE_REQUIRED')
    }

    if (!vehicleTypeId) {
        throw badRequest('Vui lòng chọn loại phương tiện.', 'VEHICLE_TYPE_REQUIRED')
    }

    if (!slotId) {
        throw badRequest('Vui lòng chọn slot.', 'SLOT_REQUIRED')
    }

    // Chặn cùng biển số check-in 2 slot cùng lúc (so sánh sau khi chuẩn hóa: bỏ -, .)
    const plateNorm = finalPlate.trim().toUpperCase().replace(/[^0-9A-Z]/g, '')
    const activeCheck = await pool.request()
        .input('plateNorm', sql.NVarChar(20), plateNorm)
        .query(`SELECT 1 FROM ParkingSessions
                WHERE REPLACE(REPLACE(UPPER(PlateNumber), '-', ''), '.', '') = @plateNorm
                  AND SessionStatus = 'Active' AND ExitTime IS NULL`)
    if (activeCheck.recordset.length > 0) {
        throw badRequest('Xe này đang trong bãi, không thể check-in lại.', 'PLATE_ALREADY_PARKED')
    }

    const request = pool.request()

    request.input('DriverID', sql.Int, finalDriverId)
    request.input('PlateNumber', sql.NVarChar(20), finalPlate)
    request.input('VehicleTypeID', sql.Int, Number(vehicleTypeId))
    request.input('SlotID', sql.Int, Number(slotId))

    const result = await request.execute('sp_CheckInVehicle')

    const newSessionId = result.recordset?.[0]?.NewSessionID

    if (!newSessionId) {
        throw badRequest('Không tạo được phiên gửi xe.', 'CHECK_IN_FAILED')
    }

    const session = await getSessionById(newSessionId)

    return {
        sessionId: newSessionId,
        sessionCode: formatSessionCode(newSessionId),
        session
    }
}

const EARLY_CHECKIN_MIN = 60   // quá sớm nếu đến trước hơn 60 phút → cancelAndWalkIn
const LATE_CHECKIN_MIN = 60    // no-show nếu đến trễ hơn 60 phút
const GRACE_PERIOD_MIN = 15    // ân hạn 15 phút: đến sớm nhưng miễn phí
const EARLY_FEE_FLAT = 5000    // phụ phí cố định 5.000đ nếu đến sớm > 15 phút

export async function getBookings({ status, keyword, timeWindowHours, dateFrom, dateTo, vehicleTypeId }) {
    const pool = await getPool()
    const request = pool.request()

    let where = 'WHERE 1 = 1'

    if (status && status !== 'all') {
        request.input('status', sql.NVarChar(20), status)
        where += ' AND r.ReservationStatus = @status'
    }

    if (keyword) {
        request.input('keyword', sql.NVarChar(100), `%${keyword}%`)
        where += `
        AND (
            CONCAT('BK-', RIGHT('0000' + CAST(r.ReservationID AS VARCHAR(10)), 4)) LIKE @keyword
            OR u.FullName LIKE @keyword
            OR u.PhoneNumber LIKE @keyword
            OR sl.SlotCode LIKE @keyword
        )
        `
    }

    if (vehicleTypeId && vehicleTypeId !== 'all') {
        request.input('vehicleTypeId', sql.Int, Number(vehicleTypeId))
        where += ' AND r.VehicleTypeID = @vehicleTypeId'
    }

    const hours = Number(timeWindowHours)
    if (hours > 0) {
        request.input('timeWindowHours', sql.Int, hours)
        where += ` AND r.StartTime >= GETDATE() AND r.StartTime <= DATEADD(HOUR, @timeWindowHours, GETDATE())`
    }

    if (dateFrom) {
        request.input('dateFrom', sql.Date, new Date(dateFrom))
        where += ' AND CAST(r.StartTime AS DATE) >= @dateFrom'
    }

    if (dateTo) {
        request.input('dateTo', sql.Date, new Date(dateTo))
        where += ' AND CAST(r.StartTime AS DATE) <= @dateTo'
    }

    const result = await request.query(`
        SELECT TOP 200
        r.ReservationID,
        CONCAT('BK-', RIGHT('0000' + CAST(r.ReservationID AS VARCHAR(10)), 4)) AS BookingCode,
        r.DriverID,
        u.FullName AS DriverName,
        u.PhoneNumber,
        u.Email,
        r.VehicleTypeID,
        vt.VehicleName,
        vt.VehicleCode,
        r.SlotID,
        sl.SlotCode,
        sl.SlotStatus,
        z.ZoneName,
        f.FloorName,
        b.BuildingName,
        r.ReservationDate,
        r.StartTime,
        r.EndTime,
        r.ReservationStatus,
        r.CreatedAt
        FROM Reservations r
        JOIN Users u ON r.DriverID = u.UserID
        JOIN VehicleTypes vt ON r.VehicleTypeID = vt.VehicleTypeID
        LEFT JOIN ParkingSlots sl ON r.SlotID = sl.SlotID
        LEFT JOIN Zones z ON sl.ZoneID = z.ZoneID
        LEFT JOIN Floors f ON z.FloorID = f.FloorID
        LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID
        ${where}
        ORDER BY r.CreatedAt DESC
    `)

    return result.recordset
}

export async function getBookingDetail(reservationId) {
    const id = parseReservationId(reservationId)

    if (!id) {
        throw badRequest('ReservationID không hợp lệ.', 'INVALID_RESERVATION_ID')
    }

    const pool = await getPool()

    const result = await pool.request()
        .input('reservationId', sql.Int, id)
        .query(`
        SELECT
            r.ReservationID,
            CONCAT('BK-', RIGHT('0000' + CAST(r.ReservationID AS VARCHAR(10)), 4)) AS BookingCode,
            r.DriverID,
            u.FullName AS DriverName,
            u.PhoneNumber,
            u.Email,
            r.VehicleTypeID,
            vt.VehicleName,
            vt.VehicleCode,
            r.SlotID,
            sl.SlotCode,
            sl.SlotStatus,
            z.ZoneName,
            f.FloorName,
            b.BuildingName,
            r.ReservationDate,
            r.StartTime,
            r.EndTime,
            r.ReservationStatus,
            r.CreatedAt
        FROM Reservations r
        JOIN Users u ON r.DriverID = u.UserID
        JOIN VehicleTypes vt ON r.VehicleTypeID = vt.VehicleTypeID
        LEFT JOIN ParkingSlots sl ON r.SlotID = sl.SlotID
        LEFT JOIN Zones z ON sl.ZoneID = z.ZoneID
        LEFT JOIN Floors f ON z.FloorID = f.FloorID
        LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID
        WHERE r.ReservationID = @reservationId
        `)

    const booking = result.recordset[0]

    if (!booking) {
        throw notFound('Không tìm thấy booking.', 'BOOKING_NOT_FOUND')
    }

    return booking
}

export async function checkInBooking(reservationId, plateNumber) {
    const id = parseReservationId(reservationId)

    if (!id) {
        throw badRequest('ReservationID không hợp lệ.', 'INVALID_RESERVATION_ID')
    }

    const pool = await getPool()
    const transaction = new sql.Transaction(pool)

    await transaction.begin()

    let committed = false
    try {
        const bookingResult = await new sql.Request(transaction)
            .input('reservationId', sql.Int, id)
            .query(`
                SELECT r.*, sl.SlotStatus
                FROM Reservations r WITH (UPDLOCK, ROWLOCK)
                LEFT JOIN ParkingSlots sl ON r.SlotID = sl.SlotID
                WHERE r.ReservationID = @reservationId
            `)

        const booking = bookingResult.recordset[0]

        if (!booking) {
            throw notFound('Không tìm thấy booking.', 'BOOKING_NOT_FOUND')
        }

        if (booking.ReservationStatus !== 'Reserved') {
            throw conflict('Booking này không còn ở trạng thái Reserved.', 'BOOKING_NOT_RESERVED')
        }

        const now = new Date()
        const startTime = new Date(booking.StartTime)
        const endTime = new Date(booking.EndTime)
        const diffMin = Math.round((now - startTime) / 60000)

        if (diffMin < -EARLY_CHECKIN_MIN) {
            const minutesLeft = -diffMin - EARLY_CHECKIN_MIN
            const windowOpensAt = new Date(startTime.getTime() - EARLY_CHECKIN_MIN * 60000)
            const timeStr = windowOpensAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            const err = badRequest(
                `Quá sớm để check-in. Cửa sổ check-in mở lúc ${timeStr} (còn ${minutesLeft} phút nữa).`,
                'CHECKIN_TOO_EARLY'
            )
            err.data = { minutesLeft, windowOpensAt }
            throw err
        }

        if (diffMin > LATE_CHECKIN_MIN) {
            await new sql.Request(transaction)
                .input('reservationId', sql.Int, id)
                .query(`UPDATE Reservations SET ReservationStatus = 'Expired' WHERE ReservationID = @reservationId`)
            await transaction.commit()
            committed = true
            throw conflict(
                `Khách hàng không đến đúng giờ (no-show). Booking đã bị đánh dấu hết hạn.`,
                'CHECKIN_NO_SHOW'
            )
        }

        // Ranh giới: đúng 15 phút = earlyFee (tính phí), < 15 phút = grace (miễn phí)
        const earlyFee = (diffMin <= -GRACE_PERIOD_MIN) ? EARLY_FEE_FLAT : 0
        const timeStatus = diffMin <= -GRACE_PERIOD_MIN ? 'earlyfee'
            : diffMin < 0 ? 'grace'
                : diffMin <= 15 ? 'ontime' : 'late'

        if (endTime < now) {
            await new sql.Request(transaction)
                .input('reservationId', sql.Int, id)
                .query(`UPDATE Reservations SET ReservationStatus = 'Expired' WHERE ReservationID = @reservationId`)
            throw conflict('Booking đã hết hạn.', 'BOOKING_EXPIRED')
        }

        if (!booking.SlotID) {
            throw badRequest('Booking chưa có slot.', 'BOOKING_SLOT_REQUIRED')
        }

        if (!['Reserved', 'Available'].includes(booking.SlotStatus)) {
            throw conflict('Slot của booking hiện không khả dụng.', 'BOOKING_SLOT_NOT_AVAILABLE')
        }

        // ✅ Dùng biển số thực tế nếu có, fallback về BOOKING-{id}
        const finalPlate = plateNumber?.trim().toUpperCase() || `BOOKING-${id}`

        const insertSessionResult = await new sql.Request(transaction)
            .input('slotId', sql.Int, booking.SlotID)
            .input('driverId', sql.Int, booking.DriverID)
            .input('plateNumber', sql.NVarChar(20), finalPlate)
            .input('vehicleTypeId', sql.Int, booking.VehicleTypeID)
            .input('earlyFeeAmount', sql.Int, earlyFee)
            .input('bookingStartTime', sql.DateTime, startTime)
            .query(`
                INSERT INTO ParkingSessions (
                    SlotID, DriverID, PlateNumber,
                    VehicleTypeID, EntryTime, SessionStatus, EarlyFeeAmount, BookingStartTime
                )
                VALUES (
                    @slotId, @driverId, @plateNumber,
                    @vehicleTypeId, GETDATE(), 'Active', @earlyFeeAmount, @bookingStartTime
                );
                      SELECT * FROM ParkingSessions WHERE SessionID = SCOPE_IDENTITY();
            `)

        const session = insertSessionResult.recordset[0]

        await new sql.Request(transaction)
            .input('reservationId', sql.Int, id)
            .query(`
                UPDATE Reservations
                SET ReservationStatus = 'Completed'
                WHERE ReservationID = @reservationId
            `)

        await new sql.Request(transaction)
            .input('sessionId', sql.Int, session.SessionID)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM Payments WHERE SessionID = @sessionId)
                BEGIN
                    INSERT INTO Payments (SessionID, Amount, PaymentMethod, PaymentStatus)
                    VALUES (@sessionId, 0, 'Pending', 'Pending')
                END
            `)

        await transaction.commit()
        committed = true

        return {
            reservationId: id,
            bookingCode: formatBookingCode(id),
            sessionId: session.SessionID,
            sessionCode: formatSessionCode(session.SessionID),
            timeStatus,
            earlyFeeAmount: earlyFee,
            session
        }
    } catch (error) {
        if (!committed) await transaction.rollback()
        throw error
    }
}

export async function cancelAndWalkIn(reservationId, plateNumber, slotId) {
    const id = parseReservationId(reservationId)
    if (!id) throw badRequest('ReservationID không hợp lệ.', 'INVALID_RESERVATION_ID')
    if (!plateNumber?.trim()) throw badRequest('Vui lòng nhập biển số xe.', 'PLATE_REQUIRED')
    const requestedSlotId = slotId ? Number(slotId) : null

    const pool = await getPool()
    const transaction = new sql.Transaction(pool)
    await transaction.begin()

    let committed = false
    try {
        const bookingResult = await new sql.Request(transaction)
            .input('reservationId', sql.Int, id)
            .query(`
                SELECT r.*, sl.SlotStatus, sl.SlotCode, vt.VehicleName
                FROM Reservations r WITH (UPDLOCK, ROWLOCK)
                LEFT JOIN ParkingSlots sl ON r.SlotID = sl.SlotID
                LEFT JOIN VehicleTypes vt ON r.VehicleTypeID = vt.VehicleTypeID
                WHERE r.ReservationID = @reservationId
            `)

        const booking = bookingResult.recordset[0]
        if (!booking) throw notFound('Không tìm thấy booking.', 'BOOKING_NOT_FOUND')
        if (booking.ReservationStatus !== 'Reserved') {
            throw conflict('Booking này không còn ở trạng thái Reserved.', 'BOOKING_NOT_RESERVED')
        }

        const diffMin = Math.round((Date.now() - new Date(booking.StartTime).getTime()) / 60000)
        if (diffMin >= -EARLY_CHECKIN_MIN) {
            throw badRequest(
                'Booking đã trong khung giờ check-in. Vui lòng dùng check-in thường.',
                'NOT_ELIGIBLE_FOR_WALK_IN_OVERRIDE'
            )
        }

        if (!booking.VehicleTypeID) throw badRequest('Booking chưa có loại xe.', 'BOOKING_VEHICLE_TYPE_REQUIRED')

        const finalPlate = plateNumber.trim().toUpperCase()
        const plateNorm = finalPlate.replace(/[^0-9A-Z]/g, '')

        // Chặn biển số đang active (chuẩn hóa: bỏ -, .)
        const activeCheck = await new sql.Request(transaction)
            .input('plateNorm', sql.NVarChar(20), plateNorm)
            .query(`SELECT 1 FROM ParkingSessions
                    WHERE REPLACE(REPLACE(UPPER(PlateNumber), '-', ''), '.', '') = @plateNorm
                      AND SessionStatus = 'Active' AND ExitTime IS NULL`)
        if (activeCheck.recordset.length > 0) {
            throw badRequest('Xe này đang trong bãi, không thể check-in lại.', 'PLATE_ALREADY_PARKED')
        }

        // 1. Hủy booking gốc — giải phóng slot đó khỏi bảng Reservations
        await new sql.Request(transaction)
            .input('reservationId', sql.Int, id)
            .query(`UPDATE Reservations SET ReservationStatus = 'Cancelled' WHERE ReservationID = @reservationId`)

        // 2. Xác định slot sẽ dùng:
        //    - Nếu staff chọn cụ thể (requestedSlotId): validate rồi dùng
        //    - Nếu không: tự động tìm slot trống phù hợp
        const minWindow = new Date(Date.now() + EARLY_CHECKIN_MIN * 60000)
        let availableSlot

        if (requestedSlotId) {
            const checkResult = await new sql.Request(transaction)
                .input('slotId', sql.Int, requestedSlotId)
                .input('vehicleTypeId', sql.Int, booking.VehicleTypeID)
                .input('minWindow', sql.DateTime, minWindow)
                .query(`
                    SELECT sl.SlotID, sl.SlotCode, sl.VehicleTypeID, sl.SlotStatus
                    FROM ParkingSlots sl WITH (UPDLOCK, ROWLOCK)
                    WHERE sl.SlotID = @slotId
                `)
            const picked = checkResult.recordset[0]
            if (!picked) throw badRequest('Slot không tồn tại.', 'SLOT_NOT_FOUND')
            if (picked.VehicleTypeID !== booking.VehicleTypeID)
                throw badRequest('Slot không phù hợp loại xe của booking.', 'SLOT_VEHICLE_TYPE_MISMATCH')
            if (['Maintenance', 'Blocked'].includes(picked.SlotStatus))
                throw conflict('Slot đang bảo trì hoặc bị khóa.', 'SLOT_NOT_AVAILABLE')

            const conflictCheck = await new sql.Request(transaction)
                .input('slotId', sql.Int, requestedSlotId)
                .input('minWindow', sql.DateTime, minWindow)
                .query(`
                    SELECT 1 FROM ParkingSessions WHERE SlotID = @slotId AND SessionStatus = 'Active'
                    UNION ALL
                    SELECT 1 FROM Reservations WHERE SlotID = @slotId AND ReservationStatus = 'Reserved' AND StartTime < @minWindow
                `)
            if (conflictCheck.recordset.length > 0)
                throw conflict('Slot đã bị chiếm hoặc có booking sắp đến. Vui lòng chọn slot khác.', 'SLOT_CONFLICT')

            availableSlot = picked
        } else {
            const slotResult = await new sql.Request(transaction)
                .input('vehicleTypeId', sql.Int, booking.VehicleTypeID)
                .input('minWindow', sql.DateTime, minWindow)
                .query(`
                    SELECT TOP 1 sl.SlotID, sl.SlotCode
                    FROM ParkingSlots sl WITH (UPDLOCK, ROWLOCK)
                    WHERE sl.VehicleTypeID = @vehicleTypeId
                      AND sl.SlotStatus NOT IN ('Maintenance', 'Blocked')
                      AND NOT EXISTS (
                        SELECT 1 FROM ParkingSessions ps
                        WHERE ps.SlotID = sl.SlotID AND ps.SessionStatus = 'Active'
                      )
                      AND NOT EXISTS (
                        SELECT 1 FROM Reservations r
                        WHERE r.SlotID = sl.SlotID
                          AND r.ReservationStatus = 'Reserved'
                          AND r.StartTime < @minWindow
                      )
                    ORDER BY sl.SlotCode
                `)
            availableSlot = slotResult.recordset[0]
            if (!availableSlot) throw conflict('Không còn slot trống phù hợp. Bãi xe hiện đầy.', 'NO_SLOTS_AVAILABLE')
        }

        // 3. Tạo walk-in session trên slot vừa tìm được
        const insertResult = await new sql.Request(transaction)
            .input('slotId', sql.Int, availableSlot.SlotID)
            .input('driverId', sql.Int, booking.DriverID)
            .input('plateNumber', sql.NVarChar(20), finalPlate)
            .input('vehicleTypeId', sql.Int, booking.VehicleTypeID)
            .query(`
                INSERT INTO ParkingSessions (SlotID, DriverID, PlateNumber, VehicleTypeID, EntryTime, SessionStatus)
                VALUES (@slotId, @driverId, @plateNumber, @vehicleTypeId, GETDATE(), 'Active');
                SELECT * FROM ParkingSessions WHERE SessionID = SCOPE_IDENTITY();
            `)

        const session = insertResult.recordset[0]

        await new sql.Request(transaction)
            .input('sessionId', sql.Int, session.SessionID)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM Payments WHERE SessionID = @sessionId)
                BEGIN
                    INSERT INTO Payments (SessionID, Amount, PaymentMethod, PaymentStatus)
                    VALUES (@sessionId, 0, 'Pending', 'Pending')
                END
            `)

        await transaction.commit()
        committed = true

        return {
            reservationId: id,
            bookingCode: formatBookingCode(id),
            sessionId: session.SessionID,
            sessionCode: formatSessionCode(session.SessionID),
            cancelledBooking: true,
            session: { ...session, SlotCode: availableSlot.SlotCode, VehicleName: booking.VehicleName }
        }
    } catch (error) {
        if (!committed) await transaction.rollback()
        throw error
    }
}

export async function searchSessions({ keyword, status, vehicleTypeId, fromDate, toDate } = {}) {
    const pool = await getPool()

    // ── Case đặc biệt: Reserved → query bảng Reservations ──
    if (status === 'Reserved') {
        const request = pool.request()
        let where = "WHERE r.ReservationStatus = 'Reserved'"

        if (keyword) {
            request.input('keyword', sql.NVarChar(100), `%${keyword}%`)
            where += ` AND (
                u.FullName LIKE @keyword
                OR sl.SlotCode LIKE @keyword
                OR CONCAT('BK-', RIGHT('0000' + CAST(r.ReservationID AS VARCHAR(10)), 4)) LIKE @keyword
            )`
        }

        if (vehicleTypeId && vehicleTypeId !== 'all') {
            request.input('vehicleTypeId', sql.Int, Number(vehicleTypeId))
            where += ' AND r.VehicleTypeID = @vehicleTypeId'
        }

        const result = await request.query(`
            SELECT
                NULL AS SessionID,
                NULL AS SessionCode,
                r.SlotID,
                sl.SlotCode,
                z.ZoneName,
                f.FloorName,
                b.BuildingName,
                r.DriverID,
                u.FullName AS DriverName,
                u.PhoneNumber,
                NULL AS PlateNumber,
                r.VehicleTypeID,
                vt.VehicleName,
                vt.VehicleCode,
                r.StartTime AS EntryTime,
                r.EndTime AS ExitTime,
                'Reserved' AS SessionStatus,
                r.ReservationID,
                CONCAT('BK-', RIGHT('0000'+CAST(r.ReservationID AS VARCHAR(10)),4)) AS BookingCode,
                r.ReservationStatus
            FROM Reservations r
            JOIN Users u ON r.DriverID = u.UserID
            JOIN VehicleTypes vt ON r.VehicleTypeID = vt.VehicleTypeID
            LEFT JOIN ParkingSlots sl ON r.SlotID = sl.SlotID
            LEFT JOIN Zones z ON sl.ZoneID = z.ZoneID
            LEFT JOIN Floors f ON z.FloorID = f.FloorID
            LEFT JOIN Buildings b ON f.BuildingID = b.BuildingID
            ${where}
            ORDER BY r.CreatedAt DESC
        `)

        return result.recordset
    }

    // ── Case bình thường: query ParkingSessions ──
    const request = pool.request()
    let where = 'WHERE 1 = 1'

    if (keyword) {
        request.input('keyword', sql.NVarChar(100), `%${keyword}%`)
        where += `
        AND (
            CONCAT('SS-', RIGHT('00000' + CAST(ps.SessionID AS VARCHAR(10)), 5)) LIKE @keyword
            OR ps.PlateNumber LIKE @keyword
            OR u.FullName LIKE @keyword
            OR sl.SlotCode LIKE @keyword
        )`
    }

    if (status && status !== 'all') {
        request.input('status', sql.NVarChar(20), status)
        where += ' AND ps.SessionStatus = @status'
    }

    if (vehicleTypeId && vehicleTypeId !== 'all') {
        request.input('vehicleTypeId', sql.Int, Number(vehicleTypeId))
        where += ' AND ps.VehicleTypeID = @vehicleTypeId'
    }

    if (fromDate) {
        request.input('fromDate', sql.DateTime, new Date(fromDate))
        where += ' AND ps.EntryTime >= @fromDate'
    }

    if (toDate) {
        request.input('toDate', sql.DateTime, new Date(toDate))
        where += ' AND ps.EntryTime <= @toDate'
    }

    const result = await request.query(`
        SELECT TOP 200
        ps.SessionID,
        CONCAT('SS-', RIGHT('00000' + CAST(ps.SessionID AS VARCHAR(10)), 5)) AS SessionCode,
        ps.SlotID,
        sl.SlotCode,
        z.ZoneName,
        f.FloorName,
        b.BuildingName,
        ps.DriverID,
        ISNULL(u.FullName, N'Khách vãng lai') AS DriverName,
        u.PhoneNumber,
        ps.PlateNumber,
        ps.VehicleTypeID,
        vt.VehicleName,
        vt.VehicleCode,
        ps.EntryTime,
        ps.ExitTime,
        ps.SessionStatus,
        p.PaymentID,
        p.Amount,
        p.FinalAmount,
        p.PrepaidAmount,
        p.SurchargeAmount,
        p.PaymentMethod,
        p.PaymentStatus,
        p.SurchargeStatus
        FROM ParkingSessions ps
        LEFT JOIN Users u ON ps.DriverID = u.UserID
        JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
        JOIN ParkingSlots sl ON ps.SlotID = sl.SlotID
        JOIN Zones z ON sl.ZoneID = z.ZoneID
        JOIN Floors f ON z.FloorID = f.FloorID
        JOIN Buildings b ON f.BuildingID = b.BuildingID
        LEFT JOIN Payments p ON ps.SessionID = p.SessionID
        ${where}
        ORDER BY ps.EntryTime DESC
    `)

    return result.recordset
}

async function getSessionById(sessionId) {
    const pool = await getPool()
    const result = await pool.request()
        .input('sessionId', sql.Int, Number(sessionId))
        .query(`
            SELECT TOP 1
                ps.SessionID,
                CONCAT('SS-', RIGHT('00000' + CAST(ps.SessionID AS VARCHAR(10)), 5)) AS SessionCode,
                ps.SlotID, sl.SlotCode,
                z.ZoneName, f.FloorName, b.BuildingName,
                ps.DriverID, ISNULL(u.FullName, N'Khách vãng lai') AS DriverName, u.PhoneNumber,
                ps.PlateNumber, ps.VehicleTypeID, vt.VehicleName, vt.VehicleCode,
                ps.EntryTime, ps.ExitTime, ps.SessionStatus,
                p.PaymentID, p.Amount, p.FinalAmount, p.PrepaidAmount,
                p.SurchargeAmount, p.PaymentMethod, p.PaymentStatus, p.SurchargeStatus
            FROM ParkingSessions ps
            LEFT JOIN Users u    ON ps.DriverID      = u.UserID
            JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
            JOIN ParkingSlots sl ON ps.SlotID        = sl.SlotID
            JOIN Zones z         ON sl.ZoneID        = z.ZoneID
            JOIN Floors f        ON z.FloorID        = f.FloorID
            JOIN Buildings b     ON f.BuildingID     = b.BuildingID
            LEFT JOIN Payments p ON ps.SessionID     = p.SessionID
            WHERE ps.SessionID = @sessionId
        `)
    return result.recordset[0] || null
}

export async function getCheckoutPreview(sessionId) {
    if (!sessionId) {
        throw badRequest('Thiếu SessionID.', 'SESSION_ID_REQUIRED')
    }

    const pool = await getPool()

    const result = await pool.request()
        .input('sessionId', sql.Int, Number(sessionId))
        .query(`
        SELECT
            ps.SessionID,
            CONCAT('SS-', RIGHT('00000' + CAST(ps.SessionID AS VARCHAR(10)), 5)) AS SessionCode,
            ps.SlotID,
            sl.SlotCode,
            z.ZoneName,
            f.FloorName,
            b.BuildingName,
            ps.DriverID,
            ISNULL(u.FullName, N'Khách vãng lai') AS DriverName,
            ps.PlateNumber,
            ps.VehicleTypeID,
            vt.VehicleName,
            vt.VehicleCode,
            ps.EntryTime,
            ps.ExitTime,
            ps.SessionStatus,
            ps.EarlyFeeAmount,
            ps.BookingStartTime,
            p.PaymentID,
            p.Amount,
            p.PrepaidAmount,
            p.PaymentStatus,
            p.SurchargeStatus
        FROM ParkingSessions ps
        LEFT JOIN Users u ON ps.DriverID = u.UserID
        JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
        JOIN ParkingSlots sl ON ps.SlotID = sl.SlotID
        JOIN Zones z ON sl.ZoneID = z.ZoneID
        JOIN Floors f ON z.FloorID = f.FloorID
        JOIN Buildings b ON f.BuildingID = b.BuildingID
        LEFT JOIN Payments p ON ps.SessionID = p.SessionID
        WHERE ps.SessionID = @sessionId
        `)

    const session = result.recordset[0]

    if (!session) {
        throw notFound('Không tìm thấy phiên gửi xe.', 'SESSION_NOT_FOUND')
    }

    if (session.SessionStatus !== 'Active') {
        throw conflict('Phiên này không còn Active.', 'SESSION_NOT_ACTIVE')
    }

    const now = new Date()
    const entry = new Date(session.EntryTime)
    const durationH = Math.max(0.01, (now.getTime() - entry.getTime()) / 1000 / 60 / 60)
    const durationMin = Math.floor((now.getTime() - entry.getTime()) / 60000)

    // ← sửa chỗ này: dùng entry/now thật thay vì chỉ truyền durationH
    const { fee, breakdown } = await calcParkingFee(pool, session.VehicleTypeID, entry, now)
    const earlyFeeAmount = Number(session.EarlyFeeAmount || 0)
    const bookingStart = session.BookingStartTime ? new Date(session.BookingStartTime) : null
    // Vào sớm nhưng ra sớm: ra trước giờ booking AND đỗ dưới 30 phút → miễn phụ phí đến sớm
    const isEarlyExit = !!(bookingStart && now < bookingStart && durationMin < 30 && earlyFeeAmount > 0)
    const effectiveEarlyFee = isEarlyExit ? 0 : earlyFeeAmount
    const totalFee = fee + effectiveEarlyFee
    const prepaidAmount = Number(session.PrepaidAmount || 0)

    return {
        session,
        checkoutTime: now,
        durationH,
        durationMin,
        parkingFee: fee,
        earlyFeeAmount: effectiveEarlyFee,
        isEarlyExit,
        estimatedFee: totalFee,
        feeBreakdown: breakdown,
        prepaidAmount,
        surchargeAmount: Math.max(0, totalFee - prepaidAmount)
    }
}

export async function checkOutSession(sessionId, { paymentMethod = 'Cash', confirmedPlate = true }) {
    if (!sessionId) {
        throw badRequest('Thiếu SessionID.', 'SESSION_ID_REQUIRED')
    }

    if (confirmedPlate === false) {
        throw badRequest('Cần xác nhận biển số trước khi check-out.', 'PLATE_CONFIRM_REQUIRED')
    }

    const pool = await getPool()

    // Đọc EarlyFeeAmount và BookingStartTime để kiểm tra "vào sớm ra sớm"
    const sessionRow = await pool.request()
        .input('SessionID', sql.Int, Number(sessionId))
        .query(`SELECT EarlyFeeAmount, BookingStartTime, EntryTime FROM ParkingSessions WHERE SessionID = @SessionID`)
    const row = sessionRow.recordset[0]
    const rawEarlyFee = Number(row?.EarlyFeeAmount || 0)
    const now = new Date()
    const bookingStart = row?.BookingStartTime ? new Date(row.BookingStartTime) : null
    const entryTime = row?.EntryTime ? new Date(row.EntryTime) : null
    const durationMin = entryTime ? Math.floor((now - entryTime) / 60000) : 999
    // Khách ra trước giờ booking và đỗ < 30 phút → miễn phụ phí đến sớm
    const isEarlyExit = !!(bookingStart && now < bookingStart && durationMin < 30 && rawEarlyFee > 0)
    const earlyFeeAmount = isEarlyExit ? 0 : rawEarlyFee

    const request = pool.request()
    request.input('SessionID', sql.Int, Number(sessionId))
    request.input('PaymentMethod', sql.NVarChar(50), paymentMethod)

    let checkoutResult
    try {
        const result = await request.execute('sp_CheckOutWithSurcharge')
        checkoutResult = result.recordset[0]
    } catch (error) {
        const fallback = pool.request()
        fallback.input('SessionID', sql.Int, Number(sessionId))
        fallback.input('PaymentMethod', sql.NVarChar(50), paymentMethod)
        const result = await fallback.execute('sp_CheckOutVehicle')
        checkoutResult = {
            sessionId: Number(sessionId),
            paymentMethod,
            fallbackProcedure: 'sp_CheckOutVehicle',
            result: result.recordset?.[0] || null
        }
    }

    // Cộng phụ phí đến sớm vào FinalAmount nếu có
    if (earlyFeeAmount > 0) {
        await pool.request()
            .input('SessionID', sql.Int, Number(sessionId))
            .input('EarlyFee', sql.Int, earlyFeeAmount)
            .query(`
                UPDATE Payments
                SET FinalAmount = ISNULL(FinalAmount, Amount) + @EarlyFee,
                    SurchargeAmount = ISNULL(SurchargeAmount, 0) + @EarlyFee
                WHERE SessionID = @SessionID
            `)
        if (checkoutResult) {
            checkoutResult.earlyFeeAmount = earlyFeeAmount
            if (checkoutResult.FinalAmount != null) checkoutResult.FinalAmount += earlyFeeAmount
            if (checkoutResult.SurchargeAmount != null) checkoutResult.SurchargeAmount += earlyFeeAmount
        }
    }

    return checkoutResult
}

export async function confirmSurcharge(sessionId, paymentMethod = 'Cash') {
    const pool = await getPool()

    const request = pool.request()
    request.input('SessionID', sql.Int, Number(sessionId))
    request.input('PaymentMethod', sql.NVarChar(50), paymentMethod)

    const result = await request.execute('sp_ConfirmSurcharge')

    return result.recordset[0]
}


// ─── Incidents ─────────────────────────────────────────────────────────────────

export async function createIncident({
    sessionId, driverId, plateNumber,
    incidentType, priority, description, staffId,
    attachments  // ← NEW: mảng base64 strings
}) {
    if (!incidentType) throw badRequest('Vui lòng chọn loại sự cố.', 'INCIDENT_TYPE_REQUIRED')
    if (!description || description.trim().length < 20) {
        throw badRequest('Mô tả phải có ít nhất 20 ký tự.', 'DESCRIPTION_TOO_SHORT')
    }

    const attachmentsJson = serializeAttachments(attachments)

    const pool = await getPool()
    let finalDriverId = driverId ? Number(driverId) : null
    let finalSessionId = sessionId ? Number(sessionId) : null

    if (!finalDriverId && finalSessionId) {
        const r = await pool.request()
            .input('sessionId', sql.Int, finalSessionId)
            .query(`SELECT DriverID FROM ParkingSessions WHERE SessionID = @sessionId`)
        if (r.recordset[0]) finalDriverId = r.recordset[0].DriverID
    }

    if (!finalDriverId && plateNumber) {
        const r = await pool.request()
            .input('plate', sql.NVarChar(20), plateNumber.trim().toUpperCase())
            .query(`
                SELECT TOP 1 DriverID, SessionID FROM ParkingSessions
                WHERE PlateNumber = @plate AND SessionStatus = 'Active'
                ORDER BY EntryTime DESC
            `)
        if (r.recordset[0]) {
            finalDriverId = r.recordset[0].DriverID
            if (!finalSessionId) finalSessionId = r.recordset[0].SessionID
        }
    }

    if (!finalDriverId) {
        finalDriverId = await getDefaultDriverId(pool)
    }

    const result = await pool.request()
        .input('sessionId', sql.Int, finalSessionId)
        .input('driverId', sql.Int, finalDriverId)
        .input('incidentType', sql.NVarChar(50), incidentType)
        .input('priority', sql.NVarChar(20), priority || 'Normal')
        .input('description', sql.NVarChar(500), description.trim())
        .input('staffId', sql.Int, staffId || null)
        .input('attachments', sql.NVarChar(sql.MAX), attachmentsJson)
        .query(`
            INSERT INTO Incidents (
                SessionID, DriverID, IncidentType, IncidentStatus,
                Priority, Description, AssignedStaffID, Attachments, CreatedAt, UpdatedAt
            )
            OUTPUT INSERTED.*
            VALUES (
                @sessionId, @driverId, @incidentType, 'Open',
                @priority, @description, @staffId, @attachments, GETDATE(), GETDATE()
            )
        `)

    const row = result.recordset[0]
    return {
        ...row,
        Attachments: parseAttachments(row.Attachments)
    }
}

export async function getIncidents({ status, priority, keyword, fromDate, toDate } = {}) {
    const pool = await getPool()
    const request = pool.request()

    let where = 'WHERE 1 = 1'

    if (status && status !== 'all') {
        request.input('status', sql.NVarChar(20), status)
        where += ' AND i.IncidentStatus = @status'
    }
    if (priority && priority !== 'all') {
        request.input('priority', sql.NVarChar(20), priority)
        where += ' AND i.Priority = @priority'
    }
    if (keyword) {
        request.input('keyword', sql.NVarChar(100), `%${keyword}%`)
        where += ` AND (
            CAST(i.IncidentID AS NVARCHAR) LIKE @keyword
            OR i.IncidentType LIKE @keyword
            OR u.FullName LIKE @keyword
            OR ps.PlateNumber LIKE @keyword
        )`
    }
    if (fromDate) {
        request.input('fromDate', sql.DateTime, new Date(fromDate))
        where += ' AND i.CreatedAt >= @fromDate'
    }
    if (toDate) {
        // Đến cuối ngày
        const to = new Date(toDate)
        to.setHours(23, 59, 59, 999)
        request.input('toDate', sql.DateTime, to)
        where += ' AND i.CreatedAt <= @toDate'
    }

    const result = await request.query(`
        SELECT TOP 200
            i.IncidentID,
            i.SessionID,
            CASE WHEN i.SessionID IS NOT NULL
                 THEN CONCAT('SS-', RIGHT('00000' + CAST(i.SessionID AS VARCHAR(10)), 5))
                 ELSE NULL
            END AS SessionCode,
            i.DriverID,
            ISNULL(u.FullName, N'Khách vãng lai') AS DriverName,
            ps.PlateNumber,
            i.IncidentType,
            i.IncidentStatus,
            i.Priority,
            i.Description,
            i.Attachments,
            i.AssignedStaffID,
            staff.FullName AS AssignedStaffName,
            i.CreatedAt,
            i.UpdatedAt
        FROM Incidents i
        LEFT JOIN Users u ON i.DriverID = u.UserID
        LEFT JOIN ParkingSessions ps ON i.SessionID = ps.SessionID
        LEFT JOIN Users staff ON i.AssignedStaffID = staff.UserID
        ${where}
        ORDER BY i.CreatedAt DESC
    `)

    return result.recordset.map(row => ({
        ...row,
        Attachments: parseAttachments(row.Attachments)
    }))
}

export async function getIncidentById(incidentId) {
    if (!incidentId) throw badRequest('Thiếu IncidentID.', 'INCIDENT_ID_REQUIRED')

    const pool = await getPool()
    const result = await pool.request()
        .input('id', sql.Int, Number(incidentId))
        .query(`
            SELECT
                i.IncidentID,
                i.SessionID,
                CONCAT('SS-', RIGHT('00000' + CAST(i.SessionID AS VARCHAR(10)), 5)) AS SessionCode,
                i.DriverID,
                ISNULL(u.FullName, N'Khách vãng lai') AS DriverName,
                u.PhoneNumber AS DriverPhone,
                ps.PlateNumber,
                i.IncidentType, i.IncidentStatus, i.Priority,
                i.Description,
                i.Attachments,
                i.AssignedStaffID,
                staff.FullName AS AssignedStaffName,
                i.CreatedAt, i.UpdatedAt
            FROM Incidents i
            LEFT JOIN Users u ON i.DriverID = u.UserID
            LEFT JOIN ParkingSessions ps ON i.SessionID = ps.SessionID
            LEFT JOIN Users staff ON i.AssignedStaffID = staff.UserID
            WHERE i.IncidentID = @id
        `)

    const incident = result.recordset[0]
    if (!incident) throw notFound('Không tìm thấy sự cố.', 'INCIDENT_NOT_FOUND')

    return {
        ...incident,
        Attachments: parseAttachments(incident.Attachments)
    }
}

export async function updateIncidentStatus(incidentId, { status, note, attachments }) {
    if (!incidentId) throw badRequest('Thiếu IncidentID.', 'INCIDENT_ID_REQUIRED')

    const validStatuses = ['Open', 'InProgress', 'Resolved']
    if (!validStatuses.includes(status)) {
        throw badRequest('Trạng thái không hợp lệ.', 'INVALID_STATUS')
    }

    // attachments: nếu truyền lên thì thay toàn bộ; nếu không truyền (undefined) thì giữ nguyên
    const hasNewAttachments = Array.isArray(attachments)
    const attachmentsJson = hasNewAttachments ? serializeAttachments(attachments) : undefined

    const pool = await getPool()
    const request = pool.request()
        .input('id', sql.Int, Number(incidentId))
        .input('status', sql.NVarChar(20), status)
        .input('note', sql.NVarChar(500), note || null)

    let attachmentClause = ''
    if (hasNewAttachments) {
        request.input('attachments', sql.NVarChar(sql.MAX), attachmentsJson)
        attachmentClause = ', Attachments = @attachments'
    }

    const result = await request.query(`
        UPDATE Incidents
        SET IncidentStatus = @status,
            Description = CASE WHEN @note IS NOT NULL
                THEN Description + CHAR(10) + '[Cập nhật] ' + @note
                ELSE Description END
            ${attachmentClause},
            UpdatedAt = GETDATE()
        OUTPUT INSERTED.*
        WHERE IncidentID = @id
    `)

    const incident = result.recordset[0]
    if (!incident) throw notFound('Không tìm thấy sự cố.', 'INCIDENT_NOT_FOUND')

    if (status === 'Resolved' && incident.DriverID) {
        await request.query(`
            INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType, IsRead, CreatedAt)
            VALUES (
                ${incident.DriverID},
                N'Sự cố đã được giải quyết',
                N'Sự cố (ID: ${incident.IncidentID}) của bạn đã được đánh dấu là giải quyết.',
                'Incident',
                ${incident.IncidentID},
                'Incident',
                0,
                GETDATE()
            )
        `);
    }

    return {
        ...incident,
        Attachments: parseAttachments(incident.Attachments)
    }
}

export async function getProfile(staffId) {
    if (!staffId) {
        throw badRequest('Không xác định được staff hiện tại.', 'STAFF_ID_REQUIRED')
    }

    const pool = await getPool()

    const userResult = await pool.request()
        .input('staffId', sql.Int, Number(staffId))
        .query(`
        SELECT
            u.UserID,
            u.FullName,
            u.Email,
            u.PhoneNumber,
            u.AvatarUrl,
            u.IsActive,
            r.RoleName
        FROM Users u
        JOIN Roles r ON u.RoleID = r.RoleID
        WHERE u.UserID = @staffId
        `)

    const user = userResult.recordset[0]

    if (!user) {
        throw notFound('Không tìm thấy staff.', 'STAFF_NOT_FOUND')
    }

    const statsResult = await pool.request()
        .input('staffId', sql.Int, Number(staffId))
        .query(`
        SELECT
            (SELECT COUNT(*) FROM Incidents WHERE AssignedStaffID = @staffId) AS assignedIncidents,
            (SELECT COUNT(*) FROM Incidents WHERE AssignedStaffID = @staffId AND IncidentStatus = 'Resolved') AS resolvedIncidents,
            (SELECT COUNT(*) FROM Incidents WHERE AssignedStaffID = @staffId AND IncidentStatus IN ('Open','InProgress')) AS openIncidents
        `)

    return {
        user,
        stats: statsResult.recordset[0]
    }
}
export async function getVehicleTypes() {
    const pool = await getPool()
    const result = await pool.request().query(`
    SELECT VehicleTypeID, VehicleCode, VehicleName, Description
    FROM VehicleTypes
    WHERE IsActive = 1
    ORDER BY VehicleTypeID
  `)
    return result.recordset
}
export async function getParkingMap({ buildingId, floorId, vehicleTypeId, status } = {}) {
    const pool = await getPool()

    const result = await pool.request()
        .input('BuildingID', sql.Int, buildingId || null)
        .input('FloorID', sql.Int, floorId || null)
        .input('VehicleTypeID', sql.Int, vehicleTypeId || null)
        .query(`
            SELECT 
                ps.SlotID,
                ps.SlotCode,
                ps.VehicleTypeID,
                ps.ZoneID,
                z.ZoneName,
                f.FloorID,
                f.FloorName,
                b.BuildingID,
                b.BuildingName,
                CASE 
                    WHEN ps.SlotStatus IN ('Maintenance','Blocked') THEN ps.SlotStatus
                    WHEN EXISTS (
                        SELECT 1 FROM ParkingSessions s
                        WHERE s.SlotID = ps.SlotID AND s.SessionStatus = 'Active'
                    ) THEN 'Occupied'
                    WHEN EXISTS (
                        SELECT 1 FROM Reservations r
                        WHERE r.SlotID = ps.SlotID AND r.ReservationStatus = 'Reserved'
                        AND r.StartTime <= DATEADD(HOUR, 8, GETDATE())
                    ) THEN 'Reserved'
                    ELSE 'Available'
                END AS SlotStatus,
                sess.SessionID,
                rsv.ReservationID
            FROM ParkingSlots ps
            JOIN Zones z ON ps.ZoneID = z.ZoneID
            JOIN Floors f ON z.FloorID = f.FloorID
            JOIN Buildings b ON f.BuildingID = b.BuildingID
            LEFT JOIN ParkingSessions sess
                ON sess.SlotID = ps.SlotID AND sess.SessionStatus = 'Active'
            LEFT JOIN Reservations rsv
                ON rsv.SlotID = ps.SlotID AND rsv.ReservationStatus = 'Reserved'
                AND rsv.StartTime <= DATEADD(HOUR, 8, GETDATE())
            WHERE f.IsActive = 1
              AND (@BuildingID IS NULL OR f.BuildingID = @BuildingID)
              AND (@FloorID IS NULL OR z.FloorID = @FloorID)
              AND (@VehicleTypeID IS NULL OR ps.VehicleTypeID = @VehicleTypeID)
            ORDER BY z.ZoneID, ps.SlotCode
        `)

    return result.recordset  // flat array
}
export async function getSlotDetail(slotCode) {
    const pool = await getPool();

    // Lấy slot info + active session (ưu tiên Active session)
    const result = await pool.request()
        .input('SlotCode', sql.NVarChar(20), slotCode)
        .query(`
            SELECT 
                ps.SlotID,
                ps.SlotCode,
                ps.SlotStatus,
                -- Active Session Info
                s.SessionID,
                CASE WHEN s.SessionID IS NOT NULL 
                     THEN CONCAT('SS-', RIGHT('00000' + CAST(s.SessionID AS VARCHAR(10)), 5))
                     ELSE NULL 
                END AS SessionCode,
                s.EntryTime,
                s.ExitTime,
                s.PlateNumber,
                -- Reservation Info (nếu không có active session)
                r.ReservationID,
                r.StartTime,
                r.EndTime,
                r.ReservationStatus,
                CASE WHEN r.ReservationID IS NOT NULL 
                     THEN CONCAT('BK-', RIGHT('0000' + CAST(r.ReservationID AS VARCHAR(10)), 4))
                     ELSE NULL 
                END AS BookingCode,
                -- Driver Info (từ session nếu có, else từ reservation)
                u.FullName AS DriverName,
                u.Email AS DriverEmail,
                u.PhoneNumber AS DriverPhone,
                -- Payment Info (từ active session)
                p.PaymentID,
                p.PaymentStatus,
                p.Amount,
                p.FinalAmount,
                p.PrepaidAmount,
                p.SurchargeAmount,
                p.PaymentMethod
            FROM ParkingSlots ps
            LEFT JOIN ParkingSessions s 
                ON s.SlotID = ps.SlotID 
                AND s.SessionStatus = 'Active'
            LEFT JOIN Reservations r 
                ON r.SlotID = ps.SlotID 
                AND r.ReservationStatus = 'Reserved'
                AND r.StartTime <= DATEADD(HOUR, 8, GETDATE())
                AND s.SessionID IS NULL  -- Chỉ lấy reservation khi không có active session
            LEFT JOIN Users u 
                ON u.UserID = COALESCE(s.DriverID, r.DriverID)
            LEFT JOIN Payments p 
                ON p.SessionID = s.SessionID
            WHERE ps.SlotCode = @SlotCode
        `);

    const slotDetail = result.recordset[0];

    if (!slotDetail) {
        return null;
    }

    // Format response - để frontend dễ handle
    return {
        slotId: slotDetail.SlotID,
        slotCode: slotDetail.SlotCode,
        slotStatus: slotDetail.SlotStatus,

        // Session data (nếu có active session)
        sessionId: slotDetail.SessionID,
        sessionCode: slotDetail.SessionCode,
        entryTime: slotDetail.EntryTime,
        exitTime: slotDetail.ExitTime,
        plateNumber: slotDetail.PlateNumber,

        // Reservation data (nếu không có session)
        reservationId: slotDetail.ReservationID,
        bookingCode: slotDetail.BookingCode,
        startTime: slotDetail.StartTime,
        endTime: slotDetail.EndTime,
        reservationStatus: slotDetail.ReservationStatus,

        // Driver info
        driverName: slotDetail.DriverName || (slotDetail.SessionID ? 'Khách vãng lai' : null),
        driverEmail: slotDetail.DriverEmail,
        driverPhone: slotDetail.DriverPhone,

        // Payment info
        paymentId: slotDetail.PaymentID,
        paymentStatus: slotDetail.PaymentStatus,
        amount: slotDetail.Amount,
        finalAmount: slotDetail.FinalAmount,
        prepaidAmount: slotDetail.PrepaidAmount,
        surchargeAmount: slotDetail.SurchargeAmount,
        paymentMethod: slotDetail.PaymentMethod,

        // Để frontend biết đây là session hay reservation
        type: slotDetail.SessionID ? 'session' : (slotDetail.ReservationID ? 'reservation' : null)
    };
}
export async function getPaymentHistory(driverId) {
    const pool = await getPool()
    const result = await pool.request()
        .input('DriverID', sql.Int, driverId)
        .input('Limit', sql.Int, 50)
        .input('Offset', sql.Int, 0)
        .execute('sp_GetPaymentHistory')
    return result.recordset
}