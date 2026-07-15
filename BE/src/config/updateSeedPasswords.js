/**
 * FILE: updateSeedPasswords.js
 * MÔ TẢ: Script cập nhật mật khẩu mặc định cho một số tài khoản thử nghiệm (seed emails).
 * Nó cũng cập nhật lại trạng thái kích hoạt, xác thực và đăng ký phương thức đăng nhập 'local'.
 */

import bcryptjs from "bcryptjs"; // Thư viện để băm (hash) mật khẩu
import { getPool, sql } from "./db.js";

// Mật khẩu mặc định sẽ được đặt cho các tài khoản seed
const SEED_PASSWORD = "123456";

// Danh sách các email dùng để test/seed trong hệ thống
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
        
        // 1. Mã hóa mật khẩu mặc định (SEED_PASSWORD) với salt round là 10
        const passwordHash = await bcryptjs.hash(SEED_PASSWORD, 10);

        // 2. Lặp qua từng email trong danh sách để cập nhật
        for (const email of seedEmails) {
            
            // Cập nhật lại mật khẩu (đã băm), trạng thái IsActive = 1 và IsEmailVerified = 0 (yêu cầu xác thực email)
            await pool.request()
                .input("Email", sql.NVarChar(100), email)
                .input("PasswordHash", sql.NVarChar(256), passwordHash)
                .query(`
          UPDATE Users
          SET PasswordHash = @PasswordHash,
              IsActive = 1,
              IsEmailVerified = 0,
              UpdatedAt = GETDATE()
          WHERE Email = @Email
        `);

            // Chèn thêm bản ghi vào UserAuthProviders nếu người dùng này chưa có Provider = 'local'
            // 'local' là phương thức đăng nhập bằng username/password thông thường
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

// Chạy hàm chính
main();