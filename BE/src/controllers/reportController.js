/**
 * FILE: reportController.js
 * MÔ TẢ: Controller xử lý báo cáo tổng quan (Dashboard) cho Manager.
 * Truy vấn song song nhiều bảng để lấy thống kê: chỗ đỗ, phiên, doanh thu, sự cố.
 */

import { getPool } from "../config/db.js"; // Kết nối database

/**
 * Lấy dữ liệu Dashboard tổng quan.
 * Thực hiện 4 truy vấn song song (Promise.all) để tối ưu tốc độ:
 * - Slots: Thống kê trạng thái chỗ đỗ (Available, Occupied, Reserved, ...)
 * - Sessions: Thống kê trạng thái phiên đỗ xe (Active, Completed, Cancelled, ...)
 * - Revenue: Tổng doanh thu từ thanh toán và gói hội viên
 * - Incidents: Thống kê trạng thái sự cố (Open, InProgress, Resolved, ...)
 * 
 * @route GET /api/reports/dashboard
 * @access Manager only
 */
/*
Thinh
*/

export async function dashboard(req, res, next) {
  try {
    const pool = await getPool();
    const [slots, sessions, revenue, incidents] = await Promise.all([
      pool.request().query("SELECT SlotStatus, COUNT(*) AS Total FROM ParkingSlots GROUP BY SlotStatus"),
      pool.request().query("SELECT SessionStatus, COUNT(*) AS Total FROM ParkingSessions GROUP BY SessionStatus"),
      pool.request().query(`
        SELECT ISNULL(SUM(Revenue), 0) AS Revenue 
        FROM (
            SELECT ISNULL(FinalAmount, Amount) AS Revenue FROM Payments WHERE PaymentStatus IN ('Completed', 'Prepaid')
            UNION ALL
            SELECT AmountPaid AS Revenue FROM UserSubscriptions WHERE AmountPaid > 0
        ) t
      `),
      pool.request().query("SELECT IncidentStatus, COUNT(*) AS Total FROM Incidents GROUP BY IncidentStatus")
    ]);

    res.json({
      success: true,
      data: {
        slots: slots.recordset,
        sessions: sessions.recordset,
        revenue: revenue.recordset[0],
        incidents: incidents.recordset
      }
    });
  } catch (err) { next(err); }
}