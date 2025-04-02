const express = require('express');
const router = express.Router();
const { signUp } = require('../controllers/userController');
const authController = require('../controllers/authController');

// POST request for sign-up
router.post('/signup', signUp);

// POST request for sign-in
router.post('/signin', authController.signIn);

module.exports = router;
