USE ParkingManagementDB;
GO

-- =====================================================
-- MIGRATION: Mở rộng bảng Payments cho PayOS
-- =====================================================

-- 1. Drop constraint cũ trên PaymentStatus để thêm giá trị mới
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name LIKE '%PaymentStatus%'
      AND parent_object_id = OBJECT_ID('Payments')
)
BEGIN
    DECLARE @cn NVARCHAR(200)
    SELECT @cn = name
    FROM sys.check_constraints
    WHERE name LIKE '%PaymentStatus%'
      AND parent_object_id = OBJECT_ID('Payments')
    EXEC('ALTER TABLE Payments DROP CONSTRAINT ' + @cn)
END
GO

-- 2. Thêm columns mới vào Payments
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'OrderCode')
    ALTER TABLE Payments ADD OrderCode BIGINT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'PaymentLinkId')
    ALTER TABLE Payments ADD PaymentLinkId NVARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'QrCode')
    ALTER TABLE Payments ADD QrCode NVARCHAR(MAX) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'CheckoutUrl')
    ALTER TABLE Payments ADD CheckoutUrl NVARCHAR(500) NULL;
GO
-- PrepaidAt: thời điểm driver bấm tạo QR thanh toán
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'PrepaidAt')
    ALTER TABLE Payments ADD PrepaidAt DATETIME NULL;
GO
-- SnapshotDurationH: số giờ lúc tạo QR (dùng để tính surcharge sau)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'SnapshotDurationH')
    ALTER TABLE Payments ADD SnapshotDurationH DECIMAL(10,2) NULL;
GO
-- PrepaidAmount: số tiền driver đã trả trước
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'PrepaidAmount')
    ALTER TABLE Payments ADD PrepaidAmount DECIMAL(10,2) NULL DEFAULT 0;
GO
-- SurchargeAmount: số tiền phải trả thêm khi xe ở lâu hơn
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'SurchargeAmount')
    ALTER TABLE Payments ADD SurchargeAmount DECIMAL(10,2) NULL DEFAULT 0;
GO
-- FinalAmount: tổng phí cuối cùng (tính lúc staff checkout)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'FinalAmount')
    ALTER TABLE Payments ADD FinalAmount DECIMAL(10,2) NULL;
GO
-- SurchargeStatus: trạng thái thu thêm tiền phụ trội
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'SurchargeStatus')
    ALTER TABLE Payments ADD SurchargeStatus NVARCHAR(20) NULL DEFAULT 'None';
GO
-- SurchargePaidAt: thời điểm thu tiền phụ trội
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'SurchargePaidAt')
    ALTER TABLE Payments ADD SurchargePaidAt DATETIME NULL;
GO
-- PaymentNote: ghi chú
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Payments') AND name = 'PaymentNote')
    ALTER TABLE Payments ADD PaymentNote NVARCHAR(500) NULL;
GO

-- 3. Thêm constraint mới với đầy đủ status
ALTER TABLE Payments
ADD CONSTRAINT CK_Payments_Status
CHECK (PaymentStatus IN ('Pending','Prepaid','Completed','Failed','Cancelled'));
GO

ALTER TABLE Payments
ADD CONSTRAINT CK_Payments_SurchargeStatus
CHECK (SurchargeStatus IN ('None','Pending','Completed'));
GO

-- 4. Index cho OrderCode (tìm kiếm nhanh)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Payments_OrderCode')
    CREATE INDEX IX_Payments_OrderCode ON Payments(OrderCode);
GO

-- =====================================================
-- TEST PRICING: Thêm bảng giá thử nghiệm 2,000đ
-- (MinHours=0, MaxHours=999 cho mọi xe, Fee=2000)
-- =====================================================
-- Tắt hết giá cũ khi chạy test
-- UPDATE PricingPolicies SET IsActive = 0;
-- Thêm giá test 2000đ cho cả 3 loại xe
INSERT INTO PricingPolicies (VehicleTypeID, MinHours, MaxHours, Fee, IsOvernight, IsActive)
SELECT vt.VehicleTypeID, 0, 999, 2000, 0, 1
FROM VehicleTypes vt
WHERE NOT EXISTS (
    SELECT 1 FROM PricingPolicies pp
    WHERE pp.VehicleTypeID = vt.VehicleTypeID
      AND pp.Fee = 2000
      AND pp.MinHours = 0
      AND pp.MaxHours = 999
);
GO

