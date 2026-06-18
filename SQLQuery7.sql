USE ParkingManagementDB;
GO
DECLARE @sql NVARCHAR(MAX) = N'';
SELECT @sql = @sql + N'ALTER TABLE Payments DROP CONSTRAINT ' + QUOTENAME(cc.name) + N';' + CHAR(10)
FROM sys.check_constraints cc
WHERE cc.parent_object_id = OBJECT_ID('Payments')
  AND cc.definition LIKE '%PaymentStatus%';
IF @sql <> N'' EXEC sp_executesql @sql;
GO
ALTER TABLE Payments
ADD CONSTRAINT CK_Payments_Status
CHECK (PaymentStatus IN ('Pending','Prepaid','Completed','Failed','Cancelled'));
GO
-- Vá row đang kẹt (SessionID 4007 đã trả nhưng kẹt Pending)
UPDATE Payments
SET PaymentStatus='Prepaid', PrepaidAmount=Amount, PrepaidAt=GETDATE(), PaymentTime=GETDATE()
WHERE SessionID=4007 AND PaymentStatus='Pending';
GO