const getSpotifyToken = require('../utils/spotify');
const axios = require('axios');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

//album background function
async function getAlbumBackground() {
  const token = await getSpotifyToken();
  const response = await axios.get(
    'https://api.spotify.com/v1/browse/new-releases?limit=30',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data.albums.items.map((album) => ({
    name: album.name,
    images: album.images,
  }));
}

// =================== SIGNUP ===================

router.get('/signup', async (req, res) => {
  const albums = await getAlbumBackground();
  res.render('signup', { albums, error: null });
});

router.post('/signup', async (req, res) => {
  const { username, email, password, password_confirm } = req.body;
  const albums = await getAlbumBackground();

  // ✅ Check if passwords match
  if (password !== password_confirm) {
    return res.render('signup', {
      albums,
      error: '❌ Passwords do not match',
    });
  }

  // ✅ Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    return res.render('signup', {
      albums,
      error: '⚠️ Username or email already exists',
    });
  }

  try {
    const newUser = new User({ username, email, password });
    await newUser.save();
    req.session.user = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    };
    res.redirect('/explore');
  } catch (err) {
    console.error('❌ Error creating user:', err.message);
    res.render('signup', {
      albums,
      error: '❌ Something went wrong during signup',
    });
  }
});

// =================== LOGIN ===================

router.get('/login', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    const response = await axios.get(
      'https://api.spotify.com/v1/browse/new-releases?limit=20',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const albums = response.data.albums.items;
    res.render('login', { albums, error: null });
  } catch (error) {
    console.error('❌ Error fetching albums for login:', error.message);
    res.render('login', { albums: [], error: null });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    const albums = await getAlbumBackground();
    return res.render('login', { albums, error: '⚠️ Username not found' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const albums = await getAlbumBackground();
    return res.render('login', { albums, error: '❌ Incorrect password' });
  }

  req.session.user = {
    _id: user._id,
    username: user.username,
    email: user.email,
  };
  res.redirect('/explore');
});

// =================== LOGOUT ===================

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/users/login');
  });
});

module.exports = router;
