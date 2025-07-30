const express = require('express');
const {
  updateJobStatus,
  getWorkerJobs
} = require('../controllers/workerController');
const { protect, roleCheck } = require('../middleware/auth');

const router = express.Router();

router.use(protect, roleCheck('worker'));

router.put('/jobs/:id/status', updateJobStatus);
router.get('/jobs', getWorkerJobs);

module.exports = router;
