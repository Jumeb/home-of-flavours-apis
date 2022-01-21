const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const locationModel = new Schema({
    region: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    coords: {
        type: [Number],
        required: true,
    },
    deliveryFee: {
        type: Number,
        default: 500,
    },
    creatorId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'locationOwner',
    },
    locationOwner: {
        type: String,
        required: true,
        enum: ['Baker', 'User', 'Admin']
    },
}, { timestamps: true });

module.exports = mongoose.model('Location', locationModel);