USE ParkingManagementDB;
GO

-- =====================================================
-- MIGRATION: Driver Features (Notifications, Vehicles, Ratings)
-- =====================================================

-- =====================================================
-- 1. BẢNG NOTIFICATIONS
-- =====================================================
IF OBJECT_ID('Notifications', 'U') IS NULL
BEGIN
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

    CREATE INDEX IX_Notifications_UserID ON Notifications(UserID);
    CREATE INDEX IX_Notifications_UserID_IsRead ON Notifications(UserID, IsRead);
    CREATE INDEX IX_Notifications_CreatedAt ON Notifications(CreatedAt DESC);

    PRINT 'Created table: Notifications';
END
ELSE
    PRINT 'Table Notifications already exists.';
GO

-- =====================================================
-- 2. BẢNG DRIVER VEHICLES
-- =====================================================
IF OBJECT_ID('DriverVehicles', 'U') IS NULL
BEGIN
    CREATE TABLE DriverVehicles (
        VehicleID     INT IDENTITY(1,1) PRIMARY KEY,
        DriverID      INT NOT NULL,
        PlateNumber   NVARCHAR(20) NOT NULL,
        VehicleTypeID INT NOT NULL,
        VehicleBrand  NVARCHAR(100) NULL,
        VehicleColor  NVARCHAR(50) NULL,
        IsActive      BIT NOT NULL DEFAULT 1,
        CreatedAt     DATETIME NOT NULL DEFAULT GETDATE(),
        UpdatedAt     DATETIME NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_DriverVehicles_Driver FOREIGN KEY (DriverID) REFERENCES Users(UserID),
        CONSTRAINT FK_DriverVehicles_VehicleType FOREIGN KEY (VehicleTypeID) REFERENCES VehicleTypes(VehicleTypeID)
    );

    CREATE INDEX IX_DriverVehicles_DriverID ON DriverVehicles(DriverID);

    PRINT 'Created table: DriverVehicles';
END
ELSE
    PRINT 'Table DriverVehicles already exists.';
GO

-- =====================================================
-- 3. BẢNG SERVICE RATINGS (Đánh giá chuyến xe)
-- =====================================================
IF OBJECT_ID('ServiceRatings', 'U') IS NULL
BEGIN
    CREATE TABLE ServiceRatings (
        RatingID     INT IDENTITY(1,1) PRIMARY KEY,
        SessionID    INT NOT NULL,
        DriverID     INT NOT NULL,
        Rating       INT NOT NULL,
        Comment      NVARCHAR(500) NULL,
        CreatedAt    DATETIME NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_ServiceRatings_Session FOREIGN KEY (SessionID) REFERENCES ParkingSessions(SessionID),
        CONSTRAINT FK_ServiceRatings_Driver FOREIGN KEY (DriverID) REFERENCES Users(UserID),
        CONSTRAINT CK_RatingValue CHECK (Rating BETWEEN 1 AND 5)
    );

    CREATE UNIQUE INDEX UQ_ServiceRatings_Session ON ServiceRatings(SessionID);
    CREATE INDEX IX_ServiceRatings_DriverID ON ServiceRatings(DriverID);

    PRINT 'Created table: ServiceRatings';
END
ELSE
    PRINT 'Table ServiceRatings already exists.';
GO

-- =====================================================
-- 4. TRIGGER AUTO NOTIFICATIONS
-- =====================================================
IF OBJECT_ID('TRG_NotifyOnPaymentComplete', 'TR') IS NOT NULL
    DROP TRIGGER TRG_NotifyOnPaymentComplete;
GO

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
        'payment',
        i.PaymentID,
        'payment',
        GETDATE()
    FROM inserted i
    JOIN ParkingSessions s ON i.SessionID = s.SessionID
    WHERE i.PaymentStatus = 'Completed' 
      AND (EXISTS (SELECT 1 FROM deleted d WHERE d.PaymentID = i.PaymentID AND d.PaymentStatus <> 'Completed')
           OR NOT EXISTS (SELECT 1 FROM deleted d WHERE d.PaymentID = i.PaymentID));
END
GO
