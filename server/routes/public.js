const express = require("express");
const { getPublicTeamMembers } = require("../controllers/publicController");

const router = express.Router();

// Public team listing
router.get("/team", getPublicTeamMembers);

module.exports = router;
