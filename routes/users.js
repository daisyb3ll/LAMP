const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Show signup form
router.get('/signup', (req, res) => {
  res.render('signup');
});

// Handle signup
router.post('/signup', async (req, res) => {
  const { username, password, password_confirm, email } = req.body;

  if (password !== password_confirm) {
    return res.status(400).send('❌ Passwords do not match.');
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).send('❌ Username already exists.');
    }

    const newUser = new User({ username, password, email });
    await newUser.save();

    // 🔁 Redirect to login after successful signup
    res.redirect('/users/login');
  } catch (err) {
    console.error('❌ Error during signup:', err);
    res.status(500).send('Error creating user');
  }
});

// Show login form
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Handle login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('login', { error: 'Incorrect username or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('login', { error: 'Incorrect username or password.' });
    }

    res.redirect('/home');
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).send('Login failed');
  }
});

module.exports = router;
