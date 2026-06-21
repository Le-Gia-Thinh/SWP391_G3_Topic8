import * as guestService from '../services/guestService.js';

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
