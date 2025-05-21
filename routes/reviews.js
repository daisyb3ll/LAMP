// routes/reviews.js
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

router.post('/album/:id/rate', async (req, res) => {
    try {
        const { rating, review } = req.body;
        const albumId = req.params.id;

        const newReview = new Review({
            albumId,
            rating,
            review,
            userId: req.session.user._id // assumes user is logged in
        });

        await newReview.save();
        res.status(200).json({ message: 'Review saved!' });
    } catch (err) {
        console.error('❌ Error saving review:', err.message);
        res.status(500).json({ error: 'Failed to save review' });
    }
});

module.exports = router;
