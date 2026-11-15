const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide user full name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide user email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['job_seeker', 'employer', 'admin'],
    default: 'job_seeker',
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active',
  },
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  location: {
    type: String,
    default: 'Bengaluru, Karnataka',
    trim: true,
  },
  bio: {
    type: String,
    default: '',
  },
  skills: {
    type: [String],
    default: [],
  },
  // Specific to employer role
  company: {
    type: String,
    default: '',
    trim: true,
  },
  companyWebsite: {
    type: String,
    default: '',
    trim: true,
  },
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    applicationUpdates: { type: Boolean, default: true },
    interviewUpdates:   { type: Boolean, default: true },
    jobAlerts:          { type: Boolean, default: true },
    messages:           { type: Boolean, default: true },
    marketingEmails:    { type: Boolean, default: false },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook: Hash password with bcrypt before saving to DB
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method: Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Database Indexing
userSchema.index({ role: 1 });
userSchema.index({ company: 1 });
userSchema.index({ status: 1 });

module.exports = mongoose.model('User', userSchema);
