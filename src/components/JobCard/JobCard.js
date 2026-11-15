import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Bookmark, BookmarkCheck, ChevronRight, Star, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useApplications } from '../../context/ApplicationContext';
import ApplicationModal from '../ApplicationModal/ApplicationModal';
import './JobCard.css';

const LOGO_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#dc2626)',
  'linear-gradient(135deg,#3b82f6,#2563eb)',
  'linear-gradient(135deg,#ec4899,#db2777)',
  'linear-gradient(135deg,#14b8a6,#0d9488)',
  'linear-gradient(135deg,#8b5cf6,#7c3aed)',
];

const getGradient = (str) =>
  LOGO_GRADIENTS[str.charCodeAt(0) % LOGO_GRADIENTS.length];

const getDaysPosted = (job) => {
  const dateStr = job?.postedDate || job?.posted_at || job?.datePosted || job?.createdAt;
  if (!dateStr) return 'Recently';
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return 'Recently';
  const days = Math.floor((Date.now() - parsed.getTime()) / 86400000);
  if (isNaN(days) || days < 0) return 'Recently';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

const STATUS_CONFIG = {
  pending:     { label: 'Applied ✓',          color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  reviewed:    { label: 'Under Review',        color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  shortlisted: { label: '⭐ Shortlisted',      color: '#d97706', bg: 'rgba(217,119,6,0.1)'  },
  interview:   { label: '📅 Interview!',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  selected:    { label: '🎉 Selected!',        color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  hired:       { label: '🎉 Hired!',           color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  rejected:    { label: 'Not Selected',        color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
};

const JobCard = ({ job: rawJob, index = 0 }) => {
  const jobId = String(rawJob?.id || rawJob?._id || '');
  // Normalize: employer-posted jobs may use employerName instead of company
  const job = {
    ...rawJob,
    id: jobId,
    _id: jobId,
    company: rawJob.company || rawJob.employerName || 'Company',
    skills:  Array.isArray(rawJob.skills) ? rawJob.skills : [],
  };

  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { hasAppliedToJob, getApplicationForJob } = useApplications();
  const [bookmarked, setBookmarked] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const hasApplied = hasAppliedToJob(jobId);
  const application = getApplicationForJob(jobId);

  // Load bookmark state from localStorage
  useEffect(() => {
    if (!currentUser || !jobId) return;
    const key = `jobconnect_bookmarks_${currentUser.id}`;
    const stored = JSON.parse(localStorage.getItem(key) || '[]').map(String);
    setBookmarked(stored.includes(jobId));
  }, [currentUser, jobId]);

  const handleBookmark = (e) => {
    e.stopPropagation();
    if (!currentUser) { toast.error('Please log in as a Job Seeker to save jobs'); return; }
    if (currentUser.role !== 'job_seeker') {
      toast.info('Saved jobs is a candidate-only feature.');
      return;
    }
    const key = `jobconnect_bookmarks_${currentUser.id}`;
    const stored = JSON.parse(localStorage.getItem(key) || '[]').map(String);
    const next = bookmarked ? stored.filter(id => id !== jobId) : [...stored, jobId];
    localStorage.setItem(key, JSON.stringify(next));
    setBookmarked(!bookmarked);
    toast.success(bookmarked ? 'Job removed from saved' : '❤️ Job saved!');
  };

  const handleApply = (e) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error('Please log in as a Job Seeker to apply');
      return;
    }
    if (currentUser.role !== 'job_seeker') {
      toast.error(`Only Job Seekers can apply. You are logged in as ${currentUser.role === 'employer' ? 'an Employer' : 'an Admin'}.`);
      return;
    }
    if (hasApplied) {
      toast.info(`Already applied on ${new Date(application.appliedDate).toLocaleDateString('en-IN')}`);
      return;
    }
    setShowModal(true);
  };

  const truncate = (str, n) => {
    if (str.length <= n) return str;
    return str.slice(0, str.lastIndexOf(' ', n)) + '...';
  };

  const status = hasApplied && application ? STATUS_CONFIG[application.status] : null;

  const isEmployerOwner = currentUser?.role === 'employer' && (
    String(job.employerId) === String(currentUser.id) ||
    String(job.postedBy) === String(currentUser.id) ||
    (Boolean(currentUser.company) && Boolean(job.company) && currentUser.company.toLowerCase() === job.company.toLowerCase())
  );

  return (
    <>
      <motion.div
        className={`job-card ${job.featured ? 'featured' : ''}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1], delay: Math.min(index * 0.03, 0.24) }}
        onClick={() => navigate(`/job/${job.id}`)}
      >
        {job.featured && (
          <div className="featured-badge">
            <Star size={11} fill="currentColor" /> Featured
          </div>
        )}

        {status && (
          <div className="status-pill" style={{ color: status.color, background: status.bg }}>
            {status.label}
          </div>
        )}

        <div className="card-header">
          <div className="company-logo" style={{ background: getGradient(job.company) }}>
            {job.companyLogo || job.company.slice(0, 2).toUpperCase()}
          </div>
          <div className="card-title-group">
            <h3 className="card-job-title">{job.title}</h3>
            <p className="card-company"><Building2 size={13} /> {job.company}</p>
          </div>
          {(!currentUser || currentUser.role === 'job_seeker') && (
            <motion.button
              className={`bookmark-btn ${bookmarked ? 'bookmarked' : ''}`}
              onClick={handleBookmark}
              whileTap={{ scale: 0.92 }}
              title="Save Job"
            >
              {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </motion.button>
          )}
        </div>

        <div className="card-meta">
          <span className="meta-pill"><MapPin size={12} /> {job.location}</span>
          <span className="meta-pill"><Clock size={12} /> {getDaysPosted(job)}</span>
          <span className={`type-badge ${job.type.toLowerCase().replace('-','')}`}>{job.type}</span>
        </div>

        <p className="card-salary">💰 {job.salaryDisplay || job.salary}</p>

        <p className="card-desc">{truncate(job.description, 110)}</p>

        <div className="card-skills">
          {job.skills.slice(0, 3).map((s, i) => (
            <span key={i} className="skill-tag">{s}</span>
          ))}
          {job.skills.length > 3 && <span className="skill-more">+{job.skills.length - 3}</span>}
        </div>

        <div className="card-footer">
          <button className="view-btn" onClick={(e) => { e.stopPropagation(); navigate(`/job/${job.id}`); }}>
            View Details <ChevronRight size={14} />
          </button>

          {/* Role-Specific Action Button (Apply Now NEVER rendered for Employer or Admin) */}
          {currentUser?.role === 'employer' ? (
            isEmployerOwner ? (
              <motion.button
                className="apply-btn"
                style={{ background: '#f97316' }}
                onClick={(e) => { e.stopPropagation(); navigate('/employer-dashboard?tab=jobs'); }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                Manage Job
              </motion.button>
            ) : null
          ) : currentUser?.role === 'admin' ? (
            <motion.button
              className="apply-btn"
              style={{ background: '#475569' }}
              onClick={(e) => { e.stopPropagation(); navigate(`/job/${job.id}`); }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Moderate
            </motion.button>
          ) : (
            <motion.button
              className={`apply-btn ${hasApplied ? 'applied' : ''}`}
              onClick={handleApply}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {hasApplied ? '✅ Applied' : 'Apply Now'}
            </motion.button>
          )}
        </div>
      </motion.div>

      <ApplicationModal isOpen={showModal} onClose={() => setShowModal(false)} job={job} />
    </>
  );
};

export default JobCard;
