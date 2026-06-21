USE master;
GO

IF DB_ID('ParkingManagementDB') IS NULL
    CREATE DATABASE ParkingManagementDB;
GO

USE ParkingManagementDB;
GO

-- =====================================================
-- BƯỚC 1: XÓA TRIGGERS
-- =====================================================
IF OBJECT_ID('TRG_AutoIncident',                        'TR') IS NOT NULL DROP TRIGGER TRG_AutoIncident;
IF OBJECT_ID('TRG_RecalculateSlotStatus_OnReservation', 'TR') IS NOT NULL DROP TRIGGER TRG_RecalculateSlotStatus_OnReservation;
IF OBJECT_ID('TRG_FreeSlotOnReservationCancel',         'TR') IS NOT NULL DROP TRIGGER TRG_FreeSlotOnReservationCancel;
IF OBJECT_ID('TRG_ReserveSlotOnReservation',            'TR') IS NOT NULL DROP TRIGGER TRG_ReserveSlotOnReservation;
IF OBJECT_ID('TRG_ValidateExitTime',                    'TR') IS NOT NULL DROP TRIGGER TRG_ValidateExitTime;
IF OBJECT_ID('TRG_UpdateSlotStatus',                    'TR') IS NOT NULL DROP TRIGGER TRG_UpdateSlotStatus;
IF OBJECT_ID('TRG_UpperPlateNumber',                    'TR') IS NOT NULL DROP TRIGGER TRG_UpperPlateNumber;
IF OBJECT_ID('TRG_AutoUpperVehicleName',                'TR') IS NOT NULL DROP TRIGGER TRG_AutoUpperVehicleName;
GO

-- =====================================================
-- BƯỚC 2: XÓA STORED PROCEDURES
-- =====================================================
IF OBJECT_ID('sp_RevokeRefreshToken',   'P') IS NOT NULL DROP PROCEDURE sp_RevokeRefreshToken;
IF OBJECT_ID('sp_GetUserByRefreshToken','P') IS NOT NULL DROP PROCEDURE sp_GetUserByRefreshToken;
IF OBJECT_ID('sp_SaveRefreshToken',     'P') IS NOT NULL DROP PROCEDURE sp_SaveRefreshToken;
IF OBJECT_ID('sp_UpsertSocialUser',     'P') IS NOT NULL DROP PROCEDURE sp_UpsertSocialUser;
IF OBJECT_ID('sp_ResendVerifyEmail',    'P') IS NOT NULL DROP PROCEDURE sp_ResendVerifyEmail;
IF OBJECT_ID('sp_VerifyEmail',          'P') IS NOT NULL DROP PROCEDURE sp_VerifyEmail;
IF OBJECT_ID('sp_GetUserByEmail',       'P') IS NOT NULL DROP PROCEDURE sp_GetUserByEmail;
IF OBJECT_ID('sp_RegisterLocal',        'P') IS NOT NULL DROP PROCEDURE sp_RegisterLocal;
IF OBJECT_ID('sp_CreateReservation',    'P') IS NOT NULL DROP PROCEDURE sp_CreateReservation;
IF OBJECT_ID('sp_CheckOutVehicle',      'P') IS NOT NULL DROP PROCEDURE sp_CheckOutVehicle;
IF OBJECT_ID('sp_CheckInVehicle',       'P') IS NOT NULL DROP PROCEDURE sp_CheckInVehicle;
GO

-- =====================================================
-- BƯỚC 3: XÓA CONSTRAINTS
-- =====================================================
IF OBJECT_ID('CK_Users_MinAge', 'C') IS NOT NULL
    ALTER TABLE Users DROP CONSTRAINT CK_Users_MinAge;
GO

-- =====================================================
-- BƯỚC 4: XÓA TABLES
-- =====================================================
IF OBJECT_ID('Feedbacks',         'U') IS NOT NULL DROP TABLE Feedbacks;
IF OBJECT_ID('Incidents',         'U') IS NOT NULL DROP TABLE Incidents;
IF OBJECT_ID('Payments',          'U') IS NOT NULL DROP TABLE Payments;
IF OBJECT_ID('Reservations',      'U') IS NOT NULL DROP TABLE Reservations;
IF OBJECT_ID('ParkingSessions',   'U') IS NOT NULL DROP TABLE ParkingSessions;
IF OBJECT_ID('ParkingSlots',      'U') IS NOT NULL DROP TABLE ParkingSlots;
IF OBJECT_ID('Zones',             'U') IS NOT NULL DROP TABLE Zones;
IF OBJECT_ID('Floors',            'U') IS NOT NULL DROP TABLE Floors;
IF OBJECT_ID('Buildings',         'U') IS NOT NULL DROP TABLE Buildings;
IF OBJECT_ID('PricingPolicies',   'U') IS NOT NULL DROP TABLE PricingPolicies;
IF OBJECT_ID('RefreshTokens',     'U') IS NOT NULL DROP TABLE RefreshTokens;
IF OBJECT_ID('UserAuthProviders', 'U') IS NOT NULL DROP TABLE UserAuthProviders;
IF OBJECT_ID('RolePermissions',   'U') IS NOT NULL DROP TABLE RolePermissions;
IF OBJECT_ID('Users',             'U') IS NOT NULL DROP TABLE Users;
IF OBJECT_ID('VehicleTypes',      'U') IS NOT NULL DROP TABLE VehicleTypes;
IF OBJECT_ID('Permissions',       'U') IS NOT NULL DROP TABLE Permissions;
IF OBJECT_ID('Roles',             'U') IS NOT NULL DROP TABLE Roles;
IF OBJECT_ID('AuditLogs',         'U') IS NOT NULL DROP TABLE AuditLogs;
GO

