import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Menu, X, ChevronDown, LayoutDashboard,
  User, Bookmark, Settings, LogOut, Bell, Shield, Building2, Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import AuthModal from '../Auth/AuthModal';
import './Header.css';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getDashboardUrl = () => {
    if (currentUser?.role === 'admin') return '/admin';
    if (currentUser?.role === 'employer') return '/employer-dashboard';
    return '/dashboard';
  };

  const getUserInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  // Role-Specific Navigation Links (High-level routes only — sub-tabs belong in dashboard sidebars to eliminate duplicate buttons)
  const getNavLinks = () => {
    if (!currentUser) {
      return [
        { to: '/', label: 'Home', end: true },
        { to: '/browse', label: 'Browse Jobs' },
        { to: '/about', label: 'About' },
        { to: '/contact', label: 'Contact' },
      ];
    }
    if (currentUser.role === 'employer') {
      return [
        { to: '/', label: 'Home', end: true },
        { to: '/browse', label: 'Browse Jobs' },
        { to: '/employer-dashboard', label: 'Dashboard' },
      ];
    }
    if (currentUser.role === 'admin') {
      return [
        { to: '/', label: 'Home', end: true },
        { to: '/browse', label: 'Browse Jobs' },
        { to: '/admin', label: 'Admin Portal' },
      ];
    }
    // Default: job_seeker
    return [
      { to: '/', label: 'Home', end: true },
      { to: '/browse', label: 'Browse Jobs' },
      { to: '/dashboard', label: 'Dashboard' },
    ];
  };

  const navLinks = getNavLinks();

  const isLinkActive = (item) => {
    const currentFull = location.pathname + location.search;
    if (item.end) return location.pathname === item.to;
    if (item.to.includes('?')) return currentFull === item.to;
    return location.pathname === item.to;
  };

  const closeAll = () => { setShowUserMenu(false); setMobileOpen(false); };

  return (
    <>
      <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          {/* Brand */}
          <NavLink to="/" className="brand-logo" onClick={closeAll}>
            <div className="logo-icon-wrap">
              <Briefcase size={20} color="white" />
            </div>
            <div className="brand-text">
              <span className="brand-name">JobConnect India</span>
              <span className="brand-tagline">Naukri Dhundo, Sapna Jiyo</span>
            </div>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="main-nav desktop-nav">
            {navLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={`nav-link ${isLinkActive(l) ? 'active' : ''}`}
                onClick={closeAll}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="header-right">
            {currentUser && (
              <div className="notif-wrapper" ref={notifRef}>
                <button
                  className="notif-bell-btn"
                  onClick={() => {
                    setShowNotifMenu(v => !v);
                    setShowUserMenu(false);
                  }}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifMenu && (
                    <motion.div
                      className="notif-dropdown"
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div className="notif-dropdown-header">
                        <div className="notif-header-title">
                          <Bell size={15} />
                          <span>Notifications</span>
                          {unreadCount > 0 && (
                            <span className="notif-count-tag">{unreadCount} new</span>
                          )}
                        </div>
                        {notifications.length > 0 && unreadCount > 0 && (
                          <button className="notif-mark-all" onClick={markAllAsRead}>
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="notif-list">
                        {notifications.length === 0 ? (
                          <div className="notif-empty">
                            <Bell size={28} className="notif-empty-icon" />
                            <p>No notifications yet</p>
                            <span>Updates about applications & jobs will appear here</span>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n.id}
                              className={`notif-item ${!n.read ? 'unread' : ''}`}
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link) {
                                  navigate(n.link);
                                  setShowNotifMenu(false);
                                }
                              }}
                            >
                              <div className="notif-item-indicator" />
                              <div className="notif-item-content">
                                <div className="notif-item-top">
                                  <span className="notif-item-title">{n.title}</span>
                                  <span className="notif-item-time">
                                    {new Date(n.createdAt || n.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="notif-item-desc">{n.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {currentUser ? (
              <div className="user-menu" ref={dropdownRef}>
                <button className="user-avatar-btn" onClick={() => setShowUserMenu(v => !v)}>
                  <div className="avatar-circle">
                    {getUserInitials(currentUser.name)}
                  </div>
                  <span className="user-name-text">{currentUser.name.split(' ')[0]}</span>
                  <ChevronDown size={14} className={`chevron ${showUserMenu ? 'open' : ''}`} />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      className="user-dropdown"
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div className="dropdown-user-info">
                        <div className="avatar-circle large">{getUserInitials(currentUser.name)}</div>
                        <div>
                          <p className="dropdown-name">{currentUser.name}</p>
                          <p className="dropdown-email">{currentUser.email}</p>
                          <span className="dropdown-role-badge">
                            {currentUser.role === 'admin' ? '⚡ Admin' : currentUser.role === 'employer' ? '🏢 Employer' : '👤 Job Seeker'}
                          </span>
                        </div>
                      </div>
                      <div className="dropdown-divider" />
                      {currentUser.role === 'job_seeker' && (
                        <>
                          <NavLink to="/dashboard" className="dropdown-item" onClick={closeAll}>
                            <LayoutDashboard size={15} /> Seeker Dashboard
                          </NavLink>
                          <NavLink to="/dashboard?tab=profile" className="dropdown-item" onClick={closeAll}>
                            <User size={15} /> My Profile & Skills
                          </NavLink>
                          <NavLink to="/dashboard?tab=saved" className="dropdown-item" onClick={closeAll}>
                            <Bookmark size={15} /> Saved Jobs
                          </NavLink>
                          <NavLink to="/dashboard?tab=applications" className="dropdown-item" onClick={closeAll}>
                            <Briefcase size={15} /> My Applications
                          </NavLink>
                          <NavLink to="/dashboard?tab=settings" className="dropdown-item" onClick={closeAll}>
                            <Settings size={15} /> Account Settings
                          </NavLink>
                        </>
                      )}

                      {currentUser.role === 'employer' && (
                        <>
                          <NavLink to="/employer-dashboard" className="dropdown-item" onClick={closeAll}>
                            <LayoutDashboard size={15} /> Employer Portal
                          </NavLink>
                          <NavLink to="/employer-dashboard?tab=post-job" className="dropdown-item" onClick={closeAll}>
                            <Briefcase size={15} /> Post New Vacancy
                          </NavLink>
                          <NavLink to="/employer-dashboard?tab=candidates" className="dropdown-item" onClick={closeAll}>
                            <Users size={15} /> Candidates & Resumes
                          </NavLink>
                          <NavLink to="/employer-dashboard?tab=settings" className="dropdown-item" onClick={closeAll}>
                            <Building2 size={15} /> Company Profile
                          </NavLink>
                        </>
                      )}

                      {currentUser.role === 'admin' && (
                        <>
                          <NavLink to="/admin" className="dropdown-item" onClick={closeAll}>
                            <Shield size={15} /> Admin Console
                          </NavLink>
                          <NavLink to="/admin?tab=users" className="dropdown-item" onClick={closeAll}>
                            <Users size={15} /> User Management
                          </NavLink>
                          <NavLink to="/admin?tab=jobs" className="dropdown-item" onClick={closeAll}>
                            <Briefcase size={15} /> Job Moderation
                          </NavLink>
                          <NavLink to="/admin?tab=settings" className="dropdown-item" onClick={closeAll}>
                            <Settings size={15} /> Platform Settings
                          </NavLink>
                        </>
                      )}

                      <div className="dropdown-divider" />
                      <button className="dropdown-item danger" onClick={() => { logout(); closeAll(); }}>
                        <LogOut size={15} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="auth-buttons">
                <button className="login-btn" onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }}>Log In</button>
                <button className="signup-btn" onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); }}>Sign Up</button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button className="hamburger-btn" onClick={() => setMobileOpen(v => !v)} aria-label="Toggle menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="mobile-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
            >
              <div className="mobile-drawer-header">
                <div className="logo-icon-wrap sm"><Briefcase size={16} color="white" /></div>
                <span className="brand-name">JobConnect India</span>
                <button onClick={() => setMobileOpen(false)}><X size={20} /></button>
              </div>
              <nav className="mobile-nav">
                {navLinks.map(l => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className={`mobile-nav-link ${isLinkActive(l) ? 'active' : ''}`}
                    onClick={closeAll}
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>
              {!currentUser && (
                <div className="mobile-auth">
                  <button className="login-btn w-full" onClick={() => { setAuthMode('login'); setAuthModalOpen(true); setMobileOpen(false); }}>Log In</button>
                  <button className="signup-btn w-full" onClick={() => { setAuthMode('signup'); setAuthModalOpen(true); setMobileOpen(false); }}>Sign Up</button>
                </div>
              )}
              {currentUser && (
                <div className="mobile-auth">
                  <NavLink to={getDashboardUrl()} className="signup-btn w-full" style={{ textAlign: 'center' }} onClick={closeAll}>My Dashboard</NavLink>
                  <button className="login-btn w-full" onClick={() => { logout(); closeAll(); }}>Sign Out</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authMode} />
    </>
  );
};

export default Header;
