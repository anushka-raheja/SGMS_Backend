const mongoose = require('mongoose');

beforeAll(async () => {
  // Set up any global test configuration
});

afterAll(async () => {
  // Cleanup after all tests
  await mongoose.disconnect();
}); 