const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

// Load env vars
dotenv.config({ path: './.env' });

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route files
const auth = require('./routes/auth');
const admin = require('./routes/admin');
const areaManager = require('./routes/areaManager');
const worker = require('./routes/worker');
const client = require('./routes/client');
const job = require('./routes/job');

// Mount routers
app.use('/api/auth', auth);
app.use('/api/admin', admin);
app.use('/api/area-manager', areaManager);
app.use('/api/worker', worker);
app.use('/api/client', client);
app.use('/api/jobs', job);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
