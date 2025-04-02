require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/user');
const Group = require('../models/group');
const jwt = require('jsonwebtoken');

let mongoServer;
let testUser;
let authToken;

beforeAll(async () => {
  // Create MongoDB memory server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Disconnect from any existing connections
  await mongoose.disconnect();
  
  // Connect to MongoDB
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  // Set up test environment variables
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.PORT = '5004'; // Set a different port for tests

  // Create a test user
  testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });

  // Generate auth token
  authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
});

afterAll(async () => {
  // Clean up
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear the database before each test
  await Group.deleteMany({});
});

describe('Group API - Creation', () => {
  // ... existing creation tests ...
});

describe('Group API - Fetching', () => {
  let testGroup;

  beforeEach(async () => {
    // Create a test group
    testGroup = await Group.create({
      name: 'Test Group',
      subject: 'Computer Science',
      department: 'Engineering',
      members: [testUser._id],
      admins: [testUser._id]
    });
  });

  test('should fetch user\'s groups', async () => {
    // Create another group for the same user
    await Group.create({
      name: 'Another Group',
      subject: 'Mathematics',
      department: 'Science',
      members: [testUser._id],
      admins: [testUser._id]
    });

    const response = await request(app)
      .get('/api/groups/my-groups')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    // Check if the user is a member of both groups
    expect(response.body[0].members[0]._id).toBe(testUser._id.toString());
    expect(response.body[1].members[0]._id).toBe(testUser._id.toString());
    // Check if member names are populated
    expect(response.body[0].members[0].name).toBe('Test User');
    expect(response.body[1].members[0].name).toBe('Test User');
  });

  test('should not fetch group without authentication', async () => {
    const response = await request(app)
      .get(`/api/groups/${testGroup._id}`);

    expect(response.status).toBe(401);
  });
});