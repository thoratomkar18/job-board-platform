import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MessageSquare, X, Send } from 'lucide-react';
import './RescheduleModal.css';

const RescheduleModal = ({ isOpen, onClose, onSubmit, application }) => {
  const [proposedDate, setProposedDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [proposedTime, setProposedTime] = useState('15:00');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !application) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proposedDate || !proposedTime) return;
    setSubmitting(true);
    try {
      await onSubmit({
        rsvpStatus: 'reschedule_requested',
        proposedDate,
        proposedTime,
        note: note.trim() || 'Candidate requested an alternative interview time slot.',
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
      <div className="resched-backdrop" onClick={onClose}>
        <motion.div
          className="resched-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="resched-header">
            <div className="resched-title-group">
              <div className="resched-icon-wrap">
                <Calendar size={20} />
              </div>
              <div>
                <h3>Request Interview Reschedule</h3>
                <p>
                  {application.jobTitle} &middot; <strong>{application.companyName}</strong>
                </p>
              </div>
            </div>
            <button className="resched-close-btn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Current schedule info */}
          <div className="resched-current-info">
            <span className="resched-pill-label">Currently Scheduled:</span>
            <span className="resched-pill-val">
              📅 {application.interviewDate || 'Upcoming'} at {application.interviewTime || '14:00'} IST ({application.interviewRound || 'Round 1'})
            </span>
          </div>

          <form onSubmit={handleSubmit} className="resched-form">
            <div className="resched-row">
              <div className="resched-field">
                <label>
                  <Calendar size={14} /> Proposed Date *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                />
              </div>

              <div className="resched-field">
                <label>
                  <Clock size={14} /> Proposed Time (IST) *
                </label>
                <input
                  type="time"
                  required
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                />
              </div>
            </div>

            <div className="resched-field">
              <label>
                <MessageSquare size={14} /> Reason / Preferred Slots (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. I have a prior university exam or work conflict at the scheduled time. I am available between 3:00 PM and 6:00 PM on the selected date."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="resched-actions">
              <button type="button" className="resched-btn-cancel" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="resched-btn-submit" disabled={submitting}>
                <Send size={15} /> {submitting ? 'Submitting...' : 'Send Request to Recruiter'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RescheduleModal;
