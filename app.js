require('dotenv').config();

console.log('ENV Variables:', {
    MONGO_URI: process.env.MONGO_URI,
    PORT: process.env.PORT
  });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
console.log('MONGO_URI:', process.env.MONGO_URI); // Should print your URI

// Database connection (updated)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection failed:', err));

const app = express();


app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true
  }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
// server.js (Critical Fix)
const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter); // Add this line

// server.js
const groupsRouter = require('./routes/groups');
app.use('/api/groups', groupsRouter);

const documentsRouter = require('./routes/documents');
app.use('/api/documents', documentsRouter);
//tells express application to use groupsRouter for any request that starts with /api/groups
const goalsRouter = require('./routes/goals');
app.use('/api/goals', goalsRouter);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



