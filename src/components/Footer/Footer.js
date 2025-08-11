import React from 'react';
import './Footer.css';

const Footer = () => {
  // I added current year automatically - learned this trick
  const currentYear = new Date().getFullYear();

  return (
    <footer className="main-footer">
      <div className="footer-container">
        {/* Footer main content */}
        <div className="footer-content">
          {/* Company info section */}
          <div className="footer-section company-info">
            <div className="footer-logo">
              <div className="logo-icon">🔍</div>
              <div className="logo-text">
                <h3>JobConnect</h3>
                <p>Find your dream job</p>
              </div>
            </div>
            <p className="company-description">
              We connect talented professionals with amazing career opportunities. 
              Your next job is just a click away!
            </p>
            <div className="social-links">
              <a href="#" className="social-link">📘 Facebook</a>
              <a href="#" className="social-link">🐦 Twitter</a>
              <a href="#" className="social-link">💼 LinkedIn</a>
              <a href="#" className="social-link">📷 Instagram</a>
            </div>
          </div>

          {/* Quick links section */}
          <div className="footer-section">
            <h4>For Job Seekers</h4>
            <ul className="footer-links">
              <li><a href="/browse-jobs">Browse Jobs</a></li>
              <li><a href="/job-alerts">Job Alerts</a></li>
              <li><a href="/resume-builder">Resume Builder</a></li>
              <li><a href="/career-advice">Career Advice</a></li>
              <li><a href="/salary-guide">Salary Guide</a></li>
            </ul>
          </div>

          {/* Employer links section */}
          <div className="footer-section">
            <h4>For Employers</h4>
            <ul className="footer-links">
              <li><a href="/post-job">Post a Job</a></li>
              <li><a href="/search-candidates">Search Candidates</a></li>
              <li><a href="/pricing">Pricing Plans</a></li>
              <li><a href="/employer-resources">Resources</a></li>
              <li><a href="/contact-sales">Contact Sales</a></li>
            </ul>
          </div>

          {/* Company links section */}
          <div className="footer-section">
            <h4>Company</h4>
            <ul className="footer-links">
              <li><a href="/about">About Us</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/careers">We're Hiring</a></li>
              <li><a href="/press">Press & Media</a></li>
              <li><a href="/help">Help Center</a></li>
            </ul>
          </div>

          {/* Newsletter section */}
          <div className="footer-section newsletter-section">
            <h4>Stay Updated</h4>
            <p>Get the latest jobs and career tips delivered to your inbox.</p>
            <div className="newsletter-form">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="newsletter-input"
              />
              <button className="newsletter-btn">Subscribe</button>
            </div>
            <div className="job-stats">
              <div className="stat">
                <span className="stat-number">4,536+</span>
                <span className="stat-label">Active Jobs</span>
              </div>
              <div className="stat">
                <span className="stat-number">12,000+</span>
                <span className="stat-label">Happy Candidates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bottom section */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} JobConnect. All rights reserved. Built with ❤️ by Omkar Thorat
            </p>
            <div className="footer-legal">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="/cookies">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
