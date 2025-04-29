require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const ejs = require('ejs');
const path = require('path');

const app = express(); // Initialize Express

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
console.log("🔌 Trying to connect to MongoDB:", dbURL);

mongoose.connect(dbURL)
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
        const response = await axios.post('https://accounts.spotify.com/api/token',
            new URLSearchParams({ grant_type: 'client_credentials' }), {
            headers: {
                Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 5000
        });
        console.log("🔑 Got Spotify Token:", response.data.access_token.slice(0, 10));
        return response.data.access_token;
    } catch (error) {
        console.error("❌ Error fetching Spotify token:", error.response?.data || error.message);
        return null;
    }
}

// 🏡 Home page after login
app.get('/home', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        if (!token) return res.status(500).send("Failed to get Spotify token");

        // Album of the Day
        const newReleaseResponse = await axios.get('https://api.spotify.com/v1/browse/new-releases?limit=50', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
        });
        const albumsOfTheDay = newReleaseResponse.data.albums.items;
        const dayIndex = new Date().getDate() % albumsOfTheDay.length;
        const albumOfTheDay = albumsOfTheDay[dayIndex];

        // Random Album
        const randomLetters = "abcdefghijklmnopqrstuvwxyz";
        const randomChar = randomLetters[Math.floor(Math.random() * randomLetters.length)];
        const randomResponse = await axios.get(`https://api.spotify.com/v1/search?q=${randomChar}&type=album&limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
        });
        const randomAlbums = randomResponse.data.albums.items;
        const randomAlbum = randomAlbums[Math.floor(Math.random() * randomAlbums.length)];

        res.render('home', { album: albumOfTheDay, randomAlbum: randomAlbum });

    } catch (error) {
        console.error("❌ Error fetching albums:", error.response?.data || error.message);
        res.status(500).send("Error fetching albums");
    }
});
