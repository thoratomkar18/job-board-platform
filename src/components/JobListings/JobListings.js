import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, RotateCcw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import JobCard from '../JobCard/JobCard';
import SearchBar from '../SearchBar/SearchBar';
import QuickSearchBar from '../QuickSearchBar/QuickSearchBar';
import { INDIAN_JOBS, SALARY_RANGES_LPA } from '../../data/indianData';
import { useApplications } from '../../context/ApplicationContext';
import './JobListings.css';

const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="sk-header">
      <div className="sk-logo" />
      <div className="sk-lines">
        <div className="sk-line w70" />
        <div className="sk-line w40" />
      </div>
    </div>
    <div className="sk-meta">
      <div className="sk-pill" /><div className="sk-pill" /><div className="sk-pill" />
    </div>
    <div className="sk-line w50" />
    <div className="sk-line" />
    <div className="sk-line w80" />
    <div className="sk-line w60" />
    <div className="sk-footer">
      <div className="sk-btn" /><div className="sk-btn" />
    </div>
  </div>
);

/**
 * Normalize an employer-posted job so it has the same shape as INDIAN_JOBS.
 */
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

const JobListings = ({
  quickSearch = true,
  showSearch = true,
  externalCriteria = null,
  title = null,
  limit = null,
}) => {
  const { postedJobs } = useApplications();
  const [loading, setLoading] = useState(true);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchKey, setSearchKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  const urlCategory = searchParams.get('category');
  const urlKeyword = searchParams.get('keyword') || searchParams.get('q');
  const urlLocation = searchParams.get('location');

  // Primary: verified database jobs (active only)
  const allJobs = useMemo(() => {
    const activePosts = (postedJobs || [])
      .filter(j => (j.status || '').toLowerCase() === 'active')
      .map(normalizePostedJob);

    // If active database jobs are loaded, use them as the single source of truth
    if (activePosts.length > 0) {
      return activePosts;
    }
    // Offline / unseeded fallback only
    return INDIAN_JOBS;
  }, [postedJobs]);

  const handleSearch = useCallback((criteria = {}) => {
    let result = [...allJobs];

    // Keyword: matches title, company name, skills, description
    if (criteria.keyword) {
      const kw = criteria.keyword.toLowerCase().trim();
      result = result.filter(j =>
        (j.title || '').toLowerCase().includes(kw) ||
        (j.company || j.employerName || '').toLowerCase().includes(kw) ||
        (j.skills || []).some(s => s.toLowerCase().includes(kw)) ||
        (j.description || '').toLowerCase().includes(kw)
      );
    }

    // Company specific
    if (criteria.company) {
      const comp = criteria.company.toLowerCase().trim();
      result = result.filter(j =>
        (j.company || j.employerName || '').toLowerCase().includes(comp)
      );
    }

    // Category: e.g. IT/Software, Design, Marketing, Finance/BFSI, Mobile Dev
    if (criteria.category) {
      const cat = criteria.category.toLowerCase().replace(/[^a-z0-9]/g, '');
      result = result.filter(j => {
        const jCat = (j.category || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const jTitle = (j.title || '').toLowerCase();
        const jSkills = (j.skills || []).map(s => s.toLowerCase());
        return jCat.includes(cat) || cat.includes(jCat) ||
               jTitle.includes(criteria.category.toLowerCase()) ||
               jSkills.some(s => s.includes(criteria.category.toLowerCase()));
      });
    }

    // Location: city, state, or Remote
    if (criteria.location) {
      const loc = criteria.location.toLowerCase().trim();
      result = result.filter(j => (j.location || '').toLowerCase().includes(loc));
    }

    // Job Type
    if (criteria.jobType) {
      result = result.filter(j => j.type === criteria.jobType);
    }

    // Salary Range (in LPA)
    if (criteria.salaryRange) {
      const range = SALARY_RANGES_LPA.find(r => r.value === criteria.salaryRange);
      if (range && range.value !== '') {
        if (range.value.endsWith('+')) {
          const min = parseInt(range.value, 10);
          result = result.filter(j => (j.salaryMax || 0) >= min);
        } else {
          const [min, max] = range.value.split('-').map(Number);
          result = result.filter(j => (j.salaryMax || 0) >= min && (j.salaryMin || 0) <= max);
        }
      }
    }

    // Experience Level
    if (criteria.experience) {
      result = result.filter(j => j.experienceLevel === criteria.experience);
    }

    setFilteredJobs(result);
  }, [allJobs]);

  const handleReset = useCallback(() => {
    setSearchParams({});
    setSearchKey((k) => k + 1);
    setFilteredJobs(allJobs);
  }, [allJobs, setSearchParams]);

  // Initial load with skeleton
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  // Sync when allJobs, URL search parameters, or externalCriteria changes
  useEffect(() => {
    if (loading) return;

    if (externalCriteria && Object.values(externalCriteria).some(Boolean)) {
      handleSearch(externalCriteria);
    } else if (urlCategory || urlKeyword || urlLocation) {
      handleSearch({
        category: urlCategory || '',
        keyword: urlKeyword || '',
        location: urlLocation || '',
      });
    } else {
      setFilteredJobs(allJobs);
    }
  }, [allJobs, loading, externalCriteria, urlCategory, urlKeyword, urlLocation, handleSearch]);

  const displayedJobs = limit ? filteredJobs.slice(0, limit) : filteredJobs;
  const isFiltered = filteredJobs.length !== allJobs.length;

  return (
    <section className="job-listings">
      {showSearch && (
        quickSearch ? (
          <QuickSearchBar key={searchKey} onSearch={handleSearch} showAdvancedToggle={true} />
        ) : (
          <SearchBar key={searchKey} onSearch={handleSearch} />
        )
      )}

      <div className="listings-container">
        {loading ? (
          <div className="skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            <div className="listings-header">
              <div className="listings-title-row">
                <Briefcase size={20} />
                <h2>
                  {title || (
                    !isFiltered
                      ? 'All Jobs in India'
                      : `${filteredJobs.length} Job${filteredJobs.length !== 1 ? 's' : ''} Found`
                  )}
                </h2>
                {isFiltered && (
                  <button
                    type="button"
                    className="inline-reset-btn"
                    onClick={handleReset}
                    title="Reset all filters"
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
              <p className="results-sub">
                {filteredJobs.length === 0
                  ? 'No jobs match your search criteria. Try different keywords, location, or reset filters.'
                  : `Showing ${displayedJobs.length} of ${filteredJobs.length} matching positions across India`}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {displayedJobs.length > 0 ? (
                <motion.div
                  key="grid"
                  className="jobs-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {displayedJobs.map((job, i) => (
                    <JobCard key={job.id} job={job} index={i} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="no-results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="no-results-emoji">🔍</div>
                  <h3>Koi naukri nahi mili (No matching jobs)</h3>
                  <p>Try searching for different skills, job title, company, or relax your location filter.</p>
                  <button className="browse-all-btn" onClick={handleReset}>
                    View All Active Jobs
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </section>
  );
};

export default JobListings;