-- =====================================================
-- BƯỚC 5: TẠO TABLES
-- =====================================================

CREATE TABLE Roles (
    RoleID      INT IDENTITY(1,1) PRIMARY KEY,
    RoleName    NVARCHAR(50) UNIQUE NOT NULL,
    Description NVARCHAR(200)
);
GO

CREATE TABLE Permissions (
    PermissionID   INT IDENTITY(1,1) PRIMARY KEY,
    PermissionName NVARCHAR(100) UNIQUE NOT NULL,
    Description    NVARCHAR(200)
);
GO

CREATE TABLE RolePermissions (
    RoleID       INT NOT NULL,
    PermissionID INT NOT NULL,
    PRIMARY KEY (RoleID, PermissionID),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID),
    FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID)
);
GO

CREATE TABLE Users (
    UserID              INT IDENTITY(1,1) PRIMARY KEY,
    FullName            NVARCHAR(100) NOT NULL,
    Email               NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash        NVARCHAR(256) NULL,
    PhoneNumber         NVARCHAR(20) NULL,
    RoleID              INT NOT NULL,
    DateOfBirth         DATE NULL,
    HireDate            DATE NULL,
    IsActive            BIT NOT NULL DEFAULT 1,

    IsEmailVerified     BIT NOT NULL DEFAULT 0,
    EmailVerifyToken    NVARCHAR(500) NULL,
    EmailVerifyExpires  DATETIME NULL,

    AvatarUrl           NVARCHAR(500) NULL,

    ResetToken          NVARCHAR(500) NULL,
    ResetTokenExpires   DATETIME NULL,

    CreatedAt           DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME NOT NULL DEFAULT GETDATE(),

    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);
GO

CREATE TABLE UserAuthProviders (
    ProviderID     INT IDENTITY(1,1) PRIMARY KEY,
    UserID         INT NOT NULL,
    ProviderName   NVARCHAR(20) NOT NULL,
    ProviderUserID NVARCHAR(200) NULL,
    ProviderEmail  NVARCHAR(100) NULL,
    CreatedAt      DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_UAP_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT UQ_UAP_Provider UNIQUE (ProviderName, ProviderUserID),
    CONSTRAINT CK_UAP_Name CHECK (ProviderName IN ('local','google','facebook'))
);
GO

CREATE INDEX IX_UAP_UserID ON UserAuthProviders(UserID);
GO

CREATE TABLE RefreshTokens (
    RefreshTokenID INT IDENTITY(1,1) PRIMARY KEY,
    UserID         INT           NOT NULL,
    TokenHash      NVARCHAR(200) NOT NULL UNIQUE,
    ExpiresAt      DATETIME      NOT NULL,
    SessionExpiresAt DATETIME    NOT NULL,
    CreatedAt      DATETIME      NOT NULL DEFAULT GETUTCDATE(),
    CreatedByIp    NVARCHAR(45)  NULL,
    RevokedAt      DATETIME      NULL,

    CONSTRAINT FK_RT_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO

CREATE INDEX IX_RT_TokenHash ON RefreshTokens(TokenHash);
CREATE INDEX IX_RT_UserID ON RefreshTokens(UserID);
GO

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
);
GO

CREATE TABLE VehicleTypes (
    VehicleTypeID INT IDENTITY(1,1) PRIMARY KEY,
    VehicleCode   NVARCHAR(20) UNIQUE NOT NULL,
    VehicleName   NVARCHAR(50) NOT NULL,
    Description   NVARCHAR(200),
    IsActive      BIT DEFAULT 1
);
GO

CREATE TABLE PricingPolicies (
    PricingPolicyID INT IDENTITY(1,1) PRIMARY KEY,
    VehicleTypeID   INT NOT NULL,
    MinHours        DECIMAL(5,2) NOT NULL,
    MaxHours        DECIMAL(5,2) NOT NULL,
    Fee             DECIMAL(10,2) NOT NULL,
    IsOvernight     BIT DEFAULT 0,
    IsActive        BIT DEFAULT 1,
    FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CHECK (MinHours >= 0 AND MaxHours >= MinHours),
    CHECK (Fee >= 0)
);
GO

