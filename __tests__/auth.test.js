require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const app = require('../app');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.disconnect();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.PORT = '5002'; 
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth API - Signup', () => {
  test('should create a new user with valid data', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('User created successfully');

    const user = await User.findOne({ email: userData.email });
    expect(user).toBeTruthy();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
  });

  test('should not create user with existing email', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    await User.create(userData);

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('User already exists');
  });

  test('should not create user with missing required fields', async () => {
    const userData = {
      name: 'Test User',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('All fields are required');
  });
});

describe('Auth API - Signin', () => {
  beforeEach(async () => {
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'  
    });
  });

  test('should sign in with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('userId');
    expect(response.body.message).toBe('Login successful');

    const token = response.body.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.userId).toBeDefined();
  });

  test('should not sign in with invalid email', async () => {
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'wrong@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  test('should not sign in with invalid password', async () => {
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  test('should not sign in with missing fields', async () => {
    const response = await request(app)
      .post('/api/auth/signin')
      .send({
        email: 'test@example.com'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Please provide email and password');
  });
});