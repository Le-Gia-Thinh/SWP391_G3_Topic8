/* =====================================================================
   PARKING MANAGEMENT DB - COMPLETE FINAL
   ===================================================================== */

USE master;
GO

IF DB_ID('ParkingManagementDB') IS NULL
    CREATE DATABASE ParkingManagementDB;
GO

USE ParkingManagementDB;
GO
PRINT '>>> COMPLETE FINAL: V2 + ADDON V4 <<<';
GO

/* =====================================================================
   PHẦN A: DROP OBJECT (con -> cha)
   ===================================================================== */

IF OBJECT_ID('vw_PaymentHistory',   'V') IS NOT NULL DROP VIEW vw_PaymentHistory;
IF OBJECT_ID('vw_RevenueByDay',      'V') IS NOT NULL DROP VIEW vw_RevenueByDay;
IF OBJECT_ID('vw_OccupancyByZone',   'V') IS NOT NULL DROP VIEW vw_OccupancyByZone;
GO

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

IF OBJECT_ID('fn_SplitDayNightSegments', 'TF') IS NOT NULL DROP FUNCTION fn_SplitDayNightSegments;
GO

IF OBJECT_ID('sp_GetVehicleFlow',          'P') IS NOT NULL DROP PROCEDURE sp_GetVehicleFlow;
IF OBJECT_ID('sp_GetPeakHours',            'P') IS NOT NULL DROP PROCEDURE sp_GetPeakHours;
IF OBJECT_ID('sp_GetPaymentHistory',       'P') IS NOT NULL DROP PROCEDURE sp_GetPaymentHistory;
IF OBJECT_ID('sp_ConfirmSurcharge',        'P') IS NOT NULL DROP PROCEDURE sp_ConfirmSurcharge;
IF OBJECT_ID('sp_CheckOutWithSurcharge',   'P') IS NOT NULL DROP PROCEDURE sp_CheckOutWithSurcharge;
IF OBJECT_ID('sp_MarkPaymentPrepaid',      'P') IS NOT NULL DROP PROCEDURE sp_MarkPaymentPrepaid;
IF OBJECT_ID('sp_CreatePrepayment',        'P') IS NOT NULL DROP PROCEDURE sp_CreatePrepayment;
IF OBJECT_ID('sp_CalcParkingFeeV2',        'P') IS NOT NULL DROP PROCEDURE sp_CalcParkingFeeV2;
IF OBJECT_ID('sp_CalcParkingFee',          'P') IS NOT NULL DROP PROCEDURE sp_CalcParkingFee;
IF OBJECT_ID('sp_GetParkingMap',           'P') IS NOT NULL DROP PROCEDURE sp_GetParkingMap;
IF OBJECT_ID('sp_SyncParkingSlotStatuses', 'P') IS NOT NULL DROP PROCEDURE sp_SyncParkingSlotStatuses;
IF OBJECT_ID('sp_RevokeRefreshToken',      'P') IS NOT NULL DROP PROCEDURE sp_RevokeRefreshToken;
IF OBJECT_ID('sp_GetUserByRefreshToken',   'P') IS NOT NULL DROP PROCEDURE sp_GetUserByRefreshToken;
IF OBJECT_ID('sp_SaveRefreshToken',        'P') IS NOT NULL DROP PROCEDURE sp_SaveRefreshToken;
IF OBJECT_ID('sp_UpsertSocialUser',        'P') IS NOT NULL DROP PROCEDURE sp_UpsertSocialUser;
IF OBJECT_ID('sp_ResendVerifyEmail',       'P') IS NOT NULL DROP PROCEDURE sp_ResendVerifyEmail;
IF OBJECT_ID('sp_VerifyEmail',             'P') IS NOT NULL DROP PROCEDURE sp_VerifyEmail;
IF OBJECT_ID('sp_GetUserByEmail',          'P') IS NOT NULL DROP PROCEDURE sp_GetUserByEmail;
IF OBJECT_ID('sp_RegisterLocal',           'P') IS NOT NULL DROP PROCEDURE sp_RegisterLocal;
IF OBJECT_ID('sp_CreateReservation',       'P') IS NOT NULL DROP PROCEDURE sp_CreateReservation;
IF OBJECT_ID('sp_CheckOutVehicle',         'P') IS NOT NULL DROP PROCEDURE sp_CheckOutVehicle;
IF OBJECT_ID('sp_CheckInVehicle',          'P') IS NOT NULL DROP PROCEDURE sp_CheckInVehicle;
IF OBJECT_ID('sp_TopUpWallet',             'P') IS NOT NULL DROP PROCEDURE sp_TopUpWallet;
IF OBJECT_ID('sp_PayByWallet',             'P') IS NOT NULL DROP PROCEDURE sp_PayByWallet;
GO

IF OBJECT_ID('CK_Users_MinAge', 'C') IS NOT NULL
    ALTER TABLE Users DROP CONSTRAINT CK_Users_MinAge;
GO

IF OBJECT_ID('WalletTransactions',   'U') IS NOT NULL DROP TABLE WalletTransactions;
IF OBJECT_ID('TicketReplies',        'U') IS NOT NULL DROP TABLE TicketReplies;
IF OBJECT_ID('SupportTickets',       'U') IS NOT NULL DROP TABLE SupportTickets;
IF OBJECT_ID('ServiceRatings',       'U') IS NOT NULL DROP TABLE ServiceRatings;
IF OBJECT_ID('DriverVehicles',       'U') IS NOT NULL DROP TABLE DriverVehicles;
IF OBJECT_ID('Notifications',        'U') IS NOT NULL DROP TABLE Notifications;
IF OBJECT_ID('Feedbacks',            'U') IS NOT NULL DROP TABLE Feedbacks;
IF OBJECT_ID('Incidents',            'U') IS NOT NULL DROP TABLE Incidents;
IF OBJECT_ID('Payments',             'U') IS NOT NULL DROP TABLE Payments;
IF OBJECT_ID('Reservations',         'U') IS NOT NULL DROP TABLE Reservations;
IF OBJECT_ID('ParkingSessions',      'U') IS NOT NULL DROP TABLE ParkingSessions;
IF OBJECT_ID('UserSubscriptions',    'U') IS NOT NULL DROP TABLE UserSubscriptions;
IF OBJECT_ID('SubscriptionPlans',    'U') IS NOT NULL DROP TABLE SubscriptionPlans;
IF OBJECT_ID('ParkingSlots',         'U') IS NOT NULL DROP TABLE ParkingSlots;
IF OBJECT_ID('Zones',                'U') IS NOT NULL DROP TABLE Zones;
IF OBJECT_ID('Floors',               'U') IS NOT NULL DROP TABLE Floors;
IF OBJECT_ID('Buildings',            'U') IS NOT NULL DROP TABLE Buildings;
IF OBJECT_ID('NightPricingPolicies', 'U') IS NOT NULL DROP TABLE NightPricingPolicies;
IF OBJECT_ID('PricingPolicies',      'U') IS NOT NULL DROP TABLE PricingPolicies;
IF OBJECT_ID('AuditLogs',            'U') IS NOT NULL DROP TABLE AuditLogs;
IF OBJECT_ID('RefreshTokens',        'U') IS NOT NULL DROP TABLE RefreshTokens;
IF OBJECT_ID('UserAuthProviders',    'U') IS NOT NULL DROP TABLE UserAuthProviders;
IF OBJECT_ID('RolePermissions',      'U') IS NOT NULL DROP TABLE RolePermissions;
IF OBJECT_ID('Users',                'U') IS NOT NULL DROP TABLE Users;
IF OBJECT_ID('VehicleTypes',         'U') IS NOT NULL DROP TABLE VehicleTypes;
IF OBJECT_ID('Permissions',          'U') IS NOT NULL DROP TABLE Permissions;
IF OBJECT_ID('Roles',                'U') IS NOT NULL DROP TABLE Roles;
GO

/* =====================================================================
   PHẦN B: CREATE SCHEMA
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
    FOREIGN KEY (RoleID)       REFERENCES Roles(RoleID),
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
    AccountBalance      DECIMAL(18,2) NOT NULL DEFAULT 0,
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
    CONSTRAINT FK_UAP_User     FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT UQ_UAP_Provider UNIQUE (ProviderName, ProviderUserID),
    CONSTRAINT CK_UAP_Name     CHECK (ProviderName IN ('local','google','facebook'))
);
GO
CREATE INDEX IX_UAP_UserID ON UserAuthProviders(UserID);
GO

CREATE TABLE RefreshTokens (
    RefreshTokenID   INT IDENTITY(1,1) PRIMARY KEY,
    UserID           INT           NOT NULL,
    TokenHash        NVARCHAR(200) NOT NULL UNIQUE,
    ExpiresAt        DATETIME      NOT NULL,
    SessionExpiresAt DATETIME      NOT NULL,
    CreatedAt        DATETIME      NOT NULL DEFAULT GETUTCDATE(),
    CreatedByIp      NVARCHAR(45)  NULL,
    RevokedAt        DATETIME      NULL,
    CONSTRAINT FK_RT_User FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
GO
CREATE INDEX IX_RT_TokenHash ON RefreshTokens(TokenHash);
CREATE INDEX IX_RT_UserID    ON RefreshTokens(UserID);
GO

CREATE TABLE AuditLogs (
    LogID       INT IDENTITY(1,1) PRIMARY KEY,
    UserID      INT NULL,
    UserName    NVARCHAR(100) NULL,
    RoleName    NVARCHAR(50)  NULL,
    Action      NVARCHAR(50)  NOT NULL,
    Target      NVARCHAR(100) NULL,
    Description NVARCHAR(500) NULL,
    IpAddress   NVARCHAR(45)  NULL,
    CreatedAt   DATETIME DEFAULT GETDATE(),
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

CREATE TABLE NightPricingPolicies (
    NightPolicyID  INT IDENTITY(1,1) PRIMARY KEY,
    VehicleTypeID  INT NOT NULL,
    NightStartTime TIME NOT NULL,
    NightEndTime   TIME NOT NULL,
    NightFee       DECIMAL(10,2) NOT NULL,
    IsActive       BIT NOT NULL DEFAULT 1,
    CreatedAt      DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_NightPricing_VehicleType FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CONSTRAINT CK_NightPricing_Fee CHECK (NightFee >= 0)
);
GO
CREATE INDEX IX_NightPricing_VehicleType ON NightPricingPolicies(VehicleTypeID, IsActive);
CREATE UNIQUE INDEX UQ_NightPricing_OneActivePerVehicle ON NightPricingPolicies(VehicleTypeID) WHERE IsActive = 1;
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
    FOREIGN KEY (FloorID)              REFERENCES Floors(FloorID),
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
    FOREIGN KEY (ZoneID)        REFERENCES Zones(ZoneID),
    FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CHECK (SlotStatus IN ('Available','Occupied','Reserved','Maintenance','Blocked'))
);
GO

CREATE TABLE ParkingSessions (
    SessionID        INT IDENTITY(1,1) PRIMARY KEY,
    SlotID           INT NOT NULL,
    DriverID         INT NULL,
    PlateNumber      NVARCHAR(20) NOT NULL,
    VehicleTypeID    INT NOT NULL,
    EntryTime        DATETIME DEFAULT GETDATE(),
    ExitTime         DATETIME NULL,
    SessionStatus    NVARCHAR(20) DEFAULT 'Active',
    EarlyFeeAmount   INT NOT NULL DEFAULT 0,
    BookingStartTime DATETIME NULL,
    FOREIGN KEY (SlotID)        REFERENCES ParkingSlots(SlotID),
    FOREIGN KEY (DriverID)      REFERENCES Users(UserID),
    FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    CHECK (ExitTime IS NULL OR ExitTime > EntryTime),
    CHECK (SessionStatus IN ('Active','Completed','Lost','Overdue'))
);
GO

CREATE TABLE Payments (
    PaymentID         INT IDENTITY(1,1) PRIMARY KEY,
    SessionID         INT NOT NULL UNIQUE,
    Amount            DECIMAL(10,2) NOT NULL,
    PaymentMethod     NVARCHAR(50),
    PaymentTime       DATETIME NULL,
    PaymentStatus     NVARCHAR(20) DEFAULT 'Pending',
    OrderCode         BIGINT NULL,
    PaymentLinkId     NVARCHAR(100) NULL,
    QrCode            NVARCHAR(MAX) NULL,
    CheckoutUrl       NVARCHAR(500) NULL,
    PrepaidAt         DATETIME NULL,
    SnapshotDurationH DECIMAL(10,2) NULL,
    PrepaidAmount     DECIMAL(10,2) NULL DEFAULT 0,
    SurchargeAmount   DECIMAL(10,2) NULL DEFAULT 0,
    FinalAmount       DECIMAL(10,2) NULL,
    SurchargeStatus   NVARCHAR(20)  NULL DEFAULT 'None',
    SurchargePaidAt   DATETIME NULL,
    PaymentNote       NVARCHAR(MAX) NULL,
    FOREIGN KEY (SessionID) REFERENCES ParkingSessions(SessionID),
    CONSTRAINT CK_Payments_Amount          CHECK (Amount >= 0),
    CONSTRAINT CK_Payments_Status          CHECK (PaymentStatus IN ('Pending','Prepaid','Completed','Failed','Cancelled')),
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
    PlateNumber       NVARCHAR(20) NULL,
    CreatedAt         DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (DriverID)      REFERENCES Users(UserID),
    FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID),
    FOREIGN KEY (SlotID)        REFERENCES ParkingSlots(SlotID),
    CHECK (EndTime > StartTime),
    CHECK (ReservationStatus IN ('Reserved','Cancelled','Expired','Completed'))
);
GO

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
    FOREIGN KEY (SessionID)       REFERENCES ParkingSessions(SessionID),
    FOREIGN KEY (DriverID)        REFERENCES Users(UserID),
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
    FOREIGN KEY (DriverID)   REFERENCES Users(UserID),
    FOREIGN KEY (IncidentID) REFERENCES Incidents(IncidentID),
    CHECK (FeedbackStatus IN ('Open','Closed','Resolved'))
);
GO

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
    CONSTRAINT CK_NotificationType   CHECK (NotificationType IN ('booking','session','payment','incident','system','subscription','wallet')),
    CONSTRAINT CK_ReferenceType      CHECK (ReferenceType IS NULL OR ReferenceType IN ('reservation','session','payment','incident','subscription','wallet'))
);
GO
CREATE INDEX IX_Notifications_UserID        ON Notifications(UserID);
CREATE INDEX IX_Notifications_UserID_IsRead ON Notifications(UserID, IsRead);
CREATE INDEX IX_Notifications_CreatedAt     ON Notifications(CreatedAt DESC);
GO

CREATE TABLE DriverVehicles (
    VehicleID     INT IDENTITY(1,1) PRIMARY KEY,
    DriverID      INT NOT NULL,
    PlateNumber   NVARCHAR(20) NOT NULL,
    VehicleTypeID INT NOT NULL,
    VehicleBrand  NVARCHAR(100) NULL,
    VehicleColor  NVARCHAR(50)  NULL,
    IsActive      BIT NOT NULL DEFAULT 1,
    IsDefault     BIT NOT NULL DEFAULT 0,
    CreatedAt     DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt     DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_DriverVehicles_Driver      FOREIGN KEY (DriverID)      REFERENCES Users(UserID),
    CONSTRAINT FK_DriverVehicles_VehicleType FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID)
);
GO
CREATE INDEX IX_DriverVehicles_DriverID ON DriverVehicles(DriverID);
GO

CREATE TABLE ServiceRatings (
    RatingID  INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT NOT NULL,
    DriverID  INT NOT NULL,
    Rating    INT NOT NULL,
    Comment   NVARCHAR(500) NULL,
    Tags      NVARCHAR(500) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_ServiceRatings_Session FOREIGN KEY (SessionID) REFERENCES ParkingSessions(SessionID),
    CONSTRAINT FK_ServiceRatings_Driver  FOREIGN KEY (DriverID)  REFERENCES Users(UserID),
    CONSTRAINT CK_RatingValue CHECK (Rating BETWEEN 1 AND 5)
);
GO
CREATE UNIQUE INDEX UQ_ServiceRatings_Session ON ServiceRatings(SessionID);
CREATE INDEX IX_ServiceRatings_DriverID ON ServiceRatings(DriverID);
GO

CREATE TABLE SupportTickets (
    TicketID  INT IDENTITY(1,1) PRIMARY KEY,
    DriverID  INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    Subject   NVARCHAR(200) NOT NULL,
    Content   NVARCHAR(MAX) NOT NULL,
    Status    VARCHAR(20) DEFAULT 'Open' CHECK (Status IN ('Open','Pending','Resolved','Closed')),
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

CREATE TABLE SubscriptionPlans (
    PlanID      NVARCHAR(50) PRIMARY KEY,
    Name        NVARCHAR(100) NOT NULL,
    BasePrice   INT NOT NULL,
    Description NVARCHAR(255) NOT NULL,
    IsActive    BIT DEFAULT 1
);
GO

CREATE TABLE UserSubscriptions (
    UserSubscriptionID INT IDENTITY(1,1) PRIMARY KEY,
    UserID             INT NOT NULL,
    PlanID             NVARCHAR(50) NOT NULL,
    StartDate          DATETIME NOT NULL,
    EndDate            DATETIME NOT NULL,
    AmountPaid         DECIMAL(10,2) NOT NULL DEFAULT 0,
    Status             NVARCHAR(50) DEFAULT 'Active',
    CreatedAt          DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_UserSubscriptions_Users FOREIGN KEY (UserID)  REFERENCES Users(UserID),
    CONSTRAINT FK_UserSubscriptions_Plans FOREIGN KEY (PlanID)  REFERENCES SubscriptionPlans(PlanID)
);
GO

CREATE TABLE WalletTransactions (
    TransactionID   INT IDENTITY(1,1) PRIMARY KEY,
    UserID          INT NOT NULL,
    Amount          DECIMAL(18,2) NOT NULL,
    TransactionType NVARCHAR(50) NOT NULL CHECK (TransactionType IN ('TOPUP','PAY_PARKING','PAY_SUBSCRIPTION')),
    Status          NVARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    ReferenceID     NVARCHAR(100) NULL,
    Description     NVARCHAR(200) NULL,
    CreatedAt       DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_WalletTx_Users FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO
CREATE INDEX IX_WalletTx_UserID ON WalletTransactions(UserID, CreatedAt DESC);
GO

ALTER TABLE Users ADD CONSTRAINT CK_Users_MinAge CHECK (
    RoleID = 1 OR RoleID = 4
    OR (RoleID IN (2,3) AND DateOfBirth IS NOT NULL AND HireDate IS NOT NULL
        AND DATEDIFF(YEAR, DateOfBirth, HireDate) >= 18)
);
GO

/* =====================================================================
   PHẦN C: STORED PROCEDURES
   ===================================================================== */

