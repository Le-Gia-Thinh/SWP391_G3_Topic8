import { getPool } from '../config/db.js';

export const createTicket = async (driverId, subject, content) => {
  const pool = await getPool();
  const request = pool.request();
  
  request.input('DriverID', driverId);
  request.input('Subject', subject);
  request.input('Content', content);

  const result = await request.query(`
    INSERT INTO SupportTickets (DriverID, Subject, Content, Status, CreatedAt, UpdatedAt)
    OUTPUT INSERTED.*
    VALUES (@DriverID, @Subject, @Content, 'Open', GETDATE(), GETDATE())
  `);
  
  return result.recordset[0];
};

export const getDriverTickets = async (driverId) => {
  const pool = await getPool();
  const request = pool.request();
  
  request.input('DriverID', driverId);
  
  const result = await request.query(`
    SELECT t.*, 
      (SELECT COUNT(*) FROM TicketReplies r WHERE r.TicketID = t.TicketID) as ReplyCount
    FROM SupportTickets t
    WHERE t.DriverID = @DriverID
    ORDER BY t.UpdatedAt DESC
  `);
  
  return result.recordset;
};

export const getStaffTickets = async (statusFilter) => {
  const pool = await getPool();
  const request = pool.request();
  
  let query = `
    SELECT t.*, u.FullName as DriverName, u.PhoneNumber as DriverPhone,
      (SELECT COUNT(*) FROM TicketReplies r WHERE r.TicketID = t.TicketID) as ReplyCount
    FROM SupportTickets t
    JOIN Users u ON t.DriverID = u.UserID
  `;
  
  if (statusFilter && statusFilter !== 'All') {
    query += ` WHERE t.Status = @Status`;
    request.input('Status', statusFilter);
  }
  
  query += ` ORDER BY t.UpdatedAt DESC`;
  
  const result = await request.query(query);
  return result.recordset;
};

export const getTicketDetails = async (ticketId, userId, userRole) => {
  const pool = await getPool();
  const request = pool.request();
  
  request.input('TicketID', ticketId);
  
  // 1. Get ticket info
  const ticketResult = await request.query(`
    SELECT t.*, u.FullName as DriverName, u.PhoneNumber as DriverPhone
    FROM SupportTickets t
    JOIN Users u ON t.DriverID = u.UserID
    WHERE t.TicketID = @TicketID
  `);
  
  if (ticketResult.recordset.length === 0) return null;
  const ticket = ticketResult.recordset[0];
  
  // Security check: if Driver, they must own the ticket
  if (userRole === 'Driver' && ticket.DriverID !== userId) {
    throw new Error('Unauthorized');
  }
  
  // 2. Get replies
  const repliesResult = await request.query(`
    SELECT r.*, u.FullName as SenderName, role.RoleName as SenderRole
    FROM TicketReplies r
    JOIN Users u ON r.SenderID = u.UserID
    JOIN Roles role ON u.RoleID = role.RoleID
    WHERE r.TicketID = @TicketID
    ORDER BY r.CreatedAt ASC
  `);
  
  ticket.Replies = repliesResult.recordset;
  return ticket;
};

export const replyTicket = async (ticketId, senderId, content) => {
  const pool = await getPool();
  const request = pool.request();
  
  request.input('TicketID', ticketId);
  request.input('SenderID', senderId);
  request.input('Content', content);

  // Use a transaction to insert reply and update ticket UpdatedAt & Status
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    const txRequest = transaction.request();
    txRequest.input('TicketID', ticketId);
    txRequest.input('SenderID', senderId);
    txRequest.input('Content', content);

    // Insert reply
    const replyResult = await txRequest.query(`
      INSERT INTO TicketReplies (TicketID, SenderID, Content, CreatedAt)
      OUTPUT INSERTED.*
      VALUES (@TicketID, @SenderID, @Content, GETDATE())
    `);

    // Check sender role to update status
    const userRequest = transaction.request();
    userRequest.input('SenderID', senderId);
    const userResult = await userRequest.query(`
      SELECT r.RoleName 
      FROM Users u 
      JOIN Roles r ON u.RoleID = r.RoleID 
      WHERE u.UserID = @SenderID
    `);
    const roleName = userResult.recordset[0].RoleName;

    // If Staff replies, status becomes 'Pending' (waiting for driver)
    // If Driver replies, status becomes 'Open' (waiting for staff)
    const newStatus = (roleName === 'Driver') ? 'Open' : 'Pending';

    const updateRequest = transaction.request();
    updateRequest.input('TicketID', ticketId);
    updateRequest.input('NewStatus', newStatus);
    
    await updateRequest.query(`
      UPDATE SupportTickets 
      SET Status = @NewStatus, UpdatedAt = GETDATE()
      WHERE TicketID = @TicketID
    `);

    // Notify Driver if Staff replied
    if (roleName !== 'Driver') {
      const ticketReq = transaction.request();
      ticketReq.input('TicketID', ticketId);
      const tResult = await ticketReq.query(`SELECT DriverID, Subject FROM SupportTickets WHERE TicketID = @TicketID`);
      const driverId = tResult.recordset[0].DriverID;
      const subject = tResult.recordset[0].Subject;

      const notifReq = transaction.request();
      notifReq.input('DriverID', driverId);
      notifReq.input('Title', 'Có phản hồi mới từ hỗ trợ');
      notifReq.input('Message', `Nhân viên đã trả lời yêu cầu hỗ trợ: ${subject}`);
      notifReq.input('Type', 'system');
      notifReq.input('RefID', ticketId);

      await notifReq.query(`
        INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType)
        VALUES (@DriverID, @Title, @Message, @Type, @RefID, NULL)
      `);
    }

    await transaction.commit();
    return replyResult.recordset[0];
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

export const updateTicketStatus = async (ticketId, status) => {
  const pool = await getPool();
  const request = pool.request();
  
  request.input('TicketID', ticketId);
  request.input('Status', status);

  const result = await request.query(`
    UPDATE SupportTickets
    SET Status = @Status, UpdatedAt = GETDATE()
    OUTPUT INSERTED.DriverID, INSERTED.Subject
    WHERE TicketID = @TicketID
  `);
  
  if (result.recordset && result.recordset.length > 0 && (status === 'Closed' || status === 'Resolved')) {
    const { DriverID, Subject } = result.recordset[0];
    
    // Send Notification
    const notifReq = pool.request();
    notifReq.input('DriverID', DriverID);
    notifReq.input('Title', 'Cập nhật yêu cầu hỗ trợ');
    notifReq.input('Message', `Yêu cầu hỗ trợ "${Subject}" đã được chuyển sang trạng thái: ${status === 'Closed' ? 'Đã đóng' : 'Đã giải quyết'}`);
    notifReq.input('Type', 'system');
    notifReq.input('RefID', ticketId);

    await notifReq.query(`
      INSERT INTO Notifications (UserID, Title, Message, NotificationType, ReferenceID, ReferenceType)
      VALUES (@DriverID, @Title, @Message, @Type, @RefID, NULL)
    `);
  }
  
  return result.rowsAffected[0] > 0;
};
