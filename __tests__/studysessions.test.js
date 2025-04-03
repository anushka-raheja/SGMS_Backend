const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/user');
const StudySession = require('../models/StudySession');
const Group = require('../models/group');

// Increase Jest timeout to 30 seconds for all tests in this file
jest.setTimeout(30000);

// Set a default MongoDB URI for testing if not provided in environment
const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/sgms_test';

describe('Study Session Routes', () => {
  let testUser;
  let secondUser;
  let testGroup;
  let testSession;
  let authToken;
  let secondUserToken;

  beforeAll(async () => {
    // Disconnect if already connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Connect to test database with robust options for CI environments
    await mongoose.connect(MONGODB_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 25000,
      connectTimeoutMS: 25000
    });
    
    // Set JWT secret for tests
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
    
    // Create test users
    testUser = await User.create({
      name: 'Study Test User',
      email: 'studytest@example.com',
      password: 'password123',
      department: 'Computer Science & Engineering'
    });

    secondUser = await User.create({
      name: 'Study Test User 2',
      email: 'studytest2@example.com',
      password: 'password123',
      department: 'Computer Science & Engineering'
    });

    // Create test group
    testGroup = await Group.create({
      name: 'Test Study Group',
      subject: 'Test Subject',
      members: [testUser._id, secondUser._id],
      admins: [testUser._id]
    });

    // Create test study session
    testSession = await StudySession.create({
      title: 'Test Study Session',
      description: 'A session for learning about test-driven development',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // One week from now
      duration: 120, // 2 hours
      group: testGroup._id,
      createdBy: testUser._id,
      status: 'scheduled'
    });

    // Generate auth tokens
    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    secondUserToken = jwt.sign(
      { userId: secondUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }, 30000); // Set timeout for beforeAll

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Group.deleteMany({});
    await StudySession.deleteMany({});
    await mongoose.connection.close();
  }, 10000); // Set timeout for afterAll

  describe('GET /api/study-sessions', () => {
    it('should fetch all study sessions for the user', async () => {
      const response = await request(app)
        .get('/api/study-sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('title', 'Test Study Session');
    });
  });

  describe('GET /api/study-sessions/group/:groupId', () => {
    it('should fetch study sessions for a specific group', async () => {
      const response = await request(app)
        .get(`/api/study-sessions/group/${testGroup._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('title', 'Test Study Session');
    });

    it('should return 404 if group not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/study-sessions/group/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 if user is not a group member', async () => {
      // Create a new user who is not part of the group
      const nonMemberUser = await User.create({
        name: 'Non Member',
        email: 'nonmember.group@example.com',
        password: 'password123'
      });
      
      const nonMemberToken = jwt.sign(
        { userId: nonMemberUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get(`/api/study-sessions/group/${testGroup._id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/study-sessions', () => {
    it('should create a new study session', async () => {
      const newSession = {
        title: 'New Test Session',
        description: 'Learning about API testing',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Two weeks from now
        duration: 90, // 1.5 hours
        groupId: testGroup._id
      };

      const response = await request(app)
        .post('/api/study-sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newSession);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('title', 'New Test Session');
      expect(response.body).toHaveProperty('createdBy');
    });

    it('should validate required fields', async () => {
      const invalidSession = {
        // Missing required fields
        description: 'Incomplete session data'
      };

      const response = await request(app)
        .post('/api/study-sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSession);

      expect(response.status).toBe(400);
    });

    it('should return 404 if group not found', async () => {
      const fakeGroupId = new mongoose.Types.ObjectId();
      const newSession = {
        title: 'New Test Session',
        description: 'Learning about API testing',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        duration: 90,
        groupId: fakeGroupId
      };

      const response = await request(app)
        .post('/api/study-sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newSession);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/study-sessions/:sessionId/status', () => {
    it('should update a study session status', async () => {
      const response = await request(app)
        .patch(`/api/study-sessions/${testSession._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'completed' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'completed');
    });

    it('should validate status values', async () => {
      const response = await request(app)
        .patch(`/api/study-sessions/${testSession._id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
    });

    it('should return 403 if user is not the creator or admin', async () => {
      // Create a new group where second user is not an admin
      const newGroup = await Group.create({
        name: 'Another Test Group',
        subject: 'Another Subject',
        members: [testUser._id, secondUser._id],
        admins: [testUser._id]
      });

      // Create a session in that group
      const newSession = await StudySession.create({
        title: 'Admin Test Session',
        description: 'Testing admin permissions',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        duration: 60,
        group: newGroup._id,
        createdBy: testUser._id,
        status: 'scheduled'
      });

      const response = await request(app)
        .patch(`/api/study-sessions/${newSession._id}/status`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ status: 'cancelled' });

      expect(response.status).toBe(403);
    });

    it('should return 404 if session not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .patch(`/api/study-sessions/${fakeId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'cancelled' });

      expect(response.status).toBe(404);
    });
  });
}); 