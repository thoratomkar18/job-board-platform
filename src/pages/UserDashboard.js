import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  User, Mail, Phone, MapPin, Briefcase, BookmarkCheck,
  Settings, LogOut, Edit3, Save, X, FileText, Calendar,
  TrendingUp, Award, ChevronRight, Clock, IndianRupee, Video, Eye, ExternalLink,
  CheckCircle2, RefreshCw, Sparkles, ShieldCheck, Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApplications } from '../context/ApplicationContext';
import { useNotifications } from '../context/NotificationContext';
import Layout from '../components/Layout/Layout';
import ResumePreviewModal from '../components/ResumePreviewModal/ResumePreviewModal';
import RescheduleModal from '../components/RescheduleModal/RescheduleModal';
import OfferLetterModal from '../components/OfferLetterModal/OfferLetterModal';
import ApplicationProgressTracker from '../components/ApplicationProgressTracker/ApplicationProgressTracker';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../lib/calendarInvite';
import { openResumeInNewTab } from '../lib/resumePdf';
import './UserDashboard.css';

const TABS = [
  { id: 'profile',      label: 'My Profile',      icon: User },
  { id: 'applications', label: 'Applications',     icon: FileText },
  { id: 'saved',        label: 'Saved Jobs',       icon: BookmarkCheck },
  { id: 'settings',     label: 'Settings',         icon: Settings },
];

