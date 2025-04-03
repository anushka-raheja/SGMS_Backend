const StudySession = require('../models/StudySession');
const Group = require('../models/group');

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
      createdBy: req.user._id
    });

    await studySession.save();

    // Populate creator
    await studySession.populate('createdBy', 'name');

    res.status(201).json(studySession);
  } catch (error) {
    console.error('Error creating study session:', error);
    res.status(500).json({ error: 'Failed to create study session' });
  }
};

// Get all study sessions for a specific group
exports.getGroupStudySessions = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check if group exists and user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'You must be a group member to view study sessions' });
    }

    // Find study sessions for this group
    const studySessions = await StudySession.find({ group: groupId })
      .populate('createdBy', 'name')
      .sort({ date: 1 }); // Sort by date ascending (upcoming first)

    res.json(studySessions);
  } catch (error) {
    console.error('Error fetching group study sessions:', error);
    res.status(500).json({ error: 'Failed to fetch study sessions' });
  }
};

// Get all study sessions for the current user (from all groups)
exports.getUserStudySessions = async (req, res) => {
  try {
    // Find all groups the user is a member of
    const groups = await Group.find({ members: req.user._id });
    const groupIds = groups.map(group => group._id);
    
    // Find study sessions from those groups
    const studySessions = await StudySession.find({ group: { $in: groupIds } })
      .populate('createdBy', 'name')
      .populate('group', 'name')
      .sort({ date: 1 });

    res.json(studySessions);
  } catch (error) {
    console.error('Error fetching user study sessions:', error);
    res.status(500).json({ error: 'Failed to fetch study sessions' });
  }
};

// Update study session status
exports.updateStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;
    
    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const session = await StudySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Study session not found' });
    }

    // Only creator or group admin can update status
    const group = await Group.findById(session.group);
    const isCreator = session.createdBy.toString() === req.user._id.toString();
    const isAdmin = group.admins.includes(req.user._id);
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Only session creator or group admin can update status' });
    }

    session.status = status;
    await session.save();
    
    res.json(session);
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: 'Failed to update session status' });
  }
};