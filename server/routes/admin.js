const express = require("express");
const {
  getDashboard,
  getUsers,
  getUser,
  updateUser,
  verifyWorker,
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getPerformanceMetrics,
  getPayments,
  handlePaymentDispute,
  markPaymentPaid,
  deactivateUser,
  activateUser,
  getReviews,
  moderateReview,
  getDisputes,
  getDispute,
  updateDispute,
  createDispute,
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  uploadTeamMemberPhoto,
} = require("../controllers/adminController");
const { protect } = require("../middleware/auth");
const {
  authorize,
  requireSuperAdmin,
  requireAnyAdmin,
} = require("../middleware/roleCheck");

const router = express.Router();

// All admin routes require authentication and any admin role by default
router.use(protect, requireAnyAdmin);

// Dashboard and overview
router.get("/dashboard", getDashboard);
router.get("/performance", getPerformanceMetrics);

// User management
router.get("/users", getUsers); // HR admins need access to view workers
router.get("/users/:id", getUser); // HR admins need access to view worker details
router.put("/users/:id", requireSuperAdmin, updateUser); // Only super admin can edit user data
router.put("/users/:id/deactivate", deactivateUser); // HR admins can deactivate workers
router.put("/users/:id/activate", activateUser); // HR admins can activate workers

// Worker verification (any admin)
router.put("/verify-worker/:id", verifyWorker);

// Job management (any admin)
router.get("/jobs", getJobs);
router.get("/jobs/:id", getJob);
router.post("/jobs", createJob);
router.put("/jobs/:id", updateJob);
router.delete("/jobs/:id", deleteJob);

// Payment management (any admin can view/mark paid; disputes handled by super admin)
router.get("/payments", getPayments);
router.put("/payments/:id/dispute", requireSuperAdmin, handlePaymentDispute);
router.put("/payments/:id/mark-paid", markPaymentPaid);

// Reviews moderation
router.get("/reviews", getReviews);
router.put("/reviews/:id", moderateReview);

// Disputes management
router.get("/disputes", getDisputes);
router.get("/disputes/:id", getDispute);
router.post("/disputes", createDispute);
router.put("/disputes/:id", updateDispute);

router.post(
  "/team/upload-photo",
  authorize("super_admin", "admin_hr"),
  uploadTeamMemberPhoto,
);

// Public team route (no auth) for the About page and public site
const { getPublicTeamMembers } = require("../controllers/publicController");
router.get("/public/team", getPublicTeamMembers);

// Team management (HR & Super Admin)
router
  .route("/team")
  .get(authorize("super_admin", "admin_hr"), getTeamMembers)
  .post(authorize("super_admin", "admin_hr"), createTeamMember);

router
  .route("/team/:id")
  .put(authorize("super_admin", "admin_hr"), updateTeamMember)
  .delete(authorize("super_admin", "admin_hr"), deleteTeamMember);

module.exports = router;
