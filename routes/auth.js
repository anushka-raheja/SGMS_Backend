const express = require('express');
const router = express.Router();
const { signUp, signIn } = require('../controllers/userController');

// POST request for sign-up
router.post('/signup', signUp);

// POST request for sign-in
router.post('/signin', signIn);

module.exports = router;
