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
    orders: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        default: 0
    },
    password: {
        type: String,
        required: true,
    }
}, {timestamps: true});

bakerModel.methods.like = (userId) => {
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

bakerModel.methods.dislike = (userId) => {
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

module.exports = mongoose.model('Baker', bakerModel);