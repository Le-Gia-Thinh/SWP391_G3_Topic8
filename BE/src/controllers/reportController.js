/**
 * FILE: reportController.js
 * MÔ TẢ: Controller xử lý báo cáo dữ liệu tổng quan (Dashboard Analytics) dành cho cấp Quản lý (Manager).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Mở kết nối tới SQL Server Database Connection Pool.
 * 2. Thực hiện 4 câu truy vấn SQL bất đồng bộ SONG SONG (Parallel Asynchronous Execution) thông qua `Promise.all` để tối ưu thời gian phản hồi:
 *    - Query 1: Phân tích số lượng ô đỗ theo từng trạng thái (Available, Occupied, Reserved, Maintenance,...).
 *    - Query 2: Thống kê số lượng phiên đỗ xe theo trạng thái (Active, Completed, Cancelled, Lost,...).
 *    - Query 3: Tính tổng doanh thu toàn hệ thống (Hợp nhất từ Tiền gửi xe + Tiền mua gói gia hạn vé tháng).
 *    - Query 4: Phân loại tình trạng các sự cố sự việc (Open, InProgress, Resolved).
 * 3. Đóng gói 4 tập kết quả dưới dạng JSON trả về cho màn hình Dashboard của Manager.
 */

// Import hàm `getPool` từ file cấu hình cơ sở dữ liệu `BE/src/config/db.js`
// LIÊN KẾT FILE: `BE/src/config/db.js` - Quản lý hồ bơi kết nối (Connection Pooling) tới MS SQL Server.
import { getPool } from "../config/db.js"; 

/**
 * HÀM: dashboard
 * TÁC DỤNG: Lấy dữ liệu tổng hợp cho trang Dashboard Quản lý.
 * 
 * THUẬT NGỮ & CÚ PHÁP:
 * - `Promise.all([p1, p2, p3, p4])`: Kỹ thuật chạy song song nhiều Promise cùng lúc, giúp tiết kiệm thời gian hơn nhiều so với việc gọi `await` tuần tự từng câu SQL một.
 * - `recordset`: Thuộc tính của thư viện `mssql` chứa mảng kết quả của các dòng dữ liệu trả về từ SQL Query.
 * - `UNION ALL`: Toán tử SQL gộp kết quả từ 2 câu SELECT (Doanh thu đỗ xe + Doanh thu gói tháng) lại với nhau.
 * - `ISNULL(SUM(...), 0)`: Hàm SQL chống lỗi trả về `NULL` khi bảng chưa có dữ liệu giao dịch nào (nếu NULL thì thay bằng số 0).
 * 
 * @route GET /api/reports/dashboard
 * @access Manager only (Yêu cầu quyền truy cập của Quản lý)
 */
export async function dashboard(req, res, next) {
  try {
    // KẾT NỐI DATABASE: Lấy kết nối SQL Connection Pool hiện tại
    const pool = await getPool();

    // THỰC THI 4 TRUY VẤN SONG SONG VỚI PROMISE.ALL & DESTRUCTURING MẢNG KẾT QUẢ:
    // CÚ PHÁP: `const [slots, sessions, revenue, incidents] = await Promise.all([...])`
    const [slots, sessions, revenue, incidents] = await Promise.all([
      // QUERY 1: Đếm tổng số ô đỗ (ParkingSlots) gom nhóm theo trạng thái (SlotStatus)
      pool.request().query("SELECT SlotStatus, COUNT(*) AS Total FROM ParkingSlots GROUP BY SlotStatus"),

      // QUERY 2: Đếm tổng số phiên gửi xe (ParkingSessions) gom nhóm theo trạng thái (SessionStatus)
      pool.request().query("SELECT SessionStatus, COUNT(*) AS Total FROM ParkingSessions GROUP BY SessionStatus"),

      // QUERY 3: Tính tổng doanh thu hợp nhất (Revenue Aggregation):
      // - Nhánh 1: Lấy số tiền thực tế (FinalAmount hoặc Amount) từ các hóa đơn gửi xe đã thanh toán (Completed/Prepaid).
      // - Nhánh 2: Lấy số tiền đăng ký vé tháng (AmountPaid) từ bảng UserSubscriptions.
      // - UNION ALL gộp 2 nguồn doanh thu và SUM() lại.
      pool.request().query(`
        SELECT ISNULL(SUM(Revenue), 0) AS Revenue 
        FROM (
            SELECT ISNULL(FinalAmount, Amount) AS Revenue FROM Payments WHERE PaymentStatus IN ('Completed', 'Prepaid')
            UNION ALL
            SELECT AmountPaid AS Revenue FROM UserSubscriptions WHERE AmountPaid > 0
        ) t
      `),

      // QUERY 4: Đếm số lượng sự cố (Incidents) gom nhóm theo tình trạng xử lý (IncidentStatus)
      pool.request().query("SELECT IncidentStatus, COUNT(*) AS Total FROM Incidents GROUP BY IncidentStatus")
    ]);

    // ĐÓNG GÓI VÀ TRẢ VỀ DỮ LIỆU ĐỊNH DẠNG JSON
    res.json({
      success: true, // Cờ báo thành công
      data: {
        slots: slots.recordset,          // Mảng thống kê trạng thái vị trí đỗ
        sessions: sessions.recordset,    // Mảng thống kê trạng thái phiên gửi xe
        revenue: revenue.recordset[0],   // Đối tượng chứa tổng doanh thu (lấy phần tử đầu tiên)
        incidents: incidents.recordset   // Mảng thống kê tình trạng sự cố
      }
    });
  } catch (err) { 
    // CHUYỂN LỖI SANG ERROR HANDLER MIDDLEWARE KHI TRUY VẤN DATABASE THẤT BẠI
    next(err); 
  }
}