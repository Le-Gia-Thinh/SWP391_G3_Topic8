/**
 * FILE: aiChatController.js
 * MÔ TẢ: Controller xử lý tính năng AI Chat (Hỏi đáp tự động thông qua trí tuệ nhân tạo).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Tiếp nhận danh sách tin nhắn (Lịch sử hội thoại) gửi từ phía Frontend (React/Client).
 * 2. Kiểm tra tính hợp lệ của dữ liệu đầu vào (Validation dữ liệu).
 * 3. Chuyển tiếp (Delegate) sang tầng Service `aiChatService.js` để gọi API trí tuệ nhân tạo (OpenAI/Gemini).
 * 4. Trả kết quả câu phản hồi (reply) về cho người dùng dưới dạng JSON chuẩn.
 */

// Import tất cả các hàm từ file service 'aiChatService.js' dưới danh xưng nhóm 'aiChatService'
// LIÊN KẾT FILE: Liên kết tới 'BE/src/services/aiChatService.js' - nơi chứa logic kết nối API AI hoặc xử lý ngôn ngữ tự nhiên.
import * as aiChatService from '../services/aiChatService.js'; 

/**
 * HÀM: processChat
 * TÁC DỤNG: Xử lý yêu cầu nhắn tin hỏi đáp với AI Chatbot.
 * 
 * THUẬT NGỮ & CÚ PHÁP:
 * - `export async function`: Xuất hàm bất đồng bộ (async) cho phép sử dụng từ khóa `await` bên trong.
 * - `req` (Request): Đối tượng chứa toàn bộ dữ liệu Client gửi lên (Body, Header, Query,...).
 * - `res` (Response): Đối tượng dùng để phản hồi dữ liệu về cho Client.
 * - `next` (NextFunction): Hàm chuyển tiếp lỗi sang Middleware xử lý lỗi trung tâm (Centralized Error Handler).
 * 
 * @route POST /api/ai/chat
 * @access Public (Mọi người dùng đều có thể truy cập không bắt buộc đăng nhập)
 */
export async function processChat(req, res, next) {
  // Khối `try ... catch` dùng để bắt và xử lý lỗi ngoạn lệ (Exception Handling)
  try {
    // CÚ PHÁP DESTRUCTURING (Bóc tách dữ liệu): Lấy thuộc tính `messages` từ đối tượng `req.body` (Dữ liệu gửi trong body của HTTP POST).
    // `messages`: Mảng các câu thoại trước đó, dạng [{ role: 'user', content: '...' }]
    const { messages } = req.body;
    
    // RÀNG BUỘC DỮ LIỆU (Validation): 
    // - `!messages`: Kiểm tra xem biến messages có bị undefined/null/rỗng không.
    // - `!Array.isArray(messages)`: Kiểm tra xem biến messages có PHẢI là một Mảng (Array) hay không.
    if (!messages || !Array.isArray(messages)) {
      // `res.status(400)`: Trả về HTTP Status Code 400 (Bad Request - Lỗi do dữ liệu phía client gửi sai).
      // `.json(...)`: Đóng gói dữ liệu dạng JSON gửi về cho Client.
      // `return`: Dừng ngay lập tức việc thực thi hàm phía sau.
      return res.status(400).json({
        success: false, // Cờ báo hiệu yêu cầu thất bại
        message: "Dữ liệu 'messages' không hợp lệ." // Thông điệp báo lỗi chi tiết
      });
    }

    // THỰC THI CHỨC NĂNG CHÍNH (Business Logic Call):
    // `await`: Chờ hàm bất đồng bộ `aiChatService.processChat` chạy xong và trả về phản hồi từ AI.
    // LIÊN KẾT: Gọi sang hàm processChat() trong file `BE/src/services/aiChatService.js`.
    const reply = await aiChatService.processChat(messages);

    // TRẢ VỀ KẾT QUẢ THÀNH CÔNG:
    // `res.json(...)`: Mặc định trả về HTTP Status Code 200 (OK - Thành công).
    return res.json({
      success: true, // Cờ báo hiệu thành công
      data: {
        reply // Câu trả lời thu được từ AI Chatbot
      }
    });
  } catch (err) {
    // KHỐI CATCH BẮT LỖI:
    // `next(err)`: Chuyển đối tượng lỗi `err` sang cho Middleware xử lý lỗi tập trung ở `BE/src/middlewares/errorHandlerMiddleware.js` để trả về phản hồi lỗi 500 chuẩn.
    next(err);
  }
}

