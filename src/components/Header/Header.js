import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../Auth/AuthModal';
// import NotificationBell from '../NotificationBell/NotificationBell';
import './Header.css';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    setAuthMode('login');
    setAuthModalOpen(true);
  };

  const handleSignup = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  // Navigation handlers for dropdown buttons
  const handleProfileClick = () => {
    const dashboardRoute = currentUser.role === 'employer' ? '/employer-dashboard' : '/dashboard';
    navigate(`${dashboardRoute}?tab=profile`);
    setShowUserMenu(false);
  };

  const handleApplicationsClick = () => {
    if (currentUser.role === 'employer') {
      navigate('/employer-dashboard?tab=candidates');
    } else {
      navigate('/dashboard?tab=applications');
    }
    setShowUserMenu(false);
  };

  const handleSettingsClick = () => {
    const dashboardRoute = currentUser.role === 'employer' ? '/employer-dashboard' : '/dashboard';
    navigate(`${dashboardRoute}?tab=settings`);
    setShowUserMenu(false);
  };

  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  // Get the correct dashboard URL based on user role
  const getDashboardUrl = () => {
    return currentUser?.role === 'employer' ? '/employer-dashboard' : '/dashboard';
  };

  return (
    <>
      <header className="main-header">
        <div className="header-container">
          <div className="brand-logo">
            <div className="logo-icon">🔍</div>
            <div className="brand-text">
              <h2>JobConnect</h2>
              <small>Find your dream job</small>
            </div>
          </div>
          
          <nav className="main-nav">
            <ul>
              <li>
                <NavLink 
                  to="/" 
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/browse" 
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  Browse Jobs
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/about" 
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  About
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/contact" 
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  Contact
                </NavLink>
              </li>
            </ul>
          </nav>
          
          <div className="header-buttons">
            {currentUser ? (
                
              // Authenticated user menu
              <div className="user-menu">
                <button 
                  className="user-avatar"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="avatar-circle">
                    {currentUser.profilePicture ? (
                      <img src={currentUser.profilePicture} alt="Profile" />
                    ) : (
                      <span>{getUserInitials(currentUser.name)}</span>
                    )}
                  </div>
                  <span className="user-name">{currentUser.name}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <p className="user-role">
                        {currentUser.role === 'employer' ? '🏢 Employer' : '👤 Job Seeker'}
                      </p>
                      <p className="user-email">{currentUser.email}</p>
                    </div>
                    <div className="dropdown-divider"></div>
                    
                    {/* UPDATED: Role-based dashboard routing */}
                    <NavLink 
                      to={getDashboardUrl()} 
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      📊 Dashboard
                    </NavLink>
                    
                    {/* UPDATED: Role-based profile and applications routing */}
                    <button className="dropdown-item" onClick={handleProfileClick}>
                      📝 My Profile
                    </button>
                    
                    <button className="dropdown-item" onClick={handleApplicationsClick}>
                      {currentUser.role === 'employer' ? '👥 Candidates' : '📋 My Applications'}
                    </button>
                    
                    {/* Employer-specific menu items */}
                    {currentUser.role === 'employer' && (
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          navigate('/employer-dashboard?tab=jobs');
                          setShowUserMenu(false);
                        }}
                      >
                        💼 My Jobs
                      </button>
                    )}
                    
                    {/* Job seeker-specific menu items */}
                    {currentUser.role !== 'employer' && (
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          navigate('/dashboard?tab=saved');
                          setShowUserMenu(false);
                        }}
                      >
                        ❤️ Saved Jobs
                      </button>
                    )}
                    
                    <button className="dropdown-item" onClick={handleSettingsClick}>
                      ⚙️ Settings
                    </button>
                    
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Guest user buttons
              <>
                <button className="login-btn" onClick={handleLogin}>
                  Log In
                </button>
                <button className="post-job-btn" onClick={handleSignup}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default Header;
