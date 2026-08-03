/**
 * FILE: supportService.js
 * MÔ TẢ: Service quản lý Trung tâm Hỗ trợ Khách hàng (Support Ticket Management).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Cho phép Tài xế gửi yêu cầu khiếu nại/hỗ trợ kỹ thuật (`createTicket`).
 * 2. Nhân viên Bảo vệ và Quản lý theo dõi, phản hồi qua lại (`replyTicket`) trong luồng giao tiếp tập trung.
 * 3. TỰ ĐỘNG CHUYỂN TRẠNG THÁI TICKET (State Machine):
 *    - Khi Tài xế trả lời ➔ Trạng thái chuyển thành `'Open'` (Chờ Nhân viên xử lý).
 *    - Khi Nhân viên trả lời ➔ Trạng thái chuyển thành `'Pending'` (Chờ Tài xế phản hồi) đồng thời phát thông báo Notification tự động tới Tài xế.
 * 4. Giao dịch SQL Transaction: Đảm bảo khi lưu phản hồi, cập nhật trạng thái ticket và bắn thông báo đều phải thành công đồng thời (`ACID Compliance`).
 * 
 * @module supportService
 */

import { getPool } from '../config/db.js';

/**
 * HÀM 1: createTicket
 * TÁC DỤNG: Tạo một Yêu cầu Hỗ trợ mới từ Tài xế.
 * 
 * @param {number} driverId - ID người dùng là Tài xế gửi ticket
 * @param {string} subject - Tiêu đề ticket
 * @param {string} content - Nội dung chi tiết vấn đề cần trợ giúp
 * @returns {Promise<Object>} Bản ghi ticket mới tạo từ lệnh `OUTPUT INSERTED.*`
 */
export const createTicket = async (driverId, subject, content) => {
  const pool = await getPool();
  const request = pool.request();
  
  request.input('DriverID', driverId);
  request.input('Subject', subject);
  request.input('Content', content);

  // OUTPUT INSERTED.*: Trả về trực tiếp bản ghi vừa được chèn vào SQL Server mà không cần SELECT lại
  const result = await request.query(`
    INSERT INTO SupportTickets (DriverID, Subject, Content, Status, CreatedAt, UpdatedAt)
    VALUES (@DriverID, @Subject, @Content, 'Open', GETDATE(), GETDATE());
    SELECT * FROM SupportTickets WHERE TicketID = SCOPE_IDENTITY();
  `);
  
  return result.recordset[0];
};

/**
 * HÀM 2: getDriverTickets
 * TÁC DỤNG: Lấy danh sách các ticket hỗ trợ do chính Tài xế đó khởi tạo.
 * 
 * @param {number} driverId - ID của tài xế
 * @returns {Promise<Array<Object>>} Mảng danh sách ticket kèm số lượng câu phản hồi (`ReplyCount`)
 */
export const getDriverTickets = async (driverId) => {
  const pool = await getPool();
  const request = pool.request();
  
  request.input('DriverID', driverId);
  
  // Subquery: (SELECT COUNT(*) FROM TicketReplies r WHERE r.TicketID = t.TicketID) tính tổng số phản hồi
  const result = await request.query(`
    SELECT t.*, 
      (SELECT COUNT(*) FROM TicketReplies r WHERE r.TicketID = t.TicketID) as ReplyCount
    FROM SupportTickets t
    WHERE t.DriverID = @DriverID
    ORDER BY t.UpdatedAt DESC
  `);
  
  return result.recordset;
};

/**
 * HÀM 3: getStaffTickets
 * TÁC DỤNG: Lấy danh sách toàn bộ ticket hỗ trợ dành cho Nhân viên/Quản lý theo dõi xử lý.
 * 
 * @param {string} statusFilter - Bộ lọc trạng thái ('Open', 'Pending', 'Closed', 'All')
 * @returns {Promise<Array<Object>>} Danh sách ticket kèm tên và số điện thoại tài xế
 */
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

/**
 * HÀM 4: getTicketDetails
 * TÁC DỤNG: Lấy thông tin chi tiết một ticket và toàn bộ lịch sử phản hồi hội thoại.
 * KỸ THUẬT BẢO MẬT: Kiểm tra quyền sở hữu (Ownership Check). Tài xế chỉ được xem ticket do chính mình tạo ra.
 * 
 * @param {number} ticketId - ID của Ticket
 * @param {number} userId - ID người dùng đang gọi API
 * @param {string} userRole - Role người dùng ('Driver', 'Staff', 'Manager', 'Admin')
 * @returns {Promise<Object|null>} Đối tượng ticket kèm mảng các câu phản hồi `Replies`
 */
