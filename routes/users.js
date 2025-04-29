const express = require('express');
const User = require('../models/User');
const router = express.Router();

// TEMPORARY user for testing4
const tempUser = {
    username: 'flappy',
    password: 'bird' // plaintext for demo ONLY
};

// Show login form
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Handle login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username !== tempUser.username || password !== tempUser.password) {
        return res.render('login', { error: 'Incorrect username or password.' });
    }

    res.redirect('/home');
});


// Show signup form
router.get('/signup', (req, res) => {
    res.render('signup');
});

// Handle signup
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const newUser = new User({ username, password });
    await newUser.save();
    res.redirect('/home');
});

module.exports = router;
