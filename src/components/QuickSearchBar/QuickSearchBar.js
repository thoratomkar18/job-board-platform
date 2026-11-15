import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, Sparkles, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { SALARY_RANGES_LPA } from '../../data/indianData';
import './QuickSearchBar.css';

const QUICK_CHIPS = [
  { id: 'remote', label: '⚡ Remote', filter: { location: 'Remote' } },
  { id: 'bengaluru', label: '🚀 Bengaluru', filter: { location: 'Bengaluru' } },
  { id: 'react', label: '💻 React', filter: { keyword: 'React' } },
  { id: 'fulltime', label: '⭐ Full-time', filter: { jobType: 'Full-time' } },
  { id: 'highpay', label: '💰 ₹15L+ LPA', filter: { salaryRange: '15-25' } },
];

const QuickSearchBar = ({ onSearch, showAdvancedToggle = false }) => {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [activeChip, setActiveChip] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [jobType, setJobType] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [experience, setExperience] = useState('');

  const isInitialMount = useRef(true);

  // Compute active filters count (excluding default empty values)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeChip) count++;
    if (jobType) count++;
    if (salaryRange) count++;
    if (experience) count++;
    // If location is set independently of activeChip
    if (location && (!activeChip || !QUICK_CHIPS.find(c => c.id === activeChip)?.filter.location)) count++;
    return count;
  }, [activeChip, jobType, salaryRange, experience, location]);

  // 250ms Debounced live search trigger as user types
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch({
          keyword,
          location,
          jobType,
          salaryRange,
          experience,
        });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [keyword, location, jobType, salaryRange, experience, onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({
        keyword,
        location,
        jobType,
        salaryRange,
        experience,
      });
    }
  };

  const handleChipClick = (chip) => {
    if (activeChip === chip.id) {
      // Toggle off
      setActiveChip(null);
      const newLoc = chip.filter.location ? '' : location;
      const newKw = chip.filter.keyword ? '' : keyword;
      const newJt = chip.filter.jobType ? '' : jobType;
      const newSr = chip.filter.salaryRange ? '' : salaryRange;

      if (chip.filter.location) setLocation('');
      if (chip.filter.keyword) setKeyword('');
      if (chip.filter.jobType) setJobType('');
      if (chip.filter.salaryRange) setSalaryRange('');

      if (onSearch) {
        onSearch({
          keyword: newKw,
          location: newLoc,
          jobType: newJt,
          salaryRange: newSr,
          experience,
        });
      }
    } else {
      // Toggle on
      setActiveChip(chip.id);
      const newLoc = chip.filter.location || location;
      const newKw = chip.filter.keyword || keyword;
      const newJt = chip.filter.jobType || jobType;
      const newSr = chip.filter.salaryRange || salaryRange;

      if (chip.filter.location) setLocation(chip.filter.location);
      if (chip.filter.keyword) setKeyword(chip.filter.keyword);
      if (chip.filter.jobType) setJobType(chip.filter.jobType);
      if (chip.filter.salaryRange) setSalaryRange(chip.filter.salaryRange);

      if (onSearch) {
        onSearch({
          keyword: newKw,
          location: newLoc,
          jobType: newJt,
          salaryRange: newSr,
          experience,
        });
      }
    }
  };

  const handleClear = () => {
    setKeyword('');
    setLocation('');
    setActiveChip(null);
    setJobType('');
    setSalaryRange('');
    setExperience('');
    if (onSearch) {
      onSearch({ keyword: '', location: '', jobType: '', salaryRange: '', experience: '' });
    }
  };

  const hasSearchValues = Boolean(keyword || location || activeChip || jobType || salaryRange || experience);

  return (
    <div className="quick-search-wrapper">
      <div className="quick-search-container">
        {/* Sleek Single-Line Pill Search Bar */}
        <form className="quick-search-pill" onSubmit={handleSubmit}>
          {/* Keyword field */}
          <div className="quick-field keyword-field">
            <Search size={18} className="quick-field-icon" />
            <input
              type="text"
              className="quick-input"
              placeholder="Job title, skills, or company..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                if (activeChip) setActiveChip(null);
              }}
            />
          </div>

          <div className="quick-divider" />

          {/* Location field */}
          <div className="quick-field location-field">
            <MapPin size={18} className="quick-field-icon" />
            <input
              type="text"
              className="quick-input"
              placeholder="City, state, or Remote..."
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (activeChip) setActiveChip(null);
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="quick-actions">
            {hasSearchValues && (
              <button
                type="button"
                className="quick-clear-btn"
                onClick={handleClear}
                title="Clear Search"
              >
                <X size={16} />
              </button>
            )}

            <motion.button
              type="submit"
              className="quick-submit-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Search size={16} />
              <span>Search</span>
            </motion.button>
          </div>
        </form>

        {/* 1-Click Quick Filter Pills */}
        <div className="quick-chips-row">
          <span className="quick-chips-label">
            <Sparkles size={13} className="sparkle-icon" /> Quick Filters:
          </span>
          <div className="quick-chips-list">
            {QUICK_CHIPS.map((chip) => {
              const isActive = activeChip === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  className={`quick-chip ${isActive ? 'active' : ''}`}
                  onClick={() => handleChipClick(chip)}
                >
                  {chip.label}
                  {isActive && <span className="chip-active-dot" />}
                </button>
              );
            })}
          </div>

          {showAdvancedToggle && (
            <button
              type="button"
              className={`quick-advanced-toggle ${showAdvanced || activeFiltersCount > 0 ? 'active' : ''}`}
              onClick={() => setShowAdvanced(v => !v)}
            >
              <SlidersHorizontal size={13} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="quick-filter-badge">{activeFiltersCount}</span>
              )}
              <ChevronDown size={13} className={`chevron ${showAdvanced ? 'open' : ''}`} />
            </button>
          )}
        </div>

        {/* Optional Expandable Advanced Row */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              className="quick-advanced-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="quick-advanced-grid">
                <div className="adv-filter">
                  <label>Job Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => {
                      setJobType(e.target.value);
                    }}
                  >
                    <option value="">All Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div className="adv-filter">
                  <label>Salary (LPA)</label>
                  <select
                    value={salaryRange}
                    onChange={(e) => {
                      setSalaryRange(e.target.value);
                    }}
                  >
                    {SALARY_RANGES_LPA.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div className="adv-filter">
                  <label>Experience</label>
                  <select
                    value={experience}
                    onChange={(e) => {
                      setExperience(e.target.value);
                    }}
                  >
                    <option value="">All Levels</option>
                    <option value="0-1 yrs">0-1 yrs (Fresher)</option>
                    <option value="1-3 yrs">1-3 yrs</option>
                    <option value="3-5 yrs">3-5 yrs</option>
                    <option value="5-8 yrs">5-8 yrs</option>
                    <option value="8+ yrs">8+ yrs</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuickSearchBar;
