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
  port: Number(process.env.DB_PORT) || 1433,

  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERTIFICATE === "true",

    // SQL Server của project đang dùng giờ Việt Nam (+07:00).
    // Dòng này tránh mssql/tedious tự đổi Date sang UTC khi đọc/ghi DATETIME.
    useUTC: false,
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const pool = new sql.ConnectionPool(config);

const poolConnect = pool
  .connect()
  .then(() => {
    console.log("✅ SQL Server connected");
  })
  .catch((err) => {
    console.error("❌ SQL Server connection failed:", err);
    process.exit(1);
  });

export async function getPool() {
  await poolConnect;
  return pool;
}

export { sql };