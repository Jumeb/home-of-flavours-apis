const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderModel = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true,
    },
    cartId: {
        type: Schema.Types.ObjectId,
        ref: 'Cart',
    },
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
});

module.exports = mongoose.model('Order', orderModel);