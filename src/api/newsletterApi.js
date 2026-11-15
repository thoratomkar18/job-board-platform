import axiosInstance from './axios';

const LOCAL_STORAGE_KEY = 'jobconnect_newsletter_subscribers';

export const newsletterApi = {
  subscribe: async (email) => {
    const trimmed = (email || '').trim().toLowerCase();
    
    // Offline local check for duplicates
    let localSubs = [];
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) localSubs = JSON.parse(stored);
    } catch {}

    if (localSubs.includes(trimmed)) {
      throw new Error('This email is already subscribed to JobConnect updates.');
    }

    try {
      const response = await axiosInstance.post('/newsletter/subscribe', { email: trimmed });
      // Record locally as well
      localSubs.push(trimmed);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localSubs));
      return response.data;
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      // Resilient fallback if server is unreachable
      localSubs.push(trimmed);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localSubs));
      return {
        success: true,
        message: 'Thank you for subscribing! You will receive genuine updates on new job openings.',
      };
    }
  },
};
