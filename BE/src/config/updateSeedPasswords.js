import bcryptjs from "bcryptjs";
import { getPool, sql } from "./db.js";

const SEED_PASSWORD = "123456";

const seedEmails = [
    "alice@email.com",
    "bob@email.com",
    "carol@email.com",
    "david@email.com",
    "eve@email.com",
    "admin@parking.com"
];

async function main() {
    try {
        const pool = await getPool();
        const passwordHash = await bcryptjs.hash(SEED_PASSWORD, 10);

        for (const email of seedEmails) {
            await pool.request()
                .input("Email", sql.NVarChar(100), email)
                .input("PasswordHash", sql.NVarChar(256), passwordHash)
                .query(`
          UPDATE Users
          SET PasswordHash = @PasswordHash,
              IsActive = 1,
              IsEmailVerified = 1,
              UpdatedAt = GETDATE()
          WHERE Email = @Email
        `);

            await pool.request()
                .input("Email", sql.NVarChar(100), email)
                .query(`
          INSERT INTO UserAuthProviders (UserID, ProviderName, ProviderUserID, ProviderEmail)
          SELECT UserID, 'local', CAST(UserID AS NVARCHAR(200)), Email
          FROM Users u
          WHERE u.Email = @Email
            AND NOT EXISTS (
              SELECT 1
              FROM UserAuthProviders p
              WHERE p.UserID = u.UserID
                AND p.ProviderName = 'local'
            )
        `);
        }

        console.log("✅ Updated seed users successfully.");
        console.log("Password:", SEED_PASSWORD);
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed:", err.message);
        process.exit(1);
    }
}

main();