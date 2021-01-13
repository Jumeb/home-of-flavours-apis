const {validationResult} = require('express-validator')

const Order = require('../model/order');
const { validationError, errorCode } = require('../utils/utilities');


exports.createOrder = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const userId = req.userId;

    const bakerId = req.body.bakerId;
    const cartId = req.params.cartId;

    const order = new Order({
        userId: userId,
        cartId: cartId,
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