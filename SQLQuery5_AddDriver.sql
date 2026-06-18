INSERT INTO Users (
    FullName, Email, PasswordHash, RoleID, 
    IsActive, IsEmailVerified
)
VALUES (
    N'Khách Vãng Lai', 
    'walkin.guest@system.local', 
    NULL, 
    1,
    1, 1
);

SELECT UserID, FullName, Email FROM Users 
WHERE Email = 'walkin.guest@system.local';

USE ParkingManagementDB;
GO

-- =====================================================
-- MIGRATION: Manager Reports — Views & SP bổ sung
-- Bổ sung phần còn thiếu cho yêu cầu Manager:
--   "Xem báo cáo lượt xe vào/ra, doanh thu, tỷ lệ lấp đầy,
--    khung giờ cao điểm theo từng loại phương tiện"
-- Dữ liệu đã có sẵn — đây chỉ là query đóng gói sẵn.
-- =====================================================

-- ─────────────────────────────────────────────────────────────
-- VIEW: vw_RevenueByDay — doanh thu theo ngày (kèm tách Cash/Banking)
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('vw_RevenueByDay', 'V') IS NOT NULL DROP VIEW vw_RevenueByDay;
GO
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

-- ─────────────────────────────────────────────────────────────
-- VIEW: vw_OccupancyByZone — tỷ lệ lấp đầy theo Zone (realtime)
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('vw_OccupancyByZone', 'V') IS NOT NULL DROP VIEW vw_OccupancyByZone;
GO
CREATE VIEW vw_OccupancyByZone AS
SELECT
    b.BuildingID,
    b.BuildingName,
    f.FloorID,
    f.FloorName,
    z.ZoneID,
    z.ZoneName,
    vt.VehicleName,
    COUNT(ps.SlotID)                                                AS TotalSlots,
    SUM(CASE WHEN ps.SlotStatus = 'Occupied'    THEN 1 ELSE 0 END)  AS Occupied,
    SUM(CASE WHEN ps.SlotStatus = 'Available'   THEN 1 ELSE 0 END)  AS Available,
    SUM(CASE WHEN ps.SlotStatus = 'Reserved'    THEN 1 ELSE 0 END)  AS Reserved,
    SUM(CASE WHEN ps.SlotStatus = 'Maintenance' THEN 1 ELSE 0 END)  AS Maintenance,
    SUM(CASE WHEN ps.SlotStatus = 'Blocked'     THEN 1 ELSE 0 END)  AS Blocked,
    CASE WHEN COUNT(ps.SlotID) = 0 THEN 0
         ELSE ROUND(100.0 * SUM(CASE WHEN ps.SlotStatus = 'Occupied' THEN 1 ELSE 0 END)
              / COUNT(ps.SlotID), 1)
    END AS OccupancyPct
FROM ParkingSlots ps
JOIN Zones z         ON ps.ZoneID         = z.ZoneID
JOIN Floors f        ON z.FloorID         = f.FloorID
JOIN Buildings b     ON f.BuildingID      = b.BuildingID
JOIN VehicleTypes vt ON z.AllowedVehicleTypeID = vt.VehicleTypeID
WHERE f.IsActive = 1
GROUP BY b.BuildingID, b.BuildingName, f.FloorID, f.FloorName,
         z.ZoneID, z.ZoneName, vt.VehicleName;
GO

-- ─────────────────────────────────────────────────────────────
-- SP: sp_GetPeakHours — khung giờ cao điểm theo loại xe trong khoảng ngày
--   Trả về: VehicleTypeID, VehicleName, Hour (0-23), SessionCount
--   Dùng cho biểu đồ heatmap giờ cao điểm theo từng loại phương tiện.
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('sp_GetPeakHours', 'P') IS NOT NULL DROP PROCEDURE sp_GetPeakHours;
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
        vt.VehicleTypeID,
        vt.VehicleName,
        vt.VehicleCode,
        DATEPART(HOUR, s.EntryTime) AS Hour,
        COUNT(*)                    AS SessionCount
    FROM ParkingSessions s
    JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
    WHERE CAST(s.EntryTime AS DATE) BETWEEN @StartDate AND @EndDate
      AND (@VehicleTypeID IS NULL OR s.VehicleTypeID = @VehicleTypeID)
    GROUP BY vt.VehicleTypeID, vt.VehicleName, vt.VehicleCode, DATEPART(HOUR, s.EntryTime)
    ORDER BY vt.VehicleTypeID, Hour;
END
GO

-- ─────────────────────────────────────────────────────────────
-- SP: sp_GetVehicleFlow — lượt xe vào/ra theo ngày + loại xe
-- ─────────────────────────────────────────────────────────────
IF OBJECT_ID('sp_GetVehicleFlow', 'P') IS NOT NULL DROP PROCEDURE sp_GetVehicleFlow;
GO
CREATE PROCEDURE sp_GetVehicleFlow
    @StartDate DATE = NULL,
    @EndDate   DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF @StartDate IS NULL SET @StartDate = DATEADD(DAY, -30, CAST(GETDATE() AS DATE));
    IF @EndDate   IS NULL SET @EndDate   = CAST(GETDATE() AS DATE);

    -- Lượt vào theo ngày
    SELECT
        CAST(s.EntryTime AS DATE) AS FlowDate,
        vt.VehicleName,
        vt.VehicleCode,
        COUNT(*) AS CheckInCount,
        SUM(CASE WHEN s.ExitTime IS NOT NULL
                  AND CAST(s.ExitTime AS DATE) = CAST(s.EntryTime AS DATE)
                 THEN 1 ELSE 0 END) AS CheckOutSameDay
    FROM ParkingSessions s
    JOIN VehicleTypes vt ON s.VehicleTypeID = vt.VehicleTypeID
    WHERE CAST(s.EntryTime AS DATE) BETWEEN @StartDate AND @EndDate
    GROUP BY CAST(s.EntryTime AS DATE), vt.VehicleName, vt.VehicleCode
    ORDER BY FlowDate, vt.VehicleName;
END
GO

-- =====================================================
-- VERIFY
-- =====================================================
SELECT 'Views/SPs created:' AS Info, name, type_desc
FROM sys.objects
WHERE name IN ('vw_RevenueByDay', 'vw_OccupancyByZone', 'sp_GetPeakHours', 'sp_GetVehicleFlow')
ORDER BY name;
GO