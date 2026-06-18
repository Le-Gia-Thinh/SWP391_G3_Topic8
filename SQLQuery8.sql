USE ParkingManagementDB;
GO

-- =================================================================
-- SQLQuery8: Bổ sung cột còn thiếu & Mock data cho chức năng mới
-- =================================================================

-- 1. Bổ sung cột Tags cho bảng ServiceRatings (Dùng trong StaffFeedback)
IF COL_LENGTH('ServiceRatings', 'Tags') IS NULL
BEGIN
    ALTER TABLE ServiceRatings 
    ADD Tags NVARCHAR(500) NULL;
    
    PRINT 'Added column Tags to ServiceRatings';
END
ELSE
BEGIN
    PRINT 'Column Tags already exists in ServiceRatings';
END
GO

-- 2. Mock data cho ServiceRatings (Staff Feedback)
IF NOT EXISTS (SELECT 1 FROM ServiceRatings)
BEGIN
    -- Lấy danh sách Session để mock (ưu tiên Completed)
    INSERT INTO ServiceRatings (SessionID, DriverID, Rating, Comment, Tags, CreatedAt)
    SELECT TOP 15
        SessionID, 
        DriverID, 
        -- Random Rating từ 3 đến 5
        CASE WHEN SessionID % 3 = 0 THEN 3 
             WHEN SessionID % 2 = 0 THEN 4 
             ELSE 5 END AS Rating,
        -- Random Comment
        CASE WHEN SessionID % 3 = 0 THEN N'Bãi đỗ xe hơi chật, khó quay đầu.' 
             WHEN SessionID % 2 = 0 THEN N'Dịch vụ tốt, nhân viên bảo vệ nhiệt tình.' 
             ELSE N'Rất tuyệt vời, sẽ tiếp tục sử dụng dịch vụ!' END AS Comment,
        -- Random Tags
        CASE WHEN SessionID % 3 = 0 THEN N'["Không gian", "Giá cả"]' 
             WHEN SessionID % 2 = 0 THEN N'["Nhân viên", "An toàn"]' 
             ELSE N'["Sạch sẽ", "Tiện lợi"]' END AS Tags,
        DATEADD(hour, - (SessionID % 100), GETDATE()) AS CreatedAt
    FROM ParkingSessions 
    WHERE DriverID IS NOT NULL
    ORDER BY SessionID DESC;
      
    PRINT 'Inserted mock data for ServiceRatings';
END
ELSE
BEGIN
    PRINT 'Mock data for ServiceRatings already exists';
END
GO

-- 3. Mock data cho SupportTickets
IF NOT EXISTS (SELECT 1 FROM SupportTickets)
BEGIN
    DECLARE @DriverID INT;
    -- Lấy 1 Driver bất kỳ để mock
    SELECT TOP 1 @DriverID = UserID FROM Users WHERE RoleID = (SELECT RoleID FROM Roles WHERE RoleName = 'Driver'); 
    
    -- Nếu không có tìm theo RoleID cứng thì lấy đại UserID
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
BEGIN
    PRINT 'Mock data for SupportTickets already exists';
END
GO

-- 4. Bổ sung cột IsDefault cho bảng DriverVehicles
IF COL_LENGTH('DriverVehicles', 'IsDefault') IS NULL
BEGIN
    ALTER TABLE DriverVehicles 
    ADD IsDefault BIT NOT NULL DEFAULT 0;
    
    PRINT 'Added column IsDefault to DriverVehicles';
END
ELSE
BEGIN
    PRINT 'Column IsDefault already exists in DriverVehicles';
END
GO

-- 5. Bổ sung cột Attachments cho bảng Incidents
IF COL_LENGTH('Incidents', 'Attachments') IS NULL
BEGIN
    ALTER TABLE Incidents 
    ADD Attachments NVARCHAR(MAX) NULL;
    
    PRINT 'Added column Attachments to Incidents';
END
ELSE
BEGIN
    PRINT 'Column Attachments already exists in Incidents';
END
GO

-- 6. Sửa DriverID thành cho phép NULL ở bảng ParkingSessions (Hỗ trợ khách vãng lai)
IF COLUMNPROPERTY(OBJECT_ID('ParkingSessions'), 'DriverID', 'AllowsNull') = 0
BEGIN
    ALTER TABLE ParkingSessions ALTER COLUMN DriverID INT NULL;
    PRINT 'Altered DriverID in ParkingSessions to allow NULL';
END
GO

-- 7. Sửa DriverID thành cho phép NULL ở bảng Incidents (Hỗ trợ sự cố của khách vãng lai)
IF COLUMNPROPERTY(OBJECT_ID('Incidents'), 'DriverID', 'AllowsNull') = 0
BEGIN
    ALTER TABLE Incidents ALTER COLUMN DriverID INT NULL;
    PRINT 'Altered DriverID in Incidents to allow NULL';
END
GO
