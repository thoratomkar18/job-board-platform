import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import HomePage from '../pages/HomePage';
import BrowseJobsPage from '../pages/BrowseJobsPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import UserDashboard from '../pages/UserDashboard';
import EmployerDashboard from '../pages/EmployerDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import JobDetailPage from '../pages/JobDetailPage';
import NotFoundPage from '../pages/NotFoundPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/browse" element={<BrowseJobsPage />} />
      <Route path="/jobs" element={<BrowseJobsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/job/:jobId" element={<JobDetailPage />} />

      {/* Job Seeker Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['job_seeker']}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-dashboard"
        element={
          <ProtectedRoute allowedRoles={['job_seeker']}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      {/* Employer Protected Routes */}
      <Route
        path="/employer-dashboard"
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <EmployerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Administrator Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
