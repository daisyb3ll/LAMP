const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');

// ⛽ Utility to get Spotify token
async function getSpotifyToken() {
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );
  return response.data.access_token;
}

// ✅ GET: Show login form with Spotify album background
router.get('/login', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    const response = await axios.get(
      'https://api.spotify.com/v1/browse/new-releases?limit=30',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const albums = response.data.albums.items.map((album) => ({
      name: album.name,
      images: album.images,
    }));

    res.render('login', {
      albums,
      error: null,
    });
  } catch (err) {
    console.error('Error fetching albums:', err.message);
    res.render('login', {
      albums: [],
      error: 'Could not load album art.',
    });
  }
});

// ✅ POST: Handle login form
// ✅ POST: Handle login form
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      const token = await getSpotifyToken();
      const response = await axios.get(
        'https://api.spotify.com/v1/browse/new-releases?limit=30',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const albums = response.data.albums.items.map((album) => ({
        name: album.name,
        images: album.images,
      }));
      return res.render('login', {
        albums,
        error: 'Incorrect username or password.',
      });
    }

    // ✅ ✅ ✅ RIGHT HERE: Save user to session
    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
    };

    // ✅ Redirect to Explore page
    res.redirect('/explore');
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error during login');
  }
});

// In your routes/users.js or similar:
router.get('/signup', (req, res) => {
  res.render('signup'); // Assuming signup.ejs or signup.html is in your views
});

// ✅ POST: Handle signup form
router.post('/signup', async (req, res) => {
  const { username, password, password_confirm, email } = req.body;

  if (password !== password_confirm) {
    return res.status(400).send('❌ Passwords do not match.');
  }

  try {
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('❌ Username already taken.');
    }

    // Create new user
    const newUser = new User({ username, password, email });
    await newUser.save();

    // Redirect to login page after signup
    res.redirect('/users/login');
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).send('❌ Error during signup.');
  }
});

// ✅ GET: Profile page (only for logged-in users)
router.get('/profile', async (req, res) => {
  if (!req.session.user) return res.redirect('/users/login');

  try {
    const user = await User.findById(req.session.user._id);
    res.render('profile', { user });
  } catch (err) {
    console.error('Error loading profile:', err.message);
    res.status(500).send('Error loading profile');
  }
});

module.exports = router;
