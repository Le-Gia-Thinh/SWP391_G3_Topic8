import { getPool } from './src/config/db.js';

async function checkData() {
  try {
    const pool = await getPool();
    const subs = await pool.request().query("SELECT * FROM UserSubscriptions WHERE UserID = 1 OR UserID = 2");
    console.log("Subscriptions:", subs.recordset);

    const sessions = await pool.request().query("SELECT SessionID, DriverID, PlateNumber, EntryTime, ExitTime, SessionStatus FROM ParkingSessions WHERE DriverID = 1 OR DriverID = 2 ORDER BY EntryTime DESC");
    console.log("Sessions:", sessions.recordset);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkData();
