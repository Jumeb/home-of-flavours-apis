const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const transactionsModel = new Schema({
    amount: {
        type: Number,
        default: 0,
    },
    reason: {
        type: String,
        required: true,
    },
    account: {
        type: String,
        required: false,
    },
    from: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'walletSender',
    },
    to: {
        type: Schema.Types.ObjectId,
        required: false,
        refPath: 'walletReceiver',
    },
    walletSender: {
        type: String,
        required: true,
        enum: ['Baker', 'User', 'Admin']
    },
    walletReceiver: {
        type: String,
        required: true,
        enum: ['Baker', 'User', 'Admin']
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionsModel);
