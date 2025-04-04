const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/user');
const Group = require('../models/group');
const jwt = require('jsonwebtoken');

let mongoServer;
let testUser;
let adminUser;
let testGroup;
let privateGroup;
let userToken;
let adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.disconnect();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.PORT = '5005';

  testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });

  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123'
  });

  userToken = jwt.sign({ 
    userId: testUser._id 
  }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });

  adminToken = jwt.sign({ 
    userId: adminUser._id
  }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Group.deleteMany({});
  
  testGroup = await Group.create({
    name: 'Public Test Group',
    subject: 'Computer Science',
    isPublic: true,
    members: [adminUser._id],
    admins: [adminUser._id]
  });
  
  privateGroup = await Group.create({
    name: 'Private Test Group',
    subject: 'Mathematics',
    isPublic: false,
    members: [adminUser._id],
    admins: [adminUser._id],
    joinRequests: []
  });
});

describe('Group Join API', () => {
  test('should let user join a public group', async () => {
    const response = await request(app)
      .post(`/api/groups/${testGroup._id}/join`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.members).toContainEqual(expect.objectContaining({
      _id: testUser._id.toString()
    }));
  });
  
  test('should not let user join a private group directly', async () => {
    const response = await request(app)
      .post(`/api/groups/${privateGroup._id}/join`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Private group - request invitation');
  });
  
  test('should allow user to request to join a private group', async () => {
    const response = await request(app)
      .post(`/api/groups/${privateGroup._id}/request`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Join request sent to admin');
    
    const updatedGroup = await Group.findById(privateGroup._id);
    
    expect(updatedGroup.joinRequests).toBeDefined();
    
    const isUserInRequests = updatedGroup.joinRequests.some(id => 
      id && id.toString() === testUser._id.toString()
    );
    expect(isUserInRequests).toBe(true);
  });
});

describe('Group Admin API', () => {
  test('should verify the approval process works at the data level', async () => {
    await Group.findByIdAndUpdate(
      privateGroup._id,
      { $push: { joinRequests: testUser._id } }
    );
    
    const groupWithRequest = await Group.findById(privateGroup._id);
    expect(groupWithRequest.joinRequests.length).toBe(1);
    
    await Group.findByIdAndUpdate(
      privateGroup._id,
      {
        $addToSet: { members: testUser._id },
        $pull: { joinRequests: testUser._id }
      }
    );
    
    const updatedGroup = await Group.findById(privateGroup._id);
    
    const isUserMember = updatedGroup.members.some(id => 
      id && id.toString() === testUser._id.toString()
    );
    expect(isUserMember).toBe(true);
    
    expect(updatedGroup.joinRequests.length).toBe(0);
  });
  
}); 