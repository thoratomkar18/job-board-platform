import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

/**
 * Role-Based Access Control Route Guard
 * Enforces role isolation across Job Seeker, Employer, and Admin portals.
 * - Redirects guests to "/" with authentication request state and toast alert.
 * - Redirects logged-in users with unauthorized roles directly to their own role dashboard with toast warning.
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const notifiedRef = useRef(false);

  const isGuest = !currentUser;
  const isUnauthorized = currentUser && allowedRoles && !allowedRoles.includes(currentUser.role);

  useEffect(() => {
    if (loading) return;

    if (isGuest && !notifiedRef.current) {
      notifiedRef.current = true;
      toast.warning('Authentication Required', {
        description: 'Please sign in or create an account to access this portal.',
      });
    } else if (isUnauthorized && !notifiedRef.current) {
      notifiedRef.current = true;
      const roleLabels = {
        job_seeker: 'Job Seeker',
        employer: 'Employer',
        admin: 'Admin',
      };
      const targetName = allowedRoles.map((r) => roleLabels[r] || r).join(' / ');
      toast.error('Access Restricted', {
        description: `This section is restricted to ${targetName}s. Redirected to your dashboard.`,
      });
    }
  }, [loading, isGuest, isUnauthorized, allowedRoles]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#4f46e5', fontWeight: 600, fontSize: '1.1rem' }}>
          Verifying security credentials...
        </div>
      </div>
    );
  }

  // 1. Unauthenticated users -> redirect to home
  if (isGuest) {
    return <Navigate to="/" state={{ from: location, requireAuth: true }} replace />;
  }

  // 2. Strict Role Verification
  if (isUnauthorized) {
    if (currentUser.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (currentUser.role === 'employer') {
      return <Navigate to="/employer-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
