import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Briefcase, Plus, Eye, Users, TrendingUp, Trash2,
  PauseCircle, PlayCircle, ChevronRight, Settings, LogOut,
  BarChart3, FileText, IndianRupee, MapPin, Clock, Building2,
  XCircle, Calendar, Mail, Phone, Star,
  ChevronDown, ChevronUp, MessageSquare, UserCheck, Video, X, ExternalLink,
  Award, ShieldCheck, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApplications } from '../context/ApplicationContext';
import { useNotifications } from '../context/NotificationContext';
import Layout from '../components/Layout/Layout';
import ResumePreviewModal from '../components/ResumePreviewModal/ResumePreviewModal';
import ScorecardModal from '../components/ScorecardModal/ScorecardModal';
import IssueOfferModal from '../components/IssueOfferModal/IssueOfferModal';
import OfferLetterModal from '../components/OfferLetterModal/OfferLetterModal';
import ApplicationProgressTracker from '../components/ApplicationProgressTracker/ApplicationProgressTracker';
import HoldToConfirmButton from '../components/ui/HoldToConfirmButton';
import { openResumeInNewTab } from '../lib/resumePdf';
import './EmployerDashboard.css';

const TABS = [
  { id: 'overview',    label: 'Overview',     icon: BarChart3 },
  { id: 'jobs',        label: 'My Jobs',      icon: Briefcase },
  { id: 'candidates',  label: 'Candidates',   icon: Users },
  { id: 'post-job',    label: 'Post a Job',   icon: Plus },
  { id: 'settings',    label: 'Settings',     icon: Settings },
];

const STATUS_CONFIG = {
  pending:    { label: 'Pending Review',      color: '#f59e0b', bg: '#fffbeb', icon: Clock },
  reviewed:   { label: 'Under Review',        color: '#6366f1', bg: '#eef2ff', icon: Eye },
  shortlisted:{ label: 'Shortlisted ✅',      color: '#10b981', bg: '#ecfdf5', icon: Star },
  interview:  { label: 'Interview Scheduled', color: '#0ea5e9', bg: '#f0f9ff', icon: Calendar },
  offered:    { label: 'Offer Extended 📜',   color: '#059669', bg: '#ecfdf5', icon: Award },
  hired:      { label: 'Hired & Accepted! 🎉', color: '#16a34a', bg: '#dcfce7', icon: UserCheck },
  selected:   { label: 'Selected! 🎉',        color: '#059669', bg: '#d1fae5', icon: UserCheck },
  rejected:   { label: 'Not Selected',        color: '#ef4444', bg: '#fef2f2', icon: XCircle },
};


