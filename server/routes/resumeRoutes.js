const express = require('express');
const router = express.Router();
const {
  createResume,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume,
  analyzeSandbox
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

// Protect all resume routes
router.use(protect);

router.post('/sandbox-analyze', analyzeSandbox);

router.route('/')
  .post(createResume)
  .get(getResumes);

router.route('/:id')
  .get(getResumeById)
  .put(updateResume)
  .delete(deleteResume);

module.exports = router;
