-- =====================================================
-- AUTH MIGRATION - Parking Management System
-- Chạy SAU file SQL gốc ParkingManagementDB
-- =====================================================

USE ParkingManagementDB;
GO

-- =====================================================
-- 1. SỬA BẢNG USERS
-- =====================================================

-- PasswordHash cho phép NULL
-- Vì Google/Facebook user không dùng password local
IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Users')
      AND name = 'PasswordHash'
      AND is_nullable = 0
)
BEGIN
    ALTER TABLE Users ALTER COLUMN PasswordHash NVARCHAR(256) NULL;
    PRINT 'PasswordHash -> nullable';
END
GO

-- AvatarUrl cho social login
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Users')
      AND name = 'AvatarUrl'
)
BEGIN
    ALTER TABLE Users ADD AvatarUrl NVARCHAR(500) NULL;
    PRINT 'Added AvatarUrl';
END
GO

-- ResetToken cho forgot password
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Users')
      AND name = 'ResetToken'
)
BEGIN
    ALTER TABLE Users ADD ResetToken NVARCHAR(500) NULL;
    ALTER TABLE Users ADD ResetTokenExpires DATETIME NULL;
    PRINT 'Added ResetToken, ResetTokenExpires';
END
GO

-- =====================================================
-- 2. TẠO BẢNG UserAuthProviders
-- =====================================================
-- 1 user có thể có nhiều cách đăng nhập:
-- local, google, facebook
-- ProviderUserID:
--   local    = UserID
--   google   = Google sub
--   facebook = Facebook id
-- =====================================================

IF OBJECT_ID('UserAuthProviders', 'U') IS NULL
BEGIN
    CREATE TABLE UserAuthProviders (
        ProviderID      INT IDENTITY(1,1) PRIMARY KEY,
        UserID          INT           NOT NULL,
        ProviderName    NVARCHAR(20)  NOT NULL,
        ProviderUserID  NVARCHAR(200) NULL,
        ProviderEmail   NVARCHAR(100) NULL,
        CreatedAt       DATETIME DEFAULT GETDATE(),

        CONSTRAINT FK_UAP_User
            FOREIGN KEY(UserID) REFERENCES Users(UserID) ON DELETE CASCADE,

        CONSTRAINT UQ_UAP_Provider
            UNIQUE(ProviderName, ProviderUserID),

        CONSTRAINT CK_UAP_Name
            CHECK(ProviderName IN ('local','google','facebook'))
    );

    CREATE INDEX IX_UAP_UserID ON UserAuthProviders(UserID);

    PRINT 'Created UserAuthProviders';
END
GO

-- FIX nếu trước đó từng chạy bản lỗi khiến local ProviderUserID = NULL
UPDATE UserAuthProviders
SET ProviderUserID = CAST(UserID AS NVARCHAR(200))
WHERE ProviderName = 'local'
  AND ProviderUserID IS NULL;
GO

-- =====================================================
-- 3. TẠO BẢNG RefreshTokens
-- =====================================================
-- Lưu HASH của refresh token, không lưu raw token
-- RevokedAt IS NULL nghĩa là token còn hiệu lực
-- =====================================================

IF OBJECT_ID('RefreshTokens', 'U') IS NULL
BEGIN
    CREATE TABLE RefreshTokens (
        RefreshTokenID INT IDENTITY(1,1) PRIMARY KEY,
        UserID         INT           NOT NULL,
        TokenHash      NVARCHAR(200) NOT NULL UNIQUE,
        ExpiresAt      DATETIME      NOT NULL,
        CreatedAt      DATETIME DEFAULT GETDATE(),
        CreatedByIp    NVARCHAR(45)  NULL,
        RevokedAt      DATETIME      NULL,

        CONSTRAINT FK_RT_User
            FOREIGN KEY(UserID) REFERENCES Users(UserID) ON DELETE CASCADE
    );

    CREATE INDEX IX_RT_TokenHash ON RefreshTokens(TokenHash);
    CREATE INDEX IX_RT_UserID    ON RefreshTokens(UserID);

    PRINT 'Created RefreshTokens';
END
GO

-- =====================================================
-- 4. STORED PROCEDURES
-- =====================================================

-- =====================================================
-- 4a. sp_RegisterLocal
-- Đăng ký local account
-- Luôn tạo Driver, RoleID = 1
-- Không cho frontend tự chọn role
-- =====================================================

IF OBJECT_ID('sp_RegisterLocal','P') IS NOT NULL
    DROP PROCEDURE sp_RegisterLocal;
