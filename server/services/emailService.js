const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const nodemailer = require('nodemailer');

// In-memory deduplication cache: prevents duplicate emails within 5 minutes
const sentDeduplicationCache = new Map();
const DEDUPE_TTL_MS = 5 * 60 * 1000;

function cleanupDedupeCache() {
  const now = Date.now();
  for (const [key, timestamp] of sentDeduplicationCache.entries()) {
    if (now - timestamp > DEDUPE_TTL_MS) {
      sentDeduplicationCache.delete(key);
    }
  }
}
const cleanupTimer = setInterval(cleanupDedupeCache, 60 * 1000);
if (cleanupTimer.unref) cleanupTimer.unref();

// Pooled Gmail SMTP Transporter
let gmailTransporter = null;

function getGmailTransporter() {
  const user = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : '';
  const pass = process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') : '';

  if (user && pass) {
    if (!gmailTransporter) {
      gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
    }
    return gmailTransporter;
  }
  return null;
}

/**
 * Base Responsive HTML Email Layout with JobConnect India Branding
 */
function renderEmailTemplate({ previewText, headline, subheadline, contentHtml, ctaText, ctaUrl, footerNote }) {
  const primaryColor = '#4f46e5';
  const siteUrl = process.env.CLIENT_URL || 'http://localhost:3000/job-board-platform';
  const actionUrl = ctaUrl.startsWith('http') ? ctaUrl : `${siteUrl}${ctaUrl.startsWith('/') ? '' : '/'}${ctaUrl}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    table { border-spacing: 0; }
    td { padding: 0; }
    img { border: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #0f172a; padding: 40px 0; }
    .main-table { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
    .header-banner { background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 36px 30px; text-align: center; }
    .logo-badge { display: inline-block; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); padding: 8px 18px; border-radius: 980px; color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px; }
    .header-title { color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px; }
    .header-subtitle { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
    .body-content { padding: 36px 32px; background-color: #ffffff; }
    .content-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .btn-container { text-align: center; margin: 32px 0 20px 0; }
    .cta-button { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 14px 34px; border-radius: 10px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); }
    .footer-section { background-color: #f1f5f9; padding: 24px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer-links a { color: #4f46e5; text-decoration: none; margin: 0 8px; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText || headline}
  </div>

  <table class="wrapper" role="presentation">
    <tr>
      <td align="center">
        <table class="main-table" role="presentation">
          <!-- Header -->
          <tr>
            <td class="header-banner">
              <div class="logo-badge">💼 JOB CONNECT INDIA</div>
              <h1 class="header-title">${headline}</h1>
              ${subheadline ? `<p class="header-subtitle">${subheadline}</p>` : ''}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="body-content">
              ${contentHtml}

              ${ctaText && ctaUrl ? `
                <div class="btn-container">
                  <a href="${actionUrl}" target="_blank" class="cta-button">${ctaText} &rarr;</a>
                </div>
              ` : ''}

              ${footerNote ? `<p style="font-size: 13px; color: #64748b; margin-top: 24px; text-align: center;">${footerNote}</p>` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-section">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #334155;">JobConnect India — Naukri Dhundo, Sapna Jiyo 🇮🇳</p>
              <p style="margin: 0 0 12px 0;">Connecting India's top talent with verified high-growth companies.</p>
              <div class="footer-links">
                <a href="${siteUrl}/dashboard">Dashboard</a> &bull;
                <a href="${siteUrl}/browse">Browse Jobs</a> &bull;
                <a href="${siteUrl}/contact">Support</a>
              </div>
              <p style="margin: 16px 0 0 0; font-size: 11px; color: #94a3b8;">
                You received this transactional email because of an update on your JobConnect account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send an email with Gmail SMTP (Nodemailer) as primary delivery engine
 */
async function sendEmail({ to, subject, templateType, data = {}, retries = 2 }) {
  if (!to) {
    console.warn('⚠️ [EmailService] Cannot send email: recipient address missing.');
    return { success: false, reason: 'missing_recipient' };
  }

  // Deduplication Key: to + subject + data.applicationId/jobId
  const dedupeKey = `${to}_${subject}_${data.applicationId || data.jobId || ''}`;
  if (sentDeduplicationCache.has(dedupeKey)) {
    console.log(`ℹ️ [EmailService] Skipping duplicate email to ${to} (Subject: "${subject}")`);
    return { success: true, duplicateSkipped: true };
  }

  // Build specific template HTML based on templateType
  const emailPayload = buildTemplatePayload(templateType, data);
  const html = renderEmailTemplate(emailPayload);

  const transporter = getGmailTransporter();

  let attempt = 0;
  while (attempt <= retries) {
    try {
      attempt++;

      // 1. Live Gmail SMTP Delivery (Primary Engine)
      if (transporter) {
        const fromAddress = process.env.EMAIL_FROM || `JobConnect India <${process.env.GMAIL_USER.trim()}>`;
        const info = await transporter.sendMail({
          from: fromAddress,
          to: to,
          subject: subject,
          html: html,
        });

        sentDeduplicationCache.set(dedupeKey, Date.now());
        console.log(`📧 [Gmail SMTP] Live transactional email dispatched to ${to} | ID: ${info.messageId} | Subject: "${subject}"`);
        return { success: true, provider: 'gmail_smtp', id: info.messageId };
      }

      // 2. Fallback Development Simulation Mode (when GMAIL_USER / GMAIL_APP_PASSWORD not yet entered)
      sentDeduplicationCache.set(dedupeKey, Date.now());
      console.log(`\n================== 📨 [GMAIL DEV EMAIL PREVIEW] ==================`);
      console.log(`TO:      ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`ACTION:  ${emailPayload.ctaText} -> ${emailPayload.ctaUrl}`);
      console.log(`STATUS:  Ready. To send real emails, set GMAIL_USER and GMAIL_APP_PASSWORD in server/.env`);
      console.log(`==================================================================\n`);

      return { success: true, provider: 'dev_preview_simulation' };
    } catch (err) {
      console.error(`❌ [EmailService] Attempt ${attempt} failed for ${to}:`, err.message);
      if (attempt > retries) {
        return { success: false, error: err.message };
      }
      // Wait 1s before retry
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

/**
 * Template Builder for all required notification scenarios
 */
function buildTemplatePayload(templateType, data) {
  switch (templateType) {
    case 'application_submitted':
      return {
        previewText: `Your application for ${data.jobTitle} has been submitted!`,
        headline: `Application Submitted Successfully! 🚀`,
        subheadline: `Cloud-verified submission for ${data.companyName}`,
        contentHtml: `
          <p>Namaste <strong>${data.candidateName || 'Candidate'}</strong>,</p>
          <p>Great news! Your application for <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong> has been received and routed directly to the recruitment team.</p>
          <div class="content-box">
            <p style="margin: 0 0 8px 0;"><strong>Role:</strong> ${data.jobTitle}</p>
            <p style="margin: 0 0 8px 0;"><strong>Company:</strong> ${data.companyName}</p>
            <p style="margin: 0;"><strong>Application Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
          <p>You can track the progress of your application through every stage directly from your Job Seeker Portal.</p>
        `,
        ctaText: 'View Application Status',
        ctaUrl: '/dashboard?tab=applications',
        footerNote: 'Our algorithm will notify you the moment the hiring team reviews your resume.',
      };

    case 'application_received':
      return {
        previewText: `New candidate application from ${data.candidateName} for ${data.jobTitle}`,
        headline: `New Candidate Applied! 👤`,
        subheadline: `${data.jobTitle} &bull; ${data.candidateName}`,
        contentHtml: `
          <p>Hello <strong>${data.employerName || 'Hiring Lead'}</strong>,</p>
          <p>A new candidate has submitted their profile and resume for your open vacancy: <strong>${data.jobTitle}</strong>.</p>
          <div class="content-box">
            <p style="margin: 0 0 8px 0;"><strong>Candidate:</strong> ${data.candidateName}</p>
            <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${data.candidateEmail}</p>
            <p style="margin: 0 0 8px 0;"><strong>Skills:</strong> ${Array.isArray(data.skills) ? data.skills.join(', ') : (data.skills || 'Listed in resume')}</p>
            ${data.expectedSalary ? `<p style="margin: 0;"><strong>Expected CTC:</strong> ${data.expectedSalary}</p>` : ''}
          </div>
          <p>You can review their resume, schedule multi-round interviews, or shortlist them directly from your Candidates dashboard.</p>
        `,
        ctaText: 'Review Candidate & Resume',
        ctaUrl: '/employer-dashboard?tab=candidates',
        footerNote: 'Prompt screening increases candidate response rates by up to 60%.',
      };

    case 'application_shortlisted':
      return {
        previewText: `Congratulations! You have been shortlisted for ${data.jobTitle}`,
        headline: `You're Shortlisted! ⭐`,
        subheadline: `${data.companyName} wants to move forward with your profile`,
        contentHtml: `
          <p>Namaste <strong>${data.candidateName || 'Candidate'}</strong>,</p>
          <p>Fantastic news! The hiring team at <strong>${data.companyName}</strong> was impressed by your profile and has shortlisted you for the <strong>${data.jobTitle}</strong> position.</p>
          <div class="content-box">
            <p style="margin: 0 0 8px 0;"><strong>Status:</strong> Shortlisted & Advance to Interview Stage</p>
            <p style="margin: 0;"><strong>Next Step:</strong> The recruitment team will schedule your interview round soon. Keep your calendar open!</p>
          </div>
          <p>Check your dashboard for upcoming interview invitations and scorecard feedback.</p>
        `,
        ctaText: 'Go to My Applications',
        ctaUrl: '/dashboard?tab=applications',
      };

    case 'application_rejected':
      return {
        previewText: `Update on your application for ${data.jobTitle}`,
        headline: `Application Status Update`,
        subheadline: `${data.jobTitle} at ${data.companyName}`,
        contentHtml: `
          <p>Dear <strong>${data.candidateName || 'Candidate'}</strong>,</p>
          <p>Thank you for taking the time to apply for the <strong>${data.jobTitle}</strong> role at <strong>${data.companyName}</strong>.</p>
          <p>After careful consideration, the hiring team has decided to proceed with other candidates whose experience more closely aligns with their immediate requirements.</p>
          <div class="content-box">
            <p style="margin: 0;">Please don't be discouraged — new roles are posted every day on JobConnect India that match your skillset!</p>
          </div>
        `,
        ctaText: 'Explore More Matching Jobs',
        ctaUrl: '/browse',
      };

    case 'interview_scheduled':
    case 'interview_rescheduled':
      const isRescheduled = templateType === 'interview_rescheduled';
      return {
        previewText: `Interview ${isRescheduled ? 'Rescheduled' : 'Scheduled'}: ${data.jobTitle} at ${data.companyName}`,
        headline: `Interview ${isRescheduled ? 'Rescheduled' : 'Scheduled'} 📅`,
        subheadline: `${data.round || 'Technical Round'} with ${data.companyName}`,
        contentHtml: `
          <p>Namaste <strong>${data.candidateName || 'Candidate'}</strong>,</p>
          <p>An interview round has been ${isRescheduled ? 'rescheduled' : 'scheduled'} for your application to <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong>.</p>
          <div class="content-box">
            <p style="margin: 0 0 8px 0;"><strong>Round:</strong> ${data.round || 'Technical Interview'}</p>
            <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${data.date || 'TBD'}</p>
            <p style="margin: 0 0 8px 0;"><strong>Time:</strong> ${data.time || 'TBD'} (IST)</p>
            <p style="margin: 0 0 8px 0;"><strong>Mode:</strong> ${data.mode || 'Google Meet'}</p>
            ${data.link ? `<p style="margin: 0;"><strong>Meeting Link:</strong> <a href="${data.link}" target="_blank" style="color:#4f46e5;font-weight:600;">${data.link}</a></p>` : ''}
          </div>
          <p>Please confirm your RSVP (Accept or Request Reschedule) on your dashboard as soon as possible.</p>
        `,
        ctaText: 'Confirm Interview RSVP',
        ctaUrl: '/dashboard?tab=applications',
        footerNote: 'You can also download a .ics calendar invite directly from your dashboard.',
      };

    case 'offer_issued':
      return {
        previewText: `Congratulations! Official Job Offer from ${data.companyName}`,
        headline: `Official Job Offer Received! 📜🎉`,
        subheadline: `${data.jobTitle} &bull; ${data.companyName}`,
        contentHtml: `
          <p>Namaste <strong>${data.candidateName || 'Candidate'}</strong>,</p>
          <p>Congratulations! <strong>${data.companyName}</strong> is delighted to extend a formal offer of employment to you for the position of <strong>${data.jobTitle}</strong>.</p>
          <div class="content-box">
            <p style="margin: 0 0 8px 0;"><strong>Role:</strong> ${data.jobTitle}</p>
            ${data.ctc ? `<p style="margin: 0 0 8px 0;"><strong>Total CTC:</strong> ${data.ctc}</p>` : ''}
            ${data.joiningDate ? `<p style="margin: 0 0 8px 0;"><strong>Target Joining Date:</strong> ${data.joiningDate}</p>` : ''}
            <p style="margin: 0;"><strong>Status:</strong> Ready for your digital signature</p>
          </div>
          <p>Please review the full offer letter, terms, and benefits on your dashboard and provide your digital acceptance.</p>
        `,
        ctaText: 'Review & Sign Offer Letter',
        ctaUrl: '/dashboard?tab=applications',
      };

    case 'offer_accepted':
      return {
        previewText: `Offer Accepted: ${data.candidateName} has accepted your job offer!`,
        headline: `Candidate Accepted Offer! 🎉🥂`,
        subheadline: `${data.jobTitle} &bull; ${data.candidateName}`,
        contentHtml: `
          <p>Hello <strong>${data.employerName || 'Hiring Lead'}</strong>,</p>
          <p>Fantastic news! <strong>${data.candidateName}</strong> has digitally signed and accepted the job offer for <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong>.</p>
          <div class="content-box">
            <p style="margin: 0 0 8px 0;"><strong>Candidate:</strong> ${data.candidateName} (${data.candidateEmail})</p>
            <p style="margin: 0 0 8px 0;"><strong>Target Joining Date:</strong> ${data.joiningDate || 'As specified in letter'}</p>
            <p style="margin: 0;"><strong>Status:</strong> Candidate is officially HIRED!</p>
          </div>
        `,
        ctaText: 'View Hired Candidate Details',
        ctaUrl: '/employer-dashboard?tab=candidates',
      };

    case 'new_job_matching':
      return {
        previewText: `New Job Opening Matching Your Profile: ${data.jobTitle}`,
        headline: `New Job Match for You! ⚡`,
        subheadline: `${data.jobTitle} at ${data.companyName}`,
        contentHtml: `
          <p>Namaste <strong>${data.candidateName || 'Candidate'}</strong>,</p>
          <p>A new job has just been published on JobConnect India that matches your skills:</p>
          <div class="content-box">
            <p style="margin: 0 0 8px 0;"><strong>Position:</strong> ${data.jobTitle}</p>
            <p style="margin: 0 0 8px 0;"><strong>Company:</strong> ${data.companyName}</p>
            <p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${data.location}</p>
            <p style="margin: 0;"><strong>Salary:</strong> ${data.salary || 'Best in Industry'}</p>
          </div>
        `,
        ctaText: 'Apply to this Position',
        ctaUrl: `/job/${data.jobId}`,
      };

    default:
      return {
        previewText: data.title || 'New Notification on JobConnect',
        headline: data.title || 'Notification Update',
        contentHtml: `<p>${data.message || 'You have a new notification.'}</p>`,
        ctaText: 'View in Dashboard',
        ctaUrl: data.link || '/dashboard',
      };
  }
}

module.exports = {
  sendEmail,
  renderEmailTemplate,
};
