import React from 'react';
import { motion } from 'framer-motion';
import { Search, Briefcase, Users, TrendingUp, Plus, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { usePlatformStats } from '../../context/ApplicationContext';
import './Hero.css';

const categories = [
  { label: 'IT/Software', emoji: '💻' },
  { label: 'Finance/BFSI', emoji: '💰' },
  { label: 'Design', emoji: '🎨' },
  { label: 'Marketing', emoji: '📊' },
  { label: 'Mobile Dev', emoji: '📱' },
];

const Hero = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const stats = usePlatformStats();

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.23, 1, 0.32, 1] } }
  };

  const handleMyApplicationsClick = () => {
    if (!currentUser) {
      toast.info('Please log in as a Job Seeker to view your applications.');
      navigate('/login?redirect=/dashboard');
      return;
    }
    navigate('/dashboard?tab=applications');
  };

  const floatCards = [
    {
      icon: <Briefcase size={18} />,
      label: stats.activeJobsCount == null ? 'Jobs Updating' : `${stats.activeJobsCount} Active Jobs`,
      sub: 'Verified Openings across India',
      delay: 0,
    },
    {
      icon: <Users size={18} />,
      label: `${stats.verifiedCompaniesCount}+ Partner Companies`,
      sub: 'TCS · Infosys · Flipkart & more',
      delay: 0.15,
    },
    {
      icon: <Sparkles size={18} />,
      label: 'Application Tracking',
      sub: 'Real-time Status Updates',
      delay: 0.3,
    },
  ];

  return (
    <section className="hero-section">
      <div className="hero-bg-grid" />
      <div className="hero-container">
        {/* Left content */}
        <motion.div
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="hero-pill" variants={itemVariants}>
            <TrendingUp size={13} />
            <span>
              {currentUser?.role === 'employer'
                ? `🏢 Employer Portal · ${currentUser.company || 'Enterprise'}`
                : currentUser?.role === 'admin'
                ? '⚡ System Admin Console · All Systems Operational'
                : '🇮🇳 Naukri Dhundo, Sapna Jiyo.'}
            </span>
          </motion.div>

          <motion.h1 className="hero-title" variants={itemVariants}>
            {currentUser?.role === 'employer' ? (
              <>Hire Top Indian Tech <span className="gradient-text">Talent</span></>
            ) : currentUser?.role === 'admin' ? (
              <>Platform Governance & <span className="gradient-text">Moderation</span></>
            ) : (
              <>Find Your Dream <span className="gradient-text">Job</span></>
            )}
          </motion.h1>

          <motion.p className="hero-desc" variants={itemVariants}>
            {currentUser?.role === 'employer'
              ? `Welcome back, ${currentUser.name?.split(' ')[0] || 'Partner'}! Post active openings, review candidates, and manage interviews.`
              : currentUser?.role === 'admin'
              ? 'Oversee live user accounts, audit employer job postings, and review platform-wide analytics in real time.'
              : 'Discover opportunities across India and take the next step in your career. Connect with top Indian companies — from TCS to Flipkart.'}
          </motion.p>

          {/* Role-Aware Call-to-Action Buttons */}
          <motion.div className="hero-actions" variants={itemVariants}>
            {currentUser?.role === 'employer' ? (
              <>
                <motion.button
                  className="hero-btn primary"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                  onClick={() => navigate('/employer-dashboard?tab=post-job')}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Plus size={17} /> Post a Job
                </motion.button>
                <motion.button
                  className="hero-btn secondary"
                  onClick={() => navigate('/employer-dashboard?tab=candidates')}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Users size={16} /> Review Candidates
                </motion.button>
              </>
            ) : currentUser?.role === 'admin' ? (
              <>
                <motion.button
                  className="hero-btn primary"
                  style={{ background: 'linear-gradient(135deg, #475569, #1e293b)' }}
                  onClick={() => navigate('/admin')}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Shield size={17} /> Admin Dashboard
                </motion.button>
                <motion.button
                  className="hero-btn secondary"
                  onClick={() => navigate('/admin?tab=reports')}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <TrendingUp size={16} /> Platform Metrics
                </motion.button>
              </>
            ) : (
              /* Job Seeker or Unauthenticated Guest */
              <>
                <motion.button
                  className="hero-btn primary"
                  onClick={() => navigate('/browse')}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Search size={17} /> Browse Openings
                </motion.button>
                <motion.button
                  className="hero-btn secondary"
                  onClick={handleMyApplicationsClick}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Briefcase size={16} /> My Applications
                </motion.button>
              </>
            )}
          </motion.div>

          {/* Popular Categories — Clickable with Filter Integration */}
          <motion.div className="hero-categories" variants={itemVariants}>
            <span className="categories-label">Popular Categories:</span>
            <div className="category-tags">
              {categories.map(c => (
                <motion.span
                  key={c.label}
                  className="category-tag"
                  onClick={() => navigate(`/browse?category=${encodeURIComponent(c.label)}`)}
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  title={`Browse ${c.label} jobs in India`}
                >
                  {c.emoji} {c.label}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Right — Real/Verified Platform Cards */}
        <motion.div
          className="hero-illustration"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {floatCards.map((card, i) => (
            <div key={i} className={`floating-card card-${i}`} style={{ animationDelay: `${i * 0.8}s` }}>
              <div className="float-card-icon">{card.icon}</div>
              <div>
                <p className="float-card-label">{card.label}</p>
                <p className="float-card-sub">{card.sub}</p>
              </div>
            </div>
          ))}
          <div className="hero-circle circle-1" />
          <div className="hero-circle circle-2" />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
