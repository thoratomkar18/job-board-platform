import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import './ApplicationModal.css';

const ApplicationModal = ({ isOpen, onClose, job }) => {
  const { currentUser } = useAuth();
  const { applyToJob, loading } = useApplications();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    coverLetter: '',
    expectedSalary: '',
    availableStartDate: '',
    resumeFile: null,
    linkedinProfile: '',
    portfolioUrl: '',
    whyInterested: ''
  });
  const [dragActive, setDragActive] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Test function for debugging
  const testFileInput = () => {
    console.log('File input ref:', fileInputRef.current);
    if (fileInputRef.current) {
      fileInputRef.current.click();
      console.log('File input clicked');
    } else {
      console.log('File input ref is null');
    }
  };

  // Improved file upload handler
  const handleFileUpload = (file) => {
    setUploadError('');
    
    if (!file) {
      setUploadError('No file selected');
      return;
    }

    // Check file type
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file only');
      return;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    // File is valid
    setFormData(prev => ({ ...prev, resumeFile: file }));
    console.log('File uploaded successfully:', file.name);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  // File input change handler
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Click handler for upload area
  const handleUploadAreaClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Remove file handler
  const handleRemoveFile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFormData(prev => ({ ...prev, resumeFile: null }));
    setUploadError('');
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    if (!formData.coverLetter.trim()) {
      alert('Please write a cover letter');
      return false;
    }
    if (!formData.resumeFile) {
      alert('Please upload your resume');
      return false;
    }
    if (!formData.expectedSalary) {
      alert('Please provide your expected salary');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!currentUser) {
      alert('Please log in to apply for jobs');
      return;
    }

    try {
      const applicationData = {
        ...formData,
        userEmail: currentUser.email,
        userName: currentUser.name,
        jobTitle: job.title,
        companyName: job.company,
        resumeFileName: formData.resumeFile?.name || 'resume.pdf'
      };

      await applyToJob(job.id, applicationData);
      setSubmitSuccess(true);
      
      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
        resetForm();
      }, 2000);
      
    } catch (error) {
      alert('Error submitting application. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      coverLetter: '',
      expectedSalary: '',
      availableStartDate: '',
      resumeFile: null,
      linkedinProfile: '',
      portfolioUrl: '',
      whyInterested: ''
    });
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen || !job) return null;

  if (submitSuccess) {
    return (
      <div className="application-modal-overlay">
        <div className="application-modal success-modal">
          <div className="success-content">
            <div className="success-icon">🎉</div>
            <h2>Application Submitted!</h2>
            <p>Your application for <strong>{job.title}</strong> at <strong>{job.company}</strong> has been successfully submitted.</p>
            <div className="success-details">
              <span>✅ Resume uploaded: {formData.resumeFile?.name}</span>
              <span>✅ Cover letter included</span>
              <span>✅ Application tracking enabled</span>
            </div>
            <p className="success-note">We'll notify you about any updates on your application status.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="application-modal-overlay" onClick={onClose}>
      <div className="application-modal" onClick={(e) => e.stopPropagation()}>
        <div className="application-modal-header">
          <h2>📄 Apply for {job.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>


        <div className="job-summary">
          <div className="company-logo-small">{job.company.charAt(0)}</div>
          <div className="job-info">
            <h3>{job.title}</h3>
            <p>{job.company} • {job.location}</p>
            <span className="salary-badge">{job.salary}</span>
          </div>
        </div>

        <form className="application-form" onSubmit={handleSubmit}>
          {/* Resume upload section */}
          <div className="form-section">
            <h4>📎 Upload Resume (Required)</h4>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            
            {/* Upload area */}
            <div 
              className={`file-upload-area ${dragActive ? 'drag-active' : ''} ${formData.resumeFile ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleUploadAreaClick}
            >
              {formData.resumeFile ? (
                <div className="file-info">
                  <div className="file-icon">📄</div>
                  <div className="file-details">
                    <p className="file-name">{formData.resumeFile.name}</p>
                    <p className="file-size">
                      {(formData.resumeFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={handleRemoveFile}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📁</div>
                  <p><strong>Click to upload</strong> or drag and drop your resume</p>
                  <p className="upload-hint">PDF format only, max 5MB</p>
                </div>
              )}
            </div>
            
            {/* Error message */}
            {uploadError && (
              <div className="upload-error">
                ⚠️ {uploadError}
              </div>
            )}
            
            {/* Test upload button */}
            <button 
              type="button" 
              className="test-upload-btn"
              onClick={handleUploadAreaClick}
            >
              🔄 Browse Files
            </button>
          </div>

          {/* Cover letter */}
          <div className="form-section">
            <h4>✍️ Cover Letter (Required)</h4>
            <textarea
              name="coverLetter"
              value={formData.coverLetter}
              onChange={handleInputChange}
              placeholder="Tell us why you're interested in this position and why you'd be a great fit..."
              className="cover-letter-input"
              rows="6"
              required
            />
            <div className="character-count">
              {formData.coverLetter.length}/500 characters
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>💰 Expected Salary</label>
              <select
                name="expectedSalary"
                value={formData.expectedSalary}
                onChange={handleInputChange}
                required
              >
                <option value="">Select range</option>
                <option value="40000-60000">$40K - $60K</option>
                <option value="60000-80000">$60K - $80K</option>
                <option value="80000-100000">$80K - $100K</option>
                <option value="100000-120000">$100K - $120K</option>
                <option value="120000+">$120K+</option>
                <option value="negotiable">Negotiable</option>
              </select>
            </div>

            <div className="form-group">
              <label>📅 Available Start Date</label>
              <input
                type="date"
                name="availableStartDate"
                value={formData.availableStartDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className={`submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? '🔄 Submitting Application...' : '🚀 Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationModal;
