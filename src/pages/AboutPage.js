import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Briefcase, TrendingUp, Award, Globe, Heart } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import './AboutPage.css';

const stats = [
  { num: '12,000+', label: 'Active Jobs', icon: <Briefcase size={22} /> },
  { num: '5,00,000+', label: 'Happy Candidates', icon: <Users size={22} /> },
  { num: '500+', label: 'Partner Companies', icon: <Award size={22} /> },
  { num: '28+', label: 'Cities Covered', icon: <Globe size={22} /> },
];

const features = [
  {
    icon: <Users size={28} />,
    title: 'For Job Seekers',
    desc: 'Discover opportunities from TCS, Infosys, Flipkart, Zomato, and 500+ companies. Filter by salary in LPA, location, and experience level relevant to India.',
    color: '#6366f1',
  },
  {
    icon: <Briefcase size={28} />,
    title: 'For Employers',
    desc: 'Find the perfect candidate for your team. Post jobs, review applications, and hire efficiently with our employer-first platform.',
    color: '#10b981',
  },
  {
    icon: <TrendingUp size={28} />,
    title: 'For India\'s Growth',
    desc: 'We\'re building the employment backbone of Digital India — from metro cities like Bengaluru and Mumbai to emerging tech hubs like Pune and Hyderabad.',
    color: '#f59e0b',
  },
];

const companies = ['TCS', 'Infosys', 'Wipro', 'Flipkart', 'Zomato', 'Jio', 'Swiggy', 'Razorpay', 'Paytm', "BYJU'S", 'Nykaa', 'MakeMyTrip'];

const section = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

const AboutPage = () => (
  <Layout>
    <div className="about-page">
      {/* Hero Banner */}
      <div className="about-hero">
        <motion.div
          className="container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Target size={36} className="about-hero-icon" />
          <h1>About JobConnect India</h1>
          <p>Connecting India's Talent with India's Biggest Opportunities</p>
        </motion.div>
      </div>

      {/* Mission */}
      <motion.section
        className="about-section"
        variants={section}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        <div className="container about-mission">
          <div className="mission-icon">
            <Heart size={32} color="#6366f1" />
          </div>
          <div>
            <h2>Our Mission</h2>
            <p>
              We believe every Indian deserves meaningful work that matches their skills and aspirations. 
              JobConnect India bridges the gap between talented job seekers and India's fastest-growing companies — 
              from unicorn startups to legacy IT giants.
            </p>
            <p>
              Whether you're a fresher from IIT looking for your first job, or a senior engineer eyeing a ₹40L+ role, 
              we have the right opportunities for you.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section
        className="about-stats-section"
        variants={section}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        <div className="container">
          <h2 className="section-title">Our Impact</h2>
          <div className="stats-grid">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-num">{s.num}</div>
                <div className="stat-lbl">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section
        className="about-section"
        variants={section}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        <div className="container">
          <h2 className="section-title">What We Offer</h2>
          <div className="features-grid">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="feature-card"
                style={{ '--feature-color': f.color }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ y: -6 }}
              >
                <div className="feature-icon" style={{ background: `${f.color}18`, color: f.color }}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Companies */}
      <motion.section
        className="companies-section"
        variants={section}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
      >
        <div className="container">
          <h2 className="section-title">India's Top Hiring Companies</h2>
          <p className="section-sub">Jobs from companies that millions of Indians trust</p>
          <div className="companies-grid">
            {companies.map((c, i) => (
              <motion.div
                key={c}
                className="company-badge"
                whileHover={{ scale: 1.06, y: -4 }}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                {c}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  </Layout>
);

export default AboutPage;
