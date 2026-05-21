import { getPool, sql } from "../config/db.js";

export async function getSessions(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ps.SessionID, ps.PlateNumber, ps.EntryTime, ps.ExitTime, ps.SessionStatus,
             u.FullName AS DriverName, vt.VehicleName, slot.SlotCode
      FROM ParkingSessions ps
      JOIN Users u ON ps.DriverID = u.UserID
      JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
      JOIN ParkingSlots slot ON ps.SlotID = slot.SlotID
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
}

export async function checkInVehicle(req, res, next) {
  try {
    const { driverId, plateNumber, vehicleTypeId, slotId } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input("DriverID", sql.Int, driverId)
      .input("PlateNumber", sql.NVarChar(20), plateNumber)
      .input("VehicleTypeID", sql.Int, vehicleTypeId)
      .input("SlotID", sql.Int, slotId)
      .execute("sp_CheckInVehicle");
    res.json({ success: true, session: result.recordset[0] });
  } catch (err) { next(err); }
}

export async function checkOutVehicle(req, res, next) {
  try {
    const { sessionId, paymentMethod } = req.body;
    const pool = await getPool();
    await pool.request()
      .input("SessionID", sql.Int, sessionId)
      .input("PaymentMethod", sql.NVarChar(50), paymentMethod)
      .execute("sp_CheckOutVehicle");
    res.json({ success: true, message: "Checked out successfully" });
  } catch (err) { next(err); }
}