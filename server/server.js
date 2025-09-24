const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const connectDB = require('./config/db');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config({ path: './.env' });

// Connect to database
connectDB();

const app = express();

// Body parser middleware (bigger limit to allow base64 attachments)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Compression for faster responses
app.use(compression());

// Cookie parser middleware
app.use(cookieParser());

// CORS configuration (supports multiple comma-separated origins and Vercel previews)
const rawOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean);
const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS !== 'false';
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow same-origin/SSR
  if (rawOrigins.includes(origin)) return true;
  if (allowVercelPreviews && /\.vercel\.app$/.test(origin)) return true;
  return false;
};
const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type','Authorization'],
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
const worker = require('./routes/worker');
const client = require('./routes/client');
const job = require('./routes/job');
const notification = require('./routes/notification');
const contact = require('./routes/contact');

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
        dashboard: 'GET /api/admin/dashboard',
        performance: 'GET /api/admin/performance',
        users: 'GET /api/admin/users',
        verifyWorker: 'PUT /api/admin/verify-worker/:id',
        jobs: 'GET /api/admin/jobs',
        payments: 'GET /api/admin/payments'
      },
      workers: {
        dashboard: 'GET /api/worker/dashboard',
        jobs: 'GET /api/worker/jobs',
        updateStatus: 'PUT /api/worker/jobs/:id/status',
        applications: 'GET /api/worker/applications',
        earnings: 'GET /api/worker/earnings'
      },
      clients: {
        dashboard: 'GET /api/client/dashboard',
        jobs: 'GET /api/client/jobs',
        createJob: 'POST /api/client/jobs',
        acceptApplication: 'PUT /api/client/jobs/:jobId/applications/:applicationId/accept',
        payments: 'GET /api/client/payments'
      },
      jobs: {
        list: 'GET /api/jobs',
        single: 'GET /api/jobs/:id',
        apply: 'POST /api/jobs/:id/apply',
        categories: 'GET /api/jobs/categories',
        search: 'GET /api/jobs/search',
        stats: 'GET /api/jobs/stats'
      },
      notifications: {
        list: 'GET /api/notifications',
        markRead: 'PUT /api/notifications/:id/read',
        markAllRead: 'PUT /api/notifications/read-all',
        stats: 'GET /api/notifications/stats'
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
app.use('/api/worker', worker);
app.use('/api/client', client);
app.use('/api/jobs', job);
app.use('/api/notifications', notification);
app.use('/api/contact', contact);

// Catch 404 routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;
let server; // http.Server

const startServer = (port, attemptsLeft = 5) => {
  return new Promise((resolve, reject) => {
    const srv = app.listen(port, () => {
      console.log(`
🚀 Belimuno Jobs Server Started!
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Port: ${port}
🔗 Health Check: http://localhost:${port}/api/health
📚 API Base: http://localhost:${port}/api
      `);
      resolve(srv);
    });
    srv.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
        const nextPort = port + 1;
        console.warn(`⚠️  Port ${port} is in use. Trying ${nextPort}...`);
        setTimeout(() => {
          startServer(nextPort, attemptsLeft - 1).then(resolve).catch(reject);
        }, 150);
      } else {
        reject(err);
      }
    });
  });
};

startServer(DEFAULT_PORT)
  .then((srv) => { server = srv; })
  .catch((err) => {
    console.error('❌ Failed to start server:', err.message || err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  if (server && typeof server.close === 'function') {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
