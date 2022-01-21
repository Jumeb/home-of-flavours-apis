const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const walletModel = new Schema({
    amount: {
        type: Number,
        default: 200,
    },
    limit: {
        type: Number,
        default: 100,
    },
    creatorId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'walletOwner',
    },
    walletOwner: {
        type: String,
        required: true,
        enum: ['Baker', 'User']
    }
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletModel);