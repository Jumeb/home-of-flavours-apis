const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const cartModel = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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
    }

}, {timestamps: true});

module.exports = mongoose.model('Cart', cartModel);

cartModel.methods.addToCart = function (pastry) {
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

cartModel.methods.subFromCart = function (pastry) {
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

cartModel.methods.removeFromCart = function(pastryId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.pastryId.toString() !== pastryId.toString();
    });

    this.cart.items = updatedCartItems;
    return this.save();
}

cartModel.methods.clearCart = function(notOrdered) {
    this.cart.items = notOrdered
    return this.save();
}