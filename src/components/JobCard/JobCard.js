import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import ApplicationModal from '../ApplicationModal/ApplicationModal';
import './JobCard.css';

const JobCard = ({ job }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { hasAppliedToJob, getApplicationForJob } = useApplications();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const hasApplied = hasAppliedToJob(job.id);
  const application = getApplicationForJob(job.id);

  const getDaysPosted = (datePosted) => {
    const now = new Date();
    const posted = new Date(datePosted);
    const timeDiff = now - posted;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    return daysDiff === 0 ? 'Today' : `${daysDiff} days ago`;
  };

  const handleBookmark = () => {
    if (!currentUser) {
      alert('Please log in to bookmark jobs');
      return;
    }
    setIsBookmarked(!isBookmarked);
    console.log('Job bookmarked:', job.title);
  };

  const handleApply = () => {
    if (!currentUser) {
      alert('Please log in to apply for jobs');
      return;
    }
    
    if (hasApplied) {
      alert(`You've already applied for this position on ${new Date(application.appliedDate).toLocaleDateString()}`);
      return;
    }
    
    setShowApplicationModal(true);
  };

  const handleViewDetails = () => {
    navigate(`/job/${job.id}`);
  };

  const getApplicationStatus = () => {
    if (!hasApplied) return null;
    
    const statusColors = {
      pending: '#f59e0b',
      reviewed: '#3b82f6', 
      interview: '#8b5cf6',
      hired: '#10b981',
      rejected: '#ef4444'
    };
    
    const statusLabels = {
      pending: 'Application Pending',
      reviewed: 'Under Review',
      interview: 'Interview Scheduled',
      hired: 'Hired!',
      rejected: 'Not Selected'
    };
    
    return (
      <div 
        className="application-status"
        style={{ backgroundColor: statusColors[application.status] }}
      >
        {statusLabels[application.status]}
      </div>
    );
  };

  return (
    <>
      <div className="job-card">
        {getApplicationStatus()}
        
        <div className="job-card-header">
          <div className="company-logo">
            {job.company.charAt(0)}
          </div>
          <div className="job-basic-info">
            <h3 className="job-title">{job.title}</h3>
            <p className="company-name">{job.company}</p>
            <div className="job-meta">
              <span className="location">📍 {job.location}</span>
              <span className="posted-date">🕒 {getDaysPosted(job.postedDate)}</span>
            </div>
          </div>
          <button 
            className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={handleBookmark}
          >
            {isBookmarked ? '❤️' : '🤍'}
          </button>
        </div>

        <div className="job-details">
          <div className="job-type-salary">
            <span className="job-type">{job.type}</span>
            <span className="salary">{job.salary}</span>
          </div>
          
          <p className="job-description">
            {job.description.substring(0, 120)}...
          </p>

          <div className="job-skills">
            {job.skills.slice(0, 3).map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            ))}
            {job.skills.length > 3 && (
              <span className="more-skills">+{job.skills.length - 3} more</span>
            )}
          </div>
        </div>

        <div className="job-card-footer">
          <button className="view-details-btn" onClick={handleViewDetails}>
            View Details
          </button>
          <button 
            className={`apply-btn ${hasApplied ? 'applied' : ''}`}
            onClick={handleApply}
          >
            {hasApplied ? '✅ Applied' : '📄 Apply Now'}
          </button>
        </div>
      </div>

      <ApplicationModal 
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        job={job}
      />
    </>
  );
};

export default JobCard;
