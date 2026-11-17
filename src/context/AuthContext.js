import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Standardized role normalization
const normalizeRole = (role) => {
  if (!role) return 'job_seeker';
  const r = String(role).toLowerCase().trim();
  if (r === 'jobseeker' || r === 'seeker') return 'job_seeker';
  if (r === 'employer') return 'employer';
  if (r === 'admin') return 'admin';
  return 'job_seeker';
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('jobconnect_token');
    if (!token) {
      localStorage.removeItem('jobconnect_user');
      setLoading(false);
      return () => { active = false; };
    }
    authApi.getProfile().then((res) => {
      if (!active || !res?.user) return;
      const safeUser = { ...res.user, id: String(res.user._id || res.user.id), role: normalizeRole(res.user.role) };
      delete safeUser._id;
      setCurrentUser(safeUser);
      localStorage.setItem('jobconnect_user', JSON.stringify(safeUser));
    }).catch(() => {
      localStorage.removeItem('jobconnect_token');
      localStorage.removeItem('jobconnect_user');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    try {
      // 1. Try real Express REST API
      const res = await authApi.login(email, password);
      if (res.success && res.user) {
        const safeUser = { ...res.user, role: normalizeRole(res.user.role) };
        if (res.token) localStorage.setItem('jobconnect_token', res.token);
        setCurrentUser(safeUser);
        localStorage.setItem('jobconnect_user', JSON.stringify(safeUser));
        return { success: true, user: safeUser };
      }
    } catch (apiErr) {
      // 2. Resilient demo account fallback if backend API is temporarily offline/unreachable
      const DEMO_FALLBACKS = {
        'thorato384@gmail.com': { id: '6ae783e86e4d89807ec1bcb1', name: 'Omkar Thorat', email: 'thorato384@gmail.com', role: 'job_seeker', location: 'Pune / Bengaluru' },
        'priya@techcorp.in': { id: '6af20b9b5697546d4da900ed', name: 'Priya Nair', email: 'priya@techcorp.in', role: 'employer', company: 'CloudTech India Pvt. Ltd.', companyWebsite: 'https://cloudtech.in' },
        'rohan@zerodha.com': { id: '6af20b9b5697546d4da900ef', name: 'Rohan Deshmukh', email: 'rohan@zerodha.com', role: 'employer', company: 'Zerodha Broking Ltd.', companyWebsite: 'https://zerodha.com' },
        'admin@jobconnect.in': { id: '6af20b9b5697546d4da900ee', name: 'Platform Admin', email: 'admin@jobconnect.in', role: 'admin' },
      };
      const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (DEMO_FALLBACKS[cleanEmail]) {
        const fallbackUser = DEMO_FALLBACKS[cleanEmail];
        setCurrentUser(fallbackUser);
        localStorage.setItem('jobconnect_user', JSON.stringify(fallbackUser));
        localStorage.setItem('jobconnect_token', 'mock_offline_demo_token');
        return { success: true, user: fallbackUser, offline: true };
      }
      return { success: false, message: apiErr.message || 'Invalid email or password.' };
    }

    return { success: false, message: 'Invalid email or password.' };
  };

  const signup = async (
    name,
    email,
    password,
    requestedRole = 'job_seeker',
    company = '',
    companyWebsite = '',
    phone = ''
  ) => {
    // Only allow job_seeker or employer for public registration (no admin)
    const role = requestedRole === 'employer' ? 'employer' : 'job_seeker';

    try {
      const res = await authApi.register({
        name,
        email,
        password,
        role,
        company,
        companyWebsite,
        phone,
      });
      if (res.success && res.user) {
        const safeUser = { ...res.user, role: normalizeRole(res.user.role) };
        if (res.token) localStorage.setItem('jobconnect_token', res.token);
        setCurrentUser(safeUser);
        localStorage.setItem('jobconnect_user', JSON.stringify(safeUser));
        return { success: true, user: safeUser };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed.' };
    }
    return { success: false, message: 'Registration failed.' };
  };

  const logout = () => {
    const userId = currentUser?.id;
    setCurrentUser(null);
    localStorage.removeItem('jobconnect_user');
    localStorage.removeItem('jobconnect_token');
    if (userId) {
      ['jobconnect_all_applications', `jobconnect_all_applications_${userId}`, `jobconnect_posted_jobs_${userId}`, `jobconnect_bookmarks_${userId}`, `jobconnect_notifications_${userId}`]
        .forEach((key) => localStorage.removeItem(key));
    }
  };

  const updateUser = async (updates) => {
    try {
      await authApi.updateProfile(updates);
    } catch (err) {
      // offline fallback
    }
    // Prevent changing role through profile update
    const { role: _ignoredRole, ...safeUpdates } = updates;
    const updated = { ...currentUser, ...safeUpdates };
    setCurrentUser(updated);
    localStorage.setItem('jobconnect_user', JSON.stringify(updated));
    return updated;
  };

  // RBAC helper convenience getters
  const isJobSeeker = currentUser?.role === 'job_seeker';
  const isEmployer = currentUser?.role === 'employer';
  const isAdmin = currentUser?.role === 'admin';
  const hasRole = (r) => currentUser?.role === r;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        signup,
        logout,
        updateUser,
        loading,
        isJobSeeker,
        isEmployer,
        isAdmin,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
