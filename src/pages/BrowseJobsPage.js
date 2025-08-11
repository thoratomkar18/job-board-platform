import React from 'react';
import Header from '../components/Header/Header';
import JobListings from '../components/JobListings/JobListings';
import Footer from '../components/Footer/Footer';

const BrowseJobsPage = () => {
  return (
    <div className="browse-jobs-page">
      <Header />
      <div className="page-content">
        <div className="page-header">
          <div className="container">
            <h1>Browse All Jobs</h1>
            <p>Find your perfect job from thousands of opportunities</p>
          </div>
        </div>
        <JobListings />
      </div>
      <Footer />
    </div>
  );
};

export default BrowseJobsPage;
