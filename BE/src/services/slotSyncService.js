/**
 * FILE: slotSyncService.js
 * MÔ TẢ: Service đồng bộ trạng thái Vị trí đỗ xe (Parking Slots).
 * Chức năng: Cập nhật trạng thái Slot dựa trên các phiên gửi xe (Sessions) đang hoạt động 
 * và các đặt chỗ (Reservations) đã hết hạn.
 */

import { getPool } from "../config/db.js";

let backgroundSyncRunning = false;
let syncInterval = null;

export async function syncParkingSlotStatuses(existingPool = null) {
  const pool = existingPool || await getPool();
  await pool.request().execute("sp_SyncParkingSlotStatuses");
}

async function safeBackgroundSync() {
  if (backgroundSyncRunning) return;

  backgroundSyncRunning = true;

  try {
    await syncParkingSlotStatuses();
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