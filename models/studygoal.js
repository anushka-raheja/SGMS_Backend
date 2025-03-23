const mongoose = require('mongoose');

const studyGoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  deadline: { type: Date, required: true },
  completed: { type: Boolean, default: false },
  progress: { type: Number, default: 0 } // Progress percentage
}, { timestamps: true });

module.exports = mongoose.model('StudyGoal', studyGoalSchema);