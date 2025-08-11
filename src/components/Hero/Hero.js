import React, { useState, useEffect } from 'react';
import './Hero.css';

const Hero = () => {
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    let count = 0;
    const target = 4536;
    const increment = target / 60;
    
    const timer = setInterval(() => {
      count += increment;
      if (count >= target) {
        setJobCount(target);
        clearInterval(timer);
      } else {
        setJobCount(Math.floor(count));
      }
    }, 30);

    return () => clearInterval(timer);
  }, []);

  const handleBrowseJobs = () => {
    const jobListings = document.querySelector('.job-listings');
    if (jobListings) {
      jobListings.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartSearch = () => {
    const searchSection = document.querySelector('.search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth' });
      // Focus on the search input after scrolling
      setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder*="Job title"]');
        if (searchInput) {
          searchInput.focus();
        }
      }, 600);
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <div className="job-counter">
            {jobCount}+ Jobs Listed
          </div>
          
          <h1 className="hero-title">
            Find your <span className="highlight">Dream Job</span>
          </h1>
          
          <p className="hero-description">
            We connect talented professionals with amazing career opportunities. 
            Start your journey to success today!
          </p>
          
          {/* IMPROVED: Better call-to-action buttons instead of duplicate search */}
          <div className="hero-actions">
            <button className="primary-cta-btn" onClick={handleStartSearch}>
              🔍 Start Job Search
            </button>
            <button className="secondary-cta-btn" onClick={handleBrowseJobs}>
              📋 Browse All Jobs
            </button>
          </div>

          {/* Job categories for quick access */}
          <div className="job-categories">
            <span className="categories-label">Popular Categories:</span>
            <div className="category-tags">
              <span className="category-tag" onClick={handleStartSearch}>💻 Technology</span>
              <span className="category-tag" onClick={handleStartSearch}>📈 Marketing</span>
              <span className="category-tag" onClick={handleStartSearch}>🎨 Design</span>
              <span className="category-tag" onClick={handleStartSearch}>💼 Sales</span>
            </div>
          </div>
        </div>
        
        <div className="hero-illustration">
          <div className="illustration-placeholder">
            <div className="chart-icon">📊</div>
            <div className="people-icon">👥</div>
            <div className="growth-icon">📈</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
