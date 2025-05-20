jest.setTimeout(60000); // Set to 60s just for first-time runs

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server-core');
const User = require('../models/User');
const bcrypt = require('bcrypt');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongo) {
    await mongo.stop();
  }
});

afterEach(async () => {
  try {
    await User.deleteMany();
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
});

describe('User model password hashing', () => {
  it('should hash the password before saving', async () => {
    const rawPassword = 'Test123!';
    const user = new User({
      username: 'sarah',
      email: 'sarah@example.com',
      password: rawPassword,
    });

    await user.save();

    expect(user.password).not.toBe(rawPassword);

    const isMatch = await bcrypt.compare(rawPassword, user.password);
    expect(isMatch).toBe(true);
  });
});
