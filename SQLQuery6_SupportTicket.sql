-- Bảng 1: Lưu thông tin Yêu cầu hỗ trợ (SupportTickets)
CREATE TABLE SupportTickets (
    TicketID INT IDENTITY(1,1) PRIMARY KEY,
    DriverID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID), -- Ai là người gửi
    Subject NVARCHAR(200) NOT NULL, -- Tiêu đề yêu cầu
    Content NVARCHAR(MAX) NOT NULL, -- Nội dung vấn đề gặp phải
    Status VARCHAR(20) DEFAULT 'Open' 
          CHECK (Status IN ('Open', 'Pending', 'Resolved', 'Closed')), -- Trạng thái
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Bảng 2: Lưu các tin nhắn phản hồi qua lại (TicketReplies)
CREATE TABLE TicketReplies (
    ReplyID INT IDENTITY(1,1) PRIMARY KEY,
    TicketID INT NOT NULL FOREIGN KEY REFERENCES SupportTickets(TicketID),
    SenderID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID), -- Ai là người nhắn (có thể là Staff hoặc Driver)
    Content NVARCHAR(MAX) NOT NULL, -- Nội dung tin nhắn
    CreatedAt DATETIME DEFAULT GETDATE()
);