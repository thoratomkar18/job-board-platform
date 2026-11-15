const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createAndDispatchNotification } = require('../services/notificationService');

/**
 * Helper: Verify if an employer or admin has ownership/permission over an application
 */
async function canEmployerManageApplication(app, user) {
  if (user.role === 'admin') return true;
  if (user.role !== 'employer') return false;

  // Direct employerId match
  if (app.employerId && String(app.employerId) === String(user.id)) {
    return true;
  }

  // Check if employer owns the linked job
  if (app.jobId) {
    const ownsJob = await Job.exists({
      _id: app.jobId,
      $or: [
        { employerId: String(user.id) },
        ...(mongoose.Types.ObjectId.isValid(user.id) ? [{ postedBy: user.id }] : []),
      ],
    });
    if (ownsJob) return true;
  }

  return false;
}

/**
 * Helper: Verify if a job seeker owns an application
 */
function canSeekerAccessApplication(app, user) {
  if (user.role === 'admin') return true;
  const userEmail = (user.email || '').toLowerCase().trim();
  const userId = String(user.id || '');

  const isEmailMatch = app.applicantEmail && app.applicantEmail.toLowerCase().trim() === userEmail;
  const isIdStringMatch = app.applicantIdString && app.applicantIdString === userId;
  const isIdMatch = app.applicantId && String(app.applicantId) === userId;

  return Boolean(isEmailMatch || isIdStringMatch || isIdMatch);
}

router.get('/:id/resume', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });
    const allowed = req.user.role === 'admin'
      || (req.user.role === 'job_seeker' && canSeekerAccessApplication(app, req.user))
      || (req.user.role === 'employer' && await canEmployerManageApplication(app, req.user));
    if (!allowed) return res.status(403).json({ success: false, message: 'Resume access denied.' });

    // 1. If an actual uploaded file exists on disk, stream it
    if (app.resumeUrl) {
      const filename = path.basename(app.resumeUrl);
      const filePath = path.join(__dirname, '..', 'uploads', filename);
      if (fs.existsSync(filePath)) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${app.resumeFileName || filename}"`);
        return res.sendFile(filePath);
      }
    }

    // 2. If stored in app.resumeData as base64, decode and serve the actual uploaded file bytes
    if (app.resumeData && typeof app.resumeData === 'string' && app.resumeData.length > 50) {
      const matches = app.resumeData.match(/^data:([^;]+);base64,(.+)$/);
      let mimeType = 'application/pdf';
      let base64Content = app.resumeData;
      if (matches) {
        mimeType = matches[1];
        base64Content = matches[2];
      }
      const buffer = Buffer.from(base64Content, 'base64');
      if (buffer.length > 0) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${app.resumeFileName || 'Resume.pdf'}"`);
        return res.send(buffer);
      }
    }

    return res.status(404).json({ success: false, message: 'No uploaded resume file found for this application.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Unable to retrieve resume.' });
  }
});

