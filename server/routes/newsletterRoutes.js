const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Resilient JSON-backed file storage for newsletter subscribers
const SUBSCRIBERS_FILE = path.join(__dirname, '../data/subscribers.json');
let subscribers = null;

const getSubscribers = () => {
  if (subscribers) return subscribers;
  try {
    if (!fs.existsSync(path.dirname(SUBSCRIBERS_FILE))) {
      fs.mkdirSync(path.dirname(SUBSCRIBERS_FILE), { recursive: true });
    }
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading subscribers file:', err);
  }
    return [];
};

const saveSubscribers = (nextSubscribers) => {
  try {
    if (!fs.existsSync(path.dirname(SUBSCRIBERS_FILE))) {
      fs.mkdirSync(path.dirname(SUBSCRIBERS_FILE), { recursive: true });
    }
    const temporaryFile = `${SUBSCRIBERS_FILE}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(nextSubscribers, null, 2), 'utf8');
    fs.renameSync(temporaryFile, SUBSCRIBERS_FILE);
    subscribers = nextSubscribers;
    return true;
  } catch (err) {
    console.error('Error writing subscribers file:', err);
    return false;
  }
};

/**
 * @route   POST /api/newsletter/subscribe
 * @desc    Subscribe an email address to the JobConnect newsletter
 * @access  Public
 */
router.post('/subscribe', (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.',
    });
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format. Please enter a valid email address.',
    });
  }

  const subscribers = getSubscribers();
  const exists = subscribers.some(s => s.email === trimmed);

  if (exists) {
    return res.status(409).json({
      success: false,
      message: 'This email is already subscribed to JobConnect updates.',
    });
  }

  const newSubscriber = {
    id: `sub_${Date.now()}`,
    email: trimmed,
    subscribedAt: new Date().toISOString(),
  };

  subscribers.push(newSubscriber);
  if (!saveSubscribers(subscribers)) {
    return res.status(503).json({ success: false, message: 'Subscription could not be saved. Please try again.' });
  }

  return res.status(200).json({
    success: true,
    message: 'Thank you for subscribing! You will receive genuine updates on new job openings.',
    subscriber: {
      email: newSubscriber.email,
      subscribedAt: newSubscriber.subscribedAt,
    },
  });
});

/**
 * @route   GET /api/newsletter/count
 * @desc    Get total count of active newsletter subscribers
 * @access  Public
 */
router.get('/count', (req, res) => {
  const subscribers = getSubscribers();
  return res.json({
    success: true,
    count: subscribers.length,
  });
});

module.exports = router;
