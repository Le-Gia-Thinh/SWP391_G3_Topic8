/**
 * FILE: aiChatService.js
 * MÔ TẢ: Service kết nối với Google Gemini API để hỗ trợ người dùng chat tự động.
 * Trả lời các câu hỏi về dịch vụ bãi đỗ xe, bảng giá, hướng dẫn sử dụng.
 */

import { GoogleGenAI } from '@google/genai';
const systemInstruction = `
Bạn là AI trợ lý thông minh của hệ thống quản lý bãi đỗ xe SWP391.
Nhiệm vụ của bạn là hỗ trợ người dùng (tài xế, nhân viên, quản lý) giải đáp thắc mắc về các dịch vụ đỗ xe, cách sử dụng hệ thống, quy định bãi đỗ, và giá cả.
Hãy trả lời ngắn gọn, lịch sự, thân thiện và bằng tiếng Việt.
- Nếu được hỏi về giá đỗ xe, hãy trả lời chung chung rằng hệ thống có nhiều mức giá theo từng loại xe và số giờ đỗ, yêu cầu người dùng xem bảng giá trên giao diện Đặt chỗ.
- Nếu được hỏi về cách đặt chỗ, hướng dẫn họ vào mục "Đặt chỗ", chọn xe, chọn thời gian và vị trí rồi xác nhận.
- Nếu không biết câu trả lời, hãy hướng dẫn họ liên hệ mục "Hỗ trợ" hoặc tạo "Ticket" để được nhân viên giúp đỡ.
`;

export async function processChat(messages) {
  if (!process.env.GEMINI_API_KEY) {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
    
    // Demo Mode Response
    if (lastMessage.includes("xin chào") || lastMessage.includes("hello") || lastMessage.includes("hi")) {
        return "(Chế độ Demo - Chưa có API Key)\nChào bạn! Đây là tính năng trợ lý AI của SWP391. Hiện tại tôi đang chạy ở chế độ mô phỏng vì chưa được cấu hình GEMINI_API_KEY. Vui lòng thêm API Key vào file .env để tôi trở nên thông minh thật sự nhé!";
    } else if (lastMessage.includes("giá") || lastMessage.includes("tiền")) {
        return "(Chế độ Demo)\nGiá đỗ xe phụ thuộc vào loại xe và thời gian đỗ. Bạn có thể xem chi tiết ở mục Bảng Giá hoặc trong lúc tiến hành Đặt Chỗ.";
    } else {
        return "(Chế độ Demo)\nXin lỗi, vì chưa có GEMINI_API_KEY nên tôi chỉ có thể trả lời các mẫu câu cố định. Bạn hãy làm theo hướng dẫn ở file .env để kích hoạt AI thực sự nhé!";
    }
  }

  try {
    const realKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace('DAU_', '') : '';
    const ai = new GoogleGenAI({ apiKey: realKey });

    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
    if (error.status === 429 || error.message?.includes('429')) {
      return "Xin lỗi, API Key của hệ thống đã vượt quá giới hạn yêu cầu (Quota Exceeded). Vui lòng cấu hình API Key mới hoặc thử lại sau vài phút.";
    }
    return "Xin lỗi, đã xảy ra lỗi khi kết nối với máy chủ AI. Vui lòng thử lại sau.";
  }
}
