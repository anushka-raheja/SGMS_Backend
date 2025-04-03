const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/user');

// Increase timeout for slower operations
jest.setTimeout(30000);

describe('Profile Routes', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    try {
      // Disconnect if already connected
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      // Connect to test database
      await mongoose.connect(global.__MONGO_URI__ || process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      // Create a test user
      testUser = await User.create({
        name: 'Test User',
        email: 'test.profile@example.com',
        password: 'password123',
        department: 'Computer Science'
      });

      // Generate auth token
      authToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  }, 30000);

  afterAll(async () => {
    try {
      // Clean up test data
      await User.deleteMany({});
      await mongoose.connection.close();
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }, 10000);

  // Basic profile retrieval test
  describe('GET /api/profile', () => {
    it('should get user profile when authenticated', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Test User');
      expect(response.body).toHaveProperty('email', 'test.profile@example.com');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/profile');

      expect(response.status).toBe(401);
    });

    it('should return 404 when user not found', async () => {
      // Create token with non-existent user ID
      const fakeToken = jwt.sign(
        { userId: new mongoose.Types.ObjectId() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(response.status).toBe(404);
    });
  });

  // Basic profile update test
  describe('PUT /api/profile', () => {
    it('should update user profile when authenticated', async () => {
      const updateData = {
        name: 'Updated Name',
        department: 'Physics'
      };

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Name');
      expect(response.body).toHaveProperty('department', 'Physics');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .put('/api/profile')
        .send({ name: 'Test Update' });

      expect(response.status).toBe(401);
    });

    it('should return 404 when user not found', async () => {
      const fakeToken = jwt.sign(
        { userId: new mongoose.Types.ObjectId() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send({ name: 'Test Update' });

      expect(response.status).toBe(404);
    });

    it('should handle invalid update data gracefully', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ invalidField: 'test' });

      expect(response.status).toBe(200);
      // Should maintain existing data
      expect(response.body).toHaveProperty('name', 'Updated Name');
      expect(response.body).toHaveProperty('department', 'Physics');
    });
  });
}); 