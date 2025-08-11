import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApplications } from '../context/ApplicationContext';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './UserDashboard.css';

const UserDashboard = () => {
  const { currentUser, logout } = useAuth();
  const { getUserApplications, updateApplicationStatus } = useApplications();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    location: '',
    bio: '',
    skills: [],
    experience: '',
    education: ''
  });

  const applications = getUserApplications();

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    // TODO: Save profile data
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      reviewed: 'status-reviewed',
      interview: 'status-interview',
      hired: 'status-hired',
      rejected: 'status-rejected'
    };
    return statusClasses[status] || 'status-pending';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      pending: 'Pending Review',
      reviewed: 'Under Review',
      interview: 'Interview Scheduled',
      hired: 'Hired!',
      rejected: 'Not Selected'
    };
    return statusLabels[status] || 'Pending Review';
  };

  if (!currentUser) {
    return (
      <div className="dashboard-page">
        <Header />
        <div className="dashboard-container">
          <div className="auth-required">
            <h2>🔐 Authentication Required</h2>
            <p>Please log in to access your dashboard.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Header />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="user-welcome">
            <div className="user-avatar-large">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="welcome-text">
              <h1>Welcome back, {currentUser.name}!</h1>
              <p className="user-role">
                {currentUser.role === 'employer' ? '🏢 Employer Account' : '👤 Job Seeker'}
              </p>
            </div>
          </div>
          
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-number">{applications.length}</div>
              <div className="stat-label">Applications</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {applications.filter(app => app.status === 'interview').length}
              </div>
              <div className="stat-label">Interviews</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {applications.filter(app => app.status === 'hired').length}
              </div>
              <div className="stat-label">Hired</div>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-sidebar">
            <nav className="dashboard-nav">
              <button 
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                👤 My Profile
              </button>
              <button 
                className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveTab('applications')}
              >
                📋 My Applications
              </button>
              <button 
                className={`nav-item ${activeTab === 'saved' ? 'active' : ''}`}
                onClick={() => setActiveTab('saved')}
              >
                ❤️ Saved Jobs
              </button>
              <button 
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                ⚙️ Settings
              </button>
            </nav>
          </div>

          <div className="dashboard-main">
            {activeTab === 'profile' && (
              <div className="profile-section">
                <div className="section-header">
                  <h2>👤 My Profile</h2>
                  <button 
                    className="edit-btn"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? '❌ Cancel' : '✏️ Edit Profile'}
                  </button>
                </div>

                {isEditing ? (
                  <form onSubmit={handleProfileUpdate} className="profile-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="form-group">
                        <label>Location</label>
                        <input
                          type="text"
                          name="location"
                          value={profileData.location}
                          onChange={handleInputChange}
                          placeholder="City, State"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Bio</label>
                      <textarea
                        name="bio"
                        value={profileData.bio}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Experience</label>
                      <textarea
                        name="experience"
                        value={profileData.experience}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Describe your work experience..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Education</label>
                      <textarea
                        name="education"
                        value={profileData.education}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Your educational background..."
                      />
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="save-btn">
                        💾 Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-display">
                    <div className="profile-card">
                      <h3>Contact Information</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <strong>Name:</strong> {currentUser.name}
                        </div>
                        <div className="info-item">
                          <strong>Email:</strong> {currentUser.email}
                        </div>
                        <div className="info-item">
                          <strong>Phone:</strong> {profileData.phone || 'Not provided'}
                        </div>
                        <div className="info-item">
                          <strong>Location:</strong> {profileData.location || 'Not provided'}
                        </div>
                      </div>
                    </div>

                    <div className="profile-card">
                      <h3>About Me</h3>
                      <p>{profileData.bio || 'No bio provided yet. Click "Edit Profile" to add your bio.'}</p>
                    </div>

                    <div className="profile-card">
                      <h3>Experience</h3>
                      <p>{profileData.experience || 'No experience added yet. Click "Edit Profile" to add your experience.'}</p>
                    </div>

                    <div className="profile-card">
                      <h3>Education</h3>
                      <p>{profileData.education || 'No education information added yet.'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="applications-section">
                <div className="section-header">
                  <h2>📋 My Applications</h2>
                  <span className="applications-count">{applications.length} applications</span>
                </div>

                {applications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>No Applications Yet</h3>
                    <p>You haven't applied to any jobs yet. Start browsing and applying to jobs!</p>
                    <button className="browse-jobs-cta" onClick={() => window.location.href = '/browse'}>
                      Browse Jobs
                    </button>
                  </div>
                ) : (
                  <div className="applications-list">
                    {applications.map((application) => (
                      <div key={application.id} className="application-card">
                        <div className="application-header">
                          <div className="job-info">
                            <h3>{application.jobTitle}</h3>
                            <p>{application.companyName}</p>
                            <span className="applied-date">
                              Applied on {new Date(application.appliedDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className={`status-badge ${getStatusBadgeClass(application.status)}`}>
                            {getStatusLabel(application.status)}
                          </div>
                        </div>
                        
                        <div className="application-details">
                          <div className="detail-item">
                            <strong>Expected Salary:</strong> ${application.expectedSalary}
                          </div>
                          {application.resumeFileName && (
                            <div className="detail-item">
                              <strong>Resume:</strong> {application.resumeFileName}
                            </div>
                          )}
                          {application.coverLetter && (
                            <div className="detail-item">
                              <strong>Cover Letter:</strong> 
                              <p className="cover-letter-preview">
                                {application.coverLetter.substring(0, 100)}...
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="saved-section">
                <div className="section-header">
                  <h2>❤️ Saved Jobs</h2>
                </div>
                <div className="empty-state">
                  <div className="empty-icon">💾</div>
                  <h3>No Saved Jobs</h3>
                  <p>Jobs you bookmark will appear here for easy access later.</p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-section">
                <div className="section-header">
                  <h2>⚙️ Account Settings</h2>
                </div>
                
                <div className="settings-card">
                  <h3>Account Information</h3>
                  <div className="setting-item">
                    <div className="setting-info">
                      <strong>Account Type:</strong> 
                      {currentUser.role === 'employer' ? ' Employer' : ' Job Seeker'}
                    </div>
                  </div>
                  <div className="setting-item">
                    <div className="setting-info">
                      <strong>Member Since:</strong> {currentUser.joinedDate || 'Recently'}
                    </div>
                  </div>
                </div>

                <div className="settings-card">
                  <h3>Privacy & Security</h3>
                  <div className="setting-item">
                    <button className="danger-btn" onClick={logout}>
                      🚪 Sign Out
                    </button>
                  </div>
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



export default UserDashboard;
