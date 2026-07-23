/**
 * FILE: slotSyncService.js
 * MÔ TẢ: Service đồng bộ trạng thái Vị trí đỗ xe (Parking Slots) tự động chạy ngầm (Cron-job Background Worker).
 * 
 * ĐIỂM KHÁC BIỆT RẤT LỚN SO VỚI LUỒNG THÊM XE (VEHICLE):
 * - Luồng Vehicle/Reservation được kích hoạt khi NGƯỜI DÙNG BẤM NÚT trên giao diện Web.
 * - File này là TỰ ĐỘNG CHẠY NGẦM TRONG BACKGROUND (mỗi 1 phút chạy 1 lần do server.js kích hoạt).
 * 
 * Các chức năng chạy ngầm thông minh:
 * 1. syncParkingSlotStatuses: Chạy Stored Proc `sp_SyncParkingSlotStatuses` đồng bộ màu vị trí đỗ.
 * 2. Cảnh báo sắp hết giờ (Pre-overtime Alert): Tự gửi thông báo tới điện thoại tài xế trước 15 phút.
 * 3. Cảnh báo lố giờ (Overtime Alert): Tự gửi thông báo khi tài xế đỗ quá giờ.
 * 4. Điều hướng thông minh (Proactive Slot Reassignment): Tự động đổi vị trí đỗ cho xe tiếp theo nếu vị trí cũ đang bị xe trước đỗ lố giờ (Tránh xung đột bãi đỗ)!
 */
/*
hieu
*/

import { getPool, sql } from "../config/db.js";

let backgroundSyncRunning = false;
let syncInterval = null;

/**
 * 1. Gọi Stored Procedure sp_SyncParkingSlotStatuses trong SQL để cập nhật trạng thái các Slot.
 */
export async function syncParkingSlotStatuses(existingPool = null) {
  const pool = existingPool || await getPool();
  await pool.request().execute("sp_SyncParkingSlotStatuses");
}

/**
 * 2. WORKER CHẠY NGẦM THÔNG MINH (Smart Parking Proactive Worker)
 */
