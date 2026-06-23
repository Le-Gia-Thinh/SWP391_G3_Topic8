/* =====================================================================
   PARKING MANAGEMENT DB - FULL SETUP (HỢP NHẤT TỪ SCRIPT 1 -> 8)
   *** PHIÊN BẢN: v2 - FIX BATCH SP (2026-06-21) ***
   Chạy 1 lần từ đầu đến cuối. An toàn để chạy lại (idempotent ở mức tối đa).
   =====================================================================
   PHẦN A : DROP toàn bộ object (đúng thứ tự con -> cha)
   PHẦN B : CREATE core schema (tables, constraints, SP, trigger)
   PHẦN C : SAMPLE + TEST DATA core
   PHẦN D : MIGRATION PayOS (mở rộng Payments + SP/View thanh toán)
   PHẦN E : MIGRATION Incidents.Attachments + SP map/sync slot
   PHẦN F : MIGRATION Driver Features (Notifications, DriverVehicles, ServiceRatings)
   PHẦN G : SupportTickets + TicketReplies
   PHẦN H : Manager Reports (Views + SP)
   PHẦN I : Bổ sung cột + Mock data (SQLQuery8) + Walk-in guest
   PHẦN J : Vá dữ liệu + VERIFY
   ===================================================================== */

USE master;
GO

IF DB_ID('ParkingManagementDB') IS NULL
    CREATE DATABASE ParkingManagementDB;
GO

USE ParkingManagementDB;
GO
PRINT '>>> Dang chay script PHIEN BAN v2 (fix batch SP) <<<';
GO

/* =====================================================================
   PHẦN A: DROP OBJECT (con -> cha)
   ===================================================================== */

-- A1. Drop VIEWS
IF OBJECT_ID('vw_PaymentHistory',   'V') IS NOT NULL DROP VIEW vw_PaymentHistory;
IF OBJECT_ID('vw_RevenueByDay',      'V') IS NOT NULL DROP VIEW vw_RevenueByDay;
IF OBJECT_ID('vw_OccupancyByZone',   'V') IS NOT NULL DROP VIEW vw_OccupancyByZone;
GO

-- A2. Drop TRIGGERS
IF OBJECT_ID('TRG_NotifyOnPaymentComplete',             'TR') IS NOT NULL DROP TRIGGER TRG_NotifyOnPaymentComplete;
IF OBJECT_ID('TRG_AutoIncident',                        'TR') IS NOT NULL DROP TRIGGER TRG_AutoIncident;
IF OBJECT_ID('TRG_RecalculateSlotStatus_OnReservation', 'TR') IS NOT NULL DROP TRIGGER TRG_RecalculateSlotStatus_OnReservation;
IF OBJECT_ID('TRG_FreeSlotOnReservationCancel',         'TR') IS NOT NULL DROP TRIGGER TRG_FreeSlotOnReservationCancel;
IF OBJECT_ID('TRG_ReserveSlotOnReservation',            'TR') IS NOT NULL DROP TRIGGER TRG_ReserveSlotOnReservation;
IF OBJECT_ID('TRG_ValidateExitTime',                    'TR') IS NOT NULL DROP TRIGGER TRG_ValidateExitTime;
IF OBJECT_ID('TRG_UpdateSlotStatus',                    'TR') IS NOT NULL DROP TRIGGER TRG_UpdateSlotStatus;
IF OBJECT_ID('TRG_UpperPlateNumber',                    'TR') IS NOT NULL DROP TRIGGER TRG_UpperPlateNumber;
IF OBJECT_ID('TRG_AutoUpperVehicleName',                'TR') IS NOT NULL DROP TRIGGER TRG_AutoUpperVehicleName;
GO

-- A3. Drop STORED PROCEDURES
IF OBJECT_ID('sp_GetVehicleFlow',         'P') IS NOT NULL DROP PROCEDURE sp_GetVehicleFlow;
IF OBJECT_ID('sp_GetPeakHours',           'P') IS NOT NULL DROP PROCEDURE sp_GetPeakHours;
IF OBJECT_ID('sp_GetPaymentHistory',      'P') IS NOT NULL DROP PROCEDURE sp_GetPaymentHistory;
IF OBJECT_ID('sp_ConfirmSurcharge',       'P') IS NOT NULL DROP PROCEDURE sp_ConfirmSurcharge;
IF OBJECT_ID('sp_CheckOutWithSurcharge',  'P') IS NOT NULL DROP PROCEDURE sp_CheckOutWithSurcharge;
IF OBJECT_ID('sp_MarkPaymentPrepaid',     'P') IS NOT NULL DROP PROCEDURE sp_MarkPaymentPrepaid;
IF OBJECT_ID('sp_CreatePrepayment',       'P') IS NOT NULL DROP PROCEDURE sp_CreatePrepayment;
IF OBJECT_ID('sp_CalcParkingFee',         'P') IS NOT NULL DROP PROCEDURE sp_CalcParkingFee;
IF OBJECT_ID('sp_GetParkingMap',          'P') IS NOT NULL DROP PROCEDURE sp_GetParkingMap;
IF OBJECT_ID('sp_SyncParkingSlotStatuses','P') IS NOT NULL DROP PROCEDURE sp_SyncParkingSlotStatuses;
IF OBJECT_ID('sp_RevokeRefreshToken',     'P') IS NOT NULL DROP PROCEDURE sp_RevokeRefreshToken;
IF OBJECT_ID('sp_GetUserByRefreshToken',  'P') IS NOT NULL DROP PROCEDURE sp_GetUserByRefreshToken;
IF OBJECT_ID('sp_SaveRefreshToken',       'P') IS NOT NULL DROP PROCEDURE sp_SaveRefreshToken;
IF OBJECT_ID('sp_UpsertSocialUser',       'P') IS NOT NULL DROP PROCEDURE sp_UpsertSocialUser;
IF OBJECT_ID('sp_ResendVerifyEmail',      'P') IS NOT NULL DROP PROCEDURE sp_ResendVerifyEmail;
IF OBJECT_ID('sp_VerifyEmail',            'P') IS NOT NULL DROP PROCEDURE sp_VerifyEmail;
IF OBJECT_ID('sp_GetUserByEmail',         'P') IS NOT NULL DROP PROCEDURE sp_GetUserByEmail;
IF OBJECT_ID('sp_RegisterLocal',          'P') IS NOT NULL DROP PROCEDURE sp_RegisterLocal;
IF OBJECT_ID('sp_CreateReservation',      'P') IS NOT NULL DROP PROCEDURE sp_CreateReservation;
IF OBJECT_ID('sp_CheckOutVehicle',        'P') IS NOT NULL DROP PROCEDURE sp_CheckOutVehicle;
IF OBJECT_ID('sp_CheckInVehicle',         'P') IS NOT NULL DROP PROCEDURE sp_CheckInVehicle;
GO

-- A4. Drop CONSTRAINTS phụ thuộc cần xử lý trước (nếu còn)
IF OBJECT_ID('CK_Users_MinAge', 'C') IS NOT NULL
    ALTER TABLE Users DROP CONSTRAINT CK_Users_MinAge;
GO

