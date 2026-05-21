import sql from "mssql";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT),
  options: { encrypt: false, trustServerCertificate: true }
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect()
  .then(() => console.log("✅ SQL Server connected"))
  .catch(err => console.error(" SQL Server connection failed:", err));

export async function getPool() {
  await poolConnect;
  return pool;
}

export { sql };