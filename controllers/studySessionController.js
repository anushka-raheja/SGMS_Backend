const StudySession = require('../models/StudySession');
const Group = require('../models/Group');

// Create a new study session
exports.createStudySession = async (req, res) => {
  try {
    const { title, description, date, duration, groupId } = req.body;

    // Validate required fields
    if (!title || !date || !duration || !groupId) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'You must be a group member to create study sessions' });
    }

    // Create study session
    const studySession = new StudySession({
      title,
      description,
      date,
      duration,
      group: groupId,
      createdBy: req.user._id,
      attendees: [req.user._id] // Creator is automatically added as an attendee
    });

    await studySession.save();

    // Populate creator and attendees
    await studySession.populate('createdBy', 'name');
    await studySession.populate('attendees', 'name');

    res.status(201).json(studySession);
  } catch (error) {
    console.error('Error creating study session:', error);
    res.status(500).json({ error: 'Failed to create study session' });
  }
};