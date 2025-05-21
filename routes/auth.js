console.log('✅ NODE_ENV:', process.env.NODE_ENV);
const getSpotifyToken = require('../utils/spotify');
const axios = require('axios');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

//album background function
//album background function
async function getAlbumBackground() {
  if (process.env.NODE_ENV === 'test') {
    console.log('✅ Using test album data');
    return [
      {
        name: 'Test Album',
        images: [{ url: '/images/default-album.png' }],
      },
    ];
  }

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

// SIGNUP

/**
 * @swagger
 * /users/signup:
 *   get:
 *     summary: Show signup form
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Render signup page
 */

router.get('/signup', async (req, res) => {
  const albums = await getAlbumBackground();
  res.render('signup', { albums, error: null });
});

/**
 * @swagger
 * /users/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [username, password, password_confirm, email]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               password_confirm:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirects to login on success
 *       400:
 *         description: Validation errors
 */

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, password_confirm } = req.body;
    console.log('🧪 Received body:', req.body);

    if (
      !username?.trim() ||
      !email?.trim() ||
      !password?.trim() ||
      !password_confirm?.trim()
    ) {
      console.log('❗ Missing fields detected');
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== password_confirm) {
      const albums = await getAlbumBackground();
      return res.status(400).render('signup', {
        albums,
        error: '❗ Passwords do not match',
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: 'Username or email already exists' });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    if (req.session) {
      req.session.user = {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      };
    }

    return res.redirect('/users/login');
  } catch (err) {
    console.error('❌ Caught error in /signup:', err.message);
    return res
      .status(500)
      .json({ error: 'Something went wrong during signup' });
  }
});

// LOGIN
/**
 * @swagger
 * /users/login:
 *   get:
 *     summary: Render the login page with Spotify album art
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Renders login page
 */
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

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirect to explore on success
 *       200:
 *         description: Rendered login page with error
 */

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

// LOGOUT
/**
 * @swagger
 * /users/logout:
 *   get:
 *     summary: Log out the current user and destroy their session
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to login page after logout
 */

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/users/login');
  });
});

module.exports = router;