-- A5. Drop TABLES (con -> cha)
IF OBJECT_ID('TicketReplies',     'U') IS NOT NULL DROP TABLE TicketReplies;
IF OBJECT_ID('SupportTickets',    'U') IS NOT NULL DROP TABLE SupportTickets;
IF OBJECT_ID('ServiceRatings',    'U') IS NOT NULL DROP TABLE ServiceRatings;
IF OBJECT_ID('DriverVehicles',    'U') IS NOT NULL DROP TABLE DriverVehicles;
IF OBJECT_ID('Notifications',     'U') IS NOT NULL DROP TABLE Notifications;
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
IF OBJECT_ID('AuditLogs',         'U') IS NOT NULL DROP TABLE AuditLogs;
IF OBJECT_ID('RefreshTokens',     'U') IS NOT NULL DROP TABLE RefreshTokens;
IF OBJECT_ID('UserAuthProviders', 'U') IS NOT NULL DROP TABLE UserAuthProviders;
IF OBJECT_ID('RolePermissions',   'U') IS NOT NULL DROP TABLE RolePermissions;
IF OBJECT_ID('Users',             'U') IS NOT NULL DROP TABLE Users;
IF OBJECT_ID('VehicleTypes',      'U') IS NOT NULL DROP TABLE VehicleTypes;
IF OBJECT_ID('Permissions',       'U') IS NOT NULL DROP TABLE Permissions;
IF OBJECT_ID('Roles',             'U') IS NOT NULL DROP TABLE Roles;
GO

/* =====================================================================
   PHẦN B: CREATE CORE SCHEMA
   ===================================================================== */

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