-- =====================================================
-- BẢNG LỊCH SỬ GIAO DỊCH MỞ RỘNG (VIEW)
-- Không tạo bảng mới, dùng View để join dữ liệu có sẵn
-- =====================================================
IF OBJECT_ID('vw_PaymentHistory', 'V') IS NOT NULL DROP VIEW vw_PaymentHistory;
GO
CREATE VIEW vw_PaymentHistory AS
SELECT
    p.PaymentID,
    p.SessionID,
    p.OrderCode,
    p.Amount,
    p.PrepaidAmount,
    p.SurchargeAmount,
    p.FinalAmount,
    p.PaymentMethod,
    p.PaymentStatus,
    p.SurchargeStatus,
    p.PrepaidAt,
    p.PaymentTime,
    p.SurchargePaidAt,
    p.SnapshotDurationH,
    p.PaymentNote,
    ps.PlateNumber,
    ps.EntryTime,
    ps.ExitTime,
    ps.SessionStatus,
    ps.DriverID,
    vt.VehicleName,
    vt.VehicleCode,
    sl.SlotCode,
    z.ZoneName,
    f.FloorName,
    b.BuildingName,
    u.FullName AS DriverName,
    u.Email    AS DriverEmail,
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
JOIN Users           u  ON ps.DriverID      = u.UserID;
GO

-- =====================================================
-- SP: Lấy phí đúng tier theo loại xe và số giờ
-- =====================================================
IF OBJECT_ID('sp_CalcParkingFee', 'P') IS NOT NULL DROP PROCEDURE sp_CalcParkingFee;
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
    WHERE VehicleTypeID = @VehicleTypeID
      AND IsActive = 1
      AND (
            (IsOvernight = 1 AND @DurationH > 8)
            OR (@DurationH BETWEEN MinHours AND MaxHours)
          )
    ORDER BY IsOvernight DESC, MaxHours;

    IF @Fee IS NULL SET @Fee = 2000;
    IF @Fee < 2000  SET @Fee = 2000; -- PayOS tối thiểu
END
GO

-- =====================================================
-- SP: Tạo / cập nhật Prepaid payment
-- Gọi khi driver bấm "Tạo QR" (chưa có xe ra)
-- =====================================================
IF OBJECT_ID('sp_CreatePrepayment', 'P') IS NOT NULL DROP PROCEDURE sp_CreatePrepayment;
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

    -- Kiểm tra session tồn tại và đang active
    IF NOT EXISTS (
        SELECT 1 FROM ParkingSessions
        WHERE SessionID = @SessionID AND SessionStatus = 'Active'
    )
    BEGIN
        RAISERROR('Session không tồn tại hoặc không active.', 16, 1);
        RETURN;
    END

    -- Upsert Payments
    IF EXISTS (SELECT 1 FROM Payments WHERE SessionID = @SessionID)
    BEGIN
        UPDATE Payments
        SET OrderCode        = @OrderCode,
            Amount           = @Amount,
            SnapshotDurationH = @SnapshotH,
            QrCode           = @QrCode,
            CheckoutUrl      = @CheckoutUrl,
            PaymentMethod    = 'Banking',
            PaymentStatus    = 'Pending',
            PrepaidAt        = NULL,  -- reset khi tạo lại QR
            PrepaidAmount    = 0,
            SurchargeAmount  = 0,
            FinalAmount      = NULL,
            SurchargeStatus  = 'None'
        WHERE SessionID = @SessionID;
    END
    ELSE
    BEGIN
        INSERT INTO Payments (
            SessionID, Amount, PaymentMethod, PaymentStatus,
            OrderCode, SnapshotDurationH, QrCode, CheckoutUrl,
            PrepaidAmount, SurchargeAmount, SurchargeStatus
        )
        VALUES (
            @SessionID, @Amount, 'Banking', 'Pending',
            @OrderCode, @SnapshotH, @QrCode, @CheckoutUrl,
            0, 0, 'None'
        );
    END

    SELECT
        p.PaymentID, p.SessionID, p.OrderCode,
        p.Amount, p.PaymentStatus, p.SnapshotDurationH
    FROM Payments p WHERE p.SessionID = @SessionID;
