import { getPool, sql } from "../BE/src/config/db.js";

async function test() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT * FROM Payments
    `);
    console.log("All Payments:", result.recordset);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
