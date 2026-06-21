import { getPool, sql } from "./db.js";

async function main() {
    try {
        const pool = await getPool();
        
        // Check if Admin role exists
        const roleResult = await pool.request().query("SELECT RoleID FROM Roles WHERE RoleName = 'Admin'");
        let roleId;
        if (roleResult.recordset.length > 0) {
            roleId = roleResult.recordset[0].RoleID;
            console.log("Admin role already exists with ID:", roleId);
        } else {
            const insertRole = await pool.request()
                .input("RoleName", sql.NVarChar(50), "Admin")
                .input("Description", sql.NVarChar(200), "Quản trị hệ thống")
                .query(`
                    INSERT INTO Roles (RoleName, Description)
                    OUTPUT INSERTED.RoleID
                    VALUES (@RoleName, @Description)
                `);
            roleId = insertRole.recordset[0].RoleID;
            console.log("Created Admin role with ID:", roleId);
        }

        // Fix Constraint CK_Users_MinAge to allow RoleID = 4
        await pool.request().query(`
            IF OBJECT_ID('CK_Users_MinAge', 'C') IS NOT NULL
                ALTER TABLE Users DROP CONSTRAINT CK_Users_MinAge;
        `);
        await pool.request().query(`
            ALTER TABLE Users
            ADD CONSTRAINT CK_Users_MinAge
            CHECK (
                RoleID = 1
                OR RoleID = 4
                OR (
                    RoleID IN (2, 3)
                    AND DateOfBirth IS NOT NULL
                    AND HireDate IS NOT NULL
                    AND DATEDIFF(YEAR, DateOfBirth, HireDate) >= 18
                )
            );
        `);

        // Check if Admin user exists
        const userResult = await pool.request().query("SELECT UserID FROM Users WHERE Email = 'admin@parking.com'");
        if (userResult.recordset.length > 0) {
            console.log("Admin user already exists with ID:", userResult.recordset[0].UserID);
        } else {
            const insertUser = await pool.request()
                .input("FullName", sql.NVarChar(100), "Grace Admin")
                .input("Email", sql.NVarChar(100), "admin@parking.com")
                .input("PhoneNumber", sql.NVarChar(20), "0901000007")
                .input("RoleID", sql.Int, roleId)
                .input("DateOfBirth", sql.Date, new Date("1990-01-01"))
                .query(`
                    INSERT INTO Users (FullName, Email, PhoneNumber, RoleID, IsActive, IsEmailVerified, DateOfBirth)
                    OUTPUT INSERTED.UserID
                    VALUES (@FullName, @Email, @PhoneNumber, @RoleID, 1, 1, @DateOfBirth)
                `);
            console.log("Created Admin user with ID:", insertUser.recordset[0].UserID);
        }

        // Create AuditLogs table if not exists
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuditLogs' and xtype='U')
            BEGIN
                CREATE TABLE AuditLogs (
                    LogID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NULL,
                    UserName NVARCHAR(100) NULL,
                    RoleName NVARCHAR(50) NULL,
                    Action NVARCHAR(50) NOT NULL,
                    Target NVARCHAR(100) NULL,
                    Description NVARCHAR(500) NULL,
                    IpAddress NVARCHAR(45) NULL,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE SET NULL
                )
                PRINT 'Created AuditLogs table'
            END
            ELSE
            BEGIN
                PRINT 'AuditLogs table already exists'
            END
        `);
        
        process.exit(0);
    } catch (err) {
        console.error("❌ Failed:", err.message);
        process.exit(1);
    }
}

main();
