// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    albumId: String,
    userId: String, // Optional if you have auth
    rating: Number,
    review: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
