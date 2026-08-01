/**
 * FILE: updateSeedPasswords.js
 * MÔ TẢ: Script cập nhật mật khẩu mặc định 123456 cho TẤT CẢ tài khoản trong hệ thống.
 */

import bcryptjs from "bcryptjs";
import { getPool, sql } from "./db.js";

const SEED_PASSWORD = "123456";

async function main() {
    try {
        const pool = await getPool();

        // Hash mật khẩu một lần dùng cho tất cả
        const passwordHash = await bcryptjs.hash(SEED_PASSWORD, 10);

        // 1. Lấy toàn bộ danh sách user
        const result = await pool.request().query(`SELECT UserID, Email, FullName FROM Users ORDER BY UserID`);
        const users = result.recordset;
        console.log(`📋 Tìm thấy ${users.length} tài khoản. Đang cập nhật...`);

        for (const user of users) {
            // Cập nhật mật khẩu + kích hoạt tài khoản
            await pool.request()
                .input("UserID",       sql.Int,          user.UserID)
                .input("PasswordHash", sql.NVarChar(256), passwordHash)
                .query(`
                    UPDATE Users
                    SET PasswordHash     = @PasswordHash,
                        IsActive         = 1,
                        IsEmailVerified  = 1,
                        UpdatedAt        = GETDATE()
                    WHERE UserID = @UserID
                `);

            // Đảm bảo có provider 'local' để đăng nhập bằng email/password
            await pool.request()
                .input("UserID", sql.Int, user.UserID)
                .query(`
                    IF NOT EXISTS (
                        SELECT 1 FROM UserAuthProviders
                        WHERE UserID = @UserID AND ProviderName = 'local'
                    )
                    INSERT INTO UserAuthProviders (UserID, ProviderName, ProviderUserID, ProviderEmail)
                    SELECT UserID, 'local', CAST(UserID AS NVARCHAR(200)), Email
                    FROM Users WHERE UserID = @UserID
                `);

            console.log(`  ✅ [${user.UserID}] ${user.FullName} — ${user.Email}`);
        }

        console.log(`\n✅ DONE! Đã reset mật khẩu ${users.length} tài khoản → 123456`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Thất bại:", err.message);
        process.exit(1);
    }
}

main();
