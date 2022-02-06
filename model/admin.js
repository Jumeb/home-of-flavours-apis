const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const adminModel = new Schema({
    name: {
        type: String,
        required: true,
    },
    companyName: {
        type: String,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        default: 'Delivery Agent',
    },
    telNumber: {
        type: String,
    },
    about: {
        type: String,
    },
    momoName: {
        type: String,
    },
    momoNumber: {
        type: Number,
    },
    verify: {
        type: Boolean,
        default: true,
    },
    suspend: {
        type: Boolean,
        default: false,
    },
    image: {
        type: [String],
    }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminModel);