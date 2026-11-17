import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Briefcase, Users, Globe, Share2,
  Bookmark, BookmarkCheck, ChevronRight, Home, CheckCircle,
  Building2, Award, Tag, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_JOBS } from '../data/indianData';
import { useAuth } from '../context/AuthContext';
import { useApplications } from '../context/ApplicationContext';
import { jobsApi } from '../api/jobsApi';
import ApplicationModal from '../components/ApplicationModal/ApplicationModal';
import Layout from '../components/Layout/Layout';
import { sanitizeHtml } from '../lib/sanitizeHtml';
import './JobDetailPage.css';

const getDaysPosted = (d) => {
  if (!d) return 'Recently';
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return 'Recently';
  const days = Math.floor((Date.now() - parsed.getTime()) / 86400000);
  if (isNaN(days) || days < 0) return 'Recently';
  return days === 0 ? 'Today' : `${days} days ago`;
};

const LOGO_GRADS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#3b82f6,#2563eb)',
  'linear-gradient(135deg,#ec4899,#db2777)',
  'linear-gradient(135deg,#14b8a6,#0d9488)',
];
const getGrad = (s = '') => LOGO_GRADS[(s || 'Company').charCodeAt(0) % LOGO_GRADS.length];

const normalizeJobDetails = (found) => {
  const skillsRaw = found.skills || '';
  const skills = Array.isArray(skillsRaw)
    ? skillsRaw
    : String(skillsRaw).split(',').map((s) => s.trim()).filter(Boolean);

  const perks = Array.isArray(found.perks) && found.perks.length > 0
    ? found.perks
    : ['Health Insurance', 'WFH Flexibility', 'Performance Bonus', 'Learning Budget'];

  return {
    ...found,
    id: String(found.id || found._id),
    _id: String(found._id || found.id),
    company: found.company || found.employerName || 'Verified Partner',
    skills,
    salaryDisplay: found.salaryDisplay || (found.salary ? (found.salary.includes('LPA') ? found.salary : `${found.salary} LPA`) : 'Competitive'),
    description: found.description || `${found.title} position at ${found.company || found.employerName || 'our company'}.`,
    fullDescription: found.fullDescription || found.requirements || found.description || '',
    perks,
    about: found.about || `Posted by ${found.employerName || found.company || 'Enterprise Partner'}. Join our fast-growing engineering team in India.`,
    companySize: found.companySize || '50-200 employees',
    companyWebsite: found.companyWebsite || '',
    postedDate: found.postedDate || found.createdAt || new Date().toISOString(),
  };
};

const JobDetailPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { hasAppliedToJob, getApplicationForJob, postedJobs } = useApplications();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Multi-tier lookup: strict string comparison against INDIAN_JOBS, then postedJobs, localStorage, then backend API
  useEffect(() => {
    let isMounted = true;

    const fetchJob = async () => {
      setLoading(true);

      // 1. Strict exact match in curated INDIAN_JOBS (strict String comparison prevents parseInt hex bug)
      const fromIndian = INDIAN_JOBS.find((j) => String(j.id) === String(jobId));
      if (fromIndian) {
        if (isMounted) {
          setJob(fromIndian);
          setLoading(false);
        }
        return;
      }

      // 2. Check active postedJobs in memory (ApplicationContext)
      if (postedJobs && postedJobs.length > 0) {
        const foundInContext = postedJobs.find(
          (j) => String(j.id) === String(jobId) || String(j._id) === String(jobId)
        );
        if (foundInContext) {
          if (isMounted) {
            setJob(normalizeJobDetails(foundInContext));
            setLoading(false);
          }
          return;
        }
      }

      // 3. Check localStorage cache
      try {
        const local = JSON.parse(localStorage.getItem(`jobconnect_posted_jobs_${currentUser?.id || 'guest'}`) || '[]');
        const foundInLocal = local.find(
          (j) => String(j.id) === String(jobId) || String(j._id) === String(jobId)
        );
        if (foundInLocal) {
          if (isMounted) {
            setJob(normalizeJobDetails(foundInLocal));
            setLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn('Could not read jobs from localStorage', err);
      }

      // 4. Fetch directly from Express + MongoDB backend API
      try {
        const res = await jobsApi.getJobById(jobId);
        if (res && res.success && res.data) {
          if (isMounted) {
            setJob(normalizeJobDetails(res.data));
            setLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn(`Job ${jobId} not found on backend:`, err.message);
      }

      if (isMounted) {
        setJob(null);
        setLoading(false);
      }
    };

    fetchJob();
    return () => {
      isMounted = false;
    };
  }, [jobId, postedJobs]);

  const targetJobId = job ? String(job.id || job._id) : '';
  const hasApplied = targetJobId ? hasAppliedToJob(targetJobId) : false;
  const application = targetJobId ? getApplicationForJob(targetJobId) : null;

  useEffect(() => {
    if (!currentUser || !targetJobId) return;
    const stored = JSON.parse(localStorage.getItem(`jobconnect_bookmarks_${currentUser.id}`) || '[]');
    setBookmarked(stored.map(String).includes(targetJobId));
  }, [currentUser, targetJobId]);

  if (loading) {
    return (
      <Layout>
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Loader2 className="animate-spin" size={36} color="#6366f1" />
          <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Loading job details...</p>
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <motion.div className="jd-not-found" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="jd-nf-emoji">😕</div>
          <h2>Job Not Found</h2>
          <p>This job may have been removed or the link is incorrect.</p>
          <button className="jd-back-btn" onClick={() => navigate('/browse')}>
            Browse All Jobs
          </button>
        </motion.div>
      </Layout>
    );
  }

  const toggleBookmark = () => {
    if (!currentUser) {
      toast.error('Please log in as a Job Seeker to save jobs');
      return;
    }
    if (currentUser.role !== 'job_seeker') {
      toast.info('Saved jobs is a candidate-only feature.');
      return;
    }
    const key = `jobconnect_bookmarks_${currentUser.id}`;
    const stored = JSON.parse(localStorage.getItem(key) || '[]').map(String);
    const next = bookmarked ? stored.filter((id) => id !== targetJobId) : [...stored, targetJobId];
    localStorage.setItem(key, JSON.stringify(next));
    setBookmarked(!bookmarked);
    toast.success(bookmarked ? 'Removed from saved' : '❤️ Job saved!');
  };

  const handleApply = () => {
    if (!currentUser) {
      toast.error('Please log in as a Job Seeker to apply');
      return;
    }
    if (currentUser.role !== 'job_seeker') {
      toast.error(
        `Only Job Seekers can apply. You are logged in as ${
          currentUser.role === 'employer' ? 'an Employer' : 'an Admin'
        }.`
      );
      return;
    }
    if (hasApplied) {
      toast.info('You have already applied for this job!');
      return;
    }
    setShowModal(true);
  };

  const isEmployerOwner =
    currentUser?.role === 'employer' &&
    (String(job.employerId) === String(currentUser.id) ||
      String(job.postedBy) === String(currentUser.id) ||
      (Boolean(currentUser.company) &&
        Boolean(job.company) &&
        currentUser.company.toLowerCase() === job.company.toLowerCase()));

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this job: ${job.title} at ${job.company}`);
    if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    } else {
      navigator.clipboard?.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
    if (platform !== 'copy') toast.success('Opening share window...');
  };

  return (
    <Layout>
      <motion.div
        className="jd-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Breadcrumb */}
        <div className="jd-breadcrumb">
          <div className="container">
            <span onClick={() => navigate('/')} className="bc-link">
              <Home size={13} /> Home
            </span>
            <ChevronRight size={13} />
            <span onClick={() => navigate('/browse')} className="bc-link">
              Browse Jobs
            </span>
            <ChevronRight size={13} />
            <span className="bc-current">{job.title}</span>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="jd-banner">
          <div className="container">
            <div className="jd-banner-content">
              <div className="jd-logo" style={{ background: getGrad(job.company) }}>
                {job.companyLogo || (job.company ? job.company.slice(0, 2).toUpperCase() : 'CO')}
              </div>
              <div className="jd-banner-info">
                <h1>{job.title}</h1>
                <div className="jd-meta-row">
                  <span className="jd-meta-pill">
                    <Building2 size={13} /> {job.company}
                  </span>
                  <span className="jd-meta-pill">
                    <MapPin size={13} /> {job.location}
                  </span>
                  <span className="jd-meta-pill">
                    <Clock size={13} /> {getDaysPosted(job.postedDate)}
                  </span>
                  <span className={`jd-type-badge ${String(job.type || 'fulltime').toLowerCase().replace('-', '')}`}>
                    {job.type}
                  </span>
                  {job.featured && <span className="jd-featured-badge">⭐ Featured</span>}
                </div>
                <div className="jd-salary">💰 {job.salaryDisplay || job.salary} per year</div>
              </div>
              <div className="jd-actions-top">
                {(!currentUser || currentUser.role === 'job_seeker') && (
                  <motion.button
                    className={`jd-bookmark-btn ${bookmarked ? 'active' : ''}`}
                    onClick={toggleBookmark}
                    whileTap={{ scale: 1.3 }}
                    title="Save Job"
                  >
                    {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </motion.button>
                )}

                {currentUser?.role === 'employer' ? (
                  isEmployerOwner ? (
                    <motion.button
                      className="jd-apply-btn"
                      style={{ background: '#f97316' }}
                      onClick={() => navigate('/employer-dashboard?tab=jobs')}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      ⚙️ Manage Job
                    </motion.button>
                  ) : (
                    <div
                      className="jd-employer-badge"
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.88rem',
                      }}
                    >
                      🏢 Employer Preview
                    </div>
                  )
                ) : currentUser?.role === 'admin' ? (
                  <motion.button
                    className="jd-apply-btn"
                    style={{ background: '#475569' }}
                    onClick={() => navigate('/admin?tab=jobs')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    🛡️ Moderate Job
                  </motion.button>
                ) : (
                  <motion.button
                    className={`jd-apply-btn ${hasApplied ? 'applied' : ''}`}
                    onClick={handleApply}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {hasApplied ? '✅ Applied' : '🚀 Apply Now'}
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="jd-body container">
          <div className="jd-main">
            {/* Description */}
            <div className="jd-section">
              <h2>About the Role</h2>
              <p className="jd-description">{job.description}</p>
            </div>

            {/* Full description HTML (Sanitized against XSS) */}
            {job.fullDescription && (
              <div className="jd-section">
                <h2><CheckCircle size={18} /> Requirements &amp; Qualifications</h2>
                <div className="jd-full-desc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.fullDescription) }} />
              </div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="jd-section">
                <h2><Tag size={16} /> Skills Required</h2>
                <div className="jd-skills">
                  {job.skills.map((s, i) => (
                    <span key={i} className="jd-skill-tag">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Perks */}
            {job.perks && job.perks.length > 0 && (
              <div className="jd-section">
                <h2><Award size={16} /> Perks & Benefits</h2>
                <div className="jd-perks">
                  {job.perks.map((p, i) => (
                    <span key={i} className="jd-perk"><CheckCircle size={14} /> {p}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="jd-section">
              <h2><Share2 size={16} /> Share this Job</h2>
              <div className="share-btns">
                <button className="share-btn linkedin" onClick={() => handleShare('linkedin')}>Share on LinkedIn</button>
                <button className="share-btn twitter" onClick={() => handleShare('twitter')}>Share on Twitter</button>
                <button className="share-btn copy" onClick={() => handleShare('copy')}>Copy Link</button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="jd-sidebar">
            {/* Apply Card */}
            <div className="sidebar-card apply-card">
              <div className="sidebar-salary">💰 {job.salaryDisplay || job.salary}</div>
              <p className="sidebar-exp"><Briefcase size={14} /> {job.experienceLevel || '1-3 yrs'} experience</p>

              {currentUser?.role === 'employer' ? (
                isEmployerOwner ? (
                  <motion.button
                    className="sidebar-apply-btn"
                    style={{ background: '#f97316' }}
                    onClick={() => navigate('/employer-dashboard?tab=jobs')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    ⚙️ Manage Job in Dashboard
                  </motion.button>
                ) : (
                  <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', color: '#64748b', fontSize: '0.88rem' }}>
                    🏢 Employer Preview Mode
                  </div>
                )
              ) : currentUser?.role === 'admin' ? (
                <motion.button
                  className="sidebar-apply-btn"
                  style={{ background: '#475569' }}
                  onClick={() => navigate('/admin?tab=jobs')}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  🛡️ Moderate in Admin Panel
                </motion.button>
              ) : (
                <motion.button
                  className={`sidebar-apply-btn ${hasApplied ? 'applied' : ''}`}
                  onClick={handleApply}
                  whileHover={{ scale: hasApplied ? 1 : 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {hasApplied ? '✅ Already Applied' : '🚀 Apply Now'}
                </motion.button>
              )}

              {application && (
                <p className="sidebar-status">Status: <strong>{application.status}</strong></p>
              )}
            </div>

            {/* Company Info */}
            <div className="sidebar-card">
              <h3>About {job.company}</h3>
              <p className="company-about-text">{job.about}</p>
              {job.companySize && (
                <div className="company-stat"><Users size={13} /> {job.companySize}</div>
              )}
              {job.category && (
                <div className="company-stat"><Tag size={13} /> {job.category}</div>
              )}
              {job.companyWebsite && (
                <a href={job.companyWebsite} target="_blank" rel="noopener noreferrer" className="company-website">
                  <Globe size={13} /> Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <ApplicationModal isOpen={showModal} onClose={() => setShowModal(false)} job={job} />
    </Layout>
  );
};

export default JobDetailPage;
