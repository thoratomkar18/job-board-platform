import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './EmployerDashboard.css';

const EmployerDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data for employer jobs - in real app, this would come from API
  const [employerJobs, setEmployerJobs] = useState([
    {
      id: 1,
      title: "Senior Frontend Developer",
      location: "New York, NY",
      type: "Full-time",
      salary: "$90,000 - $120,000",
      status: "active",
      applicants: 24,
      views: 156,
      postedDate: "2025-01-15",
      description: "Looking for an experienced frontend developer..."
    },
    {
      id: 2,
      title: "Product Manager",
      location: "San Francisco, CA", 
      type: "Full-time",
      salary: "$100,000 - $130,000",
      status: "paused",
      applicants: 18,
      views: 89,
      postedDate: "2025-01-10",
      description: "Join our product team to drive innovation..."
    }
  ]);

  const [newJob, setNewJob] = useState({
    title: '',
    location: '',
    type: 'Full-time',
    salary: '',
    description: '',
    requirements: '',
    benefits: '',
    skills: '',
    experienceLevel: 'Mid Level'
  });

  // Read URL parameter for active tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const validTabs = ['overview', 'jobs', 'post-job', 'candidates', 'settings'];
    
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const handleJobPost = (e) => {
    e.preventDefault();
    
    const jobData = {
      id: Date.now(),
      ...newJob,
      status: 'active',
      applicants: 0,
      views: 0,
      postedDate: new Date().toISOString().split('T')[0],
      skills: newJob.skills.split(',').map(s => s.trim())
    };

    setEmployerJobs(prev => [jobData, ...prev]);
    
    // Reset form
    setNewJob({
      title: '',
      location: '',
      type: 'Full-time',
      salary: '',
      description: '',
      requirements: '',
      benefits: '',
      skills: '',
      experienceLevel: 'Mid Level'
    });

    alert('🎉 Job posted successfully!');
    setActiveTab('jobs');
    setSearchParams({ tab: 'jobs' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewJob(prev => ({ ...prev, [name]: value }));
  };

  const toggleJobStatus = (jobId) => {
    setEmployerJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: job.status === 'active' ? 'paused' : 'active' }
        : job
    ));
  };

  const getTotalStats = () => {
    return {
      totalJobs: employerJobs.length,
      activeJobs: employerJobs.filter(job => job.status === 'active').length,
      totalApplicants: employerJobs.reduce((sum, job) => sum + job.applicants, 0),
      totalViews: employerJobs.reduce((sum, job) => sum + job.views, 0)
    };
  };

  const stats = getTotalStats();

  if (!currentUser) {
    return (
      <div className="employer-dashboard-page">
        <Header />
        <div className="dashboard-container">
          <div className="auth-required">
            <h2>🔐 Authentication Required</h2>
            <p>Please log in to access your employer dashboard.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (currentUser.role !== 'employer') {
    return (
      <div className="employer-dashboard-page">
        <Header />
        <div className="dashboard-container">
          <div className="access-denied">
            <h2>🚫 Access Restricted</h2>
            <p>This dashboard is only available for employer accounts.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="employer-dashboard-page">
      <Header />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="employer-welcome">
            <div className="company-avatar-large">
              {currentUser.company ? currentUser.company.charAt(0).toUpperCase() : 'E'}
            </div>
            <div className="welcome-text">
              <h1>Welcome back!</h1>
              <p className="company-name">{currentUser.company || 'Your Company'}</p>
              <p className="employer-role">🏢 Employer Dashboard</p>
            </div>
          </div>
          
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-number">{stats.totalJobs}</div>
              <div className="stat-label">Posted Jobs</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.activeJobs}</div>
              <div className="stat-label">Active Jobs</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalApplicants}</div>
              <div className="stat-label">Applications</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalViews}</div>
              <div className="stat-label">Job Views</div>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-sidebar">
            <nav className="dashboard-nav">
              <button 
                className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabChange('overview')}
              >
                📊 Overview
              </button>
              <button 
                className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`}
                onClick={() => handleTabChange('jobs')}
              >
                💼 My Jobs
              </button>
              <button 
                className={`nav-item ${activeTab === 'post-job' ? 'active' : ''}`}
                onClick={() => handleTabChange('post-job')}
              >
                ➕ Post New Job
              </button>
              <button 
                className={`nav-item ${activeTab === 'candidates' ? 'active' : ''}`}
                onClick={() => handleTabChange('candidates')}
              >
                👥 Candidates
              </button>
              <button 
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleTabChange('settings')}
              >
                ⚙️ Settings
              </button>
            </nav>
          </div>

          <div className="dashboard-main">
            {activeTab === 'overview' && (
              <div className="overview-section">
                <div className="section-header">
                  <h2>📊 Dashboard Overview</h2>
                </div>

                <div className="overview-grid">
                  <div className="overview-card">
                    <h3>Recent Activity</h3>
                    <div className="activity-list">
                      <div className="activity-item">
                        <span className="activity-icon">👀</span>
                        <div className="activity-text">
                          <p><strong>Frontend Developer</strong> received 5 new views</p>
                          <small>2 hours ago</small>
                        </div>
                      </div>
                      <div className="activity-item">
                        <span className="activity-icon">📝</span>
                        <div className="activity-text">
                          <p><strong>Product Manager</strong> got 2 new applications</p>
                          <small>4 hours ago</small>
                        </div>
                      </div>
                      <div className="activity-item">
                        <span className="activity-icon">✨</span>
                        <div className="activity-text">
                          <p>Job posting <strong>Senior Frontend Developer</strong> is performing well</p>
                          <small>1 day ago</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overview-card">
                    <h3>Top Performing Jobs</h3>
                    <div className="top-jobs-list">
                      {employerJobs.slice(0, 3).map(job => (
                        <div key={job.id} className="top-job-item">
                          <div className="job-info">
                            <strong>{job.title}</strong>
                            <p>{job.applicants} applications • {job.views} views</p>
                          </div>
                          <div className={`job-status-badge ${job.status}`}>
                            {job.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="overview-card">
                    <h3>Quick Actions</h3>
                    <div className="quick-actions">
                      <button 
                        className="quick-action-btn primary"
                        onClick={() => handleTabChange('post-job')}
                      >
                        ➕ Post New Job
                      </button>
                      <button 
                        className="quick-action-btn secondary"
                        onClick={() => handleTabChange('candidates')}
                      >
                        👥 View Candidates
                      </button>
                      <button 
                        className="quick-action-btn secondary"
                        onClick={() => handleTabChange('jobs')}
                      >
                        📊 Job Analytics
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="jobs-section">
                <div className="section-header">
                  <h2>💼 My Jobs</h2>
                  <button 
                    className="post-job-cta"
                    onClick={() => handleTabChange('post-job')}
                  >
                    ➕ Post New Job
                  </button>
                </div>

                {employerJobs.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">💼</div>
                    <h3>No Jobs Posted Yet</h3>
                    <p>Start by posting your first job to attract talented candidates!</p>
                    <button 
                      className="post-first-job-btn"
                      onClick={() => handleTabChange('post-job')}
                    >
                      Post Your First Job
                    </button>
                  </div>
                ) : (
                  <div className="jobs-list">
                    {employerJobs.map((job) => (
                      <div key={job.id} className="job-card-employer">
                        <div className="job-header">
                          <div className="job-main-info">
                            <h3>{job.title}</h3>
                            <p className="job-details">
                              {job.location} • {job.type} • {job.salary}
                            </p>
                            <p className="job-posted">
                              Posted on {new Date(job.postedDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className={`status-badge-large ${job.status}`}>
                            {job.status === 'active' ? '🟢 Active' : '⏸️ Paused'}
                          </div>
                        </div>
                        
                        <div className="job-metrics">
                          <div className="metric">
                            <span className="metric-number">{job.applicants}</span>
                            <span className="metric-label">Applications</span>
                          </div>
                          <div className="metric">
                            <span className="metric-number">{job.views}</span>
                            <span className="metric-label">Views</span>
                          </div>
                          <div className="metric">
                            <span className="metric-number">
                              {job.applicants > 0 ? Math.round((job.applicants / job.views) * 100) : 0}%
                            </span>
                            <span className="metric-label">Conversion</span>
                          </div>
                        </div>

                        <div className="job-actions">
                          <button className="action-btn view">👁️ View Details</button>
                          <button className="action-btn edit">✏️ Edit Job</button>
                          <button 
                            className={`action-btn toggle ${job.status}`}
                            onClick={() => toggleJobStatus(job.id)}
                          >
                            {job.status === 'active' ? '⏸️ Pause' : '▶️ Activate'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'post-job' && (
              <div className="post-job-section">
                <div className="section-header">
                  <h2>➕ Post New Job</h2>
                </div>

                <form onSubmit={handleJobPost} className="job-post-form">
                  <div className="form-section">
                    <h3>Job Basics</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Job Title *</label>
                        <input
                          type="text"
                          name="title"
                          value={newJob.title}
                          onChange={handleInputChange}
                          placeholder="e.g. Senior Frontend Developer"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Location *</label>
                        <input
                          type="text"
                          name="location"
                          value={newJob.location}
                          onChange={handleInputChange}
                          placeholder="e.g. New York, NY or Remote"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Employment Type *</label>
                        <select
                          name="type"
                          value={newJob.type}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Freelance">Freelance</option>
                          <option value="Internship">Internship</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Experience Level *</label>
                        <select
                          name="experienceLevel"
                          value={newJob.experienceLevel}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="Entry Level">Entry Level</option>
                          <option value="Mid Level">Mid Level</option>
                          <option value="Senior Level">Senior Level</option>
                          <option value="Executive">Executive</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Salary Range *</label>
                      <input
                        type="text"
                        name="salary"
                        value={newJob.salary}
                        onChange={handleInputChange}
                        placeholder="e.g. $80,000 - $100,000"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Job Details</h3>
                    <div className="form-group">
                      <label>Job Description *</label>
                      <textarea
                        name="description"
                        value={newJob.description}
                        onChange={handleInputChange}
                        rows="6"
                        placeholder="Describe the role, responsibilities, and what makes this opportunity great..."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Requirements *</label>
                      <textarea
                        name="requirements"
                        value={newJob.requirements}
                        onChange={handleInputChange}
                        rows="5"
                        placeholder="List the required skills, experience, education, and qualifications..."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Skills (comma-separated)</label>
                      <input
                        type="text"
                        name="skills"
                        value={newJob.skills}
                        onChange={handleInputChange}
                        placeholder="e.g. React, JavaScript, Node.js, MongoDB"
                      />
                    </div>

                    <div className="form-group">
                      <label>Benefits & Perks</label>
                      <textarea
                        name="benefits"
                        value={newJob.benefits}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Describe benefits, perks, company culture, growth opportunities..."
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="cancel-btn">
                      Cancel
                    </button>
                    <button type="submit" className="publish-btn">
                      🚀 Publish Job
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'candidates' && (
              <div className="candidates-section">
                <div className="section-header">
                  <h2>👥 Candidates</h2>
                </div>
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h3>No Applications Yet</h3>
                  <p>When candidates apply to your jobs, they'll appear here for review.</p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>⚙️ Company Settings</h2>
                </div>
                
                <div className="settings-card">
                  <h3>Company Information</h3>
                  <div className="company-info-display">
                    <div className="info-row">
                      <strong>Company Name:</strong> {currentUser.company || 'Not provided'}
                    </div>
                    <div className="info-row">
                      <strong>Contact Email:</strong> {currentUser.email}
                    </div>
                    <div className="info-row">
                      <strong>Account Type:</strong> Employer
                    </div>
                  </div>
                </div>

                <div className="settings-card">
                  <h3>Account Actions</h3>
                  <button className="danger-btn" onClick={logout}>
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default EmployerDashboard;
