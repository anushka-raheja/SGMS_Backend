const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const Group = require('../models/Group');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Group.deleteMany({});
  await User.deleteMany({});
});

describe('Groups API', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/groups', () => {
    test('should create a new group', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'Test Description',
        subject: 'Mathematics',
        isPublic: true
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(groupData.name);
      expect(response.body.description).toBe(groupData.description);
      expect(response.body.subject).toBe(groupData.subject);
      expect(response.body.isPublic).toBe(groupData.isPublic);
      expect(response.body.members).toContainEqual(testUser._id.toString());
      expect(response.body.admins).toContainEqual(testUser._id.toString());
    });

    test('should not create group without authentication', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'Test Description',
        subject: 'Mathematics',
        isPublic: true
      };

      const response = await request(app)
        .post('/api/groups')
        .send(groupData);

      expect(response.status).toBe(401);
    });

    test('should not create group with missing required fields', async () => {
      const groupData = {
        description: 'Test Description',
        subject: 'Mathematics',
        isPublic: true
      };

      const response = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${authToken}`)
        .send(groupData);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/groups/list', () => {
    test('should get all public groups', async () => {
      // Create some test groups
      await Group.create([
        {
          name: 'Public Group 1',
          description: 'Description 1',
          subject: 'Mathematics',
          isPublic: true,
          members: [testUser._id],
          admins: [testUser._id]
        },
        {
          name: 'Public Group 2',
          description: 'Description 2',
          subject: 'Physics',
          isPublic: true,
          members: [testUser._id],
          admins: [testUser._id]
        },
        {
          name: 'Private Group',
          description: 'Description 3',
          subject: 'Chemistry',
          isPublic: false,
          members: [testUser._id],
          admins: [testUser._id]
        }
      ]);

      const response = await request(app)
        .get('/api/groups/list')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2); // Only public groups
      expect(response.body.every(group => group.isPublic)).toBeTruthy();
    });

    test('should not get groups without authentication', async () => {
      const response = await request(app)
        .get('/api/groups/list');

      expect(response.status).toBe(401);
    });
  });
}); 