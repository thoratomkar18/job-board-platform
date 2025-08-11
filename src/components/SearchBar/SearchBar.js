import React, { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch, onFilter }) => {
  // Search states
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');

  // I added these filter options based on common job board features
  const jobTypes = ['', 'Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
  const salaryRanges = [
    '', 
    '30000-50000', 
    '50000-75000', 
    '75000-100000', 
    '100000-150000', 
    '150000+'
  ];
  const experienceLevels = ['', 'Entry Level', 'Mid Level', 'Senior Level', 'Executive'];

  const handleSearch = (e) => {
    e.preventDefault();
    
    const searchCriteria = {
      keyword: searchKeyword.trim(),
      location: searchLocation.trim(),
      jobType,
      salaryRange,
      experienceLevel
    };

    console.log('Search criteria:', searchCriteria);
    
    // Pass search criteria to parent component
    if (onSearch) {
      onSearch(searchCriteria);
    }
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setSearchLocation('');
    setJobType('');
    setSalaryRange('');
    setExperienceLevel('');
    
    // Clear search results
    if (onSearch) {
      onSearch({
        keyword: '',
        location: '',
        jobType: '',
        salaryRange: '',
        experienceLevel: ''
      });
    }
  };

  return (
    <section className="search-section">
      <div className="search-container">
        <form className="search-form" onSubmit={handleSearch}>
          {/* Main search inputs */}
          <div className="main-search-row">
            <div className="search-input-group">
              <label>💼 Job Title or Keywords</label>
              <input
                type="text"
                placeholder="e.g. Frontend Developer, Marketing Manager"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="search-input-group">
              <label>📍 Location</label>
              <input
                type="text"
                placeholder="e.g. New York, San Francisco, Remote"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="search-input"
              />
            </div>
            
            <button type="submit" className="search-btn">
              🔍 Search Jobs
            </button>
          </div>

          {/* Advanced filters */}
          <div className="filters-row">
            <div className="filter-group">
              <label>Job Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="filter-select"
              >
                {jobTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type || 'All Types'}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Salary Range</label>
              <select
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="filter-select"
              >
                <option value="">All Salaries</option>
                <option value="30000-50000">$30K - $50K</option>
                <option value="50000-75000">$50K - $75K</option>
                <option value="75000-100000">$75K - $100K</option>
                <option value="100000-150000">$100K - $150K</option>
                <option value="150000+">$150K+</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="filter-select"
              >
                {experienceLevels.map((level, index) => (
                  <option key={index} value={level}>
                    {level || 'All Levels'}
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="button" 
              className="clear-filters-btn"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </form>

        {/* Active filters display */}
        <div className="active-filters">
          {(searchKeyword || searchLocation || jobType || salaryRange || experienceLevel) && (
            <div className="filter-tags">
              <span className="filter-label">Active Filters:</span>
              {searchKeyword && (
                <span className="filter-tag">
                  Keyword: {searchKeyword}
                  <button onClick={() => setSearchKeyword('')}>×</button>
                </span>
              )}
              {searchLocation && (
                <span className="filter-tag">
                  Location: {searchLocation}
                  <button onClick={() => setSearchLocation('')}>×</button>
                </span>
              )}
              {jobType && (
                <span className="filter-tag">
                  Type: {jobType}
                  <button onClick={() => setJobType('')}>×</button>
                </span>
              )}
              {salaryRange && (
                <span className="filter-tag">
                  Salary: ${salaryRange.replace('-', 'K - $')}K
                  <button onClick={() => setSalaryRange('')}>×</button>
                </span>
              )}
              {experienceLevel && (
                <span className="filter-tag">
                  Level: {experienceLevel}
                  <button onClick={() => setExperienceLevel('')}>×</button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SearchBar;
