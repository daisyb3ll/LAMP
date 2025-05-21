// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const axios = require('axios');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
  res.setTimeout(10000, () => res.status(504).send('Server Timeout'));
  next();
});

// Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'LAMP API',
      version: '1.0.0',
      description: 'API for the LAMP project',
    },
  },
  apis: ['./routes/*.js'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Setup function (connects to DB + session + routes)
async function setupApp() {
  const dbURL =
    process.env.NODE_ENV === 'test'
      ? process.env.MONGO_URI_TEST
      : process.env.MONGO_URI;

  await mongoose.connect(dbURL);
  console.log('✅ Connected to DB:', mongoose.connection.name);

  const client = mongoose.connection.getClient();

  console.log('✅ NODE_ENV:', process.env.NODE_ENV);
  console.log('✅ Connected to DB:', mongoose.connection.name);

  app.use(
    session({
      secret: 'super-secret-key',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ client }),
      cookie: { maxAge: 1000 * 60 * 60 * 24 },
    })
  );

  // Routes
  const authRoutes = require('./routes/auth');
  const userRoutes = require('./routes/users');
  app.use('/users', authRoutes);
  app.use('/users', userRoutes);

  app.get('/', (req, res) => {
    req.session.user ? res.redirect('/explore') : res.redirect('/users/login');
  });

  app.get('/about', (req, res) => res.render('about'));

  app.get('/enter', (req, res) => {
    const album = {
      id: 'test-album-1',
      name: 'Fake Album of the Day',
      images: [{ url: '/images/default-album.png' }],
      artists: [{ name: 'Fake Artist' }],
      release_date: '2024-01-01',
      tracks: { items: [{ name: 'Song A' }, { name: 'Song B' }] },
    };

    const randomAlbum = {
      id: 'test-album-2',
      name: 'Random Fake Album',
      images: [{ url: '/images/default-album.png' }],
      artists: [{ name: 'Random Artist' }],
      release_date: '2023-11-15',
      tracks: { items: [{ name: 'Random Song' }] },
    };

    const albums = Array.from({ length: 12 }).map((_, i) => ({
      id: `dummy-${i}`,
      name: `Album ${i + 1}`,
      images: [{ url: '/images/default-album.png' }],
    }));

    res.render('enter', { album, randomAlbum, albums });
  });

  app.get('/save-top-tracks', async (req, res) => {
    try {
      const token = await getSpotifyToken();
      if (!token)
        return res.status(500).json({ error: 'Failed to get Spotify token' });

      const response = await axios.get(
        'https://api.spotify.com/v1/browse/new-releases',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const trackData = response.data.albums.items.map((track) => ({
        name: track.name,
        artist: track.artists[0].name,
        album: track.name,
        spotifyId: track.id,
      }));

      await Track.insertMany(trackData);
      res.json({ message: '✅ Top tracks saved to MongoDB!', data: trackData });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/home', async (req, res) => {
    try {
      const token = await getSpotifyToken();
      if (!token) return res.status(500).send('Failed to get Spotify token');

      const newReleaseResponse = await axios.get(
        'https://api.spotify.com/v1/browse/new-releases?limit=50',
        { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
      );
      const albums = newReleaseResponse.data.albums.items;
      const albumOfTheDay = albums[new Date().getDate() % albums.length];

      const randomChar = 'abcdefghijklmnopqrstuvwxyz'[
        Math.floor(Math.random() * 26)
      ];
      const randomResponse = await axios.get(
        `https://api.spotify.com/v1/search?q=${randomChar}&type=album&limit=50`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
      );
      const randomAlbums = randomResponse.data.albums.items;
      const randomAlbum =
        randomAlbums[Math.floor(Math.random() * randomAlbums.length)];

      res.render('explore', {
        albums,
        albumOfTheDay,
        randomAlbum,
      });
    } catch (error) {
      console.error(
        '❌ Error fetching albums:',
        error.response?.data || error.message
      );
      res.status(500).send('Error fetching albums');
    }
  });

  app.get('/explore', async (req, res) => {
    try {
      const token = await getSpotifyToken();
      const offset = parseInt(req.query.offset) || 0;
      const query = req.query.q || 'a';

      const response = await axios.get(
        `https://api.spotify.com/v1/search?q=${query}&type=album&limit=20&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const albums = response.data.albums.items;

      if (req.xhr || req.headers.accept.includes('json')) {
        return res.json(albums);
      }

      res.render('explore', {
        albums,
        albumOfTheDay: albums[0],
        randomAlbum: albums[Math.floor(Math.random() * albums.length)],
      });
    } catch (error) {
      console.error('❌ Error loading albums:', error.message);
      res.status(500).send('Error loading explore page');
    }
  });

  app.get('/album/:id', async (req, res) => {
    const token = await getSpotifyToken();
    if (!token) return res.status(500).send('Failed to get Spotify token');

    try {
      const response = await axios.get(
        `https://api.spotify.com/v1/albums/${req.params.id}`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 }
      );
      res.render('album', { album: response.data });
    } catch (error) {
      console.error(
        '❌ Error fetching album details:',
        error.response?.data || error.message
      );
      res.status(500).send('Album not found');
    }
  });

  // Admin database viewer
  app.get('/admin', async (req, res) => {
    try {
      const User = mongoose.model('User'); // Reuse the already-defined model if available
      const users = await User.find();

      res.send(`
        <h1>User Collection</h1>
        <table border="1" cellpadding="10" cellspacing="0">
          <tr><th>Username</th><th>Email</th></tr>
          ${users
            .map((u) => `<tr><td>${u.username}</td><td>${u.email}</td></tr>`)
            .join('')}
        </table>
      `);
    } catch (err) {
      res.status(500).send('Error displaying users: ' + err.message);
    }
  });

  const { faker } = require('@faker-js/faker');

  app.get('/seed-users', async (req, res) => {
    try {
      const User = mongoose.model('User');

      const fakeUsers = Array.from({ length: 10 }).map(() => ({
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password(10), // Add this line
      }));

      await User.insertMany(fakeUsers);
      res.send('✅ 10 random users added to database');
    } catch (err) {
      res.status(500).send('❌ Error seeding users: ' + err.message);
    }
  });
}

// Token utility
async function getSpotifyToken() {
  try {
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
        timeout: 5000,
      }
    );
    console.log(
      '🔑 Got Spotify Token:',
      response.data.access_token.slice(0, 10)
    );
    return response.data.access_token;
  } catch (error) {
    console.error(
      '❌ Error fetching Spotify token:',
      error.response?.data || error.message
    );
    return null;
  }
}

module.exports = { app, setupApp };
