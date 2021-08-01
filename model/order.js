const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderModel = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true,
    },
    location: {
        type: String,
        //location name,
        // require: true,
    },
    coords: {
        type: [Number],
        //location coordinates (lat/long)
    },
    date: {
        type: Date,
        //date or delivery
        // required: true,
    },
    pastries: [{
        pastryId: {
            type: Schema.Types.ObjectId,
            ref: 'Pastry',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        message: {
            type: String,
        }
    }],
    eventId: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
    },
    bakerId: {
        type: Schema.Types.ObjectId,
        ref: 'Baker',
        required: true,
    },
    status: {
        type: String,
        default: 'New',
    }
}, {timestamps: true});

module.exports = mongoose.model('Order', orderModel);