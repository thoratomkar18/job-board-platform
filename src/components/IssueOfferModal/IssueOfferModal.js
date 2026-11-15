import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, IndianRupee, Calendar, MapPin, Gift, Clock, FileCheck, X, Send } from 'lucide-react';
import './IssueOfferModal.css';

const DEFAULT_BENEFITS = [
  'Comprehensive Medical & Family Health Insurance (₹10L)',
  'Annual Learning & Professional Development Stipend (₹50,000)',
  'Hybrid / Flexible Working Model & Home Office Setup Allowance',
  'Annual Performance Bonus & Equity Stock Grants (ESOPs)',
];

const IssueOfferModal = ({ isOpen, onClose, onSubmit, application }) => {
  const [ctc, setCtc] = useState('₹22,00,000 / yr');
  const [baseSalary, setBaseSalary] = useState('₹18,50,000 / yr');
  const [bonus, setBonus] = useState('₹3,50,000 / yr Performance Bonus');
  const [joiningDate, setJoiningDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [validityDate, setValidityDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [location, setLocation] = useState(application?.location || 'Bengaluru, Karnataka (Hybrid)');
  const [notes, setNotes] = useState(
    'We were truly impressed by your technical depth, systems design intuition, and alignment with our engineering culture. We look forward to building groundbreaking software together!'
  );
  const [benefits] = useState(DEFAULT_BENEFITS);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !application) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ctc || !joiningDate) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ctc,
        baseSalary,
        bonus,
        joiningDate,
        validityDate,
        location,
        notes,
        benefits,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="io-backdrop" onClick={onClose}>
        <motion.div
          className="io-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="io-header">
            <div className="io-title-wrap">
              <div className="io-icon-badge">
                <Award size={22} />
              </div>
              <div>
                <h3>Release Formal Job Offer</h3>
                <p>
                  Candidate: <strong>{application.applicantName}</strong> &middot; {application.jobTitle}
                </p>
              </div>
            </div>
            <button className="io-close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="io-form">
            {/* Compensation Row */}
            <div className="io-grid-3">
              <div className="io-field">
                <label>
                  <IndianRupee size={14} /> Total Annual CTC *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ₹22,00,000 / yr"
                  value={ctc}
                  onChange={(e) => setCtc(e.target.value)}
                />
              </div>

              <div className="io-field">
                <label>Fixed Base Salary</label>
                <input
                  type="text"
                  placeholder="e.g. ₹18,50,000 / yr"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                />
              </div>

              <div className="io-field">
                <label>Variable / Bonus</label>
                <input
                  type="text"
                  placeholder="e.g. ₹3,50,000 / yr"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                />
              </div>
            </div>

            {/* Dates & Location Row */}
            <div className="io-grid-3">
              <div className="io-field">
                <label>
                  <Calendar size={14} /> Proposed Joining Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                />
              </div>

              <div className="io-field">
                <label>
                  <Clock size={14} /> Offer Validity Deadline
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={validityDate}
                  onChange={(e) => setValidityDate(e.target.value)}
                />
              </div>

              <div className="io-field">
                <label>
                  <MapPin size={14} /> Work Location & Mode
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Karnataka (Remote / Hybrid)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            {/* Perks & Benefits */}
            <div className="io-field">
              <label>
                <Gift size={14} /> Key Perks & Benefits Included
              </label>
              <div className="io-benefits-list">
                {benefits.map((b, idx) => (
                  <div key={idx} className="io-benefit-item">
                    <FileCheck size={14} color="#059669" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Welcome Note */}
            <div className="io-field">
              <label>Recruiter Welcome Note</label>
              <textarea
                rows={2}
                placeholder="Personal message included in the offer letter..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="io-actions">
              <button type="button" className="io-btn-cancel" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="io-btn-submit" disabled={submitting}>
                <Send size={15} /> {submitting ? 'Issuing Offer...' : 'Dispatch Formal Offer Letter 📜'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IssueOfferModal;
