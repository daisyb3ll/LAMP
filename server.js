require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios'); // Added for Spotify API calls
const ejs = require('ejs');
const path = require('path');

const app = express(); // Initialize Express first

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public'))); // Ensure correct static path

// ✅ Use environment variable for DB connection
const dbURL = process.env.MONGO_URI || 'mongodb://localhost:27017/defaultDB';

mongoose
    .connect(dbURL)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(3000, () => {
            console.log('🚀 Server started on port 3000');
        });
    })
    .catch((err) => {
        console.error('❌ Could not connect to MongoDB:', err);
    });


// ✅ Define Schema & Model for storing Spotify data
const trackSchema = new mongoose.Schema({
    name: String,
    artist: String,
    album: String,
    popularity: Number,
    spotifyId: String
});
const Track = mongoose.model('Track', trackSchema);


// ✅ Fetch Spotify Token
async function getSpotifyToken() {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token',
            new URLSearchParams({ grant_type: 'client_credentials' }), {
            headers: {
                Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log("🔑 Spotify Token:", response.data.access_token); // Log token
        return response.data.access_token;
    } catch (error) {
        console.error("❌ Error fetching Spotify token:", error.response ? error.response.data : error.message);
        return null;
    }
}


app.get('/save-top-tracks', async (req, res) => {
    try {
        const token = await getSpotifyToken();
        if (!token) return res.status(500).json({ error: "Failed to get Spotify token" });

        const response = await axios.get('https://api.spotify.com/v1/browse/new-releases', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const trackData = response.data.albums.items.map(track => ({
            name: track.name,
            artist: track.artists[0].name,
            album: track.name,
            spotifyId: track.id
        }));

        await Track.insertMany(trackData);
        res.json({ message: '✅ Top tracks saved to MongoDB!', data: trackData });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ✅ Check if 'routes/users.js' exists before importing
try {
    const userRoutes = require('./routes/users');
    app.use('/users', userRoutes);
} catch (error) {
    console.error("⚠️ WARNING: 'routes/users.js' not found. Create the file to avoid errors.");
}

// ✅ Homepage Route
app.get('/', (req, res) => {
    res.render('index', { message: 'Welcome to the Spotify API App!' });
});

