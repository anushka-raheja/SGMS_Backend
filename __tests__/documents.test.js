const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const app = require('../app');
const Document = require('../models/document');
const Group = require('../models/group');
const User = require('../models/user');

jest.setTimeout(30000);

const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/sgms_test';

describe('Document Routes', () => {
  let testUser;
  let testGroup;
  let authToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(MONGODB_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000, 
      socketTimeoutMS: 25000, 
      connectTimeoutMS: 25000 
    });
    
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
    
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    testGroup = await Group.create({
      name: 'Test Group',
      subject: 'Test Subject',
      members: [testUser._id]
    });

    testDocument = await Document.create({
      groupId: testGroup._id,
      uploaderId: testUser._id,
      fileName: 'test.pdf',
      filePath: path.join(__dirname, '../uploads/test.pdf'),
      fileType: 'application/pdf',
      fileSize: 1024
    });

    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }, 30000); 

  afterAll(async () => {
    await User.deleteMany({});
    await Group.deleteMany({});
    await Document.deleteMany({});
    await mongoose.connection.close();
  }, 10000);

  describe('POST /api/documents/:groupId/upload', () => {
    it('should upload a document successfully', async () => {
      const testFilePath = path.join(__dirname, '../uploads/test.pdf');
      
      fs.writeFileSync(testFilePath, 'Test content');

      const response = await request(app)
        .post(`/api/documents/${testGroup._id}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Document uploaded successfully');

      const document = await Document.findOne({ fileName: 'test.pdf' });
      expect(document).toBeTruthy();
      expect(document.groupId.toString()).toBe(testGroup._id.toString());
      expect(document.uploaderId.toString()).toBe(testUser._id.toString());
    });

    it('should return 404 if group not found', async () => {
      const fakeGroupId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/documents/${fakeGroupId}/upload`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', path.join(__dirname, '../uploads/test.pdf'));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Group not found');
    });

    it('should return 403 if user is not a group member', async () => {
      const nonMemberUser = await User.create({
        name: 'Non Member Post',
        email: 'nonmember.post@example.com',
        password: 'password123'
      });
      
      const nonMemberToken = jwt.sign(
        { userId: nonMemberUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post(`/api/documents/${testGroup._id}/upload`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .attach('file', path.join(__dirname, '../uploads/test.pdf'));

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('You must be a member of this group to upload documents');
    });
  });

  describe('GET /api/documents/:groupId/documents', () => {
    it('should fetch documents for a group successfully', async () => {
      const response = await request(app)
        .get(`/api/documents/${testGroup._id}/documents`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('fileName', 'test.pdf');
      expect(response.body[0]).toHaveProperty('uploaderId');
    });

    it('should return 404 if group not found', async () => {
      const fakeGroupId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/documents/${fakeGroupId}/documents`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Group not found');
    });

    it('should return 403 if user is not a group member', async () => {
      const nonMemberUser = await User.create({
        name: 'Non Member Get',
        email: 'nonmember.get@example.com',
        password: 'password123'
      });
      
      const nonMemberToken = jwt.sign(
        { userId: nonMemberUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get(`/api/documents/${testGroup._id}/documents`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('You must be a member of this group to view documents');
    });
  });
}); 