// @route   GET /api/applications
// @desc    Get applications based on authenticated user role (Seeker sees own, Employer sees candidates for own jobs, Admin sees all)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { role, id, email } = req.user;

    if (mongoose.connection.readyState === 1) {
      let query = {};

      if (role === 'job_seeker') {
        const idMatches = [
          { applicantEmail: email.toLowerCase() },
          { applicantIdString: String(id) },
        ];
        if (mongoose.Types.ObjectId.isValid(id)) {
          idMatches.push({ applicantId: id });
        }
        query.$or = idMatches;
      } else if (role === 'employer') {
        // Query jobs posted by this employer
        const myJobs = await Job.find({
          $or: [
            { employerId: String(id) },
            ...(mongoose.Types.ObjectId.isValid(id) ? [{ postedBy: id }] : []),
          ],
        }).select('_id');

        const myJobIds = myJobs.map((j) => j._id);
        const myJobIdStrings = myJobs.map((j) => String(j._id));

        query.$or = [
          { employerId: String(id) },
          { jobId: { $in: myJobIds } },
          { jobIdString: { $in: myJobIdStrings } },
        ];
      }
      // If admin, query stays empty ({}) to view all applications across the platform

      const apps = await Application.find(query)
        .select('-resumeData')
        .populate('jobId', 'title company location salary status')
        .populate('applicantId', 'name email phone location')
        .sort({ appliedDate: -1 });

      return res.json({ success: true, count: apps.length, data: apps });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/applications
// @desc    Apply for a job (Job Seeker only)
// @access  Private (Job Seeker)
router.post(
  '/',
  protect,
  authorize('job_seeker'),
  (req, res, next) => {
    // If request has multipart/form-data, handle with multer and catch errors gracefully
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data') || req.is('multipart/form-data')) {
      return upload.single('resume')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        next();
      });
    }
    next();
  },
  async (req, res) => {
    try {
      const { jobId, coverLetter, expectedSalary } = req.body;
      const applicantId = req.user.id;
      const applicantEmail = req.user.email.toLowerCase();

      if (!jobId) {
        return res.status(400).json({ success: false, message: 'Job ID is required.' });
      }

      // Check duplicate application
      if (mongoose.connection.readyState === 1) {
        const dupConditions = [
          {
            $or: [
              ...(mongoose.Types.ObjectId.isValid(jobId) ? [{ jobId }] : []),
              { jobIdString: String(jobId) },
            ],
          },
          {
            $or: [
              ...(mongoose.Types.ObjectId.isValid(applicantId) ? [{ applicantId }] : []),
              { applicantIdString: String(applicantId) },
              { applicantEmail },
            ],
          },
        ];

        const existing = await Application.findOne({ $and: dupConditions });
        if (existing) {
          return res.status(400).json({ success: false, message: 'You have already applied for this position.' });
        }

        // Fetch parent job to verify existence and extract employerId
        let parentJob = null;
        if (mongoose.Types.ObjectId.isValid(jobId)) parentJob = await Job.findOne({ _id: jobId, status: 'active' });
        if (!parentJob) return res.status(404).json({ success: false, message: 'Active job not found.' });

        let resumeFileName = '';
        let resumeFileSize = '';
        let resumeUrl = '';
        let resumeData = req.body.resumeData || '';

        if (req.file) {
          resumeFileName = req.file.originalname;
          resumeFileSize = (req.file.size / (1024 * 1024)).toFixed(2) + ' MB';
          resumeUrl = `/uploads/${req.file.filename}`;
        } else if (req.body.resumeFileName) {
          resumeFileName = String(req.body.resumeFileName);
          resumeFileSize = req.body.resumeFileSize || '1.1 MB';
        }

        const resolvedEmployerId = String(parentJob.employerId || parentJob.postedBy || '');

        const appData = {
          jobId: mongoose.Types.ObjectId.isValid(jobId) ? jobId : undefined,
          jobIdString: String(jobId),
          jobTitle: parentJob.title,
          companyName: parentJob.company,
          applicantId: mongoose.Types.ObjectId.isValid(applicantId) ? applicantId : undefined,
          applicantIdString: String(applicantId),
          applicantName: req.user.name,
          applicantEmail,
          applicantPhone: req.user.phone || '',
          applicantSkills: req.user.skills || [],
          employerId: resolvedEmployerId,
          status: 'pending',
          coverLetter: typeof coverLetter === 'string' ? coverLetter.trim() : '',
          expectedSalary: typeof expectedSalary === 'string' ? expectedSalary.trim() : '',
          resumeFileName,
          resumeFileSize,
          resumeUrl,
          resumeData,
          appliedDate: new Date(),
        };

        const app = await Application.create(appData);

        // Increment applicant count on Job document
        if (mongoose.Types.ObjectId.isValid(jobId)) {
          await Job.findByIdAndUpdate(jobId, { $inc: { applicants: 1 } });
        }

        // Trigger Automated Notifications & Transactional Emails
        try {
          // 1. Notify Candidate
          if (req.user && req.user.id) {
            createAndDispatchNotification({
              recipientId: req.user.id,
              type: 'application_submitted',
              title: `Application Submitted: ${parentJob.title}`,
              message: `Your application for ${parentJob.title} at ${parentJob.company} was submitted successfully.`,
              link: '/dashboard?tab=applications',
              data: {
                jobId,
                applicationId: String(app._id),
                jobTitle: parentJob.title,
                companyName: parentJob.company,
                candidateName: req.user.name,
                candidateEmail: applicantEmail,
              },
              emailSubject: `Application Received: ${parentJob.title} at ${parentJob.company}`,
            });
          }

          // 2. Notify Employer
          (async () => {
            let employerUser = null;
            if (resolvedEmployerId && mongoose.Types.ObjectId.isValid(resolvedEmployerId)) {
              employerUser = await User.findById(resolvedEmployerId);
            } else {
              employerUser = await User.findOne({ company: parentJob.company, role: 'employer' });
            }

            if (employerUser) {
              createAndDispatchNotification({
                recipientId: employerUser._id,
                type: 'application_received',
                title: `New Candidate Applied: ${req.user.name}`,
                message: `${req.user.name} submitted an application for ${parentJob.title}`,
                link: '/employer-dashboard?tab=candidates',
                data: {
                  jobId,
                  applicationId: String(app._id),
                  jobTitle: parentJob.title,
                  companyName: parentJob.company,
                  candidateName: req.user.name,
                  candidateEmail: applicantEmail,
                  skills: req.user.skills || [],
                  expectedSalary: appData.expectedSalary,
                  employerName: employerUser.name,
                },
                emailSubject: `New Applicant: ${req.user.name} applied for ${jobTitle}`,
              });
            }
          })().catch(() => {});
        } catch (notifErr) {
          console.warn('⚠️ [Notification Trigger Warning]', notifErr.message);
        }

        return res.status(201).json({ success: true, data: app });
      }

      return res.status(503).json({ success: false, message: 'Database service unavailable.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// @route   PATCH /api/applications/:id/status
// @desc    Update candidate pipeline stage and notes (Owner Employer or Admin only)
// @access  Private (Employer or Admin)
router.patch('/:id/status', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const { status, employerNote, interviewRound, interviewDate, interviewTime, interviewMode, interviewLink } = req.body;

    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'selected', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status '${status}'. Allowed: ${validStatuses.join(', ')}` });
    }

    if (mongoose.connection.readyState === 1) {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ success: false, message: 'Application not found.' });
      }

      const app = await Application.findById(req.params.id);
      if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

      // Strict Ownership Check (NO IDOR bypass)
      const isAllowed = await canEmployerManageApplication(app, req.user);
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only update candidates for jobs you own.',
        });
      }

      const updates = { updatedAt: new Date() };
      if (status) updates.status = status;
      if (employerNote !== undefined) updates.employerNote = String(employerNote);
      if (interviewRound) updates.interviewRound = String(interviewRound);
      if (interviewDate) updates.interviewDate = String(interviewDate);
      if (interviewTime) updates.interviewTime = String(interviewTime);
      if (interviewMode) updates.interviewMode = String(interviewMode);
      if (interviewLink) updates.interviewLink = String(interviewLink);

      const updated = await Application.findByIdAndUpdate(app._id, { $set: updates }, { new: true });

      // Trigger candidate notification if status changed or interview scheduled
      try {
        let candidateUser = null;
        if (updated.applicantId && mongoose.Types.ObjectId.isValid(updated.applicantId)) {
          candidateUser = await User.findById(updated.applicantId);
        }
        if (!candidateUser && updated.applicantEmail) {
          candidateUser = await User.findOne({ email: updated.applicantEmail.toLowerCase().trim() });
        }

        if (candidateUser) {
          if (status === 'shortlisted') {
            createAndDispatchNotification({
              recipientId: candidateUser._id,
              type: 'application_shortlisted',
              title: `⭐ You are Shortlisted for ${updated.jobTitle}!`,
              message: `Congratulations! ${updated.companyName} has shortlisted your profile for the ${updated.jobTitle} position.`,
              link: '/dashboard?tab=applications',
              data: {
                applicationId: String(updated._id),
                jobTitle: updated.jobTitle,
                companyName: updated.companyName,
                candidateName: candidateUser.name,
              },
              emailSubject: `⭐ You've been Shortlisted for ${updated.jobTitle} at ${updated.companyName}`,
            });
          } else if (status === 'rejected') {
            createAndDispatchNotification({
              recipientId: candidateUser._id,
              type: 'application_rejected',
              title: `Application Status Update: ${updated.jobTitle}`,
              message: `Update regarding your application for ${updated.jobTitle} at ${updated.companyName}.`,
              link: '/dashboard?tab=applications',
              data: {
                applicationId: String(updated._id),
                jobTitle: updated.jobTitle,
                companyName: updated.companyName,
                candidateName: candidateUser.name,
              },
              emailSubject: `Status Update: ${updated.jobTitle} at ${updated.companyName}`,
            });
          } else if ((status === 'interview' || interviewDate) && (interviewDate || updated.interviewDate)) {
            createAndDispatchNotification({
              recipientId: candidateUser._id,
              type: 'interview_scheduled',
              title: `📅 Interview Scheduled: ${updated.jobTitle}`,
              message: `Interview round (${interviewRound || updated.interviewRound || 'Technical'}) scheduled with ${updated.companyName} on ${interviewDate || updated.interviewDate} at ${interviewTime || updated.interviewTime}.`,
              link: '/dashboard?tab=applications',
              data: {
                applicationId: String(updated._id),
                jobTitle: updated.jobTitle,
                companyName: updated.companyName,
                candidateName: candidateUser.name,
                round: interviewRound || updated.interviewRound || 'Interview Round',
                date: interviewDate || updated.interviewDate,
                time: interviewTime || updated.interviewTime,
                mode: interviewMode || updated.interviewMode || 'Google Meet',
                link: interviewLink || updated.interviewLink || '',
              },
              emailSubject: `Interview Scheduled: ${updated.jobTitle} with ${updated.companyName}`,
            });
          }
        }
      } catch (notifErr) {
        console.warn('⚠️ [Notification Status Update Warning]', notifErr.message);
      }

      return res.json({ success: true, data: updated });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/applications/:id/candidate-rsvp
