const {validationResult} = require('express-validator')

const Order = require('../model/order');
const User = require('../model/user');
const Baker = require('../model/baker');
const { validationError, errorCode, authenticationError } = require('../utils/utilities');


exports.createOrder = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const userId = req.params.userId;

    const bakerId = req.query.baker;

    let notOrdered;
    let pastries;
    
    User.findById(userId)
        .populate({
            path: 'cart.pastries.pastryId',
        })
        .then(user => {
            const _pastries = user.cart.pastries;
            pastries = _pastries.filter(pastry => pastry.pastryId.creator.toString() === bakerId.toString());
            notOrdered = _pastries.filter(pastry => pastry.pastryId.creator.toString() !== bakerId.toString());
            const order = new Order({
                userId,
                bakerId,
                pastries,
            });

            return Promise.all([order.save(), notOrdered, user]);
        })
        .then(result => {
            const order = result[0];
            const leftOrder = result[1];
            const user = result[2];
            user.clearCart(leftOrder, order._id);
            res.status(200).json({ message: 'Successfully placed order', order });
            //  const bk = async () => 
            Baker.findById(bakerId)
                .then(baker => {
                    if (!baker) {
                        authenticationError(req, 'Baker not found', 401);
                    }
                    baker.ordered(order._id)
                })
                .catch(err => {
                    errorCode(err, 500, next);
            })
        })
        .catch(err => {
            errorCode(err, 500, next);
    })
}

exports.createBasket = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const userId = req.userId;

    const bakerId = req.body.bakerId;
    const eventId = req.params.eventId;

    const order = new Order({
        userId: userId,
        eventId: eventId,
        bakerId: bakerId,
    })

    order.save()
        .then(order => {
            res.status(200)
                .json({
                    message: 'Order successful',
                    order: order,
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })   
}

exports.getOrders = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    Order.find()
        .then(orders => {
            if(!orders) {
                const error = new Error('Could not find any orders');
                error.statusCode = 422;
                throw error;
            }
            res.status(200)
                .json({
                    message: 'Fetched orders successfully',
                    orders: orders,
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.getOrder = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const orderId = req.params.orderId;

    Order.findById(orderId)
        .then(order => {
            if(!order) {
                const error = new Error('Order not found');
                error.statusCode = 422;
                throw error;
            }
            res.status(200)
                .json({
                    message: 'Order found',
                    order: order,
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}