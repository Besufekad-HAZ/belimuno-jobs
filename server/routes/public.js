const express = require("express");
const {
  getPublicTeamMembers,
  getNews,
  getNewsArticle,
  getClients,
  getTrustedCompanies,
  getServices,
  getService,
  getOrgStructureDocument,
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
   router.get("/org-structure", getOrgStructureDocument);
router.get("/org-structure", getOrgStructureDocument);

// Service management
router.get("/services", getServices);
router.get("/services/:id", getService);

module.exports = router;
