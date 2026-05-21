import { getPool } from "../config/db.js";

export async function getRoles(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`SELECT * FROM Roles ORDER BY RoleID`);
    res.json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
}

export async function getVehicleTypes(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`SELECT * FROM VehicleTypes WHERE IsActive = 1 ORDER BY VehicleTypeID`);
    res.json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
}

export async function getBuildings(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query(`SELECT * FROM Buildings ORDER BY BuildingID`);
    res.json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
}

export async function getSlots(req, res, next) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT ps.SlotID, ps.SlotCode, ps.SlotStatus, ps.VehicleTypeID,
             vt.VehicleName, z.ZoneName, f.FloorName, b.BuildingName
      FROM ParkingSlots ps
      JOIN Zones z ON ps.ZoneID = z.ZoneID
      JOIN Floors f ON z.FloorID = f.FloorID
      JOIN Buildings b ON f.BuildingID = b.BuildingID
      JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
      ORDER BY ps.SlotID
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) { next(err); }
}