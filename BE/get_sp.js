import { getPool } from "./src/config/db.js";

async function run() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT OBJECT_DEFINITION(OBJECT_ID('sp_SyncParkingSlotStatuses')) AS definition
        `);
        console.log(result.recordset[0].definition);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