CREATE TABLE Buildings (
    BuildingID     INT IDENTITY(1,1) PRIMARY KEY,
    BuildingName   NVARCHAR(100) NOT NULL,
    Address        NVARCHAR(200),
    OperatingHours NVARCHAR(50),
    TotalFloors    INT,
    CreatedAt      DATETIME DEFAULT GETDATE(),
    UpdatedAt      DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE Floors (
    FloorID    INT IDENTITY(1,1) PRIMARY KEY,
    BuildingID INT NOT NULL,
    FloorName  NVARCHAR(50) NOT NULL,
    IsActive   BIT DEFAULT 1,
    FOREIGN KEY (BuildingID) REFERENCES Buildings(BuildingID)
);
GO

CREATE TABLE Zones (
    ZoneID               INT IDENTITY(1,1) PRIMARY KEY,
    FloorID              INT NOT NULL,
    ZoneName             NVARCHAR(50) NOT NULL,
    AllowedVehicleTypeID INT NOT NULL,
    TotalSlots           INT DEFAULT 0,
    FOREIGN KEY (FloorID) REFERENCES Floors(FloorID),
    FOREIGN KEY (AllowedVehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CHECK (TotalSlots >= 0)
);
GO

CREATE TABLE ParkingSlots (
    SlotID        INT IDENTITY(1,1) PRIMARY KEY,
    ZoneID        INT NOT NULL,
    SlotCode      NVARCHAR(20) NOT NULL UNIQUE,
    SlotStatus    NVARCHAR(20) DEFAULT 'Available',
    VehicleTypeID INT NOT NULL,
    FOREIGN KEY (ZoneID) REFERENCES Zones(ZoneID),
    FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CHECK (SlotStatus IN ('Available','Occupied','Reserved','Maintenance','Blocked'))
);
GO

CREATE TABLE ParkingSessions (
    SessionID     INT IDENTITY(1,1) PRIMARY KEY,
    SlotID        INT NOT NULL,
    DriverID      INT NOT NULL,
    PlateNumber   NVARCHAR(20) NOT NULL,
    VehicleTypeID INT NOT NULL,
    EntryTime     DATETIME DEFAULT GETDATE(),
    ExitTime      DATETIME NULL,
    SessionStatus NVARCHAR(20) DEFAULT 'Active',
    FOREIGN KEY (SlotID) REFERENCES ParkingSlots(SlotID),
    FOREIGN KEY (DriverID) REFERENCES Users(UserID),
    FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CHECK (ExitTime IS NULL OR ExitTime > EntryTime),
    CHECK (SessionStatus IN ('Active','Completed','Lost','Overdue'))
);
GO

CREATE TABLE Payments (
    PaymentID     INT IDENTITY(1,1) PRIMARY KEY,
    SessionID     INT NOT NULL UNIQUE,
    Amount        DECIMAL(10,2) NOT NULL,
    PaymentMethod NVARCHAR(50),
    PaymentTime   DATETIME NULL,
    PaymentStatus NVARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (SessionID) REFERENCES ParkingSessions(SessionID),
    CONSTRAINT CK_Payments_Amount CHECK (Amount >= 0),
    CONSTRAINT CK_Payments_Status CHECK (PaymentStatus IN ('Pending','Prepaid','Completed','Failed','Cancelled'))
);
GO

CREATE TABLE Reservations (
    ReservationID     INT IDENTITY(1,1) PRIMARY KEY,
    DriverID          INT NOT NULL,
    VehicleTypeID     INT NOT NULL,
    SlotID            INT NULL,
    ReservationDate   DATE NOT NULL,
    StartTime         DATETIME NOT NULL,
    EndTime           DATETIME NOT NULL,
    ReservationStatus NVARCHAR(20) DEFAULT 'Reserved',
    CreatedAt         DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (DriverID) REFERENCES Users(UserID),
    FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    FOREIGN KEY (SlotID) REFERENCES ParkingSlots(SlotID),
    CHECK (EndTime > StartTime),
    CHECK (ReservationStatus IN ('Reserved','Cancelled','Expired','Completed'))
);
GO

CREATE TABLE Incidents (
    IncidentID      INT IDENTITY(1,1) PRIMARY KEY,
    SessionID       INT NULL,
    DriverID        INT NOT NULL,
    IncidentType    NVARCHAR(50) NOT NULL,
    IncidentStatus  NVARCHAR(20) DEFAULT 'Open',
    Priority        NVARCHAR(20) DEFAULT 'Normal',
    Description     NVARCHAR(500),
    AssignedStaffID INT NULL,
    CreatedAt       DATETIME DEFAULT GETDATE(),
    UpdatedAt       DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (SessionID) REFERENCES ParkingSessions(SessionID),
    FOREIGN KEY (DriverID) REFERENCES Users(UserID),
    FOREIGN KEY (AssignedStaffID) REFERENCES Users(UserID),
    CHECK (IncidentStatus IN ('Open','InProgress','Resolved')),
    CHECK (Priority IN ('Low','Normal','High'))
);
GO

CREATE TABLE Feedbacks (
    FeedbackID     INT IDENTITY(1,1) PRIMARY KEY,
    DriverID       INT NOT NULL,
    IncidentID     INT NULL,
    FeedbackType   NVARCHAR(50),
    Description    NVARCHAR(500),
    Attachment     NVARCHAR(200),
    FeedbackStatus NVARCHAR(20) DEFAULT 'Open',
    CreatedAt      DATETIME DEFAULT GETDATE(),
    UpdatedAt      DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (DriverID) REFERENCES Users(UserID),
    FOREIGN KEY (IncidentID) REFERENCES Incidents(IncidentID),
    CHECK (FeedbackStatus IN ('Open','Closed','Resolved'))
);
GO

-- =====================================================
-- BƯỚC 6: CONSTRAINTS BỔ SUNG
-- =====================================================
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
GO

-- =====================================================
-- BƯỚC 7: STORED PROCEDURES
-- =====================================================

CREATE PROCEDURE sp_RegisterLocal
    @FullName           NVARCHAR(100),
    @Email              NVARCHAR(100),
    @PasswordHash       NVARCHAR(256),
    @PhoneNumber        NVARCHAR(20) = NULL,
    @EmailVerifyToken   NVARCHAR(500) = NULL,
    @EmailVerifyExpires DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email)
    BEGIN
        RAISERROR('Email already exists.', 16, 1);
        RETURN;
    END

    DECLARE @UserID INT;

    INSERT INTO Users (
        FullName, Email, PasswordHash, PhoneNumber,
        RoleID, IsActive,
        IsEmailVerified, EmailVerifyToken, EmailVerifyExpires
    )
    VALUES (
        @FullName, @Email, @PasswordHash, @PhoneNumber,
        1,
        1,
        0,
        @EmailVerifyToken,
        @EmailVerifyExpires
    );

    SET @UserID = SCOPE_IDENTITY();

    INSERT INTO UserAuthProviders (UserID, ProviderName, ProviderUserID, ProviderEmail)
    VALUES (@UserID, 'local', CAST(@UserID AS NVARCHAR(200)), @Email);

    SELECT
        u.UserID, u.FullName, u.Email, u.PhoneNumber,
        u.RoleID, r.RoleName, u.IsActive, u.IsEmailVerified, u.AvatarUrl
    FROM Users u
    JOIN Roles r ON u.RoleID = r.RoleID
    WHERE u.UserID = @UserID;
END
GO

CREATE PROCEDURE sp_GetUserByEmail
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.UserID, u.FullName, u.Email,
        u.PasswordHash, u.RoleID, r.RoleName,
        u.IsActive, u.IsEmailVerified, u.AvatarUrl,
        CASE WHEN EXISTS (
            SELECT 1
            FROM UserAuthProviders
            WHERE UserID = u.UserID AND ProviderName = 'local'
        ) THEN 1 ELSE 0 END AS HasLocalAuth
    FROM Users u
    JOIN Roles r ON u.RoleID = r.RoleID
    WHERE u.Email = @Email;
END
GO

CREATE PROCEDURE sp_VerifyEmail
    @Token NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserID INT;

    SELECT @UserID = UserID
    FROM Users
    WHERE EmailVerifyToken = @Token
      AND EmailVerifyExpires > GETUTCDATE()
      AND IsEmailVerified = 0
      AND IsActive = 1;

    IF @UserID IS NULL
    BEGIN
        RAISERROR('Token không hợp lệ hoặc đã hết hạn.', 16, 1);
        RETURN;
    END

    UPDATE Users
    SET IsEmailVerified = 1,
        EmailVerifyToken = NULL,
        EmailVerifyExpires = NULL,
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;

    SELECT @UserID AS UserID;
END
GO

CREATE PROCEDURE sp_ResendVerifyEmail
    @Email              NVARCHAR(100),
    @EmailVerifyToken   NVARCHAR(500),
    @EmailVerifyExpires DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @UserID INT;

    SELECT @UserID = UserID
    FROM Users
    WHERE Email = @Email
      AND IsEmailVerified = 0
      AND IsActive = 1;

    IF @UserID IS NULL
    BEGIN
        RAISERROR('Không thể gửi lại. Email không tồn tại hoặc đã được xác thực.', 16, 1);
        RETURN;
    END

    UPDATE Users
    SET EmailVerifyToken = @EmailVerifyToken,
        EmailVerifyExpires = @EmailVerifyExpires,
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;

    SELECT @UserID AS UserID;
END
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
    DECLARE @IsEmailVerified BIT;
    DECLARE @IsNewLink BIT = 0;

    IF @ProviderName NOT IN ('google', 'facebook')
    BEGIN
        RAISERROR('Invalid social provider.', 16, 1);
        RETURN;
    END

    SELECT @UserID = UserID
    FROM UserAuthProviders
    WHERE ProviderName = @ProviderName
      AND ProviderUserID = @ProviderUserID;

    IF @UserID IS NULL AND @Email IS NOT NULL
    BEGIN
        SELECT
            @UserID = UserID,
            @IsEmailVerified = IsEmailVerified
        FROM Users
        WHERE Email = @Email;

        IF @UserID IS NOT NULL
        BEGIN
            IF @IsEmailVerified = 0
            BEGIN
                RAISERROR('EMAIL_NOT_VERIFIED', 16, 1);
                RETURN;
            END

            SET @IsNewLink = 1;
        END
    END

    IF @UserID IS NULL
    BEGIN
        INSERT INTO Users (
            FullName, Email, PasswordHash,
            RoleID, AvatarUrl, IsActive,
            IsEmailVerified
        )
        VALUES (
            @FullName, @Email, NULL,
            1, @AvatarUrl, 1,
            1
        );

        SET @UserID = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE Users
        SET AvatarUrl = ISNULL(@AvatarUrl, AvatarUrl),
            UpdatedAt = GETDATE()
        WHERE UserID = @UserID;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM UserAuthProviders
        WHERE UserID = @UserID AND ProviderName = @ProviderName
    )
    BEGIN
        INSERT INTO UserAuthProviders (UserID, ProviderName, ProviderUserID, ProviderEmail)
        VALUES (@UserID, @ProviderName, @ProviderUserID, @Email);
    END
    SELECT
        u.UserID, u.FullName, u.Email, u.PhoneNumber,
        u.RoleID, r.RoleName, u.IsActive, u.IsEmailVerified,
        u.AvatarUrl,
        @IsNewLink AS IsNewLink
    FROM Users u
    JOIN Roles r ON u.RoleID = r.RoleID
    WHERE u.UserID = @UserID;
