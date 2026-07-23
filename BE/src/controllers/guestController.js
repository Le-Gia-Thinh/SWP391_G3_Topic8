/**
 * FILE: guestController.js
 * MÔ TẢ: Controller xử lý các API dành cho khách vãng lai (Guest - chưa đăng nhập).
 * 
 * Chức năng:
 * - trackSession: Tra cứu phiên gửi xe bằng biển số hoặc mã phiên
 * - getHomeStats: Lấy thống kê hiển thị trên trang chủ (công khai)
 */
/*
Hieu
*/

import * as guestService from '../services/guestService.js'; // Service xử lý logic Guest

/**
 * Tra cứu phiên gửi xe.
 * Cho phép người dùng chưa đăng nhập kiểm tra trạng thái xe bằng biển số hoặc mã phiên.
 * 
 * @route GET /api/guest/track-session?searchTerm=...
 * @access Public (không cần đăng nhập)
 */

export const trackSession = async (req, res) => {
  try {
    const { searchTerm } = req.query;

    if (!searchTerm || !searchTerm.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập Biển số xe hoặc Mã phiên'
      });
    }

    const session = await guestService.trackSession(searchTerm);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên gửi xe. Vui lòng kiểm tra lại thông tin.'
      });
    }

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    console.error('Error tracking session:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tra cứu phiên gửi xe'
    });
  }
};

/**
 * Lấy thống kê tổng quan hiển thị trên trang chủ.
 * Bao gồm: tổng chỗ đỗ, số chỗ trống, số tòa nhà, v.v.
 * 
 * @route GET /api/guest/home-stats
 * @access Public (không cần đăng nhập)
 */
export const getHomeStats = async (req, res) => {
  try {
    const stats = await guestService.getHomeStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting home stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu thống kê'
    });
  }
};
