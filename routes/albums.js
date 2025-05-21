const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// POST /album/:id/rate
router.post('/album/:id/rate', async (req, res) => {
    try {
        const { rating, review } = req.body;
        const albumId = req.params.id;

        const newReview = new Review({
            albumId,
            rating,
            review,
            // userId: req.user._id (if you have auth)
        });

        await newReview.save();
        res.status(200).json({ message: 'Review saved!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save review' });
    }
});

module.exports = router;
