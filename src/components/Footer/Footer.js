import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Mail, ArrowRight, Send, Loader2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { usePlatformStats } from '../../context/ApplicationContext';
import { newsletterApi } from '../../api/newsletterApi';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useAuth();
  const stats = usePlatformStats();
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const trimmed = (email || '').trim();

    if (!trimmed) {
      toast.error('Please enter an email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      toast.error('Invalid email format. Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await newsletterApi.subscribe(trimmed);
      toast.success(res?.message || 'Thank you for subscribing! Real updates on new jobs will be delivered to your inbox.');
      setEmail('');
    } catch (err) {
      toast.error(err.message || 'Unable to subscribe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJobSeekerProtectedNav = (path) => (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.info('Please log in as a Job Seeker to access this page.');
      navigate(`/login?redirect=${encodeURIComponent(path)}`);
      return;
    }
    if (currentUser.role !== 'job_seeker') {
      toast.error(`This section is only for Job Seekers. You are currently logged in as ${currentUser.role}.`);
      return;
    }
    navigate(path);
  };

  const handleEmployerProtectedNav = (path) => (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.info('Please log in as an Employer to access recruitment tools.');
      navigate(`/login?redirect=${encodeURIComponent(path)}`);
      return;
    }
    if (currentUser.role !== 'employer') {
      toast.error(`This section is reserved for Employers. You are currently logged in as ${currentUser.role}.`);
      return;
    }
    navigate(path);
  };

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-content">
          {/* Brand Column */}
          <div className="footer-section brand-section">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-icon">
                <Briefcase size={18} color="white" />
              </div>
              <span className="footer-brand-name">JobConnect India</span>
            </Link>
            <p className="footer-tagline">
              Connecting India's talent with India's opportunities. Naukri dhundo, sapna jiyo! 🇮🇳
            </p>
            <div className="footer-contact-info">
              <a href="mailto:support@jobconnect.in" className="contact-row" title="Official Support Desk">
                <Mail size={14} /> support@jobconnect.in
              </a>
              <Link to="/contact" className="contact-row" title="Contact & Help Center">
                <Globe size={14} /> Help & Contact Center
              </Link>
            </div>
          </div>

          {/* For Job Seekers */}
          <div className="footer-section">
            <h4>For Job Seekers</h4>
            <ul className="footer-links">
              <li>
                <Link to="/browse" className="footer-link">
                  <ArrowRight size={13} /> Browse Jobs
                </Link>
              </li>
              <li>
                <a
                  href="/dashboard?tab=applications"
                  onClick={handleJobSeekerProtectedNav('/dashboard?tab=applications')}
                  className="footer-link"
                >
                  <ArrowRight size={13} /> My Applications
                </a>
              </li>
              <li>
                <a
                  href="/dashboard?tab=saved"
                  onClick={handleJobSeekerProtectedNav('/dashboard?tab=saved')}
                  className="footer-link"
                >
                  <ArrowRight size={13} /> Saved Jobs
                </a>
              </li>
              <li>
                <Link to="/about" className="footer-link">
                  <ArrowRight size={13} /> Career Advice
                </Link>
              </li>
            </ul>
          </div>

          {/* For Employers */}
          <div className="footer-section">
            <h4>For Employers</h4>
            <ul className="footer-links">
              <li>
                <a
                  href="/employer-dashboard?tab=post-job"
                  onClick={handleEmployerProtectedNav('/employer-dashboard?tab=post-job')}
                  className="footer-link"
                >
                  <ArrowRight size={13} /> Post a Job
                </a>
              </li>
              <li>
                <a
                  href="/employer-dashboard?tab=my-jobs"
                  onClick={handleEmployerProtectedNav('/employer-dashboard?tab=my-jobs')}
                  className="footer-link"
                >
                  <ArrowRight size={13} /> My Jobs
                </a>
              </li>
              <li>
                <a
                  href="/employer-dashboard?tab=candidates"
                  onClick={handleEmployerProtectedNav('/employer-dashboard?tab=candidates')}
                  className="footer-link"
                >
                  <ArrowRight size={13} /> View Candidates
                </a>
              </li>
              <li>
                <Link to="/login?tab=register&role=employer" className="footer-link">
                  <ArrowRight size={13} /> Register as Employer
                </Link>
              </li>
            </ul>

            <h4 style={{ marginTop: '24px' }}>Company</h4>
            <ul className="footer-links">
              <li>
                <Link to="/about" className="footer-link">
                  <ArrowRight size={13} /> About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="footer-link">
                  <ArrowRight size={13} /> Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter + Verified Statistics */}
          <div className="footer-section newsletter-section">
            <h4>Stay Updated</h4>
            <p className="newsletter-desc">Get verified job alerts and career updates in your inbox.</p>
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="newsletter-input"
                disabled={submitting}
                aria-label="Newsletter email input"
              />
              <motion.button
                type="submit"
                className="newsletter-btn"
                disabled={submitting}
                whileHover={{ scale: submitting ? 1 : 1.05 }}
                whileTap={{ scale: submitting ? 1 : 0.95 }}
                title="Subscribe to Newsletter"
              >
                {submitting ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
              </motion.button>
            </form>

            {/* Verified Statistics Synchronized with Homepage */}
            <div className="footer-stats">
              <div className="footer-stat" title="Actual live active job openings">
                <span className="stat-num">{stats.activeJobsCount}+</span>
                <span className="stat-lbl">Active Jobs</span>
              </div>
              <div className="footer-stat" title="Registered candidate profiles">
                <span className="stat-num">{stats.registeredCandidatesCount}+</span>
                <span className="stat-lbl">Candidates</span>
              </div>
              <div className="footer-stat" title="Verified partner employers">
                <span className="stat-num">{stats.verifiedCompaniesCount}+</span>
                <span className="stat-lbl">Companies</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <p>© {year} JobConnect India. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/about">Privacy Policy</Link>
            <Link to="/about">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
