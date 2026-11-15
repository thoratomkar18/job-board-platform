const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');
const { notifyRole } = require('../services/notificationService');

// Helper: parse numbers from salary string
const parseSalary = (salaryStr) => {
  const nums = (salaryStr || '').match(/\d+/g);
  if (nums && nums.length >= 2) return { min: parseInt(nums[0], 10), max: parseInt(nums[1], 10) };
  if (nums && nums.length === 1) return { min: parseInt(nums[0], 10), max: parseInt(nums[0], 10) + 5 };
  return { min: 0, max: 999 };
};

// Helper: escape regex special characters to prevent ReDoS
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// @route   GET /api/jobs
// @desc    Get all active jobs with search, filtering, and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { keyword, location, jobType, experience, page = 1, limit = 50 } = req.query;

    if (mongoose.connection.readyState === 1) {
      const conditions = [{ status: 'active' }];

      if (keyword && typeof keyword === 'string' && keyword.trim()) {
        const cleanKw = escapeRegex(keyword.trim());
        const regex = new RegExp(cleanKw, 'i');
        conditions.push({ $or: [
          { title: regex },
          { company: regex },
          { skills: regex },
          { description: regex },
        ] });
      }

      if (location && typeof location === 'string' && location.trim()) {
        conditions.push({ location: new RegExp(escapeRegex(location.trim()), 'i') });
      }

      if (jobType && typeof jobType === 'string' && jobType.trim()) {
        conditions.push({ type: jobType.trim() });
      }

      if (experience && typeof experience === 'string' && experience.trim()) {
        conditions.push({ experienceLevel: experience.trim() });
      }

      const query = { $and: conditions };

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
      const skip = (pageNum - 1) * limitNum;

      const [jobs, total] = await Promise.all([
        Job.find(query)
          .populate('postedBy', 'name email company')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        Job.countDocuments(query),
      ]);

      return res.json({
        success: true,
        count: jobs.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        data: jobs,
      });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Employer-only view includes paused jobs and scopes results to the authenticated employer.
router.get('/mine', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database service unavailable.' });
    }
    const query = req.user.role === 'admin' ? {} : {
      $or: [
        { employerId: String(req.user.id) },
        ...(mongoose.Types.ObjectId.isValid(req.user.id) ? [{ postedBy: req.user.id }] : []),
      ],
    };
    const jobs = await Job.find(query).sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to load employer jobs.' });
  }
});

// @route   GET /api/jobs/:id
// @desc    Get job details by ID and increment views
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Job ID is required.' });

    if (mongoose.connection.readyState === 1) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid job ID.' });
      }
      const query = { _id: id, status: 'active' };
      const job = await Job.findOneAndUpdate(query, { $inc: { views: 1 } }, { new: true })
        .populate('postedBy', 'name email company');

      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found.' });
      }
      return res.json({ success: true, data: job });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/jobs
// @desc    Post a new job listing (Employer only)
// @access  Private (Employer)
router.post('/', protect, authorize('employer'), async (req, res) => {
  try {
    const {
      title,
      company,
      companyWebsite,
      location,
      type,
      salary,
      experienceLevel,
      description,
      requirements,
      skills,
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid job title.' });
    }
    if (!location || typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid job location.' });
    }
    if (!salary || typeof salary !== 'string' || !salary.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a salary range (e.g. ₹16L - ₹24L LPA).' });
    }

    const parsed = parseSalary(salary);
    const parsedSkills = Array.isArray(skills)
      ? skills.map(s => String(s).trim()).filter(Boolean)
      : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : []);

    const jobData = {
      title: title.trim(),
      company: (typeof company === 'string' && company.trim()) ? company.trim() : (req.user.company || 'Enterprise Partner'),
      companyWebsite: typeof companyWebsite === 'string' ? companyWebsite.trim() : '',
      location: location.trim(),
      type: type || 'Full-time',
      salary: salary.trim(),
      salaryMin: parsed.min,
      salaryMax: parsed.max,
      salaryDisplay: salary.includes('LPA') ? salary : `${salary} LPA`,
      experienceLevel: experienceLevel || '1-3 yrs',
      description: typeof description === 'string' ? description.trim() : '',
      requirements: typeof requirements === 'string' ? requirements.trim() : '',
      skills: parsedSkills,
      status: 'active',
      applicants: 0,
      views: 0,
      employerName: req.user.name,
      employerId: String(req.user.id),
      postedBy: mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : undefined,
    };

    if (mongoose.connection.readyState === 1) {
      const job = await Job.create(jobData);

      // Automated broadcast to active Job Seekers
      try {
        notifyRole({
          role: 'job_seeker',
          type: 'new_job_matching',
          title: `New Job Opening: ${title}`,
          message: `${jobData.company} is hiring: ${title} (${jobData.salaryDisplay})`,
          link: `/job/${job._id}`,
          data: {
            jobId: String(job._id),
            jobTitle: title,
            companyName: jobData.company,
            location,
            salary: jobData.salaryDisplay,
          },
        }).catch(() => {});
      } catch (e) {}

      return res.status(201).json({ success: true, data: job });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/jobs/:id/status
// @desc    Toggle job status (active / paused) by owner or Admin
// @access  Private (Employer or Admin)
router.patch('/:id/status', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (mongoose.connection.readyState === 1) {
      const query = mongoose.Types.ObjectId.isValid(req.params.id)
        ? { _id: req.params.id }
        : { _id: null };

      const existing = await Job.findOne(query);
      if (!existing) return res.status(404).json({ success: false, message: 'Job not found.' });

      // Ownership enforcement: Employer can only modify jobs they own
      if (req.user.role === 'employer') {
        const isOwner = String(existing.postedBy) === String(req.user.id) ||
                        String(existing.employerId) === String(req.user.id);
        if (!isOwner) {
          return res.status(403).json({ success: false, message: 'Forbidden: You can only modify your own job listings.' });
        }
      }

      existing.status = status || (existing.status === 'active' ? 'paused' : 'active');
      await existing.save();
      return res.json({ success: true, data: existing });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job listing by owner or Admin
// @access  Private (Employer or Admin)
router.delete('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const query = mongoose.Types.ObjectId.isValid(req.params.id)
        ? { _id: req.params.id }
        : { _id: null };

      const existing = await Job.findOne(query);
      if (!existing) return res.status(404).json({ success: false, message: 'Job not found.' });

      // Ownership enforcement
      if (req.user.role === 'employer') {
        const isOwner = String(existing.postedBy) === String(req.user.id) ||
                        String(existing.employerId) === String(req.user.id);
        if (!isOwner) {
          return res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own job listings.' });
        }
      }

      await Job.findByIdAndDelete(existing._id);
      return res.json({ success: true, message: 'Job deleted successfully from platform.' });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
