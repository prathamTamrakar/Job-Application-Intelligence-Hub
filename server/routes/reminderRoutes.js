const express = require('express');
const router = express.Router();
const { triggerManualCheck } = require('../jobs/reminderCron');
const { protect } = require('../middleware/authMiddleware');

// Mount protected manual check trigger
router.post('/trigger', protect, triggerManualCheck);

module.exports = router;