-- DriverID để NULL ngay từ đầu (hỗ trợ khách vãng lai - gộp từ SQLQuery8)
CREATE TABLE ParkingSessions (
    SessionID     INT IDENTITY(1,1) PRIMARY KEY,
    SlotID        INT NOT NULL,
    DriverID      INT NULL,
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

-- Payments: tạo luôn với đầy đủ cột PayOS (gộp migration PayOS)
CREATE TABLE Payments (
    PaymentID         INT IDENTITY(1,1) PRIMARY KEY,
    SessionID         INT NOT NULL UNIQUE,
    Amount            DECIMAL(10,2) NOT NULL,
    PaymentMethod     NVARCHAR(50),
    PaymentTime       DATETIME NULL,
    PaymentStatus     NVARCHAR(20) DEFAULT 'Pending',

    -- PayOS extension
    OrderCode         BIGINT NULL,
    PaymentLinkId     NVARCHAR(100) NULL,
    QrCode            NVARCHAR(MAX) NULL,
    CheckoutUrl       NVARCHAR(500) NULL,
    PrepaidAt         DATETIME NULL,
    SnapshotDurationH DECIMAL(10,2) NULL,
    PrepaidAmount     DECIMAL(10,2) NULL DEFAULT 0,
    SurchargeAmount   DECIMAL(10,2) NULL DEFAULT 0,
    FinalAmount       DECIMAL(10,2) NULL,
    SurchargeStatus   NVARCHAR(20) NULL DEFAULT 'None',
    SurchargePaidAt   DATETIME NULL,
    PaymentNote       NVARCHAR(500) NULL,

    FOREIGN KEY (SessionID) REFERENCES ParkingSessions(SessionID),
    CONSTRAINT CK_Payments_Amount CHECK (Amount >= 0),
    CONSTRAINT CK_Payments_Status CHECK (PaymentStatus IN ('Pending','Prepaid','Completed','Failed','Cancelled')),
    CONSTRAINT CK_Payments_SurchargeStatus CHECK (SurchargeStatus IN ('None','Pending','Completed'))
);
GO
CREATE INDEX IX_Payments_OrderCode ON Payments(OrderCode);
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

-- Incidents: DriverID NULL + cột Attachments (gộp migration)
CREATE TABLE Incidents (
    IncidentID      INT IDENTITY(1,1) PRIMARY KEY,
    SessionID       INT NULL,
    DriverID        INT NULL,
    IncidentType    NVARCHAR(50) NOT NULL,
    IncidentStatus  NVARCHAR(20) DEFAULT 'Open',
    Priority        NVARCHAR(20) DEFAULT 'Normal',
    Description     NVARCHAR(500),
    Attachments     NVARCHAR(MAX) NULL,
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

-- Notifications (Driver Features)
CREATE TABLE Notifications (
    NotificationID   INT IDENTITY(1,1) PRIMARY KEY,
    UserID           INT NOT NULL,
    Title            NVARCHAR(200) NOT NULL,
    Message          NVARCHAR(500) NOT NULL,
    NotificationType NVARCHAR(50) NOT NULL,
    ReferenceID      INT NULL,
    ReferenceType    NVARCHAR(50) NULL,
    IsRead           BIT NOT NULL DEFAULT 0,
    CreatedAt        DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_Notifications_User FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT CK_NotificationType CHECK (NotificationType IN ('booking','session','payment','incident','system')),
    CONSTRAINT CK_ReferenceType CHECK (ReferenceType IS NULL OR ReferenceType IN ('reservation','session','payment','incident'))
);
GO
CREATE INDEX IX_Notifications_UserID ON Notifications(UserID);
CREATE INDEX IX_Notifications_UserID_IsRead ON Notifications(UserID, IsRead);
CREATE INDEX IX_Notifications_CreatedAt ON Notifications(CreatedAt DESC);
GO

-- DriverVehicles (Driver Features) + IsDefault (gộp SQLQuery8)
CREATE TABLE DriverVehicles (
    VehicleID     INT IDENTITY(1,1) PRIMARY KEY,
    DriverID      INT NOT NULL,
    PlateNumber   NVARCHAR(20) NOT NULL,
    VehicleTypeID INT NOT NULL,
    VehicleBrand  NVARCHAR(100) NULL,
    VehicleColor  NVARCHAR(50) NULL,
    IsActive      BIT NOT NULL DEFAULT 1,
    IsDefault     BIT NOT NULL DEFAULT 0,
    CreatedAt     DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt     DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_DriverVehicles_Driver FOREIGN KEY (DriverID) REFERENCES Users(UserID),
    CONSTRAINT FK_DriverVehicles_VehicleType FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID)
);
GO
CREATE INDEX IX_DriverVehicles_DriverID ON DriverVehicles(DriverID);
GO

-- ServiceRatings (Driver Features) + Tags (gộp SQLQuery8)
CREATE TABLE ServiceRatings (
    RatingID     INT IDENTITY(1,1) PRIMARY KEY,
    SessionID    INT NOT NULL,
    DriverID     INT NOT NULL,
    Rating       INT NOT NULL,
    Comment      NVARCHAR(500) NULL,
    Tags         NVARCHAR(500) NULL,
    CreatedAt    DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_ServiceRatings_Session FOREIGN KEY (SessionID) REFERENCES ParkingSessions(SessionID),
    CONSTRAINT FK_ServiceRatings_Driver FOREIGN KEY (DriverID) REFERENCES Users(UserID),
    CONSTRAINT CK_RatingValue CHECK (Rating BETWEEN 1 AND 5)
);
GO
CREATE UNIQUE INDEX UQ_ServiceRatings_Session ON ServiceRatings(SessionID);
CREATE INDEX IX_ServiceRatings_DriverID ON ServiceRatings(DriverID);
GO

-- SupportTickets + TicketReplies
CREATE TABLE SupportTickets (
    TicketID  INT IDENTITY(1,1) PRIMARY KEY,
    DriverID  INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    Subject   NVARCHAR(200) NOT NULL,
    Content   NVARCHAR(MAX) NOT NULL,
    Status    VARCHAR(20) DEFAULT 'Open'
              CHECK (Status IN ('Open','Pending','Resolved','Closed')),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE TicketReplies (
    ReplyID   INT IDENTITY(1,1) PRIMARY KEY,
    TicketID  INT NOT NULL FOREIGN KEY REFERENCES SupportTickets(TicketID),
    SenderID  INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    Content   NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Constraint tuổi tối thiểu cho Staff/Manager
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

/* =====================================================================
   PHẦN B (tiếp): STORED PROCEDURES CORE
   ===================================================================== */

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
        1, 1, 0, @EmailVerifyToken, @EmailVerifyExpires
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
            SELECT 1 FROM UserAuthProviders
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
        SELECT @UserID = UserID, @IsEmailVerified = IsEmailVerified
        FROM Users WHERE Email = @Email;

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
        INSERT INTO Users (FullName, Email, PasswordHash, RoleID, AvatarUrl, IsActive, IsEmailVerified)
        VALUES (@FullName, @Email, NULL, 1, @AvatarUrl, 1, 1);
        SET @UserID = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE Users
        SET AvatarUrl = ISNULL(@AvatarUrl, AvatarUrl), UpdatedAt = GETDATE()
        WHERE UserID = @UserID;
    END

    IF NOT EXISTS (
        SELECT 1 FROM UserAuthProviders
        WHERE UserID = @UserID AND ProviderName = @ProviderName
    )
    BEGIN
        INSERT INTO UserAuthProviders (UserID, ProviderName, ProviderUserID, ProviderEmail)
        VALUES (@UserID, @ProviderName, @ProviderUserID, @Email);
    END

    SELECT
        u.UserID, u.FullName, u.Email, u.PhoneNumber,
        u.RoleID, r.RoleName, u.IsActive, u.IsEmailVerified,
        u.AvatarUrl, @IsNewLink AS IsNewLink
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

    DELETE FROM RefreshTokens
    WHERE UserID = @UserID
      AND (RevokedAt IS NOT NULL
           OR ExpiresAt < GETUTCDATE()
           OR SessionExpiresAt < GETUTCDATE());

    INSERT INTO RefreshTokens (UserID, TokenHash, ExpiresAt, SessionExpiresAt, CreatedByIp)
    VALUES (@UserID, @TokenHash, @ExpiresAt, @SessionExpiresAt, @CreatedByIp);
END
GO

CREATE PROCEDURE sp_GetUserByRefreshToken
    @TokenHash NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        u.UserID, u.FullName, u.Email, u.PhoneNumber,
        u.RoleID, r.RoleName, u.IsActive, u.IsEmailVerified,
        u.AvatarUrl, rt.SessionExpiresAt
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
    WHERE TokenHash = @TokenHash AND RevokedAt IS NULL;

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

    SELECT @SlotStatus = SlotStatus FROM ParkingSlots WHERE SlotID = @SlotID;

    IF @SlotStatus IS NULL OR @SlotStatus <> 'Available'
    BEGIN
        RAISERROR('Slot not available.', 16, 1);
        RETURN;
    END

    INSERT INTO ParkingSessions (SlotID, DriverID, PlateNumber, VehicleTypeID, EntryTime, SessionStatus)
    VALUES (@SlotID, @DriverID, UPPER(@PlateNumber), @VehicleTypeID, GETDATE(), 'Active');

    SET @SessionID = SCOPE_IDENTITY();

    SELECT TOP 1 @Fee = Fee
    FROM PricingPolicies
    WHERE VehicleTypeID = @VehicleTypeID AND MinHours = 0 AND IsActive = 1
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

    SELECT @EntryTime = EntryTime, @VehicleTypeID = VehicleTypeID
    FROM ParkingSessions
    WHERE SessionID = @SessionID AND SessionStatus = 'Active';

    IF @EntryTime IS NULL
    BEGIN
        RAISERROR('Session not found or already completed.', 16, 1);
        RETURN;
    END

    SET @ExitTime = GETDATE();
    SET @DurationH = DATEDIFF(MINUTE, @EntryTime, @ExitTime) / 60.0;

    SELECT TOP 1 @Fee = Fee
    FROM PricingPolicies
    WHERE VehicleTypeID = @VehicleTypeID AND IsActive = 1
      AND ((IsOvernight = 1 AND @DurationH > 8) OR (@DurationH BETWEEN MinHours AND MaxHours))
    ORDER BY IsOvernight DESC, MaxHours;

    IF @Fee IS NULL SET @Fee = 0;

    UPDATE ParkingSessions
    SET ExitTime = @ExitTime, SessionStatus = 'Completed'
    WHERE SessionID = @SessionID;

    UPDATE Payments
    SET Amount = @Fee, PaymentMethod = @PaymentMethod,
        PaymentTime = @ExitTime, PaymentStatus = 'Completed'
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
        SELECT 1 FROM Reservations
        WHERE SlotID = @SlotID
          AND ReservationStatus = 'Reserved'
          AND @StartTime < EndTime
          AND @EndTime > StartTime
    )
    BEGIN
        RAISERROR('Slot already reserved in this time range.', 16, 1);
        RETURN;
    END

    INSERT INTO Reservations (DriverID, VehicleTypeID, SlotID, ReservationDate, StartTime, EndTime, ReservationStatus)
    VALUES (@DriverID, @VehicleTypeID, @SlotID, @ReservationDate, @StartTime, @EndTime, 'Reserved');
END
GO

/* =====================================================================
   PHẦN B (tiếp): TRIGGERS CORE
   ===================================================================== */

CREATE TRIGGER TRG_AutoUpperVehicleName
ON VehicleTypes
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE vt SET vt.VehicleName = UPPER(vt.VehicleName)
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
    UPDATE ps SET ps.PlateNumber = UPPER(ps.PlateNumber)
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
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.ExitTime IS NOT NULL AND i.ExitTime <= i.EntryTime)
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
            WHEN EXISTS (SELECT 1 FROM ParkingSessions s WHERE s.SlotID = ps.SlotID AND s.SessionStatus = 'Active') THEN 'Occupied'
            WHEN EXISTS (SELECT 1 FROM Reservations r WHERE r.SlotID = ps.SlotID AND r.ReservationStatus = 'Reserved') THEN 'Reserved'
            ELSE 'Available'
        END
    FROM ParkingSlots ps
    WHERE ps.SlotID IN (SELECT DISTINCT i.SlotID FROM inserted i WHERE i.SlotID IS NOT NULL);
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
            WHEN EXISTS (SELECT 1 FROM ParkingSessions s WHERE s.SlotID = ps.SlotID AND s.SessionStatus = 'Active') THEN 'Occupied'
            WHEN EXISTS (SELECT 1 FROM Reservations r WHERE r.SlotID = ps.SlotID AND r.ReservationStatus = 'Reserved') THEN 'Reserved'
            ELSE 'Available'
        END
    FROM ParkingSlots ps
    WHERE ps.SlotID IN (SELECT DISTINCT i.SlotID FROM inserted i WHERE i.SlotID IS NOT NULL);
END
GO

CREATE TRIGGER TRG_AutoIncident
ON ParkingSessions
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Incidents (SessionID, DriverID, IncidentType, IncidentStatus, Priority, Description, CreatedAt, UpdatedAt)
    SELECT i.SessionID, i.DriverID, 'Lost Ticket', 'Open', 'Normal', 'Auto-created lost ticket', GETDATE(), GETDATE()
    FROM inserted i
    WHERE i.SessionStatus = 'Lost'
      AND NOT EXISTS (
          SELECT 1 FROM Incidents inc
          WHERE inc.SessionID = i.SessionID
            AND inc.IncidentType = 'Lost Ticket'
            AND inc.IncidentStatus IN ('Open','InProgress')
      );
END
GO

/* =====================================================================
   PHẦN C: SAMPLE + TEST DATA CORE
   ===================================================================== */

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

INSERT INTO Users (FullName, Email, PasswordHash, PhoneNumber, RoleID, DateOfBirth, HireDate, IsActive, IsEmailVerified)
VALUES
('Alice Driver',  'alice@email.com',  '$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2', '0901000001', 1, NULL,         NULL,         1, 1),
('Bob Staff',     'bob@email.com',    '$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2', '0901000002', 2, '1990-05-10', '2015-06-01', 1, 1),
('Carol Manager', 'carol@email.com',  '$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2', '0901000003', 3, '1985-03-20', '2010-04-15', 1, 1),
('David Driver',  'david@email.com',  '$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2', '0901000004', 1, NULL,         NULL,         1, 1),
('Eve Driver',    'eve@email.com',    '$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2', '0901000005', 1, NULL,         NULL,         1, 1),
('Grace Admin',   'admin@parking.com','$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2', '0901000007', 4, '1990-01-01', '2023-01-01', 1, 1);
GO

INSERT INTO UserAuthProviders (UserID, ProviderName, ProviderUserID, ProviderEmail)
SELECT UserID, 'local', CAST(UserID AS NVARCHAR(200)), Email
FROM Users WHERE PasswordHash IS NOT NULL;
GO

INSERT INTO VehicleTypes (VehicleCode, VehicleName, Description) VALUES
('MOTO',  'Motorbike', 'Motorcycles and scooters'),
('CAR',   'Car',       'Passenger cars'),
('TRUCK', 'Truck',     'Light trucks');
GO

INSERT INTO PricingPolicies (VehicleTypeID, MinHours, MaxHours, Fee, IsOvernight, IsActive) VALUES
(1, 0, 3,   4000,  0, 1),
(1, 3, 8,   8000,  0, 1),
(1, 8, 24,  15000, 1, 1),
(2, 0, 3,   6000,  0, 1),
(2, 3, 8,   12000, 0, 1),
(2, 8, 24,  25000, 1, 1),
(3, 0, 3,   10000, 0, 1),
(3, 3, 8,   20000, 0, 1);
GO

INSERT INTO Buildings (BuildingName, Address, OperatingHours, TotalFloors) VALUES
('Toa A', '123 Nguyen Van Linh, Q7', '06:00-22:00', 3),
('Toa B', '456 Le Van Viet, Q9',     '00:00-23:59', 2);
GO

INSERT INTO Floors (BuildingID, FloorName) VALUES
(1, 'Tang 1'), (1, 'Tang 2'), (1, 'Tang 3'),
(2, 'Tang 1'), (2, 'Tang 2');
GO

INSERT INTO Zones (FloorID, ZoneName, AllowedVehicleTypeID, TotalSlots) VALUES
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
(1, 'A-M-01', 1), (1, 'A-M-02', 1), (1, 'A-M-03', 1), (1, 'A-M-04', 1), (1, 'A-M-05', 1),
(2, 'A-C-01', 2), (2, 'A-C-02', 2), (2, 'A-C-03', 2), (2, 'A-C-04', 2), (2, 'A-C-05', 2),
(3, 'B-M-01', 1), (3, 'B-M-02', 1), (3, 'B-M-03', 1), (3, 'B-M-04', 1), (3, 'B-M-05', 1),
(4, 'B-C-01', 2), (4, 'B-C-02', 2), (4, 'B-C-03', 2), (4, 'B-C-04', 2), (4, 'B-C-05', 2);
GO

-- Test sessions
INSERT INTO ParkingSessions (SlotID, DriverID, PlateNumber, VehicleTypeID, EntryTime, SessionStatus) VALUES
(1, 1, '29A-12345', 1, GETDATE(),                  'Active'),
(6, 1, '29A-54321', 2, GETDATE(),                  'Active'),
(2, 1, '29A-56789', 1, DATEADD(HOUR, -2, GETDATE()), 'Active'),
(7, 1, '29A-98765', 2, DATEADD(HOUR, -3, GETDATE()), 'Active');
GO

INSERT INTO Payments (SessionID, Amount, PaymentMethod, PaymentStatus) VALUES
(1, 4000, 'Cash', 'Pending'),
(2, 6000, 'Cash', 'Pending'),
(3, 4000, 'Cash', 'Pending'),
(4, 6000, 'Cash', 'Pending');
GO

INSERT INTO Reservations (DriverID, VehicleTypeID, SlotID, ReservationDate, StartTime, EndTime, ReservationStatus) VALUES
(1, 1, 3, CAST(GETDATE() AS DATE), DATEADD(HOUR, 1, GETDATE()), DATEADD(HOUR, 4, GETDATE()), 'Reserved'),
(1, 2, 8, CAST(GETDATE() AS DATE), DATEADD(HOUR, 2, GETDATE()), DATEADD(HOUR, 5, GETDATE()), 'Reserved'),
(1, 1, 4, CAST(GETDATE() AS DATE), DATEADD(HOUR, 1, GETDATE()), DATEADD(HOUR, 4, GETDATE()), 'Reserved'),
(1, 2, 9, CAST(GETDATE() AS DATE), DATEADD(HOUR, 2, GETDATE()), DATEADD(HOUR, 5, GETDATE()), 'Reserved');
GO

INSERT INTO Incidents (SessionID, DriverID, IncidentType, IncidentStatus, Priority, Description, AssignedStaffID) VALUES
(1, 1, 'Lost Ticket', 'Open', 'Normal', 'Customer lost ticket for slot 1',  2),
(2, 1, 'Overdue',     'Open', 'High',   'Vehicle parked over allowed time', 2),
(3, 1, 'Wrong Slot',  'Open', 'Normal', 'Vehicle parked in wrong slot',     2),
(4, 1, 'Lost Ticket', 'Open', 'High',   'Customer lost ticket urgent',      2);
GO

INSERT INTO Feedbacks (DriverID, IncidentID, FeedbackType, Description, FeedbackStatus) VALUES
(1, 1, 'Complaint', 'Lost ticket handling issue',  'Open'),
(1, 2, 'Complaint', 'Overdue fee unclear',         'Open'),
(1, 3, 'Complaint', 'Wrong slot problem',          'Open'),
(1, 4, 'Complaint', 'Lost ticket urgent follow-up','Open');
GO

-- Đồng bộ slot status ban đầu
UPDATE ps
SET ps.SlotStatus =
    CASE
        WHEN ps.SlotStatus IN ('Maintenance','Blocked') THEN ps.SlotStatus
        WHEN EXISTS (SELECT 1 FROM ParkingSessions s WHERE s.SlotID = ps.SlotID AND s.SessionStatus = 'Active') THEN 'Occupied'
        WHEN EXISTS (SELECT 1 FROM Reservations r WHERE r.SlotID = ps.SlotID AND r.ReservationStatus = 'Reserved') THEN 'Reserved'
        ELSE 'Available'
    END
FROM ParkingSlots ps;
GO

/* =====================================================================
   PHẦN D: PAYOS - View & SP thanh toán
   (Cột Payments đã tạo sẵn ở PHẦN B nên ở đây chỉ tạo logic)
   ===================================================================== */

-- Giá test 2,000đ cho 3 loại xe (MinHours=0, MaxHours=999)
INSERT INTO PricingPolicies (VehicleTypeID, MinHours, MaxHours, Fee, IsOvernight, IsActive)
SELECT vt.VehicleTypeID, 0, 999, 2000, 0, 1
FROM VehicleTypes vt
WHERE NOT EXISTS (
    SELECT 1 FROM PricingPolicies pp
    WHERE pp.VehicleTypeID = vt.VehicleTypeID
      AND pp.Fee = 2000 AND pp.MinHours = 0 AND pp.MaxHours = 999
);
GO

CREATE VIEW vw_PaymentHistory AS
SELECT
    p.PaymentID, p.SessionID, p.OrderCode,
    p.Amount, p.PrepaidAmount, p.SurchargeAmount, p.FinalAmount,
    p.PaymentMethod, p.PaymentStatus, p.SurchargeStatus,
    p.PrepaidAt, p.PaymentTime, p.SurchargePaidAt,
    p.SnapshotDurationH, p.PaymentNote,
    ps.PlateNumber, ps.EntryTime, ps.ExitTime, ps.SessionStatus, ps.DriverID,
    vt.VehicleName, vt.VehicleCode,
    sl.SlotCode, z.ZoneName, f.FloorName, b.BuildingName,
    u.FullName AS DriverName, u.Email AS DriverEmail,
    DATEDIFF(MINUTE, ps.EntryTime,
        CASE WHEN ps.ExitTime IS NOT NULL THEN ps.ExitTime ELSE GETDATE() END
    ) AS ParkingMinutes
FROM Payments p
JOIN ParkingSessions ps ON p.SessionID     = ps.SessionID
JOIN VehicleTypes    vt ON ps.VehicleTypeID = vt.VehicleTypeID
JOIN ParkingSlots    sl ON ps.SlotID        = sl.SlotID
JOIN Zones           z  ON sl.ZoneID        = z.ZoneID
JOIN Floors          f  ON z.FloorID        = f.FloorID
JOIN Buildings       b  ON f.BuildingID     = b.BuildingID
LEFT JOIN Users      u  ON ps.DriverID      = u.UserID;
GO

CREATE PROCEDURE sp_CalcParkingFee
    @VehicleTypeID INT,
    @DurationH     DECIMAL(10,2),
    @Fee           DECIMAL(10,2) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 @Fee = Fee
    FROM PricingPolicies
    WHERE VehicleTypeID = @VehicleTypeID AND IsActive = 1
      AND ((IsOvernight = 1 AND @DurationH > 8) OR (@DurationH BETWEEN MinHours AND MaxHours))
    ORDER BY IsOvernight DESC, MaxHours;

    IF @Fee IS NULL SET @Fee = 2000;
    IF @Fee < 2000  SET @Fee = 2000;
END
GO

CREATE PROCEDURE sp_CreatePrepayment
    @SessionID     INT,
    @OrderCode     BIGINT,
    @Amount        DECIMAL(10,2),
    @SnapshotH     DECIMAL(10,2),
    @QrCode        NVARCHAR(MAX)  = NULL,
    @CheckoutUrl   NVARCHAR(500)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM ParkingSessions WHERE SessionID = @SessionID AND SessionStatus = 'Active')
    BEGIN
        RAISERROR('Session không tồn tại hoặc không active.', 16, 1);
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM Payments WHERE SessionID = @SessionID)
    BEGIN
        UPDATE Payments
        SET OrderCode = @OrderCode, Amount = @Amount, SnapshotDurationH = @SnapshotH,
            QrCode = @QrCode, CheckoutUrl = @CheckoutUrl,
            PaymentMethod = 'Banking', PaymentStatus = 'Pending',
            PrepaidAt = NULL, PrepaidAmount = 0, SurchargeAmount = 0,
            FinalAmount = NULL, SurchargeStatus = 'None'
        WHERE SessionID = @SessionID;
    END
    ELSE
    BEGIN
        INSERT INTO Payments (SessionID, Amount, PaymentMethod, PaymentStatus,
            OrderCode, SnapshotDurationH, QrCode, CheckoutUrl,
            PrepaidAmount, SurchargeAmount, SurchargeStatus)
        VALUES (@SessionID, @Amount, 'Banking', 'Pending',
            @OrderCode, @SnapshotH, @QrCode, @CheckoutUrl, 0, 0, 'None');
    END

    SELECT p.PaymentID, p.SessionID, p.OrderCode, p.Amount, p.PaymentStatus, p.SnapshotDurationH
    FROM Payments p WHERE p.SessionID = @SessionID;
