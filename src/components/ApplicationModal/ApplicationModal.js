import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  Calendar,
  CheckCircle2,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import './ApplicationModal.css';

const SALARY_OPTIONS = [
  '₹3L - ₹5L',
  '₹5L - ₹8L',
  '₹8L - ₹12L',
  '₹12L - ₹20L',
  '₹20L - ₹35L',
  '₹35L+'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

const ApplicationModal = ({ isOpen, onClose, job }) => {
  const { currentUser } = useAuth();
  const { applyToJob } = useApplications();
  const fileInputRef = useRef(null);

  const [coverLetter, setCoverLetter] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeData, setResumeData] = useState('');
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | selected | uploaded
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setCoverLetter('');
      setExpectedSalary('');
      setAvailableFrom('');
      setFileName('');
      setFileSize('');
      setResumeFile(null);
      setResumeData('');
      setUploadStatus('idle');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      toast.error('Invalid file format. Please upload PDF, DOC, or DOCX.', { duration: 4000 });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size limit (5MB)
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds the 5MB limit. Please upload a smaller file.', { duration: 4000 });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Format file size
    const kb = (file.size / 1024).toFixed(1);
    const sizeDisplay = file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${kb} KB`;

    setFileName(file.name);
    setFileSize(sizeDisplay);
    setResumeFile(file);

    // Read full raw file data as base64 for persistent preview fidelity
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      setResumeData(uploadEvt.target.result);
    };
    reader.readAsDataURL(file);

    setUploadStatus('uploaded');
  };

  const handleRemoveResume = (e) => {
    e.stopPropagation();
    setFileName('');
    setFileSize('');
    setResumeFile(null);
    setResumeData('');
    setUploadStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.info('Resume removed');
  };

  const handleReplaceResume = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSalaryClick = (range) => {
    // Toggle selection
    setExpectedSalary(prev => prev === range ? '' : range);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Enforce required Resume / CV validation
    if (!fileName) {
      toast.error('Please upload your Resume / CV before submitting.', { duration: 4000 });
      return;
    }

    // If job requires a cover letter specifically, validate it
    if (job.coverLetterRequired && !coverLetter.trim()) {
      toast.error('This employer requires a cover letter with your application.', { duration: 4000 });
      return;
    }

    setSubmitting(true);
    try {
      await applyToJob(job, {
        coverLetter: coverLetter.trim(),
        expectedSalary: expectedSalary || 'Not specified',
        availableFrom: availableFrom || 'Immediate',
        resumeFileName: fileName,
        resumeFileSize: fileSize || '1.2 MB',
        resumeFile,
        resumeData,
      });

      toast.success(`Application submitted for ${job.title}! 🎉`, {
        description: `Your profile and resume were shared with ${job.company}.`,
        duration: 4000,
      });
      onClose();
    } catch (err) {
      toast.error(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const maxChars = 500;
  const remaining = maxChars - coverLetter.length;

  if (!job) return null;

  const applicantName = currentUser?.name || 'Omkar Thorat';
  const applicantEmail = currentUser?.email || 'omkar@example.com';
  const applicantInitial = applicantName.charAt(0).toUpperCase();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="app-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="app-modal"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Modal Header */}
            <div className="app-modal-header">
              <div>
                <h2>Apply for <span className="app-job-title">{job.title}</span></h2>
                <p className="app-company">{job.company} · {job.location}</p>
              </div>
              <button className="app-close" onClick={onClose} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            {/* Applicant Identity Line */}
            <div className="app-identity-strip">
              <div className="identity-avatar">{applicantInitial}</div>
              <div className="identity-details">
                <div className="identity-row">
                  <span className="identity-prefix">Applying as</span>
                  <span className="identity-name">{applicantName}</span>
                </div>
                <div className="identity-email">{applicantEmail}</div>
              </div>
              <div className="identity-badge">
                <ShieldCheck size={13} />
                <span>Profile info shared</span>
              </div>
            </div>

            <form className="app-form" onSubmit={handleSubmit}>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {/* 1. Resume / CV Section */}
              <div className="app-field">
                <div className="field-label-row">
                  <label>Resume / CV <span className="required">*</span></label>
                  <span className="field-hint">PDF, DOC, DOCX · Max 5MB</span>
                </div>

                {!fileName ? (
                  <div
                    className="resume-upload-box"
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                  >
                    <div className="upload-icon-circle">
                      <Upload size={20} />
                    </div>
                    <div className="upload-copy">
                      <span className="upload-main-text">Click to browse or drag resume here</span>
                      <small className="upload-sub-text">Accepted formats: PDF, DOC, DOCX (up to 5 MB)</small>
                    </div>
                  </div>
                ) : (
                  <div className="resume-attached-card">
                    <div className="resume-file-icon">
                      <FileText size={20} />
                    </div>
                    <div className="resume-file-meta">
                      <div className="resume-file-name" title={fileName}>{fileName}</div>
                      <div className="resume-file-sub">
                        <span>{fileSize}</span>
                        <span className="meta-bullet">•</span>
                        <span className="upload-ready-tag">
                          <CheckCircle2 size={12} />
                          {uploadStatus === 'uploaded' ? 'Ready to submit' : 'File selected'}
                        </span>
                      </div>
                    </div>
                    <div className="resume-actions">
                      <button
                        type="button"
                        className="resume-action-btn replace"
                        onClick={handleReplaceResume}
                        title="Replace resume file"
                      >
                        <RefreshCw size={13} />
                        <span>Replace</span>
                      </button>
                      <button
                        type="button"
                        className="resume-action-btn remove"
                        onClick={handleRemoveResume}
                        title="Remove resume"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Expected Annual Salary (₹ LPA) */}
              <div className="app-field">
                <div className="field-label-row">
                  <label>Expected Annual Salary (₹ LPA)</label>
                  <span className="optional-tag">Optional</span>
                </div>
                <div className="salary-options">
                  {SALARY_OPTIONS.map(s => {
                    const isSelected = expectedSalary === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        className={`salary-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSalaryClick(s)}
                        aria-pressed={isSelected}
                      >
                        {isSelected && <Check size={12} className="chip-check" />}
                        <span>{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Available to Join From */}
              <div className="app-field">
                <div className="field-label-row">
                  <label>
                    <Calendar size={14} className="label-icon" />
                    Available to Join From
                  </label>
                  <span className="optional-tag">Optional</span>
                </div>
                <input
                  type="date"
                  className="app-input"
                  value={availableFrom}
                  onChange={e => setAvailableFrom(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  placeholder="Select joining date"
                />
              </div>

              {/* 4. Cover Letter */}
              <div className="app-field">
                <div className="field-label-row">
                  <label>
                    Cover Letter {job.coverLetterRequired ? <span className="required">*</span> : null}
                  </label>
                  <span className="optional-tag">
                    {job.coverLetterRequired ? 'Required by employer' : 'Optional'}
                  </span>
                </div>
                <textarea
                  className="app-textarea"
                  placeholder="Share why you're a good fit for this role, key projects, or highlights..."
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value.slice(0, maxChars))}
                  rows={4}
                  required={Boolean(job.coverLetterRequired)}
                />
                <div className="field-footer-row">
                  <span className="textarea-guidance">Keep it brief and focused on your relevant experience.</span>
                  <div className={`char-count ${remaining < 50 ? 'warn' : ''}`}>
                    {remaining} / {maxChars}
                  </div>
                </div>
              </div>

              {/* 5. Modal Footer */}
              <div className="app-footer">
                <button type="button" className="app-cancel-btn" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  className="app-submit-btn"
                  disabled={submitting}
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                >
                  {submitting ? 'Submitting Application...' : 'Submit Application'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ApplicationModal;
