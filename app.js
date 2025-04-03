require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Connection failed:', err));

const app = express();
const allowedOrigins = [
  'http://localhost:3000', 
  'https://sgms-frontend.onrender.com' 
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true, 
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/study-sessions', require('./routes/studySessions'));

if (require.main === module) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;