CREATE PROCEDURE sp_RegisterLocal
    @FullName NVARCHAR(100), @Email NVARCHAR(100), @PasswordHash NVARCHAR(256),
    @PhoneNumber NVARCHAR(20) = NULL, @EmailVerifyToken NVARCHAR(500) = NULL, @EmailVerifyExpires DATETIME = NULL
AS BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Users WHERE Email = @Email) BEGIN RAISERROR('Email already exists.',16,1); RETURN; END
    DECLARE @UserID INT;
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,IsActive,IsEmailVerified,EmailVerifyToken,EmailVerifyExpires)
    VALUES (@FullName,@Email,@PasswordHash,@PhoneNumber,1,1,0,@EmailVerifyToken,@EmailVerifyExpires);
    SET @UserID = SCOPE_IDENTITY();
    INSERT INTO UserAuthProviders (UserID,ProviderName,ProviderUserID,ProviderEmail) VALUES (@UserID,'local',CAST(@UserID AS NVARCHAR(200)),@Email);
    SELECT u.UserID,u.FullName,u.Email,u.PhoneNumber,u.RoleID,r.RoleName,u.IsActive,u.IsEmailVerified,u.AvatarUrl FROM Users u JOIN Roles r ON u.RoleID=r.RoleID WHERE u.UserID=@UserID;
END
GO

CREATE PROCEDURE sp_GetUserByEmail @Email NVARCHAR(100)
AS BEGIN
    SET NOCOUNT ON;
    SELECT u.UserID,u.FullName,u.Email,u.PasswordHash,u.RoleID,r.RoleName,u.IsActive,u.IsEmailVerified,u.AvatarUrl,
        CASE WHEN EXISTS(SELECT 1 FROM UserAuthProviders WHERE UserID=u.UserID AND ProviderName='local') THEN 1 ELSE 0 END AS HasLocalAuth
    FROM Users u JOIN Roles r ON u.RoleID=r.RoleID WHERE u.Email=@Email;
END
GO

CREATE PROCEDURE sp_VerifyEmail @Token NVARCHAR(500)
AS BEGIN
    SET NOCOUNT ON;
    DECLARE @UserID INT;
    SELECT @UserID=UserID FROM Users WHERE EmailVerifyToken=@Token AND EmailVerifyExpires>GETUTCDATE() AND IsEmailVerified=0 AND IsActive=1;
    IF @UserID IS NULL BEGIN RAISERROR('Token không hợp lệ hoặc đã hết hạn.',16,1); RETURN; END
    UPDATE Users SET IsEmailVerified=1,EmailVerifyToken=NULL,EmailVerifyExpires=NULL,UpdatedAt=GETDATE() WHERE UserID=@UserID;
    SELECT @UserID AS UserID;
END
GO

CREATE PROCEDURE sp_ResendVerifyEmail @Email NVARCHAR(100), @EmailVerifyToken NVARCHAR(500), @EmailVerifyExpires DATETIME
AS BEGIN
    SET NOCOUNT ON;
    DECLARE @UserID INT;
    SELECT @UserID=UserID FROM Users WHERE Email=@Email AND IsEmailVerified=0 AND IsActive=1;
    IF @UserID IS NULL BEGIN RAISERROR('Không thể gửi lại.',16,1); RETURN; END
    UPDATE Users SET EmailVerifyToken=@EmailVerifyToken,EmailVerifyExpires=@EmailVerifyExpires,UpdatedAt=GETDATE() WHERE UserID=@UserID;
    SELECT @UserID AS UserID;
END
GO

CREATE PROCEDURE sp_UpsertSocialUser
    @ProviderName NVARCHAR(20), @ProviderUserID NVARCHAR(200), @Email NVARCHAR(100),
    @FullName NVARCHAR(100), @AvatarUrl NVARCHAR(500) = NULL
AS BEGIN
    SET NOCOUNT ON;
    DECLARE @UserID INT, @IsEmailVerified BIT, @IsNewLink BIT = 0;
    IF @ProviderName NOT IN ('google','facebook') BEGIN RAISERROR('Invalid social provider.',16,1); RETURN; END
    SELECT @UserID=UserID FROM UserAuthProviders WHERE ProviderName=@ProviderName AND ProviderUserID=@ProviderUserID;
    IF @UserID IS NULL AND @Email IS NOT NULL BEGIN
        SELECT @UserID=UserID,@IsEmailVerified=IsEmailVerified FROM Users WHERE Email=@Email;
        IF @UserID IS NOT NULL BEGIN IF @IsEmailVerified=0 BEGIN RAISERROR('EMAIL_NOT_VERIFIED',16,1); RETURN; END SET @IsNewLink=1; END
    END
    IF @UserID IS NULL BEGIN
        INSERT INTO Users (FullName,Email,PasswordHash,RoleID,AvatarUrl,IsActive,IsEmailVerified) VALUES (@FullName,@Email,NULL,1,@AvatarUrl,1,1);
        SET @UserID=SCOPE_IDENTITY();
    END ELSE UPDATE Users SET AvatarUrl=ISNULL(@AvatarUrl,AvatarUrl),UpdatedAt=GETDATE() WHERE UserID=@UserID;
    IF NOT EXISTS(SELECT 1 FROM UserAuthProviders WHERE UserID=@UserID AND ProviderName=@ProviderName)
        INSERT INTO UserAuthProviders (UserID,ProviderName,ProviderUserID,ProviderEmail) VALUES (@UserID,@ProviderName,@ProviderUserID,@Email);
    SELECT u.UserID,u.FullName,u.Email,u.PhoneNumber,u.RoleID,r.RoleName,u.IsActive,u.IsEmailVerified,u.AvatarUrl,@IsNewLink AS IsNewLink
    FROM Users u JOIN Roles r ON u.RoleID=r.RoleID WHERE u.UserID=@UserID;
END
GO

CREATE PROCEDURE sp_SaveRefreshToken
    @UserID INT, @TokenHash NVARCHAR(200), @ExpiresAt DATETIME, @SessionExpiresAt DATETIME, @CreatedByIp NVARCHAR(45)=NULL
AS BEGIN
    SET NOCOUNT ON;
    DELETE FROM RefreshTokens WHERE UserID=@UserID AND (RevokedAt IS NOT NULL OR ExpiresAt<GETUTCDATE() OR SessionExpiresAt<GETUTCDATE());
    INSERT INTO RefreshTokens (UserID,TokenHash,ExpiresAt,SessionExpiresAt,CreatedByIp) VALUES (@UserID,@TokenHash,@ExpiresAt,@SessionExpiresAt,@CreatedByIp);
END
GO

CREATE PROCEDURE sp_GetUserByRefreshToken @TokenHash NVARCHAR(200)
AS BEGIN
    SET NOCOUNT ON;
    SELECT u.UserID,u.FullName,u.Email,u.PhoneNumber,u.RoleID,r.RoleName,u.IsActive,u.IsEmailVerified,u.AvatarUrl,rt.SessionExpiresAt
    FROM RefreshTokens rt JOIN Users u ON rt.UserID=u.UserID JOIN Roles r ON u.RoleID=r.RoleID
    WHERE rt.TokenHash=@TokenHash AND rt.RevokedAt IS NULL AND rt.ExpiresAt>GETUTCDATE() AND rt.SessionExpiresAt>GETUTCDATE() AND u.IsActive=1;
END
GO

CREATE PROCEDURE sp_RevokeRefreshToken @TokenHash NVARCHAR(200)
AS BEGIN
    SET NOCOUNT ON;
    DECLARE @UserID INT;
    SELECT @UserID=UserID FROM RefreshTokens WHERE TokenHash=@TokenHash AND RevokedAt IS NULL AND ExpiresAt>GETUTCDATE() AND SessionExpiresAt>GETUTCDATE();
    IF @UserID IS NULL BEGIN RAISERROR('Refresh token invalid, expired, or session expired.',16,1); RETURN; END
    UPDATE RefreshTokens SET RevokedAt=GETUTCDATE() WHERE TokenHash=@TokenHash AND RevokedAt IS NULL;
    SELECT @UserID AS UserID;
END
GO

CREATE PROCEDURE sp_TopUpWallet @UserID INT, @Amount DECIMAL(18,2), @ReferenceID NVARCHAR(100), @Description NVARCHAR(200)
AS BEGIN
    BEGIN TRY BEGIN TRANSACTION;
        INSERT INTO WalletTransactions (UserID,Amount,TransactionType,Status,ReferenceID,Description) VALUES (@UserID,@Amount,'TOPUP','COMPLETED',@ReferenceID,@Description);
        UPDATE Users SET AccountBalance=AccountBalance+@Amount,UpdatedAt=GETDATE() WHERE UserID=@UserID;
    COMMIT TRANSACTION; END TRY
    BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW; END CATCH
END;
GO

CREATE PROCEDURE sp_PayByWallet @UserID INT, @Amount DECIMAL(18,2), @TransactionType NVARCHAR(50), @ReferenceID NVARCHAR(100), @Description NVARCHAR(200)
AS BEGIN
    BEGIN TRY BEGIN TRANSACTION;
        DECLARE @Bal DECIMAL(18,2); SELECT @Bal=AccountBalance FROM Users WHERE UserID=@UserID;
        IF @Bal < @Amount THROW 50001,'Insufficient wallet balance',1;
        INSERT INTO WalletTransactions (UserID,Amount,TransactionType,Status,ReferenceID,Description) VALUES (@UserID,-@Amount,@TransactionType,'COMPLETED',@ReferenceID,@Description);
        UPDATE Users SET AccountBalance=AccountBalance-@Amount,UpdatedAt=GETDATE() WHERE UserID=@UserID;
    COMMIT TRANSACTION; END TRY
    BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW; END CATCH
END;
GO

CREATE PROCEDURE sp_CreateReservation
    @DriverID INT,
    @VehicleTypeID INT,
    @SlotID INT,
    @ReservationDate DATE,
    @StartTime DATETIME,
    @EndTime DATETIME,
    @PlateNumber NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF @EndTime <= @StartTime
    BEGIN
        RAISERROR('EndTime must be greater than StartTime.',16,1);
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM Reservations
        WHERE SlotID = @SlotID
          AND ReservationStatus = 'Reserved'
          AND @StartTime < EndTime
          AND @EndTime > StartTime
    )
    BEGIN
        RAISERROR('Slot already reserved in this time range.',16,1);
        RETURN;
    END;

    INSERT INTO Reservations
    (
        DriverID,
        VehicleTypeID,
        SlotID,
        ReservationDate,
        StartTime,
        EndTime,
        ReservationStatus,
        PlateNumber
    )
    VALUES
    (
        @DriverID,
        @VehicleTypeID,
        @SlotID,
        @ReservationDate,
        @StartTime,
        @EndTime,
        'Reserved',
        @PlateNumber
    );
END
GO

CREATE PROCEDURE sp_SyncParkingSlotStatuses AS BEGIN
    SET NOCOUNT ON;
    UPDATE Reservations SET ReservationStatus='Expired' WHERE ReservationStatus='Reserved' AND EndTime<GETDATE();
    UPDATE ps SET ps.SlotStatus=CASE WHEN ps.SlotStatus IN('Maintenance','Blocked') THEN ps.SlotStatus
        WHEN EXISTS(SELECT 1 FROM ParkingSessions s WHERE s.SlotID=ps.SlotID AND s.SessionStatus='Active' AND s.ExitTime IS NULL) THEN 'Occupied'
        WHEN EXISTS(SELECT 1 FROM Reservations r WHERE r.SlotID=ps.SlotID AND r.ReservationStatus='Reserved' AND r.EndTime>=GETDATE() AND r.StartTime<=DATEADD(HOUR,8,GETDATE())) THEN 'Reserved'
        ELSE 'Available' END
    FROM ParkingSlots ps WHERE ps.SlotStatus IN('Available','Occupied','Reserved');
END
GO

CREATE PROCEDURE sp_GetPeakHours @StartDate DATE=NULL, @EndDate DATE=NULL, @VehicleTypeID INT=NULL
AS BEGIN
    SET NOCOUNT ON;
    IF @StartDate IS NULL SET @StartDate=DATEADD(DAY,-30,CAST(GETDATE() AS DATE));
    IF @EndDate IS NULL SET @EndDate=CAST(GETDATE() AS DATE);
    SELECT vt.VehicleTypeID,vt.VehicleName,vt.VehicleCode,DATEPART(HOUR,s.EntryTime) AS Hour,COUNT(*) AS SessionCount
    FROM ParkingSessions s JOIN VehicleTypes vt ON s.VehicleTypeID=vt.VehicleTypeID
    WHERE CAST(s.EntryTime AS DATE) BETWEEN @StartDate AND @EndDate AND (@VehicleTypeID IS NULL OR s.VehicleTypeID=@VehicleTypeID)
    GROUP BY vt.VehicleTypeID,vt.VehicleName,vt.VehicleCode,DATEPART(HOUR,s.EntryTime) ORDER BY vt.VehicleTypeID,Hour;
END
GO

CREATE PROCEDURE sp_GetVehicleFlow @StartDate DATE=NULL, @EndDate DATE=NULL
AS BEGIN
    SET NOCOUNT ON;
    IF @StartDate IS NULL SET @StartDate=DATEADD(DAY,-30,CAST(GETDATE() AS DATE));
    IF @EndDate IS NULL SET @EndDate=CAST(GETDATE() AS DATE);
    SELECT CAST(s.EntryTime AS DATE) AS FlowDate,vt.VehicleName,vt.VehicleCode,COUNT(*) AS CheckInCount,
        SUM(CASE WHEN s.ExitTime IS NOT NULL AND CAST(s.ExitTime AS DATE)=CAST(s.EntryTime AS DATE) THEN 1 ELSE 0 END) AS CheckOutSameDay
    FROM ParkingSessions s JOIN VehicleTypes vt ON s.VehicleTypeID=vt.VehicleTypeID
    WHERE CAST(s.EntryTime AS DATE) BETWEEN @StartDate AND @EndDate
    GROUP BY CAST(s.EntryTime AS DATE),vt.VehicleName,vt.VehicleCode ORDER BY FlowDate,vt.VehicleName;
END
GO

CREATE PROCEDURE sp_GetParkingMap @buildingId INT=NULL, @floorId INT=NULL, @vehicleTypeId INT=NULL, @status NVARCHAR(20)=NULL
AS BEGIN
    SET NOCOUNT ON;
    SELECT b.BuildingID,b.BuildingName,b.Address,b.OperatingHours FROM Buildings b WHERE (@buildingId IS NULL OR b.BuildingID=@buildingId) ORDER BY b.BuildingID FOR JSON PATH,ROOT('buildings');
    SELECT f.FloorID,f.BuildingID,f.FloorName,f.IsActive FROM Floors f JOIN Buildings b ON f.BuildingID=b.BuildingID
    WHERE f.IsActive=1 AND (@buildingId IS NULL OR f.BuildingID=@buildingId) AND (@floorId IS NULL OR f.FloorID=@floorId) ORDER BY f.BuildingID,f.FloorID;
    SELECT z.ZoneID,z.FloorID,z.ZoneName,z.AllowedVehicleTypeID,z.TotalSlots,vt.VehicleCode,vt.VehicleName
    FROM Zones z JOIN VehicleTypes vt ON z.AllowedVehicleTypeID=vt.VehicleTypeID JOIN Floors f ON z.FloorID=f.FloorID
    WHERE f.IsActive=1 AND (@buildingId IS NULL OR f.BuildingID=@buildingId) AND (@floorId IS NULL OR z.FloorID=@floorId) AND (@vehicleTypeId IS NULL OR z.AllowedVehicleTypeID=@vehicleTypeId)
    ORDER BY z.FloorID,z.ZoneID;
    SELECT ps.SlotID,ps.ZoneID,ps.SlotCode,ps.VehicleTypeID,vt.VehicleCode,vt.VehicleName,
        sess.SessionID,sess.PlateNumber,sess.EntryTime,sess.SessionStatus,
        rsv.ReservationID,rsv.StartTime,rsv.EndTime,rsv.ReservationStatus,
        driver.FullName AS DriverName,driver.Email AS DriverEmail,driver.PhoneNumber AS DriverPhone,
        CASE WHEN ps.SlotStatus IN('Maintenance','Blocked') THEN ps.SlotStatus
             WHEN EXISTS(SELECT 1 FROM ParkingSessions s WHERE s.SlotID=ps.SlotID AND s.SessionStatus='Active') THEN 'Occupied'
             WHEN EXISTS(SELECT 1 FROM Reservations r WHERE r.SlotID=ps.SlotID AND r.ReservationStatus IN('Reserved','Completed') AND r.StartTime<=DATEADD(HOUR,8,GETDATE())) THEN 'Reserved'
             ELSE 'Available' END AS SlotStatus
    FROM ParkingSlots ps
    JOIN VehicleTypes vt ON ps.VehicleTypeID=vt.VehicleTypeID
    JOIN Zones z ON ps.ZoneID=z.ZoneID JOIN Floors f ON z.FloorID=f.FloorID
    LEFT JOIN (SELECT TOP 1 WITH TIES SlotID,SessionID,PlateNumber,EntryTime,SessionStatus FROM ParkingSessions WHERE SessionStatus='Active' ORDER BY ROW_NUMBER() OVER(PARTITION BY SlotID ORDER BY EntryTime DESC)) sess ON sess.SlotID=ps.SlotID
    LEFT JOIN (SELECT * FROM Reservations WHERE ReservationStatus IN('Reserved','Completed') AND StartTime<=DATEADD(HOUR,8,GETDATE())) rsv ON rsv.SlotID=ps.SlotID
    LEFT JOIN Users driver ON driver.UserID=rsv.DriverID
    WHERE f.IsActive=1 AND (@buildingId IS NULL OR f.BuildingID=@buildingId) AND (@floorId IS NULL OR z.FloorID=@floorId) AND (@vehicleTypeId IS NULL OR ps.VehicleTypeID=@vehicleTypeId)
    AND (@status IS NULL OR CASE WHEN ps.SlotStatus IN('Maintenance','Blocked') THEN ps.SlotStatus WHEN EXISTS(SELECT 1 FROM ParkingSessions s WHERE s.SlotID=ps.SlotID AND s.SessionStatus='Active') THEN 'Occupied' WHEN EXISTS(SELECT 1 FROM Reservations r WHERE r.SlotID=ps.SlotID AND r.ReservationStatus IN('Reserved','Completed') AND r.StartTime<=DATEADD(HOUR,8,GETDATE())) THEN 'Reserved' ELSE 'Available' END=@status)
    ORDER BY z.ZoneID,ps.SlotCode;