END
GO

-- =====================================================
-- SP: Đánh dấu đã thanh toán (webhook / poll)
-- KHÔNG checkout xe (xe vẫn Active) → chỉ Prepaid
-- =====================================================
IF OBJECT_ID('sp_MarkPaymentPrepaid', 'P') IS NOT NULL DROP PROCEDURE sp_MarkPaymentPrepaid;
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
    FROM Payments
    WHERE OrderCode = @OrderCode AND PaymentStatus = 'Pending';

    IF @SessionID IS NULL
    BEGIN
        -- Đã xử lý rồi hoặc không tìm thấy → bỏ qua
        SELECT 0 AS Updated;
        RETURN;
    END

    DECLARE @Amount       DECIMAL(10,2);
    DECLARE @SnapshotH    DECIMAL(10,2);
    SELECT @Amount = Amount, @SnapshotH = SnapshotDurationH
    FROM Payments WHERE SessionID = @SessionID;

    UPDATE Payments
    SET PaymentStatus  = 'Prepaid',
        PrepaidAmount  = @Amount,
        PrepaidAt      = @PaidAt,
        PaymentTime    = @PaidAt
    WHERE SessionID = @SessionID;

    SELECT @SessionID AS SessionID, @Amount AS PrepaidAmount, 1 AS Updated;
END
GO

-- =====================================================
-- SP: Staff checkout — tính phí thực tế, xử lý surcharge
-- Gọi từ staff checkout endpoint
-- =====================================================
IF OBJECT_ID('sp_CheckOutWithSurcharge', 'P') IS NOT NULL DROP PROCEDURE sp_CheckOutWithSurcharge;
GO
CREATE PROCEDURE sp_CheckOutWithSurcharge
    @SessionID     INT,
    @PaymentMethod NVARCHAR(50)   -- Cash / Banking / Card / Momo / ...
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;

    DECLARE @EntryTime     DATETIME;
    DECLARE @ExitTime      DATETIME = GETDATE();
    DECLARE @VehicleTypeID INT;
    DECLARE @DurationH     DECIMAL(10,2);
    DECLARE @FinalFee      DECIMAL(10,2);
    DECLARE @PrepaidAmount DECIMAL(10,2) = 0;
    DECLARE @PayStatus     NVARCHAR(20);

    -- Lấy thông tin session
    SELECT
        @EntryTime     = EntryTime,
        @VehicleTypeID = VehicleTypeID
    FROM ParkingSessions
    WHERE SessionID = @SessionID AND SessionStatus = 'Active';

    IF @EntryTime IS NULL
    BEGIN
        ROLLBACK;
        RAISERROR('Session không tồn tại hoặc đã checkout.', 16, 1);
        RETURN;
    END

    -- Tính thời gian thực tế
    SET @DurationH = DATEDIFF(MINUTE, @EntryTime, @ExitTime) / 60.0;

    -- Tính phí thực tế theo tier
    EXEC sp_CalcParkingFee
        @VehicleTypeID = @VehicleTypeID,
        @DurationH     = @DurationH,
        @Fee           = @FinalFee OUTPUT;

    -- Lấy số tiền đã trả trước
    SELECT
        @PrepaidAmount = ISNULL(PrepaidAmount, 0),
        @PayStatus     = PaymentStatus
    FROM Payments WHERE SessionID = @SessionID;

    DECLARE @Surcharge DECIMAL(10,2) = @FinalFee - @PrepaidAmount;
    IF @Surcharge < 0 SET @Surcharge = 0;

    -- Cập nhật ParkingSessions
    UPDATE ParkingSessions
    SET ExitTime      = @ExitTime,
        SessionStatus = 'Completed'
    WHERE SessionID = @SessionID;

    -- Cập nhật Payments
    IF @PayStatus = 'Prepaid'
    BEGIN
        -- Driver đã trả trước → xét surcharge
        IF @Surcharge > 0
        BEGIN
            UPDATE Payments
            SET FinalAmount       = @FinalFee,
                SurchargeAmount   = @Surcharge,
                SurchargeStatus   = 'Pending',
                PaymentStatus     = 'Prepaid',  -- vẫn Prepaid cho đến khi thu đủ
                PaymentNote       = CONCAT('Prepaid: ', @PrepaidAmount, ' VND. Surcharge: ', @Surcharge, ' VND')
            WHERE SessionID = @SessionID;
        END
        ELSE
        BEGIN
            -- Đã trả đủ hoặc dư
            UPDATE Payments
            SET FinalAmount     = @FinalFee,
                SurchargeAmount = 0,
                SurchargeStatus = 'None',
                PaymentStatus   = 'Completed',
                PaymentMethod   = 'Banking',
                PaymentNote     = CONCAT('Prepaid full: ', @PrepaidAmount, ' VND')
            WHERE SessionID = @SessionID;
        END
    END
    ELSE
    BEGIN
        -- Chưa trả gì → thanh toán tại quầy
        UPDATE Payments
        SET Amount          = @FinalFee,
            FinalAmount     = @FinalFee,
            SurchargeAmount = 0,
            SurchargeStatus = 'None',
            PaymentMethod   = @PaymentMethod,
            PaymentTime     = @ExitTime,
            PaymentStatus   = 'Completed'
        WHERE SessionID = @SessionID;
    END

    COMMIT;

    -- Trả kết quả để controller hiển thị
    SELECT
        ps.SessionID,
        ps.PlateNumber,
        ps.EntryTime,
        ps.ExitTime,
        ps.VehicleTypeID,
        @DurationH         AS DurationH,
        @FinalFee          AS FinalFee,
        @PrepaidAmount     AS PrepaidAmount,
        @Surcharge         AS SurchargeAmount,
        p.PaymentStatus,
        p.SurchargeStatus,
        p.PaymentNote,
        vt.VehicleName
    FROM ParkingSessions ps
    JOIN Payments p ON ps.SessionID = p.SessionID
    JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
    WHERE ps.SessionID = @SessionID;
