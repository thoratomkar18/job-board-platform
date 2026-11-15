import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { jobsApi } from '../api/jobsApi';
import { applicationsApi } from '../api/applicationsApi';
import api from '../api/axios';

const ApplicationContext = createContext();
export const useApplications = () => useContext(ApplicationContext);

export const usePlatformStats = () => {
  const context = useContext(ApplicationContext);
  return context?.stats || {
    activeJobsCount: null,
    verifiedCompaniesCount: null,
    registeredCandidatesCount: null,
    totalApplicationsCount: null,
  };
};

// ─── Global storage keys (Offline Cache Fallback) ──────
const userStorageKey = (base, userId) => `${base}_${userId || 'guest'}`;

const loadAll = (key) => { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : []; } catch { return []; } };
const saveAll = (key, data) => {
  try {
    const safeData = Array.isArray(data)
      ? data.map(item => {
          if (item && item.resumeData) {
            const { resumeData, ...rest } = item;
            return rest;
          }
          return item;
        })
      : data;
    localStorage.setItem(key, JSON.stringify(safeData));
  } catch (err) {
    console.warn(`[ApplicationContext] localStorage save failed for ${key}:`, err);
  }
};

export const ApplicationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const appsKey = userStorageKey('jobconnect_all_applications', currentUser?.id);
  const jobsKey = userStorageKey('jobconnect_posted_jobs', currentUser?.id);
  const [allApplications, setAllApplications] = useState(() => loadAll(appsKey));
  const [postedJobs, setPostedJobs]           = useState(() => loadAll(jobsKey));

  // Seed demo data only if database is completely offline
  // (MongoDB autoSeedDatabase handles legitimate initial data on the server)
  // useEffect(() => { seedDemoData(); }, []);

  // Fetch directly from Express API + MongoDB (Single Source of Truth)
  const syncWithBackend = useCallback(async () => {
    try {
      const jobsRes = currentUser?.role === 'employer' ? await jobsApi.getMyJobs() : await jobsApi.getAllJobs();
      if (jobsRes.success && Array.isArray(jobsRes.data)) {
        const serverJobs = jobsRes.data.map(j => ({
          ...j,
          id: String(j._id || j.id),
          _id: String(j._id || j.id),
        }));
        setPostedJobs(serverJobs);
        saveAll(jobsKey, serverJobs);
      }
    } catch (e) {
      setPostedJobs([]);
    }

    try {
      const appsRes = await applicationsApi.getAllApplications();
      if (appsRes.success && Array.isArray(appsRes.data)) {
        const serverApps = appsRes.data.map(a => ({
          ...a,
          id: String(a._id || a.id),
          _id: String(a._id || a.id),
        }));
        setAllApplications(serverApps);
        saveAll(appsKey, serverApps);
      }
    } catch (e) {
      console.warn('[ApplicationContext] Failed to sync applications with backend:', e);
    }
  }, [appsKey, jobsKey, currentUser?.role]);

  useEffect(() => {
    setAllApplications(loadAll(appsKey));
    setPostedJobs(loadAll(jobsKey));
    syncWithBackend();
  }, [appsKey, jobsKey, syncWithBackend]);

  // ── APPLICANT methods ──────────────────────────────────────────────────
  const hasAppliedToJob = useCallback((jobId) =>
    allApplications.some(a => (String(a.jobId) === String(jobId) || String(a.jobIdString) === String(jobId)) &&
      (String(a.applicantId) === String(currentUser?.id) || String(a.applicantIdString) === String(currentUser?.id) || a.applicantEmail === currentUser?.email)),
    [allApplications, currentUser]);

  const applyToJob = useCallback(async (job, applicationData) => {
    if (!currentUser) {
      throw new Error('Please log in to apply.');
    }
    if (currentUser.role !== 'job_seeker') {
      throw new Error(`Accounts with role "${currentUser.role}" cannot apply for jobs. Please log in as a Job Seeker.`);
    }
    if (hasAppliedToJob(job.id)) {
      throw new Error('You have already applied for this job.');
    }

    const newApp = {
      id:             `app_${Date.now()}`,
      jobId:          job.id,
      jobIdString:    String(job.id),
      jobTitle:       job.title,
      companyName:    job.company || job.employerName,
      location:       job.location,
      salary:         job.salaryDisplay || job.salary,
      appliedDate:    new Date().toISOString(),
      status:         'pending',
      coverLetter:    applicationData.coverLetter || '',
      expectedSalary: applicationData.expectedSalary || '',
      availableFrom:  applicationData.availableFrom || applicationData.startDate || '',
      resumeFileName: applicationData.resumeFileName || '',
      resumeFileSize: applicationData.resumeFileSize || '',
      resumeData:     applicationData.resumeData || '',
      // Applicant identity
      applicantId:       currentUser.id,
      applicantIdString: String(currentUser.id),
      applicantName:     currentUser.name,
      applicantEmail:    currentUser.email,
      applicantPhone:    currentUser.phone || '',
      applicantSkills:   Array.isArray(currentUser.skills)
        ? currentUser.skills
        : (currentUser.skills || '').split(',').map(s => s.trim()).filter(Boolean),
      // Link to employer
    };

    // Persist to MongoDB first
    try {
      const formData = new FormData();
      formData.append('jobId', String(job.id || job._id));
      formData.append('coverLetter', newApp.coverLetter);
      formData.append('expectedSalary', newApp.expectedSalary);
      if (applicationData.resumeFile) formData.append('resume', applicationData.resumeFile);
      if (applicationData.resumeData) formData.append('resumeData', applicationData.resumeData);
      if (applicationData.resumeFileName) formData.append('resumeFileName', applicationData.resumeFileName);
      if (applicationData.resumeFileSize) formData.append('resumeFileSize', applicationData.resumeFileSize);
      const res = await applicationsApi.applyForJob(formData);
      if (!res?.success || !res.data) throw new Error('Application was not saved by the server.');
      const persistedApp = {
          ...newApp,
          ...res.data,
          id: String(res.data._id || newApp.id),
          _id: String(res.data._id || newApp.id),
      };
      const fresh = loadAll(appsKey);
      const updated = [persistedApp, ...fresh.filter(a => !(String(a.jobId) === String(job.id) && String(a.applicantEmail) === currentUser.email))];
      saveAll(appsKey, updated);
      setAllApplications(updated);
      return persistedApp;
    } catch (err) {
      throw new Error(err.message || 'Application could not be saved.');
    }
  }, [currentUser, hasAppliedToJob, appsKey, jobsKey]);

  const getApplicationForJob = useCallback((jobId) => {
    const currentId = String(currentUser?.id || currentUser?._id || '');
    const currentEmail = (currentUser?.email || '').toLowerCase().trim();
    const targetJobId = String(jobId || '');
    return allApplications.find(a => {
      const aJobId = String(a.jobId?._id || a.jobId || a.jobIdString || '');
      if (aJobId !== targetJobId) return false;
      const appId = String(a.applicantId?._id || a.applicantId || a.applicantIdString || '');
      const appEmail = (a.applicantEmail || a.applicantId?.email || '').toLowerCase().trim();
      return (currentId && appId === currentId) || (currentEmail && appEmail === currentEmail);
    });
  }, [allApplications, currentUser]);

  const getUserApplications = useCallback(() => {
    if (currentUser?.role !== 'job_seeker') return [];
    const currentId = String(currentUser?.id || currentUser?._id || '');
    const currentEmail = (currentUser?.email || '').toLowerCase().trim();
    return allApplications
      .filter(a => {
        const appId = String(a.applicantId?._id || a.applicantId || a.applicantIdString || '');
        const appEmail = (a.applicantEmail || a.applicantId?.email || '').toLowerCase().trim();
        return (currentId && appId === currentId) || (currentEmail && appEmail === currentEmail);
      })
      .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
  }, [allApplications, currentUser]);

  // ── EMPLOYER methods ───────────────────────────────────────────────────
  const postJob = useCallback(async (jobData) => {
    if (!currentUser) {
      throw new Error('Please log in to post a job.');
    }
    if (currentUser.role !== 'employer') {
      throw new Error(`Accounts with role "${currentUser.role}" cannot post jobs. Please log in as an Employer.`);
    }

    const newJob = {
      ...jobData,
      id:          `job_${Date.now()}`,
      status:      'active',
      applicants:  0,
      views:       0,
      postedDate:  new Date().toISOString().split('T')[0],
      employerId:  currentUser.id,
      employerName:currentUser.name,
    };

    // Sync with backend API
    try {
      const res = await jobsApi.createJob(jobData);
      if (res?.data) {
        const backendId = String(res.data._id || res.data.id || newJob.id);
        const persistedJob = { ...newJob, ...res.data, id: backendId, _id: backendId };
        const fresh = loadAll(jobsKey);
        const synced = [persistedJob, ...fresh.filter(j => String(j.id) !== backendId)];
        saveAll(jobsKey, synced);
        setPostedJobs(synced);
        return persistedJob;
      }
      throw new Error('Job was not saved by the server.');
    } catch (err) {
      throw new Error(err.message || 'Job could not be saved.');
    }
  }, [currentUser, jobsKey]);

  const getEmployerJobs = useCallback(() => {
    if (currentUser?.role !== 'employer') return [];
    return postedJobs.filter(j =>
      String(j.employerId) === String(currentUser?.id) ||
      String(j.postedBy) === String(currentUser?.id) ||
      (j.employerName && currentUser?.name && String(j.employerName).toLowerCase() === String(currentUser.name).toLowerCase()) ||
      (j.company && currentUser?.company && String(j.company).toLowerCase() === String(currentUser.company).toLowerCase())
    );
  }, [postedJobs, currentUser]);

  const toggleJobStatus = useCallback(async (jobId) => {
    const fresh = loadAll(jobsKey);
    const target = fresh.find(j => j.id === jobId);
    if (!target) return;
    if (currentUser?.role === 'employer' && String(target.employerId) !== String(currentUser?.id) && String(target.postedBy) !== String(currentUser?.id)) {
      throw new Error('You cannot modify jobs belonging to another employer.');
    }
    const newStatus = target?.status === 'active' ? 'paused' : 'active';
    const updated = fresh.map(j =>
      j.id === jobId ? { ...j, status: newStatus } : j
    );
    await jobsApi.toggleJobStatus(jobId, newStatus);
    saveAll(jobsKey, updated);
    setPostedJobs(updated);
  }, [currentUser, jobsKey]);

  const deleteJob = useCallback(async (jobId) => {
    const fresh = loadAll(jobsKey);
    const target = fresh.find(j => j.id === jobId);
    if (!target) return;
    if (currentUser?.role === 'employer' && String(target.employerId) !== String(currentUser?.id) && String(target.postedBy) !== String(currentUser?.id)) {
      throw new Error('You cannot delete jobs belonging to another employer.');
    }
    const updated = fresh.filter(j => j.id !== jobId);
    await jobsApi.deleteJob(jobId);
    saveAll(jobsKey, updated);
    setPostedJobs(updated);
  }, [currentUser, jobsKey]);

  const getApplicationsForJob = useCallback((jobId) => {
    const targetId = String(jobId || '');
    return allApplications
      .filter(a => {
        const aJobId = String(a.jobId?._id || a.jobId || a.jobIdString || '');
        return aJobId === targetId;
      })
      .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
  }, [allApplications]);

  const getEmployerApplications = useCallback(() => {
    if (currentUser?.role !== 'employer') return [];
    const myJobs = getEmployerJobs();
    const myJobIds = new Set(myJobs.map(j => String(j.id || j._id)));
    const currentId = String(currentUser?.id || currentUser?._id || '');
    const currentCompany = (currentUser?.company || '').toLowerCase().trim();
    const currentName = (currentUser?.name || '').toLowerCase().trim();

    return allApplications
      .filter(a => {
        const jId = String(a.jobId?._id || a.jobId || a.jobIdString || '');
        const matchesJobId = myJobIds.has(jId);
        const matchesEmployerId = a.employerId && (String(a.employerId) === currentId);
        const matchesCompany = currentCompany && a.companyName &&
          String(a.companyName).toLowerCase().includes(currentCompany);
        const matchesEmployerName = currentName && a.employerName &&
          String(a.employerName).toLowerCase() === currentName;
        return matchesJobId || matchesEmployerId || matchesCompany || matchesEmployerName;
      })
      .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
  }, [allApplications, getEmployerJobs, currentUser]);

  const updateApplicationStatus = useCallback(async (appId, status, extras = {}) => {
    if (!currentUser) throw new Error('Authentication required.');
    if (currentUser.role === 'job_seeker') {
      throw new Error('Job seekers cannot update application status.');
    }

    const fresh = loadAll(appsKey);
    const targetApp = fresh.find(a => a.id === appId || a._id === appId);
    if (!targetApp) throw new Error('Application not found.');

    if (currentUser.role === 'employer') {
      const myJobIds = postedJobs
        .filter(j => String(j.employerId) === String(currentUser.id) || String(j.postedBy) === String(currentUser.id))
        .map(j => String(j.id || j._id));
      const targetJobId = String(targetApp.jobId?._id || targetApp.jobId || targetApp.jobIdString || '');
      const ownsApp = myJobIds.includes(targetJobId) || String(targetApp.employerId) === String(currentUser.id);
      if (!ownsApp) {
        throw new Error('Forbidden: You can only update candidates for jobs you own.');
      }
    }

    const opts = typeof extras === 'string' ? { employerNote: extras } : (extras || {});
    const updated = fresh.map(a =>
      a.id === appId || a._id === appId
        ? {
            ...a,
            status,
            updatedAt: new Date().toISOString(),
            employerNote: opts.employerNote !== undefined ? opts.employerNote : (a.employerNote || ''),
            ...(opts.interviewDate && { interviewDate: opts.interviewDate }),
            ...(opts.interviewTime && { interviewTime: opts.interviewTime }),
            ...(opts.interviewMode && { interviewMode: opts.interviewMode }),
            ...(opts.interviewLink && { interviewLink: opts.interviewLink }),
            ...(opts.interviewRound && { interviewRound: opts.interviewRound }),
          }
        : a
    );
    saveAll(appsKey, updated);
    setAllApplications(updated);

    // Sync with backend API
    try {
      await applicationsApi.updateStatus(appId, { status, ...opts });
    } catch (err) {
      setAllApplications(fresh);
      saveAll(appsKey, fresh);
      throw err;
    }
  }, [currentUser, postedJobs, appsKey]);

  // ── Candidate Interview RSVP & Reschedule Method ──────────────────────
  const submitCandidateRsvp = useCallback(async (appId, rsvpData) => {
    if (!currentUser) throw new Error('Authentication required.');
    const fresh = loadAll(appsKey);
    const targetApp = fresh.find(a => a.id === appId || a._id === appId);
    if (!targetApp) throw new Error('Application not found.');

    const newRsvp = {
      status: rsvpData.rsvpStatus || 'accepted',
      proposedDate: rsvpData.proposedDate || '',
      proposedTime: rsvpData.proposedTime || '',
      note: rsvpData.note || '',
      respondedAt: new Date().toISOString(),
    };

    const updated = fresh.map(a =>
      a.id === appId || a._id === appId
        ? {
            ...a,
            candidateRsvp: newRsvp,
            updatedAt: new Date().toISOString(),
          }
        : a
    );
    saveAll(appsKey, updated);
    setAllApplications(updated);

    // Notify Employer in real-time
    try {
      const employerId = targetApp.employerId || 'employer1';
      const notifKey = `jobconnect_notifications_${employerId}`;
      const existing = JSON.parse(localStorage.getItem(notifKey) || '[]');
      const notif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        read: false,
        type: newRsvp.status === 'reschedule_requested' ? 'reschedule' : 'rsvp_confirmed',
        title: newRsvp.status === 'reschedule_requested'
          ? `Interview Reschedule Requested! 🔄`
          : `Candidate Confirmed Interview Attendance! ✅`,
        message: newRsvp.status === 'reschedule_requested'
          ? `${targetApp.applicantName} requested reschedule for ${targetApp.jobTitle}: ${newRsvp.proposedDate} at ${newRsvp.proposedTime}. Note: "${newRsvp.note}"`
          : `${targetApp.applicantName} confirmed attendance for ${targetApp.interviewRound || 'Interview'} on ${targetApp.interviewDate}.`,
        link: '/employer-dashboard?tab=candidates',
      };
      localStorage.setItem(notifKey, JSON.stringify([notif, ...existing]));
    } catch (e) {}

    try {
      await applicationsApi.submitRsvp(appId, rsvpData);
    } catch (e) {
      setAllApplications(fresh);
      saveAll(appsKey, fresh);
      throw e;
    }
  }, [currentUser, appsKey]);

  // ── Employer Interview Scorecard Method ──────────────────────────────
  const submitInterviewScorecard = useCallback(async (appId, scorecardData) => {
    if (!currentUser) throw new Error('Authentication required.');
    const fresh = loadAll(appsKey);
    const targetApp = fresh.find(a => a.id === appId || a._id === appId);
    if (!targetApp) throw new Error('Application not found.');

    const round = scorecardData.round || targetApp.interviewRound || 'Technical Round 1';
    const overallScore = Number(
      (
        ((scorecardData.technical || 4) +
          (scorecardData.communication || 4) +
          (scorecardData.problemSolving || 4) +
          (scorecardData.culture || 4)) /
        4
      ).toFixed(1)
    );

    const scorecard = {
      technical: Number(scorecardData.technical) || 4,
      communication: Number(scorecardData.communication) || 4,
      problemSolving: Number(scorecardData.problemSolving) || 4,
      culture: Number(scorecardData.culture) || 4,
      overallScore,
      recommendation: scorecardData.recommendation || 'advance',
      feedback: scorecardData.feedback || '',
      submittedAt: new Date().toISOString(),
      submittedBy: currentUser.name || 'Interviewer',
    };

    const existingHistory = Array.isArray(targetApp.interviewHistory) ? targetApp.interviewHistory : [];
    let roundFound = false;
    const updatedHistory = existingHistory.map(h => {
      if (h.round === round) {
        roundFound = true;
        return { ...h, status: 'completed', scorecard };
      }
      return h;
    });

    if (!roundFound) {
      updatedHistory.push({
        round,
        date: targetApp.interviewDate || '',
        time: targetApp.interviewTime || '',
        mode: targetApp.interviewMode || 'Google Meet',
        link: targetApp.interviewLink || '',
        status: 'completed',
        scheduledAt: new Date().toISOString(),
        scorecard,
      });
    }

    const nextStatus = scorecardData.recommendation === 'offer' ? 'offered' : targetApp.status;

    const updated = fresh.map(a =>
      a.id === appId || a._id === appId
        ? {
            ...a,
            status: nextStatus,
            interviewHistory: updatedHistory,
            employerNote: scorecardData.feedback || a.employerNote,
            updatedAt: new Date().toISOString(),
          }
        : a
    );
    saveAll(appsKey, updated);
    setAllApplications(updated);

    try {
      await applicationsApi.submitScorecard(appId, scorecardData);
    } catch (e) {
      setAllApplications(fresh);
      saveAll(appsKey, fresh);
      throw e;
    }
  }, [currentUser, appsKey]);

  // ── Employer Multi-Round Progression Method ───────────────────────────
  const scheduleNextRound = useCallback(async (appId, roundData) => {
    if (!currentUser) throw new Error('Authentication required.');
    const fresh = loadAll(appsKey);
    const targetApp = fresh.find(a => a.id === appId || a._id === appId);
    if (!targetApp) throw new Error('Application not found.');

    const existingHistory = Array.isArray(targetApp.interviewHistory) ? targetApp.interviewHistory : [];
    const archivedHistory = existingHistory.map(h =>
      h.round === targetApp.interviewRound ? { ...h, status: 'completed' } : h
    );

    archivedHistory.push({
      round: roundData.round || 'Round 2',
      date: roundData.date,
      time: roundData.time,
      mode: roundData.mode || 'Google Meet',
      link: roundData.link || '',
      status: 'scheduled',
      scheduledAt: new Date().toISOString(),
      scorecard: {
        technical: 0,
        communication: 0,
        problemSolving: 0,
        culture: 0,
        overallScore: 0,
        recommendation: '',
        feedback: '',
      },
    });

    const updated = fresh.map(a =>
      a.id === appId || a._id === appId
        ? {
            ...a,
            status: 'interview',
            interviewRound: roundData.round,
            interviewDate: roundData.date,
            interviewTime: roundData.time,
            interviewMode: roundData.mode || 'Google Meet',
            interviewLink: roundData.link || '',
            employerNote: roundData.note || a.employerNote || '',
            candidateRsvp: { status: 'pending', proposedDate: '', proposedTime: '', note: '' },
            interviewHistory: archivedHistory,
            updatedAt: new Date().toISOString(),
          }
        : a
    );
    saveAll(appsKey, updated);
    setAllApplications(updated);

    // Notify candidate
    try {
      const candId = targetApp.applicantId || 'omkar1';
      const notifKey = `jobconnect_notifications_${candId}`;
      const existing = JSON.parse(localStorage.getItem(notifKey) || '[]');
      const notif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'interview_round',
        title: `Next Round Scheduled: ${roundData.round}! 📅`,
        message: `${targetApp.jobTitle} at ${targetApp.companyName}: ${roundData.round} is set for ${roundData.date} at ${roundData.time} via ${roundData.mode}.`,
        link: '/dashboard',
      };
      localStorage.setItem(notifKey, JSON.stringify([notif, ...existing]));
    } catch (e) {}

    try {
      await applicationsApi.scheduleNextRound(appId, roundData);
    } catch (e) {
      setAllApplications(fresh);
      saveAll(appsKey, fresh);
      throw e;
    }
  }, [currentUser, appsKey]);

  // ── Employer Issue Formal Job Offer Method ────────────────────────────
  const issueJobOffer = useCallback(async (appId, offerData) => {
    if (!currentUser) throw new Error('Authentication required.');
    const fresh = loadAll(appsKey);
    const targetApp = fresh.find(a => a.id === appId || a._id === appId);
    if (!targetApp) throw new Error('Application not found.');

    const offerDetails = {
      ctc: offerData.ctc || '₹22,00,000 / yr',
      baseSalary: offerData.baseSalary || '₹18,50,000 / yr',
      bonus: offerData.bonus || '₹3,50,000 / yr',
      joiningDate: offerData.joiningDate || '',
      location: offerData.location || targetApp.location || 'Bengaluru (Hybrid)',
      validityDate: offerData.validityDate || '',
      notes: offerData.notes || '',
      benefits: Array.isArray(offerData.benefits) ? offerData.benefits : [],
      issuedDate: new Date().toISOString(),
      status: 'pending',
    };

    const updated = fresh.map(a =>
      a.id === appId || a._id === appId
        ? {
            ...a,
            status: 'offered',
            offerDetails,
            updatedAt: new Date().toISOString(),
          }
        : a
    );
    saveAll(appsKey, updated);
    setAllApplications(updated);

    // Push celebration notification to candidate
    try {
      const candId = targetApp.applicantId || 'omkar1';
      const notifKey = `jobconnect_notifications_${candId}`;
      const existing = JSON.parse(localStorage.getItem(notifKey) || '[]');
      const notif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'job_offer',
        title: `🎉 Formal Job Offer Received from ${targetApp.companyName}!`,
        message: `Congratulations! An offer of ${offerDetails.ctc} has been released for ${targetApp.jobTitle}. Review and sign your employment agreement.`,
        link: '/dashboard',
      };
      localStorage.setItem(notifKey, JSON.stringify([notif, ...existing]));
    } catch (e) {}

    try {
      await applicationsApi.issueOffer(appId, offerData);
    } catch (e) {
      setAllApplications(fresh);
      saveAll(appsKey, fresh);
      throw e;
    }
  }, [currentUser, appsKey]);

  // ── Candidate Respond to Offer (Accept / Decline) Method ───────────────
  const respondToOffer = useCallback(async (appId, responseData) => {
    if (!currentUser) throw new Error('Authentication required.');
    const fresh = loadAll(appsKey);
    const targetApp = fresh.find(a => a.id === appId || a._id === appId);
    if (!targetApp) throw new Error('Application not found.');

    const isAccept = responseData.action === 'accept';
    const nextStatus = isAccept ? 'hired' : 'rejected';
    const currentOffer = targetApp.offerDetails || {};

    const updatedOffer = {
      ...currentOffer,
      status: isAccept ? 'accepted' : 'declined',
      candidateResponseDate: new Date().toISOString(),
      ...(isAccept ? {} : { declineReason: responseData.declineReason || '' }),
    };

    const updated = fresh.map(a =>
      a.id === appId || a._id === appId
        ? {
            ...a,
            status: nextStatus,
            offerDetails: updatedOffer,
            updatedAt: new Date().toISOString(),
          }
        : a
    );
    saveAll(appsKey, updated);
    setAllApplications(updated);

    // Notify Employer
    try {
      const empId = targetApp.employerId || 'employer1';
      const notifKey = `jobconnect_notifications_${empId}`;
      const existing = JSON.parse(localStorage.getItem(notifKey) || '[]');
      const notif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        read: false,
        type: isAccept ? 'offer_accepted' : 'offer_declined',
        title: isAccept
          ? `🎉 Offer Accepted! ${targetApp.applicantName} is Joining!`
          : `Job Offer Declined by ${targetApp.applicantName}`,
        message: isAccept
          ? `${targetApp.applicantName} signed the offer for ${targetApp.jobTitle}. Joining date: ${updatedOffer.joiningDate || 'Immediate'}.`
          : `${targetApp.applicantName} declined the offer for ${targetApp.jobTitle}.${responseData.declineReason ? ` Reason: ${responseData.declineReason}` : ''}`,
        link: '/employer-dashboard?tab=candidates',
      };
      localStorage.setItem(notifKey, JSON.stringify([notif, ...existing]));
    } catch (e) {}

    try {
      await applicationsApi.respondToOffer(appId, responseData);
    } catch (e) {
      setAllApplications(fresh);
      saveAll(appsKey, fresh);
      throw e;
    }
  }, [currentUser, appsKey]);

  // Real platform statistics derived directly from verified active database records
  const [platformStats, setPlatformStats] = useState(null);
  useEffect(() => {
    let active = true;
    api.get('/stats').then(({ data }) => {
      if (active && data?.success) setPlatformStats(data.data);
    }).catch(() => { if (active) setPlatformStats(null); });
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => ({
    activeJobsCount: platformStats?.activeJobs ?? null,
    verifiedCompaniesCount: platformStats?.totalCompanies ?? null,
    registeredCandidatesCount: platformStats?.registeredUsers ?? null,
    totalApplicationsCount: platformStats?.applicationsCount ?? null,
    allActiveJobs: (postedJobs || []).filter(j => (j.status || '').toLowerCase() === 'active'),
  }), [platformStats, postedJobs]);

  return (
    <ApplicationContext.Provider value={{
      applyToJob,
      hasAppliedToJob,
      getApplicationForJob,
      getUserApplications,
      postJob,
      getEmployerJobs,
      toggleJobStatus,
      deleteJob,
      getApplicationsForJob,
      getEmployerApplications,
      updateApplicationStatus,
      submitCandidateRsvp,
      submitInterviewScorecard,
      scheduleNextRound,
      issueJobOffer,
      respondToOffer,
      allApplications,
      postedJobs,
      syncWithBackend,
      stats,
    }}>
      {children}
    </ApplicationContext.Provider>
  );
};
