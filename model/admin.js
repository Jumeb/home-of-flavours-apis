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
    about: {
        type: String,
        default: 'Super-Admin',
    },
    telNumber: {
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
    }
})

adminModel.methods.like = (userId) => {
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

adminModel.methods.dislike = (userId) => {
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

module.exports = mongoose.model('Admin', adminModel);