GO

CREATE PROCEDURE sp_RegisterLocal
    @FullName     NVARCHAR(100),
    @Email        NVARCHAR(100),
    @PasswordHash NVARCHAR(256),
    @PhoneNumber  NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
    BEGIN
        RAISERROR('Email already exists.', 16, 1);
        RETURN;
    END

    DECLARE @UserID INT;

    INSERT INTO Users(
        FullName,
        Email,
        PasswordHash,
        PhoneNumber,
        RoleID,
        IsActive
    )
    VALUES(
        @FullName,
        @Email,
        @PasswordHash,
        @PhoneNumber,
        1,
        1
    );

    SET @UserID = SCOPE_IDENTITY();

    -- local provider phải có ProviderUserID riêng
    -- Không được để NULL vì sẽ lỗi unique key (local, NULL)
    INSERT INTO UserAuthProviders(
        UserID,
        ProviderName,
        ProviderUserID,
        ProviderEmail
    )
    VALUES(
        @UserID,
        'local',
        CAST(@UserID AS NVARCHAR(200)),
        @Email
    );

    SELECT
        u.UserID,
        u.FullName,
        u.Email,
        u.PhoneNumber,
        u.RoleID,
        r.RoleName,
        u.IsActive,
        u.AvatarUrl
    FROM Users u
    JOIN Roles r ON u.RoleID = r.RoleID
    WHERE u.UserID = @UserID;
END
GO

-- =====================================================
-- 4b. sp_GetUserByEmail
-- Dùng cho login local
-- =====================================================

IF OBJECT_ID('sp_GetUserByEmail','P') IS NOT NULL
    DROP PROCEDURE sp_GetUserByEmail;
GO

CREATE PROCEDURE sp_GetUserByEmail
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.UserID,
        u.FullName,
        u.Email,
        u.PasswordHash,
        u.RoleID,
        r.RoleName,
        u.IsActive,
        u.AvatarUrl,
        CASE WHEN EXISTS (
            SELECT 1
            FROM UserAuthProviders
            WHERE UserID = u.UserID
              AND ProviderName = 'local'
        ) THEN 1 ELSE 0 END AS HasLocalAuth
    FROM Users u
    JOIN Roles r ON u.RoleID = r.RoleID
    WHERE u.Email = @Email;
END
GO

-- =====================================================
-- 4c. sp_UpsertSocialUser
-- Dùng chung cho Google + Facebook
-- Nếu provider đã tồn tại -> lấy user
-- Nếu email đã tồn tại -> link provider vào user cũ
-- Nếu chưa có -> tạo user Driver mới
-- =====================================================

IF OBJECT_ID('sp_UpsertSocialUser','P') IS NOT NULL
    DROP PROCEDURE sp_UpsertSocialUser;
GO

CREATE PROCEDURE sp_UpsertSocialUser
    @ProviderName   NVARCHAR(20),
    @ProviderUserID NVARCHAR(200),
    @Email          NVARCHAR(100),
    @FullName       NVARCHAR(100),
    @AvatarUrl      NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserID INT;

    IF @ProviderName NOT IN ('google', 'facebook')
    BEGIN
        RAISERROR('Invalid social provider.', 16, 1);
        RETURN;
    END

    -- Tìm theo provider trước
    SELECT @UserID = UserID
    FROM UserAuthProviders
    WHERE ProviderName = @ProviderName
      AND ProviderUserID = @ProviderUserID;

    -- Nếu chưa có provider, tìm theo email để link account
    IF @UserID IS NULL AND @Email IS NOT NULL
    BEGIN
        SELECT @UserID = UserID
        FROM Users
        WHERE Email = @Email;
    END

    -- Nếu chưa có user thì tạo Driver mới
    IF @UserID IS NULL
    BEGIN
        INSERT INTO Users(
            FullName,
            Email,
            PasswordHash,
            RoleID,
            AvatarUrl,
            IsActive
        )
        VALUES(
            @FullName,
            @Email,
            NULL,
            1,
            @AvatarUrl,
            1
        );

        SET @UserID = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE Users
        SET
            AvatarUrl = ISNULL(@AvatarUrl, AvatarUrl),
            UpdatedAt = GETDATE()
        WHERE UserID = @UserID;
    END

    -- Link provider nếu user chưa có provider này
    IF NOT EXISTS (
        SELECT 1
        FROM UserAuthProviders
        WHERE UserID = @UserID
          AND ProviderName = @ProviderName
    )
    BEGIN
        INSERT INTO UserAuthProviders(
            UserID,
            ProviderName,
            ProviderUserID,
            ProviderEmail
        )
        VALUES(
            @UserID,
            @ProviderName,
            @ProviderUserID,
            @Email
        );
    END

    SELECT
        u.UserID,
        u.FullName,
        u.Email,
        u.PhoneNumber,
        u.RoleID,
        r.RoleName,
        u.IsActive,
        u.AvatarUrl
    FROM Users u
    JOIN Roles r ON u.RoleID = r.RoleID
    WHERE u.UserID = @UserID;
