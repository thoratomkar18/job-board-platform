const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide job title'],
    trim: true,
  },
  company: {
    type: String,
    required: [true, 'Please provide company name'],
    trim: true,
  },
  companyWebsite: {
    type: String,
    default: '',
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Please provide location'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'],
    default: 'Full-time',
  },
  salary: {
    type: String,
    required: [true, 'Please provide salary range (e.g. ₹14L - ₹20L)'],
    trim: true,
  },
  salaryMin: {
    type: Number,
    default: 0,
  },
  salaryMax: {
    type: Number,
    default: 999,
  },
  salaryDisplay: {
    type: String,
    default: '',
  },
  experienceLevel: {
    type: String,
    enum: ['Fresher', '1-3 yrs', '3-5 yrs', '5-10 yrs', '10+ yrs'],
    default: '1-3 yrs',
  },
  description: {
    type: String,
    default: '',
  },
  requirements: {
    type: String,
    default: '',
  },
  skills: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['active', 'paused'],
    default: 'active',
  },
  applicants: {
    type: Number,
    default: 0,
    min: 0,
  },
  views: {
    type: Number,
    default: 0,
    min: 0,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  employerName: {
    type: String,
    default: '',
    trim: true,
  },
  employerId: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Database Indexing for High Performance & Low Latency Queries
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ postedBy: 1, status: 1 });
jobSchema.index({ employerId: 1 });
jobSchema.index({ type: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ title: 'text', company: 'text', description: 'text', skills: 'text' });

module.exports = mongoose.model('Job', jobSchema);