END
GO

CREATE PROCEDURE sp_MarkPaymentPrepaid
    @OrderCode BIGINT,
    @PaidAt    DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @PaidAt IS NULL SET @PaidAt = GETDATE();

    DECLARE @SessionID INT;
    SELECT @SessionID = SessionID
    FROM Payments WHERE OrderCode = @OrderCode AND PaymentStatus = 'Pending';

    IF @SessionID IS NULL
    BEGIN
        SELECT 0 AS Updated;
        RETURN;
    END

    DECLARE @Amount DECIMAL(10,2), @SnapshotH DECIMAL(10,2);
    SELECT @Amount = Amount, @SnapshotH = SnapshotDurationH FROM Payments WHERE SessionID = @SessionID;

    UPDATE Payments
    SET PaymentStatus = 'Prepaid', PrepaidAmount = @Amount, PrepaidAt = @PaidAt, PaymentTime = @PaidAt
    WHERE SessionID = @SessionID;

    SELECT @SessionID AS SessionID, @Amount AS PrepaidAmount, 1 AS Updated;
END
GO

CREATE PROCEDURE sp_CheckOutWithSurcharge
    @SessionID     INT,
    @PaymentMethod NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    DECLARE @EntryTime DATETIME, @ExitTime DATETIME = GETDATE();
    DECLARE @VehicleTypeID INT, @DurationH DECIMAL(10,2);
    DECLARE @FinalFee DECIMAL(10,2), @PrepaidAmount DECIMAL(10,2) = 0;
    DECLARE @PayStatus NVARCHAR(20);

    SELECT @EntryTime = EntryTime, @VehicleTypeID = VehicleTypeID
    FROM ParkingSessions WHERE SessionID = @SessionID AND SessionStatus = 'Active';

    IF @EntryTime IS NULL
    BEGIN
        ROLLBACK;
        RAISERROR('Session không tồn tại hoặc đã checkout.', 16, 1);
        RETURN;
    END

    SET @DurationH = DATEDIFF(MINUTE, @EntryTime, @ExitTime) / 60.0;

    EXEC sp_CalcParkingFee @VehicleTypeID = @VehicleTypeID, @DurationH = @DurationH, @Fee = @FinalFee OUTPUT;

    SELECT @PrepaidAmount = ISNULL(PrepaidAmount, 0), @PayStatus = PaymentStatus
    FROM Payments WHERE SessionID = @SessionID;

    DECLARE @Surcharge DECIMAL(10,2) = @FinalFee - @PrepaidAmount;
    IF @Surcharge < 0 SET @Surcharge = 0;

    UPDATE ParkingSessions SET ExitTime = @ExitTime, SessionStatus = 'Completed' WHERE SessionID = @SessionID;

    IF @PayStatus = 'Prepaid'
    BEGIN
        IF @Surcharge > 0
        BEGIN
            UPDATE Payments
            SET FinalAmount = @FinalFee, SurchargeAmount = @Surcharge,
                SurchargeStatus = 'Pending', PaymentStatus = 'Prepaid',
                PaymentNote = CONCAT('Prepaid: ', @PrepaidAmount, ' VND. Surcharge: ', @Surcharge, ' VND')
            WHERE SessionID = @SessionID;
        END
        ELSE
        BEGIN
            UPDATE Payments
            SET FinalAmount = @FinalFee, SurchargeAmount = 0, SurchargeStatus = 'None',
                PaymentStatus = 'Completed', PaymentMethod = 'Banking',
                PaymentNote = CONCAT('Prepaid full: ', @PrepaidAmount, ' VND')
            WHERE SessionID = @SessionID;
        END
    END
    ELSE
    BEGIN
        UPDATE Payments
        SET Amount = @FinalFee, FinalAmount = @FinalFee, SurchargeAmount = 0,
            SurchargeStatus = 'None', PaymentMethod = @PaymentMethod,
            PaymentTime = @ExitTime, PaymentStatus = 'Completed'
        WHERE SessionID = @SessionID;
    END

    COMMIT;

    SELECT
        ps.SessionID, ps.PlateNumber, ps.EntryTime, ps.ExitTime, ps.VehicleTypeID,
        @DurationH AS DurationH, @FinalFee AS FinalFee, @PrepaidAmount AS PrepaidAmount,
        @Surcharge AS SurchargeAmount, p.PaymentStatus, p.SurchargeStatus, p.PaymentNote,
        vt.VehicleName
    FROM ParkingSessions ps
    JOIN Payments p ON ps.SessionID = p.SessionID
    JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
    WHERE ps.SessionID = @SessionID;
