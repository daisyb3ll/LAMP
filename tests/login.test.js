jest.setTimeout(30000);
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const { app, setupApp } = require('../app');
const mongoose = require('mongoose');
const User = require('../models/User');

beforeAll(async () => {
  await setupApp();
});

// Optional: clear DB before each test (useful for isolation)
beforeEach(async () => {
  await User.deleteMany({});
});

// Optional: disconnect DB after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('POST /users/login', () => {
  test('should render error for unknown username', async () => {
    const response = await request(app)
      .post('/users/login')
      .send({ username: 'ghostuser', password: 'anypass' });

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Username not found');
  });

  test('should render error for incorrect password', async () => {
    // create a user
    await request(app).post('/users/signup').send({
      username: 'testlogin',
      email: 'testlogin@example.com',
      password: 'correctpass',
      password_confirm: 'correctpass',
    });

    const response = await request(app)
      .post('/users/login')
      .send({ username: 'testlogin', password: 'wrongpass' });

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Incorrect password');
  });

  test('should redirect to /explore on successful login', async () => {
    await request(app).post('/users/signup').send({
      username: 'gooduser',
      email: 'gooduser@example.com',
      password: 'goodpassword',
      password_confirm: 'goodpassword',
    });

    const response = await request(app)
      .post('/users/login')
      .send({ username: 'gooduser', password: 'goodpassword' });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/explore');
  });
});

describe('GET /users/logout', () => {
  test('should destroy session and redirect to login', async () => {
    const response = await request(app).get('/users/logout');
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/users/login');
  });
});
