import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Filter, X, ChevronDown } from 'lucide-react';
import { SALARY_RANGES_LPA, EXPERIENCE_LEVELS } from '../../data/indianData';
import './SearchBar.css';

const JOB_TYPES = ['', 'Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];

const SearchBar = ({ onSearch }) => {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [experience, setExperience] = useState('');

  const fire = (overrides = {}) => {
    if (onSearch) onSearch({ keyword, location, jobType, salaryRange, experience, ...overrides });
  };

  const handleSubmit = (e) => { e.preventDefault(); fire(); };

  const clear = () => {
    setKeyword(''); setLocation(''); setJobType(''); setSalaryRange(''); setExperience('');
    if (onSearch) onSearch({ keyword: '', location: '', jobType: '', salaryRange: '', experience: '' });
  };

  const removeTag = (field) => {
    const map = { keyword: setKeyword, location: setLocation, jobType: setJobType, salaryRange: setSalaryRange, experience: setExperience };
    map[field]('');
    fire({ [field]: '' });
  };

  const activeTags = [
    keyword && { field: 'keyword', label: `"${keyword}"` },
    location && { field: 'location', label: `📍 ${location}` },
    jobType && { field: 'jobType', label: jobType },
    salaryRange && { field: 'salaryRange', label: SALARY_RANGES_LPA.find(r => r.value === salaryRange)?.label || salaryRange },
    experience && { field: 'experience', label: experience },
  ].filter(Boolean);

  return (
    <section className="search-section">
      <div className="search-container">
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-main-row">
            <div className="search-field">
              <div className="search-field-icon"><Search size={17} /></div>
              <input
                type="text"
                className="search-input"
                placeholder="Job title, skill, or company (e.g. React Developer, TCS)"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </div>

            <div className="search-field">
              <div className="search-field-icon"><MapPin size={17} /></div>
              <input
                type="text"
                className="search-input"
                placeholder="City or state (e.g. Bengaluru, Mumbai, Remote)"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>

            <motion.button
              type="submit"
              className="search-submit-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Search size={16} /> Search Jobs
            </motion.button>
          </div>

          <div className="search-filters-row">
            <div className="filter-group">
              <label>Job Type</label>
              <div className="select-wrap">
                <select value={jobType} onChange={e => setJobType(e.target.value)} className="filter-select">
                  {JOB_TYPES.map(t => <option key={t} value={t}>{t || 'All Types'}</option>)}
                </select>
                <ChevronDown size={14} className="select-icon" />
              </div>
            </div>

            <div className="filter-group">
              <label>Salary (LPA)</label>
              <div className="select-wrap">
                <select value={salaryRange} onChange={e => setSalaryRange(e.target.value)} className="filter-select">
                  {SALARY_RANGES_LPA.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <ChevronDown size={14} className="select-icon" />
              </div>
            </div>

            <div className="filter-group">
              <label>Experience</label>
              <div className="select-wrap">
                <select value={experience} onChange={e => setExperience(e.target.value)} className="filter-select">
                  <option value="">All Levels</option>
                  {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <ChevronDown size={14} className="select-icon" />
              </div>
            </div>

            {activeTags.length > 0 && (
              <motion.button
                type="button"
                className="clear-btn"
                onClick={clear}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <X size={14} /> Clear All
              </motion.button>
            )}
          </div>
        </form>

        <AnimatePresence>
          {activeTags.length > 0 && (
            <motion.div
              className="active-filter-tags"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <span className="filter-tags-label"><Filter size={13} /> Active filters:</span>
              {activeTags.map(tag => (
                <motion.span
                  key={tag.field}
                  className="filter-tag"
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                >
                  {tag.label}
                  <button onClick={() => removeTag(tag.field)}><X size={11} /></button>
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default SearchBar;
