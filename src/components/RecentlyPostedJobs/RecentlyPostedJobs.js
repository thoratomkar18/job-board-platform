import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApplications } from '../../context/ApplicationContext';
import { INDIAN_JOBS } from '../../data/indianData';
import JobCard from '../JobCard/JobCard';
import './RecentlyPostedJobs.css';

const normalizePostedJob = (job) => {
  const id = String(job.id || job._id || '');
  let salaryMin = 0, salaryMax = 999;
  const salaryStr = job.salary || '';
  const nums = salaryStr.match(/\d+/g);
  if (nums && nums.length >= 2) { salaryMin = parseInt(nums[0]); salaryMax = parseInt(nums[1]); }
  else if (nums && nums.length === 1) { salaryMin = parseInt(nums[0]); salaryMax = salaryMin + 5; }

  const skillsRaw = job.skills || '';
  const skills = Array.isArray(skillsRaw)
    ? skillsRaw
    : String(skillsRaw).split(',').map(s => s.trim()).filter(Boolean);

  return {
    ...job,
    id,
    _id: id,
    company: job.company || job.employerName || 'Verified Employer',
    salaryDisplay: job.salaryDisplay || (job.salary ? (job.salary.includes('LPA') ? job.salary : `${job.salary} LPA`) : 'Competitive'),
    salaryMin,
    salaryMax,
    skills,
    description: job.description || `${job.title} opening at ${job.company || job.employerName}.`,
    isEmployerPosted: true,
    featured: Boolean(job.featured),
  };
};

const RecentlyPostedJobs = () => {
  const navigate = useNavigate();
  const { postedJobs } = useApplications();

  // Pick the top 4 recent active jobs (employer posted first, then curated Indian jobs)
  const recentJobs = useMemo(() => {
    const activePosts = (postedJobs || [])
      .filter(j => (j.status || '').toLowerCase() === 'active')
      .map(normalizePostedJob);

    const postedIds = new Set(activePosts.map(j => String(j.id || j._id)));
    const base = INDIAN_JOBS.filter(j => !postedIds.has(String(j.id)));

    return [...activePosts, ...base].slice(0, 4);
  }, [postedJobs]);

  return (
    <section className="recent-jobs-section">
      <div className="recent-jobs-container">
        {/* Section Header */}
        <div className="recent-jobs-header">
          <div>
            <div className="recent-pill">
              <Sparkles size={13} className="sparkle-icon" />
              <span>Latest Opportunities</span>
            </div>
            <h2 className="recent-title">
              <Clock size={22} className="recent-title-icon" />
              Recently Posted Jobs
            </h2>
            <p className="recent-sub">
              Explore the newest openings curated from top Indian tech employers and enterprises.
            </p>
          </div>

          <motion.button
            className="view-all-jobs-btn"
            onClick={() => navigate('/browse')}
            whileHover={{ scale: 1.03, x: 3 }}
            whileTap={{ scale: 0.97 }}
          >
            <span>View All Jobs</span>
            <ArrowRight size={16} />
          </motion.button>
        </div>

        {/* Jobs Grid */}
        {recentJobs.length > 0 ? (
          <div className="recent-jobs-grid">
            {recentJobs.map((job, idx) => (
              <JobCard key={job.id || idx} job={job} index={idx} />
            ))}
          </div>
        ) : (
          <div className="recent-empty-state">
            <p className="empty-title">No recent jobs found</p>
            <p className="empty-desc">New opportunities are added daily. Browse all openings below.</p>
            <button className="browse-link-btn" onClick={() => navigate('/browse')}>
              Browse All Openings
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentlyPostedJobs;
