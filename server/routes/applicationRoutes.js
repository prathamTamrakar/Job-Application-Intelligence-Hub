const express = require('express');
const router = express.Router();
const {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  markFollowedUp,
  analyzeMatch,
  getMatchAnalysis
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

// Protect all application routes
router.use(protect);

router.route('/')
  .post(createApplication)
  .get(getApplications);

router.route('/:id')
  .get(getApplicationById)
  .put(updateApplication)
  .delete(deleteApplication);

router.put('/:id/followup', markFollowedUp);

router.route('/:id/analyze-match')
  .get(getMatchAnalysis)
  .post(analyzeMatch);

module.exports = router;
