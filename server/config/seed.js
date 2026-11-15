const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');

const SEED_USERS = [
  {
    name: 'Omkar Thorat',
    email: 'thorato384@gmail.com',
    password: 'password123',
    role: 'job_seeker',
    phone: '+91 98765 43210',
    location: 'Pune / Bengaluru',
    bio: 'MCA Graduate & Full Stack Engineer passionate about React, Node.js, and cloud application development.',
    skills: ['React', 'JavaScript', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'Tailwind CSS'],
  },
  {
    name: 'Priya Nair',
    email: 'priya@techcorp.in',
    password: 'employer123',
    role: 'employer',
    phone: '+91 98111 22334',
    location: 'Bengaluru, Karnataka',
    company: 'CloudTech India Pvt. Ltd.',
    companyWebsite: 'https://cloudtech.in',
    skills: [],
  },
  {
    name: 'Rohan Deshmukh',
    email: 'rohan@zerodha.com',
    password: 'zerodha123',
    role: 'employer',
    phone: '+91 98444 55667',
    location: 'Bengaluru, Karnataka',
    company: 'Zerodha Broking Ltd.',
    companyWebsite: 'https://zerodha.com',
    skills: [],
  },
  {
    name: 'Platform Admin',
    email: 'admin@jobconnect.in',
    password: 'admin123',
    role: 'admin',
    phone: '+91 99999 00000',
    skills: [],
  },
];

