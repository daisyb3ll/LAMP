//fake data of users

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const User = require('../models/User');

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017/your-db-name', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB connected');
    seedUsers();
  })
  .catch((err) => console.error(err));

async function seedUsers() {
  await User.deleteMany(); // Optional: clear old users
  const fakeUsers = [];

  for (let i = 0; i < 20; i++) {
    fakeUsers.push({
      name: faker.person.fullName(),
      email: faker.internet.email(),
    });
  }

  await User.insertMany(fakeUsers);
  console.log('Inserted fake users!');
  mongoose.connection.close();
}
