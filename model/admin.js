const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const adminModel = new Schema({
    name: {
        type: String,
        required: true,
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
        default: 'Admin',
    },
    telNumber: {
        type: String,
    },
    image: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminModel);