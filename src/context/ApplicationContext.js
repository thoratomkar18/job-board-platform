import React, { createContext, useState, useContext, useEffect } from 'react';

const ApplicationContext = createContext();

export const useApplications = () => {
  return useContext(ApplicationContext);
};

export const ApplicationProvider = ({ children }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load user's applications on component mount
  useEffect(() => {
    const savedApplications = localStorage.getItem('userApplications');
    if (savedApplications) {
      setApplications(JSON.parse(savedApplications));
    }
  }, []);

  // Save applications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userApplications', JSON.stringify(applications));
  }, [applications]);

  // Apply to a job
  const applyToJob = async (jobId, applicationData) => {
    setLoading(true);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const newApplication = {
          id: Date.now(),
          jobId: parseInt(jobId),
          appliedDate: new Date().toISOString(),
          status: 'pending', // pending, reviewed, interview, hired, rejected
          ...applicationData
        };

        setApplications(prev => [...prev, newApplication]);
        setLoading(false);
        resolve(newApplication);
      }, 1500); // Simulate API call delay
    });
  };

  // Check if user has already applied to a job
  const hasAppliedToJob = (jobId) => {
    return applications.some(app => app.jobId === parseInt(jobId));
  };

  // Get application for a specific job
  const getApplicationForJob = (jobId) => {
    return applications.find(app => app.jobId === parseInt(jobId));
  };

  // Get all applications for current user
  const getUserApplications = () => {
    return applications.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
  };

  // Update application status (for demo purposes)
  const updateApplicationStatus = (applicationId, newStatus) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus }
          : app
      )
    );
  };

  const value = {
    applications,
    loading,
    applyToJob,
    hasAppliedToJob,
    getApplicationForJob,
    getUserApplications,
    updateApplicationStatus
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
};
