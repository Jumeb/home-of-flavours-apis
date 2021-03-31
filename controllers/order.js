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
};

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
};

exports.getSuperOrders = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    Order.find()
        .populate({
            path: "pastries.pastryId",
        })
        .populate({
            path: 'bakerId',
            select: 'companyName'
        })
        .populate({
            path: 'userId',
            select: 'name suspend image'
        })
        .then(orders => {
            if (!orders) {
                const error = new Error('Could not find any orders');
                error.statusCode = 422;
                throw error;
            }
            res.status(200)
                .json({
                    message: 'Fetched orders successfully',
                    orders
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
};

exports.getOrder = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const orderId = req.params.orderId;

    Order.findById(orderId)
        .then(order => {
            if (!order) {
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
};

exports.getMyOrders = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const userId = req.params.userId;
    let _orders, obj = {};

    Order.find({ userId })
        .populate({
            path: "pastries.pastryId",
        })
        .populate({
            path: 'bakerId',
            select: 'companyName name suspend verify momoNumber coupons'
        })
        .then(orders => {
            if (!orders) {
                authenticationError(req, 'Orders not found', 401);
            }
            _orders = orders;
            const data = (orders) => {
                orders.map((i) => {
                    let _baker = i.bakerId.companyName.toString();
                    if (obj[_baker] === undefined) {
                        obj[_baker] = [i];
                    } else {
                        obj[_baker].push(i);
                    }
                });
                return obj;
            };
            let bakerOrders = data(_orders);
            res.status(200).json({ message: 'All you orders', orders: bakerOrders })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
};

exports.getBakerOrders = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const bakerId = req.params.bakerId;

    Order.find({ bakerId })
        .populate({
            path: "pastries.pastryId",
        })
        .populate({
            path: 'userId',
            select: 'name suspend image'
        })
        .then(orders => {
            if (!orders) {
                authenticationError(req, 'Orders not found', 401);
            }
            res.status(200).json({ message: 'All you orders', orders })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
};

exports.incStatus = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const orderId = req.params.orderId;

    let status = 'On the Way';

    Order.findById(orderId)
        .then(order => {
            if (!order) {
                authenticationError(req, 'Order was not found', 401);
            }
            if (order.status === 'New') {
                status = 'Registered';
            }
            if (order.status === 'Registered') {
                status = 'Processing';
            }
            if (order.status === 'Processing') {
                status = 'On the Way';
            }

            order.status = status;

            return order.save();
        })
        .then(order => {
            res.status(200).json({ message: 'Success', order })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })

};

exports.deliveredStatus = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const orderId = req.params.orderId;

    let status = '';

    Order.findById(orderId)
        .then(order => {
            if (!order) {
                authenticationError(req, 'Order not found', 401);
            }
            status = order.status;
            if (status === 'On the Way') {
                status = 'Delivered';
            }
            order.status = status;
            return order.save();
        })
        .then(order => {
            res.status(200).json({ message: 'Success', order });
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
};