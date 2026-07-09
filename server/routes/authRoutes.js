const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateSettings } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/settings', protect, updateSettings);

module.exports = router;
