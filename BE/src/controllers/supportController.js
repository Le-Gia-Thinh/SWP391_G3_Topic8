/**
 * FILE: supportController.js
 * MÔ TẢ: Controller xử lý hỗ trợ khách hàng (Support Tickets).
 * 
 * Chức năng:
 * - Driver: Tạo yêu cầu hỗ trợ (Ticket), Xem danh sách ticket của mình.
 * - Staff: Xem danh sách ticket của hệ thống, Xem chi tiết, Phản hồi (Reply) ticket, Cập nhật trạng thái ticket.
 */
/*
hieu
*/

import * as supportService from '../services/supportService.js'; // Service xử lý logic Support Tickets

export const createTicket = async (req, res) => {
  try {
    const { subject, content } = req.body;
    const driverId = req.user.UserID;

    if (!subject || !content) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề và nội dung' });
    }

    const ticket = await supportService.createTicket(driverId, subject, content);
    res.status(201).json({ success: true, data: ticket, message: 'Đã gửi yêu cầu hỗ trợ thành công' });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo ticket' });
  }
};

export const getDriverTickets = async (req, res) => {
  try {
    const driverId = req.user.UserID;
    const tickets = await supportService.getDriverTickets(driverId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    console.error('Error fetching driver tickets:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách ticket' });
  }
};

export const getStaffTickets = async (req, res) => {
  try {
    const { status } = req.query; // optional filter
    const tickets = await supportService.getStaffTickets(status);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    console.error('Error fetching staff tickets:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách ticket' });
  }
};

export const getTicketDetails = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const userId = req.user.UserID;
    const userRole = req.user.RoleName;

    const ticket = await supportService.getTicketDetails(ticketId, userId, userRole);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ticket' });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập ticket này' });
    }
    console.error('Error fetching ticket details:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết ticket' });
  }
};

export const replyTicket = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const senderId = req.user.UserID;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống' });
    }

    const reply = await supportService.replyTicket(ticketId, senderId, content);
    res.status(201).json({ success: true, data: reply, message: 'Đã gửi phản hồi' });
  } catch (error) {
    console.error('Error replying ticket:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi gửi phản hồi' });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const ticketId = req.params.id;
    const { status } = req.body;

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
