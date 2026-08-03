/**
 * FILE: guestController.js
 * MÔ TẢ: Controller xử lý các API dành cho khách vãng lai (Guest - Chưa cần đăng nhập hệ thống).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Cung cấp API tra cứu thông tin xe đang gửi dựa trên Biển số hoặc Mã phiên (Session ID).
 * 2. Cung cấp API thống kê tổng quan (Tổng chỗ đỗ, số vị trí trống, tổng số tòa nhà) để hiển thị lên Landing Page/Trang chủ.
 * 3. Tất cả các endpoint đều là Công khai (Public Access), không bắt buộc phải mang theo JWT Token.
 */

// Import tất cả hàm từ service 'guestService.js' dưới tên nhóm đại diện 'guestService'
// LIÊN KẾT FILE: Trỏ tới 'BE/src/services/guestService.js' - chứa các câu lệnh SQL query tra cứu thông tin phiên đỗ và thống kê.
import * as guestService from '../services/guestService.js'; 

/**
 * HÀM 1: trackSession
 * TÁC DỤNG: Tra cứu phiên gửi xe cho khách vãng lai bằng Biển số xe hoặc Mã phiên.
 * 
 * THUẬT NGỮ & CÚ PHÁP:
 * - `export const trackSession`: Khai báo và xuất một hàm theo chuẩn Arrow Function ES6.
 * - `async (req, res)`: Hàm xử lý bất đồng bộ tiếp nhận 2 đối tượng `req` (Request) và `res` (Response).
 * - `req.query`: Chứa các tham số được truyền qua URL dưới dạng Query String (ví dụ: `?searchTerm=29A12345`).
 * 
 * @route GET /api/guest/track-session?searchTerm=...
 * @access Public (Khách vãng lai truy cập tự do)
 */
export const trackSession = async (req, res) => {
  // Khối try-catch bắt lỗi ngoại lệ trong quá trình thực thi
  try {
    // CÚ PHÁP DESTRUCTURING: Lấy biến `searchTerm` từ chuỗi Query String của URL (`req.query`).
    // `searchTerm`: Biển số xe (ví dụ '29A-12345') hoặc Mã phiên đỗ (ví dụ '105') do người dùng nhập trên ô tìm kiếm.
    const { searchTerm } = req.query;

    // KIỂM TRA ĐẦU VÀO (Validation):
    // - `!searchTerm`: Kiểm tra nếu từ khóa tìm kiếm bị rỗng hoặc undefined.
    // - `!searchTerm.trim()`: Kiểm tra nếu từ khóa chỉ chứa các khoảng trắng thừa.
    if (!searchTerm || !searchTerm.trim()) {
      // Trả về HTTP Status Code 400 (Bad Request - Yêu cầu không hợp lệ) kèm câu báo lỗi
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập Biển số xe hoặc Mã phiên'
      });
    }

    // GỌI TẦNG SERVICE THỰC THI THỦ TỤC XỬ LÝ (Business Logic Call):
    // `await`: Chờ câu truy vấn SQL tìm kiếm phiên đỗ hoàn tất.
    // LIÊN KẾT: Gọi tới hàm `guestService.trackSession(searchTerm)` trong file `BE/src/services/guestService.js`.
    const session = await guestService.trackSession(searchTerm);

    // KIỂM TRA KẾT QUẢ TÌM KIẾM:
    // Nếu không tìm thấy phiên gửi xe tương ứng với từ khóa
    if (!session) {
      // Trả về HTTP Status Code 404 (Not Found - Không tìm thấy dữ liệu)
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên gửi xe. Vui lòng kiểm tra lại thông tin.'
      });
    }

    // TRẢ VỀ KẾT QUẢ THÀNH CÔNG:
    // HTTP Status Code 200 (OK) đóng gói đối tượng `session` tìm thấy dưới dạng JSON.
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    // GHI LOG LỖI VÀO CONSOLE SERVER
    console.error('Error tracking session:', error);
    // TRẢ VỀ LỖI SERVER 500 (Internal Server Error) KHI CÓ NỔI NGOẠI LỆ HOẶC LỖI KẾT NỐI DB
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tra cứu phiên gửi xe'
    });
  }
};

/**
 * HÀM 2: getHomeStats
 * TÁC DỤNG: Lấy dữ liệu thống kê tổng quan hiển thị công khai trên trang chủ (Landing Page).
 * Bao gồm: Tổng số tòa nhà, tổng ô đỗ, số lượng ô đang trống, số lượt xe đỗ thành công.
 * 
 * @route GET /api/guest/home-stats
 * @access Public (Khách truy cập tự do)
 */
export const getHomeStats = async (req, res) => {
  try {
    // GỌI TẦNG SERVICE LẤY DỮ LIỆU THỐNG KÊ:
    // LIÊN KẾT: Gọi sang hàm `guestService.getHomeStats()` trong `BE/src/services/guestService.js`.
    const stats = await guestService.getHomeStats();
    
    // TRẢ VỀ DỮ LIỆU THỐNG KÊ KÈM CODE 200 (OK)
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    // IN LỖI RA CONSOLE RENDER SERVER
    console.error('Error getting home stats:', error);
    // PHẢN HỒI LỖI 500 VỀ PHÍA HỆ THỐNG CLIENT
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu thống kê'
    });
  }
};