END
GO

-- =====================================================
-- 4d. sp_SaveRefreshToken
-- Lưu hash refresh token
-- Dọn token cũ đã revoke hoặc hết hạn của user đó
-- =====================================================

IF OBJECT_ID('sp_SaveRefreshToken','P') IS NOT NULL
    DROP PROCEDURE sp_SaveRefreshToken;
GO

CREATE PROCEDURE sp_SaveRefreshToken
    @UserID      INT,
    @TokenHash   NVARCHAR(200),
    @ExpiresAt   DATETIME,
    @CreatedByIp NVARCHAR(45) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM RefreshTokens
    WHERE UserID = @UserID
      AND (
            RevokedAt IS NOT NULL
            OR ExpiresAt < GETDATE()
          );

    INSERT INTO RefreshTokens(
        UserID,
        TokenHash,
        ExpiresAt,
        CreatedByIp
    )
    VALUES(
        @UserID,
        @TokenHash,
        @ExpiresAt,
        @CreatedByIp
    );
END
GO

-- =====================================================
-- 4e. sp_GetUserByRefreshToken
-- Lấy user từ refresh token hash còn hiệu lực
-- =====================================================

IF OBJECT_ID('sp_GetUserByRefreshToken','P') IS NOT NULL
    DROP PROCEDURE sp_GetUserByRefreshToken;
GO

CREATE PROCEDURE sp_GetUserByRefreshToken
    @TokenHash NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.UserID,
        u.FullName,
        u.Email,
        u.PhoneNumber,
        u.RoleID,
        r.RoleName,
        u.IsActive,
        u.AvatarUrl
    FROM RefreshTokens rt
    JOIN Users u ON rt.UserID = u.UserID
    JOIN Roles r ON u.RoleID = r.RoleID
    WHERE rt.TokenHash = @TokenHash
      AND rt.RevokedAt IS NULL
      AND rt.ExpiresAt > GETDATE()
      AND u.IsActive = 1;
END
GO

-- =====================================================
-- 4f. sp_RevokeRefreshToken
-- Thu hồi refresh token khi logout hoặc rotate token
-- =====================================================

IF OBJECT_ID('sp_RevokeRefreshToken','P') IS NOT NULL
    DROP PROCEDURE sp_RevokeRefreshToken;
GO

CREATE PROCEDURE sp_RevokeRefreshToken
    @TokenHash NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserID INT;

    SELECT @UserID = UserID
    FROM RefreshTokens
    WHERE TokenHash = @TokenHash
      AND RevokedAt IS NULL
      AND ExpiresAt > GETDATE();

    IF @UserID IS NULL
    BEGIN
        RAISERROR('Refresh token invalid or expired.', 16, 1);
        RETURN;
    END

    UPDATE RefreshTokens
    SET RevokedAt = GETDATE()
    WHERE TokenHash = @TokenHash
      AND RevokedAt IS NULL;

    SELECT @UserID AS UserID;
END
GO

-- =====================================================
-- 5. MIGRATE USERS CŨ SANG UserAuthProviders
-- =====================================================

INSERT INTO UserAuthProviders(
    UserID,
    ProviderName,
    ProviderUserID,
    ProviderEmail
)
SELECT
    u.UserID,
    'local',
    CAST(u.UserID AS NVARCHAR(200)),
    u.Email
FROM Users u
WHERE u.PasswordHash IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM UserAuthProviders uap
      WHERE uap.UserID = u.UserID
        AND uap.ProviderName = 'local'
  );
GO

-- =====================================================
-- 6. VERIFY SAU MIGRATION
-- =====================================================

SELECT 'UserAuthProviders' AS [Table], COUNT(*) AS Rows
FROM UserAuthProviders
UNION ALL
SELECT 'RefreshTokens', COUNT(*)
FROM RefreshTokens;
GO