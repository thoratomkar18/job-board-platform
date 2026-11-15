import api from './axios';

export const jobsApi = {
  getAllJobs: async (params = {}) => {
    const res = await api.get('/jobs', { params });
    return res.data;
  },

  getMyJobs: async () => {
    const res = await api.get('/jobs/mine');
    return res.data;
  },

  getJobById: async (id) => {
    const res = await api.get(`/jobs/${id}`);
    return res.data;
  },

  createJob: async (jobData) => {
    const res = await api.post('/jobs', jobData);
    return res.data;
  },

  toggleJobStatus: async (id, status) => {
    const res = await api.patch(`/jobs/${id}/status`, { status });
    return res.data;
  },

  deleteJob: async (id) => {
    const res = await api.delete(`/jobs/${id}`);
    return res.data;
  },
};