const STATUS_CONFIG = {
  pending:    { label: 'Pending Review',        color: '#f59e0b', bg: '#fffbeb' },
  reviewed:   { label: 'Under Review',          color: '#6366f1', bg: '#eef2ff' },
  shortlisted:{ label: 'Shortlisted ⭐',        color: '#10b981', bg: '#ecfdf5' },
  interview:  { label: 'Interview Scheduled',   color: '#0284c7', bg: '#f0f9ff' },
  offered:    { label: 'Job Offer Received! 📜', color: '#059669', bg: '#ecfdf5' },
  hired:      { label: 'Hired & Confirmed! 🎉',  color: '#16a34a', bg: '#dcfce7' },
  selected:   { label: 'Selected! 🎉',          color: '#059669', bg: '#d1fae5' },
  rejected:   { label: 'Not Selected',          color: '#ef4444', bg: '#fef2f2' },
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, logout, updateUser } = useAuth();
  const { preferences, updatePreferences } = useNotifications();
  const {
    getUserApplications,
    postedJobs,
    submitCandidateRsvp,
    respondToOffer
  } = useApplications();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'profile');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setActiveTab(t);
  }, [searchParams]);
  const [isEditing, setIsEditing] = useState(false);
  const [savedJobs, setSavedJobs] = useState([]);
  const [previewResumeApp, setPreviewResumeApp] = useState(null);
  const [rescheduleModalApp, setRescheduleModalApp] = useState(null);
  const [offerModalApp, setOfferModalApp] = useState(null);

  const [profileData, setProfileData] = useState({
    name:       currentUser?.name || '',
    email:      currentUser?.email || '',
    phone:      currentUser?.phone || '',
    location:   currentUser?.location || '',
    bio:        currentUser?.bio || '',
    skills:     Array.isArray(currentUser?.skills) ? currentUser.skills.join(', ') : (currentUser?.skills || ''),
    experience: currentUser?.experience || '',
    education:  currentUser?.education || '',
  });

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name:       currentUser.name || '',
        email:      currentUser.email || '',
        phone:      currentUser.phone || '',
        location:   currentUser.location || '',
        bio:        currentUser.bio || '',
        skills:     Array.isArray(currentUser.skills) ? currentUser.skills.join(', ') : (currentUser.skills || ''),
        experience: currentUser.experience || '',
        education:  currentUser.education || '',
      });
    }
  }, [currentUser]);

  const applications = getUserApplications();

  // Load bookmarks from localStorage
  useEffect(() => {
    if (currentUser?.id) {
      const key = `jobconnect_bookmarks_${currentUser.id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const ids = JSON.parse(raw).map(String);
          const allPool = (postedJobs || []).map(j => ({
            ...j,
            id: String(j.id || j._id),
            company: j.company || j.employerName || 'Company'
          }));
          const jobs = allPool.filter(j => ids.includes(j.id));
          // Deduplicate by id
          const seen = new Set();
          const unique = jobs.filter(j => {
            if (seen.has(j.id)) return false;
            seen.add(j.id);
            return true;
          });
          setSavedJobs(unique);
        } catch (e) { setSavedJobs([]); }
      }
    }
  }, [currentUser, postedJobs]);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    if (updateUser) updateUser(profileData);
    setIsEditing(false);
    toast.success('Profile updated successfully! 🎉');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out. See you soon! 👋');
    navigate('/');
  };

  const removeBookmark = (jobId) => {
    const targetJob = savedJobs.find(j => j.id === jobId);
    const key = `jobconnect_bookmarks_${currentUser.id}`;
    const raw = localStorage.getItem(key);
    const ids = raw ? JSON.parse(raw) : [];
    const updated = ids.filter(id => id !== jobId);
    localStorage.setItem(key, JSON.stringify(updated));
    setSavedJobs(prev => prev.filter(j => j.id !== jobId));
    toast.info(`Removed "${targetJob?.title || 'Job'}" from saved list`, {
      action: {
        label: 'Undo',
        onClick: () => {
          localStorage.setItem(key, JSON.stringify([...updated, jobId]));
          if (targetJob) setSavedJobs(prev => [targetJob, ...prev]);
          toast.success(`Restored "${targetJob?.title || 'Job'}"`);
        }
      }
    });
  };

  const handleConfirmRsvp = async (app) => {
    try {
      await submitCandidateRsvp(app.id, {
        rsvpStatus: 'accepted',
        note: 'Candidate accepted interview invitation and confirmed attendance.'
      });
      toast.success('Attendance confirmed! Recruiter has been notified. ✅');
    } catch (err) {
      toast.error('Failed to update RSVP: ' + err.message);
    }
  };

  const handleRescheduleSubmit = async (rsvpData) => {
    if (!rescheduleModalApp) return;
    try {
      await submitCandidateRsvp(rescheduleModalApp.id, rsvpData);
      toast.success('Reschedule request sent to recruiter! 🔄');
      setRescheduleModalApp(null);
    } catch (err) {
      toast.error('Failed to submit reschedule request: ' + err.message);
    }
  };

  const handleAcceptOffer = async (app) => {
    try {
      await respondToOffer(app.id, { action: 'accept' });
      toast.success('🎉 Congratulations! You have accepted the Job Offer! Welcome to the team!');
      setOfferModalApp(null);
    } catch (err) {
      toast.error('Failed to accept offer: ' + err.message);
    }
  };

  const handleDeclineOffer = async (declineReason) => {
    if (!offerModalApp) return;
    try {
      await respondToOffer(offerModalApp.id, { action: 'decline', declineReason });
      toast.info('Job offer declined.');
      setOfferModalApp(null);
    } catch (err) {
      toast.error('Failed to decline offer: ' + err.message);
    }
  };

  if (!currentUser) {
    return (
      <Layout>
        <div className="ud-auth-required">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="ud-auth-icon">🔐</div>
            <h2>Authentication Required</h2>
            <p>Please log in to access your dashboard.</p>
            <button className="ud-btn-primary" onClick={() => navigate('/')}>
              Go to Home
            </button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const interviewCount = applications.filter(a => a.status === 'interview').length;
  const hiredCount     = applications.filter(a => a.status === 'hired').length;

  return (
    <Layout>
      <div className="ud-page">
        {/* Banner */}
        <div className="ud-banner">
          <div className="ud-banner-inner">
            <motion.div
              className="ud-welcome"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="ud-avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
              <div>
                <h1>Namaste, {currentUser.name.split(' ')[0]}! 🙏</h1>
                <p>{currentUser.role === 'employer' ? '🏢 Employer Account' : '👤 Job Seeker'} &nbsp;·&nbsp; {currentUser.email}</p>
              </div>
            </motion.div>

            <motion.div
              className="ud-stats"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {[
                { label: 'Applications', value: applications.length, icon: FileText },
                { label: 'Interviews',   value: interviewCount,       icon: Calendar },
                { label: 'Hired',        value: hiredCount,           icon: Award },
                { label: 'Saved Jobs',   value: savedJobs.length,     icon: BookmarkCheck },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="ud-stat-card">
                  <Icon size={20} className="ud-stat-icon" />
                  <div className="ud-stat-num">{value}</div>
                  <div className="ud-stat-lbl">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Body */}
        <div className="ud-body">
          {/* Sidebar */}
          <aside className="ud-sidebar">
            <nav className="ud-nav">
              {TABS.map(({ id, label, icon: Icon }) => (
                <motion.button
                  key={id}
                  className={`ud-nav-item ${activeTab === id ? 'active' : ''}`}
                  onClick={() => setActiveTab(id)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {activeTab === id && <ChevronRight size={16} className="ud-nav-arrow" />}
                </motion.button>
              ))}
            </nav>

            <motion.button
              className="ud-logout-btn"
              onClick={handleLogout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <LogOut size={16} /> Sign Out
            </motion.button>
          </aside>

          {/* Main */}
          <main className="ud-main">
            <AnimatePresence mode="wait">

              {/* ── PROFILE TAB ── */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  className="ud-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="ud-section-header">
                    <div className="ud-section-title">
                      <User size={22} /> My Profile
                    </div>
                    <motion.button
                      className={`ud-btn ${isEditing ? 'ud-btn-danger' : 'ud-btn-primary'}`}
                      onClick={() => setIsEditing(!isEditing)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {isEditing ? <><X size={15} /> Cancel</> : <><Edit3 size={15} /> Edit Profile</>}
                    </motion.button>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleProfileUpdate} className="ud-profile-form">
                      <div className="ud-form-row">
                        <div className="ud-form-group">
                          <label>Full Name</label>
                          <div className="ud-input-wrap">
                            <User size={16} />
                            <input name="name" value={profileData.name} onChange={handleChange} required placeholder="Omkar Thorat" />
                          </div>
                        </div>
                        <div className="ud-form-group">
                          <label>Email</label>
                          <div className="ud-input-wrap">
                            <Mail size={16} />
                            <input name="email" type="email" value={profileData.email} onChange={handleChange} required />
                          </div>
                        </div>
                      </div>
                      <div className="ud-form-row">
                        <div className="ud-form-group">
                          <label>Phone</label>
                          <div className="ud-input-wrap">
                            <Phone size={16} />
                            <input name="phone" type="tel" value={profileData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
                          </div>
                        </div>
                        <div className="ud-form-group">
                          <label>Location</label>
                          <div className="ud-input-wrap">
                            <MapPin size={16} />
                            <input name="location" value={profileData.location} onChange={handleChange} placeholder="Bengaluru, Karnataka" />
                          </div>
                        </div>
                      </div>
                      <div className="ud-form-group">
                        <label>Bio / Summary</label>
                        <textarea name="bio" value={profileData.bio} onChange={handleChange} rows={3} placeholder="Tell recruiters about yourself..." />
                      </div>
                      <div className="ud-form-group">
                        <label>Skills (comma separated)</label>
                        <input name="skills" value={profileData.skills} onChange={handleChange} placeholder="React, Node.js, Python, SQL..." />
                      </div>
                      <div className="ud-form-group">
                        <label>Work Experience</label>
                        <textarea name="experience" value={profileData.experience} onChange={handleChange} rows={3} placeholder="e.g. 2 years at TCS as React Developer..." />
                      </div>
                      <div className="ud-form-group">
                        <label>Education</label>
                        <textarea name="education" value={profileData.education} onChange={handleChange} rows={2} placeholder="e.g. B.Tech CSE, IIT Delhi, 2022" />
                      </div>
                      <motion.button type="submit" className="ud-btn-primary ud-save-btn" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Save size={16} /> Save Changes
                      </motion.button>
                    </form>
                  ) : (
                    <div className="ud-profile-display">
                      <div className="ud-profile-hero">
                        <div className="ud-profile-avatar-large">
                          {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="ud-profile-hero-meta">
                          <h3>{currentUser.name}</h3>
                          <div className="ud-profile-hero-badges">
                            <span className="ud-role-pill">Job Seeker</span>
                            <span className="ud-verified-pill"><ShieldCheck size={12} /> Verified Profile</span>
                          </div>
                          <p className="ud-profile-hero-email">{currentUser.email}</p>
                        </div>
                      </div>

                      <div className="ud-info-grid">
                        {[
                          { label: 'Full Name',  value: currentUser.name,          icon: User },
                          { label: 'Email',      value: currentUser.email,         icon: Mail },
                          { label: 'Phone',      value: profileData.phone || '—', icon: Phone },
                          { label: 'Location',   value: profileData.location || '—', icon: MapPin },
                        ].map(({ label, value, icon: Icon }) => (
                          <div key={label} className="ud-info-row">
                            <Icon size={16} className="ud-info-icon" />
                            <div>
                              <span className="ud-info-label">{label}</span>
                              <span className="ud-info-value">{value}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {profileData.bio && (
                        <div className="ud-profile-card">
                          <h4>About Me</h4>
                          <p>{profileData.bio}</p>
                        </div>
                      )}
                      {Boolean(profileData.skills && (Array.isArray(profileData.skills) ? profileData.skills.length > 0 : String(profileData.skills).trim())) && (
                        <div className="ud-profile-card">
                          <h4>Skills</h4>
                          <div className="ud-skills-wrap">
                            {(Array.isArray(profileData.skills)
                              ? profileData.skills
                              : String(profileData.skills).split(',')
                            ).map(s => String(s).trim()).filter(Boolean).map(s => (
                              <span key={s} className="ud-skill-tag">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {profileData.experience && (
                        <div className="ud-profile-card">
                          <h4>Experience</h4>
                          <p>{profileData.experience}</p>
                        </div>
                      )}
                      {profileData.education && (
                        <div className="ud-profile-card">
                          <h4>Education</h4>
                          <p>{profileData.education}</p>
                        </div>
                      )}
                      {!profileData.bio && !profileData.skills && !profileData.experience && (
                        <div className="ud-profile-empty">
                          <Edit3 size={32} />
                          <p>Your profile looks a bit empty! Add your bio, skills and experience to stand out to employers.</p>
                          <button className="ud-btn-primary" onClick={() => setIsEditing(true)}>
                            <Edit3 size={14} /> Complete Profile
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── APPLICATIONS TAB ── */}
              {activeTab === 'applications' && (
                <motion.div
                  key="applications"
                  className="ud-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="ud-section-header">
                    <div className="ud-section-title"><FileText size={22} /> My Applications</div>
                    <span className="ud-badge">{applications.length} total</span>
                  </div>

                  {applications.length === 0 ? (
                    <div className="ud-empty">
                      <FileText size={48} className="ud-empty-icon" />
                      <h3>Koi Application Nahi Mili</h3>
                      <p>You haven't applied to any jobs yet. Start browsing and apply to your dream companies!</p>
                      <motion.button className="ud-btn-primary" onClick={() => navigate('/browse')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Briefcase size={15} /> Browse Jobs
                      </motion.button>
                    </div>
                  ) : (
                    <div className="ud-app-list">
                      {applications.map((app, i) => {
                        const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                        return (
                          <motion.div
                            key={app.id}
                            className="ud-app-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(99,102,241,0.1)' }}
                          >
                            <div className="ud-app-main-row">
                              <div className="ud-app-left">
                                <div className="ud-app-logo">{(app.companyName || 'C').charAt(0)}</div>
                                <div>
                                  <h3 className="ud-app-title">{app.jobTitle}</h3>
                                  <p className="ud-app-company">{app.companyName}</p>
                                  <div className="ud-app-meta">
                                    <span><Calendar size={13} /> Applied: {new Date(app.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    {app.expectedSalary && <span><IndianRupee size={13} /> Expected: {app.expectedSalary}</span>}
                                    {app.resumeFileName && (
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <button
                                          type="button"
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            background: '#f1f5f9',
                                            border: '1px solid #cbd5e1',
                                            color: '#1e293b',
                                            borderRadius: '6px',
                                            padding: '2px 8px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                          }}
                                          onClick={() => setPreviewResumeApp(app)}
                                          title="Preview resume in modal"
                                        >
                                          <FileText size={12} color="#ea580c" />
                                          <span>{app.resumeFileName}</span>
                                          <Eye size={11} color="#64748b" />
                                        </button>
                                        <button
                                          type="button"
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            background: 'none',
                                            border: 'none',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            padding: '2px'
                                          }}
                                          onClick={() => openResumeInNewTab(app)}
                                          title="Open resume in another browser tab"
                                        >
                                          <ExternalLink size={13} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="ud-app-status" style={{ color: cfg.color, background: cfg.bg }}>
                                {cfg.label}
                              </div>
                            </div>

                            {/* Application Lifecycle & Stages Tracker (1, 2, 3...) */}
                            <ApplicationProgressTracker application={app} defaultExpanded={true} />

                            {/* Interview details if status is interview */}
                            {app.status === 'interview' && (
                              <div className="ud-app-interview-box">
                                <div className="ud-interview-header">
                                  <Calendar size={15} className="ud-interview-icon" />
                                  <strong>{app.interviewRound || 'Interview Scheduled'}</strong>
                                </div>
                                <div className="ud-interview-body">
                                  {app.interviewDate && (
                                    <span>📅 <strong>Date:</strong> {app.interviewDate} at {app.interviewTime || '14:00'} IST</span>
                                  )}
                                  {app.interviewMode && (
                                    <span>📍 <strong>Mode:</strong> {app.interviewMode}</span>
                                  )}
                                  {app.interviewLink && (
                                    <a
                                      href={app.interviewLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="ud-interview-join-btn"
                                    >
                                      <Video size={13} /> Join Interview
                                    </a>
                                  )}
                                </div>

                                {/* Calendar Sync Shortcut */}
                                <div className="ud-cal-sync-row">
                                  <span className="ud-cal-sync-label"><Clock size={12} /> Add to Calendar:</span>
                                  <a
                                    href={generateGoogleCalendarUrl({
                                      title: `Interview: ${app.jobTitle} at ${app.companyName}`,
                                      description: `Interview round: ${app.interviewRound || 'Technical Round'}. Mode: ${app.interviewMode || 'Google Meet'}. Meeting Link: ${app.interviewLink || 'Online'}`,
                                      location: app.interviewMode || 'Google Meet',
                                      date: app.interviewDate,
                                      time: app.interviewTime
                                    })}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ud-cal-pill-link"
                                  >
                                    <Calendar size={12} /> Google Calendar
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => downloadIcsFile({
                                      title: `Interview: ${app.jobTitle} at ${app.companyName}`,
                                      description: `Interview round: ${app.interviewRound || 'Technical Round'}. Mode: ${app.interviewMode || 'Google Meet'}. Meeting Link: ${app.interviewLink || 'Online'}`,
                                      location: app.interviewMode || 'Google Meet',
                                      date: app.interviewDate,
                                      time: app.interviewTime,
                                      fileName: `${(app.companyName || 'Interview').replace(/\s+/g, '_')}_Invite.ics`
                                    })}
                                    className="ud-cal-pill-btn"
                                  >
                                    <Download size={12} /> .ICS File
                                  </button>
                                </div>

                                {app.employerNote && (
                                  <div className="ud-interview-note">
                                    <strong>Recruiter's Note:</strong> {app.employerNote}
                                  </div>
                                )}

                                {/* Candidate RSVP Attendance Action Bar */}
                                <div className="ud-rsvp-section">
                                  {app.candidateRsvp?.status === 'accepted' ? (
                                    <div className="ud-rsvp-badge-confirmed">
                                      <CheckCircle2 size={14} /> You confirmed attendance for this interview slot.
                                    </div>
                                  ) : app.candidateRsvp?.status === 'reschedule_requested' ? (
                                    <div className="ud-rsvp-badge-rescheduled">
                                      <RefreshCw size={14} /> Reschedule requested: Proposed {app.candidateRsvp.proposedDate} at {app.candidateRsvp.proposedTime}. Awaiting recruiter confirmation.
                                    </div>
                                  ) : (
                                    <div className="ud-rsvp-action-bar">
                                      <span className="ud-rsvp-prompt">Confirm Your Attendance:</span>
                                      <div className="ud-rsvp-buttons">
                                        <button
                                          type="button"
                                          className="ud-btn-rsvp-accept"
                                          onClick={() => handleConfirmRsvp(app)}
                                        >
                                          <CheckCircle2 size={13} /> Accept & Confirm
                                        </button>
                                        <button
                                          type="button"
                                          className="ud-btn-rsvp-resched"
                                          onClick={() => setRescheduleModalApp(app)}
                                        >
                                          <RefreshCw size={13} /> Request Reschedule
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Previous Round Timeline History */}
                                {app.interviewHistory && app.interviewHistory.length > 0 && (
                                  <div className="ud-round-history">
                                    <span className="ud-history-title">Interview Pipeline History:</span>
                                    <div className="ud-history-pills">
                                      {app.interviewHistory.map((h, hIdx) => (
                                        <div key={hIdx} className="ud-history-pill">
                                          <span className="ud-hpill-name">{h.round}</span>
                                          <span className={`ud-hpill-status ${h.status}`}>{h.status}</span>
                                          {h.scorecard?.overallScore > 0 && (
                                            <span className="ud-hpill-score">Score: {h.scorecard.overallScore}/5</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Job Offer Received Box */}
                            {app.status === 'offered' && (
                              <div className="ud-app-offer-box">
                                <div className="ud-offer-box-header">
                                  <div className="ud-offer-icon-badge">
                                    <Sparkles size={18} />
                                  </div>
                                  <div>
                                    <h4 className="ud-offer-title">🎉 Formal Job Offer Extended!</h4>
                                    <p className="ud-offer-sub">
                                      {app.companyName} has offered you the role of <strong>{app.jobTitle}</strong>.
                                    </p>
                                  </div>
                                </div>

                                <div className="ud-offer-details-row">
                                  <div className="ud-offer-detail-chip">
                                    <IndianRupee size={13} />
                                    <span>CTC: <strong>{app.offerDetails?.ctc || '₹22,00,000 / yr'}</strong></span>
                                  </div>
                                  <div className="ud-offer-detail-chip">
                                    <Calendar size={13} />
                                    <span>Joining: <strong>{app.offerDetails?.joiningDate || 'Immediate'}</strong></span>
                                  </div>
                                  <div className="ud-offer-detail-chip">
                                    <MapPin size={13} />
                                    <span>{app.offerDetails?.location || 'Hybrid / Remote'}</span>
                                  </div>
                                </div>

                                <div className="ud-offer-actions-row">
                                  <button
                                    type="button"
                                    className="ud-offer-btn-primary"
                                    onClick={() => setOfferModalApp(app)}
                                  >
                                    <FileText size={15} /> Review &amp; Sign Offer Letter
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Hired & Confirmed Banner */}
                            {app.status === 'hired' && (
                              <div className="ud-app-hired-box">
                                <div className="ud-hired-box-header">
                                  <div className="ud-hired-icon-badge">
                                    <Award size={20} />
                                  </div>
                                  <div>
                                    <h4 className="ud-hired-title">🏆 You Are Officially HIRED!</h4>
                                    <p className="ud-hired-sub">
                                      Welcome to <strong>{app.companyName}</strong> as <strong>{app.jobTitle}</strong>.
                                      Proposed Joining Date: <strong>{app.offerDetails?.joiningDate || 'Within 15 Days'}</strong>.
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="ud-hired-btn-view"
                                  onClick={() => setOfferModalApp(app)}
                                >
                                  <ShieldCheck size={15} /> View Signed Offer Letter
                                </button>
                              </div>
                            )}

                            {/* Selected Celebration Banner */}
                            {app.status === 'selected' && (
                              <div className="ud-app-selected-box">
                                <strong>🎉 Congratulations!</strong> You have been selected for this role. The hiring manager is preparing your official offer letter.
                              </div>
                            )}

                            {/* Shortlisted Banner */}
                            {app.status === 'shortlisted' && (
                              <div className="ud-app-shortlisted-box">
                                <strong>⭐ Profile Shortlisted!</strong> Your resume has cleared the screening round. Our team will reach out with the interview schedule shortly.
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── SAVED JOBS TAB ── */}
              {activeTab === 'saved' && (
                <motion.div
                  key="saved"
                  className="ud-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="ud-section-header">
                    <div className="ud-section-title"><BookmarkCheck size={22} /> Saved Jobs</div>
                    <span className="ud-badge">{savedJobs.length} saved</span>
                  </div>

                  {savedJobs.length === 0 ? (
                    <div className="ud-empty">
                      <BookmarkCheck size={48} className="ud-empty-icon" />
                      <h3>No Saved Jobs Yet</h3>
                      <p>Bookmark jobs from the listing page and they'll appear here for quick access.</p>
                      <motion.button className="ud-btn-primary" onClick={() => navigate('/browse')} whileHover={{ scale: 1.03 }}>
                        <Briefcase size={15} /> Find Jobs to Save
                      </motion.button>
                    </div>
                  ) : (
                    <div className="ud-saved-grid">
                      {savedJobs.map((job, i) => (
                        <motion.div
                          key={job.id}
                          className="ud-saved-card"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(99,102,241,0.12)' }}
                        >
                          <div className="ud-saved-top">
                            <div className="ud-saved-logo">{job.company.charAt(0)}</div>
                            <button className="ud-unsave-btn" onClick={() => removeBookmark(job.id)} title="Remove bookmark">
                              <X size={14} />
                            </button>
                          </div>
                          <h3 className="ud-saved-title">{job.title}</h3>
                          <p className="ud-saved-company">{job.company}</p>
                          <div className="ud-saved-meta">
                            <span><MapPin size={12} /> {job.location}</span>
                            <span><IndianRupee size={12} /> {job.salaryDisplay}</span>
                          </div>
                          <div className="ud-saved-actions">
                            <motion.button
                              className="ud-btn-primary ud-view-btn"
                              onClick={() => navigate(`/job/${job.id}`)}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              View Job <ChevronRight size={14} />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── SETTINGS TAB ── */}
              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  className="ud-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="ud-section-header">
                    <div className="ud-section-title"><Settings size={22} /> Account Settings</div>
                  </div>

                  <div className="ud-settings-card">
                    <h4>Account Information</h4>
                    <div className="ud-settings-row">
                      <div>
                        <p className="ud-settings-label">Account Type</p>
                        <p className="ud-settings-val">{currentUser.role === 'employer' ? 'Employer' : 'Job Seeker'}</p>
                      </div>
                      <TrendingUp size={20} className="ud-settings-icon" />
                    </div>
                    <div className="ud-settings-row">
                      <div>
                        <p className="ud-settings-label">Member Since</p>
                        <p className="ud-settings-val">{currentUser.joinedDate || 'Recently joined'}</p>
                      </div>
                      <Clock size={20} className="ud-settings-icon" />
                    </div>
                    <div className="ud-settings-row">
                      <div>
                        <p className="ud-settings-label">Email</p>
                        <p className="ud-settings-val">{currentUser.email}</p>
                      </div>
                      <Mail size={20} className="ud-settings-icon" />
                    </div>
                  </div>

                  <div className="ud-settings-card">
                    <h4>Email & Notification Preferences</h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '-6px 0 16px 0' }}>Control what updates you receive via email and real-time dashboard notifications.</p>

                    {[
                      { key: 'emailNotifications', label: 'Master Email Notifications', desc: 'Allow JobConnect to send transactional emails to your inbox' },
                      { key: 'applicationUpdates', label: 'Application Status Alerts', desc: 'Updates when employer reviews, shortlists, or extends offers' },
                      { key: 'interviewUpdates',   label: 'Interview & Schedule Reminders', desc: 'Calendar invitations, video room links, and round scheduling' },
                      { key: 'jobAlerts',          label: 'Matching Job Recommendations', desc: 'Instant alerts when companies post jobs matching your skills' },
                      { key: 'messages',           label: 'Messages & Employer Inquiries', desc: 'Direct communications from recruiters and talent leads' },
                      { key: 'marketingEmails',    label: 'Platform Digest & Career News', desc: 'Occasional hiring trends and platform updates' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="ud-settings-row" style={{ alignItems: 'center' }}>
                        <div>
                          <p className="ud-settings-label" style={{ fontWeight: 600, color: '#1e293b' }}>{label}</p>
                          <p className="ud-settings-val" style={{ fontSize: '0.8rem', color: '#64748b' }}>{desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences ? preferences[key] !== false : true}
                          onChange={(e) => updatePreferences && updatePreferences({ ...preferences, [key]: e.target.checked })}
                          style={{ width: '20px', height: '20px', accentColor: '#4f46e5', cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="ud-settings-card ud-settings-danger">
                    <h4>Danger Zone</h4>
                    <div className="ud-settings-row">
                      <div>
                        <p className="ud-settings-label">Sign out of your account</p>
                        <p className="ud-settings-val" style={{ color: '#ef4444' }}>You'll need to log in again to access your dashboard.</p>
                      </div>
                      <motion.button
                        className="ud-danger-btn"
                        onClick={handleLogout}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <LogOut size={15} /> Sign Out
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Resume Document Preview Modal */}
      {previewResumeApp && (
        <ResumePreviewModal
          isOpen={Boolean(previewResumeApp)}
          onClose={() => setPreviewResumeApp(null)}
          application={previewResumeApp}
        />
      )}

      {/* Candidate Interview Reschedule Request Modal */}
      {rescheduleModalApp && (
        <RescheduleModal
          isOpen={Boolean(rescheduleModalApp)}
          onClose={() => setRescheduleModalApp(null)}
          onSubmit={handleRescheduleSubmit}
          application={rescheduleModalApp}
        />
      )}

      {/* Formal Job Offer Letter View / Decision Modal */}
      {offerModalApp && (
        <OfferLetterModal
          isOpen={Boolean(offerModalApp)}
          onClose={() => setOfferModalApp(null)}
          application={offerModalApp}
          isCandidate={true}
          onAccept={() => handleAcceptOffer(offerModalApp)}
          onDecline={handleDeclineOffer}
        />
      )}
    </Layout>
  );
};

export default UserDashboard;