END
GO

CREATE PROCEDURE sp_SaveRefreshToken
    @UserID           INT,
    @TokenHash        NVARCHAR(200),
    @ExpiresAt        DATETIME,
    @SessionExpiresAt DATETIME,
    @CreatedByIp      NVARCHAR(45) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Dọn token cũ đã revoke, refresh token hết hạn,
    -- hoặc session absolute đã hết hạn
    DELETE FROM RefreshTokens
    WHERE UserID = @UserID
      AND (
            RevokedAt IS NOT NULL
            OR ExpiresAt < GETUTCDATE()
            OR SessionExpiresAt < GETUTCDATE()
          );

    INSERT INTO RefreshTokens (
        UserID,
        TokenHash,
        ExpiresAt,
        SessionExpiresAt,
        CreatedByIp
    )
    VALUES (
        @UserID,
        @TokenHash,
        @ExpiresAt,
        @SessionExpiresAt,
        @CreatedByIp
    );
END
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
        u.IsEmailVerified,
        u.AvatarUrl,
        rt.SessionExpiresAt
    FROM RefreshTokens rt
    JOIN Users u ON rt.UserID = u.UserID
    JOIN Roles r ON u.RoleID  = r.RoleID
    WHERE rt.TokenHash = @TokenHash
      AND rt.RevokedAt IS NULL
      AND rt.ExpiresAt > GETUTCDATE()
      AND rt.SessionExpiresAt > GETUTCDATE()
      AND u.IsActive = 1;
