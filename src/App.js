import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ApplicationProvider } from './context/ApplicationContext';
import { NotificationProvider } from './context/NotificationContext';
import { AdminProvider } from './context/AdminContext';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/ScrollToTop';
import RoleSwitcher from './components/RoleSwitcher/RoleSwitcher';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <NotificationProvider>
          <ApplicationProvider>
            <Router basename={process.env.PUBLIC_URL || '/'}>
              <ScrollToTop />
              <div className="App">
                <AppRoutes />
              </div>

              {/* Quick 1-Click Role Switcher for Demo */}
              <RoleSwitcher />

              {/* Global Toast Notifications */}
              <Toaster
                position="top-right"
                richColors
                expand={false}
                toastOptions={{
                  style: {
                    borderRadius: '12px',
                    fontFamily: 'inherit',
                  },
                }}
              />
            </Router>
          </ApplicationProvider>
        </NotificationProvider>
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;
