const express = require("express");
const {
  getDashboard,
  getJobs,
  getJob,
  updateJobStatus,
  getApplications,
  withdrawApplication,
  updateProfile,
  getEarnings,
  getJobMessages,
  sendJobMessage,
  declineAssignedJob,
  acceptAssignedJob,
  saveJob,
  unsaveJob,
  getSavedJobs,
  reviewClient,
  createDispute,
  getDisputes,
  getDispute,
  updateDispute,
} = require("../controllers/workerController");
const { protect } = require("../middleware/auth");
const { requireWorker } = require("../middleware/roleCheck");

const router = express.Router();

// All worker routes require authentication and worker role
router.use(protect, requireWorker);

// Dashboard and overview
router.get("/dashboard", getDashboard);

// Job management
router.get("/jobs", getJobs);
router.get("/jobs/:id", getJob);
router.put("/jobs/:id/status", updateJobStatus);
router.put("/jobs/:id/decline", declineAssignedJob);
router.put("/jobs/:id/accept", acceptAssignedJob);
router.get("/jobs/:id/messages", getJobMessages);
router.post("/jobs/:id/messages", sendJobMessage);

// Saved jobs
router.get("/saved-jobs", getSavedJobs);
router.post("/saved-jobs/:jobId", saveJob);
router.delete("/saved-jobs/:jobId", unsaveJob);

// Reviews
router.post("/jobs/:id/review", reviewClient);

// Application management
router.get("/applications", getApplications);
router.delete("/applications/:id", withdrawApplication);

// Profile management
router.put("/profile", updateProfile);

// Earnings and payments
router.get("/earnings", getEarnings);

// Disputes
router.post("/disputes", createDispute);
router.get("/disputes", getDisputes);
router.get("/disputes/:id", getDispute);
router.put("/disputes/:id", updateDispute);

module.exports = router;