END
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
      AND ExpiresAt > GETUTCDATE()
      AND SessionExpiresAt > GETUTCDATE();

    IF @UserID IS NULL
    BEGIN
        RAISERROR('Refresh token invalid, expired, or session expired.', 16, 1);
        RETURN;
    END

    UPDATE RefreshTokens
    SET RevokedAt = GETUTCDATE()
    WHERE TokenHash = @TokenHash
      AND RevokedAt IS NULL;

    SELECT @UserID AS UserID;
END
GO

CREATE PROCEDURE sp_CheckInVehicle
    @DriverID      INT,
    @PlateNumber   NVARCHAR(20),
    @VehicleTypeID INT,
    @SlotID        INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @SlotStatus NVARCHAR(20);
    DECLARE @Fee DECIMAL(10,2);
    DECLARE @SessionID INT;

    SELECT @SlotStatus = SlotStatus
    FROM ParkingSlots
    WHERE SlotID = @SlotID;

    IF @SlotStatus IS NULL OR @SlotStatus <> 'Available'
    BEGIN
        RAISERROR('Slot not available.', 16, 1);
        RETURN;
    END

    INSERT INTO ParkingSessions (
        SlotID, DriverID, PlateNumber,
        VehicleTypeID, EntryTime, SessionStatus
    )
    VALUES (
        @SlotID, @DriverID, UPPER(@PlateNumber),
        @VehicleTypeID, GETDATE(), 'Active'
    );

    SET @SessionID = SCOPE_IDENTITY();

    SELECT TOP 1 @Fee = Fee
    FROM PricingPolicies
    WHERE VehicleTypeID = @VehicleTypeID
      AND MinHours = 0
      AND IsActive = 1
    ORDER BY MaxHours;

    INSERT INTO Payments (SessionID, Amount, PaymentMethod, PaymentStatus)
    VALUES (@SessionID, ISNULL(@Fee, 0), 'Pending', 'Pending');

    SELECT @SessionID AS NewSessionID;
END
GO

CREATE PROCEDURE sp_CheckOutVehicle
    @SessionID     INT,
    @PaymentMethod NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @EntryTime DATETIME;
    DECLARE @ExitTime DATETIME;
    DECLARE @VehicleTypeID INT;
    DECLARE @DurationH DECIMAL(10,2);
    DECLARE @Fee DECIMAL(10,2);

    SELECT
        @EntryTime = EntryTime,
        @VehicleTypeID = VehicleTypeID
    FROM ParkingSessions
    WHERE SessionID = @SessionID
      AND SessionStatus = 'Active';

    IF @EntryTime IS NULL
    BEGIN
        RAISERROR('Session not found or already completed.', 16, 1);
        RETURN;
    END

    SET @ExitTime = GETDATE();
    SET @DurationH = DATEDIFF(MINUTE, @EntryTime, @ExitTime) / 60.0;

    SELECT TOP 1 @Fee = Fee
    FROM PricingPolicies
    WHERE VehicleTypeID = @VehicleTypeID
      AND IsActive = 1
      AND (
            (IsOvernight = 1 AND @DurationH > 8)
            OR (@DurationH BETWEEN MinHours AND MaxHours)
          )
    ORDER BY IsOvernight DESC, MaxHours;

    IF @Fee IS NULL SET @Fee = 0;

    UPDATE ParkingSessions
    SET ExitTime = @ExitTime,
        SessionStatus = 'Completed'
    WHERE SessionID = @SessionID;

    UPDATE Payments
    SET Amount = @Fee,
        PaymentMethod = @PaymentMethod,
        PaymentTime = @ExitTime,
        PaymentStatus = 'Completed'
    WHERE SessionID = @SessionID;
