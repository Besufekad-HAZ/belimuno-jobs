const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config({ path: './.env' });

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Cookie parser middleware
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Route files
const auth = require('./routes/auth');
const admin = require('./routes/admin');
const areaManager = require('./routes/areaManager');
const worker = require('./routes/worker');
const client = require('./routes/client');
const job = require('./routes/job');

// API Info route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Belimuno Jobs API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout'
      },
      admin: {
        dashboard: 'GET /api/admin/performance',
        verifyWorker: 'PUT /api/admin/verify-worker/:id'
      },
      workers: {
        dashboard: 'GET /api/worker/jobs',
        updateStatus: 'PUT /api/worker/jobs/:id/status'
      },
      clients: {
        dashboard: 'GET /api/client/dashboard',
        jobs: 'GET /api/client/jobs'
      },
      jobs: {
        list: 'GET /api/jobs',
        create: 'POST /api/jobs',
        apply: 'POST /api/jobs/:id/apply'
      }
    }
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Belimuno Jobs API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount routers
app.use('/api/auth', auth);
app.use('/api/admin', admin);
app.use('/api/area-manager', areaManager);
app.use('/api/worker', worker);
app.use('/api/client', client);
app.use('/api/jobs', job);

// Catch 404 routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 Belimuno Jobs Server Started!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Port: ${PORT}
🔗 Health Check: http://localhost:${PORT}/api/health
📚 API Base: http://localhost:${PORT}/api
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});
