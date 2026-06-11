CREATE OR ALTER PROCEDURE sp_SyncParkingSlotStatuses
AS
BEGIN
  SET NOCOUNT ON;

  -- 1. Chuyển booking quá hạn sang Expired
  UPDATE Reservations
  SET ReservationStatus = 'Expired'
  WHERE ReservationStatus = 'Reserved'
    AND EndTime < GETDATE();

  -- 2. Đồng bộ lại trạng thái slot
  UPDATE ps
  SET ps.SlotStatus =
    CASE
      WHEN ps.SlotStatus IN ('Maintenance', 'Blocked') THEN ps.SlotStatus

      WHEN EXISTS (
        SELECT 1
        FROM ParkingSessions s
        WHERE s.SlotID = ps.SlotID
          AND s.SessionStatus = 'Active'
          AND s.ExitTime IS NULL
      ) THEN 'Occupied'

      WHEN EXISTS (
        SELECT 1
        FROM Reservations r
        WHERE r.SlotID = ps.SlotID
          AND r.ReservationStatus = 'Reserved'
          AND r.EndTime >= GETDATE()
      ) THEN 'Reserved'

      ELSE 'Available'
    END
  FROM ParkingSlots ps
  WHERE ps.SlotStatus IN ('Available', 'Occupied', 'Reserved');
END;
GO