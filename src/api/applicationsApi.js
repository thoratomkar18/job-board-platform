import api from './axios';

export const applicationsApi = {
  getAllApplications: async () => {
    const res = await api.get('/applications');
    return res.data;
  },

  applyForJob: async (formData) => {
    // If formData is FormData instance, send with multipart/form-data
    const res = await api.post('/applications', formData);
    return res.data;
  },

  updateStatus: async (applicationId, statusData) => {
    const res = await api.patch(`/applications/${applicationId}/status`, statusData);
    return res.data;
  },

  submitRsvp: async (appId, rsvpData) => {
    const res = await api.patch(`/applications/${appId}/candidate-rsvp`, rsvpData);
    return res.data;
  },

  submitScorecard: async (appId, scorecardData) => {
    const res = await api.post(`/applications/${appId}/scorecard`, scorecardData);
    return res.data;
  },

  scheduleNextRound: async (appId, roundData) => {
    const res = await api.post(`/applications/${appId}/schedule-round`, roundData);
    return res.data;
  },

  issueOffer: async (appId, offerData) => {
    const res = await api.post(`/applications/${appId}/issue-offer`, offerData);
    return res.data;
  },

  respondToOffer: async (appId, responseData) => {
    const res = await api.patch(`/applications/${appId}/respond-offer`, responseData);
    return res.data;
  },
};
