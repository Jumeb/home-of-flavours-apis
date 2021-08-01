const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const locationModel = new Schema({
    location: {
        type: String,
        required: true,
    },
    coords: {
        type: [Number],
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Location', locationModel);