export const getTicketDetails = async (ticketId, userId, userRole) => {
  const pool = await getPool();
  const request = pool.request();
  
  request.input('TicketID', ticketId);
  
  // 1. Truy vấn thông tin tiêu đề và người tạo Ticket
  const ticketResult = await request.query(`
    SELECT t.*, u.FullName as DriverName, u.PhoneNumber as DriverPhone
    FROM SupportTickets t
    JOIN Users u ON t.DriverID = u.UserID
    WHERE t.TicketID = @TicketID
  `);
  
  if (ticketResult.recordset.length === 0) return null;
  const ticket = ticketResult.recordset[0];
  
  // BẢO MẬT: Nếu là Tài xế và không phải người sở hữu Ticket này ➔ Báo lỗi Unauthorized ngay lập tức
  if (userRole === 'Driver' && ticket.DriverID !== userId) {
    throw new Error('Unauthorized');
  }
  
  // 2. Truy vấn danh sách lịch sử phản hồi hội thoại theo thứ tự thời gian tăng dần (ASC)
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

/**
 * HÀM 5: replyTicket
 * TÁC DỤNG: Thêm câu phản hồi vào Ticket và tự động cập nhật trạng thái luân chuyển xử lý.
 * KỸ THUẬT: Sử dụng SQL Transaction để đảm bảo tính vẹn toàn dữ liệu.
 * 
 * @param {number} ticketId - ID Ticket
 * @param {number} senderId - ID người gửi câu trả lời
 * @param {string} content - Nội dung trả lời
 * @returns {Promise<Object>} Bản ghi câu trả lời vừa được chèn
 */
export const replyTicket = async (ticketId, senderId, content) => {
  const pool = await getPool();

  // MỞ GIAO DỊCH SQL TRANSACTION:
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    // 1. Chèn câu phản hồi mới vào bảng TicketReplies
    const txRequest = transaction.request();
    txRequest.input('TicketID', ticketId);
    txRequest.input('SenderID', senderId);
    txRequest.input('Content', content);

    const replyResult = await txRequest.query(`
      INSERT INTO TicketReplies (TicketID, SenderID, Content, CreatedAt)
      VALUES (@TicketID, @SenderID, @Content, GETDATE());
      SELECT * FROM TicketReplies WHERE ReplyID = SCOPE_IDENTITY();
    `);

    // 2. Kiểm tra Role người gửi để cập nhật trạng thái Ticket phù hợp
    const userRequest = transaction.request();
    userRequest.input('SenderID', senderId);
    const userResult = await userRequest.query(`
      SELECT r.RoleName 
      FROM Users u 
      JOIN Roles r ON u.RoleID = r.RoleID 
      WHERE u.UserID = @SenderID
    `);
    const roleName = userResult.recordset[0].RoleName;

    // LOGIC CHUYỂN TRẠNG THÁI:
    // - NẾU TÀI XẾ TRẢ LỜI ➔ Trạng thái là 'Open' (Đang mở chờ nhân viên kiểm tra)
    // - NẾU NHÂN VIÊN TRẢ LỜI ➔ Trạng thái là 'Pending' (Chờ tài xế xác nhận lại)
    const newStatus = (roleName === 'Driver') ? 'Open' : 'Pending';

    const updateRequest = transaction.request();
    updateRequest.input('TicketID', ticketId);
    updateRequest.input('NewStatus', newStatus);
    
    await updateRequest.query(`
      UPDATE SupportTickets 
      SET Status = @NewStatus, UpdatedAt = GETDATE()
      WHERE TicketID = @TicketID
    `);

    // 3. Nếu là Nhân viên trả lời ➔ Tự động tạo một Thông báo (Notification) đẩy tới Tài xế
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

    // XÁC NHẬN GIAO DỊCH THÀNH CÔNG (Commit Transaction)
    await transaction.commit();
    return replyResult.recordset[0];
  } catch (err) {
    // HỦY GIAO DỊCH NẾU GẶP LỖI (Rollback Transaction)
    await transaction.rollback();
    throw err;
  }
};

/**
 * HÀM 6: updateTicketStatus
 * TÁC DỤNG: Thay đổi trạng thái của Ticket (vd: Đóng ticket 'Closed' hoặc Đã giải quyết 'Resolved').
 * 
 * @param {number} ticketId - ID Ticket
 * @param {string} status - Trạng thái mới
 * @returns {Promise<boolean>} True nếu cập nhật thành công
 */
export const updateTicketStatus = async (ticketId, status) => {
  const pool = await getPool();
  const request = pool.request();
  
  request.input('TicketID', ticketId);
  request.input('Status', status);

  // Cập nhật trạng thái và dùng `OUTPUT` lấy thông tin DriverID để phát thông báo
  const result = await request.query(`
    UPDATE SupportTickets
    SET Status = @Status, UpdatedAt = GETDATE()
    WHERE TicketID = @TicketID;
    SELECT DriverID, Subject FROM SupportTickets WHERE TicketID = @TicketID;
  `);
  
  // Nếu chuyển sang trạng thái Closed/Resolved ➔ Bắn thông báo thông báo cho Tài xế biết
  if (result.recordset && result.recordset.length > 0 && (status === 'Closed' || status === 'Resolved')) {
    const { DriverID, Subject } = result.recordset[0];
    
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

