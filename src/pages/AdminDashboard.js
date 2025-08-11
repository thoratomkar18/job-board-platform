import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const { 
    platformStats, 
    users, 
    systemHealth, 
    suspendUser, 
    activateUser, 
    deleteUser 
  } = useAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'overview';
  });

  // Check if user is admin (in real app, this would be a proper role check)
  const isAdmin = currentUser?.email === 'admin@jobconnect.com' || currentUser?.role === 'admin';

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      active: 'status-active',
      suspended: 'status-suspended',
      pending: 'status-pending',
      healthy: 'status-healthy',
      warning: 'status-warning',
      error: 'status-error'
    };
    return classes[status] || 'status-default';
  };

  if (!currentUser) {
    return (
      <div className="admin-dashboard-page">
        <Header />
        <div className="dashboard-container">
          <div className="auth-required">
            <h2>🔐 Authentication Required</h2>
            <p>Please log in to access the admin dashboard.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-dashboard-page">
        <Header />
        <div className="dashboard-container">
          <div className="access-denied">
            <h2>🚫 Admin Access Required</h2>
            <p>This dashboard is only available for platform administrators.</p>
            <small>Contact system administrator for access.</small>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <Header />
      
      <div className="dashboard-container">
        <div className="admin-header">
          <div className="admin-welcome">
            <div className="admin-avatar">
              👨‍💼
            </div>
            <div className="welcome-text">
              <h1>Admin Dashboard</h1>
              <p>Platform Management & Analytics</p>
              <p className="admin-role">🛡️ System Administrator</p>
            </div>
          </div>
          
          <div className="quick-stats">
            <div className="quick-stat">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <div className="stat-number">{formatNumber(platformStats.totalUsers)}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>
            <div className="quick-stat">
              <div className="stat-icon">💼</div>
              <div className="stat-info">
                <div className="stat-number">{formatNumber(platformStats.totalJobs)}</div>
                <div className="stat-label">Jobs Posted</div>
              </div>
            </div>
            <div className="quick-stat">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <div className="stat-number">{formatNumber(platformStats.totalApplications)}</div>
                <div className="stat-label">Applications</div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-sidebar">
            <nav className="admin-nav">
              <button 
                className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabChange('overview')}
              >
                📊 Overview
              </button>
              <button 
                className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => handleTabChange('users')}
              >
                👥 User Management
              </button>
              <button 
                className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`}
                onClick={() => handleTabChange('jobs')}
              >
                💼 Job Management
              </button>
              <button 
                className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => handleTabChange('analytics')}
              >
                📈 Analytics
              </button>
              <button 
                className={`nav-item ${activeTab === 'system' ? 'active' : ''}`}
                onClick={() => handleTabChange('system')}
              >
                ⚙️ System Health
              </button>
              <button 
                className={`nav-item ${activeTab === 'content' ? 'active' : ''}`}
                onClick={() => handleTabChange('content')}
              >
                🛡️ Content Moderation
              </button>
            </nav>
          </div>

          <div className="dashboard-main">
            {activeTab === 'overview' && (
              <div className="overview-section">
                <div className="section-header">
                  <h2>📊 Platform Overview</h2>
                </div>

                <div className="overview-grid">
                  <div className="stats-card">
                    <h3>Key Metrics</h3>
                    <div className="metrics-grid">
                      <div className="metric-item">
                        <div className="metric-value">{formatNumber(platformStats.totalUsers)}</div>
                        <div className="metric-label">Total Users</div>
                        <div className="metric-change positive">+12% this month</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value">{formatNumber(platformStats.totalJobs)}</div>
                        <div className="metric-label">Active Jobs</div>
                        <div className="metric-change positive">+8% this week</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value">{formatNumber(platformStats.totalApplications)}</div>
                        <div className="metric-label">Applications</div>
                        <div className="metric-change positive">+15% this month</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-value">{platformStats.successfulHires}</div>
                        <div className="metric-label">Successful Hires</div>
                        <div className="metric-change positive">+5% this month</div>
                      </div>
                    </div>
                  </div>

                  <div className="activity-card">
                    <h3>Recent Platform Activity</h3>
                    <div className="activity-list">
                      {platformStats.recentActivity.slice(0, 8).map((activity, index) => (
                        <div key={activity.id} className={`activity-item ${activity.type}`}>
                          <div className="activity-time">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="activity-text">{activity.activity}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="breakdown-card">
                    <h3>User Breakdown</h3>
                    <div className="breakdown-chart">
                      <div className="breakdown-item">
                        <div className="breakdown-bar">
                          <div 
                            className="breakdown-fill job-seekers"
                            style={{ width: `${(platformStats.totalJobSeekers / platformStats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <div className="breakdown-label">
                          <span>Job Seekers</span>
                          <span>{formatNumber(platformStats.totalJobSeekers)}</span>
                        </div>
                      </div>
                      <div className="breakdown-item">
                        <div className="breakdown-bar">
                          <div 
                            className="breakdown-fill employers"
                            style={{ width: `${(platformStats.totalEmployers / platformStats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <div className="breakdown-label">
                          <span>Employers</span>
                          <span>{formatNumber(platformStats.totalEmployers)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="top-skills-card">
                    <h3>Top Skills in Demand</h3>
                    <div className="skills-list">
                      {platformStats.topSkills.map((skill, index) => (
                        <div key={skill} className="skill-item">
                          <span className="skill-rank">#{index + 1}</span>
                          <span className="skill-name">{skill}</span>
                          <span className="skill-count">{Math.floor(Math.random() * 50) + 20} jobs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="users-section">
                <div className="section-header">
                  <h2>👥 User Management</h2>
                  <div className="header-actions">
                    <button className="export-btn">📊 Export Users</button>
                  </div>
                </div>

                <div className="users-stats">
                  <div className="user-stat-card">
                    <h4>Total Users</h4>
                    <div className="stat-number">{formatNumber(platformStats.totalUsers)}</div>
                  </div>
                  <div className="user-stat-card">
                    <h4>Job Seekers</h4>
                    <div className="stat-number">{formatNumber(platformStats.totalJobSeekers)}</div>
                  </div>
                  <div className="user-stat-card">
                    <h4>Employers</h4>
                    <div className="stat-number">{formatNumber(platformStats.totalEmployers)}</div>
                  </div>
                </div>

                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Activity</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id}>
                          <td>
                            <div className="user-info">
                              <div className="user-avatar-small">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="user-name">{user.name}</div>
                                <div className="user-email">{user.email}</div>
                                {user.company && <div className="user-company">{user.company}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`role-badge ${user.role}`}>
                              {user.role === 'job_seeker' ? '👤 Job Seeker' : '🏢 Employer'}
                            </span>
                          </td>
                          <td>{new Date(user.joinedDate).toLocaleDateString()}</td>
                          <td>
                            <div className="activity-info">
                              {user.role === 'job_seeker' 
                                ? `${user.applicationsCount} applications`
                                : `${user.jobsPosted} jobs posted`
                              }
                              <div className="last-active">
                                Last active: {new Date(user.lastActive).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${getStatusBadgeClass(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                          <td>
                            <div className="user-actions">
                              {user.status === 'active' ? (
                                <button 
                                  className="action-btn suspend"
                                  onClick={() => suspendUser(user.id)}
                                >
                                  ⏸️ Suspend
                                </button>
                              ) : (
                                <button 
                                  className="action-btn activate"
                                  onClick={() => activateUser(user.id)}
                                >
                                  ▶️ Activate
                                </button>
                              )}
                              <button 
                                className="action-btn delete"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this user?')) {
                                    deleteUser(user.id);
                                  }
                                }}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="analytics-section">
                <div className="section-header">
                  <h2>📈 Platform Analytics</h2>
                </div>

                <div className="analytics-grid">
                  <div className="chart-card">
                    <h3>User Growth (Last 7 Days)</h3>
                    <div className="simple-chart">
                      {platformStats.userGrowth.map((data, index) => (
                        <div key={data.date} className="chart-bar">
                          <div 
                            className="bar-fill"
                            style={{ height: `${(data.newUsers / 20) * 100}%` }}
                          ></div>
                          <div className="bar-label">{data.date.split('-')[2]}</div>
                          <div className="bar-value">{data.newUsers}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="chart-card">
                    <h3>Application Trends (Last 7 Days)</h3>
                    <div className="simple-chart">
                      {platformStats.applicationTrends.map((data, index) => (
                        <div key={data.date} className="chart-bar">
                          <div 
                            className="bar-fill applications"
                            style={{ height: `${(data.applications / 40) * 100}%` }}
                          ></div>
                          <div className="bar-label">{data.date.split('-')[2]}</div>
                          <div className="bar-value">{data.applications}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="analytics-summary">
                    <h3>Performance Summary</h3>
                    <div className="summary-metrics">
                      <div className="summary-item">
                        <div className="summary-label">Average Time to Hire</div>
                        <div className="summary-value">{platformStats.avgTimeToHire} days</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">Application Success Rate</div>
                        <div className="summary-value">7.2%</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">Active Job Fill Rate</div>
                        <div className="summary-value">92%</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">User Retention (30 days)</div>
                        <div className="summary-value">85%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="system-section">
                <div className="section-header">
                  <h2>⚙️ System Health</h2>
                </div>

                <div className="system-grid">
                  <div className="health-card">
                    <h3>Server Status</h3>
                    <div className={`health-indicator ${systemHealth.serverStatus}`}>
                      <div className="health-icon">
                        {systemHealth.serverStatus === 'healthy' ? '🟢' : '🔴'}
                      </div>
                      <div className="health-status">{systemHealth.serverStatus}</div>
                    </div>
                  </div>

                  <div className="health-card">
                    <h3>Database Status</h3>
                    <div className={`health-indicator ${systemHealth.databaseStatus}`}>
                      <div className="health-icon">
                        {systemHealth.databaseStatus === 'healthy' ? '🟢' : '🔴'}
                      </div>
                      <div className="health-status">{systemHealth.databaseStatus}</div>
                    </div>
                  </div>

                  <div className="health-card">
                    <h3>API Response Time</h3>
                    <div className="metric-display">
                      <div className="metric-number">{systemHealth.apiResponseTime}ms</div>
                      <div className="metric-status good">Excellent</div>
                    </div>
                  </div>

                  <div className="health-card">
                    <h3>System Uptime</h3>
                    <div className="metric-display">
                      <div className="metric-number">{systemHealth.uptime}%</div>
                      <div className="metric-status good">Excellent</div>
                    </div>
                  </div>

                  <div className="health-card">
                    <h3>Error Rate</h3>
                    <div className="metric-display">
                      <div className="metric-number">{systemHealth.errorRate}%</div>
                      <div className="metric-status good">Low</div>
                    </div>
                  </div>
                </div>

                <div className="system-actions">
                  <h3>System Actions</h3>
                  <div className="action-buttons">
                    <button className="system-btn backup">💾 Backup Database</button>
                    <button className="system-btn restart">🔄 Restart Services</button>
                    <button className="system-btn maintenance">🛠️ Maintenance Mode</button>
                    <button className="system-btn logs">📋 View System Logs</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="content-section">
                <div className="section-header">
                  <h2>🛡️ Content Moderation</h2>
                </div>

                <div className="moderation-stats">
                  <div className="mod-stat-card">
                    <h4>Pending Reviews</h4>
                    <div className="stat-number">23</div>
                  </div>
                  <div className="mod-stat-card">
                    <h4>Flagged Content</h4>
                    <div className="stat-number">5</div>
                  </div>
                  <div className="mod-stat-card">
                    <h4>Actions Taken</h4>
                    <div className="stat-number">142</div>
                  </div>
                </div>

                <div className="empty-state">
                  <div className="empty-icon">🛡️</div>
                  <h3>No Flagged Content</h3>
                  <p>All content is currently in compliance with platform guidelines.</p>
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

export default AdminDashboard;
