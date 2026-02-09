/**
 * Bulk Job Posting Script for Belimuno Jobs
 *
 * This script posts job vacancies from a job data file directly to the database via Mongoose.
 *
 * Usage:
 *   node post-bulk-jobs.js <path-to-job-data-file>
 *
 * Example:
 *   node post-bulk-jobs.js data/job-batches/batch-feb-2026.js
 *
 * Job data file format:
 *   module.exports = [ { title, description, category, budget, company, ... }, ... ];
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const Job = require('./models/Job');
const User = require('./models/User');

// Load env vars
dotenv.config({ path: './.env' });

// ============================================================
// Helper: deadline 30 days from now
// ============================================================
const deadline30 = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
};

const deadline60 = () => {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d;
};

// ============================================================
// MAIN – Post all jobs from data file
// ============================================================
async function postAllJobs(jobDataPath) {
  try {
    // Validate and load job data file
    if (!jobDataPath) {
      console.error('ERROR: Job data file path is required.');
      console.error('\nUsage: node post-bulk-jobs.js <path-to-job-data-file>');
      console.error('Example: node post-bulk-jobs.js data/job-batches/batch-feb-2026.js\n');
      process.exit(1);
    }

    const fullPath = path.resolve(__dirname, jobDataPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`ERROR: Job data file not found: ${fullPath}`);
      process.exit(1);
    }

    console.log(`Loading job data from: ${jobDataPath}\n`);
    const allJobs = require(fullPath);

    if (!Array.isArray(allJobs) || allJobs.length === 0) {
      console.error('ERROR: Job data file must export an array of job objects.');
      process.exit(1);
    }

    await connectDB();
    console.log('\n========================================');
    console.log('  Belimuno Bulk Job Posting Script');
    console.log('========================================\n');

    // Find admin_outsource user
    const adminOutsource = await User.findOne({ role: 'admin_outsource' });
    if (!adminOutsource) {
      console.error('ERROR: No admin_outsource user found in the database.');
      console.error('Please ensure an admin_outsource user exists before running this script.');
      process.exit(1);
    }
    console.log(`Found admin_outsource user: ${adminOutsource.name} (${adminOutsource.email})\n`);

    // Find a default region (Addis Ababa)
    const Region = require('./models/Region');
    let defaultRegion = await Region.findOne({ name: 'Addis Ababa' });
    if (!defaultRegion) {
      defaultRegion = await Region.findOne();
    }

    const deadline = deadline30();
    const longDeadline = deadline60();

    let successCount = 0;
    let failCount = 0;

    console.log(`Posting ${allJobs.length} jobs...\n`);

    for (let i = 0; i < allJobs.length; i++) {
      const jobData = allJobs[i];
      try {
        // Validate required fields
        if (!jobData.title || !jobData.description || !jobData.category || !jobData.budget || !jobData.company) {
          throw new Error('Missing required fields: title, description, category, budget, company');
        }

        // Determine deadline based on priority
        const jobDeadline = jobData.priority === 'urgent' ? deadline : longDeadline;

        const job = await Job.create({
          title: jobData.title,
          description: jobData.description,
          category: jobData.category,
          budget: jobData.budget,
          budgetType: jobData.budgetType || 'fixed',
          currency: jobData.currency || 'ETB',
          company: jobData.company,
          industry: jobData.industry || '',
          location: jobData.location || 'Ethiopia',
          deadline: jobDeadline,
          priority: jobData.priority || 'medium',
          status: 'posted',
          admin: adminOutsource._id,
          region: defaultRegion ? defaultRegion._id : undefined,
          requiredSkills: jobData.requiredSkills || [],
          experienceLevel: jobData.experienceLevel || 'intermediate',
          tags: jobData.tags || [],
          isPublic: true,
        });

        successCount++;
        console.log(`  [${i + 1}/${allJobs.length}] ✅ ${job.title}`);
      } catch (err) {
        failCount++;
        console.log(`  [${i + 1}/${allJobs.length}] ❌ ${jobData.title || 'Unknown'} – ${err.message}`);
      }
    }

    console.log('\n========================================');
    console.log(`  RESULTS`);
    console.log(`  Total jobs: ${allJobs.length}`);
    console.log(`  Successfully posted: ${successCount}`);
    console.log(`  Failed: ${failCount}`);
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('Database disconnected. Done!');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Get job data file path from command line arguments
const jobDataPath = process.argv[2];
postAllJobs(jobDataPath);
