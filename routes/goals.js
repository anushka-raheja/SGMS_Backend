const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const StudyGoal = require('../models/studygoal');

// Create a new goal
router.post('/', auth, async (req, res) => {
  try {
    const goal = new StudyGoal({
      userId: req.user._id,
      title: req.body.title,
      description: req.body.description,
      deadline: req.body.deadline
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Get all goals for the current user
router.get('/', auth, async (req, res) => {
  try {
    const goals = await StudyGoal.find({ userId: req.user._id });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Update goal progress or completion status
router.put('/:id', auth, async (req, res) => {
  try {
    const updatedGoal = await StudyGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!updatedGoal) return res.status(404).json({ error: 'Goal not found' });
    res.json(updatedGoal);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

module.exports = router;
