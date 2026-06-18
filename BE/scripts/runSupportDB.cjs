const { getPool } = require('../src/config/db');

async function run() {
  try {
    const pool = await getPool();
    const query = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SupportTickets' AND xtype='U')
      BEGIN
        CREATE TABLE SupportTickets (
          TicketID INT IDENTITY(1,1) PRIMARY KEY,
          DriverID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
          Subject NVARCHAR(200) NOT NULL,
          Content NVARCHAR(MAX) NOT NULL,
          Status VARCHAR(20) DEFAULT 'Open' CHECK (Status IN ('Open', 'Pending', 'Resolved', 'Closed')),
          CreatedAt DATETIME DEFAULT GETDATE(),
          UpdatedAt DATETIME DEFAULT GETDATE()
        );
        PRINT 'Created SupportTickets table.';
      END
      ELSE
      BEGIN
        PRINT 'SupportTickets table already exists.';
      END

      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TicketReplies' AND xtype='U')
      BEGIN
        CREATE TABLE TicketReplies (
          ReplyID INT IDENTITY(1,1) PRIMARY KEY,
          TicketID INT NOT NULL FOREIGN KEY REFERENCES SupportTickets(TicketID),
          SenderID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
          Content NVARCHAR(MAX) NOT NULL,
          CreatedAt DATETIME DEFAULT GETDATE()
        );
        PRINT 'Created TicketReplies table.';
      END
      ELSE
      BEGIN
        PRINT 'TicketReplies table already exists.';
      END
    `;
    await pool.request().query(query);
    console.log('Database updated successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error updating database:', err);
    process.exit(1);
  }
}

run();
