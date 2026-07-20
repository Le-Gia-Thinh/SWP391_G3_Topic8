/**
 * FILE: aiChatController.js
 * MÔ TẢ: Controller xử lý tính năng AI Chat (trả lời tự động bằng AI).
 * Nhận danh sách tin nhắn từ client, gửi đến AI service để xử lý và trả về câu trả lời.
 */

import * as aiChatService from '../services/aiChatService.js'; // Service xử lý AI
/*
Duy
*/

/**
 * Xử lý yêu cầu chat AI.
 * Nhận mảng messages từ body, gửi cho AI service, trả về câu trả lời.
 * 
 * @route POST /api/ai/chat
 * @access Public
 */
export async function processChat(req, res, next) {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu 'messages' không hợp lệ."
      });
    }

    const reply = await aiChatService.processChat(messages);

    return res.json({
      success: true,
      data: {
        reply
      }
    });
  } catch (err) {
    next(err);
  }
}
