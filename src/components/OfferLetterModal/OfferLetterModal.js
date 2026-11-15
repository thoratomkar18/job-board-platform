import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, CheckCircle2, Printer, X,
  Calendar, MapPin, IndianRupee, ShieldCheck
} from 'lucide-react';
import './OfferLetterModal.css';

const OfferLetterModal = ({
  isOpen,
  onClose,
  application,
  isCandidate = false,
  onAccept,
  onDecline,
}) => {
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !application) return null;

  const offer = application.offerDetails || {};
  const isPending = !offer.status || offer.status === 'pending';
  const isAccepted = offer.status === 'accepted' || application.status === 'hired';

  const companyName = application.companyName || 'CloudTech India Pvt. Ltd.';
  const candidateName = application.applicantName || 'Candidate';
  const jobTitle = application.jobTitle || 'Software Engineer';
  const ctc = offer.ctc || application.salary || '₹22,00,000 / yr';
  const joiningDate = offer.joiningDate || 'Immediate / Within 15 Days';
  const location = offer.location || application.location || 'Bengaluru, Karnataka (Remote / Hybrid)';
  const validityDate = offer.validityDate || '7 days from issuance';
  const benefits = offer.benefits && offer.benefits.length > 0 ? offer.benefits : [
    'Comprehensive Family Health Insurance coverage up to ₹10,00,000',
    'Annual Learning & Certification Reimbursement up to ₹50,000',
    'Modern Workstation (MacBook Pro / High-End Dev Rig) & Ergonomic Home Office Allowance',
    '24 Paid Vacation Days + 12 Public Holidays per calendar year',
    'Eligibility for Company Equity Stock Options (ESOPs) pool after probation',
  ];

  const handleAccept = async () => {
    if (!onAccept) return;
    setProcessing(true);
    try {
      await onAccept();
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!onDecline) return;
    setProcessing(true);
    try {
      await onDecline(declineReason);
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="olm-backdrop" onClick={onClose}>
        <motion.div
          className="olm-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Top Bar (Actions & Close) */}
          <div className="olm-top-bar">
            <div className="olm-top-left">
              <span className="olm-badge-confidential">
                <ShieldCheck size={13} /> Official Employment Offer &middot; Strictly Confidential
              </span>
            </div>
            <div className="olm-top-right">
              <button className="olm-action-btn" onClick={handlePrint} title="Print / Save as PDF">
                <Printer size={15} /> Print / Save PDF
              </button>
              <button className="olm-close-btn" onClick={onClose} aria-label="Close">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Letterhead Document */}
          <div className="olm-document" id="printable-offer-letter">
            {/* Letterhead Header */}
            <div className="olm-doc-header">
              <div className="olm-doc-brand">
                <div className="olm-brand-emblem">{companyName.charAt(0)}</div>
                <div>
                  <h2 className="olm-company-title">{companyName}</h2>
                  <p className="olm-company-sub">
                    Enterprise Cloud & Software Solutions &middot; Reg. CIN: U72900KA2021PTC145678
                  </p>
                  <p className="olm-company-addr">
                    Tech Park Silicon Valley, Outer Ring Road, Bellandur, Bengaluru, Karnataka 560103
                  </p>
                </div>
              </div>
              <div className="olm-doc-meta">
                <div className="olm-ref-code">Ref: CT/OFFER/{new Date().getFullYear()}/{(application.id || '9872').slice(-6).toUpperCase()}</div>
                <div className="olm-ref-date">Date: {new Date(offer.issuedDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>

            <div className="olm-divider" />

            {/* Candidate Address */}
            <div className="olm-recipient-section">
              <p className="olm-to">To,</p>
              <h3 className="olm-cand-name">{candidateName}</h3>
              <p className="olm-cand-contact">{application.applicantEmail} &middot; {application.applicantPhone || '+91 98765 43210'}</p>
            </div>

            {/* Subject */}
            <div className="olm-subject">
              <strong>SUBJECT: FORMAL OFFER OF EMPLOYMENT FOR THE POSITION OF {jobTitle.toUpperCase()}</strong>
            </div>

            {/* Body text */}
            <div className="olm-body-text">
              <p>
                Dear <strong>{candidateName}</strong>,
              </p>
              <p>
                Following our recent interview conversations, we are delighted to extend this formal offer of employment to join{' '}
                <strong>{companyName}</strong> as <strong>{jobTitle}</strong>. We were exceptionally impressed with your technical capabilities,
                problem-solving approach, and shared vision for creating resilient, high-impact systems.
              </p>
              {offer.notes && (
                <p className="olm-personal-note">
                  <em>"{offer.notes}"</em>
                </p>
              )}
            </div>

            {/* Compensation & Role Table */}
            <div className="olm-table-wrap">
              <table className="olm-summary-table">
                <tbody>
                  <tr>
                    <td className="olm-td-label"><Award size={14} /> Designation / Role</td>
                    <td className="olm-td-val"><strong>{jobTitle}</strong></td>
                  </tr>
                  <tr>
                    <td className="olm-td-label"><IndianRupee size={14} /> Total Annual CTC</td>
                    <td className="olm-td-val olm-highlight-ctc"><strong>{ctc}</strong></td>
                  </tr>
                  {offer.baseSalary && (
                    <tr>
                      <td className="olm-td-label">Fixed Base Component</td>
                      <td className="olm-td-val">{offer.baseSalary}</td>
                    </tr>
                  )}
                  {offer.bonus && (
                    <tr>
                      <td className="olm-td-label">Variable / Performance Pay</td>
                      <td className="olm-td-val">{offer.bonus}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="olm-td-label"><Calendar size={14} /> Date of Joining</td>
                    <td className="olm-td-val"><strong>{joiningDate}</strong></td>
                  </tr>
                  <tr>
                    <td className="olm-td-label"><MapPin size={14} /> Work Location & Mode</td>
                    <td className="olm-td-val">{location}</td>
                  </tr>
                  <tr>
                    <td className="olm-td-label">Offer Acceptance Deadline</td>
                    <td className="olm-td-val">{validityDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Benefits section */}
            <div className="olm-benefits-block">
              <h4 className="olm-sec-heading">Benefits, Health & Perks:</h4>
              <ul className="olm-benefits-list">
                {benefits.map((b, idx) => (
                  <li key={idx}><CheckCircle2 size={13} color="#059669" /> {b}</li>
                ))}
              </ul>
            </div>

            {/* Signatures block */}
            <div className="olm-signatures-row">
              <div className="olm-sig-box">
                <div className="olm-sig-line">
                  <span className="olm-digital-sig">Priya Nair</span>
                </div>
                <strong>Priya Nair</strong>
                <p>Head of Engineering & Talent Acquisitions</p>
                <span>{companyName}</span>
              </div>

              <div className="olm-sig-box olm-candidate-sig-box">
                <div className="olm-sig-line">
                  {isAccepted ? (
                    <span className="olm-accepted-stamp">
                      <CheckCircle2 size={15} /> Digitally Accepted by {candidateName}
                    </span>
                  ) : (
                    <span className="olm-pending-sig">Awaiting Candidate Signature</span>
                  )}
                </div>
                <strong>{candidateName}</strong>
                <p>Candidate / Signatory</p>
                <span>{isAccepted ? `Accepted on ${new Date().toLocaleDateString('en-IN')}` : 'Pending Confirmation'}</span>
              </div>
            </div>
          </div>

          {/* Footer Decision Bar for Job Seeker */}
          {isCandidate && isPending && (
            <div className="olm-footer-decision">
              {!showDeclineInput ? (
                <div className="olm-decision-bar">
                  <div className="olm-decision-prompt">
                    <h4>Do you accept this Job Offer?</h4>
                    <p>Review all clauses above. Accepting confirms your start date and reserves your position.</p>
                  </div>
                  <div className="olm-decision-btns">
                    <button
                      type="button"
                      className="olm-btn-decline"
                      onClick={() => setShowDeclineInput(true)}
                      disabled={processing}
                    >
                      Decline Offer
                    </button>
                    <button
                      type="button"
                      className="olm-btn-accept"
                      onClick={handleAccept}
                      disabled={processing}
                    >
                      <CheckCircle2 size={16} /> {processing ? 'Accepting...' : 'Accept Offer & Confirm Joining 🎉'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="olm-decline-box">
                  <h4>Reason for Declining (Optional)</h4>
                  <input
                    type="text"
                    placeholder="e.g. Accepted another offer / Compensation mismatch..."
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                  />
                  <div className="olm-decline-actions">
                    <button type="button" className="olm-btn-cancel-dec" onClick={() => setShowDeclineInput(false)}>
                      Back
                    </button>
                    <button type="button" className="olm-btn-confirm-decline" onClick={handleDecline} disabled={processing}>
                      Confirm Decline
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Banner if already Accepted */}
          {isAccepted && (
            <div className="olm-accepted-banner">
              <CheckCircle2 size={20} color="#059669" />
              <div>
                <strong>Congratulations! Offer Formally Accepted.</strong>
                <p>You are officially hired for this role. The onboarding team will reach out with first-day schedule.</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OfferLetterModal;
