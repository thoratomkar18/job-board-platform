import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Users, User, Briefcase, Shield, ChevronUp, ChevronDown, CheckCircle2, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './RoleSwitcher.css';

const DEMO_ROLES = [
  {
    name: 'Omkar Thorat',
    role: 'Job Seeker',
    badge: '👤 Omkar',
    email: 'thorato384@gmail.com',
    password: 'password123',
    icon: User,
    color: '#4f46e5',
    targetRoute: '/dashboard',
    desc: 'Candidate profile — Applied for CloudTech Senior Full Stack Engineer',
  },
  {
    name: 'Priya Nair',
    role: 'Employer',
    badge: '🏢 CloudTech',
    email: 'priya@techcorp.in',
    password: 'employer123',
    icon: Briefcase,
    color: '#0284c7',
    targetRoute: '/employer-dashboard',
    desc: 'Senior Talent Lead @ CloudTech India (4 active roles)',
  },
  {
    name: 'Rohan Deshmukh',
    role: 'Employer',
    badge: '🏢 Zerodha',
    email: 'rohan@zerodha.com',
    password: 'zerodha123',
    icon: Briefcase,
    color: '#0d9488',
    targetRoute: '/employer-dashboard',
    desc: 'VP Talent Acquisition @ Zerodha (2 active roles)',
  },
  {
    name: 'Platform Admin',
    role: 'Admin',
    badge: '⚡ Admin',
    email: 'admin@jobconnect.in',
    password: 'admin123',
    icon: Shield,
    color: '#ef4444',
    targetRoute: '/admin',
    desc: 'Platform moderation, analytics & user management',
  },
];

const RoleSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, login, logout } = useAuth();
  const navigate = useNavigate();
  const switcherRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleSwitch = async (demoUser) => {
    if (currentUser?.email === demoUser.email) {
      toast.info(`Already active as ${demoUser.name} (${demoUser.role})`);
      navigate(demoUser.targetRoute);
      setIsOpen(false);
      return;
    }

    try {
      const res = await login(demoUser.email, demoUser.password);
      if (res && res.success) {
        toast.success(`Switched role to ${demoUser.name} (${demoUser.role})!`);
        navigate(demoUser.targetRoute);
        setIsOpen(false);
      } else {
        toast.error(res?.message || 'Unable to switch account.');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to switch account.');
    }
  };

  const handleSignOut = () => {
    logout();
    toast.info('Logged out.');
    navigate('/');
    setIsOpen(false);
  };

  const currentRoleMatch = DEMO_ROLES.find(r => r.email === currentUser?.email);

  return (
    <div className="role-switcher-root" ref={switcherRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="role-switcher-panel"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="role-switcher-header">
              <div className="role-switcher-title">
                <Sparkles size={16} className="sparkle-icon" />
                <span>RBAC Live Switcher</span>
              </div>
              <span className="role-switcher-sub" style={{ color: '#ef4444', fontWeight: 600 }}>
                DEVELOPER DEMO TOOL
              </span>
            </div>

            <div style={{ padding: '6px 12px', background: '#fef3c7', borderBottom: '1px solid #fde68a', fontSize: '0.74rem', color: '#92400e', lineHeight: 1.3 }}>
              ⚠️ For evaluation only. In production, roles are assigned via backend authentication and cannot be switched on the fly.
            </div>

            <div className="role-switcher-list">
              {DEMO_ROLES.map((item) => {
                const Icon = item.icon;
                const isCurrent = currentUser?.email === item.email;
                return (
                  <button
                    key={item.email}
                    type="button"
                    className={`role-switcher-item ${isCurrent ? 'active' : ''}`}
                    onClick={() => handleSwitch(item)}
                  >
                    <div
                      className="role-switcher-avatar"
                      style={{ background: item.color }}
                    >
                      <Icon size={16} color="#fff" />
                    </div>
                    <div className="role-switcher-info">
                      <div className="role-switcher-item-top">
                        <span className="role-switcher-name">{item.name}</span>
                        <span className="role-switcher-tag" style={{ color: item.color }}>
                          {item.badge}
                        </span>
                      </div>
                      <span className="role-switcher-desc">{item.desc}</span>
                    </div>
                    {isCurrent && (
                      <CheckCircle2 size={16} className="role-switcher-check" />
                    )}
                  </button>
                );
              })}
            </div>

            {currentUser && (
              <div className="role-switcher-footer">
                <button
                  type="button"
                  className="role-switcher-logout-btn"
                  onClick={handleSignOut}
                >
                  <LogOut size={13} /> Sign Out (Guest Mode)
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        className={`role-switcher-fab ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(v => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Quick Role Switcher for Demo"
      >
        <Users size={16} />
        <span className="fab-label">
          {currentRoleMatch ? currentRoleMatch.name.split(' ')[0] : 'Demo Switcher'}
        </span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </motion.button>
    </div>
  );
};

export default RoleSwitcher;
