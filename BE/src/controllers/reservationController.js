import { getPool, sql } from "../config/db.js";

export async function getReservations(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT r.ReservationID, r.ReservationDate, r.StartTime, r.EndTime, r.ReservationStatus,
             u.FullName AS DriverName, vt.VehicleName, ps.SlotCode
      FROM Reservations r
      JOIN Users u ON r.DriverID = u.UserID
      JOIN VehicleTypes vt ON r.VehicleTypeID = vt.VehicleTypeID
      LEFT JOIN ParkingSlots ps ON r.SlotID = ps.SlotID
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
}

export async function createReservation(req, res, next) {
  try {
    const { driverId, vehicleTypeId, slotId, reservationDate, startTime, endTime } = req.body;
    const pool = await getPool(); 
    await pool.request()
      .input("DriverID", sql.Int, driverId)
      .input("VehicleTypeID", sql.Int, vehicleTypeId)
      .input("SlotID", sql.Int, slotId)
      .input("ReservationDate", sql.Date, reservationDate)
      .input("StartTime", sql.DateTime, startTime)
      .input("EndTime", sql.DateTime, endTime)
      .execute("sp_CreateReservation");
    res.json({ success: true, message: "Reservation created" });
  } catch (err) { next(err); }
}