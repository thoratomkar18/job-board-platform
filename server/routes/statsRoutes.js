const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * @route   GET /api/stats
 * @desc    Get verified real platform statistics for Homepage & Footer
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Statistics are temporarily unavailable.' });
    }
    const [activeJobs, companies, registeredUsers, applicationsCount] = await Promise.all([
      Job.countDocuments({ status: 'active' }),
      Job.distinct('company', { status: 'active' }),
      User.countDocuments(),
      Application.countDocuments(),
    ]);

    return res.json({
      success: true,
      data: {
        activeJobs,
        totalCompanies: companies.filter(Boolean).length,
        registeredUsers,
        applicationsCount,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    return res.status(503).json({ success: false, message: 'Statistics are temporarily unavailable.' });
  }
});

module.exports = router;
