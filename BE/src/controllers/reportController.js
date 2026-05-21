import { getPool } from "../config/db.js";

export async function dashboard(req, res, next) {
  try {
    const pool = await getPool();
    const [slots, sessions, revenue, incidents] = await Promise.all([
      pool.request().query("SELECT SlotStatus, COUNT(*) AS Total FROM ParkingSlots GROUP BY SlotStatus"),
      pool.request().query("SELECT SessionStatus, COUNT(*) AS Total FROM ParkingSessions GROUP BY SessionStatus"),
      pool.request().query("SELECT ISNULL(SUM(Amount),0) AS Revenue FROM Payments WHERE PaymentStatus='Completed'"),
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