END
GO

CREATE PROCEDURE sp_CreateReservation
    @DriverID        INT,
    @VehicleTypeID   INT,
    @SlotID          INT,
    @ReservationDate DATE,
    @StartTime       DATETIME,
    @EndTime         DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    IF @EndTime <= @StartTime
    BEGIN
        RAISERROR('EndTime must be greater than StartTime.', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM Reservations
        WHERE SlotID = @SlotID
          AND ReservationStatus = 'Reserved'
          AND @StartTime < EndTime
          AND @EndTime > StartTime
    )
    BEGIN
        RAISERROR('Slot already reserved in this time range.', 16, 1);
        RETURN;
    END

    INSERT INTO Reservations (
        DriverID, VehicleTypeID, SlotID,
        ReservationDate, StartTime, EndTime,
        ReservationStatus
    )
    VALUES (
        @DriverID, @VehicleTypeID, @SlotID,
        @ReservationDate, @StartTime, @EndTime,
        'Reserved'
    );
END
GO

-- =====================================================
-- BƯỚC 8: TRIGGERS
-- =====================================================

CREATE TRIGGER TRG_AutoUpperVehicleName
ON VehicleTypes
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE vt
    SET vt.VehicleName = UPPER(vt.VehicleName)
    FROM VehicleTypes vt
    JOIN inserted i ON vt.VehicleTypeID = i.VehicleTypeID;
END
GO

CREATE TRIGGER TRG_UpperPlateNumber
ON ParkingSessions
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ps
    SET ps.PlateNumber = UPPER(ps.PlateNumber)
    FROM ParkingSessions ps
    JOIN inserted i ON ps.SessionID = i.SessionID;
END
GO

CREATE TRIGGER TRG_ValidateExitTime
ON ParkingSessions
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        WHERE i.ExitTime IS NOT NULL
          AND i.ExitTime <= i.EntryTime
    )
    BEGIN
        RAISERROR('ExitTime must be greater than EntryTime.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO

CREATE TRIGGER TRG_UpdateSlotStatus
ON ParkingSessions
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ps
    SET ps.SlotStatus =
        CASE
            WHEN ps.SlotStatus IN ('Maintenance','Blocked') THEN ps.SlotStatus
            WHEN EXISTS (
                SELECT 1
                FROM ParkingSessions s
                WHERE s.SlotID = ps.SlotID
                  AND s.SessionStatus = 'Active'
            ) THEN 'Occupied'
            WHEN EXISTS (
                SELECT 1
                FROM Reservations r
                WHERE r.SlotID = ps.SlotID
                  AND r.ReservationStatus = 'Reserved'
            ) THEN 'Reserved'
            ELSE 'Available'
        END
    FROM ParkingSlots ps
    WHERE ps.SlotID IN (
        SELECT DISTINCT i.SlotID
        FROM inserted i
        WHERE i.SlotID IS NOT NULL
    );
END
GO

CREATE TRIGGER TRG_RecalculateSlotStatus_OnReservation
ON Reservations
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE ps
    SET ps.SlotStatus =
        CASE
            WHEN ps.SlotStatus IN ('Maintenance','Blocked') THEN ps.SlotStatus
            WHEN EXISTS (
                SELECT 1
                FROM ParkingSessions s
                WHERE s.SlotID = ps.SlotID
                  AND s.SessionStatus = 'Active'
            ) THEN 'Occupied'
            WHEN EXISTS (
                SELECT 1
                FROM Reservations r
                WHERE r.SlotID = ps.SlotID
                  AND r.ReservationStatus = 'Reserved'
            ) THEN 'Reserved'
            ELSE 'Available'
        END
    FROM ParkingSlots ps
    WHERE ps.SlotID IN (
        SELECT DISTINCT i.SlotID
        FROM inserted i
        WHERE i.SlotID IS NOT NULL
    );
END
GO

CREATE TRIGGER TRG_AutoIncident
ON ParkingSessions
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Incidents (
        SessionID, DriverID, IncidentType,
        IncidentStatus, Priority, Description,
        CreatedAt, UpdatedAt
    )
    SELECT
        i.SessionID,
        i.DriverID,
        'Lost Ticket',
        'Open',
        'Normal',
        'Auto-created lost ticket',
        GETDATE(),
        GETDATE()
    FROM inserted i
    WHERE i.SessionStatus = 'Lost'
      AND NOT EXISTS (
          SELECT 1
          FROM Incidents inc
          WHERE inc.SessionID = i.SessionID
            AND inc.IncidentType = 'Lost Ticket'
            AND inc.IncidentStatus IN ('Open','InProgress')
      );
END
GO

-- =====================================================
-- BƯỚC 9: SAMPLE DATA
-- =====================================================

INSERT INTO Roles (RoleName, Description) VALUES
('Driver',  'Regular parking customer'),
('Staff',   'Parking lot staff'),
('Manager', 'Parking lot manager'),
('Admin',   'System administrator');
GO

INSERT INTO Permissions (PermissionName, Description) VALUES
('VIEW_SLOTS',      'View parking slots'),
('MANAGE_SESSIONS', 'Manage parking sessions'),
('MANAGE_USERS',    'Manage users'),
('VIEW_REPORTS',    'View reports'),
('MANAGE_PAYMENTS', 'Manage payments');
GO

INSERT INTO RolePermissions (RoleID, PermissionID) VALUES
(1, 1),
(2, 1), (2, 2), (2, 5),
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5),
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5);
GO

