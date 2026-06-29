/**
 * FILE: notificationApi.js
 * MÔ TẢ: Tập hợp các API xử lý thông báo (Notifications).
 * Cho phép lấy danh sách thông báo, số lượng chưa đọc và đánh dấu đã đọc.
 */

import authorizeAxios from '../utils/authorizeAxios';

const unwrap = (response) => response.data || response;

const notificationApi = {
  getNotifications: async (params) => {
    const res = await authorizeAxios.get('/notifications', { params });
    return unwrap(res);
  },
  
  getUnreadCount: async () => {
    const res = await authorizeAxios.get('/notifications/unread-count');
    return unwrap(res);
  },

  markAsRead: async (id) => {
    const res = await authorizeAxios.patch(`/notifications/${id}/read`);
    return unwrap(res);
  },

  markAllAsRead: async () => {
    const res = await authorizeAxios.patch('/notifications/read-all');
    return unwrap(res);
  }
};

export default notificationApi;
