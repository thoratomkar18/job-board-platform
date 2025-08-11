import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (currentUser) {
      const savedNotifications = localStorage.getItem(`notifications_${currentUser.id}`);
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      }
    }
  }, [currentUser]);

  // Save notifications to localStorage when they change
  useEffect(() => {
    if (currentUser && notifications.length > 0) {
      localStorage.setItem(`notifications_${currentUser.id}`, JSON.stringify(notifications));
      setUnreadCount(notifications.filter(n => !n.read).length);
    }
  }, [notifications, currentUser]);

  // Add new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }

    return newNotification.id;
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Delete notification
  const deleteNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Get notifications by type
  const getNotificationsByType = (type) => {
    return notifications.filter(notification => notification.type === type);
  };

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // Simulate real-time notifications (in real app, this would come from WebSocket/Server-Sent Events)
  useEffect(() => {
    if (!currentUser) return;

    const simulateNotifications = () => {
      const notificationTypes = [
        {
          type: 'application_update',
          title: 'Application Update',
          message: 'Your application for Frontend Developer has been reviewed',
          actionUrl: '/dashboard?tab=applications',
          icon: '📋'
        },
        {
          type: 'new_job_match',
          title: 'New Job Match',
          message: 'A new React Developer position matches your profile',
          actionUrl: '/browse',
          icon: '🎯'
        },
        {
          type: 'interview_scheduled',
          title: 'Interview Scheduled',
          message: 'Interview scheduled for Product Manager position',
          actionUrl: '/dashboard?tab=applications',
          icon: '📅'
        }
      ];

      // Randomly add notifications for demo purposes
      if (Math.random() > 0.7) { // 30% chance every interval
        const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        addNotification(randomNotification);
      }
    };

    // Simulate notifications every 30 seconds for demo
    const interval = setInterval(simulateNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationsByType,
    requestNotificationPermission
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
