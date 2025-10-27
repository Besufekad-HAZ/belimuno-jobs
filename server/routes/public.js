const express = require("express");
const {
  getPublicTeamMembers,
  getNews,
  getNewsArticle,
  getClients,
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

// Service management
router.get("/services", getServices);
router.get("/services/:id", getService);

module.exports = router;
