const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bakerModel = new Schema({
    name: {
        type: String,
        required: true,
    },
    companyName: {
        type: String,
        required: true,
    },
    ceoImage: {
        type: String,
    },
    companyImage: {
        type: String,
    },
    momoNumber: {
        type: Number,
    },
    telNumber: {
        type: Number,
    },
    idCardNumber: {
        type: String,
        required: true,
    },
    categories: {
        type: [String],
        required: true,
    },
    type: {
        type: String,
    },
    about: {
        type: String
    },
    suspend: {
        type: Boolean,
        default: false
    },
    verify: {
        type: Boolean,
        default: true,
    },
    likes: {
        type: Number,
        default: 0,
    },
    orders: {
        type: Number,
        default: 0,
    }

}, {timestamps: true});

module.exports = mongoose.model('Baker', bakerModel);