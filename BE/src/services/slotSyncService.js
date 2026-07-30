/**
 * FILE: slotSyncService.js
 * MÔ TẢ: Service tiến trình chạy ngầm tự động (Background Worker Cron-Job).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Khởi chạy liên tục trong nền Node.js (`setInterval` mỗi 60 giây) từ file `server.js` khi ứng dụng khởi động.
 * 2. ĐỒNG BỘ TRẠNG THÁI Ô ĐỖ (`syncParkingSlotStatuses`): Gọi Stored Procedure `sp_SyncParkingSlotStatuses` cập nhật màu sắc vị trí ô đỗ (`Available`, `Occupied`, `Reserved`, `Overtime`) thời gian thực.
 * 3. CẢNH BÁO SẮP HẾT GIỜ ĐỖ XE (Pre-Overtime Notification): Quét các xe sắp hết giờ đỗ trong vòng 13-17 phút tới ➔ Tự động bắn thông báo nhắc nhở tài xế chuẩn bị di chuyển xe.
 * 4. CẢNH BÁO LỐ GIỜ ĐỖ XE (Overtime Notification): Bắn thông báo ngay khi xe quá hạn đỗ ➔ Thông báo tính phí phạt quá giờ.
 * 5. ĐIỀU HƯỚNG Ô ĐỖ DỰ PHÒNG THÔNG MINH (Proactive Slot Reassignment Engine): NẾU xe trước đỗ lố giờ mà có xe sau chuẩn bị tới đỗ trong vòng 20 phút ➔ Tự động tìm 1 ô đỗ trống khác trong cùng Zone và điều hướng tài xế tới ô đỗ mới để tránh xung đột bãi đỗ!
 * 
 * @module slotSyncService
 */

import { getPool, sql } from "../config/db.js";

// Biến cờ kiểm tra trạng thái tiến trình chạy ngầm
let backgroundSyncRunning = false;
let syncInterval = null;

/**
 * HÀM 1: syncParkingSlotStatuses
 * TÁC DỤNG: Gọi Stored Procedure `sp_SyncParkingSlotStatuses` trong CSDL SQL Server để cập nhật trạng thái các Slot.
 * 
 * @param {Object} [existingPool=null] - Mối kết nối SQL khả dụng
 */
export async function syncParkingSlotStatuses(existingPool = null) {
  const pool = existingPool || await getPool();
  await pool.request().execute("sp_SyncParkingSlotStatuses");
}

/**
 * HÀM 2: runSmartParkingProactiveWorker
 * TÁC DỤNG: Tiến trình kiểm tra thông minh 3 giai đoạn (Smart Proactive Worker Engine).
 * 
 * @param {Object} pool - Connection Pool kết nối SQL Server
 */
