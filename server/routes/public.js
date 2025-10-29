const express = require("express");
const {
  getPublicTeamMembers,
  getNews,
  getNewsArticle,
  getClients,
  getTrustedCompanies,
  getServices,
  getService,
} = require("../controllers/publicController");

const router = express.Router();

// Public team listing
router.get("/team", getPublicTeamMembers);

// News management
router.get("/news", getNews);
router.get("/news/:id", getNewsArticle);

// Client management
router.get("/clients", getClients);
router.get("/trusted-companies", getTrustedCompanies);

// Service management
router.get("/services", getServices);
router.get("/services/:id", getService);

module.exports = router;