END
GO

CREATE PROCEDURE sp_GetPaymentHistory @DriverID INT, @Limit INT=20, @Offset INT=0
AS BEGIN
    SET NOCOUNT ON;
    SELECT v.*,
        CASE WHEN v.SurchargeAmount>0 THEN CONCAT('Trả trước: ',FORMAT(v.PrepaidAmount,'N0','vi-VN'),' VNĐ. Phụ trội: ',FORMAT(v.SurchargeAmount,'N0','vi-VN'),' VNĐ')
             WHEN v.PrepaidAmount>0   THEN CONCAT('Đã thanh toán QR: ',FORMAT(v.PrepaidAmount,'N0','vi-VN'),' VNĐ')
             ELSE '' END AS PaymentSummary
    FROM vw_PaymentHistory v WHERE v.DriverID=@DriverID
    ORDER BY CASE WHEN v.PrepaidAt IS NOT NULL THEN v.PrepaidAt ELSE v.PaymentTime END DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
END
GO

CREATE PROCEDURE sp_CreatePrepayment
    @SessionID INT, @OrderCode BIGINT, @Amount DECIMAL(10,2), @SnapshotH DECIMAL(10,2),
    @QrCode NVARCHAR(MAX)=NULL, @CheckoutUrl NVARCHAR(500)=NULL
AS BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS(SELECT 1 FROM ParkingSessions WHERE SessionID=@SessionID AND SessionStatus='Active') BEGIN RAISERROR('Session không tồn tại hoặc không active.',16,1); RETURN; END
    IF EXISTS(SELECT 1 FROM Payments WHERE SessionID=@SessionID)
        UPDATE Payments SET OrderCode=@OrderCode,Amount=@Amount,SnapshotDurationH=@SnapshotH,QrCode=@QrCode,CheckoutUrl=@CheckoutUrl,
            PaymentMethod='Banking',PaymentStatus='Pending',PrepaidAt=NULL,PrepaidAmount=0,SurchargeAmount=0,FinalAmount=NULL,SurchargeStatus='None' WHERE SessionID=@SessionID;
    ELSE
        INSERT INTO Payments (SessionID,Amount,PaymentMethod,PaymentStatus,OrderCode,SnapshotDurationH,QrCode,CheckoutUrl,PrepaidAmount,SurchargeAmount,SurchargeStatus)
        VALUES (@SessionID,@Amount,'Banking','Pending',@OrderCode,@SnapshotH,@QrCode,@CheckoutUrl,0,0,'None');
    SELECT p.PaymentID,p.SessionID,p.OrderCode,p.Amount,p.PaymentStatus,p.SnapshotDurationH FROM Payments p WHERE p.SessionID=@SessionID;
END
GO

CREATE PROCEDURE sp_MarkPaymentPrepaid @OrderCode BIGINT, @PaidAt DATETIME=NULL
AS BEGIN
    SET NOCOUNT ON;
    IF @PaidAt IS NULL SET @PaidAt=GETDATE();
    DECLARE @SessionID INT; SELECT @SessionID=SessionID FROM Payments WHERE OrderCode=@OrderCode AND PaymentStatus='Pending';
    IF @SessionID IS NULL BEGIN SELECT 0 AS Updated; RETURN; END
    DECLARE @Amount DECIMAL(10,2); SELECT @Amount=Amount FROM Payments WHERE SessionID=@SessionID;
    UPDATE Payments SET PaymentStatus='Prepaid',PrepaidAmount=@Amount,PrepaidAt=@PaidAt,PaymentTime=@PaidAt WHERE SessionID=@SessionID;
    SELECT @SessionID AS SessionID,@Amount AS PrepaidAmount,1 AS Updated;
END
GO

CREATE PROCEDURE sp_ConfirmSurcharge @SessionID INT, @PaymentMethod NVARCHAR(50)
AS BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS(SELECT 1 FROM Payments WHERE SessionID=@SessionID AND SurchargeStatus='Pending') BEGIN RAISERROR('Không có khoản phụ trội cần thu.',16,1); RETURN; END
    UPDATE Payments SET PaymentStatus='Completed',SurchargeStatus='Completed',SurchargePaidAt=GETDATE(),PaymentMethod=@PaymentMethod WHERE SessionID=@SessionID;
    SELECT p.PaymentID,p.SessionID,p.FinalAmount,p.PrepaidAmount,p.SurchargeAmount,p.PaymentStatus,p.SurchargeStatus FROM Payments p WHERE p.SessionID=@SessionID;
END
GO

/* =====================================================================
   PHẦN D: NIGHT PRICING FUNCTION + SP V2
   ===================================================================== */

CREATE FUNCTION fn_SplitDayNightSegments (@EntryTime DATETIME, @ExitTime DATETIME, @NightStart TIME, @NightEnd TIME)
RETURNS @Segments TABLE (SegStart DATETIME, SegEnd DATETIME, IsNight BIT)
AS BEGIN
    DECLARE @Cursor DATETIME = @EntryTime, @DayAnchor DATE;
    DECLARE @NightStartDT DATETIME, @NightEndDT DATETIME, @SafetyCounter INT = 0;
    WHILE @Cursor < @ExitTime AND @SafetyCounter < 60
    BEGIN
        SET @SafetyCounter += 1;
        SET @DayAnchor = CAST(@Cursor AS DATE);
        SET @NightStartDT = CAST(@DayAnchor AS DATETIME) + CAST(@NightStart AS DATETIME);
        SET @NightEndDT   = DATEADD(DAY,1,CAST(@DayAnchor AS DATETIME)) + CAST(@NightEnd AS DATETIME);
        IF @Cursor < @NightStartDT BEGIN
            DECLARE @SegEndDay DATETIME = CASE WHEN @ExitTime<@NightStartDT THEN @ExitTime ELSE @NightStartDT END;
            INSERT INTO @Segments VALUES(@Cursor,@SegEndDay,0); SET @Cursor=@SegEndDay;
        END ELSE IF @Cursor>=@NightStartDT AND @Cursor<@NightEndDT BEGIN
            DECLARE @SegEndNight DATETIME = CASE WHEN @ExitTime<@NightEndDT THEN @ExitTime ELSE @NightEndDT END;
            INSERT INTO @Segments VALUES(@Cursor,@SegEndNight,1); SET @Cursor=@SegEndNight;
        END ELSE SET @Cursor=DATEADD(DAY,1,CAST(@DayAnchor AS DATETIME));
    END
    RETURN;
END
GO

CREATE PROCEDURE sp_CalcParkingFeeV2
    @VehicleTypeID INT, @EntryTime DATETIME, @ExitTime DATETIME,
    @Fee DECIMAL(10,2) OUTPUT, @Breakdown NVARCHAR(MAX) OUTPUT
AS BEGIN
    SET NOCOUNT ON;
    DECLARE @NightStart TIME, @NightEnd TIME, @NightFee DECIMAL(10,2);
    SELECT @NightStart=NightStartTime,@NightEnd=NightEndTime,@NightFee=NightFee FROM NightPricingPolicies WHERE VehicleTypeID=@VehicleTypeID AND IsActive=1;
    DECLARE @Total DECIMAL(10,2)=0;
    IF @NightStart IS NULL BEGIN
        DECLARE @DurationH DECIMAL(10,2)=DATEDIFF(MINUTE,@EntryTime,@ExitTime)/60.0;
        SELECT TOP 1 @Total=Fee FROM PricingPolicies WHERE VehicleTypeID=@VehicleTypeID AND IsActive=1 AND IsOvernight=0 AND @DurationH BETWEEN MinHours AND MaxHours ORDER BY MaxHours;
        IF @Total IS NULL SET @Total=0;
        SET @Fee=@Total; SET @Breakdown=N'[{"type":"day_only","amount":'+CAST(@Total AS NVARCHAR(20))+'}]'; RETURN;
    END
    DECLARE @Segments TABLE (SegStart DATETIME,SegEnd DATETIME,IsNight BIT);
    INSERT INTO @Segments SELECT * FROM fn_SplitDayNightSegments(@EntryTime,@ExitTime,@NightStart,@NightEnd);
    DECLARE @BreakdownItems NVARCHAR(MAX)=N'[', @First BIT=1;
    DECLARE @SegStart DATETIME,@SegEnd DATETIME,@IsNight BIT;
    DECLARE seg_cursor CURSOR FOR SELECT SegStart,SegEnd,IsNight FROM @Segments ORDER BY SegStart;
    OPEN seg_cursor; FETCH NEXT FROM seg_cursor INTO @SegStart,@SegEnd,@IsNight;
    WHILE @@FETCH_STATUS=0 BEGIN
        DECLARE @SegAmount DECIMAL(10,2)=0, @SegHours DECIMAL(10,2)=DATEDIFF(MINUTE,@SegStart,@SegEnd)/60.0;
        IF @IsNight=1 SET @SegAmount=@NightFee;
        ELSE BEGIN
            SELECT TOP 1 @SegAmount=Fee FROM PricingPolicies WHERE VehicleTypeID=@VehicleTypeID AND IsActive=1 AND IsOvernight=0 AND @SegHours BETWEEN MinHours AND MaxHours ORDER BY MaxHours;
            IF @SegAmount IS NULL BEGIN SELECT TOP 1 @SegAmount=Fee FROM PricingPolicies WHERE VehicleTypeID=@VehicleTypeID AND IsActive=1 AND IsOvernight=0 ORDER BY MaxHours DESC; IF @SegAmount IS NULL SET @SegAmount=0; END
        END
        SET @Total+=@SegAmount;
        IF @First=0 SET @BreakdownItems+=N',';
        SET @BreakdownItems+=N'{"start":"'+CONVERT(NVARCHAR(20),@SegStart,120)+'","end":"'+CONVERT(NVARCHAR(20),@SegEnd,120)+'","isNight":'+CAST(@IsNight AS NVARCHAR(1))+',"hours":'+CAST(@SegHours AS NVARCHAR(10))+',"amount":'+CAST(@SegAmount AS NVARCHAR(20))+'}';
        SET @First=0;
        FETCH NEXT FROM seg_cursor INTO @SegStart,@SegEnd,@IsNight;
    END
    CLOSE seg_cursor; DEALLOCATE seg_cursor;
    SET @BreakdownItems+=N']'; SET @Fee=@Total; SET @Breakdown=@BreakdownItems;
END
GO

-- sp_CheckInVehicle (dùng giá mở đầu từ PricingPolicies)
CREATE PROCEDURE sp_CheckInVehicle @DriverID INT, @PlateNumber NVARCHAR(20), @VehicleTypeID INT, @SlotID INT
AS BEGIN
    SET NOCOUNT ON;
    DECLARE @SlotStatus NVARCHAR(20), @Fee DECIMAL(10,2), @SessionID INT;
    SELECT @SlotStatus=SlotStatus FROM ParkingSlots WHERE SlotID=@SlotID;
    IF @SlotStatus IS NULL OR @SlotStatus<>'Available' BEGIN RAISERROR('Slot not available.',16,1); RETURN; END
    INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus) VALUES (@SlotID,@DriverID,UPPER(@PlateNumber),@VehicleTypeID,GETDATE(),'Active');
    SET @SessionID=SCOPE_IDENTITY();
    SELECT TOP 1 @Fee=Fee FROM PricingPolicies WHERE VehicleTypeID=@VehicleTypeID AND MinHours=0 AND IsActive=1 ORDER BY MaxHours;
    INSERT INTO Payments (SessionID,Amount,PaymentMethod,PaymentStatus) VALUES (@SessionID,ISNULL(@Fee,0),'Pending','Pending');
    SELECT @SessionID AS NewSessionID;
END
GO

-- sp_CheckOutVehicle dùng sp_CalcParkingFeeV2
CREATE PROCEDURE sp_CheckOutVehicle @SessionID INT, @PaymentMethod NVARCHAR(50)
AS BEGIN
    SET NOCOUNT ON;
    DECLARE @EntryTime DATETIME, @ExitTime DATETIME, @VehicleTypeID INT, @Fee DECIMAL(10,2), @Breakdown NVARCHAR(MAX);
    SELECT @EntryTime=EntryTime,@VehicleTypeID=VehicleTypeID FROM ParkingSessions WHERE SessionID=@SessionID AND SessionStatus='Active';
    IF @EntryTime IS NULL BEGIN RAISERROR('Session not found or already completed.',16,1); RETURN; END
    SET @ExitTime=GETDATE();
    EXEC sp_CalcParkingFeeV2 @VehicleTypeID=@VehicleTypeID,@EntryTime=@EntryTime,@ExitTime=@ExitTime,@Fee=@Fee OUTPUT,@Breakdown=@Breakdown OUTPUT;
    UPDATE ParkingSessions SET ExitTime=@ExitTime,SessionStatus='Completed' WHERE SessionID=@SessionID;
    UPDATE Payments SET Amount=@Fee,PaymentMethod=@PaymentMethod,PaymentTime=@ExitTime,PaymentStatus='Completed',PaymentNote=@Breakdown WHERE SessionID=@SessionID;
    SELECT @Fee AS FinalFee,@Breakdown AS FeeBreakdown;
END
GO

-- sp_CheckOutWithSurcharge dùng sp_CalcParkingFeeV2
CREATE PROCEDURE sp_CheckOutWithSurcharge @SessionID INT, @PaymentMethod NVARCHAR(50)
AS BEGIN
    SET NOCOUNT ON; BEGIN TRANSACTION;
    DECLARE @EntryTime DATETIME, @ExitTime DATETIME=GETDATE(), @VehicleTypeID INT;
    DECLARE @FinalFee DECIMAL(10,2), @Breakdown NVARCHAR(MAX), @PrepaidAmount DECIMAL(10,2)=0, @PayStatus NVARCHAR(20);
    SELECT @EntryTime=EntryTime,@VehicleTypeID=VehicleTypeID FROM ParkingSessions WHERE SessionID=@SessionID AND SessionStatus='Active';
    IF @EntryTime IS NULL BEGIN ROLLBACK; RAISERROR('Session không tồn tại hoặc đã checkout.',16,1); RETURN; END
    EXEC sp_CalcParkingFeeV2 @VehicleTypeID=@VehicleTypeID,@EntryTime=@EntryTime,@ExitTime=@ExitTime,@Fee=@FinalFee OUTPUT,@Breakdown=@Breakdown OUTPUT;
    SELECT @PrepaidAmount=ISNULL(PrepaidAmount,0),@PayStatus=PaymentStatus FROM Payments WHERE SessionID=@SessionID;
    DECLARE @Surcharge DECIMAL(10,2)=@FinalFee-@PrepaidAmount; IF @Surcharge<0 SET @Surcharge=0;
    UPDATE ParkingSessions SET ExitTime=@ExitTime,SessionStatus='Completed' WHERE SessionID=@SessionID;
    IF @PayStatus='Prepaid' BEGIN
        IF @Surcharge>0 UPDATE Payments SET FinalAmount=@FinalFee,SurchargeAmount=@Surcharge,SurchargeStatus='Pending',PaymentNote=@Breakdown WHERE SessionID=@SessionID;
        ELSE UPDATE Payments SET FinalAmount=@FinalFee,SurchargeAmount=0,SurchargeStatus='None',PaymentStatus='Completed',PaymentMethod='Banking',PaymentNote=@Breakdown WHERE SessionID=@SessionID;
    END ELSE UPDATE Payments SET Amount=@FinalFee,FinalAmount=@FinalFee,SurchargeAmount=0,SurchargeStatus='None',PaymentMethod=@PaymentMethod,PaymentTime=@ExitTime,PaymentStatus='Completed',PaymentNote=@Breakdown WHERE SessionID=@SessionID;
    COMMIT;
    SELECT @SessionID AS SessionID,@FinalFee AS FinalFee,@Surcharge AS SurchargeAmount,@Breakdown AS FeeBreakdown;
END
GO

/* =====================================================================
   PHẦN E: TRIGGERS
   ===================================================================== */