INSERT INTO Users (
    FullName, Email, PasswordHash, PhoneNumber,
    RoleID, DateOfBirth, HireDate,
    IsActive, IsEmailVerified
)
VALUES
('Alice Driver',  'alice@email.com', '$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2', '0901000001', 1, NULL,         NULL,         1, 1),
('Bob Staff',     'bob@email.com',   '$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2',   '0901000002', 2, '1990-05-10', '2015-06-01', 1, 1),
('Carol Manager', 'carol@email.com', '$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2', '0901000003', 3, '1985-03-20', '2010-04-15', 1, 1),
('David Driver',  'david@email.com', '$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2', '0901000004', 1, NULL,         NULL,         1, 1),
('Eve Driver',    'eve@email.com',   '$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2',   '0901000005', 1, NULL,         NULL,         1, 1),
('Grace Admin',   'admin@parking.com', '$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2', '0901000007', 4, '1990-01-01', '2023-01-01', 1, 1);
GO

INSERT INTO UserAuthProviders (
    UserID, ProviderName, ProviderUserID, ProviderEmail
)
SELECT
    UserID,
    'local',
    CAST(UserID AS NVARCHAR(200)),
    Email
FROM Users
WHERE PasswordHash IS NOT NULL;
GO

INSERT INTO VehicleTypes (VehicleCode, VehicleName, Description) VALUES
('MOTO',  'Motorbike', 'Motorcycles and scooters'),
('CAR',   'Car',       'Passenger cars'),
('TRUCK', 'Truck',     'Light trucks');
GO

INSERT INTO PricingPolicies (
    VehicleTypeID, MinHours, MaxHours,
    Fee, IsOvernight, IsActive
)
VALUES
(1, 0, 3,   4000,  0, 1),
(1, 3, 8,   8000,  0, 1),
(1, 8, 24,  15000, 1, 1),
(2, 0, 3,   6000,  0, 1),
(2, 3, 8,   12000, 0, 1),
(2, 8, 24,  25000, 1, 1),
(3, 0, 3,   10000, 0, 1),
(3, 3, 8,   20000, 0, 1);
GO

INSERT INTO Buildings (
    BuildingName, Address, OperatingHours, TotalFloors
)
VALUES
('Toa A', '123 Nguyen Van Linh, Q7', '06:00-22:00', 3),
('Toa B', '456 Le Van Viet, Q9',     '00:00-23:59', 2);
GO

INSERT INTO Floors (BuildingID, FloorName) VALUES
(1, 'Tang 1'),
(1, 'Tang 2'),
(1, 'Tang 3'),
(2, 'Tang 1'),
(2, 'Tang 2');
GO

INSERT INTO Zones (
    FloorID, ZoneName, AllowedVehicleTypeID, TotalSlots
)
VALUES
(1, 'Zone A - Xe may', 1, 10),
(1, 'Zone B - O to',   2, 5),
(2, 'Zone C - Xe may', 1, 10),
(2, 'Zone D - O to',   2, 5),
(3, 'Zone E - Xe tai', 3, 4),
(4, 'Zone F - Xe may', 1, 8),
(4, 'Zone G - O to',   2, 4),
(5, 'Zone H - O to',   2, 4);
GO

INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID) VALUES
(1, 'A-M-01', 1),
(1, 'A-M-02', 1),
(1, 'A-M-03', 1),
(1, 'A-M-04', 1),
(1, 'A-M-05', 1),
(2, 'A-C-01', 2),
(2, 'A-C-02', 2),
(2, 'A-C-03', 2),
(2, 'A-C-04', 2),
(2, 'A-C-05', 2),
(3, 'B-M-01', 1),
(3, 'B-M-02', 1),
(3, 'B-M-03', 1),
(3, 'B-M-04', 1),
(3, 'B-M-05', 1),
(4, 'B-C-01', 2),
(4, 'B-C-02', 2),
(4, 'B-C-03', 2),
(4, 'B-C-04', 2),
(4, 'B-C-05', 2);
GO

-- =====================================================
-- BƯỚC 10: TEST DATA
-- =====================================================

INSERT INTO ParkingSessions (
    SlotID, DriverID, PlateNumber,
    VehicleTypeID, EntryTime, SessionStatus
)
VALUES
(1, 1, '29A-12345', 1, GETDATE(),                  'Active'),
(6, 1, '29A-54321', 2, GETDATE(),                  'Active'),
(2, 1, '29A-56789', 1, DATEADD(HOUR, -2, GETDATE()), 'Active'),
(7, 1, '29A-98765', 2, DATEADD(HOUR, -3, GETDATE()), 'Active');
GO

INSERT INTO Payments (
    SessionID, Amount, PaymentMethod, PaymentStatus
)
VALUES
(1, 4000, 'Cash', 'Pending'),
(2, 6000, 'Cash', 'Pending'),
(3, 4000, 'Cash', 'Pending'),
(4, 6000, 'Cash', 'Pending');
GO