export async function runSmartParkingProactiveWorker(pool) {
  try {
    // A. Cảnh báo sắp hết giờ đỗ xe (Gửi thông báo trước 15 phút)
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
      console.log(`[Smart Parking] Đã gửi cảnh báo sắp hết giờ tới Tài xế ID ${session.DriverID} cho vị trí ${session.SlotCode}`);
    }

    // B. Cảnh báo lố giờ đỗ xe (Gửi thông báo ngay khi vừa đỗ quá giờ)
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
      console.log(`[Smart Parking] Đã gửi cảnh báo lố giờ tới Tài xế ID ${session.DriverID} cho vị trí ${session.SlotCode}`);
    }

    // C. ĐIỀU HƯỚNG TỰ ĐỘNG CHỖ ĐỖ DỰ PHÒNG (Proactive Slot Reassignment)
    // Nếu xe trước đỗ lố giờ, tự động chuyển người đặt đợt sau sang một vị trí trống khác cùng tầng/khu vực!
    const reassignmentCandidates = await pool.request().query(`
      SELECT 
          rB.ReservationID AS B_ReservationID,
          rB.DriverID AS B_DriverID,
          rB.SlotID AS B_SlotID,
          rB.VehicleTypeID AS B_VehicleTypeID,
          sl.SlotCode AS B_OldSlotCode,
          z.ZoneID,
          rB.StartTime AS B_StartTime,
          rB.EndTime AS B_EndTime
      FROM Reservations rB
      JOIN ParkingSlots sl ON rB.SlotID = sl.SlotID
      JOIN Zones z ON sl.ZoneID = z.ZoneID
      WHERE rB.ReservationStatus = 'Reserved'
        AND rB.StartTime BETWEEN GETDATE() AND DATEADD(MINUTE, 20, GETDATE())
        AND EXISTS (
            SELECT 1 FROM ParkingSessions psA
            WHERE psA.SlotID = rB.SlotID
              AND psA.SessionStatus = 'Active'
              AND psA.ExitTime IS NULL
        )
    `);

    for (const candidate of reassignmentCandidates.recordset) {
      // Tìm vị trí đỗ trống khác trong cùng Zone
      const freeSlotRes = await pool.request()
        .input("ZoneID", sql.Int, candidate.ZoneID)
        .input("VehicleTypeID", sql.Int, candidate.B_VehicleTypeID)
        .input("StartTime", sql.DateTime, candidate.B_StartTime)
        .input("EndTime", sql.DateTime, candidate.B_EndTime)
        .query(`
          SELECT TOP 1 ps.SlotID, ps.SlotCode
          FROM ParkingSlots ps
          WHERE ps.ZoneID = @ZoneID
            AND ps.IsActive = 1
            AND ps.SlotStatus NOT IN ('Maintenance', 'Blocked')
            AND NOT EXISTS (
                SELECT 1 FROM ParkingSessions s
                WHERE s.SlotID = ps.SlotID AND s.SessionStatus = 'Active' AND s.ExitTime IS NULL
            )
            AND NOT EXISTS (
                SELECT 1 FROM Reservations r
                WHERE r.SlotID = ps.SlotID
                  AND r.ReservationStatus = 'Reserved'
                  AND @StartTime < r.EndTime AND @EndTime > r.StartTime
            )
          ORDER BY ps.SlotCode ASC
        `);

      if (freeSlotRes.recordset.length > 0) {
        const newSlot = freeSlotRes.recordset[0];
        
        // Cập nhật vị trí mới cho đơn đặt chỗ
        await pool.request()
          .input("ReservationID", sql.Int, candidate.B_ReservationID)
          .input("NewSlotID", sql.Int, newSlot.SlotID)
          .query(`
            UPDATE Reservations
            SET SlotID = @NewSlotID, UpdatedAt = GETDATE()
            WHERE ReservationID = @ReservationID
          `);

        // Gửi thông báo cho tài xế về việc đổi vị trí đỗ tự động
        const notifMsg = `Do vị trí ${candidate.B_OldSlotCode} cũ đang có xe đỗ lố giờ, hệ thống đã tự động chuyển vị trí đặt chỗ của bạn sang ${newSlot.SlotCode}.`;
        await pool.request()
          .input("UserID", sql.Int, candidate.B_DriverID)
          .input("ReferenceID", sql.Int, candidate.B_ReservationID)
          .input("Message", sql.NVarChar(500), notifMsg)
          .query(`
            INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType, IsRead, CreatedAt)
            VALUES (@UserID, N'Đã tự động đổi vị trí đỗ xe', @Message, 'System', @ReferenceID, 'Reservation', 0, GETDATE())
          `);

        console.log(`[Smart Parking] Reassigned Reservation ID ${candidate.B_ReservationID} from Slot ${candidate.B_OldSlotCode} to ${newSlot.SlotCode}`);
      }
    }

  } catch (err) {
    console.error("[Smart Parking] Error in proactive worker:", err);
  }
}

/**
 * 3. KÍCH HOẠT VÒNG LẶP CHẠY NGẦM MỖI 1 PHÚT (Start Background Sync Worker)
 */
export function startBackgroundSlotSync(intervalMs = 60000) {
  if (backgroundSyncRunning) return;
  backgroundSyncRunning = true;

  console.log(`[Smart Parking] Started background slot status sync worker (Interval: ${intervalMs / 1000}s)...`);

  syncInterval = setInterval(async () => {
    try {
      const pool = await getPool();
      await syncParkingSlotStatuses(pool);
      await runSmartParkingProactiveWorker(pool);
    } catch (err) {
      console.error("[Smart Parking] Error running background slot sync:", err);
    }
  }, intervalMs);
}

export const startParkingSlotAutoSync = startBackgroundSlotSync;