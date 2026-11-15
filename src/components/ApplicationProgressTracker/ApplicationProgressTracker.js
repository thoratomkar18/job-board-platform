import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Clock, Calendar, Video, Award, Star,
  ChevronDown, ChevronUp, UserCheck, FileText
} from 'lucide-react';
import './ApplicationProgressTracker.css';

/**
 * Derives current stage index (0 to 4):
 * 0: Applied
 * 1: Screening & Shortlisting
 * 2: Interview Rounds (1, 2, 3)
 * 3: Job Offer Extended
 * 4: Hired & Onboarded
 */
function getActiveStageIndex(status) {
  switch (status) {
    case 'pending':
      return 0;
    case 'reviewed':
      return 1;
    case 'shortlisted':
      return 1;
    case 'interview':
      return 2;
    case 'offered':
      return 3;
    case 'hired':
    case 'selected':
      return 4;
    case 'rejected':
      return -1; // Special handling
    default:
      return 0;
  }
}

const ApplicationProgressTracker = ({ application, defaultExpanded = true, showDetailedRounds = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!application) return null;

  const currentStatus = application.status || 'pending';
  const stageIndex = getActiveStageIndex(currentStatus);
  const isRejected = currentStatus === 'rejected';

  // Build only the interview rounds that have actually occurred or are currently scheduled
  const actualInterviewRounds = [];

  // 1. All completed or recorded historical rounds
  if (Array.isArray(application.interviewHistory) && application.interviewHistory.length > 0) {
    application.interviewHistory.forEach((h, idx) => {
      if (h && (h.round || h.date || h.scorecard?.overallScore)) {
        actualInterviewRounds.push({
          num: actualInterviewRounds.length + 1,
          title: h.round || `Round ${actualInterviewRounds.length + 1}`,
          data: h,
          status: h.status === 'completed' || stageIndex > 2 ? 'completed' : (h.status || 'active'),
        });
      }
    });
  }

  // 2. Active scheduled interview round (if not already recorded in history)
  if (application.interviewDate || application.interviewRound) {
    const isAlreadyInHistory = actualInterviewRounds.some(
      r => (r.data?.round && r.data?.round === application.interviewRound) ||
           (r.data?.date && r.data?.date === application.interviewDate)
    );

    if (!isAlreadyInHistory) {
      const activeData = {
        round: application.interviewRound || `Round ${actualInterviewRounds.length + 1}`,
        date: application.interviewDate,
        time: application.interviewTime,
        mode: application.interviewMode || 'Google Meet',
        link: application.interviewLink,
        status: stageIndex > 2 ? 'completed' : 'active',
        scorecard: application.scorecard || (stageIndex > 2 ? { overallScore: 4.5 } : null),
      };

      actualInterviewRounds.push({
        num: actualInterviewRounds.length + 1,
        title: activeData.round,
        data: activeData,
        status: stageIndex > 2 ? 'completed' : 'active',
      });
    }
  }

  const STAGES = [
    {
      id: 'applied',
      label: 'Application Submitted',
      sub: application.appliedDate ? new Date(application.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Submitted',
      icon: FileText,
    },
    {
      id: 'screening',
      label: 'Profile Screening',
      sub: stageIndex > 1 ? 'Shortlisted ⭐' : stageIndex === 1 ? 'In Review' : 'Pending',
      icon: Clock,
    },
    {
      id: 'interview',
      label: 'Interview Rounds',
      sub: stageIndex > 2
        ? 'All Rounds Passed ✅'
        : stageIndex === 2
        ? `${application.interviewRound || 'Interview in Progress'}`
        : actualInterviewRounds.length > 0
        ? `${actualInterviewRounds.length} ${actualInterviewRounds.length === 1 ? 'Round' : 'Rounds'} Scheduled`
        : 'Interview Stage',
      icon: Video,
      hasSubRounds: true,
    },
    {
      id: 'offer',
      label: 'Formal Job Offer',
      sub: stageIndex > 3 ? 'Accepted & Signed' : stageIndex === 3 ? `${application.offerDetails?.ctc || 'Offer Extended 📜'}` : 'Awaiting Outcome',
      icon: Award,
    },
    {
      id: 'hired',
      label: 'Hired & Confirmed',
      sub: stageIndex === 4 ? 'Officially Hired! 🎉' : 'Final Milestone',
      icon: UserCheck,
    },
  ];

  return (
    <div className="apt-container">
      {/* Tracker Header & Progress Bar Summary */}
      <div className="apt-header" onClick={() => setExpanded(e => !e)}>
        <div className="apt-header-left">
          <div className="apt-status-indicator-dot" data-status={currentStatus} />
          <div>
            <div className="apt-title-row">
              <span className="apt-main-title">Application Lifecycle &amp; Stage Tracker</span>
              <span className="apt-current-stage-pill" data-status={currentStatus}>
                {isRejected
                  ? 'Application Concluded'
                  : stageIndex === 4
                  ? '🎉 Fully Hired'
                  : stageIndex === 3
                  ? '📜 Offer Stage'
                  : stageIndex === 2
                  ? `🎙️ ${application.interviewRound || 'Interview Stage'}`
                  : stageIndex === 1
                  ? '⭐ Screening Stage'
                  : '📄 Submitted'}
              </span>
            </div>
            <p className="apt-sub-text">
              {isRejected
                ? 'Thank you for interviewing. The team decided to move forward with other candidates.'
                : `Currently in Stage ${Math.min(stageIndex + 1, 5)} of 5 · ${STAGES[Math.min(stageIndex, 4)]?.label}`}
            </p>
          </div>
        </div>

        <button type="button" className="apt-toggle-btn" aria-label="Toggle details">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span>{expanded ? 'Hide Stepper' : 'View Full Journey'}</span>
        </button>
      </div>

      {/* Expandable Stepper */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="apt-expanded-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Horizontal 5-Step Pipeline Bar */}
            <div className="apt-stepper">
              {STAGES.map((step, idx) => {
                const isPassed = !isRejected && stageIndex > idx;
                const isCurrent = !isRejected && stageIndex === idx;
                const stepClass = isPassed ? 'step-completed' : isCurrent ? 'step-current' : 'step-future';

                return (
                  <div key={step.id} className={`apt-step-col ${stepClass}`}>
                    {/* Connecting line */}
                    {idx < STAGES.length - 1 && (
                      <div className={`apt-line ${stageIndex > idx ? 'line-filled' : ''}`} />
                    )}

                    {/* Step Node */}
                    <div className="apt-node-wrapper">
                      <div className="apt-node">
                        {isPassed ? (
                          <Check size={14} strokeWidth={3} className="apt-check-icon" />
                        ) : (
                          <span className="apt-node-num">{idx + 1}</span>
                        )}
                      </div>
                    </div>

                    {/* Step Labels */}
                    <div className="apt-step-info">
                      <span className="apt-step-label">{step.label}</span>
                      <span className="apt-step-sub">{step.sub}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Sub-Stages for Actual Interview Rounds Conducted */}
            {showDetailedRounds && actualInterviewRounds.length > 0 && !isRejected && (
              <div className="apt-interview-rounds-box">
                <div className="apt-ir-header">
                  <div className="apt-ir-title-group">
                    <Video size={15} color="#0284c7" />
                    <strong>
                      Interview Rounds ({actualInterviewRounds.length} {actualInterviewRounds.length === 1 ? 'Round Conducted' : 'Rounds Conducted'})
                    </strong>
                  </div>
                  <span className="apt-ir-badge">
                    {stageIndex > 2 || actualInterviewRounds.every(r => r.status === 'completed')
                      ? 'Completed 🏆'
                      : 'Active Evaluation'}
                  </span>
                </div>

                <div className="apt-rounds-grid">
                  {actualInterviewRounds.map((rnd) => {
                    const isRndDone = rnd.status === 'completed';
                    const isRndActive = rnd.status === 'active' || rnd.status === 'scheduled';

                    return (
                      <div
                        key={rnd.num}
                        className={`apt-round-card ${isRndDone ? 'rnd-done' : (isRndActive ? 'rnd-active' : '')}`}
                      >
                        <div className="apt-round-top">
                          <div className="apt-round-num-badge">Round {rnd.num}</div>
                          <span className={`apt-round-status-pill ${isRndDone ? 'completed' : 'active'}`}>
                            {isRndDone ? 'Passed ✅' : 'In Progress ⏳'}
                          </span>
                        </div>

                        <h5 className="apt-round-title">{rnd.title}</h5>

                        <div className="apt-round-details">
                          {rnd.data?.date && (
                            <span className="apt-rnd-meta">
                              <Calendar size={12} /> {rnd.data.date} {rnd.data.time ? `at ${rnd.data.time}` : ''}
                            </span>
                          )}
                          {rnd.data?.mode && (
                            <span className="apt-rnd-meta">
                              <Video size={12} /> {rnd.data.mode}
                            </span>
                          )}
                          {rnd.data?.scorecard?.overallScore > 0 && (
                            <span className="apt-rnd-score">
                              <Star size={12} fill="#f59e0b" stroke="#f59e0b" /> Score: {rnd.data.scorecard.overallScore}/5.0
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ApplicationProgressTracker;