CREATE TRIGGER TRG_AutoUpperVehicleName ON VehicleTypes AFTER INSERT,UPDATE AS BEGIN SET NOCOUNT ON; UPDATE vt SET vt.VehicleName=UPPER(vt.VehicleName) FROM VehicleTypes vt JOIN inserted i ON vt.VehicleTypeID=i.VehicleTypeID; END
GO
CREATE TRIGGER TRG_UpperPlateNumber ON ParkingSessions AFTER INSERT,UPDATE AS BEGIN SET NOCOUNT ON; UPDATE ps SET ps.PlateNumber=UPPER(ps.PlateNumber) FROM ParkingSessions ps JOIN inserted i ON ps.SessionID=i.SessionID; END
GO
CREATE TRIGGER TRG_ValidateExitTime ON ParkingSessions AFTER INSERT,UPDATE AS BEGIN SET NOCOUNT ON; IF EXISTS(SELECT 1 FROM inserted i WHERE i.ExitTime IS NOT NULL AND i.ExitTime<=i.EntryTime) BEGIN RAISERROR('ExitTime must be greater than EntryTime.',16,1); ROLLBACK TRANSACTION; RETURN; END END
GO
CREATE TRIGGER TRG_UpdateSlotStatus ON ParkingSessions AFTER INSERT,UPDATE AS BEGIN SET NOCOUNT ON;
    UPDATE ps SET ps.SlotStatus=CASE WHEN ps.SlotStatus IN('Maintenance','Blocked') THEN ps.SlotStatus WHEN EXISTS(SELECT 1 FROM ParkingSessions s WHERE s.SlotID=ps.SlotID AND s.SessionStatus='Active') THEN 'Occupied' WHEN EXISTS(SELECT 1 FROM Reservations r WHERE r.SlotID=ps.SlotID AND r.ReservationStatus='Reserved' AND r.StartTime<=DATEADD(HOUR,8,GETDATE())) THEN 'Reserved' ELSE 'Available' END
    FROM ParkingSlots ps WHERE ps.SlotID IN(SELECT DISTINCT i.SlotID FROM inserted i WHERE i.SlotID IS NOT NULL);
END
GO
CREATE TRIGGER TRG_RecalculateSlotStatus_OnReservation ON Reservations AFTER INSERT,UPDATE AS BEGIN SET NOCOUNT ON;
    UPDATE ps SET ps.SlotStatus=CASE WHEN ps.SlotStatus IN('Maintenance','Blocked') THEN ps.SlotStatus WHEN EXISTS(SELECT 1 FROM ParkingSessions s WHERE s.SlotID=ps.SlotID AND s.SessionStatus='Active') THEN 'Occupied' WHEN EXISTS(SELECT 1 FROM Reservations r WHERE r.SlotID=ps.SlotID AND r.ReservationStatus='Reserved' AND r.StartTime<=DATEADD(HOUR,8,GETDATE())) THEN 'Reserved' ELSE 'Available' END
    FROM ParkingSlots ps WHERE ps.SlotID IN(SELECT DISTINCT i.SlotID FROM inserted i WHERE i.SlotID IS NOT NULL);
END
GO
CREATE TRIGGER TRG_AutoIncident ON ParkingSessions AFTER UPDATE AS BEGIN SET NOCOUNT ON;
    INSERT INTO Incidents (SessionID,DriverID,IncidentType,IncidentStatus,Priority,Description,CreatedAt,UpdatedAt)
    SELECT i.SessionID,i.DriverID,'Lost Ticket','Open','Normal','Auto-created lost ticket',GETDATE(),GETDATE() FROM inserted i WHERE i.SessionStatus='Lost'
    AND NOT EXISTS(SELECT 1 FROM Incidents inc WHERE inc.SessionID=i.SessionID AND inc.IncidentType='Lost Ticket' AND inc.IncidentStatus IN('Open','InProgress'));
END
GO

/* =====================================================================
   PHẦN F: VIEWS
   ===================================================================== */

CREATE VIEW vw_PaymentHistory AS
SELECT p.PaymentID,p.SessionID,p.OrderCode,p.Amount,p.PrepaidAmount,p.SurchargeAmount,p.FinalAmount,
    p.PaymentMethod,p.PaymentStatus,p.SurchargeStatus,p.PrepaidAt,p.PaymentTime,p.SurchargePaidAt,p.SnapshotDurationH,p.PaymentNote,
    ps.PlateNumber,ps.EntryTime,ps.ExitTime,ps.SessionStatus,ps.DriverID,
    vt.VehicleName,vt.VehicleCode,sl.SlotCode,z.ZoneName,f.FloorName,b.BuildingName,
    u.FullName AS DriverName,u.Email AS DriverEmail,
    DATEDIFF(MINUTE,ps.EntryTime,CASE WHEN ps.ExitTime IS NOT NULL THEN ps.ExitTime ELSE GETDATE() END) AS ParkingMinutes
FROM Payments p JOIN ParkingSessions ps ON p.SessionID=ps.SessionID JOIN VehicleTypes vt ON ps.VehicleTypeID=vt.VehicleTypeID
JOIN ParkingSlots sl ON ps.SlotID=sl.SlotID JOIN Zones z ON sl.ZoneID=z.ZoneID JOIN Floors f ON z.FloorID=f.FloorID JOIN Buildings b ON f.BuildingID=b.BuildingID
LEFT JOIN Users u ON ps.DriverID=u.UserID;
GO

CREATE VIEW vw_RevenueByDay AS
SELECT CAST(ISNULL(p.PaymentTime,p.SurchargePaidAt) AS DATE) AS RevenueDate, COUNT(*) AS TransactionCount,
    SUM(ISNULL(p.FinalAmount,p.Amount)) AS TotalRevenue,
    SUM(CASE WHEN p.PaymentMethod='Cash'    THEN ISNULL(p.FinalAmount,p.Amount) ELSE 0 END) AS CashRevenue,
    SUM(CASE WHEN p.PaymentMethod='Banking' THEN ISNULL(p.FinalAmount,p.Amount) ELSE 0 END) AS BankingRevenue
FROM Payments p WHERE p.PaymentStatus IN('Completed','Prepaid') AND ISNULL(p.PaymentTime,p.SurchargePaidAt) IS NOT NULL
GROUP BY CAST(ISNULL(p.PaymentTime,p.SurchargePaidAt) AS DATE);
GO

CREATE VIEW vw_OccupancyByZone AS
SELECT b.BuildingID,b.BuildingName,f.FloorID,f.FloorName,z.ZoneID,z.ZoneName,vt.VehicleName,
    COUNT(ps.SlotID) AS TotalSlots,
    SUM(CASE WHEN ps.SlotStatus='Occupied'    THEN 1 ELSE 0 END) AS Occupied,
    SUM(CASE WHEN ps.SlotStatus='Available'   THEN 1 ELSE 0 END) AS Available,
    SUM(CASE WHEN ps.SlotStatus='Reserved'    THEN 1 ELSE 0 END) AS Reserved,
    SUM(CASE WHEN ps.SlotStatus='Maintenance' THEN 1 ELSE 0 END) AS Maintenance,
    SUM(CASE WHEN ps.SlotStatus='Blocked'     THEN 1 ELSE 0 END) AS Blocked,
    CASE WHEN COUNT(ps.SlotID)=0 THEN 0 ELSE ROUND(100.0*SUM(CASE WHEN ps.SlotStatus='Occupied' THEN 1 ELSE 0 END)/COUNT(ps.SlotID),1) END AS OccupancyPct
FROM ParkingSlots ps JOIN Zones z ON ps.ZoneID=z.ZoneID JOIN Floors f ON z.FloorID=f.FloorID
JOIN Buildings b ON f.BuildingID=b.BuildingID JOIN VehicleTypes vt ON z.AllowedVehicleTypeID=vt.VehicleTypeID
WHERE f.IsActive=1 GROUP BY b.BuildingID,b.BuildingName,f.FloorID,f.FloorName,z.ZoneID,z.ZoneName,vt.VehicleName;
GO

/* =====================================================================
   PHẦN G: MIGRATIONS — chạy cho DB đang chạy (idempotent)
   ===================================================================== */

-- EarlyFeeAmount: phụ phí đến sớm cố định (5.000đ nếu đến trước 15-60 phút)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ParkingSessions') AND name = 'EarlyFeeAmount')
    ALTER TABLE ParkingSessions ADD EarlyFeeAmount INT NOT NULL DEFAULT 0;
GO

-- BookingStartTime: thời điểm booking bắt đầu (lưu để phát hiện "vào sớm ra sớm")
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ParkingSessions') AND name = 'BookingStartTime')
    ALTER TABLE ParkingSessions ADD BookingStartTime DATETIME NULL;
GO

CREATE TRIGGER TRG_NotifyOnPaymentComplete ON Payments AFTER INSERT,UPDATE AS BEGIN SET NOCOUNT ON;
    INSERT INTO Notifications (UserID,Title,Message,NotificationType,ReferenceID,ReferenceType,CreatedAt)
    SELECT s.DriverID,N'Thanh toán thành công',N'Thanh toán '+FORMAT(i.Amount,'N0')+N'đ cho phiên gửi xe '+s.PlateNumber+N' đã hoàn tất.','payment',i.PaymentID,'payment',GETDATE()
    FROM inserted i JOIN ParkingSessions s ON i.SessionID=s.SessionID
    WHERE i.PaymentStatus='Completed' AND s.DriverID IS NOT NULL
      AND (EXISTS(SELECT 1 FROM deleted d WHERE d.PaymentID=i.PaymentID AND d.PaymentStatus<>'Completed') OR NOT EXISTS(SELECT 1 FROM deleted d WHERE d.PaymentID=i.PaymentID));
END
GO



/* =====================================================================
   PHẦN G: MASTER DATA (v2 gốc - giữ nguyên)
   ===================================================================== */

INSERT INTO Roles (RoleName,Description) VALUES
('Driver',  'Regular parking customer'),
('Staff',   'Parking lot staff'),
('Manager', 'Parking lot manager'),
('Admin',   'System administrator');
GO

INSERT INTO Permissions (PermissionName,Description) VALUES
('VIEW_SLOTS',      'View parking slots'),
('MANAGE_SESSIONS', 'Manage parking sessions'),
('MANAGE_USERS',    'Manage users'),
('VIEW_REPORTS',    'View reports'),
('MANAGE_PAYMENTS', 'Manage payments');
GO

INSERT INTO RolePermissions (RoleID,PermissionID) VALUES
(1,1),(2,1),(2,2),(2,5),(3,1),(3,2),(3,3),(3,4),(3,5),(4,1),(4,2),(4,3),(4,4),(4,5);
GO

INSERT INTO VehicleTypes (VehicleCode,VehicleName,Description) VALUES
('MOTO', 'Motorbike', 'Motorcycles and scooters'),
('CAR',  'Car',       'Passenger cars'),
('TRUCK','Truck',     'Light trucks');
GO
-- Bảng giá ban ngày theo khung giờ thực tế (MOTO/CAR/TRUCK)
-- MOTO: 0-4h=5,000đ | 4-8h=8,000đ | 8h+=15,000đ
-- CAR:  0-4h=40,000đ | 4-8h=70,000đ | 8h+=120,000đ
-- TRUCK:0-4h=70,000đ | 4-8h=130,000đ | 8h+=200,000đ
INSERT INTO PricingPolicies (VehicleTypeID,MinHours,MaxHours,Fee,IsOvernight,IsActive) VALUES
(1, 0, 4,   5000,   0, 1),
(1, 4, 8,   8000,   0, 1),
(1, 8, 999, 15000,  0, 1),
(2, 0, 4,   40000,  0, 1),
(2, 4, 8,   70000,  0, 1),
(2, 8, 999, 120000, 0, 1),
(3, 0, 4,   70000,  0, 1),
(3, 4, 8,   130000, 0, 1),
(3, 8, 999, 200000, 0, 1);
GO

-- Giá đêm 22:00-06:00
INSERT INTO NightPricingPolicies (VehicleTypeID,NightStartTime,NightEndTime,NightFee,IsActive)
SELECT VehicleTypeID,'22:00:00','06:00:00',
    CASE VehicleCode WHEN 'MOTO' THEN 12000 WHEN 'CAR' THEN 120000 ELSE 0 END,
    CASE VehicleCode WHEN 'TRUCK' THEN 0 ELSE 1 END
FROM VehicleTypes;
GO

INSERT INTO SubscriptionPlans (PlanID,Name,BasePrice,Description) VALUES
('basic',   N'Cơ Bản',  99000,  N'5 phiên miễn phí mỗi tháng (1 phiên = 4 tiếng), sau đó giảm 10%. Áp dụng cho xe Mặc định.'),
('pro',     N'Nâng Cao',199000, N'15 phiên miễn phí mỗi tháng (1 phiên = 4 tiếng), sau đó giảm 25%. Áp dụng cho xe Mặc định.'),
('premium', N'Cao Cấp', 399000, N'300 phiên miễn phí mỗi tháng (~1200 giờ). Đăng ký tối đa 2 xe mặc định miễn phí.');
GO

/* ===================================================================
   BUILDINGS V2 GỐC (Toa A, Toa B - giữ nguyên)
   =================================================================== */

INSERT INTO Buildings (BuildingName,Address,OperatingHours,TotalFloors) VALUES
(N'Toa A', '123 Nguyen Van Linh, Q7', '06:00-22:00', 3),
(N'Toa B', '456 Le Van Viet, Q9',     '00:00-23:59', 2);
GO

INSERT INTO Floors (BuildingID,FloorName) VALUES
(1,'Tang 1'),(1,'Tang 2'),(1,'Tang 3'),
(2,'Tang 1'),(2,'Tang 2');
GO

INSERT INTO Zones (FloorID,ZoneName,AllowedVehicleTypeID,TotalSlots) VALUES
(1,'Zone A - Xe may',1,10),
(1,'Zone B - O to',  2, 5),
(2,'Zone C - Xe may',1,10),
(2,'Zone D - O to',  2, 5),
(3,'Zone E - Xe tai',3, 4),
(4,'Zone F - Xe may',1, 8),
(4,'Zone G - O to',  2, 4),
(5,'Zone H - O to',  2, 4);
GO

-- Slots v2 gốc (Toa A, B)
INSERT INTO ParkingSlots (ZoneID,SlotCode,VehicleTypeID) VALUES
(1,'A-M-01',1),(1,'A-M-02',1),(1,'A-M-03',1),(1,'A-M-04',1),(1,'A-M-05',1),
(2,'A-C-01',2),(2,'A-C-02',2),(2,'A-C-03',2),(2,'A-C-04',2),(2,'A-C-05',2),
(3,'B-M-01',1),(3,'B-M-02',1),(3,'B-M-03',1),(3,'B-M-04',1),(3,'B-M-05',1),
(4,'B-C-01',2),(4,'B-C-02',2),(4,'B-C-03',2),(4,'B-C-04',2),(4,'B-C-05',2);
GO

/* ===================================================================
   USERS V2 GỐC (Alice, Bob, Carol, David, Eve, Grace)
   =================================================================== */

DECLARE @PW NVARCHAR(256) = '$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2';
INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified) VALUES
('Alice Driver',  'alice@email.com',   @PW,'0901000001',1,NULL,        NULL,        1,1),
('Bob Staff',     'bob@email.com',     @PW,'0901000002',2,'1990-05-10','2015-06-01',1,1),
('Carol Manager', 'carol@email.com',   @PW,'0901000003',3,'1985-03-20','2010-04-15',1,1),
('David Driver',  'david@email.com',   @PW,'0901000004',1,NULL,        NULL,        1,1),
('Eve Driver',    'eve@email.com',     @PW,'0901000005',1,NULL,        NULL,        1,1),
('Grace Admin',   'admin@parking.com', @PW,'0901000007',4,'1990-01-01','2023-01-01',1,1);
GO

INSERT INTO UserAuthProviders (UserID,ProviderName,ProviderUserID,ProviderEmail)
SELECT UserID,'local',CAST(UserID AS NVARCHAR(200)),Email FROM Users WHERE PasswordHash IS NOT NULL;
GO

/* ===================================================================
   SESSIONS + PAYMENTS V2 GỐC
   6 kịch bản Active bao phủ đủ 3 bracket ngày + cross-night
   2 kịch bản Completed với FinalAmount tính đúng
   =================================================================== */

-- Active: MOTO bracket 0-4h (vào 1.5h trước)
INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29A-10001', 1, DATEADD(MINUTE,-90,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='A-M-01' AND u.Email='alice@email.com';

-- Active: MOTO bracket 4-8h (vào 5h trước)
INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29A-10002', 1, DATEADD(HOUR,-5,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='A-M-02' AND u.Email='david@email.com';

-- Active: MOTO bracket 8h+ (vào 9h trước)
INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29A-10003', 1, DATEADD(HOUR,-9,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='A-M-03' AND u.Email='eve@email.com';

