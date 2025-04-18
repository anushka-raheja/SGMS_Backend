// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('Authorization denied');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.userId }; // Changed to match the token structure
    next();
  } catch (err) {
    res.status(401).json({ 
      error: 'Please authenticate',
      message: err.message 
    });
  }
};
module.exports = auth;

