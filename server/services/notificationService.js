const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitToUser, emitToRole } = require('./socketService');
const { sendEmail } = require('./emailService');

/**
 * Check if user's notification preferences allow email for this notification type
 */
function shouldSendEmail(user, type) {
  if (!user || !user.email) return false;
  const prefs = user.notificationPreferences || {};

  // Master email switch
  if (prefs.emailNotifications === false) return false;

  switch (type) {
    case 'application_submitted':
    case 'application_received':
    case 'application_shortlisted':
    case 'application_rejected':
    case 'offer_issued':
    case 'offer_accepted':
      return prefs.applicationUpdates !== false;

    case 'interview_scheduled':
    case 'interview_rescheduled':
    case 'interview_rsvp':
      return prefs.interviewUpdates !== false;

    case 'new_job_matching':
      return prefs.jobAlerts !== false;

    case 'message':
      return prefs.messages !== false;

    case 'marketing':
      return prefs.marketingEmails === true;

    default:
      return true;
  }
}

/**
 * Dispatch a notification across MongoDB, Socket.IO and Email
 */
async function createAndDispatchNotification({
  recipientId,
  senderId = null,
  type,
  title,
  message,
  link = '',
  data = {},
  emailSubject = '',
}) {
  try {
    if (!recipientId) {
      console.warn('⚠️ [NotificationService] Missing recipientId for notification:', title);
      return null;
    }

    // 1. Fetch recipient to check existence and preferences
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      console.warn(`⚠️ [NotificationService] Recipient not found in DB: ${recipientId}`);
      return null;
    }

    // 2. Persist Notification in MongoDB
    const notification = await Notification.create({
      recipient: recipient._id,
      sender: senderId && mongoose.Types.ObjectId.isValid(senderId) ? senderId : null,
      type,
      title,
      message,
      link,
      data,
    });

    // 3. Emit live real-time Socket.IO event to user's private room
    const unreadCount = await Notification.countDocuments({
      recipient: recipient._id,
      read: false,
    });

    emitToUser(recipient._id, 'notification:new', {
      notification,
      unreadCount,
    });

    // 4. Dispatch Email if user preference permits
    if (shouldSendEmail(recipient, type)) {
      const subject = emailSubject || title;
      // Pass candidate / employer details to template
      const emailPayloadData = {
        ...data,
        candidateName: data.candidateName || recipient.name,
        candidateEmail: data.candidateEmail || recipient.email,
        employerName: data.employerName || recipient.name,
        title,
        message,
        link,
      };

      // Asynchronous email dispatch with status logging
      sendEmail({
        to: recipient.email,
        subject,
        templateType: type,
        data: emailPayloadData,
      }).then(async (res) => {
        if (res && res.success) {
          notification.emailSent = true;
          await notification.save().catch(() => {});
        } else if (res && res.error) {
          notification.emailError = res.error;
          await notification.save().catch(() => {});
        }
      }).catch(err => {
        console.error('❌ [NotificationService] Email dispatch failed:', err.message);
      });
    }

    return notification;
  } catch (err) {
    console.error('❌ [NotificationService] createAndDispatchNotification error:', err.message);
    return null;
  }
}

/**
 * Broadcast notification to all users of a specific role (e.g. all job_seekers for a new job)
 */
async function notifyRole({
  role,
  type,
  title,
  message,
  link = '',
  data = {},
}) {
  try {
    const users = await User.find({ role, status: 'active' }).limit(50);
    const notifications = [];

    for (const u of users) {
      const notif = await createAndDispatchNotification({
        recipientId: u._id,
        type,
        title,
        message,
        link,
        data,
      });
      if (notif) notifications.push(notif);
    }

    // Also emit broadcast socket event to role room
    emitToRole(role, 'notification:broadcast', {
      type,
      title,
      message,
      link,
      data,
    });

    return notifications;
  } catch (err) {
    console.error('❌ [NotificationService] notifyRole error:', err.message);
    return [];
  }
}

module.exports = {
  createAndDispatchNotification,
  notifyRole,
  shouldSendEmail,
};
