const User = require('../models/user');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    console.log('Fetching profile for user ID:', req.user._id);
    const user = await User.findById(req.user._id).select('-password');
    console.log('Found user:', user);
    
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    console.log('Updating profile for user ID:', req.user._id);
    console.log('Update data:', req.body);
    
    const { name, courses, studyPreferences } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('User not found for update');
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (courses) user.courses = courses;
    if (studyPreferences) {
      user.studyPreferences = {
        ...user.studyPreferences,
        ...studyPreferences
      };
    }

    await user.save();
    console.log('Profile updated successfully');
    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 