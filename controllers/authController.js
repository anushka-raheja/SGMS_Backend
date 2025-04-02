const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const signIn = async (req, res) => {
  try {
    console.log('Sign-in attempt received:', { email: req.body.email });
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Sign-in successful for user:', email);
    res.status(200).json({
      token,
      userId: user._id,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  signIn
};