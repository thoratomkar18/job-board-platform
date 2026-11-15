import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { notificationsApi } from '../api/notificationsApi';

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { currentUser, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    applicationUpdates: true,
    interviewUpdates: true,
    jobAlerts: true,
    messages: true,
    marketingEmails: false,
  });

  const socketRef = useRef(null);

  // 1. Fetch persistent notifications from MongoDB API
  const fetchNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      setLoading(true);
      const res = await notificationsApi.getNotifications(1, 30);
      if (res && res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Could not fetch notifications from backend:', err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // 2. Fetch Notification Preferences
  const fetchPreferences = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await notificationsApi.getPreferences();
      if (res && res.success && res.data?.preferences) {
        setPreferences(res.data.preferences);
      }
    } catch (err) {
      console.warn('Could not fetch preferences:', err.message);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  // 3. Connect to Socket.IO with authenticated user handshake
  useEffect(() => {
    const activeToken = token || localStorage.getItem('jobconnect_token');
    if (!currentUser || !activeToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socketUrl = process.env.REACT_APP_API_URL
      ? process.env.REACT_APP_API_URL.replace('/api', '')
      : 'http://localhost:5000';

    const socket = io(socketUrl, {
      auth: { token: activeToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket.IO] Connected to notification stream:', socket.id);
    });

    // Handle new targeted notification
    socket.on('notification:new', (payload) => {
      console.log('🔔 [Socket.IO] New notification received:', payload);
      const newNotif = payload.notification || payload;

      setNotifications((prev) => [
        {
          ...newNotif,
          id: String(newNotif._id || newNotif.id || Date.now()),
        },
        ...prev.filter(n => String(n._id || n.id) !== String(newNotif._id || newNotif.id)),
      ]);

      if (typeof payload.unreadCount === 'number') {
        setUnreadCount(payload.unreadCount);
      } else {
        setUnreadCount((c) => c + 1);
      }

      // Display real-time Toast notification to user
      toast.info(newNotif.title, {
        description: newNotif.message,
        duration: 5000,
      });
    });

    // Handle broadcast notifications (e.g. new job matches)
    socket.on('notification:broadcast', (payload) => {
      console.log('📢 [Socket.IO] Broadcast event:', payload);
      toast.info(payload.title, {
        description: payload.message,
        duration: 5000,
      });
      fetchNotifications();
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection warning:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUser, token, fetchNotifications]);

  // 4. Mark single notification as read
  const markAsRead = useCallback(async (notifId) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) =>
        String(n._id || n.id) === String(notifId) ? { ...n, read: true } : n
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await notificationsApi.markAsRead(notifId);
    } catch (err) {
      console.warn('Failed to mark notification as read on backend:', err.message);
    }
  }, []);

  // 5. Mark all as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await notificationsApi.markAllAsRead();
      toast.success('All notifications marked as read.');
    } catch (err) {
      console.warn('Failed to mark all as read on backend:', err.message);
    }
  }, []);

  // 6. Update user notification preferences
  const updatePreferences = useCallback(async (newPrefs) => {
    try {
      const res = await notificationsApi.updatePreferences(newPrefs);
      if (res && res.success) {
        setPreferences(res.data);
        toast.success('Notification preferences updated!');
        return true;
      }
    } catch (err) {
      toast.error(err.message || 'Could not update preferences');
      return false;
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        preferences,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
