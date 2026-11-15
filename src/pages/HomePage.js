import React, { useState } from 'react';
import Layout from '../components/Layout/Layout';
import Hero from '../components/Hero/Hero';
import QuickSearchBar from '../components/QuickSearchBar/QuickSearchBar';
import RecentlyPostedJobs from '../components/RecentlyPostedJobs/RecentlyPostedJobs';
import WhyChooseUs from '../components/WhyChooseUs/WhyChooseUs';
import JobListings from '../components/JobListings/JobListings';

const HomePage = () => {
  const [searchCriteria, setSearchCriteria] = useState(null);

  const handleSearch = (criteria) => {
    const hasValues = Boolean(
      criteria?.keyword ||
      criteria?.location ||
      criteria?.jobType ||
      criteria?.salaryRange ||
      criteria?.experience ||
      criteria?.category
    );

    if (hasValues) {
      setSearchCriteria(criteria);
    } else {
      setSearchCriteria(null);
    }
  };

  return (
    <Layout>
      <Hero />

      {/* Single Unified Quick Search Bar */}
      <QuickSearchBar onSearch={handleSearch} showAdvancedToggle={true} />

      {/* If user searched on HomePage: display filtered job results */}
      {searchCriteria ? (
        <JobListings
          showSearch={false}
          externalCriteria={searchCriteria}
          title="Search Results"
        />
      ) : (
        /* Default Landing Flow */
        <>
          <RecentlyPostedJobs />
          <WhyChooseUs />
        </>
      )}
    </Layout>
  );
};

export default HomePage;
