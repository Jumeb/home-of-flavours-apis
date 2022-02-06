const express = require('express');
const {body} = require('express-validator');

const router = express.Router();

const orderController = require('../controllers/order');
const isAuth = require('../middleware/isAuth');

router.get('/user/getorders/:userId', orderController.getMyOrders);

router.get('/baker/getorders/:bakerId', orderController.getBakerOrders);

router.get('/baker/getallorders', isAuth, orderController.getSuperOrders);

router.post('/create/order/:userId', orderController.createOrder);

router.post('/create/basket/:eventId', isAuth, orderController.createBasket);

router.put('/order/status/:orderId', orderController.incStatus);

router.put('/order/delivered/:orderId', orderController.deliveredStatus);

router.put('/order/cancel/:orderId', orderController.cancelStatus);


module.exports = router;