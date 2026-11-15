import api from './axios';

export const authApi = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  updateProfile: async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    return res.data;
  },

  // Admin Only: Get all registered platform users from MongoDB
  getAllUsers: async () => {
    const res = await api.get('/auth/users');
    return res.data;
  },

  // Admin Only: Toggle user status (active / suspended)
  toggleUserStatus: async (userId, status) => {
    const res = await api.patch(`/auth/users/${userId}/status`, { status });
    return res.data;
  },
};
