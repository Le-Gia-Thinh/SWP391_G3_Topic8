/**
 * FILE: slotSyncService.js
 * MÔ TẢ: Service đồng bộ trạng thái Vị trí đỗ xe (Parking Slots) và xử lý tự động đỗ lố giờ.
 * Chức năng: Cập nhật trạng thái Slot và tự động hóa cảnh báo/điều hướng vị trí đỗ thông minh.
 */

import { getPool, sql } from "../config/db.js";

let backgroundSyncRunning = false;
let syncInterval = null;

export async function syncParkingSlotStatuses(existingPool = null) {
  const pool = existingPool || await getPool();
  await pool.request().execute("sp_SyncParkingSlotStatuses");
}

export async function runSmartParkingProactiveWorker(pool) {
  try {
    // 1. Pre-overtime Alert (cảnh báo trước 15 phút)
    const preAlertResult = await pool.request().query(`
      SELECT 
          ps.SessionID,
          ps.DriverID,
          sl.SlotCode,
          r.EndTime
      FROM ParkingSessions ps
      JOIN ParkingSlots sl ON ps.SlotID = sl.SlotID
      JOIN Reservations r ON r.DriverID = ps.DriverID AND r.SlotID = ps.SlotID AND r.StartTime = ps.BookingStartTime AND r.ReservationStatus = 'Completed'
      WHERE ps.SessionStatus = 'Active'
        AND ps.ExitTime IS NULL
        AND r.EndTime BETWEEN DATEADD(MINUTE, 13, GETDATE()) AND DATEADD(MINUTE, 17, GETDATE())
        AND NOT EXISTS (
            SELECT 1 FROM Notifications n
            WHERE n.UserID = ps.DriverID
              AND n.NotificationType = 'System'
              AND n.ReferenceID = ps.SessionID
              AND n.Title = N'Cảnh báo sắp hết giờ đỗ xe'
        )
    `);

    for (const session of preAlertResult.recordset) {
      const endTimeStr = new Date(session.EndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const message = `Thời gian đặt chỗ của bạn tại vị trí ${session.SlotCode} sẽ hết hạn vào lúc ${endTimeStr}. Vui lòng di chuyển xe.`;
      await pool.request()
        .input("UserID", sql.Int, session.DriverID)
        .input("ReferenceID", sql.Int, session.SessionID)
        .input("Message", sql.NVarChar(500), message)
        .query(`
          INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType, IsRead, CreatedAt)
          VALUES (@UserID, N'Cảnh báo sắp hết giờ đỗ xe', @Message, 'System', @ReferenceID, 'Session', 0, GETDATE())
        `);
      console.log(`[Smart Parking] Sent pre-overtime alert to Driver ID ${session.DriverID} for Slot ${session.SlotCode}`);
    }

    // 2. Overtime Alert (cảnh báo khi vừa lố giờ)
    const overtimeAlertResult = await pool.request().query(`
      SELECT 
          ps.SessionID,
          ps.DriverID,
          sl.SlotCode,
          r.EndTime
      FROM ParkingSessions ps
      JOIN ParkingSlots sl ON ps.SlotID = sl.SlotID
      JOIN Reservations r ON r.DriverID = ps.DriverID AND r.SlotID = ps.SlotID AND r.StartTime = ps.BookingStartTime AND r.ReservationStatus = 'Completed'
      WHERE ps.SessionStatus = 'Active'
        AND ps.ExitTime IS NULL
        AND r.EndTime <= GETDATE()
        AND NOT EXISTS (
            SELECT 1 FROM Notifications n
            WHERE n.UserID = ps.DriverID
              AND n.NotificationType = 'System'
              AND n.ReferenceID = ps.SessionID
              AND n.Title = N'Cảnh báo đỗ quá giờ'
        )
    `);

    for (const session of overtimeAlertResult.recordset) {
      const message = `Bạn đã quá giờ đặt chỗ tại vị trí ${session.SlotCode}. Phí phạt quá giờ đã bắt đầu được tính và vị trí này đã có người đặt tiếp theo.`;
      await pool.request()
        .input("UserID", sql.Int, session.DriverID)
        .input("ReferenceID", sql.Int, session.SessionID)
        .input("Message", sql.NVarChar(500), message)
        .query(`
          INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType, IsRead, CreatedAt)
          VALUES (@UserID, N'Cảnh báo đỗ quá giờ', @Message, 'System', @ReferenceID, 'Session', 0, GETDATE())
        `);
      console.log(`[Smart Parking] Sent overtime alert to Driver ID ${session.DriverID} for Slot ${session.SlotCode}`);
    }

    // 3. Proactive Slot Reassignment (Đổi chỗ đệm chủ động trước 15 phút)
    const reassignmentCandidates = await pool.request().query(`
      SELECT 
          rB.ReservationID AS B_ReservationID,
          rB.DriverID AS B_DriverID,
          rB.SlotID AS B_SlotID,
          rB.VehicleTypeID AS B_VehicleTypeID,
          sl.SlotCode AS B_OldSlotCode,
          f.BuildingID AS B_BuildingID
      FROM Reservations rB
      JOIN ParkingSlots sl ON rB.SlotID = sl.SlotID
      JOIN Zones z ON sl.ZoneID = z.ZoneID
      JOIN Floors f ON z.FloorID = f.FloorID
      WHERE rB.ReservationStatus = 'Reserved'
        AND rB.StartTime <= DATEADD(MINUTE, 15, GETDATE())
        AND rB.StartTime > GETDATE()
        AND EXISTS (
            SELECT 1 FROM ParkingSessions psA
            WHERE psA.SlotID = rB.SlotID
              AND psA.SessionStatus = 'Active'
              AND psA.ExitTime IS NULL
              AND (
                  psA.BookingStartTime IS NULL
                  OR EXISTS (
                      SELECT 1 FROM Reservations rA
                      WHERE rA.DriverID = psA.DriverID
                        AND rA.SlotID = psA.SlotID
                        AND rA.StartTime = psA.BookingStartTime
                        AND rA.ReservationStatus = 'Completed'
                        AND rA.EndTime <= GETDATE()
                  )
              )
        )
    `);

    for (const rB of reassignmentCandidates.recordset) {
      const minWindow = new Date(Date.now() + 60 * 60000);
      const slotResult = await pool.request()
        .input('buildingId', sql.Int, rB.B_BuildingID)
        .input('vehicleTypeId', sql.Int, rB.B_VehicleTypeID)
        .input('minWindow', sql.DateTime, minWindow)
        .query(`
            SELECT TOP 1 sl.SlotID, sl.SlotCode
            FROM ParkingSlots sl
            JOIN Zones z ON sl.ZoneID = z.ZoneID
            JOIN Floors f ON z.FloorID = f.FloorID
            WHERE f.BuildingID = @buildingId
              AND sl.VehicleTypeID = @vehicleTypeId
              AND sl.SlotStatus NOT IN ('Maintenance', 'Blocked')
              AND NOT EXISTS (
                SELECT 1 FROM ParkingSessions ps
                WHERE ps.SlotID = sl.SlotID AND ps.SessionStatus = 'Active' AND ps.ExitTime IS NULL
              )
              AND NOT EXISTS (
                SELECT 1 FROM Reservations r
                WHERE r.SlotID = sl.SlotID
                  AND r.ReservationStatus = 'Reserved'
                  AND r.StartTime < @minWindow
              )
            ORDER BY sl.SlotCode
        `);

      const availableSlot = slotResult.recordset[0];
      if (availableSlot) {
        // Cập nhật slot mới cho xe B
        await pool.request()
          .input('newSlotId', sql.Int, availableSlot.SlotID)
          .input('reservationId', sql.Int, rB.B_ReservationID)
          .query(`UPDATE Reservations SET SlotID = @newSlotId WHERE ReservationID = @reservationId`);

        // Gửi thông báo đến xe B
        const notifyMessage = `Vị trí đặt chỗ ${rB.B_OldSlotCode} của bạn đã được đổi sang vị trí mới ${availableSlot.SlotCode} do sự cố kỹ thuật (xe trước chưa rời đi). Xin lỗi vì sự bất tiện này.`;
        await pool.request()
          .input('driverId', sql.Int, rB.B_DriverID)
          .input('reservationId', sql.Int, rB.B_ReservationID)
          .input('message', sql.NVarChar(500), notifyMessage)
          .query(`
              INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType, IsRead, CreatedAt)
              VALUES (@driverId, N'Thay đổi vị trí đỗ xe tự động', @message, 'Booking', @reservationId, 'Reservation', 0, GETDATE())
          `);

        console.log(`[Smart Parking] Reassigned reservation ID ${rB.B_ReservationID} from slot ${rB.B_OldSlotCode} to ${availableSlot.SlotCode} due to overstaying vehicle`);
      } else {
        // Hết slot trống: tạo cảnh báo khẩn cấp cho nhân viên & quản lý bãi xe
        console.warn(`[Smart Parking] No slot available to reassign reservation ID ${rB.B_ReservationID} from slot ${rB.B_OldSlotCode}`);
        const alertMessage = `Đặt chỗ BK-${String(rB.B_ReservationID).padStart(4, '0')} tại vị trí ${rB.B_OldSlotCode} có nguy cơ xung đột vì xe trước đỗ quá giờ và không còn slot trống thay thế!`;
        await pool.request()
          .input('message', sql.NVarChar(500), alertMessage)
          .query(`
              INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType, IsRead, CreatedAt)
              SELECT u.UserID, N'Cảnh báo xung đột ô đỗ', @message, 'System', NULL, NULL, 0, GETDATE()
              FROM Users u
              JOIN Roles r ON u.RoleID = r.RoleID
              WHERE r.RoleName IN ('Staff', 'Manager') AND u.IsActive = 1
          `);
      }
    }
  } catch (error) {
    console.error("❌ Smart Parking proactive worker failed:", error.message);
  }
}

async function safeBackgroundSync() {
  if (backgroundSyncRunning) return;

  backgroundSyncRunning = true;

  try {
    const pool = await getPool();
    await syncParkingSlotStatuses(pool);
    await runSmartParkingProactiveWorker(pool);
    console.log("✅ Parking slot statuses synced");
  } catch (error) {
    console.error("❌ Parking slot sync failed:", error.message);
  } finally {
    backgroundSyncRunning = false;
  }
}

export function startParkingSlotAutoSync(intervalMs = 60000) {
  if (syncInterval) return syncInterval;

  safeBackgroundSync();

  syncInterval = setInterval(() => {
    safeBackgroundSync();
  }, intervalMs);

  console.log(`🔄 Parking slot auto sync started: every ${intervalMs / 1000}s`);

  return syncInterval;
}