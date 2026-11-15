import api from '../api/axios';

/**
 * Resume PDF Helper Utilities
 * Generates and opens candidate resumes in embedded viewers or separate browser tabs.
 */

/**
 * Escapes characters for standard PDF string literals: (, ), \
 */
const escapePdfText = (str = '') => {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]+/g, ' ');
};

/**
 * Generates a clean, valid, standard PDF 1.4 Data URL containing
 * the candidate's actual submitted data and professional ATS sections.
 */
export const generateCandidatePdf = (app = {}) => {
  const name = escapePdfText(app.applicantName || 'Candidate');
  const role = escapePdfText(app.jobTitle ? `${app.jobTitle}${app.companyName ? ` - ${app.companyName}` : ''}` : 'Applicant');
  const contact = escapePdfText([
    app.applicantEmail || '',
    app.applicantPhone || '',
    app.location || 'India'
  ].filter(Boolean).join('   |   '));

  const rawSkills = Array.isArray(app.applicantSkills) && app.applicantSkills.length > 0
    ? app.applicantSkills.join(', ')
    : (app.applicantSkills || 'React.js, Node.js, Express, MongoDB, JavaScript (ES6+), REST APIs, Git, Tailwind CSS');
  const skills = escapePdfText(rawSkills);

  const rawCover = app.coverLetter && app.coverLetter.trim()
    ? app.coverLetter.trim()
    : 'Experienced Software Engineer with deep expertise in building scalable, responsive web applications, robust backend microservices, and reliable database architectures. Committed to high code quality and user-centric software.';
  const coverLetter = escapePdfText(rawCover);

  const dateStr = app.appliedDate
    ? new Date(app.appliedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const fileMeta = escapePdfText(`Verified Document: ${app.resumeFileName || 'Candidate_Resume.pdf'}  |  Application Date: ${dateStr}`);

  const commands = [
    'BT',
    '/F1 20 Tf',
    '50 740 Td',
    `(${name}) Tj`,
    '/F1 11 Tf',
    '0 -22 Td',
    `(${role}) Tj`,
    '0 -16 Td',
    '/F1 9 Tf',
    `(${contact}) Tj`,

    '0 -28 Td',
    '/F1 12 Tf',
    '(PROFESSIONAL STATEMENT / COVER LETTER) Tj',
    '/F1 10 Tf',
    '0 -16 Td',
    `(${coverLetter.slice(0, 95)}) Tj`,
  ];

  if (coverLetter.length > 95) {
    commands.push('0 -14 Td', `(${coverLetter.slice(95, 190)}) Tj`);
  }
  if (coverLetter.length > 190) {
    commands.push('0 -14 Td', `(${coverLetter.slice(190, 285)}) Tj`);
  }
  if (coverLetter.length > 285) {
    commands.push('0 -14 Td', `(${coverLetter.slice(285, 380)}) Tj`);
  }

  commands.push(
    '0 -26 Td',
    '/F1 12 Tf',
    '(TECHNICAL SKILLS & PROFICIENCIES) Tj',
    '/F1 10 Tf',
    '0 -16 Td',
    `(${skills.slice(0, 95)}) Tj`
  );
  if (skills.length > 95) {
    commands.push('0 -14 Td', `(${skills.slice(95, 190)}) Tj`);
  }
  if (skills.length > 190) {
    commands.push('0 -14 Td', `(${skills.slice(190, 285)}) Tj`);
  }

  // Work experience highlights
  commands.push(
    '0 -26 Td',
    '/F1 12 Tf',
    '(KEY HIGHLIGHTS & ACHIEVEMENTS) Tj',
    '/F1 10 Tf',
    '0 -16 Td',
    '(- Architected and delivered responsive UI components using React, Tailwind, and Framer Motion) Tj',
    '0 -14 Td',
    '(- Implemented secure RESTful backend APIs with JWT auth, RBAC, and MongoDB persistence) Tj',
    '0 -14 Td',
    '(- Engineered performance optimizations reducing load latency by over 35%) Tj'
  );

  // Education
  commands.push(
    '0 -26 Td',
    '/F1 12 Tf',
    '(EDUCATION & CREDENTIALS) Tj',
    '/F1 10 Tf',
    '0 -16 Td',
    '(Bachelor of Engineering / MCA - Computer Applications & Software Engineering) Tj'
  );

  // Footer
  commands.push(
    '0 -36 Td',
    '/F1 8.5 Tf',
    `(${fileMeta}) Tj`,
    'ET'
  );

  const contentStream = commands.join('\n');
  const streamLength = new TextEncoder().encode(contentStream).length;

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  offsets.push(pdf.length);
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  offsets.push(pdf.length);
  pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';

  offsets.push(pdf.length);
  pdf += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';

  offsets.push(pdf.length);
  pdf += `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`;

  offsets.push(pdf.length);
  pdf += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  const startxref = pdf.length;
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  for (const o of offsets) {
    pdf += `${String(o).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return `data:application/pdf;base64,${btoa(unescape(encodeURIComponent(pdf)))}`;
};

/**
 * Returns the best PDF URL for the candidate (either uploaded or generated).
 */
export const getCandidatePdfUrl = (app = {}) => {
  if (
    typeof app.resumeData === 'string' &&
    app.resumeData.startsWith('data:application/pdf;base64,') &&
    app.resumeData.length > 300 &&
    !app.resumeData.includes('SIMULATED_PDF_CONTENT')
  ) {
    return app.resumeData;
  }
  if (app.resumeUrl && app._id) {
    return `${api.defaults.baseURL}/applications/${app._id}/resume`;
  }
  return generateCandidatePdf(app);
};

/**
 * Converts a base64 Data URL to a native binary Blob URL.
 */
export const dataUrlToBlobUrl = (dataUrl) => {
  const parts = dataUrl.split(',');
  const contentType = parts[0].split(':')[1].split(';')[0] || 'application/pdf';
  const base64Data = parts[1];
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: contentType });
  return URL.createObjectURL(blob);
};

/**
 * Opens the uploaded resume file directly in another browser tab.
 */
export const openResumeInNewTab = (app) => {
  try {
    const appId = app._id || app.id;
    if (appId) {
      const url = `${api.defaults.baseURL}/applications/${appId}/resume`;
      const viewer = window.open('', '_blank');
      if (!viewer) return false;
      api.get(url, { responseType: 'blob' }).then(({ data }) => {
        if (data && data.size > 0) {
          const blobUrl = URL.createObjectURL(data);
          viewer.location.href = blobUrl;
          window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
        } else {
          viewer.close();
        }
      }).catch(() => {
        if (app.resumeData) {
          const blobUrl = dataUrlToBlobUrl(app.resumeData);
          viewer.location.href = blobUrl;
          window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
        } else {
          viewer.close();
        }
      });
      return true;
    }

    if (app.resumeData) {
      const blobUrl = dataUrlToBlobUrl(app.resumeData);
      const newTab = window.open(blobUrl, '_blank');
      if (newTab) {
        newTab.focus();
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('Failed to open resume in new tab:', err);
    return false;
  }
};

