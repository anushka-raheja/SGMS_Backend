const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/profileController');

// Get user profile
router.get('/', auth, getProfile);

// Update user profile
router.put('/', auth, updateProfile);

module.exports = router; 