import React, { createContext, useState, useContext, useEffect } from 'react';

const AdminContext = createContext();

export const useAdmin = () => {
  return useContext(AdminContext);
};

export const AdminProvider = ({ children }) => {
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 1247,
    totalEmployers: 89,
    totalJobSeekers: 1158,
    totalJobs: 423,
    activeJobs: 387,
    totalApplications: 2156,
    pendingApplications: 234,
    successfulHires: 156,
    avgTimeToHire: 12, // days
    topSkills: ['JavaScript', 'React', 'Python', 'Node.js', 'SQL'],
    recentActivity: [],
    userGrowth: [],
    applicationTrends: []
  });

  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'job_seeker',
      joinedDate: '2025-01-15',
      status: 'active',
      applicationsCount: 8,
      lastActive: '2025-08-08'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'employer@company.com',
      role: 'employer',
      company: 'Tech Solutions Inc',
      joinedDate: '2024-12-10',
      status: 'active',
      jobsPosted: 5,
      lastActive: '2025-08-07'
    }
  ]);

  const [flaggedContent, setFlaggedContent] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    serverStatus: 'healthy',
    databaseStatus: 'healthy',
    apiResponseTime: 156, // ms
    uptime: 99.8, // percentage
    errorRate: 0.02 // percentage
  });

  // Generate mock analytics data
  useEffect(() => {
    const generateMockData = () => {
      // User growth data (last 7 days)
      const userGrowth = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        userGrowth.push({
          date: date.toISOString().split('T')[0],
          newUsers: Math.floor(Math.random() * 15) + 5,
          newEmployers: Math.floor(Math.random() * 3) + 1
        });
      }

      // Application trends (last 7 days)
      const applicationTrends = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        applicationTrends.push({
          date: date.toISOString().split('T')[0],
          applications: Math.floor(Math.random() * 30) + 10,
          interviews: Math.floor(Math.random() * 8) + 2,
          hires: Math.floor(Math.random() * 3) + 1
        });
      }

      // Recent activity
      const activities = [
        'New user registration: jane.smith@email.com',
        'Job posted: Senior React Developer - TechCorp',
        'Application submitted for Frontend Developer position',
        'User reported inappropriate job posting',
        'Employer upgraded to premium plan',
        'Bulk import completed: 25 new jobs',
        'System maintenance completed successfully'
      ];

      const recentActivity = activities.map((activity, index) => ({
        id: Date.now() + index,
        activity,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        type: Math.random() > 0.7 ? 'warning' : 'info'
      }));

      setPlatformStats(prev => ({
        ...prev,
        userGrowth,
        applicationTrends,
        recentActivity
      }));
    };

    generateMockData();
  }, []);

  // Admin actions
  const suspendUser = (userId) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: 'suspended' }
        : user
    ));
  };

  const activateUser = (userId) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: 'active' }
        : user
    ));
  };

  const deleteUser = (userId) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const updatePlatformStats = (newStats) => {
    setPlatformStats(prev => ({ ...prev, ...newStats }));
  };

  const value = {
    platformStats,
    users,
    flaggedContent,
    systemHealth,
    suspendUser,
    activateUser,
    deleteUser,
    updatePlatformStats
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
