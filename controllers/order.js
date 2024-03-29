const nodemailer = require('nodemailer');
require('dotenv').config();
const hbs = require('nodemailer-express-handlebars');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: "OAUTH2",
        user: process.env.GMAIL_USERNAME,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    }
});

transporter.use('compile', hbs({
    viewEngine: {
        extname: '.handlebars',
        layoutsDir: './views/',
        defaultLayout : 'index',
    },
    viewPath: './views/'
}));

const Order = require('../model/order');
const User = require('../model/user');
const Baker = require('../model/baker');
const Wallet = require('../model/wallet');
const Transaction = require('../model/transactions');
const { validationError, errorCode, authenticationError } = require('../utils/utilities');


exports.createOrder = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const userId = req.params.userId;

    const bakerId = req.query.baker;

    const { total, paymentMethod, locationId, deliveryFee } = req.body;

    let userInfo, bakerInfo;

    let notOrdered;
    let pastries;
    let userWallet;
    let bakerWallet;
    let AdminWallet;

    Wallet.find()
        .then(wallets => {
            if (!wallets) {
                authenticationError(req, 'Wallets not found', 401);
            }
            userWallet = wallets.filter(wallet => wallet.creatorId.toString() === userId.toString())[0];
            bakerWallet = wallets.filter(wallet => wallet.creatorId.toString() === bakerId.toString())[0];
            AdminWallet = wallets.filter(wallet => wallet.walletOwner.toString() === 'Admin')[0];
        })
        .catch(err => {
            errorCode(err, 500, next);
        });
    
    User.findById(userId)
        .populate({
            path: 'cart.pastries.pastryId',
        })
        .then(user => {
            const _pastries = user.cart.pastries;
            pastries = _pastries.filter(pastry => pastry.pastryId.creatorId.toString() === bakerId.toString());
            notOrdered = _pastries.filter(pastry => pastry.pastryId.creatorId.toString() !== bakerId.toString());
            const order = new Order({
                userId,
                locationId,
                bakerId,
                pastries,
                paymentMethod: paymentMethod === 'AC' ? 'Aroma Coins' : 'Cash on delivery',
            });

            userInfo = user;
            let _order2;
            let transaction;
            if (paymentMethod === 'AC') {
                if (userWallet.amount < Number(total)) {
                    return res.status(404).json({ message: 'Insufficient Aroma Coins' });
                }
                userWallet.amount = Number(userWallet.amount) - (Number(total) + Number(deliveryFee));
                bakerWallet.amount = Number(bakerWallet.amount) + Number(total);
                AdminWallet.amount = Number(AdminWallet.amount) + Number(deliveryFee);
                userWallet.save();
                bakerWallet.save();
                AdminWallet.save();
                 transaction = new Transaction({
                    amount: total,
                    reason: 'Shopping',
                    from: userId,
                    to: bakerId,
                    walletSender: 'User',
                    walletReceiver: 'Baker',
                 });
                transaction.save();
                transaction = new Transaction({
                    amount: deliveryFee,
                    reason: 'Delivery Fee',
                    from: userId,
                    to: AdminWallet.creatorId,
                    walletSender: 'User',
                    walletReceiver: 'Admin',
                });
                transaction.save();
            }
            _order2 = order.save();
            return Promise.all([_order2, notOrdered, user, transaction]);
        })
        .then(result => {
            const order = result[0];
            const leftOrder = result[1];
            const user = result[2];
            const _transaction = result[3];
            user.clearCart(leftOrder, order._id);
            res.status(200).json({ message: 'Successfully placed order', order, user, _transaction });
            Baker.findById(bakerId)
                .then(baker => {
                    if (!baker) {
                        authenticationError(req, 'Baker not found', 401);
                    }

                    baker.ordered(order._id);
                    bakerInfo = baker;
                    return baker;
                })
                .then(baker => {
                    // return Promise.all([transporter.sendMail({
                    //     from: '"Jume Brice 👻" <bnyuykonghi@gmail.com>', // sender address
                    //     to: baker.email, // list of receivers
                    //     subject: 'New Order',
                    //     text: "You have a new order",
                    //     template: "order",
                    //     context: {
                    //         name: baker.name,
                    //         userName: userInfo.name,
                    //     }
                    // }), transporter.sendMail({
                    //     from: '"Jume Brice 👻" <bnyuykonghi@gmail.com>', // sender address
                    //     to: userInfo.email, // list of receivers
                    //     subject: 'New Order',
                    //     text: "You have a new order",
                    //     template: "orderUser",
                    //     context: {
                    //         name: userInfo.name,
                    //         companyName: baker.companyName,
                    //     }
                    // })]);
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
            path: "pastries.pastryId bakerId userId locationId",
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
        })
        .populate({
            path: 'locationId',
        })
        .then(orders => {
            if (!orders) {
                authenticationError(req, 'Orders not found', 401);
            }
            res.status(200).json({ message: 'All you orders', orders: orders.sort((a,b) => {return a.status - b.status}) })
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
        })
        .populate({
            path: 'bakerId',
        })
        .populate({
            path: 'locationId',
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
                status = 'Accepted';
            }
            if (order.status === 'Accepted') {
                status = 'Processing';
            }
            if (order.status === 'Processing') {
                status = 'On the way';
            }
            if (order.status === 'Delivered') {
                status = 'Confirmed';
            }
            if (order.status === 'Confirmed') {
                return 'Done';
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
            if (status === 'On the way') {
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


exports.cancelStatus = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const orderId = req.params.orderId;

    let status = '';

    let userWallet;
    let bakerWallet;
    let AdminWallet;

    Wallet.find()
        .then(wallets => {
            if (!wallets) {
                authenticationError(req, 'Wallets not found', 401);
            }
            userWallet = wallets.filter(wallet => wallet.creatorId.toString() === userId.toString())[0];
            bakerWallet = wallets.filter(wallet => wallet.creatorId.toString() === bakerId.toString())[0];
            AdminWallet = wallets.filter(wallet => wallet.walletOwner.toString() === 'Admin')[0];
        })
        .catch(err => {
            errorCode(err, 500, next);
        });

    Order.findById(orderId)
        .populate({
            path: 'locationId'
        })
        .then(order => {
            if (!order) {
                authenticationError(req, 'Order not found', 401);
            }
            Wallet.find()
                .then(wallets => {
                    if (!wallets) {
                        authenticationError(req, 'Wallets not found', 401);
                    }
                    userWallet = wallets.filter(wallet => wallet.creatorId.toString() === order.userId.toString())[0];
                    bakerWallet = wallets.filter(wallet => wallet.creatorId.toString() === order.bakerId.toString())[0];
                    AdminWallet = wallets.filter(wallet => wallet.walletOwner.toString() === 'Admin')[0];
                })
            if (order.paymentMethod === 'Aroma Coins') {
                userWallet.amount = userWallet.amount + Number(order?.locationId?.deliveryFee);
                bakerWallet.amount = bakerWallet.amount - Number(order?.locationId?.deliveryFee);
                userWallet.save();
                bakerWallet.save();
            }
            status = 'Cancelled';
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