END
GO

-- =====================================================
-- SP: Thu tiền phụ trội (surcharge) — staff gọi khi thu tiền thêm
-- =====================================================
IF OBJECT_ID('sp_ConfirmSurcharge', 'P') IS NOT NULL DROP PROCEDURE sp_ConfirmSurcharge;
GO
CREATE PROCEDURE sp_ConfirmSurcharge
    @SessionID     INT,
    @PaymentMethod NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM Payments
        WHERE SessionID = @SessionID AND SurchargeStatus = 'Pending'
    )
    BEGIN
        RAISERROR('Không có khoản phụ trội cần thu.', 16, 1);
        RETURN;
    END

    UPDATE Payments
    SET PaymentStatus   = 'Completed',
        SurchargeStatus = 'Completed',
        SurchargePaidAt = GETDATE(),
        PaymentMethod   = @PaymentMethod
    WHERE SessionID = @SessionID;

    SELECT
        p.PaymentID, p.SessionID, p.FinalAmount,
        p.PrepaidAmount, p.SurchargeAmount,
        p.PaymentStatus, p.SurchargeStatus
    FROM Payments p WHERE p.SessionID = @SessionID;
END
GO

-- =====================================================
-- SP: Lấy lịch sử thanh toán của driver
-- =====================================================
IF OBJECT_ID('sp_GetPaymentHistory', 'P') IS NOT NULL DROP PROCEDURE sp_GetPaymentHistory;
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
    ORDER BY
        CASE WHEN v.PrepaidAt IS NOT NULL THEN v.PrepaidAt ELSE v.PaymentTime END DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
END
GO

-- =====================================================
-- TEST DATA: Thêm giá thử nghiệm 2000đ và verify
-- =====================================================
SELECT 'Pricing Policies:' AS Info;
SELECT
    vt.VehicleName,
    pp.MinHours,
    pp.MaxHours,
    pp.Fee,
    pp.IsActive,
    CASE WHEN pp.Fee = 2000 THEN '*** TEST PRICE ***' ELSE '' END AS Note
FROM PricingPolicies pp
JOIN VehicleTypes vt ON pp.VehicleTypeID = vt.VehicleTypeID
ORDER BY vt.VehicleTypeID, pp.MinHours;
GO

SELECT 'Payments columns:' AS Info;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Payments'
ORDER BY ORDINAL_POSITION;
GO