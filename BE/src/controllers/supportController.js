/**
 * FILE: supportController.js
 * MÔ TẢ: Controller quản lý hệ thống Phiếu Hỗ trợ Kỹ thuật (Support Tickets) giữa Tài xế và Nhân viên hỗ trợ.
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Phía Tài xế (Driver): Tạo ticket mới, xem danh sách ticket cá nhân, đọc chi tiết cuộc trao đổi và gửi phản hồi.
 * 2. Phía Nhân viên (Staff/Admin): Tra cứu tất cả ticket (hỗ trợ lọc theo trạng thái Open/Pending/Resolved/Closed), gửi câu trả lời hỗ trợ và đóng/mở ticket.
 * 3. Kiểm soát quyền truy cập: Kiểm tra xem tài xế có đúng là chủ sở hữu của ticket đó hay không (Authorization Check).
 */

// Import tất cả hàm xử lý nghiệp vụ từ 'supportService.js' dưới đại diện nhóm `supportService`
// LIÊN KẾT FILE: `BE/src/services/supportService.js` - Chứa các thao tác SQL với các bảng SupportTickets và TicketReplies.
import * as supportService from '../services/supportService.js'; 

/**
 * HÀM 1: createTicket
 * TÁC DỤNG: Tài xế tạo phiếu yêu cầu hỗ trợ mới (Support Ticket).
 * 
 * @route POST /api/support/tickets
 * @access Driver Only (Chỉ dành cho Tài xế đã đăng nhập)
 */
export const createTicket = async (req, res) => {
  try {
    // CÚ PHÁP DESTRUCTURING: Lấy tiêu đề `subject` và nội dung `content` từ req.body
    const { subject, content } = req.body;
    // Lấy UserID tài xế từ Token JWT đã xác thực trong `req.user`
    const driverId = req.user.UserID;

    // VALIDATION: Kiểm tra không được để rỗng tiêu đề hoặc nội dung
    if (!subject || !content) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề và nội dung' });
    }

    // GỌI TẦNG SERVICE TẠO TICKET:
    // LIÊN KẾT: Gọi hàm `supportService.createTicket` trong `BE/src/services/supportService.js`.
    const ticket = await supportService.createTicket(driverId, subject, content);
    // Trả về kết quả HTTP Status Code 201 (Created - Đã tạo mới thành công)
    res.status(201).json({ success: true, data: ticket, message: 'Đã gửi yêu cầu hỗ trợ thành công' });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo ticket' });
  }
};

/**
 * HÀM 2: getDriverTickets
 * TÁC DỤNG: Lấy danh sách tất cả các Ticket hỗ trợ do tài xế hiện tại gửi.
 * 
 * @route GET /api/support/driver/tickets
 * @access Driver Only
 */
export const getDriverTickets = async (req, res) => {
  try {
    const driverId = req.user.UserID;
    // Lấy danh sách ticket từ service
    const tickets = await supportService.getDriverTickets(driverId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    console.error('Error fetching driver tickets:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách ticket' });
  }
};

/**
 * HÀM 3: getStaffTickets
 * TÁC DỤNG: Nhân viên hỗ trợ lấy danh sách các Ticket của toàn bộ hệ thống (có thể lọc theo status).
 * 
 * @route GET /api/support/staff/tickets?status=Open
 * @access Staff / Manager / Admin
 */
export const getStaffTickets = async (req, res) => {
  try {
    // Lấy tham số lọc `status` từ Query String (`?status=Open`)
    const { status } = req.query; // Ví dụ: Open, Pending, Resolved, Closed
    const tickets = await supportService.getStaffTickets(status);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    console.error('Error fetching staff tickets:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách ticket' });
  }
};

/**
 * HÀM 4: getTicketDetails
 * TÁC DỤNG: Lấy chi tiết thông tin một Ticket kèm theo toàn bộ lịch sử các câu phản hồi (Replies).
 * Kiểm tra quyền: Tài xế chỉ xem được ticket của mình, Nhân viên/Admin xem được tất cả ticket.
 * 
 * @route GET /api/support/tickets/:id
 * @access Driver / Staff / Admin
 */
export const getTicketDetails = async (req, res) => {
  try {
    const ticketId = req.params.id; // Lấy ID ticket từ URL Parameter
    const userId = req.user.UserID;   // ID người dùng đang truy cập
    const userRole = req.user.RoleName; // Vai trò người dùng (Driver/Staff/Manager/Admin)

    // Gọi Service kiểm tra và lấy chi tiết ticket
    const ticket = await supportService.getTicketDetails(ticketId, userId, userRole);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ticket' });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    // XỬ LÝ LỖI PHÂN QUYỀN (Authorization Error):
    // Nếu service ném lỗi 'Unauthorized' do tài xế cố tình đọc ticket của người khác
    if (error.message === 'Unauthorized') {
      // Trả về HTTP Status Code 403 (Forbidden - Bị cấm truy cập)
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập ticket này' });
    }
    console.error('Error fetching ticket details:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết ticket' });
  }
};

/**
 * HÀM 5: replyTicket
 * TÁC DỤNG: Gửi câu phản hồi (Reply) vào trong một Ticket hỗ trợ.
 * 
 * @route POST /api/support/tickets/:id/reply
 * @access Driver / Staff / Admin
 */
export const replyTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;  // Lấy ID ticket từ tham số URL
    const senderId = req.user.UserID; // ID người gửi phản hồi
    const { content } = req.body;     // Nội dung phản hồi từ req.body

    if (!content) {
      return res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống' });
    }

    // Gọi service lưu câu phản hồi mới vào bảng TicketReplies
    const reply = await supportService.replyTicket(ticketId, senderId, content);
    res.status(201).json({ success: true, data: reply, message: 'Đã gửi phản hồi' });
  } catch (error) {
    console.error('Error replying ticket:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi gửi phản hồi' });
  }
};

/**
 * HÀM 6: updateTicketStatus
 * TÁC DỤNG: Cập nhật trạng thái cho Ticket (Open, Pending, Resolved, Closed).
 * 
 * THUẬT NGỮ & CÚ PHÁP:
 * - `['Open', 'Pending', 'Resolved', 'Closed'].includes(status)`: Kiểm tra chuỗi trạng thái nằm trong danh sách Enum cho phép.
 * 
 * @route PUT /api/support/tickets/:id/status
 * @access Staff / Manager / Admin
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const ticketId = req.params.id; // Mã ID ticket cần cập nhật
    const { status } = req.body;    // Trạng thái mới (ví dụ: 'Resolved')

    // RÀNG BUỘC ENUM TRẠNG THÁI (Validation):
    if (!['Open', 'Pending', 'Resolved', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const success = await supportService.updateTicketStatus(ticketId, status);
    if (success) {
      res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } else {
      res.status(404).json({ success: false, message: 'Không tìm thấy ticket' });
    }
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái ticket' });
  }
};