INSERT INTO Reservations (
    DriverID, VehicleTypeID, SlotID,
    ReservationDate, StartTime, EndTime,
    ReservationStatus
)
VALUES
(1, 1, 3, CAST(GETDATE() AS DATE), DATEADD(HOUR, 1, GETDATE()), DATEADD(HOUR, 4, GETDATE()), 'Reserved'),
(1, 2, 8, CAST(GETDATE() AS DATE), DATEADD(HOUR, 2, GETDATE()), DATEADD(HOUR, 5, GETDATE()), 'Reserved'),
(1, 1, 4, CAST(GETDATE() AS DATE), DATEADD(HOUR, 1, GETDATE()), DATEADD(HOUR, 4, GETDATE()), 'Reserved'),
(1, 2, 9, CAST(GETDATE() AS DATE), DATEADD(HOUR, 2, GETDATE()), DATEADD(HOUR, 5, GETDATE()), 'Reserved');
GO

INSERT INTO Incidents (
    SessionID, DriverID, IncidentType,
    IncidentStatus, Priority, Description,
    AssignedStaffID
)
VALUES
(1, 1, 'Lost Ticket', 'Open', 'Normal', 'Customer lost ticket for slot 1',  2),
(2, 1, 'Overdue',     'Open', 'High',   'Vehicle parked over allowed time', 2),
(3, 1, 'Wrong Slot',  'Open', 'Normal', 'Vehicle parked in wrong slot',     2),
(4, 1, 'Lost Ticket', 'Open', 'High',   'Customer lost ticket urgent',      2);
GO

INSERT INTO Feedbacks (
    DriverID, IncidentID, FeedbackType,
    Description, FeedbackStatus
)
VALUES
(1, 1, 'Complaint', 'Lost ticket handling issue',  'Open'),
(1, 2, 'Complaint', 'Overdue fee unclear',         'Open'),
(1, 3, 'Complaint', 'Wrong slot problem',          'Open'),
(1, 4, 'Complaint', 'Lost ticket urgent follow-up','Open');
GO

-- =====================================================
-- BƯỚC 11: SYNC SLOT STATUS
-- =====================================================
UPDATE ps
SET ps.SlotStatus =
    CASE
        WHEN ps.SlotStatus IN ('Maintenance','Blocked') THEN ps.SlotStatus
        WHEN EXISTS (
            SELECT 1
            FROM ParkingSessions s
            WHERE s.SlotID = ps.SlotID
              AND s.SessionStatus = 'Active'
        ) THEN 'Occupied'
        WHEN EXISTS (
            SELECT 1
            FROM Reservations r
            WHERE r.SlotID = ps.SlotID
              AND r.ReservationStatus = 'Reserved'
        ) THEN 'Reserved'
        ELSE 'Available'
    END
FROM ParkingSlots ps;
GO

-- =====================================================
-- BƯỚC 12: VERIFICATION
-- =====================================================

SELECT TableName, Rows FROM (
    SELECT 'Roles' AS TableName, COUNT(*) AS Rows FROM Roles
    UNION ALL SELECT 'Permissions', COUNT(*) FROM Permissions
    UNION ALL SELECT 'Users', COUNT(*) FROM Users
    UNION ALL SELECT 'UserAuthProviders', COUNT(*) FROM UserAuthProviders
    UNION ALL SELECT 'RefreshTokens', COUNT(*) FROM RefreshTokens
    UNION ALL SELECT 'VehicleTypes', COUNT(*) FROM VehicleTypes
    UNION ALL SELECT 'PricingPolicies', COUNT(*) FROM PricingPolicies
    UNION ALL SELECT 'Buildings', COUNT(*) FROM Buildings
    UNION ALL SELECT 'Floors', COUNT(*) FROM Floors
    UNION ALL SELECT 'Zones', COUNT(*) FROM Zones
    UNION ALL SELECT 'ParkingSlots', COUNT(*) FROM ParkingSlots
    UNION ALL SELECT 'ParkingSessions', COUNT(*) FROM ParkingSessions
    UNION ALL SELECT 'Payments', COUNT(*) FROM Payments
    UNION ALL SELECT 'Reservations', COUNT(*) FROM Reservations
    UNION ALL SELECT 'Incidents', COUNT(*) FROM Incidents
    UNION ALL SELECT 'Feedbacks', COUNT(*) FROM Feedbacks
) t
ORDER BY TableName;
GO

SELECT
    u.UserID,
    u.Email,
    u.IsActive,
    u.IsEmailVerified,
    uap.ProviderName
FROM Users u
LEFT JOIN UserAuthProviders uap ON u.UserID = uap.UserID
ORDER BY u.UserID;
GO

SELECT 'SPs' AS Info, name
FROM sys.procedures
WHERE name IN (
    'sp_RegisterLocal',
    'sp_GetUserByEmail',
    'sp_VerifyEmail',
    'sp_ResendVerifyEmail',
    'sp_UpsertSocialUser',
    'sp_SaveRefreshToken',
    'sp_GetUserByRefreshToken',
    'sp_RevokeRefreshToken',
    'sp_CheckInVehicle',
    'sp_CheckOutVehicle',
    'sp_CreateReservation'
)
ORDER BY name;
GO

SELECT SlotID, SlotCode, SlotStatus
FROM ParkingSlots
ORDER BY SlotID;

GO
