import React from 'react';
import Layout from '../components/Layout/Layout';
import JobListings from '../components/JobListings/JobListings';
import './BrowseJobsPage.css';

const BrowseJobsPage = () => {
  return (
    <Layout>
      <div className="browse-page-header">
        <div className="container">
          <h1>Browse All Jobs</h1>
          <p>Find your perfect job from thousands of opportunities across India</p>
        </div>
      </div>
      <JobListings />
    </Layout>
  );
};

export default BrowseJobsPage;
