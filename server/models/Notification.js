const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a recipient'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'application_submitted',
        'application_received',
        'application_shortlisted',
        'application_rejected',
        'interview_scheduled',
        'interview_rescheduled',
        'interview_rsvp',
        'offer_issued',
        'offer_accepted',
        'new_job_matching',
        'message',
        'system',
      ],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    link: {
      type: String,
      default: '',
      trim: true,
    },
    data: {
      jobId: { type: String, default: '' },
      applicationId: { type: String, default: '' },
      companyName: { type: String, default: '' },
      interviewDate: { type: String, default: '' },
      interviewTime: { type: String, default: '' },
      interviewRound: { type: String, default: '' },
      extra: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for high performance dashboard queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
