// File: backend/routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');

// @route    GET api/users/me
// @desc     Get logged-in user's profile
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    // Get user without password field
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    console.log('Authenticated user ID:', req.user._id); 
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
