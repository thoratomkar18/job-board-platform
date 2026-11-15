import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Award, CheckCircle2, AlertCircle, X, Check, Save } from 'lucide-react';
import './ScorecardModal.css';

const RATING_CRITERIA = [
  { key: 'technical', label: 'Technical Proficiency', desc: 'Core engineering competence, code quality & system understanding' },
  { key: 'problemSolving', label: 'Problem Solving & Logic', desc: 'Approach to edge cases, analytical breakdown & debugging' },
  { key: 'communication', label: 'Communication & Articulation', desc: 'Clarity, listening skills, structure of explanations' },
  { key: 'culture', label: 'Culture & Collaboration', desc: 'Ownership mindset, openness to feedback & team dynamic' },
];

const RECOMMENDATIONS = [
  { key: 'advance', label: 'Advance to Next Round', icon: CheckCircle2, color: '#2563eb', bg: '#eff6ff' },
  { key: 'offer', label: 'Ready for Job Offer 🏆', icon: Award, color: '#059669', bg: '#ecfdf5' },
  { key: 'on_hold', label: 'On Hold / Re-evaluate', icon: AlertCircle, color: '#d97706', bg: '#fffbeb' },
  { key: 'reject', label: 'Do Not Advance', icon: X, color: '#dc2626', bg: '#fef2f2' },
];

const StarPicker = ({ value, onChange }) => {
  const [hoverVal, setHoverVal] = useState(0);

  return (
    <div className="sc-star-row">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = (hoverVal || value) >= star;
        return (
          <button
            type="button"
            key={star}
            className={`sc-star-btn ${active ? 'active' : ''}`}
            onMouseEnter={() => setHoverVal(star)}
            onMouseLeave={() => setHoverVal(0)}
            onClick={() => onChange(star)}
            aria-label={`${star} stars`}
          >
            <Star size={18} fill={active ? '#f59e0b' : 'none'} stroke={active ? '#f59e0b' : '#94a3b8'} />
          </button>
        );
      })}
      <span className="sc-star-rating-val">{value > 0 ? `${value}.0 / 5.0` : 'Not rated'}</span>
    </div>
  );
};

const ScorecardModal = ({ isOpen, onClose, onSubmit, application, roundName }) => {
  const [ratings, setRatings] = useState({
    technical: 4,
    problemSolving: 4,
    communication: 4,
    culture: 4,
  });
  const [recommendation, setRecommendation] = useState('advance');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !application) return null;

  const currentRound = roundName || application.interviewRound || 'Technical Round 1';
  const averageScore = (
    (ratings.technical + ratings.problemSolving + ratings.communication + ratings.culture) / 4
  ).toFixed(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        round: currentRound,
        technical: ratings.technical,
        problemSolving: ratings.problemSolving,
        communication: ratings.communication,
        culture: ratings.culture,
        overallScore: Number(averageScore),
        recommendation,
        feedback: feedback.trim() || 'Candidate demonstrated strong aptitude and technical depth.',
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
      <div className="sc-backdrop" onClick={onClose}>
        <motion.div
          className="sc-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="sc-header">
            <div className="sc-header-left">
              <div className="sc-badge-round">{currentRound}</div>
              <h3>Candidate Evaluation Scorecard</h3>
              <p>
                Candidate: <strong>{application.applicantName}</strong> &middot; Role: {application.jobTitle}
              </p>
            </div>
            <button className="sc-close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="sc-form">
            {/* Criteria Grid */}
            <div className="sc-criteria-list">
              {RATING_CRITERIA.map(({ key, label, desc }) => (
                <div key={key} className="sc-criterion-item">
                  <div className="sc-criterion-info">
                    <span className="sc-criterion-label">{label}</span>
                    <span className="sc-criterion-desc">{desc}</span>
                  </div>
                  <StarPicker
                    value={ratings[key]}
                    onChange={(val) => setRatings((prev) => ({ ...prev, [key]: val }))}
                  />
                </div>
              ))}
            </div>

            {/* Overall Score Highlight */}
            <div className="sc-score-highlight">
              <div className="sc-score-box">
                <span className="sc-score-num">{averageScore}</span>
                <span className="sc-score-denom">/ 5.0</span>
              </div>
              <div className="sc-score-text">
                <strong>Calculated Overall Score</strong>
                <p>Based on 4 evaluation dimensions</p>
              </div>
            </div>

            {/* Recommendation Pills */}
            <div className="sc-rec-section">
              <label className="sc-label">Hiring Decision Recommendation *</label>
              <div className="sc-rec-grid">
                {RECOMMENDATIONS.map((r) => {
                  const Icon = r.icon;
                  const isSelected = recommendation === r.key;
                  return (
                    <button
                      type="button"
                      key={r.key}
                      className={`sc-rec-btn ${isSelected ? 'selected' : ''}`}
                      style={{
                        borderColor: isSelected ? r.color : '#e2e8f0',
                        background: isSelected ? r.bg : '#ffffff',
                        color: isSelected ? r.color : '#475569',
                      }}
                      onClick={() => setRecommendation(r.key)}
                    >
                      <Icon size={16} />
                      <span>{r.label}</span>
                      {isSelected && <Check size={14} className="sc-check-mark" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written Feedback */}
            <div className="sc-field">
              <label className="sc-label">Detailed Interviewer Feedback & Observations</label>
              <textarea
                rows={3}
                placeholder="Key strengths, code design choices, areas for growth, architecture reasoning..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="sc-actions">
              <button type="button" className="sc-btn-cancel" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="sc-btn-submit" disabled={submitting}>
                <Save size={15} /> {submitting ? 'Saving Scorecard...' : 'Submit Evaluation'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ScorecardModal;
