const express = require("express");
const {
  getPublicTeamMembers,
  getNews,
  getNewsArticle,
} = require("../controllers/publicController");

const router = express.Router();

// Public team listing
router.get("/team", getPublicTeamMembers);

// News management
router.get("/news", getNews);
router.get("/news/:id", getNewsArticle);

module.exports = router;
