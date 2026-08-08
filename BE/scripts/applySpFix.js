import { getPool } from "../src/config/db.js";

async function run() {
  const pool = await getPool();
  try {
    console.log("Dropping existing procedures...");
    await pool.request().query(`
      IF OBJECT_ID('sp_CheckOutVehicle', 'P') IS NOT NULL DROP PROCEDURE sp_CheckOutVehicle;
      IF OBJECT_ID('sp_CheckOutWithSurcharge', 'P') IS NOT NULL DROP PROCEDURE sp_CheckOutWithSurcharge;
    `);

    console.log("Recreating sp_CheckOutVehicle...");
    await pool.request().query(`
CREATE PROCEDURE sp_CheckOutVehicle
    @SessionID INT, @PaymentMethod NVARCHAR(50),
    @GateOutID INT = NULL, @GateOut NVARCHAR(50) = NULL,
    @OverrideFee DECIMAL(10,2) = NULL,
    @OverrideNote NVARCHAR(MAX) = NULL
AS BEGIN
    SET NOCOUNT ON;
    DECLARE @EntryTime DATETIME, @ExitTime DATETIME, @VehicleTypeID INT, @Fee DECIMAL(10,2), @Breakdown NVARCHAR(MAX);
    SELECT @EntryTime=EntryTime,@VehicleTypeID=VehicleTypeID FROM ParkingSessions WHERE SessionID=@SessionID AND SessionStatus='Active';
    IF @EntryTime IS NULL BEGIN RAISERROR('Session not found or already completed.',16,1); RETURN; END
    SET @ExitTime=GETDATE();
    IF @GateOut IS NULL AND @GateOutID IS NOT NULL
        SELECT @GateOut = GateName FROM Gates WHERE GateID = @GateOutID;

    IF @OverrideFee IS NOT NULL
    BEGIN
        SET @Fee = @OverrideFee;
        SET @Breakdown = ISNULL(@OverrideNote, N'{"type":"override","note":"Fee overridden by application"}');
    END
    ELSE
    BEGIN
        EXEC sp_CalcParkingFeeV2 @VehicleTypeID=@VehicleTypeID,@EntryTime=@EntryTime,@ExitTime=@ExitTime,@Fee=@Fee OUTPUT,@Breakdown=@Breakdown OUTPUT;
    END

    -- TÍNH PHÍ PHẠT ĐỖ QUÁ GIỜ (OVERTIME PENALTY)
    DECLARE @ReservationEndTime DATETIME = NULL;
    DECLARE @DriverID INT, @SlotID INT, @BookingStartTime DATETIME;
    SELECT @DriverID=DriverID, @SlotID=SlotID, @BookingStartTime=BookingStartTime FROM ParkingSessions WHERE SessionID=@SessionID;
    
    IF @BookingStartTime IS NOT NULL
    BEGIN
        SELECT TOP 1 @ReservationEndTime = EndTime 
        FROM Reservations 
        WHERE DriverID = @DriverID AND SlotID = @SlotID AND StartTime = @BookingStartTime AND ReservationStatus = 'Completed'
        ORDER BY StartTime DESC;
    END

    DECLARE @OvertimePenalty DECIMAL(10,2) = 0;
    IF @ReservationEndTime IS NOT NULL AND @ExitTime > @ReservationEndTime
    BEGIN
        DECLARE @OvertimeH INT = CEILING(DATEDIFF(MINUTE, @ReservationEndTime, @ExitTime) / 60.0);
        IF @OvertimeH > 0
        BEGIN
            IF @VehicleTypeID = 1 SET @OvertimePenalty = 10000.00 + (@OvertimeH * 5000.00);
            ELSE IF @VehicleTypeID = 2 SET @OvertimePenalty = 50000.00 + (@OvertimeH * 20000.00);
            ELSE IF @VehicleTypeID = 3 SET @OvertimePenalty = 100000.00 + (@OvertimeH * 40000.00);
            
            SET @Fee = @Fee + @OvertimePenalty;
            IF @Breakdown IS NULL OR @Breakdown = N'[]' OR @Breakdown = N''
                SET @Breakdown = CONCAT('[{"type":"overtime_penalty","amount":', CAST(@OvertimePenalty AS NVARCHAR(20)), ',"hours":', CAST(@OvertimeH AS NVARCHAR(10)), '}]');
            ELSE
                SET @Breakdown = REPLACE(@Breakdown, ']', CONCAT(',{"type":"overtime_penalty","amount":', CAST(@OvertimePenalty AS NVARCHAR(20)), ',"hours":', CAST(@OvertimeH AS NVARCHAR(10)), '}]'));
        END
    END
    -- HẾT TÍNH PHÍ PHẠT

    UPDATE ParkingSessions SET ExitTime=@ExitTime, SessionStatus='Completed', GateOutID=@GateOutID, GateOut=@GateOut WHERE SessionID=@SessionID;
    UPDATE Payments SET Amount=@Fee,PaymentMethod=@PaymentMethod,PaymentTime=@ExitTime,PaymentStatus='Completed',PaymentNote=@Breakdown WHERE SessionID=@SessionID;
    SELECT @Fee AS FinalFee,@Breakdown AS FeeBreakdown;
END
    `);

    console.log("Recreating sp_CheckOutWithSurcharge...");
    await pool.request().query(`
CREATE PROCEDURE sp_CheckOutWithSurcharge
    @SessionID INT, @PaymentMethod NVARCHAR(50),
    @GateOutID INT = NULL, @GateOut NVARCHAR(50) = NULL,
    @OverrideFee DECIMAL(10,2) = NULL,
    @OverrideNote NVARCHAR(MAX) = NULL
AS BEGIN
    SET NOCOUNT ON; BEGIN TRANSACTION;
    DECLARE @EntryTime DATETIME, @ExitTime DATETIME=GETDATE(), @VehicleTypeID INT;
    DECLARE @FinalFee DECIMAL(10,2), @Breakdown NVARCHAR(MAX), @PrepaidAmount DECIMAL(10,2)=0, @PayStatus NVARCHAR(20);
    SELECT @EntryTime=EntryTime,@VehicleTypeID=VehicleTypeID FROM ParkingSessions WHERE SessionID=@SessionID AND SessionStatus='Active';
    IF @EntryTime IS NULL BEGIN ROLLBACK; RAISERROR('Session không tồn tại hoặc đã checkout.',16,1); RETURN; END
    IF @GateOut IS NULL AND @GateOutID IS NOT NULL
        SELECT @GateOut = GateName FROM Gates WHERE GateID = @GateOutID;

    IF @OverrideFee IS NOT NULL
    BEGIN
        SET @FinalFee = @OverrideFee;
        SET @Breakdown = ISNULL(@OverrideNote, N'{"type":"override","note":"Fee overridden by application"}');
    END
    ELSE
    BEGIN
        EXEC sp_CalcParkingFeeV2 @VehicleTypeID=@VehicleTypeID,@EntryTime=@EntryTime,@ExitTime=@ExitTime,@Fee=@FinalFee OUTPUT,@Breakdown=@Breakdown OUTPUT;
    END

    -- TÍNH PHÍ PHẠT ĐỖ QUÁ GIỜ (OVERTIME PENALTY)
    DECLARE @ReservationEndTime DATETIME = NULL;
    DECLARE @DriverID INT, @SlotID INT, @BookingStartTime DATETIME;
    SELECT @DriverID=DriverID, @SlotID=SlotID, @BookingStartTime=BookingStartTime FROM ParkingSessions WHERE SessionID=@SessionID;
    
    IF @BookingStartTime IS NOT NULL
    BEGIN
        SELECT TOP 1 @ReservationEndTime = EndTime 
        FROM Reservations 
        WHERE DriverID = @DriverID AND SlotID = @SlotID AND StartTime = @BookingStartTime AND ReservationStatus = 'Completed'
        ORDER BY StartTime DESC;
    END

    DECLARE @OvertimePenalty DECIMAL(10,2) = 0;
    IF @ReservationEndTime IS NOT NULL AND @ExitTime > @ReservationEndTime
    BEGIN
        DECLARE @OvertimeH INT = CEILING(DATEDIFF(MINUTE, @ReservationEndTime, @ExitTime) / 60.0);
        IF @OvertimeH > 0
        BEGIN
            IF @VehicleTypeID = 1 SET @OvertimePenalty = 10000.00 + (@OvertimeH * 5000.00);
            ELSE IF @VehicleTypeID = 2 SET @OvertimePenalty = 50000.00 + (@OvertimeH * 20000.00);
            ELSE IF @VehicleTypeID = 3 SET @OvertimePenalty = 100000.00 + (@OvertimeH * 40000.00);
            
            SET @FinalFee = @FinalFee + @OvertimePenalty;
            IF @Breakdown IS NULL OR @Breakdown = N'[]' OR @Breakdown = N''
                SET @Breakdown = CONCAT('[{"type":"overtime_penalty","amount":', CAST(@OvertimePenalty AS NVARCHAR(20)), ',"hours":', CAST(@OvertimeH AS NVARCHAR(10)), '}]');
            ELSE
                SET @Breakdown = REPLACE(@Breakdown, ']', CONCAT(',{"type":"overtime_penalty","amount":', CAST(@OvertimePenalty AS NVARCHAR(20)), ',"hours":', CAST(@OvertimeH AS NVARCHAR(10)), '}]'));
        END
    END
    -- HẾT TÍNH PHÍ PHẠT

    SELECT @PrepaidAmount=ISNULL(PrepaidAmount,0),@PayStatus=PaymentStatus FROM Payments WHERE SessionID=@SessionID;
    DECLARE @Surcharge DECIMAL(10,2)=@FinalFee-@PrepaidAmount; IF @Surcharge<0 SET @Surcharge=0;
    UPDATE ParkingSessions SET ExitTime=@ExitTime, SessionStatus='Completed', GateOutID=@GateOutID, GateOut=@GateOut WHERE SessionID=@SessionID;
    IF @PayStatus='Prepaid' BEGIN
        IF @Surcharge>0 UPDATE Payments SET FinalAmount=@FinalFee,SurchargeAmount=@Surcharge,SurchargeStatus='Pending',PaymentNote=@Breakdown WHERE SessionID=@SessionID;
        ELSE UPDATE Payments SET FinalAmount=@FinalFee,SurchargeAmount=0,SurchargeStatus='None',PaymentStatus='Completed',PaymentMethod='Banking',PaymentNote=@Breakdown WHERE SessionID=@SessionID;
    END ELSE UPDATE Payments SET Amount=@FinalFee,FinalAmount=@FinalFee,SurchargeAmount=0,SurchargeStatus='None',PaymentMethod=@PaymentMethod,PaymentTime=@ExitTime,PaymentStatus='Completed',PaymentNote=@Breakdown WHERE SessionID=@SessionID;
    COMMIT;
    SELECT @SessionID AS SessionID,@FinalFee AS FinalFee,@Surcharge AS SurchargeAmount,@Breakdown AS FeeBreakdown;
END
    `);

    console.log("Procedures updated successfully inside SQL Server database!");
    process.exit(0);
  } catch (err) {
    console.error("Failed to update database:", err);
    process.exit(1);
  }
}

run();
