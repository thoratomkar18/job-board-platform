import React, { useState, useEffect } from 'react';
import JobCard from '../JobCard/JobCard';
import SearchBar from '../SearchBar/SearchBar';
import './JobListings.css';

const JobListings = () => {
  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCriteria, setSearchCriteria] = useState({});

  // Expanded sample data with more variety for better search testing
  useEffect(() => {
    setTimeout(() => {
      const sampleJobs = [
        {
          id: 1,
          title: "Frontend Developer",
          company: "Tech Solutions Inc",
          location: "New York, NY",
          type: "Full-time",
          salary: "$75,000 - $95,000",
          salaryMin: 75000,
          salaryMax: 95000,
          experienceLevel: "Mid Level",
          postedDate: "2025-08-05",
          description: "We are looking for a skilled Frontend Developer to join our dynamic team. You will be responsible for developing user-facing web applications using modern frameworks and technologies.",
          skills: ["React", "JavaScript", "CSS", "HTML", "TypeScript"]
        },
        {
          id: 2,
          title: "Backend Developer",
          company: "Digital Innovations",
          location: "San Francisco, CA",
          type: "Full-time",
          salary: "$80,000 - $100,000",
          salaryMin: 80000,
          salaryMax: 100000,
          experienceLevel: "Senior Level",
          postedDate: "2025-08-04",
          description: "Join our backend team to build scalable server-side applications. Experience with Node.js and database management is essential for this role.",
          skills: ["Node.js", "MongoDB", "Express", "API", "AWS"]
        },
        {
          id: 3,
          title: "Full Stack Developer",
          company: "StartUp Hub",
          location: "Austin, TX",
          type: "Contract",
          salary: "$90,000 - $110,000",
          salaryMin: 90000,
          salaryMax: 110000,
          experienceLevel: "Senior Level",
          postedDate: "2025-08-03",
          description: "We need a versatile Full Stack Developer who can work on both frontend and backend technologies. Perfect opportunity for someone who loves variety.",
          skills: ["React", "Node.js", "Python", "PostgreSQL", "Docker"]
        },
        {
          id: 4,
          title: "UI/UX Designer",
          company: "Creative Agency",
          location: "Los Angeles, CA",
          type: "Part-time",
          salary: "$60,000 - $75,000",
          salaryMin: 60000,
          salaryMax: 75000,
          experienceLevel: "Mid Level",
          postedDate: "2025-08-02",
          description: "Create amazing user experiences and beautiful interfaces. We're looking for someone passionate about design and user-centered thinking.",
          skills: ["Figma", "Adobe XD", "Prototyping", "User Research", "CSS"]
        },
        {
          id: 5,
          title: "DevOps Engineer",
          company: "Cloud Systems",
          location: "Seattle, WA",
          type: "Full-time",
          salary: "$95,000 - $120,000",
          salaryMin: 95000,
          salaryMax: 120000,
          experienceLevel: "Senior Level",
          postedDate: "2025-08-01",
          description: "Help us maintain and improve our cloud infrastructure. Experience with containerization and CI/CD pipelines is highly valued.",
          skills: ["AWS", "Docker", "Kubernetes", "Jenkins", "Linux"]
        },
        {
          id: 6,
          title: "Mobile App Developer",
          company: "App Masters",
          location: "Miami, FL",
          type: "Full-time",
          salary: "$70,000 - $90,000",
          salaryMin: 70000,
          salaryMax: 90000,
          experienceLevel: "Mid Level",
          postedDate: "2025-07-31",
          description: "Build cutting-edge mobile applications for iOS and Android platforms. Join our team of mobile experts and create apps that millions will use.",
          skills: ["React Native", "Swift", "Kotlin", "Firebase", "Redux"]
        },
        {
          id: 7,
          title: "Data Scientist",
          company: "Analytics Pro",
          location: "Remote",
          type: "Full-time",
          salary: "$100,000 - $130,000",
          salaryMin: 100000,
          salaryMax: 130000,
          experienceLevel: "Senior Level",
          postedDate: "2025-07-30",
          description: "Analyze complex data sets to drive business decisions. Work with machine learning algorithms and statistical models.",
          skills: ["Python", "R", "Machine Learning", "SQL", "Tableau"]
        },
        {
          id: 8,
          title: "Marketing Intern",
          company: "Growth Marketing",
          location: "Chicago, IL",
          type: "Internship",
          salary: "$35,000 - $45,000",
          salaryMin: 35000,
          salaryMax: 45000,
          experienceLevel: "Entry Level",
          postedDate: "2025-07-29",
          description: "Learn digital marketing strategies and help execute campaigns. Perfect for students or recent graduates.",
          skills: ["Social Media", "Content Marketing", "Analytics", "SEO", "Email Marketing"]
        }
      ];
      
      setAllJobs(sampleJobs);
      setFilteredJobs(sampleJobs);
      setLoading(false);
    }, 1000);
  }, []);

  // Advanced search function
  const handleSearch = (criteria) => {
    setSearchCriteria(criteria);
    
    let filtered = allJobs;

    // Filter by keyword (title, company, skills)
    if (criteria.keyword) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(criteria.keyword.toLowerCase()) ||
        job.company.toLowerCase().includes(criteria.keyword.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(criteria.keyword.toLowerCase())) ||
        job.description.toLowerCase().includes(criteria.keyword.toLowerCase())
      );
    }

    // Filter by location
    if (criteria.location) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(criteria.location.toLowerCase())
      );
    }

    // Filter by job type
    if (criteria.jobType) {
      filtered = filtered.filter(job => job.type === criteria.jobType);
    }

    // Filter by salary range
    if (criteria.salaryRange) {
      if (criteria.salaryRange === '150000+') {
        filtered = filtered.filter(job => job.salaryMin >= 150000);
      } else {
        const [min, max] = criteria.salaryRange.split('-').map(Number);
        filtered = filtered.filter(job => 
          job.salaryMax >= min && job.salaryMin <= max
        );
      }
    }

    // Filter by experience level
    if (criteria.experienceLevel) {
      filtered = filtered.filter(job => job.experienceLevel === criteria.experienceLevel);
    }

    setFilteredJobs(filtered);
  };

  const handleLoadMore = () => {
    alert('Loading more jobs... 🔄');
    console.log('Load more jobs clicked');
  };

  if (loading) {
    return (
      <section className="job-listings">
        <SearchBar onSearch={handleSearch} />
        <div className="listings-container">
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading amazing job opportunities...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="job-listings">
      <SearchBar onSearch={handleSearch} />
      <div className="listings-container">
        <div className="listings-header">
          <h2>
            {filteredJobs.length === allJobs.length 
              ? 'All Job Opportunities' 
              : `Search Results: ${filteredJobs.length} jobs found`}
          </h2>
          <p>
            {filteredJobs.length === 0 
              ? 'No jobs match your search criteria. Try adjusting your filters.' 
              : `Discover your next career move from ${filteredJobs.length} available positions`}
          </p>
        </div>

        {filteredJobs.length > 0 ? (
          <>
            <div className="jobs-grid">
              {filteredJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            {filteredJobs.length >= 6 && (
              <div className="load-more-section">
                <button className="load-more-btn" onClick={handleLoadMore}>
                  Load More Jobs
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No jobs found</h3>
            <p>Try adjusting your search criteria or browse all available positions.</p>
            <button 
              className="browse-all-btn"
              onClick={() => handleSearch({})}
            >
              Browse All Jobs
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default JobListings;
