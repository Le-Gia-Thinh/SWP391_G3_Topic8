import { getPool } from '../config/db.js';

export async function getFeedbackSummary(req, res, next) {
  try {
    const pool = await getPool();

    // 1. Thống kê chung (Điểm trung bình và tỷ lệ các sao)
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

    const stats = statsQuery.recordset[0];
    const total = stats.TotalFeedbacks || 0;

    // Tính phần trăm cho mỗi mức sao
    const distribution = {
      5: total > 0 ? Math.round((stats.Star5 / total) * 100) : 0,
      4: total > 0 ? Math.round((stats.Star4 / total) * 100) : 0,
      3: total > 0 ? Math.round((stats.Star3 / total) * 100) : 0,
      2: total > 0 ? Math.round((stats.Star2 / total) * 100) : 0,
      1: total > 0 ? Math.round((stats.Star1 / total) * 100) : 0,
    };

    // 2. Lấy danh sách đánh giá mới nhất (Top 50)
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

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalFeedbacks: total,
          averageRating: Number((stats.AverageRating || 0).toFixed(1)),
          distribution
        },
        feedbacks: listQuery.recordset
      }
    });

  } catch (err) {
    console.error('Error fetching staff feedback summary:', err);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu đánh giá.'
    });
  }
}