END
GO

CREATE PROCEDURE sp_ConfirmSurcharge
    @SessionID     INT,
    @PaymentMethod NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM Payments WHERE SessionID = @SessionID AND SurchargeStatus = 'Pending')
    BEGIN
        RAISERROR('Không có khoản phụ trội cần thu.', 16, 1);
        RETURN;
    END

    UPDATE Payments
    SET PaymentStatus = 'Completed', SurchargeStatus = 'Completed',
        SurchargePaidAt = GETDATE(), PaymentMethod = @PaymentMethod
    WHERE SessionID = @SessionID;

    SELECT p.PaymentID, p.SessionID, p.FinalAmount, p.PrepaidAmount,
           p.SurchargeAmount, p.PaymentStatus, p.SurchargeStatus
    FROM Payments p WHERE p.SessionID = @SessionID;
END
GO

CREATE PROCEDURE sp_GetPaymentHistory
    @DriverID INT,
    @Limit    INT = 20,
    @Offset   INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        v.*,
        CASE
            WHEN v.SurchargeAmount > 0 THEN
                CONCAT('Trả trước: ', FORMAT(v.PrepaidAmount,'N0','vi-VN'), ' VNĐ. Phụ trội: ', FORMAT(v.SurchargeAmount,'N0','vi-VN'), ' VNĐ')
            WHEN v.PrepaidAmount > 0 THEN
                CONCAT('Đã thanh toán QR: ', FORMAT(v.PrepaidAmount,'N0','vi-VN'), ' VNĐ')
            ELSE ''
        END AS PaymentSummary
    FROM vw_PaymentHistory v
    WHERE v.DriverID = @DriverID
    ORDER BY CASE WHEN v.PrepaidAt IS NOT NULL THEN v.PrepaidAt ELSE v.PaymentTime END DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
