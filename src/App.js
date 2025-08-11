import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ApplicationProvider } from './context/ApplicationContext';
import { NotificationProvider } from './context/NotificationContext';
import { AdminProvider } from './context/AdminContext'; // ADD THIS
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import JobListings from './components/JobListings/JobListings';
import Footer from './components/Footer/Footer';
import JobDetailPage from './pages/JobDetailPage';
import BrowseJobsPage from './pages/BrowseJobsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import UserDashboard from './pages/UserDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import AdminDashboard from './pages/AdminDashboard'; // ADD THIS
import ScrollToTop from './components/ScrollToTop';
import './App.css';

const HomePage = () => {
  return (
    <>
      <Header />
      <Hero />
      <JobListings />
      <Footer />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AdminProvider> {/* ADD THIS */}
        <NotificationProvider>
          <ApplicationProvider>
            <Router>
              <ScrollToTop />
              <div className="App">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/browse" element={<BrowseJobsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="/employer-dashboard" element={<EmployerDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} /> {/* ADD THIS */}
                  <Route path="/job/:jobId" element={<JobDetailPage />} />
                </Routes>
              </div>
            </Router>
          </ApplicationProvider>
        </NotificationProvider>
      </AdminProvider> {/* ADD THIS */}
    </AuthProvider>
  );
}

export default App;
