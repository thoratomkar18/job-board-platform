const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect, authorize, JWT_SECRET } = require('../middleware/auth');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateToken = (user) => {
  return jwt.sign(
    {
      id: String(user._id || user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company || '',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user (job_seeker or employer)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, company, companyWebsite, phone } = req.body;

    // Strict input validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid full name.' });
    }
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Strict RBAC: only job_seeker and employer can be registered via public endpoint
    const allowedRoles = ['job_seeker', 'employer'];
    const safeRole = allowedRoles.includes(role) ? role : 'job_seeker';

    // Employer validation: Company name is mandatory
    if (safeRole === 'employer' && (!company || typeof company !== 'string' || !company.trim())) {
      return res.status(400).json({ success: false, message: 'Company or Organization name is required for employer registration.' });
    }

    if (mongoose.connection.readyState === 1) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const user = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        role: safeRole,
        company: typeof company === 'string' ? company.trim() : '',
        companyWebsite: typeof companyWebsite === 'string' ? companyWebsite.trim() : '',
        phone: typeof phone === 'string' ? phone.trim() : '',
      });

      const token = generateToken(user);
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          companyWebsite: user.companyWebsite,
          phone: user.phone,
          status: user.status || 'active',
        },
      });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and return JWT token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation & NoSQL injection mitigation
    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a valid email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const token = generateToken(user);
      return res.json({
        success: true,
        token,
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          companyWebsite: user.companyWebsite,
          phone: user.phone,
          skills: user.skills,
          location: user.location,
          bio: user.bio,
          status: user.status || 'active',
        },
      });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile from verified JWT token
// @access  Private (Authenticated)
router.get('/me', protect, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = mongoose.Types.ObjectId.isValid(req.user.id)
        ? await User.findById(req.user.id).select('-password')
        : await User.findOne({ email: req.user.email }).select('-password');

      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.json({ success: true, user });
    }
    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update current user profile (excluding password and role)
// @access  Private (Authenticated)
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, bio, skills, location, company, companyWebsite } = req.body;
    const updates = {};
    if (typeof name === 'string' && name.trim()) updates.name = name.trim();
    if (typeof phone === 'string') updates.phone = phone.trim();
    if (typeof bio === 'string') updates.bio = bio.trim();
    if (typeof location === 'string') updates.location = location.trim();
    if (typeof company === 'string') updates.company = company.trim();
    if (typeof companyWebsite === 'string') updates.companyWebsite = companyWebsite.trim();
    if (Array.isArray(skills)) {
      updates.skills = skills.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof skills === 'string') {
      updates.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (mongoose.connection.readyState === 1) {
      const query = mongoose.Types.ObjectId.isValid(req.user.id)
        ? { _id: req.user.id }
        : { email: req.user.email };

      const updated = await User.findOneAndUpdate(
        query,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updated) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.json({ success: true, user: updated });
    }
    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/auth/users
// @desc    Get all registered users for Admin panel
// @access  Private (Admin Only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      return res.json({ success: true, count: users.length, data: users });
    }
    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/auth/users/:id/status
// @desc    Toggle user status (active / suspended)
// @access  Private (Admin Only)
router.patch('/users/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (mongoose.connection.readyState === 1) {
      const query = mongoose.Types.ObjectId.isValid(req.params.id)
        ? { _id: req.params.id }
        : { email: req.params.id };

      const user = await User.findOne(query);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

      // Admin cannot suspend own account
      if (user.email === req.user.email) {
        return res.status(400).json({ success: false, message: 'You cannot change the status of your own account.' });
      }

      user.status = status || (user.status === 'suspended' ? 'active' : 'suspended');
      await user.save();

      return res.json({
        success: true,
        message: `User status changed to ${user.status}.`,
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    }
    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
