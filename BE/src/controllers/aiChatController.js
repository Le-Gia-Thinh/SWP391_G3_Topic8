import * as aiChatService from '../services/aiChatService.js';

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