// @desc    Candidate responds to scheduled interview RSVP (accept/decline/reschedule)
// @access  Private (Job Seeker)
router.patch('/:id/candidate-rsvp', protect, authorize('job_seeker'), async (req, res) => {
  try {
    const { rsvpStatus, proposedDate, proposedTime, note } = req.body;

    const validRsvpStatuses = ['pending', 'accepted', 'declined', 'reschedule_requested'];
    if (rsvpStatus && !validRsvpStatuses.includes(rsvpStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid RSVP status '${rsvpStatus}'. Allowed: ${validRsvpStatuses.join(', ')}`,
      });
    }

    if (mongoose.connection.readyState === 1) {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ success: false, message: 'Application not found.' });
      }

      const app = await Application.findById(req.params.id);
      if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

      // Ownership check: applicantId or applicantEmail matches req.user
      const isOwner = canSeekerAccessApplication(app, req.user);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to RSVP for this application.',
        });
      }

      const existingRsvp = app.candidateRsvp || {};
      app.candidateRsvp = {
        status: rsvpStatus || existingRsvp.status || 'pending',
        proposedDate: proposedDate !== undefined ? String(proposedDate) : (existingRsvp.proposedDate || ''),
        proposedTime: proposedTime !== undefined ? String(proposedTime) : (existingRsvp.proposedTime || ''),
        note: note !== undefined ? String(note) : (existingRsvp.note || ''),
        respondedAt: new Date(),
      };
      app.updatedAt = new Date();

      await app.save();

      // Trigger notification to Employer
      try {
        let employerUser = null;
        if (app.employerId && mongoose.Types.ObjectId.isValid(app.employerId)) {
          employerUser = await User.findById(app.employerId);
        }
        if (!employerUser && app.companyName) {
          employerUser = await User.findOne({ company: app.companyName, role: 'employer' });
        }

        if (employerUser) {
          const rsvpLabel = rsvpStatus === 'accepted' ? 'Accepted' : (rsvpStatus === 'declined' ? 'Declined' : 'Reschedule Requested');
          createAndDispatchNotification({
            recipientId: employerUser._id,
            type: 'interview_rsvp',
            title: `Candidate RSVP (${rsvpLabel}): ${app.applicantName}`,
            message: `${app.applicantName} has ${rsvpLabel.toLowerCase()} the interview for ${app.jobTitle}.${note ? ` Note: "${note}"` : ''}`,
            link: '/employer-dashboard?tab=candidates',
            data: {
              applicationId: String(app._id),
              jobTitle: app.jobTitle,
              candidateName: app.applicantName,
              candidateEmail: app.applicantEmail,
              rsvpStatus,
              proposedDate,
              proposedTime,
              note,
            },
            emailSubject: `Candidate RSVP: ${app.applicantName} (${rsvpLabel}) for ${app.jobTitle}`,
          });
        }
      } catch (rsvpNotifErr) {
        console.warn('⚠️ [RSVP Notification Warning]', rsvpNotifErr.message);
      }

      return res.json({ success: true, data: app });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/applications/:id/scorecard
// @desc    Submit interview scorecard evaluation for a round (Owner Employer or Admin only)
// @access  Private (Employer or Admin)
router.post('/:id/scorecard', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const { round, technical, communication, problemSolving, culture, recommendation, feedback } = req.body;

    const validRecommendations = ['advance', 'offer', 'reject', 'on_hold', ''];
    if (recommendation !== undefined && !validRecommendations.includes(recommendation)) {
      return res.status(400).json({
        success: false,
        message: `Invalid recommendation '${recommendation}'. Allowed: ${validRecommendations.join(', ')}`,
      });
    }

    if (mongoose.connection.readyState === 1) {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ success: false, message: 'Application not found.' });
      }

      const app = await Application.findById(req.params.id);
      if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

      // Ownership check
      const isAllowed = await canEmployerManageApplication(app, req.user);
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only score candidates for jobs you own.',
        });
      }

      const tech = Number(technical) || 0;
      const comm = Number(communication) || 0;
      const prob = Number(problemSolving) || 0;
      const cult = Number(culture) || 0;
      const overallScore = Number(((tech + comm + prob + cult) / 4).toFixed(1));

      const targetRound = round || app.interviewRound || 'Technical Round 1';

      if (!Array.isArray(app.interviewHistory)) {
        app.interviewHistory = [];
      }

      const existingIndex = app.interviewHistory.findIndex(
        (h) => h.round && h.round.trim().toLowerCase() === targetRound.trim().toLowerCase()
      );

      const scorecardData = {
        technical: tech,
        communication: comm,
        problemSolving: prob,
        culture: cult,
        overallScore,
        recommendation: recommendation || '',
        feedback: feedback ? String(feedback) : '',
        submittedAt: new Date(),
        submittedBy: req.user.name || req.user.email || 'Employer',
      };

      if (existingIndex >= 0) {
        app.interviewHistory[existingIndex].scorecard = scorecardData;
        app.interviewHistory[existingIndex].status = 'completed';
      } else {
        app.interviewHistory.push({
          round: targetRound,
          date: app.interviewDate || '',
          time: app.interviewTime || '',
          mode: app.interviewMode || 'Google Meet',
          link: app.interviewLink || '',
          status: 'completed',
          scheduledAt: new Date(),
          scorecard: scorecardData,
        });
      }

      // If recommendation is 'offer', optionally transition status to 'offered'
      if (recommendation === 'offer') {
        app.status = 'offered';
      }
      if (feedback) {
        app.employerNote = String(feedback);
      }

      app.updatedAt = new Date();
      await app.save();

      return res.json({ success: true, data: app });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/applications/:id/schedule-round
// @desc    Schedule next interview round, archive previous round, reset candidate RSVP
// @access  Private (Employer or Admin)
router.post('/:id/schedule-round', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const { round, date, time, mode, link, note } = req.body;

    if (mongoose.connection.readyState === 1) {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ success: false, message: 'Application not found.' });
      }

      const app = await Application.findById(req.params.id);
      if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

      // Ownership check
      const isAllowed = await canEmployerManageApplication(app, req.user);
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only schedule interview rounds for jobs you own.',
        });
      }

      if (!Array.isArray(app.interviewHistory)) {
        app.interviewHistory = [];
      }

      // Archive current interview round in interviewHistory with status 'completed' if not already present
      if (app.interviewRound) {
        const existingCurrent = app.interviewHistory.find(
          (h) => h.round && h.round.trim().toLowerCase() === app.interviewRound.trim().toLowerCase()
        );
        if (existingCurrent) {
          if (existingCurrent.status === 'scheduled') {
            existingCurrent.status = 'completed';
          }
        } else {
          app.interviewHistory.push({
            round: app.interviewRound,
            date: app.interviewDate || '',
            time: app.interviewTime || '',
            mode: app.interviewMode || 'Google Meet',
            link: app.interviewLink || '',
            status: 'completed',
            scheduledAt: app.appliedDate || new Date(),
          });
        }
      }

      // Sets current interviewRound, interviewDate, interviewTime, interviewMode, interviewLink, employerNote, and resets candidateRsvp to { status: 'pending' }
      const newRoundName = round || 'Next Round';
      app.interviewRound = newRoundName;
      app.interviewDate = date ? String(date) : '';
      app.interviewTime = time ? String(time) : '';
      app.interviewMode = mode ? String(mode) : 'Google Meet';
      app.interviewLink = link ? String(link) : '';
      if (note !== undefined) {
        app.employerNote = String(note);
      }
      app.candidateRsvp = {
        status: 'pending',
        proposedDate: '',
        proposedTime: '',
        note: '',
      };

      // Appends new round to interviewHistory with status 'scheduled'
      app.interviewHistory.push({
        round: newRoundName,
        date: app.interviewDate,
        time: app.interviewTime,
        mode: app.interviewMode,
        link: app.interviewLink,
        status: 'scheduled',
        scheduledAt: new Date(),
        scorecard: {
          technical: 0,
          communication: 0,
          problemSolving: 0,
          culture: 0,
          overallScore: 0,
          recommendation: '',
          feedback: '',
        },
      });

      // Status remains 'interview'
      app.status = 'interview';
      app.updatedAt = new Date();
      await app.save();

      // Trigger notification to Candidate for newly scheduled round
      try {
        let candidateUser = null;
        if (app.applicantId && mongoose.Types.ObjectId.isValid(app.applicantId)) {
          candidateUser = await User.findById(app.applicantId);
        }
        if (!candidateUser && app.applicantEmail) {
          candidateUser = await User.findOne({ email: app.applicantEmail.toLowerCase().trim() });
        }

        if (candidateUser) {
          createAndDispatchNotification({
            recipientId: candidateUser._id,
            type: 'interview_scheduled',
            title: `📅 ${newRoundName} Scheduled: ${app.jobTitle}`,
            message: `Your ${newRoundName} with ${app.companyName} is scheduled on ${date || app.interviewDate} at ${time || app.interviewTime}.`,
            link: '/dashboard?tab=applications',
            data: {
              applicationId: String(app._id),
              jobTitle: app.jobTitle,
              companyName: app.companyName,
              candidateName: candidateUser.name,
              round: newRoundName,
              date: date || app.interviewDate,
              time: time || app.interviewTime,
              mode: mode || app.interviewMode,
              link: link || app.interviewLink,
            },
            emailSubject: `Interview Round Scheduled: ${newRoundName} with ${app.companyName}`,
          });
        }
      } catch (roundNotifErr) {
        console.warn('⚠️ [Schedule Round Notification Warning]', roundNotifErr.message);
      }

      return res.json({ success: true, data: app });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/applications/:id/issue-offer
// @desc    Issue formal job offer letter to candidate (Owner Employer or Admin only)
// @access  Private (Employer or Admin)
router.post('/:id/issue-offer', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const { ctc, baseSalary, bonus, joiningDate, location, validityDate, notes, benefits } = req.body;

    if (mongoose.connection.readyState === 1) {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ success: false, message: 'Application not found.' });
      }

      const app = await Application.findById(req.params.id);
      if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

      // Ownership check
      const isAllowed = await canEmployerManageApplication(app, req.user);
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only issue offers for jobs you own.',
        });
      }

      let parsedBenefits = [];
      if (Array.isArray(benefits)) {
        parsedBenefits = benefits.map((b) => String(b));
      } else if (benefits) {
        parsedBenefits = [String(benefits)];
      }

      app.offerDetails = {
        ctc: ctc !== undefined ? String(ctc) : '',
        baseSalary: baseSalary !== undefined ? String(baseSalary) : '',
        bonus: bonus !== undefined ? String(bonus) : '',
        joiningDate: joiningDate !== undefined ? String(joiningDate) : '',
        location: location !== undefined ? String(location) : '',
        validityDate: validityDate !== undefined ? String(validityDate) : '',
        notes: notes !== undefined ? String(notes) : '',
        benefits: parsedBenefits,
        issuedDate: new Date(),
        status: 'pending',
        candidateResponseDate: null,
        declineReason: '',
      };

      app.status = 'offered';
      app.updatedAt = new Date();

      await app.save();

      // Notify candidate of the official offer
      try {
        let candidateUser = null;
        if (app.applicantId && mongoose.Types.ObjectId.isValid(app.applicantId)) {
          candidateUser = await User.findById(app.applicantId);
        }
        if (!candidateUser && app.applicantEmail) {
          candidateUser = await User.findOne({ email: app.applicantEmail.toLowerCase().trim() });
        }

        if (candidateUser) {
          createAndDispatchNotification({
            recipientId: candidateUser._id,
            type: 'offer_issued',
            title: `📜 Official Job Offer from ${app.companyName}!`,
            message: `Congratulations! ${app.companyName} has issued you a formal job offer for ${app.jobTitle} (CTC: ${ctc || 'Competitive'}).`,
            link: '/dashboard?tab=applications',
            data: {
              applicationId: String(app._id),
              jobTitle: app.jobTitle,
              companyName: app.companyName,
              candidateName: candidateUser.name,
              ctc,
              joiningDate,
            },
            emailSubject: `Congratulations! Job Offer from ${app.companyName} for ${app.jobTitle}`,
          });
        }
      } catch (offerNotifErr) {
        console.warn('⚠️ [Offer Notification Warning]', offerNotifErr.message);
      }

      return res.json({ success: true, data: app });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PATCH /api/applications/:id/respond-offer
// @desc    Candidate responds to job offer (accept / decline)
// @access  Private (Job Seeker)
router.patch('/:id/respond-offer', protect, authorize('job_seeker'), async (req, res) => {
  try {
    const { action, declineReason } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Allowed actions are 'accept' or 'decline'.",
      });
    }

    if (mongoose.connection.readyState === 1) {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ success: false, message: 'Application not found.' });
      }

      const app = await Application.findById(req.params.id);
      if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

      // Ownership check
      const isOwner = canSeekerAccessApplication(app, req.user);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to respond to this offer.',
        });
      }

      if (!app.offerDetails) {
        app.offerDetails = {};
      }

      if (action === 'accept') {
        app.offerDetails.status = 'accepted';
        app.offerDetails.candidateResponseDate = new Date();
        app.status = 'hired';
      } else if (action === 'decline') {
        app.offerDetails.status = 'declined';
        app.offerDetails.candidateResponseDate = new Date();
        app.offerDetails.declineReason = declineReason ? String(declineReason) : '';
        app.status = 'rejected';
      }

      app.updatedAt = new Date();
      await app.save();

      // Trigger notification to Employer
      try {
        let employerUser = null;
        if (app.employerId && mongoose.Types.ObjectId.isValid(app.employerId)) {
          employerUser = await User.findById(app.employerId);
        }
        if (!employerUser && app.companyName) {
          employerUser = await User.findOne({ company: app.companyName, role: 'employer' });
        }

        if (employerUser) {
          if (action === 'accept') {
            createAndDispatchNotification({
              recipientId: employerUser._id,
              type: 'offer_accepted',
              title: `🎉 Offer Accepted: ${app.applicantName}`,
              message: `${app.applicantName} has officially accepted your job offer for ${app.jobTitle}!`,
              link: '/employer-dashboard?tab=candidates',
              data: {
                applicationId: String(app._id),
                jobTitle: app.jobTitle,
                companyName: app.companyName,
                candidateName: app.applicantName,
                candidateEmail: app.applicantEmail,
                joiningDate: app.offerDetails?.joiningDate,
              },
              emailSubject: `🎉 Offer Accepted! ${app.applicantName} has accepted your offer for ${app.jobTitle}`,
            });
          } else {
            createAndDispatchNotification({
              recipientId: employerUser._id,
              type: 'system',
              title: `Offer Declined: ${app.applicantName}`,
              message: `${app.applicantName} has declined the job offer for ${app.jobTitle}.${declineReason ? ` Reason: "${declineReason}"` : ''}`,
              link: '/employer-dashboard?tab=candidates',
              data: {
                applicationId: String(app._id),
                jobTitle: app.jobTitle,
                companyName: app.companyName,
                candidateName: app.applicantName,
                candidateEmail: app.applicantEmail,
                declineReason,
              },
              emailSubject: `Offer Response: ${app.applicantName} declined the offer for ${app.jobTitle}`,
            });
          }
        }
      } catch (respNotifErr) {
        console.warn('⚠️ [Offer Response Notification Warning]', respNotifErr.message);
      }

      return res.json({ success: true, data: app });
    }

    return res.status(503).json({ success: false, message: 'Database service unavailable.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
