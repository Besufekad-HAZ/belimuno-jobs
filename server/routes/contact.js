const express = require('express');
const router = express.Router();
const { submit, list, markRead } = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

// Public submit endpoint
router.post('/', submit);

// Admin views
router.get('/', protect, authorize('super_admin'), list);
router.put('/:id/read', protect, authorize('super_admin'), markRead);

module.exports = router;


