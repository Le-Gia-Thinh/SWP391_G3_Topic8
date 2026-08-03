/**
 * FILE: aiChatService.js
 * MÔ TẢ: Service tích hợp Trí tuệ nhân tạo AI (Google Gemini 2.5 Flash SDK).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Đóng vai trò là Trợ lý AI ảo tư vấn giải đáp thắc mắc dịch vụ bãi đỗ xe cho người dùng ứng dụng.
 * 2. `SystemInstruction`: Cấu hình nguyên tắc ứng xử cho AI (Ngắn gọn, lịch sự, trả lời đúng phạm vi bãi xe).
 * 3. Chế độ dự phòng (Fallback / Demo Mode): Nếu chưa cài đặt `GEMINI_API_KEY` trong file `.env`, hệ thống tự động trả lời bằng các mẫu câu phản hồi cố định mà không gây crash ứng dụng.
 * 4. Xử lý giới hạn tần suất gọi API (HTTP 429 Quota Exceeded) an toàn.
 * 
 * @module aiChatService
 */

// Import SDK chính thức của Google Generative AI từ gói '@google/genai'
import { GoogleGenAI } from '@google/genai';

// SYSTEM INSTRUCTION: Lệnh hệ thống định hình tính cách và phạm vi kiến thức cho mô hình AI
const systemInstruction = `
Bạn là AI trợ lý thông minh của hệ thống quản lý bãi đỗ xe SWP391.
Nhiệm vụ của bạn là hỗ trợ người dùng (tài xế, nhân viên, quản lý) giải đáp thắc mắc về các dịch vụ đỗ xe, cách sử dụng hệ thống, quy định bãi đỗ, và giá cả.
Hãy trả lời ngắn gọn, lịch sự, thân thiện và bằng tiếng Việt.
- Nếu được hỏi về giá đỗ xe, hãy trả lời chung chung rằng hệ thống có nhiều mức giá theo từng loại xe và số giờ đỗ, yêu cầu người dùng xem bảng giá trên giao diện Đặt chỗ.
- Nếu được hỏi về cách đặt chỗ, hướng dẫn họ vào mục "Đặt chỗ", chọn xe, chọn thời gian và vị trí rồi xác nhận.
- Nếu không biết câu trả lời, hãy hướng dẫn họ liên hệ mục "Hỗ trợ" hoặc tạo "Ticket" để được nhân viên giúp đỡ.
`;

/**
 * HÀM 1: processChat
 * TÁC DỤNG: Nhận lịch sử tin nhắn trò chuyện từ Frontend và gửi tới Google Gemini API để tạo phản hồi tự nhiên.
 * 
 * @param {Array<Object>} messages - Mảng lịch sử tin nhắn [{ role: 'user'|'assistant', content: '...' }]
 * @returns {Promise<string>} Chuỗi văn bản câu trả lời sinh ra từ AI
 */
export async function processChat(messages) {
  // BƯỚC 1: KIỂM TRA CHẾ ĐỘ DEMO (KHI THIẾU API KEY)
  if (!process.env.GEMINI_API_KEY) {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    
    // Trả lời theo từ khóa khớp sẵn nếu chưa có API Key thực tế
    if (lastMessage.includes("xin chào") || lastMessage.includes("hello") || lastMessage.includes("hi")) {
        return "(Chế độ Demo - Chưa có API Key)\nChào bạn! Đây là tính năng trợ lý AI của SWP391. Hiện tại tôi đang chạy ở chế độ mô phỏng vì chưa được cấu hình GEMINI_API_KEY. Vui lòng thêm API Key vào file .env để tôi trở nên thông minh thật sự nhé!";
    } else if (lastMessage.includes("giá") || lastMessage.includes("tiền")) {
        return "(Chế độ Demo)\nGiá đỗ xe phụ thuộc vào loại xe và thời gian đỗ. Bạn có thể xem chi tiết ở mục Bảng Giá hoặc trong lúc tiến hành Đặt Chỗ.";
    } else {
        return "(Chế độ Demo)\nXin lỗi, vì chưa có GEMINI_API_KEY nên tôi chỉ có thể trả lời các mẫu câu cố định. Bạn hãy làm theo hướng dẫn ở file .env để kích hoạt AI thực sự nhé!";
    }
  }

  try {
    // BƯỚC 2: CHUẨN HÓA API KEY VÀ KHỞI TẠO SDK GEMINI
    const realKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace('DAU_', '') : '';
    const ai = new GoogleGenAI({ apiKey: realKey });

    // Ánh xạ định dạng tin nhắn từ Frontend về đúng chuẩn API Gemini đòi hỏi (role: 'user' hoặc 'model')
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // BƯỚC 3: GỌI MÔ HÌNH GEMINI 2.5 FLASH ĐỂ SINH NỘI DUNG
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Phiên bản mô hình tốc độ cao tối ưu cho Chatbot
      contents: contents,
      config: {
        systemInstruction: systemInstruction, // Đính kèm chỉ thị hệ thống
        temperature: 0.7,                    // Độ sáng tạo của câu trả lời (0.7 cân bằng giữa chính xác và tự nhiên)
      }
    });

    // Trả về văn bản phản hồi từ AI
    return response.text;
  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
    // Xử lý lỗi chạm ngưỡng giới hạn (Rate Limit / Quota Exceeded)
    if (error.status === 429 || error.message?.includes('429')) {
      return "Xin lỗi, API Key của hệ thống đã vượt quá giới hạn yêu cầu (Quota Exceeded). Vui lòng cấu hình API Key mới hoặc thử lại sau vài phút.";
    }
    return "Xin lỗi, đã xảy ra lỗi khi kết nối với máy chủ AI. Vui lòng thử lại sau.";
  }
}

