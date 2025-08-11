import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './JobDetailPage.css';

const JobDetailPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState('');

  useEffect(() => {
    // Simulating API call to get job details
    setTimeout(() => {
      // In a real app, this would fetch from your backend API
      const jobDetails = {
        1: {
          id: 1,
          title: "Frontend Developer",
          company: "Tech Solutions Inc",
          location: "New York, NY",
          type: "Full-time",
          salary: "$75,000 - $95,000",
          experienceLevel: "Mid Level",
          postedDate: "2025-08-05",
          description: "We are looking for a skilled Frontend Developer to join our dynamic team.",
          fullDescription: `
            <h3>🚀 About the Role</h3>
            <p>We are seeking a talented Frontend Developer to join our growing engineering team. In this role, you'll work closely with our design and backend teams to create exceptional user experiences that delight our customers.</p>
            
            <h3>🎯 Key Responsibilities</h3>
            <ul>
              <li>Develop responsive web applications using React and modern JavaScript</li>
              <li>Collaborate with UI/UX designers to implement pixel-perfect designs</li>
              <li>Write clean, maintainable, and well-documented code</li>
              <li>Optimize applications for maximum speed and scalability</li>
              <li>Participate in code reviews and maintain high code quality standards</li>
              <li>Stay up-to-date with the latest frontend technologies and best practices</li>
            </ul>
            
            <h3>✅ Requirements</h3>
            <ul>
              <li>3+ years of experience in frontend development</li>
              <li>Strong proficiency in React, JavaScript, HTML, and CSS</li>
              <li>Experience with responsive design and cross-browser compatibility</li>
              <li>Knowledge of version control systems (Git)</li>
              <li>Understanding of RESTful APIs and AJAX</li>
              <li>Bachelor's degree in Computer Science or related field</li>
            </ul>
            
            <h3>🌟 Nice to Have</h3>
            <ul>
              <li>Experience with TypeScript and modern build tools</li>
              <li>Knowledge of testing frameworks (Jest, Cypress, React Testing Library)</li>
              <li>Familiarity with design tools like Figma or Sketch</li>
              <li>Understanding of SEO principles and web accessibility</li>
              <li>Experience with state management libraries (Redux, Zustand)</li>
            </ul>
            
            <h3>💎 Benefits & Perks</h3>
            <ul>
              <li>Competitive salary and equity package</li>
              <li>Comprehensive health, dental, and vision insurance</li>
              <li>Flexible working hours and remote work options</li>
              <li>$3,000 annual professional development budget</li>
              <li>Catered meals and premium snacks</li>
              <li>Top-tier equipment and ergonomic workspace</li>
              <li>Unlimited PTO and mental health support</li>
            </ul>
          `,
          skills: ["React", "JavaScript", "CSS", "HTML", "TypeScript", "Git", "REST APIs", "Responsive Design"],
          companyInfo: {
            name: "Tech Solutions Inc",
            size: "50-200 employees",
            industry: "Technology & Software",
            founded: "2018",
            website: "www.techsolutions.com",
            description: "We're a fast-growing tech company focused on building innovative solutions that solve real-world problems. Our team is passionate about creating products that make a difference.",
            culture: "We believe in work-life balance, continuous learning, and fostering an inclusive environment where everyone can thrive."
          }
        },
        // Add more job details as needed
        2: {
          id: 2,
          title: "Backend Developer",
          company: "Digital Innovations",
          location: "San Francisco, CA",
          type: "Full-time",
          salary: "$80,000 - $100,000",
          experienceLevel: "Senior Level",
          postedDate: "2025-08-04",
          description: "Join our backend team to build scalable server-side applications.",
          fullDescription: `
            <h3>🚀 About the Role</h3>
            <p>We're looking for an experienced Backend Developer to design and implement robust server-side applications that power our platform.</p>
            
            <h3>🎯 Key Responsibilities</h3>
            <ul>
              <li>Design and develop RESTful APIs and microservices</li>
              <li>Work with databases and optimize query performance</li>
              <li>Implement security best practices and data protection</li>
              <li>Collaborate with frontend teams for seamless integration</li>
              <li>Monitor and improve application performance</li>
            </ul>
            
            <h3>✅ Requirements</h3>
            <ul>
              <li>5+ years of backend development experience</li>
              <li>Strong proficiency in Node.js and Express</li>
              <li>Experience with MongoDB and SQL databases</li>
              <li>Knowledge of cloud platforms (AWS, GCP, Azure)</li>
              <li>Understanding of DevOps practices and CI/CD</li>
            </ul>
          `,
          skills: ["Node.js", "MongoDB", "Express", "API", "AWS", "Docker", "PostgreSQL"],
          companyInfo: {
            name: "Digital Innovations",
            size: "100-500 employees",
            industry: "Digital Marketing",
            founded: "2015",
            website: "www.digitalinnovations.com",
            description: "Leading digital transformation through innovative technology solutions.",
            culture: "Innovation-driven culture with focus on cutting-edge technology."
          }
        }
      };
      
      const jobDetail = jobDetails[jobId];
      setJob(jobDetail);
      setLoading(false);
    }, 800);
  }, [jobId]);

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Save to localStorage or backend
  };

  const handleApply = () => {
    setApplicationStatus('applying');
    // Simulate application process
    setTimeout(() => {
      setApplicationStatus('success');
      alert('🎉 Application submitted successfully! We will review your application and get back to you within 2-3 business days.');
    }, 1500);
  };

  const handleBackToJobs = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="job-detail-page">
        <Header />
        <div className="job-detail-loading">
          <div className="loading-spinner"></div>
          <p>Loading job details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-detail-page">
        <Header />
        <div className="job-not-found">
          <div className="not-found-content">
            <h2>😕 Job Not Found</h2>
            <p>The job you're looking for doesn't exist or has been removed.</p>
            <button className="back-to-jobs-btn" onClick={handleBackToJobs}>
              ← Back to Job Listings
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="job-detail-page">
      <Header />
      
      <div className="job-detail-container">
        {/* Breadcrumb navigation */}
        <div className="breadcrumb">
          <button onClick={handleBackToJobs} className="breadcrumb-link">
            ← Back to Jobs
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{job.title}</span>
        </div>

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
                <span className="job-type-badge">{job.type}</span>
                <span className="experience-level">{job.experienceLevel}</span>
                <span className="salary">💰 {job.salary}</span>
              </div>
              <div className="posted-date">
                🕒 Posted on {new Date(job.postedDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
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
            <button 
              className={`apply-btn-large ${applicationStatus}`}
              onClick={handleApply}
              disabled={applicationStatus === 'applying' || applicationStatus === 'success'}
            >
              {applicationStatus === 'applying' ? '⏳ Applying...' :
               applicationStatus === 'success' ? '✅ Applied' :
               '📄 Apply Now'}
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
              <h3>🛠️ Required Skills & Technologies</h3>
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
              <h3>🏢 About {job.companyInfo.name}</h3>
              <p className="company-description">{job.companyInfo.description}</p>
              <div className="company-details">
                <div className="detail-item">
                  <strong>Industry:</strong> {job.companyInfo.industry}
                </div>
                <div className="detail-item">
                  <strong>Company Size:</strong> {job.companyInfo.size}
                </div>
                <div className="detail-item">
                  <strong>Founded:</strong> {job.companyInfo.founded}
                </div>
                <div className="detail-item">
                  <strong>Website:</strong> 
                  <a href={`https://${job.companyInfo.website}`} target="_blank" rel="noopener noreferrer">
                    {job.companyInfo.website}
                  </a>
                </div>
              </div>
              <div className="company-culture">
                <h4>🌟 Company Culture</h4>
                <p>{job.companyInfo.culture}</p>
              </div>
            </div>

            <div className="application-card">
              <h3>🎯 Ready to Apply?</h3>
              <p>Join our team and start your journey with us today!</p>
              <button 
                className={`apply-btn-sidebar ${applicationStatus}`}
                onClick={handleApply}
                disabled={applicationStatus === 'applying' || applicationStatus === 'success'}
              >
                {applicationStatus === 'applying' ? 'Submitting Application...' :
                 applicationStatus === 'success' ? 'Application Submitted ✅' :
                 'Apply for this Position'}
              </button>
              <div className="application-note">
                <small>
                  📧 We review applications within 2-3 business days and will contact qualified candidates for interviews.
                </small>
              </div>
            </div>

            <div className="share-job-card">
              <h3>📤 Share this Job</h3>
              <div className="share-buttons">
                <button className="share-btn linkedin">Share on LinkedIn</button>
                <button className="share-btn twitter">Share on Twitter</button>
                <button className="share-btn email">Share via Email</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default JobDetailPage;
