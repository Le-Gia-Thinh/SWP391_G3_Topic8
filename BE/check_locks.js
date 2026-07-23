import { getPool } from "./src/config/db.js";

async function run() {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                req.session_id,
                req.status,
                req.command,
                req.blocking_session_id,
                req.wait_type,
                req.wait_time,
                req.wait_resource,
                TEXT AS query_text
            FROM sys.dm_exec_requests req
            CROSS APPLY sys.dm_exec_sql_text(req.sql_handle)
            WHERE req.session_id <> @@SPID
        `);
        console.log("Active requests:");
        console.dir(result.recordset, { depth: null });
        
        const openTrans = await pool.request().query(`
            SELECT * FROM sys.sysprocesses WHERE open_tran > 0
        `);
        console.log("Sessions with open transactions:");
        console.dir(openTrans.recordset, { depth: null });
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