// ─────────────────────────────────────────────────
// Application Card (inside Candidates tab)
// ─────────────────────────────────────────────────
const ApplicationCard = ({
  app,
  onStatusChange,
  onSchedule,
  pushNotification,
  onPreviewResume,
  onOpenScorecard,
  onIssueOffer,
  onPreviewOffer,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(app.employerNote || '');
  const [saving, setSaving] = useState(false);
  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const handleUpdate = async (newStatus) => {
    if (newStatus === 'interview') {
      onSchedule(app);
      return;
    }
    if (newStatus === 'offer') {
      onIssueOffer(app);
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    onStatusChange(app.id, newStatus, { employerNote: note });

    // Push real-time notification to applicant
    if (pushNotification && app.applicantId) {
      const notifMap = {
        shortlisted: {
          title: '⭐ Application Shortlisted!',
          message: `Great news! You have been shortlisted for ${app.jobTitle} at ${app.companyName || 'CloudTech India'}.`,
        },
        selected: {
          title: '🎉 Selected for the Role!',
          message: `Congratulations! You have been selected for the position of ${app.jobTitle} at ${app.companyName || 'CloudTech India'}!`,
        },
        rejected: {
          title: 'Application Status Update',
          message: `Thank you for your interest in ${app.jobTitle}. The team has decided to move forward with other candidates.`,
        },
        reviewed: {
          title: 'Application Under Review 👁️',
          message: `Your application for ${app.jobTitle} is being reviewed by the hiring team.`,
        },
      };
      if (notifMap[newStatus]) {
        pushNotification(app.applicantId, {
          type: newStatus,
          title: notifMap[newStatus].title,
          message: notifMap[newStatus].message,
          link: '/dashboard',
        });
      }
    }

    setSaving(false);
    const labels = {
      shortlisted: '⭐ Candidate shortlisted & notified!',
      selected:    '🎉 Candidate marked as Selected & notified!',
      rejected:    'Application marked as Not Selected.',
      reviewed:    'Application marked as Under Review.',
    };
    toast.success(labels[newStatus] || 'Status updated.');
  };

  return (
    <motion.div
      className="ed-app-card"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(249,115,22,0.08)' }}
    >
      {/* Header row */}
      <div className="ed-app-header">
        <div className="ed-app-avatar">{(app.applicantName || app.applicantId?.name || 'Candidate').charAt(0).toUpperCase()}</div>
        <div className="ed-app-identity">
          <h3 className="ed-app-name">{app.applicantName || app.applicantId?.name || 'Candidate'}</h3>
          <div className="ed-app-meta-row">
            <span><Mail size={13} /> {app.applicantEmail || app.applicantId?.email || 'No email provided'}</span>
            {app.applicantPhone && <span><Phone size={13} /> {app.applicantPhone}</span>}
            <span><Briefcase size={13} /> Applied for: <strong>{app.jobTitle || app.jobId?.title || 'Job Opening'}</strong></span>
          </div>
          <div className="ed-app-meta-row" style={{ marginTop: '0.3rem' }}>
            <span><Clock size={13} /> {new Date(app.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            {app.expectedSalary && <span><IndianRupee size={13} /> Expected: {app.expectedSalary}</span>}
          </div>
        </div>

        {/* Status pill + expand toggle */}
        <div className="ed-app-right">
          <div className="ed-app-status-pill" style={{ color: cfg.color, background: cfg.bg }}>
            <StatusIcon size={13} /> {cfg.label}
          </div>
          <motion.button
            className="ed-expand-btn"
            onClick={() => setExpanded(e => !e)}
            whileTap={{ scale: 0.95 }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? 'Less' : 'View Details'}
          </motion.button>
        </div>
      </div>

      {/* Skills */}
      {app.applicantSkills?.length > 0 && (
        <div className="ed-app-skills">
          {app.applicantSkills.map(s => <span key={s} className="ed-skill-tag">{s}</span>)}
        </div>
      )}

      {/* Resume Bar */}
      <div className="ed-app-resume-bar">
        <div className="ed-resume-info">
          <FileText size={15} className="ed-resume-icon" />
          <span className="ed-resume-filename">{app.resumeFileName || `${(app.applicantName || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`}</span>
          <span className="ed-resume-filesize">({app.resumeFileSize || '1.2 MB'})</span>
        </div>
        <div className="ed-resume-btn-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="ed-view-resume-action"
            onClick={() => onPreviewResume ? onPreviewResume({
              ...app,
              resumeFileName: app.resumeFileName || `${(app.applicantName || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`,
              resumeFileSize: app.resumeFileSize || '1.2 MB'
            }) : null}
            title="Preview resume in modal"
          >
            <Eye size={13} /> Preview
          </button>
          <button
            type="button"
            className="ed-view-resume-action ed-new-tab-btn"
            onClick={() => {
              const ok = openResumeInNewTab({
                ...app,
                resumeFileName: app.resumeFileName || `${(app.applicantName || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`,
                resumeFileSize: app.resumeFileSize || '1.2 MB'
              });
              if (!ok) toast.info('Popup blocked. Please allow popups or use the Preview modal.');
            }}
            title="Open resume in another browser tab"
          >
            <ExternalLink size={13} /> Open in Tab
          </button>
        </div>
      </div>

      {/* Application Stage & Lifecycle Tracker */}
      <ApplicationProgressTracker application={app} defaultExpanded={false} />

      {/* Interview Details Banner if scheduled */}
      {app.status === 'interview' && app.interviewDate && (
        <div className="ed-app-interview-banner">
          <div className="ed-interview-banner-top">
            <div className="ed-round-header-left">
              <Calendar size={14} />
              <strong>Interview Scheduled: {app.interviewRound || 'Round 1'}</strong>
            </div>

            {/* Candidate RSVP Pill */}
            {app.candidateRsvp?.status === 'accepted' ? (
              <span className="ed-rsvp-badge confirmed">
                <CheckCircle2 size={12} /> Candidate Confirmed Attendance ✅
              </span>
            ) : app.candidateRsvp?.status === 'reschedule_requested' ? (
              <span className="ed-rsvp-badge resched-alert">
                <RefreshCw size={12} /> Reschedule Requested
              </span>
            ) : (
              <span className="ed-rsvp-badge pending">
                <Clock size={12} /> Awaiting Candidate RSVP
              </span>
            )}
          </div>

          <div className="ed-interview-banner-details">
            <span>📅 {app.interviewDate} at {app.interviewTime || '14:00'} IST</span>
            <span>📍 {app.interviewMode || 'Google Meet'}</span>
            {app.interviewLink && (
              <a href={app.interviewLink} target="_blank" rel="noreferrer" className="ed-interview-link">
                <Video size={13} /> Open Meeting
              </a>
            )}
          </div>

          {/* Reschedule alert banner if candidate requested alternative */}
          {app.candidateRsvp?.status === 'reschedule_requested' && (
            <div className="ed-resched-action-card">
              <div className="ed-resched-card-text">
                <strong><RefreshCw size={13} /> Candidate Proposed New Slot:</strong>
                <p>
                  📅 <strong>{app.candidateRsvp.proposedDate}</strong> at <strong>{app.candidateRsvp.proposedTime} IST</strong>
                  {app.candidateRsvp.note && <span> &middot; "{app.candidateRsvp.note}"</span>}
                </p>
              </div>
              <button
                type="button"
                className="ed-btn-accept-resched"
                onClick={() => onSchedule(app, false, {
                  date: app.candidateRsvp.proposedDate,
                  time: app.candidateRsvp.proposedTime,
                  note: `Rescheduled to candidate requested slot: ${app.candidateRsvp.proposedDate} at ${app.candidateRsvp.proposedTime}`,
                })}
              >
                Accept &amp; Reschedule
              </button>
            </div>
          )}

          {/* Interview Evaluation Scorecard Summary if already evaluated */}
          {app.interviewHistory?.some(h => h.scorecard?.overallScore > 0) && (
            <div className="ed-scorecard-summary-strip">
              <div className="ed-sc-strip-left">
                <Star size={13} fill="#f59e0b" stroke="#f59e0b" />
                <span>
                  Latest Evaluation: <strong>{app.interviewHistory.slice(-1)[0]?.scorecard?.overallScore}/5.0</strong>
                </span>
                <span className="ed-sc-rec-badge">
                  {app.interviewHistory.slice(-1)[0]?.scorecard?.recommendation}
                </span>
              </div>
              {app.interviewHistory.slice(-1)[0]?.scorecard?.feedback && (
                <p className="ed-sc-fb-text">"{app.interviewHistory.slice(-1)[0]?.scorecard?.feedback}"</p>
              )}
            </div>
          )}

          {/* Interview Action Controls: Scorecard, Next Round, Make Offer */}
          <div className="ed-interview-pipeline-actions">
            <button
              type="button"
              className="ed-pip-btn ed-pip-scorecard"
              onClick={() => onOpenScorecard(app)}
              title="Evaluate candidate and submit star rating scorecard"
            >
              <Star size={13} /> {app.interviewHistory?.some(h => h.scorecard?.overallScore > 0) ? 'Edit Scorecard ⭐' : 'Submit Scorecard ⭐'}
            </button>
            <button
              type="button"
              className="ed-pip-btn ed-pip-nextround"
              onClick={() => onSchedule(app, true)}
              title="Advance candidate to Round 2 / Managerial Round"
            >
              <Plus size={13} /> Schedule Next Round
            </button>
            <button
              type="button"
              className="ed-pip-btn ed-pip-offer"
              onClick={() => onIssueOffer(app)}
              title="Release formal job offer letter"
            >
              <Award size={13} /> Release Job Offer 📜
            </button>
          </div>
        </div>
      )}

      {/* Formal Job Offer Released Banner */}
      {app.status === 'offered' && (
        <div className="ed-app-offered-banner">
          <div className="ed-offered-left">
            <div className="ed-offered-icon-wrap"><Award size={20} /></div>
            <div>
              <strong className="ed-offered-title">Formal Job Offer Extended ({app.offerDetails?.ctc || '₹22,00,000 / yr'})</strong>
              <p className="ed-offered-sub">
                Issued on {new Date(app.offerDetails?.issuedDate || Date.now()).toLocaleDateString('en-IN')}. Proposed Joining: <strong>{app.offerDetails?.joiningDate || 'Immediate'}</strong>. Awaiting candidate signature.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ed-btn-view-offer"
            onClick={() => onPreviewOffer(app)}
          >
            <FileText size={13} /> View Offer Letter 📜
          </button>
        </div>
      )}

      {/* Candidate Formally Hired Banner */}
      {app.status === 'hired' && (
        <div className="ed-app-hired-banner">
          <div className="ed-hired-left">
            <div className="ed-hired-icon-wrap"><UserCheck size={20} /></div>
            <div>
              <strong className="ed-hired-title">🎉 Candidate Officially HIRED!</strong>
              <p className="ed-hired-sub">
                {app.applicantName} accepted the offer for <strong>{app.jobTitle}</strong>.
                Joining Date: <strong>{app.offerDetails?.joiningDate || 'Immediate'}</strong> &middot; CTC: {app.offerDetails?.ctc}.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ed-btn-view-offer"
            onClick={() => onPreviewOffer(app)}
          >
            <ShieldCheck size={13} /> View Signed Offer 📜
          </button>
        </div>
      )}

      {/* Expanded section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="ed-app-expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {app.coverLetter && (
              <div className="ed-app-section">
                <h4><MessageSquare size={15} /> Cover Letter</h4>
                <p className="ed-cover-letter">{app.coverLetter}</p>
              </div>
            )}

            {/* Employer note */}
            <div className="ed-app-section">
              <h4><FileText size={15} /> Internal Note</h4>
              <textarea
                className="ed-note-input"
                rows={2}
                placeholder="Add an internal note about this candidate..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {/* Action buttons */}
            <div className="ed-app-actions">
              <p className="ed-actions-label">Update Status:</p>
              <div className="ed-action-btns">
                {[
                  { key: 'reviewed',    label: 'Mark Reviewed',   cls: 'reviewed' },
                  { key: 'shortlisted', label: '⭐ Shortlist',    cls: 'shortlisted' },
                  { key: 'interview',   label: '📅 Schedule Interview', cls: 'interview' },
                  { key: 'offer',       label: '📜 Release Offer', cls: 'offer' },
                  { key: 'selected',    label: '🎉 Select',       cls: 'selected' },
                  { key: 'rejected',    label: 'Reject',          cls: 'rejected' },
                ].map(({ key, label, cls }) => (
                  <motion.button
                    key={key}
                    className={`ed-act-btn ed-act-${cls} ${app.status === key ? 'active' : ''}`}
                    onClick={() => handleUpdate(key)}
                    disabled={saving || (key !== 'interview' && key !== 'offer' && app.status === key)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Previous employer note display */}
            {app.employerNote && (
              <div className="ed-prev-note">
                <strong>📝 Saved Note:</strong> {app.employerNote}
                {app.updatedAt && <span className="ed-note-time"> · Updated {new Date(app.updatedAt).toLocaleString('en-IN')}</span>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────
const EmployerDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, logout } = useAuth();
  const { pushNotification, preferences, updatePreferences } = useNotifications();
  const {
    postJob, getEmployerJobs, toggleJobStatus, deleteJob,
    getEmployerApplications, getApplicationsForJob, updateApplicationStatus,
    submitInterviewScorecard, scheduleNextRound, issueJobOffer,
  } = useApplications();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setActiveTab(t);
  }, [searchParams]);
  const [newJob, setNewJob]       = useState({
    title: '', location: '', type: 'Full-time', salary: '',
    company: currentUser?.company || 'CloudTech India Pvt. Ltd.',
    companyWebsite: currentUser?.website || 'https://cloudtech.in',
    description: '', requirements: '', skills: '', experienceLevel: '3-5 yrs',
  });
  const [posting, setPosting]     = useState(false);
  const [candidatesFilter, setCandidatesFilter] = useState('all'); // 'all' | jobId

  // Modal states
  const [previewResumeApp, setPreviewResumeApp] = useState(null);
  const [scheduleModalApp, setScheduleModalApp] = useState(null);
  const [scorecardModalApp, setScorecardModalApp] = useState(null);
  const [issueOfferModalApp, setIssueOfferModalApp] = useState(null);
  const [previewOfferModalApp, setPreviewOfferModalApp] = useState(null);

  const [scheduleForm, setScheduleForm] = useState({
    round: 'Technical Round 1',
    date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    time: '14:30',
    mode: 'Google Meet',
    link: 'https://meet.google.com/jbc-tech-interview',
    note: 'Please have your code editor and a quiet environment ready.',
    isNextRound: false,
  });

  const handleLogout = () => { logout(); toast.success('Logged out. See you soon! 👋'); navigate('/'); };

  // Derive data
  const employerJobs       = getEmployerJobs();
  const allApplications    = getEmployerApplications();
  const totalApplicants    = allApplications.length;
  const totalViews         = employerJobs.reduce((s, j) => s + (j.views || 0), 0);
  const activeJobsCount    = employerJobs.filter(j => j.status === 'active').length;

  const displayedApps = candidatesFilter === 'all'
    ? allApplications
    : getApplicationsForJob(candidatesFilter);

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!newJob.title.trim() || !newJob.location.trim() || !newJob.salary.trim()) {
      toast.error('Please fill in all required fields (title, location, salary).');
      return;
    }
    setPosting(true);
    await new Promise(r => setTimeout(r, 600));
    postJob({
      ...newJob,
      company: newJob.company || currentUser?.company || 'CloudTech India Pvt. Ltd.',
      companyWebsite: newJob.companyWebsite || currentUser?.website || 'https://cloudtech.in',
    });
    if (pushNotification && currentUser?.id) {
      pushNotification(currentUser.id, {
        type: 'job_posted',
        title: 'Job Posted Successfully 🚀',
        message: `"${newJob.title}" has been published and is now open for applications.`,
        link: '/employer-dashboard',
      });
    }
    setNewJob({
      title: '', location: '', type: 'Full-time', salary: '',
      company: currentUser?.company || 'CloudTech India Pvt. Ltd.',
      companyWebsite: currentUser?.website || 'https://cloudtech.in',
      description: '', requirements: '', skills: '', experienceLevel: '3-5 yrs',
    });
    setPosting(false);
    toast.success('Job posted! 🎉 Candidates can now browse and apply.');
    setActiveTab('jobs');
  };

  const openScheduleModal = (candApp, isNext = false, prefill = {}) => {
    const nextRoundNum = (candApp.interviewHistory?.length || 1) + (isNext ? 1 : 0);
    const defaultRoundName = isNext
      ? (nextRoundNum === 2 ? 'Technical Round 2 (System Design)' : 'HR & Leadership Round')
      : (candApp.interviewRound || 'Technical Round 1');

    setScheduleForm({
      round: prefill.round || defaultRoundName,
      date: prefill.date || new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      time: prefill.time || '14:30',
      mode: prefill.mode || 'Google Meet',
      link: prefill.link || 'https://meet.google.com/jbc-tech-interview',
      note: prefill.note || 'Please have your code editor and a stable internet connection ready.',
      isNextRound: isNext,
    });
    setScheduleModalApp(candApp);
  };

  const handleConfirmSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleModalApp) return;

    if (scheduleForm.isNextRound) {
      await scheduleNextRound(scheduleModalApp.id, {
        round: scheduleForm.round,
        date: scheduleForm.date,
        time: scheduleForm.time,
        mode: scheduleForm.mode,
        link: scheduleForm.link,
        note: scheduleForm.note,
      });
      toast.success(`Next interview round (${scheduleForm.round}) scheduled! Candidate notified.`);
    } else {
      await updateApplicationStatus(scheduleModalApp.id, 'interview', {
        interviewRound: scheduleForm.round,
        interviewDate: scheduleForm.date,
        interviewTime: scheduleForm.time,
        interviewMode: scheduleForm.mode,
        interviewLink: scheduleForm.link,
        employerNote: scheduleForm.note,
      });
      toast.success(`Interview scheduled with ${scheduleModalApp.applicantName}! Candidate notified.`);
    }

    if (pushNotification && scheduleModalApp.applicantId) {
      pushNotification(scheduleModalApp.applicantId, {
        type: 'interview',
        title: scheduleForm.isNextRound ? 'Next Interview Round Scheduled! 📅' : 'Interview Scheduled! 📅',
        message: `${scheduleModalApp.jobTitle}: ${scheduleForm.round} on ${scheduleForm.date} at ${scheduleForm.time} via ${scheduleForm.mode}. Link: ${scheduleForm.link}`,
        link: '/dashboard',
      });
    }

    setScheduleModalApp(null);
  };

  const handleScorecardSubmit = async (scorecardData) => {
    if (!scorecardModalApp) return;
    try {
      await submitInterviewScorecard(scorecardModalApp.id, scorecardData);
      toast.success(`Evaluation recorded for ${scorecardModalApp.applicantName}! Score: ${scorecardData.overallScore}/5 ⭐`);
      setScorecardModalApp(null);
    } catch (err) {
      toast.error('Failed to submit scorecard: ' + err.message);
    }
  };

  const handleIssueOfferSubmit = async (offerData) => {
    if (!issueOfferModalApp) return;
    try {
      await issueJobOffer(issueOfferModalApp.id, offerData);
      toast.success(`🎉 Formal Job Offer of ${offerData.ctc} issued to ${issueOfferModalApp.applicantName}!`);
      setIssueOfferModalApp(null);
    } catch (err) {
      toast.error('Failed to issue job offer: ' + err.message);
    }
  };

  const set = (field) => (e) => setNewJob(prev => ({ ...prev, [field]: e.target.value }));
  const setSched = (field) => (e) => setScheduleForm(prev => ({ ...prev, [field]: e.target.value }));

  // ── Auth guards ──────────────────────────────────────────────
  if (!currentUser) {
    return (
      <Layout>
        <div className="ed-auth-required">
          <div className="ed-auth-icon">🔐</div>
          <h2>Authentication Required</h2>
          <p>Please log in to access the employer dashboard.</p>
          <button className="ed-btn-primary" onClick={() => navigate('/')}>Go to Home</button>
        </div>
      </Layout>
    );
  }
  if (currentUser.role === 'admin') {
    return (
      <Layout>
        <div className="ed-auth-required">
          <div className="ed-auth-icon">🛡️</div>
          <h2>Admin Account Detected</h2>
          <p>Use the Admin Panel instead.</p>
          <button className="ed-btn-primary" onClick={() => navigate('/admin')}>Go to Admin Panel</button>
        </div>
      </Layout>
    );
  }
  if (currentUser.role !== 'employer') {
    return (
      <Layout>
        <div className="ed-auth-required">
          <div className="ed-auth-icon">🏢</div>
          <h2>Employer Account Required</h2>
          <p>This dashboard is for employer accounts.</p>
          <button className="ed-btn-primary" onClick={() => navigate('/')}>Go to Home</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="ed-page">
        {/* ── Banner ── */}
        <div className="ed-banner">
          <div className="ed-banner-inner">
            <motion.div className="ed-welcome" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="ed-avatar"><Building2 size={28} /></div>
              <div>
                <h1>Welcome, {currentUser.name.split(' ')[0]}! 👋</h1>
                <p>🏢 {currentUser.company || 'Employer Account'} &nbsp;·&nbsp; {currentUser.email}</p>
              </div>
            </motion.div>
            <motion.div className="ed-stats" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              {[
                { label: 'Jobs Posted',    value: employerJobs.length, icon: Briefcase },
                { label: 'Active Jobs',    value: activeJobsCount,     icon: TrendingUp },
                { label: 'Applications',   value: totalApplicants,     icon: Users },
                { label: 'Total Views',    value: totalViews,          icon: Eye },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="ed-stat-card">
                  <Icon size={18} />
                  <div className="ed-stat-num">{value}</div>
                  <div className="ed-stat-lbl">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="ed-body">
          <aside className="ed-sidebar">
            <nav className="ed-nav">
              {TABS.map(({ id, label, icon: Icon }) => (
                <motion.button
                  key={id}
                  className={`ed-nav-item ${activeTab === id ? 'active' : ''}`}
                  onClick={() => setActiveTab(id)}
                  whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {id === 'candidates' && totalApplicants > 0 && (
                    <span className="ed-nav-badge">{totalApplicants}</span>
                  )}
                  {activeTab === id && <ChevronRight size={16} className="ed-nav-arrow" />}
                </motion.button>
              ))}
            </nav>
            <motion.button className="ed-logout-btn" onClick={handleLogout} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <LogOut size={16} /> Sign Out
            </motion.button>
          </aside>

          <main className="ed-main">
            <AnimatePresence mode="wait">

              {/* ── OVERVIEW ── */}
              {activeTab === 'overview' && (
                <motion.div key="overview" className="ed-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <div className="ed-section-header">
                    <div className="ed-section-title"><BarChart3 size={22} /> Overview</div>
                    <motion.button className="ed-btn-primary" onClick={() => setActiveTab('post-job')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Plus size={15} /> Post a Job
                    </motion.button>
                  </div>

                  <div className="ed-overview-grid">
                    {[
                      { label: 'Pending Review',  value: allApplications.filter(a => a.status === 'pending').length, icon: Clock, color: '#f59e0b', sub: 'Awaiting first screening' },
                      { label: 'Shortlisted',     value: allApplications.filter(a => a.status === 'shortlisted' || a.status === 'reviewed').length, icon: Star, color: '#10b981', sub: 'Qualified candidate pool' },
                      { label: 'Under Interview', value: allApplications.filter(a => a.status === 'interview').length, icon: Calendar, color: '#0ea5e9', sub: 'Active evaluation rounds' },
                      { label: 'Offers / Hired',  value: allApplications.filter(a => ['offered', 'hired', 'selected'].includes(a.status)).length, icon: Award, color: '#16a34a', sub: 'Closing hiring milestones' },
                    ].map(({ label, value, icon: Icon, color, sub }, i) => (
                      <motion.div
                        key={label}
                        className="ed-overview-card"
                        style={{ '--accent': color, cursor: 'pointer' }}
                        onClick={() => setActiveTab('candidates')}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ y: -4 }}
                        title="Click to view candidates in this stage"
                      >
                        <div className="ed-ov-icon" style={{ background: `${color}18`, color }}><Icon size={22} /></div>
                        <div className="ed-ov-val">{value}</div>
                        <div className="ed-ov-lbl">{label}</div>
                        <div className="ed-ov-sub">{sub}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Recent applications preview */}
                  {allApplications.length > 0 && (
                    <>
                      <div className="ed-overview-sub-header">
                        <h3>Recent Applications</h3>
                        <button className="ed-link-btn" onClick={() => setActiveTab('candidates')}>View All →</button>
                      </div>
                      <div className="ed-recent-apps">
                        {allApplications.slice(0, 3).map((app, i) => {
                          const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                          return (
                            <motion.div key={app.id} className="ed-recent-app-row" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                              <div className="ed-recent-app-avatar">{app.applicantName.charAt(0)}</div>
                              <div className="ed-recent-app-info">
                                <p className="ed-recent-app-name">{app.applicantName}</p>
                                <p className="ed-recent-app-job">Applied for: {app.jobTitle}</p>
                              </div>
                              <div className="ed-recent-app-status" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</div>
                              <button className="ed-mini-btn" onClick={() => { setActiveTab('candidates'); }}>Review</button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {employerJobs.length > 0 && (
                    <>
                      <div className="ed-overview-sub-header" style={{ marginTop: '2rem' }}>
                        <h3>My Active Jobs</h3>
                        <button className="ed-link-btn" onClick={() => setActiveTab('jobs')}>Manage →</button>
                      </div>
                      <div className="ed-job-list">
                        {employerJobs.slice(0, 3).map((job, i) => (
                          <motion.div key={job.id} className="ed-job-row" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                            <div className="ed-job-row-left">
                              <span className={`ed-status-dot ${job.status}`}></span>
                              <div>
                                <p className="ed-job-row-title">{job.title}</p>
                                <p className="ed-job-row-sub">{job.location} · {job.salary}</p>
                              </div>
                            </div>
                            <div className="ed-job-row-right">
                              <span><Users size={13} /> {job.applicants || 0}</span>
                              <span><Eye size={13} /> {job.views || 0}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ── MY JOBS ── */}
              {activeTab === 'jobs' && (
                <motion.div key="jobs" className="ed-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <div className="ed-section-header">
                    <div className="ed-section-title"><Briefcase size={22} /> My Jobs</div>
                    <motion.button className="ed-btn-primary" onClick={() => setActiveTab('post-job')} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Plus size={15} /> Post New Job
                    </motion.button>
                  </div>

                  {employerJobs.length === 0 ? (
                    <div className="ed-empty">
                      <Briefcase size={48} className="ed-empty-icon" />
                      <h3>No Jobs Posted Yet</h3>
                      <p>Post your first job to start receiving applications from talented candidates!</p>
                      <button className="ed-btn-primary" onClick={() => setActiveTab('post-job')}><Plus size={14} /> Post a Job</button>
                    </div>
                  ) : (
                    <div className="ed-jobs-list">
                      {employerJobs.map((job, i) => {
                        const jobApps = getApplicationsForJob(job.id);
                        return (
                          <motion.div key={job.id} className="ed-job-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(249,115,22,0.1)' }}>
                            <div className="ed-job-card-top">
                              <div className="ed-job-card-title-row">
                                <span className={`ed-status-dot ${job.status}`}></span>
                                <h3 className="ed-job-card-title">{job.title}</h3>
                                <span className={`ed-status-pill ${job.status}`}>{job.status}</span>
                              </div>
                              <div className="ed-job-card-meta">
                                <span><MapPin size={13} /> {job.location}</span>
                                <span><Clock size={13} /> {job.type}</span>
                                <span><IndianRupee size={13} /> {job.salary}</span>
                                <span><FileText size={13} /> Posted {job.postedDate}</span>
                              </div>
                            </div>
                            <div className="ed-job-card-stats">
                              <div className="ed-job-stat"><Users size={16} /><span>{jobApps.length} applicants</span></div>
                              <div className="ed-job-stat"><Eye size={16} /><span>{job.views || 0} views</span></div>
                              {jobApps.length > 0 && (
                                <button className="ed-view-apps-btn" onClick={() => { setCandidatesFilter(job.id); setActiveTab('candidates'); }}>
                                  <UserCheck size={14} /> View Applications
                                </button>
                              )}
                            </div>
                            <div className="ed-job-card-actions">
                              <motion.button className="ed-action-btn ed-btn-toggle" onClick={() => { toggleJobStatus(job.id); toast.success('Job status updated.'); }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                {job.status === 'active' ? <><PauseCircle size={14} /> Pause</> : <><PlayCircle size={14} /> Resume</>}
                              </motion.button>
                              <HoldToConfirmButton
                                label="Hold to Delete"
                                holdingLabel="Deleting..."
                                confirmedLabel="Deleted"
                                icon={<Trash2 size={13} />}
                                onConfirm={() => {
                                  deleteJob(job.id);
                                  toast.success(`Deleted "${job.title}"`, {
                                    action: {
                                      label: 'Undo',
                                      onClick: () => {
                                        postJob(job);
                                        toast.success(`Restored "${job.title}"`);
                                      }
                                    }
                                  });
                                }}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── CANDIDATES ── */}
              {activeTab === 'candidates' && (
                <motion.div key="candidates" className="ed-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <div className="ed-section-header">
                    <div className="ed-section-title"><Users size={22} /> Applications Received</div>
                    <span className="ed-badge">{displayedApps.length} applications</span>
                  </div>

                  {/* Filter by job */}
                  {employerJobs.length > 0 && (
                    <div className="ed-candidates-filter">
                      <button className={`ed-filter-pill ${candidatesFilter === 'all' ? 'active' : ''}`} onClick={() => setCandidatesFilter('all')}>
                        All Jobs ({allApplications.length})
                      </button>
                      {employerJobs.map(j => (
                        <button key={j.id} className={`ed-filter-pill ${String(candidatesFilter) === String(j.id) ? 'active' : ''}`} onClick={() => setCandidatesFilter(String(j.id))}>
                          {j.title} ({getApplicationsForJob(String(j.id)).length})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Status summary pills */}
                  {displayedApps.length > 0 && (
                    <div className="ed-status-summary">
                      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                        const count = displayedApps.filter(a => a.status === key).length;
                        if (!count) return null;
                        return (
                          <span key={key} className="ed-summary-pill" style={{ color: cfg.color, background: cfg.bg }}>
                            {cfg.label}: {count}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {displayedApps.length === 0 ? (
                    <div className="ed-empty">
                      <Users size={48} className="ed-empty-icon" />
                      <h3>Koi Application Nahi Mili</h3>
                      <p>No applications yet for this job. Make sure your listing is active and attracting the right candidates.</p>
                      <button className="ed-btn-primary" onClick={() => setActiveTab('jobs')}><Briefcase size={14} /> View My Jobs</button>
                    </div>
                  ) : (
                    <AnimatePresence>
                      <div className="ed-app-list">
                        {displayedApps.map(app => (
                          <ApplicationCard
                            key={app.id || app._id}
                            app={{ ...app, id: app.id || app._id }}
                            onStatusChange={updateApplicationStatus}
                            onSchedule={openScheduleModal}
                            onPreviewResume={(candApp) => setPreviewResumeApp(candApp)}
                            onOpenScorecard={(candApp) => setScorecardModalApp(candApp)}
                            onIssueOffer={(candApp) => setIssueOfferModalApp(candApp)}
                            onPreviewOffer={(candApp) => setPreviewOfferModalApp(candApp)}
                            pushNotification={pushNotification}
                          />
                        ))}
                      </div>
                    </AnimatePresence>
                  )}
                </motion.div>
              )}

              {/* ── POST A JOB ── */}
              {activeTab === 'post-job' && (
                <motion.div key="post-job" className="ed-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <div className="ed-section-header">
                    <div className="ed-section-title"><Plus size={22} /> Post a New Job</div>
                  </div>
                  <form className="ed-form" onSubmit={handlePostJob}>
                    <div className="ed-form-row">
                      <div className="ed-form-group">
                        <label>Job Title *</label>
                        <input value={newJob.title} onChange={set('title')} placeholder="e.g. Senior React Developer" required />
                      </div>
                      <div className="ed-form-group">
                        <label>Location *</label>
                        <input value={newJob.location} onChange={set('location')} placeholder="e.g. Bengaluru / Remote" required />
                      </div>
                    </div>
                    <div className="ed-form-row">
                      <div className="ed-form-group">
                        <label>Company Name</label>
                        <input value={newJob.company} onChange={set('company')} placeholder="e.g. CloudTech India Pvt. Ltd." />
                      </div>
                      <div className="ed-form-group">
                        <label>Company Website</label>
                        <input value={newJob.companyWebsite} onChange={set('companyWebsite')} placeholder="e.g. https://cloudtech.in" />
                      </div>
                    </div>
                    <div className="ed-form-row">
                      <div className="ed-form-group">
                        <label>Job Type</label>
                        <select value={newJob.type} onChange={set('type')}>
                          <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option><option>Remote</option>
                        </select>
                      </div>
                      <div className="ed-form-group">
                        <label>Experience Level</label>
                        <select value={newJob.experienceLevel} onChange={set('experienceLevel')}>
                          <option>Fresher</option><option>1-3 yrs</option><option>3-5 yrs</option><option>5-10 yrs</option><option>10+ yrs</option>
                        </select>
                      </div>
                    </div>
                    <div className="ed-form-group">
                      <label>Salary Range (LPA) *</label>
                      <input value={newJob.salary} onChange={set('salary')} placeholder="e.g. ₹10L - ₹15L" required />
                    </div>
                    <div className="ed-form-group">
                      <label>Job Description</label>
                      <textarea rows={4} value={newJob.description} onChange={set('description')} placeholder="Describe the role, responsibilities and what you're looking for..." />
                    </div>
                    <div className="ed-form-group">
                      <label>Requirements</label>
                      <textarea rows={3} value={newJob.requirements} onChange={set('requirements')} placeholder="List key requirements and qualifications..." />
                    </div>
                    <div className="ed-form-group">
                      <label>Required Skills (comma separated)</label>
                      <input value={newJob.skills} onChange={set('skills')} placeholder="e.g. React, Node.js, AWS, TypeScript" />
                    </div>
                    <motion.button type="submit" className="ed-btn-primary ed-submit-btn" disabled={posting} whileHover={{ scale: posting ? 1 : 1.02 }} whileTap={{ scale: 0.97 }}>
                      {posting ? 'Posting...' : <><Plus size={16} /> Post Job</>}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* ── SETTINGS ── */}
              {activeTab === 'settings' && (
                <motion.div key="settings" className="ed-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  <div className="ed-section-header">
                    <div className="ed-section-title"><Settings size={22} /> Settings</div>
                  </div>
                  <div className="ed-settings-card">
                    <h4>Account Information</h4>
                    <div className="ed-settings-row"><div><p className="ed-settings-lbl">Name</p><p className="ed-settings-val">{currentUser.name}</p></div></div>
                    <div className="ed-settings-row"><div><p className="ed-settings-lbl">Email</p><p className="ed-settings-val">{currentUser.email}</p></div></div>
                    <div className="ed-settings-row"><div><p className="ed-settings-lbl">Company</p><p className="ed-settings-val">{currentUser.company || 'Not set'}</p></div></div>
                    <div className="ed-settings-row"><div><p className="ed-settings-lbl">Account Type</p><p className="ed-settings-val">Employer</p></div></div>
                  </div>
                  <div className="ed-settings-card">
                    <h4>Recruitment & Email Preferences</h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '-6px 0 16px 0' }}>Configure which applicant and interview updates are delivered via email and live alerts.</p>
                    {[
                      { key: 'emailNotifications', label: 'Master Email Notifications', desc: 'Receive recruitment updates at ' + currentUser.email },
                      { key: 'applicationUpdates', label: 'New Applicant Alerts', desc: 'Immediate notification when candidates submit applications for your vacancies' },
                      { key: 'interviewUpdates',   label: 'Interview RSVP & Schedule Updates', desc: 'Alerts when candidates accept, decline or request interview rescheduling' },
                      { key: 'messages',           label: 'Candidate Direct Inquiries', desc: 'Candidate questions and application inquiries' },
                      { key: 'marketingEmails',    label: 'Platform Hiring Reports', desc: 'Weekly recruitment analytics and talent market trends' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="ed-settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p className="ed-settings-lbl" style={{ fontWeight: 600, color: '#1e293b' }}>{label}</p>
                          <p className="ed-settings-val" style={{ fontSize: '0.8rem', color: '#64748b' }}>{desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences ? preferences[key] !== false : true}
                          onChange={(e) => updatePreferences && updatePreferences({ ...preferences, [key]: e.target.checked })}
                          style={{ width: '20px', height: '20px', accentColor: '#0284c7', cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="ed-settings-card ed-settings-danger">
                    <h4>Danger Zone</h4>
                    <div className="ed-settings-row">
                      <div><p className="ed-settings-lbl">Sign out of your account</p><p className="ed-settings-val" style={{ color: '#ef4444' }}>You'll need to log in again.</p></div>
                      <motion.button className="ed-danger-btn" onClick={handleLogout} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><LogOut size={14} /> Sign Out</motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* ── SCHEDULE INTERVIEW MODAL ── */}
      <AnimatePresence>
        {scheduleModalApp && (
          <div className="ed-modal-backdrop" onClick={() => setScheduleModalApp(null)}>
            <motion.div
              className="ed-modal-card"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ed-modal-header">
                <div className="ed-modal-title">
                  <Calendar size={20} className="ed-modal-icon" />
                  <div>
                    <h3>Schedule Interview</h3>
                    <p>Candidate: <strong>{scheduleModalApp.applicantName}</strong> &middot; {scheduleModalApp.jobTitle}</p>
                  </div>
                </div>
                <button className="ed-modal-close" onClick={() => setScheduleModalApp(null)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleConfirmSchedule} className="ed-modal-form">
                <div className="ed-modal-row">
                  <div className="ed-modal-group">
                    <label>Interview Round *</label>
                    <input
                      type="text"
                      value={scheduleForm.round}
                      onChange={setSched('round')}
                      placeholder="e.g. Technical Round 1"
                      required
                    />
                  </div>
                  <div className="ed-modal-group">
                    <label>Meeting Mode *</label>
                    <select value={scheduleForm.mode} onChange={setSched('mode')}>
                      <option>Google Meet</option>
                      <option>Zoom</option>
                      <option>Phone Call</option>
                      <option>In-person (Office)</option>
                    </select>
                  </div>
                </div>

                <div className="ed-modal-row">
                  <div className="ed-modal-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={scheduleForm.date}
                      onChange={setSched('date')}
                      required
                    />
                  </div>
                  <div className="ed-modal-group">
                    <label>Time (IST) *</label>
                    <input
                      type="time"
                      value={scheduleForm.time}
                      onChange={setSched('time')}
                      required
                    />
                  </div>
                </div>

                <div className="ed-modal-group">
                  <label>Meeting Link / Location URL *</label>
                  <input
                    type="text"
                    value={scheduleForm.link}
                    onChange={setSched('link')}
                    placeholder="e.g. https://meet.google.com/xyz-abcd-efg"
                    required
                  />
                </div>

                <div className="ed-modal-group">
                  <label>Note / Instructions for Candidate</label>
                  <textarea
                    rows={3}
                    value={scheduleForm.note}
                    onChange={setSched('note')}
                    placeholder="e.g. Please be ready with your code editor and a quiet environment."
                  />
                </div>

                <div className="ed-modal-actions">
                  <button type="button" className="ed-btn-cancel" onClick={() => setScheduleModalApp(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="ed-btn-primary">
                    <Calendar size={15} /> Schedule &amp; Send Invite
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resume Document Preview Modal */}
      {previewResumeApp && (
        <ResumePreviewModal
          isOpen={Boolean(previewResumeApp)}
          onClose={() => setPreviewResumeApp(null)}
          application={previewResumeApp}
        />
      )}

      {/* Candidate Evaluation Scorecard Modal */}
      {scorecardModalApp && (
        <ScorecardModal
          isOpen={Boolean(scorecardModalApp)}
          onClose={() => setScorecardModalApp(null)}
          onSubmit={handleScorecardSubmit}
          application={scorecardModalApp}
        />
      )}

      {/* Formal Job Offer Letter Issuance Modal */}
      {issueOfferModalApp && (
        <IssueOfferModal
          isOpen={Boolean(issueOfferModalApp)}
          onClose={() => setIssueOfferModalApp(null)}
          onSubmit={handleIssueOfferSubmit}
          application={issueOfferModalApp}
        />
      )}

      {/* Official Offer Letter Preview Modal */}
      {previewOfferModalApp && (
        <OfferLetterModal
          isOpen={Boolean(previewOfferModalApp)}
          onClose={() => setPreviewOfferModalApp(null)}
          application={previewOfferModalApp}
          isCandidate={false}
        />
      )}
    </Layout>
  );
};

export default EmployerDashboard;