END
GO

/* =====================================================================
   PHẦN E: SP Sync slot + Parking map
   (Cột Incidents.Attachments đã tạo sẵn ở PHẦN B)
   ===================================================================== */
GO
IF OBJECT_ID('sp_SyncParkingSlotStatuses','P') IS NOT NULL DROP PROCEDURE sp_SyncParkingSlotStatuses;
GO
CREATE PROCEDURE sp_SyncParkingSlotStatuses
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Reservations
    SET ReservationStatus = 'Expired'
    WHERE ReservationStatus = 'Reserved' AND EndTime < GETDATE();

    UPDATE ps
    SET ps.SlotStatus =
        CASE
            WHEN ps.SlotStatus IN ('Maintenance', 'Blocked') THEN ps.SlotStatus
            WHEN EXISTS (SELECT 1 FROM ParkingSessions s WHERE s.SlotID = ps.SlotID AND s.SessionStatus = 'Active' AND s.ExitTime IS NULL) THEN 'Occupied'
            WHEN EXISTS (SELECT 1 FROM Reservations r WHERE r.SlotID = ps.SlotID AND r.ReservationStatus = 'Reserved' AND r.EndTime >= GETDATE()) THEN 'Reserved'
            ELSE 'Available'
        END
    FROM ParkingSlots ps
    WHERE ps.SlotStatus IN ('Available', 'Occupied', 'Reserved');
END
GO

GO
IF OBJECT_ID('sp_GetParkingMap','P') IS NOT NULL DROP PROCEDURE sp_GetParkingMap;
GO
CREATE PROCEDURE sp_GetParkingMap
    @buildingId    INT           = NULL,
    @floorId       INT           = NULL,
    @vehicleTypeId INT           = NULL,
    @status        NVARCHAR(20)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT b.BuildingID, b.BuildingName, b.Address, b.OperatingHours
    FROM Buildings b
    WHERE (@buildingId IS NULL OR b.BuildingID = @buildingId)
    ORDER BY b.BuildingID
    FOR JSON PATH, ROOT('buildings');

    SELECT f.FloorID, f.BuildingID, f.FloorName, f.IsActive
    FROM Floors f
    JOIN Buildings b ON f.BuildingID = b.BuildingID
    WHERE f.IsActive = 1
      AND (@buildingId IS NULL OR f.BuildingID = @buildingId)
      AND (@floorId IS NULL OR f.FloorID = @floorId)
    ORDER BY f.BuildingID, f.FloorID;

    SELECT z.ZoneID, z.FloorID, z.ZoneName, z.AllowedVehicleTypeID, z.TotalSlots,
           vt.VehicleCode, vt.VehicleName
    FROM Zones z
    JOIN VehicleTypes vt ON z.AllowedVehicleTypeID = vt.VehicleTypeID
    JOIN Floors f ON z.FloorID = f.FloorID
    WHERE f.IsActive = 1
      AND (@buildingId IS NULL OR f.BuildingID = @buildingId)
      AND (@floorId IS NULL OR z.FloorID = @floorId)
      AND (@vehicleTypeId IS NULL OR z.AllowedVehicleTypeID = @vehicleTypeId)
    ORDER BY z.FloorID, z.ZoneID;

    SELECT
        ps.SlotID, ps.ZoneID, ps.SlotCode, ps.VehicleTypeID,
        vt.VehicleCode, vt.VehicleName,
        sess.SessionID, sess.PlateNumber, sess.EntryTime, sess.SessionStatus,
        rsv.ReservationID, rsv.StartTime, rsv.EndTime, rsv.ReservationStatus,
        driver.FullName AS DriverName, driver.Email AS DriverEmail, driver.PhoneNumber AS DriverPhone,
        CASE
            WHEN ps.SlotStatus IN ('Maintenance', 'Blocked') THEN ps.SlotStatus
            WHEN EXISTS (SELECT 1 FROM ParkingSessions s WHERE s.SlotID = ps.SlotID AND s.SessionStatus = 'Active') THEN 'Occupied'
            WHEN EXISTS (SELECT 1 FROM Reservations r WHERE r.SlotID = ps.SlotID AND r.ReservationStatus IN ('Reserved', 'Completed')) THEN 'Reserved'
            ELSE 'Available'
        END AS SlotStatus
    FROM ParkingSlots ps
    JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
    JOIN Zones z          ON ps.ZoneID = z.ZoneID
    JOIN Floors f         ON z.FloorID = f.FloorID
    LEFT JOIN (
        SELECT TOP 1 WITH TIES SlotID, SessionID, PlateNumber, EntryTime, SessionStatus
        FROM ParkingSessions
        WHERE SessionStatus = 'Active'
        ORDER BY ROW_NUMBER() OVER (PARTITION BY SlotID ORDER BY EntryTime DESC)
    ) sess ON sess.SlotID = ps.SlotID
    LEFT JOIN (
        SELECT * FROM Reservations r WHERE r.ReservationStatus IN ('Reserved', 'Completed')
    ) rsv ON rsv.SlotID = ps.SlotID
    LEFT JOIN Users driver ON driver.UserID = rsv.DriverID
    WHERE f.IsActive = 1
      AND (@buildingId    IS NULL OR f.BuildingID     = @buildingId)
      AND (@floorId       IS NULL OR z.FloorID        = @floorId)
      AND (@vehicleTypeId IS NULL OR ps.VehicleTypeID = @vehicleTypeId)
      AND (@status IS NULL OR
           CASE
               WHEN ps.SlotStatus IN ('Maintenance', 'Blocked') THEN ps.SlotStatus
               WHEN EXISTS (SELECT 1 FROM ParkingSessions s WHERE s.SlotID = ps.SlotID AND s.SessionStatus = 'Active') THEN 'Occupied'
               WHEN EXISTS (SELECT 1 FROM Reservations r WHERE r.SlotID = ps.SlotID AND r.ReservationStatus IN ('Reserved', 'Completed')) THEN 'Reserved'
               ELSE 'Available'
           END = @status)
    ORDER BY z.ZoneID, ps.SlotCode;
