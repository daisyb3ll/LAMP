const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Make sure server.js exports the app

describe('POST /users/signup', () => {
  // ✅ Connect to test DB before tests
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
  });

  // ✅ Clear users between tests to avoid duplicate key errors
  afterEach(async () => {
    await mongoose.connection.db.collection('users').deleteMany({});
  });

  // ✅ Close DB after tests are done
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app).post('/users/signup').send({
      username: '',
      email: '',
      password: '',
      password_confirm: '',
    });

    console.log('STATUS:', res.statusCode);
    console.log('BODY:', res.body);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('All fields are required');
  });
});
