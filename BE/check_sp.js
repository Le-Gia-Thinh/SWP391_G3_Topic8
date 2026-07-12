import { getPool } from './src/config/db.js';

async function main() {
    const pool = await getPool();
    const r = await pool.request().query(
        "SELECT OBJECT_DEFINITION(OBJECT_ID('sp_CheckOutWithSurcharge')) AS code"
    );
    console.log(r.recordset[0]?.code || 'NOT FOUND');
    process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
