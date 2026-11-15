const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get authenticated user's notifications with unread count
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, read: false }),
    ]);

    return res.json({
      success: true,
      unreadCount,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: notifications.map(n => ({
        ...n,
        id: String(n._id),
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a single notification as read (Ownership verified)
// @access  Private
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(notifId)) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const notification = await Notification.findOne({ _id: notifId, recipient: userId });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found or access denied' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });

    return res.json({
      success: true,
      unreadCount,
      data: {
        ...notification.toObject(),
        id: String(notification._id),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/notifications/read-all
// @desc    Mark all unread notifications as read for current user
// @access  Private
router.patch('/read-all', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    return res.json({
      success: true,
      unreadCount: 0,
      message: 'All notifications marked as read.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/notifications/preferences
// @desc    Get user's notification preferences
// @access  Private
router.get('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationPreferences email');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const defaultPrefs = {
      emailNotifications: true,
      applicationUpdates: true,
      interviewUpdates: true,
      jobAlerts: true,
      messages: true,
      marketingEmails: false,
    };

    return res.json({
      success: true,
      data: {
        email: user.email,
        preferences: {
          ...defaultPrefs,
          ...(user.notificationPreferences?.toObject ? user.notificationPreferences.toObject() : user.notificationPreferences),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/notifications/preferences
// @desc    Update user's notification preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const { emailNotifications, applicationUpdates, interviewUpdates, jobAlerts, messages, marketingEmails } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.notificationPreferences) {
      user.notificationPreferences = {};
    }

    if (emailNotifications !== undefined) user.notificationPreferences.emailNotifications = Boolean(emailNotifications);
    if (applicationUpdates !== undefined) user.notificationPreferences.applicationUpdates = Boolean(applicationUpdates);
    if (interviewUpdates !== undefined)   user.notificationPreferences.interviewUpdates   = Boolean(interviewUpdates);
    if (jobAlerts !== undefined)          user.notificationPreferences.jobAlerts          = Boolean(jobAlerts);
    if (messages !== undefined)           user.notificationPreferences.messages           = Boolean(messages);
    if (marketingEmails !== undefined)    user.notificationPreferences.marketingEmails    = Boolean(marketingEmails);

    await user.save();

    return res.json({
      success: true,
      message: 'Notification preferences updated successfully.',
      data: user.notificationPreferences,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
