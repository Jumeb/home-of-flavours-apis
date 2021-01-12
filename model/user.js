const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userModel = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        
    },
    telNumber: {
        type: Number,
        required: true,
    },
    image: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    passwordConfirm: {
        type: String,
    },
    orders: {
        type: Number,
        default: 0,
    },
    suspend: {
        type: Boolean,
        default: false,
    },
    events: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Events',
        }
    ]
})

module.exports = mongoose.model('User', userModel);