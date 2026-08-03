/**
 * FILE: staffFeedbackController.js
 * MÔ TẢ: Controller xử lý xem báo cáo đánh giá dịch vụ (Feedback Summary) dành cho Nhân viên (Staff).
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Truy vấn bảng `ServiceRatings` để tính điểm trung bình (AVG Rating) và tổng số lượng phản hồi.
 * 2. Sử dụng câu SQL Conditional Summation (`SUM(CASE WHEN Rating = X...)`) để đếm phân bố số sao (1 đến 5 sao).
 * 3. Tính toán tỷ lệ phần trăm phân bố số sao trên ứng dụng Node.js bằng `Math.round`.
 * 4. Truy vấn danh sách 50 phản hồi mới nhất (Top 50), JOIN với bảng `Users` và `ParkingSessions` để lấy tên tài xế, biển số và mã phiên gửi xe.
 */

// Import hàm `getPool` kết nối Database SQL Server từ cấu hình 'BE/src/config/db.js'
import { getPool } from '../config/db.js';

/**
 * HÀM: getFeedbackSummary
 * TÁC DỤNG: Tổng hợp dữ liệu đánh giá chất lượng dịch vụ của tài xế hiển thị cho Nhân viên / Quản lý.
 * 
 * THUẬT NGỮ & CÚ PHÁP:
 * - `AVG(CAST(Rating AS FLOAT))`: Ép kiểu `Rating` sang số thực `FLOAT` để phép tính điểm trung bình trả về số thập phân chính xác.
 * - `CONCAT('SS-', RIGHT('00000' + CAST(SessionID AS VARCHAR), 5))`: Cú pháp SQL tạo mã phiên chuẩn định dạng (ví dụ: SS-00105).
 * - `stats.AverageRating.toFixed(1)`: Làm tròn số điểm trung bình đến 1 chữ số thập phân (ví dụ 4.8).
 * 
 * @route GET /api/staff/feedback-summary
 * @access Staff / Manager (Dành cho Nhân viên xem báo cáo dịch vụ)
 */
export async function getFeedbackSummary(req, res, next) {
  try {
    // KẾT NỐI DATABASE: Lấy đối tượng kết nối SQL Server Connection Pool
    const pool = await getPool();

    // 1. TRUY VẤN THỐNG KÊ CHUNG (Aggregated Ratings Query):
    // Đếm tổng số đánh giá, điểm trung bình và phân loại tổng số lượt cho từng mức sao từ 1 đến 5.
    const statsQuery = await pool.request().query(`
      SELECT 
        COUNT(*) as TotalFeedbacks,
        AVG(CAST(Rating AS FLOAT)) as AverageRating,
        SUM(CASE WHEN Rating = 5 THEN 1 ELSE 0 END) as Star5,
        SUM(CASE WHEN Rating = 4 THEN 1 ELSE 0 END) as Star4,
        SUM(CASE WHEN Rating = 3 THEN 1 ELSE 0 END) as Star3,
        SUM(CASE WHEN Rating = 2 THEN 1 ELSE 0 END) as Star2,
        SUM(CASE WHEN Rating = 1 THEN 1 ELSE 0 END) as Star1
      FROM ServiceRatings
    `);

    // Lấy phần tử bản ghi thống kê đầu tiên
    const stats = statsQuery.recordset[0];
    // Lấy tổng số lượng phản hồi (nếu không có thì gán mặc định bằng 0)
    const total = stats.TotalFeedbacks || 0;

    // TÍNH PHẦN TRĂM PHÂN BỐ CÁC MỨC SAO (% Distribution):
    // Tránh lỗi chia cho 0 (Divide by Zero) bằng kiểm tra điều kiện `total > 0`.
    const distribution = {
      5: total > 0 ? Math.round((stats.Star5 / total) * 100) : 0, // Phần trăm đánh giá 5 sao
      4: total > 0 ? Math.round((stats.Star4 / total) * 100) : 0, // Phần trăm đánh giá 4 sao
      3: total > 0 ? Math.round((stats.Star3 / total) * 100) : 0, // Phần trăm đánh giá 3 sao
      2: total > 0 ? Math.round((stats.Star2 / total) * 100) : 0, // Phần trăm đánh giá 2 sao
      1: total > 0 ? Math.round((stats.Star1 / total) * 100) : 0, // Phần trăm đánh giá 1 sao
    };

    // 2. TRUY VẤN DANH SÁCH 50 ĐÁNH GIÁ MỚI NHẤT (Top 50 Recent Feedbacks):
    // Kết nối bảng ServiceRatings với Users (lấy tên tài xế, SĐT) và ParkingSessions (lấy biển số, mã phiên).
    const listQuery = await pool.request().query(`
      SELECT TOP 50
        sr.RatingID,
        sr.Rating,
        sr.Comment,
        sr.Tags,
        sr.CreatedAt,
        u.FullName as DriverName,
        u.PhoneNumber,
        ps.PlateNumber,
        CONCAT('SS-', RIGHT('00000' + CAST(ps.SessionID AS VARCHAR(10)), 5)) AS SessionCode
      FROM ServiceRatings sr
      JOIN Users u ON sr.DriverID = u.UserID
      JOIN ParkingSessions ps ON sr.SessionID = ps.SessionID
      ORDER BY sr.CreatedAt DESC
    `);

    // TRẢ VỀ DỮ LIỆU ĐỊNH DẠNG JSON KÈM HTTP STATUS 200 (OK)
    return res.status(200).json({
      success: true, // Cờ báo thành công
      data: {
        summary: {
          totalFeedbacks: total, // Tổng số lượt đánh giá
          averageRating: Number((stats.AverageRating || 0).toFixed(1)), // Điểm trung bình làm tròn 1 chữ số thập phân
          distribution // Đối tượng tỷ lệ % phân bố sao
        },
        feedbacks: listQuery.recordset // Mảng danh sách 50 phản hồi mới nhất
      }
    });

  } catch (err) {
    // GHI LOG LỖI TRÊN SERVER RENDER
    console.error('Error fetching staff feedback summary:', err);
    // PHẢN HỒI LỖI SERVER 500 VỀ CHO PHÍA CLIENT
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu đánh giá.'
    });
  }
}

