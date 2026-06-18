import * as guestService from '../services/guestService.js';

export const trackSession = async (req, res) => {
  try {
    const { plateNumber, sessionCode } = req.query;

    if (!plateNumber || !sessionCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ Biển số xe và Mã phiên'
      });
    }

    // Validate sessionCode format (SS-XXXXX)
    if (!/^SS-\d+$/i.test(sessionCode)) {
      return res.status(400).json({
        success: false,
        message: 'Mã phiên không hợp lệ. Định dạng đúng: SS-XXXXX (ví dụ: SS-00042)'
      });
    }

    const session = await guestService.trackSession(plateNumber, sessionCode);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên gửi xe. Vui lòng kiểm tra lại Biển số xe và Mã phiên.'
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