END
GO

/* =====================================================================
   PHẦN F: DRIVER FEATURES - Trigger Notifications
   (Bảng Notifications/DriverVehicles/ServiceRatings đã tạo ở PHẦN B)
   ===================================================================== */

CREATE TRIGGER TRG_NotifyOnPaymentComplete
ON Payments
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType, CreatedAt)
    SELECT
        s.DriverID,
        N'Thanh toán thành công',
        N'Thanh toán ' + FORMAT(i.Amount, 'N0') + N'đ cho phiên gửi xe ' + s.PlateNumber + N' đã hoàn tất.',
        'payment', i.PaymentID, 'payment', GETDATE()
    FROM inserted i
    JOIN ParkingSessions s ON i.SessionID = s.SessionID
    WHERE i.PaymentStatus = 'Completed'
      AND s.DriverID IS NOT NULL
      AND (EXISTS (SELECT 1 FROM deleted d WHERE d.PaymentID = i.PaymentID AND d.PaymentStatus <> 'Completed')
           OR NOT EXISTS (SELECT 1 FROM deleted d WHERE d.PaymentID = i.PaymentID));
END
GO

/* =====================================================================
   PHẦN H: MANAGER REPORTS - Views & SP
   ===================================================================== */

CREATE VIEW vw_RevenueByDay AS
SELECT
    CAST(ISNULL(p.PaymentTime, p.SurchargePaidAt) AS DATE) AS RevenueDate,
    COUNT(*)                                               AS TransactionCount,
    SUM(ISNULL(p.FinalAmount, p.Amount))                   AS TotalRevenue,
    SUM(CASE WHEN p.PaymentMethod = 'Cash'    THEN ISNULL(p.FinalAmount, p.Amount) ELSE 0 END) AS CashRevenue,
    SUM(CASE WHEN p.PaymentMethod = 'Banking' THEN ISNULL(p.FinalAmount, p.Amount) ELSE 0 END) AS BankingRevenue
FROM Payments p
WHERE p.PaymentStatus IN ('Completed', 'Prepaid')
  AND ISNULL(p.PaymentTime, p.SurchargePaidAt) IS NOT NULL
GROUP BY CAST(ISNULL(p.PaymentTime, p.SurchargePaidAt) AS DATE);
GO

CREATE VIEW vw_OccupancyByZone AS
SELECT
    b.BuildingID, b.BuildingName, f.FloorID, f.FloorName,
    z.ZoneID, z.ZoneName, vt.VehicleName,
    COUNT(ps.SlotID)                                                AS TotalSlots,
    SUM(CASE WHEN ps.SlotStatus = 'Occupied'    THEN 1 ELSE 0 END)  AS Occupied,
    SUM(CASE WHEN ps.SlotStatus = 'Available'   THEN 1 ELSE 0 END)  AS Available,
    SUM(CASE WHEN ps.SlotStatus = 'Reserved'    THEN 1 ELSE 0 END)  AS Reserved,
    SUM(CASE WHEN ps.SlotStatus = 'Maintenance' THEN 1 ELSE 0 END)  AS Maintenance,
    SUM(CASE WHEN ps.SlotStatus = 'Blocked'     THEN 1 ELSE 0 END)  AS Blocked,
    CASE WHEN COUNT(ps.SlotID) = 0 THEN 0
         ELSE ROUND(100.0 * SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END) / COUNT(ps.SlotID), 1)
    END AS OccupancyPct
FROM ParkingSlots ps
JOIN Zones z         ON ps.ZoneID         = z.ZoneID
JOIN Floors f        ON z.FloorID         = f.FloorID
JOIN Buildings b     ON f.BuildingID      = b.BuildingID
JOIN VehicleTypes vt ON z.AllowedVehicleTypeID = vt.VehicleTypeID
WHERE f.IsActive = 1
GROUP BY b.BuildingID, b.BuildingName, f.FloorID, f.FloorName, z.ZoneID, z.ZoneName, vt.VehicleName;
GO

CREATE PROCEDURE sp_GetPeakHours
    @StartDate DATE = NULL,
    @EndDate   DATE = NULL,
    @VehicleTypeID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @StartDate IS NULL SET @StartDate = DATEADD(DAY, -30, CAST(GETDATE() AS DATE));
    IF @EndDate   IS NULL SET @EndDate   = CAST(GETDATE() AS DATE);

    SELECT
        vt.VehicleTypeID, vt.VehicleName, vt.VehicleCode,
        DATEPART(HOUR, s.EntryTime) AS Hour, COUNT(*) AS SessionCount
    FROM ParkingSessions s
    JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
    WHERE CAST(s.EntryTime AS DATE) BETWEEN @StartDate AND @EndDate
      AND (@VehicleTypeID IS NULL OR s.VehicleTypeID = @VehicleTypeID)
    GROUP BY vt.VehicleTypeID, vt.VehicleName, vt.VehicleCode, DATEPART(HOUR, s.EntryTime)
    ORDER BY vt.VehicleTypeID, Hour;
END
GO

