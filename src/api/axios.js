import axios from 'axios';

// Single axios instance pointing to the Express backend API
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach standard cryptographic JWT Token if user is logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jobconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Allow browser to set correct multipart/form-data boundary when uploading files
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize error responses and handle session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.expired) {
      localStorage.removeItem('jobconnect_token');
      localStorage.removeItem('jobconnect_user');
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred with the server.';
    return Promise.reject(new Error(message));
  }
);

export default api;
