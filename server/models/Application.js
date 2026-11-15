const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: false,
  },
  jobIdString: {
    type: String,
    default: '',
  },
  jobTitle: {
    type: String,
    required: true,
    trim: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  applicantIdString: {
    type: String,
    default: '',
  },
  applicantName: {
    type: String,
    required: true,
    trim: true,
  },
  applicantEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  applicantPhone: {
    type: String,
    default: '',
    trim: true,
  },
  applicantSkills: {
    type: [String],
    default: [],
  },
  employerId: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'interview', 'offered', 'hired', 'selected', 'rejected'],
    default: 'pending',
  },
  coverLetter: {
    type: String,
    default: '',
  },
  expectedSalary: {
    type: String,
    default: '',
  },
  resumeFileName: {
    type: String,
    default: '',
  },
  resumeFileSize: {
    type: String,
    default: '',
  },
  resumeUrl: {
    type: String,
    default: '',
  },
  resumeData: {
    type: String,
    default: '',
  },
  employerNote: {
    type: String,
    default: '',
  },
  interviewRound: {
    type: String,
    default: '',
  },
  interviewDate: {
    type: String,
    default: '',
  },
  interviewTime: {
    type: String,
    default: '',
  },
  interviewMode: {
    type: String,
    default: 'Google Meet',
  },
  interviewLink: {
    type: String,
    default: '',
  },
  candidateRsvp: {
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'reschedule_requested'],
      default: 'pending',
    },
    proposedDate: { type: String, default: '' },
    proposedTime: { type: String, default: '' },
    note: { type: String, default: '' },
    respondedAt: { type: Date },
  },
  interviewHistory: [
    {
      round: { type: String, default: 'Technical Round 1' },
      date: { type: String, default: '' },
      time: { type: String, default: '' },
      mode: { type: String, default: 'Google Meet' },
      link: { type: String, default: '' },
      status: {
        type: String,
        enum: ['scheduled', 'completed', 'rescheduled', 'cancelled'],
        default: 'scheduled',
      },
      scheduledAt: { type: Date, default: Date.now },
      scorecard: {
        technical: { type: Number, default: 0 },
        communication: { type: Number, default: 0 },
        problemSolving: { type: Number, default: 0 },
        culture: { type: Number, default: 0 },
        overallScore: { type: Number, default: 0 },
        recommendation: {
          type: String,
          enum: ['advance', 'offer', 'reject', 'on_hold', ''],
          default: '',
        },
        feedback: { type: String, default: '' },
        submittedAt: { type: Date },
        submittedBy: { type: String, default: '' },
      },
    },
  ],
  offerDetails: {
    ctc: { type: String, default: '' },
    baseSalary: { type: String, default: '' },
    bonus: { type: String, default: '' },
    joiningDate: { type: String, default: '' },
    location: { type: String, default: '' },
    validityDate: { type: String, default: '' },
    notes: { type: String, default: '' },
    benefits: { type: [String], default: [] },
    issuedDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
    candidateResponseDate: { type: Date },
    declineReason: { type: String, default: '' },
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Database Indexing for High Performance Lookups & Preventing Duplicates
applicationSchema.index({ jobIdString: 1, applicantEmail: 1 });
applicationSchema.index({ applicantIdString: 1, appliedDate: -1 });
applicationSchema.index({ employerId: 1, appliedDate: -1 });
applicationSchema.index({ status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
