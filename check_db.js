const sql = require('mssql');
const config = require('./BE/src/config/db.js').dbConfig;

async function check() {
  let pool;
  try {
    pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT SlotCode, SlotStatus 
      FROM ParkingSlots 
      WHERE SlotCode IN ('A-C-01', 'A-C-02', 'A-C-03', 'A-C-04')
    `);
    console.log('Slot Status:', result.recordset);
    
    const sess = await pool.request().query(`
      SELECT ps.SlotCode, s.SessionStatus 
      FROM ParkingSessions s 
      JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
      WHERE ps.SlotCode IN ('A-C-01', 'A-C-02', 'A-C-03', 'A-C-04')
      AND s.SessionStatus = 'Active' AND s.ExitTime IS NULL
    `);
    console.log('Active Sessions:', sess.recordset);

    const res = await pool.request().query(`
      SELECT ps.SlotCode, r.ReservationStatus 
      FROM Reservations r
      JOIN ParkingSlots ps ON r.SlotID = ps.SlotID
      WHERE ps.SlotCode IN ('A-C-01', 'A-C-02', 'A-C-03', 'A-C-04')
      AND r.ReservationStatus = 'Reserved'
    `);
    console.log('Active Reservations:', res.recordset);

  } catch (err) {
    console.error(err);
  } finally {
    if (pool) pool.close();
  }
}
check();
