IF OBJECT_ID('sp_GetParkingMap', 'P') IS NOT NULL DROP PROCEDURE sp_GetParkingMap;
GO

CREATE PROCEDURE sp_GetParkingMap
    @buildingId    INT           = NULL,
    @floorId       INT           = NULL,
    @vehicleTypeId INT           = NULL,
    @status        NVARCHAR(20)  = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Buildings
    SELECT
        b.BuildingID,
        b.BuildingName,
        b.Address,
        b.OperatingHours
    FROM Buildings b
    WHERE (@buildingId IS NULL OR b.BuildingID = @buildingId)
    ORDER BY b.BuildingID
    FOR JSON PATH, ROOT('buildings');

    -- 2. Floors
    SELECT
        f.FloorID,
        f.BuildingID,
        f.FloorName,
        f.IsActive
    FROM Floors f
    JOIN Buildings b ON f.BuildingID = b.BuildingID
    WHERE f.IsActive = 1
      AND (@buildingId IS NULL OR f.BuildingID = @buildingId)
      AND (@floorId IS NULL OR f.FloorID = @floorId)
    ORDER BY f.BuildingID, f.FloorID;

    -- 3. Zones
    SELECT
        z.ZoneID,
        z.FloorID,
        z.ZoneName,
        z.AllowedVehicleTypeID,
        z.TotalSlots,
        vt.VehicleCode,
        vt.VehicleName
    FROM Zones z
    JOIN VehicleTypes vt ON z.AllowedVehicleTypeID = vt.VehicleTypeID
    JOIN Floors f ON z.FloorID = f.FloorID
    WHERE f.IsActive = 1
      AND (@buildingId IS NULL OR f.BuildingID = @buildingId)
      AND (@floorId IS NULL OR z.FloorID = @floorId)
      AND (@vehicleTypeId IS NULL OR z.AllowedVehicleTypeID = @vehicleTypeId)
    ORDER BY z.FloorID, z.ZoneID;

    -- 4. Slots
    SELECT
        ps.SlotID,
        ps.ZoneID,
        ps.SlotCode,
        ps.VehicleTypeID,
        vt.VehicleCode,
        vt.VehicleName,

        -- Active session info
        sess.SessionID,
        sess.PlateNumber,
        sess.EntryTime,
        sess.SessionStatus,

        -- Active or completed reservation info
        rsv.ReservationID,
        rsv.StartTime,
        rsv.EndTime,
        rsv.ReservationStatus,
        driver.FullName  AS DriverName,
        driver.Email     AS DriverEmail,
        driver.PhoneNumber AS DriverPhone,

        CASE
            WHEN ps.SlotStatus IN ('Maintenance','Blocked') THEN ps.SlotStatus
            WHEN EXISTS (
                SELECT 1 FROM ParkingSessions s WHERE s.SlotID = ps.SlotID AND s.SessionStatus = 'Active'
            ) THEN 'Occupied'
            WHEN EXISTS (
                SELECT 1 FROM Reservations r 
                WHERE r.SlotID = ps.SlotID AND r.ReservationStatus IN ('Reserved','Completed')
            ) THEN 'Reserved'
            ELSE 'Available'
        END AS SlotStatus
    FROM ParkingSlots ps
    JOIN VehicleTypes vt ON ps.VehicleTypeID = vt.VehicleTypeID
    JOIN Zones z ON ps.ZoneID = z.ZoneID
    JOIN Floors f ON z.FloorID = f.FloorID

    LEFT JOIN (
        SELECT TOP 1 WITH TIES
            SlotID, SessionID, PlateNumber, EntryTime, SessionStatus
        FROM ParkingSessions
        WHERE SessionStatus = 'Active'
        ORDER BY ROW_NUMBER() OVER (PARTITION BY SlotID ORDER BY EntryTime DESC)
    ) sess ON sess.SlotID = ps.SlotID

    LEFT JOIN (
        SELECT *
        FROM Reservations r
        WHERE r.ReservationStatus IN ('Reserved','Completed')
    ) rsv ON rsv.SlotID = ps.SlotID

    LEFT JOIN Users driver ON driver.UserID = rsv.DriverID

    WHERE f.IsActive = 1
      AND (@buildingId IS NULL OR f.BuildingID = @buildingId)
      AND (@floorId IS NULL OR z.FloorID = @floorId)
      AND (@vehicleTypeId IS NULL OR ps.VehicleTypeID = @vehicleTypeId)
      AND (@status IS NULL OR
           CASE
               WHEN ps.SlotStatus IN ('Maintenance','Blocked') THEN ps.SlotStatus
               WHEN EXISTS (SELECT 1 FROM ParkingSessions s WHERE s.SlotID = ps.SlotID AND s.SessionStatus='Active') THEN 'Occupied'
               WHEN EXISTS (SELECT 1 FROM Reservations r WHERE r.SlotID = ps.SlotID AND r.ReservationStatus IN ('Reserved','Completed')) THEN 'Reserved'
               ELSE 'Available'
           END = @status
      )
    ORDER BY z.ZoneID, ps.SlotCode;
END
GO

USE ParkingManagementDB;
GO

-- =====================================================
-- MIGRATION: Thêm cột Attachments vào bảng Incidents
-- Lưu dạng JSON array base64, tối đa 15 ảnh
-- =====================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Incidents') AND name = 'Attachments'
)
BEGIN
    ALTER TABLE Incidents
    ADD Attachments NVARCHAR(MAX) NULL;
    PRINT 'Đã thêm cột Attachments vào bảng Incidents.';
END
ELSE
BEGIN
    PRINT 'Cột Attachments đã tồn tại.';
END
GO

-- Kiểm tra
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Incidents' AND COLUMN_NAME = 'Attachments';
GO