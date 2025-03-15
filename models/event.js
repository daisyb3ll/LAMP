const mongoose = require('mongoose');

// Schema
const EventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        organizer: {
            type: String,
            required: true,
        },
        price: {
            type: String,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const Event = mongoose.model('event', EventSchema);

module.exports = Event;