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
    orders: {
        ordered: [{
            orderId: {
                type: Schema.Types.ObjectId,
                ref: 'Order',
                required: true,
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
    likes: {
         users: [{
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
        }]
    },
    suspend: {
        type: Boolean,
        default: false,
    },
    location: {
        type: String,
    },
    cart: {
        pastries: [{
            pastryId: {
                type: Schema.Types.ObjectId,
                ref: 'Pastry',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            message: {
                type: String,
            }
        }]
    },
    events: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Events',
        }
    ]
})

userModel.methods.like = function (userId) {
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

userModel.methods.dislike = function (userId) {
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

userModel.methods.message = function (pastryId, message) {
    const cartProductIndex = this.cart.pastries.findIndex(cp => {
        return cp.pastryId.toString() === pastryId.toString(); 
    });

    const updatedCartItems = [...this.cart.pastries];

    if (cartProductIndex >= 0) {
        updatedCartItems[cartProductIndex].message = message;
    }

    const updatedCart = { 
        pastries: updatedCartItems
    };
    this.cart = updatedCart; 
    return this.save();
}

userModel.methods.addToCart = function (pastryId) {
    const cartProductIndex = this.cart.pastries.findIndex(cp => {
        return cp.pastryId.toString() === pastryId.toString(); 
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.pastries];

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.pastries[cartProductIndex].quantity + 1; 
        updatedCartItems[cartProductIndex].quantity = newQuantity; 
    } else { 
        updatedCartItems.push({
            pastryId,
            quantity: newQuantity
        })
    }
    const updatedCart = { 
        pastries: updatedCartItems
    };
    this.cart = updatedCart; 
    return this.save();
}

userModel.methods.subFromCart = function (pastryId) {
    const cartProductIndex = this.cart.pastries.findIndex(cp => {
        return cp.pastryId.toString() === pastryId.toString();
    });
    const updatedCartItems = [...this.cart.pastries];
    let quantity;

    if (cartProductIndex >= 0) {
        if (updatedCartItems[cartProductIndex].quantity > 0) {
            quantity = this.cart.pastries[cartProductIndex].quantity - 1;
            updatedCartItems[cartProductIndex].quantity = quantity;
        } 
        if (updatedCartItems[cartProductIndex].quantity === 0) {
            updatedCartItems.splice(cartProductIndex, 1);
        }
    }
    const updatedCart = {
        pastries: updatedCartItems
    };
    this.cart = updatedCart;
    return this.save();
}

userModel.methods.removeFromCart = function (pastryId) {
    const updatedCartItems = this.cart.pastries.filter(item => {
        return item.pastryId.toString() !== pastryId.toString();
    });

    this.cart.pastries = updatedCartItems;
    return this.save();
}

userModel.methods.clearCart = function (notOrdered, orderId) {
    this.cart.pastries = notOrdered
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

module.exports = mongoose.model('User', userModel);