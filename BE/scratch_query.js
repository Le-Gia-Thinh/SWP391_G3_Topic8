import { getPool } from './src/config/db.js';

async function main() {
  const pool = await getPool();
  const res = await pool.request().query("SELECT Email, AccountBalance FROM Users WHERE Email = 'alice@email.com'");
  console.log(res.recordset);
  process.exit(0);
}
main();
