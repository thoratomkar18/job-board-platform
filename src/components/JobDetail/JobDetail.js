import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './JobDetail.css';

const JobDetail = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating API call to get job details
    setTimeout(() => {
      // This would normally fetch from your backend API
      const jobDetail = {
        id: jobId,
        title: "Frontend Developer",
        company: "Tech Solutions Inc",
        location: "New York, NY",
        type: "Full-time",
        salary: "$75,000 - $95,000",
        postedDate: "2025-08-05",
        description: "We are looking for a skilled Frontend Developer to join our dynamic team. You will be responsible for developing user-facing web applications using modern frameworks and technologies.",
        fullDescription: `
          <h3>About the Role</h3>
          <p>We are seeking a talented Frontend Developer to join our growing engineering team. In this role, you'll work closely with our design and backend teams to create exceptional user experiences.</p>
          
          <h3>Key Responsibilities</h3>
          <ul>
            <li>Develop responsive web applications using React and modern JavaScript</li>
            <li>Collaborate with UI/UX designers to implement pixel-perfect designs</li>
            <li>Write clean, maintainable, and well-documented code</li>
            <li>Optimize applications for maximum speed and scalability</li>
            <li>Participate in code reviews and maintain high code quality standards</li>
          </ul>
          
          <h3>Requirements</h3>
          <ul>
            <li>3+ years of experience in frontend development</li>
            <li>Strong proficiency in React, JavaScript, HTML, and CSS</li>
            <li>Experience with responsive design and cross-browser compatibility</li>
            <li>Knowledge of version control systems (Git)</li>
            <li>Understanding of RESTful APIs and AJAX</li>
          </ul>
          
          <h3>Nice to Have</h3>
          <ul>
            <li>Experience with TypeScript</li>
            <li>Knowledge of testing frameworks (Jest, Cypress)</li>
            <li>Familiarity with design tools like Figma</li>
            <li>Understanding of SEO principles</li>
          </ul>
          
          <h3>Benefits</h3>
          <ul>
            <li>Competitive salary and equity package</li>
            <li>Health, dental, and vision insurance</li>
            <li>Flexible working hours and remote work options</li>
            <li>Professional development budget</li>
            <li>Catered meals and snacks</li>
          </ul>
        `,
        skills: ["React", "JavaScript", "CSS", "HTML", "TypeScript", "Git", "REST APIs"],
        companyInfo: {
          name: "Tech Solutions Inc",
          size: "50-200 employees",
          industry: "Technology",
          founded: "2018",
          website: "www.techsolutions.com"
        }
      };
      
      setJob(jobDetail);
      setLoading(false);
    }, 800);
  }, [jobId]);

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleApply = () => {
    // TODO: Implement apply functionality
    alert('Application feature coming soon!');
  };

  if (loading) {
    return (
      <div className="job-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-not-found">
        <h2>Job not found</h2>
        <p>The job you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="job-detail-page">
      <div className="job-detail-container">
        {/* Job header */}
        <div className="job-detail-header">
          <div className="job-header-content">
            <div className="company-logo-large">
              {job.company.charAt(0)}
            </div>
            <div className="job-header-info">
              <h1 className="job-detail-title">{job.title}</h1>
              <p className="company-name-large">{job.company}</p>
              <div className="job-meta-large">
                <span className="location">📍 {job.location}</span>
                <span className="job-type">{job.type}</span>
                <span className="salary">💰 {job.salary}</span>
              </div>
            </div>
          </div>
          <div className="job-actions">
            <button 
              className={`bookmark-btn-large ${isBookmarked ? 'bookmarked' : ''}`}
              onClick={handleBookmark}
            >
              {isBookmarked ? '❤️ Saved' : '🤍 Save Job'}
            </button>
            <button className="apply-btn-large" onClick={handleApply}>
              📄 Apply Now
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="job-detail-content">
          <div className="job-description-section">
            <div 
              className="job-full-description"
              dangerouslySetInnerHTML={{ __html: job.fullDescription }}
            />
            
            <div className="job-skills-section">
              <h3>Required Skills</h3>
              <div className="skills-grid">
                {job.skills.map((skill, index) => (
                  <span key={index} className="skill-badge">{skill}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="job-detail-sidebar">
            <div className="company-info-card">
              <h3>About {job.companyInfo.name}</h3>
              <div className="company-details">
                <p><strong>Industry:</strong> {job.companyInfo.industry}</p>
                <p><strong>Company Size:</strong> {job.companyInfo.size}</p>
                <p><strong>Founded:</strong> {job.companyInfo.founded}</p>
                <p><strong>Website:</strong> <a href={`https://${job.companyInfo.website}`} target="_blank" rel="noopener noreferrer">{job.companyInfo.website}</a></p>
              </div>
            </div>

            <div className="application-card">
              <h3>Ready to Apply?</h3>
              <p>Join our team and start your journey with us today!</p>
              <button className="apply-btn-sidebar" onClick={handleApply}>
                Apply for this Position
              </button>
              <p className="application-note">
                We review applications within 2-3 business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;

// In the useEffect where you load job data, add scroll after loading:
useEffect(() => {
  setTimeout(() => {
    const jobDetails = {
      // ... your job details
    };
    
    const jobDetail = jobDetails[jobId];
    setJob(jobDetail);
    setLoading(false);
    
    // FIX: Scroll to top after content loads
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
    
  }, 800);
}, [jobId]);
