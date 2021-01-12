const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const pastryModel = new Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    likes: {
        type: Number,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    description: {
        type: String,
        required: true,
    },
    recipe: {
        type: String,
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'Baker',
        required: true,
    }

}, {timestamps: true});

module.exports = mongoose.model('Pastry', pastryModel);