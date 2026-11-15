import React from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle2, Calendar, ShieldCheck } from 'lucide-react';
import './WhyChooseUs.css';

const FEATURES = [
  {
    icon: <Search size={24} className="feature-icon" />,
    title: 'Easy Job Search',
    description: 'Find relevant opportunities using search and filters.',
    badge: 'Smart Discovery',
    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.05))',
    iconColor: '#6366f1',
  },
  {
    icon: <CheckCircle2 size={24} className="feature-icon" />,
    title: 'Application Tracking',
    description: 'View the progress of submitted applications.',
    badge: 'Real-Time Updates',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
    iconColor: '#10b981',
  },
  {
    icon: <Calendar size={24} className="feature-icon" />,
    title: 'Interview Coordination',
    description: 'View scheduled interview details and meeting links.',
    badge: 'Direct Invites',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))',
    iconColor: '#f59e0b',
  },
];

const WhyChooseUs = () => {
  return (
    <section className="why-choose-section">
      <div className="why-choose-container">
        {/* Header */}
        <div className="why-choose-header">
          <div className="why-pill">
            <ShieldCheck size={13} />
            <span>Platform Core Values</span>
          </div>
          <h2 className="why-title">Why Choose JobConnect?</h2>
          <p className="why-sub">
            Built for India's evolving tech workforce with transparency, speed, and real-time coordination.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="why-cards-grid">
          {FEATURES.map((feature, idx) => (
            <motion.div
              key={feature.title}
              className="why-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.45, delay: idx * 0.12 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
            >
              <div
                className="why-card-icon-wrapper"
                style={{ background: feature.gradient, color: feature.iconColor }}
              >
                {feature.icon}
              </div>
              <span className="why-card-badge">{feature.badge}</span>
              <h3 className="why-card-title">{feature.title}</h3>
              <p className="why-card-desc">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