-- Active: CAR bracket 0-4h (vào 2h trước)
INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '51G-10001', 2, DATEADD(HOUR,-2,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='A-C-01' AND u.Email='alice@email.com';

-- Active: CAR bracket 4-8h (vào 6h trước)
INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '51G-10002', 2, DATEADD(HOUR,-6,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='A-C-02' AND u.Email='david@email.com';

-- Active: CAR bracket 8h+ (vào 10h trước)
INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '51G-10003', 2, DATEADD(HOUR,-10,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='A-C-03' AND u.Email='eve@email.com';

-- Active: MOTO cross-night (vào 17h trước, qua 22:00 → phát sinh phí đêm 12,000đ)
INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29A-10004', 1, DATEADD(HOUR,-17,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='B-M-01' AND u.Email='alice@email.com';
GO

-- Payments cho Active sessions (Amount = bracket tối thiểu tại thời điểm check-in)
INSERT INTO Payments (SessionID,Amount,PaymentMethod,PaymentStatus)
SELECT s.SessionID,
    CASE s.VehicleTypeID WHEN 1 THEN 5000 WHEN 2 THEN 40000 ELSE 70000 END,
    'Cash', 'Pending'
FROM ParkingSessions s
WHERE s.PlateNumber IN ('29A-10001','29A-10002','29A-10003','51G-10001','51G-10002','51G-10003','29A-10004')
  AND s.SessionStatus = 'Active';
GO

-- Completed: MOTO 3h (bracket 0-4h → 5,000đ)
INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,ExitTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29A-20001', 1,
    DATEADD(DAY,-1,DATEADD(HOUR,8, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-1,DATEADD(HOUR,11,CAST(CAST(GETDATE() AS DATE) AS DATETIME))), 'Completed'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='B-M-02' AND u.Email='david@email.com';

-- Completed: CAR 12h (bracket 8h+ → 120,000đ)
INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,ExitTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '51G-20001', 2,
    DATEADD(DAY,-2,DATEADD(HOUR,9, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-2,DATEADD(HOUR,21,CAST(CAST(GETDATE() AS DATE) AS DATETIME))), 'Completed'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='B-C-01' AND u.Email='eve@email.com';
GO

-- Payments cho Completed sessions (Amount + FinalAmount theo bracket thực tế)
INSERT INTO Payments (SessionID,Amount,PaymentMethod,PaymentTime,PaymentStatus,FinalAmount)
SELECT s.SessionID,
    CASE WHEN DATEDIFF(MINUTE,s.EntryTime,s.ExitTime)/60.0<=4
              THEN CASE s.VehicleTypeID WHEN 1 THEN 5000  WHEN 2 THEN 40000  ELSE 70000  END
         WHEN DATEDIFF(MINUTE,s.EntryTime,s.ExitTime)/60.0<=8
              THEN CASE s.VehicleTypeID WHEN 1 THEN 8000  WHEN 2 THEN 70000  ELSE 130000 END
         ELSE      CASE s.VehicleTypeID WHEN 1 THEN 15000 WHEN 2 THEN 120000 ELSE 200000 END END,
    'Cash', s.ExitTime, 'Completed',
    CASE WHEN DATEDIFF(MINUTE,s.EntryTime,s.ExitTime)/60.0<=4
              THEN CASE s.VehicleTypeID WHEN 1 THEN 5000  WHEN 2 THEN 40000  ELSE 70000  END
         WHEN DATEDIFF(MINUTE,s.EntryTime,s.ExitTime)/60.0<=8
              THEN CASE s.VehicleTypeID WHEN 1 THEN 8000  WHEN 2 THEN 70000  ELSE 130000 END
         ELSE      CASE s.VehicleTypeID WHEN 1 THEN 15000 WHEN 2 THEN 120000 ELSE 200000 END END
FROM ParkingSessions s
WHERE s.PlateNumber IN ('29A-20001','51G-20001') AND s.SessionStatus='Completed';
GO

/* ===================================================================
   RESERVATIONS V2 GỐC
   =================================================================== */

INSERT INTO Reservations (DriverID,VehicleTypeID,SlotID,ReservationDate,StartTime,EndTime,ReservationStatus)
SELECT u.UserID, 1, ps.SlotID,
    CAST(GETDATE() AS DATE), DATEADD(HOUR,1,GETDATE()), DATEADD(HOUR,4,GETDATE()), 'Reserved'
FROM Users u, ParkingSlots ps WHERE u.Email='alice@email.com' AND ps.SlotCode='A-M-04';

INSERT INTO Reservations (DriverID,VehicleTypeID,SlotID,ReservationDate,StartTime,EndTime,ReservationStatus)
SELECT u.UserID, 2, ps.SlotID,
    CAST(GETDATE() AS DATE), DATEADD(HOUR,2,GETDATE()), DATEADD(HOUR,5,GETDATE()), 'Reserved'
FROM Users u, ParkingSlots ps WHERE u.Email='david@email.com' AND ps.SlotCode='A-C-04';
GO

/* ===================================================================
   INCIDENTS + FEEDBACKS V2 GỐC
   =================================================================== */

INSERT INTO Incidents (SessionID,DriverID,IncidentType,IncidentStatus,Priority,Description,AssignedStaffID)
SELECT s.SessionID, s.DriverID, 'Lost Ticket', 'Open', 'Normal',
    N'Khach mat ve gui xe tai o do. Bien so: ' + s.PlateNumber, 2
FROM ParkingSessions s WHERE s.PlateNumber='29A-10001';

INSERT INTO Incidents (SessionID,DriverID,IncidentType,IncidentStatus,Priority,Description,AssignedStaffID)
SELECT s.SessionID, s.DriverID, 'Overdue', 'Open', 'High',
    N'Xe dau qua gio cho phep. Bien so: ' + s.PlateNumber, 2
FROM ParkingSessions s WHERE s.PlateNumber='29A-10002';

INSERT INTO Incidents (SessionID,DriverID,IncidentType,IncidentStatus,Priority,Description,AssignedStaffID)
SELECT s.SessionID, s.DriverID, 'Wrong Slot', 'Open', 'Normal',
    N'Xe dau sai vi tri quy dinh. Bien so: ' + s.PlateNumber, 2
FROM ParkingSessions s WHERE s.PlateNumber='51G-10001';
GO

INSERT INTO Feedbacks (DriverID,IncidentID,FeedbackType,Description,FeedbackStatus)
SELECT i.DriverID, i.IncidentID, 'Complaint',
    N'Quy trinh xu ly mat ve can duoc cai thien.', 'Open'
FROM Incidents i WHERE i.IncidentType='Lost Ticket'
  AND NOT EXISTS (SELECT 1 FROM Feedbacks f WHERE f.IncidentID=i.IncidentID);

INSERT INTO Feedbacks (DriverID,IncidentID,FeedbackType,Description,FeedbackStatus)
SELECT i.DriverID, i.IncidentID, 'Complaint',
    N'Phi qua han chua ro rang, can thong bao som hon.', 'Open'
FROM Incidents i WHERE i.IncidentType='Overdue'
  AND NOT EXISTS (SELECT 1 FROM Feedbacks f WHERE f.IncidentID=i.IncidentID);

INSERT INTO Feedbacks (DriverID,IncidentID,FeedbackType,Description,FeedbackStatus)
SELECT i.DriverID, i.IncidentID, 'Complaint',
    N'Bien bao khu vuc cho xe chua ro rang.', 'Open'
FROM Incidents i WHERE i.IncidentType='Wrong Slot'
  AND NOT EXISTS (SELECT 1 FROM Feedbacks f WHERE f.IncidentID=i.IncidentID);
GO

-- Nạp 500k cho Alice (v2 gốc)
DECLARE @AliceID INT;
SELECT @AliceID = UserID FROM Users WHERE Email = 'alice@email.com';
IF @AliceID IS NOT NULL
    EXEC sp_TopUpWallet @UserID=@AliceID, @Amount=999999999, @ReferenceID='SEED', @Description=N'Admin Topup 999M cho Alice test';
GO

-- Đồng bộ slot status ban đầu
UPDATE ps SET ps.SlotStatus =
    CASE WHEN ps.SlotStatus IN ('Maintenance','Blocked') THEN ps.SlotStatus
         WHEN EXISTS(SELECT 1 FROM ParkingSessions s WHERE s.SlotID=ps.SlotID AND s.SessionStatus='Active') THEN 'Occupied'
         WHEN EXISTS(SELECT 1 FROM Reservations r WHERE r.SlotID=ps.SlotID AND r.ReservationStatus='Reserved' AND r.StartTime<=DATEADD(HOUR,8,GETDATE())) THEN 'Reserved'
         ELSE 'Available' END
FROM ParkingSlots ps;
GO

PRINT '>>> V2 goc data xong <<<';
GO


/* =====================================================================
   PHẦN 2: SUBSCRIPTION PLANS (nếu chưa có)
   ===================================================================== */

IF NOT EXISTS (SELECT 1 FROM SubscriptionPlans WHERE PlanID = 'basic')
    INSERT INTO SubscriptionPlans (PlanID, Name, BasePrice, Description) VALUES
    ('basic',   N'Cơ Bản',  99000,  N'5 lần miễn phí mỗi tháng, sau đó giảm 10% cho các lần tiếp theo.'),
    ('pro',     N'Nâng Cao',199000, N'15 lần miễn phí mỗi tháng, sau đó giảm 25% cho các lần tiếp theo.'),
    ('premium', N'Cao Cấp', 399000, N'Trải nghiệm đặc quyền. Giảm 20%, slot VIP, không giới hạn.');
GO

/* =====================================================================
   PHẦN 3: 3 TÒA NHÀ TẦNG HẦM + ZONES
   ===================================================================== */

-- Thêm 3 tòa mới (tầng hầm thực tế)
INSERT INTO Buildings (BuildingName, Address, OperatingHours, TotalFloors) VALUES
(N'Toa C - Chung Cu Cao Cap Riverside',     N'118 Nguyen Huu Tho, P.Tan Hung, Q.7, TP.HCM',     N'06:00-22:00', 3),
(N'Toa D - Toa Nha Van Phong Saigon Tower', N'29 Le Duan, P.Ben Nghe, Q.1, TP.HCM',             N'00:00-23:59', 2),
(N'Toa E - To Hop TTTM Aeon Mall',          N'30 Bo Bao Tan Thang, P.Son Ky, Q.Tan Phu, TP.HCM',N'08:00-22:00', 3);
GO

-- Floors dùng subquery trực tiếp (tránh lỗi scope biến sau GO)
INSERT INTO Floors (BuildingID, FloorName) VALUES
((SELECT TOP 1 BuildingID FROM Buildings WHERE BuildingName LIKE N'Toa C - Chung Cu%'), N'Tang Ham B1'),
((SELECT TOP 1 BuildingID FROM Buildings WHERE BuildingName LIKE N'Toa C - Chung Cu%'), N'Tang Ham B2'),
((SELECT TOP 1 BuildingID FROM Buildings WHERE BuildingName LIKE N'Toa C - Chung Cu%'), N'Tang Ham B3'),
((SELECT TOP 1 BuildingID FROM Buildings WHERE BuildingName LIKE N'Toa D - Toa Nha%'),  N'Tang Ham B1'),
((SELECT TOP 1 BuildingID FROM Buildings WHERE BuildingName LIKE N'Toa D - Toa Nha%'),  N'Tang Ham B2'),
((SELECT TOP 1 BuildingID FROM Buildings WHERE BuildingName LIKE N'Toa E - To Hop%'),   N'Tang Ham B1'),
((SELECT TOP 1 BuildingID FROM Buildings WHERE BuildingName LIKE N'Toa E - To Hop%'),   N'Tang Ham B2'),
((SELECT TOP 1 BuildingID FROM Buildings WHERE BuildingName LIKE N'Toa E - To Hop%'),   N'Tang Ham B3');
GO

-- Zones: dùng INSERT SELECT để tránh lỗi subquery NULL
INSERT INTO Zones (FloorID, ZoneName, AllowedVehicleTypeID, TotalSlots)
SELECT f.FloorID, zone.ZoneName, zone.VTypeID, zone.TotalSlots
FROM (VALUES
    -- Toa C - B1
    (N'Toa C%', N'Tang Ham B1', N'C-B1-ZoneA Xe May', 1, 150),
    (N'Toa C%', N'Tang Ham B1', N'C-B1-ZoneB Xe May', 1, 120),
    (N'Toa C%', N'Tang Ham B1', N'C-B1-ZoneC O To',   2,  60),
    (N'Toa C%', N'Tang Ham B1', N'C-B1-ZoneD O To',   2,  40),
    -- Toa C - B2
    (N'Toa C%', N'Tang Ham B2', N'C-B2-ZoneA Xe May', 1, 120),
    (N'Toa C%', N'Tang Ham B2', N'C-B2-ZoneB Xe May', 1, 100),
    (N'Toa C%', N'Tang Ham B2', N'C-B2-ZoneC O To',   2,  50),
    (N'Toa C%', N'Tang Ham B2', N'C-B2-ZoneD O To',   2,  30),
    -- Toa C - B3
    (N'Toa C%', N'Tang Ham B3', N'C-B3-ZoneA Xe May', 1,  80),
    (N'Toa C%', N'Tang Ham B3', N'C-B3-ZoneB O To',   2,  30),
    (N'Toa C%', N'Tang Ham B3', N'C-B3-ZoneC Xe Tai', 3,  15),
    -- Toa D - B1
    (N'Toa D%', N'Tang Ham B1', N'D-B1-ZoneA Xe May', 1,  80),
    (N'Toa D%', N'Tang Ham B1', N'D-B1-ZoneB Xe May', 1,  60),
    (N'Toa D%', N'Tang Ham B1', N'D-B1-ZoneC O To',   2,  50),
    -- Toa D - B2
    (N'Toa D%', N'Tang Ham B2', N'D-B2-ZoneA Xe May',   1,  60),
    (N'Toa D%', N'Tang Ham B2', N'D-B2-ZoneB O To',     2,  40),
    (N'Toa D%', N'Tang Ham B2', N'D-B2-ZoneC O To VIP', 2,  20),
    -- Toa E - B1
    (N'Toa E%', N'Tang Ham B1', N'E-B1-ZoneA Xe May', 1, 120),
    (N'Toa E%', N'Tang Ham B1', N'E-B1-ZoneB Xe May', 1, 100),
    (N'Toa E%', N'Tang Ham B1', N'E-B1-ZoneC O To',   2,  60),
    (N'Toa E%', N'Tang Ham B1', N'E-B1-ZoneD O To',   2,  40),
    -- Toa E - B2
    (N'Toa E%', N'Tang Ham B2', N'E-B2-ZoneA Xe May', 1,  80),
    (N'Toa E%', N'Tang Ham B2', N'E-B2-ZoneB O To',   2,  50),
    (N'Toa E%', N'Tang Ham B2', N'E-B2-ZoneC O To',   2,  40),
    -- Toa E - B3
    (N'Toa E%', N'Tang Ham B3', N'E-B3-ZoneA Xe Tai',   3,  20),
    (N'Toa E%', N'Tang Ham B3', N'E-B3-ZoneB O To VIP', 2,  30)
) AS zone(BldPattern, FloorName, ZoneName, VTypeID, TotalSlots)
JOIN Floors f    ON f.FloorName = zone.FloorName
JOIN Buildings b ON b.BuildingID = f.BuildingID AND b.BuildingName LIKE zone.BldPattern;
GO

PRINT '>>> Da tao Buildings, Floors, Zones <<<';
GO

/* =====================================================================
   PHẦN 4: SLOTS (~1045 slot) dùng INSERT SELECT
   ===================================================================== */

-- Zone: C-B1-ZoneA Xe May (150 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-001', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-002', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-003', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-004', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-005', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-006', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-007', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-008', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-009', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-010', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-011', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-012', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-013', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-014', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-015', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-016', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-017', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-018', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-019', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-020', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-021', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-022', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-023', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-024', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-025', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-026', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-027', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-028', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-029', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-030', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-031', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-032', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-033', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-034', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-035', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-036', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-037', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-038', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-039', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-040', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-041', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-042', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-043', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-044', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-045', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-046', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-047', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-048', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-049', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-050', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-051', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-052', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-053', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-054', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-055', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-056', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-057', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-058', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-059', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-060', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-061', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-062', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-063', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-064', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-065', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-066', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-067', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-068', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-069', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-070', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-071', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-072', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-073', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-074', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-075', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-076', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-077', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-078', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-079', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-080', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-081', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-082', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-083', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-084', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-085', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-086', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-087', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-088', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-089', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-090', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-091', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-092', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-093', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-094', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-095', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-096', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-097', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-098', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-099', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-100', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-101', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-102', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-103', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-104', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-105', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-106', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-107', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-108', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-109', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-110', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-111', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-112', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-113', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-114', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-115', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-116', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-117', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-118', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-119', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-120', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-121', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-122', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-123', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-124', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-125', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-126', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-127', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-128', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-129', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-130', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-131', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-132', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-133', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-134', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-135', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-136', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-137', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-138', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-139', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-140', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-141', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-142', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-143', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-144', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-145', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-146', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-147', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-148', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-149', 1),
    (N'C-B1-ZoneA Xe May', 'C-B1-A-M-150', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: C-B1-ZoneB Xe May (120 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-001', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-002', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-003', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-004', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-005', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-006', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-007', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-008', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-009', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-010', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-011', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-012', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-013', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-014', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-015', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-016', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-017', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-018', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-019', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-020', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-021', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-022', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-023', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-024', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-025', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-026', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-027', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-028', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-029', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-030', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-031', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-032', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-033', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-034', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-035', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-036', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-037', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-038', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-039', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-040', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-041', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-042', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-043', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-044', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-045', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-046', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-047', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-048', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-049', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-050', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-051', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-052', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-053', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-054', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-055', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-056', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-057', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-058', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-059', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-060', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-061', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-062', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-063', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-064', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-065', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-066', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-067', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-068', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-069', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-070', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-071', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-072', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-073', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-074', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-075', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-076', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-077', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-078', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-079', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-080', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-081', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-082', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-083', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-084', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-085', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-086', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-087', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-088', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-089', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-090', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-091', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-092', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-093', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-094', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-095', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-096', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-097', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-098', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-099', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-100', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-101', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-102', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-103', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-104', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-105', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-106', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-107', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-108', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-109', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-110', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-111', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-112', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-113', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-114', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-115', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-116', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-117', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-118', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-119', 1),
    (N'C-B1-ZoneB Xe May', 'C-B1-B-M-120', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: C-B1-ZoneC O To (60 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B1-ZoneC O To', 'C-B1-C-C-001', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-002', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-003', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-004', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-005', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-006', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-007', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-008', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-009', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-010', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-011', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-012', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-013', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-014', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-015', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-016', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-017', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-018', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-019', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-020', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-021', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-022', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-023', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-024', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-025', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-026', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-027', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-028', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-029', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-030', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-031', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-032', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-033', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-034', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-035', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-036', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-037', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-038', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-039', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-040', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-041', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-042', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-043', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-044', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-045', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-046', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-047', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-048', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-049', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-050', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B1-ZoneC O To', 'C-B1-C-C-051', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-052', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-053', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-054', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-055', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-056', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-057', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-058', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-059', 2),
    (N'C-B1-ZoneC O To', 'C-B1-C-C-060', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: C-B1-ZoneD O To (40 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B1-ZoneD O To', 'C-B1-D-C-001', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-002', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-003', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-004', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-005', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-006', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-007', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-008', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-009', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-010', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-011', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-012', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-013', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-014', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-015', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-016', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-017', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-018', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-019', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-020', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-021', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-022', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-023', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-024', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-025', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-026', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-027', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-028', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-029', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-030', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-031', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-032', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-033', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-034', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-035', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-036', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-037', 2),
    (N'C-B1-ZoneD O To', 'C-B1-D-C-038', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID, SlotStatus)
SELECT z.ZoneID, 'C-B1-D-C-039', 2, 'Maintenance' FROM Zones z WHERE z.ZoneName = N'C-B1-ZoneD O To';
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID, SlotStatus)
SELECT z.ZoneID, 'C-B1-D-C-040', 2, 'Maintenance' FROM Zones z WHERE z.ZoneName = N'C-B1-ZoneD O To';
GO

-- Zone: C-B2-ZoneA Xe May (120 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-001', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-002', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-003', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-004', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-005', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-006', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-007', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-008', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-009', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-010', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-011', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-012', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-013', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-014', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-015', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-016', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-017', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-018', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-019', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-020', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-021', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-022', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-023', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-024', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-025', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-026', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-027', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-028', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-029', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-030', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-031', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-032', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-033', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-034', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-035', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-036', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-037', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-038', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-039', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-040', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-041', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-042', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-043', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-044', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-045', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-046', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-047', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-048', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-049', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-050', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-051', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-052', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-053', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-054', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-055', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-056', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-057', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-058', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-059', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-060', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-061', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-062', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-063', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-064', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-065', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-066', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-067', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-068', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-069', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-070', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-071', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-072', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-073', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-074', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-075', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-076', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-077', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-078', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-079', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-080', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-081', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-082', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-083', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-084', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-085', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-086', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-087', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-088', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-089', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-090', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-091', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-092', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-093', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-094', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-095', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-096', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-097', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-098', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-099', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-100', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-101', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-102', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-103', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-104', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-105', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-106', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-107', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-108', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-109', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-110', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-111', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-112', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-113', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-114', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-115', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-116', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-117', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-118', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-119', 1),
    (N'C-B2-ZoneA Xe May', 'C-B2-A-M-120', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: C-B2-ZoneB Xe May (100 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-001', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-002', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-003', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-004', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-005', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-006', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-007', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-008', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-009', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-010', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-011', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-012', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-013', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-014', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-015', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-016', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-017', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-018', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-019', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-020', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-021', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-022', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-023', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-024', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-025', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-026', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-027', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-028', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-029', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-030', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-031', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-032', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-033', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-034', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-035', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-036', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-037', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-038', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-039', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-040', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-041', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-042', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-043', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-044', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-045', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-046', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-047', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-048', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-049', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-050', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-051', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-052', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-053', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-054', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-055', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-056', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-057', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-058', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-059', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-060', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-061', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-062', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-063', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-064', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-065', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-066', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-067', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-068', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-069', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-070', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-071', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-072', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-073', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-074', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-075', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-076', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-077', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-078', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-079', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-080', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-081', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-082', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-083', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-084', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-085', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-086', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-087', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-088', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-089', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-090', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-091', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-092', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-093', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-094', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-095', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-096', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-097', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-098', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-099', 1),
    (N'C-B2-ZoneB Xe May', 'C-B2-B-M-100', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: C-B2-ZoneC O To (50 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B2-ZoneC O To', 'C-B2-C-C-001', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-002', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-003', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-004', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-005', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-006', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-007', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-008', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-009', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-010', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-011', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-012', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-013', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-014', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-015', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-016', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-017', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-018', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-019', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-020', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-021', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-022', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-023', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-024', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-025', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-026', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-027', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-028', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-029', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-030', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-031', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-032', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-033', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-034', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-035', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-036', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-037', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-038', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-039', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-040', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-041', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-042', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-043', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-044', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-045', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-046', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-047', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-048', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-049', 2),
    (N'C-B2-ZoneC O To', 'C-B2-C-C-050', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: C-B2-ZoneD O To (30 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B2-ZoneD O To', 'C-B2-D-C-001', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-002', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-003', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-004', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-005', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-006', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-007', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-008', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-009', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-010', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-011', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-012', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-013', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-014', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-015', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-016', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-017', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-018', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-019', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-020', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-021', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-022', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-023', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-024', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-025', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-026', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-027', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-028', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-029', 2),
    (N'C-B2-ZoneD O To', 'C-B2-D-C-030', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: C-B3-ZoneA Xe May (80 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-001', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-002', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-003', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-004', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-005', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-006', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-007', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-008', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-009', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-010', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-011', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-012', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-013', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-014', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-015', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-016', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-017', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-018', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-019', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-020', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-021', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-022', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-023', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-024', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-025', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-026', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-027', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-028', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-029', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-030', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-031', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-032', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-033', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-034', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-035', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-036', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-037', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-038', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-039', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-040', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-041', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-042', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-043', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-044', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-045', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-046', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-047', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-048', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-049', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-050', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-051', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-052', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-053', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-054', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-055', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-056', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-057', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-058', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-059', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-060', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-061', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-062', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-063', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-064', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-065', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-066', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-067', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-068', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-069', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-070', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-071', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-072', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-073', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-074', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-075', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-076', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-077', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-078', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-079', 1),
    (N'C-B3-ZoneA Xe May', 'C-B3-A-M-080', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: C-B3-ZoneB O To (30 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B3-ZoneB O To', 'C-B3-B-C-001', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-002', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-003', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-004', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-005', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-006', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-007', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-008', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-009', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-010', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-011', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-012', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-013', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-014', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-015', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-016', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-017', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-018', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-019', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-020', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-021', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-022', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-023', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-024', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-025', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-026', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-027', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-028', 2),
    (N'C-B3-ZoneB O To', 'C-B3-B-C-029', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID, SlotStatus)
SELECT z.ZoneID, 'C-B3-B-C-030', 2, 'Blocked' FROM Zones z WHERE z.ZoneName = N'C-B3-ZoneB O To';
GO

-- Zone: C-B3-ZoneC Xe Tai (15 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-001', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-002', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-003', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-004', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-005', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-006', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-007', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-008', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-009', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-010', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-011', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-012', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-013', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-014', 3),
    (N'C-B3-ZoneC Xe Tai', 'C-B3-C-T-015', 3)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: D-B1-ZoneA Xe May (80 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-001', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-002', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-003', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-004', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-005', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-006', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-007', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-008', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-009', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-010', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-011', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-012', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-013', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-014', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-015', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-016', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-017', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-018', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-019', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-020', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-021', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-022', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-023', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-024', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-025', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-026', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-027', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-028', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-029', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-030', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-031', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-032', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-033', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-034', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-035', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-036', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-037', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-038', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-039', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-040', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-041', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-042', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-043', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-044', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-045', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-046', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-047', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-048', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-049', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-050', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-051', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-052', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-053', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-054', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-055', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-056', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-057', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-058', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-059', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-060', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-061', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-062', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-063', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-064', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-065', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-066', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-067', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-068', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-069', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-070', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-071', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-072', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-073', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-074', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-075', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-076', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-077', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-078', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-079', 1),
    (N'D-B1-ZoneA Xe May', 'D-B1-A-M-080', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: D-B1-ZoneB Xe May (60 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-001', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-002', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-003', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-004', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-005', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-006', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-007', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-008', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-009', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-010', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-011', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-012', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-013', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-014', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-015', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-016', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-017', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-018', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-019', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-020', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-021', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-022', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-023', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-024', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-025', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-026', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-027', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-028', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-029', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-030', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-031', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-032', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-033', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-034', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-035', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-036', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-037', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-038', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-039', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-040', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-041', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-042', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-043', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-044', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-045', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-046', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-047', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-048', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-049', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-050', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-051', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-052', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-053', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-054', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-055', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-056', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-057', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-058', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-059', 1),
    (N'D-B1-ZoneB Xe May', 'D-B1-B-M-060', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: D-B1-ZoneC O To (50 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'D-B1-ZoneC O To', 'D-B1-C-C-001', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-002', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-003', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-004', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-005', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-006', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-007', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-008', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-009', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-010', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-011', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-012', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-013', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-014', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-015', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-016', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-017', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-018', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-019', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-020', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-021', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-022', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-023', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-024', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-025', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-026', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-027', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-028', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-029', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-030', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-031', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-032', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-033', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-034', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-035', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-036', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-037', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-038', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-039', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-040', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-041', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-042', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-043', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-044', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-045', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-046', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-047', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-048', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-049', 2),
    (N'D-B1-ZoneC O To', 'D-B1-C-C-050', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: D-B2-ZoneA Xe May (60 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-001', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-002', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-003', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-004', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-005', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-006', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-007', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-008', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-009', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-010', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-011', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-012', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-013', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-014', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-015', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-016', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-017', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-018', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-019', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-020', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-021', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-022', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-023', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-024', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-025', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-026', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-027', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-028', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-029', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-030', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-031', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-032', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-033', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-034', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-035', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-036', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-037', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-038', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-039', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-040', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-041', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-042', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-043', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-044', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-045', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-046', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-047', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-048', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-049', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-050', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-051', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-052', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-053', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-054', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-055', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-056', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-057', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-058', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-059', 1),
    (N'D-B2-ZoneA Xe May', 'D-B2-A-M-060', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: D-B2-ZoneB O To (40 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'D-B2-ZoneB O To', 'D-B2-B-C-001', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-002', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-003', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-004', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-005', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-006', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-007', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-008', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-009', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-010', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-011', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-012', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-013', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-014', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-015', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-016', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-017', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-018', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-019', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-020', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-021', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-022', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-023', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-024', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-025', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-026', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-027', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-028', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-029', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-030', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-031', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-032', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-033', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-034', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-035', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-036', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-037', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-038', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-039', 2),
    (N'D-B2-ZoneB O To', 'D-B2-B-C-040', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: D-B2-ZoneC O To VIP (20 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-001', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-002', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-003', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-004', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-005', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-006', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-007', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-008', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-009', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-010', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-011', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-012', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-013', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-014', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-015', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-016', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-017', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-018', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-019', 2),
    (N'D-B2-ZoneC O To VIP', 'D-B2-VIP-C-020', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: E-B1-ZoneA Xe May (120 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-001', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-002', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-003', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-004', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-005', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-006', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-007', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-008', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-009', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-010', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-011', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-012', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-013', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-014', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-015', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-016', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-017', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-018', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-019', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-020', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-021', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-022', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-023', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-024', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-025', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-026', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-027', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-028', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-029', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-030', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-031', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-032', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-033', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-034', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-035', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-036', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-037', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-038', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-039', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-040', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-041', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-042', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-043', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-044', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-045', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-046', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-047', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-048', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-049', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-050', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-051', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-052', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-053', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-054', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-055', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-056', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-057', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-058', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-059', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-060', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-061', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-062', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-063', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-064', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-065', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-066', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-067', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-068', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-069', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-070', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-071', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-072', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-073', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-074', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-075', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-076', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-077', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-078', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-079', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-080', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-081', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-082', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-083', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-084', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-085', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-086', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-087', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-088', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-089', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-090', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-091', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-092', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-093', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-094', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-095', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-096', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-097', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-098', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-099', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-100', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-101', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-102', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-103', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-104', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-105', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-106', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-107', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-108', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-109', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-110', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-111', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-112', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-113', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-114', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-115', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-116', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-117', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-118', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-119', 1),
    (N'E-B1-ZoneA Xe May', 'E-B1-A-M-120', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: E-B1-ZoneB Xe May (100 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-001', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-002', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-003', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-004', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-005', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-006', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-007', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-008', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-009', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-010', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-011', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-012', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-013', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-014', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-015', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-016', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-017', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-018', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-019', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-020', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-021', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-022', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-023', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-024', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-025', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-026', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-027', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-028', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-029', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-030', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-031', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-032', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-033', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-034', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-035', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-036', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-037', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-038', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-039', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-040', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-041', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-042', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-043', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-044', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-045', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-046', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-047', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-048', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-049', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-050', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-051', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-052', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-053', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-054', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-055', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-056', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-057', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-058', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-059', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-060', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-061', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-062', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-063', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-064', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-065', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-066', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-067', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-068', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-069', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-070', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-071', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-072', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-073', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-074', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-075', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-076', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-077', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-078', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-079', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-080', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-081', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-082', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-083', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-084', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-085', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-086', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-087', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-088', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-089', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-090', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-091', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-092', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-093', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-094', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-095', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-096', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-097', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-098', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-099', 1),
    (N'E-B1-ZoneB Xe May', 'E-B1-B-M-100', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: E-B1-ZoneC O To (60 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B1-ZoneC O To', 'E-B1-C-C-001', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-002', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-003', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-004', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-005', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-006', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-007', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-008', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-009', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-010', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-011', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-012', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-013', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-014', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-015', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-016', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-017', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-018', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-019', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-020', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-021', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-022', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-023', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-024', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-025', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-026', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-027', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-028', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-029', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-030', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-031', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-032', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-033', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-034', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-035', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-036', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-037', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-038', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-039', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-040', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-041', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-042', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-043', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-044', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-045', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-046', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-047', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-048', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-049', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-050', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B1-ZoneC O To', 'E-B1-C-C-051', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-052', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-053', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-054', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-055', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-056', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-057', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-058', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-059', 2),
    (N'E-B1-ZoneC O To', 'E-B1-C-C-060', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: E-B1-ZoneD O To (40 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B1-ZoneD O To', 'E-B1-D-C-001', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-002', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-003', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-004', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-005', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-006', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-007', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-008', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-009', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-010', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-011', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-012', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-013', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-014', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-015', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-016', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-017', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-018', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-019', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-020', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-021', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-022', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-023', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-024', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-025', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-026', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-027', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-028', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-029', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-030', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-031', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-032', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-033', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-034', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-035', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-036', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-037', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-038', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-039', 2),
    (N'E-B1-ZoneD O To', 'E-B1-D-C-040', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: E-B2-ZoneA Xe May (80 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-001', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-002', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-003', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-004', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-005', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-006', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-007', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-008', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-009', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-010', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-011', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-012', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-013', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-014', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-015', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-016', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-017', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-018', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-019', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-020', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-021', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-022', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-023', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-024', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-025', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-026', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-027', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-028', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-029', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-030', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-031', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-032', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-033', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-034', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-035', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-036', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-037', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-038', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-039', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-040', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-041', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-042', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-043', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-044', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-045', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-046', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-047', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-048', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-049', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-050', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-051', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-052', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-053', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-054', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-055', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-056', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-057', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-058', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-059', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-060', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-061', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-062', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-063', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-064', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-065', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-066', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-067', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-068', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-069', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-070', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-071', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-072', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-073', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-074', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-075', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-076', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-077', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-078', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-079', 1),
    (N'E-B2-ZoneA Xe May', 'E-B2-A-M-080', 1)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: E-B2-ZoneB O To (50 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B2-ZoneB O To', 'E-B2-B-C-001', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-002', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-003', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-004', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-005', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-006', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-007', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-008', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-009', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-010', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-011', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-012', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-013', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-014', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-015', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-016', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-017', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-018', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-019', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-020', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-021', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-022', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-023', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-024', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-025', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-026', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-027', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-028', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-029', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-030', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-031', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-032', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-033', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-034', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-035', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-036', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-037', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-038', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-039', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-040', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-041', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-042', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-043', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-044', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-045', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-046', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-047', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-048', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-049', 2),
    (N'E-B2-ZoneB O To', 'E-B2-B-C-050', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: E-B2-ZoneC O To (40 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B2-ZoneC O To', 'E-B2-C-C-001', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-002', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-003', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-004', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-005', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-006', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-007', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-008', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-009', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-010', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-011', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-012', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-013', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-014', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-015', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-016', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-017', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-018', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-019', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-020', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-021', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-022', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-023', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-024', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-025', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-026', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-027', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-028', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-029', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-030', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-031', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-032', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-033', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-034', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-035', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-036', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-037', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-038', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-039', 2),
    (N'E-B2-ZoneC O To', 'E-B2-C-C-040', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: E-B3-ZoneA Xe Tai (20 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-001', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-002', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-003', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-004', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-005', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-006', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-007', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-008', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-009', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-010', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-011', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-012', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-013', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-014', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-015', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-016', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-017', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-018', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-019', 3),
    (N'E-B3-ZoneA Xe Tai', 'E-B3-A-T-020', 3)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

-- Zone: E-B3-ZoneB O To VIP (30 slot)
INSERT INTO ParkingSlots (ZoneID, SlotCode, VehicleTypeID)
SELECT z.ZoneID, s.SlotCode, s.VehicleTypeID
FROM (VALUES
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-001', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-002', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-003', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-004', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-005', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-006', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-007', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-008', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-009', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-010', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-011', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-012', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-013', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-014', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-015', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-016', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-017', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-018', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-019', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-020', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-021', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-022', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-023', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-024', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-025', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-026', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-027', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-028', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-029', 2),
    (N'E-B3-ZoneB O To VIP', 'E-B3-VIP-C-030', 2)
) AS s(ZoneName, SlotCode, VehicleTypeID)
JOIN Zones z ON z.ZoneName = s.ZoneName;
GO

PRINT '>>> Da tao 1645 slot moi <<<';
GO


/* =====================================================================
   PHẦN 5: USERS MỚI
   ===================================================================== */

DECLARE @PW NVARCHAR(256) = '$2a$10$T8Mv3Lg2vR9aI.3tGz.e2.gP0wR.Hj7yX0qA7zJ5rX5f5F5D5Q5g2';

-- Chỉ insert nếu email chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'an.nguyen@gmail.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Nguyen Van An', 'an.nguyen@gmail.com', @PW, '0901111001', 1, NULL, NULL, 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'binh.tran@gmail.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Tran Thi Binh', 'binh.tran@gmail.com', @PW, '0901111002', 1, NULL, NULL, 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'cuong.le@gmail.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Le Minh Cuong', 'cuong.le@gmail.com', @PW, '0901111003', 1, NULL, NULL, 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'dung.pham@gmail.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Pham Thi Dung', 'dung.pham@gmail.com', @PW, '0901111004', 1, NULL, NULL, 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'em.hoang@gmail.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Hoang Van Em', 'em.hoang@gmail.com', @PW, '0901111005', 1, NULL, NULL, 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'phuong.ngo@gmail.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Ngo Thi Phuong', 'phuong.ngo@gmail.com', @PW, '0901111006', 1, NULL, NULL, 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'huy.do@gmail.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Do Quang Huy', 'huy.do@gmail.com', @PW, '0901111007', 1, NULL, NULL, 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'kim.vu@gmail.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Vu Thi Kim', 'kim.vu@gmail.com', @PW, '0901111008', 1, NULL, NULL, 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'long.bui@gmail.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Bui Van Long', 'long.bui@gmail.com', @PW, '0901111009', 1, NULL, NULL, 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'mai.dinh@gmail.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Dinh Thi Mai', 'mai.dinh@gmail.com', @PW, '0901111010', 1, NULL, NULL, 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'nam.staff@parking.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Nguyen Thanh Nam', 'nam.staff@parking.com', @PW, '0902000001', 2, '1992-03-15', '2018-07-01', 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'oanh.staff@parking.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Tran Van Oanh', 'oanh.staff@parking.com', @PW, '0902000002', 2, '1990-08-20', '2019-01-15', 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'phu.staff@parking.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Le Thi Phu', 'phu.staff@parking.com', @PW, '0902000003', 2, '1995-11-05', '2020-03-10', 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'quan.staff@parking.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Pham Van Quan', 'quan.staff@parking.com', @PW, '0902000004', 2, '1993-06-25', '2021-06-01', 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'son.manager@parking.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Hoang Minh Son', 'son.manager@parking.com', @PW, '0903000001', 3, '1985-04-10', '2010-09-01', 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'tu.manager@parking.com')
    INSERT INTO Users (FullName,Email,PasswordHash,PhoneNumber,RoleID,DateOfBirth,HireDate,IsActive,IsEmailVerified)
    VALUES (N'Ngo Thi Tu', 'tu.manager@parking.com', @PW, '0903000002', 3, '1983-12-30', '2012-01-01', 1, 1);

IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'walkin.guest@system.local')
    INSERT INTO Users (FullName,Email,PasswordHash,RoleID,IsActive,IsEmailVerified)
    VALUES (N'Khach Vang Lai', 'walkin.guest@system.local', NULL, 1, 1, 1);
GO

-- UserAuthProviders cho users mới
INSERT INTO UserAuthProviders (UserID, ProviderName, ProviderUserID, ProviderEmail)
SELECT u.UserID, 'local', CAST(u.UserID AS NVARCHAR(200)), u.Email
FROM Users u
WHERE u.PasswordHash IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM UserAuthProviders uap
      WHERE uap.UserID = u.UserID AND uap.ProviderName = 'local'
  );
GO

PRINT '>>> Da them Users moi <<<';
GO

/* =====================================================================
   PHẦN 6: SUBSCRIPTIONS + WALLET
   ===================================================================== */

DECLARE @u1 INT, @u2 INT, @u3 INT, @u4 INT, @u5 INT;
SELECT @u1 = UserID FROM Users WHERE Email = 'an.nguyen@gmail.com';
SELECT @u2 = UserID FROM Users WHERE Email = 'binh.tran@gmail.com';
SELECT @u3 = UserID FROM Users WHERE Email = 'cuong.le@gmail.com';
SELECT @u4 = UserID FROM Users WHERE Email = 'dung.pham@gmail.com';
SELECT @u5 = UserID FROM Users WHERE Email = 'em.hoang@gmail.com';

IF NOT EXISTS (SELECT 1 FROM UserSubscriptions WHERE UserID = @u1)
    INSERT INTO UserSubscriptions (UserID,PlanID,StartDate,EndDate,AmountPaid,Status)
    VALUES (@u1,'premium',DATEADD(DAY,-5,GETDATE()),DATEADD(MONTH,1,DATEADD(DAY,-5,GETDATE())),399000,'Active');

IF NOT EXISTS (SELECT 1 FROM UserSubscriptions WHERE UserID = @u2)
    INSERT INTO UserSubscriptions (UserID,PlanID,StartDate,EndDate,AmountPaid,Status)
    VALUES (@u2,'pro',DATEADD(DAY,-10,GETDATE()),DATEADD(MONTH,1,DATEADD(DAY,-10,GETDATE())),199000,'Active');

IF NOT EXISTS (SELECT 1 FROM UserSubscriptions WHERE UserID = @u3)
    INSERT INTO UserSubscriptions (UserID,PlanID,StartDate,EndDate,AmountPaid,Status)
    VALUES (@u3,'basic',DATEADD(DAY,-20,GETDATE()),DATEADD(MONTH,1,DATEADD(DAY,-20,GETDATE())),99000,'Active');

IF NOT EXISTS (SELECT 1 FROM UserSubscriptions WHERE UserID = @u4)
    INSERT INTO UserSubscriptions (UserID,PlanID,StartDate,EndDate,AmountPaid,Status)
    VALUES (@u4,'premium',DATEADD(MONTH,-2,GETDATE()),DATEADD(MONTH,-1,GETDATE()),399000,'Expired');

IF NOT EXISTS (SELECT 1 FROM UserSubscriptions WHERE UserID = @u5)
    INSERT INTO UserSubscriptions (UserID,PlanID,StartDate,EndDate,AmountPaid,Status)
    VALUES (@u5,'pro',DATEADD(MONTH,-1,GETDATE()),DATEADD(DAY,-2,GETDATE()),199000,'Expired');

-- Wallet top-up users mới
IF @u1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM WalletTransactions WHERE UserID = @u1)
    EXEC sp_TopUpWallet @u1, 800000,  'TOPUP-NEW-001', N'Nap tien lan dau';
IF @u2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM WalletTransactions WHERE UserID = @u2)
    EXEC sp_TopUpWallet @u2, 300000,  'TOPUP-NEW-002', N'Nap tien lan dau';
IF @u3 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM WalletTransactions WHERE UserID = @u3)
    EXEC sp_TopUpWallet @u3, 1000000, 'TOPUP-NEW-003', N'Nap tien lan dau';
IF @u4 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM WalletTransactions WHERE UserID = @u4)
    EXEC sp_TopUpWallet @u4, 150000,  'TOPUP-NEW-004', N'Nap tien lan dau';
IF @u5 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM WalletTransactions WHERE UserID = @u5)
    EXEC sp_TopUpWallet @u5, 250000,  'TOPUP-NEW-005', N'Nap tien lan dau';
GO

/* =====================================================================
   PHẦN 7: DRIVER VEHICLES
   ===================================================================== */

INSERT INTO DriverVehicles (DriverID,PlateNumber,VehicleTypeID,VehicleBrand,VehicleColor,IsDefault)
SELECT u.UserID,'29A-11111',1,N'Honda Wave',N'Do',1 FROM Users u WHERE u.Email='an.nguyen@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM DriverVehicles dv WHERE dv.DriverID=u.UserID AND dv.PlateNumber='29A-11111');
INSERT INTO DriverVehicles (DriverID,PlateNumber,VehicleTypeID,VehicleBrand,VehicleColor,IsDefault)
SELECT u.UserID,'51G-22222',2,N'Toyota Vios',N'Trang',0 FROM Users u WHERE u.Email='an.nguyen@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM DriverVehicles dv WHERE dv.DriverID=u.UserID AND dv.PlateNumber='51G-22222');
INSERT INTO DriverVehicles (DriverID,PlateNumber,VehicleTypeID,VehicleBrand,VehicleColor,IsDefault)
SELECT u.UserID,'30F-33333',1,N'Yamaha Exciter',N'Xanh',1 FROM Users u WHERE u.Email='binh.tran@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM DriverVehicles dv WHERE dv.DriverID=u.UserID AND dv.PlateNumber='30F-33333');
INSERT INTO DriverVehicles (DriverID,PlateNumber,VehicleTypeID,VehicleBrand,VehicleColor,IsDefault)
SELECT u.UserID,'29B-44444',2,N'Honda City',N'Bac',1 FROM Users u WHERE u.Email='cuong.le@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM DriverVehicles dv WHERE dv.DriverID=u.UserID AND dv.PlateNumber='29B-44444');
INSERT INTO DriverVehicles (DriverID,PlateNumber,VehicleTypeID,VehicleBrand,VehicleColor,IsDefault)
SELECT u.UserID,'51H-55555',1,N'Honda Air Blade',N'Den',1 FROM Users u WHERE u.Email='dung.pham@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM DriverVehicles dv WHERE dv.DriverID=u.UserID AND dv.PlateNumber='51H-55555');
INSERT INTO DriverVehicles (DriverID,PlateNumber,VehicleTypeID,VehicleBrand,VehicleColor,IsDefault)
SELECT u.UserID,'29A-66666',2,N'Mazda 3',N'Do',1 FROM Users u WHERE u.Email='em.hoang@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM DriverVehicles dv WHERE dv.DriverID=u.UserID AND dv.PlateNumber='29A-66666');
INSERT INTO DriverVehicles (DriverID,PlateNumber,VehicleTypeID,VehicleBrand,VehicleColor,IsDefault)
SELECT u.UserID,'30K-77777',1,N'Suzuki Raider',N'Vang',1 FROM Users u WHERE u.Email='phuong.ngo@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM DriverVehicles dv WHERE dv.DriverID=u.UserID AND dv.PlateNumber='30K-77777');
INSERT INTO DriverVehicles (DriverID,PlateNumber,VehicleTypeID,VehicleBrand,VehicleColor,IsDefault)
SELECT u.UserID,'51A-88888',2,N'Kia Morning',N'Xanh',1 FROM Users u WHERE u.Email='huy.do@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM DriverVehicles dv WHERE dv.DriverID=u.UserID AND dv.PlateNumber='51A-88888');
INSERT INTO DriverVehicles (DriverID,PlateNumber,VehicleTypeID,VehicleBrand,VehicleColor,IsDefault)
SELECT u.UserID,'29C-99999',3,N'Hyundai Porter',N'Trang',1 FROM Users u WHERE u.Email='long.bui@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM DriverVehicles dv WHERE dv.DriverID=u.UserID AND dv.PlateNumber='29C-99999');
INSERT INTO DriverVehicles (DriverID,PlateNumber,VehicleTypeID,VehicleBrand,VehicleColor,IsDefault)
SELECT u.UserID,'30E-10101',1,N'Honda SH',N'Den',1 FROM Users u WHERE u.Email='mai.dinh@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM DriverVehicles dv WHERE dv.DriverID=u.UserID AND dv.PlateNumber='30E-10101');
GO

/* =====================================================================
   PHẦN 8: PARKING SESSIONS + PAYMENTS (tòa mới)
   Dùng INSERT SELECT để tránh lỗi NULL variable/subquery
   ===================================================================== */

-- Active sessions - mỗi INSERT riêng để dễ debug
INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29A-11111', 1, DATEADD(HOUR,-1,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='C-B1-A-M-001' AND u.Email='an.nguyen@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '30F-33333', 1, DATEADD(HOUR,-2,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='C-B1-B-M-001' AND u.Email='binh.tran@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29B-44444', 2, DATEADD(HOUR,-3,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='C-B1-C-C-001' AND u.Email='cuong.le@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '51H-55555', 1, DATEADD(HOUR,-4,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='C-B2-A-M-001' AND u.Email='dung.pham@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29A-66666', 2, DATEADD(MINUTE,-45,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='C-B2-B-C-001' AND u.Email='em.hoang@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29C-99999', 3, DATEADD(HOUR,-5,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='C-B3-C-T-001' AND u.Email='long.bui@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '30K-77777', 1, DATEADD(HOUR,-1,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='D-B1-A-M-001' AND u.Email='phuong.ngo@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '51A-88888', 2, DATEADD(HOUR,-2,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='D-B1-C-C-001' AND u.Email='huy.do@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '51G-WALKIN', 1, DATEADD(HOUR,-1,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='D-B2-A-M-001' AND u.Email='walkin.guest@system.local';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '30E-10101', 2, DATEADD(HOUR,-3,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='D-B2-VIP-C-001' AND u.Email='kim.vu@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29C-12345', 1, DATEADD(HOUR,-2,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='E-B1-A-M-001' AND u.Email='mai.dinh@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '51G-22222', 2, DATEADD(HOUR,-6,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='E-B1-C-C-001' AND u.Email='an.nguyen@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '30F-33333', 1, DATEADD(HOUR,-1,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='E-B2-A-M-001' AND u.Email='binh.tran@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29B-44444', 2, DATEADD(HOUR,-4,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='E-B3-VIP-C-001' AND u.Email='cuong.le@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29C-99999', 3, DATEADD(HOUR,-7,GETDATE()), 'Active'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='E-B3-A-T-001' AND u.Email='long.bui@gmail.com';
GO

-- Payments cho Active sessions mới
INSERT INTO Payments (SessionID,Amount,PaymentMethod,PaymentStatus)
SELECT s.SessionID,
    CASE s.VehicleTypeID WHEN 1 THEN 5000 WHEN 2 THEN 40000 ELSE 70000 END,
    'Cash', 'Pending'
FROM ParkingSessions s
WHERE s.SessionStatus = 'Active'
  AND s.SlotID IN (SELECT SlotID FROM ParkingSlots WHERE SlotCode LIKE 'C-%' OR SlotCode LIKE 'D-%' OR SlotCode LIKE 'E-%')
  AND NOT EXISTS (SELECT 1 FROM Payments p WHERE p.SessionID = s.SessionID);
GO

-- Completed sessions (lịch sử tòa mới)
INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,ExitTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29A-11111', 1,
    DATEADD(DAY,-1,DATEADD(HOUR,8, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-1,DATEADD(HOUR,10,CAST(CAST(GETDATE() AS DATE) AS DATETIME))), 'Completed'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='C-B1-A-M-003' AND u.Email='an.nguyen@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,ExitTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '30F-33333', 2,
    DATEADD(DAY,-1,DATEADD(HOUR,9, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-1,DATEADD(HOUR,17,CAST(CAST(GETDATE() AS DATE) AS DATETIME))), 'Completed'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='C-B1-C-C-002' AND u.Email='binh.tran@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,ExitTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29B-44444', 1,
    DATEADD(DAY,-2,DATEADD(HOUR,7, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-2,DATEADD(HOUR,12,CAST(CAST(GETDATE() AS DATE) AS DATETIME))), 'Completed'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='C-B2-A-M-002' AND u.Email='cuong.le@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,ExitTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '51H-55555', 1,
    DATEADD(DAY,-2,DATEADD(HOUR,8, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-2,DATEADD(HOUR,20,CAST(CAST(GETDATE() AS DATE) AS DATETIME))), 'Completed'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='D-B1-A-M-002' AND u.Email='dung.pham@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,ExitTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29A-66666', 2,
    DATEADD(DAY,-3,DATEADD(HOUR,20,CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-2,DATEADD(HOUR,8, CAST(CAST(GETDATE() AS DATE) AS DATETIME))), 'Completed'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='D-B1-C-C-002' AND u.Email='em.hoang@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,ExitTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '30K-77777', 2,
    DATEADD(DAY,-5,DATEADD(HOUR,9, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-5,DATEADD(HOUR,18,CAST(CAST(GETDATE() AS DATE) AS DATETIME))), 'Completed'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='D-B2-B-C-001' AND u.Email='phuong.ngo@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,ExitTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '51A-88888', 1,
    DATEADD(DAY,-7,DATEADD(HOUR,7, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-7,DATEADD(HOUR,11,CAST(CAST(GETDATE() AS DATE) AS DATETIME))), 'Completed'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='E-B1-A-M-002' AND u.Email='huy.do@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,ExitTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '30E-10101', 2,
    DATEADD(DAY,-10,DATEADD(HOUR,8, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-10,DATEADD(HOUR,18,CAST(CAST(GETDATE() AS DATE) AS DATETIME))), 'Completed'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='E-B1-C-C-002' AND u.Email='kim.vu@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,ExitTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29C-99111', 2,
    DATEADD(DAY,-12,DATEADD(HOUR,9, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-12,DATEADD(HOUR,21,CAST(CAST(GETDATE() AS DATE) AS DATETIME))), 'Completed'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='E-B2-B-C-001' AND u.Email='long.bui@gmail.com';

INSERT INTO ParkingSessions (SlotID,DriverID,PlateNumber,VehicleTypeID,EntryTime,ExitTime,SessionStatus)
SELECT ps.SlotID, u.UserID, '29C-99999', 3,
    DATEADD(DAY,-14,DATEADD(HOUR,6, CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-14,DATEADD(HOUR,14,CAST(CAST(GETDATE() AS DATE) AS DATETIME))), 'Completed'
FROM ParkingSlots ps, Users u WHERE ps.SlotCode='E-B3-A-T-002' AND u.Email='long.bui@gmail.com';
GO

-- Payments cho Completed sessions mới
INSERT INTO Payments (SessionID,Amount,PaymentMethod,PaymentTime,PaymentStatus,FinalAmount)
SELECT s.SessionID,
    CASE WHEN DATEDIFF(MINUTE,s.EntryTime,s.ExitTime)/60.0<=4
              THEN CASE s.VehicleTypeID WHEN 1 THEN 5000  WHEN 2 THEN 40000  ELSE 70000  END
         WHEN DATEDIFF(MINUTE,s.EntryTime,s.ExitTime)/60.0<=8
              THEN CASE s.VehicleTypeID WHEN 1 THEN 8000  WHEN 2 THEN 70000  ELSE 130000 END
         ELSE      CASE s.VehicleTypeID WHEN 1 THEN 15000 WHEN 2 THEN 120000 ELSE 200000 END END,
    CASE (s.SessionID%2) WHEN 0 THEN 'Cash' ELSE 'Banking' END,
    s.ExitTime, 'Completed',
    CASE WHEN DATEDIFF(MINUTE,s.EntryTime,s.ExitTime)/60.0<=4
              THEN CASE s.VehicleTypeID WHEN 1 THEN 5000  WHEN 2 THEN 40000  ELSE 70000  END
         WHEN DATEDIFF(MINUTE,s.EntryTime,s.ExitTime)/60.0<=8
              THEN CASE s.VehicleTypeID WHEN 1 THEN 8000  WHEN 2 THEN 70000  ELSE 130000 END
         ELSE      CASE s.VehicleTypeID WHEN 1 THEN 15000 WHEN 2 THEN 120000 ELSE 200000 END END
FROM ParkingSessions s
WHERE s.SessionStatus='Completed'
  AND s.SlotID IN (SELECT SlotID FROM ParkingSlots WHERE SlotCode LIKE 'C-%' OR SlotCode LIKE 'D-%' OR SlotCode LIKE 'E-%')
  AND NOT EXISTS (SELECT 1 FROM Payments p WHERE p.SessionID=s.SessionID);
GO

/* =====================================================================
   PHẦN 9: RESERVATIONS
   ===================================================================== */

INSERT INTO Reservations (DriverID,VehicleTypeID,SlotID,ReservationDate,StartTime,EndTime,ReservationStatus)
SELECT u.UserID,1,ps.SlotID,CAST(GETDATE() AS DATE),DATEADD(HOUR,2,GETDATE()),DATEADD(HOUR,6,GETDATE()),'Reserved'
FROM Users u, ParkingSlots ps WHERE u.Email='an.nguyen@gmail.com' AND ps.SlotCode='C-B1-A-M-010';

INSERT INTO Reservations (DriverID,VehicleTypeID,SlotID,ReservationDate,StartTime,EndTime,ReservationStatus)
SELECT u.UserID,2,ps.SlotID,CAST(GETDATE() AS DATE),DATEADD(HOUR,3,GETDATE()),DATEADD(HOUR,7,GETDATE()),'Reserved'
FROM Users u, ParkingSlots ps WHERE u.Email='binh.tran@gmail.com' AND ps.SlotCode='C-B1-C-C-010';

INSERT INTO Reservations (DriverID,VehicleTypeID,SlotID,ReservationDate,StartTime,EndTime,ReservationStatus)
SELECT u.UserID,1,ps.SlotID,CAST(GETDATE() AS DATE),DATEADD(HOUR,1,GETDATE()),DATEADD(HOUR,5,GETDATE()),'Reserved'
FROM Users u, ParkingSlots ps WHERE u.Email='cuong.le@gmail.com' AND ps.SlotCode='D-B1-A-M-010';

INSERT INTO Reservations (DriverID,VehicleTypeID,SlotID,ReservationDate,StartTime,EndTime,ReservationStatus)
SELECT u.UserID,2,ps.SlotID,CAST(GETDATE() AS DATE),DATEADD(HOUR,4,GETDATE()),DATEADD(HOUR,8,GETDATE()),'Reserved'
FROM Users u, ParkingSlots ps WHERE u.Email='dung.pham@gmail.com' AND ps.SlotCode='E-B1-C-C-010';

INSERT INTO Reservations (DriverID,VehicleTypeID,SlotID,ReservationDate,StartTime,EndTime,ReservationStatus)
SELECT u.UserID,1,ps.SlotID,CAST(GETDATE() AS DATE),DATEADD(HOUR,5,GETDATE()),DATEADD(HOUR,9,GETDATE()),'Reserved'
FROM Users u, ParkingSlots ps WHERE u.Email='em.hoang@gmail.com' AND ps.SlotCode='E-B1-A-M-010';

INSERT INTO Reservations (DriverID,VehicleTypeID,SlotID,ReservationDate,StartTime,EndTime,ReservationStatus)
SELECT u.UserID,2,ps.SlotID,DATEADD(DAY,-2,CAST(GETDATE() AS DATE)),
    DATEADD(DAY,-2,DATEADD(HOUR,9,CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-2,DATEADD(HOUR,12,CAST(CAST(GETDATE() AS DATE) AS DATETIME))),'Completed'
FROM Users u, ParkingSlots ps WHERE u.Email='an.nguyen@gmail.com' AND ps.SlotCode='D-B2-B-C-005';

INSERT INTO Reservations (DriverID,VehicleTypeID,SlotID,ReservationDate,StartTime,EndTime,ReservationStatus)
SELECT u.UserID,1,ps.SlotID,DATEADD(DAY,-3,CAST(GETDATE() AS DATE)),
    DATEADD(DAY,-3,DATEADD(HOUR,8,CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-3,DATEADD(HOUR,11,CAST(CAST(GETDATE() AS DATE) AS DATETIME))),'Completed'
FROM Users u, ParkingSlots ps WHERE u.Email='binh.tran@gmail.com' AND ps.SlotCode='C-B2-A-M-005';

INSERT INTO Reservations (DriverID,VehicleTypeID,SlotID,ReservationDate,StartTime,EndTime,ReservationStatus)
SELECT u.UserID,2,ps.SlotID,DATEADD(DAY,-1,CAST(GETDATE() AS DATE)),
    DATEADD(DAY,-1,DATEADD(HOUR,14,CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-1,DATEADD(HOUR,18,CAST(CAST(GETDATE() AS DATE) AS DATETIME))),'Cancelled'
FROM Users u, ParkingSlots ps WHERE u.Email='cuong.le@gmail.com' AND ps.SlotCode='E-B2-C-C-005';

INSERT INTO Reservations (DriverID,VehicleTypeID,SlotID,ReservationDate,StartTime,EndTime,ReservationStatus)
SELECT u.UserID,1,ps.SlotID,DATEADD(DAY,-1,CAST(GETDATE() AS DATE)),
    DATEADD(DAY,-1,DATEADD(HOUR,6,CAST(CAST(GETDATE() AS DATE) AS DATETIME))),
    DATEADD(DAY,-1,DATEADD(HOUR,9,CAST(CAST(GETDATE() AS DATE) AS DATETIME))),'Expired'
FROM Users u, ParkingSlots ps WHERE u.Email='dung.pham@gmail.com' AND ps.SlotCode='D-B1-B-M-005';
GO

/* =====================================================================
   PHẦN 10: INCIDENTS + FEEDBACKS
   ===================================================================== */

DECLARE @staff1 INT, @staff2 INT;
SELECT @staff1 = UserID FROM Users WHERE Email = 'nam.staff@parking.com';
SELECT @staff2 = UserID FROM Users WHERE Email = 'oanh.staff@parking.com';

INSERT INTO Incidents (SessionID,DriverID,IncidentType,IncidentStatus,Priority,Description,AssignedStaffID,CreatedAt,UpdatedAt)
SELECT TOP 1 s.SessionID, s.DriverID, 'Lost Ticket', 'Open', 'Normal',
    N'Khach mat ve gui xe tai toa moi. Bien so: ' + s.PlateNumber,
    @staff1, DATEADD(HOUR,-2,GETDATE()), GETDATE()
FROM ParkingSessions s
WHERE s.SessionStatus='Active' AND s.SlotID IN (SELECT TOP 1 SlotID FROM ParkingSlots WHERE SlotCode LIKE 'C-%')
ORDER BY s.SessionID;

INSERT INTO Incidents (SessionID,DriverID,IncidentType,IncidentStatus,Priority,Description,AssignedStaffID,CreatedAt,UpdatedAt)
SELECT TOP 1 s.SessionID, s.DriverID, 'Vehicle Damage', 'InProgress', 'High',
    N'Xe bi tray xuoc trong khu vuc ham. Can kiem tra camera.',
    @staff2, DATEADD(HOUR,-4,GETDATE()), DATEADD(HOUR,-1,GETDATE())
FROM ParkingSessions s
WHERE s.SessionStatus='Completed' AND s.SlotID IN (SELECT TOP 1 SlotID FROM ParkingSlots WHERE SlotCode LIKE 'D-%')
ORDER BY s.SessionID DESC;

INSERT INTO Feedbacks (DriverID,IncidentID,FeedbackType,Description,FeedbackStatus,CreatedAt,UpdatedAt)
SELECT i.DriverID, i.IncidentID,
    CASE i.IncidentType WHEN 'Lost Ticket' THEN 'Complaint' ELSE 'Complaint' END,
    CASE i.IncidentType
        WHEN 'Lost Ticket'    THEN N'Xu ly cham, mong cai thien quy trinh kiem tra ve.'
        ELSE N'Yeu cau xem lai camera va boi thuong thiet hai.'
    END, 'Open', i.CreatedAt, i.UpdatedAt
FROM Incidents i
WHERE i.DriverID IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM Feedbacks f WHERE f.IncidentID = i.IncidentID);
GO

/* =====================================================================
   PHẦN 11: SUPPORT TICKETS + REPLIES
   ===================================================================== */

DECLARE @d1 INT, @d2 INT, @manager1 INT, @staff1 INT;
SELECT @d1      = UserID FROM Users WHERE Email = 'an.nguyen@gmail.com';
SELECT @d2      = UserID FROM Users WHERE Email = 'binh.tran@gmail.com';
SELECT @manager1= UserID FROM Users WHERE Email = 'son.manager@parking.com';
SELECT @staff1  = UserID FROM Users WHERE Email = 'nam.staff@parking.com';

INSERT INTO SupportTickets (DriverID,Subject,Content,Status,CreatedAt,UpdatedAt) VALUES
(@d1, N'Loi thanh toan PayOS tai toa moi',
    N'Toi da quet QR nhung he thong van bao chua thanh toan. Ma GD: VCB20240601.',
    'Open', DATEADD(HOUR,-3,GETDATE()), DATEADD(HOUR,-3,GETDATE())),
(@d2, N'Den ham bi hong - Toa D B2',
    N'Khu vuc D-B2 ban dem rat toi, den bi hong nhieu bong. De nghi sua gap.',
    'Pending', DATEADD(HOUR,-1,GETDATE()), DATEADD(HOUR,-1,GETDATE()));

DECLARE @tk1 INT;
SELECT TOP 1 @tk1 = TicketID FROM SupportTickets WHERE Subject LIKE N'%PayOS tai toa moi%';
INSERT INTO TicketReplies (TicketID,SenderID,Content,CreatedAt) VALUES
(@tk1, @staff1, N'Da nhan duoc. Dang kiem tra giao dich, vui long doi 30 phut.', DATEADD(HOUR,-2,GETDATE()));
GO

/* =====================================================================
   PHẦN 12: SERVICE RATINGS
   ===================================================================== */

INSERT INTO ServiceRatings (SessionID,DriverID,Rating,Comment,Tags,CreatedAt)
SELECT s.SessionID, s.DriverID,
    CASE (s.SessionID % 5) WHEN 0 THEN 5 WHEN 1 THEN 4 WHEN 2 THEN 5 WHEN 3 THEN 3 ELSE 4 END,
    CASE (s.SessionID % 5)
        WHEN 0 THEN N'Ham xe sach se, anh sang tot, nhan vien than thien!'
        WHEN 1 THEN N'Rat tien loi, he thong tu dong hoa cao.'
        WHEN 2 THEN N'Xuat sac! Bien chi dan ro rang, de tim slot.'
        WHEN 3 THEN N'Gia ca hop ly nhung can them camera an ninh.'
        ELSE N'Tot, se quay lai su dung dich vu.'
    END,
    CASE (s.SessionID % 5)
        WHEN 0 THEN N'["Sach se","An ninh","Nhan vien"]'
        WHEN 1 THEN N'["Tien loi","Cong nghe","Nhanh"]'
        WHEN 2 THEN N'["Bien chi dan","De dung","Tot"]'
        WHEN 3 THEN N'["Gia ca","Camera","An ninh"]'
        ELSE N'["Tong the","Hai long"]'
    END,
    DATEADD(MINUTE, -(s.SessionID * 13 % 5000), GETDATE())
FROM ParkingSessions s
WHERE s.SessionStatus = 'Completed'
  AND s.DriverID IS NOT NULL
  AND s.SlotID IN (
      SELECT ps.SlotID FROM ParkingSlots ps
      JOIN Zones z ON ps.ZoneID = z.ZoneID
      JOIN Floors f ON z.FloorID = f.FloorID
      JOIN Buildings b ON f.BuildingID = b.BuildingID
      WHERE b.BuildingName LIKE N'Toa C%'
         OR b.BuildingName LIKE N'Toa D%'
         OR b.BuildingName LIKE N'Toa E%'
  )
  AND NOT EXISTS (SELECT 1 FROM ServiceRatings sr WHERE sr.SessionID = s.SessionID);
GO

/* =====================================================================
   PHẦN 13: NOTIFICATIONS
   ===================================================================== */

DECLARE @d1 INT, @d2 INT, @d3 INT, @d4 INT, @d5 INT;
SELECT @d1=UserID FROM Users WHERE Email='an.nguyen@gmail.com';
SELECT @d2=UserID FROM Users WHERE Email='binh.tran@gmail.com';
SELECT @d3=UserID FROM Users WHERE Email='cuong.le@gmail.com';
SELECT @d4=UserID FROM Users WHERE Email='dung.pham@gmail.com';
SELECT @d5=UserID FROM Users WHERE Email='em.hoang@gmail.com';

INSERT INTO Notifications (UserID,Title,Message,NotificationType,IsRead,CreatedAt) VALUES
(@d1,N'Dat cho thanh cong', N'Ban da dat slot C-B1-A-M-010 tu 14:00-18:00 hom nay.','booking',0,DATEADD(HOUR,-1,GETDATE())),
(@d2,N'Dat cho thanh cong', N'Ban da dat slot C-B1-C-C-010 tai Toa C.','booking',0,DATEADD(HOUR,-2,GETDATE())),
(@d3,N'Dat cho thanh cong', N'Ban da dat slot D-B1-A-M-010 tai Toa D.','booking',0,DATEADD(MINUTE,-30,GETDATE())),
(@d4,N'Su co duoc ghi nhan',N'Su co tai slot cua ban da duoc nhan vien xu ly.','incident',0,DATEADD(HOUR,-3,GETDATE())),
(@d5,N'Nhac nho gia han goi',N'Goi Pro cua ban het han. Gia han de tiep tuc uu dai.','system',0,DATEADD(DAY,-1,GETDATE())),
(@d1,N'Nap tien thanh cong', N'Da nap 800.000d vao vi. So du: 800.000d.','payment',1,DATEADD(DAY,-5,GETDATE())),
(@d3,N'Nap tien thanh cong', N'Da nap 1.000.000d vao vi. So du: 1.000.000d.','payment',1,DATEADD(DAY,-20,GETDATE()));
GO

/* =====================================================================
   PHẦN 14: SYNC SLOT STATUS
   ===================================================================== */

UPDATE ps SET ps.SlotStatus =
    CASE
        WHEN ps.SlotStatus IN ('Maintenance','Blocked') THEN ps.SlotStatus
        WHEN EXISTS (SELECT 1 FROM ParkingSessions s WHERE s.SlotID=ps.SlotID AND s.SessionStatus='Active') THEN 'Occupied'
        WHEN EXISTS (SELECT 1 FROM Reservations r WHERE r.SlotID=ps.SlotID AND r.ReservationStatus='Reserved' AND r.EndTime>GETDATE()) THEN 'Reserved'
        ELSE 'Available'
    END
FROM ParkingSlots ps
WHERE ps.SlotCode LIKE 'C-%'
   OR ps.SlotCode LIKE 'D-%'
   OR ps.SlotCode LIKE 'E-%';
GO

/* =====================================================================
   VERIFY
   ===================================================================== */

SELECT '===== TONG QUAN =====' AS Info;
SELECT TableName, Rows FROM (
    SELECT 'Users'            AS TableName, COUNT(*) AS Rows FROM Users            UNION ALL
    SELECT 'Buildings',        COUNT(*) FROM Buildings                             UNION ALL
    SELECT 'Floors',           COUNT(*) FROM Floors                               UNION ALL
    SELECT 'Zones',            COUNT(*) FROM Zones                                UNION ALL
    SELECT 'ParkingSlots',     COUNT(*) FROM ParkingSlots                         UNION ALL
    SELECT 'ParkingSessions',  COUNT(*) FROM ParkingSessions                      UNION ALL
    SELECT 'Payments',         COUNT(*) FROM Payments                             UNION ALL
    SELECT 'Reservations',     COUNT(*) FROM Reservations                         UNION ALL
    SELECT 'Incidents',        COUNT(*) FROM Incidents                            UNION ALL
    SELECT 'Feedbacks',        COUNT(*) FROM Feedbacks                            UNION ALL
    SELECT 'ServiceRatings',   COUNT(*) FROM ServiceRatings                       UNION ALL
    SELECT 'SupportTickets',   COUNT(*) FROM SupportTickets                       UNION ALL
    SELECT 'TicketReplies',    COUNT(*) FROM TicketReplies                        UNION ALL
    SELECT 'Notifications',    COUNT(*) FROM Notifications                        UNION ALL
    SELECT 'DriverVehicles',   COUNT(*) FROM DriverVehicles                       UNION ALL
    SELECT 'UserSubscriptions',COUNT(*) FROM UserSubscriptions                    UNION ALL
    SELECT 'WalletTransactions',COUNT(*) FROM WalletTransactions                  UNION ALL
    SELECT 'NightPricingPolicies',COUNT(*) FROM NightPricingPolicies
) t ORDER BY TableName;
GO

SELECT '===== SLOT THEO TOA =====' AS Info;
SELECT b.BuildingName, COUNT(*) AS TotalSlots,
    SUM(CASE WHEN ps.SlotStatus='Available'   THEN 1 ELSE 0 END) AS Available,
    SUM(CASE WHEN ps.SlotStatus='Occupied'    THEN 1 ELSE 0 END) AS Occupied,
    SUM(CASE WHEN ps.SlotStatus='Reserved'    THEN 1 ELSE 0 END) AS Reserved,
    SUM(CASE WHEN ps.SlotStatus='Maintenance' THEN 1 ELSE 0 END) AS Maintenance,
    SUM(CASE WHEN ps.SlotStatus='Blocked'     THEN 1 ELSE 0 END) AS Blocked
FROM ParkingSlots ps
JOIN Zones z ON ps.ZoneID=z.ZoneID JOIN Floors f ON z.FloorID=f.FloorID JOIN Buildings b ON f.BuildingID=b.BuildingID
GROUP BY b.BuildingName ORDER BY b.BuildingName;
GO
