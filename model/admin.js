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
    },
    orders: {
        type: Number,
        default: 0,
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
                required: true
            },
        }]
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
                required: true
            },
        }]   
    }
})

module.exports = mongoose.model('Admin', adminModel);