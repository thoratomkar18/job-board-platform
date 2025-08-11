import React from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <Header />
      <div className="page-content">
        <div className="about-hero">
          <div className="container">
            <h1>About JobConnect</h1>
            <p>Connecting talented professionals with amazing career opportunities</p>
          </div>
        </div>
        
        <div className="about-content">
          <div className="container">
            <div className="about-grid">
              <div className="about-section">
                <h2>🚀 Our Mission</h2>
                <p>We believe that everyone deserves to find meaningful work that aligns with their skills, values, and aspirations. Our platform bridges the gap between talented job seekers and forward-thinking companies.</p>
              </div>
              
              <div className="about-section">
                <h2>💼 For Job Seekers</h2>
                <p>Discover opportunities from top companies, get personalized job recommendations, and take control of your career journey with our advanced search and application tools.</p>
              </div>
              
              <div className="about-section">
                <h2>🏢 For Employers</h2>
                <p>Find the perfect candidates for your team with our comprehensive recruitment platform. Post jobs, search candidates, and build your dream team efficiently.</p>
              </div>
              
              <div className="about-section">
                <h2>📈 Our Impact</h2>
                <div className="stats-grid">
                  <div className="stat">
                    <h3>4,536+</h3>
                    <p>Active Jobs</p>
                  </div>
                  <div className="stat">
                    <h3>12,000+</h3>
                    <p>Happy Candidates</p>
                  </div>
                  <div className="stat">
                    <h3>500+</h3>
                    <p>Partner Companies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;