export async function runSmartParkingProactiveWorker(pool) {
  try {
    // -----------------------------------------------------------------
    // GIAI ĐOẠN A: CẢNH BÁO SẮP HẾT GIỜ ĐỖ XE (Gửi trước 13 đến 17 phút)
    // -----------------------------------------------------------------
    const preAlertResult = await pool.request().query(`
      SELECT 
          ps.SessionID,
          ps.DriverID,
          sl.SlotCode,
          r.EndTime
      FROM ParkingSessions ps
      JOIN ParkingSlots sl ON ps.SlotID = sl.SlotID
      JOIN Reservations r ON r.ReservationID = ps.ReservationID AND r.ReservationStatus = 'Completed'
      WHERE ps.SessionStatus = 'Active'
        AND ps.ExitTime IS NULL
        -- DATEADD(MINUTE, 13, GETDATE()): Kiểm tra thời gian kết thúc nằm trong khoảng 13 - 17 phút tới
        AND r.EndTime BETWEEN DATEADD(MINUTE, 13, GETDATE()) AND DATEADD(MINUTE, 17, GETDATE())
        -- Đảm bảo chưa từng gửi thông báo cảnh báo này trước đó (tránh trùng lặp)
        AND NOT EXISTS (
            SELECT 1 FROM Notifications n
            WHERE n.UserID = ps.DriverID
              AND n.NotificationType = 'System'
              AND n.ReferenceID = ps.SessionID
              AND n.Title = N'Cảnh báo sắp hết giờ đỗ xe'
        )
    `);

    // Duyệt danh sách xe cần cảnh báo và chèn bản ghi Notifications vào CSDL
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

    // -----------------------------------------------------------------
    // GIAI ĐOẠN B: CẢNH BÁO LỐ GIỜ ĐỖ XE (Vừa đỗ quá thời gian đặt chỗ)
    // -----------------------------------------------------------------
    const overtimeAlertResult = await pool.request().query(`
      SELECT 
          ps.SessionID,
          ps.DriverID,
          sl.SlotCode,
          r.EndTime
      FROM ParkingSessions ps
      JOIN ParkingSlots sl ON ps.SlotID = sl.SlotID
      JOIN Reservations r ON r.ReservationID = ps.ReservationID AND r.ReservationStatus = 'Completed'
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

    // -----------------------------------------------------------------
    // GIAI ĐOẠN C: ĐIỀU HƯỚNG TỰ ĐỘNG CHỖ ĐỖ DỰ PHÒNG (Proactive Slot Reassignment)
    // -----------------------------------------------------------------
    // Tìm các đơn đặt chỗ (Reservations) sắp diễn ra trong 20 phút tới mà vị trí ô đỗ đó ĐANG BỊ XE KHÁC CHẾM Ô (Active Session lố giờ)
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
      // Tìm 1 vị trí đỗ xe TRỐNG KHÁC nằm trong cùng Khu vực (ZoneID)
      const freeSlotRes = await pool.request()
        .input("ZoneID", sql.Int, candidate.ZoneID)
        .input("VehicleTypeID", sql.Int, candidate.B_VehicleTypeID)
        .input("StartTime", sql.DateTime, candidate.B_StartTime)
        .input("EndTime", sql.DateTime, candidate.B_EndTime)
        .query(`
          SELECT TOP 1 ps.SlotID, ps.SlotCode
          FROM ParkingSlots ps
          WHERE ps.ZoneID = @ZoneID
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

      // Nếu tìm được ô đỗ thay thế khả thi ➔ Đổi ô đỗ và gửi thông báo cho tài xế
      if (freeSlotRes.recordset.length > 0) {
        const newSlot = freeSlotRes.recordset[0];
        
        // Cập nhật SlotID mới vào bản ghi Đặt chỗ
        await pool.request()
          .input("ReservationID", sql.Int, candidate.B_ReservationID)
          .input("NewSlotID", sql.Int, newSlot.SlotID)
          .query(`
            UPDATE Reservations
            SET SlotID = @NewSlotID, UpdatedAt = GETDATE()
            WHERE ReservationID = @ReservationID
          `);

        // Gửi thông báo tự động điều hướng tới ứng dụng của Tài xế
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
 * HÀM 3: startBackgroundSlotSync
 * TÁC DỤNG: Kích hoạt timer lặp chạy ngầm tự động mỗi 60 giây (Start Interval Loop).
 * 
 * @param {number} [intervalMs=60000] - Chu kỳ lặp tính theo millisecond (mặc định 60.000ms = 1 phút)
 */
export function startBackgroundSlotSync(intervalMs = 60000) {
  if (backgroundSyncRunning) return; // Tránh khởi chạy trùng lặp hai lần
  backgroundSyncRunning = true;

  console.log(`[Smart Parking] Started background slot status sync worker (Interval: ${intervalMs / 1000}s)...`);

  // Chạy lặp vô tận theo chu kỳ cài sẵn
  syncInterval = setInterval(async () => {
    try {
      const pool = await getPool();
      await syncParkingSlotStatuses(pool);        // 1. Đồng bộ trạng thái ô đỗ
      await runSmartParkingProactiveWorker(pool);  // 2. Chạy cảnh báo & điều hướng xe
    } catch (err) {
      console.error("[Smart Parking] Error running background slot sync:", err);
    }
  }, intervalMs);
}

export const startParkingSlotAutoSync = startBackgroundSlotSync;