import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Lock, User, Briefcase, Users, Building2, Globe, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState('job_seeker');
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    companyWebsite: '',
    phone: '',
  });
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setMode(initialMode); }, [initialMode]);
  useEffect(() => {
    if (!isOpen) {
      setForm({
        name: '',
        email: '',
        password: '',
        company: '',
        companyWebsite: '',
        phone: '',
      });
    }
  }, [isOpen]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const routeByRole = (userRole) => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'employer') return '/employer-dashboard';
    return '/dashboard';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'login') {
      const result = await login(form.email, form.password);
      if (result.success) {
        toast.success(`Welcome back, ${result.user.name.split(' ')[0]}! 🙏`);
        onClose();
        navigate(routeByRole(result.user.role));
      } else {
        toast.error(result.message);
      }
    } else {
      if (!form.name.trim()) { toast.error('Name is required'); return; }
      if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
      if (role === 'employer' && !form.company.trim()) {
        toast.error('Company / Organization Name is required for employers');
        return;
      }
      const result = await signup(
        form.name,
        form.email,
        form.password,
        role,
        form.company,
        form.companyWebsite,
        form.phone
      );
      if (result.success) {
        toast.success('Account created! Welcome to JobConnect India 🎉');
        onClose();
        navigate(routeByRole(result.user.role));
      } else {
        toast.error(result.message);
      }
    }
  };

  const demos = [
    { label: 'Omkar Thorat', email: 'thorato384@gmail.com', pwd: 'password123', color: '#4f46e5' },
    { label: 'Priya (Employer)', email: 'priya@techcorp.in', pwd: 'employer123', color: '#10b981' },
    { label: 'Admin', email: 'admin@jobconnect.in', pwd: 'admin123', color: '#f59e0b' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="auth-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="auth-modal"
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            <button className="auth-close" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>

            {/* Header */}
            <div className="auth-header">
              <div className="auth-logo">
                <Briefcase size={22} color="white" />
              </div>
              <h2>{mode === 'login' ? 'Welcome Back!' : 'Join JobConnect India'}</h2>
              <p>{mode === 'login' ? 'Log in to continue your job search' : 'Create your account to start hiring or applying'}</p>
            </div>

            {/* Tab Switch */}
            <div className="auth-tabs">
              <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Log In</button>
              <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>Sign Up</button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div className="form-field">
                  <label>I want to join as</label>
                  <div className="role-selector">
                    <button
                      type="button"
                      className={`role-btn ${role === 'job_seeker' ? 'active' : ''}`}
                      onClick={() => setRole('job_seeker')}
                    >
                      <Users size={16} /> Job Seeker
                    </button>
                    <button
                      type="button"
                      className={`role-btn ${role === 'employer' ? 'active' : ''}`}
                      onClick={() => setRole('employer')}
                    >
                      <Briefcase size={16} /> Employer / Recruiter
                    </button>
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div className="form-field">
                  <label>{role === 'employer' ? 'Recruiter / Contact Name' : 'Full Name'}</label>
                  <div className="input-wrap">
                    <User size={15} className="input-icon" />
                    <input
                      type="text"
                      placeholder={role === 'employer' ? 'e.g. Priya Sharma' : 'e.g. Omkar Thorat'}
                      value={form.name}
                      onChange={set('name')}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-field">
                <label>{role === 'employer' && mode === 'signup' ? 'Work Email Address' : 'Email Address'}</label>
                <div className="input-wrap">
                  <Mail size={15} className="input-icon" />
                  <input
                    type="email"
                    placeholder={role === 'employer' && mode === 'signup' ? 'priya@company.com' : 'you@example.com'}
                    value={form.email}
                    onChange={set('email')}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Password</label>
                <div className="input-wrap">
                  <Lock size={15} className="input-icon" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                    value={form.password}
                    onChange={set('password')}
                    required
                  />
                  <button type="button" className="pwd-toggle" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Employer Specific Fields */}
              <AnimatePresence>
                {mode === 'signup' && role === 'employer' && (
                  <motion.div
                    key="employer-details-group"
                    initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="employer-fields-group"
                  >
                    <div className="form-field">
                      <label>
                        Company / Organization Name <span className="field-required">*</span>
                      </label>
                      <div className="input-wrap">
                        <Building2 size={15} className="input-icon" />
                        <input
                          type="text"
                          placeholder="e.g. TechCorp Solutions India"
                          value={form.company}
                          onChange={set('company')}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label>
                        Company Website <span className="field-optional">(Optional)</span>
                      </label>
                      <div className="input-wrap">
                        <Globe size={15} className="input-icon" />
                        <input
                          type="url"
                          placeholder="https://techcorp.example.com"
                          value={form.companyWebsite}
                          onChange={set('companyWebsite')}
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label>
                        Contact / Phone Number <span className="field-optional">(Optional)</span>
                      </label>
                      <div className="input-wrap">
                        <Phone size={15} className="input-icon" />
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={form.phone}
                          onChange={set('phone')}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                className="auth-submit-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {mode === 'login' ? 'Log In' : (role === 'employer' ? 'Create Employer Account' : 'Create Candidate Account')}
              </motion.button>
            </form>

            {/* Switch link or Demo credentials */}
            {mode === 'login' ? (
              <div className="demo-section">
                <p className="demo-label">Quick Demo Login:</p>
                <div className="demo-btns">
                  {demos.map(d => (
                    <button
                      key={d.label}
                      className="demo-btn"
                      style={{ '--demo-color': d.color }}
                      onClick={() => { setMode('login'); setForm(f => ({ ...f, email: d.email, password: d.pwd })); }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="auth-switch-link">
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')} className="switch-text-btn">
                  Log in
                </button>
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
