const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { connectDB, getDBStatus } = require('./config/db');
const { autoSeedDatabase } = require('./config/seed');
const { rateLimit } = require('./middleware/rateLimiter');
const { initSocket } = require('./services/socketService');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO on HTTP Server
initSocket(server);

// Connect to MongoDB and seed demo users/jobs if empty
connectDB().then(() => {
  autoSeedDatabase();
});

// Security & CORS Configuration
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://thoratomkar18.github.io',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.github.io') || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: This origin is not allowed.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parsers with safe payload limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Rate Limiters
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 300, message: 'Too many API requests, please slow down.' });
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 40, message: 'Too many authentication attempts. Please wait 1 minute before trying again.' });

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/stats', statsRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.json({
    status: 'ONLINE',
    project: 'JobConnect India - Recruitment Platform Backend API',
    institution: 'DYPIMCA',
    author: 'Omkar Thorat',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST  /api/auth/register',
      'POST  /api/auth/login',
      'GET   /api/auth/me',
      'PUT   /api/auth/profile',
      'GET   /api/auth/users',
      'PATCH /api/auth/users/:id/status',
      'GET   /api/jobs',
      'GET   /api/jobs/mine',
      'POST  /api/jobs',
      'GET   /api/jobs/:id',
      'PATCH /api/jobs/:id/status',
      'DELETE /api/jobs/:id',
      'GET   /api/applications',
      'POST  /api/applications',
      'PATCH /api/applications/:id/status',
      'PATCH /api/applications/:id/candidate-rsvp',
      'POST  /api/applications/:id/scorecard',
      'POST  /api/applications/:id/schedule-round',
      'POST  /api/applications/:id/issue-offer',
      'PATCH /api/applications/:id/respond-offer',
      'GET   /api/stats',
      'POST  /api/newsletter/subscribe',
    ]
  });
});

// Root API Welcome
app.get('/', (req, res) => {
  res.send('<h2>JobConnect India REST API is Running 🚀</h2><p>Visit <a href="/api/health">/api/health</a> for API documentation and database status.</p>');
});

// 404 Route Handler for undefined endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API endpoint '${req.originalUrl}' not found.` });
});

// Global Central Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[API Error]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
  });
});

// Start Server with Socket.IO enabled
server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` JobConnect Backend API + Socket.IO on Port ${PORT}`);
  console.log(` Health Endpoint: http://localhost:${PORT}/api/health`);
  console.log(`===================================================`);
});

module.exports = app;
