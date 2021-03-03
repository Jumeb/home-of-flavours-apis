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
        default: 123456,
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
    dislikes: {
        users: [{
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            number: {
                type: Number,
                default: 0
            },
        }]
    },
    likes: {
         users: [{
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            number: {
                type: Number,
                default: 0,
            },
        }]
    },
    total: {
        type: Number,
        required: false,
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