const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/user');
const Group = require('./models/group');
const StudyGoal = require('./models/studygoal');
const Document = require('./models/document');
const StudySession = require('./models/StudySession');

async function clearDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear all collections
    await Promise.all([
    //   User.deleteMany({}),
    //   Group.deleteMany({}),
    //   StudyGoal.deleteMany({}),
    //   Document.deleteMany({}),
      StudySession.deleteMany({})
    ]);

    console.log('All collections have been cleared successfully');

    // Clear uploaded files if any exist
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, 'uploads');
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep') { // Preserve .gitkeep if it exists
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      }
      console.log('Uploads directory has been cleared');
    }

    console.log('Database reset complete!');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    process.exit(0);
  }
}

clearDatabase(); 