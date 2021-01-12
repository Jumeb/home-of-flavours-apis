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
    telNo: {
        type: String,
    },
    image: {
        type: String,
    }
})

module.exports = mongoose.model('Admin', adminModel);