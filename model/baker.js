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
    type: {
        type: String,
        default: 'Baker',
    },
    email: {
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
    momoName: {
        type: String,
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
    about: {
        type: String
    },
    location: {
        type: String,
    },
    suspend: {
        type: Boolean,
        default: false
    },
    verify: {
        type: Boolean,
        default: false,
    },
    likes: {
         users: [{
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            }
        }]
    },
    dislikes: {
         users: [{
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            }
        }]
    },
    followers: {
         users: [{
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            }
        }]
    },
    total: {
        type: Number,
        default: 0,
    },
    coupons: {
        coupon: [{
            code: {
                type: String,
                required: true,
            },
            percentage: {
                type: Number,
                required: true,
            }
        }]
    },
    orders: {
        ordered: [{
            orderId: {
                type: Schema.Types.ObjectId,
                ref: 'Order',
                required: true,
            }
        }]
    },
    upFront: {
        type: Number,
        default: 0,   
    },
    password: {
        type: String,
        required: true,
    }
}, {timestamps: true});

bakerModel.methods.like = function (userId) {
    const userIndex = this.likes.users.findIndex(ui => {
        return ui.userId.toString() === userId.toString();
    });
    const _userIndex = this.dislikes.users.findIndex(ui => {
        return ui.userId.toString() === userId.toString();
    })

    const likeData = [...this.likes.users];
    const dislikeData = [...this.dislikes.users];

    if (userIndex >= 0) {
        likeData.splice(userIndex, 1);
    }

    if (_userIndex >= 0) {
        dislikeData.splice(userIndex, 1);
    }

    if (userIndex < 0) {
        likeData.push({
            userId: userId,
        })
    }

    const updatedLikes = {
        users: likeData
    }

    const updatedDislikes = {
        users: dislikeData
    }

    this.likes = updatedLikes;
    this.dislikes = updatedDislikes;

    return this.save();
}

bakerModel.methods.dislike = function (userId) {
    const userIndex = this.likes.users.findIndex(ui => {
        return ui.userId.toString() === userId.toString();
    });
    const _userIndex = this.dislikes.users.findIndex(ui => {
        return ui.userId.toString() === userId.toString();
    })

    const likeData = [...this.likes.users];
    const dislikeData = [...this.dislikes.users];

    if (userIndex >= 0) {
        likeData.splice(userIndex, 1);
    }

    if (_userIndex >= 0) {
        dislikeData.splice(userIndex, 1);
    }

    if (_userIndex < 0) {
        dislikeData.push({
            userId: userId,
        })
    }

    const updatedLikes = {
        users: likeData
    }

    const updatedDislikes = {
        users: dislikeData
    }

    this.likes = updatedLikes;
    this.dislikes = updatedDislikes;

    return this.save();
}

bakerModel.methods.follow = function (userId) {
    const followerIndex = this.followers.users.findIndex(ui => {
        return ui.userId.toString() === userId.toString();
    })

    const followers = [...this.followers.users];

    if (followerIndex >= 0) {
        followers.splice(followerIndex, 1);
    }
    if (followerIndex < 0) {
        followers.push({ userId });
    }

    const updatedFollowers = {
        users: followers,
    }

    this.followers = updatedFollowers;

    return this.save();
}

bakerModel.methods.ordered = function (orderId) {
    const ordered = [...this.orders.ordered];
    ordered.push({
        orderId
    })

    const updatedOrders = {
        ordered
    }
    this.orders = updatedOrders;
    return this.save();
}

bakerModel.methods.setTotal = function (total) {
    this.total += Number(total);
    return this.save();
}

module.exports = mongoose.model('Baker', bakerModel);