CREATE PROCEDURE sp_GetVehicleFlow
    @StartDate DATE = NULL,
    @EndDate   DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @StartDate IS NULL SET @StartDate = DATEADD(DAY, -30, CAST(GETDATE() AS DATE));
    IF @EndDate   IS NULL SET @EndDate   = CAST(GETDATE() AS DATE);

    SELECT
        CAST(s.EntryTime AS DATE) AS FlowDate,
        vt.VehicleName, vt.VehicleCode,
        COUNT(*) AS CheckInCount,
        SUM(CASE WHEN s.ExitTime IS NOT NULL AND CAST(s.ExitTime AS DATE) = CAST(s.EntryTime AS DATE) THEN 1 ELSE 0 END) AS CheckOutSameDay
    FROM ParkingSessions s
    JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
    WHERE CAST(s.EntryTime AS DATE) BETWEEN @StartDate AND @EndDate
    GROUP BY CAST(s.EntryTime AS DATE), vt.VehicleName, vt.VehicleCode
    ORDER BY FlowDate, vt.VehicleName;
END
GO

/* =====================================================================
   PHẦN I: Walk-in guest + Mock data
   ===================================================================== */

-- Walk-in guest (idempotent)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'walkin.guest@system.local')
BEGIN
    INSERT INTO Users (FullName, Email, PasswordHash, RoleID, IsActive, IsEmailVerified)
    VALUES (N'Khách Vãng Lai', 'walkin.guest@system.local', NULL, 1, 1, 1);
    PRINT 'Inserted walk-in guest user.';
END
ELSE
    PRINT 'Walk-in guest already exists.';
GO

-- Mock ServiceRatings
IF NOT EXISTS (SELECT 1 FROM ServiceRatings)
BEGIN
    INSERT INTO ServiceRatings (SessionID, DriverID, Rating, Comment, Tags, CreatedAt)
    SELECT TOP 15
        SessionID, DriverID,
        CASE WHEN SessionID % 3 = 0 THEN 3 WHEN SessionID % 2 = 0 THEN 4 ELSE 5 END,
        CASE WHEN SessionID % 3 = 0 THEN N'Bãi đỗ xe hơi chật, khó quay đầu.'
             WHEN SessionID % 2 = 0 THEN N'Dịch vụ tốt, nhân viên bảo vệ nhiệt tình.'
             ELSE N'Rất tuyệt vời, sẽ tiếp tục sử dụng dịch vụ!' END,
        CASE WHEN SessionID % 3 = 0 THEN N'["Không gian", "Giá cả"]'
             WHEN SessionID % 2 = 0 THEN N'["Nhân viên", "An toàn"]'
             ELSE N'["Sạch sẽ", "Tiện lợi"]' END,
        DATEADD(hour, - (SessionID % 100), GETDATE())
    FROM ParkingSessions
    WHERE DriverID IS NOT NULL
    ORDER BY SessionID DESC;
    PRINT 'Inserted mock data for ServiceRatings';
END
ELSE
    PRINT 'Mock data for ServiceRatings already exists';
GO

-- Mock SupportTickets
IF NOT EXISTS (SELECT 1 FROM SupportTickets)
BEGIN
    DECLARE @DriverID INT;
    SELECT TOP 1 @DriverID = UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE RoleName = 'Driver');
    IF @DriverID IS NULL
        SELECT TOP 1 @DriverID = UserID FROM Users;

    IF @DriverID IS NOT NULL
    BEGIN
        INSERT INTO SupportTickets (DriverID, Subject, Content, Status, CreatedAt, UpdatedAt)
        VALUES
        (@DriverID, N'Lỗi thanh toán qua PayOS', N'Tôi đã thanh toán nhưng hệ thống vẫn báo chưa thanh toán, mã hóa đơn là P1234.', 'Open', DATEADD(day, -1, GETDATE()), DATEADD(day, -1, GETDATE())),
        (@DriverID, N'Thẻ tháng bị lỗi', N'Thẻ tháng của tôi quẹt không mở được barrier.', 'Resolved', DATEADD(day, -3, GETDATE()), DATEADD(day, -2, GETDATE())),
        (@DriverID, N'Thái độ nhân viên', N'Nhân viên ở cổng B có thái độ không đúng mực.', 'Pending', DATEADD(day, -2, GETDATE()), DATEADD(day, -2, GETDATE()));
        PRINT 'Inserted mock data for SupportTickets';
    END
END
ELSE
    PRINT 'Mock data for SupportTickets already exists';
GO

/* =====================================================================
   PHẦN J: Vá dữ liệu + VERIFY
   ===================================================================== */

-- Vá row đang kẹt nếu có (giữ lại từ script gốc của bạn)
UPDATE Payments
SET PaymentStatus = 'Prepaid', PrepaidAmount = Amount, PrepaidAt = GETDATE(), PaymentTime = GETDATE()
WHERE SessionID = 4007 AND PaymentStatus = 'Pending';
GO

-- Đếm số dòng các bảng
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
    UNION ALL SELECT 'Notifications', COUNT(*) FROM Notifications
    UNION ALL SELECT 'DriverVehicles', COUNT(*) FROM DriverVehicles
    UNION ALL SELECT 'ServiceRatings', COUNT(*) FROM ServiceRatings
    UNION ALL SELECT 'SupportTickets', COUNT(*) FROM SupportTickets
    UNION ALL SELECT 'TicketReplies', COUNT(*) FROM TicketReplies
) t
ORDER BY TableName;
GO

-- Liệt kê SP/View đã tạo
SELECT name, type_desc
FROM sys.objects
WHERE type IN ('P','V')
  AND name LIKE 'sp_%' OR name LIKE 'vw_%'
ORDER BY type_desc, name;
GO

-- Slot status
SELECT SlotID, SlotCode, SlotStatus FROM ParkingSlots ORDER BY SlotID;
GO

PRINT '==== TẠO BẢNG SUBSCRIPTION ====';
GO

IF OBJECT_ID('UserSubscriptions', 'U') IS NOT NULL DROP TABLE UserSubscriptions;
IF OBJECT_ID('SubscriptionPlans', 'U') IS NOT NULL DROP TABLE SubscriptionPlans;

CREATE TABLE SubscriptionPlans (
    PlanID NVARCHAR(50) PRIMARY KEY, -- 'basic', 'pro', 'premium'
    Name NVARCHAR(100) NOT NULL,
    BasePrice INT NOT NULL,
    Description NVARCHAR(255) NOT NULL,
    IsActive BIT DEFAULT 1
);

CREATE TABLE UserSubscriptions (
    UserSubscriptionID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    PlanID NVARCHAR(50) NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NOT NULL,
    AmountPaid DECIMAL(10,2) NOT NULL DEFAULT 0,
    Status NVARCHAR(50) DEFAULT 'Active', -- 'Active', 'Expired', 'Cancelled'
    CreatedAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_UserSubscriptions_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_UserSubscriptions_Plans FOREIGN KEY (PlanID) REFERENCES SubscriptionPlans(PlanID)
);
GO

-- Seed data for SubscriptionPlans
INSERT INTO SubscriptionPlans (PlanID, Name, BasePrice, Description) VALUES
('basic', N'Cơ Bản', 99000, N'Phù hợp cho người đỗ xe không thường xuyên.'),
('pro', N'Nâng Cao', 199000, N'Lựa chọn phổ biến cho người đi làm hàng ngày.'),
('premium', N'Cao Cấp', 399000, N'Trải nghiệm đặc quyền, không giới hạn.');
GO

-- Sample Subscription for User 1 (Driver)
INSERT INTO UserSubscriptions (UserID, PlanID, StartDate, EndDate, AmountPaid, Status) VALUES
(1, 'premium', GETDATE(), DATEADD(month, 1, GETDATE()), 399000, 'Active');
GO

PRINT '==== SETUP HOÀN TẤT ====';
GO