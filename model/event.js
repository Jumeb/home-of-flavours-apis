const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const eventModel = new Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        
    },
    purpose: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    basket: {
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
    }
});

module.exports = mongoose.model('Event', eventModel);

eventModel.methods.addToCart = function (pastry) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.pastryId.toString() === pastry._id.toString(); 
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1; 
        updatedCartItems[cartProductIndex].quantity = newQuantity; 
    } else { 
        updatedCartItems.push({
            pastryId: pastry._id,
            quantity: newQuantity
        })
    }
    const updatedCart = { 
        items: updatedCartItems
    };
    this.cart = updatedCart; 
    return this.save();
}

eventModel.methods.subFromCart = function (pastry) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.pastryId.toString() === pastry._id.toString();
    });
    const updatedCartItems = [...this.cart.items];
    

    if (cartProductIndex >= 0) {
        if (updatedCartItems[cartProductIndex].quantity > 0) {
            quantity = this.cart.items[cartProductIndex].quantity - 1;
            updatedCartItems[cartProductIndex].quantity = quantity;
        } else if (updatedCartItems[cartProductIndex].quantity === 0) {
            updatedCartItems.splice(cartProductIndex, 1);
        }
    }
    const updatedCart = {
        items: updatedCartItems
    };
    this.cart = updatedCart;
    return this.save();
}

eventModel.methods.removeFromCart = function(pastryId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.pastryId.toString() !== pastryId.toString();
    });

    this.cart.items = updatedCartItems;
    return this.save();
}

eventModel.methods.clearCart = function(notOrdered) {
    this.cart.items = notOrdered
    return this.save();
}