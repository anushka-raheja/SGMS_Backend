const express = require('express');
const router = express.Router();
const studySessionController = require('../controllers/studySessionController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create a new study session
router.post('/', studySessionController.createStudySession);

// Get all study sessions for a user (from all groups)
router.get('/', studySessionController.getUserStudySessions);

// Get all study sessions for a group
router.get('/group/:groupId', studySessionController.getGroupStudySessions);

// Update study session attendance
router.patch('/:sessionId/attendance', studySessionController.updateAttendance);

// Update study session status
router.patch('/:sessionId/status', studySessionController.updateStatus);

module.exports = router;