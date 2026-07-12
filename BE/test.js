const sql = require('mssql');
const config = {
  user: 'sa',
  password: '123456',
  server: 'localhost',
  database: 'SmartParkingDB',
  options: { encrypt: false, trustServerCertificate: true }
};
sql.connect(config).then(pool => {
  console.log('Connected');
  return pool.request()
    .input('DriverID', sql.Int, 2)
    .query(`
        SELECT
          s.SessionID
        FROM ParkingSessions s
        JOIN ParkingSlots ps ON s.SlotID = ps.SlotID
        WHERE s.SessionStatus = 'Active'
    `);
}).then(result => {
  console.log('Result:', result.recordset);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
