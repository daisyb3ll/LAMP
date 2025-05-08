require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const ejs = require('ejs');
const path = require('path');


const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express(); // Initialize Express

// ✅ Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'LAMP API',
      version: '1.0.0',
      description: 'API for the LAMP project',
    },
  },
  apis: ['./routes/*.js'], // Adjust if your routes are in a different folder
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs)); // <--- Exposes Swagger UI

// View engine and static files
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Global timeout (10 seconds max)
app.use((req, res, next) => {
  res.setTimeout(10000, () => {
    console.log('Request timed out.');
    res.status(504).send('Server Timeout');
  });
  next();
});

// Connect to MongoDB
const dbURL = process.env.MONGO_URI || 'mongodb://localhost:27017/defaultDB';
console.log('🔌 Trying to connect to MongoDB:', dbURL);

mongoose
  .connect(dbURL)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Could not connect to MongoDB:', err.message);
    process.exit(1);
  });

// Load user routes
const userRoutes = require('./routes/users');
app.use('/users', userRoutes);

// Home route redirect
app.get('/', (req, res) => {
  res.redirect('/users/login');
});

// 🔥 Spotify token function
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

// // ✅ Check if 'routes/users.js' exists before importing
// try {
//   const userRoutes = require('./routes/users');
//   app.use('/users', userRoutes);
// } catch (error) {
//   console.error(
//     "⚠️ WARNING: 'routes/users.js' not found. Create the file to avoid errors."
//   );
// }

// ✅ Homepage Route
app.get('/', (req, res) => {
  res.redirect('/users/login');
});

app.get('/home', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    if (!token) return res.status(500).send('Failed to get Spotify token');

    // Album of the Day
    const newReleaseResponse = await axios.get(
      'https://api.spotify.com/v1/browse/new-releases?limit=50',
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      }
    );
    const albumsOfTheDay = newReleaseResponse.data.albums.items;
    const dayIndex = new Date().getDate() % albumsOfTheDay.length;
    const albumOfTheDay = albumsOfTheDay[dayIndex];

    // Random Album
    const randomLetters = 'abcdefghijklmnopqrstuvwxyz';
    const randomChar =
      randomLetters[Math.floor(Math.random() * randomLetters.length)];
    const randomResponse = await axios.get(
      `https://api.spotify.com/v1/search?q=${randomChar}&type=album&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      }
    );
    const randomAlbums = randomResponse.data.albums.items;
    const randomAlbum =
      randomAlbums[Math.floor(Math.random() * randomAlbums.length)];

    res.render('home', { album: albumOfTheDay, randomAlbum: randomAlbum });
  } catch (error) {
    console.error(
      '❌ Error fetching albums:',
      error.response?.data || error.message
    );
    res.status(500).send('Error fetching albums');
  }
});

// ✅ Album Details Route
app.get('/album/:id', async (req, res) => {
  const albumId = req.params.id;
  const token = await getSpotifyToken();
  if (!token) return res.status(500).send('Failed to get Spotify token');

  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/albums/${albumId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      }
    );

    const album = response.data;
    res.render('album', { album });
  } catch (error) {
    console.error(
      '❌ Error fetching album details:',
      error.response?.data || error.message
    );
    res.status(500).send('Album not found');
  }
});

// Explore Page Route
let currentOffset = 0;

app.get('/explore', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    const offset = parseInt(req.query.offset) || 0;

    const newReleasesRes = await axios.get(
      `https://api.spotify.com/v1/browse/new-releases?limit=50&offset=0`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const albums = newReleasesRes.data.albums.items;

    const albumOfTheDay = albums[0];
    const randomAlbum = albums[Math.floor(Math.random() * albums.length)];

    // Handle infinite scroll fetch
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json(albums.slice(offset, offset + 20));
    }

    res.render('explore', { albums: albums.slice(0, 20), albumOfTheDay, randomAlbum });
  } catch (error) {
    console.error('❌ Error loading explore albums:', error.message);
    res.status(500).send('Error loading explore page');
  }
});


app.get('/enter', (req, res) => {
  // Hardcoded dummy album
  const album = {
    id: "test-album-1",
    name: "Fake Album of the Day",
    images: [{ url: "/images/default-album.png" }],
    artists: [{ name: "Fake Artist" }],
    release_date: "2024-01-01",
    tracks: { items: [{ name: "Song A" }, { name: "Song B" }] }
  };

  const randomAlbum = {
    id: "test-album-2",
    name: "Random Fake Album",
    images: [{ url: "/images/default-album.png" }],
    artists: [{ name: "Random Artist" }],
    release_date: "2023-11-15",
    tracks: { items: [{ name: "Random Song" }] }
  };

  const albums = Array.from({ length: 12 }).map((_, i) => ({
    id: `dummy-${i}`,
    name: `Album ${i + 1}`,
    images: [{ url: "/images/default-album.png" }]
  }));

  res.render('enter', {
    album,
    randomAlbum,
    albums
  });
});
