import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, ExternalLink, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '../components/Layout/Layout';
import './ContactPage.css';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email is required';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (form.message.trim().length < 20) errs.message = 'Message must be at least 20 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('Message sent! We\'ll get back to you within 24 hours. 🙏');
    setForm({ name: '', email: '', subject: '', message: '' });
    setErrors({});
    setSending(false);
  };

  const contactItems = [
    { icon: <Mail size={20} />, title: 'Email Us', lines: ['support@jobconnect.in', 'careers@jobconnect.in'], color: '#6366f1' },
    { icon: <Phone size={20} />, title: 'Call Us', lines: ['+91 80-4567-8900', 'Mon – Sat, 9 AM – 7 PM IST'], color: '#10b981' },
    { icon: <MapPin size={20} />, title: 'Visit Us', lines: ['WeWork Galaxy, 43 Residency Rd', 'Bengaluru, Karnataka 560025'], color: '#f59e0b' },
  ];

  const section = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  return (
    <Layout>
      <div className="contact-page">
        {/* Hero */}
        <div className="contact-hero">
          <motion.div className="container" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <h1>Get in Touch</h1>
            <p>We'd love to hear from you. Our team responds within 24 hours. 🙏</p>
          </motion.div>
        </div>

        <div className="contact-body container">
          {/* Left — Info */}
          <motion.div className="contact-info" variants={section} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2>Contact Information</h2>
            <div className="contact-cards">
              {contactItems.map((c, i) => (
                <motion.div
                  key={i}
                  className="contact-card"
                  style={{ '--card-color': c.color }}
                  whileHover={{ y: -4 }}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="contact-card-icon" style={{ background: `${c.color}18`, color: c.color }}>
                    {c.icon}
                  </div>
                  <div>
                    <h3>{c.title}</h3>
                    {c.lines.map((l, j) => <p key={j}>{l}</p>)}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="contact-social">
              <h3>Follow Us</h3>
              <div className="social-row">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-pill linkedin"><ExternalLink size={16} /> LinkedIn</a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-pill twitter"><ExternalLink size={16} /> Twitter / X</a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-pill facebook"><ExternalLink size={16} /> Facebook</a>
              </div>
            </div>
          </motion.div>

          {/* Right — Form */}
          <motion.div className="contact-form-wrap" variants={section} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2>Send us a Message</h2>
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="cf-row">
                <div className="cf-field">
                  <label>Your Name</label>
                  <input
                    type="text"
                    placeholder="Omkar Thorat"
                    value={form.name}
                    onChange={set('name')}
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="cf-error"><CheckCircle size={12} /> {errors.name}</span>}
                </div>
                <div className="cf-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="omkar@example.com"
                    value={form.email}
                    onChange={set('email')}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="cf-error">{errors.email}</span>}
                </div>
              </div>

              <div className="cf-field">
                <label>Subject</label>
                <input
                  type="text"
                  placeholder="How can we help you?"
                  value={form.subject}
                  onChange={set('subject')}
                  className={errors.subject ? 'error' : ''}
                />
                {errors.subject && <span className="cf-error">{errors.subject}</span>}
              </div>

              <div className="cf-field">
                <label>Message</label>
                <textarea
                  rows={5}
                  placeholder="Tell us more about your query... (min. 20 characters)"
                  value={form.message}
                  onChange={set('message')}
                  className={errors.message ? 'error' : ''}
                />
                {errors.message && <span className="cf-error">{errors.message}</span>}
              </div>

              <motion.button
                type="submit"
                className="cf-submit"
                disabled={sending}
                whileHover={{ scale: sending ? 1 : 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Send size={16} /> {sending ? 'Sending...' : 'Send Message'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;