const SEED_JOBS = [
  // 4 Legit Jobs from Priya Nair (CloudTech India Pvt. Ltd.)
  {
    title: 'Senior Full Stack Engineer (React & Node.js)',
    company: 'CloudTech India Pvt. Ltd.',
    companyWebsite: 'https://cloudtech.in',
    location: 'Bengaluru, Karnataka (Remote)',
    type: 'Full-time',
    salary: '₹16L - ₹25L LPA',
    salaryMin: 16,
    salaryMax: 25,
    salaryDisplay: '₹16L - ₹25L LPA',
    experienceLevel: '3-5 yrs',
    description: 'Build high-performance web applications and real-time backend microservices powering cloud-native analytics platforms. You will design scalable React components, GraphQL/REST endpoints, and PostgreSQL schemas.',
    requirements: '3+ years experience with React 18, Node.js, TypeScript, and Docker. Experience with AWS or GCP is a plus.',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'REST APIs'],
    status: 'active',
    applicants: 1,
    views: 148,
    employerName: 'Priya Nair',
  },
  {
    title: 'Lead Cloud & Platform Architect',
    company: 'CloudTech India Pvt. Ltd.',
    companyWebsite: 'https://cloudtech.in',
    location: 'Pune / Bengaluru (Hybrid)',
    type: 'Full-time',
    salary: '₹28L - ₹40L LPA',
    salaryMin: 28,
    salaryMax: 40,
    salaryDisplay: '₹28L - ₹40L LPA',
    experienceLevel: '5-10 yrs',
    description: 'Lead architecture for multi-tenant enterprise cloud deployments. Own Kubernetes cluster topologies, Terraform IaC blueprints, and disaster recovery architectures.',
    requirements: '7+ years cloud infrastructure experience. Deep expertise in AWS, EKS, Terraform, microservices security, and system reliability.',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'Microservices', 'System Design', 'Docker'],
    status: 'active',
    applicants: 0,
    views: 215,
    employerName: 'Priya Nair',
  },
  {
    title: 'Staff DevOps & Reliability Engineer (SRE)',
    company: 'CloudTech India Pvt. Ltd.',
    companyWebsite: 'https://cloudtech.in',
    location: 'Pune, Maharashtra',
    type: 'Full-time',
    salary: '₹20L - ₹32L LPA',
    salaryMin: 20,
    salaryMax: 32,
    salaryDisplay: '₹20L - ₹32L LPA',
    experienceLevel: '5-10 yrs',
    description: 'Drive 99.99% service availability across containerized cloud environments. Build automated CI/CD release pipelines and observability dashboards.',
    requirements: 'Hands-on production Kubernetes, Prometheus, Grafana, Linux kernel tuning, and automated deployment pipelines.',
    skills: ['Kubernetes', 'CI/CD', 'Terraform', 'Prometheus', 'Linux', 'Go'],
    status: 'active',
    applicants: 0,
    views: 94,
    employerName: 'Priya Nair',
  },
  {
    title: 'AI/ML Solutions Engineer',
    company: 'CloudTech India Pvt. Ltd.',
    companyWebsite: 'https://cloudtech.in',
    location: 'Bengaluru, Karnataka',
    type: 'Full-time',
    salary: '₹22L - ₹35L LPA',
    salaryMin: 22,
    salaryMax: 35,
    salaryDisplay: '₹22L - ₹35L LPA',
    experienceLevel: '3-5 yrs',
    description: 'Design and deploy production-grade LLM applications, RAG pipelines, and intelligent semantic search workflows for enterprise document processing.',
    requirements: 'Strong proficiency in Python, PyTorch/TensorFlow, vector databases (Milvus, Pinecone), LangChain, and model quantization.',
    skills: ['Python', 'PyTorch', 'LangChain', 'FastEmbed', 'Vector DBs', 'FastAPI'],
    status: 'active',
    applicants: 0,
    views: 126,
    employerName: 'Priya Nair',
  },

  // 2 Jobs from Rohan Deshmukh (Zerodha Broking Ltd.)
  {
    title: 'High-Performance Go Systems Engineer',
    company: 'Zerodha Broking Ltd.',
    companyWebsite: 'https://zerodha.com',
    location: 'Bengaluru, Karnataka (Hybrid)',
    type: 'Full-time',
    salary: '₹25L - ₹40L LPA',
    salaryMin: 25,
    salaryMax: 40,
    salaryDisplay: '₹25L - ₹40L LPA',
    experienceLevel: '3-5 yrs',
    description: 'Build ultra-low latency market feed tickers, OMS ordering backends, and reliable financial trading APIs using simple, robust software engineering.',
    requirements: 'Deep knowledge of Go internals, concurrency, WebSockets, Linux socket programming, and database tuning.',
    skills: ['Go', 'WebSockets', 'PostgreSQL', 'Redis', 'Linux', 'System Architecture'],
    status: 'active',
    applicants: 0,
    views: 310,
    employerName: 'Rohan Deshmukh',
  },
  {
    title: 'Senior Site Reliability Engineer (Linux & Networking)',
    company: 'Zerodha Broking Ltd.',
    companyWebsite: 'https://zerodha.com',
    location: 'Bengaluru, Karnataka',
    type: 'Full-time',
    salary: '₹22L - ₹34L LPA',
    salaryMin: 22,
    salaryMax: 34,
    salaryDisplay: '₹22L - ₹34L LPA',
    experienceLevel: '3-5 yrs',
    description: 'Maintain exchange co-location connectivity, high-frequency network routing, and automated bare-metal server provisioning.',
    requirements: 'Experience with BGP networking, Linux kernel network stack, HAProxy, PostgreSQL replication, and shell automation.',
    skills: ['Linux', 'Networking', 'BGP', 'HAProxy', 'PostgreSQL', 'Bash'],
    status: 'active',
    applicants: 0,
    views: 145,
    employerName: 'Rohan Deshmukh',
  },
];

async function autoSeedDatabase() {
  if (mongoose.connection.readyState !== 1) return;

  try {
    for (const u of SEED_USERS) {
      const existing = await User.findOne({ email: u.email });
      if (!existing) {
        console.log(`[Database Seed] Seeding demo user: ${u.email} (${u.role})`);
        await User.create(u);
      }
    }

    const jobCount = await Job.countDocuments();
    if (jobCount === 0) {
      console.log('[Database Seed] Seeding fresh legitimate active jobs...');
      const priya = await User.findOne({ email: 'priya@techcorp.in' });
      const rohan = await User.findOne({ email: 'rohan@zerodha.com' });

      for (const j of SEED_JOBS) {
        let postedBy = null;
        let employerId = '';
        if (j.employerName === 'Priya Nair' && priya) { postedBy = priya._id; employerId = priya._id.toString(); }
        else if (j.employerName === 'Rohan Deshmukh' && rohan) { postedBy = rohan._id; employerId = rohan._id.toString(); }

        await Job.create({
          ...j,
          postedBy,
          employerId: employerId || j.employerName,
        });
      }
      console.log('[Database Seed] Fresh legitimate jobs seeded successfully.');
    }
  } catch (err) {
    console.warn('[Database Seed] Seed notice:', err.message);
  }
}

module.exports = { autoSeedDatabase, SEED_USERS, SEED_JOBS };
