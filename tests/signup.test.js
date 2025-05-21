process.env.NODE_ENV = 'test'; // ✅ MUST be before requiring app

require('dotenv').config({ path: '.env.test' }); // ✅ load test env vars

const mongoose = require('mongoose');
const request = require('supertest');
const { app, setupApp } = require('../app');

beforeAll(async () => {
  await setupApp(); // sets up app and connects DB

  if (mongoose.connection.name !== 'lamp_test') {
    throw new Error('❌ TEST ABORTED: Not using test database!');
  }
});

afterEach(async () => {
  await mongoose.connection.collection('users').deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('POST /users/signup', () => {
  it('should return 400 if required fields are missing', async () => {
    const res = await request(app).post('/users/signup').send({
      username: '',
      email: '',
      password: '',
    });

    console.log('STATUS:', res.statusCode);
    console.log('BODY:', res.body);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('All fields are required');
  });

  it('should return 400 if username or email already exists', async () => {
    const firstRes = await request(app).post('/users/signup').send({
      username: 'duplicateUser',
      email: 'duplicate@example.com',
      password: 'password123',
      password_confirm: 'password123',
    });

    expect(firstRes.statusCode).toBe(302); // redirect to login

    const duplicateRes = await request(app).post('/users/signup').send({
      username: 'duplicateUser',
      email: 'duplicate@example.com',
      password: 'password123',
      password_confirm: 'password123',
    });

    expect(duplicateRes.statusCode).toBe(400); // duplicate
  });

  it('should login successfully with correct credentials', async () => {
    // First, create a user
    await request(app).post('/users/signup').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      password_confirm: 'password123',
    });

    // Then, try logging in
    const res = await request(app)
      .post('/users/login')
      .send({
        username: 'testuser',
        password: 'password123',
      })
      .redirects(0); // 👈 this tells Supertest to NOT follow the 302 redirect

    expect(res.statusCode).toBe(302); // redirect on successful login
    expect(res.headers.location).toBe('/explore'); // assuming login redirects there
  });

  test('POST /users/signup › should return 400 if email already exists', async () => {
    // First signup
    await request(app).post('/users/signup').send({
      username: 'anotherUser',
      email: 'test@example.com',
      password: 'validPass123',
      password_confirm: 'validPass123', // ✅ match what backend expects
    });

    // Second signup with same email
    const response = await request(app).post('/users/signup').send({
      username: 'anotherUser',
      email: 'test@example.com',
      password: 'validPass123',
      password_confirm: 'validPass123', // ✅ match what backend expects
    });

    console.log('STATUS:', response.statusCode);
    console.log('BODY:', response.body);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error.toLowerCase()).toMatch(/email.*already/i);
  });

  test('POST /users/signup › should redirect on successful signup', async () => {
    const response = await request(app).post('/users/signup').send({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'strongPass123',
      password_confirm: 'strongPass123',
    });

    console.log('STATUS:', response.statusCode);
    console.log('BODY:', response.body);
    console.log('HEADERS:', response.headers);

    expect(response.statusCode).toBe(302); // ✅ because of res.redirect()
    expect(response.headers.location).toBe('/users/login'); // ✅ redirected location
  });

  test('POST /users/signup › should return 400 and show error if passwords do not match', async () => {
    const response = await request(app).post('/users/signup').send({
      username: 'mismatchUser',
      email: 'mismatch@example.com',
      password: 'password123',
      password_confirm: 'differentPassword',
    });

    console.log('STATUS:', response.statusCode);
    console.log('BODY:', response.text); // HTML string

    expect(response.statusCode).toBe(400);
    expect(response.text).toContain('Passwords do not match'); // ✅ Look for message in rendered page
  });
});
