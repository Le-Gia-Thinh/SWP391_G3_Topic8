import { getPool, sql } from "../BE/src/config/db.js";

async function seed() {
  try {
    const pool = await getPool();
    console.log("Seeding dummy revenue data...");

    // Update Payment 1 to be completed today
    await pool.request().query(`
      UPDATE Payments 
      SET PaymentStatus = 'Completed', 
          PaymentTime = GETDATE(),
          FinalAmount = 50000
      WHERE PaymentID = 1
    `);

    // Update Payment 2 to be completed yesterday
    await pool.request().query(`
      UPDATE Payments 
      SET PaymentStatus = 'Completed', 
          PaymentTime = DATEADD(DAY, -1, GETDATE()),
          FinalAmount = 30000
      WHERE PaymentID = 2
    `);

    // Update Payment 3 to be completed 2 days ago
    await pool.request().query(`
      UPDATE Payments 
      SET PaymentStatus = 'Completed', 
          PaymentTime = DATEADD(DAY, -2, GETDATE()),
          FinalAmount = 150000
      WHERE PaymentID = 3
    `);

    console.log("Successfully seeded completed payments.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
