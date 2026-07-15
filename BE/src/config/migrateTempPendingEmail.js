import { getPool } from "./db.js";

async function main() {
    try {
        const pool = await getPool();
        console.log("Connected to database. Starting migration...");

        // 1. Add TempPendingEmail column if not exists
        await pool.request().query(`
            IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'TempPendingEmail' AND Object_ID = Object_ID(N'Users'))
            BEGIN
                ALTER TABLE Users ADD TempPendingEmail NVARCHAR(100) NULL;
                PRINT 'Added TempPendingEmail column to Users table.';
            END
            ELSE
            BEGIN
                PRINT 'TempPendingEmail column already exists.';
            END
        `);

        // 2. Drop and recreate sp_VerifyEmail
        await pool.request().query(`
            IF OBJECT_ID('sp_VerifyEmail', 'P') IS NOT NULL 
                DROP PROCEDURE sp_VerifyEmail;
        `);

        await pool.request().query(`
            CREATE PROCEDURE sp_VerifyEmail @Token NVARCHAR(500)
            AS BEGIN
                SET NOCOUNT ON;
                DECLARE @UserID INT;
                SELECT @UserID=UserID FROM Users WHERE EmailVerifyToken=@Token AND EmailVerifyExpires>GETUTCDATE() AND IsActive=1;
                IF @UserID IS NULL BEGIN RAISERROR('Token không hợp lệ hoặc đã hết hạn.',16,1); RETURN; END
                UPDATE Users 
                SET Email = ISNULL(TempPendingEmail, Email),
                    TempPendingEmail = NULL,
                    IsEmailVerified=1,
                    EmailVerifyToken=NULL,
                    EmailVerifyExpires=NULL,
                    UpdatedAt=GETDATE() 
                WHERE UserID=@UserID;
                SELECT @UserID AS UserID;
            END
        `);
        console.log("Successfully updated sp_VerifyEmail stored procedure.");

        console.log("Migration complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err.message);
        process.exit(1);
    }
}

main();
