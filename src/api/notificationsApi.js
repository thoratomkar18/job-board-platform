import axiosClient from './axios';

export const notificationsApi = {
  // Get paginated notifications + unread count
  getNotifications: async (page = 1, limit = 20) => {
    const res = await axiosClient.get(`/notifications?page=${page}&limit=${limit}`);
    return res.data;
  },

  // Mark single notification as read
  markAsRead: async (id) => {
    const res = await axiosClient.patch(`/notifications/${id}/read`);
    return res.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const res = await axiosClient.patch('/notifications/read-all');
    return res.data;
  },

  // Get user notification preferences
  getPreferences: async () => {
    const res = await axiosClient.get('/notifications/preferences');
    return res.data;
  },

  // Update user notification preferences
  updatePreferences: async (preferences) => {
    const res = await axiosClient.put('/notifications/preferences', preferences);
    return res.data;
  },
};
